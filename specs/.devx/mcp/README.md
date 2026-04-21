# DevX MCP Server

A lightweight MCP (Model Context Protocol) server that exposes your project specs to AI tools.

## Setup

\`\`\`bash
# Install dependencies
cd specs/.devx/mcp
npm install

# Or run the init script which does this automatically
bash specs/.devx/init.sh
\`\`\`

## Usage

The server runs over stdio and is designed to be configured in your AI tool:

### Claude Code

Add to \`.claude/settings.json\`:
\`\`\`json
{
  "mcpServers": {
    "devx-specs": {
      "command": "node",
      "args": ["specs/.devx/mcp/server.js"]
    }
  }
}
\`\`\`

### Cursor

Add to \`.cursor/mcp.json\`:
\`\`\`json
{
  "mcpServers": {
    "devx-specs": {
      "command": "node",
      "args": ["specs/.devx/mcp/server.js"]
    }
  }
}
\`\`\`

### VS Code

Add to \`.vscode/settings.json\`:
\`\`\`json
{
  "mcp": {
    "servers": {
      "devx-specs": {
        "command": "node",
        "args": ["specs/.devx/mcp/server.js"]
      }
    }
  }
}
\`\`\`

### Kiro

Add to \`.kiro/settings/mcp.json\`:
\`\`\`json
{
  "mcpServers": {
    "devx-specs": {
      "command": "node",
      "args": ["specs/.devx/mcp/server.js"]
    }
  }
}
\`\`\`

> The \`init.sh\` script creates this file automatically. Kiro's steering context is also written to \`.kiro/steering/devx-context.md\`.

## Available Tools

| Tool | Description |
|------|-------------|
| \`list_features\` | List all features with status from features.json |
| \`get_feature_specs\` | Get specs.md content for a feature by slug or title |
| \`get_requirements\` | Get requirements.md checklist for a feature |
| \`get_tdd_tests\` | Get tdd-tests.md for a feature (if TDD enabled) |
| \`get_next_feature\` | Suggest next feature to implement (first "not-started") |
| \`validate_implementation\` | Return requirements checklist for validation |
| \`mark_feature_done\` | Update feature status in features.json to "done" |
| \`get_project_context\` | Return project.md + workflow.md content |
