---
name: Context Window Management
description: This skill should be used during Phase 4.5B (Context Sync) when context window usage exceeds 50% (auto-triggers at 80%), after each task completion in long sessions, or when spawning fresh agents. Manages context window efficiently to prevent information loss, enables seamless handoffs between agent instances, and maintains coherence across long-running work.
user-invocable: false
license: MIT
version: 0.9.0
metadata:
  author: Jason Hsieh
  category: context
  tags: [context-management, agent-handoff, long-sessions]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Context Window Management

## Core Principle

**Context is finite. Manage it deliberately to maintain coherence across long sessions and agent handoffs.**

This skill enforces systematic context management because AI agents can accumulate context bloat, lose focus, or hit context limits. Proper management enables long-running sessions and clean agent handoffs without losing critical information.

## When to Use

Apply during Phase 4.5B when:
- Context usage exceeds 50% threshold
- Task completes in long session
- Agent shows signs of confusion
- Preparing to spawn fresh agent
- Resuming work after pause
- Multiple phases completed

Also use when:
- Starting new phase with different focus
- Switching between parallel worktrees
- Escalating to different agent type
- Creating progress checkpoint

## Context Window Thresholds

Monitor context usage and take action:

### < 50% Used: Normal Operation
**Action:** Continue normally
- No special measures needed
- Maintain full context
- Document decisions inline

### 50-80% Used: Compression Phase
**Action:** Compress non-essential context
- Summarize completed tasks (≤500 tokens each)
- Remove redundant information
- Extract key decisions to progress file
- Keep active task context full

### > 80% Used: Fresh Agent Required
**Action:** Spawn fresh agent with compressed context
- Export handoff notes to progress.md
- Compress entire session to ≤2000 tokens
- Fresh agent reads progress file
- Continue work with clean context

## Progress File Format

Maintain `.mycelium/progress.md` for context bridging:

### Structure

```markdown
# Session Progress

## Current State
**Track:** user-auth_20260203
**Phase:** 4 (Implementation)
**Task:** 2.3 - Add password hashing
**Status:** in_progress
**Worktree:** .worktrees/user-auth_20260203
**Branch:** user-auth_20260203

## Completed Tasks

### ✅ Task 1.1: Database schema (abc1234)
Created users table with email, password_hash, status columns.
Migration tested, rolled back, re-applied successfully.
**Key Decision:** Used UUID for user_id instead of serial integer
for better distributed system support.

### ✅ Task 1.2: User model (def5678)
ActiveRecord model with validations. Email uniqueness enforced
at DB and model level. Tests: 8/8 passing.

### ✅ Task 2.1: Registration endpoint (ghi9012)
POST /api/auth/register endpoint created. Validates email format,
password strength. Returns JWT token. Tests: 12/12 passing.

### ✅ Task 2.2: Input validation (jkl3456)
Added Joi schema validation for registration payload.
Rejects invalid emails, weak passwords, missing fields.
Tests: 15/15 passing.

## Current Task Details

### Task 2.3: Add password hashing
**File:** `src/services/auth-service.ts`
**Status:** in_progress
**Started:** 2026-02-03 14:30

**What's Done:**
- Installed bcrypt library (v5.1.0)
- Added hashPassword utility function
- Tests written for hash generation

**What's Next:**
- Implement password comparison function
- Update registration to use hashing
- Verify hash storage in database
- Add tests for password verification

**Blockers:** None

## Key Decisions Made

### Decision 1: JWT over session cookies
**When:** Task 2.1
**Why:** API will be consumed by mobile apps and web,
stateless authentication easier to scale.
**Trade-off:** Must handle token refresh, but gains
horizontal scalability.

### Decision 2: bcrypt over argon2
**When:** Task 2.3
**Why:** Mature library, wide adoption, sufficient security
for current threat model.
**Trade-off:** Argon2 slightly more secure but bcrypt
has better ecosystem support.

## Next Up

- [ ] Task 2.3: Add password hashing (current)
- [ ] Task 2.4: Login endpoint
- [ ] Task 2.5: Token refresh mechanism
- [ ] Task 3.1: Email verification

## Known Issues

### Issue 1: Test database cleanup
Some tests leaving data in test DB. Need to add
afterEach cleanup hook.
**Impact:** Low - tests still pass but slower
**Priority:** P3

## Architecture Context

- Language: TypeScript
- Framework: Express.js
- Database: PostgreSQL
- Auth: JWT with bcrypt
- Test: Jest
- Coverage target: 80% (currently 84%)

## Recent Changes Summary

**Last 3 commits:**
- abc1234: Add users table migration
- def5678: Add User model with validations
- ghi9012: Add registration endpoint

**Test Status:** All passing (47/47)
**Coverage:** 84% (target: 80%)
**Linting:** Clean
```

## Progress File Maintenance

### After Each Task
Update progress file:
1. Move completed task to "Completed" section
2. Add commit SHA and brief summary
3. Document any key decisions made
4. Update "Current Task Details"
5. Refresh "Next Up" list
6. Note any new issues discovered

### Keep It Concise
Each task summary: ≤100 words
Key decisions: ≤50 words each
Total file: ≤2000 words

### Handoff Quality
New agent should be able to:
- Understand what's been done
- Know why decisions were made
- Continue work without asking questions
- Avoid re-doing completed work

## Context Compression Techniques

### Completed Work Summarization

❌ **Verbose (wasteful context):**
```markdown
I started by creating the database migration. First I used
the migration generator to create a new migration file. Then
I added columns for email, password_hash, status, created_at,
and updated_at. After that I ran the migration and it worked.
Then I tested rolling it back and it worked. Then I ran it
again and committed the changes. The tests all passed.
```

✅ **Compressed (preserves essentials):**
```markdown
Created users table migration (5 columns). Tested forward
and rollback. Committed abc1234.
```

### Decision Compression

❌ **Verbose:**
```markdown
We had a long discussion about whether to use JWT or session
cookies. I researched both approaches and found that JWT
has advantages for stateless APIs and works better with
mobile apps. Session cookies have advantages for server-side
rendering and security but require session storage. After
weighing the options we decided JWT was better for this
use case because the API will be consumed by mobile apps.
```

✅ **Compressed:**
```markdown
Chose JWT over sessions for mobile app support and stateless
scalability. Trade-off: must handle refresh, but gains
horizontal scaling.
```

### Code Change Compression

❌ **Verbose:**
```markdown
In the file src/services/auth-service.ts I added a new
function called hashPassword that takes a plain text password
and returns a hashed version using bcrypt. I set the salt
rounds to 10 which is secure enough. I also added another
function called comparePassword that takes a plain password
and a hash and returns whether they match.
```

✅ **Compressed:**
```markdown
Added hashPassword and comparePassword to auth-service
using bcrypt (10 rounds).
```

## Agent Handoff Protocol

When spawning fresh agent:

### 1. Create Handoff Package

Compress session to:
- Current state (track, phase, task)
- Completed work summary (≤100 words per task)
- Key decisions (≤50 words each)
- Current task status and next steps
- Known issues/blockers
- Architecture essentials

Target: ≤2000 tokens total

### 2. Write to Progress File

Save handoff package to `.mycelium/progress.md`

### 3. Spawn Fresh Agent

Provide fresh agent with:
- Progress file path
- Current plan file
- Critical patterns file
- Current task instructions

### 4. Fresh Agent Initialization

Fresh agent must:
- Read progress file completely
- Understand context
- Verify current state (git status, branch, etc.)
- Confirm next action before proceeding

## Signs of Context Issues

Watch for these indicators:

### Agent Confusion
**Symptoms:**
- Asking same question twice
- Modifying wrong files
- Forgetting recent decisions
- Mixing up task context

**Action:** Create checkpoint, spawn fresh agent

### Context Fragmentation
**Symptoms:**
- Long responses with repeated information
- Difficulty maintaining focus
- Tangential discussions
- Loss of task tracking

**Action:** Compress context, refocus on current task

### Memory Gaps
**Symptoms:**
- Redoing completed work
- Not recalling recent decisions
- Asking about covered topics

**Action:** Update progress file, provide explicit reminder

## Context Checkpoints

Create checkpoints at phase boundaries:

### Checkpoint Contents
```json
{
  "checkpoint_id": "checkpoint_20260203_143000",
  "phase": 4,
  "task": "2.3",
  "timestamp": "2026-02-03T14:30:00Z",
  "git_sha": "abc1234",
  "progress_file": ".mycelium/progress.md",
  "session_summary": "Completed auth foundation tasks 1.1-2.2",
  "next_phase": "Implementation continues with tasks 2.3-2.5",
  "context_usage_estimate": 65
}
```

### Checkpoint Storage
Save to `.mycelium/checkpoints/`:
- `checkpoint_20260203_143000.json`
- Link from progress.md
- Reference in state.json

## Context-Aware Task Assignment

Consider context when assigning tasks:

### Fresh Agent (Clean Context)
**Best for:**
- Complex reasoning tasks
- Architecture decisions
- Novel problem solving
- Long implementation tasks

### Experienced Agent (Rich Context)
**Best for:**
- Continuing current work
- Quick iterations
- Related tasks
- Context-dependent decisions

### Context Too Large
**Don't assign:**
- New major features
- Unrelated tasks
- Tasks requiring focus shift
- Complex debugging

## Parallel Worktree Context

Each worktree maintains separate context:

### Per-Worktree Progress
```
.worktrees/
├── task-1-1/
│   └── .mycelium/progress.md  # Task 1.1 context
├── task-1-2/
│   └── .mycelium/progress.md  # Task 1.2 context
└── task-2-1/
    └── .mycelium/progress.md  # Task 2.1 context
```

### Context Isolation Benefits
- Each agent focused on single task
- No context pollution between tasks
- Clean handoff per worktree
- Parallel execution without interference

### Context Merging on Merge
When merging worktree:
- Extract key decisions
- Update main progress.md
- Archive worktree progress
- Clean up temporary context

## Long Session Strategy

For sessions spanning multiple phases:

### Hour 1-2: Full Context
- Maintain complete context
- Document decisions inline
- Build understanding

### Hour 2-4: Begin Compression
- Summarize completed work
- Extract decisions to progress file
- Maintain focus on current phase

### Hour 4+: Aggressive Management
- Compress all completed phases to ≤500 words
- Keep only current task context detailed
- Consider fresh agent for new phase

### Multi-Day Sessions
- Always start fresh agent
- Read progress file
- Verify state before proceeding
- Don't assume continuity

## Context Recovery

If context is lost or corrupted:

### Recovery Sources
1. **Progress file** - Explicit handoff notes
2. **Plan file** - Task status markers
3. **Git log** - Commit history and messages
4. **Session state** - JSON tracking file
5. **Solutions** - Captured learnings

### Recovery Process
1. Read progress.md for recent state
2. Check plan file for task status
3. Review git log for recent commits
4. Examine state.json
5. Reconstruct context from evidence

### Prevention
- Update progress file after each task
- Commit frequently with good messages
- Maintain session state
- Create checkpoints at phase boundaries

## Integration with Workflow

**Phase 0: Context Loading**
- Load CLAUDE.md, context files
- Load critical patterns
- Initialize fresh context

**Phase 4: Implementation**
- Monitor context usage
- Update progress after each task
- Check for compression triggers

**Phase 4.5B: Context Sync (THIS SKILL)**
- Compress completed work
- Update progress file
- Create checkpoint if needed
- Spawn fresh agent if >80% used

**Phase 5-6: Final Phases**
- Maintain lean context
- Document only essentials
- Prepare handoff if continuing

## Context Metrics

Track context health:

### Usage Estimation
```json
{
  "estimated_tokens_used": 65000,
  "context_window_size": 100000,
  "usage_percent": 65,
  "tokens_by_category": {
    "system_instructions": 5000,
    "project_context": 8000,
    "conversation_history": 45000,
    "code_context": 7000
  }
}
```

### Compression Impact
```json
{
  "before_compression": 65000,
  "after_compression": 25000,
  "tokens_saved": 40000,
  "information_retained": "high"
}
```

## Best Practices

### Do
- ✅ Update progress file after each task
- ✅ Compress completed work early
- ✅ Create checkpoints at phase boundaries
- ✅ Spawn fresh agent when >80% used
- ✅ Document key decisions immediately
- ✅ Keep current task context full

### Don't
- ❌ Wait until context exhausted
- ❌ Carry full history indefinitely
- ❌ Assume continuity across spawns
- ❌ Skip progress file updates
- ❌ Compress current task context
- ❌ Lose critical decisions

## Summary

**Key principles:**
- Context is finite, manage deliberately
- Update progress file after each task
- Compress at 50%, spawn fresh at 80%
- Each task summary ≤100 words
- Key decisions ≤50 words
- Total progress file ≤2000 words
- Fresh agent reads progress for continuity
- Checkpoints at phase boundaries
- Worktrees maintain separate context
- Monitor for confusion signals

Effective context management enables long sessions without information loss and seamless handoffs between agent instances.

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [Progress template][progress-template]
- [Progress state schema][progress-schema]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
[progress-template]: ../../templates/state/progress.md.template
[progress-schema]: ../../schemas/progress-state.schema.json
