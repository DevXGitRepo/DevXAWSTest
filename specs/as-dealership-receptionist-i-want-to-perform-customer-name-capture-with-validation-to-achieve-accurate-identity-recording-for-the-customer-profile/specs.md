# Feature: As Dealership Receptionist, I want to perform customer name capture with validation to achieve accurate identity recording for the customer profile
Status: NEW
Owner: DevX
Last Updated: 2026-05-04

Status: NEW
Owner: Dealership Operations
Last Updated: 2025-01-15

## Summary

Provide dealership receptionists with a streamlined, validated name-capture experience that ensures every customer profile begins with an accurate, consistently formatted identity record. The feature must guide the receptionist through entering, verifying, and confirming a customer's name — catching common data-quality issues (typos, missing fields, invalid characters, formatting inconsistencies) before the record is saved. The design must prioritise speed at the front desk, support a wide range of real-world name structures, and meet accessibility standards.

## Actors

- **Receptionist** — front-desk staff member who enters and confirms customer name data.
- **Customer** — the person whose name is being captured (may spell or confirm verbally).
- **System** — the application that validates, normalises, and persists the name record.
- **Dealership Manager** — oversees data quality; may review or correct records after the fact.

## Goals

- Capture customer names accurately on the first attempt, reducing downstream corrections.
- Enforce consistent formatting and completeness rules without slowing the receptionist down.
- Support the full diversity of real-world names (hyphenated, multi-part, suffixes, prefixes, non-Latin diacritics, single-name individuals).
- Provide clear, actionable feedback when validation fails so the receptionist can correct issues immediately.
- Prevent duplicate or malformed identity records from entering the customer profile database.

## Key Features

- Structured name-entry form with distinct fields for each name component (prefix/title, first name, middle name(s), last name, suffix).
- Real-time, inline validation that checks each field as the receptionist types or moves focus.
- Normalisation rules that auto-correct common formatting issues (e.g., leading/trailing whitespace, accidental double spaces, all-caps or all-lowercase input).
- Duplicate-name detection that warns the receptionist when a similar customer profile may already exist.
- Confirmation step that displays the formatted name back to the receptionist for verbal verification with the customer before saving.

## Data & Constraints

### Core Entity — CustomerName

| Attribute | Description |
|---|---|
| id | Unique identifier for the name record |
| customer_profile_id | Link to the parent customer profile |
| prefix | Optional title (e.g., Mr, Mrs, Dr) |
| first_name | Required; the customer's given name |
| middle_name | Optional; one or more middle names |
| last_name | Required; the customer's family/surname |
| suffix | Optional (e.g., Jr, Sr, III) |
| display_name | System-generated formatted full name |
| created_by | Receptionist who created the record |
| created_at | Timestamp of creation |
| updated_at | Timestamp of last modification |

### Constraints

- **first_name** and **last_name** are mandatory; the system must not allow a save without both unless a single-name override is explicitly selected.
- Minimum field length: 1 character (after trimming) for required fields.
- Maximum field length: 50 characters per individual name component; 150 characters for display_name.
- Allowed characters: Unicode letters, hyphens, apostrophes, periods, and spaces. No digits or special symbols (e.g., @, #, $).
- Leading/trailing whitespace must be stripped automatically.
- Consecutive whitespace or hyphens must be collapsed to a single instance.
- All name data must be stored with original casing after normalisation (title-case suggestion offered but not forced).
- PII handling: name data must be encrypted at rest and transmitted only over encrypted channels.

## User Scenarios & Testing

### Scenario 1 — Standard name capture (happy path)

1. Receptionist opens a new customer profile or navigates to the name-capture screen.
2. Receptionist enters a prefix (optional), first name, optional middle name, last name, and optional suffix.
3. System validates each field inline as the receptionist completes it — green indicators confirm valid input.
4. Receptionist clicks "Review"; system displays the formatted full name for verbal confirmation with the customer.
5. Receptionist confirms; system saves the record and returns to the customer profile with the name populated.

**Acceptance criteria (testable):**

- A receptionist can capture and save a valid customer name (first + last at minimum) in a single uninterrupted flow.
- The saved record contains a correctly formatted `display_name` combining all entered components.
- A success confirmation is displayed, and the customer profile reflects the new name immediately.

### Scenario 2 — Validation catches missing required field

1. Receptionist leaves the last name field empty and attempts to proceed.
2. System prevents advancement and displays an inline error message on the last name field: *"Last name is required."*
3. Receptionist enters the last name; the error clears and the receptionist can proceed.

**Acceptance criteria (testable):**

- The system does not allow saving when first_name or last_name is blank (after trimming).
- An inline, field-level error message is visible within 200 ms of the validation trigger.
- The error message disappears once the field contains valid input.

### Scenario 3 — Invalid characters rejected

1. Receptionist types "O'Brien-Smith" in the last name field — system accepts it (apostrophe and hyphen are allowed).
2. Receptionist types "John123" in the first name field — system displays an inline error: *"Name fields may only contain letters, hyphens, apostrophes, periods, and spaces."*

**Acceptance criteria (testable):**

- Fields containing digits or disallowed symbols show an actionable error before the receptionist can save.
- Valid special characters (hyphen, apostrophe, period, space) are accepted without error.

### Scenario 4 — Automatic normalisation of formatting

1. Receptionist enters "  JANE   " (leading/trailing spaces, all caps) in the first name field.
2. On moving focus away from the field, the system trims whitespace and suggests title-case ("Jane") while preserving the ability to override.

**Acceptance criteria (testable):**

- Leading and trailing whitespace is removed from all name fields before save.
- Consecutive internal spaces are collapsed to a single space.
- The system suggests title-case formatting but does not force it (receptionist can keep alternative casing if intentional).

### Scenario 5 — Single-name customer

1. Customer has only one legal name (mononym).
2. Receptionist selects a "Single name" toggle/option.
3. System relaxes the two-field requirement and allows saving with only the first name populated.
4. `display_name` is generated from the single name component.

**Acceptance criteria (testable):**

- When the single-name option is active, the last name field is no longer required.
- The saved record and display_name correctly reflect a single-name entry without placeholder text.

### Scenario 6 — Potential duplicate detected

1. Receptionist enters "John Smith."
2. System detects one or more existing profiles with a similar name and displays a non-blocking warning listing potential matches.
3. Receptionist reviews the matches, confirms this is a new customer, and proceeds to save.

**Acceptance criteria (testable):**

- A duplicate warning appears when the entered first + last name closely matches an existing profile (exact match or phonetic/fuzzy match).
- The warning is non-blocking: the receptionist can dismiss it and continue saving.
- The warning includes enough identifying information (e.g., existing profile creation date or partial contact info) to help the receptionist distinguish records.

## Functional Requirements (testable)

### 1. Name entry form

- The form presents distinct, labelled fields for: prefix, first name, middle name, last name, suffix.
- Required fields are visually indicated before the receptionist begins typing.
- Tab order follows the logical reading sequence of name components.

### 2. Inline validation

- Each field is validated on blur (focus loss) and on form submission.
- Validation rules enforce: required-field presence, allowed characters, minimum/maximum length.
- Error messages are displayed inline adjacent to the offending field, not in a separate summary alone.
- Errors are announced to assistive technologies so screen-reader users are informed immediately.

### 3. Normalisation

- Whitespace trimming and collapse occur automatically before save.
- Title-case suggestion is presented visually but is non-destructive — the receptionist may accept or override.
- `display_name` is generated by concatenating non-empty components in order: prefix, first, middle, last, suffix, separated by single spaces.

### 4. Single-name support

- A clearly labelled toggle or checkbox allows the receptionist to indicate a single-name customer.
- Activating the toggle removes the required constraint from the last name field and updates validation accordingly.

### 5. Duplicate detection

- Before saving, the system checks existing customer profiles for names that match or closely resemble the entered name.
- Matching algorithm accounts for exact matches, case-insensitive matches, and common phonetic similarities. [NEEDS CLARIFICATION: specific matching algorithm or threshold]
- Results are presented in a dismissible panel; the receptionist is not forced to act on them.

### 6. Confirmation step

- After all fields pass validation, the system displays the fully formatted name for the receptionist to review.
- The receptionist must explicitly confirm (e.g., "Save" or "Confirm") before the record is persisted.
- The receptionist can go back to edit any field from the confirmation step without losing entered data.

### 7. Accessibility

- All form fields have associated labels and meet WCAG 2.1 AA contrast and target-size requirements.
- Validation errors are programmatically associated with their fields (e.g., `aria-describedby`).
- The entire flow is operable via keyboard alone.
- Automated accessibility checks run in CI for the name-capture screens.

### 8. Performance

- The name-capture form is interactive within 2 seconds on a standard dealership workstation and network.
- Inline validation feedback appears within 200 ms of the triggering event.
- Duplicate-detection results return within 3 seconds under normal database load.

### 9. Security & privacy

- Name data is classified as PII and encrypted at rest and in transit.
- Access to create or modify customer names is restricted to authenticated users with the Receptionist (or higher) role.
- All name creation and modification events are written to an audit log capturing the actor, timestamp, and before/after values.

### 10. Data retention & compliance [NEEDS CLARIFICATION: retention policy]

- Customer name records follow the dealership's data-retention policy for PII.
- Deletion or anonymisation workflows must be supported for regulatory compliance (e.g., GDPR right-to-erasure requests).

## Success Criteria (measurable & verifiable)

| Metric | Target |
|---|---|
| First-attempt accuracy | ≥ 95% of saved names require zero subsequent corrections within 30 days. |
| Task completion time | Median time from form open to confirmed save ≤ 30 seconds for a standard two-part name. |
| Validation effectiveness | 100% of attempts to save a record with missing required fields or invalid characters are blocked with a clear error. |
| Duplicate detection | ≥ 90% of true-duplicate name entries trigger a warning before save. |
| Accessibility | WCAG 2.1 AA conformance for all name-capture screens; zero critical accessibility defects. |
| Performance | 95th-percentile form load time ≤ 2 s; inline validation latency ≤ 200 ms. |
| Audit coverage | 100% of name-create and name-update events are logged with actor and timestamp. |

## Key Entities

- **Customer Profile** — the overarching identity record to which the name belongs.
- **CustomerName** — the structured name record (prefix, first, middle, last, suffix, display_name).
- **User (Receptionist / Manager)** — the authenticated staff member performing or overseeing the capture.
- **AuditEvent** — log entry recording who changed what and when.

## Assumptions

- Receptionists operate on modern desktop browsers at the dealership; mobile/tablet use is not a primary scenario but should not be blocked.
- The customer profile already exists or is being created in the same session; name capture is one step within that broader workflow.
- The dealership's existing authentication system provides role information (Receptionist, Manager, etc.) that the feature can consume.
- Unicode support is available in the data store and presentation layer to handle diacritics and non-Latin characters.

## Milestones (high-level)

1. **M1** — Core name-entry form with inline validation, normalisation, and confirmation step.
2. **M2** — Single-name support, duplicate-detection warnings, and audit logging.
3. **M3** — Accessibility hardening, performance optimisation, and compliance workflows (retention/deletion).

---

**Notes:**

- Replace placeholders for data-retention windows and duplicate-matching thresholds with the dealership's confirmed policies.
- Confirm the desired duplicate-detection algorithm (exact, phonetic, fuzzy) and acceptable false-positive rate with stakeholders before M2 development begins.