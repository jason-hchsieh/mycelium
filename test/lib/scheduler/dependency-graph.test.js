import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  createDependencyGraph,
  getTopologicalSort,
  hasCyclicDependency,
  getAllDependencies,
  getDependents,
  getReadyTasks,
  validateGraph,
  visualizeGraph,
} from '../../../lib/scheduler/dependency-graph.js';

describe('dependency-graph', () => {
  describe('createDependencyGraph', () => {
    test('creates graph from empty task list', () => {
      const graph = createDependencyGraph([]);
      expect(graph).toBeDefined();
      expect(graph.nodes).toBeDefined();
      expect(graph.nodes.size).toBe(0);
    });

    test('creates graph from single task with no dependencies', () => {
      const tasks = [
        { id: 'task1', blockedBy: [], blocks: [] }
      ];
      const graph = createDependencyGraph(tasks);

      expect(graph.nodes.size).toBe(1);
      expect(graph.nodes.has('task1')).toBe(true);
      expect(graph.nodes.get('task1').dependencies).toEqual([]);
      expect(graph.nodes.get('task1').dependents).toEqual([]);
    });

    test('creates graph from tasks with blockedBy dependencies', () => {
      const tasks = [
        { id: 'task1', blockedBy: [], blocks: [] },
        { id: 'task2', blockedBy: ['task1'], blocks: [] },
        { id: 'task3', blockedBy: ['task1', 'task2'], blocks: [] }
      ];
      const graph = createDependencyGraph(tasks);

      expect(graph.nodes.size).toBe(3);
      expect(graph.nodes.get('task2').dependencies).toEqual(['task1']);
      expect(graph.nodes.get('task3').dependencies).toEqual(['task1', 'task2']);
    });

    test('creates graph from tasks with blocks relationships', () => {
      const tasks = [
        { id: 'task1', blockedBy: [], blocks: ['task2', 'task3'] },
        { id: 'task2', blockedBy: [], blocks: ['task3'] },
        { id: 'task3', blockedBy: [], blocks: [] }
      ];
      const graph = createDependencyGraph(tasks);

      expect(graph.nodes.get('task1').dependents).toContain('task2');
      expect(graph.nodes.get('task1').dependents).toContain('task3');
      expect(graph.nodes.get('task2').dependents).toContain('task3');
    });

    test('builds bidirectional relationships correctly', () => {
      const tasks = [
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: [] }
      ];
      const graph = createDependencyGraph(tasks);

      expect(graph.nodes.get('task1').dependents).toContain('task2');
      expect(graph.nodes.get('task2').dependencies).toContain('task1');
    });

    test('handles tasks with both blockedBy and blocks', () => {
      const tasks = [
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: [] }
      ];
      const graph = createDependencyGraph(tasks);

      expect(graph.nodes.get('task2').dependencies).toEqual(['task1']);
      expect(graph.nodes.get('task2').dependents).toEqual(['task3']);
    });

    test('stores task data in nodes', () => {
      const tasks = [
        { id: 'task1', blockedBy: [], blocks: [], name: 'Task One', priority: 1 }
      ];
      const graph = createDependencyGraph(tasks);

      expect(graph.nodes.get('task1').task).toEqual(tasks[0]);
    });
  });

  describe('getTopologicalSort', () => {
    test('returns empty array for empty graph', () => {
      const graph = createDependencyGraph([]);
      const sorted = getTopologicalSort(graph);
      expect(sorted).toEqual([]);
    });

    test('returns single task for graph with one node', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] }
      ]);
      const sorted = getTopologicalSort(graph);
      expect(sorted).toEqual(['task1']);
    });

    test('sorts tasks in dependency order', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: [] }
      ]);
      const sorted = getTopologicalSort(graph);

      expect(sorted).toEqual(['task1', 'task2', 'task3']);
    });

    test('handles multiple independent branches', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task3'] },
        { id: 'task2', blockedBy: [], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task1', 'task2'], blocks: [] }
      ]);
      const sorted = getTopologicalSort(graph);

      expect(sorted.length).toBe(3);
      expect(sorted[2]).toBe('task3');
      expect(sorted.slice(0, 2)).toContain('task1');
      expect(sorted.slice(0, 2)).toContain('task2');
    });

    test('handles diamond dependency pattern', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2', 'task3'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task3', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task4', blockedBy: ['task2', 'task3'], blocks: [] }
      ]);
      const sorted = getTopologicalSort(graph);

      expect(sorted[0]).toBe('task1');
      expect(sorted[3]).toBe('task4');
      expect(sorted.indexOf('task2')).toBeLessThan(sorted.indexOf('task4'));
      expect(sorted.indexOf('task3')).toBeLessThan(sorted.indexOf('task4'));
    });

    test('throws error for cyclic dependencies', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: ['task2'], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task1'] }
      ]);

      expect(() => getTopologicalSort(graph)).toThrow();
    });
  });

  describe('hasCyclicDependency', () => {
    test('returns false for empty graph', () => {
      const graph = createDependencyGraph([]);
      const result = hasCyclicDependency(graph);

      expect(result.hasCycle).toBe(false);
      expect(result.cycle).toBeNull();
    });

    test('returns false for acyclic graph', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: [] }
      ]);
      const result = hasCyclicDependency(graph);

      expect(result.hasCycle).toBe(false);
      expect(result.cycle).toBeNull();
    });

    test('detects simple two-node cycle', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: ['task2'], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task1'] }
      ]);
      const result = hasCyclicDependency(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
      expect(result.cycle.length).toBeGreaterThan(0);
    });

    test('detects three-node cycle', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: ['task3'], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: ['task1'] }
      ]);
      const result = hasCyclicDependency(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
    });

    test('detects self-referencing task', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: ['task1'], blocks: ['task1'] }
      ]);
      const result = hasCyclicDependency(graph);

      expect(result.hasCycle).toBe(true);
    });

    test('returns cycle path when cycle detected', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: ['task2'], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task1'] }
      ]);
      const result = hasCyclicDependency(graph);

      expect(result.cycle).toContain('task1');
      expect(result.cycle).toContain('task2');
    });
  });

  describe('getAllDependencies', () => {
    test('returns empty array for task with no dependencies', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] }
      ]);
      const deps = getAllDependencies(graph, 'task1');

      expect(deps).toEqual([]);
    });

    test('returns direct dependencies', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: [] }
      ]);
      const deps = getAllDependencies(graph, 'task2');

      expect(deps).toEqual(['task1']);
    });

    test('returns transitive dependencies', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: [] }
      ]);
      const deps = getAllDependencies(graph, 'task3');

      expect(deps).toContain('task1');
      expect(deps).toContain('task2');
      expect(deps.length).toBe(2);
    });

    test('handles diamond pattern without duplicates', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2', 'task3'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task3', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task4', blockedBy: ['task2', 'task3'], blocks: [] }
      ]);
      const deps = getAllDependencies(graph, 'task4');

      expect(deps).toContain('task1');
      expect(deps).toContain('task2');
      expect(deps).toContain('task3');
      expect(deps.length).toBe(3);
    });

    test('throws error for non-existent task', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] }
      ]);

      expect(() => getAllDependencies(graph, 'nonexistent')).toThrow();
    });
  });

  describe('getDependents', () => {
    test('returns empty array for task with no dependents', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] }
      ]);
      const dependents = getDependents(graph, 'task1');

      expect(dependents).toEqual([]);
    });

    test('returns direct dependents', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: [] }
      ]);
      const dependents = getDependents(graph, 'task1');

      expect(dependents).toEqual(['task2']);
    });

    test('returns transitive dependents', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: [] }
      ]);
      const dependents = getDependents(graph, 'task1');

      expect(dependents).toContain('task2');
      expect(dependents).toContain('task3');
      expect(dependents.length).toBe(2);
    });

    test('handles multiple branches without duplicates', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2', 'task3'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task3', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task4', blockedBy: ['task2', 'task3'], blocks: [] }
      ]);
      const dependents = getDependents(graph, 'task1');

      expect(dependents).toContain('task2');
      expect(dependents).toContain('task3');
      expect(dependents).toContain('task4');
      expect(dependents.length).toBe(3);
    });

    test('throws error for non-existent task', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] }
      ]);

      expect(() => getDependents(graph, 'nonexistent')).toThrow();
    });
  });

  describe('getReadyTasks', () => {
    test('returns all tasks when no dependencies', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] },
        { id: 'task2', blockedBy: [], blocks: [] }
      ]);
      const ready = getReadyTasks(graph, new Set());

      expect(ready).toContain('task1');
      expect(ready).toContain('task2');
      expect(ready.length).toBe(2);
    });

    test('returns only root tasks initially', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: [] }
      ]);
      const ready = getReadyTasks(graph, new Set());

      expect(ready).toEqual(['task1']);
    });

    test('returns next tasks after dependencies completed', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: [] }
      ]);
      const ready = getReadyTasks(graph, new Set(['task1']));

      expect(ready).toEqual(['task2']);
    });

    test('excludes completed tasks from ready list', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] },
        { id: 'task2', blockedBy: [], blocks: [] }
      ]);
      const ready = getReadyTasks(graph, new Set(['task1']));

      expect(ready).toEqual(['task2']);
    });

    test('handles diamond pattern correctly', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2', 'task3'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task3', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task4', blockedBy: ['task2', 'task3'], blocks: [] }
      ]);

      // After task1
      let ready = getReadyTasks(graph, new Set(['task1']));
      expect(ready).toContain('task2');
      expect(ready).toContain('task3');

      // After task1 and task2
      ready = getReadyTasks(graph, new Set(['task1', 'task2']));
      expect(ready).toEqual(['task3']);

      // After task1, task2, and task3
      ready = getReadyTasks(graph, new Set(['task1', 'task2', 'task3']));
      expect(ready).toEqual(['task4']);
    });

    test('returns empty array when all tasks completed', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] },
        { id: 'task2', blockedBy: [], blocks: [] }
      ]);
      const ready = getReadyTasks(graph, new Set(['task1', 'task2']));

      expect(ready).toEqual([]);
    });
  });

  describe('validateGraph', () => {
    test('validates empty graph as valid', () => {
      const graph = createDependencyGraph([]);
      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validates simple acyclic graph', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: [] }
      ]);
      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('detects cyclic dependencies', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: ['task2'], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task1'] }
      ]);
      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('cycle') || e.includes('circular'))).toBe(true);
    });

    test('detects missing dependencies', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: ['nonexistent'], blocks: [] }
      ]);
      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('nonexistent'))).toBe(true);
    });

    test('reports multiple errors', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: ['missing1'], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1', 'missing2'], blocks: [] }
      ]);
      const result = validateGraph(graph);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('validates complex valid graph', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2', 'task3'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task3', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task4', blockedBy: ['task2', 'task3'], blocks: [] }
      ]);
      const result = validateGraph(graph);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('visualizeGraph', () => {
    test('returns empty visualization for empty graph', () => {
      const graph = createDependencyGraph([]);
      const visualization = visualizeGraph(graph);

      expect(visualization).toBeDefined();
      expect(typeof visualization).toBe('string');
    });

    test('visualizes single task', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: [] }
      ]);
      const visualization = visualizeGraph(graph);

      expect(visualization).toContain('task1');
    });

    test('visualizes simple dependency chain', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task3'] },
        { id: 'task3', blockedBy: ['task2'], blocks: [] }
      ]);
      const visualization = visualizeGraph(graph);

      expect(visualization).toContain('task1');
      expect(visualization).toContain('task2');
      expect(visualization).toContain('task3');
      expect(visualization).toMatch(/->|→|-->/);
    });

    test('shows dependencies with arrows', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: [] }
      ]);
      const visualization = visualizeGraph(graph);

      expect(visualization).toContain('task1');
      expect(visualization).toContain('task2');
    });

    test('visualizes diamond pattern', () => {
      const graph = createDependencyGraph([
        { id: 'task1', blockedBy: [], blocks: ['task2', 'task3'] },
        { id: 'task2', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task3', blockedBy: ['task1'], blocks: ['task4'] },
        { id: 'task4', blockedBy: ['task2', 'task3'], blocks: [] }
      ]);
      const visualization = visualizeGraph(graph);

      expect(visualization).toContain('task1');
      expect(visualization).toContain('task2');
      expect(visualization).toContain('task3');
      expect(visualization).toContain('task4');
    });

    test('includes all tasks in visualization', () => {
      const tasks = [
        { id: 'task1', blockedBy: [], blocks: ['task2'] },
        { id: 'task2', blockedBy: ['task1'], blocks: [] },
        { id: 'task3', blockedBy: [], blocks: [] }
      ];
      const graph = createDependencyGraph(tasks);
      const visualization = visualizeGraph(graph);

      tasks.forEach(task => {
        expect(visualization).toContain(task.id);
      });
    });
  });
});
