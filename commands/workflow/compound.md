---
name: workflow:compound
description: Capture learnings and solutions with YAML validation (Phase 6). Auto-triggered on success indicators, categorizes problems by type, detects patterns across solutions, promotes recurring issues to critical-patterns.md.
argument-hint: "[--auto]"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Skill"]
---

# Workflow Compound Command

Capture and compound knowledge from completed work. This is Phase 6 (Compound Learning) of the workflow.

## Your Task

Transform solved problems into reusable knowledge that makes future work easier through systematic knowledge capture and pattern detection.

## Core Philosophy

**Compound Engineering:** Each unit of work should make subsequent units easier through captured knowledge and systematic processes.

## When to Trigger

### Auto-trigger Phrases (when --auto flag set)
- "that worked"
- "it's fixed"
- "problem solved"
- "bug resolved"
- "successfully implemented"
- "tests passing now"

### Manual Trigger
User explicitly runs `/workflow:compound` after:
- Solving a non-trivial problem
- Discovering a pattern
- Making an architectural decision
- Learning something valuable

## Capture Process

### 1. Identify What to Capture

Ask user (or infer from context):
- Was there a problem that was solved?
- Was a decision made (architectural, technical)?
- Was a convention established?
- Was an anti-pattern discovered?
- Was user preference revealed?

### 2. Categorize the Learning

Determine which category applies:

**A. SOLUTION (problem → fix)**
- Something broke or didn't work
- We found root cause
- We implemented a fix
→ Save to `.workflow/solutions/{category}/`

**B. DECISION (choice made)**
- Had multiple options
- Evaluated tradeoffs
- Chose one approach
→ Save to `.workflow/learned/decisions/`

**C. CONVENTION (project pattern)**
- How we structure code
- Naming conventions
- File organization
→ Save to `.workflow/learned/conventions/`

**D. PREFERENCE (user likes)**
- User said "I prefer X"
- User corrected our approach
- Style choices
→ Update `.workflow/learned/preferences.yaml`

**E. ANTI-PATTERN (don't do this)**
- Something we tried that failed
- Known bad practice for this project
- Mistakes to avoid
→ Save to `.workflow/learned/anti-patterns/`

### 3. Capture SOLUTION (Most Common)

If capturing a solution, create structured document with YAML frontmatter.

#### Solution Template

Save to `.workflow/solutions/{category}/YYYY-MM-DD-{slug}.md`:

```markdown
---
date: 2026-02-03
problem_type: {ProblemType enum}
component: {ComponentType enum}
root_cause: {RootCause enum}
severity: critical|high|medium|low
symptoms:
  - "{Observable symptom 1}"
  - "{Observable symptom 2}"
tags: [searchable, keywords, for, finding]
module: {Specific module or file affected}
related_files:
  - src/path/to/file1.ts
  - src/path/to/file2.ts
---

# {Descriptive Title}

## Problem
{What went wrong and how it manifested}

## Context
- When did this happen?
- What were we trying to do?
- What was the environment?

## Symptoms
- {Observable symptom 1}
- {Observable symptom 2}
- {Error messages, logs, behavior}

## Investigation
{How we figured out what was wrong}

## Root Cause
{Why it happened - the actual underlying cause}

## Solution
{What we did to fix it}

### Code Changes
```{language}
// Before (problematic)
{old code}

// After (fixed)
{new code}
```

## Verification
{How we confirmed the fix worked}
```bash
{test commands and output}
```

## Prevention
{How to avoid this in the future}

## Related Patterns
{Links to related solutions or patterns}

## Tags
{tags for searchability}
```

#### YAML Frontmatter Validation (BLOCKING)

**CRITICAL:** Validate YAML against schemas before saving.

**Required Fields:**
- `date`: ISO 8601 format (YYYY-MM-DD)
- `problem_type`: Must be valid ProblemType enum value
- `component`: Must be valid ComponentType enum value
- `root_cause`: Must be valid RootCause enum value
- `severity`: Must be critical|high|medium|low

**Valid Enum Values:**

```yaml
ProblemType:
  - performance_issue
  - database_issue
  - security_issue
  - ui_bug
  - integration_issue
  - configuration_issue
  - dependency_issue
  - logic_error
  - race_condition
  - memory_issue

ComponentType:
  - frontend
  - backend
  - database
  - api
  - auth
  - infrastructure
  - cli
  - library
  - config
  - test

RootCause:
  - missing_validation
  - missing_error_handling
  - missing_null_check
  - missing_await
  - missing_index
  - missing_include
  - wrong_query
  - wrong_logic
  - wrong_type
  - race_condition
  - stale_cache
  - config_mismatch
  - dependency_conflict
  - api_deprecation
  - schema_mismatch
```

**If validation fails:** STOP and ask user to correct values. Do not save invalid YAML.

#### Solution Categories

Choose appropriate directory:
- `performance-issues/` - Slow queries, optimization
- `database-issues/` - Schema, migrations, queries
- `security-issues/` - Auth, validation, vulnerabilities
- `ui-bugs/` - Frontend rendering, state management
- `integration-issues/` - API, third-party services
- `configuration-issues/` - Environment, deployment
- `dependency-issues/` - Package conflicts, versions
- `logic-errors/` - Business logic bugs
- `race-conditions/` - Concurrency problems
- `memory-issues/` - Leaks, excessive usage

### 4. Capture DECISION

Save to `.workflow/learned/decisions/YYYY-MM-DD-{slug}.md`:

```markdown
---
date: 2026-02-03
decision: {Short statement of choice made}
category: {architecture|technology|process|tooling}
alternatives_considered:
  - {option 1}
  - {option 2}
  - {option 3}
chosen: {which option}
rationale: "{Why we chose this}"
trade_offs:
  pros:
    - {Benefit 1}
    - {Benefit 2}
  cons:
    - {Drawback 1}
    - {Drawback 2}
---

# Decision: {Title}

## Context
{What prompted this decision}

## Options Considered

### Option 1: {Name}
**Pros:**
- {Pro 1}

**Cons:**
- {Con 1}

### Option 2: {Name}
...

## Decision
We chose: {option}

## Rationale
{Why we made this choice}

## Implications
{What this means for future work}

## Review Date
{When to revisit this decision, if applicable}
```

### 5. Capture CONVENTION

Save to `.workflow/learned/conventions/YYYY-MM-DD-{category}.md`:

```markdown
---
category: {naming|structure|testing|documentation}
confidence: high|medium|low
source: user_specified|detected_from_codebase|learned_from_external
examples_found: {count if detected}
last_updated: 2026-02-03
---

# {Category} Conventions

## {Subcategory}

### Rule
{The convention to follow}

### Examples
```{language}
// Good
{example of following convention}

// Bad
{example of violating convention}
```

### Rationale
{Why this convention exists}

### Exceptions
{When it's okay to break this rule}
```

### 6. Update PREFERENCES

Append to `.workflow/learned/preferences.yaml`:

```yaml
preferences:
  code_style:
    - preference: "Use early returns over nested conditionals"
      confidence: high
      learned_from: "User correction on 2026-02-03"

  architecture:
    - preference: "Prefer composition over inheritance"
      confidence: high
      learned_from: "Design decision 2026-02-01"

  tooling:
    - preference: "Use pnpm instead of npm"
      confidence: high
      learned_from: "Setup conversation 2026-02-03"

  communication:
    - preference: "Show full test output, not summaries"
      confidence: medium
      learned_from: "User feedback 2026-02-03"
```

### 7. Capture ANTI-PATTERN

Save to `.workflow/learned/anti-patterns/YYYY-MM-DD-{slug}.md`:

```markdown
---
name: {Anti-pattern name}
severity: critical|high|medium|low
occurrences: {how many times we fell into this}
components: [affected areas]
last_seen: 2026-02-03
---

# Anti-Pattern: {Name}

## What NOT To Do
```{language}
// BAD - Don't do this
{problematic code}
```

## Why This Is Bad
{Explain the problems this causes}

## What To Do Instead
```{language}
// GOOD - Do this
{correct approach}
```

## Detection
{How to spot this anti-pattern}

## Occurrences
{When we encountered this and what happened}
```

## Pattern Detection (Automatic)

After saving a solution:

### 1. Search for Similar Solutions

```bash
# Search for similar problem_type
grep -r "problem_type: {same_type}" .workflow/solutions/

# Search for similar root_cause
grep -r "root_cause: {same_cause}" .workflow/solutions/

# Search for similar tags
grep -r "tags:.*{tag}" .workflow/solutions/
```

### 2. Pattern Promotion Threshold

If 3+ similar solutions found:
- Analyze common elements
- Create pattern entry in `critical-patterns.md`
- Link back to individual solutions

### 3. Update critical-patterns.md

Add to `.workflow/solutions/patterns/critical-patterns.md`:

```markdown
## Pattern: {Pattern Name}

**Severity:** Critical
**Occurrences:** {count}
**Last Updated:** 2026-02-03

### Problem
{What keeps going wrong}

### Solution
{The pattern to always follow}

### Example
```{language}
// DON'T
{anti-pattern}

// DO
{correct pattern}
```

### References
- [Solution 1](.workflow/solutions/{category}/{file1}.md)
- [Solution 2](.workflow/solutions/{category}/{file2}.md)
- [Solution 3](.workflow/solutions/{category}/{file3}.md)

### Why This Matters
{Impact of following/not following this pattern}
```

## Knowledge Promotion Options

After capturing, ask user:

**Options:**
1. **Continue workflow** - Just save and move on
2. **Add to Required Reading** - Add to CLAUDE.md for immediate visibility
3. **Link related issues** - Connect to similar solutions
4. **Add to existing skill** - Incorporate into relevant skill
5. **Create new skill** - Generate project-specific skill (advanced)

## Skill Generation (Advanced)

If user chooses option 5:

1. Analyze multiple solutions in category
2. Extract common patterns
3. Generate SKILL.md in `.claude/plugins/{project}/skills/`
4. Skill becomes available in next session via discovery

See design.md SKILL GENERATION section for details.

## Error Handling

**If YAML validation fails:**
- Show validation errors clearly
- List valid enum values
- Ask user to provide correct values
- Do NOT save invalid YAML (BLOCKING)

**If category unclear:**
- Ask user which category applies
- Suggest based on context
- Default to "other" if needed

**If nothing to capture:**
- Inform user no significant learnings detected
- Ask if they want to document something anyway

## Skills to Use

- **solution-capture**: Core skill for this command
- **context**: For understanding project conventions

## Important Notes

- YAML validation is BLOCKING - must be valid before save
- Use exact enum values from schemas
- Pattern detection is automatic when threshold met
- All captured knowledge loaded at session start (Phase 0B)
- Makes future work easier through institutional knowledge
- This is compound engineering in action

## After Capture

- Confirm what was saved and where
- Show pattern detection results if applicable
- Suggest returning to workflow (next task or finish)
- Update session_state.json with capture timestamp

## Benefits Over Time

With consistent knowledge capture:
- Fewer repeated mistakes
- Faster problem solving (search solutions first)
- Better architectural decisions (reference past choices)
- Stronger project conventions (documented patterns)
- Improved AI assistance (Claude learns project specifics)

This is how compound engineering works: each problem solved makes the next one easier.
