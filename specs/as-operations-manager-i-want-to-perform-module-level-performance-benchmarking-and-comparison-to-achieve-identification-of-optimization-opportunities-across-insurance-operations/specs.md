# Feature: As Operations Manager, I want to perform module-level performance benchmarking and comparison to achieve identification of optimization opportunities across insurance operations
Status: NEW
Owner: DevX
Last Updated: 2026-04-15

Status: NEW
Owner: Operations
Last Updated: 2025-01-15

## Summary

Provide Operations Managers with a dedicated benchmarking capability that measures, compares, and ranks the performance of discrete operational modules (e.g., Claims Processing, Underwriting, Policy Administration, Billing, Customer Service) across configurable time periods, peer groups, and internal/external benchmarks. The product must surface clear, actionable insights that pinpoint optimization opportunities — not just raw data — so that leadership can prioritize improvement initiatives with confidence.

## Actors

- **Operations Manager** (primary user) — configures benchmarks, reviews comparisons, exports findings, and acts on optimization recommendations.
- **Department Lead** — views benchmarking results scoped to their own module(s) and provides contextual annotations.
- **Executive / VP of Operations** — consumes high-level benchmark summaries and trend reports for strategic planning.
- **System Administrator** — manages data source connections, benchmark definitions, and access permissions.
- **System** (background processors, data pipeline, calculation engine) — ingests operational data, computes KPIs, runs benchmark calculations, and generates alerts.

## Goals

- Enable side-by-side performance comparison of any combination of operational modules using standardized KPIs.
- Allow benchmarking against historical baselines, internal targets, and (where available) industry benchmarks.
- Surface statistically meaningful deviations and rank modules by optimization potential.
- Reduce the time an Operations Manager spends gathering and normalizing cross-module performance data from hours to minutes.
- Provide exportable, presentation-ready benchmark reports for leadership review.

## Key Features

- **Benchmark Configuration** — define and save benchmark profiles specifying modules, KPIs, time ranges, comparison baselines, and peer groups.
- **KPI Calculation Engine** — compute standardized performance indicators per module (throughput, cycle time, cost per transaction, error/rework rate, SLA adherence, customer satisfaction score).
- **Comparison Dashboard** — interactive visual comparison of modules across selected KPIs with ranking, variance indicators, and trend lines.
- **Optimization Opportunity Identification** — automated flagging of modules whose KPIs deviate beyond configurable thresholds from baseline or peers, ranked by estimated impact.
- **Drill-Down Analysis** — from any module-level metric, navigate into contributing sub-metrics and underlying data dimensions (team, region, product line).
- **Benchmark Reports & Export** — generate and export benchmark comparison reports in PDF and CSV formats.
- **Alerts & Scheduled Benchmarks** — schedule recurring benchmark runs and receive notifications when new optimization opportunities are detected.

## Data & Constraints

### Core Entities

- **BenchmarkProfile**: id, name, created_by, created_at, updated_at, modules[], kpis[], time_range, baseline_type (historical | target | industry), peer_group, status (draft | active | archived)
- **Module**: id, name, description, department, is_active
- **KPIDefinition**: id, name, unit, direction (higher_is_better | lower_is_better), calculation_rule, category
- **BenchmarkResult**: id, profile_id, run_date, module_id, kpi_id, value, baseline_value, variance, variance_pct, rank, opportunity_flag
- **OptimizationOpportunity**: id, benchmark_result_id, module_id, kpi_id, severity (low | medium | high | critical), estimated_impact, description, status (new | acknowledged | in_progress | resolved | dismissed)
- **BenchmarkReport**: id, profile_id, run_date, format, generated_at, generated_by, file_reference

### Constraints

- KPI calculations must use consistent, auditable formulas across all modules.
- Historical data must be available for at least 24 rolling months for trend analysis.
- Benchmark results must be immutable once generated; corrections require a new run.
- All data access is scoped by the user's module-level permissions.
- Industry benchmark data, if integrated, must cite source and vintage.
- PII must not appear in benchmark datasets; all data is aggregated at the module level.
- Export files must not exceed 50 MB.

## User Scenarios & Testing

### Scenario 1 — Create and run a benchmark comparison (happy path)

1. Operations Manager navigates to the Benchmarking section and selects "New Benchmark."
2. Manager selects three modules (Claims Processing, Underwriting, Billing), four KPIs (cycle time, cost per transaction, error rate, SLA adherence), a time range (last quarter), and baseline type (prior quarter).
3. Manager saves the profile and triggers a benchmark run.
4. System calculates KPIs for each module, computes variances against baseline, ranks modules per KPI, and flags optimization opportunities.
5. Manager views the comparison dashboard showing ranked results, variance indicators, and flagged opportunities.

**Acceptance criteria (testable):**

- Given a valid benchmark profile with at least two modules and one KPI, when the benchmark is executed, then results are generated for every module–KPI combination within the profile.
- Given a completed benchmark run, when results are displayed, then each module–KPI pair shows the computed value, baseline value, absolute variance, percentage variance, and rank.
- Given a benchmark run completes, when any module–KPI variance exceeds the configured threshold, then an optimization opportunity record is created with severity and estimated impact.
- Given a benchmark run, when the run completes, then the total execution time is under 30 seconds for profiles covering up to 10 modules and 10 KPIs over a 12-month range.

### Scenario 2 — Compare against industry benchmarks

1. Operations Manager creates a benchmark profile with baseline type set to "industry."
2. System retrieves the most recent industry benchmark dataset for the selected KPIs.
3. Results display each module's performance relative to the industry median and top-quartile values.

**Acceptance criteria (testable):**

- Given baseline type is "industry," when industry data is available for the selected KPIs, then results include industry median and top-quartile values alongside module values.
- Given baseline type is "industry," when industry data is unavailable for a KPI, then that KPI is excluded from the run and the user is informed with a specific message listing the missing KPIs.

### Scenario 3 — Drill down into a flagged opportunity

1. Operations Manager clicks on a flagged optimization opportunity for Claims Processing — cycle time.
2. System displays sub-metric breakdown (e.g., by claim type, region, team) showing which dimensions contribute most to the deviation.

**Acceptance criteria (testable):**

- Given a flagged optimization opportunity, when the user requests drill-down, then the system returns sub-metric breakdowns by at least two dimensions (e.g., region, product line).
- Given drill-down data, when displayed, then each sub-dimension shows its contribution percentage to the overall variance.

### Scenario 4 — Export benchmark report

1. Operations Manager selects a completed benchmark run and clicks "Export PDF."
2. System generates a formatted report containing profile parameters, comparison charts placeholder data, ranked results, and flagged opportunities.
3. Manager downloads the file.

**Acceptance criteria (testable):**

- Given a completed benchmark run, when the user requests a PDF export, then a report file is generated and available for download within 60 seconds.
- Given an exported report, then it contains: profile metadata, module rankings per KPI, variance data, and a list of flagged optimization opportunities.
- Given an exported CSV, then each row represents one module–KPI result with all numeric fields parseable as numbers.

### Scenario 5 — Scheduled benchmark with alert

1. Operations Manager configures a benchmark profile to run monthly on the 1st.
2. On the scheduled date, the system executes the benchmark automatically.
3. If new high-severity opportunities are detected, the system sends an in-app notification and email to the profile owner.

**Acceptance criteria (testable):**

- Given a profile with a monthly schedule, when the scheduled date arrives, then the system executes the benchmark without manual intervention and persists results.
- Given a scheduled run produces a high-severity opportunity, then a notification is delivered to the profile owner within 5 minutes of run completion.

### Scenario 6 — Insufficient permissions

1. A Department Lead attempts to view benchmark results that include modules outside their scope.
2. System returns only the results for modules the user is authorized to view; unauthorized module data is omitted without error.

**Acceptance criteria (testable):**

- Given a user with access to Module A only, when they request benchmark results that include Module A and Module B, then only Module A results are returned.
- Given a user with no access to any module in a benchmark profile, when they request results, then the system returns an empty result set with an informative message.

## Functional Requirements (testable)

### 1. Benchmark Profile Management

- **Given** an authenticated Operations Manager, **when** they submit a new benchmark profile with valid modules, KPIs, time range, and baseline type, **then** the profile is persisted with status "draft" and a unique identifier is returned.
- **Given** a draft profile, **when** the owner updates any field, **then** the profile is updated and `updated_at` is set to the current timestamp.
- **Given** a profile, **when** the owner archives it, **then** its status changes to "archived" and it no longer appears in active profile listings.
- **Given** a profile with fewer than two modules or zero KPIs, **when** the user attempts to save, **then** the system rejects the request with a validation error specifying the constraint.

### 2. KPI Calculation & Benchmark Execution

- **Given** a valid active benchmark profile, **when** the user triggers execution, **then** the system computes each KPI for each module over the specified time range using the defined calculation rule.
- **Given** a KPI with direction "lower_is_better," **when** ranking modules, **then** the module with the lowest value receives rank 1.
- **Given** a completed benchmark run, **when** results are persisted, **then** each `BenchmarkResult` record is immutable and includes a reference to the profile version used.
- **Given** insufficient source data for a module–KPI pair (e.g., no transactions in the time range), **when** the benchmark runs, **then** that pair is marked as "insufficient data" rather than computed as zero.

### 3. Optimization Opportunity Detection

- **Given** a benchmark result where variance exceeds the configured threshold, **when** the run completes, **then** an `OptimizationOpportunity` record is created with severity derived from the magnitude of deviation.
- **Given** severity thresholds (e.g., >10% = low, >25% = medium, >50% = high, >75% = critical), **when** a variance of 30% is detected, **then** the opportunity is classified as "medium."
- **Given** an existing opportunity for the same module–KPI from a prior run, **when** a new run detects the same deviation, **then** the system links the new result to the existing opportunity rather than creating a duplicate.

### 4. Comparison Dashboard API

- **Given** a completed benchmark run, **when** the dashboard endpoint is called, **then** it returns module rankings, KPI values, variances, trend data (last N runs), and flagged opportunities in a single response.
- **Given** a request for trend data, **when** fewer than two historical runs exist, **then** the trend array is returned with available data points and no error is raised.

### 5. Drill-Down Analysis

- **Given** a benchmark result ID and a dimension (e.g., region), **when** the drill-down endpoint is called, **then** the system returns sub-metric values broken down by that dimension with contribution percentages.
- **Given** a dimension that has no data for the selected module, **when** drill-down is requested, **then** the system returns an empty breakdown with an explanatory message.

### 6. Report Generation & Export

- **Given** a completed benchmark run and a requested format (PDF or CSV), **when** the export endpoint is called, **then** a report is generated, stored, and a download URL is returned.
- **Given** a report request for a run that is still in progress, **when** the export endpoint is called, **then** the system returns a 409 Conflict with a message indicating the run is not yet complete.

### 7. Scheduling & Notifications

- **Given** a profile with a valid cron-style schedule, **when** the scheduled time arrives, **then** the system enqueues and executes the benchmark run automatically.
- **Given** a completed scheduled run with new high or critical severity opportunities, **when** processing completes, **then** the system dispatches an in-app notification and an email to the profile owner.
- **Given** a completed scheduled run with no new opportunities above the notification threshold, **then** no alert notification is sent (a run-complete log entry is still recorded).

### 8. Authorization & Data Scoping

- **Given** a user with module-level permissions, **when** they request any benchmark data, **then** the response includes only data for modules the user is authorized to access.
- **Given** an unauthenticated request to any benchmarking endpoint, **then** the system returns 401 Unauthorized.
- **Given** a user without the "benchmarking" role, **when** they attempt to create or execute a profile, **then** the system returns 403 Forbidden.

### 9. Auditability

- **Given** any create, update, execute, or export action on benchmark entities, **when** the action completes, **then** an audit log entry is recorded with actor, action, entity, timestamp, and before/after state (where applicable).

### 10. Performance

- **Given** a benchmark execution covering up to 10 modules × 10 KPIs × 12 months of data, **when** triggered, **then** results are available within 30 seconds.
- **Given** a dashboard API call for a completed run, **when** requested, **then** the response is returned within 2 seconds.

### 11. Data Integrity

- **Given** a benchmark result record, **when** any mutation is attempted via API, **then** the system returns 405 Method Not Allowed.
- **Given** a KPI calculation, **when** the same inputs are provided, **then** the output is deterministic and reproducible.

## Test-First Checklist

The following tests must be written and failing **before** the corresponding implementation is built. Tests are ordered by dependency.

| # | Test | Covers Requirement |
|---|------|--------------------|
| 1 | `POST /benchmark-profiles` with valid payload returns 201 and a profile ID | Profile Management |
| 2 | `POST /benchmark-profiles` with < 2 modules returns 422 with validation error | Profile Management |
| 3 | `POST /benchmark-profiles` with 0 KPIs returns 422 with validation error | Profile Management |
| 4 | `PATCH /benchmark-profiles/:id` updates fields and sets `updated_at` | Profile Management |
| 5 | `PATCH /benchmark-profiles/:id/archive` sets status to "archived" | Profile Management |
| 6 | `POST /benchmark-profiles/:id/execute` with valid profile returns 202 and enqueues run | Benchmark Execution |
| 7 | Benchmark engine computes correct KPI value for a known dataset | KPI Calculation |
| 8 | Benchmark engine ranks modules correctly for "lower_is_better" KPI | KPI Calculation |
| 9 | Benchmark engine ranks modules correctly for "higher_is_better" KPI | KPI Calculation |
| 10 | Benchmark engine marks module–KPI pair as "insufficient data" when no transactions exist | KPI Calculation |
| 11 | Benchmark result records are immutable — `PUT /benchmark-results/:id` returns 405 | Data Integrity |
| 12 | Opportunity is created when variance exceeds threshold | Opportunity Detection |
| 13 | Opportunity severity is "medium" for 30% variance given defined thresholds | Opportunity Detection |
| 14 | Duplicate opportunity is linked, not recreated, for same module–KPI across runs | Opportunity Detection |
| 15 | `GET /benchmark-runs/:id/dashboard` returns rankings, variances, trends, and opportunities | Dashboard API |
| 16 | `GET /benchmark-runs/:id/dashboard` with < 2 historical runs returns partial trend without error | Dashboard API |
| 17 | `GET /benchmark-results/:id/drilldown?dimension=region` returns sub-metric breakdown with contribution percentages | Drill-Down |
| 18 | `GET /benchmark-results/:id/drilldown?dimension=unknown` returns empty breakdown with message | Drill-Down |
| 19 | `POST /benchmark-runs/:id/export?format=pdf` for completed run returns 200 with download URL | Export |
| 20 | `POST /benchmark-runs/:id/export?format=csv` for completed run returns parseable numeric fields | Export |
| 21 | `POST /benchmark-runs/:id/export` for in-progress run returns 409 | Export |
| 22 | Scheduled benchmark executes automatically at configured time | Scheduling |
| 23 | Notification is dispatched for high-severity opportunity after scheduled run | Notifications |
| 24 | No notification is dispatched when scheduled run produces no new high-severity opportunities | Notifications |
| 25 | User with Module A access only sees Module A results in benchmark response | Authorization |
| 26 | Unauthenticated request returns 401 | Authorization |
| 27 | User without "benchmarking" role receives 403 on profile creation | Authorization |
| 28 | Industry baseline run excludes KPIs with no industry data and returns informative message | Industry Benchmarks |
| 29 | Audit log entry is created for profile creation, execution, and export actions | Auditability |
| 30 | Benchmark execution for 10 modules × 10 KPIs × 12 months completes within 30 seconds | Performance |
| 31 | Dashboard API responds within 2 seconds for a completed run | Performance |

## Success Criteria (measurable & verifiable)

- **Adoption**: ≥ 80% of active Operations Managers create at least one benchmark profile within 60 days of launch.
- **Time savings**: Median time to produce a cross-module performance comparison is under 5 minutes (vs. current manual process baseline measured pre-launch).
- **Opportunity identification**: ≥ 90% of benchmark runs covering 3+ modules surface at least one actionable optimization opportunity (validated by user feedback survey).
- **Accuracy**: 100% of KPI calculations match independently verified reference calculations in acceptance testing.
- **Performance**: 95% of benchmark executions (≤ 10 modules, ≤ 10 KPIs, ≤ 12 months) complete within 30 seconds; dashboard API p95 latency ≤ 2 seconds.
- **Export reliability**: 99% of export requests produce a downloadable file without retry.
- **Authorization correctness**: Zero instances of cross-module data leakage in penetration testing.
- **Audit completeness**: 100% of create, execute, and export actions have corresponding audit log entries.

## Key Entities

- **User** (Operations Manager, Department Lead, Executive, System Administrator)
- **Module** (operational unit being benchmarked)
- **KPIDefinition** (standardized metric definition)
- **BenchmarkProfile** (saved configuration for a benchmark comparison)
- **BenchmarkRun** (single execution instance of a profile)
- **BenchmarkResult** (computed value for one module–KPI pair in a run)
- **OptimizationOpportunity** (flagged deviation with severity and impact)
- **BenchmarkReport** (generated export artifact)
- **Notification** (in-app, email alert for opportunity detection)
- **AuditLogEntry** (immutable record of user/system actions)

## Assumptions

- Operational data for all in-scope modules is available via existing data pipelines or APIs with at least 24 months of history.
- KPI definitions and calculation rules will be agreed upon with business stakeholders before implementation begins.
- Industry benchmark datasets, if used, will be sourced from a licensed third-party provider; integration details are TBD.
- Users access the system via modern browsers; no offline capability is required.
- Email delivery infrastructure is available for notifications; SMS is out of scope for the initial release.
- Module-level permission assignments already exist in the organization's identity/access management system.

## Milestones (high-level)

1. **M1 — Core Benchmarking Engine & Profile Management**
   - Benchmark profile CRUD, KPI calculation engine, benchmark execution, result persistence, basic comparison API.

2. **M2 — Dashboard, Drill-Down & Opportunity Detection**
   - Comparison dashboard API, drill-down analysis, automated opportunity flagging with severity classification, authorization scoping.

3. **M3 — Export, Scheduling, Notifications & Hardening**
   - PDF/CSV report generation, scheduled benchmark runs, notification delivery, audit logging, performance optimization, and security hardening.

---

**Notes:**

- Industry benchmark data source and licensing terms require confirmation before M1 scope is finalized; if unavailable, industry baseline type will be deferred to a future release.
- Threshold values for opportunity severity classification should be configurable per organization; defaults are specified in Requirement 3 but must be validated with stakeholders.
- See `checklists/requirements.md` for spec quality validation.