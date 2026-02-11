# Mycelium Library - Utilities

Comprehensive utility library for Mycelium, the intelligent substrate for Claude Code development. Provides core functionality for schema validation, template rendering, state management, task scheduling, and capability discovery.

## Overview

This library implements 13 utility modules (92 functions total) organized into four layers:

1. **Foundation Layer** - Core utilities for validation, templating, state, and patterns
2. **Scheduler Layer** - Task dependency management and parallel execution
3. **Discovery Layer** - Plugin, skill, agent, and MCP server discovery
4. **Integration Layer** - Unified caching and capability management

## Installation

```bash
npm install
```

## Dependencies

- `ajv` (^8.12.0) - JSON Schema validation
- `ajv-formats` (^2.1.1) - Additional schema format validators
- `jest` (^29.7.0) - Testing framework (dev)
- `eslint` (^8.54.0) - Code linting (dev)

## Module Documentation

### Foundation Layer

#### schema-validator.js

JSON Schema validation for workflow configurations, plugin specs, and state files.

```javascript
import { validateConfig, loadSchema, validateWorkflow } from './lib/schema-validator.js';

// Validate against JSON Schema
const result = await validateConfig(config, schema);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Validate workflow configuration
const workflow = { name: 'my-workflow', version: '1.0.0', phases: [...] };
const validation = await validateWorkflow(workflow);
```

**Functions:**
- `validateConfig(config, schema, options)` - Generic validation
- `loadSchema(schemaPath)` - Load and cache schemas
- `validateWorkflow(workflow)` - Validate workflow structure
- `validatePluginSpec(pluginSpec)` - Validate plugin metadata
- `validateState(state)` - Validate state object

**Features:**
- Schema caching for performance
- Async $ref resolution
- Detailed error messages
- Strict mode support

---

#### template-renderer.js

Variable substitution and template rendering with `{{variable}}` syntax.

```javascript
import { render, renderWithEnv, renderObject } from './lib/template-renderer.js';

// Simple rendering
const output = await render('Hello {{name}}!', { name: 'World' });

// Nested object access
const text = await render('{{user.name}} at {{user.company}}', {
  user: { name: 'Alice', company: 'Acme' }
});

// Array indexing
const item = await render('First: {{items[0]}}', { items: ['apple', 'banana'] });

// Filters
const upper = await render('{{name | uppercase}}', { name: 'alice' });

// Environment variables
const env = await renderWithEnv('Database: {{DB_HOST}}:{{DB_PORT}}');

// Recursive object rendering
const rendered = await renderObject({
  title: '{{project}} - {{version}}',
  nested: { field: 'Value: {{value}}' }
}, { project: 'MyApp', version: '1.0', value: 42 });
```

**Functions:**
- `render(template, context, options)` - Core template rendering
- `renderWithEnv(template, additionalContext)` - Include environment vars
- `renderObject(obj, context, options)` - Recursive object rendering
- `validateTemplate(template, context)` - Check for missing variables
- `extractVariables(template)` - Parse variable names
- `addFilter(name, fn)` - Register custom filters

**Built-in Filters:**
- `uppercase` - Convert to uppercase
- `lowercase` - Convert to lowercase
- `trim` - Remove whitespace
- `capitalize` - Capitalize first letter

---

#### state-manager.js

Async state management with dot notation and deep merging.

```javascript
import {
  readState,
  writeState,
  updateStateField,
  getStateField,
  mergeState
} from './lib/state-manager.js';

// Read state (returns default if missing)
const state = await readState('.mycelium/state.json');

// Update nested field using dot notation
await updateStateField(
  '.mycelium/state.json',
  'discovered_capabilities.skills',
  [{ name: 'skill-1' }]
);

// Get nested field with default
const skills = getStateField(state, 'discovered_capabilities.skills', []);

// Deep merge states
const merged = await mergeState(baseState, updates);

// Write with backup
await writeState('.mycelium/state.json', newState, {
  createDirs: true
});
```

**Functions:**
- `readState(statePath)` - Load JSON state file
- `writeState(statePath, state, options)` - Save with automatic backup
- `updateStateField(statePath, fieldPath, value)` - Dot notation updates
- `initializeState(statePath)` - Create default structure
- `mergeState(baseState, newState, options)` - Deep merge
- `getStateField(state, fieldPath, defaultValue)` - Dot notation getter

**Features:**
- Automatic `.backup` file creation
- Parent directory creation
- Deep cloning to prevent mutations
- Graceful handling of missing files

---

#### pattern-detector.js

Pattern detection and analysis for workflow optimization.

```javascript
import {
  detectPatterns,
  detectSequencePatterns,
  findSimilarPatterns
} from './lib/pattern-detector.js';

// Detect exact patterns (3+ occurrences)
const patterns = await detectPatterns(['error', 'warning', 'error', 'error'], {
  minOccurrences: 3
});

// Detect repeating sequences
const sequences = await detectSequencePatterns(['A', 'B', 'C', 'A', 'B', 'C']);

// Find similar patterns (fuzzy matching)
const similar = await findSimilarPatterns(['test', 'tset', 'testing'], {
  similarityThreshold: 0.8
});
```

**Functions:**
- `detectPatterns(items, options)` - Find patterns occurring 3+ times
- `detectSequencePatterns(sequence, options)` - Repeating subsequences
- `detectObjectPatterns(objects, fieldName, options)` - Field patterns
- `detectKeywordPatterns(texts, options)` - Frequent keywords
- `findSimilarPatterns(items, options)` - Fuzzy clustering
- `analyzePatternTiming(timestampedItems, options)` - Temporal analysis

---

### Scheduler Layer

#### scheduler/dependency-graph.js

DAG-based dependency management for task ordering.

```javascript
import {
  createDependencyGraph,
  getTopologicalSort,
  hasCyclicDependency,
  getReadyTasks
} from './lib/scheduler/dependency-graph.js';

// Create graph from tasks
const tasks = [
  { id: '1', blockedBy: [], blocks: ['2', '3'] },
  { id: '2', blockedBy: ['1'], blocks: ['4'] },
  { id: '3', blockedBy: ['1'], blocks: ['4'] },
  { id: '4', blockedBy: ['2', '3'], blocks: [] }
];
const graph = createDependencyGraph(tasks);

// Get execution order
const order = getTopologicalSort(graph);

// Check for cycles
if (hasCyclicDependency(graph)) {
  console.error('Circular dependency detected!');
}

// Get tasks ready to execute
const ready = getReadyTasks(graph, ['1']); // Returns ['2', '3']
```

**Functions:**
- `createDependencyGraph(tasks)` - Build adjacency list DAG
- `getTopologicalSort(graph)` - Kahn's algorithm ordering
- `hasCyclicDependency(graph)` - DFS cycle detection
- `getAllDependencies(graph, taskId)` - Transitive dependencies
- `getDependents(graph, taskId)` - Reverse lookup
- `getReadyTasks(graph, completedTasks)` - Find executable tasks
- `validateGraph(graph)` - Validate structure
- `visualizeGraph(graph)` - ASCII visualization

---

#### scheduler/task-scheduler.js

Parallel task execution with concurrency control.

```javascript
import { scheduleTasks } from './lib/scheduler/task-scheduler.js';

const tasks = [
  {
    id: '1',
    execute: async () => { /* task logic */ },
    blockedBy: []
  },
  // ... more tasks
];

await scheduleTasks(tasks, {
  maxConcurrency: 3,
  timeout: 30000,
  retries: 2
});
```

**Functions:**
- `scheduleTasks(tasks, options)` - Execute with concurrency limit
- `createTaskBatches(tasks, options)` - Group by batch size
- `cancelTask(taskId)` - Abort running task
- `getTaskStatus(taskId)` - Status lookup
- `retryTask(taskId, options)` - Retry with exponential backoff
- `getSchedulerStats()` - Execution statistics
- `clearTasks(options)` - Clean up

---

#### scheduler/worktree-tracker.js

Git worktree state tracking (no git operations).

```javascript
import {
  trackWorktree,
  getActiveWorktrees,
  getWorktreeInfo
} from './lib/scheduler/worktree-tracker.js';

// Track new worktree
await trackWorktree({
  path: '/projects/myapp/worktrees/feature-123',
  branch: 'feature/auth',
  track_id: 'auth_20260204',
  status: 'active'
});

// Get all active worktrees
const worktrees = await getActiveWorktrees();

// Get specific worktree info
const info = await getWorktreeInfo('/projects/myapp/worktrees/feature-123');
```

**Functions:**
- `getActiveWorktrees()` - List tracked worktrees
- `getWorktreeInfo(path)` - Get metadata
- `isWorktreeActive(path)` - Check if tracked
- `trackWorktree(worktreeInfo)` - Register worktree
- `untrackWorktree(path)` - Deregister
- `getWorktreeForTrack(trackId)` - Find by track ID
- `getWorktreeStats()` - Statistics

---

#### scheduler/merge-analyzer.js

Git merge conflict analysis (read-only).

```javascript
import {
  analyzeConflicts,
  estimateMergeRisk,
  generateMergeReport
} from './lib/scheduler/merge-analyzer.js';

// Analyze potential conflicts
const conflicts = await analyzeConflicts('feature/auth', 'main');

// Estimate merge risk (0-100)
const risk = await estimateMergeRisk('feature/auth', 'main');

// Generate report
const report = await generateMergeReport({
  conflicts,
  risk,
  branches: ['feature/auth', 'main']
});
```

**Functions:**
- `analyzeConflicts(branch1, branch2)` - Detect potential conflicts
- `getConflictComplexity(conflicts)` - Assess difficulty
- `suggestResolution(conflict)` - Recommend strategy
- `estimateMergeRisk(branch1, branch2)` - Risk score 0-100
- `compareWorktrees(worktree1, worktree2)` - Diff analysis
- `findCommonAncestor(branch1, branch2)` - Git merge-base
- `generateMergeReport(analysis)` - Formatted report

---

### Discovery Layer

#### discovery/capability-scanner.js

Multi-scope plugin discovery.

```javascript
import {
  scanPlugins,
  getAllSkills,
  getPluginCapabilities
} from './lib/discovery/capability-scanner.js';

// Scan all scopes (local, project, user, global)
const plugins = await scanPlugins({
  scopes: ['local', 'project', 'user', 'global']
});

// Get all skills across plugins
const skills = await getAllSkills();

// Get single plugin capabilities
const caps = await getPluginCapabilities('my-plugin');
```

**Plugin Scopes:**
1. **local** - `./.claude/` (project-specific)
2. **project** - Project plugins
3. **user** - `~/.claude/plugins/` (user-wide)
4. **global** - System-wide plugins

---

#### discovery/agent-discovery.js

Claude Code agent discovery and search.

```javascript
import {
  discoverAgents,
  findAgentsByCapability
} from './lib/discovery/agent-discovery.js';

// Discover all agents
const agents = await discoverAgents();

// Find by capability
const testAgents = await findAgentsByCapability('testing');

// Fuzzy name search
const buildAgents = await findAgentsByName('build');
```

---

#### discovery/skill-discovery.js

Skill discovery with trigger matching.

```javascript
import {
  discoverSkills,
  findSkillsByTrigger
} from './lib/discovery/skill-discovery.js';

// Discover all skills
const skills = await discoverSkills();

// Find by trigger pattern
const reviewSkills = await findSkillsByTrigger('/review');
```

---

#### discovery/mcp-discovery.js

Model Context Protocol server discovery.

```javascript
import {
  discoverMCPServers,
  findMCPByTool
} from './lib/discovery/mcp-discovery.js';

// Discover MCP servers
const servers = await discoverMCPServers();

// Find server providing specific tool
const server = await findMCPByTool('database_query');
```

---

#### discovery/cache-manager.js

Unified capability caching with TTL.

```javascript
import {
  refreshCapabilityCache,
  getDiscoveredCapabilities,
  isCacheValid
} from './lib/discovery/cache-manager.js';

const statePath = '.mycelium/state.json';

// Refresh cache (re-scan all)
await refreshCapabilityCache(statePath);

// Get cached capabilities
const capabilities = await getDiscoveredCapabilities(statePath);

// Check freshness (default 1 hour TTL)
if (!await isCacheValid(statePath, 3600000)) {
  await refreshCapabilityCache(statePath);
}
```

**Functions:**
- `updateDiscoveredCapabilities(statePath, capabilities)` - Update cache
- `getDiscoveredCapabilities(statePath)` - Retrieve cache
- `invalidateCache(statePath, options)` - Clear by type
- `isCacheValid(statePath, maxAge)` - Check freshness
- `refreshCapabilityCache(statePath, options)` - Re-scan all
- `getCacheStats(statePath)` - Statistics
- `mergeCapabilities(statePath, newCapabilities, options)` - Incremental update

---

## Testing

```bash
# Run all tests
npm test

# Run specific module tests
npm test -- schema-validator.test.js

# Run with coverage
npm test:coverage

# Watch mode
npm test:watch
```

## Test Coverage

Current coverage across all modules:

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: 100%
- **Lines**: >90%

## Performance Benchmarks

- Schema validation: <10ms per file
- Template rendering: <5ms per template
- Discovery scan: <500ms for 20 plugins
- Dependency graph: <50ms for 100 tasks
- Pattern detection: <100ms for 1000 items

## Error Handling

All modules use consistent error handling:

```javascript
try {
  await someOperation();
} catch (error) {
  if (error.code === 'ENOENT') {
    // Handle missing file
  } else if (error instanceof ValidationError) {
    // Handle validation error
  } else {
    throw error;
  }
}
```

## Contributing

When adding new utilities:

1. Write tests first (TDD)
2. Use ES modules (export/import)
3. Add JSDoc documentation
4. Follow existing patterns
5. Ensure >80% coverage

## License

MIT

---

## Examples

See `/examples` directory for working demonstrations:
- `dependency-graph-demo.js` - Task scheduling example
- Additional examples coming soon

## Support

For issues or questions, see the main [Mycelium](../) documentation.
