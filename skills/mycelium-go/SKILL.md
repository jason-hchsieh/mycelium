---
name: mycelium-go
description: Executes complete autonomous development workflow from planning to knowledge capture. Use when user says "build [feature]", "implement [functionality]", "fix [bug]", "debug [issue]", "investigate [problem]", "optimize [component]", or asks technical questions requiring systematic solution. Handles feature development, debugging, investigation, and optimization with full plan → work → review → capture cycle.
license: MIT
version: 0.9.0
argument-hint: "[task/question/issue description] [--interactive]"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep", "Task", "AskUserQuestion"]
metadata:
  author: Jason Hsieh
  category: workflow
  tags: [workflow-orchestration, tdd, systematic-development, compound-engineering]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Workflow Go

Execute the complete mycelium workflow autonomously from planning to knowledge capture. Handles feature development, bug debugging, technical questions, investigation, and optimization.

## Your Task

1. **Parse arguments**:
   - `task description`: What to build, fix, debug, investigate, or answer
   - `--interactive`: Enable human approval at each phase (default: autonomous)

2. **Update session state** - Write `invocation_mode: "full"` to `.mycelium/state.json`

3. **Execute full workflow** - Follow the phases below (plan → work → review → capture)

4. **Final report** - Summarize completed work, test results, captured learnings

## Continue Mode

When invoked from `/mycelium-continue`, the workflow resumes from a saved checkpoint rather than starting fresh.

### Phase Mapping

Map `current_phase` in `state.json` to named phases:

| `current_phase` value | Phase name | Phase number |
|-----------------------|------------|-------------|
| `planning` | Plan | 1 |
| `implementation` | Work | 2 |
| `review` | Review | 3 |
| `capture` | Capture | 4 |

### Start-From Logic

1. Read `current_phase` and `checkpoints` from `state.json`
2. Skip any phase already marked complete in checkpoints (e.g., `planning_complete` timestamp exists → skip Plan)
3. Begin at the current phase, resuming from its checkpoint (e.g., `last_task_completed: "1.2"` → start at task 1.3)
4. Chain through all remaining phases to completion

### Mid-Phase Resumption

- Read `.mycelium/progress.md` for completed work summary
- Check plan markers (`[x]` = done, `[~]` = in progress, `[ ]` = pending)
- Resume the `[~]` or next `[ ]` task within the current phase
- Verify test baseline passes before continuing work

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
cat .mycelium/context/product.md
cat .mycelium/context/tech-stack.md
cat .mycelium/context/workflow.md
cat CLAUDE.md

# Prior knowledge
cat .mycelium/solutions/patterns/critical-patterns.md
ls .mycelium/solutions/

# Session state
cat .mycelium/state.json
```

### Discover Capabilities

**Scan the plugin cache filesystem to discover ALL available skills and agents:**

1. **Read plugin registry** - Read `~/.claude/plugins/installed_plugins.json`. For each entry:
   - Extract `pluginName` = part before `@` in the key (e.g., `mycelium` from `mycelium@jasonhch-plugins`)
   - Extract `installPath` from the first array element

2. **Scan for skills** - For each plugin, glob `{installPath}/skills/*/SKILL.md`. For each match:
   - Read the YAML frontmatter to extract `name` and `description`
   - Fully-qualified name: `{pluginName}:{name}` (e.g., `git:commit-and-push`)

3. **Scan for agents** - For each plugin, glob `{installPath}/agents/**/*.md`. For each match:
   - Read the YAML frontmatter to extract `name` and `description`
   - Fully-qualified name: `{pluginName}:{name}` (e.g., `mycelium:learning-agent`)

4. **Add built-in agents** - These are NOT in the plugin cache. Read the Task tool description and extract the built-in agent types: Bash, general-purpose, Explore, Plan, claude-code-guide, statusline-setup.

5. **Check for MCP tools** - These are NOT in the plugin cache. Check the system prompt for any MCP server tools listed as additional tools.

6. **Cache discovered capabilities** in `.mycelium/state.json`:
```json
{
  "discovered_capabilities": {
    "skills": [
      { "name": "mycelium:planning", "description": "..." },
      { "name": "git:commit-and-push", "description": "..." }
    ],
    "agents": [
      { "name": "general-purpose", "source": "built-in", "description": "..." },
      { "name": "mycelium:learning-agent", "source": "plugin", "description": "..." }
    ],
    "mcp_tools": [
      { "name": "tool-name", "server": "mcp-server-name", "description": "..." }
    ]
  }
}
```

7. **Use cached capabilities** when assigning agents/skills to tasks in the plan. Only assign capabilities that exist in the discovered list.

### Execute Planning Workflow

**Execute planning workflow** (see mycelium-plan):
1. Clarify requirements (Phase 1)
2. Smart research gate (Phase 2)
3. Discover capabilities (Phase 3) - use cached capabilities from above
4. Create plan (Phase 4)

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
Plan created: 8 tasks across 3 phases

[Show task breakdown]

Approve plan? (yes/no/modify)
```

**Output**:
- Plan saved to `.mycelium/plans/YYYY-MM-DD-{track_id}.md`
- Track ID stored in state.json
- Plan registered in `session_state.plans[]` (auto-pauses any previously active plan)

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
  echo "Baseline tests failing"
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
- `tdd` (mandatory)
- `verification` (mandatory)

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
   cat .mycelium/solutions/patterns/critical-patterns.md
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
Task 1.1 complete (tests pass, coverage 85%)

Next: Task 1.2 (Add login endpoint)

Continue? (yes/no/pause)
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
Working...
   Task 1.1: Auth module (tests pass)
   Task 1.2: Login endpoint (tests pass)
   Task 1.3: Session management (in progress)
```

**Interactive mode**:
```
Tasks 1.1 - 1.3 complete (3/8)

Progress: 37%

Continue to Task 1.4? (yes/no/status)
```

### Error Recovery

**Test failures**:
```
Attempt 1: Fix attempt #1
Attempt 2: Fix attempt #2
Attempt 3: Fix attempt #3
Attempt 4: STOP

Tests still failing after 3 fix attempts

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
Task 2.3 blocked: Waiting for API key from user

Cannot proceed automatically.
Please provide API key and resume.
```

---

## Phase 3: Review

### Invoke Review Skill

**Load**: `mycelium-review` skill

**Execute two-stage review**:

#### Stage 1: Spec Compliance

```
Reviewing (Stage 1: Spec Compliance)...
   All tasks completed
   Acceptance criteria met
   Tests passing
   Coverage: 85% (target: 80%)
```

**Decision gate**:
- PASS → Proceed to Stage 2
- CONDITIONAL PASS → Note issues, proceed to Stage 2
- FAIL → STOP, report required fixes

#### Stage 2: Quality Review

```
Reviewing (Stage 2: Quality)...
   Security: 0 P1, 1 P2 issues
   Performance: 0 P1, 2 P2 issues
   Architecture: 0 P1, 0 P2 issues
   Code Quality: 0 P1, 1 P2 issues
   Simplicity: 0 P1, 3 P3 issues
```

**Issue summary**:
```
Quality Score: 8.5/10

Issues:
- 0 critical (P1)
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
Review complete: 0 P1, 4 P2, 3 P3

Quality: 8.5/10

P2 Issues:
1. Weak password requirements
2. N+1 query in user list
3. Missing rate limiting
4. Error messages expose internal details

Fix now or accept? (fix/accept/selective)
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

### Execute Knowledge Extraction

**Execute knowledge extraction** (see mycelium-capture):

1. **Analyze completed work**:
   ```bash
   # Load track information
   cat .mycelium/plans/{track_file}.md

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
     → .mycelium/solutions/patterns/auth-patterns.md

   - Solution: Session timeout handling
     → .mycelium/solutions/security-issues/session-timeout.md

   - Performance: Database query optimization
     → .mycelium/solutions/performance-issues/query-batch.md
   ```

4. **Update capabilities**:
   ```json
   // state.json
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
Capturing learnings...
   3 patterns extracted
   2 solutions documented
   Knowledge base updated
```

**Interactive mode**:
```
Learnings captured:

Patterns:
- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Session timeout handling

Solutions:
- Optimized user list query (N+1 → single query)
- Rate limiting middleware

Review captured knowledge? (yes/no)
```

---

## Final Report

### Generate Summary

```
Workflow Complete!

Task: Add user authentication with JWT

Planning:
   Created 8 tasks across 3 phases
   TDD test strategy defined

Implementation:
   8/8 tasks completed
   All tests passing (45 tests)
   Coverage: 85% (target: 80%)
   12 commits

Review:
   Spec compliance: PASS
   Quality score: 8.5/10
   0 P1, 4 P2, 3 P3 issues

Knowledge:
   3 patterns captured
   2 solutions documented

Next: Deploy or continue with next feature?
```

### Next Steps

**Suggest**:
- Merge to main (if on feature branch)
- Create PR (if using pull requests)
- Deploy (if ready)
- Start next task: `/mycelium-go [next-task]`

---

## State Management

Throughout execution, maintain state in `state.json`:

```json
{
  "current_track": "auth_20260204",
  "current_phase": "implementation",
  "current_task": "1.3",
  "mode": "autonomous",
  "plans": [
    {
      "track_id": "auth_20260204",
      "plan_file": "2026-02-04-auth_20260204.md",
      "status": "in_progress",
      "created": "2026-02-04T10:15:00Z",
      "total_tasks": 8,
      "completed_tasks": 2
    }
  ],
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
- After each phase completion (update `plans[]` entry with task progress)
- After each task completion
- Before asking user questions
- On error/blocker

**Resume support**:
If interrupted, can resume from last checkpoint using `/mycelium-continue`. Use `/mycelium-continue --full` to force full workflow mode regardless of how the workflow was originally started.

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
Planning failed: {reason}

Cannot proceed without plan.
Stopping.

Suggested: Clarify requirements and retry
```

**Implementation blocked**:
```
Implementation blocked: {reason}

Completed: 5/8 tasks
Blocked on: Task 1.6 (missing API key)

Saving state...
Resume with: /mycelium-continue
```

**Review finds P1 issues**:
```
Review FAILED: 2 critical (P1) issues

P1 Issues:
1. SQL injection vulnerability
2. Hardcoded credentials

These MUST be fixed before merge.

Stopping for fixes.
```

**Knowledge capture fails**:
```
Knowledge capture failed: {reason}

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

## Skills Used

- **mycelium-plan**: Requirements → tasks
- **tdd**: RED → GREEN → REFACTOR enforcement
- **verification**: Evidence-based validation
- **mycelium-review**: Two-stage quality check
- **mycelium-capture**: Knowledge extraction

## Quick Examples

```bash
# Feature development
/mycelium-go "Add user authentication"

# Debugging
/mycelium-go "Fix memory leak in session handler"

# Investigation / Question
/mycelium-go "Why does the API return 500 on concurrent requests?"

# Optimization
/mycelium-go "Optimize database queries" --interactive

# Detailed description
/mycelium-go "Add pagination to user list API with page size limits"
```

## Mode Comparison

**Autonomous** (default):
```
Planning... done
Working... done (5 tasks, parallel)
Reviewing... done (0 P1, 2 P2, 3 P3)
Capturing... done
Complete!
```

**Interactive** (`--interactive`):
```
Plan created
Approve? → yes
Tasks complete
Review? → yes
2 P2 issues
Fix now? → accept
Learnings captured
Complete!
```

## Success Criteria

Workflow is successful when:
- [ ] Plan created and approved
- [ ] All tasks completed with passing tests
- [ ] Coverage meets target
- [ ] No P1 issues in review
- [ ] Learnings captured
- [ ] State saved for resume capability
- [ ] User informed of completion and next steps

## Important

- **Saves state frequently** - Enable resume on interruption
- **Evidence-based** - All decisions verified with actual output
- **TDD mandatory** - No code without tests first
- **Stops on P1** - Critical issues block completion
- **Captures knowledge** - Builds compounding intelligence
- **Respect user preferences** - Check workflow.md for policies
- **Be transparent** - Show what's happening
- **Fail gracefully** - Clear error messages, suggest fixes
- **Resume with `/mycelium-continue`** - If interrupted, `/mycelium-continue` resumes all remaining phases automatically (since `/mycelium-go` sets `invocation_mode: "full"`)
- **`--full` flag** - When resuming a single-phase skill (e.g., `/mycelium-work`), use `/mycelium-continue --full` to run all remaining phases instead of just finishing the current one

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [Plan frontmatter schema][plan-schema]
- [Solution frontmatter schema][solution-schema]
- [Progress state schema][progress-schema]
- [Metrics schema][metrics-schema]
- [Enum definitions][enums]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
[plan-schema]: ../../schemas/plan-frontmatter.schema.json
[solution-schema]: ../../schemas/solution-frontmatter.schema.json
[progress-schema]: ../../schemas/progress-state.schema.json
[metrics-schema]: ../../schemas/metrics.schema.json
[enums]: ../../schemas/enums.json

## Examples

### Example 1: Building a New Feature
**User request:** "build user authentication with JWT"

**Workflow:**
1. **Planning** - Clarifies: OAuth vs JWT (user chose JWT), registration included, password requirements
2. **Creates plan** - 8 tasks across 3 phases with TDD breakdown
3. **Implementation** - Executes tasks with RED→GREEN→REFACTOR cycle
4. **Review** - Two-stage review finds 0 P1, 2 P2 issues (noted for later)
5. **Capture** - Extracts JWT pattern, saves to solutions library

**Result:** Feature implemented, tested (85% coverage), reviewed, and knowledge captured in 45 minutes.

### Example 2: Debugging an Issue
**User request:** "fix memory leak in session handler"

**Workflow:**
1. **Investigation** - Profiles memory usage, identifies leak source
2. **Planning** - Creates focused plan: reproduce, fix, verify, prevent
3. **Implementation** - Adds test reproducing leak, fixes issue, verifies
4. **Review** - Confirms fix, checks for similar patterns
5. **Capture** - Documents leak pattern and prevention in anti-patterns

**Result:** Memory leak fixed, test added, pattern documented for future prevention.

### Example 3: Technical Question
**User request:** "Why does the API return 500 on concurrent requests?"

**Workflow:**
1. **Investigation** - Analyzes logs, identifies race condition
2. **Explanation** - Provides root cause analysis  
3. **Solution plan** - Proposes locking strategy
4. **Implementation** - User approves, implements fix
5. **Capture** - Documents concurrency pattern

**Result:** Question answered with actionable solution and implementation completed.

## Troubleshooting

**Error:** "Planning failed: Requirements unclear"
**Cause:** Ambiguous request with multiple valid interpretations
**Solution:** mycelium-go stops to ask clarifying questions. Answer them to proceed.

**Error:** "Tests failing after 3 attempts"
**Cause:** Implementation approach has fundamental issue
**Solution:** Check error logs in progress.md. Consider simplifying approach or using `/recovery` for systematic debugging.

**Error:** "Review FAILED: 2 critical (P1) issues"
**Cause:** Security vulnerabilities or critical bugs found
**Solution:** P1 issues must be fixed before merge. Review findings, implement fixes, re-run review.

**Error:** "No .mycelium directory found"
**Cause:** Project not initialized
**Solution:** Run `/mycelium-setup` first to bootstrap project structure.

**Blocked:** "Task 2.3 blocked: Waiting for API key"
**Cause:** External dependency missing
**Solution:** Provide required information, then run `/mycelium-continue` to resume.
