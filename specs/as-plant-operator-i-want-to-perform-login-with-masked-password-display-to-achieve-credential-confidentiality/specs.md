# Feature: As Plant Operator, I want to perform login with masked password display to achieve credential confidentiality
Status: NEW
Owner: DevX
Last Updated: 2026-05-08

Status: NEW
Owner: Plant Operations Team
Last Updated: 2025-01-15
Feature ID: 86244

## Summary

Provide plant operators with a secure login experience that masks password input by default, preventing shoulder-surfing and ensuring credential confidentiality in shared control-room environments. The solution must include a clear authentication flow, masked password field with optional reveal toggle, and robust backend validation — all designed for high-trust industrial settings where multiple operators may share physical workstations.

## Actors

- **Plant Operator** (primary end user) — authenticates to access plant control systems.
- **System Administrator** (internal) — manages operator accounts, credentials, and security policies.
- **System** (authentication service, session manager, audit logger) — validates credentials, issues sessions, records access events.

## Goals

- Protect operator credentials from visual exposure (shoulder-surfing) in shared environments.
- Provide a fast, frictionless login that does not impede time-sensitive plant operations.
- Ensure all authentication attempts are securely validated and auditable.
- Offer an optional password-reveal toggle so operators can verify input when alone, without compromising default confidentiality.

## Key Features

- Login form with username and masked password fields.
- Password masking enabled by default on page load; each character replaced by a uniform mask symbol.
- Optional "show password" toggle that reveals plain text only while actively engaged.
- Secure authentication API endpoint that validates credentials and returns a session token.
- Account lockout / throttling after repeated failed attempts.
- Comprehensive audit logging of authentication events.

## Data & Constraints

- **Operator**: id, username, display_name, hashed_password, role, status (active/locked), failed_attempt_count, last_login
- **Session**: id, operator_id, token, issued_at, expires_at, ip_address, user_agent
- **AuditEvent**: id, operator_id, event_type (login_success, login_failure, account_locked), timestamp, ip_address, metadata

### Constraints

- Passwords must never be stored or logged in plain text.
- Passwords must be hashed using a current, industry-accepted algorithm (e.g., bcrypt, argon2).
- All authentication traffic must occur over encrypted transport (TLS 1.2+).
- Account locks after configurable failed-attempt threshold (default: 5).
- Session tokens must be cryptographically random and expire after a configurable idle timeout.
- System must comply with IEC 62443 principles for industrial authentication where applicable.

## User Scenarios & Testing

### Scenario 1 — Successful login with masked password (happy path)

1. Plant Operator navigates to the login screen.
2. Operator enters username.
3. Operator enters password; each character is displayed as a mask symbol (e.g., `•`).
4. Operator submits the form.
5. System validates credentials and issues a session.
6. Operator is redirected to the plant dashboard.

**Acceptance criteria (testable):**

- The password field renders every character as a uniform mask symbol immediately upon input.
- A valid username/password combination results in a session token returned within 2 seconds under normal load.
- Upon successful authentication, an audit event of type `login_success` is persisted with operator ID, timestamp, and source IP.

### Scenario 2 — Failed login (invalid credentials)

1. Operator enters an incorrect password and submits.
2. System returns a generic error ("Invalid username or password") without revealing which field is wrong.
3. Failed attempt counter increments.

**Acceptance criteria (testable):**

- The error message does not distinguish between an invalid username and an invalid password.
- The failed_attempt_count for the operator increments by 1.
- An audit event of type `login_failure` is recorded.

### Scenario 3 — Account lockout after repeated failures

1. Operator fails authentication N consecutive times (N = configurable threshold, default 5).
2. System locks the account and returns a lockout message.

**Acceptance criteria (testable):**

- After 5 consecutive failed attempts, subsequent requests return a lockout response regardless of credential correctness.
- An audit event of type `account_locked` is recorded.
- The operator cannot authenticate until an administrator unlocks the account or a configurable cooldown expires.

### Scenario 4 — Password reveal toggle

1. Operator clicks/activates the "show password" toggle.
2. Password field displays plain-text characters.
3. Operator releases/deactivates the toggle; field returns to masked state.

**Acceptance criteria (testable):**

- The toggle does not transmit any data to the server.
- Upon deactivation (or after a maximum reveal duration of 30 seconds), the field reverts to masked display.
- Default state on page load is always masked.

### Scenario 5 — Session expiry

1. Operator is idle beyond the configured timeout.
2. Next request returns an authentication-required response.
3. Operator must re-authenticate.

**Acceptance criteria (testable):**

- A session token used after its expiry time is rejected with an appropriate unauthorized response.
- No sensitive data is accessible with an expired token.

## Functional Requirements (testable)

### 1. Authentication API

**Given** a POST request to the login endpoint with valid username and password,
**When** the system processes the request,
**Then** it returns a session token, HTTP 200, and records a `login_success` audit event.

**Given** a POST request with invalid credentials,
**When** the system processes the request,
**Then** it returns HTTP 401 with a generic error message, increments the failed-attempt counter, and records a `login_failure` audit event.

**Given** an operator whose failed_attempt_count equals the lockout threshold,
**When** a login request is received for that operator,
**Then** the system returns HTTP 403 with a lockout message regardless of credential validity.

### 2. Password masking (UI behaviour)

**Given** the login page is loaded,
**When** the operator types into the password field,
**Then** each character is rendered as a mask symbol with no plain-text exposure in the DOM value attribute.

**Given** the password reveal toggle is activated,
**When** the operator views the field,
**Then** the plain-text password is visible until the toggle is deactivated or 30 seconds elapse.

### 3. Credential storage

**Given** a new operator account is created or a password is changed,
**When** the password is persisted,
**Then** only the hashed representation is stored; the plain-text value is never written to any persistent store or log.

### 4. Session management

**Given** a valid session token,
**When** a request is made within the token's validity window,
**Then** the system authorises the request.

**Given** an expired or tampered session token,
**When** a request is made,
**Then** the system returns HTTP 401 and requires re-authentication.

### 5. Audit logging

**Given** any authentication event (success, failure, lockout, logout),
**When** the event occurs,
**Then** an immutable audit record is created containing operator_id (if known), event_type, timestamp, and source IP.

### 6. Transport security

**Given** any request to the authentication endpoint,
**When** the connection is not encrypted (non-TLS),
**Then** the system must reject or redirect the request; credentials must never traverse an unencrypted channel.

### 7. Input validation

**Given** a login request with missing username or password,
**When** the system processes the request,
**Then** it returns HTTP 400 with a descriptive validation error (without leaking security details).

**Given** a password field exceeding maximum length (128 characters),
**When** submitted,
**Then** the system returns HTTP 400 and does not attempt hashing or comparison.

### 8. Performance

**Given** normal operating load (up to 100 concurrent login requests),
**When** credentials are valid,
**Then** 95% of responses complete within 2 seconds.

### 9. Accessibility

**Given** the login form,
**When** accessed via screen reader or keyboard-only navigation,
**Then** all fields, labels, error messages, and the reveal toggle are fully operable and announced (WCAG 2.1 AA).

## Test-First Checklist

The following tests must be written (and initially failing) **before** implementing the corresponding behaviour:

| # | Test | Covers Requirement |
|---|------|--------------------|
| 1 | POST `/auth/login` with valid credentials returns 200 and a token | Auth API — success |
| 2 | POST `/auth/login` with invalid password returns 401 and generic message | Auth API — failure |
| 3 | POST `/auth/login` with unknown username returns 401 and same generic message | Auth API — no user enumeration |
| 4 | POST `/auth/login` with missing fields returns 400 | Input validation |
| 5 | POST `/auth/login` with password > 128 chars returns 400 | Input validation |
| 6 | Failed attempt increments `failed_attempt_count` on operator record | Lockout logic |
| 7 | After 5 consecutive failures, POST `/auth/login` returns 403 lockout | Account lockout |
| 8 | Successful login resets `failed_attempt_count` to 0 | Lockout reset |
| 9 | Successful login persists `login_success` audit event with required fields | Audit logging |
| 10 | Failed login persists `login_failure` audit event | Audit logging |
| 11 | Lockout persists `account_locked` audit event | Audit logging |
| 12 | Stored password is hashed; plain text not present in DB | Credential storage |
| 13 | Expired session token returns 401 on protected endpoint | Session management |
| 14 | Valid session token grants access to protected endpoint | Session management |
| 15 | Tampered/invalid token returns 401 | Session management |
| 16 | Login endpoint rejects non-TLS requests (or integration test verifies TLS enforcement) | Transport security |
| 17 | Response time for valid login ≤ 2 s at P95 under 100 concurrent requests | Performance |

## Success Criteria (measurable & verifiable)

- **Credential confidentiality**: Password field is masked by default in 100% of page loads; no plain-text password is ever logged or stored.
- **Authentication reliability**: 99.9% of valid login attempts succeed without system error under normal load.
- **Security**: Zero instances of plain-text credential exposure in logs, network (non-TLS), or storage — verified by automated scan.
- **Lockout effectiveness**: 100% of accounts exceeding the failure threshold are locked within one additional request.
- **Performance**: 95th-percentile login response time ≤ 2 seconds at rated load.
- **Audit completeness**: 100% of authentication events have corresponding audit records (verified by integration tests).
- **Accessibility**: Login flow passes automated WCAG 2.1 AA checks and manual screen-reader verification.

## Key Entities

- **Operator** — the authenticated plant user.
- **Credential** — hashed password and related metadata (never plain text).
- **Session** — time-bound authentication token binding.
- **AuditEvent** — immutable record of security-relevant actions.

## Assumptions

- Plant operators use modern browsers (latest two major versions) on shared workstations.
- Workstations are on an internal network; however, TLS is still mandatory.
- An external identity provider is **not** in scope for this feature; authentication is handled by the application's own credential store.
- Account provisioning and password-reset flows are handled by a separate feature/admin workflow.
- The configurable lockout threshold and session timeout values will be defined during implementation; defaults are 5 attempts and 30 minutes idle respectively.

## Milestones (high-level)

1. **M1** — Define requirements and acceptance criteria; write failing test suite (US 86246, US 86252 — test definitions).
2. **M2** — Implement API endpoint, business logic, and credential/session management (US 86248); all backend tests pass.
3. **M3** — Develop UI components (masked input, toggle, form validation) and integrate with API (US 86250).
4. **M4** — Write unit and integration tests for UI and end-to-end flows (US 86252 — execution).
5. **M5** — Document API contract (OpenAPI) and produce operator user guide (US 86254).

---

**Notes:**

- Lockout threshold, session idle timeout, and password-hashing algorithm should be confirmed with the security team before M2 implementation begins.
- Ensure CI pipeline includes automated accessibility checks and dependency vulnerability scanning from M1 onward.
- See `checklists/requirements.md` for spec quality validation.