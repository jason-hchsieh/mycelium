---
name: mycelium-finalize
description: Creates git commit with Co-Author and pull request to finalize completed work. Use when user says "commit this", "create PR", "finalize changes", or after review passes. Handles platform detection (GitHub/GitLab/Gitea) and uses appropriate CLI tools (gh/glab/tea).
license: MIT
version: 0.9.0
allowed-tools: ["Bash", "Read"]
metadata:
  author: Jason Hsieh
  category: finalization
  tags: [git, commit, pull-request, finalization, phase-6]
  documentation: https://github.com/jason-hchsieh/mycelium
---

# Finalization

Create git commit with Co-Author and pull request to finalize completed work.

## Core Principle

**Every unit of work deserves proper attribution and review. Commit with Co-Author, create PR for visibility.**

This skill implements Phase 6 (Finalization) of the mycelium workflow, ensuring that:
- All changes are committed with proper attribution (Co-Author)
- Pull requests are created for review and tracking
- Platform-specific tools are used (gh, glab, tea)
- Commit messages follow conventional commit style

## Your Task

1. **Update session state** - Write `invocation_mode: "single"` to [state.json][session-state-schema]

2. **Detect git platform:**
   - Check remote URL for github.com, gitlab.com, gitea.io
   - Detect if CLI tool is installed (gh, glab, tea)
   - Fall back to git push + manual PR if needed

3. **Create git commit:**
   - Stage changed files
   - Create commit with conventional style
   - Always include Co-Author line

4. **Create pull request:**
   - Use platform CLI if available
   - Include summary and test results
   - Fall back to instructions if CLI not available

5. **Hand off to next phase:**
   - Update `current_phase: "pattern_detection"` in state.json
   - If `invocation_mode == "full"`: Invoke `mycelium-patterns`
   - If `invocation_mode == "single"`: Suggest `/mycelium-patterns`

---

## Step 1: Detect Git Platform

### Platform Detection

**Check remote URL:**

```bash
git remote get-url origin

# Examples:
# GitHub: https://github.com/user/repo.git
# GitHub SSH: git@github.com:user/repo.git
# GitLab: https://gitlab.com/user/repo.git
# Gitea: https://gitea.io/user/repo.git
```

**Extract platform:**

```javascript
const remoteUrl = exec("git remote get-url origin")

if (remoteUrl.includes("github.com")) {
  platform = "github"
  cli_tool = "gh"
} else if (remoteUrl.includes("gitlab.com")) {
  platform = "gitlab"
  cli_tool = "glab"
} else if (remoteUrl.includes("gitea")) {
  platform = "gitea"
  cli_tool = "tea"
} else {
  platform = "unknown"
  cli_tool = "git"
}
```

### CLI Tool Detection

**Check if installed:**

```bash
# GitHub CLI
command -v gh >/dev/null 2>&1
if [ $? -eq 0 ]; then
  gh_available=true
fi

# GitLab CLI
command -v glab >/dev/null 2>&1
if [ $? -eq 0 ]; then
  glab_available=true
fi

# Gitea CLI (tea)
command -v tea >/dev/null 2>&1
if [ $? -eq 0 ]; then
  tea_available=true
fi
```

**Installation suggestions:**

```javascript
if (!cli_available) {
  warn(`⚠️ ${cli_tool} not installed`)
  output("")
  output("Install with:")
  if (platform == "github") {
    output("  brew install gh")
    output("  gh auth login")
  } else if (platform == "gitlab") {
    output("  brew install glab")
    output("  glab auth login")
  } else if (platform == "gitea") {
    output("  brew install tea")
    output("  tea login add")
  }
  output("")
  output("Will use git push as fallback.")
}
```

---

## Step 2: Create Git Commit

### Analyze Changes

**Check what changed:**

```bash
# Staged changes
git diff --cached --stat

# Unstaged changes
git diff --stat

# Untracked files
git status --porcelain | grep "^??"
```

### Determine Commit Type

**Conventional commit types:**

```javascript
// Analyze changes to determine type
const changedFiles = exec("git diff --cached --name-only")

if (changedFiles.includes("test")) {
  type = "test"
} else if (changedFiles.includes("docs/") || changedFiles.includes("README")) {
  type = "docs"
} else if (changedFiles.every(f => f.includes(".md"))) {
  type = "docs"
} else {
  // Read plan to determine feature vs fix
  const plan = read(".mycelium/plans/{current_plan}.md")
  if (plan.includes("fix") || plan.includes("bug")) {
    type = "fix"
  } else if (plan.includes("refactor")) {
    type = "refactor"
  } else {
    type = "feat"
  }
}
```

### Create Commit Message

**Format:**

```
{type}: {short description}

{detailed description}

{test results}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Example:**

```bash
git commit -m "$(cat <<'EOF'
feat: add JWT authentication with bcrypt

Implemented:
- User model with password hashing (bcrypt, 10 rounds)
- JWT token generation and validation
- Login endpoint (POST /api/auth/login)
- Token refresh endpoint (POST /api/auth/refresh)

Tests: 45 passing (12 new), 0 failing
Coverage: 87% (target: 80%)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

### Stage and Commit

**Stage files:**

```bash
# Prefer specific files over "git add ."
git add src/auth/*.ts
git add src/models/User.ts
git add tests/auth/*.test.ts

# Avoid accidentally staging sensitive files
# Check for .env, credentials, etc. before staging
```

**Create commit:**

```bash
git commit -m "$(cat <<'EOF'
{commit_message_here}
EOF
)"
```

**Capture commit SHA:**

```bash
commit_sha=$(git rev-parse HEAD)

# Save to state.json
{
  "last_commit": "abc1234",
  "last_commit_message": "feat: add JWT authentication"
}
```

---

## Step 3: Create Pull Request

### Check Branch Status

**Is branch pushed to remote?**

```bash
# Check if current branch tracks remote
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null

# If not tracking, push with -u
if [ $? -ne 0 ]; then
  git push -u origin $(git branch --show-current)
else
  git push
fi
```

### Platform-Specific PR Creation

#### GitHub (gh)

```bash
gh pr create \
  --title "{pr_title}" \
  --body "$(cat <<'EOF'
## Summary
{1-3 bullet points summarizing changes}

## Changes
{list of key changes}

## Test Results
- ✅ 45 tests passing (12 new)
- ✅ Coverage: 87%
- ✅ Linting: no errors
- ✅ Build: successful

## Checklist
- [x] Tests added/updated
- [x] Documentation updated
- [x] No breaking changes
- [x] Backward compatible

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

#### GitLab (glab)

```bash
glab mr create \
  --title "{pr_title}" \
  --description "$(cat <<'EOF'
{same format as GitHub}
EOF
)"
```

#### Gitea (tea)

```bash
tea pr create \
  --title "{pr_title}" \
  --description "$(cat <<'EOF'
{same format as GitHub}
EOF
)"
```

#### Fallback (git only)

```bash
# Push branch
git push -u origin $(git branch --show-current)

# Show instructions
output("")
output("📝 Branch pushed. Create PR manually:")
output("")
output("  {remote_url}/compare/{base_branch}...{current_branch}")
output("")
output("Suggested PR title:")
output("  {pr_title}")
output("")
output("Suggested description:")
output("{pr_body}")
```

### PR Title and Body

**Title format:**

```javascript
// Use first line of commit message
const commitMessage = exec("git log -1 --pretty=%s")
const prTitle = commitMessage  // e.g., "feat: add JWT authentication"
```

**Body format:**

```markdown
## Summary
- Implemented JWT-based authentication
- Added bcrypt password hashing
- Created login and refresh endpoints

## Changes
- `src/auth/jwt.ts` - JWT token generation/validation
- `src/models/User.ts` - User model with password hashing
- `src/routes/auth.ts` - Login and refresh endpoints
- `tests/auth/*.test.ts` - 12 new tests

## Test Results
- ✅ 45 tests passing (12 new)
- ✅ Coverage: 87% (target: 80%)
- ✅ Linting: no errors
- ✅ Build: successful

## Checklist
- [x] Tests added/updated
- [x] Documentation updated
- [x] No breaking changes
- [x] Backward compatible

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Step 4: Phase Handoff

**Update state:**

```json
{
  "current_phase": "pattern_detection",
  "checkpoints": {
    "context_loading_complete": "2026-02-13T10:00:00Z",
    "clarify_complete": "2026-02-13T10:10:00Z",
    "planning_complete": "2026-02-13T10:30:00Z",
    "implementation_complete": "2026-02-13T11:00:00Z",
    "review_complete": "2026-02-13T11:30:00Z",
    "finalization_complete": "2026-02-13T11:35:00Z"
  },
  "last_commit": "abc1234",
  "last_commit_message": "feat: add JWT authentication",
  "pr_url": "https://github.com/user/repo/pull/123"
}
```

**Chain or suggest:**

```javascript
if (invocation_mode == "full") {
  // Full workflow mode - chain to pattern detection
  output("✅ Changes finalized. Detecting patterns...")
  invoke("mycelium-patterns")
} else {
  // Single phase mode - suggest next step
  output("✅ Changes finalized. Continue with: /mycelium-patterns")
}
```

---

## Output Examples

### Example 1: Successful Finalization (GitHub)

```
🔄 Finalizing Changes

Platform: GitHub (gh available)
Branch: feature/jwt-auth

📝 Creating Commit

Type: feat (new feature)
Files: 8 changed (src/auth/, src/models/, tests/)

Commit created: abc1234
Message: "feat: add JWT authentication with bcrypt"

🚀 Creating Pull Request

Pushed: feature/jwt-auth → origin/feature/jwt-auth

Pull Request: https://github.com/user/repo/pull/123
Title: feat: add JWT authentication with bcrypt
Status: Open, ready for review

✅ Finalization Complete

Next: /mycelium-patterns (detect recurring patterns)
```

### Example 2: Fallback (No CLI)

```
🔄 Finalizing Changes

Platform: GitHub
⚠️ gh CLI not installed (will use git fallback)

Install with:
  brew install gh
  gh auth login

📝 Creating Commit

Commit created: abc1234

🚀 Pushing Branch

Pushed: feature/jwt-auth → origin/feature/jwt-auth

📝 Create PR Manually

Visit: https://github.com/user/repo/compare/main...feature/jwt-auth

Suggested Title:
feat: add JWT authentication with bcrypt

Suggested Description:
[full PR body...]

✅ Finalization Complete

Next: /mycelium-patterns
```

---

## Error Handling

**No remote configured:**

```
❌ Error: No remote repository

Cannot create PR without remote.

Add remote:
  git remote add origin <url>

Then retry: /mycelium-finalize
```

**Nothing to commit:**

```
⚠️ Warning: No changes to commit

Working tree is clean. Nothing to finalize.

If you expected changes:
- Check if changes were already committed
- Verify files are staged: git status
```

**Push fails (diverged branch):**

```
❌ Error: Push rejected

Branch has diverged from remote.

Fix with:
  git pull --rebase origin $(git branch --show-current)

Then retry: /mycelium-finalize

⚠️ Do NOT force push unless you're certain!
```

**PR creation fails:**

```
❌ Error: PR creation failed

Possible causes:
- Not authenticated (run: gh auth login)
- Branch already has PR
- Network issue

Fallback: Create PR manually at:
https://github.com/user/repo/compare/main...{branch}
```

---

## Quick Examples

```bash
# Finalize after review passes
/mycelium-finalize

# Creates commit + PR, then suggests:
# /mycelium-patterns
```

## Important Notes

- **Always include Co-Author** - Attribution for Claude's contribution
- **Conventional commit style** - feat/fix/docs/test/refactor/chore
- **Platform detection** - Handles GitHub/GitLab/Gitea automatically
- **CLI preferred, fallback available** - Works without gh/glab/tea
- **Never force push** - Unless explicitly requested by user
- **Stage specific files** - Avoid accidentally committing .env, credentials

## Git Safety

- **Never update git config** - Respect user's settings
- **Never skip hooks** - Let pre-commit/pre-push hooks run
- **Never use --no-verify** - Unless explicitly requested
- **Never force push to main/master** - Warn user if requested
- **Check for sensitive files** - Don't commit .env, credentials.json

## References

- [Session state docs][session-state-docs]
- [Session state schema][session-state-schema]
- [GitHub CLI docs](https://cli.github.com/)
- [GitLab CLI docs](https://docs.gitlab.com/ee/editor_extensions/gitlab_cli/)
- [Gitea CLI (tea) docs](https://gitea.com/gitea/tea)

[session-state-docs]: ../../docs/session-state.md
[session-state-schema]: ../../schemas/session-state.schema.json
