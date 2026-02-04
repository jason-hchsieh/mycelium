# Lib Utilities Documentation

This directory contains 13 utility modules providing programmatic infrastructure for the adaptive-workflow plugin. These utilities follow the **infrastructure-only principle**: they provide data structures, algorithms, and state management, but not orchestration logic.

## Architecture Principle

**lib/ is for infrastructure, commands/agents are for orchestration**

- ✅ **lib/**: Validation, discovery, scheduling algorithms, state tracking
- ❌ **NOT in lib/**: Learning operations (→ learning-agent), agent spawning (→ Task tool), git operations (→ Bash tool)

## Module Overview

### Core Infrastructure (4 modules)

Located at lib/ root level.

#### 1. schema-validator.js

**Purpose:** Validate YAML frontmatter and JSON against JSON Schema definitions.

**Key Functions:**
- `validateSolutionFrontmatter(yaml)` - Validate solution file frontmatter
- `validatePlanFrontmatter(yaml)` - Validate plan file frontmatter
- `validateSessionState(json)` - Validate session_state.json structure
- `validateWithSchema(data, schemaPath)` - Generic schema validation

**Dependencies:**
- Uses schemas from `../schemas/` directory
- Returns validation errors with line numbers

**Usage:**
```javascript
const validator = require('./lib/schema-validator');
const result = validator.validateSolutionFrontmatter(yamlString);
if (!result.valid) {
  console.error(result.errors);
}
```

#### 2. state-manager.js

**Purpose:** Manage session state persistence and updates.

**Key Functions:**
- `loadSessionState()` - Load `.workflow/state/session_state.json`
- `saveSessionState(state)` - Persist state to disk
- `updateTrack(trackId, updates)` - Update specific track
- `addWorktree(worktreeInfo)` - Register new worktree
- `removeWorktree(path)` - Deregister worktree
- `updateMetrics(metricUpdates)` - Update session metrics

**State Structure:**
```json
{
  "session_id": "uuid",
  "started_at": "ISO-8601",
  "active_tracks": [],
  "active_worktrees": [],
  "discovered_capabilities": {},
  "metrics": {}
}
```

**Usage:**
```javascript
const stateMgr = require('./lib/state-manager');
const state = stateMgr.loadSessionState();
state.active_tracks.push(trackInfo);
stateMgr.saveSessionState(state);
```

#### 3. template-renderer.js

**Purpose:** Render templates with variable substitution.

**Key Functions:**
- `renderTemplate(templatePath, variables)` - Render template file
- `renderString(templateString, variables)` - Render template string
- `getTemplate(name)` - Get template by name from templates/ directory

**Template Variables:**
```javascript
{
  project_name: "My Project",
  track_id: "feature_20240101",
  timestamp: "2024-01-01T12:00:00Z",
  // ... custom variables
}
```

**Usage:**
```javascript
const renderer = require('./lib/template-renderer');
const content = renderer.renderTemplate('plan-template.md', {
  track_id: 'auth_20240101',
  track_type: 'feature'
});
```

#### 4. pattern-detector.js

**Purpose:** Detect recurring patterns in solutions and recommend skill generation.

**Key Functions:**
- `scanSolutions()` - Scan `.workflow/solutions/` for patterns
- `detectRecurrence(tags)` - Find solutions with 3+ occurrences
- `analyzeSimilarity(solutions)` - Cluster similar solutions
- `recommendSkillGeneration(pattern)` - Suggest skill creation

**Pattern Detection:**
- Groups solutions by tags
- Identifies 3+ similar solutions
- Promotes to `critical-patterns.md`
- Recommends skill generation

**Usage:**
```javascript
const detector = require('./lib/pattern-detector');
const patterns = detector.scanSolutions();
patterns.forEach(pattern => {
  if (pattern.count >= 3) {
    detector.recommendSkillGeneration(pattern);
  }
});
```

---

### Discovery (5 modules)

Located in `lib/discovery/` subdirectory.

#### 5. capability-scanner.js

**Purpose:** Orchestrate capability discovery across all scopes.

**Key Functions:**
- `discoverAll()` - Scan all scopes (local, project, user, global)
- `getCapabilitySummary()` - Get cached capabilities
- `refreshCache()` - Force re-scan all capabilities

**Scopes:**
- **Local**: `.claude/` in current project
- **Project**: Project-level plugins
- **User**: `~/.claude/plugins/`
- **Global**: System-wide plugins

**Usage:**
```javascript
const scanner = require('./lib/discovery/capability-scanner');
const capabilities = await scanner.discoverAll();
// { agents: [...], skills: [...], mcps: [...] }
```

#### 6. agent-discovery.js

**Purpose:** Discover available agents from all plugin scopes.

**Key Functions:**
- `discoverAgents(scope)` - Scan scope for agent files
- `parseAgentFrontmatter(filePath)` - Extract agent metadata
- `matchAgentToTask(taskDescription)` - Find best-fit agent
- `validateAgentFile(filePath)` - Check agent file validity

**Discovery:**
- Scans `agents/*.md` files
- Parses frontmatter (name, description, model, color, tools)
- Returns agent registry with capabilities

**Usage:**
```javascript
const agentDisc = require('./lib/discovery/agent-discovery');
const agents = await agentDisc.discoverAgents('user');
const bestAgent = agentDisc.matchAgentToTask('Review security');
```

#### 7. skill-discovery.js

**Purpose:** Discover available skills from all plugin scopes.

**Key Functions:**
- `discoverSkills(scope)` - Scan scope for skill directories
- `parseSkillMetadata(skillPath)` - Extract skill metadata from SKILL.md
- `matchSkillToTask(taskDescription)` - Find relevant skills
- `validateSkillStructure(skillPath)` - Check skill directory structure

**Discovery:**
- Scans `skills/*/SKILL.md` files
- Parses frontmatter (name, description, version)
- Returns skill registry with trigger conditions

**Usage:**
```javascript
const skillDisc = require('./lib/discovery/skill-discovery');
const skills = await skillDisc.discoverSkills('project');
const relevantSkills = skillDisc.matchSkillToTask('Implement TDD');
```

#### 8. mcp-discovery.js

**Purpose:** Discover available MCP servers from all plugin scopes.

**Key Functions:**
- `discoverMcpServers(scope)` - Scan scope for .mcp.json files
- `parseMcpConfig(filePath)` - Extract MCP server definitions
- `checkMcpAvailability(serverName)` - Verify server is running
- `getMcpTools(serverName)` - Get tools provided by MCP server

**Discovery:**
- Scans for `.mcp.json` files
- Parses plugin.json `mcpServers` field
- Returns MCP server registry with tools

**Usage:**
```javascript
const mcpDisc = require('./lib/discovery/mcp-discovery');
const mcps = await mcpDisc.discoverMcpServers('global');
const githubTools = mcpDisc.getMcpTools('github');
```

#### 9. cache-manager.js

**Purpose:** Cache discovered capabilities to avoid repeated scans.

**Key Functions:**
- `cacheCapabilities(capabilities)` - Store in session_state.json
- `getCachedCapabilities()` - Retrieve cached data
- `invalidateCache()` - Clear cache for re-scan
- `isCacheValid()` - Check if cache is fresh

**Caching Strategy:**
- Cache stored in `.workflow/state/session_state.json`
- Invalidated on plugin changes
- TTL: Session lifetime
- Reduces SessionStart hook execution time

**Usage:**
```javascript
const cache = require('./lib/discovery/cache-manager');
if (!cache.isCacheValid()) {
  const caps = await discoverAll();
  cache.cacheCapabilities(caps);
}
```

---

### Scheduler (4 modules)

Located in `lib/scheduler/` subdirectory.

#### 10. task-scheduler.js

**Purpose:** Schedule task execution based on dependency graph.

**Key Functions:**
- `buildExecutionPlan(tasks)` - Create execution order from dependencies
- `findParallelBatch()` - Identify tasks that can run in parallel
- `checkDependencies(taskId)` - Verify all blockers are complete
- `executeWithDependencies(tasks)` - Run tasks respecting dependencies

**Scheduling Algorithm:**
- Topological sort of dependency DAG
- Identifies parallel execution opportunities
- Respects `blockedBy` and `blocks` relationships
- Returns batches of parallelizable tasks

**Usage:**
```javascript
const scheduler = require('./lib/scheduler/task-scheduler');
const plan = scheduler.buildExecutionPlan(tasks);
plan.batches.forEach(batch => {
  // Execute tasks in batch in parallel
  batch.forEach(task => spawnAgent(task));
});
```

#### 11. dependency-graph.js

**Purpose:** Build and analyze task dependency graphs.

**Key Functions:**
- `buildGraph(tasks)` - Create dependency DAG from tasks
- `detectCycles()` - Find circular dependencies
- `topologicalSort()` - Order tasks respecting dependencies
- `getCriticalPath()` - Find longest dependency chain
- `validateDependencies(tasks)` - Check for invalid references

**Graph Structure:**
```javascript
{
  nodes: [{ id: '1.1', blockedBy: [], blocks: ['1.2'] }],
  edges: [{ from: '1.1', to: '1.2' }]
}
```

**Usage:**
```javascript
const depGraph = require('./lib/scheduler/dependency-graph');
const graph = depGraph.buildGraph(tasks);
if (depGraph.detectCycles(graph)) {
  throw new Error('Circular dependency detected');
}
const sorted = depGraph.topologicalSort(graph);
```

#### 12. worktree-tracker.js

**Purpose:** Track state of active git worktrees (state tracking only, not operations).

**Key Functions:**
- `getActiveWorktrees()` - List all active worktrees
- `isWorktreeActive(path)` - Check if worktree exists
- `getWorktreeStatus(path)` - Get worktree branch and status
- `getWorktreeForTrack(trackId)` - Find worktree for track

**NOTE:** This module only tracks state. Worktree operations (create, remove, setup) are handled by:
- `/workflow:worktree-create` command (uses Bash tool)
- `/workflow:worktree-cleanup` command (uses Bash tool)
- `/workflow:worktree-merge` command (uses Bash tool)

**Usage:**
```javascript
const tracker = require('./lib/scheduler/worktree-tracker');
const worktrees = tracker.getActiveWorktrees();
if (tracker.isWorktreeActive('.worktrees/feature-auth')) {
  const status = tracker.getWorktreeStatus('.worktrees/feature-auth');
}
```

#### 13. merge-analyzer.js

**Purpose:** Analyze merge conflicts and recommend resolution strategies (analysis only, not execution).

**Key Functions:**
- `detectConflicts(branch1, branch2)` - Identify potential conflicts
- `analyzeConflictComplexity(conflicts)` - Assess difficulty
- `suggestMergeStrategy(analysis)` - Recommend approach
- `estimateMergeRisk(branch1, branch2)` - Risk assessment

**Conflict Analysis:**
```javascript
{
  conflicts: [
    { file: 'src/auth.js', type: 'content', lines: [12, 45] }
  ],
  complexity: 'medium',
  strategy: 'manual-review'
}
```

**NOTE:** This module only analyzes conflicts. Merge operations are handled by:
- `/workflow:worktree-merge` command (uses Bash tool)
- Claude Code's conflict resolution (manual or assisted)

**Usage:**
```javascript
const analyzer = require('./lib/scheduler/merge-analyzer');
const conflicts = analyzer.detectConflicts('feature/auth', 'main');
const analysis = analyzer.analyzeConflictComplexity(conflicts);
const strategy = analyzer.suggestMergeStrategy(analysis);
```

---

## Refactoring History

**Previous state:** 23 utilities
**Current state:** 13 utilities
**Removed:** 10 utilities (~1,800 LOC)

**What was removed and why:**

1. **lib/learning/ (9 utilities)** - Removed because learning should be AI-powered
   - pattern-analyzer.js → learning-agent analyzes patterns
   - skill-generator.js → /workflow:create-skill command
   - project-plugin-manager.js → /workflow:create-skill command
   - skill-validator.js → skill-reviewer agent
   - decision-capture.js → learning-agent
   - convention-detector.js → learning-agent
   - preference-learner.js → learning-agent
   - anti-pattern-tracker.js → learning-agent
   - prompt-evaluator.js → learning-agent

2. **lib/agents/agent-spawner.js** - Removed because Claude Code has native Task tool
   - Agent spawning now uses Task tool directly
   - Commands call Task tool instead of agent-spawner.js

**What was renamed:**

1. **worktree-pool.js → worktree-tracker.js** - Clarifies state tracking (not operations)
2. **merge-coordinator.js → merge-analyzer.js** - Clarifies analysis only (not execution)

**Refactoring principles:**
- lib/ provides infrastructure (data structures, algorithms)
- Commands/agents handle orchestration (using Claude Code tools)
- Learning is AI-powered (learning-agent)
- Operations use native tools (Task, Bash)

See `../LIB-REFACTOR-PLAN.md` for complete refactoring documentation.

---

## Development Guidelines

### When to Add a New Utility

✅ **Add to lib/ if:**
- Provides data structure or algorithm
- Pure function with no side effects
- Reusable across multiple commands
- Performance-critical operation
- Complex validation logic

❌ **Don't add to lib/ if:**
- Orchestrates workflow (→ use command)
- Requires AI reasoning (→ use agent)
- Executes git operations (→ use Bash tool)
- Spawns agents (→ use Task tool)
- Learns from user (→ use learning-agent)

### Testing Utilities

Each utility should have:
- Unit tests in `test/lib/`
- Clear API documentation
- Error handling
- Input validation

### Utility Dependencies

Prefer:
- Node.js built-ins (fs, path)
- Minimal external dependencies
- Pure functions where possible
- Synchronous for simple operations

Avoid:
- Heavy dependencies (moment.js → use Date)
- Utilities calling other utilities (prefer flat)
- Global state
- Tight coupling to commands/agents

---

## Quick Reference

| Module | Purpose | Key Function |
|--------|---------|--------------|
| **schema-validator** | Validate YAML/JSON | `validateWithSchema()` |
| **state-manager** | Session state CRUD | `loadSessionState()` |
| **template-renderer** | Template rendering | `renderTemplate()` |
| **pattern-detector** | Pattern detection | `scanSolutions()` |
| **capability-scanner** | Orchestrate discovery | `discoverAll()` |
| **agent-discovery** | Find agents | `discoverAgents()` |
| **skill-discovery** | Find skills | `discoverSkills()` |
| **mcp-discovery** | Find MCP servers | `discoverMcpServers()` |
| **cache-manager** | Cache capabilities | `cacheCapabilities()` |
| **task-scheduler** | Schedule tasks | `buildExecutionPlan()` |
| **dependency-graph** | Analyze dependencies | `buildGraph()` |
| **worktree-tracker** | Track worktrees | `getActiveWorktrees()` |
| **merge-analyzer** | Analyze conflicts | `detectConflicts()` |

---

## See Also

- **Commands**: `/home/jasonhch/dev/workspace-claude-code/adaptive-workflow/commands/` - Orchestration logic
- **Agents**: `/home/jasonhch/dev/workspace-claude-code/adaptive-workflow/agents/` - AI-powered reasoning
- **Schemas**: `/home/jasonhch/dev/workspace-claude-code/adaptive-workflow/schemas/` - Validation schemas
- **Templates**: `/home/jasonhch/dev/workspace-claude-code/adaptive-workflow/templates/` - File templates
- **Refactoring Plan**: `/home/jasonhch/dev/workspace-claude-code/adaptive-workflow/LIB-REFACTOR-PLAN.md` - Why we refactored

---

**Version:** 0.1.0
**Last Updated:** 2024-01-01
**Maintained By:** adaptive-workflow plugin
