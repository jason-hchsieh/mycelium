---
name: workflow:continue
description: Resume interrupted workflow from last checkpoint
argument-hint: "[--full]"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep", "Task", "AskUserQuestion"]
---

# Workflow Continue

Resume interrupted work with context-aware scope detection.

## Your Task

1. **Parse arguments**:
   - `--full`: Override to full mode — run all remaining phases to completion regardless of original invocation

2. **Load session state**:
   - Read `.workflow/state/session_state.json`
   - Identify `current_phase`, checkpoints, and `invocation_mode`
   - If no state found → error: "No workflow state found. Start with `/workflow:go` or `/workflow:plan`."

3. **Restore mid-phase context**:
   - Read `.workflow/state/progress.md` for completed work summary
   - Check for uncommitted work (`git status`) or stashes (`git stash list`)
   - Show what was completed, what's in progress, and known blockers

4. **Determine continuation scope**:

   | Condition | Behavior |
   |-----------|----------|
   | `--full` flag provided | Load orchestration skill, resume current phase, chain through ALL remaining phases to end |
   | `invocation_mode == "full"` (started via `/workflow:go`) | Load orchestration skill, resume current phase, chain through ALL remaining phases to end |
   | `invocation_mode == "single"` (started via `/workflow:[phase]`) | Load appropriate phase skill, finish current phase ONLY |
   | No `invocation_mode` in state | Treat as `"single"` — finish current phase only |

5. **Load appropriate skill and execute**:

   **Full mode** (orchestration):
   - Load `workflow/orchestration` skill
   - Resume from current phase checkpoint
   - Chain through remaining phases: plan → work → review → capture

   **Single mode** (phase-specific):
   - Map `current_phase` to skill:
     - `planning` → Load `workflow/planning` skill
     - `implementation` → Load `workflow/tdd` + `workflow/verification` skills
     - `review` → Load `workflow/review-process` skill
     - `capture` → Load `workflow/solution-capture` skill
   - Resume from checkpoint within that phase
   - Stop after phase completion

6. **Final report**: Summarize what was resumed and completed

## Skills Used

Varies based on continuation scope:

**Full mode**:
- **orchestration**: Phase management, chaining through remaining phases

**Single mode** (one of):
- **planning**: If interrupted during plan phase
- **tdd** + **verification**: If interrupted during work phase
- **review-process**: If interrupted during review phase
- **solution-capture**: If interrupted during capture phase

## Quick Examples

```bash
# Resume with context-aware scope (finishes what was originally started)
/workflow:continue

# Override to full mode — run all remaining phases regardless
/workflow:continue --full
```

## Behavior Summary

| Original command | `/workflow:continue` | `/workflow:continue --full` |
|-----------------|---------------------|---------------------------|
| `/workflow:go` | Resume → finish all remaining phases | Same |
| `/workflow:plan` | Resume → finish plan phase only | Resume → finish all remaining phases |
| `/workflow:work` | Resume → finish work phase only | Resume → finish all remaining phases |
| `/workflow:review` | Resume → finish review phase only | Resume → finish all remaining phases |
| `/workflow:capture` | Resume → finish capture phase only | Resume → finish all remaining phases |

## Important

- **Context-aware** - Automatically detects whether to resume single phase or full workflow
- **`--full` override** - Forces full orchestration mode regardless of original invocation
- **Verifies test baseline** - Runs tests before continuing (must pass)
- **Handles uncommitted work** - Shows uncommitted changes, offers to stash or keep
- **Context efficient** - Loads summary from progress.md, not full history
- **Safe defaults** - When uncertain, asks user before proceeding
