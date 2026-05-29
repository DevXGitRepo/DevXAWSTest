# Hilti_ProjTest

> Auto-generated project context for AI-assisted development.
> Last updated: 2026-05-13

**Organization:** https://devxnous.atlassian.net/

## Development Methodology

This project follows **Spec-Driven Development (SDD)**.

Every feature has:
- `specs.md` — Full technical specification
- `requirements.md` — Acceptance criteria checklist
- `prompt.md` — Ready-to-use implementation prompt

## Features (6)

- **As a user, I want to use Customer Profile Creation and Lifecycle Initiation so that I can benefit from its core functionality** (1 user stories)
- **As Dealership Receptionist, I want to perform government-issued ID capture and validation to achieve verified customer identity for regulatory compliance** (0 user stories)
- **As Dealership Receptionist, I want to perform customer name capture with validation to achieve accurate identity recording for the customer profile** (0 user stories)
- **As Laundry Attendant, I want to perform laundry request pickup and processing to achieve timely fulfillment of guest requests** (5 user stories)
- **As a user, I want to configure Contact Information Management and Verification settings so that I can customize it to my needs** (1 user stories)
- **As a user, I want Contact Information Management and Verification to handle errors gracefully so that I can recover from issues easily** (1 user stories)

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
