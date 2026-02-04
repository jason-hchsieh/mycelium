---
name: worktree-merge
description: Merge completed worktree branch back to main track. Handles conflict resolution, verification, and state updates.
category: worktree
version: 0.1.0
---

# Merge Git Worktree

## Purpose

Merge a completed worktree branch back into the main branch. This command handles the full merge lifecycle including verification, conflict resolution, testing, and cleanup.

## When to Use

Use this command when:
- All tasks in a worktree are completed
- Worktree branch is ready to merge to main
- Track has passed all verification gates (tests, review)
- Want to integrate worktree changes into main working directory

## Prerequisites

- Worktree must exist and be tracked in session state
- All tests must be passing in the worktree
- Worktree branch must have committed changes
- Main branch should be up to date (pull latest changes)

## Command Invocation

```
/workflow:worktree-merge {track_id} [--no-verify] [--base <branch>]
```

**Parameters:**
- `track_id` (required): Identifier of the worktree to merge
- `--no-verify` (optional): Skip pre-merge verification (not recommended)
- `--base <branch>` (optional): Base branch to merge into (default: main)

## Execution Steps

### 1. Pre-Merge Validation

Verify the worktree is ready to merge:

```bash
# Check worktree exists
git worktree list | grep -q ".worktrees/{track_id}"

# Verify worktree branch exists
git branch --list {track_id}

# Check for uncommitted changes in worktree
cd .worktrees/{track_id}
git status --porcelain
```

**Validation Checks:**
- ✓ Worktree exists
- ✓ Branch exists
- ✓ All changes committed (no dirty state)
- ✓ Branch has commits to merge
- ✓ Session state shows worktree is active

**Error Handling:**
- If uncommitted changes: Prompt to commit or stash
- If no commits: Warn that merge will be empty
- If worktree not found: List available worktrees

### 2. Run Worktree Tests

Verify tests pass in the worktree before merging:

```bash
cd .worktrees/{track_id}

# Run test suite
# Node/JavaScript
npm test

# Python
pytest

# Go
go test ./...

# Rust
cargo test

# Return to main directory
cd ../../
```

**Success Criteria:**
- All tests pass
- No test errors or failures
- Coverage meets project requirements (if applicable)

**Error Handling:**
- If tests fail: Block merge, report failures
- If test command not found: Warn but allow merge
- If tests timeout: Report and ask user to confirm merge

### 3. Update Main Branch

Ensure main branch is up to date:

```bash
# Fetch latest changes
git fetch origin

# Switch to main branch (or specified base branch)
git checkout main

# Pull latest changes
git pull origin main

# Check if main has diverged
git log HEAD..origin/main --oneline
```

**Error Handling:**
- If pull fails: Resolve conflicts before merging worktree
- If main has diverged significantly: Warn about potential conflicts
- If network issues: Allow local merge but warn about upstream

### 4. Merge Worktree Branch

Perform the merge:

```bash
# Merge worktree branch into main
git merge {track_id} --no-ff -m "Merge {track_id}: {track_description}"

# Example:
# git merge user-auth_20260203 --no-ff -m "Merge user-auth_20260203: Implement user authentication"
```

**Merge Strategy:**
- Use `--no-ff` (no fast-forward) to preserve branch history
- Create merge commit for traceability
- Include track description in commit message

**Commit Message Format:**
```
Merge {track_id}: {short description}

Completed tasks:
- Task 1: {description}
- Task 2: {description}
- Task 3: {description}

Verification:
✓ All tests passing
✓ Code review completed
✓ Coverage: {percentage}%

Track details: .workflow/plans/{track_id}.md
```

### 5. Handle Merge Conflicts

If conflicts occur during merge:

```bash
# Check for conflicts
git status | grep "Unmerged paths"

# List conflicted files
git diff --name-only --diff-filter=U
```

**Conflict Resolution Process:**

1. **Identify Conflicts:**
```bash
# Show conflict details
git status

# For each conflicted file:
git diff {file}
```

2. **Analyze Conflicts:**
- Read both versions (main and worktree)
- Understand the intent of each change
- Determine correct resolution

3. **Resolve Conflicts:**
```bash
# Open conflicted file
# Look for conflict markers:
# <<<<<<< HEAD
# (main branch changes)
# =======
# (worktree branch changes)
# >>>>>>> {track_id}

# Edit file to resolve conflicts
# Remove conflict markers
# Combine changes appropriately
```

4. **Test After Resolution:**
```bash
# Run tests to verify resolution
npm test  # or appropriate test command

# Stage resolved files
git add {resolved_files}
```

5. **Complete Merge:**
```bash
# Commit the merge
git commit -m "Resolve merge conflicts in {track_id}"
```

**Conflict Resolution Strategies:**

- **Accept Both Changes:** Combine both versions if they're compatible
- **Accept Theirs (Worktree):** Use worktree version if it's more complete
- **Accept Ours (Main):** Use main version if worktree is outdated
- **Manual Merge:** Edit carefully to integrate both changes correctly

**Common Conflict Scenarios:**

| Scenario | Resolution |
|----------|------------|
| Same file edited in both branches | Manually merge changes, keep both |
| File moved in one branch | Keep moved location, merge content |
| Dependency version conflicts | Use latest compatible version |
| Import statement conflicts | Merge imports, remove duplicates |
| Formatting differences | Apply project style guide |

**Error Handling:**
- If conflicts are complex: Consider aborting merge and rebasing worktree
- If unsure about resolution: Ask user for guidance
- If tests fail after resolution: Re-resolve conflicts

### 6. Post-Merge Verification

Verify the merge was successful:

```bash
# Run full test suite on merged code
npm test

# Check for any unintended side effects
git log -1 --stat

# Verify all expected files are present
git diff --name-only HEAD~1 HEAD
```

**Verification Checklist:**
- ✓ All tests pass in main branch
- ✓ Merge commit exists
- ✓ No uncommitted changes
- ✓ Project builds successfully
- ✓ No unexpected file changes

### 7. Update Session State

Update `.workflow/state/session_state.json`:

```json
{
  "worktrees": [
    {
      "track_id": "user-auth_20260203",
      "path": ".worktrees/user-auth_20260203",
      "branch": "user-auth_20260203",
      "status": "merged",
      "created_at": "2026-02-03T09:00:00Z",
      "merged_at": "2026-02-03T11:30:00Z",
      "merge_commit": "abc123def456...",
      "conflicts_resolved": true,
      "agent_id": "agent-123"
    }
  ]
}
```

**State Updates:**
- Change `status` from `active` to `merged`
- Add `merged_at` timestamp
- Record `merge_commit` SHA
- Note `conflicts_resolved` (true/false)

### 8. Push Changes (Optional)

If working with a remote repository:

```bash
# Push merged main branch
git push origin main

# Optionally push worktree branch (for PR/review)
git push origin {track_id}

# Or delete remote worktree branch if no longer needed
git push origin --delete {track_id}
```

**Remote Operations:**
- Push main branch with merge commit
- Optionally keep worktree branch for audit trail
- Or delete worktree branch if merged via PR

## Output

Provide a summary of the merge:

```
✓ Worktree merged successfully

Track ID:     user-auth_20260203
Base Branch:  main
Merge Commit: abc123def456
Conflicts:    0 files
Tests:        ✓ all passing

Changes merged:
  3 files changed, 45 insertions(+), 12 deletions(-)
  src/auth/login.ts
  src/auth/register.ts
  tests/auth.test.ts

Next steps:
1. Run /workflow:worktree-cleanup to remove worktree
2. Verify merged functionality in main branch
3. Push to remote if working with team
```

## Merge Strategies

### Fast-Forward Merge (Not Recommended)

```bash
# If worktree branch is directly ahead of main
git merge {track_id}
```

**Pros:** Clean linear history
**Cons:** Loses track branch information

### No-Fast-Forward Merge (Recommended)

```bash
# Always creates merge commit
git merge {track_id} --no-ff
```

**Pros:** Preserves branch history, clear merge points
**Cons:** More merge commits

### Rebase Before Merge

```bash
# In worktree, rebase onto main first
cd .worktrees/{track_id}
git rebase main

# Then merge in main
cd ../../
git checkout main
git merge {track_id} --no-ff
```

**Pros:** Cleaner history, fewer conflicts
**Cons:** Rewrites worktree history

### Squash Merge

```bash
# Merge all commits as single commit
git merge {track_id} --squash
git commit -m "Implement {track_description}"
```

**Pros:** Single commit per track
**Cons:** Loses individual commit history

**Recommendation:** Use `--no-ff` for traceability and history preservation.

## Common Issues

### Issue: "CONFLICT: Merge conflict in {file}"

**Cause:** Same file edited in both main and worktree

**Solution:**
1. Open conflicted file
2. Resolve conflicts manually
3. Run tests to verify
4. Stage resolved file: `git add {file}`
5. Complete merge: `git commit`

### Issue: Tests fail after merge

**Cause:** Integration issues between main and worktree changes

**Solution:**
1. Abort merge: `git merge --abort`
2. Investigate test failures in worktree
3. Update worktree to fix integration issues
4. Retry merge

### Issue: "fatal: refusing to merge unrelated histories"

**Cause:** Worktree branch has no common ancestor with main

**Solution:**
- This should not happen with worktrees created properly
- If it occurs, worktree was created incorrectly
- Recreate worktree using `/workflow:worktree-create`

### Issue: Large number of conflicts

**Cause:** Worktree branch is very outdated or main has changed significantly

**Solution:**
1. Abort merge: `git merge --abort`
2. Update worktree branch with main changes:
   ```bash
   cd .worktrees/{track_id}
   git rebase main
   # Resolve conflicts incrementally
   ```
3. Retry merge after rebase

## Merge Best Practices

### Before Merging

- ✓ Ensure all tests pass in worktree
- ✓ Run code review (Phase 5)
- ✓ Update main branch to latest
- ✓ Verify worktree has all commits
- ✓ Check for conflicts early

### During Merge

- ✓ Use `--no-ff` for traceability
- ✓ Write descriptive merge commit message
- ✓ Resolve conflicts carefully
- ✓ Test after each conflict resolution
- ✓ Keep merge focused (don't add new changes)

### After Merge

- ✓ Run full test suite on main
- ✓ Verify no regressions
- ✓ Update session state
- ✓ Push to remote (if applicable)
- ✓ Clean up worktree when done

## Integration with Workflow

### Phase 4: Implementation to Phase 5: Review

```
Phase 4: Implementation (Worktree)
├── Task execution
├── Tests passing
└── All commits made
         ↓
Phase 4.5: Merge (This Command)
├── Verify tests
├── Update main
├── Merge branch
├── Resolve conflicts
└── Post-merge tests
         ↓
Phase 5: Main Branch Updated
└── Ready for next track
```

### Parallel Execution Flow

```
Track 1 completes → Merge to main → Track 3 can start
                                      (was blocked by Track 1)

Track 2 completes → Merge to main → Track 4 can start
                                      (was blocked by Track 2)
```

## Related Commands

- `/workflow:worktree-create` - Create new worktree
- `/workflow:worktree-cleanup` - Remove merged worktree
- `/workflow:work-parallel` - Manage parallel execution with auto-merge
- `/workflow:status` - View worktree merge status

## Technical Notes

### Merge Commit Structure

A proper merge commit includes:
- Parent commits: main branch and worktree branch
- Merge message describing what was merged
- References to plan/tasks
- Verification status

### Git References

```bash
# View merge commit details
git log --graph --oneline --all

# See what was merged
git diff HEAD~1 HEAD

# List files changed in merge
git diff --name-status HEAD~1 HEAD
```

### Merge Commit vs Regular Commit

- **Merge Commit:** Has two parent commits (main + worktree)
- **Regular Commit:** Has one parent commit
- Merge commits mark integration points in history

## Rollback

If merge causes problems:

```bash
# Undo merge (if not pushed)
git reset --hard HEAD~1

# Undo merge (if pushed)
git revert -m 1 HEAD

# Return to pre-merge state
git checkout main
git reset --hard origin/main
```

**Caution:** Only rollback before pushing to remote. After pushing, use `git revert`.

## Summary

This command merges a worktree branch to main with:
- ✓ Pre-merge validation
- ✓ Test verification
- ✓ Conflict resolution
- ✓ Post-merge tests
- ✓ Session state updates
- ✓ Merge commit traceability

The worktree changes are now integrated into the main branch.
