/* ─────────────────────────────────────────────────────────
   Shared Gemini API caller — server-side only.

   Usage:
     const { result, isMock } = await callGemini<MyType>({
       prompt, schema, fallback
     });

   GEMINI_API_KEY must be set in .env.local.
   Never expose this module to the client bundle.
   ───────────────────────────────────────────────────────── */

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export interface GeminiCallOptions<T> {
  prompt: string;
  schema: object;
  fallback: T;
}

export async function callGemini<T>(
  options: GeminiCallOptions<T>
): Promise<{ result: T; isMock: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { result: options.fallback, isMock: true };
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: options.prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: options.schema,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error("Empty response from Gemini API.");
  }

  const parsed: T = JSON.parse(responseText);
  return { result: parsed, isMock: false };
}
