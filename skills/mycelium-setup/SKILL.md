---
name: mycelium-setup
description: Initialize project with mycelium structure
argument-hint: "[--resume]"
allowed-tools: ["Skill", "Read", "Write", "Edit", "Bash", "Glob", "Grep", "AskUserQuestion"]
---

# Workflow Setup

Bootstrap a new or existing project with the mycelium workflow structure.

## Your Task

1. **Load the setup skill** - Use Skill tool to load `workflow/setup`

2. **Parse arguments**:
   - `--resume`: Continue interrupted setup from last checkpoint

3. **Execute setup** - Follow the setup skill which handles:
   - Existing setup check (resume or fresh start)
   - Project type detection (greenfield vs brownfield)
   - Interactive configuration (one question at a time)
   - Directory structure creation (`.workflow/` hierarchy)
   - Git initialization (mandatory)
   - State persistence (enables resume)

4. **Next step**: Suggest `/mycelium-plan` when user has a task

## Skills Used

- **setup**: Project initialization workflow with greenfield/brownfield detection
- **context**: For extracting information from existing projects (brownfield)

## Quick Example

```bash
/mycelium-setup          # New setup
/mycelium-setup --resume # Continue interrupted setup
```

## Important

- **Git is mandatory** - Mycelium requires git for worktrees and version control
- **One question at a time** - Interactive setup asks questions sequentially
- **State saved after each answer** - Interruption-safe with resume capability
- **Brownfield detection** - Auto-detects project info from existing files
