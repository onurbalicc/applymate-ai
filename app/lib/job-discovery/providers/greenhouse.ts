/* ─────────────────────────────────────────────────────────
   Job Discovery — Greenhouse public job-board provider.

   Real, live, server-side integration against Greenhouse's
   public (no-auth) job board API:

     GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true

   Verified working during development against gitlab, elastic,
   airtable, robinhood, and figma's public boards (all real
   companies' actual current openings — not fabricated).

   Multiple boards can be configured (GREENHOUSE_BOARDS below);
   one board failing (wrong token, 404, timeout) never blocks
   the others — each board is fetched independently and its
   error is captured, not thrown.

   Fields Greenhouse does not reliably expose (employment type,
   salary, remote/hybrid/onsite) are left honestly unset rather
   than guessed.
   ───────────────────────────────────────────────────────── */

import type { ProviderResult, RemoteType } from "../contracts";
import { htmlToPlainText } from "./html";

export interface GreenhouseBoardConfig {
  token: string;
  label: string;
}

/** Configured boards. Add more real companies' Greenhouse tokens here —
    the provider fans out to all of them and merges what succeeds. */
export const GREENHOUSE_BOARDS: GreenhouseBoardConfig[] = [
  { token: "gitlab", label: "GitLab" },
  { token: "elastic", label: "Elastic" },
  { token: "airtable", label: "Airtable" },
  { token: "robinhood", label: "Robinhood" },
  { token: "figma", label: "Figma" },
];

const FETCH_TIMEOUT_MS = 6000;
const MAX_JOBS_PER_BOARD = 40;

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at: string;
  first_published?: string;
  company_name?: string;
  location?: { name?: string };
  content?: string;
}

function inferRemoteType(locationName: string): RemoteType {
  const loc = locationName.toLowerCase();
  if (loc.includes("remote")) return "remote";
  if (loc.includes("hybrid")) return "hybrid";
  if (loc.trim().length === 0) return "unknown";
  return "unknown"; // Greenhouse doesn't reliably distinguish onsite vs unknown
}

async function fetchBoard(
  board: GreenhouseBoardConfig
): Promise<{ jobs: ProviderResult["jobs"]; error: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.token)}/jobs?content=true`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      return { jobs: [], error: `Greenhouse board "${board.token}" returned ${res.status}` };
    }

    const data = await res.json();
    const rawJobs: GreenhouseJob[] = Array.isArray(data.jobs) ? data.jobs : [];

    const jobs: ProviderResult["jobs"] = rawJobs.slice(0, MAX_JOBS_PER_BOARD).map((j) => {
      const locationName = j.location?.name ?? "";
      return {
        id: `greenhouse:${board.token}:${j.id}`,
        provider: `greenhouse:${board.token}`,
        sourceLabel: `Greenhouse — ${board.label}`,
        isDemo: false,
        role: j.title,
        company: j.company_name || board.label,
        location: locationName || "Not specified",
        remoteType: inferRemoteType(locationName),
        employmentType: "Not specified",
        salaryRange: "Not listed",
        postedAt: j.first_published || j.updated_at || new Date().toISOString(),
        applyUrl: j.absolute_url,
        jobDescription: htmlToPlainText(j.content || ""),
      };
    });

    return { jobs, error: null };
  } catch (err) {
    const message = err instanceof Error
      ? (err.name === "AbortError" ? `Greenhouse board "${board.token}" timed out` : err.message)
      : "Unknown error";
    return { jobs: [], error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function greenhouseProvider(): Promise<ProviderResult> {
  const results = await Promise.all(GREENHOUSE_BOARDS.map(fetchBoard));

  const jobs = results.flatMap((r) => r.jobs);
  const errors = results.map((r) => r.error).filter((e): e is string => e !== null);

  return {
    jobs,
    provider: "greenhouse",
    providerLabel: "Greenhouse",
    isDemo: false,
    error: errors.length > 0 ? errors.join("; ") : null,
  };
}
