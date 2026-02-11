---
name: mycelium-status
description: Display current workflow progress and state
argument-hint: "[--verbose]"
allowed-tools: ["Read", "Bash", "Glob"]
---

# Workflow Status

Display current workflow state and progress dashboard.

## Your Task

1. **Load current state**:
   - Read `.workflow/state/session_state.json`
   - Read active plan from `.workflow/plans/`
   - Get git status and recent commits

2. **Discover capabilities** (scan plugin cache filesystem - do NOT hardcode or guess):

   **Skills & Agents from plugins** - Read `~/.claude/plugins/installed_plugins.json`. For each plugin:
   - `pluginName` = part before `@` in key (e.g., `mycelium` from `mycelium@jasonhch-plugins`)
   - `installPath` = first array element's `installPath`
   - Skills: glob `{installPath}/skills/*/SKILL.md`, read YAML frontmatter for `name`/`description`. Fully-qualified: `{pluginName}:{name}`
   - Agents: glob `{installPath}/agents/**/*.md`, read YAML frontmatter for `name`/`description`. Fully-qualified: `{pluginName}:{name}`

   **Built-in agents** (NOT in plugin cache) - Read Task tool description for: Bash, general-purpose, Explore, Plan, claude-code-guide, statusline-setup.

   **MCP Tools** (NOT in plugin cache) - Check system prompt for any MCP server tools.

3. **Display dashboard**:
   ```
   📊 Mycelium Status

   Current Track: {track_id}
   Phase: {current_phase}

   Tasks:
   - ✅ Completed: {count} ({percentage}%)
   - 🔄 In Progress: {count}
   - ⏳ Pending: {count}
   - 🚫 Blocked: {count}

   Available Skills: {count} skills discovered
   Available Agents: {count} agents discovered
   Available MCP Tools: {count} MCP tools discovered

   Recent Activity:
   - {recent commits}

   Next Action: {suggested_command}
   ```

4. **Suggest next action** based on state:
   - No plan → `/mycelium-plan`
   - Plan exists, tasks pending → `/mycelium-work`
   - All tasks complete → `/mycelium-review`
   - Review complete → `/mycelium-capture`
   - Blockers detected → Address blockers or use `/mycelium-continue`

5. **Verbose mode** (`--verbose`):
   - Detailed task breakdown by phase
   - Full list of discovered skills with descriptions
   - Full list of discovered agents with capabilities
   - Full list of discovered MCP tools with descriptions
   - Git status and stashes
   - Test coverage metrics
   - Context usage estimate
   - Recent solutions captured

## Quick Example

```bash
/mycelium-status       # Standard view
/mycelium-status -v    # Verbose view with details
```

## Important

- **Read-only operation** - Does not modify any state
- **Fast execution** - Should complete in <2 seconds
- **Actionable** - Always shows clear next steps
- **Visual** - Uses box drawing and symbols for clarity
