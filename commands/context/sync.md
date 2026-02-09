---
name: context-sync
description: Manages context window during Phase 4.5B by summarizing completed work, updating progress checkpoints, and spawning fresh agents when context exceeds thresholds. Use after each task completion in long sessions or when context usage is high.
argument-hint: "[optional: force-spawn]"
allowed-tools: ["Read", "Write", "Grep", "Bash", "Glob"]
---

You are executing the **/workflow:context-sync** command for context window management during Phase 4.5B.

## Purpose

Manage context window efficiently in long sessions by:
1. Summarizing completed work (≤500 tokens per task)
2. Creating/updating progress checkpoints in `.workflow/state/progress.md`
3. Monitoring context usage levels
4. Spawning fresh agent with compressed context when >80% used

## Context Management Protocol

### Step 1: Assess Context Usage

Check current context state:
- Estimate tokens used in current session
- Calculate usage percentage of context window
- Determine if compression or fresh spawn needed

**Thresholds:**
- **<50% used**: Continue normally, no action needed
- **50-80% used**: Compress non-essential context
- **>80% used**: Spawn fresh agent with handoff notes
- **force-spawn argument**: Always spawn fresh agent regardless of usage

### Step 2: Load Current State

Read existing progress and session state:

```bash
# Read current progress file
cat .workflow/state/progress.md

# Read session state
cat .workflow/state/session_state.json

# Check recent commits
git log --oneline -10

# Check current plan status
cat .workflow/plans/*.md | grep -E "\[(x|~| )\]"
```

### Step 3: Compress Completed Work

For each completed task since last sync:

**Summarize (≤100 words per task):**
- Task ID and description
- Key implementation details
- Commit SHA
- Any decisions made
- Files changed (list only)

**Format:**
```markdown
### ✅ Task X.Y: Brief title (commit-sha)
One paragraph summary focusing on what was done and key decisions.
Do NOT include verbose details or full code changes.
```

### Step 4: Update Progress File

Write or update `.workflow/state/progress.md`:

**Required Sections:**

```markdown
# Session Progress

## Current State
**Track:** {track_id}
**Phase:** {current_phase}
**Task:** {current_task_id} - {task_name}
**Status:** {in_progress|pending|blocked}
**Worktree:** {worktree_path}
**Branch:** {branch_name}
**Context Usage:** {percentage}%
**Last Sync:** {timestamp}

## Completed Tasks

{Compressed summaries of all completed tasks}

## Current Task Details

### Task {id}: {name}
**File:** {primary_file}
**Status:** {status}
**Started:** {timestamp}

**What's Done:**
- {bullet points}

**What's Next:**
- {bullet points}

**Blockers:** {None or list}

## Key Decisions Made

### Decision N: {title}
**When:** Task X.Y
**Why:** {brief rationale}
**Trade-off:** {one-line trade-off}

## Next Up

- [ ] Task {id}: {description}
- [ ] Task {id}: {description}

## Known Issues

### Issue N: {title}
{Brief description}
**Impact:** {Low|Medium|High}
**Priority:** {P1|P2|P3}

## Architecture Context

- Language: {language}
- Framework: {framework}
- Database: {database}
- Test: {test_framework}
- Coverage target: {target}% (currently {current}%)

## Recent Changes Summary

**Last 3 commits:**
- {sha}: {message}
- {sha}: {message}
- {sha}: {message}

**Test Status:** {passing_count}/{total_count}
**Coverage:** {percentage}%
**Linting:** {Clean|Issues}
```

**Keep it concise:**
- Total file: ≤2000 words
- Each task summary: ≤100 words
- Each decision: ≤50 words
- Focus on WHAT and WHY, not HOW

### Step 5: Create Checkpoint

Save checkpoint metadata to `.workflow/state/checkpoints/`:

```json
{
  "checkpoint_id": "checkpoint_{timestamp}",
  "phase": "{current_phase}",
  "task": "{current_task_id}",
  "timestamp": "{ISO_8601_timestamp}",
  "git_sha": "{current_commit_sha}",
  "progress_file": ".workflow/state/progress.md",
  "session_summary": "{one_line_summary}",
  "next_phase": "{next_phase_description}",
  "context_usage_estimate": {percentage},
  "tasks_completed": {count},
  "decisions_made": {count}
}
```

### Step 6: Update Session State

Update `.workflow/state/session_state.json`:

```json
{
  "last_sync": "{timestamp}",
  "context_usage": {percentage},
  "checkpoint_count": {count},
  "sync_count": {count},
  "last_checkpoint": "{checkpoint_id}",
  "context_compressions": {count}
}
```

### Step 7: Determine Next Action

Based on context usage:

**<50% used:**
```
✓ Context sync complete
  - Progress saved to .workflow/state/progress.md
  - Checkpoint created: checkpoint_{id}
  - Context usage: {percentage}% (healthy)
  - Ready to continue work
```

**50-80% used:**
```
⚠ Context compression applied
  - Progress compressed and saved
  - Checkpoint created: checkpoint_{id}
  - Context usage: {percentage}% (compressed)
  - Non-essential details removed
  - Ready to continue with clean context
```

**>80% used OR force-spawn:**
```
🔄 Fresh agent required
  - Progress saved to .workflow/state/progress.md
  - Handoff notes prepared
  - Context usage: {percentage}% (critical)

  TO CONTINUE WORK:
  1. Spawn fresh agent (new session)
  2. Provide: .workflow/state/progress.md
  3. Fresh agent reads progress and resumes

  HANDOFF NOTES:
  - Track: {track_id}
  - Phase: {phase}
  - Next task: {task_id}
  - Current worktree: {path}
  - Known blockers: {list or None}
```

## Integration with Context Skill

This command implements the procedures from the **Context Window Management** skill:
- Load skill: `adaptive-workflow:context`
- Reference: `${CLAUDE_PLUGIN_ROOT}/skills/context/SKILL.md`
- Apply thresholds, compression techniques, and handoff protocols from skill

**Key principles from skill:**
1. Context is finite, manage deliberately
2. Update progress after each task
3. Compress at 50%, spawn fresh at 80%
4. Task summaries ≤100 words
5. Decisions ≤50 words
6. Total progress ≤2000 words

## Signs That Sync Is Needed

Watch for these indicators:

**Agent Confusion:**
- Asking same question twice
- Modifying wrong files
- Forgetting recent decisions
- Mixing up task context

**Context Fragmentation:**
- Long responses with repeated information
- Difficulty maintaining focus
- Tangential discussions
- Loss of task tracking

**Memory Gaps:**
- Redoing completed work
- Not recalling recent decisions
- Asking about covered topics

**Action:** Run /workflow:context-sync immediately

## Error Handling

**Progress file doesn't exist:**
- Create new progress file from session state
- Initialize with current track/phase/task info
- Warn that no history available

**Session state corrupted:**
- Reconstruct from git log and plan file
- Create new session state
- Note reconstruction in progress file

**Cannot determine context usage:**
- Default to conservative estimate
- Recommend sync anyway
- Note uncertainty in checkpoint

**Git state unclear:**
- Show git status
- Ask user to clarify current state
- Do not proceed until confirmed

## Output Format

```markdown
## Context Sync Report

**Context Usage:** {percentage}% ({status})
**Action Taken:** {compression|fresh_spawn|none}

### Progress Checkpoint
- File: .workflow/state/progress.md
- Checkpoint: checkpoint_{id}
- Tasks completed: {count}
- Decisions captured: {count}

### Context Health
- Before sync: {before}%
- After sync: {after}%
- Tokens saved: ~{estimate}

### Session Stats
- Total syncs: {count}
- Total checkpoints: {count}
- Fresh spawns: {count}

{If fresh spawn needed:}
### Fresh Agent Handoff
📋 Handoff notes prepared in progress.md
🎯 Next task: {task_id}
⚠️ Known blockers: {list or None}
✓ Ready for fresh agent spawn
```

## Best Practices

**Do:**
- Sync after each task completion in long sessions
- Compress early (at 50%) to prevent emergency spawns
- Keep progress file concise and focused
- Document key decisions immediately
- Create checkpoints at phase boundaries

**Don't:**
- Wait until context exhausted (>80%)
- Carry full conversation history indefinitely
- Skip progress file updates
- Compress current task context
- Lose critical decisions in compression

## Command Arguments

**No arguments:**
```bash
/workflow:context-sync
```
Auto-detect context usage and take appropriate action.

**Force fresh spawn:**
```bash
/workflow:context-sync force-spawn
```
Always prepare fresh agent handoff regardless of context usage.

## Related Commands

- `/workflow:metrics` - View session metrics including sync stats
- `/workflow:status` - Check current workflow state
- `/workflow:continue` - Resume work from progress file after fresh spawn

## Exit Conditions

**Success:** Progress saved, checkpoint created, action taken based on threshold
**Blocked:** Cannot determine state, user confirmation needed
**Error:** File write failure, git state unclear

Always report status clearly and indicate whether work can continue immediately or requires fresh spawn.
