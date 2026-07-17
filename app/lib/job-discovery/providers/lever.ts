/* ─────────────────────────────────────────────────────────
   Job Discovery — Lever public postings provider.

   Real, live, server-side integration against Lever's public
   (no-auth) postings API:

     GET https://api.lever.co/v0/postings/{site}?mode=json

   Verified working during development against the "outreach"
   site (Outreach.io's real, current public postings).

   Multiple sites can be configured (LEVER_SITES below); one
   site failing never blocks the others.
   ───────────────────────────────────────────────────────── */

import type { ProviderResult, RemoteType } from "../contracts";

export interface LeverSiteConfig {
  site: string;
  label: string;
}

/** Configured Lever sites. Add more real companies' Lever site ids here. */
export const LEVER_SITES: LeverSiteConfig[] = [
  { site: "outreach", label: "Outreach" },
];

const FETCH_TIMEOUT_MS = 6000;
const MAX_JOBS_PER_SITE = 40;

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt: number;
  descriptionPlain?: string;
  openingPlain?: string;
  additionalPlain?: string;
  workplaceType?: string;
  country?: string;
  categories?: {
    commitment?: string;
    location?: string;
    department?: string;
    allLocations?: string[];
  };
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string };
}

function mapRemoteType(workplaceType: string | undefined): RemoteType {
  if (!workplaceType) return "unknown";
  const t = workplaceType.toLowerCase();
  if (t.includes("remote")) return "remote";
  if (t.includes("hybrid")) return "hybrid";
  if (t.includes("on-site") || t.includes("onsite") || t.includes("office")) return "onsite";
  return "unknown";
}

function formatSalary(range: LeverJob["salaryRange"]): string {
  if (!range || range.min == null || range.max == null) return "Not listed";
  const currency = range.currency || "";
  const interval = range.interval ? ` / ${range.interval.replace("per-", "").replace("-", " ")}` : "";
  return `${currency} ${range.min.toLocaleString()}–${range.max.toLocaleString()}${interval}`.trim();
}

async function fetchSite(
  site: LeverSiteConfig
): Promise<{ jobs: ProviderResult["jobs"]; error: string | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${encodeURIComponent(site.site)}?mode=json`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );

    if (!res.ok) {
      return { jobs: [], error: `Lever site "${site.site}" returned ${res.status}` };
    }

    const data = await res.json();
    const rawJobs: LeverJob[] = Array.isArray(data) ? data : [];

    const jobs: ProviderResult["jobs"] = rawJobs.slice(0, MAX_JOBS_PER_SITE).map((j) => {
      const description = [j.openingPlain, j.descriptionPlain, j.additionalPlain]
        .filter(Boolean)
        .join("\n\n");
      return {
        id: `lever:${site.site}:${j.id}`,
        provider: `lever:${site.site}`,
        sourceLabel: `Lever — ${site.label}`,
        isDemo: false,
        role: j.text,
        company: site.label,
        location: j.categories?.location || j.country || "Not specified",
        remoteType: mapRemoteType(j.workplaceType),
        employmentType: j.categories?.commitment || "Not specified",
        salaryRange: formatSalary(j.salaryRange),
        postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
        applyUrl: j.applyUrl || j.hostedUrl,
        jobDescription: description || "No description provided.",
      };
    });

    return { jobs, error: null };
  } catch (err) {
    const message = err instanceof Error
      ? (err.name === "AbortError" ? `Lever site "${site.site}" timed out` : err.message)
      : "Unknown error";
    return { jobs: [], error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function leverProvider(): Promise<ProviderResult> {
  const results = await Promise.all(LEVER_SITES.map(fetchSite));

  const jobs = results.flatMap((r) => r.jobs);
  const errors = results.map((r) => r.error).filter((e): e is string => e !== null);

  return {
    jobs,
    provider: "lever",
    providerLabel: "Lever",
    isDemo: false,
    error: errors.length > 0 ? errors.join("; ") : null,
  };
}
