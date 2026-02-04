/**
 * Capability Scanner Utility
 *
 * Scans installed plugins and extracts their capabilities.
 * Used to discover available skills, agents, and features in the environment.
 *
 * @module lib/discovery/capability-scanner
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Scan all installed plugins and their capabilities
 *
 * @param {Object} options - Scan options
 * @param {Array<{type: string, path: string}>} options.scopes - Scopes to scan with paths
 * @returns {Promise<Array<{name: string, path: string, version: string, description: string, skills: string[], agents: string[], commands: string[]}>>} List of plugins with capabilities
 */
export async function scanPlugins(options = {}) {
  const { scopes = [] } = options;
  const allPlugins = [];
  const seenNames = new Set();

  for (const scope of scopes) {
    const scopePath = scope.path;

    try {
      await fs.access(scopePath);
    } catch (error) {
      // Directory doesn't exist, skip
      continue;
    }

    let entries;
    try {
      entries = await fs.readdir(scopePath, { withFileTypes: true });
    } catch (error) {
      // Can't read directory, skip
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const pluginPath = path.join(scopePath, entry.name);
      const capabilities = await extractPluginCapabilities(pluginPath);

      if (capabilities && !seenNames.has(capabilities.name)) {
        seenNames.add(capabilities.name);
        allPlugins.push({
          ...capabilities,
          path: pluginPath,
          scope: scope.type,
        });
      }
    }
  }

  return allPlugins;
}

/**
 * Extract capabilities from a single plugin
 *
 * @param {string} pluginPath - Path to the plugin directory
 * @returns {Promise<{name: string, version: string, description: string, skills: string[], agents: string[], commands: string[]}|null>} Plugin capabilities or null
 */
export async function extractPluginCapabilities(pluginPath) {
  // Try plugin.json first
  let manifestPath = path.join(pluginPath, 'plugin.json');
  let manifestExists = false;

  try {
    await fs.access(manifestPath);
    manifestExists = true;
  } catch (error) {
    // Try .claude-plugin/plugin.json
    manifestPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
    try {
      await fs.access(manifestPath);
      manifestExists = true;
    } catch (error2) {
      // No manifest found
      return null;
    }
  }

  if (!manifestExists) {
    return null;
  }

  try {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    return {
      name: manifest.name || path.basename(pluginPath),
      version: manifest.version || '0.0.0',
      description: manifest.description || '',
      author: manifest.author || '',
      skills: manifest.skills || [],
      agents: manifest.agents || [],
      commands: manifest.commands || [],
    };
  } catch (error) {
    // Invalid JSON or read error
    return null;
  }
}

/**
 * Get all available skills from installed plugins
 *
 * @param {Object} options - Options with scopes
 * @returns {Promise<Array<{name: string, plugin: string}>>} List of available skills
 */
export async function getAllSkills(options = {}) {
  const plugins = await scanPlugins(options);
  const skills = [];
  const seenSkills = new Set();

  for (const plugin of plugins) {
    for (const skillName of plugin.skills || []) {
      if (!seenSkills.has(skillName)) {
        seenSkills.add(skillName);
        skills.push({
          name: skillName,
          plugin: plugin.name,
        });
      }
    }
  }

  return skills;
}

/**
 * Get all available agents from installed plugins
 *
 * @param {Object} options - Options with scopes
 * @returns {Promise<Array<{name: string, plugin: string}>>} List of available agents
 */
export async function getAllAgents(options = {}) {
  const plugins = await scanPlugins(options);
  const agents = [];
  const seenAgents = new Set();

  for (const plugin of plugins) {
    for (const agentName of plugin.agents || []) {
      if (!seenAgents.has(agentName)) {
        seenAgents.add(agentName);
        agents.push({
          name: agentName,
          plugin: plugin.name,
        });
      }
    }
  }

  return agents;
}

/**
 * Get capabilities of a specific plugin
 *
 * @param {string} pluginName - Name of the plugin
 * @param {Object} options - Options with scopes
 * @returns {Promise<Object|null>} Plugin capabilities or null if not found
 */
export async function getPluginCapabilities(pluginName, options = {}) {
  const plugins = await scanPlugins(options);
  const plugin = plugins.find((p) => p.name === pluginName);
  return plugin || null;
}

/**
 * Cache plugin capabilities in memory or file
 *
 * @param {Array<Object>} capabilities - Capabilities to cache
 * @param {string} cachePath - Path to cache file
 * @returns {Promise<void>}
 */
export async function cacheCapabilities(capabilities, cachePath) {
  const cacheData = {
    timestamp: Date.now(),
    capabilities: capabilities,
  };

  // Create parent directories if needed
  const dir = path.dirname(cachePath);
  await fs.mkdir(dir, { recursive: true });

  // Write cache file
  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
}

/**
 * Load cached capabilities
 *
 * @param {string} cachePath - Path to cache file
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns {Promise<Array<Object>|null>} Cached capabilities or null if invalid
 */
export async function loadCachedCapabilities(cachePath, maxAge = 3600000) {
  try {
    const content = await fs.readFile(cachePath, 'utf-8');
    const cacheData = JSON.parse(content);

    // Check if cache is expired
    const age = Date.now() - cacheData.timestamp;
    if (age >= maxAge) {
      return null;
    }

    return cacheData.capabilities;
  } catch (error) {
    // File doesn't exist or invalid JSON
    return null;
  }
}
