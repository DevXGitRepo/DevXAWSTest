# Feature: As Backend Developer, I want to perform audio file transmission to Whisper API to achieve text transcription of recorded audio
Status: NEW
Owner: DevX
Last Updated: 2026-04-24

Status: NEW
Owner: Backend Team
Last Updated: 2025-07-14

## Summary

Enable the backend system to accept recorded audio files, transmit them to the OpenAI Whisper API, and return accurate text transcriptions. The service must handle a variety of audio formats, manage API communication reliably (including retries and error handling), enforce file-size and duration constraints, and return structured transcription results to calling services. The design must prioritise reliability, latency efficiency, and clear error reporting so that upstream consumers (other backend services, frontend clients) can depend on transcription as a predictable, well-documented capability.

## Actors

- **Calling Service / Client** — any internal service or API consumer that submits an audio file for transcription.
- **Backend Transcription Service** — the component responsible for receiving audio, validating it, transmitting it to the Whisper API, and returning results.
- **Whisper API (External)** — OpenAI's speech-to-text service that performs the actual transcription.
- **System (background / infrastructure)** — logging, monitoring, retry mechanisms, and configuration management.

## Goals

- Provide a reliable, single-responsibility service endpoint that converts audio files into text via the Whisper API.
- Handle the full lifecycle: validation → transmission → response parsing → result delivery.
- Gracefully manage Whisper API errors, rate limits, and transient failures with retries and clear error responses.
- Support the most common audio recording formats without requiring callers to pre-convert files.
- Return structured, predictable transcription results (including metadata) so consumers can process them without ambiguity.

## Key Features

- **Audio ingestion & validation** — accept audio files, enforce size/duration/format constraints, and reject invalid inputs with descriptive errors before any external API call is made.
- **Whisper API transmission** — stream or send the validated audio payload to the Whisper API with appropriate parameters (model, language hints, response format).
- **Response parsing & normalisation** — parse the Whisper API response and return a consistent transcription result structure regardless of the response format requested.
- **Retry & circuit-breaker logic** — automatically retry transient Whisper API failures; open a circuit breaker when sustained failures are detected to avoid cascading issues.
- **Logging & observability** — log every transcription request lifecycle event (received, validated, sent, succeeded/failed) with correlation IDs for traceability.
- **Configuration management** — externalise Whisper API keys, model selection, timeout values, retry policies, and file-size limits so they can be changed without redeployment.

## Data & Constraints

### Core Data Structures

- **TranscriptionRequest**: correlation_id, audio_payload (binary), original_filename, content_type, file_size_bytes, language_hint (optional), requester_id, received_at
- **TranscriptionResult**: correlation_id, transcript_text, language_detected, duration_seconds, whisper_model_used, processing_time_ms, status (success | partial | error), created_at
- **TranscriptionError**: correlation_id, error_code, error_message, retryable (boolean), timestamp

### Constraints

| Constraint | Limit |
|---|---|
| Maximum file size | 25 MB (Whisper API limit) |
| Allowed audio formats | mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg, flac |
| Maximum audio duration | [NEEDS CLARIFICATION: project-specific limit] |
| API rate limits | Per OpenAI account tier; must be respected and surfaced |
| Sensitive data | Audio may contain PII — files must not be persisted beyond the transcription lifecycle unless explicitly configured; logs must never contain audio content or full transcript text |
| API key security | Whisper API credentials must be stored in a secrets manager, never in source code or plain-text configuration |

## User Scenarios & Testing

### Scenario 1 — Successful transcription (happy path)

1. Calling service sends a valid audio file (e.g., 2 MB WAV, English speech) to the transcription endpoint.
2. Backend validates format, size, and content type.
3. Backend transmits the file to the Whisper API with the configured model and optional language hint.
4. Whisper API returns a transcription.
5. Backend parses the response, constructs a `TranscriptionResult`, and returns it to the caller.

**Acceptance criteria (testable):**
- A valid audio file submitted to the endpoint returns a `TranscriptionResult` with status `success` and non-empty `transcript_text`.
- The response includes `language_detected`, `duration_seconds`, `whisper_model_used`, and `processing_time_ms`.
- The `correlation_id` in the response matches the one provided (or generated) at request time.

### Scenario 2 — Invalid file rejected before API call

1. Calling service sends a file that exceeds 25 MB, or has a disallowed content type (e.g., `.exe`), or is a zero-byte payload.
2. Backend rejects the request immediately with a descriptive error.

**Acceptance criteria (testable):**
- A file exceeding 25 MB returns an error response with a clear message indicating the size limit and the actual file size.
- A file with a disallowed content type returns an error listing the accepted formats.
- A zero-byte or missing payload returns a distinct error indicating no audio data was received.
- No call is made to the Whisper API for any of these cases (verifiable via logs or mocks).

### Scenario 3 — Whisper API transient failure with successful retry

1. Calling service sends a valid audio file.
2. The first Whisper API call fails with a transient error (e.g., HTTP 500 or network timeout).
3. Backend retries according to the configured retry policy.
4. The retry succeeds; the caller receives a successful `TranscriptionResult`.

**Acceptance criteria (testable):**
- After a transient Whisper API failure, the system retries up to the configured maximum number of attempts.
- The caller receives a successful result if any retry succeeds, with total `processing_time_ms` reflecting the full duration including retries.
- Each retry attempt is logged with the attempt number and the error from the previous attempt.

### Scenario 4 — Whisper API persistent failure (all retries exhausted)

1. Calling service sends a valid audio file.
2. All retry attempts to the Whisper API fail.
3. Backend returns a structured error to the caller.

**Acceptance criteria (testable):**
- After exhausting all retries, the response contains a `TranscriptionError` with `retryable: true` (if the failure type is transient) so the caller can decide whether to re-submit later.
- The error response includes the `correlation_id` and a human-readable `error_message`.
- A warning or alert-level log entry is emitted indicating sustained Whisper API failure.

### Scenario 5 — Whisper API rate limit (HTTP 429)

1. Calling service sends a valid audio file.
2. Whisper API responds with HTTP 429 (rate limited).
3. Backend respects the `Retry-After` header (if present) and retries after the indicated delay, or applies exponential backoff.

**Acceptance criteria (testable):**
- On receiving HTTP 429, the system waits at least the duration indicated by `Retry-After` before retrying.
- If no `Retry-After` header is present, exponential backoff is applied.
- The caller receives either a successful result (if a retry succeeds) or a rate-limit-specific error with `retryable: true`.

### Scenario 6 — Language hint provided

1. Calling service sends a valid audio file with `language_hint: "es"` (Spanish).
2. Backend passes the language parameter to the Whisper API.
3. Transcription is returned in the hinted language.

**Acceptance criteria (testable):**
- When a `language_hint` is provided, it is included in the Whisper API request parameters.
- The `TranscriptionResult` reflects the language used by the API in `language_detected`.

## Functional Requirements (testable)

### 1. Audio ingestion & validation
- The service exposes an endpoint that accepts audio file uploads with metadata (content type, optional language hint, optional correlation ID).
- If no `correlation_id` is provided by the caller, the service generates one and includes it in the response.
- Files are validated against allowed formats, maximum size, and non-zero payload before any external call.
- Validation errors return immediately with specific, actionable error messages.

### 2. Whisper API transmission
- The service transmits the validated audio file to the Whisper API using the configured model.
- The Whisper API model, response format, and optional parameters (e.g., temperature, language) are configurable without code changes.
- The service sets a request timeout for the Whisper API call; the timeout value is configurable.

### 3. Response parsing & result structure
- The Whisper API response is parsed into a normalised `TranscriptionResult` regardless of the underlying response format (JSON, verbose JSON, text, SRT, VTT).
- If the Whisper API returns an unexpected or malformed response, the service returns a `TranscriptionError` with diagnostic details (not raw API output).

### 4. Retry & resilience
- Transient failures (HTTP 5xx, network timeouts, connection resets) trigger automatic retries with exponential backoff and jitter.
- The maximum number of retries and base backoff interval are configurable.
- Non-transient errors (HTTP 400, 401, 413) are not retried; they are returned to the caller immediately.
- A circuit-breaker mechanism prevents repeated calls to the Whisper API during sustained outages. [NEEDS CLARIFICATION: circuit-breaker thresholds and recovery window]

### 5. Logging & observability
- Every request is logged at key lifecycle points: received, validation passed/failed, API call initiated, API call succeeded/failed, response returned.
- All log entries include the `correlation_id`.
- Logs must never contain the audio binary content or the full transcription text (to protect PII). Truncated or hashed references are acceptable.
- Metrics are emitted for: request count, success/failure count, Whisper API latency, retry count, and error categorisation.

### 6. Configuration management
- API keys are retrieved from a secrets manager at runtime.
- All tuneable parameters (model, timeout, retry count, backoff base, max file size, allowed formats) are externalised in configuration.
- Configuration changes take effect without requiring a full redeployment. [NEEDS CLARIFICATION: hot-reload mechanism or restart acceptable?]

### 7. Security
- The transcription endpoint requires authentication from the calling service. [NEEDS CLARIFICATION: auth mechanism — API key, JWT, mTLS?]
- Whisper API credentials are never logged, returned in responses, or committed to source control.
- Audio file payloads are transmitted to the Whisper API over HTTPS/TLS.
- Audio files are not persisted to disk or object storage beyond the in-flight processing window unless a separate retention policy is configured.

### 8. Performance
- The service adds no more than 500 ms of overhead beyond the Whisper API's own processing time for files under 10 MB (measured at the 95th percentile).
- The service can handle concurrent transcription requests up to a configurable concurrency limit without request queuing failures. [NEEDS CLARIFICATION: expected concurrency / throughput target]

## Success Criteria (measurable & verifiable)

| Criterion | Target |
|---|---|
| End-to-end success rate | ≥ 99% of valid audio files return a successful transcription (excluding Whisper API outages beyond retry recovery) |
| Validation accuracy | 100% of files violating size, format, or payload constraints are rejected before any Whisper API call |
| Retry effectiveness | ≥ 95% of transient Whisper API failures are recovered via automatic retry |
| Overhead latency | ≤ 500 ms added latency (p95) beyond Whisper API processing time for files under 10 MB |
| Error clarity | 100% of error responses include a `correlation_id`, a categorised `error_code`, and a human-readable `error_message` |
| Security | Zero instances of API credentials appearing in logs, responses, or source control |
| Observability | Every transcription request lifecycle is traceable end-to-end via `correlation_id` in logs |

## Key Entities

- **TranscriptionRequest** — the inbound audio payload and associated metadata from the calling service.
- **TranscriptionResult** — the structured output containing the transcript text, detected language, duration, model used, and processing time.
- **TranscriptionError** — a structured error object returned when transcription fails, including retryability indication.
- **WhisperAPIConfiguration** — the set of parameters governing API communication (model, timeout, retries, key reference).
- **AuditLogEntry** — a record of each lifecycle event for observability and debugging.

## Assumptions

- The OpenAI Whisper API is available and the project has an active API key with sufficient quota for expected usage.
- Audio files are provided by the calling service in one of the supported formats; the transcription service is not responsible for format conversion or audio recording.
- The Whisper API's 25 MB file-size limit is the binding constraint; the project may impose a stricter limit if needed.
- Callers are internal services or authenticated clients; the transcription endpoint is not exposed directly to end users.
- English is the default/primary language, but the service must support any language the Whisper API supports via the `language_hint` parameter.

## Milestones (high-level)

1. **M1 — Core transmission & happy-path transcription**
   - Endpoint accepts audio, validates, sends to Whisper API, returns structured result.
   - Basic logging with correlation IDs.

2. **M2 — Resilience & error handling**
   - Retry logic with exponential backoff for transient failures.
   - Rate-limit handling (HTTP 429).
   - Circuit-breaker implementation.
   - Comprehensive error response structure.

3. **M3 — Observability, security hardening & performance tuning**
   - Full metrics emission (latency, success/failure rates, retry counts).
   - Secrets-manager integration for API keys.
   - Concurrency management and performance benchmarking.
   - PII-safe logging audit.

---

**Notes:**
- Resolve `[NEEDS CLARIFICATION]` items with the team before implementation begins: maximum audio duration, circuit-breaker thresholds, configuration reload strategy, authentication mechanism for the endpoint, and expected concurrency targets.
- If long audio files (>25 MB or >~60 minutes) are a future requirement, a chunking/splitting strategy will need to be designed as a follow-on feature.