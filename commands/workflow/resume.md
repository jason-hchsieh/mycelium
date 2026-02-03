---
name: workflow:resume
description: Resume interrupted workflow session. Loads session_state.json, restores context from progress.md, checks for stashed work, identifies last completed task, and continues from checkpoint.
argument-hint: "[--from-task=X.Y]"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Skill"]
---

# Workflow Resume Command

Resume an interrupted workflow session with full context restoration.

## Your Task

Restore workflow state and continue from where work was interrupted, ensuring continuity and context preservation.

## Resume Process

### 1. Check for Resumable State

Look for these indicators:

```bash
# Check session state
ls -la .workflow/state/session_state.json

# Check for progress file
ls -la .workflow/state/progress.md

# Check git stashes
git stash list

# Check for active worktrees
git worktree list

# Check for uncommitted work
git status --short
```

### 2. Load Session State

Read `.workflow/state/session_state.json`:

```json
{
  "status": "in_progress|paused",
  "current_phase": 4,
  "current_task": "2.3",
  "track_id": "user-auth_20260203",
  "plan_file": ".workflow/plans/2026-02-03-user-auth.md",
  "started_at": "2026-02-03T09:00:00Z",
  "last_updated": "2026-02-03T11:30:00Z",
  "active_worktrees": [...]
}
```

### 3. Load Contextual Information

#### A. Read Progress File

Load `.workflow/state/progress.md`:

```markdown
## Current State
Track: user-auth_20260203
Phase: 4 - Implementation
Task: 2.3 - Session management

## Completed
- [x] Task 1.1: Initialize auth module (abc1234)
- [x] Task 1.2: Setup test framework (def5678)
- [x] Task 2.1: User model (jkl3456)
- [x] Task 2.2: Password validation (mno7890)
- [x] Task 2.3: Session management (pqr1234) ← Last completed

## Key Decisions
- Decision 1: Use bcrypt for password hashing (performance)
- Decision 2: JWT tokens with Redis for session store (scalability)

## Next Up
- [~] Task 3.1: Implement password reset
  Currently in-progress, ~50% complete

## Known Issues
- Issue: Rate limiting needs configuration
- Issue: Email service integration pending
```

#### B. Read Active Plan

Load plan from `session_state.json.plan_file`:
- Parse all tasks
- Identify last completed task (has `[x]` and commit SHA)
- Identify in-progress task (has `[~]`)
- Identify next pending tasks

#### C. Check Git State

```bash
# What branch are we on?
git branch --show-current

# Recent commits
git log --oneline -10

# Uncommitted changes
git status

# Stashed work
git stash list
```

### 4. Analyze Interruption Point

Determine exactly where work stopped:

**Completed Task:**
- Task marked `[x]` with commit SHA
- Changes are committed
- Tests passed at that point
→ Safe to continue from next task

**Partially Complete Task:**
- Task marked `[~]` (in-progress)
- May have uncommitted changes
- Tests may not be passing
→ Need to decide: continue or restart this task

**Between Tasks:**
- Last task complete `[x]`
- Next task still `[ ]` pending
- Clean working directory
→ Ideal resume point

### 5. Present Resume Summary

Show user a clear summary:

```
╔════════════════════════════════════════════════════════════╗
║              RESUME WORKFLOW SESSION                       ║
╚════════════════════════════════════════════════════════════╝

SESSION CONTEXT
  Track:         user-auth_20260203
  Type:          Feature
  Started:       2026-02-03 09:00:00
  Interrupted:   2026-02-03 11:30:00 (2h 30m ago)
  Duration:      2h 30m before interruption

PROGRESS SO FAR
  Completed:     5 / 12 tasks (42%)
  Last Task:     [x] 2.3 - Session management (pqr1234)
  Current:       [~] 3.1 - Password reset (partially complete)

WORK STATE
  Git Branch:    user-auth_20260203
  Uncommitted:   2 files modified
  Stashed:       1 stash available
  Worktrees:     1 active worktree

CONTEXT RECAP
  Last completed:
    - Implemented session management with Redis
    - Added JWT token generation
    - Tests passing at 85% coverage

  Key decisions made:
    - Using bcrypt for password hashing
    - JWT + Redis for session storage

  Known blockers:
    - Email service integration pending
    - Rate limiting config needed

RESUME OPTIONS
  1. Continue task 3.1 (password reset) - from ~50%
  2. Restart task 3.1 from scratch
  3. Skip to next task (3.2)
  4. Review what was done so far
  5. Show full status first

What would you like to do? (1-5):
```

### 6. Handle Uncommitted Work

If `git status` shows uncommitted changes:

**Option A: Apply Stash**
```bash
# Show what's in stash
git stash show -p stash@{0}

# Ask user: apply this stash?
# If yes:
git stash pop
```

**Option B: Keep Uncommitted**
```bash
# If changes are for current task, keep them
# Show user what files are modified
git status --short

# Ask: continue with these changes?
```

**Option C: Stash Current Work**
```bash
# If user wants fresh start
git stash push -m "Pre-resume checkpoint $(date +%Y%m%d_%H%M%S)"
```

### 7. Restore Worktree Context

If active worktrees exist:

```bash
# List worktrees
git worktree list

# Check if they're for current track
# Read session_state.json.active_worktrees

# Options:
# 1. Continue in worktree
# 2. Merge and cleanup worktree
# 3. Abandon worktree
```

### 8. Verify Environment

Before resuming work:

```bash
# Run tests to confirm clean baseline
{test_command}

# Check dependencies installed
{package_check}  # npm ci, pip install, go mod download, etc.

# Verify .env files present
ls -la .env*
```

### 9. Continue from Checkpoint

Based on user choice:

**Continue In-Progress Task:**
- Load task details from plan
- Show what's already done
- Show what remains
- Execute with `/workflow:work {task_id}`

**Start Next Task:**
- Mark current task completed or skipped
- Move to next available task
- Execute with `/workflow:work {next_task_id}`

**Review First:**
- Show detailed status
- Let user decide after seeing full context
- Use `/workflow:status --verbose`

### 10. Update Session State

After resume decision:

```json
{
  "status": "in_progress",
  "resumed_at": "2026-02-03T14:00:00Z",
  "resume_count": 1,
  "last_updated": "2026-02-03T14:00:00Z"
}
```

## Recovery Scenarios

### Scenario 1: Clean Interruption

**State:**
- Last task completed with commit
- No uncommitted changes
- Tests passing

**Action:**
- Load context from progress.md
- Continue to next task
- Minimal restoration needed

### Scenario 2: Mid-Task Interruption

**State:**
- Task marked in-progress `[~]`
- Uncommitted changes present
- Tests may not be passing

**Action:**
- Show uncommitted changes
- Offer to continue or restart
- Run tests to check current state
- If tests fail: recommend restart

### Scenario 3: Long Gap

**State:**
- Last activity >24 hours ago
- Codebase may have changed
- Context may be stale

**Action:**
- Check for upstream changes
- Offer to rebase/merge main
- Verify tests still pass
- May need context refresh

### Scenario 4: Multiple Worktrees

**State:**
- Several parallel worktrees active
- Work in different stages

**Action:**
- Show status of each worktree
- Identify which to resume
- Offer to cleanup abandoned worktrees
- Use `/workflow:worktree-cleanup` if needed

### Scenario 5: Corrupted State

**State:**
- session_state.json malformed
- Plan file missing
- Inconsistent markers

**Action:**
- Attempt to reconstruct from git history
- Show what can be recovered
- Offer to create new plan from current state
- Use git log to identify completed work

## Resume with --from-task Flag

Allow explicit resume point:

```bash
/workflow:resume --from-task=3.2
```

**Behavior:**
- Ignore current_task in session_state.json
- Mark all tasks before 3.2 as complete
- Verify commits exist for those tasks
- Start fresh from specified task

## Context Window Management

If resuming after long gap or context swap:

1. **Compress Previous Context:**
   - Load summary from progress.md (not full history)
   - Reference key decisions (not full discussion)
   - Load critical patterns only

2. **Essential Context Only:**
   - Track overview and goals
   - Tasks completed with commit SHAs
   - Key decisions made
   - Current blockers

3. **Skip:**
   - Implementation details of completed work
   - Detailed discussion history
   - Resolved issues

## Skills to Use

- **context**: For loading and understanding state
- **recovery**: For handling problematic resume situations
- **tdd**: For verifying tests before continuing

## Error Handling

**If no session_state.json:**
- Check for plan files in `.workflow/plans/`
- Offer to create session from most recent plan
- Ask user which plan to resume

**If session complete:**
- Inform user work is already done
- Show summary of completed track
- Suggest starting new work with `/workflow:plan`

**If tests failing:**
- STOP - must fix before resuming
- Show test failures
- Recommend fixing before continuing
- Offer to help debug

**If conflicting state:**
- session_state.json says task 2.3
- Plan file shows task 3.1 in-progress
→ Trust plan file (source of truth)
→ Update session_state.json to match

## Important Notes

- Always verify tests pass before continuing new work
- Trust plan file markers as source of truth
- Load progress.md for context summary (efficient)
- Check for uncommitted work (don't lose progress)
- Offer clear options (don't assume)
- Default to safe choice (review before continuing)
- Update last_updated timestamp on resume

## After Resume

Once resumed:
- Confirm user is ready to continue
- Show next task details
- Execute with `/workflow:work` automatically or wait for command
- Save checkpoint with resume timestamp

## Related Commands

- `/workflow:status` - Check what's resumable
- `/workflow:work` - Continue implementation
- `/workflow:recovery` - Handle blockers during resume
