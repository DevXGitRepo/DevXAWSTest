# Feature: As Account Manager, I want to see a clear error message when my password is invalid so that I know exactly what went wrong
Status: NEW
Owner: DevX
Last Updated: 2026-05-15

Status: NEW
Owner: DevX
Last Updated: 2025-01-15

## Summary

When an Account Manager enters an invalid password during authentication, the system must display a clear, specific, and contextually placed error message near the password input field. The goal is to eliminate ambiguity about what went wrong, reduce frustration, and minimize support contacts related to login failures. The error must be accessible, secure (not leaking sensitive information), and appear inline without requiring a page reload or navigation away from the login form.

## Actors

- Account Manager (end user attempting to authenticate)
- System (authentication service, error response handler)
- Customer Support (internal — benefits from reduced password-related contacts)

## Goals

- Provide immediate, unambiguous feedback when a password is invalid.
- Display the error message inline, visually associated with the password input field.
- Maintain security by not revealing whether the account exists or which specific character/rule failed.
- Meet accessibility standards so all users can perceive and understand the error.
- Reduce support contacts caused by unclear login failure messaging.

## Key Features

- Inline error message rendered adjacent to the password input field upon invalid password submission.
- Error message uses clear, human-readable language explaining the authentication failure.
- Error state is visually distinct (styling, iconography) and programmatically associated with the input for assistive technologies.
- Error clears automatically when the user modifies the password field or re-submits successfully.
- Error response from the backend uses a generic credential-failure message (does not distinguish between "user not found" and "wrong password").

## Data & Constraints

- AuthenticationRequest: username, password
- AuthenticationResponse: success (boolean), error_code (string | null), error_message (string | null)
- Error codes: `INVALID_CREDENTIALS` (generic for wrong username or password)
- Constraints:
  - Error message must NOT reveal whether the username exists in the system.
  - Error message must NOT echo back the submitted password.
  - Response time for authentication attempts (including error) must be consistent to prevent timing attacks.
  - Rate limiting applies to repeated failed attempts (existing behaviour, out of scope for this feature).

## User Scenarios & Testing

### Scenario 1 — Invalid password submitted (happy path for error display)

1. Account Manager navigates to the login page.
2. Account Manager enters a valid username and an incorrect password.
3. Account Manager submits the form.
4. System validates credentials and determines the password is invalid.
5. System returns a generic credential-failure response.
6. An inline error message appears directly below/beside the password input field stating the credentials are invalid.
7. The password field is visually marked as having an error (e.g., border colour change).

**Acceptance criteria (testable):**

- Given an Account Manager submits a login form with an incorrect password, when the server responds, then an error message reading "The username or password you entered is incorrect." is displayed inline adjacent to the password input field.
- Given the error message is displayed, then it is programmatically associated with the password input via `aria-describedby` or equivalent, and the input has `aria-invalid="true"`.
- Given the error is displayed, then the response does not contain the submitted password or indicate whether the username exists.

### Scenario 2 — Error clears on user correction

1. Account Manager sees the inline error after a failed attempt.
2. Account Manager modifies the password field content.
3. The inline error message is removed or hidden.

**Acceptance criteria (testable):**

- Given the inline error is visible, when the Account Manager changes the value in the password field, then the error message is no longer displayed and `aria-invalid` is removed.

### Scenario 3 — Successful login after prior failure

1. Account Manager previously saw the error message.
2. Account Manager enters the correct password and submits.
3. System authenticates successfully; no error is shown; user proceeds to the dashboard.

**Acceptance criteria (testable):**

- Given an Account Manager re-submits with valid credentials after a prior failure, when the server responds with success, then no error message is displayed and the user is redirected/granted access.

### Scenario 4 — Accessibility of error message

1. A screen-reader user submits invalid credentials.
2. The error message is announced by the assistive technology without requiring the user to navigate away from the form.

**Acceptance criteria (testable):**

- The error container has `role="alert"` or is within an ARIA live region so that its appearance is announced automatically.
- Colour alone is not the sole indicator of the error state; text and/or iconography supplement the visual cue.

### Scenario 5 — Timing consistency (security)

**Acceptance criteria (testable):**

- Given a request with a valid username and wrong password, and a request with a non-existent username and any password, the response times do not differ by more than a defined threshold (e.g., ≤50 ms variance at p95) to prevent user-enumeration timing attacks.

## Functional Requirements (testable)

### 1. Authentication endpoint returns generic error on invalid credentials

**Given** a POST request to the authentication endpoint with a valid username and incorrect password,
**When** the system processes the request,
**Then** the response has HTTP status 401, body contains `{ "error_code": "INVALID_CREDENTIALS", "error_message": "The username or password you entered is incorrect." }`, and does not include the submitted password or a user-existence indicator.

### 2. Authentication endpoint returns the same error for non-existent user

**Given** a POST request to the authentication endpoint with a non-existent username and any password,
**When** the system processes the request,
**Then** the response is identical in structure and message to Requirement 1 (`INVALID_CREDENTIALS`).

### 3. Inline error display on credential failure

**Given** the login form is submitted and the server responds with `INVALID_CREDENTIALS`,
**When** the response is received by the client,
**Then** an error message element is rendered inline adjacent to the password input field containing the text from the response's `error_message`.

### 4. Error message accessibility attributes

**Given** the inline error message is rendered,
**When** inspected programmatically,
**Then** the error element is referenced by the password input's `aria-describedby`, the input has `aria-invalid="true"`, and the error container has `role="alert"` or equivalent live-region semantics.

### 5. Error clears on input modification

**Given** the inline error message is currently displayed,
**When** the Account Manager changes the value of the password input,
**Then** the error message element is removed from the DOM (or hidden with `display:none`/`aria-hidden="true"`) and `aria-invalid` is removed from the input.

### 6. No error displayed on successful authentication

**Given** the login form is submitted with correct credentials,
**When** the server responds with HTTP 200 and a success payload,
**Then** no error message is rendered and the user is granted access.

### 7. Response timing consistency

**Given** repeated authentication requests with varying validity of username/password combinations,
**When** response times are measured,
**Then** the p95 response time difference between "valid user / wrong password" and "invalid user / any password" is ≤ 50 ms.

### 8. Error message does not leak sensitive data

**Given** any failed authentication response,
**When** the response body and headers are inspected,
**Then** neither the submitted password nor any indication of whether the username exists (beyond the generic message) is present.

## Test-First Checklist

The following tests must be written (and initially failing) **before** implementation begins. Order reflects dependency.

| # | Test | Layer |
|---|------|-------|
| 1 | POST `/auth/login` with valid username + wrong password returns 401 with `INVALID_CREDENTIALS` error code and generic message. | API / Integration |
| 2 | POST `/auth/login` with non-existent username returns 401 with identical `INVALID_CREDENTIALS` response body. | API / Integration |
| 3 | Response body for failed auth never contains the submitted password value. | API / Unit |
| 4 | Response timing for valid-user/wrong-password vs. invalid-user/any-password differs by ≤ 50 ms at p95 over N requests. | API / Performance |
| 5 | Authentication service returns success payload (200) for correct credentials (control test). | API / Integration |
| 6 | Client renders inline error element adjacent to password input when response contains `INVALID_CREDENTIALS`. | Client / Integration |
| 7 | Inline error element has correct `role="alert"` and is referenced by password input's `aria-describedby`. | Client / Unit |
| 8 | Password input has `aria-invalid="true"` when error is displayed. | Client / Unit |
| 9 | Error message is removed and `aria-invalid` is cleared when password input value changes. | Client / Unit |
| 10 | No error element is rendered when authentication succeeds. | Client / Integration |

## Success Criteria (measurable & verifiable)

- **Clarity:** ≥ 95% of Account Managers in usability testing correctly identify "wrong password" as the cause of the error after seeing the message (survey/task-based test).
- **Visibility:** Error message appears within 1 second of form submission under normal network conditions.
- **Support reduction:** Password-related support tickets decrease by ≥ 20% within 30 days of release (compared to prior 30-day baseline).
- **Accessibility:** Automated axe/WAVE scans report zero critical or serious issues on the login page in error state; screen-reader testing confirms announcement of error.
- **Security:** Penetration/timing tests confirm no user-enumeration vector introduced by this feature.
- **Regression:** All existing authentication tests continue to pass; no change in success-path behaviour.

## Key Entities

- Account Manager (user role)
- AuthenticationRequest (submitted credentials)
- AuthenticationResponse (success or error payload)
- ErrorMessage (UI element displayed inline)
- AuditLog (records failed authentication attempts — existing, not modified)

## Assumptions

- A login page and authentication endpoint already exist; this feature modifies the error response format and client-side error rendering.
- The current system may already return a generic error, but it is not displayed inline near the password field — it may be a page-level banner or toast.
- Rate limiting and account lockout policies are handled separately and are not in scope.
- The error message copy ("The username or password you entered is incorrect.") is approved by UX writing; changes require stakeholder sign-off.

## Milestones (high-level)

1. **M1** — Backend: Standardise authentication error response to return `INVALID_CREDENTIALS` with generic message; ensure timing consistency. Write and pass API tests 1–5.
2. **M2** — Frontend: Render inline error adjacent to password input with full accessibility attributes; clear on input change. Write and pass client tests 6–10.
3. **M3** — QA & Release: End-to-end testing, accessibility audit, security review, and production deployment.

---

Notes:

- If the organisation's security policy requires a different generic message (e.g., "Login failed. Please try again."), update the `error_message` value and corresponding tests accordingly.
- Coordinate with the design system team to ensure error styling tokens (colour, spacing, iconography) are consistent with other form validation patterns.