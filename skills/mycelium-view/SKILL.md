---
name: mycelium-view
description: Preview workflow plan without execution (dry-run mode)
argument-hint: "[task description] | [track_id]"
allowed-tools: ["Skill", "Read", "Write", "Bash", "Glob", "Grep"]
---

# Mycelium View (Dry-Run Preview)

Preview the complete workflow plan that would be generated for a task without executing any implementation, tests, or reviews.

## Purpose

This skill provides a "dry-run" mode that:
- Shows exactly what work would be planned
- Displays the task breakdown and dependencies
- Estimates effort and complexity
- Identifies which agents/skills would be used
- **Does NOT execute** any implementation

## Your Task

1. **Parse arguments**:
   - `task description`: The feature/fix/optimization to preview (generates a new plan)
   - `track_id`: An existing plan's track ID to view (e.g., `auth_20260211`)
   - To distinguish: if the argument matches a `track_id` in `session_state.plans[]` or a plan file in `.mycelium/plans/`, treat it as an existing plan view. Otherwise, treat it as a new task description.

2. **Route by argument type**:

### View Existing Plan

If `track_id` was provided:

1. Find the plan file: check `session_state.plans[]` for the `plan_file`, or glob `.mycelium/plans/*{track_id}*.md`
2. Read the plan file and parse its frontmatter and content
3. Display the plan (same format as step 5 below, but from the existing file)
4. Show plan status from `plans[]` registry (in_progress, paused, completed, etc.)
5. Suggest next action based on status:
   - `paused` → `/mycelium-plan --switch {track_id}` to resume
   - `in_progress` → `/mycelium-work` to continue implementation
   - `completed` → `/mycelium-capture {track_id}` to capture learnings
   - `preview` → `/mycelium-go "{description}"` to execute

### Generate New Preview

If `task description` was provided:

1. **Update session state** - Write `invocation_mode: "view"` to `.mycelium/state.json`

2. **Load the planning skill** - Use Skill tool to load `planning`

3. **Generate plan** - Follow the planning workflow:
   - Clarify requirements if ambiguous
   - Discover available capabilities
   - Create detailed task breakdown
   - Define test strategy
   - Identify dependencies

4. **Display preview** - Show the complete plan with:
   ```markdown
   ## Workflow Preview: [Feature Name]

   ### Overview
   [Brief description of what would be built]

   ### Success Criteria
   [Measurable outcomes that define "done"]

   ### Phases & Tasks

   #### Phase 1: [Phase Name]
   - Task 1.1: [Task title] (Complexity: S/M/L, Agent: general-purpose)
   - Task 1.2: [Task title] (Complexity: S/M/L, Agent: bash)

   #### Phase 2: [Phase Name]
   - Task 2.1: [Task title] (blockedBy: [1.1], Complexity: M)

   ### Parallel Execution Plan
   [Show which tasks can run in parallel]

   ### Estimated Timeline
   - Total tasks: X
   - Parallel-capable: Y
   - Sequential-only: Z
   - Estimated duration: ~N minutes

   ### Test Strategy
   [TDD approach for each phase]

   ### Git Strategy
   - Branch: feature/[name]
   - Worktrees: [if multiple features]
   ```

6. **Save preview** - Write plan to `.mycelium/plans/preview-YYYY-MM-DD-{track-id}.md` with `status: preview` in frontmatter

7. **Prompt next action**:
   ```
   ✅ Workflow preview complete!

   To execute this plan:
   - Run full workflow: /mycelium-go "[task description]"
   - Run phases individually: /mycelium-plan, /mycelium-work, etc.

   To modify the plan:
   - Edit: .mycelium/plans/preview-[timestamp].md
   - Re-run: /mycelium-view "[modified description]"
   ```

## Quick Examples

```bash
# Preview a feature workflow (generates new plan)
/mycelium-view "Add user authentication with JWT"

# View an existing plan by track_id
/mycelium-view auth_20260211

# Preview a bug fix workflow
/mycelium-view "Fix memory leak in session handler"

# Preview a refactoring workflow
/mycelium-view "Refactor API layer to use repository pattern"
```

## Differences from /mycelium-go

| Feature | /mycelium-view | /mycelium-go |
|---------|----------------|--------------|
| Creates plan | ✓ | ✓ |
| Executes implementation | ✗ | ✓ |
| Runs tests | ✗ | ✓ |
| Runs review | ✗ | ✓ |
| Captures learnings | ✗ | ✓ |
| Makes code changes | ✗ | ✓ |
| Git commits | ✗ | ✓ |

## Use Cases

**Use /mycelium-view when:**
- Estimating effort before committing
- Understanding scope and complexity
- Getting approval for approach
- Learning about mycelium's planning process
- Checking if requirements are clear enough

**Use /mycelium-go when:**
- Ready to execute the full workflow
- Requirements are clear
- Want autonomous implementation

## Important

- **Read-only mode** - No code changes, commits, or state mutations (except state.json and preview plan file)
- **Clarification allowed** - Will ask questions if requirements are ambiguous
- **Fast execution** - Only planning phase runs (~30-60 seconds)
- **Repeatable** - Safe to run multiple times with different descriptions
- **Preview state** - Plans marked with `status: preview` won't interfere with active work

## Session State

The session state is updated to indicate view mode:

```json
{
  "invocation_mode": "view",
  "current_phase": "planning",
  "preview_mode": true,
  "last_preview": "YYYY-MM-DD-preview-{track-id}.md"
}
```

This prevents accidental execution if `/mycelium-continue` is called after a preview.

## Output Format

The skill outputs:
1. **Terminal display** - Formatted markdown preview
2. **File output** - `.mycelium/plans/preview-YYYY-MM-DD-{track-id}.md`
3. **Next steps** - Clear instructions on how to proceed

## Skills Used

- **planning**: Requirements gathering and task decomposition (same as /mycelium-plan)

## Notes

- Preview plans are saved separately from execution plans
- The preview doesn't consume git commits or create branches
- Safe to use in dirty working directories
- Can be used as documentation for stakeholders
