#!/bin/bash
# Stop Hook - Save session state
# Part of adaptive-workflow plugin for Claude Code

set -e

# Only save if .workflow exists
if [ ! -d ".workflow/state" ]; then
  exit 0
fi

# Update session state with end time
if [ -f ".workflow/state/session_state.json" ]; then
  # Use jq if available, otherwise simple append
  if command -v jq &> /dev/null; then
    tmp=$(mktemp)
    jq --arg ended "$(date -Iseconds)" '. + {ended_at: $ended}' .workflow/state/session_state.json > "$tmp"
    mv "$tmp" .workflow/state/session_state.json
  else
    # Fallback: just note the session ended
    echo "Session ended at $(date -Iseconds)" >> .workflow/state/session_state.json.log
  fi
fi

echo "💾 Session state saved" >&2
exit 0
