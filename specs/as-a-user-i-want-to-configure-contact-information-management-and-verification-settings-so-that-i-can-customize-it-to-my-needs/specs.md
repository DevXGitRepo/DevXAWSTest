# Feature: As a user, I want to configure Contact Information Management and Verification settings so that I can customize it to my needs
Status: NEW
Owner: DevX
Last Updated: 2026-05-04

Status: NEW
Owner: TBD
Last Updated: 2025-07-14

## Summary

Provide users with a dedicated settings experience for managing and verifying their contact information (email addresses, phone numbers, mailing addresses). Users must be able to add, edit, remove, and verify contact details, configure preferences for which contact methods are primary, and control how and when verification is triggered. The experience must be secure, accessible (WCAG AA), clearly documented, and built on a codebase that meets established code-review standards.

## Actors

- **End User** — account holder who owns and manages their contact information.
- **System** — background services responsible for sending verification challenges, enforcing policies, and recording audit events.
- **Administrator** (internal) — support or compliance staff who may view contact-information status for troubleshooting or regulatory purposes.
- **Reviewer / Developer** (internal) — engineering team members responsible for code review, documentation, and maintainability of the feature.

## Goals

- Give users full control over their contact information and verification preferences in a single, discoverable settings area.
- Ensure every contact method can be verified through a clear, trustworthy flow before it is used for sensitive communications.
- Maintain high code quality, thorough documentation, and consistent review practices so the feature is maintainable and extensible.
- Reduce support contacts caused by unverified or outdated contact details.

## Key Features

- **Contact information CRUD** — add, view, edit, and remove email addresses, phone numbers, and mailing addresses.
- **Verification workflows** — initiate and complete verification for each contact type (e.g., email link, SMS code, postal code).
- **Primary contact designation** — mark one entry per contact type as "primary" for system communications.
- **Verification preferences** — configure when re-verification is required (e.g., on edit, periodically, never) and choose preferred verification channel.
- **Verification status visibility** — clearly display verified / unverified / expired status for every contact entry.
- **Audit trail** — record all changes and verification events for security and compliance.
- **Code review and documentation** — all feature code passes peer review against documented standards; public-facing and internal documentation is complete before release.

## Data & Constraints

- **ContactEntry**: id, user_id, type (email | phone | address), value, is_primary, verification_status (unverified | pending | verified | expired), verified_at, created_at, updated_at
- **VerificationChallenge**: id, contact_entry_id, channel (email_link | sms_code | postal_code), issued_at, expires_at, attempts, status (pending | completed | expired | failed)
- **VerificationPreference**: id, user_id, contact_type, re_verify_policy (on_edit | periodic | manual), re_verify_interval_days (nullable), preferred_channel
- **AuditEvent**: id, user_id, contact_entry_id, action, actor, timestamp, metadata

**Constraints**

- Verification codes/links must expire after a configurable window (default: 15 minutes for digital channels).
- Maximum retry/resend attempts per challenge before cooldown (default: 5 attempts, 30-minute cooldown).
- PII (email, phone, address) must be encrypted at rest and in transit.
- Contact values must be validated for format before a verification challenge is issued.
- Users must have at least one verified primary email at all times; removal of the last verified email is blocked.

## User Scenarios & Testing

### Scenario 1 — Add and verify a new email address (happy path)

1. User navigates to **Settings → Contact Information**.
2. User selects "Add Email Address" and enters a valid email.
3. System validates format, saves the entry as *unverified*, and sends a verification email with a unique link.
4. User clicks the verification link within the expiry window.
5. System marks the email as *verified* and displays updated status in settings.

**Acceptance criteria (testable):**

- A new email entry appears in the contact list immediately after submission with status "Unverified."
- A verification email is delivered within 60 seconds of submission.
- Clicking a valid, non-expired verification link transitions the entry to "Verified" and displays a confirmation message.
- Clicking an expired link shows a clear error and offers a "Resend" option.

### Scenario 2 — Add and verify a phone number via SMS

1. User adds a phone number in valid international format.
2. System sends an SMS containing a one-time code.
3. User enters the code in the settings UI within the expiry window.
4. System marks the phone number as *verified*.

**Acceptance criteria (testable):**

- Invalid phone formats are rejected with a specific, actionable error before any SMS is sent.
- The SMS code field accepts the correct code and rejects incorrect codes with remaining-attempt feedback.
- After maximum failed attempts, the challenge is locked and a cooldown message with remaining time is displayed.

### Scenario 3 — Edit an existing contact entry

1. User edits the value of an already-verified email address.
2. If the user's re-verification preference for email is "on_edit," the entry reverts to *unverified* and a new challenge is issued automatically.
3. If the preference is "manual," the entry is updated and remains in its previous verification state until the user explicitly re-verifies.

**Acceptance criteria (testable):**

- Editing a contact value when re-verify policy is "on_edit" resets verification status to "Unverified" and triggers a new challenge.
- Editing a contact value when re-verify policy is "manual" preserves the prior verification status.
- The audit trail records the old value, new value, and the actor who made the change.

### Scenario 4 — Set a contact as primary

1. User selects a verified contact entry and marks it as primary.
2. The previously primary entry of the same type is demoted automatically.

**Acceptance criteria (testable):**

- Only verified entries can be designated as primary; attempting to set an unverified entry as primary shows a clear error.
- Exactly one primary entry exists per contact type at all times after the operation.

### Scenario 5 — Remove a contact entry

1. User removes a non-primary, non-sole-verified email.
2. System prompts for confirmation, then deletes the entry and logs the event.

**Acceptance criteria (testable):**

- Removing the last verified primary email is blocked with an explanatory message.
- A confirmation prompt is displayed before deletion; cancelling preserves the entry.
- The removed entry no longer appears in the contact list and an audit event is recorded.

### Scenario 6 — Configure verification preferences

1. User navigates to verification preferences and sets email re-verification to "periodic" with a 90-day interval.
2. System stores the preference and, 90 days after the last verification, transitions the email status to *expired* and prompts re-verification.

**Acceptance criteria (testable):**

- Saved preferences persist across sessions and are reflected accurately when the user returns to the settings page.
- An entry whose periodic interval has elapsed transitions to "Expired" status and the user is prompted to re-verify on next visit.

### Scenario 7 — Code review and documentation

1. All feature code is submitted via pull/merge request and reviewed by at least one peer against documented standards.
2. Internal technical documentation (architecture decisions, data model, API contracts) is published before release.
3. User-facing help content describing how to manage and verify contact information is published before release.

**Acceptance criteria (testable):**

- Every merged pull/merge request has at least one approved peer review recorded in the version-control system.
- Technical documentation covers data model, verification flows, preference options, and error handling.
- User-facing documentation is accessible from the settings UI (e.g., contextual help link) and covers all scenarios listed in this spec.
- Documentation is reviewed for accuracy by at least one non-author team member before publication.

## Functional Requirements (testable)

### 1. Contact information management

- Users can add, view, edit, and remove email addresses, phone numbers, and mailing addresses from a single settings area.
- Each entry displays its type, value (partially masked where appropriate), verification status, and primary designation.
- Format validation occurs client-side and server-side before persistence.

### 2. Verification workflows

- The system supports at least email-link and SMS-code verification channels.
- Verification challenges expire after a configurable duration; expired challenges cannot be completed.
- Users can request a new challenge (resend) subject to rate limits and cooldown periods.
- Successful verification is idempotent — re-clicking a valid link or re-entering a valid code does not produce errors.

### 3. Primary contact designation

- Users can designate one entry per contact type as primary.
- Only verified entries may be set as primary.
- The system enforces exactly one primary per type; setting a new primary automatically demotes the previous one.

### 4. Verification preferences

- Users can configure re-verification policy per contact type: on_edit, periodic (with configurable interval in days), or manual.
- Users can select a preferred verification channel where multiple channels are available for a contact type.
- Default preferences are applied for new accounts and can be overridden at any time.

### 5. Notifications

- Users receive a notification (in-app and via verified primary contact) when a contact entry's verification status changes.
- Users receive a reminder when a periodic re-verification is approaching or overdue. [NEEDS CLARIFICATION: reminder lead time]

### 6. Security & privacy

- All PII is encrypted in transit and at rest.
- Verification tokens/codes are single-use and cryptographically random.
- All add, edit, remove, and verify actions are recorded in an immutable audit log with actor, timestamp, and metadata.
- Rate limiting is enforced on verification challenge issuance and attempt submission.

### 7. Authentication & authorization

- Users must be authenticated to access contact information settings.
- Users can view and manage only their own contact information.
- Administrators can view (but not edit) contact information and verification status for support purposes, with access logged. [NEEDS CLARIFICATION: admin access scope and tooling]

### 8. Accessibility

- All settings UI components meet WCAG 2.1 AA.
- Verification status indicators use more than colour alone (e.g., icons, text labels).
- Automated accessibility checks run in CI for all UI changes.

### 9. Performance

- The contact information settings page loads usable content within 2 seconds on broadband connections.
- Verification challenge delivery (email/SMS) completes within 60 seconds of user request under normal load.

### 10. Code review and documentation standards

- All production code changes require at least one approved peer review before merge.
- Code review checklist includes: correctness, security (PII handling, token generation), test coverage, and adherence to project coding standards.
- Technical and user-facing documentation is treated as a release-blocking deliverable.
- Documentation is version-controlled alongside code.

### 11. Data retention & compliance [NEEDS CLARIFICATION: retention policy]

- Contact entries and audit events follow the project's data-retention policy.
- Users can request export or deletion of their contact information in compliance with applicable privacy regulations.

## Success Criteria (measurable & verifiable)

- **Task completion:** ≥ 95% of users can add and verify a new contact entry end-to-end without contacting support.
- **Time to verify:** Median time from "Add" to "Verified" status is under 3 minutes for email and SMS channels.
- **Verification delivery reliability:** ≥ 99% of verification challenges are delivered within 60 seconds.
- **Error clarity:** ≥ 90% of users who encounter a validation or verification error self-recover without support contact (measured via support ticket correlation).
- **Performance:** 95th-percentile page load for the settings page is under 2.5 seconds; Lighthouse performance score ≥ 90.
- **Accessibility:** WCAG 2.1 AA conformance for all settings and verification flows, validated by automated and manual audit.
- **Code quality:** 100% of merged code changes have at least one approved peer review; zero high-severity security findings in production builds.
- **Documentation coverage:** Technical and user-facing documentation published and reviewed before GA release; contextual help link present on the settings page.

## Key Entities

- **User** — account holder or administrator.
- **ContactEntry** — an individual email, phone, or address record belonging to a user.
- **VerificationChallenge** — a time-bound, single-use challenge issued to prove ownership of a contact entry.
- **VerificationPreference** — user-configurable rules governing when and how re-verification occurs.
- **AuditEvent** — immutable record of any action taken on contact information.
- **Notification** — in-app, email, or SMS message triggered by status changes or reminders.

## Assumptions

- Users have access to the email inbox or phone associated with the contact entry they are verifying.
- Email and SMS delivery infrastructure is available as a shared platform service; this feature does not build delivery infrastructure.
- Mailing-address verification (postal code) is a future-phase capability; the data model supports it, but initial release focuses on email and phone verification.
- Modern browsers are the primary target; progressive enhancement ensures baseline functionality on older browsers.

## Milestones (high-level)

1. **M1** — Core contact CRUD, email verification workflow, primary designation, basic settings UI, and initial documentation.
2. **M2** — SMS verification workflow, verification preferences (on_edit, periodic, manual), notification integration, and admin read-only view.
3. **M3** — Mailing-address verification, advanced audit/reporting, performance hardening, final code-review compliance audit, and complete user-facing documentation.

---

**Notes:**

- Replace placeholders for data-retention windows, admin access scope, and reminder lead times with project decisions before development begins.
- The "Code review and documentation" user story (US 63137) is treated as a cross-cutting quality requirement applied to all milestones, not a standalone UI feature.
- See checklists/requirements.md for spec quality validation.