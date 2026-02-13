---
name: mycelium-patterns
description: Detects recurring patterns from 3+ similar solutions and promotes them to critical-patterns.md. Use when user says "detect patterns", "find recurring issues", "what patterns exist", or after completing work. Recommends skill generation for patterns occurring 5+ times or critical patterns.
license: MIT
version: 0.9.0
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
metadata:
  author: Jason Hsieh
  category: learning
  tags: [pattern-detection, critical-patterns, skill-generation, compound-engineering, phase-6e]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Pattern Detection

Detect recurring patterns from similar solutions and promote them to critical-patterns.md for reuse.

## Core Principle

**Patterns emerge from repetition. Detect 3+, document, promote to skills at 5+.**

This skill implements Phase 6E (Pattern Detection) of the mycelium workflow, ensuring that:
- Recurring solutions are identified and documented
- Patterns are promoted to critical-patterns.md for visibility
- Skill generation is recommended for frequently occurring patterns
- Knowledge compounds across sessions

## Your Task

1. **Update session state** - Write `invocation_mode: "single"` to [state.json][session-state-schema]

2. **Scan for similar solutions:**
   - Read all files in `.mycelium/solutions/**/*`
   - Group by: problem_type, component, root_cause
   - Identify patterns with 3+ occurrences

3. **Update critical-patterns.md:**
   - Add newly detected patterns
   - Include: problem, frequency, context, solution, examples
   - Mark skill candidates (5+ occurrences or critical)

4. **Recommend skill generation (optional):**
   - If pattern occurs 5+ times: strong skill candidate
   - If pattern is security/performance critical: recommend regardless of frequency
   - Suggest skill name and responsibilities

5. **Hand off to next phase:**
   - Update `current_phase: "store_knowledge"` in state.json
   - If `invocation_mode == "full"`: Invoke `mycelium-capture`
   - If `invocation_mode == "single"`: Suggest `/mycelium-capture`

---

## Step 1: Scan for Similar Solutions

### Load All Solutions

**Find solution files:**

```bash
# Glob all solution files
glob ".mycelium/solutions/**/*.md"

# Expected structure:
.mycelium/solutions/
├── performance-issues/
│   ├── n-plus-one-query-fix.md
│   ├── slow-api-response.md
│   └── memory-leak-fix.md
├── database-issues/
│   ├── missing-index.md
│   └── slow-query.md
├── security-issues/
│   ├── sql-injection-fix.md
│   └── xss-prevention.md
└── patterns/
    └── critical-patterns.md
```

### Extract Solution Metadata

**For each solution file:**

```javascript
// Read YAML frontmatter
const solution = read(".mycelium/solutions/performance-issues/n-plus-one-query-fix.md")

// Extract metadata
const metadata = {
  problem_type: "performance_issue",
  component: "api",
  root_cause: "missing_include",
  solution_pattern: "eager loading",
  occurred_at: "2026-02-10",
  files_affected: ["src/api/users.ts"]
}
```

### Group Similar Solutions

**Grouping strategy:**

```javascript
// Group by: problem_type + component + root_cause
const groups = {}

for (solution of solutions) {
  const key = `${solution.problem_type}_${solution.component}_${solution.root_cause}`

  if (!groups[key]) {
    groups[key] = []
  }

  groups[key].push(solution)
}

// Example groups:
{
  "performance_issue_api_missing_include": [
    "n-plus-one-query-fix.md",
    "user-list-slow.md",
    "post-list-slow.md"  // 3 occurrences → PATTERN!
  ],
  "security_issue_api_missing_validation": [
    "sql-injection-fix.md",
    "xss-prevention.md"  // 2 occurrences → not yet a pattern
  ]
}
```

---

## Step 2: Identify Patterns

### Pattern Detection Threshold

**When is it a pattern?**

- **3+ occurrences:** Emerging pattern, worth documenting
- **5+ occurrences:** Strong pattern, skill candidate
- **Critical (security/performance):** Pattern at any frequency

### Pattern Analysis

**For each group with 3+ solutions:**

```javascript
if (group.length >= 3) {
  const pattern = {
    name: derivePatternName(group),
    problem_type: group[0].problem_type,
    component: group[0].component,
    root_cause: group[0].root_cause,
    frequency: group.length,
    examples: group.map(s => s.file_path),
    first_seen: group[0].occurred_at,
    last_seen: group[group.length - 1].occurred_at
  }

  detected_patterns.push(pattern)
}
```

**Pattern naming:**

```javascript
function derivePatternName(group) {
  // Examples:
  // performance_issue + api + missing_include → "N+1 Query Pattern"
  // security_issue + api + missing_validation → "Input Validation Pattern"
  // database_issue + query + missing_index → "Database Index Pattern"

  const templates = {
    "performance_issue_api_missing_include": "N+1 Query Pattern",
    "performance_issue_api_slow_query": "Slow Query Optimization Pattern",
    "security_issue_api_missing_validation": "Input Validation Pattern",
    "security_issue_auth_weak_password": "Strong Password Enforcement Pattern",
    "database_issue_query_missing_index": "Database Index Pattern"
  }

  const key = `${group[0].problem_type}_${group[0].component}_${group[0].root_cause}`
  return templates[key] || `${group[0].root_cause} Pattern`
}
```

---

## Step 3: Update critical-patterns.md

### Read Existing Patterns

**Load current patterns:**

```bash
cat .mycelium/solutions/patterns/critical-patterns.md

# If doesn't exist, create it
if [ ! -f .mycelium/solutions/patterns/critical-patterns.md ]; then
  # Create from template
fi
```

### Add New Patterns

**Pattern entry format:**

```markdown
## Pattern: {Name}

**Problem:** {problem_type}
**Component:** {component}
**Frequency:** {count} occurrences ({first_seen} to {last_seen})
**Skill Candidate:** {Yes/No}

### Context

This pattern appears when {describe_when_it_occurs}.

### Problem Description

{describe_the_problem}

### Solution

{describe_the_solution}

### Implementation Steps

1. {step_1}
2. {step_2}
3. {step_3}

### Code Example

\`\`\`typescript
{example_code}
\`\`\`

### Examples in Codebase

- {example_1} (`.mycelium/solutions/...`)
- {example_2} (`.mycelium/solutions/...`)
- {example_3} (`.mycelium/solutions/...`)

### Prevention

- {how_to_prevent_this_issue}
- {best_practices}

### Related Patterns

- {related_pattern_1}
- {related_pattern_2}

---
```

**Example pattern:**

```markdown
## Pattern: N+1 Query Pattern

**Problem:** performance_issue
**Component:** api
**Frequency:** 5 occurrences (2026-01-15 to 2026-02-13)
**Skill Candidate:** Yes (5+ occurrences)

### Context

This pattern appears when fetching a list of entities and then accessing their related entities in a loop, causing N+1 database queries (1 for the list + N for each related entity).

### Problem Description

API endpoint responds slowly (500ms+) due to executing one database query per item in a list, instead of using eager loading or a JOIN.

### Solution

Use eager loading (`.include()` in Sequelize, `.with()` in SQLAlchemy) to fetch related entities in a single query.

### Implementation Steps

1. Identify the N+1 query using database query logging
2. Add eager loading to the initial query
3. Verify with EXPLAIN or query logs that only 1-2 queries are executed
4. Measure performance improvement

### Code Example

\`\`\`typescript
// BEFORE (N+1 queries)
const users = await User.findAll()
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } })
}
// Result: 1 + N queries (slow!)

// AFTER (2 queries)
const users = await User.findAll({
  include: [{ model: Post, as: 'posts' }]
})
// Result: 2 queries (fast!)
\`\`\`

### Examples in Codebase

- User list endpoint (`.mycelium/solutions/performance-issues/n-plus-one-query-fix.md`)
- Post list endpoint (`.mycelium/solutions/performance-issues/user-list-slow.md`)
- Comment list endpoint (`.mycelium/solutions/performance-issues/post-list-slow.md`)
- Project list endpoint (`.mycelium/solutions/performance-issues/project-list-slow.md`)
- Task list endpoint (`.mycelium/solutions/performance-issues/task-list-slow.md`)

### Prevention

- Always use eager loading for related entities
- Enable query logging in development to spot N+1 queries
- Use database profiling tools (e.g., New Relic, Datadog)
- Add performance tests for list endpoints

### Related Patterns

- Database Index Pattern (complementary)
- Pagination Pattern (when lists are large)

---
```

---

## Step 4: Recommend Skill Generation

### Skill Candidacy Criteria

**Strong candidates:**

1. **High frequency (5+ occurrences)**
   - Pattern is common enough to warrant automation
   - ROI: Time saved across multiple uses

2. **Critical patterns (security/performance)**
   - Even if frequency is low (2-3), critical patterns should be skills
   - Examples: SQL injection prevention, XSS sanitization, password hashing

3. **Repetitive implementation**
   - Same steps every time
   - Little variation between instances
   - Can be templated

**Example candidates:**

```javascript
// High frequency
{
  pattern: "N+1 Query Pattern",
  frequency: 5,
  skill_candidate: true,
  reason: "High frequency (5+), repetitive fix"
}

// Critical (security)
{
  pattern: "Input Validation Pattern",
  frequency: 3,
  skill_candidate: true,
  reason: "Security-critical, prevents SQL injection/XSS"
}

// Not yet a candidate
{
  pattern: "Custom Hook Pattern",
  frequency: 2,
  skill_candidate: false,
  reason: "Only 2 occurrences, wait for 3+"
}
```

### Skill Recommendation Output

**For each skill candidate:**

```markdown
### 🔧 Skill Recommendation: {skill_name}

**Pattern:** {pattern_name}
**Frequency:** {count} occurrences
**Reason:** {why_skill_candidate}

**Proposed Skill:**
- **Name:** `mycelium:{skill_name}`
- **Description:** {what_it_does}
- **Trigger:** {when_to_use}
- **Process:** {steps_it_automates}

**Estimated ROI:**
- Current: {time_per_manual_fix} × {frequency} = {total_time_saved}
- With skill: < 1 min per fix
- Time savings: ~{percentage}%

**Next Steps:**
1. Review pattern in critical-patterns.md
2. If approved, create skill: `/skill-creator {skill_name}`
3. Test skill on next occurrence

---
```

**Example:**

```markdown
### 🔧 Skill Recommendation: n-plus-one-fixer

**Pattern:** N+1 Query Pattern
**Frequency:** 5 occurrences
**Reason:** High frequency (5+), repetitive fix

**Proposed Skill:**
- **Name:** `mycelium:n-plus-one-fixer`
- **Description:** Detects and fixes N+1 query patterns by adding eager loading
- **Trigger:** "fix n+1 query", "optimize query", "slow list endpoint"
- **Process:**
  1. Enable query logging
  2. Identify the N+1 query
  3. Add eager loading (`.include()` for Sequelize, `.with()` for SQLAlchemy)
  4. Verify with query logs (1-2 queries instead of N+1)
  5. Measure performance improvement

**Estimated ROI:**
- Current: 15 min × 5 = 75 min total
- With skill: < 1 min per fix
- Time savings: ~93%

**Next Steps:**
1. Review pattern in critical-patterns.md
2. If approved, create skill: `/skill-creator n-plus-one-fixer`
3. Test skill on next occurrence

---
```

---

## Step 5: Phase Handoff

**Update state:**

```json
{
  "current_phase": "store_knowledge",
  "checkpoints": {
    "finalization_complete": "2026-02-13T11:35:00Z",
    "pattern_detection_complete": "2026-02-13T11:40:00Z"
  },
  "patterns_detected": 2,
  "skill_candidates": [
    {
      "pattern": "N+1 Query Pattern",
      "frequency": 5,
      "recommended": true
    },
    {
      "pattern": "Input Validation Pattern",
      "frequency": 3,
      "recommended": true
    }
  ]
}
```

**Chain or suggest:**

```javascript
if (invocation_mode == "full") {
  // Full workflow mode - chain to knowledge storage
  output("✅ Patterns detected. Capturing knowledge...")
  invoke("mycelium-capture")
} else {
  // Single phase mode - suggest next step
  output("✅ Patterns detected. Continue with: /mycelium-capture")
}
```

---

## Output Examples

### Example 1: Patterns Detected

```
🔍 Detecting Patterns

Scanning: .mycelium/solutions/**/*.md
Found: 23 solution files

Grouping by: problem_type + component + root_cause
Groups: 8

✅ Patterns Detected: 2

1. N+1 Query Pattern
   - Frequency: 5 occurrences
   - First seen: 2026-01-15
   - Last seen: 2026-02-13
   - Skill candidate: Yes (high frequency)

2. Input Validation Pattern
   - Frequency: 3 occurrences
   - First seen: 2026-02-05
   - Last seen: 2026-02-13
   - Skill candidate: Yes (security-critical)

Updated: .mycelium/solutions/patterns/critical-patterns.md

🔧 Skill Recommendations: 2

1. mycelium:n-plus-one-fixer
   - Automates N+1 query detection and fix
   - Estimated time savings: ~93%

2. mycelium:input-validator
   - Automates input validation enforcement
   - Prevents SQL injection, XSS

Next: /mycelium-capture (store learnings)
```

### Example 2: No Patterns Yet

```
🔍 Detecting Patterns

Scanning: .mycelium/solutions/**/*.md
Found: 5 solution files

Grouping by: problem_type + component + root_cause
Groups: 5 (all unique)

ℹ️ No Patterns Detected

Need 3+ similar solutions to identify a pattern.

Current solutions:
- performance-issues/n-plus-one-query-fix.md (1)
- security-issues/sql-injection-fix.md (1)
- database-issues/missing-index.md (1)
- ui-bugs/button-alignment.md (1)
- integration-issues/api-timeout.md (1)

Keep solving problems - patterns will emerge!

Next: /mycelium-capture (store learnings)
```

---

## Error Handling

**No solutions directory:**

```
⚠️ Warning: No solutions found

Directory .mycelium/solutions/ doesn't exist or is empty.

This is normal for new projects.
Patterns will be detected as you solve problems.

Skipping pattern detection.

Next: /mycelium-capture
```

**critical-patterns.md doesn't exist:**

```
ℹ️ Creating critical-patterns.md

File doesn't exist. Creating from template...

Created: .mycelium/solutions/patterns/critical-patterns.md

Will add detected patterns to this file.
```

**Invalid solution frontmatter:**

```
⚠️ Warning: Invalid solution file

File: .mycelium/solutions/performance-issues/broken.md
Issue: Missing required frontmatter fields

Skipping this file.

Continuing with remaining solutions...
```

---

## Quick Examples

```bash
# Detect patterns after completing work
/mycelium-patterns

# Shows:
# - Detected patterns (3+)
# - Skill recommendations (5+)
# - Updated critical-patterns.md
```

## Important Notes

- **3+ threshold** - Need 3 similar solutions to identify pattern
- **5+ for skills** - Skill generation recommended at 5+ occurrences
- **Security/performance always critical** - Even at low frequency
- **Automatic detection** - No manual tagging required
- **Compounds knowledge** - Each pattern makes future work easier
- **Skill recommendations optional** - User decides whether to create skills

## Pattern Categories

**Common patterns to detect:**

- **Performance:** N+1 queries, missing indexes, slow algorithms
- **Security:** SQL injection, XSS, weak passwords, missing auth
- **Database:** Schema issues, migrations, query optimization
- **UI:** Layout bugs, responsive issues, accessibility
- **Integration:** API timeouts, rate limiting, webhook handling
- **Logic:** Edge cases, validation, error handling

## References

- [`.mycelium/` directory structure][mycelium-dir]
- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [Solution frontmatter schema][solution-schema]
- [Critical patterns template][patterns-template]

[mycelium-dir]: ../../docs/mycelium-directory.md
[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
[solution-schema]: ../../schemas/solution-frontmatter.schema.json
[patterns-template]: ../../templates/project/critical-patterns.md.template
