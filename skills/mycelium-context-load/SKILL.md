---
name: mycelium-context-load
description: Loads project context, institutional knowledge, and discovers all available capabilities (skills, agents, MCPs). Use when user says "load context", "discover capabilities", "what skills are available", or at the start of any workflow. Caches discovered capabilities in state.json for use by planning phase.
license: MIT
version: 0.9.0
allowed-tools: ["Read", "Glob", "Grep"]
metadata:
  author: Jason Hsieh
  category: context
  tags: [context-loading, capability-discovery, knowledge-base, phase-0]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Context Loading

Load all project context, institutional knowledge, and discover available capabilities.

## Core Principle

**Context is the foundation. Load it once, use it everywhere.**

This skill implements Phase 0 of the mycelium workflow, ensuring all subsequent phases have access to:
- Project information (product, tech stack, workflow)
- Institutional knowledge (solutions, learnings, patterns)
- Available capabilities (skills, agents, MCP tools)

## Your Task

1. **Update session state** - Write `invocation_mode: "single"` to [state.json][session-state-schema]

2. **Load project context:**
   ```bash
   # Core context files
   - Read `.mycelium/context/product.md` (if exists)
   - Read `.mycelium/context/tech-stack.md` (if exists)
   - Read `.mycelium/context/workflow.md` (if exists)
   - Read `CLAUDE.md` (if exists)
   ```

3. **Load institutional knowledge:**
   ```bash
   # Solutions library
   - Glob `.mycelium/solutions/**/*.md`
   - Read `.mycelium/solutions/patterns/critical-patterns.md` (if exists)

   # Learned knowledge
   - Glob `.mycelium/learned/**/*.md`
   - Read `.mycelium/learned/preferences.yaml` (if exists)
   ```

4. **Discover capabilities** following the process below:
   - Scan plugin cache for installed plugins
   - Discover skills from each plugin
   - Discover agents from each plugin
   - Add built-in agents (not in cache)
   - Check for MCP tools (not in cache)
   - Cache all in state.json

5. **Hand off to next phase:**
   - Update `current_phase: "clarify_request"` in state.json
   - If `invocation_mode == "full"`: Invoke `mycelium-clarify`
   - If `invocation_mode == "single"`: Suggest `/mycelium-clarify`

---

## Step 1: Load Project Context

### Core Context Files

**Read these files if they exist:**

1. **`.mycelium/context/product.md`**
   - Product name and description
   - Problem statement
   - Target users
   - Goals and success criteria

2. **`.mycelium/context/tech-stack.md`**
   - Primary languages
   - Frameworks and libraries
   - Database information
   - Infrastructure/deployment

3. **`.mycelium/context/workflow.md`**
   - TDD strictness policy
   - Commit message style
   - Code review requirements
   - Coverage targets

4. **`CLAUDE.md`**
   - Quick project overview
   - Key conventions
   - Common commands

**Storage:**
Store summarized context in state.json for quick access:

```json
{
  "project_context": {
    "name": "MyProject",
    "stack": ["TypeScript", "React", "PostgreSQL"],
    "tdd_policy": "strict",
    "coverage_target": "80%"
  }
}
```

---

## Step 2: Load Institutional Knowledge

### Solutions Library

**Scan for existing solutions:**

```bash
# Find all solution files
glob ".mycelium/solutions/**/*.md"

# Count by category
- performance-issues/
- database-issues/
- security-issues/
- ui-bugs/
- integration-issues/
- patterns/
```

**Extract patterns:**
```bash
# Read critical patterns
cat .mycelium/solutions/patterns/critical-patterns.md

# Store pattern names in state
patterns: ["jwt-auth", "n+1-query-fix", "rate-limiting"]
```

### Learned Knowledge

**Scan for captured learnings:**

```bash
# Find all learned files
glob ".mycelium/learned/**/*.md"

# Categories
- decisions/      (architectural decisions)
- conventions/    (code conventions)
- anti-patterns/  (what NOT to do)
- effective-prompts/ (prompts that worked)
```

**Load preferences:**
```bash
# User preferences
cat .mycelium/learned/preferences.yaml

# Store in state
user_preferences: {
  "test_framework": "vitest",
  "commit_style": "conventional",
  "auto_fix_lint": true
}
```

---

## Step 3: Discover Capabilities

### Scan Plugin Cache

**Read installed plugins:**

```bash
# Read plugin registry
cat ~/.claude/plugins/installed_plugins.json

# Example output:
{
  "mycelium@jasonhch-plugins": [
    "/home/user/.claude/plugins/cache/jasonhch-plugins/mycelium/0.9.0",
    { "version": "0.9.0" }
  ],
  "git@jasonhch-plugins": [
    "/home/user/.claude/plugins/cache/jasonhch-plugins/git/1.1.0",
    { "version": "1.1.0" }
  ]
}
```

**For each plugin:**
1. Extract `pluginName` = part before `@` (e.g., `mycelium`)
2. Extract `installPath` from array first element

### Discover Skills

**Scan for skill files:**

```bash
# For each plugin installPath
glob "{installPath}/skills/*/SKILL.md"

# Example: /home/user/.claude/plugins/cache/jasonhch-plugins/mycelium/0.9.0/skills/*/SKILL.md
```

**Extract skill metadata:**

For each SKILL.md found:
1. Read YAML frontmatter
2. Extract `name` and `description`
3. Fully-qualify as `{pluginName}:{name}`

**Example:**
```yaml
# From mycelium plugin, mycelium-plan skill
name: mycelium-plan
description: Creates structured implementation plans...

# Stored as:
{
  "name": "mycelium:mycelium-plan",
  "description": "Creates structured implementation plans...",
  "source": "plugin",
  "plugin": "mycelium"
}
```

### Discover Plugin Agents

**Scan for agent files:**

```bash
# For each plugin installPath
glob "{installPath}/agents/**/*.md"

# Example: /home/user/.claude/plugins/cache/jasonhch-plugins/mycelium/0.9.0/agents/learning-agent/agent.md
```

**Extract agent metadata:**

For each agent.md found:
1. Read YAML frontmatter
2. Extract `name` and `description`
3. Fully-qualify as `{pluginName}:{name}`

**Example:**
```yaml
# From mycelium plugin, learning-agent
name: learning-agent
description: Specialized agent for pattern extraction...

# Stored as:
{
  "name": "mycelium:learning-agent",
  "description": "Specialized agent for pattern extraction...",
  "source": "plugin",
  "plugin": "mycelium"
}
```

### Add Built-in Agents

These agents are NOT in the plugin cache. Extract from Task tool description:

**Built-in agents:**
- `Bash` - Command execution specialist
- `general-purpose` - General-purpose agent
- `Explore` - Fast codebase exploration
- `Plan` - Software architect agent
- `claude-code-guide` - Claude Code documentation guide
- `statusline-setup` - Status line configuration

**Store as:**
```json
{
  "name": "general-purpose",
  "description": "General-purpose agent for researching complex questions...",
  "source": "built-in"
}
```

### Check for MCP Tools

MCP (Model Context Protocol) tools are NOT in the plugin cache. Scan system prompt:

**Detection:**
```bash
# Check if system prompt mentions MCP server tools
# Look for patterns like:
# - "MCP server"
# - "External tool provided by..."
# - Tool names with server attribution
```

**Store as:**
```json
{
  "name": "tool-name",
  "server": "mcp-server-name",
  "description": "Tool description...",
  "source": "mcp"
}
```

---

## Step 4: Cache Discovered Capabilities

**Update state.json:**

```json
{
  "discovered_capabilities": {
    "skills": [
      {
        "name": "mycelium:mycelium-plan",
        "description": "Creates structured implementation plans with TDD task breakdown...",
        "source": "plugin",
        "plugin": "mycelium"
      },
      {
        "name": "git:commit-and-push",
        "description": "Commit and push changes with platform detection...",
        "source": "plugin",
        "plugin": "git"
      }
    ],
    "agents": [
      {
        "name": "general-purpose",
        "description": "General-purpose agent for researching complex questions...",
        "source": "built-in"
      },
      {
        "name": "mycelium:learning-agent",
        "description": "Specialized agent for pattern extraction...",
        "source": "plugin",
        "plugin": "mycelium"
      }
    ],
    "mcp_tools": [
      {
        "name": "example-tool",
        "server": "example-server",
        "description": "Example MCP tool...",
        "source": "mcp"
      }
    ]
  },
  "patterns": ["jwt-auth", "n+1-query-fix", "rate-limiting"],
  "user_preferences": {
    "test_framework": "vitest",
    "commit_style": "conventional"
  }
}
```

**Benefits:**
- **Phase 1 (Clarify):** Can reference available capabilities when asking questions
- **Phase 2 (Planning):** Can assign capabilities to tasks with validation
- **All phases:** Avoid re-scanning filesystem repeatedly

---

## Step 5: Phase Handoff

**Update state:**

```json
{
  "current_phase": "clarify_request",
  "checkpoints": {
    "context_loading_complete": "2026-02-13T10:00:00Z"
  }
}
```

**Chain or suggest:**

```javascript
if (invocation_mode == "full") {
  // Full workflow mode - automatically chain to next phase
  invoke("mycelium-clarify")
} else {
  // Single phase mode - suggest next step
  output("✅ Context loaded. Continue with: /mycelium-clarify")
}
```

---

## Output Summary

**Show what was loaded:**

```
✅ Context Loading Complete

Project Context:
  • Name: MyProject
  • Stack: TypeScript, React, PostgreSQL
  • TDD: strict (80% coverage required)

Institutional Knowledge:
  • 15 solutions in library
  • 3 critical patterns
  • 8 learned conventions

Discovered Capabilities:
  • 13 skills (8 from mycelium, 3 from git, 2 from other)
  • 7 agents (6 built-in, 1 plugin)
  • 2 MCP tools

Cached in state.json for use by subsequent phases.

Next: /mycelium-clarify
```

---

## Error Handling

**Missing context files:**
- If `.mycelium/context/` doesn't exist: WARN but continue
- If no context files found: WARN but continue
- Context is optional - can work without it

**Plugin cache not found:**
- If `~/.claude/plugins/installed_plugins.json` not found: ERROR
- This is required - cannot discover capabilities without it
- Suggest: "Plugin system not initialized. Contact support."

**No capabilities discovered:**
- If no skills/agents found: ERROR
- This indicates a broken installation
- Suggest: "No capabilities found. Plugin installation may be corrupted."

---

## Quick Example

```bash
/mycelium-context-load  # Load context and discover capabilities
```

## Important Notes

- **Run this first** - All other phases depend on cached capabilities
- **Fast operation** - Mostly file reads, minimal processing
- **Idempotent** - Safe to run multiple times (refreshes cache)
- **No user interaction** - Fully automated
- **Required for assignment** - Phase 2 (Planning) needs cached capabilities to assign tasks

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [Product context template][product-template]
- [Tech stack template][tech-stack-template]
- [Workflow template][workflow-template]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
[product-template]: ../../templates/project/product.md.template
[tech-stack-template]: ../../templates/project/tech-stack.md.template
[workflow-template]: ../../templates/project/workflow.md.template
