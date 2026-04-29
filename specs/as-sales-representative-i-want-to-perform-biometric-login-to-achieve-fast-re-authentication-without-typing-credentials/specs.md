# Feature: As Sales Representative, I want to perform biometric login to achieve fast re-authentication without typing credentials
Status: NEW
Owner: DevX
Last Updated: 2026-04-29

Status: NEW
Owner: Identity & Access Management
Last Updated: 2025-07-10
Feature ID: -51744

## Summary

Enable sales representatives to authenticate into the application using device-native biometric mechanisms (fingerprint, face recognition, iris scan) so they can regain access quickly between sessions without manually entering usernames and passwords. The feature must maintain the same security posture as credential-based login while dramatically reducing re-authentication friction — critical for field sales workflows where representatives frequently lock/unlock devices throughout the day.

## Actors

- **Sales Representative** (primary end user — field and office-based)
- **IT / Security Administrator** (manages biometric policy, enrollment rules, and revocation)
- **System** (device biometric subsystem, authentication service, token management, audit logging)
- **Identity Provider (IdP)** (existing credential store and session authority)

## Goals

- Allow sales representatives to re-authenticate in seconds using a single biometric gesture instead of typing credentials.
- Maintain or exceed the security level of password-based login (no downgrade of authentication assurance).
- Provide a clear, guided enrollment experience that builds user trust in biometric data handling.
- Ensure graceful fallback to credential-based login when biometrics are unavailable or fail.
- Give administrators visibility and control over biometric enrollment and usage across the sales force.

## Key Features

- **Biometric enrollment flow** — guided, one-time setup linking a device biometric to the user's account after successful credential authentication.
- **Biometric re-authentication** — fast unlock using device-native biometric (fingerprint, face, iris) that issues a valid application session.
- **Credential fallback** — seamless path to username/password login when biometric is unavailable, fails, or is locked out.
- **Device & enrollment management** — users can view and revoke enrolled devices; administrators can enforce policies and remotely revoke enrollments.
- **Audit trail** — every biometric enrollment, authentication attempt, fallback, and revocation is logged.

## Data & Constraints

- **BiometricEnrollment**: id, user_id, device_id, device_name, biometric_type (fingerprint | face | iris), enrolled_at, last_used_at, status (active | revoked)
- **AuthEvent**: id, user_id, device_id, method (biometric | credential | fallback), result (success | failure | lockout), timestamp, ip_address, geo (optional)
- **Policy**: max_enrolled_devices_per_user, biometric_timeout_seconds, max_consecutive_failures_before_lockout, enrollment_requires_mfa

### Constraints

- Biometric templates must **never** leave the device; the system relies on device-level biometric verification and a cryptographic challenge/response — no server-side biometric storage.
- Communication between client and authentication service must be encrypted in transit (TLS 1.2+).
- Session tokens issued after biometric authentication must have the same (or stricter) expiry and scope as credential-based tokens.
- The feature must comply with applicable privacy regulations (e.g., GDPR, BIPA) regarding biometric data notice and consent.
- Maximum enrolled devices per user is configurable by policy (default: 3).

## User Scenarios & Testing

### Scenario 1 — First-time biometric enrollment (happy path)

1. Sales representative logs in with existing credentials (username + password, optionally MFA).
2. System detects the device supports biometrics and prompts the user to enroll.
3. User reviews a clear consent notice explaining that biometric data stays on-device and agrees.
4. User completes the device-native biometric capture (e.g., fingerprint scan).
5. System registers the device enrollment and confirms success with device name and biometric type displayed.

**Acceptance criteria (testable):**

- Enrollment is only offered after a successful credential-based login on a biometric-capable device.
- A consent notice is displayed before any biometric capture begins; enrollment does not proceed without explicit acceptance.
- After successful enrollment, the BiometricEnrollment record is persisted with status `active` and correct device metadata.
- If the device does not support biometrics, the enrollment prompt is never shown.

### Scenario 2 — Biometric re-authentication (happy path)

1. Sales representative opens the application after session expiry or device lock.
2. System presents the biometric login prompt (e.g., "Use fingerprint to sign in").
3. User provides biometric via device sensor.
4. System verifies the cryptographic response, issues a session token, and lands the user on their home screen.

**Acceptance criteria (testable):**

- A user with an active enrollment can complete re-authentication end-to-end without typing any credentials.
- A valid session token is issued with the same scopes and expiry as a credential-based session.
- The entire biometric re-authentication flow (prompt → home screen) completes in under 3 seconds on supported devices under normal conditions.
- An `AuthEvent` with method `biometric` and result `success` is logged.

### Scenario 3 — Biometric failure and fallback

1. User attempts biometric login but the scan fails (e.g., wet finger, poor lighting for face).
2. System shows a clear, non-alarming message and allows retry.
3. After the configured maximum consecutive failures, system locks biometric login for that session and presents credential-based login.
4. User logs in with credentials successfully.

**Acceptance criteria (testable):**

- Each failed biometric attempt is logged as an `AuthEvent` with result `failure`.
- After reaching `max_consecutive_failures_before_lockout` (default: 5), the biometric option is disabled for that session and the credential fallback is presented automatically.
- The user can choose credential-based login at any point before lockout via a visible "Use password instead" option.
- After credential fallback login, the user's biometric enrollment remains active (not revoked) unless an administrator intervenes.

### Scenario 4 — Device/enrollment revocation by user

1. User navigates to account security settings and views a list of enrolled devices.
2. User selects a device and chooses "Remove."
3. System revokes the enrollment and confirms removal.

**Acceptance criteria (testable):**

- The enrolled devices list shows device name, biometric type, enrollment date, and last-used date for each active enrollment.
- After revocation, the BiometricEnrollment status is set to `revoked` and biometric login from that device is immediately rejected.
- An audit event for the revocation is logged with the acting user.

### Scenario 5 — Administrator policy enforcement and remote revocation

1. Administrator sets a policy limiting enrolled devices to 2 per user.
2. A user who already has 2 enrollments attempts to enroll a third device.
3. System informs the user they have reached the maximum and must remove an existing device before enrolling a new one.

**Acceptance criteria (testable):**

- Enrollment is blocked (not silently ignored) when the user has reached the policy-defined device limit, with a clear message.
- Administrators can remotely revoke any user's enrollment; the revocation takes effect on the next authentication attempt from that device.
- Policy changes (e.g., reducing max devices) do not retroactively revoke existing enrollments but prevent new ones until the user is within limits.

## Functional Requirements (testable)

### 1. Biometric enrollment

- Enrollment is gated behind a successful credential-based authentication session (and MFA if policy requires).
- The system must detect device biometric capability before offering enrollment.
- A consent notice must be displayed and accepted before biometric capture.
- Enrollment associates a cryptographic key pair with the user account and device; no biometric template data is transmitted or stored server-side.

### 2. Biometric re-authentication

- The biometric login option is presented only when the device has an active enrollment for the current user context.
- Authentication uses a cryptographic challenge/response validated by the server; the biometric unlock is performed entirely on-device.
- On success, a session token is issued with equivalent security properties to credential-based login.

### 3. Credential fallback

- A "Use password instead" option is visible on the biometric login screen at all times.
- After biometric lockout, the system automatically transitions to credential-based login without requiring the user to restart the application.

### 4. Device & enrollment management

- Users can list, inspect, and revoke their own enrolled devices from account security settings.
- Administrators can search enrollments by user and revoke any enrollment remotely.
- Revocation is immediate: subsequent biometric attempts on the revoked device must fail and prompt credential login.

### 5. Policy configuration

- Administrators can configure: maximum enrolled devices per user, biometric session timeout, maximum consecutive biometric failures before lockout, and whether enrollment requires prior MFA.
- Policy changes apply to future enrollment and authentication attempts without disrupting active sessions.

### 6. Audit & logging

- All enrollment, authentication (success and failure), fallback, and revocation events are recorded with user ID, device ID, method, result, and timestamp.
- Audit logs are immutable and accessible to authorized administrators.

### 7. Security

- No biometric template data is stored or transmitted beyond the device's secure enclave / trusted execution environment.
- Cryptographic keys used for biometric authentication are stored in device-level secure storage (e.g., Keychain, Keystore, TPM).
- Session tokens issued via biometric login are indistinguishable in privilege from those issued via credential login (no elevated or reduced access).
- Biometric enrollment and authentication endpoints are protected against replay attacks.

### 8. Privacy & consent

- Users are informed, in plain language, about what biometric data is used, that it remains on-device, and how to revoke enrollment.
- Consent acceptance is recorded with a timestamp in the enrollment record.
- [NEEDS CLARIFICATION: specific regulatory frameworks applicable to the deployment regions — GDPR, BIPA, or others — to finalize consent language and data-handling disclosures.]

### 9. Accessibility

- The biometric prompt and all fallback flows meet WCAG 2.1 AA.
- Screen readers can navigate the enrollment flow, consent notice, and fallback login without loss of information or function.
- Users who cannot use biometrics (e.g., due to disability) are never blocked; credential login is always available.

### 10. Performance

- Biometric re-authentication (from prompt to authenticated home screen) completes in under 3 seconds on supported devices under typical network conditions.
- Enrollment flow adds no more than 15 seconds to the initial credential-based login experience.

### 11. Resilience

- If the biometric subsystem is temporarily unavailable (e.g., sensor error, OS update), the system falls back to credential login gracefully with a clear message.
- Network interruptions during the cryptographic challenge/response surface a retry option before falling back to credentials.

## Success Criteria (measurable & verifiable)

| Metric | Target |
|---|---|
| **Re-authentication speed** | 90% of biometric logins complete (prompt → home screen) in ≤ 3 seconds. |
| **Adoption** | ≥ 70% of active sales representatives enroll at least one device within 60 days of rollout. |
| **Credential entry reduction** | Average credential-based logins per user per day decrease by ≥ 50% within 30 days of enrollment. |
| **Biometric success rate** | ≥ 95% of biometric authentication attempts succeed on the first try. |
| **Fallback reliability** | 100% of biometric lockout events result in a functional credential fallback without app restart. |
| **Security** | Zero incidents of session token issuance without valid biometric or credential verification. |
| **Audit completeness** | 100% of enrollment, authentication, fallback, and revocation events have corresponding audit log entries. |
| **Accessibility** | All critical flows (enrollment, biometric login, fallback, revocation) pass WCAG 2.1 AA automated and manual checks. |

## Key Entities

- **User** (sales representative, administrator)
- **Device** (enrolled device with biometric capability)
- **BiometricEnrollment** (link between user, device, and biometric type)
- **AuthEvent** (authentication and enrollment audit record)
- **Session** (authenticated application session)
- **Policy** (administrator-defined biometric rules)

## Assumptions

- Sales representatives use devices (mobile or laptop) with hardware biometric sensors and OS-level biometric APIs.
- An existing credential-based authentication system (IdP) is in place; biometric login augments but does not replace it.
- The device operating system provides a secure enclave or equivalent for biometric template storage and cryptographic key management.
- Network connectivity is available at the time of biometric authentication (offline authentication is out of scope for this release).
- The organization's security team has approved the use of device-native biometric verification as an acceptable re-authentication factor.

## Milestones (high-level)

1. **M1** — Biometric enrollment flow, biometric re-authentication (happy path), credential fallback, and audit logging.
2. **M2** — Device management UI (user self-service), administrator remote revocation, and policy configuration.
3. **M3** — Adoption analytics, edge-case hardening (sensor failures, OS updates), accessibility audit, and production rollout.

---

**Notes:**

- Clarify applicable biometric privacy regulations per deployment region before finalizing consent language (see Requirement 8).
- Confirm supported device/OS matrix with the sales operations team to determine minimum biometric API versions.
- Offline biometric authentication may be considered in a future iteration if field connectivity proves unreliable.