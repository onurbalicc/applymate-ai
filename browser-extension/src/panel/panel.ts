/* ─────────────────────────────────────────────────────────
   Popup panel — read-only view of the active tab's scan
   result. Talks directly to the content script; there is no
   background service worker in this MVP.
   ───────────────────────────────────────────────────────── */

import type { ExtensionMessage, ExtensionResponse } from "../shared/messages";
import type { FieldMappingStatus, NormalizedDetectedField, PageScanResult, ScanCounts } from "../shared/contracts";
import type { SensitivityCategory } from "../../../app/lib/application-fields/contracts";

const root = document.getElementById("root")!;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function render(children: (Node | string)[]): void {
  root.replaceChildren(...children.map((c) => (typeof c === "string" ? document.createTextNode(c) : c)));
}

function renderLoading(): void {
  render([el("p", { class: "muted" }, ["Scanning the current page…"])]);
}

function renderUnsupported(reason: string): void {
  render([
    el("div", { class: "state-banner" }, [
      el("p", {}, ["This page isn't a supported application form."]),
      el("p", { class: "muted" }, [reason]),
    ]),
    el("p", { class: "footer-note" }, ["Supported today: Greenhouse and Lever application pages."]),
  ]);
}

function renderError(message: string, onRetry: () => void): void {
  const retryBtn = el("button", { class: "rescan" }, ["Try again"]);
  retryBtn.addEventListener("click", onRetry);
  render([el("div", { class: "state-banner error" }, [el("p", {}, [`Scan error: ${message}`])]), retryBtn]);
}

function confidenceBadgeClass(mapping: FieldMappingStatus): string {
  switch (mapping) {
    case "mapped":
      return "badge-mapped";
    case "ambiguous":
      return "badge-ambiguous";
    case "unmapped":
      return "badge-unmapped";
    case "unsupported":
      return "badge-unsupported";
  }
}

function sensitivityLabel(sensitivity: SensitivityCategory): string {
  if (sensitivity === "SAFE_AUTO_FILL") return "safe";
  if (sensitivity === "NEEDS_CONFIRMATION") return "confirm";
  return "never-auto";
}

function renderCounts(counts: ScanCounts): HTMLElement {
  const tiles: [string, number][] = [
    ["Mapped", counts.mapped],
    ["Ambiguous", counts.ambiguous],
    ["Unmapped", counts.unmapped],
    ["Unsupported", counts.unsupported],
  ];
  return el(
    "div",
    { class: "counts" },
    tiles.map(([label, n]) =>
      el("div", { class: "count-tile" }, [
        el("span", { class: "n" }, [String(n)]),
        el("span", { class: "l" }, [label]),
      ])
    )
  );
}

function renderFieldItem(field: NormalizedDetectedField): HTMLElement {
  const labelText = field.raw.label ?? field.raw.name ?? field.raw.id ?? "(unlabeled field)";
  const mappedText = field.normalizedField ?? "—";
  return el("div", { class: "field-item" }, [
    el("div", { class: "row1" }, [
      el("span", { class: "field-label", title: labelText }, [labelText]),
      el("span", { class: `badge ${confidenceBadgeClass(field.mappingStatus)}` }, [field.mappingStatus]),
    ]),
    el("div", { class: "field-meta" }, [
      el("span", {}, [`type: ${field.raw.inputType}`]),
      el("span", {}, [`→ ${mappedText}`]),
      el("span", {}, [`confidence: ${field.confidence}`]),
      el("span", {}, [`safety: ${sensitivityLabel(field.sensitivity)}`]),
      el("span", {}, [field.raw.required ? "required" : "optional"]),
    ]),
  ]);
}

function renderResult(result: PageScanResult, onRescan: () => void): void {
  const { detection } = result;

  if (detection.platform === "unsupported") {
    renderUnsupported("No Greenhouse or Lever markers were found on this page.");
    return;
  }

  const rescanBtn = el("button", { class: "rescan" }, ["Scan again"]);
  rescanBtn.addEventListener("click", onRescan);

  const header = el("div", { class: "header" }, [
    el("div", {}, [
      el("div", { class: "title" }, [detection.platform === "greenhouse" ? "Greenhouse" : "Lever"]),
      el("div", { class: "subtitle" }, [result.formFound ? "Application form detected" : "No application form found"]),
    ]),
    el("span", { class: `badge badge-${detection.confidence}` }, [detection.confidence]),
  ]);

  const body: (Node | string)[] = [header];

  if (!result.formFound) {
    body.push(
      el("div", { class: "state-banner" }, [
        el("p", {}, ["This looks like a supported ATS, but no application form could be located."]),
        el("p", { class: "muted" }, ["It may still be loading — try Scan again in a moment."]),
      ])
    );
    body.push(rescanBtn);
    render(body);
    return;
  }

  body.push(renderCounts(result.counts));
  body.push(rescanBtn);

  if (result.errors.length > 0) {
    body.push(
      el(
        "div",
        { class: "state-banner error" },
        result.errors.map((e) => el("p", {}, [e.message]))
      )
    );
  }

  if (detection.evidence.length > 0) {
    body.push(
      el(
        "ul",
        { class: "evidence" },
        detection.evidence.map((e) => el("li", {}, [e]))
      )
    );
  }

  if (result.fields.length === 0) {
    body.push(el("p", { class: "muted" }, ["No fillable fields were found in the detected form."]));
  } else {
    body.push(el("div", { class: "field-list" }, result.fields.map(renderFieldItem)));
  }

  body.push(
    el("p", { class: "footer-note" }, [
      "Read-only: nothing on this page has been filled in, changed, or submitted.",
    ])
  );

  render(body);
}

function sendMessageToActiveTab(message: ExtensionMessage): Promise<ExtensionResponse> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        reject(new Error("No active tab found."));
        return;
      }
      chrome.tabs.sendMessage(tab.id, message, (response?: ExtensionResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          reject(new Error("No response from the page."));
          return;
        }
        resolve(response);
      });
    });
  });
}

async function load(messageType: "GET_SCAN_RESULT" | "SCAN_PAGE"): Promise<void> {
  renderLoading();
  try {
    const response = await sendMessageToActiveTab({ type: messageType });
    if (response.type === "SCAN_RESULT") {
      renderResult(response.payload, () => load("SCAN_PAGE"));
    } else if (response.type === "SCAN_ERROR") {
      renderError(response.error.message, () => load("SCAN_PAGE"));
    }
  } catch {
    // Most common cause: content script isn't injected because this tab
    // isn't a Greenhouse/Lever page at all.
    renderUnsupported(
      "This tab isn't a supported application page (or the scanner hasn't loaded here yet)."
    );
  }
}

/* ── Autonomous execution view (Part 2) ──────────────────── */

interface ReviewRequiredDetail {
  kind: string;
  description: string;
  requiredAction: string;
  question?: string;
}

interface StoredExecutionRecord {
  authorizationId: string;
  stage: string;
  submissionOutcome: string | null;
  reviewRequired: ReviewRequiredDetail | null;
  log: { stage: string; timestamp: string; message: string }[];
  updatedAt: string;
}

function stageBadgeClass(stage: string): string {
  if (stage === "SUBMITTED") return "badge-mapped";
  if (stage === "REVIEW_REQUIRED" || stage === "FAILED") return "badge-unmapped";
  return "badge-medium";
}

function stageLabel(stage: string): string {
  return stage
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function renderExecution(record: StoredExecutionRecord): void {
  const header = el("div", { class: "header" }, [
    el("div", {}, [
      el("div", { class: "title" }, ["Autonomous application"]),
      el("div", { class: "subtitle" }, ["Monitoring — this run started from ApplyMate, not the popup."]),
    ]),
    el("span", { class: `badge ${stageBadgeClass(record.stage)}` }, [stageLabel(record.stage)]),
  ]);

  const body: (Node | string)[] = [header];

  if (record.stage === "SUBMITTED") {
    body.push(
      el("div", { class: "state-banner" }, [
        el("p", {}, ["✅ Application submitted."]),
      ])
    );
  } else if (record.reviewRequired) {
    body.push(
      el("div", { class: "state-banner error" }, [
        el("p", {}, [`Needs your review: ${record.reviewRequired.description}`]),
        el("p", { class: "muted" }, [`→ ${record.reviewRequired.requiredAction}`]),
      ])
    );
  } else {
    body.push(el("p", { class: "muted" }, [`In progress — ${stageLabel(record.stage)}…`]));
  }

  if (record.log.length > 0) {
    body.push(
      el(
        "ul",
        { class: "evidence" },
        record.log.slice(-8).map((entry) => el("li", {}, [`${stageLabel(entry.stage)}: ${entry.message}`]))
      )
    );
  }

  body.push(
    el("p", { class: "footer-note" }, [
      "This run is managed from the ApplyMate Tracker — stop, retry, and detailed status live there.",
    ])
  );

  render(body);
}

async function getExecutionStatusForActiveTab(): Promise<StoredExecutionRecord | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage({ type: "GET_EXECUTION_STATUS_BY_TAB", tabId }, (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          resolve(null);
          return;
        }
        resolve(response.record as StoredExecutionRecord);
      });
    });
  });
}

async function bootstrap(): Promise<void> {
  renderLoading();
  const executionRecord = await getExecutionStatusForActiveTab();
  if (executionRecord) {
    renderExecution(executionRecord);
    return;
  }
  await load("GET_SCAN_RESULT");
}

bootstrap();
