---
name: Iron Law TDD
description: This skill should be used when the user asks to "implement a feature", "write code", "add functionality", "fix a bug", or during any code implementation phase. Enforces the Iron Law of TDD - tests must be written first and all tests must pass before implementation is considered complete.
version: 0.1.0
---

# Iron Law TDD

## Core Principle

**Tests MUST be written first. Implementation MUST NOT proceed without failing tests.**

This skill enforces Test-Driven Development as a non-negotiable practice during all code implementation. The Iron Law exists because AI coding tools can easily generate code that "should work" but doesn't handle edge cases or integration complexities.

## When to Use

Apply this skill during:
- Feature implementation
- Bug fixes
- Refactoring
- API development
- Database operations
- Any code changes that affect behavior

## The 11-Step Cycle

Follow this cycle for every implementation task, no exceptions:

### 1. Write the Test First
Before any implementation code, write a test that:
- Defines the desired behavior clearly
- Will fail initially (proves test is actually running)
- Tests the interface, not implementation details
- Covers the happy path first

### 2. Run the Test - Watch It Fail
Execute the test suite and verify:
- The new test fails for the right reason
- Failure message is clear and actionable
- No other tests are broken

**Why this matters:** Confirms the test is actually running and detecting the missing functionality.

### 3. Write Minimal Implementation
Write only enough code to make the failing test pass:
- Implement the simplest solution
- Do not add features not covered by tests
- Avoid premature optimization
- Focus on making the test green

### 4. Run Tests - Achieve Green
Execute the full test suite:
- The new test must pass
- All existing tests must still pass
- No tests skipped or ignored

### 5. Add Edge Case Tests
Now expand test coverage for:
- Error conditions and exceptions
- Boundary values
- Null/undefined inputs
- Empty collections
- Invalid states

### 6. Update Implementation for Edge Cases
Modify implementation to handle all edge cases:
- Add validation
- Implement error handling
- Handle boundary conditions
- Ensure robustness

### 7. Run Full Test Suite
Execute complete test suite including:
- Unit tests
- Integration tests (if applicable)
- All tests must pass

### 8. Refactor (Optional)
If code is working but not clean:
- Improve readability
- Extract functions/methods
- Remove duplication
- Simplify complex logic

**Important:** Run tests after each refactoring step.

### 9. Verify Test Coverage
Check that tests cover:
- All code paths
- Error handling
- Edge cases
- Integration points

Target coverage: 80% minimum, 95% for critical code.

### 10. Review Test Quality
Ensure tests are:
- Independent (no shared state)
- Deterministic (same result every time)
- Fast (< 1 second per unit test)
- Clear (test name describes what's tested)
- Maintainable (easy to update)

### 11. Documentation Check
Update documentation if:
- Public API changed
- Behavior changed
- New features added
- Configuration options added

## Rejected Rationalizations

**Common excuses and why they're wrong:**

### "It's too simple to test"
❌ **Excuse:** "This function is so simple, it doesn't need a test."
✅ **Reality:** Simple functions break too. Write the test. It takes 2 minutes.

### "I'll add tests later"
❌ **Excuse:** "Let me get it working first, then I'll add tests."
✅ **Reality:** "Later" never comes. Tests written after implementation are biased by the implementation and miss edge cases.

### "The tests are slowing me down"
❌ **Excuse:** "Writing tests first is taking too long."
✅ **Reality:** Tests save time by catching bugs immediately instead of during debugging sessions or production incidents.

### "This is just a prototype"
❌ **Excuse:** "This is prototype code, tests aren't necessary yet."
✅ **Reality:** Prototypes become production code. Either write tests now or rewrite it later with tests.

### "I'm just trying something quickly"
❌ **Excuse:** "Let me experiment without tests to see if this approach works."
✅ **Reality:** Acceptable for throwaway spike code that won't be committed. Any code that stays must have tests.

### "The code is obviously correct"
❌ **Excuse:** "This logic is straightforward, clearly correct by inspection."
✅ **Reality:** "Obviously correct" code has bugs. Integration with the rest of the system creates unexpected interactions.

## Verification Commands

Use these commands to verify TDD compliance:

### Run Tests
```bash
# Node/JavaScript
npm test
npm run test:coverage

# Python
pytest
pytest --cov=src

# Go
go test ./...
go test -cover ./...

# Rust
cargo test
cargo test --all-features
```

### Check Coverage
```bash
# Node/JavaScript
npm run coverage
npx jest --coverage

# Python
pytest --cov=src --cov-report=html

# Go
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Rust
cargo tarpaulin --out Html
```

### Watch Mode (Continuous Testing)
```bash
# Node/JavaScript
npm run test:watch
npx jest --watch

# Python
pytest-watch

# Rust
cargo watch -x test
```

## Test Organization

### File Structure
```
src/
├── feature.ts          # Implementation
└── feature.test.ts     # Tests

# Or separate directories
src/
tests/
```

### Test Naming
```javascript
// Good: Descriptive test names
describe('UserAuthentication', () => {
  it('should return token when credentials are valid', () => {})
  it('should throw error when password is incorrect', () => {})
  it('should handle missing username gracefully', () => {})
})

// Bad: Vague test names
describe('auth', () => {
  it('works', () => {})
  it('fails', () => {})
})
```

### Test Structure (Arrange-Act-Assert)
```javascript
it('should calculate discount correctly', () => {
  // Arrange: Set up test data
  const price = 100
  const discountPercent = 20

  // Act: Execute the function
  const result = calculateDiscount(price, discountPercent)

  // Assert: Verify the result
  expect(result).toBe(80)
})
```

## What Makes a Good Test

### Characteristics of Good Tests

**FIRST principles:**
- **Fast:** Tests run quickly (unit tests < 1 second)
- **Independent:** Tests don't depend on each other
- **Repeatable:** Same result every run
- **Self-validating:** Clear pass/fail (no manual inspection)
- **Timely:** Written before implementation code

### Test Coverage Goals

**Minimum coverage:** 80% of lines
**Production code:** 90-95% of lines
**Critical paths:** 100% coverage

**What to test:**
- Public API/interfaces
- Business logic
- Error handling
- Edge cases and boundaries
- Integration points

**What NOT to test:**
- Private implementation details
- External libraries (trust their tests)
- Trivial getters/setters
- Framework boilerplate

## Common Pitfalls

### Testing Implementation Details
❌ **Bad:**
```javascript
// Test checks internal variable
expect(service._internalCache).toHaveLength(1)
```

✅ **Good:**
```javascript
// Test checks observable behavior
expect(service.getUser(id)).toEqual(expectedUser)
```

### Tests That Don't Test
❌ **Bad:**
```javascript
it('should work', () => {
  const result = doSomething()
  // No assertion!
})
```

✅ **Good:**
```javascript
it('should return calculated total', () => {
  const result = calculateTotal([10, 20, 30])
  expect(result).toBe(60)
})
```

### Shared State Between Tests
❌ **Bad:**
```javascript
let sharedUser // State shared between tests
it('creates user', () => {
  sharedUser = createUser()
})
it('updates user', () => {
  updateUser(sharedUser) // Depends on previous test
})
```

✅ **Good:**
```javascript
it('creates user', () => {
  const user = createUser()
  expect(user).toBeDefined()
})
it('updates user', () => {
  const user = createUser() // Independent setup
  updateUser(user)
  expect(user.updated).toBe(true)
})
```

## Integration with Workflow

This TDD skill integrates with the overall adaptive workflow:

**Phase 4: Implementation**
- Step 4A: Write tests FIRST (this skill enforces this)
- Step 4B: Implement to make tests pass
- Step 4C: Parallel execution with TDD in each worktree
- Step 4.5: Verification requires all tests passing

**Phase 4.5: Verification**
- Evidence-based verification skill checks test results
- No "should work" claims accepted
- Tests must actually run and pass

**Phase 6: Knowledge Capture**
- Patterns in test organization captured in solutions/
- Effective testing approaches stored in learned/effective-prompts/

## Language-Specific Guidance

### JavaScript/TypeScript
**Frameworks:** Jest, Vitest, Mocha + Chai
**Coverage:** nyc, c8, Jest built-in
**Watch mode:** `npm run test:watch`

### Python
**Frameworks:** pytest, unittest
**Coverage:** pytest-cov, coverage.py
**Watch mode:** pytest-watch

### Go
**Framework:** Built-in testing package
**Coverage:** `go test -cover`
**Table tests:** Use for multiple test cases

### Rust
**Framework:** Built-in test framework
**Coverage:** cargo-tarpaulin
**Doc tests:** Test code examples in documentation

## Enforcement

This skill is enforced through:

1. **Phase 4A mandate:** Tests written before implementation
2. **Verification gate:** All tests must pass before proceeding
3. **Review criteria:** Test quality checked in code review
4. **CI/CD gates:** Tests run automatically, block merge if failing
5. **Metrics tracking:** Test coverage tracked in session metrics

## Exceptions

The ONLY acceptable exceptions to TDD:

1. **Spike code:** Exploratory code that will be thrown away
2. **External constraints:** Third-party code without test infrastructure
3. **User explicitly opts out:** User acknowledges risk and accepts reduced quality

All exceptions must be:
- Explicitly documented
- Time-limited
- Converted to tested code before production

## Summary

**Remember:**
- Tests first, always
- Watch tests fail, then pass
- Cover edge cases
- Run full suite
- No rationalizations accepted
- TDD saves time by preventing bugs

The Iron Law exists because it works. Follow it.
