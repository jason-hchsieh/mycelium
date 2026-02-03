#!/bin/bash
# Session Start Hook - Load context and discover capabilities
# Part of adaptive-workflow plugin for Claude Code

set -e

# Check if .workflow directory exists
if [ ! -d ".workflow" ]; then
  echo "⚠️  No .workflow directory found. Run /workflow:setup to initialize." >&2
  exit 0
fi

# Load session state or create new
if [ ! -f ".workflow/state/session_state.json" ]; then
  echo "📋 Initializing new session..." >&2
  mkdir -p .workflow/state
  cat > .workflow/state/session_state.json <<EOF
{
  "session_id": "$(uuidgen 2>/dev/null || echo "session-$(date +%s)")",
  "started_at": "$(date -Iseconds)",
  "current_track": null,
  "discovered_capabilities": {
    "agents": [],
    "skills": [],
    "mcps": []
  },
  "metrics": {
    "tasks_completed": 0,
    "tasks_failed": 0,
    "context_resets": 0,
    "human_interventions": 0
  }
}
EOF
fi

# Display context loading message
echo "🔄 Loading workflow context..." >&2

# Check for institutional knowledge
if [ -d ".workflow/solutions" ]; then
  solution_count=$(find .workflow/solutions -type f -name "*.md" 2>/dev/null | wc -l)
  echo "📚 Found $solution_count documented solutions" >&2
fi

if [ -f ".workflow/solutions/patterns/critical-patterns.md" ]; then
  echo "⭐ Critical patterns available" >&2
fi

if [ -d ".workflow/learned" ]; then
  echo "🧠 Learned knowledge available" >&2
fi

# Check for active tracks
if [ -d ".worktrees" ]; then
  worktree_count=$(ls -1 .worktrees 2>/dev/null | wc -l)
  if [ "$worktree_count" -gt 0 ]; then
    echo "🌿 $worktree_count active worktree(s)" >&2
  fi
fi

# Check for in-progress work
if [ -f ".workflow/state/progress.md" ]; then
  echo "📝 Progress state found - resumable session" >&2
fi

echo "✅ Context loaded successfully" >&2
exit 0
