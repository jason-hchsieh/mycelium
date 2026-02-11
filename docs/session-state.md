# Session State (`session_state.json`)

The session state file at `.mycelium/state/session_state.json` tracks all workflow progress, plans, and capabilities for the current session.

## Schema

See [session-state.schema.json][schema] for the full JSON schema.

## Key Fields

### `status`
Current session status: `active`, `paused`, `completed`, `failed`.

### `current_phase`
Which workflow phase is active: `-1` (bootstrap), `0` (context), `1` (clarify), `2` (discover), `3` (plan), `4` (implement), `5` (review), `6` (learn).

### `current_track`
The active plan being worked on:
```json
{
  "id": "auth_20260211",
  "type": "feature",
  "plan_file": "2026-02-11-auth_20260211.md"
}
```

### `invocation_mode`
How the workflow was started. Used by `/mycelium-continue` to determine scope:
- `"full"` - Started via `/mycelium-go` (continue runs all remaining phases)
- `"single"` - Started via `/mycelium-plan`, `/mycelium-work`, etc. (continue finishes current phase only)

### `plans[]`
Registry of all created plans:
```json
{
  "track_id": "auth_20260211",
  "plan_file": "2026-02-11-auth_20260211.md",
  "status": "in_progress",
  "created": "2026-02-11T10:00:00Z",
  "total_tasks": 8,
  "completed_tasks": 3
}
```

Status values: `in_progress`, `paused`, `completed`, `preview`, `failed`.
Only one plan can be `in_progress` at a time. Creating a new plan auto-pauses the active one.

### `checkpoints`
Array of phase completion markers for resume support:
```json
[
  { "phase": 3, "sha": "abc1234", "timestamp": "2026-02-11T10:15:00Z", "description": "Planning complete" }
]
```

### `discovered_capabilities`
Cached plugin/agent/skill discovery results. Updated on session start. Contains:
- `agents[]` - Built-in + plugin agents
- `skills[]` - Plugin skills
- `mcp_servers[]` - MCP tool servers
- `plugins[]` - All discovered plugins by scope

### `metrics`
Workflow effectiveness tracking: tasks completed/failed/skipped, context resets, human interventions, rework count, pattern matches.

## Minimal Bootstrap

When no session state exists, `/mycelium-plan` initializes with:
```json
{
  "status": "active",
  "started_at": "{ISO timestamp}",
  "last_updated": "{ISO timestamp}",
  "plans": []
}
```

## Related

- [Session state schema][schema] - Full JSON schema validation
- [`.mycelium/` directory][mycelium-dir] - Directory structure overview
- [Plan frontmatter schema][plan-schema] - Schema for plan file YAML

[schema]: ../schemas/session-state.schema.json
[mycelium-dir]: ./mycelium-directory.md
[plan-schema]: ../schemas/plan-frontmatter.schema.json
