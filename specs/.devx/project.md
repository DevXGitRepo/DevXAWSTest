# Project

> Auto-generated project context for AI-assisted development.
> Last updated: 2026-04-22


## Development Methodology

This project follows **Spec-Driven Development (SDD)**.

Every feature has:
- `specs.md` — Full technical specification
- `requirements.md` — Acceptance criteria checklist
- `prompt.md` — Ready-to-use implementation prompt

## Features (2)

- **Advanced Policy Filtering** (3 user stories)
- **Basic Policy Search** (6 user stories)

## Getting Started

1. Read this file for project context
2. Check `specs/.devx/workflow.md` for the development workflow
3. Review `specs/.devx/instruction.md` for architecture and multi-repo rules
4. Pick a feature from `specs/.devx/features.json`
5. Open the feature's `prompt.md` and use it with your AI assistant
6. Follow the spec and requirements to implement

## Project Structure

```
specs/
  .devx/
    project.md          ← You are here
    workflow.md          ← Development workflow
    features.json        ← Feature index (machine-readable)
    architecture.md      ← System architecture
    init.sh              ← Setup AI tool configs
  <feature-slug>/
    specs.md             ← Technical specification
    requirements.md      ← Acceptance criteria
    prompt.md            ← Implementation prompt
```

## AI Tool Setup

Run the init script to configure your AI tools automatically:

```bash
chmod +x ./specs/.devx/init.sh && ./specs/.devx/init.sh
```

Or without changing permissions:

```bash
bash ./specs/.devx/init.sh
```

This creates the appropriate config files for Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, and Kiro.
