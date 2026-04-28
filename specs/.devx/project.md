# Test230426

> Auto-generated project context for AI-assisted development.
> Last updated: 2026-04-28

**Organization:** https://devxnous.atlassian.net/

## Development Methodology

This project follows **Spec-Driven Development (SDD)**.

Every feature has:
- `specs.md` — Full technical specification
- `requirements.md` — Acceptance criteria checklist
- `prompt.md` — Ready-to-use implementation prompt

## Features (16)

- **As a data engineer, I want to support schema evolution so that data structures can adapt over time without data loss** (0 user stories)
- **As Retail Store Associate, I want to perform responsive tile interaction on mobile devices to achieve seamless access on any screen size** (1 user stories)
- **As Retail Store Manager, I want to perform transcription text review to achieve quality verification before AI summary generation** (1 user stories)
- **As Retail Store Manager, I want to perform home screen loading upon login to achieve immediate visibility of all key section tiles** (1 user stories)
- **As QA Engineer, I want to perform Android device compatibility testing to achieve verified functionality across target Android versions** (0 user stories)
- **As Backend Developer, I want to perform retry logic for failed Whisper API calls to achieve resilient transcription processing** (1 user stories)
- **trial task 1** (1 user stories)
- **As Retail Store Manager, I want to perform loading state display during data fetch to achieve clear feedback while home screen data loads** (0 user stories)
- **trial task 3** (0 user stories)
- **As Retail Store Manager, I want to perform loading state display during data fetch to achieve clear feedback while home screen data loads** (1 user stories)
- **As Platform Engineer, I want to perform health checks on registered internal services to achieve proactive detection of unavailable backends** (1 user stories)
- **task 4.1** (0 user stories)
- **As Backend Developer, I want to perform audio file transmission to Whisper API to achieve text transcription of recorded audio** (0 user stories)
- **As System Administrator, I want to perform structured error logging for transcription failures to achieve fast root cause analysis** (0 user stories)
- **As Backend Developer, I want to perform asynchronous transcription job processing to achieve non-blocking audio processing** (0 user stories)
- **As Retail Store Manager, I want to perform tile visual customization to achieve quick recognition of each section** (0 user stories)

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
