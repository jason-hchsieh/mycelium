# `.mycelium/` Directory Structure

The `.mycelium/` directory stores all workflow state, plans, and knowledge for a project. It is created by `/mycelium-setup` or automatically by `/mycelium-plan` when it doesn't exist.

## Directory Layout

```
.mycelium/
├── context/                    # Project information
│   ├── product.md              # Product vision, goals, users
│   ├── tech-stack.md           # Languages, frameworks, tools
│   └── workflow.md             # Development practices, maturity mode
├── plans/                      # Implementation plans (living documents)
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
└── state/                      # Session state
    ├── session_state.json      # Current session state (see docs/session-state.md)
    ├── progress.md             # Human-readable progress summary
    ├── review_stage1_report.md # Spec compliance review output
    └── review_stage2_report.md # Quality review output
```

## Minimum Bootstrap

When `/mycelium-plan` is invoked without a full setup, it creates the minimum structure:

```
.mycelium/
├── plans/
└── state/
    └── session_state.json
```

Run `/mycelium-setup` for the full interactive setup including `context/`, `solutions/`, and `learned/` directories.

## `.gitignore`

Add `.mycelium/` to your project's `.gitignore`:

```
# Mycelium workflow state
.mycelium/
```

## Related

- [Plan template][plan-template] - Template for plan files
- [Session state schema][session-state-schema] - JSON schema for session_state.json
- [Session state docs][session-state-docs] - Human-readable session state reference

[plan-template]: ../templates/plans/plan.md.template
[session-state-schema]: ../schemas/session-state.schema.json
[session-state-docs]: ./session-state.md
