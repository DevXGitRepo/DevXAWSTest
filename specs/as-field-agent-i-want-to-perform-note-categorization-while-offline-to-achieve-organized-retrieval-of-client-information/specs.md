# Feature: As Field Agent, I want to perform note categorization while offline to achieve organized retrieval of client information
Status: NEW
Owner: DevX
Last Updated: 2026-05-18

Status: NEW
Owner: Field Operations
Last Updated: 2025-01-15

## Summary

Enable field agents to categorize client notes while working offline (no network connectivity), ensuring that categorized notes sync reliably when connectivity is restored and that agents can retrieve client information organized by category at any time. The solution must support a seamless offline-first experience, conflict resolution on sync, and a consistent category taxonomy across devices.

## Actors

- Field Agent (primary end user — mobile, often in low/no connectivity environments)
- System (local storage engine, background sync processor, conflict resolver)
- Backend Service (API, persistence, category taxonomy authority)
- Administrator (manages category taxonomy and sync policies)

## Goals

- Allow field agents to create, edit, and categorize notes without any network dependency.
- Ensure categorized notes sync accurately and completely when connectivity is restored.
- Provide organized, category-based retrieval of client notes both offline and online.
- Prevent data loss during extended offline periods or interrupted syncs.
- Maintain a consistent, manageable category taxonomy across all agents.

## Key Features

- Offline-capable note creation and categorization with local persistence.
- Predefined and agent-customizable category taxonomy (cached locally).
- Background sync engine that queues changes and resolves conflicts on reconnection.
- Category-based filtering, search, and retrieval of client notes.
- API endpoints for CRUD operations on notes, categories, and sync state.
- Conflict detection and resolution strategy (last-write-wins with manual override for conflicts).

## Data & Constraints

- **Note**: id (UUID, client-generated), client_id, agent_id, title, body, category_ids[], created_at, updated_at, sync_status (pending | synced | conflict), version
- **Category**: id, name, description, parent_id (nullable, for hierarchy), is_system (boolean), created_by, active
- **SyncEvent**: id, note_id, action (create | update | delete | categorize), payload, queued_at, synced_at, status (pending | completed | failed | conflict), retry_count
- **Constraints**:
  - Notes must persist locally for up to 30 days without sync.
  - Maximum 500 pending sync events before warning the agent.
  - Category taxonomy cached locally; refresh on each successful sync.
  - Note body max length: 10,000 characters.
  - Category limit per note: 5.
  - All data encrypted at rest on device and in transit during sync.

## User Scenarios & Testing

### Scenario 1 — Categorize a note while offline (happy path)

1. Field agent opens the app with no network connectivity.
2. Agent creates a new note for a client visit.
3. Agent assigns one or more categories from the locally cached taxonomy.
4. Agent saves the note; it is persisted locally with sync_status = pending.
5. Agent can immediately retrieve the note by filtering on the assigned category.

**Acceptance criteria (testable):**
- A note created offline is retrievable by category within 1 second of save, without network.
- The note record contains valid category_ids that reference the local taxonomy cache.
- sync_status is set to "pending" and a SyncEvent is queued.

### Scenario 2 — Sync categorized notes on reconnection

1. Agent returns to an area with connectivity.
2. System detects network availability and begins background sync.
3. All pending SyncEvents are transmitted to the backend in chronological order.
4. Backend acknowledges each event; local sync_status updates to "synced."

**Acceptance criteria (testable):**
- All pending notes sync within 60 seconds of connectivity restoration (for ≤ 50 pending events).
- Each synced note on the server matches the local version (category_ids, body, timestamps).
- Failed sync events are retried up to 3 times with exponential backoff before marking as "failed."

### Scenario 3 — Conflict during sync

1. Agent categorized a note offline.
2. Another system or agent modified the same note on the server during the offline period.
3. On sync, the system detects a version mismatch.
4. System applies last-write-wins by default but flags the note as "conflict" for agent review.

**Acceptance criteria (testable):**
- A note with a server version > local version at sync time is flagged with sync_status = "conflict."
- Agent is presented with both versions and can choose which to keep.
- Resolution action generates a new SyncEvent that resolves the conflict on the server.

### Scenario 4 — Retrieve notes by category (offline)

1. Agent opens the notes list and selects a category filter.
2. System queries local storage and returns all notes matching the selected category.
3. Results are sorted by updated_at descending.

**Acceptance criteria (testable):**
- Filtering by category returns only notes with matching category_ids.
- Results are returned within 500ms for up to 1,000 locally stored notes.
- Notes with multiple categories appear in results for each assigned category.

### Scenario 5 — Category taxonomy update on sync

1. Administrator adds a new category to the system taxonomy.
2. On next successful sync, the agent's local taxonomy cache is refreshed.
3. New category is available for assignment immediately after cache update.

**Acceptance criteria (testable):**
- Local taxonomy cache is updated as part of every successful sync cycle.
- Newly added categories are available for note assignment without app restart.
- Removed/deactivated categories no longer appear for new assignments but remain on existing notes.

## Functional Requirements (testable)

### 1. Offline note creation and categorization

- **Given** the agent has no network connectivity, **When** the agent creates a note and assigns categories, **Then** the note is persisted locally with the assigned category_ids and sync_status = "pending."
- **Given** the local category cache contains N categories, **When** the agent opens the category picker, **Then** all N categories are displayed within 200ms.
- **Given** a note already exists locally, **When** the agent changes its categories, **Then** the note's updated_at is set to current time, version is incremented, and a SyncEvent of action "categorize" is queued.

### 2. Local persistence and retrieval

- **Given** notes exist in local storage with various categories, **When** the agent filters by a specific category, **Then** only notes containing that category_id in their category_ids array are returned.
- **Given** the agent has 1,000 notes stored locally, **When** a category filter query is executed, **Then** results are returned within 500ms.
- **Given** the app is terminated and restarted offline, **When** the agent opens the notes list, **Then** all previously saved notes (including pending) are present and intact.

### 3. Background sync engine

- **Given** pending SyncEvents exist and network becomes available, **When** the sync engine activates, **Then** events are transmitted in queued_at order to the backend API.
- **Given** a SyncEvent fails transmission, **When** retry logic executes, **Then** the event is retried up to 3 times with exponential backoff (2s, 4s, 8s).
- **Given** a SyncEvent fails after 3 retries, **When** the retry limit is reached, **Then** the event status is set to "failed" and the agent is notified.

### 4. API endpoints

- **Given** a valid authenticated request to `POST /api/notes`, **When** the payload contains required fields (client_id, title, body, category_ids), **Then** the note is created and a 201 response with the note record is returned.
- **Given** a valid request to `PATCH /api/notes/{id}/categories`, **When** the payload contains valid category_ids and the correct version, **Then** the note's categories are updated and a 200 response is returned.
- **Given** a request to `PATCH /api/notes/{id}/categories` with a stale version, **When** the server version is newer, **Then** a 409 Conflict response is returned with the current server version.
- **Given** a valid request to `GET /api/notes?client_id={id}&category={cat_id}`, **When** matching notes exist, **Then** a 200 response with a paginated list of matching notes is returned.
- **Given** a valid request to `GET /api/categories`, **When** the taxonomy exists, **Then** a 200 response with the full active category tree is returned.
- **Given** a request to `POST /api/sync/batch`, **When** the payload contains an array of SyncEvents, **Then** each event is processed and individual success/failure statuses are returned.

### 5. Conflict detection and resolution

- **Given** a sync payload with note version < server version, **When** the server processes the event, **Then** the server returns a 409 with both versions for client-side resolution.
- **Given** the agent selects a resolution for a conflicted note, **When** the resolution is submitted via `POST /api/notes/{id}/resolve`, **Then** the server accepts the chosen version and increments the version number.

### 6. Category taxonomy management

- **Given** an administrator creates a new category via `POST /api/categories`, **When** the payload is valid, **Then** the category is created and available in subsequent `GET /api/categories` responses.
- **Given** an administrator deactivates a category, **When** agents sync, **Then** the category no longer appears in the active taxonomy but existing note associations are preserved.

### 7. Security and data protection

- **Given** a request without a valid authentication token, **When** any API endpoint is called, **Then** a 401 Unauthorized response is returned.
- **Given** an agent's auth token, **When** requesting notes for a client not assigned to them, **Then** a 403 Forbidden response is returned.
- **Given** note data stored on device, **When** inspected at rest, **Then** data is encrypted and unreadable without app-level decryption.

### 8. Data validation

- **Given** a note creation request with body exceeding 10,000 characters, **When** submitted, **Then** a 422 response with a descriptive validation error is returned.
- **Given** a note categorization request with more than 5 category_ids, **When** submitted, **Then** a 422 response indicating the category limit is returned.
- **Given** a category_id that does not exist or is inactive, **When** used in a categorization request, **Then** a 422 response indicating invalid category is returned.

### 9. Performance

- **Given** a sync batch of 50 events, **When** submitted to `POST /api/sync/batch`, **Then** the server processes and responds within 5 seconds.
- **Given** a `GET /api/notes` request with filters, **When** the dataset contains up to 10,000 notes for the agent, **Then** the response is returned within 2 seconds (p95).

### 10. Resilience

- **Given** a sync in progress and network drops mid-transmission, **When** connectivity resumes, **Then** only unacknowledged events are re-sent (no duplicates created on server).
- **Given** the app crashes during a local save, **When** the app restarts, **Then** either the complete note is present or no partial record exists (atomic writes).

## Test-First Checklist

The following tests must be written and failing **before** implementation begins, ordered by priority:

### API Endpoint Tests
1. `POST /api/notes` — returns 201 with valid payload; returns 422 for missing required fields.
2. `POST /api/notes` — returns 422 when body exceeds 10,000 characters.
3. `POST /api/notes` — returns 422 when category_ids contains more than 5 entries.
4. `POST /api/notes` — returns 422 when category_ids references inactive/nonexistent category.
5. `PATCH /api/notes/{id}/categories` — returns 200 with valid categories and correct version.
6. `PATCH /api/notes/{id}/categories` — returns 409 when version is stale.
7. `GET /api/notes?client_id={id}&category={cat_id}` — returns filtered, paginated results.
8. `GET /api/notes?client_id={id}&category={cat_id}` — returns empty array when no matches.
9. `GET /api/categories` — returns full active taxonomy tree.
10. `POST /api/sync/batch` — processes array of events and returns individual statuses.
11. `POST /api/sync/batch` — returns 409 for events with version conflicts, 200 for others in same batch.
12. `POST /api/notes/{id}/resolve` — accepts resolution payload and increments version.

### Authentication & Authorization Tests
13. Any endpoint without auth token — returns 401.
14. `GET /api/notes` for unassigned client — returns 403.
15. `PATCH /api/notes/{id}/categories` for note not owned by agent — returns 403.

### Service Logic Tests
16. Conflict detection — service identifies version mismatch and returns conflict payload.
17. Batch sync processing — service processes events in order, rolls back individual failures without affecting batch.
18. Category deactivation — deactivated category excluded from active taxonomy query but preserved on existing notes.
19. Idempotency — re-submitting a SyncEvent with same id does not create duplicates.

### Data Validation Tests
20. Note model rejects body > 10,000 characters at validation layer.
21. Note model rejects category_ids array > 5 elements.
22. Note model requires client_id, agent_id, title as non-empty.
23. SyncEvent model requires note_id, action, payload, queued_at.
24. Category model requires name as non-empty, unique within same parent.

### Sync Engine Logic Tests (service layer)
25. Sync engine transmits events in queued_at chronological order.
26. Sync engine retries failed events with exponential backoff (2s, 4s, 8s).
27. Sync engine marks event as "failed" after 3 unsuccessful retries.
28. Sync engine skips already-acknowledged events on resume (no duplicates).
29. Sync engine refreshes local category cache after successful sync cycle.

## Success Criteria (measurable & verifiable)

- **Offline reliability**: 100% of notes created offline are retrievable by category without network, verified by automated integration tests.
- **Sync completeness**: 99.5% of pending SyncEvents successfully sync within 2 minutes of connectivity restoration (measured over 30-day rolling window).
- **Conflict rate**: < 2% of synced notes result in conflicts under normal usage patterns.
- **Retrieval performance**: Category-filtered queries return results within 500ms locally and 2s via API (p95).
- **Data integrity**: Zero data loss incidents — all locally saved notes are either synced or retained locally until sync succeeds.
- **API performance**: `POST /api/sync/batch` (50 events) responds within 5 seconds (p95).
- **Security**: Zero unauthorized access to notes; 100% of API requests validated for authentication and authorization.
- **Test coverage**: ≥ 90% line coverage on API endpoints and sync service logic; all acceptance criteria have corresponding automated tests.

## Key Entities

- **Note** (core record — client-generated UUID, supports offline creation)
- **Category** (taxonomy node — hierarchical, system or agent-created)
- **SyncEvent** (queue record — tracks offline changes pending transmission)
- **Agent** (field user — has client assignments and device state)
- **Client** (subject of notes — linked to agent assignments)
- **ConflictRecord** (temporary — holds both versions for agent resolution)

## Assumptions

- Field agents use mobile devices with local storage capacity sufficient for 30 days of offline data (~50MB per agent).
- The category taxonomy is relatively stable (< 50 categories); full cache refresh on sync is acceptable.
- Client-generated UUIDs are used for note IDs to avoid server round-trips for ID assignment.
- Authentication tokens are long-lived or refreshable offline (token validity ≥ 24 hours).
- The backend API is the single source of truth; local state defers to server state on conflict unless agent explicitly overrides.

## Milestones (high-level)

1. **M1** — Define requirements, acceptance criteria, and write failing test suite (US 75293, US 75296 partial).
2. **M2** — Implement API endpoints, business logic, sync processing, and conflict resolution; all backend tests pass (US 75294, US 75296).
3. **M3** — Develop UI components: offline note editor, category picker, sync status indicators, conflict resolution UI (US 75295).
4. **M4** — End-to-end integration testing, performance validation, and hardening.
5. **M5** — Document API (OpenAPI spec) and produce user guide for field agents (US 75297).

---

**Notes:**
- Authentication mechanism (OAuth2, device certificates, etc.) to be confirmed by security team.
- Retention policy for synced notes and resolved conflicts to be defined by compliance.
- Real-time push notification mechanism for taxonomy updates is deferred to a future iteration; current design relies on pull-on-sync.
- See Test-First Checklist for implementation sequencing — no endpoint or service logic may be implemented without a prior failing test.