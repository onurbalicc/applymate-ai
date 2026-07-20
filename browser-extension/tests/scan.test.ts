import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./test-utils";
import { runScan } from "../src/content/scanner";
import { detectAts } from "../src/ats/detect";
import { resolveLabel, buildLocator } from "../src/shared/dom-utils";
import { mapField } from "../src/shared/mapper";
import type { RawDetectedField } from "../src/shared/contracts";

/* ── ATS detection ────────────────────────────────────────── */

test("Greenhouse fixture is detected with high confidence", () => {
  const { document, location } = loadFixture("greenhouse.html", "https://boards.greenhouse.io/testco/jobs/123");
  const { detection } = detectAts(document, location);
  assert.equal(detection.platform, "greenhouse");
  assert.equal(detection.confidence, "high");
  assert.ok(detection.evidence.length > 0);
});

test("Lever fixture is detected with high confidence", () => {
  const { document, location } = loadFixture("lever.html", "https://jobs.lever.co/testco/abc-123/apply");
  const { detection } = detectAts(document, location);
  assert.equal(detection.platform, "lever");
  assert.equal(detection.confidence, "high");
});

test("unrelated contact form is classified as unsupported, never guessed", () => {
  const { document, location } = loadFixture("unsupported.html", "https://example.com/contact");
  const { detection, adapter } = detectAts(document, location);
  assert.equal(detection.platform, "unsupported");
  assert.equal(adapter, null);
});

test("Greenhouse-hostname page with no recognizable form still fails safe (no crash)", () => {
  const { document, location } = loadFixture("unsupported.html", "https://boards.greenhouse.io/nothing-here");
  const result = runScan(document, location);
  // hostname alone gives medium confidence — still supported, but no form.
  assert.equal(result.detection.platform, "greenhouse");
  assert.equal(result.formFound, false);
  assert.equal(result.fields.length, 0);
});

/* ── Full page scan ──────────────────────────────────────── */

test("Greenhouse scan finds the application form and reports field counts", () => {
  const { document, location } = loadFixture("greenhouse.html", "https://boards.greenhouse.io/testco/jobs/123");
  const result = runScan(document, location);
  assert.equal(result.formFound, true);
  assert.ok(result.fields.length > 0);
  assert.equal(result.counts.total, result.fields.length);
  assert.equal(result.errors.length, 0);
});

test("Lever scan finds the application form and reports field counts", () => {
  const { document, location } = loadFixture("lever.html", "https://jobs.lever.co/testco/abc-123/apply");
  const result = runScan(document, location);
  assert.equal(result.formFound, true);
  assert.ok(result.fields.length > 0);
});

test("Lever's resume upload status text ('Analyzing resume...Success!') is stripped from the label", () => {
  // Reproduces the real jobs.lever.co DOM (found via live validation): the
  // resume field's wrapping <label> also contains .resume-upload-* status
  // spans with no "status"/"loading" class match — only "upload".
  const { document, location } = loadFixture("lever.html", "https://jobs.lever.co/testco/abc-123/apply");
  const result = runScan(document, location);
  const resume = result.fields.find((f) => f.raw.name === "resume");
  assert.ok(resume);
  assert.ok(resume?.raw.label?.startsWith("Resume/CV"));
  assert.ok(!resume?.raw.label?.includes("Analyzing"));
  assert.ok(!resume?.raw.label?.includes("Success"));
  assert.ok(!resume?.raw.label?.includes("auto-read"));
  assert.equal(resume?.mappingStatus, "mapped");
  assert.equal(resume?.normalizedField, "resumeFile");
});

/* ── Label resolution priority ───────────────────────────── */

test("label resolution prefers explicit for= over everything else", () => {
  const { document } = loadFixture("greenhouse.html", "https://boards.greenhouse.io/testco/jobs/123");
  const emailInput = document.getElementById("email") as HTMLElement;
  const { label, source } = resolveLabel(emailInput, document);
  assert.equal(label, "Email");
  assert.equal(source, "for-attribute");
});

test("label resolution falls back to nearby question text when no label element exists", () => {
  const { document } = loadFixture("greenhouse.html", "https://boards.greenhouse.io/testco/jobs/123");
  const slider = document.getElementById("mystery_slider") as HTMLElement;
  const { label, source } = resolveLabel(slider, document);
  assert.equal(label, "Mystery slider question");
  assert.equal(source, "nearby-question-text");
});

test("Lever wrapping label div resolves via ATS-specific container selector", () => {
  const { document } = loadFixture("lever.html", "https://jobs.lever.co/testco/abc-123/apply");
  const nameInput = document.querySelector('input[name="name"]') as HTMLElement;
  const { label, source } = resolveLabel(nameInput, document, [".application-label"]);
  assert.equal(label, "Full name");
  assert.equal(source, "ats-container");
});

/* ── Field mapping: mapped / ambiguous / unmapped / unsupported ── */

function rawField(overrides: Partial<RawDetectedField>): RawDetectedField {
  return {
    scanFieldId: "test",
    tag: "input",
    inputType: "text",
    name: null,
    id: null,
    label: null,
    labelSource: "none",
    placeholder: null,
    ariaLabel: null,
    ariaLabelledBy: null,
    required: false,
    disabled: false,
    readOnly: false,
    options: [],
    hasValue: false,
    helperText: null,
    validationText: null,
    sectionHeading: null,
    visible: true,
    locator: { strategy: "structural", value: "input", fragile: true },
    atsMetadata: {},
    ...overrides,
  };
}

test("clear email field maps with high confidence", () => {
  const mapped = mapField(rawField({ label: "Email", inputType: "email" }));
  assert.equal(mapped.mappingStatus, "mapped");
  assert.equal(mapped.normalizedField, "email");
  assert.equal(mapped.confidence, "high");
  assert.equal(mapped.sensitivity, "SAFE_AUTO_FILL");
});

test("field with no label and no other signal is unmapped, never force-guessed", () => {
  const mapped = mapField(rawField({}));
  assert.equal(mapped.mappingStatus, "unmapped");
  assert.equal(mapped.normalizedField, null);
});

test("range slider input type is unsupported", () => {
  const mapped = mapField(rawField({ label: "Rate your interest", inputType: "unknown" }));
  assert.equal(mapped.mappingStatus, "unsupported");
  assert.equal(mapped.normalizedField, null);
});

test("ambiguous label with competing signals stays ambiguous rather than guessing", () => {
  // "Current Company" matches both currentCompany and employer equally.
  const mapped = mapField(rawField({ label: "Current Company" }));
  assert.equal(mapped.mappingStatus, "ambiguous");
  assert.equal(mapped.normalizedField, null);
  assert.ok(mapped.alternativeFields.length >= 2);
  assert.ok(mapped.alternativeFields.includes("currentCompany"));
  assert.ok(mapped.alternativeFields.includes("employer"));
});

/* ── Sensitive-field safety ──────────────────────────────── */

test("work authorization question maps but is classified NEVER_AUTO_FILL", () => {
  const mapped = mapField(
    rawField({ label: "Are you legally authorized to work in this country?", inputType: "select" })
  );
  assert.equal(mapped.mappingStatus, "mapped");
  assert.equal(mapped.normalizedField, "authorizedInCountry");
  assert.equal(mapped.sensitivity, "NEVER_AUTO_FILL");
});

test("sponsorship radio group maps but is classified NEVER_AUTO_FILL", () => {
  const mapped = mapField(
    rawField({ label: "Will you require sponsorship to work in this role?", inputType: "radio-group" })
  );
  assert.equal(mapped.normalizedField, "sponsorshipRequired");
  assert.equal(mapped.sensitivity, "NEVER_AUTO_FILL");
});

test("a question mentioning both visa and sponsorship stays ambiguous between the two — but NEVER_AUTO_FILL either way", () => {
  // Real ATS questions often name both concepts in one sentence. The mapper
  // must not force a pick between them, and label-based classification must
  // still escalate to NEVER_AUTO_FILL even though normalizedField is null.
  const mapped = mapField(
    rawField({ label: "Will you now or in the future require visa sponsorship?", inputType: "radio-group" })
  );
  assert.equal(mapped.mappingStatus, "ambiguous");
  assert.equal(mapped.normalizedField, null);
  assert.ok(mapped.alternativeFields.includes("sponsorshipRequired"));
  assert.ok(mapped.alternativeFields.includes("visaStatus"));
  assert.equal(mapped.sensitivity, "NEVER_AUTO_FILL");
});

test("gender demographic question is NEVER_AUTO_FILL even though it maps cleanly", () => {
  const mapped = mapField(rawField({ label: "Gender", inputType: "select" }));
  assert.equal(mapped.normalizedField, "gender");
  assert.equal(mapped.sensitivity, "NEVER_AUTO_FILL");
});

test("Greenhouse full-scan visa/sponsorship question is surfaced as NEVER_AUTO_FILL", () => {
  const { document, location } = loadFixture("greenhouse.html", "https://boards.greenhouse.io/testco/jobs/123");
  const result = runScan(document, location);
  const visaField = result.fields.find((f) => f.raw.label?.toLowerCase().includes("sponsorship"));
  assert.ok(visaField);
  assert.equal(visaField?.sensitivity, "NEVER_AUTO_FILL");
});

test("Lever full-scan gender EEO question is surfaced as NEVER_AUTO_FILL", () => {
  const { document, location } = loadFixture("lever.html", "https://jobs.lever.co/testco/abc-123/apply");
  const result = runScan(document, location);
  const genderField = result.fields.find((f) => f.normalizedField === "gender");
  assert.ok(genderField);
  assert.equal(genderField?.sensitivity, "NEVER_AUTO_FILL");
});

/* ── Locators ─────────────────────────────────────────────── */

test("locator prefers a stable id over structural fallback", () => {
  const { document } = loadFixture("greenhouse.html", "https://boards.greenhouse.io/testco/jobs/123");
  const emailInput = document.getElementById("email") as HTMLElement;
  const locator = buildLocator(emailInput);
  assert.equal(locator.strategy, "id");
  assert.equal(locator.value, "email");
  assert.equal(locator.fragile, false);
});

test("locator falls back to name when no id is present", () => {
  const { document } = loadFixture("lever.html", "https://jobs.lever.co/testco/abc-123/apply");
  const nameInput = document.querySelector('input[name="name"]') as HTMLElement;
  const locator = buildLocator(nameInput);
  assert.equal(locator.strategy, "name");
  assert.equal(locator.value, "name");
});

/* ── Live-page quirks found via real Greenhouse/Lever validation ── */

test("invisible shadow inputs (react-select validation targets, widget search boxes) are excluded from results", () => {
  const { document, location } = loadFixture(
    "greenhouse-live-quirks.html",
    "https://boards.greenhouse.io/testco/jobs/999"
  );
  const result = runScan(document, location);
  // 5 real fields: first_name, country (visible combobox input only, not
  // its hidden validation shadow), cover_letter, resume, portfolio_file.
  assert.equal(result.fields.length, 5);
  assert.ok(!result.fields.some((f) => f.raw.id === "iti-0__search-input"));
  // Every non-file field that was actually kept must be genuinely visible —
  // the hidden react-select shadow input and the search box never appear.
  assert.ok(result.fields.filter((f) => f.raw.inputType !== "file").every((f) => f.raw.visible === true));
});

test("a hidden file input behind a styled upload button is still reported, unlike decoy shadow inputs", () => {
  const { document, location } = loadFixture(
    "greenhouse-live-quirks.html",
    "https://boards.greenhouse.io/testco/jobs/999"
  );
  const result = runScan(document, location);
  const portfolioFile = result.fields.find((f) => f.raw.id === "portfolio_file");
  assert.ok(portfolioFile, "hidden file input must still be discovered");
  assert.equal(portfolioFile?.raw.visible, false);
  assert.equal(portfolioFile?.raw.inputType, "file");
});

test("a trailing asterisk in the label marks the field required even without the HTML required attribute", () => {
  const { document, location } = loadFixture(
    "greenhouse-live-quirks.html",
    "https://boards.greenhouse.io/testco/jobs/999"
  );
  const result = runScan(document, location);
  const firstName = result.fields.find((f) => f.raw.id === "first_name");
  assert.equal(firstName?.raw.label, "First Name*");
  assert.equal(firstName?.raw.required, true);
});

test("dynamic status text inside a label container is stripped, not concatenated into the label", () => {
  const { document, location } = loadFixture(
    "greenhouse-live-quirks.html",
    "https://boards.greenhouse.io/testco/jobs/999"
  );
  const result = runScan(document, location);
  const resume = result.fields.find((f) => f.raw.id === "resume");
  assert.equal(resume?.raw.label, "Resume/CV*");
  assert.ok(!resume?.raw.label?.includes("Analyzing"));
  assert.ok(!resume?.raw.label?.includes("Success"));
});

test("underscore-separated id still maps via humanized signal matching (cover_letter → coverLetterFile)", () => {
  const { document, location } = loadFixture(
    "greenhouse-live-quirks.html",
    "https://boards.greenhouse.io/testco/jobs/999"
  );
  const result = runScan(document, location);
  const coverLetter = result.fields.find((f) => f.raw.id === "cover_letter");
  assert.equal(coverLetter?.mappingStatus, "mapped");
  assert.equal(coverLetter?.normalizedField, "coverLetterFile");
});

test("sexual orientation, transgender, and racial-background questions are NEVER_AUTO_FILL (real EEO phrasing, not just 'race'/'gender')", () => {
  const cases = [
    "How would you describe your sexual orientation? (mark all that apply)",
    "Do you identify as transgender?",
    "How would you describe your racial/ethnic background? (mark all that apply)",
  ];
  for (const label of cases) {
    const mapped = mapField(rawField({ label }));
    assert.equal(mapped.sensitivity, "NEVER_AUTO_FILL", `expected NEVER_AUTO_FILL for: ${label}`);
  }
});

/* ── Radio/checkbox grouping ──────────────────────────────── */

test("radio group with two options collapses into a single logical field", () => {
  const { document, location } = loadFixture("greenhouse.html", "https://boards.greenhouse.io/testco/jobs/123");
  const result = runScan(document, location);
  const sponsorFields = result.fields.filter((f) => f.raw.name === "job_application[answers_attributes][1][text_value]");
  assert.equal(sponsorFields.length, 1);
  assert.equal(sponsorFields[0].raw.options.length, 2);
});
