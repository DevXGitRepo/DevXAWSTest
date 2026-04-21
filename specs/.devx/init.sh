#!/bin/bash
# DevX AI Tool Configuration Init Script
# Run this after cloning the repo to set up AI tool configs.
#
# Usage: ./specs/.devx/init.sh
# Or:    bash specs/.devx/init.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEVX_DIR="$SCRIPT_DIR"

echo "🔧 DevX AI Tool Configuration"
echo "=============================="
echo ""

# Build the universal context from project.md + workflow.md
PROJECT_CONTEXT=$(cat "$DEVX_DIR/project.md")
WORKFLOW_CONTEXT=$(cat "$DEVX_DIR/workflow.md")

COMBINED_CONTEXT="$PROJECT_CONTEXT

---

$WORKFLOW_CONTEXT"

# ── Claude Code (CLAUDE.md) ──
CLAUDE_FILE="$REPO_ROOT/CLAUDE.md"
if [ ! -f "$CLAUDE_FILE" ]; then
  echo "$COMBINED_CONTEXT" > "$CLAUDE_FILE"
  echo "✅ Created CLAUDE.md"
else
  echo "⏭️  CLAUDE.md already exists — skipping (delete it to regenerate)"
fi

# ── Cursor (.cursorrules) ──
CURSOR_FILE="$REPO_ROOT/.cursorrules"
if [ ! -f "$CURSOR_FILE" ]; then
  echo "$COMBINED_CONTEXT" > "$CURSOR_FILE"
  echo "✅ Created .cursorrules"
else
  echo "⏭️  .cursorrules already exists — skipping"
fi

# ── GitHub Copilot ──
COPILOT_DIR="$REPO_ROOT/.github"
COPILOT_FILE="$COPILOT_DIR/copilot-instructions.md"
mkdir -p "$COPILOT_DIR"
if [ ! -f "$COPILOT_FILE" ]; then
  echo "$COMBINED_CONTEXT" > "$COPILOT_FILE"
  echo "✅ Created .github/copilot-instructions.md"
else
  echo "⏭️  .github/copilot-instructions.md already exists — skipping"
fi

# ── Windsurf (.windsurfrules) ──
WINDSURF_FILE="$REPO_ROOT/.windsurfrules"
if [ ! -f "$WINDSURF_FILE" ]; then
  echo "$COMBINED_CONTEXT" > "$WINDSURF_FILE"
  echo "✅ Created .windsurfrules"
else
  echo "⏭️  .windsurfrules already exists — skipping"
fi

# ── Cline (.clinerules) ──
CLINE_FILE="$REPO_ROOT/.clinerules"
if [ ! -f "$CLINE_FILE" ]; then
  echo "$COMBINED_CONTEXT" > "$CLINE_FILE"
  echo "✅ Created .clinerules"
else
  echo "⏭️  .clinerules already exists — skipping"
fi

# ── Kiro (.kiro/steering/) ──
KIRO_DIR="$REPO_ROOT/.kiro/steering"
mkdir -p "$KIRO_DIR"
KIRO_FILE="$KIRO_DIR/devx-context.md"
if [ ! -f "$KIRO_FILE" ]; then
  cat > "$KIRO_FILE" << 'KIRO_EOF'
---
inclusion: always
---

# IMPORTANT — DevX Spec-Driven Development Workflow

This project uses the **DevX SDD workflow**. All feature specifications have already been generated and are located in the specs/ directory.

## Critical Rules

- **DO NOT** offer to create new specs using Kiro's built-in spec workflow
- **DO NOT** treat the existing specs.md, requirements.md, tdd-tests.md, or prompt.md files as "old format" — they are the authoritative source of truth
- **DO NOT** suggest migrating specs to Kiro's native format
- The specs/<feature-slug>/ folders are the correct and current spec format for this project
- Your job is to **implement** what is already specified, not to re-specify it

## How to Work With This Project

1. Read specs/.devx/features.json to see all features and their status
2. Pick a feature with status "not-started"
3. Open specs/<slug>/specs.md — this is the full specification
4. Open specs/<slug>/requirements.md — this is the acceptance criteria checklist
5. Implement one requirement at a time following the spec exactly
6. Validate against requirements.md before marking complete

When a user asks "how do I start" or "implement a feature" — guide them through the above steps using the existing specs, not Kiro's native spec creation flow.

KIRO_EOF
  echo "$COMBINED_CONTEXT" >> "$KIRO_FILE"
  echo "✅ Created .kiro/steering/devx-context.md"
else
  echo "⏭️  .kiro/steering/devx-context.md already exists — skipping"
fi

# ── MCP Server Setup ──
echo ""
echo "📡 Setting up MCP server..."
MCP_DIR="$DEVX_DIR/mcp"
if [ -d "$MCP_DIR" ] && [ -f "$MCP_DIR/package.json" ]; then
  cd "$MCP_DIR" && npm install --silent 2>/dev/null
  echo "✅ MCP server dependencies installed"

  MCP_SERVER_PATH="specs/.devx/mcp/server.js"

  # Claude Code MCP config (.claude/settings.json)
  CLAUDE_SETTINGS_DIR="$REPO_ROOT/.claude"
  CLAUDE_SETTINGS_FILE="$CLAUDE_SETTINGS_DIR/settings.json"
  mkdir -p "$CLAUDE_SETTINGS_DIR"
  if [ ! -f "$CLAUDE_SETTINGS_FILE" ]; then
    cat > "$CLAUDE_SETTINGS_FILE" << SETTINGS_EOF
{
  "mcpServers": {
    "devx-specs": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"],
      "cwd": "."
    }
  }
}
SETTINGS_EOF
    echo "✅ Created .claude/settings.json with MCP config"
  else
    echo "⏭️  .claude/settings.json already exists — add MCP config manually if needed"
  fi

  # Cursor MCP config (.cursor/mcp.json)
  CURSOR_MCP_DIR="$REPO_ROOT/.cursor"
  CURSOR_MCP_FILE="$CURSOR_MCP_DIR/mcp.json"
  mkdir -p "$CURSOR_MCP_DIR"
  if [ ! -f "$CURSOR_MCP_FILE" ]; then
    cat > "$CURSOR_MCP_FILE" << CURSOR_EOF
{
  "mcpServers": {
    "devx-specs": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"]
    }
  }
}
CURSOR_EOF
    echo "✅ Created .cursor/mcp.json"
  else
    echo "⏭️  .cursor/mcp.json already exists — add MCP config manually if needed"
  fi

  # VS Code MCP config (.vscode/settings.json)
  VSCODE_DIR="$REPO_ROOT/.vscode"
  VSCODE_FILE="$VSCODE_DIR/settings.json"
  mkdir -p "$VSCODE_DIR"
  if [ ! -f "$VSCODE_FILE" ]; then
    cat > "$VSCODE_FILE" << VSCODE_EOF
{
  "mcp": {
    "servers": {
      "devx-specs": {
        "command": "node",
        "args": ["$MCP_SERVER_PATH"]
      }
    }
  }
}
VSCODE_EOF
    echo "✅ Created .vscode/settings.json with MCP config"
  else
    echo "⏭️  .vscode/settings.json already exists — add MCP config manually if needed"
  fi

  # Kiro MCP config (.kiro/settings/mcp.json)
  KIRO_SETTINGS_DIR="$REPO_ROOT/.kiro/settings"
  KIRO_MCP_FILE="$KIRO_SETTINGS_DIR/mcp.json"
  mkdir -p "$KIRO_SETTINGS_DIR"
  if [ ! -f "$KIRO_MCP_FILE" ]; then
    cat > "$KIRO_MCP_FILE" << KIRO_MCP_EOF
{
  "mcpServers": {
    "devx-specs": {
      "command": "node",
      "args": ["$MCP_SERVER_PATH"]
    }
  }
}
KIRO_MCP_EOF
    echo "✅ Created .kiro/settings/mcp.json with MCP config"
  else
    echo "⏭️  .kiro/settings/mcp.json already exists — add MCP config manually if needed"
  fi
else
  echo "⚠️  MCP server not found at $MCP_DIR — skipping"
fi

# ── Claude Code Skills ──
echo ""
echo "🧠 Setting up Claude Code skills..."
SKILLS_SRC="$DEVX_DIR/skills"
SKILLS_DST="$REPO_ROOT/.claude/skills"
if [ -d "$SKILLS_SRC" ]; then
  mkdir -p "$SKILLS_DST"
  # Copy skill folders (each contains SKILL.md)
  for skill_dir in "$SKILLS_SRC"/*/; do
    if [ -d "$skill_dir" ]; then
      skill_name=$(basename "$skill_dir")
      mkdir -p "$SKILLS_DST/$skill_name"
      cp "$skill_dir"SKILL.md "$SKILLS_DST/$skill_name/" 2>/dev/null || true
    fi
  done
  echo "✅ Copied skills to .claude/skills/"
else
  echo "⚠️  Skills directory not found at $SKILLS_SRC — skipping"
fi

echo ""
echo "🎉 Done! Your AI tools are configured."
echo ""
echo "Next steps:"
echo "  1. Open specs/.devx/features.json to see all features"
echo "  2. Pick a feature folder under specs/"
echo "  3. Open prompt.md and paste it into your AI assistant"
echo "  4. Start implementing!"
echo ""
echo "MCP Server:"
echo "  The DevX MCP server is configured for Claude Code, Cursor, VS Code, and Kiro."
echo "  It provides tools like list_features, get_feature_specs, get_next_feature, etc."
echo ""
echo "Claude Code Skills:"
echo "  Use /implement, /validate, /next, and /tdd-cycle commands in Claude Code."
