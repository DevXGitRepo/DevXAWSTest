# Feature: As Retail Store Manager, I want to perform transcription text review to achieve quality verification before AI summary generation
Status: NEW
Owner: DevX
Last Updated: 2026-04-24

Status: NEW
Owner: Retail Operations
Last Updated: 2025-01-15

## Summary

Provide Retail Store Managers with a dedicated review interface where they can read, correct, and approve transcription text before it is passed to AI summary generation. The goal is to ensure transcription accuracy and completeness so that downstream AI-generated summaries are reliable and trustworthy. The workflow must be clear, efficient, and non-destructive — preserving the original transcription while capturing all manager edits and approval decisions with a full audit trail.

## Actors

- **Retail Store Manager** (primary user) — reviews, edits, and approves or rejects transcription text.
- **Transcription Source** (upstream system) — produces the raw transcription text (e.g., from recorded store meetings, customer interactions, or operational briefings).
- **AI Summary Service** (downstream system) — consumes approved transcription text and generates summaries.
- **System** (background processors, notification service) — orchestrates workflow state, enforces business rules, and delivers notifications.
- **District / Regional Manager** (optional stakeholder) — may view review decisions and summary outputs for oversight.

## Goals

- Give Store Managers confidence that transcription text is accurate before any AI summary is generated.
- Prevent low-quality or erroneous transcriptions from producing misleading AI summaries.
- Minimise the time and effort required to review and approve a transcription.
- Maintain a clear audit trail of all review actions (edits, approvals, rejections) for accountability.
- Ensure the review step integrates seamlessly into the existing transcription-to-summary pipeline without creating bottlenecks.

## Key Features

- **Transcription review queue** — a prioritised list of transcriptions awaiting the manager's review.
- **Side-by-side or inline editing interface** — displays the original transcription text and allows the manager to make corrections while preserving the original.
- **Quality indicators** — surface metadata (transcription confidence score, audio duration, speaker count, timestamps) to help the manager focus review effort.
- **Approve / Reject / Request Re-transcription workflow** — clear decision actions that gate whether the text proceeds to AI summary generation.
- **Diff view** — visual comparison of original vs. edited transcription so the manager can verify changes before finalising.
- **Audit trail** — every edit, approval, and rejection is logged with actor, timestamp, and rationale.
- **Notifications** — the manager is alerted when new transcriptions are ready for review; downstream systems are notified upon approval or rejection.

## Data & Constraints

- **Transcription**: id, source_id, source_type, raw_text, audio_duration, speaker_count, confidence_score, created_at, status
- **ReviewSession**: id, transcription_id, reviewer (store_manager_id), original_text_snapshot, edited_text, changes_summary, decision (pending | approved | rejected | re-transcription_requested), decision_rationale, started_at, completed_at
- **AuditEntry**: id, review_session_id, actor, action, timestamp, details
- **Constraints**:
  - Original transcription text must never be overwritten; edits are stored as a separate version.
  - AI summary generation must not begin until a transcription has an explicit "approved" decision.
  - Maximum transcription length to be supported: 50,000 words (longer transcriptions must be paginated or sectioned).
  - Review sessions that remain idle for more than 30 days without a decision should be flagged for attention.
  - All data handling must comply with organisational data-privacy policies (PII in transcriptions must be handled per policy).

## User Scenarios & Testing

### Scenario 1 — Review and approve a transcription (happy path)

1. Store Manager opens the transcription review queue and sees a list of transcriptions awaiting review, sorted by date received.
2. Store Manager selects a transcription and is presented with the full text alongside metadata (confidence score, audio duration, speaker count).
3. Store Manager reads through the text, makes inline corrections (e.g., fixing misheard words, correcting speaker labels).
4. Store Manager previews a diff of original vs. edited text.
5. Store Manager clicks "Approve" and optionally adds a note.
6. System records the approval, stores the edited text as the approved version, and triggers the AI summary generation pipeline.
7. Store Manager sees a confirmation message with the transcription ID and updated status.

**Acceptance criteria (testable):**
- A Store Manager can open, edit, and approve a transcription in a single session.
- The approved version of the text (with edits) is the version sent to the AI summary service.
- The original transcription text remains unchanged and accessible in the audit record.
- A confirmation is displayed immediately upon approval, including the transcription ID and new status.
- The AI summary generation pipeline is triggered only after an explicit approval.

### Scenario 2 — Reject a transcription

1. Store Manager opens a transcription and determines the quality is too poor to correct manually.
2. Store Manager clicks "Reject" and provides a mandatory rationale (e.g., "Audio quality too poor; multiple speakers unintelligible").
3. System records the rejection, updates the transcription status, and does **not** trigger AI summary generation.
4. A notification or flag is raised for the upstream transcription source or support team.

**Acceptance criteria (testable):**
- A rejected transcription does not proceed to AI summary generation.
- Rejection requires a non-empty rationale before the action can be completed.
- The rejection decision, rationale, and timestamp are recorded in the audit trail.

### Scenario 3 — Request re-transcription

1. Store Manager determines the transcription has systematic errors that suggest a re-processing would yield better results.
2. Store Manager selects "Request Re-transcription" and provides optional guidance notes.
3. System updates the transcription status and notifies the upstream transcription source.
4. When a new transcription version arrives, it appears in the manager's review queue linked to the original.

**Acceptance criteria (testable):**
- A re-transcription request updates the transcription status and does not trigger AI summary generation.
- The new transcription version, when received, is linked to the original transcription record.
- The manager can view the history of all versions for a given source recording.

### Scenario 4 — Resume an incomplete review

1. Store Manager begins reviewing a transcription, makes some edits, but navigates away before making a decision.
2. Store Manager returns later and the review session is restored with all in-progress edits intact.
3. Store Manager completes the review and approves or rejects.

**Acceptance criteria (testable):**
- Unsaved edits within a review session are preserved for at least 30 days.
- Upon returning, the manager sees the transcription in the same state they left it, including all pending edits.
- The manager can discard in-progress edits and start the review fresh if desired.

### Scenario 5 — Review queue with no pending items

1. Store Manager opens the review queue and there are no transcriptions awaiting review.
2. System displays a clear empty-state message indicating there is nothing to review.

**Acceptance criteria (testable):**
- An informative empty-state message is displayed when the queue contains no pending transcriptions.
- The message does not imply an error or system failure.

## Functional Requirements (testable)

### 1. Transcription review queue
- Store Managers see a list of transcriptions assigned to them with status "pending review."
- The queue displays key metadata per item: source name/type, date received, audio duration, confidence score, and current status.
- The queue supports sorting by date received (default: newest first) and filtering by status.

### 2. Review and editing interface
- The interface displays the full transcription text with speaker labels and timestamps (where available).
- The manager can make inline text edits (insert, delete, replace) without altering the stored original.
- A diff view is available that highlights all changes between the original and the edited version.
- The interface displays transcription metadata (confidence score, audio duration, speaker count) to aid review prioritisation.

### 3. Decision actions (Approve / Reject / Request Re-transcription)
- Three distinct actions are available: Approve, Reject, Request Re-transcription.
- "Approve" stores the edited text as the approved version and triggers the downstream AI summary pipeline.
- "Reject" requires a mandatory rationale and blocks AI summary generation.
- "Request Re-transcription" notifies the upstream source and blocks AI summary generation.
- All actions update the transcription status immediately and are reflected in the queue.

### 4. Audit trail
- Every action (open review, edit, approve, reject, request re-transcription) is logged with actor identity, timestamp, and relevant details.
- The audit trail for a transcription is viewable by the Store Manager and authorised oversight roles.

### 5. Notifications
- Store Managers receive a notification when a new transcription is ready for review.
- Store Managers receive a reminder if a transcription has been pending review beyond a configurable threshold (default: 7 days). [NEEDS CLARIFICATION: notification channels — in-app only, or also email/push?]

### 6. AI summary generation gating
- The AI summary service must not process any transcription that does not have an "approved" status from a completed review session.
- If a transcription is rejected or pending, any attempt to generate a summary must be blocked and logged.

### 7. Version history
- When a re-transcription is received, it is linked to the original source and prior versions.
- The manager can view all versions of a transcription for a given source recording in chronological order.

### 8. Accessibility
- All review interface components meet WCAG 2.1 AA standards.
- The editing interface is operable via keyboard alone.
- Screen reader users can navigate the transcription text, make edits, and execute decision actions.

### 9. Performance
- The review queue loads and displays items within 2 seconds under typical conditions.
- Transcription text up to 50,000 words renders in the editing interface within 3 seconds.
- Saving edits and recording a decision completes within 2 seconds.

### 10. Data integrity and privacy
- Original transcription text is immutable once ingested; edits are stored as a separate version.
- PII within transcription text is handled per organisational data-privacy policy. [NEEDS CLARIFICATION: specific PII redaction or masking requirements]
- Review session data and audit logs follow the project's data retention policy. [NEEDS CLARIFICATION: retention period]

## Success Criteria (measurable & verifiable)

- **Review completion rate**: ≥ 95% of transcriptions in the review queue receive a decision (approve, reject, or re-transcription request) within 7 days of arrival.
- **Time to review**: Median time from opening a transcription to recording a decision is under 10 minutes for transcriptions of average length (≤ 5,000 words).
- **Edit accuracy**: 100% of approved transcriptions retain the original text unchanged in the audit record alongside the edited version.
- **Gating enforcement**: 0 instances of AI summary generation occurring on a non-approved transcription (verifiable via audit logs).
- **User satisfaction**: ≥ 80% of Store Managers rate the review interface as "easy" or "very easy" to use in post-launch survey.
- **Accessibility**: WCAG 2.1 AA conformance for all critical review flows.
- **Performance**: 95th percentile page load for the review queue and editing interface within stated performance budgets.

## Key Entities

- **Store Manager** (reviewer and decision-maker)
- **Transcription** (the raw text output from an upstream source, subject to review)
- **ReviewSession** (a single review engagement: edits, decision, rationale)
- **AuditEntry** (immutable log of every action taken during review)
- **TranscriptionVersion** (links re-transcribed outputs to the original source)
- **Notification** (alerts for new items, reminders, and downstream triggers)
- **AI Summary Request** (downstream entity, gated by transcription approval)

## Assumptions

- Transcription text is produced by an upstream system and arrives in a structured format with speaker labels and timestamps where available.
- Store Managers have authenticated access to the review interface through the existing organisational identity system.
- The AI summary generation service exposes an interface (API or event) that can be triggered upon transcription approval and that respects the approval gate.
- Store Managers are reviewing transcriptions relevant to their own store; cross-store access is not in scope for this feature.
- Audio playback alongside the transcription text is desirable but out of scope for the initial release. [NEEDS CLARIFICATION: confirm whether audio playback is a future requirement]

## Milestones (high-level)

1. **M1** — Review queue + read-only transcription view + approve/reject workflow + audit trail
2. **M2** — Inline editing interface + diff view + session resumability + re-transcription request workflow
3. **M3** — Notifications + version history + performance optimisation + accessibility hardening

---

**Notes:**
- Confirm notification channel preferences (in-app, email, push) with stakeholders before M3.
- Confirm data retention periods for review sessions and audit logs with compliance team.
- Validate whether audio playback alongside transcription text should be planned for a future iteration.
- Confirm PII handling requirements for transcription content with the data-privacy team.