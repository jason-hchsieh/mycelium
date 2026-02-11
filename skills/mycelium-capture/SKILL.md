---
name: mycelium-capture
description: Capture learnings and patterns from completed work
argument-hint: "[track_id]"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Glob", "Grep"]
---

# Workflow Capture

Extract and preserve learnings from completed work to grow the mycelium knowledge layer.

## Your Task

1. **Update session state** - Write `invocation_mode: "single"` to `.mycelium/state.json`

2. **Load the solution-capture skill** - Use Skill tool to load `solution-capture`

3. **Parse arguments**:
   - `track_id`: Specific completed track
   - Default: Most recently completed track

4. **Load track context**:
   - Completed plan from `.mycelium/plans/`
   - Commits and changes
   - Session state

5. **Execute knowledge capture** - Follow solution-capture skill which handles:
   - Problem categorization (solutions/decisions/conventions/preferences/anti-patterns)
   - Pattern extraction and documentation
   - Solution documentation with YAML validation
   - Critical pattern updates (if 3+ similar solutions found)
   - Knowledge structuring and promotion

6. **Save learnings** to appropriate locations:
   - `.mycelium/solutions/{category}/` - Problem solutions
   - `.mycelium/learned/decisions/` - Architectural decisions
   - `.mycelium/learned/conventions/` - Code conventions
   - `.mycelium/learned/preferences.yaml` - User preferences
   - `.mycelium/learned/anti-patterns/` - What not to do
   - `.mycelium/solutions/patterns/critical-patterns.md` - Recurring patterns

7. **Update session capabilities** with new patterns discovered

## Skills Used

- **solution-capture**: Knowledge extraction, categorization, and pattern detection
- **context**: For understanding project patterns and conventions

## Quick Example

```bash
/mycelium-capture                    # Capture from latest track
/mycelium-capture auth_20260204      # Capture from specific track
```

## Important

- **YAML validation is mandatory** - All frontmatter must use valid enum values
- **Pattern detection is automatic** - 3+ similar solutions trigger critical pattern
- **Knowledge compounds** - Each capture makes future work easier
