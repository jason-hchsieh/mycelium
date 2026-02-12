---
name: mycelium-plan
description: Creates structured implementation plans with TDD task breakdown and dependency management. Use when user says "plan this", "create a plan for [task]", "break down [feature]", "how should we implement [x]", "list all plans", or "switch to [plan]". Supports multi-plan management with parallel execution strategy and systematic task decomposition.
license: MIT
version: 0.9.0
argument-hint: "[task description] | --list | --switch <track_id>"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Glob", "Grep", "AskUserQuestion"]
metadata:
  author: Jason Hsieh
  category: planning
  tags: [planning, tdd, task-decomposition, parallel-execution]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Workflow Plan

Transform user request into structured, executable plan with TDD task breakdown. Also supports listing and switching between multiple plans.

## Your Task

### Route by argument

**If `--list`**: Jump to [List Plans](#list-plans).
**If `--switch <track_id>`**: Jump to [Switch Plan](#switch-plan).
**Otherwise**: Continue with [Create Plan](#create-plan).

---

### Create Plan

1. **Ensure `.mycelium/` exists** - If the [`.mycelium/` directory][mycelium-dir] does not exist, create the minimum bootstrap structure:
   ```
   .mycelium/
   └── state.json
   ```
   Initialize `state.json` per the [session state docs][session-state-docs]. Also add `.mycelium/` to `.gitignore` if not already present.

2. **Update session state** - Write `invocation_mode: "single"` to [state.json][session-state-docs]

3. **Parse input**:
   - If user provided task description: Use it
   - If empty: Ask user for task description

4. **Provide context**:
   - Read [state.json][session-state-docs]
   - Read `.mycelium/context/*.md` if exists (product, tech-stack, workflow)
   - Read `CLAUDE.md` if exists

5. **Analyze the task**:
   - Clarify requirements if ambiguous (use AskUserQuestion)
   - Search codebase for relevant files (`grep`, `glob`)
   - Break down into tasks with dependencies

6. **Create detailed plan** following the guidance below:
   - Transform high-level requirements into actionable, parallel-executable tasks
   - Apply proper task decomposition and dependency management
   - Create plans that enable compound engineering where each task builds knowledge

7. **Save plan** to `.mycelium/plans/YYYY-MM-DD-{track-id}.md` using the [plan template][plan-template]. The frontmatter must conform to the [plan frontmatter schema][plan-schema].

8. **Register plan in session state**:
   - Read `state.json`
   - If a plan in `plans[]` has `status: "in_progress"`, set it to `"paused"` (both in `plans[]` AND in that plan file's YAML frontmatter `status` field)
   - Append new plan entry to `plans[]`:
     ```json
     {
       "track_id": "{track_id}",
       "plan_file": "YYYY-MM-DD-{track-id}.md",
       "status": "in_progress",
       "created": "{timestamp}",
       "total_tasks": {count},
       "completed_tasks": 0
     }
     ```
   - Set `current_track` to the new plan's `{ "id": "{track_id}", "type": "{type}", "plan_file": "..." }`

9. **Next step**: Suggest `/mycelium-work` to execute the plan

---

### List Plans

Display all plans from `state.json` `plans[]` (fall back to globbing `.mycelium/plans/*.md` and reading frontmatter if `plans[]` is missing or empty).

**Output format:**
```
Plans:
 * multi-plan_20260211  in_progress  2/7 tasks  (active)
   auth_20260210        paused       0/5 tasks
   bugfix_20260209      completed    3/3 tasks
```

- `*` marks the active plan (matches `current_track.id`)
- Exclude `preview-` prefixed files unless `--all` is passed
- Sort by `created` descending (newest first)

---

### Switch Plan

Switch the active plan to `<track_id>`:

1. Read `state.json`
2. Find `<track_id>` in `plans[]`. If not found, check `.mycelium/plans/` for a matching file and register it first. If still not found, error: "Plan `<track_id>` not found."
3. Set the current active plan (the one with `status: "in_progress"`) to `"paused"` in both `plans[]` and its plan file frontmatter
4. Set the target plan to `"in_progress"` in both `plans[]` and its plan file frontmatter
5. Update `current_track` to point to the target plan
6. Show confirmation: "Switched to plan `<track_id>`"
7. Suggest `/mycelium-work` or `/mycelium-continue` to resume

---

## Planning Guidance

This section provides comprehensive guidance for creating detailed implementation plans with proper task decomposition and dependency management.

### Plan Structure

Every plan follows this template (stored in `templates/plans/plan.md.template`):

```markdown
---
feature: "Feature Name"
created: YYYY-MM-DD
status: active
complexity: M
estimated_tasks: 5
parallel_capable: true
---

## Overview
[1-2 paragraph description of what's being built and why]

## Success Criteria
[Measurable outcomes that define "done"]

## Phase 1: {Phase Name}

### Task 1.1: {Task Title}
**Status:** [ ]
**Complexity:** T/S/M/L
**blockedBy:** []
**blocks:** [1.2, 2.1]
**agent:** general-purpose
**skills:** [tdd, verification]
**model:** sonnet

**Description:**
[What needs to be done]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Test Plan:**
[How to verify this works]

[More tasks...]

## Phase 2: {Phase Name}
[More phases...]

## Deviations Log
[Track changes from original plan]

## Final Checklist
- [ ] All tests passing
- [ ] Code review complete
- [ ] Documentation updated
```

### Task Complexity Classification

Classify each task using multiple factors:

#### Size Indicators (T/S/M/L)
- **T (Tiny):** < 50 lines, single file, < 30 min
- **S (Small):** 50-200 lines, 1-2 files, 30-120 min
- **M (Medium):** 200-500 lines, 2-5 files, 2-8 hours
- **L (Large):** > 500 lines, 5+ files, > 8 hours (consider splitting)

#### Complexity Factors
Beyond lines of code, consider:

**Integration Points:**
- Count of external systems touched
- API boundaries crossed
- Database schemas modified
- Third-party services integrated

**Domain Novelty:**
- `familiar`: Well-understood domain
- `partially_known`: Some new concepts
- `unknown`: Unfamiliar territory requiring research

**Test Complexity:**
- `unit`: Simple unit tests sufficient
- `integration`: Requires integration tests
- `e2e`: Needs end-to-end testing
- `manual`: Requires manual testing

**Reversibility:**
- `easily_reverted`: Can roll back with git
- `requires_migration`: Database/data changes need migration
- `irreversible`: External effects (emails sent, APIs called)

**Uncertainty:**
- `low`: Clear path forward
- `medium`: Some unknowns
- `high`: Significant research needed

#### Combined Classification

Express as:
```yaml
complexity: M
integration_points: 2
domain_novelty: partially_known
test_complexity: integration
reversibility: requires_migration
uncertainty: medium
```

### Task Dependency Management

Define dependencies for parallel execution:

#### blockedBy Field
Lists tasks that must complete first:
```yaml
blockedBy: [1.1, 1.2]  # Cannot start until 1.1 and 1.2 done
blockedBy: []          # Can start immediately
```

#### blocks Field
Lists tasks that depend on this one:
```yaml
blocks: [2.1, 2.3]  # Tasks 2.1 and 2.3 wait for this
blocks: []          # Nothing depends on this
```

#### Dependency Rules
- Minimize dependencies to maximize parallelism
- Only declare true blocking dependencies
- Prefer loose coupling (shared interfaces over shared implementation)
- Group related tasks in same phase for context efficiency

### Capability Assignment

For each task, specify execution details:

#### Agent Selection
```yaml
agent: general-purpose      # Most tasks
agent: Explore             # Read-only research
agent: Plan                # Architecture planning
agent: Bash                # Git/command operations
agent: workflow:review     # Custom review agents
```

#### Skills Assignment
```yaml
skills: [tdd, verification]              # Core workflow skills
skills: [mycelium-plan, mycelium-capture]     # Planning and learning
skills: [context, recovery]              # Context and error handling
skills: [custom-plugin:custom-skill]     # External plugin skills
```

#### Model Selection
```yaml
model: haiku   # Fast, cheap - trivial tasks, reviews
model: sonnet  # Balanced - most implementation (DEFAULT)
model: opus    # Deep reasoning - architecture, complex problems
```

**Selection Guidelines:**
- **haiku:** Trivial tasks, code reviews, formatting, simple refactoring
- **sonnet:** Default for all implementation work, good balance
- **opus:** Architecture decisions, complex algorithms, critical security

### Phased Organization

Organize tasks into logical phases:

#### Phase 1: Foundation
- Core data models
- Database schema
- Essential utilities
- Base abstractions

#### Phase 2: Implementation
- Feature implementation
- Business logic
- API endpoints
- UI components

#### Phase 3: Integration
- Third-party integrations
- Service connections
- External APIs
- System integration

#### Phase 4: Quality
- Performance optimization
- Security hardening
- Error handling
- Edge cases

#### Phase 5: Finalization
- Documentation
- Deployment scripts
- Monitoring setup
- User guides

**Phase Rules:**
- Tasks within phase can run in parallel (unless explicitly blocked)
- Later phases depend on earlier phases
- Each phase has clear entry/exit criteria

### Estimation Best Practices

#### Avoid Time Estimates
Do NOT provide time estimates ("this will take 2 hours"). Focus on:
- Relative complexity (T/S/M/L)
- Uncertainty level (low/medium/high)
- Dependency relationships
- Actionable breakdowns

#### Uncertainty Quantification
Be explicit about uncertainty:
```yaml
uncertainty: high
research_needed: "Need to investigate library X capabilities"
alternative_approaches: ["Approach A", "Approach B"]
```

#### Historical Calibration
After completing tasks, note:
```yaml
estimated: M
actual: L
deviation_reason: "Underestimated integration complexity"
```

Use deviations to improve future estimates.

### Task Breakdown Techniques

#### Top-Down Decomposition
1. Start with user story or feature
2. Identify major components
3. Break components into modules
4. Break modules into functions
5. Stop at testable units

#### Walking Skeleton
1. Identify end-to-end path
2. Create minimal implementation
3. Add breadth (more paths)
4. Add depth (more features)

#### Vertical Slicing
Create thin slices through all layers:
- Database → API → UI for one field
- Add more fields iteratively
- Each slice is independently deliverable

#### Horizontal Layering
Build one layer completely:
- All database models
- Then all API endpoints
- Then all UI components

**Recommendation:** Prefer vertical slicing for faster feedback.

### Parallel Execution Planning

Design for maximum parallelism:

#### Independent Tasks
Tasks with no shared dependencies can run in parallel:
```yaml
Task 1.1: User authentication API
  blockedBy: []

Task 1.2: Product catalog API
  blockedBy: []

# Can execute simultaneously in separate worktrees
```

#### Sequential Dependencies
Tasks with shared dependencies run sequentially:
```yaml
Task 1.1: Database schema
  blockedBy: []

Task 1.2: Repository layer
  blockedBy: [1.1]  # Needs schema

Task 1.3: Service layer
  blockedBy: [1.2]  # Needs repositories
```

#### Shared Resources
Handle conflicts:
- Separate files: Can parallelize
- Same files: Must sequence
- Shared interfaces: Define interface first, then parallelize implementations

### Success Criteria Definition

Make success measurable and objective:

#### Good Success Criteria
✅ "All API endpoints return < 200ms p95 latency"
✅ "Test coverage > 85% for new code"
✅ "Zero SQL injection vulnerabilities in security scan"
✅ "Documentation includes working examples for each endpoint"

#### Bad Success Criteria
❌ "API is fast enough"
❌ "Good test coverage"
❌ "Secure implementation"
❌ "Well documented"

#### Acceptance Criteria Per Task
Each task needs specific, testable criteria:
```yaml
Acceptance Criteria:
- [ ] Function returns correct value for valid inputs
- [ ] Throws ValidationError for invalid inputs
- [ ] Test coverage >= 90% for this module
- [ ] No ESLint warnings
- [ ] Performance benchmark < 10ms for 1000 items
```

### Capability Discovery

When creating plans, discover available capabilities:

**Phase 3: Capability Discovery**
- Scan plugin cache: read `~/.claude/plugins/installed_plugins.json`, extract `pluginName` (before `@`) and `installPath` for each plugin
- Discover skills: glob `{installPath}/skills/*/SKILL.md` per plugin, read YAML frontmatter `name`/`description`, fully-qualify as `{pluginName}:{name}`
- Discover plugin agents: glob `{installPath}/agents/**/*.md` per plugin, read YAML frontmatter, fully-qualify as `{pluginName}:{name}`
- Add built-in agents (not in cache): read Task tool description for Bash, general-purpose, Explore, Plan, claude-code-guide, statusline-setup
- Check for MCP tools (not in cache): scan system prompt for MCP server tools
- Store all discovered capabilities in `.mycelium/state.json` under `discovered_capabilities`
- Verify capabilities assigned to tasks actually exist; reassign if not

### Common Pitfalls

#### Too Large Tasks
❌ **Problem:** Tasks > 500 lines or > 8 hours
✅ **Solution:** Split into smaller, testable units

#### Vague Acceptance Criteria
❌ **Problem:** "Works correctly"
✅ **Solution:** "Returns 200 for valid request with JSON response matching schema"

#### Missing Dependencies
❌ **Problem:** Tasks blocked on unidentified dependencies
✅ **Solution:** Explicitly map all dependencies before starting

#### Over-Planning
❌ **Problem:** Planning every detail up front
✅ **Solution:** Plan current phase in detail, later phases at high level

#### Under-Specification
❌ **Problem:** "Build the API"
✅ **Solution:** Enumerate endpoints, methods, payloads, validations

### Deviations and Adaptation

Plans change during implementation. Track deviations:

```markdown
## Deviations Log

### YYYY-MM-DD: Changed Task 2.3 Approach
**Original:** Use library X for parsing
**New:** Implement custom parser
**Reason:** Library X doesn't handle edge case Y
**Impact:** +1 task, +2 hours
```

#### When to Deviate
Acceptable reasons:
- New information discovered
- Original approach blocked
- Better solution found
- Requirements changed

#### When to Replan
Major deviations require replanning:
- >50% tasks changed
- Core architecture changed
- Requirements significantly changed
- Timeline/resources changed

---

## Quick Example

```bash
# Create a new plan
/mycelium-plan "Add user authentication"

# List all plans
/mycelium-plan --list

# Switch to a different plan
/mycelium-plan --switch auth_20260210

# Create another plan (previous one auto-pauses)
/mycelium-plan "Optimize database queries"
```

## Important

- Plans are LIVING DOCUMENTS - updated in-place during execution
- All tasks follow TDD: tests before implementation
- Tasks have explicit dependencies (blockedBy/blocks)
- Default to parallel execution - minimize dependencies
- **Creating a new plan auto-pauses the previous active plan** - no plans are lost
- **Backward compatible** - works when `plans[]` doesn't exist (falls back to globbing `.mycelium/plans/`)

## Summary

**Key principles:**
- Break work into testable, parallelizable units
- Express complexity with multiple factors
- Define clear dependencies
- Assign appropriate capabilities
- Create measurable success criteria
- Track deviations systematically
- Enable parallel execution by default

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [Plan template][plan-template]
- [Plan frontmatter schema][plan-schema]
- [Enum definitions][enums]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
[plan-template]: ../../templates/plans/plan.md.template
[plan-schema]: ../../schemas/plan-frontmatter.schema.json
[enums]: ../../schemas/enums.json

## Examples

### Example 1: Feature Planning
**User request:** "plan user authentication"

**Workflow:**
1. Clarifies: Which auth method? → JWT
2. Breaks down: 8 tasks across 3 phases
3. Assigns: TDD to each task, proper dependencies
4. Saves: Plan to `.mycelium/plans/2026-02-12-auth_20260212.md`

**Result:** Structured plan ready for `/mycelium-work`

### Example 2: List All Plans
**User request:** `/mycelium-plan --list`

**Output:**
```
Plans:
 * auth_20260212        in_progress  5/8 tasks   (active)
   bugfix_20260211      completed    3/3 tasks
   optimize_20260210    paused       2/7 tasks
```

### Example 3: Switch Plans
**User request:** `/mycelium-plan --switch optimize_20260210`

**Workflow:**
1. Pauses current plan (auth_20260212)
2. Activates optimize_20260210
3. Updates current_track in state.json

**Result:** Now working on optimization plan, can resume auth later

## Troubleshooting

**Error:** "Plan `xyz` not found"
**Cause:** Invalid track_id provided to --switch
**Solution:** Run `/mycelium-plan --list` to see available plans

**Issue:** "Task dependencies create cycle"
**Cause:** blockedBy/blocks fields create circular dependency
**Solution:** Review dependency graph, remove circular reference

**Issue:** "All tasks marked as blocked"
**Cause:** Dependency chain not properly initialized
**Solution:** Ensure at least one task has `blockedBy: []` to start execution
