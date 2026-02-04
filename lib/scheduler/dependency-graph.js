/**
 * Dependency Graph Utility
 *
 * Builds and manages directed acyclic graphs (DAGs) for task dependencies.
 * Enables topological sorting and dependency validation.
 *
 * @module lib/scheduler/dependency-graph
 */

/**
 * Create a dependency graph from task definitions
 *
 * @param {Array<{id: string, blockedBy: string[], blocks: string[]}>} tasks - Tasks with dependency lists
 * @returns {Object} Graph object with nodes Map
 *
 * @example
 * const graph = createDependencyGraph([
 *   { id: 'task1', blockedBy: [], blocks: ['task2'] },
 *   { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
 *   { id: 'task3', blockedBy: ['task2'], blocks: [] }
 * ]);
 */
export function createDependencyGraph(tasks) {
  const nodes = new Map();

  // Initialize all nodes
  for (const task of tasks) {
    nodes.set(task.id, {
      task,
      dependencies: [],
      dependents: []
    });
  }

  // Build relationships from blockedBy and blocks
  for (const task of tasks) {
    const node = nodes.get(task.id);

    // Process blockedBy (tasks this task depends on)
    if (task.blockedBy && Array.isArray(task.blockedBy)) {
      for (const depId of task.blockedBy) {
        if (!node.dependencies.includes(depId)) {
          node.dependencies.push(depId);
        }
        // Add reverse relationship
        if (nodes.has(depId)) {
          const depNode = nodes.get(depId);
          if (!depNode.dependents.includes(task.id)) {
            depNode.dependents.push(task.id);
          }
        }
      }
    }

    // Process blocks (tasks that depend on this task)
    if (task.blocks && Array.isArray(task.blocks)) {
      for (const dependentId of task.blocks) {
        if (!node.dependents.includes(dependentId)) {
          node.dependents.push(dependentId);
        }
        // Add reverse relationship
        if (nodes.has(dependentId)) {
          const dependentNode = nodes.get(dependentId);
          if (!dependentNode.dependencies.includes(task.id)) {
            dependentNode.dependencies.push(task.id);
          }
        }
      }
    }
  }

  return { nodes };
}

/**
 * Get topological sort of tasks using Kahn's algorithm
 *
 * @param {Object} graph - Dependency graph
 * @returns {Array<string>} Task IDs in topological order
 *
 * @example
 * const order = getTopologicalSort(graph);
 * // Returns: ['task1', 'task2', 'task3']
 */
export function getTopologicalSort(graph) {
  const { nodes } = graph;
  const inDegree = new Map();
  const result = [];
  const queue = [];

  // Calculate in-degree for each node
  for (const [taskId, node] of nodes) {
    inDegree.set(taskId, node.dependencies.length);
  }

  // Find all nodes with in-degree 0
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  // Process queue
  while (queue.length > 0) {
    const taskId = queue.shift();
    result.push(taskId);

    const node = nodes.get(taskId);
    for (const dependentId of node.dependents) {
      const newDegree = inDegree.get(dependentId) - 1;
      inDegree.set(dependentId, newDegree);

      if (newDegree === 0) {
        queue.push(dependentId);
      }
    }
  }

  // If result doesn't contain all nodes, there's a cycle
  if (result.length !== nodes.size) {
    throw new Error('Graph contains a cycle - cannot perform topological sort');
  }

  return result;
}

/**
 * Check if graph has cycles using DFS with color marking
 *
 * @param {Object} graph - Dependency graph
 * @returns {{hasCycle: boolean, cycle: Array<string>|null}} Cycle detection result
 *
 * @example
 * const check = hasCyclicDependency(graph);
 * if (check.hasCycle) {
 *   console.log('Circular dependency:', check.cycle);
 * }
 */
export function hasCyclicDependency(graph) {
  const { nodes } = graph;
  const WHITE = 0; // unvisited
  const GRAY = 1;  // visiting
  const BLACK = 2; // visited

  const colors = new Map();
  const parent = new Map();
  let cycle = null;

  // Initialize all nodes as white
  for (const taskId of nodes.keys()) {
    colors.set(taskId, WHITE);
  }

  function dfs(taskId, stack = []) {
    colors.set(taskId, GRAY);
    stack.push(taskId);

    const node = nodes.get(taskId);
    for (const dependentId of node.dependents) {
      if (colors.get(dependentId) === GRAY) {
        // Found a cycle
        const cycleStart = stack.indexOf(dependentId);
        cycle = stack.slice(cycleStart).concat([dependentId]);
        return true;
      }

      if (colors.get(dependentId) === WHITE) {
        parent.set(dependentId, taskId);
        if (dfs(dependentId, stack)) {
          return true;
        }
      }
    }

    stack.pop();
    colors.set(taskId, BLACK);
    return false;
  }

  // Check all components
  for (const taskId of nodes.keys()) {
    if (colors.get(taskId) === WHITE) {
      if (dfs(taskId)) {
        return { hasCycle: true, cycle };
      }
    }
  }

  return { hasCycle: false, cycle: null };
}

/**
 * Get all dependencies of a task (direct and transitive)
 *
 * @param {Object} graph - Dependency graph
 * @param {string} taskId - Task ID
 * @returns {Array<string>} All task dependencies
 *
 * @example
 * const allDeps = getAllDependencies(graph, 'task3');
 * // Returns: ['task1', 'task2']
 */
export function getAllDependencies(graph, taskId) {
  const { nodes } = graph;

  if (!nodes.has(taskId)) {
    throw new Error(`Task '${taskId}' not found in graph`);
  }

  const visited = new Set();
  const result = [];

  function dfs(currentId) {
    if (visited.has(currentId)) {
      return;
    }
    visited.add(currentId);

    const node = nodes.get(currentId);
    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        result.push(depId);
        dfs(depId);
      }
    }
  }

  dfs(taskId);
  return result;
}

/**
 * Get tasks that depend on a given task (direct and transitive)
 *
 * @param {Object} graph - Dependency graph
 * @param {string} taskId - Task ID
 * @returns {Array<string>} Tasks that depend on this task
 *
 * @example
 * const dependents = getDependents(graph, 'task1');
 */
export function getDependents(graph, taskId) {
  const { nodes } = graph;

  if (!nodes.has(taskId)) {
    throw new Error(`Task '${taskId}' not found in graph`);
  }

  const visited = new Set();
  const result = [];

  function dfs(currentId) {
    if (visited.has(currentId)) {
      return;
    }
    visited.add(currentId);

    const node = nodes.get(currentId);
    for (const dependentId of node.dependents) {
      if (!visited.has(dependentId)) {
        result.push(dependentId);
        dfs(dependentId);
      }
    }
  }

  dfs(taskId);
  return result;
}

/**
 * Get tasks ready to execute (all dependencies satisfied)
 *
 * @param {Object} graph - Dependency graph
 * @param {Set<string>} completedTasks - Tasks already completed
 * @returns {Array<string>} Ready tasks
 *
 * @example
 * const ready = getReadyTasks(graph, new Set(['task1']));
 */
export function getReadyTasks(graph, completedTasks) {
  const { nodes } = graph;
  const ready = [];

  for (const [taskId, node] of nodes) {
    // Skip if already completed
    if (completedTasks.has(taskId)) {
      continue;
    }

    // Check if all dependencies are satisfied
    const allDependenciesMet = node.dependencies.every(depId =>
      completedTasks.has(depId)
    );

    if (allDependenciesMet) {
      ready.push(taskId);
    }
  }

  return ready;
}

/**
 * Validate graph structure
 *
 * @param {Object} graph - Dependency graph
 * @returns {{valid: boolean, errors: string[]}} Validation result
 *
 * @example
 * const validation = validateGraph(graph);
 */
export function validateGraph(graph) {
  const { nodes } = graph;
  const errors = [];

  // Check for cycles
  const cycleCheck = hasCyclicDependency(graph);
  if (cycleCheck.hasCycle) {
    errors.push(`Graph contains a circular dependency: ${cycleCheck.cycle.join(' -> ')}`);
  }

  // Verify all dependencies exist
  for (const [taskId, node] of nodes) {
    for (const depId of node.dependencies) {
      if (!nodes.has(depId)) {
        errors.push(`Task '${taskId}' depends on non-existent task '${depId}'`);
      }
    }

    for (const dependentId of node.dependents) {
      if (!nodes.has(dependentId)) {
        errors.push(`Task '${taskId}' blocks non-existent task '${dependentId}'`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Visualize graph as ASCII text format
 *
 * @param {Object} graph - Dependency graph
 * @returns {string} Text representation of graph
 *
 * @example
 * console.log(visualizeGraph(graph));
 */
export function visualizeGraph(graph) {
  const { nodes } = graph;

  if (nodes.size === 0) {
    return 'Empty graph';
  }

  const lines = [];
  lines.push('Dependency Graph:');
  lines.push('');

  // Try to get topological order for better visualization
  let orderedTasks;
  try {
    orderedTasks = getTopologicalSort(graph);
  } catch (e) {
    // If there's a cycle, just use insertion order
    orderedTasks = Array.from(nodes.keys());
  }

  for (const taskId of orderedTasks) {
    const node = nodes.get(taskId);

    if (node.dependencies.length === 0 && node.dependents.length === 0) {
      lines.push(`  ${taskId} (isolated)`);
    } else {
      lines.push(`  ${taskId}`);

      if (node.dependencies.length > 0) {
        lines.push(`    <- depends on: ${node.dependencies.join(', ')}`);
      }

      if (node.dependents.length > 0) {
        lines.push(`    -> blocks: ${node.dependents.join(', ')}`);
      }
    }
  }

  return lines.join('\n');
}
