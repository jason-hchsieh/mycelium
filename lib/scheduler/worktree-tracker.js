/**
 * Worktree Tracker
 *
 * Manages tracking of git worktrees in session state.
 * Provides functions to track, query, and manage worktree metadata.
 *
 * @module lib/scheduler/worktree-tracker
 */

import { readState, writeState } from '../state-manager.js';

/**
 * Get all tracked worktrees
 *
 * @param {string} statePath - Path to the state file
 * @returns {Promise<Array>} Array of worktree objects
 *
 * @example
 * const worktrees = await getActiveWorktrees('.adaptive-workflow/session_state.json');
 */
export async function getActiveWorktrees(statePath) {
  try {
    const state = await readState(statePath);
    return state.worktrees || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get metadata for a specific worktree
 *
 * @param {string} statePath - Path to the state file
 * @param {string} path - Worktree path
 * @returns {Promise<Object|null>} Worktree info or null if not found
 *
 * @example
 * const info = await getWorktreeInfo('.adaptive-workflow/session_state.json', '/path/to/worktree');
 */
export async function getWorktreeInfo(statePath, path) {
  try {
    const worktrees = await getActiveWorktrees(statePath);
    return worktrees.find((wt) => wt.path === path) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a worktree is currently tracked
 *
 * @param {string} statePath - Path to the state file
 * @param {string} path - Worktree path
 * @returns {Promise<boolean>} True if tracked, false otherwise
 *
 * @example
 * const isActive = await isWorktreeActive('.adaptive-workflow/session_state.json', '/path/to/worktree');
 */
export async function isWorktreeActive(statePath, path) {
  try {
    const info = await getWorktreeInfo(statePath, path);
    return info !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Register a worktree in state
 *
 * @param {string} statePath - Path to the state file
 * @param {Object} worktreeInfo - Worktree metadata
 * @param {string} worktreeInfo.path - Worktree path
 * @param {string} worktreeInfo.branch - Branch name
 * @param {string} worktreeInfo.track_id - Track identifier
 * @param {string} worktreeInfo.created_at - ISO timestamp
 * @param {string} worktreeInfo.status - Status (active, completed, failed, etc.)
 * @returns {Promise<void>}
 *
 * @example
 * await trackWorktree('.adaptive-workflow/session_state.json', {
 *   path: '/path/to/worktree',
 *   branch: 'feature-branch',
 *   track_id: 'track-1',
 *   created_at: new Date().toISOString(),
 *   status: 'active'
 * });
 */
export async function trackWorktree(statePath, worktreeInfo) {
  // Validate required fields
  const requiredFields = ['path', 'branch', 'track_id', 'created_at', 'status'];
  for (const field of requiredFields) {
    if (!worktreeInfo[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Read current state
  const state = await readState(statePath);

  // Initialize worktrees array if it doesn't exist
  if (!state.worktrees) {
    state.worktrees = [];
  }

  // Check if worktree already exists
  const existingIndex = state.worktrees.findIndex(
    (wt) => wt.path === worktreeInfo.path
  );

  if (existingIndex >= 0) {
    // Update existing worktree
    state.worktrees[existingIndex] = worktreeInfo;
  } else {
    // Add new worktree
    state.worktrees.push(worktreeInfo);
  }

  // Write updated state
  await writeState(statePath, state);
}

/**
 * Deregister a worktree from state
 *
 * @param {string} statePath - Path to the state file
 * @param {string} path - Worktree path
 * @returns {Promise<void>}
 *
 * @example
 * await untrackWorktree('.adaptive-workflow/session_state.json', '/path/to/worktree');
 */
export async function untrackWorktree(statePath, path) {
  try {
    // Read current state
    const state = await readState(statePath);

    // If no worktrees array, nothing to do
    if (!state.worktrees) {
      return;
    }

    // Filter out the worktree
    state.worktrees = state.worktrees.filter((wt) => wt.path !== path);

    // Write updated state
    await writeState(statePath, state);
  } catch (error) {
    // Silently handle errors when untracking
    // (e.g., state file doesn't exist)
  }
}

/**
 * Find worktree by track ID
 *
 * @param {string} statePath - Path to the state file
 * @param {string} trackId - Track identifier
 * @returns {Promise<Object|null>} Worktree info or null if not found
 *
 * @example
 * const worktree = await getWorktreeForTrack('.adaptive-workflow/session_state.json', 'track-1');
 */
export async function getWorktreeForTrack(statePath, trackId) {
  try {
    const worktrees = await getActiveWorktrees(statePath);
    return worktrees.find((wt) => wt.track_id === trackId) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get statistics about tracked worktrees
 *
 * @param {string} statePath - Path to the state file
 * @returns {Promise<Object>} Statistics object
 *
 * @example
 * const stats = await getWorktreeStats('.adaptive-workflow/session_state.json');
 * // Returns: { total: 5, active: 3, completed: 2, failed: 0, by_status: {...} }
 */
export async function getWorktreeStats(statePath) {
  try {
    const worktrees = await getActiveWorktrees(statePath);

    const stats = {
      total: worktrees.length,
      active: 0,
      completed: 0,
      failed: 0,
      by_status: {},
    };

    // Count by status
    for (const wt of worktrees) {
      const status = wt.status || 'unknown';

      // Update status-specific counts
      if (status === 'active') {
        stats.active++;
      } else if (status === 'completed') {
        stats.completed++;
      } else if (status === 'failed') {
        stats.failed++;
      }

      // Update by_status map
      stats.by_status[status] = (stats.by_status[status] || 0) + 1;
    }

    return stats;
  } catch (error) {
    return {
      total: 0,
      active: 0,
      completed: 0,
      failed: 0,
      by_status: {},
    };
  }
}
