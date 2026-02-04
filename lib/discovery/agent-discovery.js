/**
 * Agent Discovery Utility
 *
 * Discovers agents available in the environment from multiple scopes:
 * built-in agents, plugin agents, and project-specific agents.
 *
 * @module lib/discovery/agent-discovery
 */

import { promises as fs } from 'fs';
import path from 'path';
import { scanPlugins } from './capability-scanner.js';

/**
 * Find all agents from all scopes
 *
 * @param {Object} options - Discovery options
 * @param {Array<{type: string, path: string}>} options.scopes - Scopes to search
 * @returns {Promise<Array<{name: string, plugin: string, description?: string, category?: string, capabilities?: string[], path?: string}>>} List of agents
 */
export async function discoverAgents(options = {}) {
  const { scopes = [] } = options;
  const plugins = await scanPlugins({ scopes });
  const agents = [];
  const seenAgents = new Set();

  for (const plugin of plugins) {
    for (const agentName of plugin.agents || []) {
      if (seenAgents.has(agentName)) continue;
      seenAgents.add(agentName);

      const agent = {
        name: agentName,
        plugin: plugin.name,
      };

      // Try to load metadata from agent markdown file
      const agentPath = path.join(plugin.path, 'agents', `${agentName}.md`);
      const metadata = await getAgentMetadata(agentPath);

      if (metadata) {
        Object.assign(agent, metadata);
        agent.path = agentPath;
      }

      agents.push(agent);
    }
  }

  return agents;
}

/**
 * Find agents by name (fuzzy match)
 *
 * @param {string} name - Agent name to search
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching agents
 */
export async function findAgentsByName(name, options = {}) {
  const agents = await discoverAgents(options);
  const searchTerm = name.toLowerCase();

  return agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchTerm)
  );
}

/**
 * Find agents by capability
 *
 * @param {string} capability - Capability to search
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching agents
 */
export async function findAgentsByCapability(capability, options = {}) {
  const agents = await discoverAgents(options);
  const searchTerm = capability.toLowerCase();

  return agents.filter((agent) => {
    if (!agent.capabilities) return false;
    return agent.capabilities.some((cap) =>
      cap.toLowerCase().includes(searchTerm)
    );
  });
}

/**
 * Find agents by category
 *
 * @param {string} category - Category to search
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching agents
 */
export async function findAgentsByCategory(category, options = {}) {
  const agents = await discoverAgents(options);
  const searchTerm = category.toLowerCase();

  return agents.filter(
    (agent) => agent.category && agent.category.toLowerCase() === searchTerm
  );
}

/**
 * Get agent metadata from markdown file
 *
 * @param {string} agentPath - Path to agent markdown file
 * @returns {Promise<Object|null>} Agent metadata or null
 */
export async function getAgentMetadata(agentPath) {
  try {
    const content = await fs.readFile(agentPath, 'utf-8');
    return parseAgentFrontmatter(content);
  } catch (error) {
    return null;
  }
}

/**
 * Parse YAML frontmatter from agent markdown
 *
 * @param {string} content - Markdown content
 * @returns {Object|null} Parsed metadata or null
 */
export function parseAgentFrontmatter(content) {
  if (!content) return null;

  // Match YAML frontmatter between --- delimiters
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  try {
    const yamlContent = frontmatterMatch[1];
    const metadata = {};

    // Simple YAML parser for basic key-value pairs and arrays
    const lines = yamlContent.split('\n');
    let currentKey = null;
    let hasError = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Handle array items
      if (trimmed.startsWith('-')) {
        if (currentKey && Array.isArray(metadata[currentKey])) {
          const item = trimmed.substring(1).trim();
          // Check for malformed array syntax
          if (item.includes('[') && !item.includes(']')) {
            hasError = true;
            break;
          }
          metadata[currentKey].push(item);
        }
        continue;
      }

      // Handle key-value pairs
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        // Check for malformed value syntax
        if (value.includes('[') && !value.includes(']')) {
          hasError = true;
          break;
        }

        if (value) {
          metadata[key] = value;
          currentKey = null;
        } else {
          // Key with no value, likely followed by array
          metadata[key] = [];
          currentKey = key;
        }
      }
    }

    return hasError ? null : metadata;
  } catch (error) {
    return null;
  }
}

/**
 * Search agents by keyword in description or name
 *
 * @param {string} keyword - Keyword to search
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching agents
 */
export async function searchAgentsByKeyword(keyword, options = {}) {
  const agents = await discoverAgents(options);
  const searchTerm = keyword.toLowerCase();

  const results = [];

  for (const agent of agents) {
    const nameMatch = agent.name.toLowerCase().includes(searchTerm);
    const descMatch =
      agent.description &&
      agent.description.toLowerCase().includes(searchTerm);

    // Also check full markdown content if path is available
    let contentMatch = false;
    if (agent.path) {
      try {
        const content = await fs.readFile(agent.path, 'utf-8');
        contentMatch = content.toLowerCase().includes(searchTerm);
      } catch (error) {
        // Ignore read errors
      }
    }

    if (nameMatch || descMatch || contentMatch) {
      results.push(agent);
    }
  }

  return results;
}

/**
 * Cache discovered agents
 *
 * @param {Array<Object>} agents - Agents to cache
 * @param {string} cachePath - Path to cache file
 * @returns {Promise<void>}
 */
export async function cacheAgents(agents, cachePath) {
  const cacheData = {
    timestamp: Date.now(),
    agents: agents,
  };

  const dir = path.dirname(cachePath);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
}
