---
name: workflow:review
description: Two-stage review (spec compliance + quality)
argument-hint: "[--stage=1|2|all]"
allowed-tools: ["Skill", "Read", "Write", "Bash", "Task"]
---

# Workflow Review

Comprehensive two-stage code review: spec compliance → quality assessment.

## Your Task

1. **Load the review skill** - Use Skill tool to load `workflow/review`

2. **Parse arguments**:
   - `--stage=1`: Spec compliance only (blocking gate)
   - `--stage=2`: Quality review only
   - `--stage=all` or default: Both stages

3. **Load review context**:
   - Active plan from `.workflow/plans/`
   - Git diff of changes
   - Project context files

4. **Execute review** - Follow review skill which handles:
   - **Stage 1** (blocking): Spec compliance check
     - Verify all acceptance criteria met
     - Check test coverage meets target
     - Validate files changed as expected
     - Must PASS before Stage 2
   - **Stage 2** (parallel): Multi-agent quality review
     - Security, performance, architecture, language-specific, simplicity
     - Parallel agent execution for speed
     - Aggregate and prioritize issues (P1/P2/P3)

5. **Generate reports**:
   - `.workflow/state/review_stage1_report.md`
   - `.workflow/state/review_stage2_report.md`

6. **Next step**:
   - If approved: Suggest `/workflow:capture`
   - If P1 issues: Must fix before merge
   - If P2/P3 only: Optional fixes

## Skills Used

- **review**: Two-stage review workflow with parallel quality agents
- **verification**: Evidence checking and test validation

## Quick Example

```bash
/workflow:review              # Full review (both stages)
/workflow:review --stage=1    # Spec compliance only
/workflow:review --stage=2    # Quality review only
```

## Important

- **Stage 1 is BLOCKING** - Must pass before Stage 2 runs
- **P1 issues BLOCK merge** - Critical issues must be fixed
- **P2 issues RECOMMENDED** - Important but not blocking
- **P3 issues OPTIONAL** - Nice-to-have improvements
- **Parallel agents** - Stage 2 runs security/performance/architecture/language/simplicity in parallel
