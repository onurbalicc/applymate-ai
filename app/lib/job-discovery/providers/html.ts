/* ─────────────────────────────────────────────────────────
   Minimal, dependency-free HTML → plain text conversion for
   job descriptions returned as HTML by some providers
   (Greenhouse's `content` field). Good enough for AI prompt
   input and display — not a full HTML parser.
   ───────────────────────────────────────────────────────── */

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function htmlToPlainText(html: string): string {
  if (!html) return "";
  let text = html;

  // Decode entities FIRST — Greenhouse's `content` field is itself
  // entity-escaped HTML (e.g. "&lt;div&gt;"), so tag-matching regexes
  // below need literal "<"/">" to have anything to match.
  text = text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&nbsp;/g, (m) => ENTITY_MAP[m] ?? m);

  // Block-level tags become line breaks before stripping.
  text = text.replace(/<\/(p|div|li|h[1-6]|br)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "• ");

  // Strip all remaining tags.
  text = text.replace(/<[^>]+>/g, "");

  // Collapse excess whitespace.
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  return text;
}
