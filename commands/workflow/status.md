---
name: workflow:status
description: Show current session state, task progress, and metrics. Displays active phase, track, task completion, blockers, worktree status, context usage, and next actions.
argument-hint: "[--verbose]"
allowed-tools: ["Read", "Bash", "Glob", "Grep"]
---

# Workflow Status Command

Display comprehensive status of the current workflow session.

## Your Task

Read workflow state files and present clear, actionable status information to the user.

## Information to Gather

### 1. Session State

Read `.workflow/state/session_state.json`:

```json
{
  "status": "in_progress|completed|paused",
  "current_phase": 4,
  "current_task": "2.3",
  "track_id": "user-auth_20260203",
  "plan_file": ".workflow/plans/2026-02-03-user-auth.md",
  "started_at": "2026-02-03T09:00:00Z",
  "last_updated": "2026-02-03T11:30:00Z"
}
```

### 2. Active Plan

Read the plan file from `session_state.json.plan_file`:
- Parse frontmatter for track metadata
- Count tasks by status: `[ ]`, `[~]`, `[x]`, `[-]`, `[!]`
- Identify current task
- Find blockers

### 3. Git Context

```bash
# Current branch
git branch --show-current

# Recent commits on this branch
git log --oneline -5

# Uncommitted changes
git status --short

# Stashes
git stash list
```

### 4. Worktree Status

```bash
# List active worktrees
git worktree list

# Check session_state.json for tracked worktrees
# Read: session_state.json.active_worktrees[]
```

### 5. Test Status

```bash
# Run tests (read-only check)
{test_command} --passWithNoTests

# Check last exit code
echo $?
```

### 6. Context Usage (if verbose)

Estimate context window usage:
- Count tokens in current conversation (approximate)
- Check if approaching threshold (>80%)
- Note if context sync needed

## Status Report Format

### Standard Output

```
╔════════════════════════════════════════════════════════════╗
║              ADAPTIVE WORKFLOW STATUS                      ║
╚════════════════════════════════════════════════════════════╝

SESSION
  Status:        In Progress
  Phase:         4 - Implementation
  Started:       2026-02-03 09:00:00
  Duration:      2h 30m

TRACK
  ID:            user-auth_20260203
  Type:          feature
  Size:          Medium
  Branch:        user-auth_20260203

PROGRESS
  Tasks:         5 / 12 complete (42%)
  Completed:     [x] 1.1, 1.2, 2.1, 2.2, 2.3
  In Progress:   [~] 3.1
  Blocked:       [!] 3.2 (waiting on 3.1)
  Pending:       [ ] 3.3, 4.1, 4.2, 4.3, 4.4

CURRENT TASK
  ID:            3.1
  Title:         Implement password hashing
  Complexity:    Small
  Agent:         general-purpose
  Skills:        [tdd, verification]
  Files:         src/auth/password.ts, tests/auth/password.test.ts

GIT STATUS
  Branch:        user-auth_20260203
  Commits:       5 ahead of main
  Uncommitted:   2 files modified
  Stashes:       None

TESTS
  Last Run:      ✓ All passing (127 tests)
  Coverage:      85% (target: 80%)
  Status:        ✓ Ready for next task

WORKTREES
  Active:        1 worktree
  - user-auth_20260203 (.worktrees/user-auth_20260203)
    Status: active, created 2h ago

BLOCKERS
  None

NEXT ACTIONS
  1. Complete current task (3.1)
  2. Run verification tests
  3. Continue to task 3.3 (3.2 remains blocked)

AVAILABLE COMMANDS
  /workflow:work       - Continue implementation
  /workflow:review     - Run code review
  /workflow:status -v  - Show verbose status
  /workflow:compound   - Capture learnings

╚════════════════════════════════════════════════════════════╝
```

### Verbose Output (--verbose)

Add these sections:

```
DETAILED TASK BREAKDOWN
  Phase 1: Setup (3 tasks)
    [x] 1.1 - Initialize auth module (abc1234)
    [x] 1.2 - Setup test framework (def5678)
    [x] 1.3 - Configure security libs (ghi9012)

  Phase 2: Core Implementation (4 tasks)
    [x] 2.1 - User model (jkl3456)
    [x] 2.2 - Password validation (mno7890)
    [x] 2.3 - Session management (pqr1234)
    [~] 2.4 - Password hashing (IN PROGRESS)

  Phase 3: Integration (3 tasks)
    [!] 3.1 - API endpoints (BLOCKED by 2.4)
    [ ] 3.2 - Frontend integration
    [ ] 3.3 - Error handling

  Phase 4: Testing (2 tasks)
    [ ] 4.1 - Integration tests
    [ ] 4.2 - End-to-end tests

RECENT COMMITS
  pqr1234 - Complete task 2.3: Session management (2h ago)
  mno7890 - Complete task 2.2: Password validation (3h ago)
  jkl3456 - Complete task 2.1: User model (4h ago)

CONTEXT ANALYSIS
  Estimated Usage:     ~45% of context window
  Messages:            23 in current session
  Status:              ✓ Healthy, no sync needed
  Next Checkpoint:     After task 3.2 or at 60%

LEARNED KNOWLEDGE
  Solutions Captured:  3
  - 2026-02-03: Password hashing best practices
  - 2026-02-02: Session token generation
  - 2026-02-01: Input validation patterns

  Decisions Made:      2
  - Use bcrypt over argon2 (performance)
  - JWT with Redis for sessions (scalability)

  Patterns Active:     1 critical pattern
  - Password handling pattern (PAT-001)

FILE CHANGES (uncommitted)
  M  src/auth/password.ts
  M  tests/auth/password.test.ts

STASHES
  None

METRICS
  Average Task Time:   ~30 minutes
  Tasks Per Hour:      ~2 tasks
  Test Pass Rate:      100%
  Coverage Trend:      ↑ 82% → 85%
```

## Status Indicators

Use these symbols for clarity:

```
✓ - Success / Passing
✗ - Failed / Error
⚠ - Warning / Needs Attention
[x] - Completed
[~] - In Progress
[!] - Blocked
[ ] - Pending
[-] - Skipped
↑ - Increasing
↓ - Decreasing
→ - Stable
```

## Health Checks

Include automatic health assessments:

### Session Health
- ✓ Normal: Everything progressing
- ⚠ Warning: Context >80%, tests failing, blockers present
- ✗ Critical: Multiple blockers, no progress >1h, tests broken

### Test Health
- ✓ Green: All tests passing, coverage ≥ target
- ⚠ Yellow: Some tests failing, coverage near target
- ✗ Red: Many tests failing, coverage below target

### Progress Health
- ✓ On Track: Tasks completing regularly
- ⚠ Slowing: Tasks taking longer than estimated
- ✗ Stalled: No completed tasks in >2 hours

## Special Situations

### No Active Session

```
╔════════════════════════════════════════════════════════════╗
║              ADAPTIVE WORKFLOW STATUS                      ║
╚════════════════════════════════════════════════════════════╝

SESSION
  Status:        No active session

PROJECT
  Setup:         ✓ Complete
  Location:      .workflow/

AVAILABLE COMMANDS
  /workflow:plan   - Create implementation plan
  /workflow:resume - Resume previous session

RECENT HISTORY
  Last session:    2026-02-02 (completed)
  Last track:      user-profile_20260202
  Status:          ✓ Successfully merged
```

### Setup Not Complete

```
╔════════════════════════════════════════════════════════════╗
║              ADAPTIVE WORKFLOW STATUS                      ║
╚════════════════════════════════════════════════════════════╝

SESSION
  Status:        Setup incomplete

SETUP STATE
  Status:        In Progress
  Section:       Tech Stack (2/4 questions answered)
  Can Resume:    Yes

NEXT ACTION
  /workflow:setup --resume

Would you like to resume setup now? (y/n)
```

### Multiple Blockers

Highlight blockers prominently:

```
⚠ BLOCKERS DETECTED ⚠

  [!] Task 3.1 - Cannot proceed
      Reason: Waiting on external API documentation
      Blocked since: 1h 30m ago
      Action: Reach out to API team

  [!] Task 4.2 - Dependency issue
      Reason: Package version conflict
      Blocked since: 45m ago
      Action: Resolve dependency in package.json

RECOMMENDATION
  Address blockers before continuing with /workflow:work
  Or use /workflow:recovery for blocker resolution guidance
```

## Error Handling

**If session_state.json missing:**
- Check if setup is complete
- Offer to run setup or resume

**If plan file missing:**
- Note the issue
- Suggest running `/workflow:plan`

**If git repo invalid:**
- Warn that workflow requires git
- Suggest initializing repository

**If tests cannot run:**
- Note test framework not found
- Show as "Unknown" status

## Output Formatting

- Use box drawing characters for visual structure
- Keep lines ≤70 characters for readability
- Use indentation for hierarchy
- Bold or highlight important items (if terminal supports)
- Use colors sparingly (if terminal supports):
  - Green for success
  - Yellow for warnings
  - Red for errors

## Interactive Mode (Optional)

After showing status, optionally ask:

```
What would you like to do?

1. Continue working on current task
2. Start next available task
3. Review completed work
4. Capture learnings
5. Show verbose status
6. Nothing, just checking

Enter number or command:
```

## Performance

- Should execute in <2 seconds
- Use fast operations (read files, not heavy git operations)
- Cache frequently accessed data if possible

## Skills to Reference

- **context**: For understanding project state
- **recovery**: If blockers detected

## Important Notes

- Always show actionable next steps
- Highlight blockers prominently
- Keep it scannable (user should understand in <10 seconds)
- Update session_state.json last_updated if checking status counts as activity
- Do NOT modify any state - read-only operation
- Do NOT run tests automatically - only show last known status

## Related Commands

- `/workflow:resume` - Resume paused work
- `/workflow:work` - Continue implementation
- `/workflow:review` - Run code review
- `/workflow:compound` - Capture learnings
- `/workflow:metrics` - Detailed metrics (future)
