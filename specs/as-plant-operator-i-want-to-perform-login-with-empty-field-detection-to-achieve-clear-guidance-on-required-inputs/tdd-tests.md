# TDD Test Specifications: Login with Empty Field Detection

## Overview
These test specifications validate the backend API endpoint and business logic for a login feature that detects empty/missing fields (username and password) and returns clear, actionable error messages to guide the Plant Operator on required inputs. The TDD approach ensures that validation logic, error messaging, and authentication flow are built incrementally — failing test first, minimal implementation second, refactoring third.

## Unit Test Specifications

### 1. Empty Field Detection — Username

- **Test:** should reject login when username is empty string
  - **Given:** A login request payload with `username: ""` and `password: "validPassword123"`
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with an error indicating the username field is required; no authentication attempt is made
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting a validation error object with field `username` and message indicating it is required
    - Green: Implement validation check for empty string username
    - Refactor: Extract field-level validation into a reusable validator

- **Test:** should reject login when username is null
  - **Given:** A login request payload with `username: null` and `password: "validPassword123"`
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with an error indicating the username field is required
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting validation error for null username
    - Green: Add null check to username validation
    - Refactor: Consolidate null/empty checks into a single "is blank" utility

- **Test:** should reject login when username is missing from payload
  - **Given:** A login request payload with only `password: "validPassword123"` (no username key)
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with an error indicating the username field is required
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting validation error for missing username field
    - Green: Add undefined/missing key check
    - Refactor: Unify with existing blank checks

- **Test:** should reject login when username contains only whitespace
  - **Given:** A login request payload with `username: "   "` and `password: "validPassword123"`
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with an error indicating the username field is required
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test expecting validation error for whitespace-only username
    - Green: Trim input before checking emptiness
    - Refactor: Ensure trimming is applied consistently across all string fields

### 2. Empty Field Detection — Password

- **Test:** should reject login when password is empty string
  - **Given:** A login request payload with `username: "operator1"` and `password: ""`
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with an error indicating the password field is required; no authentication attempt is made
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting a validation error for empty password
    - Green: Implement validation check for empty string password
    - Refactor: Reuse shared blank-check utility from username validation

- **Test:** should reject login when password is null
  - **Given:** A login request payload with `username: "operator1"` and `password: null`
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with an error indicating the password field is required
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting validation error for null password
    - Green: Add null check to password validation
    - Refactor: Confirm shared utility handles this case

- **Test:** should reject login when password is missing from payload
  - **Given:** A login request payload with only `username: "operator1"` (no password key)
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with an error indicating the password field is required
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting validation error for missing password field
    - Green: Add undefined/missing key check for password
    - Refactor: Ensure consistent pattern with username handling

- **Test:** should reject login when password contains only whitespace
  - **Given:** A login request payload with `username: "operator1"` and `password: "    "`
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with an error indicating the password field is required
  - **Priority:** Medium
  - **TDD Phase:**
    - Red: Write test expecting validation error for whitespace-only password
    - Green: Apply trim-then-check logic to password
    - Refactor: Confirm shared trimming utility is used

### 3. Empty Field Detection — Both Fields Empty

- **Test:** should reject login and report both fields when username and password are both empty
  - **Given:** A login request payload with `username: ""` and `password: ""`
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with errors for BOTH fields; error response contains two distinct error entries (one for username, one for password)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting an array/collection of two validation errors
    - Green: Ensure validation collects all errors rather than short-circuiting on first failure
    - Refactor: Confirm error aggregation pattern is clean and extensible

- **Test:** should reject login and report both fields when entire payload is empty object
  - **Given:** A login request payload that is an empty object `{}`
  - **When:** The login validation service processes the request
  - **Then:** Validation fails with errors for both username and password fields
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test with empty object payload
    - Green: Validation handles missing keys for both fields
    - Refactor: No additional refactoring needed if prior patterns hold

### 4. Error Message Clarity and Structure

- **Test:** should return a structured error response with field name and human-readable message for username
  - **Given:** A login request with `username: ""` and `password: "validPassword123"`
  - **When:** The login validation service processes the request
  - **Then:** The error response contains `{ field: "username", message: "Username is required" }` (or equivalent structured format)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Assert specific error structure with field identifier and descriptive message
    - Green: Return structured error object from validation
    - Refactor: Define a standard error DTO/schema

- **Test:** should return a structured error response with field name and human-readable message for password
  - **Given:** A login request with `username: "operator1"` and `password: ""`
  - **When:** The login validation service processes the request
  - **Then:** The error response contains `{ field: "password", message: "Password is required" }` (or equivalent structured format)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Assert specific error structure for password field
    - Green: Return structured error for password
    - Refactor: Ensure consistent DTO usage

- **Test:** should not reveal sensitive information in error messages
  - **Given:** A login request with any combination of empty fields
  - **When:** The login validation service processes the request
  - **Then:** Error messages do not contain password values, internal system details, stack traces, or database information
  - **Priority:** High
  - **TDD Phase:**
    - Red: Assert error response does not contain sensitive patterns
    - Green: Ensure error construction only uses safe, predefined messages
    - Refactor: Centralize error message constants

### 5. Successful Validation Pass-Through

- **Test:** should pass validation when both username and password are provided and non-empty
  - **Given:** A login request payload with `username: "operator1"` and `password: "SecurePass123"`
  - **When:** The login validation service processes the request
  - **Then:** Validation passes with no errors; request proceeds to authentication logic
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting validation success (no errors returned)
    - Green: Ensure validation returns success/clean state for valid inputs
    - Refactor: Separate validation concern from authentication concern cleanly

- **Test:** should not authenticate user when validation fails
  - **Given:** A login request with `username: ""` and `password: "SecurePass123"`
  - **When:** The login service processes the request
  - **Then:** The authentication service/repository is never called
  - **Priority:** High
  - **TDD Phase:**
    - Red: Mock authentication dependency; assert it is NOT invoked
    - Green: Short-circuit before authentication when validation fails
    - Refactor: Ensure clean separation of validation and authentication layers

### 6. Authentication Logic (Post-Validation)

- **Test:** should return authentication success with token when credentials are valid
  - **Given:** A login request with `username: "operator1"` and `password: "CorrectPassword"` and the user exists with matching credentials
  - **When:** The login service processes the request
  - **Then:** Response contains an authentication token/session identifier and success status
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting token in response for valid credentials
    - Green: Implement credential verification and token generation
    - Refactor: Extract token generation into its own service

- **Test:** should return authentication failure when credentials are invalid
  - **Given:** A login request with `username: "operator1"` and `password: "WrongPassword"` and the user exists but password does not match
  - **When:** The login service processes the request
  - **Then:** Response indicates authentication failure with a generic "Invalid credentials" message (not revealing which field is wrong)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting generic auth failure message
    - Green: Implement credential mismatch handling
    - Refactor: Ensure error message does not leak whether username or password was incorrect

- **Test:** should return authentication failure when user does not exist
  - **Given:** A login request with `username: "nonexistentUser"` and `password: "AnyPassword"`
  - **When:** The login service processes the request
  - **Then:** Response indicates authentication failure with the same generic "Invalid credentials" message (preventing user enumeration)
  - **Priority:** High
  - **TDD Phase:**
    - Red: Write test expecting same generic error as wrong-password case
    - Green: Handle user-not-found with same error path
    - Refactor: Confirm timing-safe comparison to prevent timing attacks

---

## Integration Test Specifications

### 1. API Endpoint — Validation Error Responses

- **Test:** POST /api/login with empty username returns 400 with structured validation errors
  - **Given:** The API server is running and the login endpoint is available
  - **When:** A POST request is sent to `/api/login` with body `{ "username": "", "password": "test123" }`
  - **Then:** Response status is 400 (Bad Request); response body contains a JSON error array with an entry for the username field; Content-Type is application/json
  - **Priority:** High

- **Test:** POST /api/login with empty password returns 400 with structured validation errors
  - **Given:** The API server is running and the login endpoint is available
  - **When:** A POST request is sent to `/api/login` with body `{ "username": "operator1", "password": "" }`
  - **Then:** Response status is 400 (Bad Request); response body contains a JSON error array with an entry for the password field
  - **Priority:** High

- **Test:** POST /api/login with both fields empty returns 400 with errors for both fields
  - **Given:** The API server is running
  - **When:** A POST request is sent to `/api/login` with body `{ "username": "", "password": "" }`
  - **Then:** Response status is 400; response body contains validation errors for both username and password fields
  - **Priority:** High

- **Test:** POST /api/login with no body returns 400 with errors for both fields
  - **Given:** The API server is running
  - **When:** A POST request is sent to `/api/login` with an empty body or no JSON payload
  - **Then:** Response status is 400; response body contains validation errors for both required fields
  - **Priority:** Medium

- **Test:** POST /api/login with valid credentials returns 200 with authentication token
  - **Given:** The API server is running and a user "operator1" exists with known password
  - **When:** A POST request is sent to `/api/login` with body `{ "username": "operator1", "password": "CorrectPassword" }`
  - **Then:** Response status is 200 (OK); response body contains an authentication token
  - **Priority:** High

- **Test:** POST /api/login with invalid credentials returns 401
  - **Given:** The API server is running and a user "operator1" exists
  - **When:** A POST request is sent to `/api/login` with body `{ "username": "operator1", "password": "WrongPassword" }`
  - **Then:** Response status is 401 (Unauthorized); response body contains a generic error message
  - **Priority:** High

### 2. API Endpoint — Content Type and Headers

- **Test:** POST /api/login with non-JSON content type returns 415
  - **Given:** The API server is running
  - **When:** A POST request is sent to `/api/login` with Content-Type `text/plain` and body `username=test&password=test`
  - **Then:** Response status is 415 (Unsupported Media Type) or 400 with appropriate error
  - **Priority:** Medium

- **Test:** POST /api/login returns appropriate security headers
  - **Given:** The API server is running
  - **When:** Any request is made to `/api/login`
  - **Then:** Response includes security headers (e.g., no caching of sensitive responses: `Cache-Control: no-store`)
  - **Priority:** Medium

### 3. Database/Repository Integration

- **Test:** Login service correctly queries user repository for existing user
  - **Given:** A user "operator1" exists in the database with a hashed password
  - **When:** The login service receives a validated request for "operator1"
  - **Then:** The user repository is queried by username and returns the user record; password comparison uses the stored hash
  - **Priority:** High

- **Test:** Login service handles database connection failure gracefully
  - **Given:** The database is unavailable or connection times out
  - **When:** A valid login request is processed
  - **Then:** The API returns 503 (Service Unavailable) with a generic error message; no sensitive details are exposed
  - **Priority:** Medium

---

## Acceptance Test Scenarios

### US 86210: Define requirements and acceptance criteria

- **Scenario:** Plant Operator submits login form with empty username
  - **Given:** The Plant Operator is on the login page and has not entered a username
  - **When:** The login request is submitted with an empty username and a filled password
  - **Then:** The API responds with a clear error message "Username is required" associated with the username field; no login attempt is processed

- **Scenario:** Plant Operator submits login form with empty password
  - **Given:** The Plant Operator is on the login page and has not entered a password
  - **When:** The login request is submitted with a filled username and an empty password
  - **Then:** The API responds with a clear error message "Password is required" associated with the password field; no login attempt is processed

- **Scenario:** Plant Operator submits login form with all fields empty
  - **Given:** The Plant Operator has not entered any credentials
  - **When:** The login request is submitted with both fields empty
  - **Then:** The API responds with clear error messages for both fields simultaneously, providing complete guidance in a single response

- **Scenario:** Plant Operator submits login form with valid credentials
  - **Given:** The Plant Operator has entered a valid username and password
  - **When:** The login request is submitted
  - **Then:** Authentication succeeds and the operator receives access to the system

### US 86212: Implement API endpoint and business logic

- **Scenario:** API endpoint exists and accepts POST requests
  - **Given:** The API is deployed and running
  - **When:** A POST request is sent to the login endpoint
  - **Then:** The endpoint processes the request and returns an appropriate response (not 404)

- **Scenario:** API validates input before attempting authentication
  - **Given:** A request with empty fields is sent
  - **When:** The endpoint processes the request
  - **Then:** Validation errors are returned without any call to the authentication/user store

### US 86216: Write unit and integration tests

- **Scenario:** All validation rules have corresponding passing tests
  - **Given:** The test suite is executed
  - **When:** All unit