# TDD Test Specifications: Login with Masked Password Display

## Overview

These test specifications validate the backend implementation of a secure login feature for Plant Operators. The feature ensures credential confidentiality by guaranteeing that passwords are never exposed in plain text through API responses, logs, or error messages. The "masked password display" requirement primarily affects the UI layer, but the backend must enforce that passwords are handled securely throughout the authentication pipeline — never returned in responses, properly hashed for storage, and transmitted only over secure channels.

The TDD approach follows a strict Red → Green → Refactor cycle, starting with authentication endpoint validation, progressing through business logic and security constraints, and culminating in integration tests that verify the full authentication flow.

---

## Unit Test Specifications

### 1. Authentication Endpoint — Request Validation

- **Test:** Should reject login request when username is missing
  - **Given:** A login request payload with no `username` field (only `password` provided)
  - **When:** POST request is sent to `/api/auth/login`
  - **Then:** Response returns HTTP 400 with error message indicating username is required
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting 400 for missing username; endpoint does not exist yet → fails
    - Green: Create endpoint with request validation that checks for username presence
    - Refactor: Extract validation logic into a reusable request validator

- **Test:** Should reject login request when password is missing
  - **Given:** A login request payload with no `password` field (only `username` provided)
  - **When:** POST request is sent to `/api/auth/login`
  - **Then:** Response returns HTTP 400 with error message indicating password is required
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting 400 for missing password → fails
    - Green: Add password presence check to validation logic
    - Refactor: Consolidate field-level validations into schema-based validation

- **Test:** Should reject login request when both username and password are missing
  - **Given:** An empty login request payload `{}`
  - **When:** POST request is sent to `/api/auth/login`
  - **Then:** Response returns HTTP 400 with error messages for both required fields
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test expecting 400 with multiple validation errors → fails
    - Green: Ensure validator reports all missing fields, not just the first
    - Refactor: Ensure consistent error response structure

- **Test:** Should reject login request when username exceeds maximum length
  - **Given:** A login request with `username` exceeding 255 characters
  - **When:** POST request is sent to `/api/auth/login`
  - **Then:** Response returns HTTP 400 with error indicating username exceeds maximum length
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test with oversized username → fails (no length check)
    - Green: Add max-length validation for username
    - Refactor: Parameterize length constraints via configuration

- **Test:** Should reject login request when password exceeds maximum length
  - **Given:** A login request with `password` exceeding 128 characters
  - **When:** POST request is sent to `/api/auth/login`
  - **Then:** Response returns HTTP 400 with error indicating password exceeds maximum length
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test with oversized password → fails
    - Green: Add max-length validation for password
    - Refactor: Unify field length validation rules

- **Test:** Should accept login request with valid username and password format
  - **Given:** A login request with valid `username` and `password` fields within acceptable lengths
  - **When:** POST request is sent to `/api/auth/login`
  - **Then:** Request passes validation (does not return 400 for validation errors)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting non-400 response for valid input → verify validation passes
    - Green: Ensure valid payloads pass through validation layer
    - Refactor: N/A

---

### 2. Authentication Service — Credential Verification

- **Test:** Should return authentication success for valid credentials
  - **Given:** A registered Plant Operator with username "operator1" and a known password hash in the database
  - **When:** Authentication service is called with username "operator1" and the correct plain-text password
  - **Then:** Service returns a success result containing an access token and user identity
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test calling auth service with valid creds → service doesn't exist → fails
    - Green: Implement auth service that looks up user, compares password hash, returns token
    - Refactor: Separate concerns — user lookup, password comparison, token generation

- **Test:** Should return authentication failure for incorrect password
  - **Given:** A registered Plant Operator with username "operator1"
  - **When:** Authentication service is called with username "operator1" and an incorrect password
  - **Then:** Service returns a failure result indicating invalid credentials
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test with wrong password expecting failure → fails (service may not distinguish)
    - Green: Implement password hash comparison that rejects mismatches
    - Refactor: Ensure timing-safe comparison to prevent timing attacks

- **Test:** Should return authentication failure for non-existent username
  - **Given:** No user exists with username "unknown_user"
  - **When:** Authentication service is called with username "unknown_user" and any password
  - **Then:** Service returns a failure result indicating invalid credentials (same message as wrong password)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test with non-existent user → fails
    - Green: Handle user-not-found case, return generic "invalid credentials" error
    - Refactor: Ensure error message does not reveal whether username or password was wrong (security)

- **Test:** Should use constant-time comparison for password verification
  - **Given:** A registered user with a known password hash
  - **When:** Authentication service compares the provided password against the stored hash
  - **Then:** The comparison uses a timing-safe/constant-time algorithm (verified via mock/spy on hashing library)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test verifying the hashing library's secure compare function is invoked → fails
    - Green: Use the secure comparison function from the hashing library
    - Refactor: Abstract password hashing behind an interface for testability

- **Test:** Should hash passwords using a strong algorithm (bcrypt/argon2/scrypt)
  - **Given:** A password "SecureP@ss123" to be verified
  - **When:** The password verification function is invoked
  - **Then:** It delegates to a recognized strong hashing algorithm (not MD5, not SHA-1 alone)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test asserting the hashing strategy uses bcrypt/argon2 → fails
    - Green: Configure password hasher with bcrypt/argon2
    - Refactor: Make hashing algorithm configurable via dependency injection

---

### 3. Password Confidentiality — Response Sanitization

- **Test:** Should never include password field in successful login response
  - **Given:** A valid login request that results in successful authentication
  - **When:** The API returns the success response
  - **Then:** The response body does not contain any field named `password`, `passwd`, `secret`, or `credential`
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test asserting response body has no password-related fields → fails if serializer includes them
    - Green: Ensure response DTO/serializer excludes password fields
    - Refactor: Create a response sanitizer that strips sensitive fields from all auth responses

- **Test:** Should never include password field in error response
  - **Given:** A login request with invalid credentials
  - **When:** The API returns the error response
  - **Then:** The response body does not echo back the submitted password
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test asserting error response does not contain submitted password value → fails
    - Green: Ensure error handler never reflects input password
    - Refactor: Apply global response filter for sensitive data

- **Test:** Should not log plain-text passwords in application logs
  - **Given:** A login request with password "MySecret123"
  - **When:** The request is processed by the authentication endpoint
  - **Then:** Application logs do not contain the string "MySecret123" (verified via log capture/mock)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test capturing log output and asserting password absence → fails if request logging includes body
    - Green: Implement request logging that redacts/masks password fields
    - Refactor: Create a log sanitization middleware that masks all sensitive fields

- **Test:** Should mask password in request audit trail
  - **Given:** A login request with password "MySecret123"
  - **When:** The request is recorded in the audit trail
  - **Then:** The audit record shows password as "****" or "[REDACTED]", not the actual value
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test checking audit record for masked password → fails
    - Green: Implement audit logging with field masking
    - Refactor: Generalize masking to a configurable list of sensitive fields

---

### 4. Token Generation

- **Test:** Should generate a valid JWT access token on successful login
  - **Given:** Successful credential verification for user "operator1"
  - **When:** Token generation service is invoked
  - **Then:** A JWT token is returned with valid structure (header.payload.signature)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting JWT structure from token service → service doesn't exist → fails
    - Green: Implement token generation returning a signed JWT
    - Refactor: Extract token configuration (expiry, issuer, audience) into config

- **Test:** Should include user identity claims in the token
  - **Given:** Successful authentication for user "operator1" with role "PlantOperator"
  - **When:** Token is generated
  - **Then:** Token payload contains `sub` (user ID), `username`, `role` claims
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test decoding token and asserting claims → fails
    - Green: Add user claims to token payload
    - Refactor: Define a claims builder that maps user entity to token claims

- **Test:** Should set appropriate token expiration
  - **Given:** Token generation configuration with expiry of 60 minutes
  - **When:** Token is generated
  - **Then:** Token `exp` claim is set to current time + 60 minutes (within tolerance)
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test asserting `exp` claim value → fails
    - Green: Set expiration in token generation
    - Refactor: Make expiration configurable and inject time provider for testability

- **Test:** Should generate a refresh token on successful login
  - **Given:** Successful credential verification
  - **When:** Login response is constructed
  - **Then:** Response includes a `refresh_token` field with a non-empty opaque string
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test expecting refresh_token in response → fails
    - Green: Generate and return refresh token
    - Refactor: Abstract refresh token storage strategy

---

### 5. Account Security — Lockout and Rate Limiting

- **Test:** Should increment failed login attempt counter on authentication failure
  - **Given:** A registered user "operator1" with 0 failed attempts
  - **When:** An incorrect password is submitted for "operator1"
  - **Then:** The failed attempt counter for "operator1" is incremented to 1
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test asserting counter increment → fails (no counter logic)
    - Green: Implement failed attempt tracking
    - Refactor: Extract attempt tracking into a dedicated service

- **Test:** Should lock account after maximum failed attempts exceeded
  - **Given:** A registered user "operator1" with 4 failed attempts (max is 5)
  - **When:** A 5th incorrect password is submitted
  - **Then:** The account is locked and response indicates account locked (HTTP 423 or specific error code)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting lockout after 5th failure → fails
    - Green: Implement lockout logic checking attempt count against threshold
    - Refactor: Make max attempts configurable; extract lockout policy

- **Test:** Should reject login for locked account even with correct credentials
  - **Given:** User "operator1" account is in locked state
  - **When:** Correct credentials are submitted for "operator1"
  - **Then:** Response returns HTTP 423 or appropriate error indicating account is locked
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test with correct creds on locked account → fails
    - Green: Add locked-account check before credential verification
    - Refactor: Order of checks — locked status before password comparison

- **Test:** Should reset failed attempt counter on successful login
  - **Given:** User "operator1" with 3 failed attempts
  - **When:** Correct credentials are submitted and authentication succeeds
  - **Then:** Failed attempt counter is reset to 0
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test asserting counter reset on success → fails
    - Green: Reset counter in success path
    - Refactor: Consolidate attempt management logic

- **Test:** Should enforce rate limiting on login endpoint
  - **Given:** A client IP that has made 10 login requests in the last minute
  - **When:** An 11th request is made within the same minute
  - **Then:** Response returns HTTP 429 Too Many Requests with `Retry-After` header
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test expecting 429 after rate limit exceeded → fails
    - Green: Implement rate limiting middleware for login endpoint
    - Refactor: Make rate limit thresholds configurable per endpoint

---

### 6. Input Sanitization and Security

- **Test:** Should reject login request with SQL injection attempt in username
  - **Given:** A login request with username `"admin'; DROP TABLE users;--"`
  - **When:** POST request is sent to `/api/auth/login`
  - **Then:** Request is either rejected (400) or safely handled without executing injected SQL
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test with SQL injection payload → verify no SQL execution
    - Green: Use parameterized queries / ORM that prevents injection
    - Refactor: Add input sanitization layer as defense-in-depth

- **Test:** Should reject login request with XSS payload in username
  - **Given:** A login request with username `"<script>alert('xss')</script>"`
  - **When:** POST request is sent to `/api/auth/login`
  - **Then:** Request is rejected with 400 or the payload is sanitized (not reflected in response)
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test with XSS payload → verify it's not reflected
    - Green: Implement input sanitization or strict character validation
    - Refactor: Apply character whitelist validation for username field

- **Test:** Should trim whitespace from username before processing
  - **Given:** A login request with username `"  operator1  "`
  - **When:** Authentication service processes the request
  - **Then:** Username is trimmed to `"operator1"` before lookup
  - **Priority:** Low
  - **TDD Phase:**
    - Red: Write test with whitespace-padded username → fails if not trimmed
    - Green: Add trim preprocessing to username
    - Refactor: Apply input normalization as a preprocessing step

- **Test:** Should treat password as case-sensitive
  - **Given:** A registered user with password "SecurePass123"
  - **When:** Login is attempted with password "securepass123" (different case)
  - **Then:** Authentication fails — passwords are case-sensitive
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test with different-case password expecting failure → verify
    - Green: Ensure no case normalization is applied to passwords
    - Refactor: N/A (ensure no accidental lowercasing in pipeline)

---

## Integration Test Specifications

### 1. Full Authentication Flow

- **Test:** Should complete full login flow from request to token response
  - **Given:** A registered Plant Operator user in the database with hashed password
  - **When:** A valid POST request with correct credentials is sent to `/api/auth/login`
  - **Then:** Response is HTTP 200 with JSON body containing `access_token`, `refresh_token`, `token_type: "Bearer"`, and `expires_in`
  - **Priority:** High