---
name: pr-review
command: /workflow:pr-review
description: Review pull request and provide feedback. Uses external MCPs (GitHub, GitLab, Gitea) when available, falls back to CLI tools for PR review.
category: pr
version: 0.1.0
---

# Review Pull Request

## Purpose

Review a pull request, analyze changes, run checks, and provide structured feedback. This command uses external MCP providers when available, or falls back to CLI tools for PR review.

## When to Use

Use this command when:
- PR has been created and needs review
- Want automated review before human review
- Need to check PR status and CI results
- Want to provide feedback on PR changes
- Performing code quality checks

## Prerequisites

- PR exists on remote repository
- Authentication configured for remote provider
- External MCP or CLI tool available (gh, glab, tea)
- Local repository has access to PR branch

## Command Invocation

```
/workflow:pr-review {pr_number} [--provider <provider>] [--detailed] [--approve] [--request-changes]
```

**Parameters:**
- `pr_number` (required): PR/MR number to review
- `--provider <provider>` (optional): Force specific provider (github, gitlab, gitea)
- `--detailed` (optional): Include detailed code analysis
- `--approve` (optional): Approve PR after review
- `--request-changes` (optional): Request changes with review

## Execution Steps

### 1. Detect Provider and PR

Determine provider and fetch PR details:

```bash
# Detect provider from remote URL
git remote get-url origin

# Parse provider (github, gitlab, gitea)
provider=$(detect_provider)

# Fetch PR details
gh pr view ${prNumber} --json title,body,state,author,headRefName
# or
glab mr view ${mrNumber} --json title,description,state,author,sourceBranch
```

**PR Information to Fetch:**
- PR number and title
- Description/body
- Author
- State (open, closed, merged)
- Source and target branches
- CI/CD status
- Review status

### 2. Check PR Status

Verify PR state and checks:

#### Via MCP

```javascript
// Using GitHub MCP
const prDetails = await mcp.github.getPullRequest({
  owner: extractOwner(remoteUrl),
  repo: extractRepo(remoteUrl),
  pullNumber: prNumber
});

// Check status
const {
  state,         // open, closed, merged
  mergeable,     // can be merged
  draft,         // is draft PR
  checks,        // CI/CD check results
  reviews,       // existing reviews
  conflicts      // merge conflicts
} = prDetails;
```

#### Via CLI

```bash
# GitHub CLI
gh pr view ${prNumber} \
  --json state,isDraft,mergeable,statusCheckRollup,reviewDecision

# GitLab CLI
glab mr view ${mrNumber} \
  --json state,draft,conflicts,pipeline,approvals

# Parse JSON output
state=$(echo "$output" | jq -r '.state')
checks=$(echo "$output" | jq -r '.statusCheckRollup')
```

**Status Checks:**
- ✓ PR is open (not closed or merged)
- ✓ CI/CD checks passing
- ✓ No merge conflicts
- ✓ Branch is up to date
- ⚠ Draft status noted

### 3. Fetch PR Changes

Get the diff and changed files:

```bash
# Checkout PR branch locally
gh pr checkout ${prNumber}
# or
glab mr checkout ${mrNumber}

# Get list of changed files
gh pr diff ${prNumber} --name-only

# Get full diff
gh pr diff ${prNumber}

# Get specific file changes
gh pr diff ${prNumber} -- path/to/file.ts
```

**Change Analysis:**
- Files added, modified, deleted
- Lines changed per file
- Overall PR size (insertions/deletions)
- File types affected
- Critical files (security, config)

### 4. Run Automated Checks

Perform automated quality checks:

#### Lint and Format

```bash
# Run linters
npm run lint
# or
eslint src/
pylint src/
golangci-lint run

# Check formatting
npm run format:check
# or
prettier --check src/
black --check src/
gofmt -l .
```

#### Run Tests

```bash
# Run full test suite
npm test
pytest
go test ./...
cargo test

# Check coverage
npm run test:coverage
pytest --cov
go test -cover ./...
```

#### Security Scan

```bash
# Dependency vulnerabilities
npm audit
pip-audit
safety check

# Code security
semgrep --config auto .
bandit -r src/
gosec ./...
```

#### Static Analysis

```bash
# Type checking
npm run type-check
mypy src/
go vet ./...

# Code complexity
npx complexity-report src/
radon cc src/
gocyclo .
```

### 5. Analyze Code Changes

Perform semantic code review:

#### Code Quality Checks

- **Complexity:** Are functions too complex?
- **Duplication:** Is code duplicated?
- **Naming:** Are names clear and consistent?
- **Structure:** Is code well-organized?
- **Patterns:** Are best practices followed?

#### Implementation Review

- **Logic:** Is the implementation correct?
- **Edge cases:** Are edge cases handled?
- **Error handling:** Are errors handled properly?
- **Performance:** Are there performance concerns?
- **Security:** Are there security issues?

#### Test Coverage

- **Test quality:** Are tests comprehensive?
- **Coverage:** Is coverage adequate?
- **Test types:** Unit, integration, e2e tests?
- **Assertions:** Are tests actually testing?

#### Documentation

- **Code comments:** Are complex parts commented?
- **API docs:** Is public API documented?
- **README updates:** Is documentation updated?
- **Changelog:** Are changes noted?

### 6. Compare with Workflow Plan

If PR originated from workflow track:

```bash
# Find associated plan
planPath=".workflow/plans/${headBranch}.md"

# Read plan if exists
if [ -f "$planPath" ]; then
  # Extract success criteria
  criteria=$(grep -A 10 "## Success Criteria" "$planPath")

  # Extract completed tasks
  tasks=$(grep "^- \[x\]" "$planPath")

  # Compare PR changes with plan
fi
```

**Plan Verification:**
- ✓ All planned tasks completed
- ✓ Success criteria met
- ✓ Tests implemented as planned
- ✓ No scope creep (extra changes)
- ⚠ Unplanned changes noted

### 7. Generate Review Report

Create structured review feedback:

```markdown
# PR Review: #{prNumber} - {prTitle}

## Overview

- **Author:** {author}
- **Branch:** {headBranch} → {baseBranch}
- **Status:** {state}
- **Files Changed:** {fileCount}
- **Lines:** +{insertions} -{deletions}

## Automated Checks

### CI/CD Status
✓ All checks passing
- Build: ✓ Passed
- Tests: ✓ Passed (98% coverage)
- Lint: ✓ No issues
- Security: ✓ No vulnerabilities

### Code Quality
✓ Passed
- Complexity: Within limits
- Duplication: None detected
- Type safety: No type errors
- Formatting: Consistent

## Code Review

### Strengths
- Clear implementation of authentication flow
- Comprehensive test coverage
- Good error handling
- Well-documented API

### Concerns

#### P1 (Must Fix)
- **Security:** API key exposed in `config.ts:45`
  - Move to environment variable
  - Add to `.env.example`

#### P2 (Should Fix)
- **Performance:** N+1 query in `getUsers()` at `users.ts:78`
  - Use `include` to eager load relations
  - Add database index

#### P3 (Consider)
- **Code Quality:** Function `validateUser()` is complex (cyclomatic: 12)
  - Consider extracting validation rules
  - Break into smaller functions

### Suggestions
- Add JSDoc comments for public API functions
- Consider adding integration test for auth flow
- Update README with new authentication setup

## Plan Compliance

✓ All planned tasks completed
✓ Success criteria met
✓ Tests implemented as specified
⚠ Additional refactoring not in plan (acceptable)

## Recommendation

**Status:** APPROVE with comments

This PR successfully implements the planned features with good quality.
Address P1 security issue before merging. P2 and P3 can be addressed
in follow-up PRs if needed.

## Next Steps

1. Fix P1 security issue (API key exposure)
2. (Optional) Address P2 performance issue
3. Update based on other reviewer feedback
4. Merge when approved

---

Review generated by Adaptive Workflow Plugin
Detailed analysis available in review comments
```

### 8. Post Review Comments

Add review feedback to PR:

#### Via MCP

```javascript
// Using GitHub MCP
await mcp.github.createReview({
  owner,
  repo,
  pullNumber: prNumber,
  event: 'APPROVE', // or 'REQUEST_CHANGES', 'COMMENT'
  body: reviewReport,
  comments: [
    {
      path: 'config.ts',
      line: 45,
      body: 'Security: API key should be in environment variable'
    },
    {
      path: 'users.ts',
      line: 78,
      body: 'Performance: N+1 query detected. Use eager loading.'
    }
  ]
});
```

#### Via CLI

```bash
# GitHub CLI - Add review
gh pr review ${prNumber} \
  --approve \
  --body "${reviewReport}"

# Add inline comments
gh pr comment ${prNumber} \
  --body "At \`config.ts:45\`: API key should be in environment variable"

# Request changes
gh pr review ${prNumber} \
  --request-changes \
  --body "${reviewReport}"

# GitLab CLI - Add review
glab mr review ${mrNumber} \
  --approve \
  --comment "${reviewReport}"

# Add discussion thread
glab mr note ${mrNumber} \
  --message "Security concern in config.ts"
```

### 9. Update Session State

Record review in session state:

```json
{
  "tracks": [
    {
      "track_id": "user-auth_20260203",
      "pull_request": {
        "number": 123,
        "reviews": [
          {
            "reviewer": "adaptive-workflow",
            "state": "approved",
            "reviewed_at": "2026-02-03T14:00:00Z",
            "p1_issues": 1,
            "p2_issues": 1,
            "p3_issues": 1
          }
        ]
      }
    }
  ]
}
```

### 10. Archive Review

Save detailed review for future reference:

```bash
# Save review report
mkdir -p .workflow/reviews/
echo "${reviewReport}" > .workflow/reviews/pr-${prNumber}-review.md

# Link from plan
echo "\n## Review\n- [PR Review](../.workflow/reviews/pr-${prNumber}-review.md)" \
  >> .workflow/plans/${trackId}.md
```

## Output

Provide review summary:

```
✓ PR review completed

PR:           #123 - Implement user authentication
Author:       developer
Status:       Open (ready for review)
Files:        8 changed
Lines:        +245, -67

Automated Checks:
  CI/CD:      ✓ All passing
  Tests:      ✓ Passing (98% coverage)
  Lint:       ✓ No issues
  Security:   ✓ No vulnerabilities

Code Quality:  ✓ Good

Issues Found:
  P1 (Must fix):     1 issue
  P2 (Should fix):   1 issue
  P3 (Consider):     1 issue

Recommendation:    APPROVE with comments

Review Details: .workflow/reviews/pr-123-review.md

Action Required:
1. Fix security issue in config.ts
2. Address reviewer feedback
3. Re-request review when ready
```

## Review Priorities

### P1: Must Fix (Blocking)

Issues that must be fixed before merge:
- Security vulnerabilities
- Critical bugs
- Data loss risks
- Breaking API changes (undocumented)
- Test failures

### P2: Should Fix (Important)

Issues that should be addressed:
- Performance problems
- Code quality issues
- Missing error handling
- Incomplete tests
- Technical debt

### P3: Consider (Optional)

Suggestions for improvement:
- Code style preferences
- Refactoring opportunities
- Documentation enhancements
- Nice-to-have features

## Review Strategies

### Quick Review (Default)

- Check automated tests/CI
- Scan code changes
- Look for obvious issues
- Fast turnaround

**Use for:** Small PRs, trusted authors, non-critical changes

### Detailed Review (--detailed)

- Thorough code analysis
- Security review
- Performance review
- Complete test review
- Documentation check

**Use for:** Large PRs, critical features, security changes

### Automated Only

- Run only automated checks
- No manual code review
- Report tool findings

**Use for:** Bot PRs, dependency updates, generated code

## Common Issues

### Issue: PR not found

**Cause:** PR number incorrect or not accessible

**Solution:**
```bash
# List open PRs
gh pr list
glab mr list

# Check PR number
gh pr view ${prNumber}
```

### Issue: CI checks not completed

**Cause:** CI/CD pipeline still running

**Solution:**
```bash
# Wait for checks to complete
gh pr checks ${prNumber} --watch

# Or review without waiting
/workflow:pr-review ${prNumber}  # Review shows "pending" status
```

### Issue: Merge conflicts detected

**Cause:** Base branch has conflicting changes

**Solution:**
```bash
# PR author should resolve conflicts
# Suggest in review:
echo "Please rebase on ${baseBranch} to resolve conflicts" \
  | gh pr comment ${prNumber} --body-file -
```

### Issue: Authentication failed

**Cause:** No credentials for provider

**Solution:**
```bash
# GitHub
gh auth login

# GitLab
glab auth login

# Verify authentication
gh auth status
glab auth status
```

## Best Practices

### Review Guidelines

- **Timely:** Review PRs within 24 hours
- **Constructive:** Provide actionable feedback
- **Specific:** Point to exact lines/files
- **Balanced:** Note good and bad
- **Educational:** Explain why something is an issue

### Review Checklist

```markdown
- [ ] Code implements stated requirements
- [ ] Tests cover new functionality
- [ ] No obvious bugs or errors
- [ ] Performance is acceptable
- [ ] Security best practices followed
- [ ] Error handling is comprehensive
- [ ] Code is readable and maintainable
- [ ] Documentation is updated
- [ ] No sensitive data exposed
- [ ] Breaking changes are documented
```

### Review Comments

**Good Comments:**
- "Consider using async/await here for better error handling"
- "This function could be simplified by extracting validation logic"
- "Great test coverage on edge cases!"

**Poor Comments:**
- "This is wrong"
- "Bad code"
- "Why did you do it this way?"

## Integration with Workflow

### PR-Based Workflow

```
Create PR → Automated Review → Human Review → Address Feedback → Merge
   ↑            ↑                   ↑              ↑              ↓
 create      this cmd           team            edit        close PR
```

### Review Phases

```
Phase 5: Review
├── Automated Review (this command)
│   ├── CI/CD checks
│   ├── Code analysis
│   └── Generate report
├── Human Review
│   ├── Read automated report
│   ├── Manual code review
│   └── Provide feedback
└── Iteration
    ├── Address feedback
    ├── Re-review
    └── Approve when ready
```

## Related Commands

- `/workflow:pr-create` - Create PR for review
- `/workflow:review` - Local code review (without PR)
- `/workflow:status` - Check PR status for tracks

## Technical Notes

### Review Data Sources

1. **Git diff:** Changed lines and files
2. **CI/CD:** Test results, build status
3. **Static analysis:** Linting, type checking
4. **Security scans:** Vulnerability checks
5. **Workflow plan:** Original requirements
6. **Commit history:** Change progression

### Review Automation

Automated checks can catch:
- ✓ Syntax errors (linting)
- ✓ Type errors (type checking)
- ✓ Test failures (CI)
- ✓ Security vulnerabilities (scanning)
- ✓ Code smells (static analysis)

Human review needed for:
- ✓ Business logic correctness
- ✓ Architectural decisions
- ✓ User experience
- ✓ Edge case coverage
- ✓ Design patterns

## Provider-Specific Features

### GitHub

```bash
# Request specific reviewers
gh pr review ${prNumber} --request-reviewer @user1,@user2

# Approve with auto-merge
gh pr review ${prNumber} --approve
gh pr merge ${prNumber} --auto

# View review status
gh pr checks ${prNumber}
```

### GitLab

```bash
# Approve MR
glab mr approve ${mrNumber}

# Add to approval rules
glab mr update ${mrNumber} --approval-rules

# View pipeline
glab ci view
```

### Gitea

```bash
# Review PR (tea CLI)
tea pr review ${prNumber}

# Add comment
tea pr comment ${prNumber} "Review feedback here"
```

## Summary

This command reviews a pull request with:
- ✓ Automated quality checks
- ✓ Code analysis
- ✓ Security scanning
- ✓ Test verification
- ✓ Structured feedback (P1/P2/P3)
- ✓ MCP or CLI-based review

The PR has been reviewed and feedback has been provided.
