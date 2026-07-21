/* ─────────────────────────────────────────────────────────
   Background service worker — the ONLY bridge between the
   ApplyMate web app and the extension's content scripts.

   Part 1 deliberately had no background script; Part 2
   genuinely needs one for two reasons a content script or
   popup alone can't cover:
   - `chrome.runtime.onMessageExternal` (a web page messaging
     the extension) is only reliably delivered to a persistent
     listener — the popup is usually closed.
   - Opening/tracking the application tab so the user is never
     required to open the popup for automation to start (§17).

   Storage: chrome.storage.local, keyed by authorizationId
   (== the AutomationJob's own stable key — see
   app/lib/automation/contracts.ts). Survives popup reload,
   webpage reload, and extension reload; does not survive
   uninstalling the extension, which is the correct boundary.

   This worker never contacts any server itself — every message
   it relays either came from the ApplyMate web app tab (via
   externally_connectable) or a content script in an application
   tab it opened. No third-party origin can reach it: manifest
   `externally_connectable.matches` is the browser-enforced
   allowlist.
   ───────────────────────────────────────────────────────── */

/// <reference types="chrome" />

interface StoredExecution {
  authorizationId: string;
  payload: unknown; // ExtensionApplicationPayload — kept untyped here to avoid pulling app/lib into the service worker bundle unnecessarily
  applyUrl: string;
  tabId: number | null;
  stage: string;
  submissionOutcome: string | null;
  reviewRequired: unknown | null;
  attemptId: string;
  previousAttemptIds: string[];
  updatedAt: string;
  log: { stage: string; timestamp: string; message: string }[];
}

const STORAGE_PREFIX = "applymate-execution:";

function storageKey(authorizationId: string): string {
  return `${STORAGE_PREFIX}${authorizationId}`;
}

async function getExecution(authorizationId: string): Promise<StoredExecution | null> {
  const data = await chrome.storage.local.get(storageKey(authorizationId));
  return (data[storageKey(authorizationId)] as StoredExecution | undefined) ?? null;
}

async function putExecution(record: StoredExecution): Promise<void> {
  await chrome.storage.local.set({ [storageKey(record.authorizationId)]: record });
}

function newAttemptId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ── External messages: ApplyMate web app → extension ────── */

type ExternalMessage =
  | { type: "AUTHORIZE_EXECUTION"; payload: { authorization: { authorizationId: string; authorizedApplyUrl: string }; metadata: { applyUrl: string | null } }; dryRun?: boolean }
  | { type: "GET_EXECUTION_STATUS"; authorizationId: string }
  | { type: "STOP_EXECUTION"; authorizationId: string }
  | { type: "RETRY_EXECUTION"; authorizationId: string };

chrome.runtime.onMessageExternal.addListener((message: ExternalMessage, _sender, sendResponse) => {
  handleExternalMessage(message).then(sendResponse);
  return true; // keep the message channel open for the async response
});

async function handleExternalMessage(message: ExternalMessage): Promise<unknown> {
  switch (message.type) {
    case "AUTHORIZE_EXECUTION": {
      const applyUrl = message.payload.authorization.authorizedApplyUrl || message.payload.metadata.applyUrl;
      if (!applyUrl) {
        return { ok: false, error: "No applyUrl on this authorization." };
      }
      const authorizationId = message.payload.authorization.authorizationId;

      // Duplicate-safe: re-authorizing the same job while it's already
      // tracked reuses the existing record rather than starting a second
      // parallel execution (§16).
      const existing = await getExecution(authorizationId);
      if (existing && !["SUBMITTED", "REVIEW_REQUIRED", "FAILED"].includes(existing.stage)) {
        return { ok: true, authorizationId, reused: true };
      }

      const record: StoredExecution = {
        authorizationId,
        payload: message.payload,
        applyUrl,
        tabId: null,
        stage: "AUTHORIZED",
        submissionOutcome: null,
        reviewRequired: null,
        attemptId: newAttemptId(),
        previousAttemptIds: existing ? existing.previousAttemptIds : [],
        updatedAt: new Date().toISOString(),
        log: [{ stage: "AUTHORIZED", timestamp: new Date().toISOString(), message: "Application authorized." }],
      };
      await putExecution(record);
      await openOrFocusApplicationTab(record, message.dryRun ?? false);
      return { ok: true, authorizationId };
    }

    case "GET_EXECUTION_STATUS": {
      const record = await getExecution(message.authorizationId);
      return record ? { ok: true, record } : { ok: false, error: "No execution found for this authorization." };
    }

    case "STOP_EXECUTION": {
      const record = await getExecution(message.authorizationId);
      if (!record) return { ok: false, error: "No execution found." };
      record.stage = "REVIEW_REQUIRED";
      record.reviewRequired = {
        kind: "execution-interrupted",
        description: "Stopped by the user from the ApplyMate web app.",
        requiredAction: "Retry from the Tracker when ready.",
      };
      record.updatedAt = new Date().toISOString();
      await putExecution(record);
      return { ok: true };
    }

    case "RETRY_EXECUTION": {
      const record = await getExecution(message.authorizationId);
      if (!record) return { ok: false, error: "No execution found." };
      record.stage = "AUTHORIZED";
      record.reviewRequired = null;
      record.attemptId = newAttemptId(); // fresh idempotency key — never reuse a stale one
      record.updatedAt = new Date().toISOString();
      await putExecution(record);
      await openOrFocusApplicationTab(record, false);
      return { ok: true };
    }

    default:
      return { ok: false, error: "Unknown message type." };
  }
}

/** Opens (or focuses, if already open) the authorized application tab and,
    once it finishes loading, sends the content script its RUN_EXECUTION
    instruction directly — the user never has to open the popup (§17). */
async function openOrFocusApplicationTab(record: StoredExecution, dryRun: boolean): Promise<void> {
  const existingTabs = await chrome.tabs.query({ url: record.applyUrl });
  let tab = existingTabs[0];
  if (!tab) {
    tab = await chrome.tabs.create({ url: record.applyUrl, active: true });
  } else if (tab.id) {
    await chrome.tabs.update(tab.id, { active: true });
  }
  if (!tab.id) return;

  record.tabId = tab.id;
  await putExecution(record);

  const send = () => sendRunExecutionWithRetry(tab.id!, record, dryRun);

  if (tab.status === "complete") {
    send();
    return;
  }
  const listener = (updatedTabId: number, info: chrome.tabs.TabChangeInfo) => {
    if (updatedTabId === tab.id && info.status === "complete") {
      chrome.tabs.onUpdated.removeListener(listener);
      send();
    }
  };
  chrome.tabs.onUpdated.addListener(listener);
}

/**
 * A tab's `status === "complete"` (navigation finished) is not the same
 * event as "this tab's content script has registered its onMessage
 * listener" — found via live validation: the very first RUN_EXECUTION
 * sent right after a fresh tab reached "complete" was silently dropped
 * (no listener yet), while a message to an already-open, previously-
 * loaded tab worked immediately. `chrome.tabs.sendMessage` reports this
 * via `chrome.runtime.lastError` in its callback rather than throwing —
 * retry on exactly that signal instead of guessing a fixed delay.
 */
function sendRunExecutionWithRetry(tabId: number, record: StoredExecution, dryRun: boolean, attempt = 0): void {
  const MAX_ATTEMPTS = 10;
  const RETRY_DELAY_MS = 400;
  chrome.tabs.sendMessage(
    tabId,
    {
      type: "RUN_EXECUTION",
      payload: record.payload,
      attemptId: record.attemptId,
      previousAttemptIds: record.previousAttemptIds,
      dryRun,
    },
    () => {
      if (chrome.runtime.lastError && attempt < MAX_ATTEMPTS) {
        setTimeout(() => sendRunExecutionWithRetry(tabId, record, dryRun, attempt + 1), RETRY_DELAY_MS);
      }
    }
  );
}

/* ── Internal messages: content script → background ──────── */

interface ExecutionProgressMessage {
  type: "EXECUTION_PROGRESS";
  authorizationId: string;
  stage: string;
  message?: string;
}

interface ExecutionResultMessage {
  type: "EXECUTION_RESULT";
  authorizationId: string;
  stage: string;
  submissionOutcome: string | null;
  reviewRequired: unknown | null;
  log: { stage: string; timestamp: string; message: string }[];
}

interface GetStatusByTabMessage {
  type: "GET_EXECUTION_STATUS_BY_TAB";
  tabId: number;
}

type InternalMessage = ExecutionProgressMessage | ExecutionResultMessage | GetStatusByTabMessage;

chrome.runtime.onMessage.addListener((message: InternalMessage, _sender, sendResponse) => {
  if (message.type === "EXECUTION_PROGRESS" || message.type === "EXECUTION_RESULT") {
    handleInternalMessage(message).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === "GET_EXECUTION_STATUS_BY_TAB") {
    findExecutionByTab(message.tabId).then((record) => sendResponse(record ? { ok: true, record } : { ok: false }));
    return true;
  }
  return false;
});

/** Used by the popup — it knows the active tab, not an authorizationId. */
async function findExecutionByTab(tabId: number): Promise<StoredExecution | null> {
  const all = await chrome.storage.local.get(null);
  for (const key of Object.keys(all)) {
    if (!key.startsWith(STORAGE_PREFIX)) continue;
    const record = all[key] as StoredExecution;
    if (record.tabId === tabId) return record;
  }
  return null;
}

async function handleInternalMessage(message: ExecutionProgressMessage | ExecutionResultMessage): Promise<void> {
  const record = await getExecution(message.authorizationId);
  if (!record) return;

  record.stage = message.stage;
  record.updatedAt = new Date().toISOString();

  if (message.type === "EXECUTION_PROGRESS" && message.message) {
    record.log.push({ stage: message.stage, timestamp: record.updatedAt, message: message.message });
  }

  if (message.type === "EXECUTION_RESULT") {
    record.submissionOutcome = message.submissionOutcome;
    record.reviewRequired = message.reviewRequired;
    record.log.push(...message.log);
    if (message.stage === "SUBMITTED") {
      // Never retry a submitted application with the same attempt id.
      record.previousAttemptIds = [...record.previousAttemptIds, record.attemptId];
    }
  }

  await putExecution(record);
}
