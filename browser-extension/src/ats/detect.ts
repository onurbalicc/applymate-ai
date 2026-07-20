import type { AtsDetectionResult } from "../shared/contracts";
import { greenhouseAdapter } from "./greenhouse";
import { leverAdapter } from "./lever";
import type { AtsAdapter } from "./types";

const ADAPTERS: AtsAdapter[] = [greenhouseAdapter, leverAdapter];

/** Runs every adapter's detector and picks the highest-confidence match.
    Never guesses: an unknown site (or one where every adapter reports
    "unsupported") is always classified as unsupported rather than
    defaulting to either platform. */
export function detectAts(
  document: Document,
  location: Location
): { detection: AtsDetectionResult; adapter: AtsAdapter | null } {
  const confidenceRank: Record<AtsDetectionResult["confidence"], number> = {
    high: 2,
    medium: 1,
    low: 0,
  };

  let best: { detection: AtsDetectionResult; adapter: AtsAdapter } | null = null;

  for (const adapter of ADAPTERS) {
    const detection = adapter.detect(document, location);
    if (detection.platform === "unsupported") continue;
    if (!best || confidenceRank[detection.confidence] > confidenceRank[best.detection.confidence]) {
      best = { detection, adapter };
    }
  }

  if (!best) {
    return {
      detection: { platform: "unsupported", confidence: "low", evidence: [] },
      adapter: null,
    };
  }

  return best;
}
