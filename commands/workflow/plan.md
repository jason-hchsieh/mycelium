---
name: workflow:plan
description: Create detailed implementation plan with task breakdown (Phase 2/3). Applies smart research gate, breaks work into 2-5 minute atomic tasks with dependencies, creates living plan document with checkbox markers.
argument-hint: "[task description]"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebSearch"]
---

# Workflow Plan Command

Create a detailed, actionable implementation plan. This covers Phase 1 (Clarify), Phase 1.5 (Smart Research), Phase 2 (Discover), and Phase 3 (Planning).

## Your Task

Transform the user's request into a structured, executable plan.

### Phase 1: Clarify Requirements

1. **Understand Intent:**
   - What is the user asking for?
   - What are the success criteria?
   - What are the scope boundaries?

2. **Identify Ambiguities:**
   - Ask clarifying questions ONE at a time
   - Define acceptance criteria
   - Classify task size: T (trivial) / S (small) / M (medium) / L (large)
   - Assign track type: feature / bug / chore / refactor

3. **Loop Until Clear:**
   - Do not proceed until requirements are unambiguous
   - Confirm your understanding with the user

### Phase 1.5: Smart Research Gate

Decide whether to research externally based on these criteria:

**ALWAYS research if:**
- High-risk domain (security, payments, data privacy)
- Working with regulated systems (healthcare, finance)

**Research externally if:**
- No local context exists (first time doing X)
- CLAUDE.md lacks guidance on this topic
- `.workflow/solutions/` has no relevant prior solutions
- High uncertainty about approach

**Skip external research if:**
- Strong patterns exist in codebase (grep finds examples)
- CLAUDE.md provides clear guidance
- `.workflow/solutions/` has relevant learnings
- Task follows established conventions

**Research Strategy:**
1. First: `grep` codebase for existing patterns
2. Second: Check `.workflow/solutions/` for prior learnings
3. Third: Read CLAUDE.md and `.workflow/context/` files
4. Only if still uncertain: Use WebSearch for external research

### Phase 2: Discover Capabilities

Check what tools and skills are available:

1. **Load Discovered Capabilities:**
   - Read `.workflow/state/session_state.json` → `.discovered_capabilities`
   - Check for relevant skills from any installed plugin
   - Identify applicable agents (review agents, learning agent, etc.)

2. **Skill Check (MANDATORY):**
   - For every task type, check: "Do any skills apply?"
   - If skill exists for this work, you MUST use it
   - Skills include: tdd, planning, verification, solution-capture, context, recovery

3. **Agent Assignment:**
   - Assign appropriate agents to tasks
   - Use specialized reviewers for review tasks
   - Use learning-agent for knowledge capture tasks
   - Default to general-purpose for most implementation

### Phase 3: Create the Plan

Generate a detailed plan document following this structure:

#### Plan Document Template

Save to `.workflow/plans/YYYY-MM-DD-{track-id}.md`:

```markdown
---
track_id: {feature-name}_{YYYYMMDD}
track_type: feature|bug|chore|refactor
size: T|S|M|L
created: YYYY-MM-DDT09:00:00Z
status: pending
total_tasks: {count}
completed_tasks: 0
---

# {Track Title}

## Overview
{1-2 paragraph description of what's being built and why}

## Success Criteria
- [ ] {Measurable outcome 1}
- [ ] {Measurable outcome 2}
- [ ] {Measurable outcome 3}

## Phase 1: {Phase Name}

### Task 1.1: {Task Title}
**Status:** [ ]
**Complexity:** T|S|M|L
**blockedBy:** []
**blocks:** [1.2, 2.1]
**agent:** general-purpose
**skills:** [tdd, verification]
**model:** sonnet

**Description:**
{What needs to be done}

**Files:**
- {/absolute/path/to/file1.ts}
- {/absolute/path/to/file2.ts}

**Acceptance Criteria:**
- [ ] {Criterion 1}
- [ ] {Criterion 2}

**Test Plan:**
- {How to verify - specific commands}

### Task 1.2: {Next Task}
...

---
**Phase 1 Verification:**
- [ ] All tests pass
- [ ] Coverage ≥ 80%
- [ ] User approval

**Checkpoint:** {SHA when phase complete}

## Phase 2: {Phase Name}
...

## Deviations Log
{Track changes from original plan - updated during execution}

## Final Checklist
- [ ] All tests passing
- [ ] Code coverage ≥ target
- [ ] Code review complete (if required)
- [ ] Documentation updated
- [ ] No linting errors
```

#### Task Breakdown Guidelines

**Size Classification:**
- **T (Tiny):** < 50 lines, single file, < 30 min, no dependencies
- **S (Small):** 50-200 lines, 1-2 files, 30-120 min, minimal integration
- **M (Medium):** 200-500 lines, 2-5 files, 2-8 hours, some integration
- **L (Large):** > 500 lines, 5+ files, > 8 hours → SPLIT INTO SMALLER TASKS

**Each Task Must Have:**
- Clear, specific description
- Exact file paths (absolute paths)
- Acceptance criteria (measurable)
- Test plan with specific commands
- Complexity rating
- Dependency relationships (blockedBy, blocks)
- Agent assignment
- Required skills

**Dependency Management:**
- Use `blockedBy: []` for tasks that can start immediately
- Use `blockedBy: [1.1, 1.2]` for tasks waiting on others
- Use `blocks: [2.1, 2.3]` to indicate what depends on this task
- Minimize dependencies to enable maximum parallelism
- Only declare TRUE blocking dependencies

**Test Strategy (TDD):**
- Define test cases FIRST before implementation
- Specify test framework and commands
- Set coverage targets (default ≥80%)
- Include both unit and integration test plans

#### Model Selection Per Task

Assign appropriate model tier:
- **opus:** Complex architecture decisions, high-risk changes
- **sonnet:** Most implementation tasks, reviews
- **haiku:** Simple changes, style fixes, documentation

### Phase 3B: Present Plan to User

1. Show the complete plan
2. Highlight key decisions and tradeoffs
3. Present 2-3 alternative approaches if applicable
4. Ask for user approval or revisions
5. Do NOT proceed to implementation without approval

### Phase 3C: Save the Plan

- Write plan to `.workflow/plans/YYYY-MM-DD-{track-id}.md`
- Update `session_state.json` with track information
- Confirm plan is saved and ready for execution

## Plan Markers

Use these checkbox markers (they'll be updated in-place during execution):

- `[ ]` - Pending (not started)
- `[~]` - In Progress (currently working)
- `[x]` - Complete (finished and verified)
- `[-]` - Skipped (intentionally not doing)
- `[!]` - Blocked (waiting on dependency/decision)

## Error Handling

- If requirements unclear: Ask questions, do not assume
- If task too large: Break it down further (no task >8 hours)
- If circular dependencies detected: Restructure task order
- If no clear test strategy: This is a blocker - cannot proceed without tests
- If user requests skipping tests: Explain why TDD is mandatory, offer flexible alternatives

## Skills to Reference

- **planning**: Core skill for this command - provides detailed guidance
- **tdd**: Must be applied to all code implementation tasks
- **context**: For loading project context and prior solutions
- **recovery**: For handling blockers and uncertainties

## Important Notes

- Plans are LIVING DOCUMENTS - updated in-place during execution
- Every task must be independently verifiable
- Default to parallel execution - minimize dependencies
- Include exact file paths (absolute, not relative)
- Test strategy is mandatory, not optional
- Do NOT start implementation - this command only creates the plan
- Inform user to use `/workflow:work` to execute the plan
