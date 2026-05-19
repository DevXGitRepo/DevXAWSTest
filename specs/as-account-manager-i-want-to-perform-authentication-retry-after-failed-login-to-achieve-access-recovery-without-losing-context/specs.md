# Feature: As Account Manager, I want to perform authentication retry after failed login to achieve access recovery without losing context
Status: NEW
Owner: DevX
Last Updated: 2026-05-19

Status: NEW
Owner: Account Management
Last Updated: 2025-01-15
Feature ID: 78201

## Summary

Enable Account Managers to recover from failed login attempts by retrying authentication without losing their pre-login context (e.g., deep-link destination, form state, selected account, or query parameters). The system must provide clear feedback on failure reasons, enforce security policies (lockout thresholds, rate limiting), and seamlessly restore the user's intended destination and state upon successful retry.

## Actors

- **Account Manager** (primary end user attempting login)
- **System** (authentication service, session manager, rate limiter)
- **Security / Compliance** (internal — defines lockout and audit policies)
- **Customer Support** (internal — assists with locked accounts)

## Goals

- Allow Account Managers to retry authentication in-place after a failed attempt without being redirected away or losing navigational context.
- Provide clear, actionable feedback on why authentication failed.
- Enforce security controls (attempt limits, progressive delays, account lockout) to prevent brute-force attacks.
- Restore the user's originally intended destination and any preserved state upon successful authentication.
- Maintain a complete audit trail of all authentication attempts (successful and failed).

## Key Features

- In-place authentication retry with preserved context (target URL, query parameters, referral state).
- Clear, specific error messaging that distinguishes credential errors from lockout and system failures.
- Configurable retry limits with progressive back-off and eventual account lockout.
- Context token mechanism that securely encodes and restores pre-login state across retry attempts.
- Audit logging of every authentication attempt with outcome, timestamp, and metadata.
- Graceful degradation when context cannot be restored (explicit user notification and safe fallback).

## Data & Constraints

- **AuthAttempt**: id, user_identifier, timestamp, outcome (success | invalid_credentials | locked | error), ip_address, user_agent, context_token_id
- **ContextToken**: id, target_url, state_payload (encrypted), created_at, expires_at, consumed (boolean)
- **LockoutRecord**: id, user_identifier, failed_count, lockout_start, lockout_end, released_by

### Constraints

- Maximum consecutive failed attempts before lockout: configurable (default 5).
- Lockout duration: configurable (default 15 minutes); escalates on repeated lockouts.
- Context token TTL: maximum 30 minutes; single-use upon successful login.
- Context state payload must not contain plaintext credentials or PII beyond what is necessary for navigation.
- All tokens encrypted at rest and in transit.
- Compliance with organizational password and session policies.

## User Scenarios & Testing

### Scenario 1 — Retry after incorrect credentials (happy path)

1. Account Manager navigates to a protected resource (deep link).
2. System redirects to login, generating a context token that encodes the target URL and state.
3. Account Manager enters incorrect credentials.
4. System responds with a clear error ("Invalid username or password") and preserves the login form with the context token intact.
5. Account Manager corrects credentials and submits again.
6. System authenticates successfully, consumes the context token, and redirects to the originally intended resource with state restored.

**Acceptance criteria (testable):**

- Given a failed login attempt with a valid context token, when the user retries with correct credentials, then the system redirects to the original target URL within 2 seconds of authentication success.
- The context token remains valid across up to (max_attempts − 1) failed retries within its TTL.
- The error message displayed does not reveal whether the username or password specifically was incorrect (security requirement).

### Scenario 2 — Account lockout after exceeding retry limit

1. Account Manager fails authentication the configured maximum number of consecutive times.
2. System locks the account, displays a lockout message with duration and support contact information.
3. Context token remains valid (not consumed) so that after lockout expires or support unlocks, the user can still authenticate and be redirected.

**Acceptance criteria (testable):**

- Given (max_attempts) consecutive failures, the system returns a lockout response and rejects further attempts until the lockout period expires.
- The lockout response includes the remaining lockout duration (in seconds) and a support contact mechanism.
- After lockout expires, the user can authenticate and the original context token is still honored if within TTL.

### Scenario 3 — Context token expiration

1. Account Manager fails login and leaves the page idle beyond the context token TTL.
2. Upon returning and successfully authenticating, the system detects the expired token.
3. System redirects to a default landing page and displays a notification explaining that the original destination could not be restored.

**Acceptance criteria (testable):**

- Given a context token older than its TTL, when authentication succeeds, then the system redirects to the default dashboard (not the expired target URL).
- A user-facing notification clearly states that the original context could not be restored.

### Scenario 4 — Concurrent sessions / token reuse prevention

- A consumed context token cannot be replayed. Attempting to use a consumed token results in redirection to the default landing page with no error escalation.

### Scenario 5 — System error during authentication

- If the authentication service is unavailable, the user sees a distinct system-error message (not a credentials error) and is advised to retry later. The context token is not consumed or invalidated.

## Functional Requirements (testable)

### 1. Context token generation

- **Given** an unauthenticated request to a protected resource, **When** the system redirects to the login endpoint, **Then** a context token is created containing the target URL and optional state payload, encrypted, with a TTL of ≤ 30 minutes.
- **Given** a context token is generated, **When** inspected externally, **Then** the payload is not readable without the server-side decryption key.

### 2. Authentication attempt processing

- **Given** a login request with valid credentials and a valid context token, **When** the system processes the request, **Then** it returns a success response containing a session token and the decoded target URL for redirection.
- **Given** a login request with invalid credentials, **When** the system processes the request, **Then** it returns HTTP 401 with a generic error code, increments the failed-attempt counter, and does **not** consume the context token.
- **Given** a login request when the account is locked, **When** the system processes the request, **Then** it returns HTTP 403 with a lockout error code, remaining lockout duration, and does not increment the counter further.

### 3. Retry limit enforcement and progressive back-off

- **Given** N consecutive failed attempts (where N < max_attempts), **When** the next attempt is made, **Then** the system enforces a progressive delay of (N × base_delay) seconds before processing.
- **Given** max_attempts consecutive failures, **When** the next attempt arrives, **Then** the system locks the account and records a LockoutRecord.

### 4. Context restoration on success

- **Given** a successful authentication with a valid, unconsumed context token, **When** the response is generated, **Then** the response includes the decoded target URL and state payload, and the token is marked consumed.
- **Given** a successful authentication with no context token or an expired/consumed token, **When** the response is generated, **Then** the system returns the default landing URL.

### 5. Audit logging

- **Given** any authentication attempt (success or failure), **When** the attempt is processed, **Then** an AuthAttempt record is persisted with user_identifier, timestamp, outcome, IP address, user agent, and associated context_token_id.
- Audit records are immutable and retained per organizational retention policy.

### 6. Rate limiting (IP-based)

- **Given** more than a configurable number of authentication requests from a single IP within a time window, **When** the threshold is exceeded, **Then** the system returns HTTP 429 with a Retry-After header.

### 7. Security

- Context tokens are single-use; replay of a consumed token is silently ignored (no error leak).
- Error responses never disclose whether the user_identifier exists in the system.
- All endpoints enforce TLS; tokens are encrypted at rest.

### 8. Accessibility

- Login form and error messages meet WCAG 2.1 AA (focus management on error, aria-live announcements for status changes).

### 9. Performance

- Authentication endpoint responds within 500 ms at p95 under normal load.
- Context token generation and validation add no more than 50 ms overhead.

### 10. Resilience

- Transient failures in the authentication backend do not consume or invalidate context tokens.
- The system degrades gracefully: if the context-token store is unavailable, authentication still proceeds (user lands on default page).

## Test-First Checklist

The following tests must be written (and initially failing) **before** implementing the corresponding behaviour:

| # | Test | Covers Requirement |
|---|------|--------------------|
| 1 | `POST /auth/login` with valid credentials + valid context token → 200, returns session + target URL | §2, §4 |
| 2 | `POST /auth/login` with invalid credentials → 401, generic error, failed counter incremented | §2 |
| 3 | `POST /auth/login` with invalid credentials does NOT consume context token | §2, §4 |
| 4 | After max_attempts failures → 403 lockout response with duration | §3 |
| 5 | Progressive delay enforced: Nth attempt delayed by N × base_delay | §3 |
| 6 | Successful login after (max_attempts − 1) failures resets counter and restores context | §3, §4 |
| 7 | Expired context token on successful login → default URL returned, notification flag set | §4 (Scenario 3) |
| 8 | Consumed context token on replay → default URL, no error escalation | §4 (Scenario 4) |
| 9 | Context token payload is encrypted and not readable without key | §1 |
| 10 | Context token generated with correct TTL and target URL on redirect | §1 |
| 11 | AuthAttempt audit record created for every login attempt with required fields | §5 |
| 12 | IP rate limit exceeded → 429 with Retry-After header | §6 |
| 13 | System error in auth backend → 503, context token not consumed | §5 (Scenario 5), §10 |
| 14 | Lockout expires → subsequent valid login succeeds and context token honored | §3 (Scenario 2) |
| 15 | Error response does not reveal user existence | §7 |

## Success Criteria (measurable & verifiable)

- **Retry success rate**: ≥ 95% of Account Managers who fail once and retry within the same session ultimately authenticate successfully without contacting support.
- **Context restoration accuracy**: 100% of successful logins with a valid context token redirect to the correct target URL with state intact.
- **Security compliance**: Zero instances of context token payload leakage in penetration testing; lockout enforced within 1 second of threshold breach.
- **Performance**: Authentication endpoint p95 latency ≤ 500 ms; context overhead ≤ 50 ms.
- **Audit completeness**: 100% of authentication attempts (success and failure) have corresponding audit records.
- **Accessibility**: Login and retry flows pass automated WCAG 2.1 AA checks and manual screen-reader testing.

## Key Entities

- **Account Manager** (user with account-management role)
- **AuthAttempt** (immutable log of each login attempt)
- **ContextToken** (encrypted, time-limited, single-use state carrier)
- **LockoutRecord** (tracks lockout state per user)
- **Session** (issued upon successful authentication)

## Assumptions

- The organization has an existing identity store; this feature wraps retry and context logic around it.
- Account Managers use modern browsers; progressive enhancement ensures the login form functions without JavaScript for basic submission.
- Email or SMS channels exist for account-unlock notifications but are out of scope for this feature's delivery.
- Lockout thresholds and durations are configurable at deployment time via environment or configuration service.

## Milestones (high-level)

1. **M1** — Define requirements, acceptance criteria, and write failing test suite (US 78202, US 78205 partial).
2. **M2** — Implement API endpoint, business logic, context token mechanism, and rate limiting (US 78203). All backend tests pass.
3. **M3** — Develop UI components: login form with retry UX, error display, context restoration redirect (US 78204).
4. **M4** — Complete integration tests, write unit tests for edge cases, and harden security (US 78205).
5. **M5** — Document API contracts and publish user guide for Account Managers and support staff (US 78206).

---

**Notes:**

- Lockout duration escalation policy (e.g., doubling on repeated lockouts) requires security team sign-off before M2.
- Exact progressive delay base value to be confirmed during M1 requirements finalization.
- Context token encryption algorithm and key rotation schedule to be aligned with platform security standards.