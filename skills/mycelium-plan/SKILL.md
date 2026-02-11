---
name: mycelium-plan
description: Create implementation plan with task breakdown
argument-hint: "[task description] | --list | --switch <track_id>"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Glob", "Grep", "AskUserQuestion"]
---

# Workflow Plan

Transform user request into structured, executable plan with TDD task breakdown. Also supports listing and switching between multiple plans.

## Your Task

### Route by argument

**If `--list`**: Jump to [List Plans](#list-plans).
**If `--switch <track_id>`**: Jump to [Switch Plan](#switch-plan).
**Otherwise**: Continue with [Create Plan](#create-plan).

---

### Create Plan

1. **Ensure `.mycelium/` exists** - If the [`.mycelium/` directory][mycelium-dir] does not exist, create the minimum bootstrap structure:
   ```
   .mycelium/
   ├── plans/
   └── state/
       └── session_state.json
   ```
   Initialize `session_state.json` per the [session state docs][session-state-docs]. Also add `.mycelium/` to `.gitignore` if not already present.

2. **Update session state** - Write `invocation_mode: "single"` to [session_state.json][session-state-docs]

3. **Parse input**:
   - If user provided task description: Use it
   - If empty: Ask user for task description

4. **Provide context**:
   - Read [session_state.json][session-state-docs]
   - Read `.mycelium/context/*.md` if exists (product, tech-stack, workflow)
   - Read `CLAUDE.md` if exists

5. **Analyze the task**:
   - Clarify requirements if ambiguous (use AskUserQuestion)
   - Search codebase for relevant files (`grep`, `glob`)
   - Break down into tasks with dependencies

6. **Save plan** to `.mycelium/plans/YYYY-MM-DD-{track-id}.md` using the [plan template][plan-template]. The frontmatter must conform to the [plan frontmatter schema][plan-schema].

7. **Register plan in session state**:
   - Read `session_state.json`
   - If a plan in `plans[]` has `status: "in_progress"`, set it to `"paused"` (both in `plans[]` AND in that plan file's YAML frontmatter `status` field)
   - Append new plan entry to `plans[]`:
     ```json
     {
       "track_id": "{track_id}",
       "plan_file": "YYYY-MM-DD-{track-id}.md",
       "status": "in_progress",
       "created": "{timestamp}",
       "total_tasks": {count},
       "completed_tasks": 0
     }
     ```
   - Set `current_track` to the new plan's `{ "id": "{track_id}", "type": "{type}", "plan_file": "..." }`

8. **Next step**: Suggest `/mycelium-work` to execute the plan

---

### List Plans

Display all plans from `session_state.plans[]` (fall back to globbing `.mycelium/plans/*.md` and reading frontmatter if `plans[]` is missing or empty).

**Output format:**
```
Plans:
 * multi-plan_20260211  in_progress  2/7 tasks  (active)
   auth_20260210        paused       0/5 tasks
   bugfix_20260209      completed    3/3 tasks
```

- `*` marks the active plan (matches `current_track.id`)
- Exclude `preview-` prefixed files unless `--all` is passed
- Sort by `created` descending (newest first)

---

### Switch Plan

Switch the active plan to `<track_id>`:

1. Read `session_state.json`
2. Find `<track_id>` in `plans[]`. If not found, check `.mycelium/plans/` for a matching file and register it first. If still not found, error: "Plan `<track_id>` not found."
3. Set the current active plan (the one with `status: "in_progress"`) to `"paused"` in both `plans[]` and its plan file frontmatter
4. Set the target plan to `"in_progress"` in both `plans[]` and its plan file frontmatter
5. Update `current_track` to point to the target plan
6. Show confirmation: "Switched to plan `<track_id>`"
7. Suggest `/mycelium-work` or `/mycelium-continue` to resume

---

## Quick Example

```bash
# Create a new plan
/mycelium-plan "Add user authentication"

# List all plans
/mycelium-plan --list

# Switch to a different plan
/mycelium-plan --switch auth_20260210

# Create another plan (previous one auto-pauses)
/mycelium-plan "Optimize database queries"
```

## Important

- Plans are LIVING DOCUMENTS - updated in-place during execution
- All tasks follow TDD: tests before implementation
- Tasks have explicit dependencies (blockedBy/blocks)
- Default to parallel execution - minimize dependencies
- **Creating a new plan auto-pauses the previous active plan** - no plans are lost
- **Backward compatible** - works when `plans[]` doesn't exist (falls back to globbing `.mycelium/plans/`)

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [Plan template][plan-template]
- [Plan frontmatter schema][plan-schema]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
[plan-template]: ../../templates/plans/plan.md.template
[plan-schema]: ../../schemas/plan-frontmatter.schema.json
