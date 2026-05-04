# Feature: As Dealership Receptionist, I want to perform customer name capture with validation to achieve accurate identity recording for the customer profile
Status: NEW
Owner: DevX
Last Updated: 2026-05-04

Status: NEW
Owner: Dealership Systems
Last Updated: 2025-07-11

## Summary

Provide dealership receptionists with a streamlined, validated name-capture experience that ensures every customer profile begins with an accurate, consistently formatted identity record. The feature must guide the receptionist through entering, verifying, and confirming a customer's legal and preferred names, enforce data-quality rules in real time, flag potential duplicates, and persist the validated name to the customer profile. The design must prioritise speed (receptionists are often face-to-face with customers), accuracy (downstream processes depend on correct names), and inclusivity (support for a wide range of cultural naming conventions).

## Actors

- **Receptionist** — front-desk dealership staff who create and update customer profiles during walk-ins, phone calls, or appointment arrivals.
- **Customer** — the person whose name is being captured (may or may not be present).
- **Dealership Manager** — oversees data quality; may review or correct name records.
- **System** — performs validation, duplicate detection, formatting, and persistence of name data.

## Goals

- Capture customer names accurately on the first attempt, reducing downstream corrections.
- Enforce consistent formatting and data-quality rules without slowing the receptionist's workflow.
- Support diverse naming conventions (multi-part surnames, suffixes, prefixes/titles, hyphenated names, single-name individuals, non-Latin transliterations).
- Detect and surface potential duplicate customer records before a new profile is created.
- Maintain an audit trail of name entries and edits for compliance and dispute resolution.

## Key Features

- **Structured name entry form** with distinct fields for prefix/title, first name, middle name(s), last name, suffix, and preferred/display name.
- **Real-time inline validation** that checks required fields, character rules, length limits, and formatting as the receptionist types.
- **Duplicate detection** that searches existing customer profiles and presents potential matches before a new record is saved.
- **Name preview and confirmation step** showing the formatted full name exactly as it will appear on the profile, requiring explicit receptionist confirmation.
- **Cultural naming support** including optional fields, configurable field ordering, and acceptance of single-name entries where culturally appropriate.
- **Audit logging** of every name capture and subsequent edit, including actor, timestamp, and before/after values.

## Data & Constraints

### Core Entities

- **CustomerName**: customer_id, prefix, first_name, middle_name, last_name, suffix, preferred_name, full_display_name, created_by, created_at, updated_by, updated_at
- **NameAuditEntry**: id, customer_id, field_changed, previous_value, new_value, actor, timestamp, source (walk-in / phone / import)
- **DuplicateCandidate**: id, source_customer_id, matched_customer_id, similarity_score, resolution (new_record / merge / dismissed), resolved_by, resolved_at

### Constraints

- **Required fields**: first_name and last_name are required by default; system must allow a configuration override for single-name individuals (first_name only or last_name only).
- **Character rules**: Unicode letters, hyphens, apostrophes, periods, and spaces are permitted. Numeric digits and special symbols (e.g., @, #, $) are rejected.
- **Length limits**: Each name component ≤ 100 characters; full_display_name ≤ 300 characters.
- **Casing**: System stores the name as entered but generates a normalised display version (title case by default, configurable).
- **PII handling**: Name data is personally identifiable information; encryption at rest and in transit is required. Access must be role-restricted.
- **Duplicate threshold**: Configurable similarity score (default ≥ 0.80) triggers a duplicate warning.

## User Scenarios & Testing

### Scenario 1 — Capture a new customer name (happy path)

1. Receptionist opens the "New Customer" form.
2. Receptionist enters prefix, first name, middle name, last name, suffix, and preferred name.
3. System validates each field inline as the receptionist types or tabs to the next field.
4. System runs duplicate detection against existing profiles and returns zero matches.
5. System displays a formatted name preview for confirmation.
6. Receptionist confirms; system saves the profile and displays the new customer record.

**Acceptance criteria (testable):**

- All required fields must be completed before the confirmation step is reachable.
- Inline validation errors appear within 1 second of the receptionist leaving a field that violates a rule.
- When no duplicates exist, the receptionist can complete name capture in ≤ 5 discrete interactions (field entries + confirm).
- A new CustomerName record and corresponding NameAuditEntry are persisted upon confirmation.

### Scenario 2 — Validation rejects invalid characters

1. Receptionist enters a name containing numeric digits (e.g., "J0hn").
2. System highlights the field and displays a clear, specific error message (e.g., "Names may only contain letters, hyphens, apostrophes, periods, and spaces.").
3. Receptionist corrects the entry; error clears immediately upon valid input.

**Acceptance criteria (testable):**

- Every disallowed character listed in the constraints triggers an inline error when present in any name field.
- Error messages are specific (not generic "invalid input") and visible without scrolling.
- Correcting the value clears the error without requiring a page reload or form resubmission.

### Scenario 3 — Duplicate customer detected

1. Receptionist enters a name that closely matches an existing customer profile.
2. System presents a list of potential duplicate profiles with key identifiers (name, phone, email snippet) and similarity scores.
3. Receptionist reviews matches and either selects an existing profile to open or explicitly confirms creation of a new record.

**Acceptance criteria (testable):**

- Duplicate detection runs automatically before the confirmation step; no manual trigger is required.
- At least the top 5 matches (above the configured similarity threshold) are displayed.
- Selecting an existing match navigates to that customer's profile without creating a duplicate.
- Confirming "Create New" persists a DuplicateCandidate record with resolution = "new_record" for audit purposes.

### Scenario 4 — Single-name customer

1. Receptionist encounters a customer with a single legal name (no surname).
2. Receptionist enters the name in the first_name field and leaves last_name blank.
3. System accepts the entry when the single-name configuration is enabled; rejects it with a clear message when disabled.

**Acceptance criteria (testable):**

- When single-name mode is enabled, the form submits successfully with only first_name populated.
- When single-name mode is disabled, the form displays a required-field error on last_name.
- The full_display_name is generated correctly from the single provided name component.

### Scenario 5 — Edit an existing customer name

1. Receptionist opens an existing customer profile and initiates a name edit.
2. System pre-populates all current name fields.
3. Receptionist modifies one or more fields; validation and duplicate detection run as in new capture.
4. System shows a before/after comparison and requires confirmation.
5. Upon confirmation, the updated name and a NameAuditEntry (with previous and new values) are saved.

**Acceptance criteria (testable):**

- The before/after comparison is visible to the receptionist prior to confirmation.
- A NameAuditEntry is created for every changed field, capturing previous_value and new_value.
- Unchanged fields do not generate audit entries.

## Functional Requirements (testable)

### 1. Structured name entry form

- The form presents distinct, labelled fields for: prefix/title, first name, middle name(s), last name, suffix, and preferred/display name.
- Field labels and placeholder text clearly indicate expected input.
- Tab order follows the logical reading sequence of the name fields.

### 2. Real-time inline validation

- Each field is validated on blur and on form submission.
- Validation rules enforce: required-field presence, allowed character set, and maximum length.
- Leading/trailing whitespace is trimmed automatically; consecutive internal spaces are collapsed to one.
- Validation errors are displayed adjacent to the offending field with descriptive text.

### 3. Name formatting and preview

- System generates a full_display_name by concatenating populated components in the configured order.
- A preview of the formatted name is shown before final confirmation.
- Receptionist can return to editing from the preview without data loss.

### 4. Duplicate detection

- System searches existing customer profiles using a configurable similarity algorithm when the receptionist reaches the confirmation step.
- Matches at or above the configured threshold are displayed with enough context to differentiate (name, contact snippet).
- Receptionist must explicitly resolve the duplicate prompt (select existing or confirm new) before proceeding.

### 5. Audit trail

- Every name creation and edit generates a timestamped audit entry identifying the actor and the change.
- Audit entries are immutable once written.
- Authorised users (Dealership Manager and above) can view the audit history for any customer name record.

### 6. Cultural naming support

- The form accommodates names with hyphens, apostrophes, accented characters, and multi-part components.
- No field artificially restricts minimum length below 1 character.
- Single-name entry is supported via a configurable setting.

### 7. Security & privacy

- Name data is encrypted in transit and at rest.
- Access to customer name records is restricted by role; only authenticated dealership staff may create or view names.
- All access and modification events are logged.

### 8. Accessibility

- All form fields have associated labels and meet WCAG 2.1 AA contrast and target-size requirements.
- Validation errors are announced to assistive technologies (e.g., via ARIA live regions).
- The entire name-capture flow is operable via keyboard alone.

### 9. Performance

- Inline validation feedback appears within 1 second of the triggering event.
- Duplicate detection results are returned within 3 seconds under normal load.
- The name-capture form is interactive within 2 seconds on a standard dealership workstation.

### 10. Data retention & compliance [NEEDS CLARIFICATION: retention policy]

- Customer name records and audit entries follow the project's data-retention policy.
- PII deletion or anonymisation workflows must be supported for regulatory compliance (e.g., GDPR, CCPA).

## Success Criteria (measurable & verifiable)

- **First-attempt accuracy**: ≥ 95% of newly captured names require zero subsequent corrections within 30 days.
- **Task completion time**: Median time from form open to confirmed save ≤ 60 seconds for a standard two-part name.
- **Validation effectiveness**: 100% of entries containing disallowed characters are rejected before save.
- **Duplicate prevention**: Duplicate detection surfaces a matching record in ≥ 90% of cases where a true duplicate exists (measured against a test dataset).
- **Accessibility**: WCAG 2.1 AA conformance for all name-capture screens; automated accessibility checks pass in CI.
- **Performance**: 95th-percentile form-interactive time ≤ 2 seconds; 95th-percentile duplicate-search response ≤ 3 seconds.
- **Audit completeness**: 100% of name creation and edit events have a corresponding, immutable audit entry.

## Key Entities

- **Customer** — the individual whose identity is being recorded.
- **CustomerName** — the structured name record attached to a customer profile.
- **NameAuditEntry** — immutable log of every name change event.
- **DuplicateCandidate** — record of potential duplicate matches and their resolution.
- **User (Receptionist / Manager)** — dealership staff who interact with name records.

## Assumptions

- Receptionists access the system via desktop workstations with modern browsers; mobile/tablet use is not a primary scenario but should not be blocked.
- An existing customer profile store is available for duplicate-detection queries.
- The dealership's authentication and role system is in place; this feature integrates with it rather than replacing it.
- Default display formatting is title case; dealerships may override this via configuration.
- Email and SMS notification of name changes to customers is out of scope for this feature.

## Milestones (high-level)

1. **M1** — Core name entry form with inline validation, formatting preview, and persistence.
2. **M2** — Duplicate detection, single-name support, and cultural naming enhancements.
3. **M3** — Audit trail, name-edit flow with before/after comparison, and compliance tooling.
4. **M4** — Performance hardening, accessibility audit, and production readiness.

---

**Notes:**

- Replace the placeholder for data-retention windows with the dealership group's compliance decisions.
- Duplicate-detection similarity algorithm and threshold should be confirmed with the data-quality team during M2.
- See checklists/requirements.md for spec quality validation.