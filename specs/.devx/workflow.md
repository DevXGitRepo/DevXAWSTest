# Development Workflow

> Spec-Driven Development (SDD) + Test-Driven Development (TDD) workflow guide.

## How to Implement a Feature

### Step 1 — Understand the Spec
1. Open the feature's `specs.md`
2. Read the Summary, Key Features, and Functional Requirements
3. Review the User Scenarios for expected behavior

### Step 2 — Review Requirements
1. Open `requirements.md`
2. This is your acceptance criteria checklist
3. Every item must pass before the feature is considered complete

### Step 3 — Implement
1. Open `prompt.md` — paste it into your AI assistant for guided implementation
2. Follow the specification exactly — do not add features not in the spec
3. Implement one requirement at a time
4. Follow the TDD cycle for each requirement (see below)

### Step 4 — Validate
1. Go through `requirements.md` line by line
2. Check each acceptance criterion
3. Ensure all edge cases from the spec are handled

### Step 5 — Submit
1. Create a PR with the implementation
2. Reference the spec file in the PR description
3. Include the requirements checklist with pass/fail status

## TDD Workflow (Enabled)

For every acceptance criterion, follow the **Red → Green → Refactor** cycle:

### Phase 1 — Red (Write Failing Tests)
1. Read the `tdd-tests.md` for the feature
2. Write a failing test that maps to a spec-defined behavior
3. Ensure the test fails for the right reason
4. Do NOT write production code before the test fails

### Phase 2 — Green (Make Tests Pass)
1. Write the minimum code required to pass each failing test
2. Do NOT add untested or extra logic
3. Run the full test suite — all tests must pass

### Phase 3 — Refactor (Clean Up)
1. Improve code structure while keeping all tests passing
2. Apply SOLID, DRY, and Clean Architecture principles
3. Extract reusable abstractions only when a pattern appears ≥ 3 times (Rule of Three)
4. Run the test suite after every refactor step — it must stay green

Repeat this cycle for each acceptance criterion in sequence.

## Rules

- **Do not deviate from the spec.** If the spec is wrong, update the spec first.
- **One feature at a time.** Complete and validate before moving to the next.
- **Requirements are the source of truth** for what "done" means.
- **Every PR must reference** the spec and requirements it implements.
