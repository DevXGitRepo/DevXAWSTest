# DevXJiraTest

> Auto-generated project context for AI-assisted development.
> Last updated: 2026-04-29

**Organization:** https://devxnous.atlassian.net/

## Development Methodology

This project follows **Spec-Driven Development (SDD)**.

Every feature has:
- `specs.md` — Full technical specification
- `requirements.md` — Acceptance criteria checklist
- `prompt.md` — Ready-to-use implementation prompt

## Features (18)

- **As Customer, I want to perform biometric fallback authentication to achieve login access when biometric recognition fails** (1 user stories)
- **Integration Security, Audit Logging, and Compliance** (0 user stories)
- **Document API and user guide** (1 user stories)
- **As Sales Representative, I want to perform biometric login to achieve fast re-authentication without typing credentials** (1 user stories)
- **As System Administrator, I want to perform biometric policy management to achieve control over biometric authentication availability per role** (1 user stories)
- **As Security Auditor, I want to perform authentication security dashboard review to achieve real-time visibility into authentication health and threats** (1 user stories)
- **Filter State Management and Reset** (0 user stories)
- **Primary Queue Grid Layout and Interaction** (1 user stories)
- **Transaction Management Subsystem Connectivity** (1 user stories)
- **Real-Time Pending Transaction Data Retrieval** (1 user stories)
- **Pending Transaction Filter Engine** (0 user stories)
- **As Operations Manager, I want to perform module-level performance benchmarking and comparison to achieve identification of optimization opportunities across insurance operations** (0 user stories)
- **Write unit and integration tests** (1 user stories)
- **Filtered Results Display and Feedback** (0 user stories)
- **Queue Monitoring Dashboard and Visualization** (1 user stories)
- **As Performance Engineer, I want to perform capacity planning projections based on business growth metrics to achieve proactive infrastructure scaling** (1 user stories)
- **Develop UI components and integration** (0 user stories)
- **Write unit and integration tests** (0 user stories)

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
