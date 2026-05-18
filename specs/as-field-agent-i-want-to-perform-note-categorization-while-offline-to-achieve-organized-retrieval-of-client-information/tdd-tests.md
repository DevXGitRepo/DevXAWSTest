# TDD Test Specifications: Offline Note Categorization for Field Agents

## Overview

This feature enables field agents to categorize client notes while operating offline, ensuring organized retrieval of client information upon reconnection. The TDD approach validates the API endpoints for note categorization, the offline-capable business logic (queue/sync mechanisms), data validation rules, conflict resolution during sync, and category management operations.

The core challenge is ensuring data integrity when categorization operations occur without network connectivity and must later synchronize with the server. Tests are structured to first validate the categorization domain logic, then the offline queue/sync mechanism, and finally the API integration layer.

---

## Unit Test Specifications

### 1. Note Categorization Service

- **Test:** should_assign_single_category_to_note
  - **Given:** A note with ID `note-123` exists and a valid category `"Follow-Up"` is available
  - **When:** The categorization service assigns category `"Follow-Up"` to `note-123`
  - **Then:** The note's category is set to `"Follow-Up"` and the updated note is returned with a modified timestamp
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting category assignment; Green — implement minimal `categorizeNote(noteId, categoryId)` method; Refactor — extract category validation into a shared validator

- **Test:** should_assign_multiple_categories_to_note
  - **Given:** A note with ID `note-456` exists and categories `["Follow-Up", "Urgent", "Financial"]` are valid
  - **When:** The categorization service assigns all three categories to `note-456`
  - **Then:** The note's categories array contains exactly those three categories, and modified timestamp is updated
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting multi-category support; Green — extend implementation to accept array of categories; Refactor — normalize single/multi category input handling

- **Test:** should_reject_categorization_with_invalid_category_id
  - **Given:** A note with ID `note-789` exists but category `"NonExistent-Cat"` is not in the allowed category list
  - **When:** The categorization service attempts to assign `"NonExistent-Cat"` to `note-789`
  - **Then:** A validation error is returned with code `INVALID_CATEGORY` and the note remains unchanged
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting validation error; Green — add category existence check before assignment; Refactor — consolidate validation error response format

- **Test:** should_reject_categorization_for_nonexistent_note
  - **Given:** No note exists with ID `note-000`
  - **When:** The categorization service attempts to assign category `"Follow-Up"` to `note-000`
  - **Then:** An error is returned with code `NOTE_NOT_FOUND` and HTTP-equivalent status 404
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting not-found error; Green — add note existence check; Refactor — extract entity-not-found error pattern

- **Test:** should_remove_category_from_note
  - **Given:** A note `note-123` has categories `["Follow-Up", "Urgent"]`
  - **When:** The categorization service removes category `"Urgent"` from `note-123`
  - **Then:** The note's categories contain only `["Follow-Up"]` and modified timestamp is updated
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for category removal; Green — implement `removeCategoryFromNote(noteId, categoryId)`; Refactor — unify add/remove into a single update pattern

- **Test:** should_replace_all_categories_on_note
  - **Given:** A note `note-123` has categories `["Follow-Up", "Urgent"]`
  - **When:** The categorization service replaces categories with `["Completed"]`
  - **Then:** The note's categories contain only `["Completed"]`
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for full replacement; Green — implement replace logic; Refactor — ensure idempotency

- **Test:** should_not_allow_duplicate_categories_on_same_note
  - **Given:** A note `note-123` already has category `"Follow-Up"`
  - **When:** The categorization service assigns `"Follow-Up"` again to `note-123`
  - **Then:** The note's categories still contain only one instance of `"Follow-Up"` (idempotent operation, no error)
  - **Priority:** Medium
  - **TDD Phase:** Red — write test expecting deduplication; Green — add duplicate check before insertion; Refactor — use set-based data structure for categories

- **Test:** should_enforce_maximum_categories_per_note_limit
  - **Given:** A note `note-123` already has 10 categories (system maximum) assigned
  - **When:** The categorization service attempts to assign an 11th category
  - **Then:** A validation error is returned with code `MAX_CATEGORIES_EXCEEDED` and message indicating the limit
  - **Priority:** Medium
  - **TDD Phase:** Red — write test expecting limit enforcement; Green — add count check; Refactor — make limit configurable

### 2. Category Management Service

- **Test:** should_create_new_category
  - **Given:** A valid category payload with name `"Insurance Review"` and color `"#FF5733"`
  - **When:** The category creation service is invoked
  - **Then:** A new category is created with a generated ID, the provided name and color, and a creation timestamp
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting category creation; Green — implement `createCategory(payload)`; Refactor — extract ID generation

- **Test:** should_reject_category_creation_with_empty_name
  - **Given:** A category payload with an empty string name `""`
  - **When:** The category creation service is invoked
  - **Then:** A validation error is returned with code `CATEGORY_NAME_REQUIRED`
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting validation failure; Green — add name presence validation; Refactor — consolidate input validators

- **Test:** should_reject_category_creation_with_duplicate_name
  - **Given:** A category named `"Follow-Up"` already exists for the agent
  - **When:** The category creation service is invoked with name `"Follow-Up"`
  - **Then:** A validation error is returned with code `CATEGORY_NAME_DUPLICATE`
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting duplicate rejection; Green — add uniqueness check; Refactor — normalize name comparison (case-insensitive)

- **Test:** should_list_all_categories_for_agent
  - **Given:** Agent `agent-A` has 5 categories defined
  - **When:** The category listing service is invoked for `agent-A`
  - **Then:** All 5 categories are returned, sorted alphabetically by name
  - **Priority:** Medium
  - **TDD Phase:** Red — write test expecting full list; Green — implement `listCategories(agentId)`; Refactor — add sorting abstraction

- **Test:** should_delete_category_and_unlink_from_notes
  - **Given:** Category `"Obsolete"` is assigned to 3 notes
  - **When:** The category deletion service removes `"Obsolete"`
  - **Then:** The category is deleted, and all 3 notes no longer reference it
  - **Priority:** Medium
  - **TDD Phase:** Red — write test expecting cascade unlink; Green — implement delete with note update; Refactor — consider soft-delete pattern

- **Test:** should_update_category_name
  - **Given:** A category with ID `cat-1` has name `"Follow Up"`
  - **When:** The category update service renames it to `"Follow-Up Action"`
  - **Then:** The category name is updated and all notes referencing it reflect the new name on retrieval
  - **Priority:** Low
  - **TDD Phase:** Red — write test for rename; Green — implement update; Refactor — ensure referential consistency

### 3. Offline Queue Service

- **Test:** should_enqueue_categorization_operation_when_offline
  - **Given:** The device is offline and agent performs a categorization action
  - **When:** The offline queue service receives the operation `{noteId: "note-123", action: "ADD_CATEGORY", categoryId: "cat-1", timestamp: T1}`
  - **Then:** The operation is persisted in the local queue with status `PENDING` and a sequential order number
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting queue persistence; Green — implement `enqueueOperation(operation)`; Refactor — extract queue storage interface

- **Test:** should_preserve_operation_order_in_queue
  - **Given:** Three categorization operations are enqueued at timestamps T1, T2, T3
  - **When:** The queue is read back
  - **Then:** Operations are returned in FIFO order (T1 first, T3 last)
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting ordered retrieval; Green — implement ordered storage; Refactor — use monotonic sequence counter

- **Test:** should_store_complete_operation_payload_for_replay
  - **Given:** An offline categorization operation with full context (agentId, noteId, categoryId, action, clientTimestamp, metadata)
  - **When:** The operation is enqueued
  - **Then:** All fields are persisted and retrievable without data loss
  - **Priority:** High
  - **TDD Phase:** Red — write test verifying all fields; Green — implement full payload storage; Refactor — define operation schema/contract

- **Test:** should_mark_operation_as_synced_after_successful_upload
  - **Given:** A pending operation `op-1` exists in the queue
  - **When:** The sync service successfully uploads `op-1` to the server
  - **Then:** The operation status changes to `SYNCED` and a server-confirmed timestamp is recorded
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting status transition; Green — implement `markAsSynced(operationId, serverTimestamp)`; Refactor — add state machine for operation lifecycle

- **Test:** should_mark_operation_as_failed_with_retry_count
  - **Given:** A pending operation `op-2` fails during sync
  - **When:** The sync service records the failure
  - **Then:** The operation status changes to `FAILED`, retry count increments by 1, and the error reason is stored
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting failure recording; Green — implement failure handling; Refactor — extract retry policy

- **Test:** should_not_exceed_maximum_retry_attempts
  - **Given:** An operation `op-3` has already been retried 5 times (maximum)
  - **When:** The sync service attempts to retry it again
  - **Then:** The operation is marked as `PERMANENTLY_FAILED` and is not retried further
  - **Priority:** Medium
  - **TDD Phase:** Red — write test expecting permanent failure; Green — add retry limit check; Refactor — make retry limit configurable

- **Test:** should_return_pending_operations_count
  - **Given:** The queue contains 3 PENDING, 2 SYNCED, and 1 FAILED operations
  - **When:** The queue service reports pending count
  - **Then:** The count returned is 3
  - **Priority:** Low
  - **TDD Phase:** Red — write test for count; Green — implement count query; Refactor — add general status filter

### 4. Sync/Conflict Resolution Service

- **Test:** should_sync_all_pending_operations_in_order
  - **Given:** The device comes online with 3 pending operations in queue
  - **When:** The sync service initiates synchronization
  - **Then:** All 3 operations are submitted to the server API in their original enqueue order
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting ordered submission; Green — implement sequential sync loop; Refactor — add batch submission option

- **Test:** should_resolve_conflict_with_server_wins_strategy
  - **Given:** An offline operation categorized `note-123` as `"Urgent"` at T1, but the server shows `note-123` was categorized as `"Completed"` at T2 (T2 > T1)
  - **When:** The sync service detects the conflict
  - **Then:** The server version wins, `note-123` retains `"Completed"`, and the local operation is marked as `CONFLICT_RESOLVED_SERVER_WINS`
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting server-wins resolution; Green — implement timestamp comparison logic; Refactor — extract conflict resolution strategy pattern

- **Test:** should_resolve_conflict_with_client_wins_when_server_has_older_timestamp
  - **Given:** An offline operation categorized `note-123` as `"Urgent"` at T2, but the server shows last modification at T1 (T1 < T2)
  - **When:** The sync service detects the conflict
  - **Then:** The client version wins, `note-123` is updated to `"Urgent"` on the server
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting client-wins; Green — implement last-write-wins logic; Refactor — unify with server-wins into single strategy

- **Test:** should_handle_note_deleted_on_server_during_offline_period
  - **Given:** An offline operation attempts to categorize `note-999` which was deleted on the server while agent was offline
  - **When:** The sync service processes this operation
  - **Then:** The operation is marked as `CONFLICT_NOTE_DELETED`, the agent is notified, and no error crashes the sync process
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting graceful handling of deleted note; Green — add server response handling for 404/gone; Refactor — generalize entity-gone handling

- **Test:** should_handle_category_deleted_on_server_during_offline_period
  - **Given:** An offline operation assigns category `cat-deleted` which no longer exists on the server
  - **When:** The sync service processes this operation
  - **Then:** The operation is marked as `CONFLICT_CATEGORY_DELETED` and the agent is notified
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for deleted category scenario; Green — handle category validation on sync; Refactor — unify entity-deleted conflict handling

- **Test:** should_merge_non_conflicting_category_additions
  - **Given:** Offline operation adds category `"Urgent"` to `note-123`, and server independently added category `"Financial"` to `note-123`
  - **When:** The sync service processes the offline operation
  - **Then:** Both categories are present on `note-123` (merge, no conflict)
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting merge; Green — implement additive merge logic for non-overlapping changes; Refactor — distinguish additive vs. replacement operations

- **Test:** should_generate_sync_report_after_completion
  - **Given:** A sync batch of 5 operations completes with 3 successful, 1 conflict resolved, 1 failed
  - **When:** The sync service finishes processing
  - **Then:** A sync report is generated containing counts for each status and details of conflicts/failures
  - **Priority:** Medium
  - **TDD Phase:** Red — write test expecting report structure; Green — implement report aggregation; Refactor — extract report builder

### 5. Note Retrieval by Category Service

- **Test:** should_retrieve_notes_filtered_by_single_category
  - **Given:** Agent has 10 notes, 3 of which are categorized as `"Follow-Up"`
  - **When:** The retrieval service is queried with filter `category = "Follow-Up"`
  - **Then:** Exactly 3 notes are returned, all having `"Follow-Up"` in their categories
  - **Priority:** High
  - **TDD Phase:** Red — write test expecting filtered results; Green — implement `getNotesByCategory(agentId, categoryId)`; Refactor — add pagination support

- **Test:** should_retrieve_notes_filtered_by_multiple_categories_with_AND_logic
  - **Given:** Agent has notes where 2 notes have both `"Follow-Up"` AND `"Urgent"`
  - **When:** The retrieval service is queried with filter `categories = ["Follow-Up", "Urgent"]` and logic `AND`
  - **Then:** Exactly 2 notes are returned
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for AND filter; Green — implement multi-category AND query; Refactor — extract filter strategy

- **Test:** should_retrieve_notes_filtered_by_multiple_categories_with_OR_logic
  - **Given:** Agent has 3 notes with `"Follow-Up"` and 2 notes with `"Urgent"` (1 overlapping)
  - **When:** The retrieval service is queried with filter `categories = ["Follow-Up", "Urgent"]` and logic `OR`
  - **Then:** 4 unique notes are returned (union, no duplicates)
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for OR filter; Green — implement OR query with deduplication; Refactor — unify AND/OR into composable filter

- **Test:** should_retrieve_uncategorized_notes
  - **Given:** Agent has 10 notes, 2 of which have no categories assigned
  - **When:** The retrieval service is queried with filter `uncategorized = true`
  - **Then:** Exactly 2 notes are returned
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for uncategorized filter; Green — implement empty-category query; Refactor — add as special filter case

- **Test:** should_return_empty_list_when_no_notes_match_category
  - **Given:** Agent has notes but none categorized as `"Archived"`
  - **When:** The retrieval service is queried with filter `category = "Archived"`
  - **Then:** An empty array is returned (not null, not error)
  - **Priority:** Low
  - **TDD Phase:** Red — write test expecting empty array; Green — ensure empty result handling; Refactor — standardize empty response format

### 6. Data Validation Service

- **Test:** should_validate_note_id_format
  - **Given:** A categorization request with `noteId = ""`
  - **When:** The validation service checks the request
  - **Then:** Validation fails with error `NOTE_ID_REQUIRED`
  - **Priority:** High
  - **TDD Phase:** Red — write test for empty noteId; Green — add noteId presence check; Refactor — build validation pipeline

- **Test:** should_validate_category_id_format
  - **Given:** A categorization request with `categoryId = null`
  - **When:** The validation service checks the request
  - **Then:** Validation fails with error `CATEGORY_ID_REQUIRED`
  - **Priority:** High
  - **TDD Phase:** Red — write test for null categoryId; Green — add categoryId check; Refactor — reuse validation pipeline

- **Test:** should_validate_category_name_length_within_bounds
  - **Given:** A category creation request with name exceeding 100 characters
  - **When:** The validation service checks the request
  - **Then:** Validation fails with error `CATEGORY_NAME_TOO_LONG` and indicates max length of 100
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for length violation; Green — add length check; Refactor — parameterize length limits

- **Test:** should_sanitize_category_name_input
  - **Given:** A category creation request with name containing `<script>alert('xss')</script>`
  - **When:** The validation service processes the request
  - **Then:** The name is sanitized or rejected with error `INVALID_CHARACTERS`
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for malicious input; Green — add sanitization/rejection; Refactor — extract sanitization utility

- **Test:** should_validate_timestamp_format_in_offline_operation
  - **Given:** An offline operation with `timestamp = "not-a-date"`
  - **When:** The validation service checks the operation
  - **Then:** Validation fails with error `INVALID_TIMESTAMP_FORMAT`
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for invalid timestamp; Green — add ISO-8601 format check; Refactor — centralize date validation

- **Test:** should_validate_action_type_is_allowed
  - **Given:** An offline operation with `action = "DESTROY_NOTE"`
  - **When:** The validation service checks the operation
  - **Then:** Validation fails with error `INVALID_ACTION_TYPE` and lists allowed actions
  - **Priority:** Medium
  - **TDD Phase:** Red — write test for invalid action; Green — add action whitelist check; Refactor — define action enum/constant

---

## Integration Test Specifications

### 1. API Endpoint — Categorize Note

- **Test:** POST /api/notes/{noteId}/categories should assign category and return 200
  - **Given:** An authenticated agent, an existing note `note-123`, and a valid category `cat-1`
  - **When:** POST request is made to `/api/notes/note-123/categories` with body `{"categoryId": "cat-1"}`
  - **Then:** Response status is 200, response body contains the updated note with `cat-1` in its categories array
  - **Priority:** High

- **Test:** POST /api/notes/{noteId}/categories should return 404 for nonexistent note
  - **Given:** An authenticated agent and no note with ID `note-nonexistent`
  - **When:** POST request is made to `/api/notes/note-nonexistent/categories` with body `{"categoryId": "cat-1"}`
  - **Then:** Response status is 404, response body contains error code `NOTE_NOT_FOUND`
  - **Priority:** High

- **Test:** POST /api/notes/{noteId}/categories should return 400 for invalid category
  - **Given:** An authenticated agent, an existing note, and an invalid category ID
  - **When:** POST request is made with the invalid category
  - **Then:** Response status is 400, response body contains error code `INVALID_CATEGORY`
  - **Priority:** High

- **Test:** POST /api/notes/{noteId}/categories should return 401 for unauthenticated request
  - **Given:** No authentication token is provided
  - **When:** POST request is made to `/api/notes/note-123/categories`
  - **Then:** Response status is 401
  - **Priority:** High

- **Test:** POST /api/notes/{noteId}/categories should return 403 when agent does not own the note
  - **Given:** An authenticated agent `agent-B` and a note owned by `agent-A`
  - **When:** `agent-B` attempts to categorize `agent-A`'s note
  - **Then:** Response status is 403, response body contains error code `FORBIDDEN`
  - **Priority:** High

### 2. API Endpoint — Remove Category from Note

- **Test:** DELETE /api/notes/{noteId}/categories/{categoryId} should remove category and return 200
  - **Given:** An authenticated agent and note `note-123` with category `cat-1` assigned
  - **When:** DELETE request is made to `/api/notes/note-123/categories/cat-1`
  - **Then:** Response status is 200, note no longer contains `cat-1`
  - **Priority:** High

- **Test:** DELETE /api/notes/{noteId}/categories/{categoryId} should return 404 when category not on note
  - **Given:** An authenticated agent and note `note-123` without category `cat-99`
  - **When:** DELETE request is made to `/api/notes/note-123/categories/cat-99`
  - **Then:** Response status is 404 or 200 (idempotent) — define expected behavior
  - **Priority:** Medium

### 3. API Endpoint — Sync Offline Operations

- **Test:** POST /api/sync/categorizations should process batch of offline operations
  - **Given:** An authenticated agent with 3 valid offline categorization operations
  - **When:** POST request is made to `/api/sync/categorizations` with the batch payload
  - **Then:** Response status is 200, response body contains results for
 each operation (success/conflict/failure status per operation)
  - **Priority:** High

- **Test:** POST /api/sync/categorizations should return partial success when some operations fail
  - **Given:** An authenticated agent with 5 operations, 2 of which reference deleted notes
  - **When:** POST request is made with the batch
  - **Then:** Response status is 207 (Multi-Status), response body contains 3 successes and 2 conflict entries with `CONFLICT_NOTE_DELETED` codes
  - **Priority:** High

- **Test:** POST /api/sync/categorizations should reject batch exceeding maximum size
  - **Given:** An authenticated agent submits a batch of 501 operations (limit is 500)
  - **When:** POST request is made
  - **Then:** Response status is 413, response body contains error code `BATCH_SIZE_EXCEEDED`
  - **Priority:** Medium

- **Test:** POST /api/sync/categorizations should be idempotent for already-synced operations
  - **Given:** An operation with client-generated ID `op-abc` was already successfully synced
  - **When:** The same operation `op-abc` is submitted again (retry scenario)
  - **Then:** Response status is 200, the operation is reported as `ALREADY_SYNCED`, and no duplicate side effects occur
  - **Priority:** High

- **Test:** POST /api/sync/categorizations should validate all operations before processing
  - **Given:** A batch where operation 2 of 5 has an invalid payload (missing noteId)
  - **When:** POST request is made
  - **Then:** Response status is 400, response identifies the invalid operation by index, and no operations in the batch are processed (atomic validation)
  - **Priority:** Medium

### 4. API Endpoint — Category CRUD

- **Test:** POST /api/categories should create category and return 201
  - **Given:** An authenticated agent with payload `{"name": "Insurance Review", "color": "#FF5733"}`
  - **When:** POST request is made to `/api/categories`
  - **Then:** Response status is 201, response body contains the created category with generated ID
  - **Priority:** High

- **Test:** GET /api/categories should return all categories for authenticated agent
  - **Given:** An authenticated agent with 5 categories
  - **When:** GET request is made to `/api/categories`
  - **Then:** Response status is 200, response body contains array of 5 categories sorted alphabetically
  - **Priority:** High

- **Test:** PUT /api/categories/{categoryId} should update category and return 200
  - **Given:** An authenticated agent and existing category `cat-1` with name `"Old Name"`
  - **When:** PUT request is made with `{"name": "New Name"}`
  - **Then:** Response status is 200, category name is updated
  - **Priority:** Medium

- **Test:** DELETE /api/categories/{categoryId} should delete category and return 204
  - **Given:** An authenticated agent and existing category `cat-1` assigned to 2 notes
  - **When:** DELETE request is made to `/api/categories/cat-1`
  - **Then:** Response status is 204, category is removed, and the 2 notes no longer reference it
  - **Priority:** Medium

### 5. API Endpoint — Retrieve Notes by Category

- **Test:** GET /api/notes?category={categoryId} should return filtered notes
  - **Given:** An authenticated agent with 10 notes, 3 categorized as `cat-1`
  - **When:** GET request is made to `/api/notes?category=cat-1`
  - **Then:** Response status is 200, response body contains exactly 3 notes
  - **Priority:** High

- **Test:** GET /api/notes?categories=cat-1,cat-2&logic=AND should return intersection
  - **Given:** An authenticated agent with notes having various category combinations
  - **When:** GET request is made with AND logic
  - **Then:** Response status is 200, only notes having BOTH categories are returned
  - **Priority:** Medium

- **Test:** GET /api/notes?uncategorized=true should return notes without categories
  - **Given:** An authenticated agent with 2 uncategorized notes
  - **When:** GET request is made with uncategorized filter
  - **Then:** Response status is 200, exactly 2 notes returned, none having categories
  - **Priority:** Medium

### 6. Database Integration — Offline Queue Persistence

- **Test:** should_persist_offline_operations_across_service_restart
  - **Given:** 3 operations are enqueued in the local database
  - **When:** The service/application is restarted and the queue is queried
  - **Then:** All 3 operations are still present with correct data and order
  - **Priority:** High

- **Test:** should_handle_concurrent_enqueue_operations_without_data_loss
  - **Given:** Two categorization actions occur simultaneously on the device
  - **When:** Both are enqueued at nearly the same timestamp
  - **Then:** Both operations are stored with distinct sequence numbers and no data corruption
  - **Priority:** Medium

- **Test:** should_clean_up_synced_operations_after_retention_period
  - **Given:** Operations marked as `SYNCED` older than 7 days exist in the queue
  - **When:** The cleanup job runs
  - **Then:** Those operations are removed from local storage, while PENDING and recent SYNCED operations remain
  - **Priority:** Low

---

## Acceptance Test Scenarios

### US 75294: Implement API Endpoint and Business Logic

- **Scenario:** Field agent categorizes a note while offline
  - **Given:** The agent is authenticated and the device has no network connectivity
  - **When:** The agent assigns category `"Follow-Up"` to a client note
  - **Then:** The operation is stored locally in the offline queue, the note appears categorized in the local view, and no server request is attempted

- **Scenario:** Field agent's device reconnects and syncs categorizations
  - **Given:** The agent has 4 pending categorization operations in the offline queue and the device regains connectivity
  - **When:** The sync process is triggered (automatically or manually)
  - **Then:** All 4 operations are sent to the server in order, successful operations are marked as synced, and the agent receives a sync summary

- **Scenario:** Field agent retrieves notes by category after sync
  - **Given:** The agent has synced categorizations and is now online
  - **When:** The agent requests all notes in category `"Urgent"`
  - **Then:** The API returns all notes categorized as `"Urgent"` including those categorized offline

- **Scenario:** Conflict detected during sync — server has newer change
  - **Given:** The agent categorized `note-123` as `"Pending"` offline at 10:00 AM, but another system updated it to `"Resolved"` at 10:05 AM
  - **When:** The sync process runs
  - **Then:** The conflict is resolved using last-write-wins (server wins), the note retains `"Resolved"`, and the agent is informed of the conflict resolution

- **Scenario:** Field agent creates a new category while offline
  - **Given:** The agent is offline and needs a new category `"Home Visit"`
  - **When:** The agent creates the category locally
  - **Then:** The category is available for local use immediately, and a creation operation is queued for sync

### US 75293: Define Requirements and Acceptance Criteria

- **Scenario:** System enforces category naming rules
  - **Given:** The agent attempts to create a category with an empty name
  - **When:** The request is validated
  - **Then:** The system rejects the request with a clear error message indicating the name is required

- **Scenario:** System prevents unauthorized access to another agent's notes
  - **Given:** Agent B attempts to categorize a note belonging to Agent A
  - **When:** The API processes the request
  - **Then:** The system returns a 403 Forbidden response and no modification occurs

### US 75296: Write Unit and Integration Tests

- **Scenario:** All offline operations are recoverable after app crash
  - **Given:** The agent has queued 5 operations and the application crashes unexpectedly
  - **When:** The application restarts and checks the queue
  - **Then:** All 5 operations are intact and ready for sync

- **Scenario:** Sync handles network interruption gracefully
  - **Given:** The sync process is midway through uploading 10 operations (5 of 10 completed)
  - **When:** Network connectivity is lost again
  - **Then:** The 5 successfully synced operations are marked as SYNCED, the remaining 5 stay as PENDING, and no data is corrupted

### US 75297: Document API and User Guide

- **Scenario:** API returns well-structured error responses
  - **Given:** Any invalid request is made to any categorization endpoint
  - **When:** The server processes the request
  - **Then:** The error response follows a consistent format: `{"error": {"code": "...", "message": "...", "details": {...}}}` with appropriate HTTP status codes

---

## Test-First Development Guidelines

### Red Phase — Test Writing Order

1. **Start with data validation tests** — These define the contract and boundaries of acceptable input. Write all validation tests for note ID, category ID, name length, timestamp format, and action type first.
2. **Write categorization service unit tests** — Core business logic for assigning, removing, and replacing categories on notes.
3. **Write category management tests** — CRUD operations for categories themselves.
4. **Write offline queue service tests** — Enqueue, ordering, status transitions, and retry logic.
5. **Write conflict resolution tests** — Server-wins, client-wins, merge, and entity-deleted scenarios.
6. **Write retrieval/filter tests** — Querying notes by category with various filter combinations.
7. **Write API integration tests** — Full request/response cycle for each endpoint.
8. **Write sync batch integration tests** — End-to-end sync flow with partial success and idempotency.

### Green Phase — Implementation Sequence

1. Implement the **validation layer** — input validators, schema definitions, error response format.
2. Implement the **category entity and repository** — basic CRUD storage.
3. Implement the **note-category association logic** — add/remove/replace operations.
4. Implement the **offline queue storage** — local persistence with ordering.
5. Implement the **sync engine** — sequential processing, status transitions, retry logic.
6. Implement the **conflict resolution strategies** — timestamp comparison, merge logic.
7. Implement the **API controllers/routes** — wire up endpoints to services.
8. Implement the **retrieval filters** — category-based note queries.

### Refactor Phase — Considerations

- **After 3+ validation checks:** Extract a generic `RequestValidator` pipeline that chains validation rules.
- **After 3+ entity-not-found checks:** Extract a `ResourceResolver` middleware that handles 404 responses uniformly.
- **After conflict resolution patterns emerge:** Apply the Strategy pattern for conflict resolution (ServerWinsStrategy, ClientWinsStrategy, MergeStrategy).
- **After queue status transitions stabilize:** Formalize as a state machine with explicit allowed transitions.
- **After API error responses are consistent:** Extract an `ErrorResponseBuilder` utility.
- **Ensure all services depend on interfaces/abstractions** — repository interfaces for storage, sync client interfaces for network calls.
- **Extract timestamp handling** — centralize UTC conversion, comparison, and formatting.

---

## Edge Cases & Boundary Tests

### Boundary Conditions

- **Test:** should_handle_note_with_exactly_zero_categories
  - **Given:** A note with an empty categories array
  - **When:** The first category is added
  - **Then:** The categories array transitions from `[]` to `["cat-1"]` correctly

- **Test:** should_handle_note_at_maximum_category_limit_boundary
  - **Given:** A note with exactly 9 categories (limit is 10)
  - **When:** A 10th category is added
  - **Then:** The operation succeeds (boundary is inclusive)

- **Test:** should_handle_category_name_at_exact_max_length
  - **Given:** A category name of exactly 100 characters
  - **When:** The category is created
  - **Then:** The operation succeeds without truncation

- **Test:** should_handle_empty_sync_batch
  - **Given:** The sync endpoint receives an empty operations array `[]`
  - **When:** The request is processed
  - **Then:** Response status is 200 with an empty results array (no error)

- **Test:** should_handle_single_operation_sync_batch
  - **Given:** A batch with exactly 1 operation
  - **When:** The sync processes it
  - **Then:** The operation is processed normally without batch-specific issues

- **Test:** should_handle_sync_batch_at_maximum_size
  - **Given:** A batch with exactly 500 operations (at the limit)
  - **When:** The sync processes it
  - **Then:** All 500 operations are processed successfully

### Error Handling

- **Test:** should_handle_database_connection_failure_during_enqueue
  - **Given:** The local database is unavailable (disk full, corrupted)
  - **When:** An enqueue operation is attempted
  - **Then:** A meaningful error is returned with code `STORAGE_UNAVAILABLE` and the operation is not silently lost

- **Test:** should_handle_server_timeout_during_sync
  - **Given:** The server does not respond within the configured timeout (30 seconds)
  - **When:** The sync service is waiting for a response
  - **Then:** The operation is marked as `FAILED` with reason `SERVER_TIMEOUT`, retry is scheduled, and remaining operations continue processing

- **Test:** should_handle_server_500_error_during_sync
  - **Given:** The server returns a 500 Internal Server Error for an operation
  - **When:** The sync service receives this response
  - **Then:** The operation is marked as `FAILED` with reason `SERVER_ERROR`, retry count increments, and the sync continues with remaining operations

- **Test:** should_handle_malformed_server_response_during_sync
  - **Given:** The server returns a 200 status but with unparseable/malformed JSON body
  - **When:** The sync service attempts to parse the response
  - **Then:** The operation is marked as `FAILED` with reason `INVALID_RESPONSE`, and the error is logged for debugging

- **Test:** should_handle_authentication_token_expiry_during_sync
  - **Given:** The agent's auth token expires midway through a sync batch
  - **When:** The server returns 401 for the next operation
  - **Then:** The sync pauses, a token refresh is attempted, and if successful, sync resumes from the failed operation

- **Test:** should_not_corrupt_queue_on_unexpected_process_termination
  - **Given:** The application is killed (force stop) while writing an operation to the queue
  - **When:** The application restarts
  - **Then:** The queue is in a consistent state — either the operation is fully written or not present (no partial writes)

### Concurrency & Timing

- **Test:** should_prevent_duplicate_sync_when_triggered_simultaneously
  - **Given:** The sync process is already running
  - **When:** A second sync trigger occurs (e.g., network reconnect event fires twice)
  - **Then:** Only one sync process runs; the second trigger is ignored or queued until the first completes

- **Test:** should_handle_new_offline_operations_enqueued_during_active_sync
  - **Given:** A sync is in progress processing operations 1-5
  - **When:** The agent performs a new categorization (operation 6) while sync is running
  - **Then:** Operation 6 is safely enqueued and will be included in the next sync cycle, not the current one

- **Test:** should_handle_rapid_successive_categorizations_on_same_note
  - **Given:** The agent rapidly assigns and then removes a category on the same note within milliseconds
  - **When:** Both operations are enqueued
  - **Then:** Both operations are preserved in order, and when synced, the final state reflects the last operation (category removed)

- **Test:** should_handle_clock_skew_between_client_and_server
  - **Given:** The client device clock is 5 minutes ahead of the server clock
  - **When:** Conflict resolution compares timestamps
  - **Then:** The system uses server-normalized timestamps or a logical clock to avoid incorrect conflict resolution due to clock drift

- **Test:** should_handle_concurrent_category_deletion_and_note_categorization
  - **Given:** Agent deletes category `cat-1` while another queued operation assigns `cat-1` to a note
  - **When:** Both operations sync
  - **Then:** The system resolves this gracefully — the categorization fails with `CONFLICT_CATEGORY_DELETED` and the deletion succeeds