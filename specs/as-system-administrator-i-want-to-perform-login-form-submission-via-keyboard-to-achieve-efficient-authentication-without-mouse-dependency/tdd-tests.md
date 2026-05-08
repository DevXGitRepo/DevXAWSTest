# TDD Test Specifications: Login Form Submission via Keyboard (API & Backend)

## Overview

This feature enables System Administrators to authenticate via keyboard-driven form submission (e.g., pressing Enter) without mouse dependency. While the keyboard interaction itself is a UI concern, the **backend authentication API endpoint, business logic, input validation, and session management** are fully testable via TDD.

These specifications focus on:
- The authentication API endpoint (`POST /api/auth/login`)
- Input validation and sanitization
- Business logic (credential verification, account lockout, rate limiting)
- Session/token generation
- Error handling and security considerations

The keyboard submission mechanism simply triggers the same API call as a button click — the backend must handle the request identically regardless of submission method.

---

## Unit Test Specifications

### 1. Input Validation

- **Test:** should reject request when username field is missing
  - **Given:** A login request payload with no `username` field
  - **When:** The validation layer processes the request
  - **Then:** Returns validation error with message "Username is required" and status 400
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting 400 with specific error message; Green — implement field-presence check; Refactor — extract to reusable validator

- **Test:** should reject request when password field is missing
  - **Given:** A login request payload with no `password` field
  - **When:** The validation layer processes the request
  - **Then:** Returns validation error with message "Password is required" and status 400
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting 400; Green — add password presence check; Refactor — consolidate with username validation

- **Test:** should reject request when username is empty string
  - **Given:** A login request payload with `username: ""`
  - **When:** The validation layer processes the request
  - **Then:** Returns validation error with message "Username must not be empty" and status 400
  - **Priority:** High
  - **TDD Phase:** Red → Green → Refactor with trimming logic

- **Test:** should reject request when password is empty string
  - **Given:** A login request payload with `password: ""`
  - **When:** The validation layer processes the request
  - **Then:** Returns validation error with message "Password must not be empty" and status 400
  - **Priority:** High
  - **TDD Phase:** Red → Green → Refactor alongside username empty check

- **Test:** should reject username exceeding maximum length
  - **Given:** A login request with `username` of 256 characters
  - **When:** The validation layer processes the request
  - **Then:** Returns validation error with message "Username exceeds maximum length" and status 400
  - **Priority:** Medium
  - **TDD Phase:** Red — define max length constant; Green — implement length check; Refactor — parameterize length limits

- **Test:** should reject password exceeding maximum length
  - **Given:** A login request with `password` of 1024 characters
  - **When:** The validation layer processes the request
  - **Then:** Returns validation error with message "Password exceeds maximum length" and status 400
  - **Priority:** Medium
  - **TDD Phase:** Red → Green → Refactor with configurable limits

- **Test:** should trim whitespace from username before processing
  - **Given:** A login request with `username: "  admin  "`
  - **When:** The validation layer sanitizes the input
  - **Then:** The username passed to the authentication service is `"admin"`
  - **Priority:** Medium
  - **TDD Phase:** Red — assert trimmed value reaches service; Green — add trim; Refactor — centralize sanitization

- **Test:** should NOT trim or modify password value
  - **Given:** A login request with `password: "  my password  "`
  - **When:** The validation layer sanitizes the input
  - **Then:** The password passed to the authentication service remains `"  my password  "`
  - **Priority:** High
  - **TDD Phase:** Red — assert password passes through unmodified; Green — ensure no trim on password

- **Test:** should reject request with invalid content type
  - **Given:** A login request sent with `Content-Type: text/plain`
  - **When:** The request reaches the endpoint
  - **Then:** Returns status 415 Unsupported Media Type
  - **Priority:** Medium
  - **TDD Phase:** Red → Green → Refactor into middleware

- **Test:** should sanitize username to prevent injection attacks
  - **Given:** A login request with `username: "admin'; DROP TABLE users;--"`
  - **When:** The validation layer processes the request
  - **Then:** The input is either rejected or safely escaped before reaching the data layer
  - **Priority:** High
  - **TDD Phase:** Red — verify no raw SQL/NoSQL injection passes through; Green — implement sanitization; Refactor — extract to security utility

---

### 2. Authentication Service Logic

- **Test:** should return authentication token for valid credentials
  - **Given:** A registered user with username `"sysadmin"` and correct password
  - **When:** The authentication service verifies the credentials
  - **Then:** Returns a valid authentication token (JWT or session token)
  - **Priority:** High
  - **TDD Phase:** Red — expect token in response; Green — implement credential check and token generation; Refactor — separate concerns (verification vs. token creation)

- **Test:** should return authentication failure for invalid password
  - **Given:** A registered user with username `"sysadmin"` and an incorrect password
  - **When:** The authentication service verifies the credentials
  - **Then:** Returns authentication failure with generic message "Invalid credentials"
  - **Priority:** High
  - **TDD Phase:** Red — expect failure response; Green — implement password comparison; Refactor — ensure timing-safe comparison

- **Test:** should return authentication failure for non-existent username
  - **Given:** A login attempt with username `"nonexistent_user"`
  - **When:** The authentication service verifies the credentials
  - **Then:** Returns authentication failure with generic message "Invalid credentials" (same as wrong password)
  - **Priority:** High
  - **TDD Phase:** Red → Green → Refactor — ensure error message does not reveal whether username exists

- **Test:** should use constant-time comparison for password verification
  - **Given:** A login attempt with valid username and incorrect password
  - **When:** The authentication service compares passwords
  - **Then:** The comparison uses a timing-safe equality function (not direct string equality)
  - **Priority:** High
  - **TDD Phase:** Red — mock/spy on comparison utility; Green — use secure comparison; Refactor — document security rationale

- **Test:** should hash password lookup not expose raw password in logs or errors
  - **Given:** A login attempt that triggers an internal error
  - **When:** The error is logged or returned
  - **Then:** The password value is never present in log output or error response body
  - **Priority:** High
  - **TDD Phase:** Red — assert password absent from error/log output; Green — implement redaction; Refactor — centralize sensitive field masking

- **Test:** should verify user has System Administrator role upon successful authentication
  - **Given:** A valid login for a user with role `"system_administrator"`
  - **When:** Authentication succeeds
  - **Then:** The token/session includes role information confirming admin privileges
  - **Priority:** Medium
  - **TDD Phase:** Red — check role claim in token; Green — embed role in token payload; Refactor — generalize for multiple roles

- **Test:** should reject authentication for disabled/inactive accounts
  - **Given:** A user account with `status: "disabled"` and correct credentials
  - **When:** The authentication service verifies the credentials
  - **Then:** Returns failure with message "Account is disabled" and status 403
  - **Priority:** High
  - **TDD Phase:** Red → Green → Refactor — separate account status check from credential verification

---

### 3. Account Lockout Logic

- **Test:** should increment failed login attempt counter on invalid credentials
  - **Given:** A registered user with 0 failed attempts
  - **When:** An authentication attempt fails due to wrong password
  - **Then:** The failed attempt counter for that user increments to 1
  - **Priority:** High
  - **TDD Phase:** Red — assert counter incremented; Green — implement counter logic; Refactor — extract to lockout service

- **Test:** should lock account after 5 consecutive failed attempts
  - **Given:** A user with 4 consecutive failed login attempts
  - **When:** A 5th failed attempt occurs
  - **Then:** The account is locked and subsequent attempts return "Account locked" with status 423
  - **Priority:** High
  - **TDD Phase:** Red — simulate 5 failures, expect lockout; Green — implement threshold check; Refactor — make threshold configurable

- **Test:** should reset failed attempt counter on successful login
  - **Given:** A user with 3 failed attempts who then provides correct credentials
  - **When:** Authentication succeeds
  - **Then:** The failed attempt counter resets to 0
  - **Priority:** High
  - **TDD Phase:** Red → Green → Refactor

- **Test:** should automatically unlock account after lockout duration expires
  - **Given:** A locked account with lockout timestamp 31 minutes ago (lockout duration: 30 min)
  - **When:** A new login attempt is made with correct credentials
  - **Then:** The account is unlocked, counter resets, and authentication succeeds
  - **Priority:** Medium
  - **TDD Phase:** Red — mock time; Green — implement duration check; Refactor — extract time utility

- **Test:** should return remaining lockout time in error response for locked accounts
  - **Given:** A locked account with 15 minutes remaining in lockout period
  - **When:** A login attempt is made
  - **Then:** Response includes `retry_after` field indicating seconds until unlock
  - **Priority:** Low
  - **TDD Phase:** Red → Green → Refactor

---

### 4. Token Generation

- **Test:** should generate token with correct expiration time
  - **Given:** Successful authentication with configured token TTL of 3600 seconds
  - **When:** A token is generated
  - **Then:** The token's expiration claim is set to current time + 3600 seconds
  - **Priority:** High
  - **TDD Phase:** Red — freeze time, assert expiration; Green — implement expiry logic; Refactor — make TTL configurable

- **Test:** should include user identifier in token payload
  - **Given:** Successful authentication for user with ID `"usr_12345"`
  - **When:** A token is generated
  - **Then:** The token payload contains `sub: "usr_12345"`
  - **Priority:** High
  - **TDD Phase:** Red → Green → Refactor

- **Test:** should include issued-at timestamp in token
  - **Given:** Successful authentication at a known timestamp
  - **When:** A token is generated
  - **Then:** The token contains `iat` claim matching the current timestamp
  - **Priority:** Medium
  - **TDD Phase:** Red → Green → Refactor

- **Test:** should generate unique token for each successful authentication
  - **Given:** The same user authenticates twice in succession
  - **When:** Two tokens are generated
  - **Then:** The two tokens are not identical
  - **Priority:** Medium
  - **TDD Phase:** Red — authenticate twice, compare tokens; Green — ensure unique jti or timestamp; Refactor — add jti claim

---

### 5. Rate Limiting

- **Test:** should allow requests under rate limit threshold
  - **Given:** An IP address that has made 9 requests in the current window (limit: 10)
  - **When:** A 10th request arrives
  - **Then:** The request is processed normally
  - **Priority:** Medium
  - **TDD Phase:** Red → Green → Refactor

- **Test:** should reject requests exceeding rate limit with 429 status
  - **Given:** An IP address that has made 10 requests in the current 1-minute window
  - **When:** An 11th request arrives
  - **Then:** Returns status 429 Too Many Requests with `Retry-After` header
  - **Priority:** High
  - **TDD Phase:** Red — simulate burst; Green — implement rate limiter; Refactor — extract to middleware

- **Test:** should reset rate limit counter after time window expires
  - **Given:** An IP address that was rate-limited in the previous window
  - **When:** A new time window begins and a request arrives
  - **Then:** The request is processed normally
  - **Priority:** Medium
  - **TDD Phase:** Red — mock time advancement; Green — implement window reset; Refactor — parameterize window size

---

## Integration Test Specifications

### 1. API Endpoint Integration

- **Test:** should accept POST /api/auth/login with valid JSON body and return 200 with token
  - **Given:** A running API server and a registered user in the database
  - **When:** A POST request is sent to `/api/auth/login` with valid `username` and `password` in JSON body
  - **Then:** Response status is 200, body contains `token` field, and `Content-Type` is `application/json`
  - **Priority:** High

- **Test:** should return 400 for malformed JSON body
  - **Given:** A running API server
  - **When:** A POST request is sent to `/api/auth/login` with malformed JSON (`{username: }`)
  - **Then:** Response status is 400 with error message "Invalid request body"
  - **Priority:** High

- **Test:** should return 405 for non-POST methods on login endpoint
  - **Given:** A running API server
  - **When:** A GET/PUT/DELETE request is sent to `/api/auth/login`
  - **Then:** Response status is 405 Method Not Allowed
  - **Priority:** Medium

- **Test:** should persist failed login attempt to database
  - **Given:** A running API server with database connection and a registered user
  - **When:** A login attempt with wrong password is made via the API
  - **Then:** The failed attempt is recorded in the database with timestamp and IP address
  - **Priority:** High

- **Test:** should return consistent response time for valid and invalid usernames
  - **Given:** A running API server
  - **When:** Login attempts are made with a valid username (wrong password) and a non-existent username
  - **Then:** Response times are within acceptable variance (< 100ms difference) to prevent timing attacks
  - **Priority:** High

### 2. Database Integration

- **Test:** should retrieve user record by username from database
  - **Given:** A user record exists in the database with username `"sysadmin"`
  - **When:** The user repository queries by username
  - **Then:** The correct user record is returned with all required fields (id, hashed_password, role, status)
  - **Priority:** High

- **Test:** should update last_login timestamp on successful authentication
  - **Given:** A user authenticates successfully
  - **When:** The authentication flow completes
  - **Then:** The user's `last_login` field in the database is updated to the current timestamp
  - **Priority:** Medium

- **Test:** should handle database connection failure gracefully
  - **Given:** The database is unreachable
  - **When:** A login attempt is made
  - **Then:** Returns status 503 Service Unavailable with message "Authentication service temporarily unavailable"
  - **Priority:** High

### 3. Session/Token Store Integration

- **Test:** should store issued token reference for revocation capability
  - **Given:** A successful authentication
  - **When:** A token is issued
  - **Then:** A token reference (jti) is stored in the session store with the token's TTL
  - **Priority:** Medium

- **Test:** should handle session store unavailability gracefully
  - **Given:** The session/token store is unreachable
  - **When:** A login attempt is made
  - **Then:** Returns status 503 or falls back to stateless token (based on configuration)
  - **Priority:** Medium

---

## Acceptance Test Scenarios

### US 86200: Implement API Endpoint and Business Logic

- **Scenario:** Successful login via API produces valid session
  - **Given:** A System Administrator account exists with username `"admin"` and a known password
  - **When:** A POST request to `/api/auth/login` is made with correct credentials
  - **Then:** Response contains a valid authentication token, status 200, and the token can be used to access protected resources

- **Scenario:** Failed login returns appropriate error without leaking information
  - **Given:** A System Administrator account exists with username `"admin"`
  - **When:** A POST request to `/api/auth/login` is made with incorrect password
  - **Then:** Response status is 401, body contains generic "Invalid credentials" message, and no information about whether the username exists is revealed

- **Scenario:** Multiple rapid submissions (keyboard repeat) are handled safely
  - **Given:** A System Administrator submits login form rapidly (simulating held Enter key)
  - **When:** Multiple identical POST requests arrive within 1 second
  - **Then:** Only the first valid request is fully processed; subsequent duplicates are either dedupl