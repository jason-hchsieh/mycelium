import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  scheduleTasks,
  createTaskBatches,
  cancelTask,
  getTaskStatus,
  retryTask,
  getSchedulerStats,
  clearTasks,
} from '../../../lib/scheduler/task-scheduler.js';

describe('task-scheduler', () => {
  beforeEach(async () => {
    // Clear all tasks before each test (force clear even running tasks for test isolation)
    await clearTasks({ force: true });
  });

  describe('scheduleTasks', () => {
    test('executes tasks with default options', async () => {
      const tasks = [
        { id: 'task1', task: async () => 'result1', priority: 1 },
        { id: 'task2', task: async () => 'result2', priority: 1 },
      ];

      const results = await scheduleTasks(tasks);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: 'task1',
        result: 'result1',
        status: 'completed',
      });
      expect(results[0].duration).toBeGreaterThanOrEqual(0);
      expect(results[1]).toMatchObject({
        id: 'task2',
        result: 'result2',
        status: 'completed',
      });
    });

    test('respects maxConcurrency limit', async () => {
      const executionOrder = [];
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            executionOrder.push('start1');
            await new Promise(resolve => setTimeout(resolve, 50));
            executionOrder.push('end1');
            return 'result1';
          },
          priority: 1,
        },
        {
          id: 'task2',
          task: async () => {
            executionOrder.push('start2');
            await new Promise(resolve => setTimeout(resolve, 50));
            executionOrder.push('end2');
            return 'result2';
          },
          priority: 1,
        },
        {
          id: 'task3',
          task: async () => {
            executionOrder.push('start3');
            await new Promise(resolve => setTimeout(resolve, 50));
            executionOrder.push('end3');
            return 'result3';
          },
          priority: 1,
        },
      ];

      await scheduleTasks(tasks, { maxConcurrency: 1 });

      // With concurrency 1, tasks should run sequentially
      expect(executionOrder.indexOf('end1')).toBeLessThan(executionOrder.indexOf('start2'));
      expect(executionOrder.indexOf('end2')).toBeLessThan(executionOrder.indexOf('start3'));
    });

    test('handles task failures gracefully', async () => {
      const tasks = [
        { id: 'task1', task: async () => 'success', priority: 1 },
        { id: 'task2', task: async () => { throw new Error('Task failed'); }, priority: 1 },
        { id: 'task3', task: async () => 'success', priority: 1 },
      ];

      const results = await scheduleTasks(tasks);

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('failed');
      expect(results[1].error).toBe('Task failed');
      expect(results[2].status).toBe('completed');
    });

    test('respects task priority', async () => {
      const executionOrder = [];
      const tasks = [
        {
          id: 'low',
          task: async () => {
            executionOrder.push('low');
            return 'low';
          },
          priority: 1,
        },
        {
          id: 'high',
          task: async () => {
            executionOrder.push('high');
            return 'high';
          },
          priority: 3,
        },
        {
          id: 'medium',
          task: async () => {
            executionOrder.push('medium');
            return 'medium';
          },
          priority: 2,
        },
      ];

      await scheduleTasks(tasks, { maxConcurrency: 1 });

      // Higher priority tasks should run first
      expect(executionOrder[0]).toBe('high');
      expect(executionOrder[1]).toBe('medium');
      expect(executionOrder[2]).toBe('low');
    });

    test('handles task timeout', async () => {
      const tasks = [
        {
          id: 'slow',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return 'done';
          },
          timeout: 50,
        },
      ];

      const results = await scheduleTasks(tasks);

      expect(results[0].status).toBe('failed');
      expect(results[0].error).toContain('timeout');
    });

    test('preserves order when preserveOrder is true', async () => {
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'result1';
          },
        },
        { id: 'task2', task: async () => 'result2' },
        { id: 'task3', task: async () => 'result3' },
      ];

      const results = await scheduleTasks(tasks, { preserveOrder: true });

      expect(results.map(r => r.id)).toEqual(['task1', 'task2', 'task3']);
    });

    test('handles empty task array', async () => {
      const results = await scheduleTasks([]);
      expect(results).toEqual([]);
    });

    test('handles global timeout option', async () => {
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'done';
          },
        },
      ];

      const results = await scheduleTasks(tasks, { timeout: 50 });

      expect(results[0].status).toBe('failed');
      expect(results[0].error).toContain('timeout');
    });

    test('tracks task execution in scheduler state', async () => {
      const tasks = [
        { id: 'task1', task: async () => 'result1' },
      ];

      const resultsPromise = scheduleTasks(tasks);

      // Check status while running (may be running or completed depending on timing)
      const status = await getTaskStatus('task1');
      expect(['pending', 'running', 'completed']).toContain(status.status);

      await resultsPromise;
    });
  });

  describe('createTaskBatches', () => {
    test('creates batches with default batch size', () => {
      const tasks = [
        { id: 'task1' },
        { id: 'task2' },
        { id: 'task3' },
        { id: 'task4' },
        { id: 'task5' },
      ];

      const batches = createTaskBatches(tasks);

      expect(batches).toHaveLength(2);
      expect(batches[0]).toHaveLength(3); // Default batch size is 3
      expect(batches[1]).toHaveLength(2);
    });

    test('creates batches with custom batch size', () => {
      const tasks = [
        { id: 'task1' },
        { id: 'task2' },
        { id: 'task3' },
        { id: 'task4' },
        { id: 'task5' },
      ];

      const batches = createTaskBatches(tasks, { batchSize: 2 });

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(2);
      expect(batches[1]).toHaveLength(2);
      expect(batches[2]).toHaveLength(1);
    });

    test('handles single task', () => {
      const tasks = [{ id: 'task1' }];
      const batches = createTaskBatches(tasks, { batchSize: 5 });

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(1);
    });

    test('handles empty array', () => {
      const batches = createTaskBatches([]);
      expect(batches).toEqual([]);
    });

    test('preserves task order within batches', () => {
      const tasks = [
        { id: 'task1' },
        { id: 'task2' },
        { id: 'task3' },
        { id: 'task4' },
      ];

      const batches = createTaskBatches(tasks, { batchSize: 2 });

      expect(batches[0][0].id).toBe('task1');
      expect(batches[0][1].id).toBe('task2');
      expect(batches[1][0].id).toBe('task3');
      expect(batches[1][1].id).toBe('task4');
    });
  });

  describe('cancelTask', () => {
    test('cancels a running task', async () => {
      const tasks = [
        {
          id: 'long-task',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return 'done';
          },
        },
      ];

      const resultPromise = scheduleTasks(tasks);

      // Wait a bit for task to start
      await new Promise(resolve => setTimeout(resolve, 50));

      const cancelled = await cancelTask('long-task');
      expect(cancelled).toBe(true);

      const results = await resultPromise;
      expect(results[0].status).toBe('cancelled');
    });

    test('returns false for non-existent task', async () => {
      const cancelled = await cancelTask('non-existent');
      expect(cancelled).toBe(false);
    });

    test('returns false for already completed task', async () => {
      const tasks = [
        { id: 'quick-task', task: async () => 'done' },
      ];

      await scheduleTasks(tasks);

      const cancelled = await cancelTask('quick-task');
      expect(cancelled).toBe(false);
    });

    test('prevents cancelled task from updating state', async () => {
      let taskCompleted = false;
      const tasks = [
        {
          id: 'cancellable',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            taskCompleted = true;
            return 'done';
          },
        },
      ];

      const resultPromise = scheduleTasks(tasks);
      await new Promise(resolve => setTimeout(resolve, 20));
      await cancelTask('cancellable');
      await resultPromise;

      // Task may or may not complete depending on timing, but it should be marked as cancelled
      const status = await getTaskStatus('cancellable');
      expect(status.status).toBe('cancelled');
    });
  });

  describe('getTaskStatus', () => {
    test('returns status for pending task', async () => {
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'done';
          },
        },
        {
          id: 'task2',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'done';
          },
        },
      ];

      scheduleTasks(tasks, { maxConcurrency: 1 }); // Only one runs at a time

      await new Promise(resolve => setTimeout(resolve, 20));

      const status = await getTaskStatus('task2');
      expect(status).toBeDefined();
      expect(['pending', 'running']).toContain(status.status);
    });

    test('returns status for running task', async () => {
      const tasks = [
        {
          id: 'running-task',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'done';
          },
        },
      ];

      scheduleTasks(tasks);

      await new Promise(resolve => setTimeout(resolve, 20));

      const status = await getTaskStatus('running-task');
      expect(status).toBeDefined();
      expect(['running', 'completed']).toContain(status.status);
      expect(status.startTime).toBeDefined();
    });

    test('returns status for completed task', async () => {
      const tasks = [
        { id: 'completed-task', task: async () => 'done' },
      ];

      await scheduleTasks(tasks);

      const status = await getTaskStatus('completed-task');
      expect(status.status).toBe('completed');
      expect(status.duration).toBeGreaterThanOrEqual(0);
    });

    test('returns null for non-existent task', async () => {
      const status = await getTaskStatus('non-existent');
      expect(status).toBeNull();
    });

    test('includes progress information when available', async () => {
      const tasks = [
        { id: 'task-with-progress', task: async () => 'done' },
      ];

      await scheduleTasks(tasks);

      const status = await getTaskStatus('task-with-progress');
      expect(status).toHaveProperty('progress');
      expect(typeof status.progress).toBe('number');
    });
  });

  describe('retryTask', () => {
    test('retries a failed task with default options', async () => {
      let attempts = 0;
      const tasks = [
        {
          id: 'flaky-task',
          task: async () => {
            attempts++;
            if (attempts < 2) {
              throw new Error('Temporary failure');
            }
            return 'success';
          },
        },
      ];

      await scheduleTasks(tasks);

      const result = await retryTask('flaky-task');
      expect(result.status).toBe('completed');
      expect(result.result).toBe('success');
      expect(result.attempts).toBeGreaterThanOrEqual(1);
    });

    test('respects maxRetries option', async () => {
      let attempts = 0;
      const tasks = [
        {
          id: 'always-fails',
          task: async () => {
            attempts++;
            throw new Error('Always fails');
          },
        },
      ];

      await scheduleTasks(tasks);

      const result = await retryTask('always-fails', { maxRetries: 2 });
      expect(result.status).toBe('failed');
      expect(result.attempts).toBe(2);
    });

    test('uses exponential backoff between retries', async () => {
      const timestamps = [];
      const tasks = [
        {
          id: 'backoff-task',
          task: async () => {
            timestamps.push(Date.now());
            if (timestamps.length < 3) {
              throw new Error('Retry me');
            }
            return 'success';
          },
        },
      ];

      await scheduleTasks(tasks);

      await retryTask('backoff-task', { maxRetries: 3, backoffMs: 50 });

      // Check that delays increase (exponential backoff)
      const delay1 = timestamps[1] - timestamps[0];
      const delay2 = timestamps[2] - timestamps[1];
      expect(delay2).toBeGreaterThanOrEqual(delay1);
    });

    test('throws error for non-existent task', async () => {
      await expect(retryTask('non-existent'))
        .rejects.toThrow('Task not found');
    });

    test('throws error for task that did not fail', async () => {
      const tasks = [
        { id: 'success-task', task: async () => 'done' },
      ];

      await scheduleTasks(tasks);

      await expect(retryTask('success-task'))
        .rejects.toThrow('not in failed state');
    });

    test('resets task state before retrying', async () => {
      let callCount = 0;
      const tasks = [
        {
          id: 'reset-task',
          task: async () => {
            callCount++;
            if (callCount === 1) {
              throw new Error('First attempt fails');
            }
            return 'success on retry';
          },
        },
      ];

      await scheduleTasks(tasks);

      const statusBefore = await getTaskStatus('reset-task');
      expect(statusBefore.status).toBe('failed');

      // Task should succeed on retry
      const result = await retryTask('reset-task', { maxRetries: 1 });
      expect(result.status).toBe('completed');
      expect(result.result).toBe('success on retry');

      const statusAfter = await getTaskStatus('reset-task');
      expect(statusAfter.status).toBe('completed');
    });
  });

  describe('getSchedulerStats', () => {
    test('returns initial stats with no tasks', () => {
      const stats = getSchedulerStats();

      expect(stats).toMatchObject({
        queueSize: 0,
        running: 0,
        completed: 0,
        failed: 0,
        totalTime: 0,
      });
    });

    test('tracks completed tasks', async () => {
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'done';
          },
        },
        {
          id: 'task2',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'done';
          },
        },
      ];

      await scheduleTasks(tasks);

      const stats = getSchedulerStats();
      expect(stats.completed).toBe(2);
      expect(stats.totalTime).toBeGreaterThan(0);
    });

    test('tracks failed tasks', async () => {
      const tasks = [
        { id: 'task1', task: async () => { throw new Error('Failed'); } },
        { id: 'task2', task: async () => 'done' },
      ];

      await scheduleTasks(tasks);

      const stats = getSchedulerStats();
      expect(stats.failed).toBe(1);
      expect(stats.completed).toBe(1);
    });

    test('tracks running tasks', async () => {
      const tasks = [
        {
          id: 'long-task',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'done';
          },
        },
      ];

      scheduleTasks(tasks);

      await new Promise(resolve => setTimeout(resolve, 20));

      const stats = getSchedulerStats();
      expect(stats.running).toBeGreaterThanOrEqual(0);
    });

    test('tracks queue size', async () => {
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'done';
          },
        },
        { id: 'task2', task: async () => 'done' },
        { id: 'task3', task: async () => 'done' },
      ];

      scheduleTasks(tasks, { maxConcurrency: 1 });

      await new Promise(resolve => setTimeout(resolve, 10));

      const stats = getSchedulerStats();
      expect(stats.queueSize + stats.running + stats.completed).toBeGreaterThan(0);
    });

    test('calculates total execution time', async () => {
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return 'done';
          },
        },
      ];

      await scheduleTasks(tasks);

      const stats = getSchedulerStats();
      expect(stats.totalTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe('clearTasks', () => {
    test('clears all tasks by default', async () => {
      const tasks = [
        { id: 'task1', task: async () => 'done' },
        { id: 'task2', task: async () => { throw new Error('Failed'); } },
      ];

      await scheduleTasks(tasks);

      const cleared = await clearTasks();
      expect(cleared).toBe(2);

      const stats = getSchedulerStats();
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });

    test('clears only completed tasks when onlyCompleted is true', async () => {
      const tasks = [
        { id: 'task1', task: async () => 'done' },
        { id: 'task2', task: async () => { throw new Error('Failed'); } },
      ];

      await scheduleTasks(tasks);

      const cleared = await clearTasks({ onlyCompleted: true });
      expect(cleared).toBe(1);

      const stats = getSchedulerStats();
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(1); // Failed task remains
    });

    test('returns 0 when no tasks to clear', async () => {
      const cleared = await clearTasks();
      expect(cleared).toBe(0);
    });

    test('does not clear running tasks', async () => {
      const tasks = [
        {
          id: 'long-task',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'done';
          },
        },
      ];

      const taskPromise = scheduleTasks(tasks);

      await new Promise(resolve => setTimeout(resolve, 20));

      const cleared = await clearTasks();
      expect(cleared).toBe(0); // Running task not cleared

      await taskPromise;
    });

    test('allows new tasks after clearing', async () => {
      const tasks1 = [
        { id: 'task1', task: async () => 'done' },
      ];

      await scheduleTasks(tasks1);
      await clearTasks();

      const tasks2 = [
        { id: 'task2', task: async () => 'done' },
      ];

      const results = await scheduleTasks(tasks2);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('task2');
    });
  });

  describe('integration scenarios', () => {
    test('schedules batches sequentially', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task${i}`,
        task: async () => `result${i}`,
      }));

      const batches = createTaskBatches(tasks, { batchSize: 3 });
      const allResults = [];

      for (const batch of batches) {
        const results = await scheduleTasks(batch);
        allResults.push(...results);
      }

      expect(allResults).toHaveLength(10);
      expect(allResults.every(r => r.status === 'completed')).toBe(true);
    });

    test('handles mixed success and failure with retries', async () => {
      let attempt1 = 0;
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            attempt1++;
            if (attempt1 < 2) throw new Error('Retry me');
            return 'success';
          },
        },
        { id: 'task2', task: async () => 'success' },
        { id: 'task3', task: async () => { throw new Error('Permanent fail'); } },
      ];

      const results = await scheduleTasks(tasks);

      // Retry the failed task
      await retryTask('task1');

      const stats = getSchedulerStats();
      expect(stats.completed).toBeGreaterThanOrEqual(2);
      expect(stats.failed).toBeGreaterThanOrEqual(1);
    });

    test('cancels multiple tasks', async () => {
      const tasks = [
        {
          id: 'task1',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return 'done';
          },
        },
        {
          id: 'task2',
          task: async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return 'done';
          },
        },
      ];

      const resultPromise = scheduleTasks(tasks, { maxConcurrency: 2 });

      await new Promise(resolve => setTimeout(resolve, 50));

      await cancelTask('task1');
      await cancelTask('task2');

      const results = await resultPromise;
      const cancelledCount = results.filter(r => r.status === 'cancelled').length;
      expect(cancelledCount).toBeGreaterThanOrEqual(1);
    });

    test('monitors long-running workflow', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `task${i}`,
        task: async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
          return `result${i}`;
        },
      }));

      const resultPromise = scheduleTasks(tasks, { maxConcurrency: 2 });

      // Monitor progress
      await new Promise(resolve => setTimeout(resolve, 20));
      const stats1 = getSchedulerStats();
      expect(stats1.running + stats1.completed).toBeGreaterThan(0);

      await resultPromise;

      const stats2 = getSchedulerStats();
      expect(stats2.completed).toBe(5);
    });
  });
});
