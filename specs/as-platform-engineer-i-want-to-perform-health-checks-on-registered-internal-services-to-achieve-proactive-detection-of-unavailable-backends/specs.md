# Feature: As Platform Engineer, I want to perform health checks on registered internal services to achieve proactive detection of unavailable backends
Status: NEW
Owner: DevX
Last Updated: 2026-04-23

Status: NEW
Owner: Platform Engineering
Last Updated: 2025-07-10

## Summary

Provide a systematic, automated health-checking capability that continuously monitors registered internal services (backends) and proactively detects when they become unavailable, degraded, or unresponsive. The system must surface health status clearly, trigger timely alerts, and maintain a historical record of service health so that platform engineers can act before end-users are impacted. The design must prioritise reliability, low operational overhead, and minimal impact on the services being checked.

## Actors

- **Platform Engineer** — configures health checks, reviews service health, responds to alerts, and manages the service registry.
- **Service Owner** — registers services and defines or customises health-check parameters for their backends.
- **On-Call Responder** — receives alerts when services are detected as unhealthy and initiates remediation.
- **System (Health-Check Scheduler)** — background process that executes checks on a defined cadence, evaluates results, updates status, and dispatches notifications.
- **Registered Service (Backend)** — any internal service enrolled in the health-check registry that exposes a checkable endpoint or responds to a probe.

## Goals

- Detect backend unavailability or degradation **before** it is reported by end-users or downstream consumers.
- Provide a single, authoritative view of the health status of all registered internal services.
- Reduce mean-time-to-detect (MTTD) for backend outages through automated, continuous monitoring.
- Minimise false-positive alerts through configurable thresholds and confirmation retries.
- Maintain an auditable history of health-check results for trend analysis and post-incident review.

## Key Features

- **Service Registry** — a catalogue of internal services eligible for health checking, with per-service configuration (endpoint, protocol, expected response, interval, thresholds).
- **Automated Health-Check Execution** — scheduled probes that run at configurable intervals and evaluate service availability and responsiveness.
- **Health Status Dashboard** — a consolidated view showing current and recent health status for every registered service.
- **Alerting & Notifications** — configurable alerts dispatched when a service transitions to an unhealthy state, with support for multiple notification channels.
- **Health History & Audit Log** — time-series record of every check result, state transition, and configuration change.

## Data & Constraints

- **Service**: id, name, description, owner, endpoint_url, protocol (HTTP/HTTPS/TCP/gRPC), expected_status_code, expected_response_body_pattern, check_interval_seconds, timeout_ms, unhealthy_threshold, healthy_threshold, is_active, created_at, updated_at
- **HealthCheckResult**: id, service_id, timestamp, response_time_ms, status_code, result (HEALTHY | UNHEALTHY | TIMEOUT | ERROR), detail_message
- **ServiceHealthState**: id, service_id, current_state (HEALTHY | DEGRADED | UNHEALTHY | UNKNOWN), last_transition_at, consecutive_failures, consecutive_successes
- **Alert**: id, service_id, triggered_at, resolved_at, severity, channel, recipients, message

**Constraints:**
- Health checks must not generate enough traffic to degrade the target service (rate-limiting / back-off required).
- All communication with service endpoints must occur over encrypted channels when the service supports TLS.
- Configuration changes must be auditable (who changed what, when).
- The health-check system itself must be resilient — a single checker failure must not halt monitoring of other services.
- Sensitive endpoint details (e.g., authentication tokens for health endpoints) must be stored encrypted at rest.

## User Scenarios & Testing

### Scenario 1 — Register a new service for health checking (happy path)

1. Platform Engineer navigates to the service registry and selects "Register Service."
2. Platform Engineer provides service name, endpoint URL, protocol, expected response, check interval, timeout, and failure/recovery thresholds.
3. System validates the configuration (e.g., reachable endpoint format, interval within allowed bounds).
4. System confirms registration and begins executing health checks on the next scheduled cycle.

**Acceptance criteria (testable):**
- A newly registered service appears in the registry within 60 seconds of submission.
- The first health check executes within one configured interval after registration.
- Invalid configurations (e.g., missing endpoint, interval below minimum) are rejected with specific, actionable error messages.

### Scenario 2 — Detect an unhealthy backend (proactive detection)

1. System executes a scheduled health check against a registered service.
2. The service fails to respond within the configured timeout.
3. System retries according to the configured unhealthy threshold (e.g., 3 consecutive failures).
4. After the threshold is met, System transitions the service state to UNHEALTHY and dispatches an alert to configured recipients.

**Acceptance criteria (testable):**
- A service is marked UNHEALTHY only after the configured number of consecutive failures is reached — not on a single failure.
- An alert is dispatched within 30 seconds of the state transition to UNHEALTHY.
- The dashboard reflects the UNHEALTHY state within 15 seconds of the transition.

### Scenario 3 — Service recovers after being unhealthy

1. A service currently in UNHEALTHY state begins responding successfully to health checks.
2. System records consecutive successes against the configured healthy threshold.
3. After the threshold is met, System transitions the service state back to HEALTHY and sends a recovery notification.

**Acceptance criteria (testable):**
- A service transitions back to HEALTHY only after the configured number of consecutive successes.
- A recovery notification is sent within 30 seconds of the state transition.
- The health history log contains both the UNHEALTHY and HEALTHY transition events with accurate timestamps.

### Scenario 4 — View consolidated health dashboard

1. Platform Engineer opens the health dashboard.
2. Dashboard displays all registered services with their current state, last check time, and response time.
3. Platform Engineer filters or sorts by state (e.g., show only UNHEALTHY services).

**Acceptance criteria (testable):**
- Dashboard loads and displays all registered services with current state within the defined performance budget.
- Filtering by health state returns only matching services.
- Each service entry shows: name, current state, last check timestamp, and last response time.

### Scenario 5 — Review health history for a specific service

1. Platform Engineer selects a service from the dashboard.
2. System displays a chronological history of health-check results and state transitions.
3. Platform Engineer can filter history by date range.

**Acceptance criteria (testable):**
- Health history displays results in reverse-chronological order with timestamps, result status, and response times.
- Date-range filtering returns only results within the specified window.
- State transitions are visually distinguishable from routine check results.

## Functional Requirements (testable)

### 1. Service Registration & Configuration
- Platform Engineers can register, update, deactivate, and remove services from the health-check registry.
- Each service configuration must include at minimum: endpoint URL, protocol, check interval, timeout, and unhealthy/healthy thresholds.
- The system enforces minimum and maximum bounds on check intervals and timeouts to prevent abuse or misconfiguration.
- All configuration changes are recorded in an audit log with actor, timestamp, and before/after values.

### 2. Health-Check Execution
- The system executes health checks for every active registered service at the configured interval (±10 % tolerance).
- Supported check types: HTTP/HTTPS (status code + optional body pattern match), TCP connect, gRPC health protocol.
- Each check records: timestamp, response time, status code (where applicable), and result classification (HEALTHY, UNHEALTHY, TIMEOUT, ERROR).
- Checks that exceed the configured timeout are classified as TIMEOUT.
- The system applies exponential back-off or circuit-breaking if a service is confirmed UNHEALTHY, to avoid unnecessary load on a failing backend.

### 3. State Management & Thresholds
- A service transitions to UNHEALTHY only after reaching the configured consecutive-failure threshold.
- A service transitions back to HEALTHY only after reaching the configured consecutive-success threshold.
- A DEGRADED state is supported for services that respond successfully but exceed a configurable response-time threshold.
- State transitions are recorded as discrete, timestamped events.

### 4. Alerting & Notifications
- Alerts are dispatched when a service transitions to UNHEALTHY or DEGRADED.
- Recovery notifications are dispatched when a service transitions back to HEALTHY.
- At least two notification channels must be supported (e.g., email and webhook). [NEEDS CLARIFICATION: confirm required channels]
- Alert fatigue is mitigated: repeated alerts for the same ongoing unhealthy state are suppressed after the initial notification unless a configurable reminder interval is set.

### 5. Health Dashboard
- A consolidated view lists all registered services with current state, last check time, and last response time.
- Services can be filtered by state and sorted by name, state, or last check time.
- Drill-down into a service shows detailed health history and configuration.

### 6. Health History & Reporting
- All health-check results are retained for a configurable retention period. [NEEDS CLARIFICATION: default retention window]
- State transition events are retained independently and are not subject to the same short-term purge as raw check results.
- Historical data can be exported or queried for trend analysis.

### 7. Security & Access Control
- Only authorised Platform Engineers and Service Owners can register or modify service configurations.
- Health-check endpoint credentials are stored encrypted at rest and are not exposed in dashboard views or logs.
- All access to the dashboard and configuration interfaces is authenticated and logged.

### 8. Resilience & Isolation
- Failure of a single health check (e.g., checker process crash) must not prevent checks against other services from executing.
- The health-check system must self-monitor and alert if its own scheduler or execution pipeline is impaired.
- Transient network errors between the checker and a target service are distinguished from sustained failures via the threshold mechanism.

### 9. Performance
- Health-check execution overhead per probe must remain below 5 % of the configured timeout (i.e., system processing time, excluding network round-trip).
- The dashboard must render usable content for up to 500 registered services within the performance budget.

### 10. Accessibility
- Dashboard UI components meet WCAG 2.1 AA for critical views (service list, detail, alert configuration).

## Success Criteria (measurable & verifiable)

| Metric | Target |
|---|---|
| **Detection latency** | 95 % of genuine backend outages detected within `(check_interval × unhealthy_threshold) + 60 seconds`. |
| **False-positive rate** | Fewer than 1 % of UNHEALTHY transitions are false positives over any rolling 30-day window. |
| **Alert delivery** | 99 % of alerts delivered to at least one configured channel within 60 seconds of state transition. |
| **Dashboard availability** | Health dashboard available 99.9 % of the time (measured monthly). |
| **Dashboard performance** | Dashboard initial load with up to 500 services renders usable content within 3 seconds on standard broadband. |
| **Check execution reliability** | 99.9 % of scheduled checks execute within the configured interval (±10 %). |
| **History completeness** | 100 % of executed checks have a corresponding result record in the health history store. |
| **Audit coverage** | Every configuration change and state transition has a corresponding audit/log entry. |

## Key Entities

- **Service** — an internal backend registered for health monitoring.
- **HealthCheckResult** — the outcome of a single probe execution.
- **ServiceHealthState** — the current derived health state of a service (computed from recent results and thresholds).
- **Alert** — a notification record triggered by a state transition.
- **AuditEntry** — a log of configuration changes and access events.
- **NotificationChannel** — a configured delivery mechanism for alerts (e.g., email, webhook, chat integration).

## Assumptions

- Registered internal services expose a dedicated health-check endpoint or are reachable via TCP connect; services that do not expose any checkable surface cannot be monitored by this system.
- Network connectivity between the health-check system and target services is generally reliable; the threshold mechanism accounts for transient failures.
- Platform Engineers have existing authentication credentials for the platform tooling; no new identity provider is introduced by this feature.
- The health-check system runs in an environment with sufficient outbound network access to reach all registered internal services.
- Notification channel integrations (e.g., email relay, webhook consumers) are available and maintained outside this feature's scope.

## Milestones (high-level)

1. **M1 — Core Health Checking** — Service registry, automated check execution (HTTP/TCP), state management with thresholds, basic alerting (single channel), and health-check result storage.
2. **M2 — Dashboard & History** — Consolidated health dashboard, per-service drill-down, health history with filtering, and export capability.
3. **M3 — Advanced Checks, Multi-Channel Alerts & Hardening** — gRPC health checks, DEGRADED state support, multiple notification channels, alert suppression/reminders, self-monitoring, and performance/resilience hardening.

---

**Notes:**
- Confirm required notification channels and default retention windows before M1 development begins (see NEEDS CLARIFICATION markers above).
- The minimum and maximum bounds for check intervals and timeouts should be agreed upon with Service Owners during M1 planning.
- See checklists/requirements.md for spec quality validation.