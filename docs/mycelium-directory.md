# `.mycelium/` Directory Structure

The `.mycelium/` directory stores all workflow state, plans, and knowledge for a project.

## Minimum Structure

A single file is all that's needed to start:

```
.mycelium/
└── state.json          # Session state + inline plans
```

`state.json` contains the session state and can embed plans directly in the `plans[]` array. No other files or directories are required.

## Full Structure

The complete structure enables knowledge compounding across sessions:

```
.mycelium/
├── state.json                  # Session state (see docs/session-state.md)
├── context/                    # Project information
│   ├── product.md              # Product vision, goals, users
│   ├── tech-stack.md           # Languages, frameworks, tools
│   └── workflow.md             # Development practices, maturity mode
├── plans/                      # Implementation plans as separate files
│   ├── 2026-02-11-auth_20260211.md
│   └── 2026-02-10-bugfix_20260210.md
├── solutions/                  # Documented solutions & patterns
│   └── patterns/
│       └── critical-patterns.md
├── learned/                    # Learning store
│   ├── decisions/              # Architectural decisions with context
│   ├── conventions/            # Detected code patterns
│   ├── preferences.yaml        # User preferences learned from corrections
│   ├── anti-patterns/          # Mistakes to avoid
│   └── effective-prompts/      # Approaches that worked
├── progress.md                 # Human-readable progress summary
├── review_stage1_report.md     # Spec compliance review output
└── review_stage2_report.md     # Quality review output
```

### Plans: Inline vs Separate Files

Plans can live in two places:

- **Inline** (minimum) — Stored directly in `state.json` within the `plans[]` array. Good for quick tasks.
- **Separate files** (full) — Written to `.mycelium/plans/` as markdown with YAML frontmatter. Better for complex plans that benefit from human-readable format. Referenced from `state.json` via `plan_file`.

Both modes can coexist. A plan entry in `state.json` either contains `content` (inline) or `plan_file` (reference to `.mycelium/plans/`).

## `.gitignore`

Add `.mycelium/` to your project's `.gitignore`:

```
# Mycelium workflow state
.mycelium/
```

## Related

- [Session state docs][session-state-docs] - Human-readable `state.json` reference
- [Session state schema][session-state-schema] - JSON schema for `state.json`
- [Plan template][plan-template] - Template for separate plan files

[session-state-docs]: ./session-state.md
[session-state-schema]: ../schemas/session-state.schema.json
[plan-template]: ../templates/plans/plan.md.template
