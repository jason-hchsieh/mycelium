# Adaptive Workflow JSON Schemas

This directory contains JSON Schema definitions (Draft 7) for all structured data used by the adaptive-workflow plugin.

## Schema Files

### enums.json
Central definition of all enumeration types used across schemas. Reference this schema from other schemas using `$ref`.

**Defined Enums:**
- `TaskSize` - trivial, small, medium, large
- `TrackType` - feature, bug, chore, refactor
- `TaskStatus` - pending, in_progress, completed, skipped, blocked
- `ProblemType` - performance_issue, database_issue, security_issue, etc.
- `ComponentType` - frontend, backend, database, api, etc.
- `RootCause` - missing_validation, missing_error_handling, etc.
- `Severity` - critical, high, medium, low
- `TddStrictness` - strict, flexible, none
- `CommitStyle` - conventional, descriptive, atomic
- `SessionStatus` - not_started, in_progress, paused, completed, failed
- `SetupSection` - product, tech_stack, workflow, style_guides
- `RemoteProvider` - github, gitlab, gitea, bitbucket, azure, none
- `RemoteToolType` - mcp, cli, api
- `ModelTier` - opus, sonnet, haiku
- `ConfidenceLevel` - high, medium, low, needs_verification
- `BlockerType` - technical, clarification, external_dependency, resource, approval
- `RecoveryAction` - retry, escalate, pivot, rollback, abandon
- `ProjectMaturity` - prototype, development, production, regulated
- `VerificationMethod` - unit_test, integration_test, e2e_test, etc.

### session-state.schema.json
Schema for `.mycelium/state.json` - tracks current workflow session state.

**Key Properties:**
- `status` - Current session status
- `current_phase` - Which workflow phase (-1 to 6)
- `current_track` - Active track information
- `current_task` - Active task information
- `tasks_summary` - Task counts by status
- `checkpoints` - Git checkpoints for rollback
- `deviations` - Logged deviations from plan
- `worktrees` - Active git worktrees for parallel execution
- `parallel_execution` - Task scheduling state
- `git` - Git repository state (branches, stashes, tags, notes)
- `metrics` - Session effectiveness metrics
- `context_state` - Context window usage tracking
- `discovered_capabilities` - Cached plugin/skill/agent discovery results

**Required Fields:** `status`, `started_at`, `last_updated`

### setup-state.schema.json
Schema for `.mycelium/setup_state.json` - tracks bootstrap process (Phase -1).

**Key Properties:**
- `status` - Setup progress status
- `project_type` - greenfield or brownfield
- `current_section` - Which setup section is active
- `current_question` - Question number in section
- `completed_sections` - Finished sections
- `answers` - Collected user responses
- `files_created` - Paths of created files
- `detected_from_existing` - Auto-detected values (brownfield only)

**Required Fields:** `status`, `project_type`, `started_at`, `last_updated`

### solution-frontmatter.schema.json
Schema for YAML frontmatter in `.mycelium/solutions/**/*.md` files.

**Required Fields:**
- `date` - ISO date (YYYY-MM-DD)
- `problem_type` - ProblemType enum
- `component` - ComponentType enum
- `root_cause` - RootCause enum
- `severity` - Severity enum
- `symptoms` - Array of observable symptoms
- `tags` - Array of searchable keywords

**Optional Fields:**
- `module` - Affected module/class name
- `related_files` - Involved file paths
- `related_issues` - Links to other solutions
- `promoted_to_pattern` - Boolean, if promoted to critical-patterns.md

**Validation:** BLOCKING - Invalid YAML prevents solution capture

### plan-frontmatter.schema.json
Schema for YAML frontmatter in `.mycelium/plans/*.md` files.

**Required Fields:**
- `track_id` - Format: `{shortname}_{YYYYMMDD}`
- `track_type` - TrackType enum
- `size` - TaskSize enum
- `created` - ISO 8601 timestamp
- `status` - SessionStatus enum
- `total_tasks` - Integer count
- `completed_tasks` - Integer count

**Optional Fields:**
- `model_tier` - Default model for track tasks
- `parallel_enabled` - Whether parallel execution enabled

### progress-state.schema.json
Schema for progress checkpoint structure used in `.mycelium/progress.md`.

**Required Fields:**
- `track_id` - Current track
- `current_phase` - Phase number (0-6)
- `timestamp` - Checkpoint timestamp

**Key Properties:**
- `current_task` - Active task ID
- `current_work` - Brief work description
- `completed_tasks` - Array with task_id, summary, sha
- `key_decisions` - Array with decision, rationale, alternatives
- `next_tasks` - Array with task_id, description, blocked_by
- `known_issues` - Array with description, severity, blocker flag
- `context_notes` - Additional handoff context

### metrics.schema.json
Schema for workflow effectiveness metrics tracking.

**Key Properties:**
- `session_id` - Unique session identifier
- `track_id` - Associated track
- `started_at`, `ended_at`, `duration_seconds` - Timing
- `tasks` - Task counts (total, completed, failed, etc.)
- `context_management` - Context resets, checkpoints, handoffs
- `human_interaction` - Interventions, clarifications, approvals
- `quality` - Rework count, test failures, review stats
- `knowledge_reuse` - Pattern matches, new solutions, promotions
- `parallel_execution` - Parallelization stats, worktrees, conflicts
- `recovery_actions` - Array of recovery attempts
- `git_operations` - Git operation counts

## Validation Rules

### Enum Validation (BLOCKING)
All enum fields MUST match defined values exactly. Invalid enum values prevent proceeding.

### Required Fields (BLOCKING)
Missing required fields prevent schema validation from passing.

### Format Validation

**Date Formats:**
- Date: `YYYY-MM-DD` (ISO 8601)
- DateTime: `YYYY-MM-DDTHH:MM:SSZ` (ISO 8601)

**ID Formats:**
- Track ID: `^[a-z0-9-]+_\d{8}$` (e.g., `user-auth_20260203`)
- Task ID: `^\d+\.\d+$` (e.g., `2.3`)
- SHA: `^[a-f0-9]{7,40}$` (Git short or full SHA)

### File Naming Conventions

**Plans:**
- Format: `YYYY-MM-DD-{type}-{name}-plan.md`
- Example: `2026-02-03-feature-user-auth-plan.md`

**Solutions:**
- Format: `{descriptive-name}-{Component}-{YYYYMMDD}.md`
- Example: `n-plus-one-database-20260203.md`

## Schema References

Schemas reference each other using JSON Schema `$ref` syntax:

```json
{
  "$ref": "enums.json#/definitions/TaskSize"
}
```

This allows:
- Centralized enum definitions
- Consistency across schemas
- Single source of truth for types

## Usage

Schemas are used to:
1. Validate JSON state files (state.json, setup_state.json)
2. Validate YAML frontmatter in markdown files
3. Provide IDE autocomplete and validation
4. Document expected data structures
5. Enable strict type checking

## Schema Validation Tools

Validate files against schemas using:

```bash
# Using ajv-cli
npm install -g ajv-cli
ajv validate -s session-state.schema.json -d state.json

# Using Python jsonschema
pip install jsonschema
python -c "import jsonschema, json; jsonschema.validate(json.load(open('state.json')), json.load(open('session-state.schema.json')))"
```

## IDE Integration

Configure your IDE to use these schemas for validation:

**VS Code** - Add to `.vscode/settings.json`:
```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/state.json"],
      "url": "./schemas/session-state.schema.json"
    },
    {
      "fileMatch": ["**/setup_state.json"],
      "url": "./schemas/setup-state.schema.json"
    }
  ]
}
```

## Related

See `../templates/` for document templates that use these schemas.
