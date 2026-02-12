---
name: mycelium-work
description: Executes implementation tasks following strict TDD methodology with evidence-based verification. Use when user says "implement this", "work on [task]", "execute the plan", "build task [id]", or "run all tasks". Enforces RED→GREEN→REFACTOR cycle, shows actual test output, supports parallel execution via worktrees.
license: MIT
version: 0.9.0
argument-hint: "[task_id or 'all']"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep", "Task"]
metadata:
  author: Jason Hsieh
  category: implementation
  tags: [tdd, evidence-based, parallel-execution, git-worktrees]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Workflow Work

Execute implementation tasks following strict TDD methodology.

## Your Task

1. **Update session state** - Write `invocation_mode: "single"` to `.mycelium/state.json`

2. **Load execution skills**:
   - Use Skill tool to load `tdd` (mandatory)
   - Use Skill tool to load `verification` (mandatory)

3. **Parse arguments**:
   - `task_id`: Specific task (e.g., "1.1")
   - `all`: Execute all unblocked tasks (parallel)
   - Default: Next available task

4. **Load active plan**:
   - Read `current_track.plan_file` from `state.json` to locate the active plan
   - Fall back to latest plan in `.mycelium/plans/` if `current_track` is null (backward compat)
   - Read `state.json` for progress

5. **Execute tasks** - Follow TDD and verification skills which handle:
   - **TDD cycle**: RED → GREEN → REFACTOR (mandatory)
   - **Evidence-based verification**: Show actual test output
   - **Incremental commits**: After each task completion
   - **Plan marker updates**: `[ ]` → `[~]` → `[x]`
   - **Parallel execution**: Worktrees for independent tasks (automatic)
   - **Solution capture**: For novel problems (as needed)

6. **After completion**: Suggest `/mycelium-review` for code review

## Skills Used

- **tdd**: Iron Law TDD - tests first, always (MANDATORY)
- **verification**: Evidence-based validation (MANDATORY)
- **mycelium-capture**: Capture learnings from novel problems (as needed)

## Quick Example

```bash
/mycelium-work          # Execute next task
/mycelium-work 1.1      # Execute specific task
/mycelium-work all      # Execute all tasks (parallel)
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

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [Plan frontmatter schema][plan-schema]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
[plan-schema]: ../../schemas/plan-frontmatter.schema.json

## Examples

### Example 1: Execute Specific Task
**Command:** `/mycelium-work 1.1`

**Workflow:**
1. Marks task 1.1 as `[~]` in progress
2. Loads TDD skill - enforces test-first
3. Executes: Write test → Verify RED → Implement → Verify GREEN
4. Commits with evidence
5. Marks task as `[x]` complete

**Result:** Task 1.1 done with passing tests

### Example 2: Execute All Tasks  
**Command:** `/mycelium-work all`

**Workflow:**
1. Identifies unblocked tasks (blockedBy: [])
2. Creates worktrees for parallel execution
3. Spawns agents per task
4. Each agent follows TDD cycle
5. Merges on completion, runs full test suite

**Result:** All independent tasks complete in parallel

## Troubleshooting

**Error:** "Baseline tests failing"
**Cause:** Existing tests broken before new work
**Solution:** Fix existing tests first, then proceed with new work

**Error:** "Tests still failing after 3 attempts"
**Cause:** Implementation approach or test is incorrect
**Solution:** Use `/recovery` skill for systematic debugging

**Issue:** "Cannot create worktree"
**Cause:** Branch already has a worktree or git repository issue
**Solution:** Check `git worktree list`, remove stale worktrees with `git worktree remove`
