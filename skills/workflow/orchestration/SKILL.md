---
name: Autonomous Workflow Orchestration
description: This skill should be used when the user asks to "run the full workflow", "execute autonomously", "workflow go", or wants end-to-end autonomous development. Guides autonomous execution of the complete mycelium workflow: plan → work → review → capture.
user-invocable: false
version: 0.1.0
---

# Autonomous Workflow Orchestration

This skill guides autonomous execution of the complete mycelium workflow: plan → work → review → capture.

## When to Use This Skill

- When executing `/mycelium-go [task]`
- For end-to-end autonomous development
- When user wants minimal interaction
- For routine/clear tasks with established patterns
- When resuming via `/mycelium-continue` in full mode

## Continue Mode

When invoked from `/mycelium-continue`, the orchestration skill resumes from a saved checkpoint rather than starting fresh.

### Phase Mapping

Map `current_phase` in `session_state.json` to named phases:

| `current_phase` value | Phase name | Phase number |
|-----------------------|------------|-------------|
| `planning` | Plan | 1 |
| `implementation` | Work | 2 |
| `review` | Review | 3 |
| `capture` | Capture | 4 |

### Start-From Logic

1. Read `current_phase` and `checkpoints` from `session_state.json`
2. Skip any phase already marked complete in checkpoints (e.g., `planning_complete` timestamp exists → skip Plan)
3. Begin at the current phase, resuming from its checkpoint (e.g., `last_task_completed: "1.2"` → start at task 1.3)
4. Chain through all remaining phases to completion

### Mid-Phase Resumption

- Read `.workflow/state/progress.md` for completed work summary
- Check plan markers (`[x]` = done, `[~]` = in progress, `[ ]` = pending)
- Resume the `[~]` or next `[ ]` task within the current phase
- Verify test baseline passes before continuing work

## Overview

The orchestration skill manages the full development lifecycle with minimal human intervention, stopping only when critical decisions are needed or blockers are encountered.

---

## Execution Modes

### Autonomous Mode (Default)

**Characteristics**:
- Minimal user interaction
- Auto-proceeds when path is clear
- Only stops for critical decisions
- Fast execution

**When to stop**:
- Ambiguous requirements (multiple valid interpretations)
- High-risk changes (security, payments, data)
- P1 issues in review
- Tests failing after 3 attempts
- Missing information that cannot be inferred

**When to auto-proceed**:
- Requirements are clear and specific
- Plan has no blockers or dependencies
- All tests pass
- Only P2/P3 review issues (note them, continue)
- Patterns exist in codebase

### Interactive Mode (`--interactive`)

**Characteristics**:
- Approval required at each phase
- User oversight throughout
- Slower but more controlled
- Good for learning or high-stakes changes

**When to ask**:
- After plan creation: "Approve plan?"
- After implementation: "Proceed to review?"
- After review: "Fix issues or accept?"
- After capture: "Learnings captured, continue?"

---

## Phase 1: Planning

### Input Processing

**Parse task description**:
```
User input: "Add user authentication with JWT"

Extract:
- Feature: User authentication
- Technical approach: JWT
- Scope: {to be clarified}
```

### Load Context

**Read project context**:
```bash
# Project information
cat .workflow/context/product.md
cat .workflow/context/tech-stack.md
cat .workflow/context/workflow.md
cat CLAUDE.md

# Prior knowledge
cat .workflow/solutions/patterns/critical-patterns.md
ls .workflow/solutions/

# Session state
cat .workflow/state/session_state.json
```

### Invoke Planning Skill

**Load**: `workflow/planning` skill

**Execute planning workflow**:
1. Clarify requirements (Phase 1)
2. Smart research gate (Phase 1.5)
3. Discover capabilities (Phase 2)
4. Create plan (Phase 3)

**Decision gate** (Autonomous):
```
Requirements clear? (yes/no)
- If yes: Auto-proceed
- If no: Ask clarifying questions

Example:
  "Add user authentication" is AMBIGUOUS
  - Which auth method? (OAuth, JWT, session)
  - Registration included?
  - Password requirements?

  → STOP and ask
```

**Decision gate** (Interactive):
```
📋 Plan created: 8 tasks across 3 phases

[Show task breakdown]

❓ Approve plan? (yes/no/modify)
```

**Output**:
- Plan saved to `.workflow/plans/YYYY-MM-DD-{track_id}.md`
- Track ID stored in session_state.json

**Error handling**:
- If planning fails: Report error, STOP
- If user rejects plan: Iterate or exit
- If requirements unclear: Ask questions, don't assume

---

## Phase 2: Implementation

### Pre-flight Checks

**Verify baseline**:
```bash
# Run existing tests
{test_command}

# Must all pass before new work
if [ $? -ne 0 ]; then
  echo "❌ Baseline tests failing"
  echo "Fix existing tests before new work"
  STOP
fi
```

**Check uncommitted changes**:
```bash
git status --porcelain

# If dirty working tree:
# Autonomous: Stash changes
# Interactive: Ask "Stash changes? (yes/no)"
```

### Invoke TDD and Verification Skills

**Load**:
- `workflow/tdd` (mandatory)
- `workflow/verification` (mandatory)

**Execute implementation**:

For EACH task in plan (or parallel if dependencies allow):

1. **Mark task in-progress**:
   ```markdown
   [~] Task 1.1: Setup auth module
   ```

2. **Search for patterns**:
   ```bash
   # Find similar implementations
   grep -r "auth\|authentication" src/

   # Check for learned patterns
   cat .workflow/solutions/patterns/critical-patterns.md
   ```

3. **Apply TDD cycle** (from tdd skill):
   ```
   RED → GREEN → REFACTOR

   1. Write failing test
   2. Verify RED (test fails)
   3. Write minimal implementation
   4. Verify GREEN (test passes)
   5. Refactor if needed
   ```

4. **Verify with evidence**:
   ```bash
   # Run tests
   {test_command}

   # Show output
   # Verify exit code = 0
   # Check coverage
   ```

5. **Commit**:
   ```bash
   git add {files}
   git commit -m "Task 1.1: Setup auth module

   - Add User model with password hashing
   - Add JWT token generation

   Tests: All pass (32/32)
   Coverage: 85%

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

6. **Mark task complete**:
   ```markdown
   [x] Task 1.1: Setup auth module `abc1234`
   ```

### Decision Gates

**Autonomous mode**:
- Tests pass → Auto-proceed
- Tests fail (attempt 1-3) → Debug and fix
- Tests fail (attempt 4+) → STOP, report blocker
- Pattern exists → Follow pattern
- No pattern → Create new, document

**Interactive mode**:
```
✅ Task 1.1 complete (tests pass, coverage 85%)

Next: Task 1.2 (Add login endpoint)

❓ Continue? (yes/no/pause)
```

### Parallel Execution

If tasks have no dependencies (`blockedBy: []`):

```
Tasks ready for parallel execution:
- Task 2.1: Add login endpoint
- Task 2.2: Add logout endpoint
- Task 2.3: Add token refresh

Creating worktrees...
├── .worktrees/auth_20260204_2.1/
├── .worktrees/auth_20260204_2.2/
└── .worktrees/auth_20260204_2.3/

Executing in parallel...
```

Use Task tool to dispatch subagents for each task.

**Merge strategy**:
1. Wait for task completion
2. Verify tests in worktree
3. Merge to main
4. Run full test suite
5. If conflicts: Resolve, retest
6. Remove worktree
7. Unblock dependent tasks

### Progress Reporting

**Autonomous mode**:
```
🤖 Working...
   ✓ Task 1.1: Auth module (tests pass)
   ✓ Task 1.2: Login endpoint (tests pass)
   ⏳ Task 1.3: Session management (in progress)
```

**Interactive mode**:
```
✅ Tasks 1.1 - 1.3 complete (3/8)

Progress: ▓▓▓░░░░░ 37%

❓ Continue to Task 1.4? (yes/no/status)
```

### Error Recovery

**Test failures**:
```
Attempt 1: Fix attempt #1
Attempt 2: Fix attempt #2
Attempt 3: Fix attempt #3
Attempt 4: STOP

❌ Tests still failing after 3 fix attempts

Issue: {description}
Last error: {error message}

Blocker detected. Stopping for user input.

Options:
1. Debug manually
2. Simplify approach
3. Skip this task (not recommended)
```

**Blocked on external dependency**:
```
⚠️ Task 2.3 blocked: Waiting for API key from user

Cannot proceed automatically.
Please provide API key and resume.
```

---

## Phase 3: Review

### Invoke Review Skill

**Load**: `workflow/review` skill

**Execute two-stage review**:

#### Stage 1: Spec Compliance

```
🤖 Reviewing (Stage 1: Spec Compliance)...
   ✓ All tasks completed
   ✓ Acceptance criteria met
   ✓ Tests passing
   ✓ Coverage: 85% (target: 80%)
```

**Decision gate**:
- PASS → Proceed to Stage 2
- CONDITIONAL PASS → Note issues, proceed to Stage 2
- FAIL → STOP, report required fixes

#### Stage 2: Quality Review

```
🤖 Reviewing (Stage 2: Quality)...
   ✓ Security: 0 P1, 1 P2 issues
   ✓ Performance: 0 P1, 2 P2 issues
   ✓ Architecture: 0 P1, 0 P2 issues
   ✓ Code Quality: 0 P1, 1 P2 issues
   ✓ Simplicity: 0 P1, 3 P3 issues
```

**Issue summary**:
```
Quality Score: 8.5/10

Issues:
- 0 critical (P1) ✓
- 4 important (P2)
- 3 minor (P3)
```

### Decision Gates

**Autonomous mode**:

```
P1 issues? (yes/no)
- Yes → STOP, must fix
- No → Auto-proceed

Example:
  0 P1, 4 P2, 3 P3 → Continue
  (P2/P3 noted for future improvement)
```

**Interactive mode**:
```
📊 Review complete: 0 P1, 4 P2, 3 P3

Quality: 8.5/10

P2 Issues:
1. Weak password requirements
2. N+1 query in user list
3. Missing rate limiting
4. Error messages expose internal details

❓ Fix now or accept? (fix/accept/selective)
```

### Fixing Issues

If P1 issues or user chooses to fix:

**Create fix tasks**:
```markdown
### Fix: SQL Injection in login

**Priority:** P1
**File:** src/auth/login.ts:45
**Fix:** Use parameterized queries
**Effort:** 15 min
```

**Execute fixes**:
- Follow TDD cycle
- Verify fix doesn't break existing tests
- Re-run affected review agents
- Confirm issue resolved

---

## Phase 4: Knowledge Capture

### Invoke Solution Capture Skill

**Load**: `workflow/solution-capture` skill

**Execute knowledge extraction**:

1. **Analyze completed work**:
   ```bash
   # Load track information
   cat .workflow/plans/{track_file}.md

   # Get all commits
   git log main..{track_branch}

   # Review changes
   git diff main..{track_branch}
   ```

2. **Identify learnings**:
   - New patterns created
   - Problems solved
   - Gotchas encountered
   - Performance optimizations
   - Security considerations

3. **Categorize and save**:
   ```
   Captured:
   - Pattern: JWT token validation
     → .workflow/solutions/patterns/auth-patterns.md

   - Solution: Session timeout handling
     → .workflow/solutions/security-issues/session-timeout.md

   - Performance: Database query optimization
     → .workflow/solutions/performance-issues/query-batch.md
   ```

4. **Update capabilities**:
   ```json
   // session_state.json
   {
     "discovered_capabilities": {
       "patterns": [
         "jwt-authentication",
         "session-management",
         "password-hashing"
       ]
     }
   }
   ```

### Decision Gates

**Autonomous mode**:
```
🤖 Capturing learnings...
   ✓ 3 patterns extracted
   ✓ 2 solutions documented
   ✓ Knowledge base updated
```

**Interactive mode**:
```
📚 Learnings captured:

Patterns:
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Session timeout handling

Solutions:
- Optimized user list query (N+1 → single query)
- Rate limiting middleware

❓ Review captured knowledge? (yes/no)
```

---

## Final Report

### Generate Summary

```
✅ Workflow Complete!

Task: Add user authentication with JWT

📋 Planning:
   ✓ Created 8 tasks across 3 phases
   ✓ TDD test strategy defined

🔨 Implementation:
   ✓ 8/8 tasks completed
   ✓ All tests passing (45 tests)
   ✓ Coverage: 85% (target: 80%)
   ✓ 12 commits

🔍 Review:
   ✓ Spec compliance: PASS
   ✓ Quality score: 8.5/10
   ✓ 0 P1, 4 P2, 3 P3 issues

📚 Knowledge:
   ✓ 3 patterns captured
   ✓ 2 solutions documented

Time: 45 minutes
Next: Deploy or continue with next feature?
```

### Next Steps

**Suggest**:
- Merge to main (if on feature branch)
- Create PR (if using pull requests)
- Deploy (if ready)
- Start next task: `/mycelium-go [next-task]`

---

## Orchestration State Management

Throughout execution, maintain state in `session_state.json`:

```json
{
  "current_track": "auth_20260204",
  "current_phase": "implementation",
  "current_task": "1.3",
  "mode": "autonomous",
  "checkpoints": {
    "planning_complete": "2026-02-04T10:15:00Z",
    "implementation_started": "2026-02-04T10:20:00Z",
    "last_task_completed": "1.2",
    "last_commit": "abc1234"
  },
  "blockers": [],
  "decisions_made": [
    {
      "decision": "Use JWT for authentication",
      "rationale": "Stateless, scalable",
      "timestamp": "2026-02-04T10:12:00Z"
    }
  ]
}
```

**Save state**:
- After each phase completion
- After each task completion
- Before asking user questions
- On error/blocker

**Resume support**:
If interrupted, can resume from last checkpoint using `/mycelium-continue`. Use `/mycelium-continue --full` to force full orchestration mode regardless of how the workflow was originally started.

---

## Decision Matrix

### When to STOP and Ask (Both Modes)

| Scenario | Action | Example |
|----------|--------|---------|
| Ambiguous requirements | ASK | "Add auth" → Which method? |
| High-risk change | ASK | Changing payment logic |
| P1 review issues | STOP | SQL injection found |
| Tests fail 3+ times | STOP | Cannot fix automatically |
| Missing credentials | ASK | Need API key |
| Architectural decision | ASK | Monolith vs microservices |

### When to AUTO-PROCEED (Autonomous Only)

| Scenario | Action | Example |
|----------|--------|---------|
| Clear requirements | GO | "Add JWT auth with bcrypt" |
| Pattern exists | GO | Found similar auth in codebase |
| Tests passing | GO | All green, proceed |
| P2/P3 issues only | GO | Note issues, continue |
| Standard task | GO | CRUD operations |

---

## Error Handling

**Planning fails**:
```
❌ Planning failed: {reason}

Cannot proceed without plan.
Stopping.

Suggested: Clarify requirements and retry
```

**Implementation blocked**:
```
⚠️ Implementation blocked: {reason}

Completed: 5/8 tasks
Blocked on: Task 1.6 (missing API key)

Saving state...
Resume with: /mycelium-continue
```

**Review finds P1 issues**:
```
❌ Review FAILED: 2 critical (P1) issues

P1 Issues:
1. SQL injection vulnerability
2. Hardcoded credentials

These MUST be fixed before merge.

Stopping for fixes.
```

**Knowledge capture fails**:
```
⚠️ Knowledge capture failed: {reason}

Work is complete but learnings not captured.

Options:
1. Retry capture: /mycelium-capture
2. Continue anyway (learnings lost)
```

---

## Performance Optimization

**Parallel execution**:
- Use worktrees for independent tasks
- Dispatch multiple subagents
- Merge results as they complete

**Smart caching**:
- Load context once, reuse
- Cache grep results
- Reuse test runs if code unchanged

**Progress streaming**:
- Update UI incrementally
- Don't wait for phase completion
- Show real-time progress

---

## Important Notes

- **Save state frequently** - Enable resume on interruption
- **Evidence-based decisions** - Don't assume, verify
- **TDD is mandatory** - No code without tests
- **Stop on P1 issues** - Security/correctness first
- **Capture learnings** - Build knowledge layer
- **Respect user preferences** - Check workflow.md for policies
- **Be transparent** - Show what's happening
- **Fail gracefully** - Clear error messages, suggest fixes

---

## Success Criteria

Workflow is successful when:
- [ ] Plan created and approved
- [ ] All tasks completed with passing tests
- [ ] Coverage meets target
- [ ] No P1 issues in review
- [ ] Learnings captured
- [ ] State saved for resume capability
- [ ] User informed of completion and next steps
