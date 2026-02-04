---
name: workflow:work
description: Execute implementation tasks with TDD enforcement
argument-hint: "[task_id or 'all']"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep", "Task"]
---

# Workflow Work

Execute implementation tasks following strict TDD methodology.

## Your Task

1. **Load execution skills**:
   - Use Skill tool to load `workflow/tdd` (mandatory)
   - Use Skill tool to load `workflow/verification` (mandatory)

2. **Parse arguments**:
   - `task_id`: Specific task (e.g., "1.1")
   - `all`: Execute all unblocked tasks (parallel)
   - Default: Next available task

3. **Load active plan**:
   - Find latest plan in `.workflow/plans/`
   - Read `session_state.json` for progress

4. **Execute tasks** - Follow TDD and verification skills which handle:
   - **TDD cycle**: RED → GREEN → REFACTOR (mandatory)
   - **Evidence-based verification**: Show actual test output
   - **Incremental commits**: After each task completion
   - **Plan marker updates**: `[ ]` → `[~]` → `[x]`
   - **Parallel execution**: Worktrees for independent tasks (automatic)
   - **Solution capture**: For novel problems (as needed)

5. **After completion**: Suggest `/workflow:review` for code review

## Skills Used

- **tdd**: Iron Law TDD - tests first, always (MANDATORY)
- **verification**: Evidence-based validation (MANDATORY)
- **solution-capture**: Capture learnings from novel problems (as needed)

## Quick Example

```bash
/workflow:work          # Execute next task
/workflow:work 1.1      # Execute specific task
/workflow:work all      # Execute all tasks (parallel)
```

## Critical Rules

- **NO CODE WITHOUT TESTS FIRST** - TDD is non-negotiable
- **SHOW EVIDENCE** - All verification requires actual test output
- **UPDATE MARKERS** - Plans updated in real-time during execution
- **SAVE STATE** - Frequent saves enable resume on interruption

## Parallel Execution

When executing "all" tasks:
- Independent tasks (blockedBy: []) run in parallel
- Each task gets its own worktree
- Automatic merge on completion
- Full test suite runs after merge
