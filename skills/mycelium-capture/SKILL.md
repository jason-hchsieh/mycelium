---
name: mycelium-capture
description: Captures learnings from completed work to grow the knowledge layer. Use when user says "capture this", "document learnings", "save what we learned", or after finalizing work. Stores solutions, decisions, conventions, preferences, anti-patterns, and effective prompts. Does NOT handle commits, PRs, or pattern detection (see mycelium-finalize and mycelium-patterns).
license: MIT
version: 0.9.0
argument-hint: "[track_id]"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
metadata:
  author: Jason Hsieh
  category: documentation
  tags: [knowledge-management, compound-engineering, learning, phase-6f]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Store Learned Knowledge

Capture and preserve learnings from completed work to grow the mycelium knowledge layer.

## Core Principle

**Every problem solved is knowledge gained. Capture it systematically so future work builds on past learnings.**

This skill implements Phase 6F (Store Learned Knowledge) of the mycelium workflow. It enforces structured solution documentation because undocumented solutions are lost knowledge. Compound engineering requires that each problem solved makes subsequent problems easier through institutional memory.

**Note:** This skill handles ONLY knowledge storage. Pattern detection is handled by `mycelium-patterns` (Phase 6E), and finalization (commits/PRs) is handled by `mycelium-finalize` (Phase 6).

## Your Task

1. **Update session state** - Write `invocation_mode: "single"` to [state.json][session-state-schema]

2. **Parse arguments**:
   - `track_id`: Specific completed track
   - Default: Most recently completed track

3. **Load track context**:
   - Completed plan from `.mycelium/plans/`
   - Commits and changes
   - Session state

4. **Execute knowledge capture** following the process below:
   - Problem categorization (solutions/decisions/conventions/preferences/anti-patterns)
   - Solution documentation with YAML validation
   - Knowledge structuring and storage

5. **Save learnings** to appropriate locations:
   - `.mycelium/solutions/{category}/` - Problem solutions
   - `.mycelium/learned/decisions/` - Architectural decisions
   - `.mycelium/learned/conventions/` - Code conventions
   - `.mycelium/learned/preferences.yaml` - User preferences
   - `.mycelium/learned/anti-patterns/` - What not to do
   - `.mycelium/learned/effective-prompts/` - Prompts that worked well

6. **Mark workflow complete:**
   - Update `current_phase: "completed"` in state.json
   - Set `workflow_complete: true`
   - No further phase chaining (workflow ends here)

---

## Solution Capture Process

### Step 1: Classify the Problem

Ask clarifying questions to classify:

**Problem Type** (enum):
- `performance_issue` - Slow execution, memory issues
- `database_issue` - Query problems, migrations, schema
- `security_issue` - Vulnerabilities, auth, encryption
- `ui_bug` - Visual issues, interaction problems
- `integration_issue` - API, third-party, service integration
- `configuration_issue` - Config, environment, deployment
- `dependency_issue` - Library conflicts, version problems
- `logic_error` - Business logic bugs
- `race_condition` - Timing, concurrency issues
- `memory_issue` - Leaks, excessive usage

**Component** (enum):
- `frontend` - UI components, client code
- `backend` - Server, business logic
- `database` - Schema, queries, migrations
- `api` - REST/GraphQL endpoints
- `auth` - Authentication, authorization
- `infrastructure` - Deployment, servers, cloud
- `cli` - Command-line interface
- `library` - Shared code, utilities
- `config` - Configuration files
- `test` - Testing infrastructure

**Root Cause** (enum):
- `missing_validation` - No input validation
- `missing_error_handling` - Unhandled exceptions
- `missing_null_check` - Null/undefined access
- `missing_await` - Forgot async/await
- `missing_index` - Database missing index
- `missing_include` - N+1 query, no eager loading
- `wrong_query` - Incorrect SQL/query logic
- `wrong_logic` - Business logic error
- `wrong_type` - Type mismatch
- `race_condition` - Timing issue
- `stale_cache` - Cache invalidation problem
- `config_mismatch` - Environment config wrong
- `dependency_conflict` - Library version conflict
- `api_deprecation` - Using deprecated API
- `schema_mismatch` - Data structure mismatch

**Severity**:
- `critical` - System down, data loss risk
- `high` - Major feature broken
- `medium` - Feature degraded
- `low` - Minor issue, workaround exists

### Step 2: Gather Solution Details

Collect comprehensive information:

**Required Fields:**
- Date (ISO format: YYYY-MM-DD)
- Problem type, component, root cause, severity
- Symptoms (what was observed)
- Tags (searchable keywords)

**Optional Fields:**
- Module/class affected
- Related files
- Related issues (links to similar solutions)
- Promoted to pattern (boolean)

### Step 3: Structure the Solution

Use this template:

```yaml
---
date: YYYY-MM-DD
problem_type: performance_issue
component: backend
root_cause: missing_include
severity: high
symptoms:
  - "N+1 query when loading email threads"
  - "Brief generation taking >5 seconds"
tags: [n-plus-one, eager-loading, performance]
module: BriefSystem
related_files:
  - app/models/brief.rb
  - app/services/brief_generator.rb
---

# N+1 Query in Brief Generation

## Problem

When generating briefs for users with many email threads, the
system was making one query per thread to fetch messages,
resulting in hundreds of queries and 5+ second response times.

## Root Cause

The Brief.includes() call was missing the nested :messages
association, causing lazy loading of messages for each thread
individually instead of eager loading them in a single query.

## Solution

Added .includes(threads: :messages) to the Brief query to
eager load all messages upfront:

```ruby
# Before (N+1 queries)
briefs = Brief.where(user_id: user.id).includes(:threads)

# After (2 queries)
briefs = Brief.where(user_id: user.id)
              .includes(threads: :messages)
```

## Code Example

```ruby
# File: app/services/brief_generator.rb

class BriefGenerator
  def generate_for_user(user)
    # Eager load all associations to avoid N+1
    briefs = Brief
      .where(user_id: user.id)
      .includes(threads: [:messages, :participants])
      .order(created_at: :desc)

    # Now accessing threads.messages doesn't trigger queries
    briefs.map { |brief| format_brief(brief) }
  end
end
```

## Verification

Measured with `Bullet` gem and Rails query logs:

Before:
- 247 queries
- 5.3 seconds

After:
- 3 queries
- 0.4 seconds

## Prevention

1. Always use `.includes()` for associations accessed in loops
2. Enable Bullet gem in development to detect N+1 queries
3. Review query logs during performance testing
4. Add test that asserts query count

## References

- Rails guide: https://guides.rubyonrails.org/active_record_querying.html#eager-loading-associations
- Related issue: .mycelium/solutions/performance-issues/n-plus-one-users.md
```

### Step 4: Validate YAML Frontmatter

**BLOCKING:** YAML validation must pass before proceeding.

Validate:
- All required fields present
- Enums match allowed values exactly
- Date in ISO format
- Tags is array of strings
- Symptoms is array of strings

If validation fails:
- Show specific error
- Provide correct enum values
- Fix and re-validate
- Do not proceed until valid

### Step 5: Categorize and Store

Save to `.mycelium/solutions/{category}/`:

**Categories:**
- `performance-issues/` - Speed, memory, efficiency
- `database-issues/` - Queries, schema, migrations
- `security-issues/` - Auth, encryption, vulnerabilities
- `ui-bugs/` - Visual, interaction problems
- `integration-issues/` - API, third-party services
- `configuration-issues/` - Config, environment
- `dependency-issues/` - Libraries, versions

**Filename Format:**
`{descriptive-name}-{YYYYMMDD}.md`

Example: `n-plus-one-brief-20260203.md`

---

## Beyond Solutions: Learned Knowledge

Capture more than just problem-solutions:

### Decisions (.mycelium/learned/decisions/)

Document why choices were made:

```yaml
---
date: 2026-02-03
decision: Use PostgreSQL over MongoDB
category: database
status: accepted
---

# Database Selection: PostgreSQL

## Context
Need to store user data with complex relationships
and ensure ACID guarantees.

## Options Considered
1. PostgreSQL (chosen)
2. MongoDB
3. MySQL

## Decision
Use PostgreSQL for relational data integrity
and mature tooling ecosystem.

## Rationale
- Strong ACID guarantees needed
- Complex joins required
- JSON support available when needed
- Team has PostgreSQL expertise

## Consequences
- Must design normalized schema
- Migrations required for schema changes
- Benefits from strong consistency

## References
- Discussion: [link to PR/issue]
- Benchmark: [performance comparison]
```

### Conventions (.mycelium/learned/conventions/)

Document discovered project patterns:

```yaml
---
category: error_handling
last_updated: 2026-02-03
---

# Error Handling Convention

## Pattern
All API errors return consistent structure:

```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Human readable message",
    details: {
      field: "email",
      reason: "invalid_format"
    }
  }
}
```

## Rationale
- Consistent client error handling
- Easier debugging
- Typed error codes

## Examples
See: src/utils/error-response.ts
```

### Preferences (.mycelium/learned/preferences.yaml)

Store user preferences learned over time:

```yaml
code_style:
  prefer_verbose_names: true
  max_function_length: 50
  comment_style: "doc_blocks_only"

testing:
  prefer_integration_over_e2e: true
  snapshot_tests_acceptable: false

communication:
  provide_reasoning: true
  show_alternatives: true
  explain_tradeoffs: true

workflow:
  commit_frequency: "per_task"
  review_depth: "standard"
  documentation_level: "inline_comments_plus_readme"
```

### Anti-Patterns (.mycelium/learned/anti-patterns/)

Document what NOT to do:

```yaml
---
anti_pattern: Mocking Everything
category: testing
severity: medium
---

# Anti-Pattern: Over-Mocking in Tests

## What NOT To Do
```typescript
// BAD: Mocking everything
jest.mock('./user-service')
jest.mock('./email-service')
jest.mock('./database')
jest.mock('./logger')
```

## Why It's Bad
- Tests don't verify real integration
- Mocks can diverge from real implementation
- False confidence in test coverage

## What To Do Instead
```typescript
// GOOD: Test real integration, mock only external services
import { UserService } from './user-service'
import { EmailService } from './email-service'

jest.mock('./external-email-api') // Only mock external boundary
```

## When Discovered
Multiple bugs in production that passed tests
because mocked services didn't match real behavior.
```

### Effective Prompts (.mycelium/learned/effective-prompts/)

Capture approaches that work well:

```yaml
---
task: debugging_race_conditions
effectiveness: high
---

# Effective Prompt: Race Condition Debugging

## Prompt Structure
"I have a race condition in [component]. Here's the sequence:
1. [Step 1]
2. [Step 2]
3. [Expected: X, Actual: Y]

Help me identify critical sections and add proper synchronization."

## Why It Works
- Provides sequence of events
- Shows expected vs actual
- Focuses on synchronization

## Example Results
- Identified missing mutex in cache access
- Found async callback ordering issue
- Discovered missing await in promise chain

## When To Use
- Intermittent failures
- Timing-dependent bugs
- Concurrent access issues
```

---

## Auto-Generation: Project Skills

When pattern is strong enough, generate skill:

### Trigger Conditions
- 3+ solutions with same root cause
- Pattern affects multiple components
- High severity or frequent occurrence
- Clear prevention strategy exists

### Generation Process
1. Extract common elements from solutions
2. Identify prevention strategies
3. Generate skill structure
4. Include code examples
5. Add to project skills directory
6. Register for auto-discovery

### Generated Skill Example
```yaml
---
name: N+1 Query Prevention
description: Auto-apply when working with database queries in this project
scope: project
auto_trigger: true
---

# N+1 Query Prevention (Project Skill)

Automatically generated from 5 occurrences of N+1 query issues.

## Detection
This skill triggers when:
- Working with ActiveRecord associations
- Iterating over collections
- Accessing related models

## Prevention
Always use `.includes()` for associations:

[Auto-generated examples from solutions...]
```

---

## Search and Retrieval

Make solutions discoverable:

### By Problem Type
```bash
find .mycelium/solutions/performance-issues/ -name "*.md"
```

### By Tag
```bash
grep -r "tags:.*n-plus-one" .mycelium/solutions/
```

### By Component
```bash
grep -r "component: backend" .mycelium/solutions/
```

### By Date Range
```bash
find .mycelium/solutions/ -name "*-202602*.md"
```

### Smart Search
Use `grep` with context to find relevant solutions:
```bash
grep -r "N+1 query" .mycelium/solutions/ -A 5 -B 5
```

---

## Validation Requirements

YAML validation is BLOCKING:

### Required Enum Values
```yaml
problem_type: [performance_issue, database_issue, security_issue,
               ui_bug, integration_issue, configuration_issue,
               dependency_issue, logic_error, race_condition,
               memory_issue]

component: [frontend, backend, database, api, auth,
           infrastructure, cli, library, config, test]

root_cause: [missing_validation, missing_error_handling,
            missing_null_check, missing_await, missing_index,
            missing_include, wrong_query, wrong_logic,
            wrong_type, race_condition, stale_cache,
            config_mismatch, dependency_conflict,
            api_deprecation, schema_mismatch]

severity: [critical, high, medium, low]
```

### Required Arrays
- `symptoms`: Must have at least 1 item
- `tags`: Must have at least 1 item

### Optional Fields
- All other fields are optional
- Include when information available
- Better documentation aids future lookup

---

## Common Capture Mistakes

### Too Vague
❌ **Bad:**
```yaml
problem_type: logic_error
symptoms:
  - "It didn't work"
```

✅ **Good:**
```yaml
problem_type: logic_error
root_cause: missing_validation
symptoms:
  - "Email validation regex rejected valid .museum domains"
  - "Users with museum email addresses couldn't register"
tags: [email, validation, regex, domain]
```

### Missing Context
❌ **Bad:**
```markdown
## Problem
The query was slow.

## Solution
Added an index.
```

✅ **Good:**
```markdown
## Problem
User search queries taking 8+ seconds on 100k user database.
Full table scan on users table for email lookups.

## Solution
Added composite index on users(email, status) for common
search pattern. Query time reduced from 8s to 45ms.

## Verification
- Ran EXPLAIN ANALYZE before: Seq Scan
- After: Index Scan using idx_users_email_status
- Benchmark: 8.2s → 0.045s (182x faster)
```

### No Reproduction Steps
❌ **Bad:**
```markdown
## Problem
Race condition in cache.
```

✅ **Good:**
```markdown
## Problem
Race condition when multiple workers update same cache key:
1. Worker A reads cache (miss)
2. Worker B reads cache (miss)
3. Worker A writes cache
4. Worker B writes cache (overwrites A)
Result: Latest write wins, A's work lost

## Solution
Added mutex around cache read-write:
[code example with lock]
```

---

## Workflow Completion

After capturing all learnings, mark the workflow as complete:

**Update state.json:**

```json
{
  "current_phase": "completed",
  "checkpoints": {
    "finalization_complete": "2026-02-13T11:35:00Z",
    "pattern_detection_complete": "2026-02-13T11:40:00Z",
    "knowledge_capture_complete": "2026-02-13T11:45:00Z"
  },
  "workflow_complete": true
}
```

**No further chaining:**

```javascript
// Workflow ends here - no next phase
output("✅ Knowledge captured. Workflow complete!")
output("")
output("Captured:")
output("  • {count} solutions")
output("  • {count} decisions")
output("  • {count} conventions")
output("")
output("Knowledge available for future sessions.")
```

---

## Quick Example

```bash
/mycelium-capture                    # Capture from latest track
/mycelium-capture auth_20260204      # Capture from specific track
```

## Important

- **YAML validation is mandatory** - All frontmatter must use valid enum values
- **Knowledge compounds** - Each capture makes future work easier
- **Phase 6F only** - Does NOT handle pattern detection (see `/mycelium-patterns`) or finalization (see `/mycelium-finalize`)
- Solution capture is not overhead - it's the mechanism that makes each unit of work accelerate subsequent work

## Summary

**Key principles:**
- Capture solutions systematically, not ad-hoc
- Validate YAML frontmatter (blocking requirement)
- Categorize for future discovery
- Go beyond problems: capture decisions, conventions, preferences
- Make knowledge searchable and reusable
- Every solved problem compounds future capability
- Mark workflow complete (end of Phase 6F)

## Skills Used

- **context**: For understanding project patterns and conventions

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Solution template][solution-template]
- [Solution frontmatter schema][solution-schema]
- [Enum definitions][enums]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[solution-template]: ../../templates/solutions/solution.md.template
[solution-schema]: ../../schemas/solution-frontmatter.schema.json
[enums]: ../../schemas/enums.json
