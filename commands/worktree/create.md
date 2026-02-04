---
name: worktree-create
description: Create git worktree for parallel task execution. Enables isolated workspace for a track with its own branch, dependencies, and environment.
category: worktree
version: 0.1.0
---

# Create Git Worktree

## Purpose

Create an isolated git worktree for parallel task execution. Each worktree provides a complete working directory with its own branch, enabling multiple agents to work simultaneously without conflicts.

## When to Use

Use this command when:
- Starting a new track that will execute in parallel with other work
- Need isolated workspace to avoid conflicts with main working directory
- Beginning Phase 4 (Implementation) for a track
- Dispatching tasks that should run concurrently

## Prerequisites

- Git repository must be initialized
- `.worktrees/` directory must be in `.gitignore`
- Main working directory should have clean state (no uncommitted changes)
- Environment files (`.env`, `.env.local`) present if needed by project

## Command Invocation

```
/workflow:worktree-create {track_id}
```

**Parameters:**
- `track_id` (required): Unique identifier for the track (e.g., `user-auth_20260203`)

## Execution Steps

### 1. Validate Prerequisites

Before creating the worktree, verify:

```bash
# Check if git repository exists
git rev-parse --git-dir

# Check if worktrees directory is gitignored
grep -q "^\.worktrees/" .gitignore || echo "WARNING: .worktrees/ not in .gitignore"

# Check current branch
git branch --show-current

# Verify clean state (optional but recommended)
git status --porcelain
```

**Error Handling:**
- If not a git repository: Error with instructions to run `git init`
- If `.worktrees/` not gitignored: Warn user and offer to add it
- If uncommitted changes: Warn user but allow to proceed

### 2. Create Worktree

Create the worktree with a new branch:

```bash
# Create worktree in .worktrees/{track_id} with new branch
git worktree add .worktrees/{track_id} -b {track_id}

# Example:
# git worktree add .worktrees/user-auth_20260203 -b user-auth_20260203
```

**Branch Naming:**
- Use track_id as branch name for consistency
- Branch is created from current HEAD
- Branch will track changes for this specific track

**Error Handling:**
- If worktree already exists: Suggest cleanup or use different track_id
- If branch name conflicts: Offer to use existing branch or choose new name
- If disk space insufficient: Report error with space requirements

### 3. Setup Worktree Environment

Navigate to the worktree and configure it:

```bash
cd .worktrees/{track_id}

# Copy environment files if they exist
cp ../../.env .env 2>/dev/null || true
cp ../../.env.local .env.local 2>/dev/null || true
cp ../../.env.test .env.test 2>/dev/null || true

# Copy any other critical config files
# (check for .nvmrc, .tool-versions, etc.)
cp ../../.nvmrc .nvmrc 2>/dev/null || true
```

**Configuration Files to Copy:**
- Environment files: `.env*`
- Runtime version files: `.nvmrc`, `.tool-versions`, `.ruby-version`
- Local config: `.npmrc`, `pip.conf` (if they contain local settings)

**Files NOT to Copy:**
- `node_modules/`, `vendor/`, `target/` (will be installed fresh)
- `.git/` (automatically linked by git worktree)
- Build artifacts or cache directories

### 4. Install Dependencies

Install dependencies fresh in the worktree:

```bash
# Node/JavaScript
if [ -f "package.json" ]; then
  npm install
fi

# Python
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
fi
if [ -f "pyproject.toml" ]; then
  pip install -e .
fi

# Ruby
if [ -f "Gemfile" ]; then
  bundle install
fi

# Go
if [ -f "go.mod" ]; then
  go mod download
fi

# Rust
if [ -f "Cargo.toml" ]; then
  cargo fetch
fi
```

**Error Handling:**
- If dependency installation fails: Report error but continue (can be fixed later)
- If network issues: Suggest offline mode or retry
- If version conflicts: Report specific package conflicts

### 5. Run Baseline Tests

Verify the worktree has a clean baseline:

```bash
# Run tests to confirm clean state
# Node/JavaScript
npm test

# Python
pytest

# Go
go test ./...

# Rust
cargo test
```

**Success Criteria:**
- All tests pass (baseline is green)
- No unexpected failures
- Test environment properly configured

**Error Handling:**
- If tests fail: This is a baseline issue, not worktree issue
- Report failing tests and suggest fixing main branch first
- Allow user to proceed anyway with warning

### 6. Update Session State

Record the worktree in `.workflow/state/session_state.json`:

```json
{
  "worktrees": [
    {
      "track_id": "user-auth_20260203",
      "path": ".worktrees/user-auth_20260203",
      "branch": "user-auth_20260203",
      "status": "active",
      "created_at": "2026-02-03T09:00:00Z",
      "agent_id": null,
      "tasks": [],
      "last_commit": null
    }
  ]
}
```

**State Fields:**
- `track_id`: Identifier for this track
- `path`: Relative path to worktree directory
- `branch`: Git branch name
- `status`: `active`, `merged`, or `abandoned`
- `created_at`: ISO 8601 timestamp
- `agent_id`: Set when agent begins work (initially null)
- `tasks`: Array of task IDs assigned to this worktree
- `last_commit`: SHA of last commit (initially null)

### 7. Verify Worktree Creation

Confirm the worktree is ready:

```bash
# List all worktrees
git worktree list

# Verify branch exists
git branch --list {track_id}

# Confirm directory structure
ls -la .worktrees/{track_id}
```

## Output

Provide a summary of the created worktree:

```
✓ Worktree created successfully

Track ID:     user-auth_20260203
Branch:       user-auth_20260203
Path:         .worktrees/user-auth_20260203
Status:       active
Dependencies: installed
Baseline:     ✓ all tests passing

Next steps:
1. Assign tasks to this worktree
2. Dispatch agent to begin work
3. Monitor progress in session state
```

## Worktree Best Practices

### Isolation

- Each worktree is completely isolated
- Changes don't affect main working directory
- Multiple worktrees can run simultaneously
- Git history is shared but working directories are separate

### Resource Management

- Each worktree has its own `node_modules/`, `venv/`, etc.
- Disk space = (number of worktrees) × (project size + dependencies)
- Memory usage increases with parallel worktrees
- Consider system limits when creating many worktrees

### Lifecycle

```
create → setup → work → commit → merge → cleanup
  ↓        ↓       ↓       ↓        ↓        ↓
 this    this    agent   agent   merge   cleanup
 cmd     cmd             task    cmd      cmd
```

## Common Issues

### Issue: "fatal: '.worktrees/{track_id}' already exists"

**Cause:** Worktree directory already exists from previous session

**Solution:**
```bash
# Remove old worktree first
git worktree remove .worktrees/{track_id}
# Then retry create command
```

### Issue: "fatal: '{track_id}' is already checked out"

**Cause:** Branch is already used by another worktree

**Solution:**
- Use `/workflow:worktree-cleanup` to remove stale worktrees
- Or choose a different track_id

### Issue: Dependency installation fails

**Cause:** Network issues, version conflicts, or missing credentials

**Solution:**
- Check network connectivity
- Verify package registry access
- Check credentials in `.npmrc`, `pip.conf`, etc.
- Try manual installation: `cd .worktrees/{track_id} && npm install`

### Issue: Tests fail in worktree but pass in main

**Cause:** Environment differences or missing configuration

**Solution:**
- Check environment files were copied correctly
- Verify all required services are running
- Compare configurations between main and worktree

## Integration with Workflow

### Phase 4: Implementation

Worktrees are created at the start of Phase 4:

```
Phase 4A: Preparation
├── Create worktree (this command)
├── Setup environment
├── Install dependencies
├── Verify baseline
└── Ready for task execution
```

### Parallel Execution

Multiple worktrees enable parallel work:

```
Track 1: .worktrees/user-auth_20260203
         ├── Agent A → Task 1.1
         └── Branch: user-auth_20260203

Track 2: .worktrees/api-refactor_20260203
         ├── Agent B → Task 2.1
         └── Branch: api-refactor_20260203

Main: project/
      ├── Main working directory
      └── Branch: main
```

## Related Commands

- `/workflow:worktree-merge` - Merge completed worktree back to main
- `/workflow:worktree-cleanup` - Remove completed or abandoned worktrees
- `/workflow:work-parallel` - Dispatch tasks to worktrees for parallel execution
- `/workflow:status` - View all active worktrees and their status

## Technical Notes

### Git Worktree Internals

- Worktrees share `.git` directory (saves space)
- Each worktree has `.git` file pointing to main repo
- Branches can only be checked out in one worktree at a time
- Worktree metadata stored in `.git/worktrees/`

### Directory Structure

```
project/
├── .git/                           # Main git repository
│   └── worktrees/                  # Worktree metadata
│       └── user-auth_20260203/     # Metadata for this worktree
├── .worktrees/                     # Worktree directories (gitignored)
│   └── user-auth_20260203/         # Full project copy
│       ├── .git → ../../.git       # Link to main repo
│       ├── src/                    # Source code
│       ├── node_modules/           # Dependencies (independent)
│       └── .env                    # Environment (copied)
├── src/                            # Main working directory
└── .workflow/                      # Workflow state
    └── state/
        └── session_state.json      # Tracks active worktrees
```

## Security Considerations

- Environment files may contain secrets
- Ensure `.worktrees/` is in `.gitignore` to prevent committing secrets
- Each worktree has its own `.env` (secrets are isolated)
- Be cautious with shared caches or credentials

## Performance Tips

- Use shallow clones for large repositories (not applicable to worktrees)
- Clean up unused worktrees regularly to save disk space
- Consider SSD for worktree directories (faster I/O)
- Limit concurrent worktrees based on available RAM

## Summary

This command creates an isolated git worktree with:
- ✓ New branch for track
- ✓ Complete project copy
- ✓ Fresh dependencies
- ✓ Environment files
- ✓ Verified baseline
- ✓ Tracked in session state

The worktree is now ready for parallel task execution.
