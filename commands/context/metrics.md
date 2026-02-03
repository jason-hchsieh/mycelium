---
name: metrics
description: Displays session metrics including tasks completed/failed/skipped, context resets, recovery actions, pattern usage, and workflow effectiveness tracking. Use to monitor workflow health and identify improvement opportunities.
argument-hint: "[optional: format] where format is: summary|detailed|json"
allowed-tools: ["Read", "Grep", "Bash", "Glob"]
---

You are executing the **/workflow:metrics** command to display session metrics and workflow effectiveness data.

## Purpose

Display comprehensive metrics about the current session:
1. Task completion statistics
2. Context management metrics
3. Recovery and debugging actions
4. Pattern and skill usage
5. Workflow phase progression
6. Quality indicators

## Metrics Collection

### Step 1: Load Session State

Read current session data:

```bash
# Load session state
cat .workflow/state/session_state.json

# Load progress file
cat .workflow/state/progress.md

# Load current plan
cat .workflow/plans/*.md | tail -1
```

### Step 2: Gather Task Metrics

From session state and plan files:

**Task Statistics:**
- `tasks_completed` - Tasks marked [x] complete
- `tasks_failed` - Tasks that hit blockers/errors
- `tasks_skipped` - Tasks marked as not needed
- `tasks_pending` - Tasks marked [ ] incomplete
- `tasks_in_progress` - Tasks marked [~] active
- `total_tasks` - Total tasks in current plan

**Calculate:**
- Completion rate: `(completed / total) * 100`
- Success rate: `(completed / (completed + failed)) * 100`
- Average task time: Estimate from timestamps if available

### Step 3: Gather Context Metrics

From session state and checkpoints:

**Context Statistics:**
- `context_syncs` - Total sync operations
- `context_compressions` - Times context compressed
- `fresh_spawns` - Times fresh agent spawned
- `checkpoints_created` - Total checkpoints saved
- `current_context_usage` - Current usage percentage
- `highest_context_usage` - Peak usage this session

### Step 4: Gather Recovery Metrics

From session state and git log:

**Recovery Statistics:**
- `recovery_actions` - Times recovery protocol invoked
- `test_failures_fixed` - Test failures debugged
- `rework_count` - Times had to redo work
- `git_bisect_runs` - Times used git bisect
- `hypothesis_tested` - Debug hypotheses tested

### Step 5: Gather Pattern/Skill Metrics

From session state:

**Learning Statistics:**
- `patterns_applied` - Times used existing patterns
- `skills_used` - Skills invoked this session
- `solutions_referenced` - Prior solutions consulted
- `decisions_made` - Architectural decisions recorded
- `new_patterns_detected` - New patterns found

### Step 6: Gather Quality Metrics

From git and test results:

**Quality Statistics:**
- `commits_made` - Total commits this session
- `test_runs` - Times tests executed
- `test_pass_rate` - Percentage tests passing
- `current_coverage` - Code coverage percentage
- `lint_violations` - Current linting issues
- `review_cycles` - Times code reviewed

### Step 7: Calculate Effectiveness Indicators

**Workflow Effectiveness:**
- `first_time_success_rate` - Tasks completed without rework
- `pattern_reuse_rate` - Tasks using existing patterns vs novel
- `context_efficiency` - Tasks per context sync
- `knowledge_capture_rate` - Solutions captured vs problems solved

## Output Formats

### Summary Format (Default)

```markdown
## Workflow Metrics Summary

### Task Progress
✓ Completed: {completed}/{total} ({completion_rate}%)
✗ Failed: {failed}
⊘ Skipped: {skipped}
◷ In Progress: {in_progress}
⌛ Pending: {pending}

**Success Rate:** {success_rate}%
**Average Task Time:** ~{avg_time} minutes

### Context Health
📊 Context Usage: {current}% (Peak: {peak}%)
🔄 Syncs: {syncs} | Compressions: {compressions} | Fresh Spawns: {spawns}
💾 Checkpoints: {checkpoints}
📈 Efficiency: {tasks_per_sync} tasks/sync

### Recovery & Debugging
🔧 Recovery Actions: {recovery_actions}
🐛 Test Failures Fixed: {test_failures_fixed}
♻️  Rework Count: {rework_count}
🔍 Git Bisect Runs: {git_bisect_runs}

### Learning & Patterns
📚 Patterns Applied: {patterns_applied}
🎯 Skills Used: {skills_used}
📖 Solutions Referenced: {solutions_referenced}
💡 Decisions Made: {decisions_made}
✨ New Patterns Detected: {new_patterns_detected}

### Quality Indicators
✅ Test Pass Rate: {test_pass_rate}%
📈 Coverage: {current_coverage}% (Target: {target_coverage}%)
📝 Commits: {commits_made}
🔬 Review Cycles: {review_cycles}
⚠️  Lint Issues: {lint_violations}

### Effectiveness Score
🎯 First-Time Success: {fts_rate}%
♻️  Pattern Reuse: {pattern_reuse_rate}%
📚 Knowledge Capture: {knowledge_capture_rate}%

**Overall Session Health:** {excellent|good|fair|needs_attention}
```

### Detailed Format

Show all metrics with breakdowns:

```markdown
## Detailed Workflow Metrics

### Session Information
- **Session Start:** {timestamp}
- **Duration:** {hours}h {minutes}m
- **Track:** {track_id}
- **Current Phase:** {phase}
- **Worktree:** {worktree_path}

### Task Metrics

#### By Status
| Status | Count | Percentage |
|--------|-------|------------|
| Completed | {completed} | {percent}% |
| Failed | {failed} | {percent}% |
| Skipped | {skipped} | {percent}% |
| In Progress | {in_progress} | {percent}% |
| Pending | {pending} | {percent}% |
| **Total** | **{total}** | **100%** |

#### By Complexity
| Size | Completed | Failed | Success Rate |
|------|-----------|--------|--------------|
| Tiny | {count} | {count} | {rate}% |
| Small | {count} | {count} | {rate}% |
| Medium | {count} | {count} | {rate}% |
| Large | {count} | {count} | {rate}% |

#### Task Timing (if available)
- **Fastest:** {task_id} ({time} min)
- **Slowest:** {task_id} ({time} min)
- **Average:** {avg_time} min
- **Median:** {median_time} min

### Context Management Metrics

#### Usage Timeline
| Event | Time | Context % | Action |
|-------|------|-----------|--------|
| Session Start | {time} | {percent}% | Initial |
| After Task 1 | {time} | {percent}% | Continue |
| Sync 1 | {time} | {percent}% | Compress |
| After Task 5 | {time} | {percent}% | Continue |
| Sync 2 | {time} | {percent}% | Fresh Spawn |

#### Checkpoint History
- Total checkpoints: {count}
- Last checkpoint: {checkpoint_id} at {timestamp}
- Checkpoints per hour: {rate}

#### Context Efficiency
- Tasks completed per sync: {ratio}
- Average context at sync: {percent}%
- Compression effectiveness: {tokens_saved} tokens saved

### Recovery & Error Metrics

#### Recovery Actions
| Type | Count | Success Rate |
|------|-------|--------------|
| Test Failure Debug | {count} | {rate}% |
| Systematic Debug (5-phase) | {count} | {rate}% |
| Git Bisect | {count} | {rate}% |
| Hypothesis Testing | {count} | {rate}% |
| Architecture Questioning | {count} | N/A |

#### Rework Analysis
- Total rework instances: {count}
- Tasks requiring rework: {task_list}
- Most common rework reason: {reason}
- Rework rate: {rate}% of tasks

### Learning Metrics

#### Pattern Usage
| Pattern | Times Applied | Source |
|---------|---------------|--------|
| {pattern_name} | {count} | critical-patterns.md |
| {pattern_name} | {count} | solutions/{category}/ |
| {pattern_name} | {count} | project skill |

#### Skills Invoked
| Skill | Times Used | Effectiveness |
|-------|------------|---------------|
| TDD | {count} | High |
| Context Management | {count} | High |
| Solution Capture | {count} | Medium |
| Planning | {count} | High |

#### Knowledge Base Growth
- Solutions captured: {count}
- Decisions documented: {count}
- Conventions detected: {count}
- Anti-patterns identified: {count}
- Effective prompts recorded: {count}

### Quality Metrics

#### Test Coverage
- **Current:** {current}%
- **Target:** {target}%
- **Delta:** {delta}% {above_target|below_target}
- **Trend:** {increasing|stable|decreasing}

#### Test Results
| Test Suite | Pass | Fail | Skip | Total |
|------------|------|------|------|-------|
| Unit | {count} | {count} | {count} | {total} |
| Integration | {count} | {count} | {count} | {total} |
| E2E | {count} | {count} | {count} | {total} |
| **Total** | **{pass}** | **{fail}** | **{skip}** | **{total}** |

#### Code Quality
- Linting: {clean|issues_count issues}
- Type errors: {count}
- Security warnings: {count}
- Performance issues: {count}

#### Git Activity
- Commits this session: {count}
- Average commit size: {lines_changed} lines
- Files changed: {count} unique files
- Branches used: {count}

### Workflow Phase Metrics

#### Phase Progression
| Phase | Status | Time Spent | Tasks |
|-------|--------|------------|-------|
| 0: Context Loading | ✓ | {time} | - |
| 1: Clarification | ✓ | {time} | - |
| 2: Discovery | ✓ | {time} | - |
| 3: Planning | ✓ | {time} | {tasks} planned |
| 4: Implementation | ~ | {time} | {completed}/{total} |
| 4.5: Verification | ○ | - | - |
| 5: Review | ○ | - | - |
| 6: Learning | ○ | - | - |

### Effectiveness Indicators

#### First-Time Success Analysis
- Tasks completed without rework: {count}/{total} ({rate}%)
- Tasks needing revision: {count}
- Common failure modes: {list}

#### Pattern Reuse Analysis
- Tasks using existing patterns: {count}
- Tasks requiring novel approaches: {count}
- Reuse rate: {rate}%
- Most reused pattern: {pattern_name}

#### Knowledge Capture Analysis
- Problems encountered: {count}
- Solutions captured: {count}
- Capture rate: {rate}%
- Missing captures: {count}

### Recommendations

{Based on metrics, provide 2-3 actionable recommendations}

Example:
1. ⚠️  Context usage high (75%) - consider running /workflow:context-sync
2. 📚 Pattern reuse low (45%) - search .workflow/solutions/ before implementing
3. ✅ Test coverage excellent (87%) - maintain this standard
```

### JSON Format

Machine-readable output:

```json
{
  "session": {
    "start_time": "{ISO_8601}",
    "duration_minutes": {number},
    "track_id": "{track_id}",
    "current_phase": "{phase}",
    "worktree": "{path}"
  },
  "tasks": {
    "completed": {number},
    "failed": {number},
    "skipped": {number},
    "in_progress": {number},
    "pending": {number},
    "total": {number},
    "completion_rate": {percentage},
    "success_rate": {percentage},
    "average_time_minutes": {number}
  },
  "context": {
    "current_usage_percent": {number},
    "peak_usage_percent": {number},
    "syncs": {number},
    "compressions": {number},
    "fresh_spawns": {number},
    "checkpoints": {number},
    "tasks_per_sync": {number}
  },
  "recovery": {
    "recovery_actions": {number},
    "test_failures_fixed": {number},
    "rework_count": {number},
    "git_bisect_runs": {number},
    "hypotheses_tested": {number}
  },
  "learning": {
    "patterns_applied": {number},
    "skills_used": {number},
    "solutions_referenced": {number},
    "decisions_made": {number},
    "new_patterns_detected": {number}
  },
  "quality": {
    "test_pass_rate": {percentage},
    "current_coverage": {percentage},
    "target_coverage": {percentage},
    "commits_made": {number},
    "review_cycles": {number},
    "lint_violations": {number}
  },
  "effectiveness": {
    "first_time_success_rate": {percentage},
    "pattern_reuse_rate": {percentage},
    "knowledge_capture_rate": {percentage},
    "overall_health": "{excellent|good|fair|needs_attention}"
  }
}
```

## Metric Definitions

### Task Metrics
- **Completion Rate**: (completed / total) × 100
- **Success Rate**: (completed / (completed + failed)) × 100
- **Average Task Time**: Total session time / completed tasks (rough estimate)

### Context Metrics
- **Context Usage**: Estimated percentage of context window used
- **Context Efficiency**: Completed tasks / number of syncs
- **Peak Usage**: Highest context percentage reached this session

### Recovery Metrics
- **Recovery Actions**: Total invocations of recovery/debug protocols
- **Rework Rate**: (tasks requiring rework / total tasks) × 100

### Learning Metrics
- **Pattern Reuse Rate**: (tasks using existing patterns / total tasks) × 100
- **Knowledge Capture Rate**: (solutions captured / problems encountered) × 100

### Effectiveness Indicators
- **First-Time Success**: (tasks completed without rework / completed tasks) × 100
- **Overall Health**: Composite score based on all metrics

## Health Score Calculation

**Excellent (90-100%):**
- High completion rate (>90%)
- Low rework (<5%)
- High pattern reuse (>70%)
- Good context management (<50% usage)

**Good (75-89%):**
- Good completion rate (>80%)
- Moderate rework (<10%)
- Good pattern reuse (>50%)
- Acceptable context management (<70% usage)

**Fair (60-74%):**
- Acceptable completion rate (>70%)
- Some rework (<20%)
- Some pattern reuse (>30%)
- Context needs attention (>70% usage)

**Needs Attention (<60%):**
- Low completion rate (<70%)
- High rework (>20%)
- Low pattern reuse (<30%)
- Context critical (>80% usage)

## Error Handling

**Session state not found:**
- Display message: "No session state found. Start a workflow session first."
- Suggest: `/workflow:setup` or `/workflow:plan`

**Incomplete metrics data:**
- Show available metrics
- Note which metrics unavailable
- Suggest data may be incomplete if session just started

**No active session:**
- Display basic git metrics only
- Show recent commits and test status
- Note: "No active workflow session. Run /workflow:plan to start."

## Command Arguments

**No arguments (default summary):**
```bash
/workflow:metrics
```

**Detailed view:**
```bash
/workflow:metrics detailed
```

**JSON output:**
```bash
/workflow:metrics json
```

## Integration Points

**Reads from:**
- `.workflow/state/session_state.json` - Session tracking
- `.workflow/state/progress.md` - Task progress
- `.workflow/state/checkpoints/*.json` - Checkpoint history
- `.workflow/plans/*.md` - Current plan and task status
- Git log and status - Commit and change data
- Test results - Quality metrics

**Does NOT modify any files** - Read-only operation

## Use Cases

**During session:**
- Check progress after multiple tasks
- Verify context health before continuing
- Assess need for pattern capture
- Monitor quality indicators

**After debugging:**
- Verify recovery metrics
- Check rework impact
- Assess debugging effectiveness

**Session review:**
- Evaluate overall effectiveness
- Identify improvement opportunities
- Capture session learnings

**Team reporting:**
- Export JSON for analysis
- Share effectiveness metrics
- Track workflow adoption

## Related Commands

- `/workflow:status` - Current workflow state (simpler, task-focused)
- `/workflow:context-sync` - Manage context based on metrics
- `/workflow:compound` - Capture learnings (uses metrics to assess)

## Best Practices

**Do:**
- Check metrics periodically during long sessions
- Use metrics to identify when context sync needed
- Review effectiveness indicators to improve workflow
- Export JSON for trend analysis across sessions

**Don't:**
- Obsess over perfect metrics
- Let metric review interrupt flow
- Ignore warning signals (high rework, low success rate)
- Compare metrics across very different task types

Metrics are indicators, not goals. Use them to improve workflow effectiveness, not as targets to optimize artificially.
