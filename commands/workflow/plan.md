---
name: workflow:plan
description: Create implementation plan with task breakdown
argument-hint: "[task description]"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Glob", "Grep", "AskUserQuestion"]
---

# Workflow Plan

Transform user request into structured, executable plan with TDD task breakdown.

## Your Task

1. **Load the planning skill** - Use Skill tool to load `workflow/planning`

2. **Parse input**:
   - If user provided task description: Use it
   - If empty: Ask user for task description

3. **Provide context**:
   - Read `.workflow/state/session_state.json`
   - Read `.workflow/context/*.md` (product, tech-stack, workflow)
   - Read `CLAUDE.md` if exists

4. **Execute planning workflow** - Follow the loaded `planning` skill which handles:
   - Requirements clarification (Phase 1) using AskUserQuestion
   - Smart research gate (Phase 1.5) - grep codebase before web search
   - Capability discovery (Phase 2) - check available skills/agents
   - Task breakdown and plan creation (Phase 3) - TDD-driven tasks with dependencies

5. **Save plan** to `.workflow/plans/YYYY-MM-DD-{track-id}.md`

6. **Update session state** with track information

7. **Next step**: Suggest `/workflow:work` to execute the plan

## Skills Used

- **planning**: Core planning workflow (clarify → research → discover → plan)
- **context**: For loading project knowledge
- **tdd**: Referenced during task breakdown

## Quick Example

```bash
/workflow:plan "Add user authentication"
# Creates plan with TDD tasks, dependencies, test strategy

/workflow:plan "Optimize database queries"
# Analyzes existing code, creates performance-focused plan
```

## Important

- Plans are LIVING DOCUMENTS - updated in-place during execution
- All tasks follow TDD: tests before implementation
- Tasks have explicit dependencies (blockedBy/blocks)
- Default to parallel execution - minimize dependencies
