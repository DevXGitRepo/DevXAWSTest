# Feature: As Account Manager, I want to see a specific error when my credentials are incorrect so that I can identify which field to correct
Status: NEW
Owner: DevX
Last Updated: 2026-05-15

## Summary
When an Account Manager enters incorrect credentials during login, the system must return specific, actionable error messages that clearly indicate which credential field (e.g., email/username or password) is incorrect or what type of failure occurred. This enables users to self-correct without guessing, reduces support contacts, and improves the login experience while maintaining appropriate security boundaries.

## Actors
- Account Manager (end user attempting to authenticate)
- System (authentication service, error response handler)
- Customer Support (internal, handles escalations from locked/blocked accounts)

## Goals
- Provide clear, specific error feedback so Account Managers can identify which field to correct on a failed login attempt.
- Differentiate between distinct authentication failure types (unknown account, wrong password, locked account, etc.) with unique error codes and human-readable messages.
- Reduce support contacts caused by ambiguous "invalid credentials" errors.
- Maintain security best practices — specificity must not expose information that enables enumeration attacks beyond acceptable risk thresholds (see Assumptions).

## Key Features
- Distinct error codes and messages returned from the authentication endpoint for each failure type.
- Human-readable error messages suitable for direct display to the Account Manager.
- Consistent error response structure across all authentication failure scenarios.
- Appropriate HTTP status codes paired with application-level error codes.

## Data & Constraints
- **AuthRequest**: email (or username), password
- **AuthErrorResponse**: http_status, error_code (application-specific string), message (human-readable), field (optional — indicates which input is problematic)
- Constraints:
  - Error messages must not leak internal system details (stack traces, database info).
  - Rate limiting and lockout policies remain enforced regardless of error specificity.
  - All authentication attempts (success and failure) must be logged with timestamp, IP, and failure reason for audit.
  - Responses must be returned within performance budgets (see Success Criteria).

## User Scenarios & Testing

### Scenario 1 — Unknown email/username (happy path for error specificity)
1. Account Manager enters an email address that does not exist in the system.
2. Account Manager submits the login form.
3. System responds with a specific error indicating the account was not found.
4. Account Manager sees a message guiding them to verify their email/username.

Acceptance criteria (testable):
- The authentication endpoint returns HTTP 401 with `error_code: "ACCOUNT_NOT_FOUND"` and a `field` value of `"email"` when the provided email does not match any account.
- The `message` field contains text that a user can act on (e.g., "No account found with that email address").

### Scenario 2 — Incorrect password
1. Account Manager enters a valid email but an incorrect password.
2. System responds with a specific error indicating the password is wrong.

Acceptance criteria (testable):
- The authentication endpoint returns HTTP 401 with `error_code: "INVALID_PASSWORD"` and a `field` value of `"password"`.
- The `message` field communicates that the password is incorrect without revealing password policy details.

### Scenario 3 — Account locked due to repeated failures
1. Account Manager has exceeded the maximum allowed failed attempts.
2. Account Manager submits another login attempt (even with correct credentials).
3. System responds with a specific error indicating the account is locked.

Acceptance criteria (testable):
- The authentication endpoint returns HTTP 403 with `error_code: "ACCOUNT_LOCKED"`.
- The `message` field includes guidance on next steps (e.g., wait period or contact support).
- The `field` value is `null` (neither individual field is the issue).

### Scenario 4 — Account disabled/deactivated
1. Account Manager attempts to log in with credentials for a deactivated account.
2. System responds with a specific error indicating the account is inactive.

Acceptance criteria (testable):
- The authentication endpoint returns HTTP 403 with `error_code: "ACCOUNT_DISABLED"`.
- The `message` field directs the user to contact support.

### Scenario 5 — Missing or malformed fields
1. Account Manager submits a request with a blank email or blank password.
2. System responds with a validation error before authentication logic executes.

Acceptance criteria (testable):
- The authentication endpoint returns HTTP 400 with `error_code: "VALIDATION_ERROR"`.
- The response includes a `field` value identifying which input is missing or malformed.
- The `message` field describes what is required.

### Scenario 6 — Successful authentication (control case)
1. Account Manager submits valid email and correct password for an active, unlocked account.
2. System authenticates successfully and returns a token/session.

Acceptance criteria (testable):
- The authentication endpoint returns HTTP 200 with a valid session/token payload.
- No error fields are present in the success response.

## Functional Requirements (testable)

### 1. Differentiated error codes from authentication endpoint

**Given** an Account Manager submits a login request with an email that does not match any account,
**When** the authentication endpoint processes the request,
**Then** the response has HTTP status 401, body contains `error_code: "ACCOUNT_NOT_FOUND"`, `field: "email"`, and a non-empty `message`.

**Given** an Account Manager submits a login request with a valid email but incorrect password,
**When** the authentication endpoint processes the request,
**Then** the response has HTTP status 401, body contains `error_code: "INVALID_PASSWORD"`, `field: "password"`, and a non-empty `message`.

**Given** an Account Manager submits a login request for a locked account,
**When** the authentication endpoint processes the request,
**Then** the response has HTTP status 403, body contains `error_code: "ACCOUNT_LOCKED"`, `field: null`, and a non-empty `message`.

**Given** an Account Manager submits a login request for a disabled account,
**When** the authentication endpoint processes the request,
**Then** the response has HTTP status 403, body contains `error_code: "ACCOUNT_DISABLED"`, `field: null`, and a non-empty `message`.

### 2. Input validation before authentication logic

**Given** an Account Manager submits a login request with a blank or missing email,
**When** the authentication endpoint receives the request,
**Then** the response has HTTP status 400, body contains `error_code: "VALIDATION_ERROR"`, `field: "email"`, and a `message` describing the requirement.

**Given** an Account Manager submits a login request with a blank or missing password,
**When** the authentication endpoint receives the request,
**Then** the response has HTTP status 400, body contains `error_code: "VALIDATION_ERROR"`, `field: "password"`, and a `message` describing the requirement.

### 3. Consistent error response structure

**Given** any authentication failure occurs,
**When** the endpoint returns an error response,
**Then** the response body always contains the keys `error_code` (string), `message` (string), and `field` (string or null), with no additional unexpected keys that leak internal details.

### 4. Audit logging of authentication failures

**Given** any authentication attempt fails,
**When** the error response is returned,
**Then** an audit log entry is persisted containing: timestamp, requester IP, submitted email/username, and the `error_code` returned.

### 5. Rate limiting remains enforced

**Given** an IP or account exceeds the configured rate limit for authentication attempts,
**When** the next request arrives,
**Then** the response has HTTP status 429 with `error_code: "RATE_LIMITED"` and a `message` indicating when the user may retry.

### 6. Security — no internal detail leakage

**Given** any authentication failure occurs,
**When** the error response is returned,
**Then** the response body does not contain stack traces, database identifiers, internal service names, or password hashes.

## Test-First Checklist

The following tests must be written (and initially failing) before implementing the corresponding behaviour. Order reflects implementation priority.

| # | Test Description | Covers Requirement |
|---|---|---|
| 1 | POST /auth/login with non-existent email returns 401, `ACCOUNT_NOT_FOUND`, field `email` | Req 1 |
| 2 | POST /auth/login with valid email + wrong password returns 401, `INVALID_PASSWORD`, field `password` | Req 1 |
| 3 | POST /auth/login for locked account returns 403, `ACCOUNT_LOCKED`, field `null` | Req 1 |
| 4 | POST /auth/login for disabled account returns 403, `ACCOUNT_DISABLED`, field `null` | Req 1 |
| 5 | POST /auth/login with missing email returns 400, `VALIDATION_ERROR`, field `email` | Req 2 |
| 6 | POST /auth/login with missing password returns 400, `VALIDATION_ERROR`, field `password` | Req 2 |
| 7 | All error responses conform to schema: `{error_code, message, field}` only | Req 3 |
| 8 | POST /auth/login with valid credentials returns 200 with token and no error keys | Control |
| 9 | Failed auth attempt creates audit log entry with expected fields | Req 4 |
| 10 | Exceeding rate limit returns 429, `RATE_LIMITED` | Req 5 |
| 11 | No error response body contains stack trace or internal identifiers (fuzz/property test) | Req 6 |

## Success Criteria (measurable & verifiable)
- **Error specificity**: 100% of defined failure types return their designated `error_code` and correct `field` value (verified by automated integration tests).
- **Self-service recovery**: After launch, support tickets tagged "login help" decrease by ≥ 25% within 30 days (measured against baseline).
- **Response time**: 95th percentile authentication endpoint response time ≤ 500ms, including error paths.
- **Security**: Zero instances of internal detail leakage in error responses (verified by automated property tests and periodic penetration testing).
- **Audit completeness**: 100% of failed authentication attempts have a corresponding audit log entry (verified by log reconciliation tests).
- **Regression**: All tests in the Test-First Checklist pass in CI on every build.

## Key Entities
- **Account** (Account Manager's identity record — email, hashed password, status: active/locked/disabled)
- **AuthRequest** (inbound login payload)
- **AuthErrorResponse** (structured error returned on failure)
- **AuthSuccessResponse** (token/session returned on success)
- **AuditLogEntry** (record of each authentication attempt and outcome)

## Assumptions
- The organisation has accepted the trade-off of providing field-specific error feedback (e.g., distinguishing "account not found" from "wrong password") over a generic "invalid credentials" message. If enumeration risk is later deemed unacceptable, error specificity can be reduced behind a feature flag without changing the response structure.
- Account lockout thresholds and rate-limit configurations are defined externally and injected as configuration; this spec does not prescribe specific numeric values.
- The authentication endpoint path and request format already exist or will be established; this spec governs the error response behaviour, not the endpoint URL or transport protocol.
- Email is the primary account identifier; if username is also supported, the same error logic applies with `field` reflecting the relevant identifier field name.

## Milestones (high-level)
1. **M1** — Failing tests written for all scenarios in Test-First Checklist; error response schema defined.
2. **M2** — Authentication service returns differentiated error codes; all integration tests pass.
3. **M3** — Audit logging verified; rate limiting integrated; security property tests green.
4. **M4** — Monitoring and baseline measurement for support-ticket reduction in production.

---

Notes:
- If the organisation later decides to reduce error specificity for security reasons, toggle the feature flag and update tests to expect the generic `error_code: "AUTH_FAILED"` with `field: null`.
- Coordinate with front-end teams to ensure error codes are mapped to localised, user-friendly messages in the UI.
- See Test-First Checklist for the ordered sequence of tests to implement before writing production code.