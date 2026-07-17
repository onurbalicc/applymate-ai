/* ─────────────────────────────────────────────────────────
   Job Discovery — TypeScript contracts.

   A DiscoveredJob is the normalised representation of any
   job retrieved from any provider (live or demo).  It is
   intentionally flat so ranking, deduplication, and the
   Review Queue card component can work without knowing
   which provider produced it.
   ───────────────────────────────────────────────────────── */

export type RemoteType = "remote" | "hybrid" | "onsite" | "unknown";
export type MatchLabel = "Strong match" | "Good match" | "Possible match";

/** A job listing normalised from any provider. */
export interface DiscoveredJob {
  /** Stable deduplication key AND the automation job identity: "{source}:{externalId}" */
  id: string;
  /** Technical source id, e.g. "demo", "greenhouse:gitlab", "lever:outreach". */
  provider: string;
  /** Human-readable source label shown in the UI. */
  sourceLabel: string;
  /** Whether the job came from a live provider or a demo provider. */
  isDemo: boolean;

  // Core listing fields
  role: string;
  company: string;
  location: string;
  remoteType: RemoteType;
  employmentType: string;
  salaryRange: string;
  postedAt: string;       // ISO 8601
  applyUrl: string;
  jobDescription: string; // full JD text for package generation

  // Computed by the ranking layer (filled after scoring)
  matchScore: number;     // 0–100, rounded integer
  matchLabel: MatchLabel;
  matchReasons: string[]; // up to 4 short bullet points
  cautionReasons: string[]; // gaps / risks worth noting
}

/** Persisted decisions for a discovered job. */
export type DiscoveredJobDecision = "pending" | "approved" | "declined" | "skipped";

/** Persisted record per discovered job. */
export interface DiscoveredJobRecord {
  job: DiscoveredJob;
  decision: DiscoveredJobDecision;
  decidedAt: string | null;
  /** automation job key if "Apply with ApplyMate" was triggered — always equal to job.id. */
  automationJobId: string | null;
}

export type DiscoveryStatus = "idle" | "running" | "success" | "partial-error" | "error";

/** Discovery scheduling/health metadata — drives automatic re-discovery. */
export interface DiscoveryMeta {
  /** ISO timestamp of the last discovery attempt (success or failure). */
  lastAttemptAt: string | null;
  /** ISO timestamp of the last discovery that completed without a fatal error. */
  lastDiscoveryAt: string | null;
  /** Snapshot of the profile fields that affect discovery, used to detect preference changes. */
  profileVersionAtLastDiscovery: string | null;
  status: DiscoveryStatus;
  lastError: string | null;
  /** Summary of the most recent run, for display and diagnostics. */
  lastResultSummary: DiscoverySummary | null;
  /** Earliest time a retry after failure is allowed (rate limit). */
  nextEligibleRetryAt: string | null;
}

/** Full discovery state persisted to localStorage. */
export interface DiscoveryState {
  version: number;
  records: DiscoveredJobRecord[];
  meta: DiscoveryMeta;
}

/** Parameters passed to a discovery provider. */
export interface DiscoveryQuery {
  targetRoles: string[];
  locations: string[];
  remotePreference: "remote" | "hybrid" | "onsite" | "flexible";
  employmentTypes: string[];
  excludedKeywords: string[];
}

/** What a single provider returns. */
export interface ProviderResult {
  jobs: Omit<DiscoveredJob, "matchScore" | "matchLabel" | "matchReasons" | "cautionReasons">[];
  provider: string;
  providerLabel: string;
  isDemo: boolean;
  error: string | null;
}

/** Breakdown of what happened during one discovery run — for honest UI messaging. */
export interface DiscoverySummary {
  fetched: number;
  duplicates: number;
  excluded: number;
  belowThreshold: number;
  added: number;
  isDemo: boolean;
  providerLabel: string;
  /** Errors from individual providers that did not stop the whole run. */
  partialErrors: string[];
}
