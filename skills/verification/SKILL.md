---
name: Evidence-Based Verification
description: This skill should be used during Phase 4.5 (Verification) when the user requests "verify this", "check if it works", "run tests", "prove it works", or after implementation completion. Enforces evidence-based validation - no "should work" claims allowed, requires actual test execution with output shown and proof of correctness.
user-invocable: false
license: MIT
version: 0.9.0
metadata:
  author: Jason Hsieh
  category: testing
  tags: [evidence-based, testing, verification, quality-assurance]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Evidence-Based Verification

## Core Principle

**Claims of success MUST be backed by actual evidence. "Should work" is prohibited.**

This skill enforces rigorous verification practices because AI-generated code often appears correct but fails on edge cases, integration points, or real-world data. Every claim must be proven with executed commands and observed results.

## When to Use

Apply during Phase 4.5 (Verification) when:
- Implementation is marked complete
- Tests "should" be passing
- Feature appears to work
- Code changes are ready for review
- Merge/deployment is being considered

## The Iron Law of Verification

**Never claim success without running the actual verification command.**

Every verification claim requires:
1. Identify the exact proof command
2. Run it completely (not partially)
3. Read full output + exit codes
4. Verify output supports the claim
5. Only then state the result

## Prohibited Language

These phrases are BANNED in verification:
- ❌ "should work"
- ❌ "seems fine"
- ❌ "appears correct"
- ❌ "looks good"
- ❌ "probably passes"
- ❌ "likely works"
- ❌ "ought to pass"

Replace with evidence-based language:
- ✅ "Tests pass (exit code 0, 42/42 tests green)"
- ✅ "Verified by running: `npm test` - all assertions passed"
- ✅ "Evidence: coverage report shows 87% (above 80% target)"

## Verification Checklist

Run through this checklist for every completed task:

### 1. Unit Tests
**Command:** Execute full unit test suite
```bash
# Examples by language
npm test                    # JavaScript/TypeScript
pytest                      # Python
go test ./...               # Go
cargo test                  # Rust
mvn test                    # Java
bundle exec rspec           # Ruby
```

**Evidence Required:**
- Exit code is 0
- All tests passed (X/X green)
- No skipped tests (or justify why)
- Duration reasonable (not timing out)

### 2. Test Coverage
**Command:** Generate coverage report
```bash
# Examples
npm run test:coverage       # JavaScript
pytest --cov=src --cov-report=term
go test -cover ./...
cargo tarpaulin
```

**Evidence Required:**
- Coverage percentage meets target (≥80% by default)
- New code is covered (not just overall percentage)
- Critical paths at 100% coverage

### 3. Integration Tests
**Command:** Run integration test suite (if applicable)
```bash
npm run test:integration
pytest tests/integration/
go test -tags=integration ./...
```

**Evidence Required:**
- All integration tests pass
- External dependencies properly mocked/stubbed
- API contracts verified

### 4. Linting and Style
**Command:** Run linter
```bash
npm run lint                # ESLint
pylint src/
golangci-lint run
cargo clippy
```

**Evidence Required:**
- Zero errors
- Zero warnings (or justify allowed warnings)
- Style rules enforced

### 5. Type Checking
**Command:** Run type checker (if typed language)
```bash
npx tsc --noEmit           # TypeScript
mypy src/                  # Python
# Go/Rust compile-time checked
```

**Evidence Required:**
- No type errors
- No implicit any (TypeScript)
- Type safety verified

### 6. Build Verification
**Command:** Run production build
```bash
npm run build
python setup.py bdist_wheel
go build ./...
cargo build --release
```

**Evidence Required:**
- Build succeeds (exit code 0)
- No warnings (or document allowed ones)
- Artifacts generated correctly

### 7. Functional Verification
**Command:** Manual execution/smoke test
```bash
# Start application
npm start
# Execute specific feature
curl http://localhost:3000/api/endpoint
# Or manual UI testing
```

**Evidence Required:**
- Feature works as specified
- Edge cases handled
- Error messages appropriate
- Performance acceptable

## Verification Levels

Match verification rigor to project maturity:

### Prototype Projects
**Required:**
- Unit tests for new code pass
- Feature demonstrably works
- No critical errors

**Optional:**
- Coverage targets
- Integration tests
- Full lint compliance

### Development Projects
**Required:**
- All unit tests pass
- Coverage ≥80%
- Feature works as specified
- Linting clean
- Type checking passes

**Optional:**
- Integration tests (recommended)
- Performance benchmarks

### Production Projects
**Required:**
- All unit tests pass
- All integration tests pass
- Coverage ≥80%
- All linting rules pass
- Type checking passes
- Build succeeds
- Feature verified manually
- Performance acceptable

**Critical:**
- Security scan clean
- No known vulnerabilities
- Breaking changes documented

### Regulated Projects
**Required:** All production checks PLUS
- Coverage ≥95%
- Full audit trail
- Compliance checks pass
- Documentation complete
- Human approval obtained

## Evidence Documentation

Document verification results clearly:

### Good Example
```markdown
## Verification Results

✅ Unit Tests: PASS
- Command: `npm test`
- Result: 47/47 tests passed
- Duration: 3.2s
- Exit code: 0

✅ Coverage: PASS
- Command: `npm run test:coverage`
- Result: 84% lines, 82% branches
- Target: 80%
- Evidence: coverage/index.html generated

✅ Linting: PASS
- Command: `npm run lint`
- Result: 0 errors, 0 warnings
- Exit code: 0

✅ Build: PASS
- Command: `npm run build`
- Result: dist/ generated successfully
- Size: 127KB (within budget)

✅ Manual Verification: PASS
- Tested user login flow
- Successful authentication
- Error handling verified
- Screenshot: verification/login-success.png
```

### Bad Example
```markdown
## Verification Results

Tests should pass because I wrote them correctly.
The code looks good and follows best practices.
Linting seems fine, no obvious errors.
```

## Partial Verification is Not Verification

**Do not claim:**
- "95% of tests pass" → 5% failing means NOT VERIFIED
- "Most linting rules pass" → Any error means NOT VERIFIED
- "Works on my machine" → Must work in CI environment
- "Manual testing shows it works" → Need automated proof

**Full verification required:**
- 100% of tests pass (or blockers documented)
- Zero linting errors (or exceptions justified)
- Works in all required environments
- Both automated and manual checks pass

## Handling Verification Failures

### First Failure
1. Read the full error message
2. Identify root cause
3. Fix the issue
4. Re-verify completely

### Second Failure
1. Question the test (is it correct?)
2. Question the specification (was it clear?)
3. Try alternative implementation
4. Re-verify completely

### Third Failure
**STOP. Escalate.**
- Suspect architecture problem, not implementation
- Review design decisions
- Ask for human guidance
- Document the blocker

## Alternative Verification Methods

When traditional tests are impractical:

### Legacy Code (No Tests)
✅ **Acceptable:**
- Write characterization test for changed code
- Golden file comparison (snapshot)
- Manual verification checklist with screenshots
- Document what was verified manually

❌ **Not Acceptable:**
- Skip verification entirely
- Trust that nothing broke
- "Looks the same" without proof

### UI/Visual Changes
✅ **Acceptable:**
- Visual regression tests (Percy, Chromatic)
- Screenshot comparison with before/after
- Manual checklist with documented steps
- Storybook component verification

❌ **Not Acceptable:**
- "UI looks fine to me"
- No before/after comparison
- No evidence captured

### Infrastructure Changes
✅ **Acceptable:**
- Dry-run/plan preview
- Canary deployment verification
- Rollback test execution
- Drift detection reports

❌ **Not Acceptable:**
- "Should work in production"
- Untested deploy scripts
- No rollback plan

### ML/AI Models
✅ **Acceptable:**
- Benchmark on test dataset
- Regression tests on known inputs
- Performance metrics comparison
- A/B test results

❌ **Not Acceptable:**
- "Seems to work well"
- No quantitative metrics
- Cherry-picked examples

## Integration with Workflow

**Phase 4.5: Verification (THIS SKILL)**
- Apply evidence-based verification
- Document all verification results
- Block progression on failures
- No "should work" claims allowed

**Phase 4: Implementation**
- TDD skill ensures tests written first
- Tests must pass before marking complete
- This skill provides verification proof

**Phase 5: Review**
- Verification results inform review
- Evidence of correctness demonstrated
- Review focuses on quality, not correctness

## Verification Commands by Language

### JavaScript/TypeScript
```bash
# Tests
npm test
npm run test:watch

# Coverage
npm run test:coverage
npx jest --coverage

# Linting
npm run lint
npx eslint .

# Type checking
npx tsc --noEmit

# Build
npm run build
```

### Python
```bash
# Tests
pytest
python -m pytest

# Coverage
pytest --cov=src --cov-report=html
coverage run -m pytest

# Linting
pylint src/
flake8 src/
ruff check .

# Type checking
mypy src/

# Build
python -m build
```

### Go
```bash
# Tests
go test ./...
go test -v ./...

# Coverage
go test -cover ./...
go test -coverprofile=coverage.out ./...

# Linting
golangci-lint run
go vet ./...

# Build
go build ./...
```

### Rust
```bash
# Tests
cargo test
cargo test --all-features

# Coverage
cargo tarpaulin --out Html

# Linting
cargo clippy
cargo clippy -- -D warnings

# Build
cargo build --release
```

## Common Verification Failures

### False Positives
**Problem:** Tests pass but feature doesn't work
**Cause:** Tests don't actually test the requirement
**Solution:** Review test validity, add missing assertions

### Environment Differences
**Problem:** Passes locally, fails in CI
**Cause:** Different dependencies, env vars, or configs
**Solution:** Run tests in clean environment, match CI setup

### Flaky Tests
**Problem:** Tests pass sometimes, fail randomly
**Cause:** Timing issues, shared state, async problems
**Solution:** Fix root cause before proceeding, never ignore

### Coverage False Sense
**Problem:** High coverage but bugs exist
**Cause:** Lines covered but assertions weak
**Solution:** Review test quality, not just quantity

## Verification Anti-Patterns

### Trust Without Testing
❌ **Anti-pattern:**
```
"I ran the tests earlier and they passed,
so the current code should be fine."
```

✅ **Correct:**
```
"Running tests now to verify..."
[execute tests]
"Tests pass: 47/47 green, exit code 0"
```

### Partial Test Runs
❌ **Anti-pattern:**
```
"I tested the specific function I changed,
that should be enough."
```

✅ **Correct:**
```
"Running full test suite to catch regressions..."
[execute all tests]
"Full suite passes, including integration tests"
```

### Unverified Agent Claims
❌ **Anti-pattern:**
```
"The subagent reported that tests pass."
```

✅ **Correct:**
```
"Verifying subagent's claim by running tests..."
[execute tests directly]
"Confirmed: tests pass as reported"
```

### Skipping Due to Fatigue
❌ **Anti-pattern:**
```
"We've been working on this for a while,
let's skip verification and move on."
```

✅ **Correct:**
```
"Long session requires careful verification.
Taking time to verify properly..."
[complete full verification]
"Verified before proceeding"
```

## Checklist Before Declaring Complete

Before saying "implementation is complete":

- [ ] Unit tests executed and pass (100%)
- [ ] Coverage measured and meets target
- [ ] Integration tests pass (if applicable)
- [ ] Linting passes with zero errors
- [ ] Type checking passes (if applicable)
- [ ] Build succeeds
- [ ] Manual verification performed
- [ ] Performance acceptable
- [ ] Security considerations checked
- [ ] All evidence documented
- [ ] No "should work" language used

If ANY item unchecked → implementation NOT complete.

## Summary

**Remember:**
- Evidence over assumptions
- Run actual commands, read actual output
- Never trust without verification
- Document all verification results
- Partial success is not success
- When verification fails repeatedly, escalate
- No "should work" - only "verified to work"

Verification is not optional. It's the gate between code and confidence.

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Enum definitions][enums]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[enums]: ../../schemas/enums.json
