---
name: workflow:go
description: Execute full workflow autonomously (plan → work → review → capture)
argument-hint: "[task description] [--interactive]"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep", "Task", "AskUserQuestion"]
---

# Workflow Go

Execute the complete mycelium workflow autonomously from planning to knowledge capture.

## Your Task

1. **Parse arguments**:
   - `task description`: What to build/fix/optimize
   - `--interactive`: Enable human approval at each phase (default: autonomous)

2. **Update session state** - Write `invocation_mode: "full"` to `.workflow/state/session_state.json`

3. **Load the orchestration skill** - Use Skill tool to load `workflow/orchestration`

4. **Execute full workflow** - Follow orchestration skill which handles:

   **Phase 1: Plan**
   - Load `planning` skill
   - Clarify requirements (only if ambiguous)
   - Create task breakdown with TDD strategy
   - Autonomous: Auto-proceed if clear | Interactive: Show plan, ask approval

   **Phase 2: Work**
   - Load `tdd` + `verification` skills
   - Execute all tasks following RED → GREEN → REFACTOR
   - Run in parallel where possible (automatic worktrees)
   - Autonomous: Auto-continue unless blocked | Interactive: Show progress, ask to continue

   **Phase 3: Review**
   - Load `review-process` skill
   - Run two-stage review (spec + quality)
   - Autonomous: Accept P2/P3, stop on P1 | Interactive: Ask whether to fix or accept

   **Phase 4: Capture**
   - Load `solution-capture` skill
   - Extract learnings and patterns
   - Update knowledge base
   - Autonomous: Auto-capture and report | Interactive: Show captured knowledge

5. **Final report**: Summarize completed work, test results, captured learnings

## Skills Used

- **orchestration**: Phase management, decision gates, autonomous execution
- **planning**: Requirements → tasks
- **tdd**: RED → GREEN → REFACTOR enforcement
- **verification**: Evidence-based validation
- **review-process**: Two-stage quality check
- **solution-capture**: Knowledge extraction

## Quick Examples

```bash
# Autonomous mode (minimal interaction)
/workflow:go "Add user authentication"

# Interactive mode (approval at each phase)
/workflow:go "Optimize database queries" --interactive

# Detailed description
/workflow:go "Add pagination to user list API with page size limits"
```

## Decision Gates

**When to STOP and ask** (even in autonomous mode):
- Ambiguous requirements (multiple valid interpretations)
- High-risk changes (security, payments, data)
- P1 issues found in review
- Tests failing after 3 fix attempts
- Architectural decision needed

**When to AUTO-PROCEED** (autonomous mode):
- Requirements are clear and specific
- Plan has no blockers
- All tests pass
- Only P2/P3 review issues
- Patterns exist in codebase

## Mode Comparison

**Autonomous** (default):
```
🤖 Planning... ✓
🤖 Working... ✓ (5 tasks, parallel)
🤖 Reviewing... ✓ (0 P1, 2 P2, 3 P3)
🤖 Capturing... ✓
✅ Complete!
```

**Interactive** (`--interactive`):
```
📋 Plan created
❓ Approve? → yes
🔨 Tasks complete
❓ Review? → yes
📊 2 P2 issues
❓ Fix now? → accept
📚 Learnings captured
✅ Complete!
```

## Important

- **Saves state frequently** - Enable resume on interruption
- **Evidence-based** - All decisions verified with actual output
- **TDD mandatory** - No code without tests first
- **Stops on P1** - Critical issues block completion
- **Captures knowledge** - Builds compounding intelligence
- **Resume with `/workflow:continue`** - If interrupted, `/workflow:continue` resumes all remaining phases automatically (since `/workflow:go` sets `invocation_mode: "full"`)
- **`--full` flag** - When resuming a single-phase command (e.g., `/workflow:work`), use `/workflow:continue --full` to run all remaining phases instead of just finishing the current one
