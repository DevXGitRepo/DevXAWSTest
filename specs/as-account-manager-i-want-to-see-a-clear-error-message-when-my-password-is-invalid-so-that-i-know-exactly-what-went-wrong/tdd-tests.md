# TDD Test Specifications: Invalid Password Error Message

## Overview
This feature ensures that when an Account Manager submits an invalid password during authentication (or password change/validation), the API returns a clear, specific error message indicating exactly what went wrong. The tests validate that the backend correctly identifies password invalidity, returns structured error responses with actionable messages, and distinguishes between different types of password failures (wrong password, policy violations, etc.).

The TDD approach focuses on the authentication/password validation API endpoint, the service layer that evaluates password validity, and the error response formatting.

---

## Unit Test Specifications

### Password Validation Service

- **Test:** should return error when password is empty
  - **Given:** A login/validation request with an empty password string
  - **When:** The password validation service is invoked
  - **Then:** Returns a validation failure with message "Password is required"
  - **Priority:** High
  - **TDD Phase:** Red → Write test expecting specific error object; Green → Implement empty check in validation service; Refactor → Extract validation rule pattern if needed later

- **Test:** should return error when password is null or missing from request
  - **Given:** A login/validation request with no password field provided
  - **When:** The password validation service is invoked
  - **Then:** Returns a validation failure with message "Password is required"
  - **Priority:** High
  - **TDD Phase:** Red → Write test for null/undefined password; Green → Add null check alongside empty check; Refactor → Consolidate with empty check into single "presence" validation

- **Test:** should return error when password does not match stored credential
  - **Given:** A valid account manager email/username and an incorrect password
  - **When:** The authentication service attempts credential verification
  - **Then:** Returns an authentication failure with message "The password you entered is incorrect. Please try again."
  - **Priority:** High
  - **TDD Phase:** Red → Write test with mocked credential store returning mismatch; Green → Implement password comparison logic; Refactor → Ensure timing-safe comparison

- **Test:** should return a structured error response object with field identifier
  - **Given:** Any password validation failure occurs
  - **When:** The error response is constructed
  - **Then:** The response includes `field: "password"`, `message: <specific error>`, and `code: <error_code>`
  - **Priority:** High
  - **TDD Phase:** Red → Assert on response shape; Green → Create error response builder; Refactor → Extract error response factory

- **Test:** should not reveal whether the username/email exists when password is wrong
  - **Given:** A login attempt with a valid username but wrong password
  - **When:** Authentication fails
  - **Then:** The error message is generic enough to not confirm account existence (e.g., "Invalid email or password") — OR if the design decision is to show field-specific errors post-username-validation, the message says "The password you entered is incorrect" without leaking additional account details
  - **Priority:** High
  - **TDD Phase:** Red → Write test asserting no user-existence leakage; Green → Ensure error message is consistent; Refactor → Review security posture

- **Test:** should return specific error when password violates minimum length policy
  - **Given:** A password change/set request with a password shorter than the minimum required length
  - **When:** The password policy validation service is invoked
  - **Then:** Returns error with message "Password must be at least [N] characters long"
  - **Priority:** Medium
  - **TDD Phase:** Red → Write test with short password; Green → Implement length check; Refactor → Make minimum length configurable

- **Test:** should return specific error when password violates complexity requirements
  - **Given:** A password change/set request missing required character types (e.g., uppercase, number, special character)
  - **When:** The password policy validation service is invoked
  - **Then:** Returns error with message specifying which requirement is not met (e.g., "Password must contain at least one uppercase letter")
  - **Priority:** Medium
  - **TDD Phase:** Red → Write test for each complexity rule; Green → Implement regex/rule checks; Refactor → Extract rules into configurable policy engine

- **Test:** should return specific error when password exceeds maximum length
  - **Given:** A password input exceeding the maximum allowed length (e.g., 128 characters)
  - **When:** The password validation service is invoked
  - **Then:** Returns error with message "Password must not exceed [N] characters"
  - **Priority:** Low
  - **TDD Phase:** Red → Write test with oversized password; Green → Add max length check; Refactor → Consolidate length checks

- **Test:** should return all applicable password policy violations at once
  - **Given:** A password that violates multiple policy rules simultaneously (too short AND missing special character)
  - **When:** The password policy validation service is invoked
  - **Then:** Returns an array of all violation messages, not just the first one found
  - **Priority:** Medium
  - **TDD Phase:** Red → Write test expecting multiple errors; Green → Collect all violations before returning; Refactor → Ensure consistent ordering of errors

### Error Response Formatting Service

- **Test:** should format error response with correct HTTP-appropriate error code
  - **Given:** A password validation failure
  - **When:** The error formatter processes the failure
  - **Then:** Maps to appropriate error code (e.g., `INVALID_PASSWORD`, `PASSWORD_POLICY_VIOLATION`)
  - **Priority:** High
  - **TDD Phase:** Red → Assert on error code field; Green → Implement code mapping; Refactor → Use enum/constant for error codes

- **Test:** should include a human-readable message suitable for display
  - **Given:** A password validation failure with internal error details
  - **When:** The error formatter processes the failure
  - **Then:** The `message` field contains user-friendly text (no stack traces, no internal identifiers)
  - **Priority:** High
  - **TDD Phase:** Red → Assert message is user-friendly; Green → Map internal errors to display messages; Refactor → Externalize message templates

- **Test:** should include the field name in the error response for client-side field association
  - **Given:** A password-specific validation error
  - **When:** The error response is generated
  - **Then:** The response contains `field: "password"` to allow the client to associate the error with the correct input
  - **Priority:** High
  - **TDD Phase:** Red → Assert field property exists; Green → Add field to error response; Refactor → Generalize for any field error

- **Test:** should not include sensitive information in error response
  - **Given:** A failed authentication attempt
  - **When:** The error response is generated
  - **Then:** The response does not contain the submitted password, password hash, internal user IDs, or stack traces
  - **Priority:** High
  - **TDD Phase:** Red → Assert absence of sensitive data; Green → Ensure only safe fields are serialized; Refactor → Add sanitization layer

---

## Integration Test Specifications

### Authentication API Endpoint - Invalid Password

- **Test:** POST /api/auth/login returns 401 with structured error when password is incorrect
  - **Given:** An existing account manager with email "manager@example.com" and a stored hashed password
  - **When:** A POST request is made to `/api/auth/login` with `{ "email": "manager@example.com", "password": "wrongpassword" }`
  - **Then:** Response status is 401, body contains `{ "success": false, "errors": [{ "field": "password", "code": "INVALID_CREDENTIALS", "message": "The email or password you entered is incorrect." }] }`
  - **Priority:** High

- **Test:** POST /api/auth/login returns 422 with structured error when password is empty
  - **Given:** A login request payload with an empty password
  - **When:** A POST request is made to `/api/auth/login` with `{ "email": "manager@example.com", "password": "" }`
  - **Then:** Response status is 422 (Unprocessable Entity), body contains `{ "success": false, "errors": [{ "field": "password", "code": "VALIDATION_ERROR", "message": "Password is required" }] }`
  - **Priority:** High

- **Test:** POST /api/auth/login returns 422 when password field is missing from request body
  - **Given:** A login request payload without a password field
  - **When:** A POST request is made to `/api/auth/login` with `{ "email": "manager@example.com" }`
  - **Then:** Response status is 422, body contains error with `field: "password"` and `message: "Password is required"`
  - **Priority:** High

- **Test:** POST /api/auth/login returns consistent error response timing regardless of user existence
  - **Given:** Two requests — one with a valid email + wrong password, one with a non-existent email + any password
  - **When:** Both requests are made to `/api/auth/login`
  - **Then:** Response times are within acceptable variance (no timing oracle), and both return the same error structure and message
  - **Priority:** Medium

- **Test:** POST /api/auth/login rate-limits after repeated invalid password attempts
  - **Given:** An account manager email with 5 consecutive failed password attempts
  - **When:** A 6th attempt is made with an incorrect password
  - **Then:** Response status is 429 (Too Many Requests), body contains `{ "success": false, "errors": [{ "code": "RATE_LIMITED", "message": "Too many failed attempts. Please try again in [N] minutes." }] }`
  - **Priority:** Medium

### Password Change API Endpoint - Policy Violations

- **Test:** POST /api/account/change-password returns 422 with policy violation errors
  - **Given:** An authenticated account manager session
  - **When:** A POST request is made to `/api/account/change-password` with `{ "currentPassword": "correct", "newPassword": "short" }`
  - **Then:** Response status is 422, body contains errors array with specific policy violation messages (e.g., `"Password must be at least 8 characters long"`)
  - **Priority:** Medium

- **Test:** POST /api/account/change-password returns 401 when current password is incorrect
  - **Given:** An authenticated account manager session
  - **When:** A POST request is made with `{ "currentPassword": "wrongcurrent", "newPassword": "ValidNew1!" }`
  - **Then:** Response status is 401, body contains `{ "errors": [{ "field": "currentPassword", "code": "INVALID_PASSWORD", "message": "Current password is incorrect" }] }`
  - **Priority:** High

- **Test:** POST /api/account/change-password returns multiple errors for multiple policy violations
  - **Given:** An authenticated account manager session
  - **When:** A POST request is made with a new password that violates multiple rules
  - **Then:** Response contains all applicable violation messages in the errors array
  - **Priority:** Medium

---

## Acceptance Test Scenarios

### US 89539: Implement inline error message display for invalid password

- **Scenario:** Account Manager receives clear error on wrong password during login
  - **Given:** An Account Manager with valid credentials exists in the system
  - **When:** The Account Manager submits a login request with the correct email but an incorrect password
  - **Then:** The API responds with a structured error containing `field: "password"` and a clear message explaining the password is incorrect, enabling the client to display the error inline near the password field

- **Scenario:** Account Manager receives clear error when password field is left empty
  - **Given:** An Account Manager is attempting to log in
  - **When:** The login request is submitted with an empty password field
  - **Then:** The API responds with a validation error containing `field: "password"` and message "Password is required", enabling inline display

- **Scenario:** Account Manager receives specific policy violation messages during password change
  - **Given:** An authenticated Account Manager is changing their password
  - **When:** The new password does not meet the password policy requirements
  - **Then:** The API responds with specific, actionable error messages for each violated rule (e.g., "must contain at least one number"), each associated with `field: "password"` or `field: "newPassword"`

- **Scenario:** Error response structure supports inline field-level display
  - **Given:** Any password validation error occurs
  - **When:** The API returns the error response
  - **Then:** The response structure includes a `field` property that maps to the specific input field, allowing the client to render the error message adjacent to the correct form field without additional logic

- **Scenario:** Account Manager is not confused by vague error messages
  - **Given:** An Account Manager submits an invalid password
  - **When:** The error response is returned
  - **Then:** The message is specific and actionable (NOT "An error occurred" or "Authentication failed"), clearly indicating the password is the problem and what action to take

---

## Test-First Development Guidelines

### Ordered Test Writing Sequence (Red Phase)

1. **Start with the error response structure** — Write a test asserting the shape of the error response object (`field`, `code`, `message`). This establishes the contract first.
2. **Empty/null password validation** — Write tests for missing password input. Simplest case, fastest to go green.
3. **Incorrect password authentication** — Write the test for wrong password returning the correct error. Core business logic.
4. **Security: no sensitive data leakage** — Write tests asserting passwords/hashes are never in responses.
5. **Password policy violations** — Write tests for each policy rule (length, complexity, max length).
6. **Multiple violations returned together** — Write test expecting array of errors.
7. **Rate limiting** — Write test for lockout after repeated failures.
8. **Timing consistency** — Write test ensuring no timing oracle.

### Implementation Sequence (Green Phase)

1. Implement error response DTO/model with `field`, `code`, `message` properties.
2. Implement request validation middleware (empty/null checks) → makes tests 2 pass.
3. Implement authentication service with password comparison → makes test 3 pass.
4. Add response sanitization → makes test 4 pass.
5. Implement password policy engine with configurable rules → makes tests 5-6 pass.
6. Add rate limiting middleware → makes test 7 pass.
7. Add timing-safe comparison → makes test 8 pass.

### Refactoring Considerations (Refactor Phase)

- **After 3+ error types exist:** Extract a generic `ValidationError` class/factory that all validators use.
- **After policy rules accumulate:** Extract a `PasswordPolicyEngine` with pluggable rules (Strategy pattern).
- **After error formatting is repeated:** Extract an `ErrorResponseBuilder` that standardizes all API error responses across the application.
- **After rate limiting is implemented:** Consider extracting rate limiting into reusable middleware applicable to other endpoints.
- **Ensure Single Responsibility:** Authentication service should not format errors — delegate to error formatter.
- **DRY on messages:** Externalize error message strings into a constants/config file for maintainability and potential i18n.

---

## Edge Cases & Boundary Tests

### Boundary Conditions

- **Test:** Password at exactly minimum length should pass validation (boundary: N characters)
  - **Given:** Password is exactly the minimum required length and meets all other rules
  - **When:** Validation is performed
  - **Then:** No length-related error is returned

- **Test:** Password at exactly maximum length should pass validation (boundary: 128 characters)
  - **Given:** Password is exactly 128 characters and meets all rules
  - **When:** Validation is performed
  - **Then:** No length-related error is returned

- **Test:** Password at minimum length minus one should fail
  - **Given:** Password is one character shorter than minimum
  - **When:** Validation is performed
  - **Then:** Returns minimum length error

- **Test:** Password at maximum length plus one should fail
  - **Given:** Password is 129 characters
  - **When:** Validation is performed
  - **Then:** Returns maximum length error

### Error Handling

- **Test:** Database/credential store unavailability returns generic server error, not password error
  - **Given:** The credential store is unreachable
  - **When:** A login attempt is made
  - **Then:** Returns 503 Service Unavailable with a generic error, NOT a password-specific error (to avoid misleading the user)
  - **Priority:** Medium

- **Test:** Malformed request body returns 400 Bad Request, not password validation error
  - **Given:** Request body is not valid JSON
  - **When:** The login endpoint receives the request
  - **Then:** Returns 400 with `"message": "Invalid request format"`, not a password-specific error
  - **Priority:** Low

- **Test:** Password containing only whitespace is treated as invalid
  - **Given:** Password field contains `"   "` (spaces only)
  - **When:** Validation is performed
  - **Then:** Returns "Password is required" (whitespace-only is treated as empty)
  - **Priority:** Medium

### Special Characters & Encoding

- **Test:** Password with unicode characters is validated correctly
  - **Given:** Password contains unicode characters (e.g., "Pässwörd1!")
  - **When:** Validation and authentication are performed
  - **Then:** Characters are handled correctly without encoding errors; validation rules apply to character count, not byte count
  - **Priority:** Low

- **Test:** Password with SQL injection attempt returns normal validation error
  - **Given:** Password field contains `"' OR 1=1 --"`
  - **When:** Authentication is attempted
  - **Then:** Returns standard "incorrect password" error (no SQL injection occurs, parameterized queries protect the system)
  - **Priority:** Medium

- **Test:** Password with XSS payload in error response is escaped
  - **Given:** Password field contains `"<script>alert('xss')</script>"`
  - **When:** The error response is generated
  - **Then:** The error message does not echo back the submitted password; response contains only the predefined error message text
  - **Priority:** Medium

### Concurrency & Timing

- **Test:** Concurrent login attempts with wrong password all receive correct error responses
  - **Given:** 10 simultaneous login requests with incorrect passwords for the same account
  - **When:** All requests are processed
  - **Then:** All 10 responses contain the correct structured error message (no race condition causing incorrect responses)
  - **Priority:** Low

- **Test:** Rate limit counter is accurate under concurrent requests
  - **Given:** Rate limit is set to 5 attempts
  - **When:** 6 concurrent requests arrive simultaneously
  - **Then:** At least one receives a 429 response (counter is thread-safe)
  - **Priority:** Medium

- **Test:** Account lockout from one session does not corrupt another user's session
  - **Given:** Account A is rate-limited due to failed attempts
  - **When:** Account B attempts to log in with correct credentials
  - **Then:** Account B succeeds normally; rate limiting is per-account, not global
  - **Priority:** High