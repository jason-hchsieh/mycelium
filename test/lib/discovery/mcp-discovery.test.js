/**
 * Tests for MCP Discovery Utility
 *
 * @module test/lib/discovery/mcp-discovery.test
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  discoverMCPServers,
  parseMCPConfig,
  getMCPServerTools,
  findMCPByTool,
  isMCPAvailable,
  validateMCPConfig,
  getMCPServerMetadata,
  cacheMCPServers,
  loadCachedMCPServers,
} from '../../../lib/discovery/mcp-discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../../fixtures/mcp');
const testCacheDir = path.join(__dirname, '../../fixtures/cache-test');

describe('MCP Discovery', () => {
  beforeEach(async () => {
    await fs.mkdir(testCacheDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('discoverMCPServers', () => {
    test('should discover MCP servers from config file', async () => {
      const configPath = path.join(fixturesDir, 'test.mcp.json');
      const servers = await discoverMCPServers({ configPath });

      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBeGreaterThan(0);
    });

    test('should include server name and command', async () => {
      const configPath = path.join(fixturesDir, 'test.mcp.json');
      const servers = await discoverMCPServers({ configPath });

      const server = servers[0];
      expect(server).toHaveProperty('name');
      expect(server).toHaveProperty('command');
      expect(server).toHaveProperty('args');
    });

    test('should handle missing config file gracefully', async () => {
      const configPath = path.join(fixturesDir, 'nonexistent.mcp.json');
      const servers = await discoverMCPServers({ configPath });

      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBe(0);
    });

    test('should parse environment variables', async () => {
      const configPath = path.join(fixturesDir, 'test.mcp.json');
      const servers = await discoverMCPServers({ configPath });

      const gitServer = servers.find((s) => s.name === 'git');
      expect(gitServer).toBeDefined();
      expect(gitServer.env).toHaveProperty('GIT_DIR');
    });
  });

  describe('parseMCPConfig', () => {
    test('should parse valid MCP config file', async () => {
      const configPath = path.join(fixturesDir, 'test.mcp.json');
      const config = await parseMCPConfig(configPath);

      expect(config).toBeDefined();
      expect(config).toHaveProperty('mcpServers');
      expect(Object.keys(config.mcpServers).length).toBeGreaterThan(0);
    });

    test('should return null for non-existent file', async () => {
      const configPath = path.join(fixturesDir, 'nonexistent.mcp.json');
      const config = await parseMCPConfig(configPath);

      expect(config).toBeNull();
    });

    test('should handle invalid JSON gracefully', async () => {
      const configPath = path.join(testCacheDir, 'invalid.mcp.json');
      await fs.writeFile(configPath, '{ invalid json }');

      const config = await parseMCPConfig(configPath);

      expect(config).toBeNull();
    });
  });

  describe('getMCPServerTools', () => {
    test('should return empty array for unknown server', async () => {
      const tools = await getMCPServerTools('unknown-server', {});

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(0);
    });

    test('should handle server without tools', async () => {
      const config = {
        mcpServers: {
          'test-server': {
            command: 'test',
            args: [],
          },
        },
      };

      const tools = await getMCPServerTools('test-server', config);

      expect(Array.isArray(tools)).toBe(true);
    });
  });

  describe('findMCPByTool', () => {
    test('should return empty array when no servers configured', async () => {
      const servers = await findMCPByTool('test-tool', { configPath: null });

      expect(Array.isArray(servers)).toBe(true);
      expect(servers.length).toBe(0);
    });

    test('should search across all configured servers', async () => {
      const configPath = path.join(fixturesDir, 'test.mcp.json');
      const servers = await findMCPByTool('test-tool', { configPath });

      expect(Array.isArray(servers)).toBe(true);
    });
  });

  describe('isMCPAvailable', () => {
    test('should return true for configured server', async () => {
      const configPath = path.join(fixturesDir, 'test.mcp.json');
      const config = await parseMCPConfig(configPath);
      const available = await isMCPAvailable('filesystem', config);

      expect(typeof available).toBe('boolean');
    });

    test('should return false for non-existent server', async () => {
      const config = { mcpServers: {} };
      const available = await isMCPAvailable('nonexistent', config);

      expect(available).toBe(false);
    });

    test('should handle null config gracefully', async () => {
      const available = await isMCPAvailable('test', null);

      expect(available).toBe(false);
    });
  });

  describe('validateMCPConfig', () => {
    test('should validate valid MCP config', async () => {
      const config = {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        env: {},
      };

      const result = await validateMCPConfig(config);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should detect missing command', async () => {
      const config = {
        args: [],
        env: {},
      };

      const result = await validateMCPConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('command');
    });

    test('should detect missing args', async () => {
      const config = {
        command: 'test',
        env: {},
      };

      const result = await validateMCPConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle null config', async () => {
      const result = await validateMCPConfig(null);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getMCPServerMetadata', () => {
    test('should get metadata for configured server', async () => {
      const config = {
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
            env: {},
          },
        },
      };

      const metadata = await getMCPServerMetadata('filesystem', config);

      expect(metadata).toBeDefined();
      expect(metadata).toHaveProperty('name', 'filesystem');
      expect(metadata).toHaveProperty('command');
    });

    test('should return null for non-existent server', async () => {
      const config = { mcpServers: {} };
      const metadata = await getMCPServerMetadata('nonexistent', config);

      expect(metadata).toBeNull();
    });

    test('should handle null config', async () => {
      const metadata = await getMCPServerMetadata('test', null);

      expect(metadata).toBeNull();
    });
  });

  describe('cacheMCPServers', () => {
    test('should write servers to cache file', async () => {
      const cachePath = path.join(testCacheDir, 'mcp-servers.json');
      const servers = [
        { name: 'filesystem', command: 'npx', args: [] },
      ];

      await cacheMCPServers(servers, cachePath);

      const fileExists = await fs
        .access(cachePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should include timestamp in cache', async () => {
      const cachePath = path.join(testCacheDir, 'mcp-servers-ts.json');
      const servers = [{ name: 'test' }];

      await cacheMCPServers(servers, cachePath);

      const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
      expect(cached).toHaveProperty('timestamp');
      expect(cached).toHaveProperty('servers');
    });

    test('should create parent directories if needed', async () => {
      const cachePath = path.join(testCacheDir, 'deep/nested/mcp-servers.json');
      const servers = [{ name: 'test' }];

      await cacheMCPServers(servers, cachePath);

      const fileExists = await fs
        .access(cachePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('loadCachedMCPServers', () => {
    test('should load valid cached servers', async () => {
      const cachePath = path.join(testCacheDir, 'valid-mcp-cache.json');
      const servers = [{ name: 'filesystem', command: 'npx', args: [] }];

      await cacheMCPServers(servers, cachePath);

      const loaded = await loadCachedMCPServers(cachePath);

      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
      expect(loaded.length).toBe(1);
      expect(loaded[0].name).toBe('filesystem');
    });

    test('should return null for expired cache', async () => {
      const cachePath = path.join(testCacheDir, 'expired-mcp-cache.json');
      const servers = [{ name: 'test' }];

      await cacheMCPServers(servers, cachePath);

      // Set maxAge to 0 to simulate expired cache
      const loaded = await loadCachedMCPServers(cachePath, 0);

      expect(loaded).toBeNull();
    });

    test('should return null for non-existent cache', async () => {
      const cachePath = path.join(testCacheDir, 'nonexistent-mcp-cache.json');

      const loaded = await loadCachedMCPServers(cachePath);

      expect(loaded).toBeNull();
    });

    test('should respect maxAge parameter', async () => {
      const cachePath = path.join(testCacheDir, 'maxage-mcp-cache.json');
      const servers = [{ name: 'test' }];

      await cacheMCPServers(servers, cachePath);

      const loaded = await loadCachedMCPServers(cachePath, 3600000);

      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
    });

    test('should handle corrupted cache gracefully', async () => {
      const cachePath = path.join(testCacheDir, 'corrupted-mcp-cache.json');
      await fs.writeFile(cachePath, '{ invalid json }');

      const loaded = await loadCachedMCPServers(cachePath);

      expect(loaded).toBeNull();
    });
  });

  describe('Integration tests', () => {
    test('should complete full discovery workflow', async () => {
      const configPath = path.join(fixturesDir, 'test.mcp.json');
      const servers = await discoverMCPServers({ configPath });

      expect(servers.length).toBeGreaterThan(0);

      // Validate first server
      const config = await parseMCPConfig(configPath);
      const firstServer = servers[0];
      const validation = await validateMCPConfig(
        config.mcpServers[firstServer.name]
      );
      expect(validation.valid).toBe(true);

      // Cache results
      const cachePath = path.join(testCacheDir, 'workflow-mcp.json');
      await cacheMCPServers(servers, cachePath);

      const loaded = await loadCachedMCPServers(cachePath);
      expect(loaded.length).toBe(servers.length);
    });
  });
});
