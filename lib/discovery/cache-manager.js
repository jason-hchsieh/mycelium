/**
 * Cache Manager Utility
 *
 * Centralized cache management for discovered capabilities.
 * Maintains discovered_capabilities in session state with cache invalidation.
 *
 * @module lib/discovery/cache-manager
 */

import { readState, writeState, updateStateField } from '../state-manager.js';
import { scanPlugins, getAllSkills, getAllAgents } from './capability-scanner.js';
import { discoverMCPServers } from './mcp-discovery.js';

/**
 * Update discovered capabilities in session state
 *
 * @param {string} statePath - Path to session state file
 * @param {Object} capabilities - Discovered capabilities object
 * @returns {Promise<void>}
 */
export async function updateDiscoveredCapabilities(statePath, capabilities) {
  let state = await readState(statePath);

  // Initialize structure if needed
  if (!state.discovered_capabilities) {
    state.discovered_capabilities = {
      skills: [],
      agents: [],
      mcp_servers: [],
      plugins: [],
      commands: [],
    };
  }

  // Update capabilities
  state.discovered_capabilities = {
    ...state.discovered_capabilities,
    skills: capabilities.skills || [],
    agents: capabilities.agents || [],
    mcp_servers: capabilities.mcp_servers || [],
    plugins: capabilities.plugins || [],
    commands: capabilities.commands || [],
    last_updated: Date.now(),
  };

  await writeState(statePath, state);
}

/**
 * Get discovered capabilities from session state
 *
 * @param {string} statePath - Path to session state file
 * @returns {Promise<Object|null>} Discovered capabilities or null
 */
export async function getDiscoveredCapabilities(statePath) {
  try {
    const state = await readState(statePath);

    if (!state || !state.discovered_capabilities) {
      return null;
    }

    return state.discovered_capabilities;
  } catch (error) {
    return null;
  }
}

/**
 * Clear capability cache (invalidate)
 *
 * @param {string} statePath - Path to session state file
 * @param {Object} options - Invalidation options
 * @returns {Promise<void>}
 */
export async function invalidateCache(statePath, options = {}) {
  const { types = ['skills', 'agents', 'mcp_servers', 'plugins', 'commands'] } =
    options;

  const state = await readState(statePath);

  if (!state.discovered_capabilities) {
    return;
  }

  // Clear specified types
  for (const type of types) {
    if (state.discovered_capabilities[type] !== undefined) {
      state.discovered_capabilities[type] = [];
    }
  }

  // Update timestamp
  state.discovered_capabilities.last_updated = Date.now();

  await writeState(statePath, state);
}

/**
 * Check if cache is still valid
 *
 * @param {string} statePath - Path to session state file
 * @param {number} maxAge - Maximum cache age in milliseconds (default: 1 hour)
 * @returns {Promise<boolean>} True if cache is valid
 */
export async function isCacheValid(statePath, maxAge = 3600000) {
  try {
    const state = await readState(statePath);

    if (
      !state ||
      !state.discovered_capabilities ||
      !state.discovered_capabilities.last_updated
    ) {
      return false;
    }

    const age = Date.now() - state.discovered_capabilities.last_updated;
    return age < maxAge;
  } catch (error) {
    return false;
  }
}

/**
 * Refresh all capability caches
 *
 * @param {string} statePath - Path to session state file
 * @param {Object} options - Refresh options
 * @returns {Promise<Object>} Refreshed capabilities
 */
export async function refreshCapabilityCache(statePath, options = {}) {
  const { scopes = [], mcpConfigPath } = options;

  // Discover all capabilities
  const plugins = await scanPlugins({ scopes });
  const skills = await getAllSkills({ scopes });
  const agents = await getAllAgents({ scopes });
  const mcpServers = mcpConfigPath
    ? await discoverMCPServers({ configPath: mcpConfigPath })
    : [];

  const capabilities = {
    skills,
    agents,
    mcp_servers: mcpServers,
    plugins,
    commands: [], // Could be populated from plugins
  };

  // Update state
  await updateDiscoveredCapabilities(statePath, capabilities);

  return capabilities;
}

/**
 * Get cache statistics
 *
 * @param {string} statePath - Path to session state file
 * @returns {Promise<Object|null>} Cache statistics
 */
export async function getCacheStats(statePath) {
  try {
    const state = await readState(statePath);

    if (!state || !state.discovered_capabilities) {
      return null;
    }

    const caps = state.discovered_capabilities;
    const byType = {
      skills: caps.skills?.length || 0,
      agents: caps.agents?.length || 0,
      mcp_servers: caps.mcp_servers?.length || 0,
      plugins: caps.plugins?.length || 0,
      commands: caps.commands?.length || 0,
    };

    const total = Object.values(byType).reduce((sum, count) => sum + count, 0);

    const age = caps.last_updated ? Date.now() - caps.last_updated : null;

    return {
      total,
      byType,
      age,
      last_updated: caps.last_updated,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Merge new capabilities into existing cache
 *
 * @param {string} statePath - Path to session state file
 * @param {Object} newCapabilities - New capabilities to merge
 * @param {Object} options - Merge options
 * @returns {Promise<Object>} Updated capabilities
 */
export async function mergeCapabilities(statePath, newCapabilities, options = {}) {
  const { strategy = 'merge' } = options;

  const current = (await getDiscoveredCapabilities(statePath)) || {
    skills: [],
    agents: [],
    mcp_servers: [],
    plugins: [],
    commands: [],
  };

  let merged;

  if (strategy === 'replace') {
    // Replace strategy: new capabilities completely replace old ones
    merged = {
      skills: newCapabilities.skills || current.skills,
      agents: newCapabilities.agents || current.agents,
      mcp_servers: newCapabilities.mcp_servers || current.mcp_servers,
      plugins: newCapabilities.plugins || current.plugins,
      commands: newCapabilities.commands || current.commands,
    };
  } else {
    // Merge strategy: combine and deduplicate by name
    merged = {
      skills: deduplicateByName([
        ...(current.skills || []),
        ...(newCapabilities.skills || []),
      ]),
      agents: deduplicateByName([
        ...(current.agents || []),
        ...(newCapabilities.agents || []),
      ]),
      mcp_servers: deduplicateByName([
        ...(current.mcp_servers || []),
        ...(newCapabilities.mcp_servers || []),
      ]),
      plugins: deduplicateByName([
        ...(current.plugins || []),
        ...(newCapabilities.plugins || []),
      ]),
      commands: deduplicateByName([
        ...(current.commands || []),
        ...(newCapabilities.commands || []),
      ]),
    };
  }

  await updateDiscoveredCapabilities(statePath, merged);

  return merged;
}

/**
 * Deduplicate array by name property, keeping last occurrence
 *
 * @private
 * @param {Array<Object>} items - Items to deduplicate
 * @returns {Array<Object>} Deduplicated items
 */
function deduplicateByName(items) {
  const seen = new Map();

  for (const item of items) {
    if (item.name) {
      seen.set(item.name, item);
    }
  }

  return Array.from(seen.values());
}
