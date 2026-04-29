# Feature: As Customer, I want to perform biometric fallback authentication to achieve login access when biometric recognition fails
Status: NEW
Owner: DevX
Last Updated: 2026-04-29

Status: NEW
Owner: (Pending Assignment)
Last Updated: 2025-07-11
Feature ID: 51768

## Summary

When a customer's primary biometric recognition (e.g., fingerprint, face recognition) fails or is unavailable, the system must offer a secure, clearly guided fallback authentication path so the customer can still gain login access without contacting support. The fallback flow must balance security with usability, minimise friction, and maintain a trust-building tone throughout. The feature must meet accessibility (WCAG AA), performance, and security standards consistent with the primary authentication experience.

## Actors

- **Customer** — end user attempting to log in via biometrics who needs an alternative path.
- **System** — authentication service responsible for detecting biometric failure, orchestrating fallback challenges, enforcing lockout policies, and logging events.
- **Customer Support** (internal) — assists customers who exhaust all fallback options or are locked out.
- **Security / Fraud Team** (internal) — monitors fallback usage patterns and investigates anomalies.

## Goals

- Allow customers to log in when biometric recognition fails, without requiring a support call.
- Preserve a high security bar during fallback — prevent account takeover via social engineering or brute force.
- Provide clear, reassuring guidance so customers understand why biometrics failed and what to do next.
- Minimise the number of steps and cognitive load in the fallback flow.
- Generate a complete audit trail of every fallback attempt for fraud analysis.

## Key Features

- **Automatic failure detection & transition** — the system detects biometric failure (or unavailability) and seamlessly presents the fallback option without requiring the customer to navigate away.
- **Multi-method fallback challenges** — support for at least PIN/passcode entry and, optionally, one-time passcode (OTP) via registered email or SMS.
- **Attempt limiting & progressive lockout** — configurable thresholds that temporarily lock the account after repeated failures, with clear messaging.
- **Contextual guidance & error messaging** — human-readable explanations of why biometrics failed and step-by-step instructions for the fallback method.
- **Audit logging** — every biometric failure event, fallback attempt, and outcome is recorded with timestamps and device metadata.

## Data & Constraints

| Entity | Key Attributes |
|---|---|
| **AuthSession** | id, customer_id, device_id, initiated_at, auth_method (biometric / fallback), status (success / failure / locked), ip_address |
| **BiometricEvent** | id, session_id, biometric_type (fingerprint / face / iris), result (match / no_match / unavailable / timeout), error_code, timestamp |
| **FallbackAttempt** | id, session_id, method (PIN / OTP_email / OTP_sms), result (success / failure), timestamp |
| **LockoutRecord** | id, customer_id, triggered_at, unlock_at, reason, resolved_by |

**Constraints**

- Fallback credentials (PIN, OTP) must never be logged in plaintext.
- All authentication traffic must be encrypted in transit (TLS 1.2+) and sensitive tokens encrypted at rest.
- OTP codes must expire within a configurable window (default ≤ 5 minutes).
- Maximum consecutive fallback failures before temporary lockout: configurable (default 5).
- Lockout duration: configurable (default 15 minutes), with escalation on repeated lockouts.
- PII handling must comply with applicable data-protection regulations (e.g., GDPR, CCPA).
- The fallback flow must be available on all platforms where biometric login is offered (mobile native, mobile web, desktop web).

## User Scenarios & Testing

### Scenario 1 — Successful fallback via PIN (happy path)

1. Customer initiates login and selects biometric authentication.
2. Biometric recognition fails (e.g., fingerprint not recognised after maximum sensor retries).
3. System displays a clear message explaining the failure and offers the fallback option (e.g., "Fingerprint not recognised. You can log in with your PIN instead.").
4. Customer selects PIN fallback and enters their registered PIN.
5. System validates the PIN, grants access, and logs the event.

**Acceptance criteria (testable):**

- When biometric recognition fails, the fallback option is presented within 2 seconds of the final biometric attempt.
- Customer can complete PIN-based login in a single continuous flow without being redirected to a separate login page.
- A successful fallback login grants the same session privileges as a successful biometric login.
- An `AuthSession` record is created with `auth_method = fallback` and `status = success`.

### Scenario 2 — Successful fallback via OTP

1. Customer's biometric fails and they choose OTP instead of PIN.
2. System sends a one-time passcode to the customer's registered email or phone.
3. Customer enters the OTP within the validity window.
4. System validates the OTP, grants access, and logs the event.

**Acceptance criteria (testable):**

- OTP is delivered within 30 seconds of request under normal conditions.
- An expired or already-used OTP is rejected with a clear error message and an option to request a new code.
- Only the most recently issued OTP is valid; prior codes are invalidated.

### Scenario 3 — Fallback failure and lockout

1. Customer's biometric fails and they attempt PIN fallback.
2. Customer enters an incorrect PIN repeatedly, reaching the configured failure threshold.
3. System locks the account temporarily and displays a message with the lockout duration and instructions to contact support if needed.

**Acceptance criteria (testable):**

- After the configured number of consecutive failures (default 5), the account is temporarily locked.
- The lockout message includes the remaining wait time (countdown or absolute time) and a link/phone number for support.
- During lockout, any login attempt (biometric or fallback) is rejected with the lockout message.
- A `LockoutRecord` is created with accurate timestamps.

### Scenario 4 — Biometric hardware unavailable

1. Customer's device reports that biometric hardware is unavailable (e.g., sensor damaged, permissions revoked).
2. System detects unavailability before prompting for biometric input and immediately offers the fallback flow.

**Acceptance criteria (testable):**

- The system does not display a biometric prompt when the device reports no biometric capability.
- The fallback option is presented as the primary login method with an explanatory note.

### Scenario 5 — Customer cancels fallback

1. Customer's biometric fails; fallback is offered.
2. Customer dismisses or cancels the fallback prompt.
3. System returns the customer to the pre-login screen without creating a partial or failed session record that would count toward lockout.

**Acceptance criteria (testable):**

- Cancellation does not increment the failure counter.
- No `FallbackAttempt` record with `result = failure` is created for a cancellation.

## Functional Requirements (testable)

### 1. Biometric failure detection & transition

- The system must detect biometric failure or unavailability and present the fallback option automatically.
- The transition must not require the customer to restart the login flow.

### 2. Fallback authentication methods

- At minimum, PIN/passcode entry must be supported.
- OTP via registered email and/or SMS should be supported as a secondary fallback. [NEEDS CLARIFICATION: which OTP channels are in scope for M1]
- Each method must validate input server-side; client-side validation alone is insufficient.

### 3. Attempt limiting & lockout

- The system must enforce a configurable maximum number of consecutive failed fallback attempts per customer.
- After the threshold is reached, the account must be temporarily locked for a configurable duration.
- Repeated lockouts within a rolling window must escalate lockout duration (e.g., 15 min → 30 min → 60 min). [NEEDS CLARIFICATION: escalation policy details]
- Successful login (biometric or fallback) resets the failure counter.

### 4. Error messaging & guidance

- Every failure state (biometric failure, incorrect PIN, expired OTP, lockout) must display a distinct, human-readable message.
- Messages must not reveal whether the account exists or which specific credential element was wrong (to prevent enumeration).
- Messages must include actionable next steps (retry, try another method, contact support).

### 5. Audit logging

- Every biometric attempt, fallback attempt, and lockout event must be logged with session ID, timestamp, device metadata, and outcome.
- Logs must be immutable and retained per the project's security-log retention policy. [NEEDS CLARIFICATION: retention window]

### 6. Security & privacy

- Fallback credentials must be validated server-side over encrypted channels.
- OTP codes must be single-use and time-limited.
- Rate limiting must be applied to OTP request endpoints to prevent abuse.
- No sensitive credential material (PIN digits, OTP values) may appear in application logs or client-side storage.

### 7. Accessibility

- All fallback UI components (prompts, input fields, error messages, countdown timers) must meet WCAG 2.1 AA.
- Screen readers must announce biometric failure and fallback options without requiring visual context.
- Automated accessibility checks must run in CI for fallback-related screens.

### 8. Performance

- Fallback prompt must render within 2 seconds of biometric failure detection on a typical mobile device.
- PIN validation response must return within 1 second under normal load.
- OTP delivery must complete within 30 seconds (email/SMS provider SLA permitting).

### 9. Resilience

- If the OTP delivery service is temporarily unavailable, the system must inform the customer and offer the PIN method (or vice versa) rather than showing a generic error.
- Transient network failures during fallback validation must allow retry without resetting the flow.

### 10. Notifications

- After a successful fallback login, the system should send a security notification (email or push) to the customer confirming a login via fallback method, including timestamp and device info, so the customer can flag unauthorised access.
- After an account lockout, the system should notify the customer with unlock instructions.

## Success Criteria (measurable & verifiable)

| Metric | Target |
|---|---|
| **Fallback completion rate** | ≥ 95% of customers who enter the fallback flow successfully authenticate without contacting support. |
| **Time to login via fallback** | Median time from biometric failure to successful fallback login ≤ 30 seconds (PIN) / ≤ 90 seconds (OTP). |
| **Lockout rate** | < 2% of fallback sessions result in a temporary lockout. |
| **Security** | Zero incidents of account takeover attributed to the fallback flow within the first 90 days post-launch. |
| **Audit completeness** | 100% of fallback attempts have a corresponding audit log entry. |
| **Performance** | 95th-percentile fallback prompt render time ≤ 2 seconds on mobile; PIN validation ≤ 1 second server-side. |
| **Accessibility** | WCAG 2.1 AA conformance for all fallback screens, verified by automated and manual audit. |
| **Support deflection** | No increase in authentication-related support contacts after feature launch (baseline measured pre-launch). |

## Key Entities

- **Customer** — the person attempting to log in.
- **Device** — the hardware/software context from which the login is attempted.
- **AuthSession** — a single login attempt lifecycle.
- **BiometricEvent** — record of a biometric recognition attempt and its outcome.
- **FallbackAttempt** — record of a fallback challenge and its outcome.
- **LockoutRecord** — record of a temporary account lock.
- **Notification** — security alert sent after fallback login or lockout.

## Assumptions

- Customers have already enrolled in biometric authentication and have registered at least one fallback credential (PIN) during onboarding.
- The biometric recognition system provides a deterministic failure/unavailability signal that the fallback feature can consume.
- OTP delivery depends on third-party email/SMS providers; delivery time SLAs are outside this feature's direct control.
- The existing authentication infrastructure supports adding a fallback step without requiring a full re-architecture.
- Mobile platforms (iOS, Android) expose biometric availability status to the application layer.

## Milestones (high-level)

1. **M1** — Core fallback flow: biometric failure detection → PIN fallback → audit logging → lockout enforcement.
2. **M2** — OTP fallback channel, security notifications, escalating lockout policy, enhanced device-context logging.
3. **M3** — Analytics dashboard for fallback usage patterns, fraud-signal integration, hardening, and accessibility audit completion.

---

**Notes:**

- Replace placeholders for audit-log retention windows, OTP channel scope, and lockout escalation policy with project decisions before development begins.
- Coordinate with the onboarding team to ensure PIN registration is a prerequisite for biometric enrolment.
- See checklists/requirements.md for spec quality validation.