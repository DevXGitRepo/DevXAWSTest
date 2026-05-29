---
name: implement
description: Implement a feature following the Spec-Driven Development workflow. Reads specs, requirements, and TDD tests to guide implementation.
user-invocable: true
argument-hint: "[feature-slug]"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# /implement — Implement a Feature

> Pick a feature from the spec index, read its full specification, and generate an implementation plan.

## Workflow

1. Read the feature index:
   - Open `specs/.devx/features.json`
   - Find the first feature with `"status": "not-started"`, or ask the user which feature to implement
   - Note the feature slug

2. Read the full specification:
   - Open `specs/<slug>/specs.md`
   - Understand the Summary, Key Features, Functional Requirements, and User Scenarios
   - Do not skip any section

3. Read the requirements checklist:
   - Open `specs/<slug>/requirements.md`
   - This is the acceptance criteria — every item must be satisfied


4. Create an implementation plan:
   - Break the work into concrete steps based on the requirements
   - Identify files to create or modify
   - Identify dependencies between requirements
   - Present the plan to the user for approval

5. Implement one requirement at a time:
   - Follow the spec exactly — do not add features not described
   - After each requirement, verify it against requirements.md

6. After all requirements are complete:
   - Review the full requirements.md checklist
   - Verify all user scenarios from specs.md work correctly
   - Update features.json status to "done"

## Rules

- **Do not deviate from the specification.** If the spec is wrong, update it first.
- **One requirement at a time.** Complete and validate before moving on.
- **Requirements are the source of truth** for what "done" means.
- **No gold-plating.** Do not add features beyond what the spec describes.
