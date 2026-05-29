# Feature: As Laundry Attendant, I want to perform laundry request pickup and processing to achieve timely fulfillment of guest requests
Status: NEW
Owner: DevX
Last Updated: 2026-05-13

Status: NEW
Owner: Housekeeping Operations
Last Updated: 2025-01-15

## Summary

Enable laundry attendants to receive, pick up, process, and complete guest laundry requests through a streamlined digital workflow. The system must provide clear visibility into pending requests, support status tracking through each processing stage, and ensure timely fulfillment with accountability at every step. The experience should be optimized for mobile use on the floor, minimize manual data entry, and give attendants confidence that no request is missed or delayed.

## Actors

- **Laundry Attendant** (primary user — picks up, processes, and completes laundry requests)
- **Guest** (requester — submits laundry service requests)
- **Housekeeping Supervisor** (oversees workload, reassigns tasks, monitors SLAs)
- **Front Desk Agent** (may create requests on behalf of guests)
- **System** (assigns requests, tracks SLAs, sends notifications, logs events)

## Goals

- Give laundry attendants a single, clear view of all assigned and pending pickup requests.
- Enable attendants to acknowledge, pick up, process, and mark requests complete with minimal friction.
- Provide real-time status visibility to supervisors and guests.
- Ensure accountability through timestamped status transitions and audit trails.
- Reduce missed or delayed pickups through proactive alerts and escalation.

## Key Features

- **Request queue & assignment**: Attendants see a prioritized list of assigned laundry requests with room number, guest name, service type, and SLA deadline.
- **Pickup acknowledgment**: Attendant confirms pickup from guest room, triggering status update and timestamp capture.
- **Item verification**: Attendant records item count and any special instructions or damage notes at pickup.
- **Processing status tracking**: Attendant advances the request through defined stages (Picked Up → In Progress → Ready for Delivery → Delivered).
- **Alerts & escalation**: System notifies attendant of approaching SLA deadlines; escalates to supervisor if thresholds are breached.
- **Completion confirmation**: Attendant marks request as delivered; guest and front desk receive notification.

## Data & Constraints

- **LaundryRequest**: id, room_number, guest_id, service_type (wash/dry-clean/press/express), item_count, special_instructions, priority, status, sla_deadline, created_at, updated_at
- **PickupRecord**: id, request_id, attendant_id, pickup_time, item_count_verified, damage_notes, signature_or_confirmation
- **StatusTransition**: id, request_id, from_state, to_state, actor_id, timestamp, notes
- **Attendant**: id, name, shift, assigned_floor, availability_status

**Constraints:**
- Status transitions must follow a defined state machine (no skipping stages without supervisor override).
- All timestamps must be server-authoritative (not client-only).
- SLA windows are configurable per service type (e.g., express = 2 hours, standard = 24 hours).
- Guest PII must be handled per property data-privacy policies; attendants see only necessary identifiers.
- System must function on low-bandwidth mobile devices used by floor staff.

## User Scenarios & Testing

### Scenario 1 — Pick up a laundry request (happy path)

1. Attendant opens the request queue and sees a new request for Room 412 (standard wash, 5 items, SLA 24h).
2. Attendant taps "Start Pickup" and proceeds to the room.
3. Attendant verifies item count, notes one item with a pre-existing stain, and confirms pickup.
4. System records pickup timestamp, updates status to "Picked Up," and notifies the guest.

**Acceptance criteria (testable):**
- Attendant can view all assigned requests sorted by SLA urgency.
- Tapping "Start Pickup" transitions status to "En Route" and records attendant ID and timestamp.
- Confirming pickup requires item count verification; status advances to "Picked Up."
- Guest receives a notification within 60 seconds of pickup confirmation.
- Damage/stain notes are persisted and visible to the supervisor.

### Scenario 2 — Process and complete a request

1. Attendant moves request to "In Progress" when laundry processing begins.
2. Upon completion, attendant marks request "Ready for Delivery."
3. Attendant delivers items to the room and marks "Delivered."
4. System closes the request and logs total turnaround time.

**Acceptance criteria (testable):**
- Each status transition is recorded with actor, timestamp, and optional notes.
- Attendant cannot mark "Delivered" without first passing through "Ready for Delivery" (state machine enforced).
- Turnaround time is calculated and stored on the completed request record.

### Scenario 3 — SLA approaching / escalation

1. A request is 30 minutes from SLA breach with status still "Picked Up."
2. System sends an alert to the assigned attendant.
3. If SLA breaches, system escalates to the housekeeping supervisor with request details.

**Acceptance criteria (testable):**
- Alert is triggered at a configurable threshold before SLA deadline (default: 30 minutes).
- Escalation notification is sent to supervisor immediately upon SLA breach.
- Escalated requests are visually distinguished in the supervisor's dashboard.

### Scenario 4 — Reassignment

- Supervisor can reassign a request to a different attendant; original attendant is notified and the request disappears from their queue.

### Scenario 5 — Partial or rejected pickup

- If the guest is unavailable or items do not match the request, attendant can mark "Pickup Attempted — Unable to Complete" with a reason; system notifies the guest and resets for retry.

## Functional Requirements (testable)

1. **Request queue**
   - Attendants see only requests assigned to them or to their floor/shift.
   - Queue is sorted by SLA deadline (most urgent first) by default; attendant can filter by service type or room.

2. **Pickup workflow**
   - Attendant must confirm item count before completing pickup.
   - Optional fields: damage notes, special handling flags.
   - Pickup confirmation generates a timestamped record linked to the attendant.

3. **Status progression**
   - Allowed transitions: Pending → En Route → Picked Up → In Progress → Ready for Delivery → Delivered.
   - Supervisor override allows skipping or reverting a state with mandatory reason.
   - Each transition is immutable once recorded (append-only audit log).

4. **Alerts & notifications**
   - Attendant receives push/in-app alert when a new request is assigned.
   - SLA warning alert fires at configurable lead time.
   - Guest receives status updates at key milestones (Picked Up, Ready for Delivery, Delivered).

5. **Supervisor visibility**
   - Supervisors can view all active requests across attendants with real-time status.
   - Supervisors can reassign, escalate, or cancel requests.

6. **Authentication & authorization** [NEEDS CLARIFICATION: auth method/SSO integration]
   - Attendants must authenticate before accessing the queue.
   - Role-based access: attendants see their own queue; supervisors see all.

7. **Accessibility**
   - UI meets WCAG 2.1 AA for all critical workflows (queue, pickup confirmation, status update).
   - Touch targets sized for gloved or one-handed mobile use (minimum 48×48 dp).

8. **Performance**
   - Request queue loads within 2 seconds on property Wi-Fi.
   - Status updates propagate to all viewers within 5 seconds.

9. **Resilience & offline tolerance**
   - If connectivity is temporarily lost, attendant can still confirm pickup locally; data syncs when connection restores.
   - Conflicting updates (e.g., reassignment during offline pickup) are resolved with server-authoritative state and attendant notification.

10. **Data retention & compliance** [NEEDS CLARIFICATION: retention policy]
    - Completed request records and audit logs retained per property data-retention policy.
    - Guest PII is anonymized or purged according to applicable privacy regulations after checkout + retention window.

## Success Criteria (measurable & verifiable)

- **Pickup timeliness**: 95% of requests are picked up within 30 minutes of assignment during operating hours.
- **SLA compliance**: ≥ 98% of requests fulfilled within the defined SLA window per service type.
- **Task completion**: Attendants complete the full pickup-to-delivery workflow digitally for ≥ 95% of requests (no paper fallback).
- **Turnaround visibility**: 100% of completed requests have a calculated turnaround time available for reporting.
- **Alert effectiveness**: Escalation rate (SLA breaches) decreases by ≥ 25% within 60 days of launch compared to baseline.
- **Performance**: Queue load time ≤ 2s at p95; status propagation ≤ 5s at p95.
- **Accessibility**: WCAG 2.1 AA conformance verified for pickup and status-update flows.

## Key Entities

- **Guest** (requester of laundry service)
- **Laundry Attendant** (fulfills requests)
- **Housekeeping Supervisor** (monitors and manages workload)
- **LaundryRequest** (core work item)
- **PickupRecord** (evidence of collection)
- **StatusTransition** (audit trail entry)
- **Notification** (push/in-app/SMS to attendant, guest, or supervisor)

## Assumptions

- Attendants carry mobile devices (phone or tablet) with property Wi-Fi access during shifts.
- Laundry requests are created upstream (by guest via in-room system, front desk, or concierge) before reaching the attendant queue.
- Service types and SLA windows are pre-configured by property management and may vary by property.
- Integration with existing property management or housekeeping systems will provide room and guest context.
- Notification delivery channels (push, SMS, in-app) are determined by property configuration.

## Milestones (high-level)

1. **M1** — Requirements finalization, data model, and API contract definition (US 75526)
2. **M2** — API endpoint and business logic implementation including state machine (US 75527)
3. **M3** — UI components for queue, pickup, and status progression; integration with API (US 75528)
4. **M4** — Unit and integration test coverage for all critical paths and edge cases (US 75529)
5. **M5** — API documentation and attendant user guide (US 75530)

---

**Notes:**
- Confirm authentication/SSO approach with IT before M2 implementation begins.
- Retention windows and PII handling rules to be confirmed with property compliance team.
- Offline-sync conflict resolution strategy should be validated with attendants during M3 usability testing.
- Express service SLA (2h) may require dedicated attendant assignment logic — confirm with operations.