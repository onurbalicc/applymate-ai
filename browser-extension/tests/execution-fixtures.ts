import type { ExtensionApplicationPayload } from "../../app/lib/extension-payload/contracts";
import type { NormalizedFieldId, FieldCategory, SensitivityCategory } from "../../app/lib/application-fields/contracts";
import { FIELD_CATEGORY } from "../../app/lib/application-fields/contracts";
import { classifySensitivity } from "../../app/lib/application-fields/classifier";
import type { NormalizedDetectedField, RawDetectedField, RawFieldInputType, RawFieldOption } from "../src/shared/contracts";

/** Build one mapped, scanned field for execution-layer tests — deliberately
    bypasses the real scanner/mapper (already covered by scan.test.ts) so
    these tests can construct exact scenarios (a specific sensitivity +
    resolution combination) directly. */
export function makeMappedField(input: {
  id?: string;
  name?: string;
  label?: string | null;
  normalizedField?: NormalizedFieldId | null;
  inputType?: RawFieldInputType;
  required?: boolean;
  options?: RawFieldOption[];
  category?: FieldCategory | null;
}): NormalizedDetectedField {
  const normalizedField = input.normalizedField ?? null;
  const category = input.category !== undefined ? input.category : normalizedField ? FIELD_CATEGORY[normalizedField] : null;
  const sensitivity: SensitivityCategory = classifySensitivity({ normalizedField, label: input.label ?? null });

  const raw: RawDetectedField = {
    scanFieldId: `scan-${input.id ?? input.name ?? Math.random().toString(36).slice(2)}`,
    tag: input.inputType === "textarea" ? "textarea" : input.inputType === "select" ? "select" : "input",
    inputType: input.inputType ?? "text",
    name: input.name ?? null,
    id: input.id ?? null,
    label: input.label ?? null,
    labelSource: input.label ? "for-attribute" : "none",
    placeholder: null,
    ariaLabel: null,
    ariaLabelledBy: null,
    required: input.required ?? false,
    disabled: false,
    readOnly: false,
    options: input.options ?? [],
    hasValue: false,
    helperText: null,
    validationText: null,
    sectionHeading: null,
    visible: true,
    locator: input.id
      ? { strategy: "id", value: input.id, fragile: false }
      : input.name
        ? { strategy: "name", value: input.name, fragile: false }
        : { strategy: "structural", value: "input", fragile: true },
    atsMetadata: {},
  };

  return {
    raw,
    mappingStatus: normalizedField ? "mapped" : "unmapped",
    normalizedField,
    category,
    confidence: normalizedField ? "high" : "low",
    matchedSignals: [],
    alternativeFields: [],
    sensitivity,
    explanation: "",
  };
}

/** Minimal-but-complete ExtensionApplicationPayload for execution-engine
    tests. Every field present, easy to override per test. */
export function makeExecutionPayload(
  overrides: Partial<ExtensionApplicationPayload> = {}
): ExtensionApplicationPayload {
  return {
    metadata: {
      schemaVersion: 3,
      generatedAt: "2026-07-01T00:00:00.000Z",
      automationJobKey: "greenhouse:testco:123",
      jobTitle: "Analyst",
      company: "TestCo",
      applyUrl: "https://boards.greenhouse.io/testco/jobs/123",
      provider: "greenhouse:testco",
      sourceLabel: "Greenhouse — TestCo",
      expectedAts: "greenhouse",
      applicationState: "AUTHORIZED",
    },
    authorization: {
      authorizationId: "greenhouse:testco:123",
      attemptId: "attempt-test-1",
      authorizedAction: "fill-and-submit",
      authorizedAt: "2026-07-01T00:05:00.000Z",
      authorizedApplyUrl: "https://boards.greenhouse.io/testco/jobs/123",
    },
    candidate: {
      identity: { fullName: "Test Candidate", givenName: "Test", familyName: "Candidate" },
      contact: { email: "test@example.com", phone: "+49 123 456789", city: "Berlin", country: "Germany" },
      professionalLinks: { linkedInUrl: "https://linkedin.com/in/test", gitHubUrl: "", portfolioUrl: "" },
      location: { willingToRelocate: false, remotePreference: "hybrid" },
      education: [{ institution: "Test University", degree: "B.Sc. Testing", period: "2018–2022" }],
      workExperience: [{ company: "TestCorp", role: "Analyst", period: "2022–2024" }],
      salaryAndAvailability: { expectedSalary: "", noticePeriod: "Immediately", earliestStartDate: "" },
      workAuthorization: { authorizationStatus: "EU citizen", sponsorshipRequired: false },
    },
    documents: { resumeFileAvailable: false, coverLetterFileAvailable: false, coverLetterTextAvailable: false },
    generatedPackage: null,
    resolvedAnswers: [],
    normalizedFields: [],
    reusableAnswers: [],
    demographicPolicy: { policy: "not-set", answers: {} },
    preferences: { overwriteExistingValues: false },
    unresolvedRequirements: { blocking: [], manualSteps: [] },
    readiness: { state: "READY_FOR_TEXT_FIELD_ASSISTANCE", isReady: true, blockingReasons: [], manualSteps: [], warnings: [] },
    ...overrides,
  };
}
