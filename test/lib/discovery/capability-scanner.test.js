/**
 * Tests for Capability Scanner Utility
 *
 * @module test/lib/discovery/capability-scanner.test
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  scanPlugins,
  extractPluginCapabilities,
  getAllSkills,
  getAllAgents,
  getPluginCapabilities,
  cacheCapabilities,
  loadCachedCapabilities,
} from '../../../lib/discovery/capability-scanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../../fixtures/plugins');
const testCacheDir = path.join(__dirname, '../../fixtures/cache-test');

describe('Capability Scanner', () => {
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

  describe('scanPlugins', () => {
    test('should discover plugins in specified directory', async () => {
      const plugins = await scanPlugins({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
      expect(plugins[0]).toHaveProperty('name');
      expect(plugins[0]).toHaveProperty('path');
    });

    test('should extract basic plugin metadata', async () => {
      const plugins = await scanPlugins({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const testPlugin = plugins.find((p) => p.name === 'test-plugin');
      expect(testPlugin).toBeDefined();
      expect(testPlugin.version).toBe('1.0.0');
      expect(testPlugin.description).toContain('Test plugin');
    });

    test('should handle multiple scopes', async () => {
      const plugins = await scanPlugins({
        scopes: [
          { type: 'local', path: fixturesDir },
          { type: 'project', path: fixturesDir },
        ],
      });

      expect(plugins.length).toBeGreaterThan(0);
    });

    test('should deduplicate plugins from multiple scopes', async () => {
      const plugins = await scanPlugins({
        scopes: [
          { type: 'local', path: fixturesDir },
          { type: 'local', path: fixturesDir },
        ],
      });

      const names = plugins.map((p) => p.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    test('should handle empty directory gracefully', async () => {
      const emptyDir = path.join(testCacheDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      const plugins = await scanPlugins({
        scopes: [{ type: 'local', path: emptyDir }],
      });

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBe(0);
    });

    test('should handle non-existent directory gracefully', async () => {
      const plugins = await scanPlugins({
        scopes: [{ type: 'local', path: '/nonexistent/path' }],
      });

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBe(0);
    });
  });

  describe('extractPluginCapabilities', () => {
    test('should extract capabilities from plugin.json', async () => {
      const pluginPath = path.join(fixturesDir, 'test-plugin');
      const capabilities = await extractPluginCapabilities(pluginPath);

      expect(capabilities).toHaveProperty('name', 'test-plugin');
      expect(capabilities).toHaveProperty('version', '1.0.0');
      expect(capabilities).toHaveProperty('skills');
      expect(capabilities).toHaveProperty('agents');
      expect(Array.isArray(capabilities.skills)).toBe(true);
      expect(Array.isArray(capabilities.agents)).toBe(true);
    });

    test('should extract from .claude-plugin/plugin.json', async () => {
      const pluginPath = path.join(fixturesDir, 'test-plugin');
      const capabilities = await extractPluginCapabilities(pluginPath);

      expect(capabilities).toBeDefined();
      expect(capabilities.name).toBeDefined();
    });

    test('should return null for invalid plugin path', async () => {
      const capabilities = await extractPluginCapabilities('/invalid/path');

      expect(capabilities).toBeNull();
    });

    test('should handle missing manifest gracefully', async () => {
      const emptyDir = path.join(testCacheDir, 'no-manifest');
      await fs.mkdir(emptyDir, { recursive: true });

      const capabilities = await extractPluginCapabilities(emptyDir);

      expect(capabilities).toBeNull();
    });

    test('should parse skills array from manifest', async () => {
      const pluginPath = path.join(fixturesDir, 'test-plugin');
      const capabilities = await extractPluginCapabilities(pluginPath);

      expect(capabilities.skills).toContain('test-skill');
    });

    test('should parse agents array from manifest', async () => {
      const pluginPath = path.join(fixturesDir, 'test-plugin');
      const capabilities = await extractPluginCapabilities(pluginPath);

      expect(capabilities.agents).toContain('test-agent');
    });
  });

  describe('getAllSkills', () => {
    test('should aggregate skills from all plugins', async () => {
      const skills = await getAllSkills({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });

    test('should include skill name and plugin source', async () => {
      const skills = await getAllSkills({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const skill = skills[0];
      expect(skill).toHaveProperty('name');
      expect(skill).toHaveProperty('plugin');
    });

    test('should deduplicate skills from multiple plugins', async () => {
      const skills = await getAllSkills({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const names = skills.map((s) => s.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    test('should return empty array when no plugins found', async () => {
      const emptyDir = path.join(testCacheDir, 'empty-skills');
      await fs.mkdir(emptyDir, { recursive: true });

      const skills = await getAllSkills({
        scopes: [{ type: 'local', path: emptyDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });
  });

  describe('getAllAgents', () => {
    test('should aggregate agents from all plugins', async () => {
      const agents = await getAllAgents({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    test('should include agent name and plugin source', async () => {
      const agents = await getAllAgents({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const agent = agents[0];
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('plugin');
    });

    test('should deduplicate agents from multiple plugins', async () => {
      const agents = await getAllAgents({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const names = agents.map((a) => a.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    test('should return empty array when no plugins found', async () => {
      const emptyDir = path.join(testCacheDir, 'empty-agents');
      await fs.mkdir(emptyDir, { recursive: true });

      const agents = await getAllAgents({
        scopes: [{ type: 'local', path: emptyDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
    });
  });

  describe('getPluginCapabilities', () => {
    test('should find plugin by name', async () => {
      const capabilities = await getPluginCapabilities('test-plugin', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(capabilities).toBeDefined();
      expect(capabilities.name).toBe('test-plugin');
    });

    test('should return null for non-existent plugin', async () => {
      const capabilities = await getPluginCapabilities('nonexistent-plugin', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(capabilities).toBeNull();
    });

    test('should include full capability details', async () => {
      const capabilities = await getPluginCapabilities('test-plugin', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(capabilities).toHaveProperty('skills');
      expect(capabilities).toHaveProperty('agents');
      expect(capabilities).toHaveProperty('version');
    });
  });

  describe('cacheCapabilities', () => {
    test('should write capabilities to cache file', async () => {
      const cachePath = path.join(testCacheDir, 'capabilities.json');
      const capabilities = [
        { name: 'test-plugin', skills: ['skill1'], agents: ['agent1'] },
      ];

      await cacheCapabilities(capabilities, cachePath);

      const fileExists = await fs
        .access(cachePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should include timestamp in cache', async () => {
      const cachePath = path.join(testCacheDir, 'capabilities-ts.json');
      const capabilities = [{ name: 'test-plugin' }];

      await cacheCapabilities(capabilities, cachePath);

      const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
      expect(cached).toHaveProperty('timestamp');
      expect(cached).toHaveProperty('capabilities');
    });

    test('should create parent directories if needed', async () => {
      const cachePath = path.join(testCacheDir, 'deep/nested/capabilities.json');
      const capabilities = [{ name: 'test-plugin' }];

      await cacheCapabilities(capabilities, cachePath);

      const fileExists = await fs
        .access(cachePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('loadCachedCapabilities', () => {
    test('should load valid cached capabilities', async () => {
      const cachePath = path.join(testCacheDir, 'valid-cache.json');
      const capabilities = [
        { name: 'test-plugin', skills: ['skill1'], agents: ['agent1'] },
      ];

      await cacheCapabilities(capabilities, cachePath);

      const loaded = await loadCachedCapabilities(cachePath);

      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
      expect(loaded.length).toBe(1);
      expect(loaded[0].name).toBe('test-plugin');
    });

    test('should return null for expired cache', async () => {
      const cachePath = path.join(testCacheDir, 'expired-cache.json');
      const capabilities = [{ name: 'test-plugin' }];

      await cacheCapabilities(capabilities, cachePath);

      // Set maxAge to 0 to simulate expired cache
      const loaded = await loadCachedCapabilities(cachePath, 0);

      expect(loaded).toBeNull();
    });

    test('should return null for non-existent cache', async () => {
      const cachePath = path.join(testCacheDir, 'nonexistent-cache.json');

      const loaded = await loadCachedCapabilities(cachePath);

      expect(loaded).toBeNull();
    });

    test('should respect maxAge parameter', async () => {
      const cachePath = path.join(testCacheDir, 'maxage-cache.json');
      const capabilities = [{ name: 'test-plugin' }];

      await cacheCapabilities(capabilities, cachePath);

      // Load with very long maxAge
      const loaded = await loadCachedCapabilities(cachePath, 3600000); // 1 hour

      expect(loaded).toBeDefined();
      expect(Array.isArray(loaded)).toBe(true);
    });

    test('should handle corrupted cache gracefully', async () => {
      const cachePath = path.join(testCacheDir, 'corrupted-cache.json');
      await fs.writeFile(cachePath, '{ invalid json }');

      const loaded = await loadCachedCapabilities(cachePath);

      expect(loaded).toBeNull();
    });
  });

  describe('Integration tests', () => {
    test('should complete full scan-cache-load workflow', async () => {
      const cachePath = path.join(testCacheDir, 'workflow-cache.json');

      // 1. Scan plugins
      const plugins = await scanPlugins({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(plugins.length).toBeGreaterThan(0);

      // 2. Cache results
      await cacheCapabilities(plugins, cachePath);

      // 3. Load from cache
      const loaded = await loadCachedCapabilities(cachePath);

      expect(loaded).toBeDefined();
      expect(loaded.length).toBe(plugins.length);
      expect(loaded[0].name).toBe(plugins[0].name);
    });

    test('should handle getAllSkills and getAllAgents together', async () => {
      const skills = await getAllSkills({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const agents = await getAllAgents({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(skills.length).toBeGreaterThan(0);
      expect(agents.length).toBeGreaterThan(0);

      // Verify data integrity
      expect(skills[0]).toHaveProperty('name');
      expect(agents[0]).toHaveProperty('name');
    });
  });
});
