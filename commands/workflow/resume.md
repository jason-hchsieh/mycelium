---
name: workflow:resume
description: Resume interrupted workflow from last checkpoint
argument-hint: ""
allowed-tools: ["Skill", "Read", "Bash"]
---

# Workflow Resume

Resume work from the last saved checkpoint after interruption.

## Your Task

1. **Load session state**:
   - Read `.workflow/state/session_state.json`
   - Identify last activity and checkpoint
   - Check for uncommitted work or stashes

2. **Determine resume point**:
   - If in setup → Load `setup` skill, resume from checkpoint
   - If in planning → Load `planning` skill, resume from last question
   - If in work → Load `tdd` + `verification` skills, continue from last task
   - If in review → Load `review` skill, resume appropriate stage

3. **Load appropriate skill** based on interruption point

4. **Restore context**:
   - Load `.workflow/state/progress.md` for summary
   - Show what was completed
   - Show what's in progress
   - Show known blockers or issues

5. **Execute** following the loaded skill to continue work

## Skills Used

Varies based on interruption point:
- **setup** (if interrupted during setup)
- **planning** (if interrupted during planning)
- **tdd** + **verification** (if interrupted during work)
- **review** (if interrupted during review)
- **orchestration** (if interrupted during `/workflow:go`)

## Quick Example

```bash
/workflow:resume
# Analyzes state, shows summary, continues from checkpoint
```

## Important

- **Verifies test baseline** - Runs tests before continuing (must pass)
- **Handles uncommitted work** - Shows uncommitted changes, offers to stash or keep
- **Context efficient** - Loads summary from progress.md, not full history
- **Safe defaults** - When uncertain, asks user before proceeding
