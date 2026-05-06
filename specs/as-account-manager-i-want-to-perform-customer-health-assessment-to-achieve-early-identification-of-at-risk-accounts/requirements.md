# Specification Quality Checklist: Customer Health Assessment

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2025-01-15
**Feature**: As Account Manager, I want to perform customer health assessment to achieve early identification of at-risk accounts (Feature #77595)

## Content Quality

- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

## Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] Success criteria are technology-agnostic (no implementation details)
- [ ] All acceptance scenarios are defined
- [ ] Edge cases are identified (e.g., accounts with incomplete data, newly onboarded customers, dormant accounts)
- [ ] Scope is clearly bounded (which accounts, which signals, which timeframes)
- [ ] Dependencies and assumptions identified (data sources, scoring model inputs, access permissions)

## Feature Readiness

- [ ] Health assessment criteria and scoring dimensions are clearly defined
- [ ] Thresholds for "at-risk" classification are specified
- [ ] User scenarios cover primary flows (viewing health score, drilling into contributing factors, triggering intervention)
- [ ] Notification or alerting behavior for at-risk accounts is defined
- [ ] Feature meets measurable outcomes defined in Success Criteria (e.g., reduction in churn, earlier intervention time)
- [ ] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before proceeding to clarification or planning.
- Feature currently has a single user story in "New" state — additional decomposition may be needed.

## Validation Results (initial)

- No [NEEDS CLARIFICATION] markers remain: **FAIL** — multiple ambiguities identified below
- Requirements are testable: **FAIL** — health scoring dimensions and thresholds not yet defined
- Success criteria measurable: **FAIL** — no quantitative targets specified (e.g., churn reduction %, detection lead time)
- Technology-agnostic: **PASS** — no implementation details observed
- All mandatory sections completed: **FAIL** — acceptance criteria, edge cases, and scope boundaries are missing

Remaining issues:

- [NEEDS CLARIFICATION: health score inputs] — which signals constitute the health assessment (usage frequency, support tickets, NPS, contract renewal proximity, engagement metrics)?
- [NEEDS CLARIFICATION: at-risk thresholds] — what score or combination of factors classifies an account as at-risk, and who defines/adjusts these thresholds?
- [NEEDS CLARIFICATION: assessment frequency] — is health assessed on-demand, on a scheduled cadence, or continuously with alerts?
- [NEEDS CLARIFICATION: scope of accounts] — does this apply to all customers or a specific segment (enterprise, SMB, by ARR tier)?
- [NEEDS CLARIFICATION: intervention workflow] — once an at-risk account is identified, what actions or workflows should be available to the Account Manager?

Resolve these open questions before proceeding to planning.