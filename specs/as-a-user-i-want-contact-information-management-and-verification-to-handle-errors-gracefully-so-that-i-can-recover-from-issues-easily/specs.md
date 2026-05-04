# Feature: As a user, I want Contact Information Management and Verification to handle errors gracefully so that I can recover from issues easily
Status: NEW
Owner: DevX
Last Updated: 2026-05-04

Status: NEW
Owner: DevX
Last Updated: 2025-07-10

## Summary

Ensure that all workflows related to managing and verifying contact information (email addresses, phone numbers, mailing addresses) handle errors gracefully, providing users with clear, actionable feedback and straightforward recovery paths. When something goes wrong — a verification code expires, a network request fails, an invalid format is entered, or a duplicate contact is detected — the system must guide the user back to a productive state without data loss, confusion, or the need to restart the process.

## Actors

- **User** (end user managing their own contact information)
- **System** (backend services responsible for validation, verification delivery, and persistence)
- **Administrator** (internal staff who may view error logs, assist users, or override verification states)
- **Notification Service** (delivers verification codes/links via email, SMS, or postal mail)

## Goals

- Prevent users from becoming stuck or losing progress when errors occur during contact management or verification.
- Provide clear, human-readable error messages that explain what went wrong and what the user can do next.
- Allow users to retry, correct, or abandon an action without needing to start over or contact support.
- Reduce support contacts caused by confusing or silent failures in contact workflows.
- Maintain data integrity — never persist invalid or unverified contact information as verified.

## Key Features

- **Inline field-level validation** with immediate, specific error messages for contact information inputs.
- **Graceful handling of verification failures** (expired codes, incorrect codes, undeliverable messages) with clear recovery options.
- **Resilient form state preservation** so that transient errors (network timeouts, server errors) do not erase user input.
- **Rate-limit and abuse feedback** that informs users when they have exceeded retry thresholds and when they can try again.
- **Fallback and escalation paths** when automated verification cannot succeed (e.g., alternative verification method, support contact).
- **Consistent error presentation** across all contact types (email, phone, address) and all platforms.

## Data & Constraints

- **ContactInfo**: id, user_id, type (email | phone | address), value, status (unverified | pending_verification | verified | failed), created_at, updated_at
- **VerificationAttempt**: id, contact_info_id, method (code | link), issued_at, expires_at, attempts_remaining, last_error, state (pending | succeeded | expired | failed)
- **ErrorEvent**: id, user_id, contact_info_id, timestamp, error_type, error_message, context (action attempted), resolved (boolean)

**Constraints:**
- Verification codes must expire after a defined TTL (configurable; default ≤ 15 minutes).
- Maximum retry attempts per verification request before requiring a new code (configurable; default ≤ 5).
- Rate limits on "resend code" actions (configurable; e.g., max 3 resends per contact per hour).
- All error messages must be free of internal system details (no stack traces, internal IDs, or technical jargon exposed to users).
- PII in error logs must be masked or excluded per data-handling policy.

## User Scenarios & Testing

### Scenario 1 — Invalid contact format (inline validation, happy path)

1. User navigates to contact management and enters a malformed email address (e.g., `user@`).
2. System displays an inline error message adjacent to the field before submission, indicating the expected format.
3. User corrects the value; the error clears immediately and the user proceeds.

**Acceptance criteria (testable):**
- An inline error message appears within 1 second of the field losing focus or the user pausing input.
- The error message specifies the problem (e.g., "Enter a complete email address, like name@example.com").
- Correcting the input clears the error without requiring a page reload or form resubmission.
- The invalid value is never sent to the server for persistence.

### Scenario 2 — Verification code expired

1. User adds a new phone number and requests a verification code.
2. User does not enter the code within the expiration window.
3. User later enters the expired code.
4. System informs the user the code has expired and offers a one-click option to resend a new code.

**Acceptance criteria (testable):**
- The error message explicitly states the code has expired (not a generic "invalid code" message).
- A "Resend code" action is visible and functional directly within the error context.
- After resending, the user can enter the new code without navigating away or re-entering the phone number.
- The expired code is permanently invalidated and cannot be reused even if entered before the new code arrives.

### Scenario 3 — Network or server failure during save

1. User edits their mailing address and clicks "Save."
2. A transient network or server error occurs.
3. System displays a non-destructive error message indicating the save failed and suggesting the user try again.
4. The user's edited input remains intact in the form.

**Acceptance criteria (testable):**
- The user's in-progress edits are preserved in the form after the error; no fields are cleared.
- The error message includes a retry action (e.g., "Try again" button).
- Retrying after the transient issue resolves completes the save successfully.
- If the error persists after 3 consecutive retries, the system suggests contacting support and provides a reference or link.

### Scenario 4 — Duplicate contact detected

1. User attempts to add an email address that is already associated with their account (or, if applicable, another account).
2. System rejects the addition with a specific message explaining the duplicate.

**Acceptance criteria (testable):**
- The error message identifies that the contact already exists (e.g., "This email address is already on your account").
- The message does not reveal whether the contact belongs to a different user (to prevent enumeration).
- The user can dismiss the error and take a different action without losing other form state.

### Scenario 5 — Rate limit exceeded on resend

1. User requests a verification code resend multiple times in rapid succession, exceeding the rate limit.
2. System informs the user they must wait before requesting another code and indicates when they can try again.

**Acceptance criteria (testable):**
- The message includes a human-readable wait time (e.g., "You can request a new code in 12 minutes").
- The "Resend" action is disabled or hidden until the cooldown expires.
- The cooldown is enforced server-side regardless of client behaviour.

### Scenario 6 — Verification delivery failure (undeliverable)

1. User adds a contact and requests verification, but the system cannot deliver the code (e.g., invalid phone carrier, mailbox full).
2. System notifies the user that delivery failed and suggests corrective actions (check the contact value, try an alternative method).

**Acceptance criteria (testable):**
- The user is informed of the delivery failure within a reasonable time (≤ 2 minutes for email/SMS).
- The message suggests checking the entered value for typos and offers the option to edit and retry.
- If an alternative verification method is available, it is presented as an option.

## Functional Requirements (testable)

### 1. Inline validation

- All contact input fields validate format on the client before submission.
- Validation messages are specific to the error type (missing domain, invalid characters, incomplete phone number, etc.).
- Validation does not block the user from correcting input; fields remain editable.

### 2. Server-side validation and error responses

- The server validates all contact data independently of client validation.
- Server error responses include a machine-readable error code and a user-facing message.
- No server error response exposes internal implementation details or PII of other users.

### 3. Verification lifecycle error handling

- Expired verification attempts return a distinct error differentiable from "wrong code."
- Exceeded-attempt verifications are clearly communicated, with instructions to request a new code.
- Successful verification is idempotent — re-submitting a valid code after verification succeeds does not produce an error.

### 4. Form state preservation

- User input in contact management forms is preserved across transient errors (network failures, server 5xx responses).
- If a session expires during editing, the user is prompted to re-authenticate and returned to their in-progress form with data intact where technically feasible.

### 5. Retry and recovery actions

- Every error state presented to the user includes at least one actionable recovery path (retry, edit, resend, contact support).
- Retry actions are idempotent and safe to invoke multiple times.

### 6. Rate limiting and abuse prevention

- Rate limits are enforced server-side for verification requests and code resends.
- Rate-limit errors include a human-readable cooldown duration.
- Rate-limit responses do not leak information about other users or system internals.

### 7. Fallback and escalation

- When automated verification fails repeatedly (configurable threshold), the system offers an alternative verification method or a path to contact support.
- Support escalation paths include sufficient context (e.g., a reference ID) so the user does not need to re-explain the issue.

### 8. Accessibility

- All error messages are programmatically associated with their respective form fields (e.g., via `aria-describedby` or equivalent).
- Error states are conveyed through more than colour alone (icons, text, and/or ARIA live regions).
- Error flows meet WCAG 2.1 AA conformance.

### 9. Logging and observability [NEEDS CLARIFICATION: log retention period]

- All error events are logged with sufficient context for debugging (error type, action attempted, anonymised user reference, timestamp).
- PII is excluded or masked in logs per the project's data-handling policy.

### 10. Consistency

- Error message tone, structure, and placement are consistent across all contact types and all entry points (profile settings, onboarding, account recovery).
- A shared error taxonomy is used so that the same class of error always produces the same category of message.

## Success Criteria (measurable & verifiable)

- **Recovery rate:** ≥ 95% of users who encounter a validation or verification error successfully complete the contact management action without contacting support.
- **Error clarity:** In usability testing, ≥ 90% of participants can identify what went wrong and what to do next after reading an error message.
- **Form state preservation:** 100% of transient-error scenarios preserve user input (verified via automated test suite).
- **Verification completion:** ≥ 98% of users who initiate verification complete it within 24 hours (excluding intentional abandonment).
- **Support contact reduction:** Support tickets categorised under "contact verification issues" decrease by ≥ 30% within 60 days of release (compared to prior baseline).
- **Accessibility:** All error-related UI components pass WCAG 2.1 AA automated and manual audit for critical flows.
- **No information leakage:** Security review confirms zero instances of PII exposure, user enumeration, or internal detail leakage in error responses.

## Key Entities

- **User** — the person managing their contact information.
- **ContactInfo** — an individual contact record (email, phone, or address) belonging to a user.
- **VerificationAttempt** — a single verification lifecycle instance tied to a contact record.
- **ErrorEvent** — a recorded instance of an error encountered during a contact management or verification action.
- **Notification** — a verification message delivered to the user (email, SMS, or other channel).

## Assumptions

- Users have access to the contact channels they are attempting to verify (e.g., they can receive email or SMS).
- The notification delivery service provides delivery-status callbacks or polling capability so the system can detect undeliverable messages.
- Verification code TTL, retry limits, and rate-limit thresholds are configurable per environment without code changes.
- A baseline support-ticket categorisation exists (or will be established) to measure reduction in contact-verification-related tickets.

## Milestones (high-level)

1. **M1** — Inline validation, server-side validation error responses, and form state preservation for all contact types.
2. **M2** — Verification lifecycle error handling (expired codes, failed delivery, rate limiting) with recovery actions.
3. **M3** — Fallback/escalation paths, accessibility audit, observability instrumentation, and support-ticket baseline measurement.

---

**Notes:**
- Replace the placeholder for log retention period with the project's agreed policy.
- Verification code TTL, retry limits, and rate-limit windows should be confirmed with the security and product teams before M2.
- See checklists/requirements.md for spec quality validation.