# Feature: Transaction Management Subsystem Connectivity
Status: NEW
Owner: DevX
Last Updated: 2026-04-24

## Summary
Establish reliable, secure, and observable connectivity between the core platform and the Transaction Management Subsystem (TMS). The integration must enable the platform to create, retrieve, update, and cancel transactions in the TMS, handle responses and errors gracefully, and maintain a consistent view of transaction state across both systems. The design must prioritise data integrity, resilience to transient failures, auditability, and low-latency communication under production load.

## Actors
- Platform Service (upstream caller initiating transaction operations)
- Transaction Management Subsystem (TMS) (downstream system of record for transactions)
- Operations / SRE (monitors health, investigates failures)
- Compliance / Audit (reviews transaction logs and reconciliation reports)
- System (retry handlers, health-check probes, reconciliation jobs)

## Goals
- Provide a single, well-defined integration point for all transaction operations against the TMS.
- Guarantee that every transaction request results in a deterministic, traceable outcome (success, rejection, or explicit failure).
- Detect and recover from connectivity interruptions, timeouts, and partial failures without data loss or duplication.
- Deliver full observability—logging, metrics, and alerting—for all cross-system communication.
- Support future TMS version upgrades and schema changes with minimal disruption.

## Key Features
- Standardised connectivity layer that abstracts TMS protocol details from upstream consumers.
- Bi-directional message exchange supporting synchronous request/response and asynchronous event acknowledgement.
- Automatic retry with idempotency safeguards for transient failures.
- Health-check and circuit-breaker mechanisms to protect both systems under degraded conditions.
- Reconciliation capability to detect and surface state drift between the platform and TMS.
- Comprehensive audit trail for every transaction operation crossing the integration boundary.

## Data & Constraints

### Core Entities exchanged across the boundary
- **TransactionRequest**: id, correlation_id, type (create | update | cancel | query), payload, requested_by, requested_at
- **TransactionResponse**: id, correlation_id, tms_reference, status (accepted | rejected | error), result_payload, responded_at
- **ConnectivityEvent**: id, correlation_id, direction (outbound | inbound), endpoint, http_status / error_code, latency_ms, timestamp
- **ReconciliationRecord**: id, run_timestamp, platform_state, tms_state, match_result (matched | drifted | missing), resolution_status

### Constraints
- Every outbound request must carry an idempotency key; the TMS must be able to de-duplicate on this key.
- Payload size must not exceed the TMS-published maximum (to be confirmed with TMS team). [NEEDS CLARIFICATION: max payload size]
- All data in transit must be encrypted (TLS 1.2+). Credentials and tokens must never appear in logs.
- Personally identifiable information (PII) within transaction payloads must be handled per the organisation's data-protection policy.
- Connection pool limits and rate limits must respect TMS-published thresholds. [NEEDS CLARIFICATION: TMS rate-limit values]

## User Scenarios & Testing

### Scenario 1 — Create a transaction (happy path)
1. Platform Service sends a "create" transaction request with a valid payload and idempotency key.
2. Connectivity layer forwards the request to the TMS over the secured channel.
3. TMS responds with an "accepted" status and a TMS reference identifier.
4. Connectivity layer returns the response to the Platform Service and logs the round-trip event.

**Acceptance criteria (testable):**
- A valid create request returns a TMS reference and "accepted" status within the agreed latency budget.
- The ConnectivityEvent log contains correlation_id, direction, latency, and response status.
- Sending the same idempotency key twice does not create a duplicate transaction in the TMS.

### Scenario 2 — Transient failure and automatic retry
1. Platform Service sends a transaction request.
2. The TMS is temporarily unreachable (network blip or 503 response).
3. Connectivity layer retries according to the configured policy (exponential back-off, max retries).
4. On successful retry, the response is returned to the caller as normal.
5. If all retries are exhausted, the caller receives an explicit failure with a retry-exhausted reason.

**Acceptance criteria (testable):**
- Retries occur only for transient/retriable error codes; non-retriable errors (e.g., 400 Bad Request) are returned immediately.
- Each retry reuses the original idempotency key.
- After max retries, the caller receives a structured error within a bounded time window.
- Every retry attempt is logged as a separate ConnectivityEvent.

### Scenario 3 — Circuit breaker activates under sustained TMS outage
1. TMS returns errors for a sustained period exceeding the circuit-breaker threshold.
2. Circuit breaker opens; subsequent requests are fast-failed without contacting the TMS.
3. After the cool-down period, the circuit breaker enters half-open state and sends a probe request.
4. If the probe succeeds, normal traffic resumes; if it fails, the breaker re-opens.

**Acceptance criteria (testable):**
- When the breaker is open, callers receive a "service unavailable" response within 50 ms (no network call).
- An alert is raised when the circuit breaker opens.
- Recovery is automatic once the TMS becomes healthy; no manual intervention is required.

### Scenario 4 — Retrieve / query transaction status
1. Platform Service sends a query request with a TMS reference or correlation_id.
2. TMS returns the current transaction state.
3. Connectivity layer maps the TMS state to the platform's canonical status model and returns it.

**Acceptance criteria (testable):**
- Query for a known TMS reference returns the current status and key metadata.
- Query for an unknown reference returns a clear "not found" response, not an unhandled error.

### Scenario 5 — Reconciliation detects state drift
1. Scheduled reconciliation job compares platform transaction records with TMS records for a given time window.
2. Discrepancies are recorded as ReconciliationRecords with match_result = "drifted" or "missing".
3. Operations team is notified of unresolved discrepancies.

**Acceptance criteria (testable):**
- Reconciliation correctly identifies records that exist in one system but not the other.
- Reconciliation correctly identifies records where status differs between systems.
- A notification is sent when one or more drifted/missing records are detected.

### Scenario 6 — Cancel a transaction
1. Platform Service sends a cancel request with the TMS reference and idempotency key.
2. TMS confirms cancellation or rejects it (e.g., transaction already settled).
3. Response and reason are returned to the caller and logged.

**Acceptance criteria (testable):**
- A cancellable transaction is successfully cancelled and the TMS confirms the new state.
- A non-cancellable transaction returns a rejection with a human-readable reason code.

## Functional Requirements (testable)

### 1. Connection management
- The connectivity layer must establish and maintain a pooled, encrypted connection to the TMS.
- Connections that are idle beyond a configurable threshold must be recycled.
- Connection establishment failures must be logged and surfaced via health-check endpoints.

### 2. Request / response handling
- All outbound requests must include: correlation_id, idempotency_key, timestamp, and the operation payload.
- All inbound responses must be validated against the expected schema before being returned to the caller.
- Malformed or unexpected responses must be logged and returned to the caller as structured errors.

### 3. Idempotency
- Every mutating operation (create, update, cancel) must carry a unique idempotency key generated by the caller.
- The connectivity layer must forward this key to the TMS and must not generate a new key on retry.

### 4. Retry & back-off
- Transient failures (network timeouts, 502/503/504 responses) must trigger automatic retries.
- Retry policy must be configurable: max attempts, initial delay, back-off multiplier, max delay.
- Non-transient errors (4xx client errors excluding 429) must not be retried.

### 5. Circuit breaker
- A circuit breaker must protect the TMS from cascading load during sustained failures.
- Thresholds (failure count/percentage, window, cool-down) must be configurable.
- Circuit-breaker state changes (open, half-open, closed) must emit events consumable by monitoring.

### 6. Health checks
- A dedicated health-check endpoint must report the current connectivity status to the TMS (healthy, degraded, unavailable).
- Health checks must execute lightweight probe calls that do not create or modify transactions.

### 7. Observability
- Every cross-boundary call must produce a structured log entry containing: correlation_id, operation, direction, latency_ms, response_status, and error_code (if any).
- Metrics must be emitted for: request count, success/failure rate, latency percentiles (p50, p95, p99), retry count, and circuit-breaker state.
- Alerts must fire for: error rate exceeding threshold, p99 latency exceeding budget, circuit-breaker open.

### 8. Audit trail
- All transaction operations (create, update, cancel, query) must be recorded in an immutable audit log with actor, timestamp, correlation_id, operation, and outcome.
- Audit records must be queryable by correlation_id and by time range.

### 9. Reconciliation
- A reconciliation process must compare platform and TMS transaction states on a configurable schedule.
- Discrepancies must be persisted as ReconciliationRecords and surfaced to Operations.

### 10. Security
- All communication with the TMS must use TLS 1.2 or higher.
- Authentication credentials (API keys, tokens, certificates) must be stored in a secrets manager; rotation must not require downtime.
- No secrets or PII may appear in logs or metrics labels.

### 11. Versioning & compatibility [NEEDS CLARIFICATION: TMS versioning strategy]
- The connectivity layer must support mapping between the platform's canonical transaction model and the TMS's schema version.
- Schema changes in the TMS must be absorbable via configuration or mapping updates without a full platform release.

### 12. Timeout management
- Configurable per-operation timeouts must be enforced for all TMS calls.
- A timed-out request must be treated as a transient failure and follow the retry policy.
- Default timeout values must be agreed with the TMS team. [NEEDS CLARIFICATION: recommended timeout values]

## Success Criteria (measurable & verifiable)
- **Availability**: Connectivity layer uptime ≥ 99.9 % measured monthly (excluding planned TMS maintenance windows).
- **Latency**: 95th-percentile round-trip time for create/update/cancel operations ≤ agreed latency budget. [NEEDS CLARIFICATION: target latency SLA from TMS team]
- **Idempotency**: Zero duplicate transactions created due to retries, verified by reconciliation over a 30-day window.
- **Retry effectiveness**: ≥ 95 % of transient failures recovered automatically without caller intervention.
- **Error observability**: 100 % of cross-boundary calls produce a structured log entry and contribute to published metrics.
- **Reconciliation accuracy**: Reconciliation job detects 100 % of synthetically injected drift records in integration tests.
- **Audit completeness**: Every mutating transaction operation has a corresponding audit record; spot-check audits find zero gaps.
- **Security**: Zero high-severity vulnerabilities in the connectivity layer's dependency chain; TLS enforcement verified by automated scan.
- **Recovery time**: After a TMS outage, normal traffic resumes automatically within 60 seconds of TMS recovery (circuit-breaker half-open → closed).

## Key Entities
- **TransactionRequest** (outbound operation envelope)
- **TransactionResponse** (inbound result envelope)
- **ConnectivityEvent** (observability record per call)
- **ReconciliationRecord** (drift detection output)
- **CircuitBreakerState** (open / half-open / closed)
- **AuditEntry** (immutable operation log)

## Assumptions
- The TMS exposes a network-accessible API (REST, gRPC, or message queue) with published documentation.
- The TMS supports idempotency keys on mutating endpoints.
- Credentials for TMS access will be provisioned and rotated via the organisation's secrets-management tooling.
- A non-production TMS environment is available for integration and reconciliation testing.
- The platform already has a correlation-id propagation mechanism in place for distributed tracing.

## Milestones (high-level)
1. **M1 — Core connectivity & happy-path operations**
   Establish secure connection, implement create/query operations, basic logging, and health check.
2. **M2 — Resilience & full CRUD**
   Add update/cancel operations, retry with idempotency, circuit breaker, and timeout management.
3. **M3 — Observability, reconciliation & hardening**
   Full metrics and alerting, scheduled reconciliation, audit trail, security review, and performance validation.

---

**Notes:**
- Items marked **[NEEDS CLARIFICATION]** require input from the TMS team and platform architects before implementation begins.
- Reconciliation schedule and retention windows should be agreed with Compliance before M3.
- See `checklists/requirements.md` for spec quality validation.