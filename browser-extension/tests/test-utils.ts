import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadFixture(name: string, url: string): { document: Document; location: Location } {
  const html = readFileSync(join(__dirname, "fixtures", name), "utf-8");
  const dom = new JSDOM(html, { url });

  // isVisible() reads window.getComputedStyle; buildLocator()'s cssEscape
  // fallback checks the global CSS — wire both to jsdom's globals so the
  // scanner code (written for a real browser) runs unmodified under Node.
  (globalThis as unknown as { window: typeof dom.window }).window = dom.window;
  (globalThis as unknown as { CSS: typeof dom.window.CSS }).CSS = dom.window.CSS;

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
