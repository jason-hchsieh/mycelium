---
name: create-skill
description: Generate a project-specific skill from detected patterns in Phase 6E. Analyzes solutions in .workflow/solutions/, creates SKILL.md with proper structure, and registers it for auto-discovery. Use when 3+ similar solutions exist or novel technique warrants capture.
argument-hint: "[optional: category] where category matches solutions subdirectory"
allowed-tools: ["Read", "Write", "Grep", "Glob", "Bash"]
---

You are executing the **/workflow:create-skill** command for Phase 6E skill generation from learned patterns.

## Purpose

Generate project-specific skills from recurring patterns:
1. Analyze solutions in `.workflow/solutions/` for patterns
2. Detect 3+ occurrences of similar problems/solutions
3. Create structured SKILL.md in project skills directory
4. Register skill for auto-discovery in future sessions
5. Enable automatic pattern application going forward

## Skill Generation Process

### Step 1: Interactive Category Selection

If no category argument provided, analyze available patterns:

```bash
# List all solution categories with counts
for dir in .workflow/solutions/*/; do
  count=$(find "$dir" -name "*.md" | wc -l)
  echo "$(basename "$dir"): $count solutions"
done
```

**Present to user:**
```markdown
## Available Pattern Sources

| Category | Solutions | Candidates for Skills |
|----------|-----------|----------------------|
| performance-issues | {count} | {analysis} |
| database-issues | {count} | {analysis} |
| security-issues | {count} | {analysis} |
| integration-issues | {count} | {analysis} |
| configuration-issues | {count} | {analysis} |
| testing-strategies | {count} | {analysis} |
| patterns | {count} | {analysis} |

Which category should I analyze for skill generation?
(Type category name or 'all' to scan all categories)
```

### Step 2: Pattern Analysis

Analyze solutions in chosen category:

```bash
# Read all solutions in category
find .workflow/solutions/{category}/ -name "*.md" -exec cat {} \;

# Extract frontmatter for pattern analysis
grep -r "problem_type:" .workflow/solutions/{category}/
grep -r "root_cause:" .workflow/solutions/{category}/
grep -r "tags:" .workflow/solutions/{category}/
```

**Detect patterns:**
1. **Problem Type Clustering**: Group by `problem_type` field
2. **Root Cause Analysis**: Identify common `root_cause` values
3. **Tag Co-occurrence**: Find frequently appearing tag combinations
4. **Solution Pattern Matching**: Identify similar solution approaches
5. **Code Pattern Extraction**: Extract common code structures

**Promotion Criteria:**
- ≥3 solutions with same problem_type + root_cause
- ≥5 solutions with same tag combination
- High severity issues (critical/high) with 2+ occurrences
- Novel technique that solved hard problem (user judgment)

### Step 3: Pattern Validation

For each detected pattern, validate worthiness:

**Ask user:**
```markdown
## Pattern Detected: {pattern_name}

**Occurrences:** {count}
**Problem Type:** {type}
**Root Cause:** {cause}
**Severity:** {average_severity}

**Solutions in pattern:**
1. {solution_file_1} - {brief_summary}
2. {solution_file_2} - {brief_summary}
3. {solution_file_3} - {brief_summary}

**Common approach:**
{Extracted common solution pattern}

**Would you like to create a skill for this pattern?**
(yes/no/customize)
```

If user selects "customize":
- Ask for skill name
- Ask for description customization
- Ask for trigger conditions
- Ask for additional examples to include

### Step 4: Skill Structure Generation

Create skill with proper structure:

**File location:**
```
.workflow/skills/{category}/{skill-name}/SKILL.md
```

**Skill Template:**

```markdown
---
name: {Skill Name}
description: {When to use this skill - auto-trigger conditions}
version: 1.0.0
generated_from: {count} solutions
source_category: {category}
auto_trigger: {true|false}
last_updated: {YYYY-MM-DD}
---

# {Skill Name}

## Core Principle

**{One-sentence principle extracted from pattern}**

{Why this skill exists - the compound learning rationale}

## When to Use

Apply this skill when:
- {Trigger condition 1 from pattern analysis}
- {Trigger condition 2}
- {Trigger condition 3}
- {Contextual indicators}

Also use when:
- {Additional scenarios}
- {Edge cases}

## Problem Pattern Recognition

Watch for these symptoms:
- {Symptom 1 extracted from solutions}
- {Symptom 2}
- {Symptom 3}

**Root Causes (from {count} occurrences):**
- {Most common root cause}: {count} times
- {Second most common}: {count} times

## Solution Pattern

{Extracted common solution approach}

### Step 1: {First Step}
{Details from solutions}

### Step 2: {Second Step}
{Details from solutions}

### Step 3: {Third Step}
{Details from solutions}

## Code Examples

{Extract representative examples from solutions}

### Example 1: {Scenario from solution 1}
```{language}
{Code from solution 1}
```

### Example 2: {Scenario from solution 2}
```{language}
{Code from solution 2}
```

## Prevention Strategy

Based on {count} occurrences, prevent by:
1. {Prevention strategy 1}
2. {Prevention strategy 2}
3. {Prevention strategy 3}

## Verification

How to verify the fix:
- {Verification method 1}
- {Verification method 2}

## Common Pitfalls

{Extracted from solutions' "what went wrong" sections}
- {Pitfall 1}
- {Pitfall 2}

## References

**Generated from solutions:**
- {.workflow/solutions/category/solution-1.md}
- {.workflow/solutions/category/solution-2.md}
- {.workflow/solutions/category/solution-3.md}

**Related patterns:**
- {Link to related skills or patterns}

## Integration with Workflow

**Phase {X}:** {When this skill applies in workflow}
- {How it integrates}

**Auto-trigger:** {true/false}
- {If true, describe trigger conditions}
- {If false, explain when to invoke manually}

## Summary

**Key principles:**
- {Principle 1}
- {Principle 2}
- {Principle 3}

{One-sentence conclusion about compound learning benefit}
```

### Step 5: Skill Metadata Creation

Create companion metadata file:

**File location:**
```
.workflow/skills/{category}/{skill-name}/metadata.json
```

**Metadata structure:**
```json
{
  "skill_id": "{category}:{skill-name}",
  "name": "{Skill Name}",
  "version": "1.0.0",
  "created": "{ISO_8601_timestamp}",
  "last_updated": "{ISO_8601_timestamp}",
  "generated": true,
  "generation_method": "pattern_analysis",
  "source_category": "{category}",
  "source_solutions": [
    ".workflow/solutions/{category}/{file1}.md",
    ".workflow/solutions/{category}/{file2}.md",
    ".workflow/solutions/{category}/{file3}.md"
  ],
  "pattern_occurrence_count": {count},
  "auto_trigger": {true|false},
  "trigger_keywords": ["{keyword1}", "{keyword2}"],
  "problem_types": ["{type1}", "{type2}"],
  "root_causes": ["{cause1}", "{cause2}"],
  "applies_to_phases": ["{phase1}", "{phase2}"],
  "usage_count": 0,
  "last_used": null,
  "effectiveness_rating": null
}
```

### Step 6: Register Skill for Discovery

Update project skill registry:

**File location:**
```
.workflow/skills/registry.json
```

**Registry entry:**
```json
{
  "skills": [
    {
      "id": "{category}:{skill-name}",
      "name": "{Skill Name}",
      "path": ".workflow/skills/{category}/{skill-name}/SKILL.md",
      "scope": "project",
      "generated": true,
      "auto_trigger": {true|false},
      "version": "1.0.0",
      "description": "{description}",
      "created": "{timestamp}",
      "source": "pattern_analysis"
    }
  ]
}
```

### Step 7: Link Back to Solutions

Update source solution files to reference new skill:

Add to each source solution's frontmatter:
```yaml
promoted_to_skill: true
skill_id: {category}:{skill-name}
skill_file: .workflow/skills/{category}/{skill-name}/SKILL.md
```

### Step 8: Update Critical Patterns

If pattern was in critical-patterns.md, link to skill:

```markdown
## {Pattern Name} (→ Skill: {skill-name})

**Now available as skill:** `.workflow/skills/{category}/{skill-name}/SKILL.md`

{Keep pattern summary but point to skill for full guidance}
```

### Step 9: Generate Skill Report

Create generation report:

```markdown
## Skill Generation Report

### Skill Created
**Name:** {Skill Name}
**ID:** {category}:{skill-name}
**Location:** `.workflow/skills/{category}/{skill-name}/SKILL.md`

### Source Analysis
**Category:** {category}
**Solutions Analyzed:** {total_count}
**Pattern Matches:** {pattern_count}
**Occurrences:** {occurrence_count}

### Pattern Details
**Problem Type:** {primary_problem_type}
**Root Causes:** {cause_list}
**Severity:** {average_severity}
**Tags:** {common_tags}

### Skill Characteristics
**Auto-trigger:** {true|false}
**Applies to Phases:** {phase_list}
**Trigger Keywords:** {keyword_list}

### Source Solutions
1. {solution_1} ({date})
2. {solution_2} ({date})
3. {solution_3} ({date})
{... more if applicable}

### Next Steps
✓ Skill file created
✓ Metadata generated
✓ Registry updated
✓ Solutions linked
✓ Critical patterns updated

**The skill will be auto-discovered in the next session.**

To use immediately in current session:
1. Reference: `.workflow/skills/{category}/{skill-name}/SKILL.md`
2. Apply pattern when relevant conditions detected

### Validation Checklist
- [ ] Skill description clearly states when to use
- [ ] Auto-trigger conditions are specific
- [ ] Code examples are complete and tested
- [ ] Prevention strategies are actionable
- [ ] References link back to source solutions
```

## Skill Quality Standards

**Required elements:**
- Clear "When to Use" section with specific triggers
- At least 2 code examples
- Prevention strategy
- Link to source solutions

**Auto-trigger criteria:**
- Trigger conditions must be detectable automatically
- Clear keywords or patterns that indicate applicability
- No ambiguous triggers that could false-positive

**Generated skill characteristics:**
- Project-specific (scoped to current project)
- Evidence-based (from real solutions)
- Actionable (concrete steps)
- Verifiable (includes verification methods)

## Pattern Analysis Techniques

### Similarity Detection

**Problem Type + Root Cause clustering:**
```bash
# Count combinations
grep -h "problem_type:\|root_cause:" .workflow/solutions/{category}/*.md \
  | paste - - \
  | sort \
  | uniq -c \
  | sort -rn
```

**Tag co-occurrence:**
```bash
# Extract and count tag combinations
grep -h "tags:" .workflow/solutions/{category}/*.md \
  | sort \
  | uniq -c \
  | sort -rn
```

**Solution approach matching:**
- Read "Solution" sections
- Extract common verbs/actions
- Identify repeated code patterns
- Find similar file/function changes

### Code Pattern Extraction

For each solution with code examples:
1. Extract code blocks
2. Identify common structures
3. Generalize patterns (variables → placeholders)
4. Create template with variations

Example:
```
Solution 1: users.find(id).includes(:posts)
Solution 2: comments.where(visible: true).includes(:author)
Solution 3: orders.recent.includes(:items)

Pattern: {model}.{query}.includes(:{association})
```

## Error Handling

**No patterns detected:**
```markdown
## Pattern Analysis Result

**Category:** {category}
**Solutions Analyzed:** {count}

❌ No recurring patterns detected (need ≥3 similar solutions)

**Suggestions:**
1. Analyze different category with more solutions
2. Come back after more solutions captured
3. Create skill manually for novel technique
```

**Insufficient similarity:**
```markdown
## Pattern Analysis Result

**Patterns Found:** {count}
**Strongest Pattern:** {pattern_name}
**Occurrences:** 2 (need ≥3)

⚠️ Pattern exists but threshold not met

**Options:**
1. Wait for one more occurrence
2. Create skill anyway (manual override)
3. Document in critical-patterns.md instead
```

**Category doesn't exist:**
```markdown
❌ Category '{category}' not found in .workflow/solutions/

Available categories:
{list existing categories}

Please choose from available categories or check spelling.
```

**Skill already exists:**
```markdown
⚠️ Skill '{skill-name}' already exists

**Options:**
1. Update existing skill with new solutions
2. Create new skill with different name
3. Merge patterns into existing skill

What would you like to do?
```

## Command Arguments

**No arguments (interactive):**
```bash
/workflow:create-skill
```
Shows available categories and guides through selection.

**Specific category:**
```bash
/workflow:create-skill performance-issues
```
Analyzes only performance-issues solutions.

**Analyze all categories:**
```bash
/workflow:create-skill all
```
Scans all categories for patterns meeting threshold.

## Integration with Phase 6E

This command implements Phase 6E (Auto-Generate Project Skill):

**Trigger conditions:**
1. User explicitly runs `/workflow:create-skill`
2. Solution capture detects 3+ similar issues
3. Learning agent recommends skill generation
4. End of compound learning phase review

**Feedback loop:**
```
Solutions captured → Pattern detected → Skill generated →
Auto-applied in future → New solutions reference skill →
Skill refined over time
```

## Skill Lifecycle

**Creation (this command):**
- Generate from patterns
- Version 1.0.0

**Discovery (next session):**
- Auto-discovered via registry
- Loaded into session capabilities

**Usage (future work):**
- Auto-triggered or manually invoked
- Tracks usage_count in metadata

**Evolution (over time):**
- Add new examples from solutions
- Refine trigger conditions
- Update prevention strategies
- Version increments

## Related Commands

- `/workflow:list-skills` - View all project skills including generated ones
- `/workflow:compound` - Capture learnings that may become skills
- `/workflow:metrics` - View pattern usage statistics

## Best Practices

**Do:**
- Wait for ≥3 occurrences before generating skill
- Include concrete code examples
- Link back to source solutions
- Set realistic auto-trigger conditions
- Test skill description clarity

**Don't:**
- Generate skills for one-off issues
- Make auto-trigger conditions too broad
- Skip linking back to sources
- Forget to update registry
- Over-generalize patterns (be project-specific)

## Output

**Success:**
```markdown
✓ Skill '{skill-name}' created successfully

**Location:** .workflow/skills/{category}/{skill-name}/SKILL.md
**Metadata:** .workflow/skills/{category}/{skill-name}/metadata.json
**Registry:** Updated

**Next session:** Skill will be auto-discovered
**This session:** Reference file directly if needed
```

**Validation errors:**
```markdown
❌ Skill validation failed

Errors:
- {error 1}
- {error 2}

Please fix and regenerate.
```

## Validation

Before finalizing skill:

**Structure check:**
- ✓ YAML frontmatter valid
- ✓ Required sections present
- ✓ At least 2 code examples
- ✓ References link to actual files

**Content check:**
- ✓ Description is clear
- ✓ Trigger conditions are specific
- ✓ Examples are complete
- ✓ Prevention strategies actionable

**Integration check:**
- ✓ Metadata file created
- ✓ Registry updated
- ✓ Source solutions linked
- ✓ File permissions correct

Only proceed if all checks pass.

## Exit Conditions

**Success:** Skill created, registered, and validated
**Cancelled:** User chose not to generate skill
**Error:** Validation failed or file write error

Always provide clear next steps and show skill location.
