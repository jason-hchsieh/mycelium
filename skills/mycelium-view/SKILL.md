---
name: mycelium-view
description: Previews complete workflow plan without execution (dry-run mode). Use when user says "show me the plan", "what would this look like", "preview [task]", "dry run", or wants to see task breakdown before committing. Supports --verbose to display workflow diagram. No implementation, tests, or reviews executed.
license: MIT
version: 0.9.0
argument-hint: "[task description] | [track_id] [--verbose]"
allowed-tools: ["Skill", "Read", "Write", "Bash", "Glob", "Grep"]
metadata:
  author: Jason Hsieh
  category: planning
  tags: [preview, dry-run, planning]
  documentation: https://github.com/jason-hchsieh/mycelium
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
   - `--verbose`: Show extended details with workflow diagram (optional)
   - To distinguish: if the argument (after removing `--verbose` flag) matches a `track_id` in `session_state.plans[]` or a plan file in `.mycelium/plans/`, treat it as an existing plan view. Otherwise, treat it as a new task description.
   - Extract `--verbose` flag if present and set `verbose_mode` boolean

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

2. **Execute planning workflow** (see mycelium-plan)

3. **Generate plan** - Follow the planning workflow:
   - Clarify requirements if ambiguous
   - Discover available capabilities
   - Create detailed task breakdown
   - Define test strategy
   - Identify dependencies

4. **Display preview** - Show the complete plan. Format depends on `verbose_mode`:

   **Brief mode (default):**
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

   ### Test Strategy
   [TDD approach for each phase]

   ### Git Strategy
   - Branch: feature/[name]
   - Worktrees: [if multiple features]
   ```

   **Verbose mode (`--verbose` flag):**
   ```markdown
   ## Workflow Preview: [Feature Name]

   ### Overview
   [Brief description of what would be built]

   ### Success Criteria
   [Measurable outcomes that define "done"]

   ### Workflow Diagram
   [ASCII art diagram showing phase flow and task dependencies - see below]

   ### Phases & Tasks

   #### Phase 1: [Phase Name]

   ##### Task 1.1: [Task title]
   - **Complexity:** S (50-200 lines, 1-2 files, 30-120 min)
   - **Agent:** general-purpose
   - **Skills:** tdd, verification
   - **Model:** sonnet
   - **Blocked by:** None (or task IDs)
   - **Blocks:** [1.2, 2.1] (or "None")

   **Description:**
   [Full task description from plan]

   **Acceptance Criteria:**
   - [ ] Criterion 1
   - [ ] Criterion 2

   **Test Plan:**
   [How to verify this works]

   ---

   ##### Task 1.2: [Task title]
   [Same detailed format...]

   #### Phase 2: [Phase Name]
   [Same detailed format for all tasks...]

   ### Parallel Execution Plan
   [Show which tasks can run in parallel]

   ### Estimated Timeline
   - Total tasks: X
   - Parallel-capable: Y
   - Sequential-only: Z

   ### Test Strategy
   [TDD approach for each phase]

   ### Git Strategy
   - Branch: feature/[name]
   - Worktrees: [if multiple features]
   ```

5. **Generate workflow diagram** (if `verbose_mode` is true):

   Create ASCII art diagram showing:
   - **Phase flow:** Plan → Work → Review → Capture (horizontal boxes with arrows)
   - **Task layout:** Tasks grouped by phase, with dependencies shown vertically
   - **Parallel execution:** Tasks at same vertical level = can run in parallel
   - **Status indicators:** [ ] pending, [~] in progress, [✓] completed

   **Example diagram:**
   ```
   Workflow Diagram:

   ┌─────────────────────────────────────────────────────────────────────┐
   │                         MYCELIUM WORKFLOW                            │
   └─────────────────────────────────────────────────────────────────────┘

     ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
     │   PLAN   │─────▶│   WORK   │─────▶│  REVIEW  │─────▶│ CAPTURE  │
     └──────────┘      └──────────┘      └──────────┘      └──────────┘
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼

     Phase 1            Phase 2            Phase 3            Phase 4
     ───────            ───────            ───────            ───────

     [ ] 1.1            [ ] 2.1            [ ] 3.1            [ ] 4.1
      │                  ┌┴─┐               │                  │
      ▼                  ▼  ▼               ▼                  ▼
     [ ] 1.2       [ ] 2.2  2.3          [ ] 3.2            [ ] 4.2
      │                  └┬─┘
      ▼                   ▼
     [ ] 1.3            [ ] 2.4

     Legend:
     ─────▶  Sequential flow (phase to phase)
     │ ▼     Dependency (task to task)
     ┌──┐    Parallel tasks (same vertical level)
     [ ]     Pending task
     [~]     In progress
     [✓]     Completed
   ```

   **Diagram generation algorithm:**
   1. Parse plan to extract tasks, statuses, and `blockedBy` dependencies
   2. Group tasks by phase (based on task ID prefix: 1.x → Phase 1, 2.x → Phase 2, etc.)
   3. Within each phase, calculate vertical levels:
      - Level 0: Tasks with `blockedBy: []` (no dependencies, can start immediately)
      - Level N: Tasks blocked only by tasks at level N-1
      - Tasks at same level can execute in parallel
   4. Render using box-drawing characters: `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ▶ ▼`
   5. Use task status from plan frontmatter if viewing existing plan, or `[ ]` for new previews

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

# Preview with extended details and workflow diagram
/mycelium-view "Add user authentication with JWT" --verbose
/mycelium-view --verbose auth_20260211

# Preview a bug fix workflow
/mycelium-view "Fix memory leak in session handler"

# Preview a refactoring workflow (verbose mode)
/mycelium-view --verbose "Refactor API layer to use repository pattern"
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
- **Verbose mode** - Use `--verbose` flag for extended details, workflow diagram, and full task specifications
- **Diagram compatibility** - ASCII art diagram uses standard box-drawing characters compatible with all terminals

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
1. **Terminal display** - Formatted markdown preview (brief or verbose depending on `--verbose` flag)
2. **File output** - `.mycelium/plans/preview-YYYY-MM-DD-{track-id}.md`
3. **Workflow diagram** - ASCII art visualization (only in `--verbose` mode)
4. **Next steps** - Clear instructions on how to proceed

## Skills Used

- **mycelium-plan**: Requirements gathering and task decomposition (same workflow, preview mode)

## Notes

- Preview plans are saved separately from execution plans
- The preview doesn't consume git commits or create branches
- Safe to use in dirty working directories
- Can be used as documentation for stakeholders

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
