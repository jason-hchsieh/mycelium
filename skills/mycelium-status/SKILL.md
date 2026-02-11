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
   - Read `.mycelium/state.json`
   - Read `plans[]` registry from session state
   - Read the active plan file (from `current_track.plan_file`) to get task breakdown
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

   Plans: {total} total ({active} active, {paused} paused, {completed} completed)
     Active: {track_id} ({completed}/{total} tasks)
     {other plans listed with status if any}

   Active Plan Tasks:
   - ✅ Completed: {count} ({percentage}%)
   - 🔄 In Progress: {count}
   - ⏳ Pending: {count}
   - 🚫 Blocked: {count}

   Task Summary (from active plan file):
   - [x] 1.1: {task title}
   - [~] 1.2: {task title} (in progress)
   - [ ] 1.3: {task title}
   - ...

   Available Skills: {count} skills discovered
   Available Agents: {count} agents discovered
   Available MCP Tools: {count} MCP tools discovered

   Recent Activity:
   - {recent commits}

   Next Action: {suggested_command}
   ```

   Read `plans[]` from `state.json` for the plan summary. If `plans[]` is missing, fall back to listing `.mycelium/plans/*.md` files.

4. **Suggest next action** based on state:
   - No plan → `/mycelium-plan`
   - Plan exists, tasks pending → `/mycelium-work`
   - All tasks complete → `/mycelium-review`
   - Review complete → `/mycelium-capture`
   - Blockers detected → Address blockers or use `/mycelium-continue`

5. **Verbose mode** (`--verbose`):
   - **Full plan list** with status, track_id, creation date, and task progress (from `plans[]`)
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
