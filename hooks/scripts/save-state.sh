#!/bin/bash
# Stop Hook - Save session state
# Part of adaptive-workflow plugin for Claude Code

set -e

# Only save if .mycelium exists
if [ ! -d ".mycelium" ]; then
  exit 0
fi

# Update session state with end time
if [ -f ".mycelium/state.json" ]; then
  # Use jq if available, otherwise simple append
  if command -v jq &> /dev/null; then
    tmp=$(mktemp)
    ended_at="$(date -Iseconds 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)"
    jq --arg ended "$ended_at" '. + {ended_at: $ended}' .mycelium/state.json > "$tmp"
    mv "$tmp" .mycelium/state.json
  else
    # Fallback: just note the session ended
    ended_at="$(date -Iseconds 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Session ended at $ended_at" >> .mycelium/state.json.log
  fi
fi

echo "💾 Session state saved" >&2
exit 0
