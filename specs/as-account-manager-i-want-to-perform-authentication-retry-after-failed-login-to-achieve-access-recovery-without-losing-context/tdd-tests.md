# TDD Test Specifications: Authentication Retry After Failed Login

## Overview

This specification defines comprehensive tests for an authentication retry mechanism that allows Account Managers to recover access after a failed login attempt without losing their session context (e.g., intended destination URL, form data, selected preferences). The feature encompasses an API endpoint for retry authentication, business logic for managing retry attempts with rate limiting, context preservation across retry cycles, and proper security controls.

All tests follow the Red → Green → Refactor cycle and are designed to be written BEFORE any implementation code.

---

## Unit Test Specifications

### 1. Authentication Retry Service — Core Retry Logic

- **Test:** should_successfully_authenticate_on_retry_with_valid_credentials
  - **Given:** A user has previously failed authentication and a retry session token exists
  - **When:** The user submits valid credentials via the retry mechanism
  - **Then:** Authentication succeeds, returns a valid access token, and the retry session is invalidated
  - **Priority:** High
  - **TDD Phase:** Red — Write test expecting successful auth response with token. Green — Implement minimal retry auth logic. Refactor — Extract token generation into shared auth service.

- **Test:** should_reject_retry_with_invalid_credentials
  - **Given:** A user has a valid retry session token
  - **When:** The user submits invalid credentials on retry
  - **Then:** Authentication fails, returns 401 Unauthorized, increments the retry attempt counter, and preserves the retry session
  - **Priority:** High
  - **TDD Phase:** Red — Assert 401 and counter increment. Green — Add credential validation and counter logic. Refactor — Separate counter management from auth logic.

- **Test:** should_enforce_maximum_retry_attempts
  - **Given:** A user has exhausted the maximum allowed retry attempts (e.g., 3 retries)
  - **When:** The user attempts another retry
  - **Then:** Returns 429 Too Many Requests, locks the retry session, and triggers a lockout event
  - **Priority:** High
  - **TDD Phase:** Red — Assert 429 response after max attempts. Green — Implement attempt counting with threshold check. Refactor — Extract retry policy into configurable strategy.

- **Test:** should_reject_retry_with_expired_retry_session
  - **Given:** A retry session token was issued but has exceeded its TTL (e.g., 5 minutes)
  - **When:** The user attempts to retry authentication
  - **Then:** Returns 401 with error code `RETRY_SESSION_EXPIRED`, and the user must restart the full login flow
  - **Priority:** High
  - **TDD Phase:** Red — Assert expiration error. Green — Add TTL validation on retry session. Refactor — Centralize session expiration logic.

- **Test:** should_reject_retry_with_invalid_retry_session_token
  - **Given:** A retry session token is malformed, tampered with, or does not exist in the store
  - **When:** The user attempts to retry authentication
  - **Then:** Returns 401 with error code `INVALID_RETRY_SESSION`
  - **Priority:** High
  - **TDD Phase:** Red — Assert invalid session error. Green — Add token validation. Refactor — Unify token validation across auth flows.

- **Test:** should_create_retry_session_on_initial_login_failure
  - **Given:** A user submits valid username but incorrect password on initial login
  - **When:** The authentication fails
  - **Then:** A retry session token is generated with metadata (attempt count = 1, timestamp, user context), and returned in the response
  - **Priority:** High
  - **TDD Phase:** Red — Assert retry session token in failure response. Green — Generate retry session on auth failure. Refactor — Extract retry session factory.

- **Test:** should_not_create_retry_session_for_nonexistent_user
  - **Given:** A login attempt is made with a username that does not exist
  - **When:** Authentication fails
  - **Then:** Returns generic 401 (no user enumeration), does NOT create a retry session
  - **Priority:** Medium
  - **TDD Phase:** Red — Assert no retry session for unknown user. Green — Add user existence check before retry session creation. Refactor — Ensure consistent error responses.

- **Test:** should_not_create_retry_session_for_locked_account
  - **Given:** A user's account is in a locked/disabled state
  - **When:** Authentication fails
  - **Then:** Returns 403 Forbidden with `ACCOUNT_LOCKED` error, does NOT create a retry session
  - **Priority:** Medium
  - **TDD Phase:** Red — Assert 403 and no retry session. Green — Check account status before retry session creation. Refactor — Extract account status checks into guard.

### 2. Context Preservation Service

- **Test:** should_preserve_intended_destination_url_across_retry
  - **Given:** A user was navigating to `/dashboard/reports?filter=quarterly` before login was required
  - **When:** A retry session is created
  - **Then:** The intended destination URL is stored in the retry session and retrievable after successful authentication
  - **Priority:** High
  - **TDD Phase:** Red — Assert context contains redirect URL after retry success. Green — Store and retrieve redirect URL in retry session. Refactor — Generalize context storage.

- **Test:** should_preserve_request_context_metadata_across_retry
  - **Given:** A user had form data or application state before authentication was required
  - **When:** A retry session is created with context payload
  - **Then:** The context payload (up to size limit) is stored and returned upon successful retry authentication
  - **Priority:** High
  - **TDD Phase:** Red — Assert context payload returned on success. Green — Implement context storage in retry session. Refactor — Add serialization abstraction.

- **Test:** should_reject_context_payload_exceeding_size_limit
  - **Given:** A context payload exceeds the maximum allowed size (e.g., 4KB)
  - **When:** The retry session creation is attempted
  - **Then:** Returns 400 Bad Request with `CONTEXT_PAYLOAD_TOO_LARGE` error
  - **Priority:** Medium
  - **TDD Phase:** Red — Assert 400 for oversized payload. Green — Add size validation. Refactor — Extract validation into middleware.

- **Test:** should_sanitize_context_payload_to_prevent_injection
  - **Given:** A context payload contains potentially malicious content (script tags, SQL injection patterns)
  - **When:** The retry session stores the context
  - **Then:** The payload is sanitized or rejected, and no unsafe content is persisted
  - **Priority:** High
  - **TDD Phase:** Red — Assert sanitized output or rejection. Green — Implement input sanitization. Refactor — Centralize sanitization utility.

- **Test:** should_return_preserved_context_only_to_authenticated_user
  - **Given:** A retry session with context exists for User A
  - **When:** User B successfully authenticates (even with the same retry token via interception)
  - **Then:** Context is NOT returned; the retry session is invalidated
  - **Priority:** High
  - **TDD Phase:** Red — Assert context not returned for mismatched user. Green — Bind context to user identity. Refactor — Strengthen session-user binding.

### 3. Rate Limiting and Security Service

- **Test:** should_apply_progressive_delay_between_retry_attempts
  - **Given:** A user has failed retry attempt N
  - **When:** The user immediately attempts retry N+1
  - **Then:** Returns 429 with `Retry-After` header indicating the required wait time (exponential backoff: 1s, 2s, 4s...)
  - **Priority:** High
  - **TDD Phase:** Red — Assert 429 with Retry-After header. Green — Implement backoff calculation. Refactor — Extract backoff strategy (configurable).

- **Test:** should_rate_limit_retry_attempts_by_ip_address
  - **Given:** Multiple retry attempts originate from the same IP address across different accounts
  - **When:** The aggregate attempts exceed the IP-level threshold (e.g., 10 per minute)
  - **Then:** All retry attempts from that IP are blocked with 429
  - **Priority:** Medium
  - **TDD Phase:** Red — Assert IP-level blocking. Green — Implement IP-based rate counter. Refactor — Extract rate limiter into reusable component.

- **Test:** should_emit_security_event_on_suspicious_retry_pattern
  - **Given:** A user has failed all allowed retry attempts
  - **When:** The maximum retry threshold is reached
  - **Then:** A security event is emitted (e.g., `AUTH_RETRY_EXHAUSTED`) with user ID, IP, timestamp, and attempt count
  - **Priority:** Medium
  - **TDD Phase:** Red — Assert event emission. Green — Add event publishing on threshold breach. Refactor — Use event bus abstraction.

- **Test:** should_invalidate_all_retry_sessions_on_password_reset
  - **Given:** A user has one or more active retry sessions
  - **When:** The user's password is reset (via another flow)
  - **Then:** All existing retry sessions for that user are invalidated
  - **Priority:** Medium
  - **TDD Phase:** Red — Assert sessions invalidated after password reset. Green — Add session cleanup on password change event. Refactor — Use domain event listener pattern.

### 4. Retry Session Token Management

- **Test:** should_generate_cryptographically_secure_retry_session_token
  - **Given:** A retry session needs to be created
  - **When:** The token is generated
  - **Then:** The token is at least 256 bits of entropy, URL-safe, and unique
  - **Priority:** High
  - **TDD Phase:** Red — Assert token length, format, and uniqueness. Green — Implement secure token generation. Refactor — Use shared crypto utility.

- **Test:** should_store_retry_session_with_ttl
  - **Given:** A retry session is created
  - **When:** The session is persisted
  - **Then:** It is stored with an automatic expiration (TTL) and is not retrievable after expiration
  - **Priority:** High
  - **TDD Phase:** Red — Assert session not found after TTL. Green — Implement TTL-based storage. Refactor — Abstract storage backend.

- **Test:** should_invalidate_retry_session_after_successful_authentication
  - **Given:** A valid retry session exists
  - **When:** The user successfully authenticates via retry
  - **Then:** The retry session is immediately deleted/invalidated and cannot be reused
  - **Priority:** High
  - **TDD Phase:** Red — Assert session invalid after success. Green — Delete session on successful auth. Refactor — Ensure atomic operation.

---

## Integration Test Specifications

### 1. API Endpoint Integration — POST /api/auth/retry

- **Test:** should_accept_retry_request_and_return_access_token
  - **Given:** A valid retry session exists in the data store, and the user submits correct credentials
  - **When:** POST /api/auth/retry is called with `{ retrySessionToken, username, password }`
  - **Then:** Returns 200 with `{ accessToken, refreshToken, context: { redirectUrl, payload } }`, retry session is removed from store
  - **Priority:** High

- **Test:** should_return_401_for_failed_retry_and_update_session
  - **Given:** A valid retry session exists with attempt count 1
  - **When:** POST /api/auth/retry is called with incorrect password
  - **Then:** Returns 401 with `{ error: "INVALID_CREDENTIALS", retriesRemaining: 1, retrySessionToken: "<same or refreshed>" }`, session attempt count is updated to 2
  - **Priority:** High

- **Test:** should_return_429_when_retry_limit_exhausted
  - **Given:** A retry session exists with attempt count equal to max (e.g., 3)
  - **When:** POST /api/auth/retry is called
  - **Then:** Returns 429 with `{ error: "RETRY_LIMIT_EXCEEDED", retryAfter: <seconds> }`, session is locked
  - **Priority:** High

- **Test:** should_return_400_for_malformed_retry_request
  - **Given:** The request body is missing required fields
  - **When:** POST /api/auth/retry is called with `{ retrySessionToken: "" }` (missing credentials)
  - **Then:** Returns 400 with validation errors listing missing fields
  - **Priority:** Medium

- **Test:** should_return_401_for_expired_retry_session_token
  - **Given:** A retry session was created 6 minutes ago (TTL is 5 minutes)
  - **When:** POST /api/auth/retry is called with the expired token
  - **Then:** Returns 401 with `{ error: "RETRY_SESSION_EXPIRED" }`
  - **Priority:** High

### 2. Initial Login Failure Integration — POST /api/auth/login

- **Test:** should_return_retry_session_on_login_failure_for_existing_user
  - **Given:** User "account.manager@company.com" exists with a valid account
  - **When:** POST /api/auth/login is called with incorrect password
  - **Then:** Returns 401 with `{ error: "INVALID_CREDENTIALS", retrySessionToken: "<token>", retryExpiresIn: 300 }`
  - **Priority:** High

- **Test:** should_include_context_in_retry_session_when_provided
  - **Given:** The login request includes context `{ redirectUrl: "/reports", formState: { ... } }`
  - **When:** POST /api/auth/login fails authentication
  - **Then:** The retry session stores the context, and it is returned on subsequent successful retry
  - **Priority:** High

### 3. Database/Store Integration

- **Test:** should_persist_and_retrieve_retry_session_from_store
  - **Given:** A retry session is created via the service
  - **When:** The session is retrieved by token from the data store
  - **Then:** All fields match (userId, attemptCount, context, createdAt, expiresAt)
  - **Priority:** High

- **Test:** should_auto_expire_retry_sessions_in_store
  - **Given:** A retry session is stored with a 5-minute TTL
  - **When:** 5 minutes elapse (simulated via time manipulation or TTL-based store)
  - **Then:** The session is no longer retrievable
  - **Priority:** Medium

- **Test:** should_handle_concurrent_retry_attempts_safely
  - **Given:** A retry session with 2 remaining attempts
  - **When:** Two retry requests arrive simultaneously
  - **Then:** Only one is processed (optimistic locking or atomic increment), the other receives 409 Conflict or 429
  - **Priority:** Medium

### 4. Event System Integration

- **Test:** should_publish_auth_retry_success_event
  - **Given:** A successful retry authentication occurs
  - **When:** The auth flow completes
  - **Then:** An event `AUTH_RETRY_SUCCESS` is published with userId, timestamp, attemptNumber
  - **Priority:** Low

- **Test:** should_publish_auth_retry_lockout_event
  - **Given:** A user exhausts all retry attempts
  - **When:** The final failed attempt is processed
  - **Then:** An event `AUTH_RETRY_LOCKOUT` is published with userId, IP, timestamp
  - **Priority:** Medium

---

## Acceptance Test Scenarios

### US 78203: Implement API Endpoint and Business Logic

- **Scenario:** Successful authentication recovery on first retry
  - **Given:** Account Manager "jane.doe@corp.com" failed initial login due to typo in password
  - **When:** She corrects the password and submits via POST /api/auth/retry with the retry session token
  - **Then:** She receives a valid access token and is redirected to her originally intended page

- **Scenario:** Context preserved across multiple retry attempts
  - **Given:** Account Manager was filling out a client onboarding form and session expired, triggering re-auth
  - **When:** She fails the first retry but succeeds on the second
  - **Then:** After successful authentication, the form state context is returned so the application can restore her work

- **Scenario:** Account lockout after exhausting retries
  - **Given:** Account Manager has failed 3 consecutive retry attempts
  - **When:** She attempts a 4th retry
  - **Then:** She receives a lockout response with instructions to reset password or contact support, and a security alert is generated

- **Scenario:** Retry session expires before use
  - **Given:** Account Manager received a retry session token 6 minutes ago
  - **When:** She attempts to use it
  - **Then:** She is informed the retry window has expired and must start a fresh login

### US 78202: Define Requirements and Acceptance Criteria

- **Scenario:** API contract validation for retry endpoint
  - **Given:** The API specification defines POST /api/auth/retry
  - **When:** A request is made conforming to the schema
  - **Then:** The response conforms to the documented response schema (success and error cases)

- **Scenario:** Security requirements met
  - **Given:** The retry mechanism is deployed
  - **When:** Automated security tests run (brute force simulation, token tampering, session hijacking)
  - **Then:** All attacks are mitigated per security requirements (rate limiting, token validation, user binding)

### US 78205: Write Unit and Integration Tests

- **Scenario:** All critical paths have test coverage
  - **Given:** The implementation is complete
  - **When:** The test suite runs
  - **Then:** Code coverage for the retry auth module is ≥ 90% for lines and ≥ 85% for branches

### US 78206: Document API and User Guide

- **Scenario:** API documentation accuracy
  - **Given:** The API documentation describes the retry endpoint
  - **When:** Each documented example request is executed against the running API
  - **Then:** The actual responses match the documented responses

---

## Test-First Development Guidelines

### Ordered Test Implementation Sequence (Red Phase)

1. **Start with the happy path:** `should_successfully_authenticate_on_retry_with_valid_credentials` — establishes the core contract.
2. **Add failure case:** `should_reject_retry_with_invalid_credentials` — validates error handling.
3. **Add retry session creation:** `should_create_retry_session_on_initial_login_failure` — establishes the entry point.
4. **Add session validation:** `should_reject_retry_with_expired_retry_session` and `should_reject_retry_with_invalid_retry_session_token`.
5. **Add rate limiting:** `should_enforce_maximum_retry_attempts` and `should_apply_progressive_delay_between_retry_attempts`.
6. **Add context preservation:** `should_preserve_intended_destination_url_across_retry` and `should_preserve_request_context_metadata_across_retry`.
7. **Add security tests:** Token generation, user binding, sanitization.
8. **Add integration tests:** Full API endpoint tests, store persistence, concurrency.

### Implementation Sequence (Green Phase)

1. Define the retry session data model (token, userId, attemptCount, context, createdAt, expiresAt).
2. Implement retry session store (in-memory first, then persistent).
3. Implement the retry authentication service with credential validation.
4. Implement the POST /api/auth/retry endpoint with request validation.
5. Modify POST /api/auth/login to generate retry sessions on failure.
6. Add rate limiting and backoff logic.
7. Add context preservation and retrieval.
8. Add security event emission.

### Refactoring Considerations (Refactor Phase)

- **After 3+ token validations:** Extract a `TokenValidator` abstraction.
- **After 3+ rate limit checks:** Extract a `RateLimiter` strategy pattern.
- **After 3+ session store operations:** Extract a `RetrySessionRepository` interface.
- **Separate concerns:** Auth logic vs. session management vs. rate limiting vs. context storage.
- **Apply Single Responsibility:** Each service class handles one concern.
- **Apply Open/Closed:** Rate limiting strategy and backoff algorithm should be configurable without modifying core logic.

---

## Edge Cases & Boundary Tests

### Boundary Conditions

- **Test:** should_allow_retry_at_exactly_max_attempts_minus_one
  - **Given:** Attempt count is at max - 1 (e.g., 2 of 3)
  - **When:** Retry is attempted
  - **Then:** Retry is allowed (this is the last chance)
  - **Priority:** Medium

- **Test:** should_reject_retry_at_exactly_max_attempts
  - **Given:** Attempt count equals max (e.g., 3 of 3)
  - **When:** Retry is attempted
  - **Then:** Returns 429 (lockout)
  - **Priority:** Medium

- **Test:** should_accept_retry_at_exactly_ttl_boundary
  - **Given:** Retry session was created exactly 299 seconds ago (TTL = 300s)
  - **When:** Retry is attempted
  - **Then:** Retry is accepted (session still valid)
  - **Priority:** Low

- **Test:** should_reject_retry_at_one_second_past_ttl
  - **Given:** Retry session was created exactly 301 seconds ago (TTL = 300s)
  - **When:** Retry is attempted
  - **Then:** Returns 401 RETRY_SESSION_EXPIRED
  - **Priority:** Low

- **Test:** should_handle_context_payload_at_exactly_size_limit
  - **Given:** Context payload is exactly 4096 bytes
  - **When:** Retry session is created
  - **Then:** Session is created successfully (boundary is inclusive)
  - **Priority:** Low

### Error Handling

- **Test:** should_return_503_when_session_store_is_unavailable
  - **Given:** The retry session data store is unreachable
  - **When:** POST /api/auth/retry is called
  - **Then:** Returns 503 Service Unavailable with appropriate error message
  - **Priority:** Medium

- **Test:** should_handle_corrupted_retry_session_data_gracefully
  - **Given:** A retry session exists in the store but its data is corrupted/unparseable
  - **When:** The session is retrieved during a retry attempt
  - **Then:** Returns 401 INVALID_RETRY_SESSION, logs the corruption, and removes the corrupted entry
  - **Priority:** Medium

- **Test:** should_not_leak_internal_errors_in_response
  - **Given:** An unexpected internal error occurs during retry processing
  - **When:** The error propagates
  - **Then:** Returns 500 with generic error message (no stack traces, no internal details)
  - **Priority:** High

- **Test:** should_handle_empty_string_credentials_gracefully
  - **Given:** Username or password is an empty string
  - **When:** POST /api/auth/retry is called
  - **Then:** Returns 400 with validation error (not a 500 or unhandled exception)
  - **Priority:** Medium

### Concurrency and Timing

- **Test:** should_prevent_retry_session_reuse_after_success (replay attack)
  - **Given:** A retry session token was used for successful authentication
  - **When:** The same token is submitted again
  - **Then:** Returns 401 INVALID_RETRY_SESSION (token already consumed)
  - **Priority:** High

- **Test:** should_handle_rapid_sequential_retry_requests
  - **Given:** A user submits 5 retry requests within 100ms
  - **When:** All requests are processed
  - **Then:** Only the first is processed normally; subsequent ones receive 429 with Retry-After
  - **Priority:** Medium

- **Test:** should_not_create_duplicate_retry_sessions_for_same_login_failure
  - **Given:** A login failure response is intercepted and replayed
  - **When:** The system receives duplicate failure signals
  - **Then:** Only one retry session exists for that login attempt (idempotent creation)
  - **Priority:** Medium

### Security Edge Cases

- **Test:** should_not_reveal_whether_username_exists_via_retry_session_presence
  - **Given:** Login fails for a non-existent user vs. an existing user with wrong password
  - **When:** Both responses are compared
  - **Then:** Response timing and structure are indistinguishable (prevent user enumeration)
  - **Priority:** High

- **Test:** should_bind_retry_session_to_originating_ip_or_fingerprint
  - **Given:** A retry session was created from IP 192.168.1.1
  - **When:** A retry attempt comes from IP 10.
0.0.1
  - **Then:** Returns 401 INVALID_RETRY_SESSION or requires additional verification (session-IP mismatch detected)
  - **Priority:** Medium

- **Test:** should_resist_timing_attacks_on_token_comparison
  - **Given:** An attacker submits retry session tokens that differ by one character progressively
  - **When:** Token validation occurs
  - **Then:** Response time is constant regardless of how many characters match (constant-time comparison)
  - **Priority:** High

- **Test:** should_reject_retry_session_token_with_modified_signature
  - **Given:** A retry session token is intercepted and its payload or signature is altered
  - **When:** The modified token is submitted via POST /api/auth/retry
  - **Then:** Returns 401 INVALID_RETRY_SESSION, and a security event is logged
  - **Priority:** High

- **Test:** should_not_allow_retry_session_token_to_be_used_for_different_user
  - **Given:** A retry session token was issued for user "jane.doe@corp.com"
  - **When:** An attacker submits the token with credentials for "admin@corp.com"
  - **Then:** Returns 401 with `USER_SESSION_MISMATCH` error, session is invalidated, and a security alert is emitted
  - **Priority:** High

- **Test:** should_enforce_https_only_for_retry_endpoint
  - **Given:** The retry endpoint is called over plain HTTP
  - **When:** The request reaches the server
  - **Then:** Returns 301/308 redirect to HTTPS or 403 Forbidden (depending on infrastructure policy)
  - **Priority:** Medium

### Data Integrity Edge Cases

- **Test:** should_handle_unicode_and_special_characters_in_credentials
  - **Given:** A user's password contains unicode characters (e.g., "pässwörd™🔐")
  - **When:** POST /api/auth/retry is called with these credentials
  - **Then:** Authentication succeeds if the password matches (proper encoding handling)
  - **Priority:** Medium

- **Test:** should_handle_extremely_long_password_without_dos
  - **Given:** A password of 10,000 characters is submitted
  - **When:** POST /api/auth/retry processes the request
  - **Then:** Returns 400 with `PASSWORD_TOO_LONG` before any hashing occurs (prevents hash-based DoS)
  - **Priority:** Medium

- **Test:** should_preserve_context_data_integrity_through_storage_cycle
  - **Given:** Context payload contains special characters, nested JSON, and edge-case values (null, empty arrays, zero)
  - **When:** The context is stored and then retrieved after successful retry
  - **Then:** The retrieved context is byte-for-byte identical to the original input
  - **Priority:** Medium

- **Test:** should_handle_missing_optional_context_gracefully
  - **Given:** A login failure occurs without any context payload (user navigated directly to login)
  - **When:** The retry session is created
  - **Then:** Session is created successfully with null/empty context; successful retry returns response without context field or with null context
  - **Priority:** Low

### Cleanup and Lifecycle Edge Cases

- **Test:** should_cleanup_orphaned_retry_sessions_on_scheduled_basis
  - **Given:** Multiple retry sessions have expired but were never explicitly invalidated
  - **When:** The cleanup job runs
  - **Then:** All expired sessions are removed from the store, and a metric is emitted with the count of cleaned sessions
  - **Priority:** Low

- **Test:** should_limit_active_retry_sessions_per_user
  - **Given:** A user has 5 active retry sessions (from multiple login attempts)
  - **When:** A 6th login failure occurs
  - **Then:** The oldest retry session is invalidated, and the new one is created (max 5 concurrent sessions per user)
  - **Priority:** Medium

- **Test:** should_invalidate_retry_sessions_on_successful_login_via_primary_flow
  - **Given:** A user has an active retry session
  - **When:** The user successfully logs in through the normal login endpoint (not retry)
  - **Then:** All existing retry sessions for that user are invalidated
  - **Priority:** Medium

---

## API Contract Summary (for test implementation reference)

### POST /api/auth/login (modified)
**Failure Response Addition:**
```
{
  "error": "INVALID_CREDENTIALS",
  "retrySessionToken": "<token>",
  "retryExpiresIn": 300,
  "retriesAllowed": 3
}
```

### POST /api/auth/retry
**Request:**
```
{
  "retrySessionToken": "<token>",
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**
```
{
  "accessToken": "<jwt>",
  "refreshToken": "<token>",
  "expiresIn": 3600,
  "context": {
    "redirectUrl": "/dashboard/reports",
    "payload": { ... }
  }
}
```

**Failure Responses:**
- 400: Validation errors
- 401: INVALID_CREDENTIALS, RETRY_SESSION_EXPIRED, INVALID_RETRY_SESSION, USER_SESSION_MISMATCH
- 403: ACCOUNT_LOCKED
- 429: RETRY_LIMIT_EXCEEDED (with Retry-After header)
- 503: Service unavailable

---

## Test Coverage Matrix

| Requirement Area | Unit Tests | Integration Tests | Acceptance Tests | Edge Cases |
|---|---|---|---|---|
| Core retry auth | 8 | 5 | 4 | 4 |
| Context preservation | 5 | 2 | 1 | 4 |
| Rate limiting/security | 4 | 2 | 1 | 6 |
| Session management | 3 | 3 | 1 | 4 |
| **Total** | **20** | **12** | **7** | **18** |

**Total test specifications: 57**

All tests are designed to be framework-agnostic and traceable to the acceptance criteria defined in US 78202 and implemented in US 78203. The test suite should be executed in CI/CD pipelines with every commit, and all tests must pass before any merge to the main branch.