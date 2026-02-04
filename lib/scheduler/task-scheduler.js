/**
 * Task Scheduler Utility
 *
 * Dispatches and schedules parallel task execution.
 * Manages task queues, concurrency, and execution ordering.
 *
 * @module lib/scheduler/task-scheduler
 */

// Internal state management
const taskRegistry = new Map();
const schedulerState = {
  queueSize: 0,
  running: 0,
  completed: 0,
  failed: 0,
  totalTime: 0,
};

// Task status constants
const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Schedule tasks for parallel execution
 *
 * @param {Array<{id: string, task: Function, priority: number, timeout: number}>} tasks - Tasks to schedule
 * @param {Object} options - Scheduling options
 * @param {number} options.maxConcurrency - Maximum parallel tasks (default: 4)
 * @param {boolean} options.preserveOrder - Return results in original order (default: true)
 * @param {number} options.timeout - Global timeout in ms (default: 30000)
 * @returns {Promise<Array<{id: string, result: any, status: string, duration: number}>>} Task results
 *
 * @example
 * const results = await scheduleTasks([
 *   { id: 'task1', task: () => doWork(), priority: 1 },
 *   { id: 'task2', task: () => doMoreWork(), priority: 2 }
 * ], { maxConcurrency: 2 });
 */
export async function scheduleTasks(tasks, options = {}) {
  const {
    maxConcurrency = 4,
    preserveOrder = true,
    timeout: globalTimeout = 30000,
  } = options;

  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Sort tasks by priority (higher priority first)
  const sortedTasks = [...tasks].sort((a, b) =>
    (b.priority || 0) - (a.priority || 0)
  );

  // Create task metadata and store in registry
  const taskMetadata = sortedTasks.map((task, index) => {
    const metadata = {
      id: task.id,
      task: task.task,
      priority: task.priority || 0,
      timeout: task.timeout || globalTimeout,
      status: TASK_STATUS.PENDING,
      startTime: null,
      endTime: null,
      duration: 0,
      result: null,
      error: null,
      cancelled: false,
      originalIndex: preserveOrder ? tasks.findIndex(t => t.id === task.id) : index,
    };
    taskRegistry.set(task.id, metadata);
    schedulerState.queueSize++;
    return metadata;
  });

  // Semaphore pattern for concurrency control
  const results = [];
  const executing = [];

  for (const metadata of taskMetadata) {
    const taskPromise = executeTask(metadata).then(result => {
      results.push(result);
      return result;
    });

    executing.push(taskPromise);

    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      // Remove completed tasks from executing array
      const completed = executing.filter(async p => {
        const settled = await Promise.race([p, Promise.resolve('__pending__')]);
        return settled !== '__pending__';
      });
      executing.splice(0, executing.length, ...executing.filter(p => !completed.includes(p)));
    }
  }

  // Wait for all remaining tasks
  await Promise.allSettled(executing);

  // Sort results to preserve original order if requested
  if (preserveOrder) {
    results.sort((a, b) => {
      const aTask = taskRegistry.get(a.id);
      const bTask = taskRegistry.get(b.id);
      return (aTask?.originalIndex || 0) - (bTask?.originalIndex || 0);
    });
  }

  return results;
}

/**
 * Execute a single task with timeout and error handling
 */
async function executeTask(metadata) {
  if (metadata.cancelled) {
    return {
      id: metadata.id,
      result: null,
      status: TASK_STATUS.CANCELLED,
      duration: 0,
      error: 'Task was cancelled',
    };
  }

  schedulerState.queueSize--;
  schedulerState.running++;
  metadata.status = TASK_STATUS.RUNNING;
  metadata.startTime = Date.now();

  try {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Task timeout after ${metadata.timeout}ms`)), metadata.timeout);
    });

    // Race between task execution and timeout
    const result = await Promise.race([
      metadata.task(),
      timeoutPromise,
    ]);

    // Check if cancelled during execution
    if (metadata.cancelled) {
      metadata.status = TASK_STATUS.CANCELLED;
      metadata.endTime = Date.now();
      metadata.duration = metadata.endTime - metadata.startTime;
      schedulerState.running--;
      return {
        id: metadata.id,
        result: null,
        status: TASK_STATUS.CANCELLED,
        duration: metadata.duration,
        error: 'Task was cancelled',
      };
    }

    metadata.status = TASK_STATUS.COMPLETED;
    metadata.result = result;
    metadata.endTime = Date.now();
    metadata.duration = metadata.endTime - metadata.startTime;

    schedulerState.running--;
    schedulerState.completed++;
    schedulerState.totalTime += metadata.duration;

    return {
      id: metadata.id,
      result,
      status: TASK_STATUS.COMPLETED,
      duration: metadata.duration,
    };
  } catch (error) {
    metadata.status = TASK_STATUS.FAILED;
    metadata.error = error.message;
    metadata.endTime = Date.now();
    metadata.duration = metadata.endTime - metadata.startTime;

    schedulerState.running--;
    schedulerState.failed++;
    schedulerState.totalTime += metadata.duration;

    return {
      id: metadata.id,
      result: null,
      status: TASK_STATUS.FAILED,
      duration: metadata.duration,
      error: error.message,
    };
  }
}

/**
 * Create a task batch for grouped execution
 *
 * @param {Array<Object>} tasks - Tasks to batch
 * @param {Object} options - Batch options
 * @param {number} options.batchSize - Tasks per batch (default: 3)
 * @returns {Array<Array<Object>>} Array of task batches
 *
 * @example
 * const batches = createTaskBatches(tasks, { batchSize: 5 });
 * for (const batch of batches) {
 *   await scheduleTasks(batch);
 * }
 */
export function createTaskBatches(tasks, options = {}) {
  const { batchSize = 3 } = options;

  if (!tasks || tasks.length === 0) {
    return [];
  }

  const batches = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    batches.push(tasks.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Cancel a running task
 *
 * @param {string} taskId - ID of task to cancel
 * @returns {Promise<boolean>} True if successfully cancelled
 *
 * @example
 * const cancelled = await cancelTask('task1');
 */
export async function cancelTask(taskId) {
  const metadata = taskRegistry.get(taskId);

  if (!metadata) {
    return false;
  }

  // Can only cancel pending or running tasks
  if (metadata.status !== TASK_STATUS.PENDING &&
      metadata.status !== TASK_STATUS.RUNNING) {
    return false;
  }

  metadata.cancelled = true;
  metadata.status = TASK_STATUS.CANCELLED;

  return true;
}

/**
 * Get task execution status
 *
 * @param {string} taskId - ID of task
 * @returns {Promise<{status: string, progress: number, startTime: number, duration: number}|null>} Status or null
 *
 * @example
 * const status = await getTaskStatus('task1');
 */
export async function getTaskStatus(taskId) {
  const metadata = taskRegistry.get(taskId);

  if (!metadata) {
    return null;
  }

  const currentTime = Date.now();
  const duration = metadata.startTime
    ? (metadata.endTime || currentTime) - metadata.startTime
    : 0;

  // Calculate progress (0-100)
  let progress = 0;
  if (metadata.status === TASK_STATUS.COMPLETED ||
      metadata.status === TASK_STATUS.FAILED ||
      metadata.status === TASK_STATUS.CANCELLED) {
    progress = 100;
  } else if (metadata.status === TASK_STATUS.RUNNING) {
    // Estimate progress based on elapsed time vs timeout
    progress = Math.min(95, (duration / metadata.timeout) * 100);
  }

  return {
    status: metadata.status,
    progress,
    startTime: metadata.startTime,
    duration,
  };
}

/**
 * Retry a failed task
 *
 * @param {string} taskId - ID of task to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.backoffMs - Backoff between retries in ms (default: 1000)
 * @returns {Promise<{result: any, status: string, attempts: number}>} Retry result
 *
 * @example
 * const result = await retryTask('task1', { maxRetries: 3 });
 */
export async function retryTask(taskId, options = {}) {
  const {
    maxRetries = 3,
    backoffMs = 1000,
  } = options;

  const metadata = taskRegistry.get(taskId);

  if (!metadata) {
    throw new Error(`Task not found: ${taskId}`);
  }

  if (metadata.status !== TASK_STATUS.FAILED) {
    throw new Error(`Task ${taskId} is not in failed state`);
  }

  let attempts = 0;
  let lastError = null;

  for (let i = 0; i < maxRetries; i++) {
    // Exponential backoff (apply before each retry attempt)
    if (i > 0) {
      const delay = backoffMs * Math.pow(2, i - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    attempts++;

    // Reset task state
    metadata.status = TASK_STATUS.PENDING;
    metadata.error = null;
    metadata.cancelled = false;

    try {
      metadata.status = TASK_STATUS.RUNNING;
      metadata.startTime = Date.now();
      schedulerState.running++;

      const result = await metadata.task();

      metadata.status = TASK_STATUS.COMPLETED;
      metadata.result = result;
      metadata.endTime = Date.now();
      metadata.duration = metadata.endTime - metadata.startTime;

      schedulerState.running--;
      schedulerState.completed++;
      schedulerState.failed--;
      schedulerState.totalTime += metadata.duration;

      return {
        result,
        status: TASK_STATUS.COMPLETED,
        attempts,
      };
    } catch (error) {
      lastError = error;
      metadata.status = TASK_STATUS.FAILED;
      metadata.error = error.message;
      metadata.endTime = Date.now();
      metadata.duration = metadata.endTime - metadata.startTime;
      schedulerState.running--;
      schedulerState.totalTime += metadata.duration;
    }
  }

  return {
    result: null,
    status: TASK_STATUS.FAILED,
    attempts,
    error: lastError?.message,
  };
}

/**
 * Get scheduler statistics
 *
 * @returns {{queueSize: number, running: number, completed: number, failed: number, totalTime: number}} Statistics
 *
 * @example
 * const stats = getSchedulerStats();
 */
export function getSchedulerStats() {
  return {
    queueSize: schedulerState.queueSize,
    running: schedulerState.running,
    completed: schedulerState.completed,
    failed: schedulerState.failed,
    totalTime: schedulerState.totalTime,
  };
}

/**
 * Clear all tasks from scheduler
 *
 * @param {Object} options - Clear options
 * @param {boolean} options.onlyCompleted - Only clear completed tasks (default: false)
 * @returns {Promise<number>} Number of tasks cleared
 *
 * @example
 * const cleared = await clearTasks({ onlyCompleted: true });
 */
export async function clearTasks(options = {}) {
  const { onlyCompleted = false, force = false } = options;

  let clearedCount = 0;

  for (const [taskId, metadata] of taskRegistry.entries()) {
    const shouldClear = !onlyCompleted ||
      metadata.status === TASK_STATUS.COMPLETED;

    // Don't clear running tasks unless force is true
    if (metadata.status === TASK_STATUS.RUNNING && !force) {
      continue;
    }

    if (shouldClear) {
      taskRegistry.delete(taskId);
      clearedCount++;
    }
  }

  // If clearing all tasks, recalculate stats from remaining tasks
  if (!onlyCompleted) {
    const remainingTasks = Array.from(taskRegistry.values());

    schedulerState.queueSize = remainingTasks.filter(t => t.status === TASK_STATUS.PENDING).length;
    schedulerState.running = remainingTasks.filter(t => t.status === TASK_STATUS.RUNNING).length;
    schedulerState.completed = remainingTasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
    schedulerState.failed = remainingTasks.filter(t => t.status === TASK_STATUS.FAILED).length;

    // Recalculate total time from remaining tasks
    schedulerState.totalTime = remainingTasks.reduce((sum, task) => sum + (task.duration || 0), 0);

    // If truly empty, reset everything
    if (taskRegistry.size === 0) {
      schedulerState.queueSize = 0;
      schedulerState.running = 0;
      schedulerState.completed = 0;
      schedulerState.failed = 0;
      schedulerState.totalTime = 0;
    }
  } else {
    // If only clearing completed, just recalculate completed count
    const remainingTasks = Array.from(taskRegistry.values());
    schedulerState.completed = remainingTasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
  }

  return clearedCount;
}
