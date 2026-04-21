---
name: next
description: Show the next unimplemented feature from the spec index with its file paths and summary.
user-invocable: true
allowed-tools: Read
---

# /next — Show Next Feature to Implement

> Display the next unimplemented feature from the spec index.

## Workflow

1. Read the feature index:
   - Open `specs/.devx/features.json`
   - Parse the features array

2. Find the next feature:
   - Look for the first feature with `"status": "not-started"`
   - If all features are done, report that

3. Display the feature summary:
   - Title and slug
   - Number of user stories and total story points
   - File paths (specs.md, requirements.md, tdd-tests.md if applicable, prompt.md)
   - Brief description from the first few lines of specs.md

4. Ask the user if they want to start implementing it:
   - If yes, proceed with the /implement workflow
   - If no, show the full feature list with statuses

## Output Format

```
## Next Feature: <Title>

- **Slug:** <slug>
- **Stories:** <count> (<total points> story points)
- **Status:** not-started

### Files
- specs/<slug>/specs.md
- specs/<slug>/requirements.md
- specs/<slug>/prompt.md

### Summary
<First paragraph from specs.md>

Ready to implement? Use /implement to start.
```
