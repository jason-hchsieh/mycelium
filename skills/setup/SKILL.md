---
name: Project Setup
description: This skill should be used when the user asks to "set up a project", "initialize workflow", "bootstrap project", or when adding mycelium to a new or existing project. Guides bootstrapping a project with the mycelium workflow structure.
user-invocable: false
version: 0.1.0
---

# Project Setup Workflow

This skill guides you through bootstrapping a project with the mycelium workflow structure.

## When to Use This Skill

- Initializing a new project (greenfield)
- Adding mycelium to an existing project (brownfield)
- Resuming interrupted setup

## Overview

The setup workflow detects project type, gathers configuration through interactive questions, creates the `.mycelium/` directory structure, and initializes git if needed.

---

## Phase -1: Bootstrap

### Step 1: Check for Existing Setup

First, check if `.mycelium/setup_state.json` exists:

```bash
# Check for existing setup
ls .mycelium/setup_state.json
```

**If exists and status is "completed"**:
- Inform user setup is already complete
- Suggest `/mycelium-plan` for next steps
- EXIT

**If exists and status is "in_progress"**:
- Load setup_state.json
- Show what's been completed
- Offer to resume from checkpoint
- Continue from current_section and current_question

**If not exists**:
- Start fresh setup
- Continue to Step 2

---

### Step 2: Detect Project Type

Analyze the current directory to determine if this is a new or existing project.

#### Greenfield Detection

**Indicators** (new project):
- Empty directory or only has README
- No package.json, go.mod, Cargo.toml, requirements.txt, pyproject.toml
- No src/, lib/, app/, pkg/ directories
- No existing source code

**Action**: Run full interactive setup with all questions

#### Brownfield Detection

**Indicators** (existing project):
- Has package.json, go.mod, requirements.txt, Cargo.toml, etc.
- Has existing source code in src/, lib/, app/, etc.
- Has test files
- Has existing git repository

**Action**:
- Extract context from existing files
- Pre-populate answers by analyzing:
  - package.json → project name, dependencies, scripts
  - README.md → description, purpose
  - Existing code → language, framework, patterns
  - .gitignore → deployment target hints
- Ask user to confirm/correct detected values
- Only ask for information that cannot be inferred

---

### Step 3: Interactive Setup

Ask questions ONE AT A TIME in sections. Save state after EACH answer to `.mycelium/setup_state.json`.

#### PRODUCT Section (what & why)

**Question 1: Project Identity**
```
What is this project?
Provide: name and one-line description

Example: "TaskFlow - A workflow automation tool for development teams"
```

Save to setup_state.json:
```json
{
  "answers": {
    "product_name": "TaskFlow",
    "product_description": "A workflow automation tool for development teams"
  }
}
```

**Question 2: Problem Statement**
```
What problem does it solve?
Describe the core problem this project addresses.

Example: "Manual workflow coordination wastes 30% of developer time"
```

**Question 3: Target Users**
```
Who are the target users?
Be specific about who will use this.

Example: "Software development teams of 5-50 people"
```

**Question 4: Key Goals**
```
What are the key goals? (3-5 measurable objectives)

Example:
- Reduce manual workflow overhead by 50%
- Support 10+ integrations by v1.0
- 99.9% uptime SLA
```

#### TECH STACK Section (with what)

**Question 5: Primary Language(s)**
```
What programming language(s)?

Example: TypeScript, Python, Go
```

For brownfield: Detect from existing files and confirm.

**Question 6: Framework(s)**
```
What framework(s) or libraries?

Example: React, Next.js, FastAPI, Gin
```

For brownfield: Detect from package.json/requirements.txt and confirm.

**Question 7: Database**
```
What database (if any)?

Example: PostgreSQL, MongoDB, Redis, None
```

**Question 8: Infrastructure/Deployment**
```
Where will this be deployed?

Example: AWS (ECS), Vercel, Docker, Local only
```

For brownfield: Check for Dockerfile, vercel.json, etc.

#### WORKFLOW Section (how to work)

**Question 9: TDD Strictness**
```
How strict should TDD enforcement be?

Options:
- strict: All code must follow RED-GREEN-REFACTOR (recommended)
- flexible: TDD for new features, optional for fixes
- none: No TDD enforcement
```

Default: `strict`

**Question 10: Commit Strategy**
```
What commit message style?

Options:
- conventional: feat/fix/chore format (recommended)
- descriptive: Clear descriptive messages
- atomic: Small, focused commits
```

Default: `conventional`

**Question 11: Code Review**
```
Code review requirements?

Options:
- required: All changes need review
- recommended: Review for major changes
- optional: No review requirement
```

Default: `recommended`

**Question 12: Coverage Target**
```
Test coverage target?

Example: 80% (recommended), 90%, 70%
```

Default: `80%`

---

### Step 4: Create Directory Structure

Once all answers collected, create this structure:

```
project/
├── CLAUDE.md                    # Quick context file
├── .mycelium/                   # AI workflow artifacts
│   ├── context/                 # Project information
│   │   ├── product.md
│   │   ├── tech-stack.md
│   │   └── workflow.md
│   ├── plans/                   # Living plan documents
│   ├── solutions/               # Captured learnings
│   │   ├── performance-issues/
│   │   ├── database-issues/
│   │   ├── security-issues/
│   │   ├── ui-bugs/
│   │   ├── integration-issues/
│   │   └── patterns/
│   │       └── critical-patterns.md
│   ├── state.json               # Session state
│   └── setup_state.json         # Setup progress
└── docs/                        # User documentation (if not exists)
```

#### File Templates

**CLAUDE.md**:
```markdown
# {project_name}

{product_description}

## Quick Context

**What**: {problem_statement}
**Who**: {target_users}
**Stack**: {primary_language} + {frameworks}

## Key Goals

{list_of_goals}

## Getting Started

See `.mycelium/context/` for detailed project information.

## Workflow

- `/mycelium-plan` - Plan new work
- `/mycelium-work` - Execute tasks
- `/mycelium-review` - Review code
- `/mycelium-capture` - Capture learnings
```

**.mycelium/context/product.md**:
```markdown
---
product_name: {name}
description: {description}
target_users: {users}
created: {timestamp}
---

# Product Context

## Problem Statement

{problem}

## Goals

{goals}

## Success Criteria

{how_we_measure_success}
```

**.mycelium/context/tech-stack.md**:
```markdown
---
primary_language: {language}
frameworks: [{frameworks}]
database: {database}
infrastructure: {infrastructure}
updated: {timestamp}
---

# Tech Stack

## Languages

{list}

## Frameworks & Libraries

{list}

## Database

{details}

## Infrastructure

{details}

## Development Tools

{linters, formatters, test frameworks}
```

**.mycelium/context/workflow.md**:
```markdown
---
tdd_strictness: {strict|flexible|none}
commit_style: {conventional|descriptive|atomic}
review_required: {required|recommended|optional}
coverage_target: {percentage}
---

# Workflow Configuration

## TDD Policy

{description_based_on_strictness}

## Commit Guidelines

{description_based_on_style}

## Code Review

{description_based_on_requirement}

## Quality Standards

- Test coverage: ≥{target}%
- No linting errors
- All tests passing
```

**.mycelium/solutions/patterns/critical-patterns.md**:
```markdown
# Critical Patterns

Patterns that MUST be followed in this codebase.

## When to Update This File

After discovering:
- Security-critical patterns
- Performance-critical patterns
- Data integrity patterns
- Architectural constraints

## Patterns

(Will be populated as patterns are discovered)
```

---

### Step 5: Initialize Git (MANDATORY)

Git is REQUIRED for the mycelium workflow.

```bash
# Check if git exists
if [ ! -d .git ]; then
  git init
  echo "✓ Initialized git repository"
fi

# Verify main/master branch exists
git branch --show-current || git checkout -b main

# Create/update .gitignore
```

**Add to .gitignore**:
```gitignore
# Mycelium worktrees
.worktrees/

# Session state (local only)
.mycelium/state.json

# Language/framework specific
node_modules/
venv/
__pycache__/
*.pyc
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

Add stack-specific ignores based on detected language:
- Node.js: node_modules/, dist/, build/
- Python: venv/, __pycache__/, *.pyc, .pytest_cache/
- Go: vendor/, *.exe
- Rust: target/, Cargo.lock (for apps)

**Create initial commit**:
```bash
git add .mycelium/ CLAUDE.md .gitignore
git commit -m "Initialize project with mycelium workflow

- Add .mycelium/ directory structure
- Add CLAUDE.md quick context
- Configure git and .gitignore

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Step 6: Import Existing Configs (Brownfield Only)

If project uses linters/formatters:

**Detect**:
- .eslintrc.* → ESLint
- .prettierrc.* → Prettier
- pyproject.toml → Black, Ruff
- .golangci.yml → golangci-lint
- rustfmt.toml → rustfmt

**Action**:
- Note their locations in tech-stack.md
- Do NOT create new configs
- Do NOT modify existing configs
- Just document what exists

**Example addition to tech-stack.md**:
```markdown
## Code Quality Tools

- ESLint: `.eslintrc.json` (existing)
- Prettier: `.prettierrc` (existing)
- TypeScript: `tsconfig.json` (existing)
```

---

### Step 7: Finalize Setup

**Update setup_state.json**:
```json
{
  "status": "completed",
  "project_type": "greenfield",
  "completed_at": "2026-02-04T10:30:00Z",
  "files_created": [
    "CLAUDE.md",
    ".mycelium/context/product.md",
    ".mycelium/context/tech-stack.md",
    ".mycelium/context/workflow.md",
    ".mycelium/solutions/patterns/critical-patterns.md",
    ".gitignore"
  ]
}
```

**Initialize state.json**:
```json
{
  "project_name": "{name}",
  "initialized_at": "2026-02-04T10:30:00Z",
  "current_track": null,
  "discovered_capabilities": {
    "skills": [],
    "agents": [],
    "patterns": []
  },
  "active_worktrees": [],
  "stats": {
    "tracks_completed": 0,
    "solutions_captured": 0,
    "patterns_discovered": 0
  }
}
```

**Output summary**:
```
✅ Mycelium setup complete!

Created:
  ✓ CLAUDE.md - Quick context
  ✓ .mycelium/context/ - Project information
  ✓ .mycelium/plans/ - Living plans
  ✓ .mycelium/solutions/ - Knowledge base
  ✓ Git repository initialized

Configuration:
  • Language: {language}
  • TDD: {strictness}
  • Coverage: ≥{target}%

Next steps:
  1. Review CLAUDE.md and .mycelium/context/
  2. When you have a task: /mycelium-plan [description]
  3. Or for full automation: /mycelium-go [description]
```

---

## State Management

The `setup_state.json` enables resume functionality:

```json
{
  "status": "in_progress",
  "project_type": "greenfield|brownfield",
  "current_section": "product|tech_stack|workflow|finalize",
  "current_question": 2,
  "completed_sections": ["product"],
  "answers": {
    "product_name": "MyApp",
    "product_description": "...",
    "problem_statement": "...",
    "target_users": "..."
  },
  "files_created": [".mycelium/context/product.md"],
  "started_at": "2026-02-04T09:00:00Z",
  "last_updated": "2026-02-04T09:15:00Z"
}
```

**Save after EACH answer** to enable interruption and resume.

---

## Resume Support

When resuming (user passes `--resume` or state shows "in_progress"):

1. Load setup_state.json
2. Show progress:
   ```
   Resuming setup...

   Completed:
     ✓ Product section (4 questions)

   In progress:
     • Tech Stack section (question 2 of 4)

   Continuing...
   ```
3. Jump to current_section and current_question
4. Do NOT re-ask answered questions
5. Continue until completion

---

## Error Handling

**Git init fails**:
- Show error message
- Ask user to resolve git issues first
- STOP - cannot proceed without git

**Directory not writable**:
- Check permissions
- Inform user about permission issues
- Suggest solutions

**User answers unclear**:
- Ask for clarification
- Do NOT assume or guess
- Provide examples of good answers

**Interrupted**:
- State is saved after each answer
- User can resume with `--resume` flag
- No data loss

---

## Greenfield vs Brownfield Differences

| Aspect | Greenfield | Brownfield |
|--------|-----------|------------|
| Questions | All 12 questions | Only undetectable info |
| Detection | Manual entry | Auto-detect from files |
| Confirmation | Not needed | Confirm detected values |
| Git | Create new repo | Use existing |
| Configs | None created | Import existing |

---

## Important Notes

- Ask ONE question at a time, not all at once
- Save state after EACH answer (enables resume)
- For brownfield: Show detected values, ask confirmation
- Be conversational but concise
- Do NOT proceed to planning - setup only creates structure
- Do NOT create application code - only workflow infrastructure
- Git is MANDATORY - cannot proceed without it
- All file paths are absolute when saved to state

---

## Next Steps After Setup

1. **Review** created files (CLAUDE.md, .mycelium/context/)
2. **Customize** if needed (edit context files)
3. **Start work**:
   - Manual: `/mycelium-plan [task]`
   - Autonomous: `/mycelium-go [task]`
