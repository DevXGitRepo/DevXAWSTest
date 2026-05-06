---
name: tdd-cycle
description: Run the TDD Red-Green-Refactor cycle for a specific acceptance criterion. Writes a failing test, implements minimum code, then refactors.
user-invocable: true
argument-hint: "[feature-slug] [criterion-number]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# /tdd-cycle — Run TDD Red-Green-Refactor Cycle

> Execute the Test-Driven Development cycle for a specific acceptance criterion.

## Workflow

1. Identify the target:
   - Ask the user which feature and which acceptance criterion to work on
   - Find the feature in `specs/.devx/features.json`
   - Read `specs/<slug>/tdd-tests.md` for the test specifications

2. **Phase 1 — Red (Write Failing Test)**
   - Read the test specification for the target criterion from tdd-tests.md
   - Write a test that captures the expected behavior
   - Run the test and confirm it FAILS
   - Verify the test fails for the RIGHT reason (not a syntax error, missing import, etc.)
   - Do NOT write any production code yet
   - Show the user the failing test output

3. **Phase 2 — Green (Make It Pass)**
   - Write the MINIMUM production code needed to make the failing test pass
   - Do not add extra logic, optimizations, or features
   - Run the test and confirm it PASSES
   - Run the full test suite to ensure nothing else broke
   - Show the user the passing test output

4. **Phase 3 — Refactor (Clean Up)**
   - Review the production code for improvements:
     - Extract duplicated logic (Rule of Three)
     - Apply SOLID principles where appropriate
     - Improve naming and readability
     - Remove dead code
   - After EVERY refactor change, run the test suite
   - All tests must remain GREEN throughout refactoring
   - Show the user the final clean code

5. Repeat:
   - Move to the next acceptance criterion
   - Or ask the user which criterion to tackle next

## Rules

- **Never write production code before a failing test exists**
- **Never write more code than needed to pass the current test**
- **Never refactor while tests are red**
- **Run tests after every change** — not just at the end
- If a test is hard to write, the design may need to change — discuss with the user
- Keep tests focused: one behavior per test
- Test names should describe the expected behavior, not the implementation

## Test Naming Convention

Use descriptive names that read like requirements:
```
- "should return empty list when no items exist"
- "should reject invalid email format"
- "should calculate total including tax"
```
