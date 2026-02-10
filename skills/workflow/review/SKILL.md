---
name: Two-Stage Code Review
description: This skill should be used when the user asks to "review code", "check code quality", "review changes", or during the review phase of the workflow. Guides comprehensive code review with two sequential stages: spec compliance (blocking) and quality assessment (parallel).
user-invocable: false
version: 0.1.0
---

# Two-Stage Code Review Workflow

This skill guides you through comprehensive code review with two sequential stages: spec compliance (blocking) and quality assessment (parallel).

## When to Use This Skill

- After completing implementation tasks
- Before merging changes
- When requested via `/mycelium-review`
- As part of autonomous workflow (`/mycelium-go`)

## Overview

**Stage 1: Spec Compliance Review** (BLOCKING)
- Verify implementation matches plan requirements
- Check all acceptance criteria met
- Must pass before Stage 2 begins

**Stage 2: Code Quality Review** (PARALLEL)
- Multiple agents review simultaneously
- Security, performance, architecture, language-specific, simplicity
- Outputs prioritized issues (P1/P2/P3)

---

## Stage 1: Spec Compliance Review

This stage ensures the implementation actually solves the problem as specified.

### Step 1: Load Plan and Changes

**Load the active plan**:
```bash
# Find latest plan
ls -t .workflow/plans/*.md | head -1

# Read the plan
# Extract: track_id, tasks, acceptance criteria
```

**Get all commits for this track**:
```bash
# If on feature branch
git log --oneline main..HEAD

# Or if branch name follows pattern
git log --oneline main..{track_branch}
```

**Get full diff**:
```bash
# Complete changes
git diff main..HEAD

# Or specific branch
git diff main..{track_branch}

# List files changed
git diff --name-only main..HEAD
```

---

### Step 2: Verify Against Plan Requirements

For EACH task in the plan, perform these checks:

#### Task Completion Check

**Verify task marked complete**:
- Is task checkbox `[x]` complete?
- Does commit SHA exist next to task?
- Is commit SHA valid? (run `git show {sha}`)

**Example**:
```markdown
[x] Task 1.1: Setup auth module `abc1234` ✓
```

If task marked complete but no SHA: ⚠️ Flag as issue

#### Acceptance Criteria Verification

**For each task, check its acceptance criteria**:

```markdown
**Acceptance Criteria:**
- [ ] User can log in with email/password
- [ ] Invalid credentials return 401
- [ ] Session token expires after 24h
```

**For each criterion**:
1. Find evidence in code (read relevant files)
2. Check if tests cover this criterion
3. Run manual verification if needed
4. Mark: ✓ Met, ⚠️ Partial, ✗ Missing

**Example verification**:
```
Criterion: "Invalid credentials return 401"

Evidence search:
- grep -r "401" src/auth/
- Check test files for credential validation
- Verify error handling code exists

Result: ✓ Found in src/auth/login.ts:45 and tested in tests/auth.test.ts:67
```

#### Test Plan Verification

**Run the test commands specified in plan**:

```bash
# From plan test commands
npm test                    # or pytest, go test, etc.
npm run test:coverage       # or pytest --cov

# Check exit code
echo $?  # Must be 0
```

**Verify coverage meets target**:
- Default target: ≥80%
- Check plan for custom target
- Coverage MUST meet or exceed target

**Flag if**:
- Tests fail
- Coverage below target
- Critical paths not tested

#### Files Modified Check

**Compare expected vs actual**:

From plan:
```markdown
**Files:**
- /absolute/path/to/file1.ts
- /absolute/path/to/file2.ts
```

Actual changes:
```bash
git diff --name-only main..HEAD
```

**Check**:
- ✓ All expected files were touched
- ⚠️ Additional files changed (review if appropriate)
- ✗ Expected files NOT changed

#### Edge Cases and Error Handling

**Review for**:
- Null/undefined handling
- Empty array/object handling
- Boundary values (0, -1, max values)
- Network errors
- Database errors
- Concurrent access
- Invalid input validation

**Check tests**:
```bash
# Look for edge case tests
grep -r "edge case\|boundary\|null\|undefined\|error" tests/
```

---

### Step 3: Generate Spec Compliance Report

Create `.workflow/state/review_stage1_report.md`:

```markdown
# Spec Compliance Review

**Track:** {track_id}
**Date:** {timestamp}
**Reviewer:** spec-compliance
**Status:** PASS | CONDITIONAL PASS | FAIL

## Summary

{2-3 sentence overall assessment}

## Task Verification

### Task 1.1: {title}
**Status:** [x] Complete with SHA `abc1234`

**Acceptance Criteria:**
- [x] Criterion 1: Evidence found in file.ts:45
- [x] Criterion 2: Tested in test.ts:67
- [ ] Criterion 3: Missing null check ⚠️

**Test Plan:**
- [x] Unit tests pass (24/24)
- [x] Coverage: 85% (target: 80%) ✓
- [ ] Edge cases: Partial coverage ⚠️

**Files:**
- [x] Expected: file1.ts, file2.ts
- [⚠️] Unexpected: file3.ts (helper - acceptable)

**Issues Found:**
- P1: Missing null check in user input validation (file.ts:45)
- P2: Error message not user-friendly (file.ts:67)

### Task 1.2: {title}
...

## Requirements Coverage Matrix

| Requirement | Status | Evidence |
|-------------|--------|----------|
| User authentication | ✓ | auth.ts:23, tests/auth.test.ts:12 |
| Session management | ✓ | session.ts:45, tests/session.test.ts:34 |
| Password reset | ⚠️ | Implemented but not tested |

## Test Coverage Analysis

- **Overall coverage:** 85% ✓
- **Critical paths:** Yes ✓
- **Edge cases:** Partial ⚠️
- **Error handling:** Yes ✓

**Coverage gaps:**
- Password reset flow: 0% coverage
- Session timeout handling: 50% coverage

## P1 Blockers for Stage 2

{List any critical issues that MUST be fixed before quality review}

1. Missing null check in user input validation
2. Password reset feature has no tests

## Verdict

- [ ] **PASS** - All requirements met, proceed to Stage 2
- [x] **CONDITIONAL PASS** - Minor issues noted, can proceed to Stage 2
- [ ] **FAIL** - Critical gaps, must fix before Stage 2

{If CONDITIONAL PASS or FAIL, explain what needs fixing}
```

---

### Step 4: Decision Point

Based on the verdict:

#### FAIL
```
❌ Spec compliance FAILED

Critical issues found:
1. {Issue 1}
2. {Issue 2}

Required fixes:
- {Action 1}
- {Action 2}

STOP - Do not proceed to Stage 2
User must address issues and re-run review.

Suggested: /mycelium-work {fix_tasks}
```

#### CONDITIONAL PASS
```
⚠️ Spec compliance PASSED with conditions

Minor issues found:
1. {Issue 1} (P2)
2. {Issue 2} (P3)

These will be included in Stage 2 quality review.
Proceeding to Stage 2...
```

#### PASS
```
✅ Spec compliance PASSED

All requirements met. Proceeding to Stage 2...
```

---

## Stage 2: Code Quality Review

Run multiple review agents in PARALLEL for comprehensive quality assessment.

### Step 1: Prepare Review Context

**Gather review materials**:

```bash
# Changed files list
git diff --name-only main..HEAD

# Full diff
git diff main..HEAD

# Commit messages
git log --oneline main..HEAD

# Statistics
git diff --stat main..HEAD
```

**Load project context**:
- Read `.workflow/context/product.md`
- Read `.workflow/context/tech-stack.md`
- Read `.workflow/context/workflow.md`
- Read `CLAUDE.md`
- Read `.workflow/solutions/patterns/critical-patterns.md`

---

### Step 2: Dispatch Review Agents (PARALLEL)

Launch all agents SIMULTANEOUSLY using the Task tool.

#### Agent A: Security Reviewer

**Focus areas**:
- Injection vulnerabilities (SQL, XSS, command injection, path traversal)
- Authentication/authorization bypass
- Data exposure and privacy leaks
- OWASP Top 10 concerns
- Cryptography misuse
- Dependency vulnerabilities
- Secret leakage (API keys, passwords in code)

**Specific checks**:
```typescript
// Bad patterns to find
- String concatenation in SQL queries
- eval() or Function() usage
- Unsanitized user input in HTML
- Hardcoded credentials
- Weak password requirements
- Missing authentication checks
- Insecure random number generation
- Deprecated crypto algorithms
```

**Output format**:
```markdown
## Security Review

**Issues Found:** {count}

### P1: Critical (Blocks Merge)

1. **SQL Injection vulnerability in user search**
   - File: `src/api/users.ts:45`
   - Issue: Unsanitized user input concatenated into SQL query
   - Code: `db.query("SELECT * FROM users WHERE name = '" + input + "'")`
   - Fix: Use parameterized queries: `db.query("SELECT * FROM users WHERE name = ?", [input])`
   - Risk: HIGH - Allows arbitrary SQL execution
   - Effort: 15 min

### P2: Important (Should Fix)

1. **Weak password requirements**
   - File: `src/auth/validation.ts:23`
   - Issue: Only requires 6 characters, no complexity
   - Fix: Enforce 12+ chars with mixed case, numbers, symbols
   - Risk: MEDIUM - Vulnerable to brute force
   - Effort: 30 min

### P3: Nice-to-Have

1. **API keys in environment variables not validated**
   - File: `src/config.ts:12`
   - Issue: No check if API keys are set
   - Fix: Add startup validation
   - Risk: LOW - Could fail at runtime
   - Effort: 10 min
```

#### Agent B: Performance Reviewer

**Focus areas**:
- Algorithm complexity (O(n²) loops, nested iterations)
- Database query efficiency (N+1 queries, missing indexes)
- Caching opportunities
- Memory leaks (unclosed connections, retained references)
- Resource cleanup (file handles, database connections)
- Bundle size impacts (for frontend)
- Synchronous operations that could be async

**Specific checks**:
```typescript
// Performance anti-patterns
- Nested loops over large datasets
- Array.forEach inside Array.forEach
- await in loops (sequential instead of parallel)
- Large objects in tight loops
- Missing database indexes
- Full table scans
- Large bundle imports (import entire libraries)
```

**Output format**: Same P1/P2/P3 structure as security

#### Agent C: Architecture Reviewer

**Focus areas**:
- Code organization and structure
- Separation of concerns (business logic in controllers)
- SOLID principles violations
- Design patterns usage (appropriate or over-engineered)
- Module boundaries and coupling
- Dependency direction (should point inward)
- Abstraction levels (mixing high/low level)

**Specific checks**:
```typescript
// Architecture smells
- Business logic in route handlers
- Direct database access from UI components
- Circular dependencies
- God classes (too many responsibilities)
- Tight coupling between modules
- Missing interfaces/abstractions
- Leaky abstractions
```

#### Agent D: Language-Specific Reviewer

**Focus areas** (adapt based on language):
- Idiomatic code for the language
- Standard library usage (reinventing the wheel)
- Language-specific best practices
- Type safety (TypeScript, Go, Rust)
- Error handling patterns (proper error propagation)
- Framework conventions (Next.js, FastAPI, etc.)
- Resource management (RAII in Rust, context managers in Python)

**Language-specific examples**:

*TypeScript*:
```typescript
// Check for
- Missing type annotations
- any types
- Non-null assertions (!.)
- Unhandled promise rejections
```

*Python*:
```python
# Check for
- Missing type hints
- Not using context managers (with)
- Mutable default arguments
- Bare except clauses
```

*Go*:
```go
// Check for
- Ignored errors
- Missing defer for cleanup
- Not using errgroup for goroutines
- Improper context usage
```

#### Agent E: Simplicity Reviewer

**Focus areas**:
- Code clarity and readability
- Unnecessary complexity
- Over-engineering
- Premature optimization
- Dead code (unreachable, commented out)
- Duplicate code (DRY violations)
- Long functions (>50 lines)
- Deep nesting (>3 levels)
- Magic numbers

**Specific checks**:
```typescript
// Complexity indicators
- Functions > 50 lines
- Cyclomatic complexity > 10
- Nesting depth > 3
- Unclear variable names (a, tmp, data)
- Comments explaining code (code should be self-evident)
- Duplicate logic
- Unused imports/variables
```

#### Optional: Conditional Reviewers

**Migration Reviewer** (if schema/data changes detected):
- Migration safety (no data loss)
- Rollback capability
- Data integrity constraints
- Performance impact of migrations
- Index creation strategy

**Deployment Reviewer** (if infrastructure changes):
- Configuration management
- Environment parity
- Rollback strategy
- Health checks and monitoring
- Zero-downtime deployment

---

### Step 3: Aggregate Review Results

Wait for all parallel agents to complete.

**Collect results**:
- Security: {p1_count} P1, {p2_count} P2, {p3_count} P3
- Performance: {p1_count} P1, {p2_count} P2, {p3_count} P3
- Architecture: {p1_count} P1, {p2_count} P2, {p3_count} P3
- Language: {p1_count} P1, {p2_count} P2, {p3_count} P3
- Simplicity: {p1_count} P1, {p2_count} P2, {p3_count} P3

**Merge and de-duplicate**:
- Same issue flagged by multiple reviewers → Keep one, note reviewers
- Related issues → Group together
- Sort by priority (P1 first)

---

### Step 4: Generate Consolidated Report

Create `.workflow/state/review_stage2_report.md`:

```markdown
# Code Quality Review

**Track:** {track_id}
**Date:** {timestamp}
**Reviewers:** Security, Performance, Architecture, Language-Specific, Simplicity
**Status:** {P1_count} critical, {P2_count} important, {P3_count} minor

## Executive Summary

{2-3 paragraph overall quality assessment}

Overall, the implementation is {solid/good/needs work}. The code {does/doesn't} follow project conventions and {demonstrates/lacks} attention to {quality aspects}. {Key strengths}. {Key areas for improvement}.

## Critical Issues (P1) - Must Fix Before Merge

{If any P1 issues exist, merge is BLOCKED}

### 1. SQL Injection in user search
**Reviewer:** Security
**File:** `src/api/users.ts:45`
**Severity:** CRITICAL
**Issue:** User input concatenated directly into SQL query
**Code:**
```typescript
db.query("SELECT * FROM users WHERE name = '" + input + "'")
```
**Fix:**
```typescript
db.query("SELECT * FROM users WHERE name = ?", [input])
```
**Effort:** 15 minutes
**Risk if ignored:** Complete database compromise

### 2. {Next P1 issue}
...

## Important Issues (P2) - Should Fix

{Recommended to fix but not blocking}

### 1. N+1 query in order listing
**Reviewer:** Performance
**File:** `src/api/orders.ts:23`
**Severity:** HIGH
**Issue:** Loading related data in loop causes N+1 queries
**Impact:** Page load time 2-3 seconds with 100 orders
**Fix:** Use eager loading or batch fetch
**Effort:** 30 minutes

### 2. {Next P2 issue}
...

## Minor Issues (P3) - Nice to Have

{Good to fix but optional}

### 1. Magic number in rate limiting
**Reviewer:** Simplicity
**File:** `src/middleware/ratelimit.ts:12`
**Issue:** Hard-coded limit value
**Fix:** Move to config file
**Effort:** 10 minutes

### 2. {Next P3 issue}
...

## Quality Metrics

| Dimension | Score | Notes |
|-----------|-------|-------|
| Security | 6/10 | P1 SQL injection issue |
| Performance | 8/10 | Some N+1 queries |
| Architecture | 9/10 | Well structured |
| Code Quality | 8/10 | Good practices |
| Simplicity | 7/10 | Some complexity |

**Overall Score:** 7.6/10

## Recommendations

1. **Immediate:** Fix SQL injection vulnerability (P1)
2. **Short-term:** Address N+1 query performance issues (P2)
3. **Long-term:** Refactor rate limiting config (P3)

## Approval Status

- [ ] **Approved** - No blocking issues, ready to merge
- [ ] **Approved with conditions** - Fix P1 issues before merge
- [ ] **Rejected** - Major rework needed

**Current status:** {Selected option above}

{If not approved, explain what's needed}
```

---

### Step 5: Present Results to User

**Summary display**:
```
📊 Code Review Complete

Stage 1: Spec Compliance
  ✅ PASS - All requirements met

Stage 2: Quality Review
  ❌ 2 critical (P1)
  ⚠️  5 important (P2)
  ℹ️  8 minor (P3)

Overall Score: 7.6/10

Top Issues:
  1. SQL injection vulnerability (P1 - Security)
  2. Missing null check (P1 - Security)
  3. N+1 query performance (P2 - Performance)

Approval: BLOCKED - Fix P1 issues before merge
```

**Ask user**:
```
What would you like to do?

Options:
1. Fix all P1 issues now (recommended)
2. Fix P1 + P2 issues
3. Review issues and fix selectively
4. See detailed report
5. Proceed anyway (not recommended - P1 blocks merge)
```

---

## Fix Workflow

If issues need fixing:

### Create Fix Tasks

For each P1 issue (and optionally P2/P3):

```markdown
### Fix Task: SQL Injection in user search

**Priority:** P1 (Critical)
**File:** src/api/users.ts:45
**Issue:** {description}
**Fix:** {specific change}
**Effort:** 15 min

**Test Plan:**
- Add test for SQL injection attempt
- Verify parameterized query works
- Confirm existing tests still pass
```

### Execute Fixes

**Option 1:** Use `/mycelium-work`
- Add fix tasks to plan
- Execute systematically with TDD

**Option 2:** Fix immediately
- If trivial (<15 min per issue)
- Make change, add test, verify
- Commit: `fix: {issue description}`

### Re-verify

After fixes:

```bash
# Run affected tests
npm test src/api/users.test.ts

# Run full test suite
npm test

# Verify fix doesn't break anything
git diff
```

### Re-review (if major changes)

If fixes are significant:
```bash
# Re-run relevant reviewers
# Confirm issues resolved
# Generate updated report
```

Otherwise:
```
✅ Issues fixed and verified

P1 issues: 2 → 0 ✓
Ready to proceed
```

---

## Protected Artifacts

**NEVER flag issues in these directories:**
- `.workflow/plans/` - Living plan documents
- `.workflow/solutions/` - Captured learnings
- `.workflow/state/` - Session state
- `.workflow/context/` - Project context

These are workflow artifacts, not production code.

---

## Error Handling

**If Stage 1 Fails:**
- List missing requirements clearly
- Provide specific remediation steps
- Do NOT proceed to Stage 2
- Save partial report

**If All Stage 2 Reviewers Fail:**
- Check if code changes exist
- Verify reviewers have access to files
- Fallback to manual review guidance:
  - Ask user to manually check security, performance, etc.
  - Provide checklist of what to look for

**If Too Many Issues (>20):**
- Prioritize by severity
- Group related issues
- Suggest incremental fixes
- Consider if implementation needs rework

---

## Review Checklist

Before completing review:

- [ ] Stage 1 report generated
- [ ] All tasks verified against acceptance criteria
- [ ] Test coverage checked
- [ ] Files changed reviewed
- [ ] Stage 1 verdict determined
- [ ] If Stage 1 passed, all Stage 2 agents dispatched
- [ ] Stage 2 results aggregated
- [ ] Issues prioritized (P1/P2/P3)
- [ ] Consolidated report generated
- [ ] User presented with clear next steps

---

## Next Steps After Review

**If approved:**
- Suggest `/mycelium-capture` to extract learnings
- Or merge changes if ready

**If fixes needed:**
- Suggest `/mycelium-work` with fix tasks
- Or fix immediately if trivial

**If rejected:**
- Discuss with user before proceeding
- May need to revisit plan
- Consider architectural changes

---

## Important Notes

- Stage 1 is BLOCKING - must pass before Stage 2
- Stage 2 reviewers run in PARALLEL - faster results
- P1 issues BLOCK merge - must fix
- P2 issues SHOULD fix - recommended
- P3 issues NICE TO HAVE - optional
- Evidence-based reviews - cite specific code/lines
- Compare against project conventions in `.workflow/solutions/patterns/`
- Simple working code > perfect architecture
- Save both stage reports for future reference
