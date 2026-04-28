# Feature: As Backend Developer, I want to perform retry logic for failed Whisper API calls to achieve resilient transcription processing
Status: NEW
Owner: DevX
Last Updated: 2026-04-24

Status: NEW
Owner: Backend Engineering
Last Updated: 2025-01-15

## Summary

Implement a robust, configurable retry mechanism for outbound calls to the Whisper speech-to-text API so that transient failures (network timeouts, rate-limit responses, temporary service unavailability) are handled automatically without data loss or duplicate processing. The mechanism must provide predictable back-off behaviour, clear observability into retry attempts, and well-defined terminal failure handling so that upstream callers and operators can trust the transcription pipeline's reliability.

## Actors

- **Backend Service** (the application component that initiates Whisper API calls)
- **Whisper API** (external speech-to-text service)
- **Operations / SRE** (monitors health, configures retry policies, responds to alerts)
- **Upstream Caller** (any internal service or job scheduler that requests a transcription)
- **System** (background processors, logging & alerting infrastructure)

## Goals

- Automatically recover from transient Whisper API failures without manual intervention.
- Prevent unnecessary load on the Whisper API through intelligent back-off and jitter.
- Guarantee that every transcription request reaches a deterministic terminal state (success **or** permanent failure) with full traceability.
- Provide operators with clear visibility into retry behaviour, failure rates, and exhaustion events.
- Ensure no duplicate transcription results are persisted due to retried calls.

## Key Features

- Configurable retry policy (max attempts, back-off strategy, jitter, per-error-class behaviour).
- Classification of Whisper API errors into **retryable** and **non-retryable** categories.
- Exponential back-off with jitter to avoid thundering-herd effects.
- Idempotency safeguards so retried requests do not produce duplicate transcription records.
- Dead-letter / permanent-failure pathway for requests that exhaust all retry attempts.
- Structured logging and metrics emission for every retry attempt and terminal outcome.
- Circuit-breaker awareness to stop retrying when the Whisper API is experiencing sustained outages.

## Data & Constraints

### Key Data Objects

| Object | Key Fields |
|---|---|
| **TranscriptionRequest** | id, audio_reference, caller_id, created_at, status, attempt_count, last_attempt_at, next_retry_at |
| **RetryAttempt** | id, request_id, attempt_number, timestamp, response_code, error_class, latency_ms |
| **PermanentFailure** | id, request_id, final_error, exhausted_at, operator_notified |

### Constraints

- **Max retry attempts**: configurable; default 5 (must be overridable without redeployment).
- **Back-off ceiling**: maximum delay between retries must be capped (default 60 seconds).
- **Request timeout**: each individual Whisper API call must enforce a timeout (default 30 seconds).
- **Rate-limit compliance**: retry timing must respect `Retry-After` headers when returned by the Whisper API.
- **Idempotency**: the system must not persist duplicate transcription results for the same request after retries.
- **Data sensitivity**: audio references and transcription content must follow existing encryption-at-rest and in-transit policies.
- **No silent data loss**: every request must reach a logged terminal state.

## User Scenarios & Testing

### Scenario 1 — Transient failure followed by success (happy retry path)

1. Backend Service sends a transcription request to the Whisper API.
2. Whisper API responds with a transient error (e.g., HTTP 503 or network timeout).
3. System logs the failure, increments the attempt counter, and schedules a retry after the computed back-off delay.
4. On the next attempt, Whisper API responds with HTTP 200 and a valid transcription.
5. System persists the transcription result and marks the request as **completed**.

**Acceptance criteria (testable):**

- The transcription result is persisted exactly once despite the initial failure.
- The retry delay between attempt 1 and attempt 2 is ≥ the configured base back-off interval.
- A structured log entry exists for the failed attempt **and** the successful attempt, each containing request id, attempt number, response code, and latency.

### Scenario 2 — All retry attempts exhausted (permanent failure)

1. Backend Service sends a transcription request.
2. Every attempt (up to the configured maximum) returns a retryable error.
3. After the final failed attempt, the system marks the request as **permanently failed**.
4. System emits an alert / notification to Operations and routes the request to the dead-letter pathway.

**Acceptance criteria (testable):**

- The request status is set to a terminal failure state after exactly `max_attempts` total attempts (initial + retries).
- An alert or notification is dispatched to the configured operations channel within 60 seconds of exhaustion.
- The permanent failure record includes the final error details and a timestamp.
- No further retry attempts occur after exhaustion.

### Scenario 3 — Non-retryable error (immediate terminal failure)

1. Whisper API responds with a non-retryable error (e.g., HTTP 400 Bad Request, 401 Unauthorized, 422 Unprocessable Entity).
2. System marks the request as **permanently failed** immediately without scheduling any retry.

**Acceptance criteria (testable):**

- Total attempt count is exactly 1.
- The failure is logged with the error classification "non-retryable" and the original response code.
- No back-off delay is scheduled.

### Scenario 4 — Rate-limit response with `Retry-After` header

1. Whisper API responds with HTTP 429 and a `Retry-After` header value of N seconds.
2. System schedules the next retry no sooner than N seconds from the response.

**Acceptance criteria (testable):**

- The delay before the next attempt is ≥ N seconds.
- The `Retry-After` value is captured in the retry attempt log.

### Scenario 5 — Circuit breaker triggers during sustained outage

1. Multiple transcription requests fail consecutively, exceeding the circuit-breaker threshold.
2. System opens the circuit: new requests are immediately routed to the dead-letter pathway (or queued) without calling the Whisper API.
3. After the configured cool-down period, the system allows a probe request through.
4. If the probe succeeds, the circuit closes and normal processing resumes.

**Acceptance criteria (testable):**

- While the circuit is open, zero outbound calls are made to the Whisper API for new requests.
- A structured log or metric event records the circuit state transition (closed → open, open → half-open, half-open → closed).
- Queued or dead-lettered requests during the open window are recoverable once the circuit closes.

### Scenario 6 — Idempotent retry after ambiguous response

1. Backend Service sends a request; the network connection drops **after** the Whisper API may have processed it (ambiguous outcome).
2. System retries the request.
3. If the Whisper API returns a result, the system checks for an existing transcription for the same request id before persisting.

**Acceptance criteria (testable):**

- At most one transcription result is stored per unique request id regardless of how many attempts were made.

## Functional Requirements (testable)

### 1. Retry policy configuration

- The system must expose configuration for: max attempts, base back-off interval, back-off multiplier, maximum back-off cap, and jitter range.
- Configuration changes must take effect without requiring a full service redeployment. **[NEEDS CLARIFICATION: mechanism — environment variable reload, feature flag service, or config file watch?]**

### 2. Error classification

- The system must classify every Whisper API error response into exactly one of: **retryable** or **non-retryable**.
- Retryable errors include (at minimum): HTTP 429, 500, 502, 503, 504, network timeouts, and connection-reset errors.
- Non-retryable errors include (at minimum): HTTP 400, 401, 403, 404, 422.
- The classification mapping must be configurable.

### 3. Back-off and jitter

- Retry delays must follow an exponential back-off curve: `delay = min(base * multiplier^(attempt-1) + jitter, cap)`.
- Jitter must be randomised per attempt to prevent synchronised retries across concurrent requests.

### 4. Retry-After compliance

- When the Whisper API returns a `Retry-After` header, the computed back-off delay must be replaced by the header value if the header value is greater.

### 5. Idempotency

- The system must ensure that retried API calls do not result in duplicate transcription records for the same logical request.

### 6. Dead-letter / permanent failure handling

- Requests that exhaust retries or encounter non-retryable errors must be routed to a dead-letter pathway.
- Dead-lettered requests must be queryable by Operations for manual review or re-submission.

### 7. Circuit breaker

- The system must implement a circuit-breaker pattern that halts outbound Whisper API calls when consecutive failures exceed a configurable threshold.
- The circuit must transition through closed → open → half-open → closed states with configurable thresholds and cool-down periods.

### 8. Observability

- Every retry attempt must emit a structured log containing: request id, attempt number, response code or error class, computed delay, and latency.
- The system must emit metrics for: total attempts, retries per request, retry exhaustions, circuit-breaker state changes, and Whisper API response latency distribution.
- An alert must fire when the retry exhaustion rate exceeds a configurable threshold within a rolling window.

### 9. Timeout enforcement

- Each individual Whisper API call must enforce a request-level timeout. Timed-out calls are classified as retryable.

### 10. Concurrency safety

- The retry mechanism must be safe under concurrent execution; two workers must not simultaneously retry the same request.

### 11. Graceful shutdown

- On service shutdown, in-flight retry schedules must be persisted so they can be resumed on restart without data loss.

## Success Criteria (measurable & verifiable)

| Metric | Target |
|---|---|
| **Transient-failure recovery rate** | ≥ 95 % of requests that encounter only transient errors eventually succeed without manual intervention. |
| **Duplicate transcription rate** | 0 — no duplicate transcription records per unique request id. |
| **Silent data loss** | 0 — every request reaches a logged terminal state (success or permanent failure). |
| **Retry-After compliance** | 100 % of 429 responses with a `Retry-After` header result in a delay ≥ the header value. |
| **Alerting latency** | Operations are notified of retry exhaustion within 60 seconds. |
| **Observability coverage** | 100 % of retry attempts have a corresponding structured log entry and metric data point. |
| **Performance overhead** | Retry bookkeeping adds < 50 ms of processing overhead per attempt (excluding the back-off wait). |
| **Circuit-breaker activation** | Circuit opens within 30 seconds of sustained failure exceeding the configured threshold. |

## Key Entities

- **TranscriptionRequest** — the unit of work representing a single audio-to-text job.
- **RetryAttempt** — an immutable record of one outbound call attempt and its outcome.
- **PermanentFailure** — a record capturing terminal failure details for operator review.
- **RetryPolicy** — the active configuration governing retry behaviour.
- **CircuitBreakerState** — the current state of the circuit breaker (closed / open / half-open) and associated counters.

## Assumptions

- The Whisper API is an external, third-party service whose availability is outside our control.
- The Whisper API uses standard HTTP status codes and optionally returns `Retry-After` headers on 429 responses.
- Existing infrastructure provides a durable queue or scheduling mechanism suitable for delayed retries.
- Logging and metrics infrastructure (structured logs, time-series metrics, alerting) is already in place.
- Audio files referenced by transcription requests remain available in storage for the duration of the retry window.

## Milestones (high-level)

1. **M1 — Core retry mechanism** — Configurable retry policy, exponential back-off with jitter, error classification, idempotency guard, structured logging for each attempt.
2. **M2 — Dead-letter pathway & alerting** — Permanent failure routing, operator query interface, retry-exhaustion alerts, Retry-After header compliance.
3. **M3 — Circuit breaker, concurrency safety & hardening** — Circuit-breaker integration, distributed-lock or lease-based concurrency control, graceful shutdown persistence, load/chaos testing validation.

---

**Notes:**

- Clarify the preferred mechanism for runtime configuration changes (see Requirement 1).
- Coordinate with the team that owns the Whisper API integration contract to confirm the full set of possible error codes and header behaviours.
- Review existing queue / scheduler infrastructure to determine whether it meets durability and delay-scheduling requirements or if an alternative is needed.