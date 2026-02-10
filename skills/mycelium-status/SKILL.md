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

2. **Display dashboard**:
   ```
   📊 Mycelium Status

   Current Track: {track_id}
   Phase: {current_phase}

   Tasks:
   - ✅ Completed: {count} ({percentage}%)
   - 🔄 In Progress: {count}
   - ⏳ Pending: {count}
   - 🚫 Blocked: {count}

   Recent Activity:
   - {recent commits}

   Next Action: {suggested_command}
   ```

3. **Suggest next action** based on state:
   - No plan → `/mycelium-plan`
   - Plan exists, tasks pending → `/mycelium-work`
   - All tasks complete → `/mycelium-review`
   - Review complete → `/mycelium-capture`
   - Blockers detected → Address blockers or use `/mycelium-continue`

4. **Verbose mode** (`--verbose`):
   - Detailed task breakdown by phase
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
