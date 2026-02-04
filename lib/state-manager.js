/**
 * State Manager Utility
 *
 * Handles reading, writing, and updating state files for the adaptive workflow.
 * Manages session state, discovered capabilities, and workflow progress.
 *
 * @module lib/state-manager
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Read state from file
 *
 * @param {string} statePath - Path to the state file
 * @returns {Promise<Object>} Parsed state object
 *
 * @example
 * const state = await readState('.adaptive-workflow/session_state.json');
 */
export async function readState(statePath) {
  try {
    const content = await fs.readFile(statePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Return empty object if file doesn't exist
    if (error.code === 'ENOENT') {
      return {};
    }
    // Rethrow other errors (like invalid JSON)
    throw error;
  }
}

/**
 * Write state to file
 *
 * @param {string} statePath - Path to the state file
 * @param {Object} state - State object to write
 * @param {Object} options - Write options
 * @param {boolean} options.createDirs - Create parent directories if needed (default: true)
 * @param {boolean} options.backup - Create backup before overwriting (default: true)
 * @returns {Promise<void>}
 *
 * @example
 * await writeState('.adaptive-workflow/session_state.json', state);
 */
export async function writeState(statePath, state, options = {}) {
  const { createDirs = true, backup = true } = options;

  // Create parent directories if needed
  if (createDirs) {
    const dir = path.dirname(statePath);
    await fs.mkdir(dir, { recursive: true });
  }

  // Create backup if file exists and backup option is true
  if (backup) {
    try {
      await fs.access(statePath);
      const backupPath = statePath + '.backup';
      await fs.copyFile(statePath, backupPath);
    } catch (error) {
      // File doesn't exist, no backup needed
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // Write state with pretty formatting
  const content = JSON.stringify(state, null, 2);
  await fs.writeFile(statePath, content, 'utf-8');
}

/**
 * Update a specific field in state
 *
 * @param {string} statePath - Path to the state file
 * @param {string} fieldPath - Dot-notation path to field (e.g., 'discovered_capabilities.skills')
 * @param {*} value - New value for the field
 * @returns {Promise<Object>} Updated state object
 *
 * @example
 * await updateStateField(
 *   '.adaptive-workflow/session_state.json',
 *   'discovered_capabilities.skills',
 *   newSkillsList
 * );
 */
export async function updateStateField(statePath, fieldPath, value) {
  // Read current state
  const state = await readState(statePath);

  // Split field path and navigate to parent object
  const parts = fieldPath.split('.');
  const lastPart = parts.pop();

  // Create nested structure if needed
  let current = state;
  for (const part of parts) {
    if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part];
  }

  // Set the value
  current[lastPart] = value;

  // Write updated state
  await writeState(statePath, state);

  return state;
}

/**
 * Initialize state with default structure
 *
 * @param {string} statePath - Path to the state file
 * @returns {Promise<Object>} Initialized state object
 *
 * @example
 * const state = await initializeState('.adaptive-workflow/session_state.json');
 */
export async function initializeState(statePath) {
  // Check if state file already exists
  try {
    await fs.access(statePath);
    // File exists, return existing state
    return await readState(statePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Create default state structure
  const timestamp = new Date().toISOString();
  const defaultState = {
    status: 'initializing',
    started_at: timestamp,
    last_updated: timestamp,
    discovered_capabilities: {
      agents: [],
      skills: [],
      mcp_servers: [],
      commands: [],
      plugins: [],
    },
    tasks_summary: {
      total: 0,
      completed: 0,
      in_progress: 0,
      pending: 0,
      skipped: 0,
      blocked: 0,
    },
    checkpoints: [],
    deviations: [],
    parallel_execution: {
      enabled: true,
      max_concurrent: 3,
      active_tasks: [],
      queued_tasks: [],
      blocked_tasks: [],
      completed_tasks: [],
    },
  };

  // Write default state to file
  await writeState(statePath, defaultState);

  return defaultState;
}

/**
 * Merge state objects with deep merge strategy
 *
 * @param {Object} baseState - Base state object
 * @param {Object} newState - State updates to merge
 * @param {Object} options - Merge options
 * @param {string} options.strategy - 'overwrite' or 'merge' (default: 'merge')
 * @returns {Object} Merged state
 */
export function mergeState(baseState, newState, options = {}) {
  const { strategy = 'merge' } = options;

  // Deep clone base state to avoid mutation
  const result = deepClone(baseState);

  // Perform deep merge
  return deepMerge(result, newState);
}

/**
 * Deep clone an object
 *
 * @private
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }

  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Deep merge two objects
 *
 * @private
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  if (!source || typeof source !== 'object') {
    return target;
  }

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];

      // Skip undefined values
      if (sourceValue === undefined) {
        continue;
      }

      // If source value is null, set it
      if (sourceValue === null) {
        target[key] = null;
        continue;
      }

      // If source value is an array, replace the target array
      if (Array.isArray(sourceValue)) {
        target[key] = deepClone(sourceValue);
        continue;
      }

      // If source value is an object, merge recursively
      if (typeof sourceValue === 'object') {
        if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
          target[key] = {};
        }
        target[key] = deepMerge(target[key], sourceValue);
        continue;
      }

      // For primitive values, overwrite
      target[key] = sourceValue;
    }
  }

  return target;
}

/**
 * Get a specific field from state using dot notation
 *
 * @param {Object} state - State object
 * @param {string} fieldPath - Dot-notation path (e.g., 'discovered_capabilities.skills')
 * @param {*} defaultValue - Default value if field not found
 * @returns {*} Field value or default
 */
export function getStateField(state, fieldPath, defaultValue = null) {
  // Handle null, undefined, or empty path
  if (!state || !fieldPath) {
    return defaultValue;
  }

  // Split path and navigate
  const parts = fieldPath.split('.');
  let current = state;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }

    current = current[part];

    if (current === undefined) {
      return defaultValue;
    }
  }

  return current;
}
