# HiltiProjT

> Auto-generated project context for AI-assisted development.
> Last updated: 2026-05-15

**Organization:** https://devxnous.atlassian.net

## Development Methodology

This project follows **Spec-Driven Development (SDD)** with **Test-Driven Development (TDD)**.

Every feature has:
- `specs.md` — Full technical specification
- `requirements.md` — Acceptance criteria checklist
- `tdd-tests.md` — Test specifications (Red → Green → Refactor)
- `prompt.md` — Ready-to-use implementation prompt

## Features (13)

- **As System Administrator, I want to perform login screen accessibility compliance to achieve inclusive access for all users** (5 user stories)
- **As Account Manager, I want to see a specific error when my credentials are incorrect so that I can identify which field to correct** (1 user stories)
- **As Account Manager, I want to perform customer ranking by revenue potential to achieve focused attention on highest-value accounts** (0 user stories)
- **As Production Manager, I want to perform login screen navigation to achieve quick access to the authentication page** (0 user stories)
- **As Plant Operator, I want to perform login button click to achieve authentication request submission** (0 user stories)
- **As System Administrator, I want to perform login form submission via keyboard to achieve efficient authentication without mouse dependency** (0 user stories)
- **As Plant Operator, I want to perform login with empty field detection to achieve clear guidance on required inputs** (5 user stories)
- **As Account Manager, I want to perform customer health assessment to achieve early identification of at-risk accounts** (1 user stories)
- **As Account Manager, I want to see a clear error message when my password is invalid so that I know exactly what went wrong** (1 user stories)
- **As DevOps Engineer, I want to perform canary deployment validation to achieve risk-reduced production releases** (0 user stories)
- **As Release Manager, I want to perform automated deployment scheduling to achieve predictable release timelines** (0 user stories)
- **As Account Manager, I want to perform priority list customization to achieve alignment with personal territory strategy** (1 user stories)
- **As Plant Operator, I want to perform login with masked password display to achieve credential confidentiality** (0 user stories)

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
    tdd-tests.md         ← TDD test specifications
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
