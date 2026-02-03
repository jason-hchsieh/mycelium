---
name: workflow:work
description: Execute implementation tasks from plan (Phase 4). Enforces TDD, manages parallel worktrees, dispatches fresh subagents per task, updates plan markers in-place, and runs verification after each task.
argument-hint: "[task_id or 'all']"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Skill"]
---

# Workflow Work Command

Execute implementation tasks according to the plan. This is Phase 4 (Implementation) with Phase 4.5 (Verification).

## Your Task

Execute tasks from the active plan, following TDD rigorously, managing worktrees for parallel execution, and verifying all work.

### Phase 4A: Preparation

1. **Load the Active Plan:**
   - Find most recent plan in `.workflow/plans/`
   - Read plan frontmatter and task list
   - Check `session_state.json` for current progress

2. **Determine Task Execution Mode:**
   - If user specified task_id: Execute that specific task
   - If user said "all": Execute all pending tasks (parallel where possible)
   - Default: Execute next available unblocked task

3. **Setup Worktree (for parallel execution):**
   - Check if `.worktrees/` directory exists
   - For each task to execute in parallel:
     ```bash
     git worktree add .worktrees/{track_id}_{task_id} -b {track_id}_{task_id}
     ```
   - Copy `.env` files to worktree if they exist
   - Record worktree in `session_state.json`

4. **Pre-flight Checks:**
   - Run baseline tests in main branch: Verify ALL tests pass
   - If tests failing: STOP - must fix before new work
   - Check for uncommitted changes: Stash if needed
   - Load required skills (tdd, verification)

### Phase 4B: Task Execution

For EACH task, follow this cycle:

#### 1. Mark Task In-Progress
- Update plan file: Change `[ ]` to `[~]` for this task
- Update `session_state.json` current_task
- Commit plan change: "Start task {task_id}: {title}"

#### 2. Search for Existing Patterns
BEFORE writing any code:
- Grep codebase for similar implementations
- Check `.workflow/solutions/` for relevant patterns
- Review `critical-patterns.md` for must-follow patterns
- Apply learned conventions from `.workflow/learned/`

#### 3. Apply Iron Law TDD (Use tdd skill)

**MANDATORY TDD Cycle:**

```
1. RED: Write failing test first
   - Define expected behavior in test
   - Test must fail initially (proves it runs)

2. VERIFY RED: Run tests, watch failure
   - Confirm test fails for right reason
   - Confirm failure message is clear
   - EVIDENCE: Show actual test output

3. GREEN: Write minimal implementation
   - Only enough code to pass the test
   - No premature optimization
   - No features not covered by tests

4. VERIFY GREEN: Run tests, watch success
   - Confirm new test passes
   - Confirm all existing tests still pass
   - EVIDENCE: Show actual test output

5. REFACTOR: Clean up (optional)
   - Improve readability
   - Remove duplication
   - Run tests after each change
```

**NO CODE WITHOUT FAILING TEST FIRST**

#### 4. Fresh Subagent Execution
- Each task runs in clean context (no pollution)
- If task is complex, use appropriate agent:
  - Implementation: general-purpose
  - Review: review agents (spec-compliance, code-quality)
  - Learning: learning-agent
- If working in worktree, all work happens there

#### 5. Verification (Phase 4.5)

**EVIDENCE-BASED VALIDATION ONLY:**

For EVERY claim of success:
1. IDENTIFY the proof command
2. RUN it fresh and completely
3. READ full output including exit codes
4. VERIFY output supports claim
5. ONLY THEN state result

**Run These Verifications:**
```bash
# Unit tests
{test_command}  # npm test, pytest, go test, etc.

# Check exit code
echo $?  # Must be 0

# Coverage check
{coverage_command}  # npm run test:coverage, pytest --cov, etc.

# Lint check (if applicable)
{lint_command}  # npm run lint, flake8, golangci-lint, etc.
```

**PROHIBITED:**
- ✗ "should work" / "seems fine"
- ✗ Unverified agent reports
- ✗ Partial checks as complete
- ✗ Skipping verification due to fatigue

**If Tests Fail:**
- Use systematic debug process (5 phases):
  1. Root cause investigation
  2. Git bisect to find breaking commit
  3. Pattern analysis
  4. Hypothesis testing
  5. Targeted fix
- If 3+ fixes fail: Question the architecture
- Do NOT proceed until tests pass

#### 6. Incremental Commit
Once tests pass:
```bash
cd {worktree_or_main}
git add {files}
git commit -m "$(cat <<'EOF'
{task_id}: {concise description}

- {What changed}
- {Why it changed}

Tests: {test summary}
Coverage: {percentage}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

#### 7. Mark Task Complete
- Update plan file: Change `[~]` to `[x]` with commit SHA
- Example: `[x] Task 1.1: Setup auth module \`abc1234\``
- Update `session_state.json` completed_tasks
- Commit plan update: "Complete task {task_id}"

#### 8. Context Sync (Phase 4.5B)
After each task:
- Check context usage (token count)
- If >50%: Summarize completed work to `.workflow/state/progress.md`
- If >80%: Prepare to spawn fresh agent with compressed context
- Update progress.md with:
  - Current state
  - Completed tasks
  - Key decisions made
  - Next tasks
  - Known issues

### Phase 4C: Parallel Execution (Default Mode)

When executing "all" tasks, run in parallel:

1. **Read Task Dependencies:**
   - Parse `blockedBy` field for each task
   - Build dependency graph

2. **Dispatch Unblocked Tasks:**
   - Find all tasks where `blockedBy: []` or all blockers complete
   - Create worktree for each
   - Dispatch subagent for each task simultaneously

3. **Monitor and Merge:**
   - Wait for task completions
   - When task completes:
     - Run verification in worktree
     - Merge worktree branch to main
     - Update plan markers
     - Unblock dependent tasks
     - Dispatch newly unblocked tasks

4. **Repeat Until All Complete**

**Parallelism Rules:**
- Default to parallel where dependencies allow
- Each parallel task gets own worktree
- No shared state between parallel tasks
- Merge conflicts must be resolved immediately

### Phase 4D: Monitoring

Throughout execution:
- Track progress via plan markers
- Detect blockers → STOP and ask user
- Save state after each task completion
- Log deviations in plan's "Deviations Log" section

### Error Handling

**If Tests Fail:**
- Use systematic debugging (git bisect, root cause analysis)
- Do NOT proceed to next task
- Update task status to `[!]` (blocked)
- Document issue in plan

**If Blocker Encountered:**
- Mark task `[!]` in plan
- Document blocker in "Deviations Log"
- STOP and ask user for guidance
- Do NOT make assumptions

**If Task Taking Too Long:**
- Re-evaluate complexity estimate
- Consider splitting into smaller tasks
- Document in "Deviations Log"

**If Pattern Violation Detected:**
- Check `critical-patterns.md`
- Follow established pattern instead
- Document why in commit message

## Worktree Management

**Create Worktree:**
```bash
git worktree add .worktrees/{track_id}_{task_id} -b {branch_name}
cd .worktrees/{track_id}_{task_id}
# Copy .env files if needed
# Run work here
```

**Merge Worktree:**
```bash
cd {project_root}
git merge {branch_name}
git worktree remove .worktrees/{track_id}_{task_id}
git branch -d {branch_name}
```

**Track in session_state.json:**
```json
{
  "active_worktrees": [
    {
      "track_id": "auth_20260203",
      "task_id": "1.1",
      "path": ".worktrees/auth_20260203_1.1",
      "branch": "auth_20260203_1.1",
      "status": "active",
      "created_at": "2026-02-03T10:00:00Z"
    }
  ]
}
```

## Skills to Use

**MANDATORY for all implementation:**
- **tdd**: Iron Law TDD - NO exceptions
- **verification**: Evidence-based validation

**As needed:**
- **solution-capture**: After solving novel problems
- **context**: For loading project knowledge
- **recovery**: For handling blockers

## Important Notes

- TDD is NON-NEGOTIABLE: Tests first, always
- Verification requires EVIDENCE: Show actual output
- Plans are LIVING DOCUMENTS: Update markers in-place
- Parallel is DEFAULT: Use worktrees for independent tasks
- Fresh subagent per task: No context pollution
- Save state frequently: Enable resume on interruption
- Do NOT skip verification steps
- Do NOT proceed with failing tests
- Do NOT make architectural changes without updating plan

## After Execution

When all tasks complete:
1. Run full test suite one final time
2. Verify all plan checkboxes are `[x]`
3. Generate summary of work completed
4. Suggest: `/workflow:review` for two-stage review
5. Or suggest: merge branch if no review needed
