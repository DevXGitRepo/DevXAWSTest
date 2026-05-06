---
name: autopilot
description: Automatically implement all remaining features end-to-end. Picks the next feature, implements it, validates, marks done, and repeats until all features are complete.
user-invocable: true
argument-hint: "[max-features]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# /autopilot — Implement All Features Automatically

> Chains the full SDD + TDD workflow in a loop: pick next → implement → validate → mark done → repeat.

## Arguments

- `$ARGUMENTS` — optional max number of features to implement in this session (default: all remaining)

## Workflow

For each unimplemented feature, execute these phases in sequence:

### Phase 1 — Pick Next Feature
1. Read `specs/.devx/features.json`
2. Find the first feature with `"status": "not-started"`
3. If no features remain, report completion and stop
4. Announce: "Starting feature: <title> (<N> of <total> remaining)"

### Phase 2 — Read Specs
1. Read `specs/<slug>/specs.md` — understand what to build
2. Read `specs/<slug>/requirements.md` — the acceptance checklist
3. Read `specs/<slug>/tdd-tests.md` — test specifications

### Phase 3 — Implement
Follow the TDD Red → Green → Refactor cycle for each acceptance criterion:

1. **Red** — Write a failing test based on tdd-tests.md
2. **Green** — Write minimum code to pass the test
3. **Refactor** — Clean up while keeping tests green
4. Run the full test suite — all tests must pass
5. Repeat for each criterion in requirements.md

### Phase 4 — Validate
1. Go through every item in `specs/<slug>/requirements.md`
2. Verify each acceptance criterion is satisfied in the code
3. Check edge cases from specs.md
4. Confirm all tests pass

If validation fails:
- Fix the failing criteria
- Re-validate
- Do not proceed until all criteria pass

### Phase 5 — Mark Done
1. Read `specs/.devx/features.json`
2. Update this feature's `"status"` from `"not-started"` to `"done"`
3. Write the updated features.json back
4. Announce: "Completed: <title> ✓"

### Phase 6 — Continue or Stop
1. Check if max features limit reached (from `$ARGUMENTS`)
2. If more features remain and limit not reached → go to Phase 1
3. If all features done → announce completion summary
4. If limit reached → announce progress and remaining count

## Output Between Features

After each feature, show a brief status:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Completed: <Feature Title>
  Requirements: 8/8 passed
  Tests: 12 passed, 0 failed
  Next: <Next Feature Title> (N remaining)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Final Summary

When all features are done (or limit reached), show:
```
══════════════════════════════════════
  Autopilot Complete
  Features implemented: X / Y
  Total requirements satisfied: N
  Total tests: N passed
  Remaining: Z features
══════════════════════════════════════
```

## Rules

- **Never skip validation.** Every feature must pass all requirements before moving on.
- **Stop on repeated failure.** If a feature fails validation 3 times, stop and report the issue.
- **Do not modify specs.** If a spec seems wrong, stop and ask the user.
- **Commit after each feature.** Keep changes atomic and reviewable.
- **Follow TDD strictly.** No production code without a failing test.
- **No gold-plating.** Implement exactly what the spec describes, nothing more.
