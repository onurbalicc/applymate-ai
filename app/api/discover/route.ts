import { NextResponse } from "next/server";
import { demoProvider } from "@/app/lib/job-discovery/providers";
import { greenhouseProvider } from "@/app/lib/job-discovery/providers/greenhouse";
import { leverProvider } from "@/app/lib/job-discovery/providers/lever";
import type { DiscoveryQuery, ProviderResult } from "@/app/lib/job-discovery/contracts";

/* ─────────────────────────────────────────────────────────
   POST /api/discover

   Body: { query: DiscoveryQuery }

   Runs every configured provider in parallel server-side.
   One provider failing (bad token, timeout, network error)
   never blocks the others — each failure is captured and
   returned as a partial error, and jobs from providers that
   did succeed are still returned.

   PROVIDER STATUS:
   - Demo: always runs, always available, clearly labelled.
   - Greenhouse: real, live public job-board API. Currently
     configured against a small set of real companies' boards
     (see providers/greenhouse.ts) — verified returning live
     postings during development.
   - Lever: real, live public postings API. Currently
     configured against one real company's site (see
     providers/lever.ts) — verified returning live postings
     during development.

   Both real providers can be extended with more companies by
   adding entries to GREENHOUSE_BOARDS / LEVER_SITES — no
   other code changes needed.
   ───────────────────────────────────────────────────────── */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query: DiscoveryQuery = body.query;

    if (!query || !Array.isArray(query.targetRoles)) {
      return NextResponse.json(
        { error: "Invalid query: targetRoles is required." },
        { status: 400 }
      );
    }

    const providerCalls: Promise<ProviderResult>[] = [
      Promise.resolve().then(() => demoProvider(query)).catch((err) => ({
        jobs: [], provider: "demo", providerLabel: "Demo", isDemo: true,
        error: err instanceof Error ? err.message : "Demo provider failed",
      })),
      greenhouseProvider().catch((err) => ({
        jobs: [], provider: "greenhouse", providerLabel: "Greenhouse", isDemo: false,
        error: err instanceof Error ? err.message : "Greenhouse provider failed",
      })),
      leverProvider().catch((err) => ({
        jobs: [], provider: "lever", providerLabel: "Lever", isDemo: false,
        error: err instanceof Error ? err.message : "Lever provider failed",
      })),
    ];

    const results = await Promise.all(providerCalls);

    const allJobs = results.flatMap((r) => r.jobs);
    const partialErrors = results.filter((r) => r.error !== null).map((r) => `${r.providerLabel}: ${r.error}`);
    // isDemo is only true when every provider that returned jobs was a demo
    // provider — a mix of live + demo results is never presented as "all demo".
    const liveResultsWithJobs = results.filter((r) => !r.isDemo && r.jobs.length > 0);
    const isDemo = liveResultsWithJobs.length === 0;
    const providerLabel = results.filter((r) => r.jobs.length > 0).map((r) => r.providerLabel).join(", ") || "Demo";

    // Total failure only if every single provider errored out.
    const allFailed = results.every((r) => r.error !== null && r.jobs.length === 0);

    return NextResponse.json({
      jobs: allJobs,
      isDemo,
      providerLabel,
      partialErrors: partialErrors.length > 0 ? partialErrors : null,
      allFailed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
