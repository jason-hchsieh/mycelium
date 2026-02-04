/**
 * MCP Discovery Utility
 *
 * Discovers and manages configured Model Context Protocol (MCP) servers.
 * Reads from .mcp.json files and provides interface to MCP services.
 *
 * @module lib/discovery/mcp-discovery
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Discover all configured MCP servers
 *
 * @param {Object} options - Discovery options
 * @param {string} options.configPath - Path to MCP config file (.mcp.json)
 * @returns {Promise<Array<{name: string, command: string, args: string[], env: Object}>>} List of MCP servers
 */
export async function discoverMCPServers(options = {}) {
  const { configPath } = options;

  if (!configPath) {
    return [];
  }

  const config = await parseMCPConfig(configPath);
  if (!config || !config.mcpServers) {
    return [];
  }

  const servers = [];
  for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
    servers.push({
      name,
      command: serverConfig.command,
      args: serverConfig.args || [],
      env: serverConfig.env || {},
    });
  }

  return servers;
}

/**
 * Parse MCP config file
 *
 * @param {string} configPath - Path to .mcp.json file
 * @returns {Promise<Object|null>} Parsed config or null
 */
export async function parseMCPConfig(configPath) {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Get MCP server tools (placeholder for actual MCP protocol)
 *
 * @param {string} serverName - Name of the MCP server
 * @param {Object} config - MCP configuration
 * @returns {Promise<Array<Object>>} List of tools
 */
export async function getMCPServerTools(serverName, config) {
  // In a real implementation, this would connect to the MCP server
  // and query its tools. For now, return empty array.
  return [];
}

/**
 * Find MCP servers that provide a specific tool
 *
 * @param {string} toolName - Tool name to search for
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching servers
 */
export async function findMCPByTool(toolName, options = {}) {
  const { configPath } = options;

  if (!configPath) {
    return [];
  }

  const servers = await discoverMCPServers({ configPath });
  // In a real implementation, would query each server for tools
  // For now, return empty array
  return [];
}

/**
 * Check if an MCP server is available
 *
 * @param {string} serverName - Name of the MCP server
 * @param {Object} config - MCP configuration
 * @returns {Promise<boolean>} True if server is configured
 */
export async function isMCPAvailable(serverName, config) {
  if (!config || !config.mcpServers) {
    return false;
  }

  return serverName in config.mcpServers;
}

/**
 * Validate MCP configuration
 *
 * @param {Object} mcpConfig - MCP server configuration
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
export async function validateMCPConfig(mcpConfig) {
  const errors = [];

  if (!mcpConfig) {
    errors.push('Configuration is null or undefined');
    return { valid: false, errors };
  }

  if (!mcpConfig.command) {
    errors.push('Missing required field: command');
  }

  if (!mcpConfig.args) {
    errors.push('Missing required field: args');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get MCP server metadata
 *
 * @param {string} serverName - Name of the MCP server
 * @param {Object} config - MCP configuration
 * @returns {Promise<Object|null>} Server metadata or null
 */
export async function getMCPServerMetadata(serverName, config) {
  if (!config || !config.mcpServers || !(serverName in config.mcpServers)) {
    return null;
  }

  const serverConfig = config.mcpServers[serverName];
  return {
    name: serverName,
    command: serverConfig.command,
    args: serverConfig.args || [],
    env: serverConfig.env || {},
  };
}

/**
 * Cache MCP servers
 *
 * @param {Array<Object>} servers - Servers to cache
 * @param {string} cachePath - Path to cache file
 * @returns {Promise<void>}
 */
export async function cacheMCPServers(servers, cachePath) {
  const cacheData = {
    timestamp: Date.now(),
    servers: servers,
  };

  const dir = path.dirname(cachePath);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
}

/**
 * Load cached MCP servers
 *
 * @param {string} cachePath - Path to cache file
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns {Promise<Array<Object>|null>} Cached servers or null if expired
 */
export async function loadCachedMCPServers(cachePath, maxAge = 3600000) {
  try {
    const content = await fs.readFile(cachePath, 'utf-8');
    const cacheData = JSON.parse(content);

    // Check if cache is expired
    const age = Date.now() - cacheData.timestamp;
    if (age >= maxAge) {
      return null;
    }

    return cacheData.servers;
  } catch (error) {
    return null;
  }
}
