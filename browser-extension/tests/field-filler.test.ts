import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFixture } from "./test-utils";
import { fillTextLikeField, fillCheckboxField, fillGroupField, locateElement, type FillOptions } from "../src/execution/field-filler";
import { makeMappedField } from "./execution-fixtures";

function freshOptions(overwrite = false): FillOptions {
  return { filledByApplyMate: new Set(), overwriteExistingValues: overwrite };
}

test("fills a plain text input via the native setter and marks it filled", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "first_name", normalizedField: "givenName", label: "First Name" });
  const result = await fillTextLikeField(field, "Ada", "candidate-profile", document, freshOptions());
  assert.equal(result.status, "filled");
  const input = document.getElementById("first_name") as HTMLInputElement;
  assert.equal(input.value, "Ada");
});

test("dispatches input/change/blur events a real framework listener would see", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "email", normalizedField: "email", label: "Email" });
  const input = document.getElementById("email") as HTMLInputElement;
  const seen: string[] = [];
  input.addEventListener("input", () => seen.push("input"));
  input.addEventListener("change", () => seen.push("change"));
  input.addEventListener("blur", () => seen.push("blur"));
  await fillTextLikeField(field, "ada@example.com", "candidate-profile", document, freshOptions());
  assert.deepEqual(seen, ["input", "change", "blur"]);
});

test("does not overwrite a value the user already typed, by default", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "pre_filled", normalizedField: null, label: "Pre-filled field" });
  const result = await fillTextLikeField(field, "ApplyMate's value", "candidate-profile", document, freshOptions());
  assert.equal(result.status, "already-filled");
  const input = document.getElementById("pre_filled") as HTMLInputElement;
  assert.equal(input.value, "already typed by the user");
});

test("overwrites a value ApplyMate itself wrote earlier in the same run", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "first_name", normalizedField: "givenName", label: "First Name" });
  const options = freshOptions();
  await fillTextLikeField(field, "Ada", "candidate-profile", document, options);
  const second = await fillTextLikeField(field, "Grace", "candidate-profile", document, options);
  assert.equal(second.status, "filled");
  const input = document.getElementById("first_name") as HTMLInputElement;
  assert.equal(input.value, "Grace");
});

test("fills a native select via the same native-setter technique", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "country_select", normalizedField: "country", label: "Country" });
  const result = await fillTextLikeField(field, "DE", "candidate-profile", document, freshOptions());
  assert.equal(result.status, "filled");
  const select = document.getElementById("country_select") as HTMLSelectElement;
  assert.equal(select.value, "DE");
});

test("fills a radio group by matching the resolved value to the right option", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({
    name: "relocate",
    normalizedField: "willingToRelocate",
    label: "Willing to relocate?",
    inputType: "radio-group",
    options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }],
  });
  const result = await fillGroupField(field, true, "candidate-profile", document, freshOptions());
  assert.equal(result.status, "filled");
  const yesOption = document.getElementById("relocate_yes") as HTMLInputElement;
  assert.equal(yesOption.checked, true);
});

test("checks a single checkbox to the desired boolean state", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "newsletter", normalizedField: null, label: "Subscribe to newsletter", inputType: "checkbox" });
  const result = await fillCheckboxField(field, true, "candidate-profile", document, freshOptions());
  assert.equal(result.status, "filled");
  const checkbox = document.getElementById("newsletter") as HTMLInputElement;
  assert.equal(checkbox.checked, true);
});

test("locateElement re-finds a field purely from its serialized locator", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "email", normalizedField: "email", label: "Email" });
  const el = locateElement(field, document);
  assert.ok(el);
  assert.equal(el?.id, "email");
});

test("a fill attempt against a field that no longer exists on the page fails cleanly, never throws", async () => {
  const { document } = loadFixture("execution-form.html", "https://boards.greenhouse.io/testco/jobs/123");
  const field = makeMappedField({ id: "does_not_exist", normalizedField: "email", label: "Email" });
  const result = await fillTextLikeField(field, "x@example.com", "candidate-profile", document, freshOptions());
  assert.equal(result.status, "failed");
});
