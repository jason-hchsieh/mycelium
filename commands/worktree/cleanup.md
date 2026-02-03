---
name: worktree-cleanup
command: /workflow:worktree-cleanup
description: Remove completed or abandoned worktrees, prune stale branches, and clean up workspace. Reclaims disk space and maintains repository hygiene.
category: worktree
version: 0.1.0
---

# Cleanup Git Worktrees

## Purpose

Remove completed or abandoned git worktrees and clean up associated branches. This command reclaims disk space, removes stale references, and maintains a clean repository structure.

## When to Use

Use this command when:
- Worktree has been successfully merged to main
- Worktree is abandoned and no longer needed
- Accumulating too many worktrees (disk space concerns)
- Repository maintenance and cleanup
- Starting fresh session (clean up previous worktrees)

## Prerequisites

- None (this command is safe to run anytime)
- Ideally, worktrees should be merged or their changes saved before cleanup
- Session state file exists to track worktrees

## Command Invocation

```
/workflow:worktree-cleanup [track_id] [--all] [--force] [--dry-run]
```

**Parameters:**
- `track_id` (optional): Specific worktree to clean up
- `--all` (optional): Clean up all merged worktrees
- `--force` (optional): Remove even if not merged (destructive)
- `--dry-run` (optional): Show what would be removed without removing

## Execution Steps

### 1. List Current Worktrees

Discover all existing worktrees:

```bash
# List all git worktrees
git worktree list

# Parse output to get worktree paths
git worktree list --porcelain
```

**Expected Output:**
```
worktree /path/to/project
HEAD abc123...
branch refs/heads/main

worktree /path/to/project/.worktrees/user-auth_20260203
HEAD def456...
branch refs/heads/user-auth_20260203

worktree /path/to/project/.worktrees/api-refactor_20260203
HEAD ghi789...
branch refs/heads/api-refactor_20260203
```

### 2. Check Worktree Status

For each worktree, determine its status:

```bash
# Check if branch is merged
git branch --merged main | grep "{track_id}"

# Check session state
# Read .workflow/state/session_state.json
# Look for worktree status: merged, active, abandoned
```

**Status Categories:**
- **Merged:** Branch merged to main, safe to remove
- **Active:** Currently in use, keep
- **Abandoned:** Not merged, no recent activity, prompt user
- **Stale:** Worktree directory missing but git reference exists

### 3. Remove Worktree

Remove the worktree based on status:

#### For Merged Worktrees (Safe)

```bash
# Remove worktree directory
git worktree remove .worktrees/{track_id}

# Delete merged branch
git branch -d {track_id}

# Success: Branch was merged, removed cleanly
```

#### For Active/Unmerged Worktrees (Requires --force)

```bash
# Check for uncommitted changes
cd .worktrees/{track_id}
git status --porcelain

# If changes exist, warn user
if [ -n "$(git status --porcelain)" ]; then
  echo "WARNING: Uncommitted changes in {track_id}"
  echo "Changes will be lost. Use --force to proceed."
  exit 1
fi

# With --force flag:
git worktree remove --force .worktrees/{track_id}

# Delete unmerged branch (requires -D)
git branch -D {track_id}
```

**Safety Checks:**
- Warn if uncommitted changes exist
- Require `--force` for unmerged branches
- Prompt user for confirmation on destructive operations
- Show what will be lost before proceeding

### 4. Handle Stale Worktrees

If worktree directory is missing but git reference exists:

```bash
# Prune stale worktree references
git worktree prune

# Or manually remove specific worktree
git worktree remove {track_id}
```

**Stale Worktree Causes:**
- Directory manually deleted
- Disk failure or corruption
- Worktree on removed external drive
- System crash during worktree operations

### 5. Clean Branch References

Remove branches associated with cleaned worktrees:

```bash
# List branches that can be deleted
git branch --merged main | grep -v "^\*" | grep -v "main"

# Delete merged branches
git branch -d {branch_names}

# For unmerged branches (with --force)
git branch -D {branch_names}
```

**Branch Cleanup Rules:**
- Delete merged branches automatically
- Keep unmerged branches unless `--force` specified
- Never delete main/master branch
- Preserve branches with remote tracking (unless explicitly requested)

### 6. Update Session State

Update `.workflow/state/session_state.json`:

```json
{
  "worktrees": [
    {
      "track_id": "user-auth_20260203",
      "path": ".worktrees/user-auth_20260203",
      "branch": "user-auth_20260203",
      "status": "cleaned",
      "created_at": "2026-02-03T09:00:00Z",
      "merged_at": "2026-02-03T11:30:00Z",
      "cleaned_at": "2026-02-03T12:00:00Z"
    }
  ]
}
```

**State Updates:**
- Change `status` to `cleaned`
- Add `cleaned_at` timestamp
- Optionally archive cleaned worktree records
- Or remove record entirely for merged worktrees

### 7. Reclaim Disk Space

After removing worktrees:

```bash
# Git garbage collection (optional)
git gc --auto

# Show space reclaimed
du -sh .worktrees/
```

**Disk Space Calculation:**
- Each worktree ≈ project size + dependencies
- Removing worktree reclaims full directory size
- Git objects shared (minimal savings from git gc)

### 8. Cleanup Report

Provide summary of cleanup operations:

```
✓ Worktree cleanup completed

Cleaned worktrees:
  - user-auth_20260203 (merged, removed)
  - api-refactor_20260203 (merged, removed)

Branches deleted:
  - user-auth_20260203 (merged)
  - api-refactor_20260203 (merged)

Disk space reclaimed: 450 MB

Active worktrees remaining:
  - payment-integration_20260203 (active)

To remove active worktrees, use: /workflow:worktree-cleanup {track_id} --force
```

## Cleanup Modes

### Single Worktree Cleanup

Remove specific worktree:

```bash
# Clean up specific track
/workflow:worktree-cleanup user-auth_20260203
```

**Use Case:** Remove one completed track

### Batch Cleanup (Merged Only)

Remove all merged worktrees:

```bash
# Clean up all merged worktrees
/workflow:worktree-cleanup --all
```

**Use Case:** Regular maintenance, safe cleanup

### Force Cleanup (All)

Remove all worktrees including active:

```bash
# Clean up everything (dangerous)
/workflow:worktree-cleanup --all --force
```

**Use Case:** Starting fresh, abandoning all work

### Dry Run

Preview what would be removed:

```bash
# See what would be cleaned
/workflow:worktree-cleanup --all --dry-run
```

**Use Case:** Verify cleanup before executing

## Common Issues

### Issue: "fatal: '.worktrees/{track_id}' contains modified or untracked files"

**Cause:** Uncommitted changes in worktree

**Solution:**
```bash
# Option 1: Commit changes first
cd .worktrees/{track_id}
git add .
git commit -m "Save work before cleanup"
cd ../../
/workflow:worktree-cleanup {track_id}

# Option 2: Force remove (loses changes)
/workflow:worktree-cleanup {track_id} --force
```

### Issue: "fatal: validation failed, cannot remove working tree"

**Cause:** Worktree has issues or is locked

**Solution:**
```bash
# Unlock worktree
git worktree unlock {track_id}

# Try remove again
git worktree remove .worktrees/{track_id}

# If still fails, force remove
git worktree remove --force .worktrees/{track_id}
```

### Issue: Directory exists but git doesn't know about it

**Cause:** Worktree was manually deleted or git metadata is stale

**Solution:**
```bash
# Prune stale worktree references
git worktree prune

# Manually remove directory if needed
rm -rf .worktrees/{track_id}
```

### Issue: "Cannot delete branch, not fully merged"

**Cause:** Branch has commits not in main

**Solution:**
```bash
# Verify branch is truly not merged
git log main..{track_id}

# If should be kept, don't delete branch
# If should be deleted, use -D (force delete)
git branch -D {track_id}
```

## Cleanup Strategies

### Conservative (Default)

- Only remove merged worktrees
- Preserve unmerged work
- Require explicit `--force` for active worktrees
- Safety first approach

**Best for:** Production work, important changes

### Aggressive (--force)

- Remove all worktrees regardless of status
- Delete unmerged branches
- No safety checks
- Fast cleanup

**Best for:** Experiments, throwaway work, starting fresh

### Selective

- Remove specific worktrees by track_id
- Keep control over what's removed
- Review each worktree individually
- Audit before cleanup

**Best for:** Complex projects, multiple teams

## Best Practices

### When to Clean Up

- ✓ After successful merge to main
- ✓ When abandoning a track
- ✓ Regular maintenance (weekly/monthly)
- ✓ Before starting new work session
- ✓ When disk space is low

### What to Preserve

- ✓ Active worktrees (ongoing work)
- ✓ Worktrees with uncommitted changes
- ✓ Worktrees under review
- ✓ Experimental branches not yet evaluated
- ✓ Worktrees assigned to other agents

### What to Remove

- ✓ Merged worktrees (changes in main)
- ✓ Abandoned tracks (no activity)
- ✓ Failed/cancelled tracks
- ✓ Duplicate worktrees
- ✓ Stale worktree references

### Before Cleanup

```bash
# 1. Check what will be removed
/workflow:worktree-cleanup --dry-run

# 2. Verify worktrees are merged
git branch --merged main

# 3. Check for uncommitted changes
for dir in .worktrees/*/; do
  echo "Checking $dir"
  cd "$dir"
  git status --short
  cd -
done

# 4. Run cleanup
/workflow:worktree-cleanup --all
```

## Integration with Workflow

### Phase 4.5: Post-Merge Cleanup

```
Track Completes (Phase 4)
         ↓
Merge to Main (Phase 4.5)
         ↓
Cleanup Worktree (This Command)
         ↓
Ready for Next Track
```

### Session Lifecycle

```
Session Start
├── Create worktrees (/workflow:worktree-create)
├── Work in parallel
├── Merge completed tracks (/workflow:worktree-merge)
└── Clean up worktrees (this command)

Session End
```

### Maintenance Schedule

```
Daily:
- Clean up merged worktrees

Weekly:
- Review active worktrees
- Prune stale references
- Check disk space

Monthly:
- Archive old branch history
- Full repository cleanup
```

## Related Commands

- `/workflow:worktree-create` - Create new worktree
- `/workflow:worktree-merge` - Merge worktree before cleanup
- `/workflow:status` - View all worktrees and their status
- `/workflow:work-parallel` - Manage parallel execution lifecycle

## Technical Notes

### Worktree Removal Process

1. Git removes worktree entry from `.git/worktrees/`
2. Worktree directory is deleted from filesystem
3. Branch can be deleted if no longer needed
4. Working tree files are permanently removed

### What Gets Deleted

- ✓ Worktree directory (`.worktrees/{track_id}/`)
- ✓ Worktree metadata (`.git/worktrees/{track_id}/`)
- ✓ Git branch (optional, with branch delete)
- ✗ Git commits (preserved in git history)
- ✗ Main repository data

### Recovery

**After cleanup, recovery is difficult:**
- Worktree directory is deleted (not in trash)
- Unmerged commits may be lost if branch is deleted
- Use `git reflog` to recover deleted branch commits
- No recovery for uncommitted changes

**Prevention:**
```bash
# Before cleanup, ensure work is saved:
cd .worktrees/{track_id}
git log origin/main..HEAD  # Check commits
git status                  # Check uncommitted
```

## Safety Features

### Built-in Safeguards

- Refuse to remove worktrees with uncommitted changes (unless `--force`)
- Refuse to delete unmerged branches (use `git branch -D` explicitly)
- Show dry-run output before actual removal
- Require confirmation for destructive operations
- Preserve git commits (can recover branch with reflog)

### Manual Override

Use `--force` to bypass safety checks:
```bash
# Force remove worktree with uncommitted changes
/workflow:worktree-cleanup {track_id} --force

# Force delete unmerged branch
git branch -D {track_id}
```

**Warning:** `--force` is destructive. Uncommitted changes will be lost.

## Disk Space Management

### Space Usage

```bash
# Check worktree directory sizes
du -sh .worktrees/*

# Total worktree space
du -sh .worktrees/

# Repository size
du -sh .git/
```

### Space Savings

| Worktrees | Typical Size Each | Total Space |
|-----------|-------------------|-------------|
| 1         | 200 MB            | 200 MB      |
| 3         | 200 MB            | 600 MB      |
| 5         | 200 MB            | 1 GB        |
| 10        | 200 MB            | 2 GB        |

**Recommendation:** Clean up regularly to prevent excessive disk usage.

## Automation

### Automatic Cleanup on Merge

Optionally auto-cleanup after merge:

```bash
# In /workflow:worktree-merge command
# After successful merge:
/workflow:worktree-cleanup {track_id}
```

### Session Cleanup Hook

Clean up on session end:

```json
// In hooks/hooks.json
{
  "hooks": {
    "SessionEnd": [
      {
        "command": "/workflow:worktree-cleanup --all",
        "description": "Clean merged worktrees on session end"
      }
    ]
  }
}
```

### Scheduled Cleanup

```bash
# Cron job for weekly cleanup
0 0 * * 0 cd /path/to/project && git worktree prune
```

## Summary

This command cleans up worktrees with:
- ✓ Safe removal of merged worktrees
- ✓ Stale reference pruning
- ✓ Branch cleanup
- ✓ Disk space reclamation
- ✓ Session state updates
- ✓ Safety checks and confirmations

The repository is now clean and ready for new worktrees.
