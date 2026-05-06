# Feature: As Account Manager, I want to perform customer ranking by revenue potential to achieve focused attention on highest-value accounts
Status: NEW
Owner: DevX
Last Updated: 2026-05-06

Status: NEW
Owner: Account Management
Last Updated: 2025-01-15

## Summary

Provide Account Managers with a systematic way to rank and tier their assigned customers by revenue potential so they can prioritize outreach, planning, and resource allocation toward the highest-value accounts. The solution must surface clear, data-driven rankings, allow managers to understand the factors behind each score, and integrate naturally into daily account management workflows.

## Actors

- Account Manager (primary user — views, filters, and acts on rankings)
- Sales Leadership (consumer of aggregate ranking reports and portfolio health views)
- Revenue Operations / Admin (configures scoring model inputs, weights, and thresholds)
- System (calculates scores, refreshes rankings, triggers alerts on rank changes)

## Goals

- Enable Account Managers to instantly identify which accounts deserve the most attention based on revenue potential.
- Reduce time spent manually analyzing account data to determine priority.
- Ensure ranking criteria are transparent, consistent, and auditable.
- Drive measurable improvement in revenue capture from high-potential accounts.

## Key Features

- Automated revenue-potential scoring engine that evaluates each customer against configurable criteria.
- Ranked account list with tiering (e.g., Tier 1 / Tier 2 / Tier 3) and sortable/filterable views.
- Score breakdown showing contributing factors for each account's ranking.
- Configurable scoring model (weights, thresholds, included signals) managed by Revenue Operations.
- Alerts and notifications when an account's rank changes significantly.
- Export and reporting capabilities for portfolio reviews and leadership visibility.

## Data & Constraints

- Customer: id, name, industry, segment, assigned_account_manager, current_arr, contract_end_date, account_age
- RevenueSignal: id, customer_id, signal_type (e.g., historical_spend, growth_rate, wallet_share, cross-sell_opportunity, engagement_score), value, captured_at
- RankingScore: id, customer_id, composite_score, tier, rank_position, scoring_model_version, calculated_at
- ScoringModel: id, version, criteria_weights (JSON), tier_thresholds, active_flag, created_by, effective_date
- RankChangeEvent: id, customer_id, previous_rank, new_rank, previous_tier, new_tier, changed_at

Constraints:
- Rankings must refresh at least daily; on-demand recalculation available.
- Historical ranking snapshots retained for trend analysis (minimum 24 months).
- PII handling per organizational data governance policies.
- Scoring model changes are versioned and auditable.
- System must handle portfolios of up to 500 accounts per Account Manager and 50,000 accounts organization-wide.

## User Scenarios & Testing

### Scenario 1 — View ranked account list (happy path)

1. Account Manager logs in and navigates to "My Accounts" or "Account Rankings" view.
2. System displays the manager's assigned accounts ranked by composite revenue-potential score, highest first.
3. Each row shows customer name, tier badge, composite score, top contributing factor, current ARR, and trend indicator (↑ ↓ —).
4. Account Manager filters by tier (e.g., show only Tier 1) or sorts by a specific signal (e.g., growth rate).

Acceptance criteria (testable):
- The ranked list loads with all assigned accounts displayed in descending score order by default.
- Tier badges accurately reflect configured thresholds (e.g., top 20% = Tier 1).
- Filtering by tier returns only accounts matching the selected tier.
- Sorting by any available column reorders the list correctly within 2 seconds.

### Scenario 2 — Inspect score breakdown for a single account

1. Account Manager clicks on an account row to view details.
2. System shows a score breakdown: each contributing signal, its raw value, its weighted contribution, and the resulting composite score.
3. Account Manager can see how the account's score has trended over the last 12 months.

Acceptance criteria (testable):
- Score breakdown sums weighted contributions to equal the displayed composite score (within rounding tolerance of ±0.01).
- Historical trend chart shows at least 12 monthly data points when available.
- Each signal displays a label, value, and weight percentage.

### Scenario 3 — Rank change notification

1. System recalculates rankings overnight.
2. An account moves from Tier 2 to Tier 1 (or drops from Tier 1 to Tier 2).
3. Account Manager receives an in-app notification (and optionally email) summarizing the change.

Acceptance criteria (testable):
- Notification is delivered within 1 hour of ranking recalculation completing.
- Notification includes account name, previous tier/rank, new tier/rank, and primary driver of change.
- Account Manager can click through from notification to the account's score breakdown.

### Scenario 4 — Revenue Operations configures scoring model

1. Admin navigates to scoring model configuration.
2. Admin adjusts weights for signals (e.g., increases weight of cross-sell opportunity from 15% to 25%).
3. Admin saves and activates the new model version.
4. System recalculates all rankings using the new model; previous model version is archived.

Acceptance criteria (testable):
- New model version is persisted with a unique version identifier and effective date.
- Rankings recalculate within the defined SLA (see Performance section) after activation.
- Previous model version remains accessible for audit and comparison.
- Changing weights that sum to more or less than 100% is rejected with a clear validation message.

### Scenario 5 — Export rankings for portfolio review

1. Account Manager or Sales Leader selects a set of accounts (or all) and clicks "Export."
2. System generates a downloadable file (CSV or PDF) containing rank, tier, score, contributing factors, and key account metadata.

Acceptance criteria (testable):
- Export file contains all visible columns and respects active filters.
- Export completes within 30 seconds for up to 500 accounts.
- File is formatted correctly and opens without errors in standard spreadsheet applications.

## Functional Requirements (testable)

1. **Scoring engine**
   - System calculates a composite revenue-potential score for every active customer using the active scoring model.
   - Scores are recalculated at minimum once per day; manual "recalculate now" is available to Admins.
   - If a required signal is missing for a customer, the system applies a documented default or excludes that signal and notes the gap.

2. **Ranking and tiering**
   - Customers are ranked in descending order of composite score within each Account Manager's portfolio and organization-wide.
   - Tier thresholds are configurable (e.g., percentile-based or absolute score cutoffs).
   - Ties in score are broken by a deterministic secondary criterion (e.g., alphabetical by name) and documented.

3. **Ranked list view**
   - Account Managers see only their assigned accounts by default; Sales Leadership can view all accounts or filter by manager.
   - List supports sorting by any displayed column and filtering by tier, industry, segment, and score range.
   - Pagination or virtual scrolling handles large portfolios without degraded usability.

4. **Score transparency**
   - Each account's detail view shows the full breakdown of signals, weights, and contributions.
   - Changes in score between calculation periods are highlighted with directional indicators.

5. **Notifications & alerts** [NEEDS CLARIFICATION: preferred notification channels beyond in-app]
   - System notifies Account Managers of significant rank/tier changes after each recalculation cycle.
   - Significance threshold is configurable (e.g., tier change, rank movement > 10 positions).

6. **Scoring model management**
   - Revenue Operations can create, edit, version, activate, and deactivate scoring models.
   - Only one model may be active at a time; activation triggers recalculation.
   - All model versions are retained for audit; comparison view between versions is available.

7. **Reporting & export**
   - Rankings can be exported as CSV or PDF with applied filters preserved.
   - Sales Leadership can view aggregate tier distribution and portfolio-level metrics.

8. **Security & access control**
   - Account Managers access only their assigned accounts' rankings unless granted broader permissions.
   - Sales Leadership has read access to all rankings.
   - Revenue Operations has model configuration access; changes are logged with actor and timestamp.

9. **Performance**
   - Ranked list view loads usable content within 2 seconds for portfolios up to 500 accounts.
   - Full organization-wide recalculation (50,000 accounts) completes within 30 minutes.
   - On-demand single-account recalculation returns result within 5 seconds.

10. **Data integrity & auditability**
    - Every scoring model change, recalculation event, and rank change is logged with timestamp and actor.
    - Historical ranking snapshots are queryable for trend analysis over at least 24 months.

## Success Criteria (measurable & verifiable)

- **Adoption:** 80% of active Account Managers use the ranking view at least 3 times per week within 60 days of launch.
- **Time savings:** Median time for an Account Manager to identify their top 10 priority accounts decreases from baseline by ≥ 50%.
- **Revenue impact:** Accounts ranked Tier 1 receive ≥ 30% more planned touchpoints (meetings, proposals) than Tier 3 accounts within 90 days of launch.
- **Accuracy perception:** ≥ 75% of Account Managers rate the ranking as "useful" or "very useful" in quarterly survey.
- **Performance:** 95th percentile page load for ranked list view ≤ 2 seconds; recalculation SLA met ≥ 99% of cycles.
- **Data quality:** < 5% of accounts have missing signals that prevent scoring in any given cycle.

## Key Entities

- Customer (the account being ranked)
- Account Manager (user consuming rankings)
- Revenue Signal (individual data point contributing to score)
- Ranking Score (composite score and tier assignment for a customer at a point in time)
- Scoring Model (versioned configuration of weights and thresholds)
- Rank Change Event (record of significant ranking movements)
- Notification (alert delivered to user on rank change)

## Assumptions

- Underlying revenue and engagement data (ARR, growth rate, engagement scores, etc.) is available from existing systems and refreshed at least daily.
- Account-to-Manager assignment data is maintained in the CRM or master data source and is authoritative.
- The initial scoring model and weights will be defined collaboratively by Revenue Operations and Sales Leadership before launch.
- Users access the feature via a modern web browser; no offline mode required for initial release.

## Milestones (high-level)

1. **M1 — Core scoring & ranked list**
   - Scoring engine with configurable model, daily recalculation, ranked list view with tier badges, score breakdown detail.

2. **M2 — Notifications, export & model management UI**
   - Rank-change alerts, CSV/PDF export, scoring model versioning UI, audit logging.

3. **M3 — Advanced analytics & optimization**
   - Historical trend analysis, portfolio health dashboards for leadership, model effectiveness reporting, recommendation engine for next-best-action on high-potential accounts.

---

Notes:
- Clarify preferred notification channels (email, SMS, Slack, etc.) with stakeholders before M2 development.
- Confirm data source integrations and refresh frequencies during M1 discovery.
- Validate initial tier thresholds and scoring weights with a pilot group of Account Managers before organization-wide rollout.