---
name: validate
description: Validate current code against the requirements checklist for a feature. Produces a pass/fail report.
user-invocable: true
argument-hint: "[feature-slug]"
allowed-tools: Read, Grep, Glob, Bash
---

# /validate — Validate Implementation Against Requirements

> Check the current code against the requirements checklist for a specific feature.

## Workflow

1. Identify the feature to validate:
   - Ask the user which feature to validate, or use the most recently implemented one
   - Find it in `specs/.devx/features.json` by slug, title, or ID

2. Read the requirements checklist:
   - Open `specs/<slug>/requirements.md`
   - This contains every acceptance criterion that must be satisfied

3. Read the specification for context:
   - Open `specs/<slug>/specs.md`
   - Understand the expected behavior and edge cases

4. For each requirement in the checklist:
   - Search the codebase to verify it is implemented
   - Check that the implementation matches the spec (not just that code exists)
   - Look for edge cases described in the spec
   - Mark each requirement as PASS or FAIL with a brief explanation

5. Generate a validation report:
   - List each requirement with its PASS/FAIL status
   - For any FAIL items, explain what is missing or incorrect
   - Provide a summary: X of Y requirements satisfied
   - If all pass, suggest updating features.json status to "done"

## Output Format

```
## Validation Report — <Feature Title>

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | <requirement text> | PASS/FAIL | <explanation> |
| ... | ... | ... | ... |

**Result: X/Y requirements satisfied**
```

## Rules

- Be thorough — check actual implementation, not just file existence
- Look at edge cases and error handling described in the spec
- Do not mark a requirement as PASS if it is only partially implemented
- If the feature has TDD tests, verify they all pass as well
