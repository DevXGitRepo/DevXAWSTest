# Feature: As Account Manager, I want to perform customer health assessment to achieve early identification of at-risk accounts
Status: NEW
Owner: DevX
Last Updated: 2026-05-06

Status: NEW
Owner: Account Management
Last Updated: 2025-01-15

## Summary

Provide Account Managers with a structured customer health assessment capability that aggregates key signals—engagement, product usage, support history, contract status, and sentiment—into a clear, actionable health score. The goal is to surface at-risk accounts early enough to intervene, reduce churn, and increase net revenue retention. The experience must be intuitive, data-driven, and integrated into the Account Manager's daily workflow.

## Actors

- Account Manager (primary user — owns customer relationships and acts on health insights)
- Customer Success Leader (internal — reviews portfolio-level health trends and allocates resources)
- System (background processors — calculates scores, detects threshold breaches, triggers alerts)
- Data Source Integrations (CRM, product analytics, support ticketing, billing — provide raw signals)
- Administrator (internal — configures scoring models, thresholds, and alert rules)

## Goals

- Enable Account Managers to identify at-risk accounts before churn signals become irreversible.
- Provide a single, consolidated view of customer health across multiple dimensions.
- Reduce time spent manually gathering and interpreting disparate data sources.
- Drive proactive outreach and intervention through timely alerts and recommended actions.
- Give leadership visibility into portfolio-level risk distribution for resource planning.

## Key Features

- Composite health score per account derived from weighted, configurable dimensions.
- Health dashboard showing portfolio-level overview with filtering, sorting, and drill-down.
- Individual account health detail view with dimension breakdowns and trend history.
- Automated at-risk alerts when an account's score crosses configurable thresholds.
- Trend analysis showing score trajectory over time to distinguish improving vs. declining accounts.
- Recommended next actions based on the dimensions contributing most to risk.
- Ability to manually override or annotate a health score with qualitative context.

## Data & Constraints

- **HealthScore**: id, account_id, overall_score (0–100), calculated_at, model_version
- **DimensionScore**: id, health_score_id, dimension (e.g., engagement, usage, support, sentiment, contract), score (0–100), weight, contributing_signals
- **Alert**: id, account_id, triggered_at, threshold_breached, severity (low, medium, high, critical), acknowledged_by, resolved_at
- **Annotation**: id, health_score_id, author, timestamp, note, override_score (optional)
- **Account**: id, name, owner (account_manager_id), contract_value, renewal_date, segment

Constraints:
- Health scores must recalculate at least daily; near-real-time recalculation for critical signal changes.
- Historical scores retained for a minimum of 24 months for trend analysis.
- PII and customer data handling must comply with organizational data governance policies.
- Scoring model weights must be configurable without code changes.
- System must support portfolios of up to 500 accounts per Account Manager and 10,000 accounts organization-wide.

## User Scenarios & Testing

### Scenario 1 — Review portfolio health (happy path)

1. Account Manager opens the health dashboard.
2. Dashboard displays all assigned accounts with overall health scores, trend indicators, and risk tier labels.
3. Account Manager sorts by score (ascending) to surface lowest-health accounts first.
4. Account Manager filters by segment or renewal window to focus on priority cohorts.

Acceptance criteria (testable):
- Dashboard loads all assigned accounts with current health scores within 3 seconds.
- Each account row displays: account name, overall score, trend arrow (improving/stable/declining), risk tier, and next renewal date.
- Sorting by score correctly orders accounts; filtering reduces the visible set to matching accounts only.

### Scenario 2 — Investigate an at-risk account

1. Account Manager clicks into an account flagged as "At Risk."
2. Detail view shows overall score, individual dimension scores, and a 90-day trend chart.
3. Contributing signals (e.g., "Support tickets up 40% month-over-month," "No product login in 21 days") are listed with context.
4. Recommended actions are displayed (e.g., "Schedule executive business review," "Escalate to Customer Success Leader").

Acceptance criteria (testable):
- Detail view renders all dimension scores and trend data within 2 seconds.
- At least one recommended action is shown when any dimension score is below the configured threshold.
- Contributing signals include a human-readable description and a quantitative change indicator.

### Scenario 3 — Receive and act on an at-risk alert

1. System detects that an account's health score has dropped below the configured "high risk" threshold.
2. Account Manager receives an alert (in-app notification and optionally email).
3. Alert includes account name, new score, previous score, primary contributing dimension, and a link to the account detail view.
4. Account Manager acknowledges the alert and logs a planned intervention via annotation.

Acceptance criteria (testable):
- Alert is delivered within 15 minutes of the score crossing the threshold.
- Alert contains all specified fields and a functional deep link to the account detail.
- Acknowledging the alert updates its status to "acknowledged" with a timestamp and actor.

### Scenario 4 — Override or annotate a health score

1. Account Manager has qualitative context (e.g., "CEO transition in progress — temporary disengagement expected").
2. Account Manager adds an annotation with a note and optionally overrides the displayed risk tier.
3. Override is visible on the dashboard and detail view with the annotator's name and date.
4. System continues to calculate the algorithmic score independently; override is layered on top.

Acceptance criteria (testable):
- Annotations persist and are visible to all users with access to the account.
- Overridden accounts display both the system-calculated score and the manual override clearly.
- Algorithmic score continues to update on schedule regardless of override.

### Scenario 5 — Leadership reviews portfolio risk distribution

1. Customer Success Leader opens a portfolio-level summary view.
2. View shows distribution of accounts across risk tiers (Healthy, Monitor, At Risk, Critical).
3. Leader can drill down by Account Manager, segment, or contract value band.

Acceptance criteria (testable):
- Summary view aggregates all organizational accounts, not limited to a single owner.
- Distribution totals match the sum of individual account classifications.
- Drill-down filters update the view without full page reload.

## Functional Requirements (testable)

### 1. Health score calculation

- System computes a composite score (0–100) from weighted dimension scores.
- Dimension weights are configurable by an Administrator and sum to 100%.
- Score recalculates at minimum once per 24 hours; critical signal changes trigger recalculation within 1 hour.
- Each calculation records the model version used for auditability.

### 2. Risk tier classification

- Accounts are classified into tiers based on configurable score ranges (e.g., 0–30 Critical, 31–50 At Risk, 51–70 Monitor, 71–100 Healthy).
- Tier boundaries are adjustable without code changes.
- Tier labels and color coding are consistent across all views.

### 3. Trend analysis

- System stores daily score snapshots and computes trend direction (improving, stable, declining) over a configurable lookback window (default 30 days).
- Trend is determined by statistically meaningful change (not noise); threshold for "meaningful" is configurable.

### 4. Alerts and notifications

- Alerts fire when an account crosses a tier boundary downward.
- Alert severity maps to the tier entered (e.g., entering "Critical" = critical severity).
- Alerts are delivered in-app; email delivery is configurable per Account Manager.
- Duplicate alerts for the same threshold crossing are suppressed until the account recovers and re-crosses.

### 5. Dashboard and detail views

- Dashboard supports sorting by score, trend, renewal date, and contract value.
- Dashboard supports filtering by risk tier, segment, renewal window, and Account Manager (for leadership).
- Detail view shows dimension breakdown, trend chart, contributing signals, annotations, and recommended actions.

### 6. Annotations and overrides

- Any Account Manager or Customer Success Leader with access to an account may add annotations.
- Override scores do not alter the underlying algorithmic calculation.
- Annotations include author, timestamp, and free-text note (max 1,000 characters).

### 7. Recommended actions

- System suggests at least one action when any dimension score falls below its configured threshold.
- Actions are drawn from a configurable action library maintained by Administrators.
- Actions are contextual to the dimension(s) driving risk.

### 8. Data integration [NEEDS CLARIFICATION: specific source systems]

- System ingests signals from product analytics, CRM, support ticketing, and billing platforms.
- Integration failures are logged and surfaced to Administrators; stale data is flagged on the dashboard.
- Data freshness indicator shows the last successful sync timestamp per dimension.

### 9. Access control

- Account Managers see only their assigned accounts unless granted broader access.
- Customer Success Leaders see all accounts within their organizational scope.
- Administrators configure scoring models and thresholds but do not necessarily see customer data.

### 10. Performance and scalability

- Dashboard renders usable content within 3 seconds for portfolios up to 500 accounts.
- Score recalculation for the full organization (10,000 accounts) completes within the daily processing window.
- Alert delivery latency does not exceed 15 minutes from score change detection.

### 11. Accessibility

- All UI components meet WCAG 2.1 AA standards.
- Health scores and risk tiers are communicated via text labels in addition to color coding.

## Success Criteria (measurable & verifiable)

- **At-risk identification rate**: ≥ 80% of accounts that churn within a quarter were flagged as "At Risk" or "Critical" at least 30 days prior to churn event.
- **Proactive outreach increase**: Account Managers initiate intervention actions on ≥ 70% of accounts within 5 business days of an at-risk alert.
- **Time to insight**: Median time for an Account Manager to identify their top 5 at-risk accounts is under 2 minutes (from dashboard load to identification).
- **Score accuracy**: Health score correlates with actual churn/expansion outcomes at r ≥ 0.6 after 6 months of calibration.
- **Alert precision**: False-positive rate for critical alerts (accounts flagged critical that do not churn or downgrade within 90 days) is below 30%.
- **Performance**: Dashboard first contentful paint under 2 seconds on standard broadband; 95th percentile page load under 4 seconds.
- **Adoption**: ≥ 90% of Account Managers access the health dashboard at least 3 times per week within 60 days of launch.

## Key Entities

- **Account** — the customer organization being assessed
- **HealthScore** — the composite assessment record for an account at a point in time
- **DimensionScore** — individual score for a specific health dimension (engagement, usage, support, sentiment, contract)
- **Alert** — notification triggered by threshold breach
- **Annotation** — manual note or override applied by a user
- **ScoringModel** — configuration of dimensions, weights, and thresholds
- **RecommendedAction** — suggested intervention from the action library

## Assumptions

- Source systems (CRM, product analytics, support, billing) expose APIs or data feeds suitable for integration.
- Account-to-owner assignment data is maintained in the CRM and is authoritative.
- Initial scoring model weights will be set based on domain expertise and refined with historical outcome data over time.
- Account Managers have existing access to a web-based internal tool where this capability will be surfaced.
- Email infrastructure is available for alert delivery; SMS/push notifications are out of scope for initial release.

## Milestones (high-level)

1. **M1** — Scoring engine, core dashboard, and individual account detail view with static dimension weights.
2. **M2** — Automated alerts, annotations/overrides, recommended actions, and configurable thresholds.
3. **M3** — Trend analysis, portfolio-level leadership views, scoring model calibration with outcome data, and integration hardening.

---

Notes:
- Clarification needed on specific source systems and available APIs for data integration.
- Scoring model weights should be validated against 6–12 months of historical churn/expansion data before relying on success criteria thresholds.
- Retention policy for historical health scores and annotations to be confirmed with data governance.