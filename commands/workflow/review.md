---
name: workflow:review
description: Run two-stage code review (Phase 5). Stage 1 checks spec compliance against plan requirements. Stage 2 runs parallel multi-agent quality review (security, performance, architecture, language-specific, simplicity). Outputs P1/P2/P3 categorized issues.
argument-hint: "[--stage=1|2|all]"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Agent"]
---

# Workflow Review Command

Execute comprehensive two-stage code review. This is Phase 5 (Review) of the workflow.

## Your Task

Review completed implementation through two sequential stages, with Stage 1 being a blocking gate for Stage 2.

### Overview

**Stage 1: Spec Compliance Review** (BLOCKING)
- Verify implementation matches plan requirements
- Check all acceptance criteria met
- Must pass before Stage 2 begins

**Stage 2: Code Quality Review** (PARALLEL)
- Multiple agents review simultaneously
- Security, performance, architecture, language-specific, simplicity
- Outputs prioritized issues (P1/P2/P3)

## Stage 1: Spec Compliance Review

This stage ensures the implementation actually solves the problem as specified.

### 1. Load Plan and Changes

```bash
# Load the active plan
# Read from .workflow/plans/{latest}.md

# Get all commits for this track
git log --oneline main..{track_branch}

# Get full diff
git diff main..{track_branch}
```

### 2. Verify Against Plan Requirements

For EACH task in the plan:

**Check Task Completion:**
- Is task marked `[x]` complete?
- Does commit SHA exist?
- Is commit SHA valid?

**Verify Acceptance Criteria:**
- Read task's acceptance criteria from plan
- Check each criterion:
  - [ ] Evidence exists that criterion is met
  - [ ] Tests cover this criterion
  - [ ] Manual verification if needed

**Verify Test Plan:**
- Run the test commands specified in plan
- Confirm all tests pass
- Check coverage meets target (default ≥80%)

**Check Files Modified:**
- Compare plan's expected files vs actual files changed
- Flag unexpected file changes
- Verify all expected files were touched

**Edge Cases:**
- Were edge cases in the spec covered?
- Are error conditions handled?
- Are boundary values tested?

### 3. Generate Spec Compliance Report

Create `.workflow/state/review_stage1_report.md`:

```markdown
# Spec Compliance Review
**Track:** {track_id}
**Date:** {timestamp}
**Reviewer:** spec-compliance-agent
**Status:** PASS|FAIL

## Summary
{Overall assessment}

## Task Verification

### Task 1.1: {title}
- [x] Marked complete with SHA
- [x] All acceptance criteria met
- [x] Test plan executed successfully
- [ ] Edge case handling incomplete  ⚠️

**Issues Found:**
- P1: Missing null check in user input validation
- P2: Error message not user-friendly

### Task 1.2: {title}
...

## Requirements Coverage

- [x] Requirement 1: User authentication
- [x] Requirement 2: Session management
- [ ] Requirement 3: Password reset ⚠️

## Test Coverage Analysis

- Overall coverage: 85% ✓
- Critical paths covered: Yes ✓
- Edge cases covered: Partial ⚠️

## Blockers for Stage 2

{List P1 issues that must be fixed before quality review}

## Verdict

- [ ] PASS - Proceed to Stage 2
- [x] CONDITIONAL PASS - Minor issues, can proceed with notes
- [ ] FAIL - Must fix before Stage 2
```

### 4. Decision Point

**If FAIL:**
- List required fixes
- STOP - do not proceed to Stage 2
- User must address issues and re-run review

**If CONDITIONAL PASS:**
- Note minor issues
- Proceed to Stage 2
- Issues will be prioritized there

**If PASS:**
- Proceed to Stage 2 immediately

## Stage 2: Code Quality Review

Run multiple review agents in PARALLEL for comprehensive quality assessment.

### 1. Prepare Review Context

Gather information for reviewers:
```bash
# Changed files
git diff --name-only main..{track_branch}

# Full diff
git diff main..{track_branch}

# Commit messages
git log main..{track_branch}

# Project context
# Read .workflow/context/*.md
# Read CLAUDE.md
```

### 2. Dispatch Review Agents (PARALLEL)

Run these agents SIMULTANEOUSLY:

#### A. Security Reviewer Agent
**Focus:**
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication/authorization issues
- Data exposure and privacy
- OWASP Top 10 concerns
- Cryptography misuse
- Dependency vulnerabilities

**Checks:**
- User input validation
- SQL parameterization
- API authentication
- Secret management
- HTTPS enforcement
- Rate limiting

#### B. Performance Reviewer Agent
**Focus:**
- Algorithm complexity (O(n²) → O(n log n))
- Database query efficiency (N+1 queries)
- Caching opportunities
- Memory leaks
- Resource cleanup
- Bundle size impacts

**Checks:**
- Query patterns
- Loop efficiency
- Lazy loading usage
- Database indexes
- Memory allocation
- Async/await usage

#### C. Architecture Reviewer Agent
**Focus:**
- Code organization and structure
- Separation of concerns
- SOLID principles
- Design patterns usage
- Module boundaries
- Coupling and cohesion

**Checks:**
- Proper layering
- Dependency direction
- Interface design
- Abstraction levels
- Module independence

#### D. Language-Specific Reviewer Agent
**Focus:**
- Idiomatic code for the language
- Standard library usage
- Language-specific best practices
- Type safety (TypeScript, Go, etc.)
- Error handling patterns
- Framework conventions

**Checks:**
- Proper error handling
- Type annotations (if applicable)
- Async patterns
- Resource management
- Standard library vs custom code

#### E. Simplicity Reviewer Agent
**Focus:**
- Code clarity and readability
- Unnecessary complexity
- Over-engineering
- Premature optimization
- Dead code
- Duplicate code

**Checks:**
- Function length
- Cyclomatic complexity
- Naming clarity
- Comment necessity
- DRY violations

#### F. Conditional Reviewers

**Migration Reviewer** (if schema/data changes):
- Migration safety
- Rollback capability
- Data integrity
- Performance impact

**Deployment Reviewer** (if infrastructure changes):
- Configuration management
- Environment parity
- Rollback strategy
- Health checks

### 3. Aggregate Review Results

Each agent outputs issues in this format:

```markdown
## {Reviewer Name} Review

**Issues Found:** {count}

### P1: Critical (Blocks Merge)
1. **SQL Injection vulnerability in user search**
   - File: src/api/users.ts:45
   - Issue: Unsanitized user input in SQL query
   - Fix: Use parameterized queries
   - Effort: 15 min

### P2: Important (Should Fix)
1. **N+1 query in order listing**
   - File: src/api/orders.ts:23
   - Issue: Loading related data in loop
   - Fix: Use eager loading
   - Effort: 30 min

### P3: Nice-to-Have
1. **Magic number in rate limiting**
   - File: src/middleware/ratelimit.ts:12
   - Issue: Hard-coded limit value
   - Fix: Move to config
   - Effort: 10 min
```

### 4. Generate Consolidated Report

Create `.workflow/state/review_stage2_report.md`:

```markdown
# Code Quality Review
**Track:** {track_id}
**Date:** {timestamp}
**Status:** {P1_count} critical, {P2_count} important, {P3_count} minor

## Executive Summary
{Overall quality assessment}

## Critical Issues (P1) - Must Fix
{Aggregated P1 issues from all reviewers}

## Important Issues (P2) - Should Fix
{Aggregated P2 issues from all reviewers}

## Minor Issues (P3) - Nice to Have
{Aggregated P3 issues from all reviewers}

## Quality Metrics
- Security: {score}/10
- Performance: {score}/10
- Architecture: {score}/10
- Code Quality: {score}/10
- Simplicity: {score}/10

**Overall Score:** {average}/10

## Recommendations
1. {Top recommendation}
2. {Second recommendation}
3. {Third recommendation}

## Approval Status
- [ ] Approved - No blocking issues
- [x] Approved with conditions - Fix P1 issues
- [ ] Rejected - Major rework needed
```

### 5. Present Results to User

Show consolidated report with:
- Total issue count by priority
- Top 3-5 most critical issues
- Recommended action plan
- Estimated fix effort

Ask user:
- Fix all issues now?
- Fix only P1 issues?
- Review and fix selectively?
- Proceed despite issues? (not recommended for P1)

## Fix Workflow

If issues need fixing:

1. **Create Fix Tasks:**
   - For each P1 issue, create a task
   - Add to plan or create ad-hoc fix list

2. **Execute Fixes:**
   - Use `/workflow:work` for systematic fixes
   - Or fix immediately if trivial

3. **Re-verify:**
   - Run affected tests
   - Verify fix doesn't break anything
   - Update issue status

4. **Re-review (if major changes):**
   - Re-run relevant reviewers
   - Confirm issues resolved

## Protected Artifacts

NEVER flag issues in these directories:
- `.workflow/plans/` - Living plan documents
- `.workflow/solutions/` - Captured learnings
- `.workflow/state/` - Session state
- `.workflow/context/` - Project context

These are workflow artifacts, not production code.

## Error Handling

**If Stage 1 Fails:**
- List missing requirements clearly
- Provide specific remediation steps
- Do NOT proceed to Stage 2

**If All Stage 2 Reviewers Fail:**
- Check if code changes exist
- Verify reviewers have access to files
- Fallback to manual review guidance

**If Too Many Issues:**
- Prioritize by severity
- Group related issues
- Suggest incremental fixes

## Skills to Use

- **verification**: For running tests and checking evidence
- **context**: For loading project patterns and conventions
- Use review agents directly via Agent tool

## Important Notes

- Stage 1 is BLOCKING - must pass before Stage 2
- Stage 2 reviewers run in PARALLEL - not sequential
- Prioritize issues: P1 blocks merge, P2 should fix, P3 nice-to-have
- Evidence-based reviews: Show actual code snippets
- Compare against project conventions (`.workflow/learned/`)
- Do NOT over-engineer: Simple working code > perfect architecture
- Save both stage reports for future reference

## After Review

Depending on results:
- If approved: Suggest `/workflow:compound` to capture learnings
- If fixes needed: Suggest `/workflow:work` with fix tasks
- If rejected: Discuss with user before proceeding

Next typical step: `/workflow:compound` for knowledge capture
