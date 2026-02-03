---
name: workflow:setup
description: Initialize project with adaptive workflow structure (Phase -1). Detects greenfield vs brownfield projects, runs interactive setup with state persistence, creates .workflow/ directory structure, and initializes git repository.
argument-hint: "[--resume]"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# Workflow Setup Command

Initialize a project with the adaptive workflow structure. This is Phase -1 (Bootstrap) of the workflow.

## Your Task

Execute the project bootstrap process following these steps:

### 1. Check for Existing Setup

First, check if `.workflow/state/setup_state.json` exists:
- If exists and status is "completed": Inform user setup is already complete
- If exists and status is "in_progress": Offer to resume from checkpoint
- If not exists: Start fresh setup

### 2. Detect Project Type

Analyze the current directory to determine project type:

**GREENFIELD (new project):**
- Empty directory or only has README
- No package.json, go.mod, Cargo.toml, requirements.txt, etc.
- No src/ or existing code directories
- Action: Run full interactive setup

**BROWNFIELD (existing project):**
- Has package.json, go.mod, requirements.txt, Cargo.toml, etc.
- Has existing source code in src/, lib/, app/, etc.
- Action: Extract context from existing files, pre-populate answers

### 3. Interactive Setup (One Question at a Time)

Ask questions in sections. Save state after EACH answer to `.workflow/state/setup_state.json`.

**PRODUCT Section (what & why):**
1. What is this project? (name and one-line description)
2. What problem does it solve?
3. Who are the target users?
4. What are the key goals?

**TECH STACK Section (with what):**
1. Primary language(s)?
2. Framework(s)?
3. Database (if any)?
4. Infrastructure/deployment target?

**WORKFLOW Section (how to work):**
1. TDD strictness? (strict/flexible/none)
2. Commit strategy? (conventional/descriptive/atomic)
3. Code review requirements?
4. Coverage target? (default: 80%)

**For brownfield projects:**
- Pre-populate answers by analyzing existing files
- Ask user to confirm/correct detected values
- Only ask for information that cannot be inferred

### 4. Create Directory Structure

Once all answers collected, create this structure:

```
project/
├── CLAUDE.md                    # Quick context file
├── .workflow/                   # AI workflow artifacts
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
│   └── state/                   # Session state
│       ├── setup_state.json
│       └── session_state.json
└── docs/                        # User documentation (if not exists)
```

Use the templates defined in design.md for:
- `CLAUDE.md`
- `.workflow/context/product.md` (with YAML frontmatter)
- `.workflow/context/tech-stack.md` (with YAML frontmatter)
- `.workflow/context/workflow.md` (with YAML frontmatter)
- `.workflow/solutions/patterns/critical-patterns.md`

### 5. Initialize Git (MANDATORY)

Git is REQUIRED for this workflow:
- Check if `.git/` exists
- If not: `git init`
- Create/update `.gitignore`:
  - Add stack-specific ignores
  - Add `.worktrees/` (for parallel execution)
  - Add `node_modules/`, `venv/`, etc. as appropriate
- Create initial commit: "Initialize project with adaptive workflow"
- Ensure main/master branch exists as base

### 6. Generate Style Guides (Optional)

If project uses linters/formatters:
- Import existing configs (.eslintrc, .prettierrc, etc.)
- Note their locations in tech-stack.md
- Do not create new configs if they don't exist

### 7. Finalize Setup

- Mark setup_state.json status as "completed"
- Initialize session_state.json with discovered capabilities
- Output summary of what was created
- Suggest next command: `/workflow:plan` when user has a task

## State Management

Save progress to `.workflow/state/setup_state.json` after each question:

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
    "primary_language": "typescript"
  },
  "files_created": [".workflow/context/product.md"],
  "started_at": "2026-02-03T09:00:00Z",
  "last_updated": "2026-02-03T09:15:00Z"
}
```

## Resume Support

If user passes `--resume` flag or setup_state.json shows "in_progress":
1. Load setup_state.json
2. Show what's been completed
3. Continue from current_section and current_question
4. Do not re-ask answered questions

## Error Handling

- If git init fails: Stop and inform user to resolve git issues first
- If directory is not writable: Inform user about permission issues
- If answers are unclear: Ask for clarification, do not assume
- If interrupted: State is saved, can resume with `--resume`

## Skills to Reference

- **context**: For loading and understanding project context
- **planning**: Will be used in next phase after setup

## Important Notes

- Ask ONE question at a time, not all at once
- Save state after EACH answer
- For brownfield: Show detected values, ask for confirmation
- Be conversational but concise
- Do NOT proceed to planning - setup only creates the structure
- Do NOT create any application code - only workflow infrastructure
