import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadFixture(
  name: string,
  url: string,
  options: { runScripts?: boolean } = {}
): { document: Document; location: Location } {
  const html = readFileSync(join(__dirname, "fixtures", name), "utf-8");
  // Only local-ats-fixture.html needs its inline <script> to actually run
  // (it simulates a same-page SPA success response for the submit-
  // controller/outcome-detector end-to-end test) — every other fixture is
  // static markup and stays script-inert, the safer jsdom default.
  const dom = new JSDOM(html, { url, runScripts: options.runScripts ? "dangerously" : undefined });

  // isVisible() reads window.getComputedStyle; buildLocator()'s cssEscape
  // fallback checks the global CSS; field-filler.ts/document-uploader.ts
  // construct real `new Event(...)`/`new DataTransfer()` instances to
  // dispatch at elements — jsdom's dispatchEvent rejects an Event built
  // from Node's OWN global Event class (a different constructor than
  // jsdom's window.Event), so every one of these must be aliased onto
  // globalThis too. Wire them all so code written for a real browser runs
  // unmodified under Node.
  const g = globalThis as unknown as Record<string, unknown>;
  g.window = dom.window;
  g.CSS = dom.window.CSS;
  g.Event = dom.window.Event;
  g.DataTransfer = dom.window.DataTransfer;
  g.File = dom.window.File;
  g.HTMLElement = dom.window.HTMLElement;
  g.HTMLInputElement = dom.window.HTMLInputElement;
  g.HTMLSelectElement = dom.window.HTMLSelectElement;
  g.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;

  // jsdom performs no real layout, so every element's getBoundingClientRect
  // is {0,0,0,0} by default — isVisible() would then treat every field as
  // hidden and the scanner (which now skips invisible fields, matching live
  // Greenhouse/Lever behavior) would find nothing. Stub a plausible non-zero
  // box so visibility in tests is driven by CSS (display/visibility/opacity)
  // — exactly like a real browser — not by jsdom's lack of layout.
  dom.window.HTMLElement.prototype.getBoundingClientRect = () =>
    ({ width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20, x: 0, y: 0, toJSON() {} }) as DOMRect;

  return { document: dom.window.document, location: dom.window.location as unknown as Location };
}
