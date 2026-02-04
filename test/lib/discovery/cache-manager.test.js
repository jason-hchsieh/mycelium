/**
 * Tests for Cache Manager Utility
 *
 * @module test/lib/discovery/cache-manager.test
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeState, readState } from '../../../lib/state-manager.js';
import {
  updateDiscoveredCapabilities,
  getDiscoveredCapabilities,
  invalidateCache,
  isCacheValid,
  refreshCapabilityCache,
  getCacheStats,
  mergeCapabilities,
} from '../../../lib/discovery/cache-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testStateDir = path.join(__dirname, '../../fixtures/cache-test');

describe('Cache Manager', () => {
  beforeEach(async () => {
    await fs.mkdir(testStateDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testStateDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('updateDiscoveredCapabilities', () => {
    test('should update capabilities in state', async () => {
      const statePath = path.join(testStateDir, 'update-caps.json');
      await initializeState(statePath);

      const capabilities = {
        skills: [{ name: 'test-skill' }],
        agents: [{ name: 'test-agent' }],
        mcp_servers: [],
        plugins: [],
      };

      await updateDiscoveredCapabilities(statePath, capabilities);

      const state = await readState(statePath);
      expect(state.discovered_capabilities.skills).toHaveLength(1);
      expect(state.discovered_capabilities.agents).toHaveLength(1);
    });

    test('should add timestamp', async () => {
      const statePath = path.join(testStateDir, 'update-caps-ts.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [],
        agents: [],
        mcp_servers: [],
        plugins: [],
      });

      const state = await readState(statePath);
      expect(state.discovered_capabilities.last_updated).toBeDefined();
    });

    test('should create state file if not exists', async () => {
      const statePath = path.join(testStateDir, 'create-caps.json');

      await updateDiscoveredCapabilities(statePath, {
        skills: [{ name: 'skill1' }],
        agents: [],
        mcp_servers: [],
        plugins: [],
      });

      const state = await readState(statePath);
      expect(state.discovered_capabilities.skills).toHaveLength(1);
    });
  });

  describe('getDiscoveredCapabilities', () => {
    test('should retrieve capabilities from state', async () => {
      const statePath = path.join(testStateDir, 'get-caps.json');
      await initializeState(statePath);

      const capabilities = {
        skills: [{ name: 'test-skill' }],
        agents: [{ name: 'test-agent' }],
        mcp_servers: [],
        plugins: [],
      };

      await updateDiscoveredCapabilities(statePath, capabilities);

      const retrieved = await getDiscoveredCapabilities(statePath);

      expect(retrieved).toBeDefined();
      expect(retrieved.skills).toHaveLength(1);
      expect(retrieved.agents).toHaveLength(1);
    });

    test('should return null for non-existent state', async () => {
      const statePath = path.join(testStateDir, 'nonexistent.json');

      const retrieved = await getDiscoveredCapabilities(statePath);

      expect(retrieved).toBeNull();
    });

    test('should return default structure for initialized state', async () => {
      const statePath = path.join(testStateDir, 'empty-state.json');
      await initializeState(statePath);

      const retrieved = await getDiscoveredCapabilities(statePath);

      expect(retrieved).toBeDefined();
      expect(retrieved.skills).toEqual([]);
      expect(retrieved.agents).toEqual([]);
    });
  });

  describe('invalidateCache', () => {
    test('should clear all capabilities', async () => {
      const statePath = path.join(testStateDir, 'invalidate.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [{ name: 'skill1' }],
        agents: [{ name: 'agent1' }],
        mcp_servers: [],
        plugins: [],
      });

      await invalidateCache(statePath);

      const state = await readState(statePath);
      expect(state.discovered_capabilities.skills).toEqual([]);
      expect(state.discovered_capabilities.agents).toEqual([]);
    });

    test('should clear specific capability types', async () => {
      const statePath = path.join(testStateDir, 'invalidate-specific.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [{ name: 'skill1' }],
        agents: [{ name: 'agent1' }],
        mcp_servers: [],
        plugins: [],
      });

      await invalidateCache(statePath, { types: ['skills'] });

      const state = await readState(statePath);
      expect(state.discovered_capabilities.skills).toEqual([]);
      expect(state.discovered_capabilities.agents).toHaveLength(1);
    });

    test('should reset timestamp', async () => {
      const statePath = path.join(testStateDir, 'invalidate-ts.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [{ name: 'skill1' }],
        agents: [],
        mcp_servers: [],
        plugins: [],
      });

      const beforeInvalidate = await readState(statePath);
      const oldTimestamp = beforeInvalidate.discovered_capabilities.last_updated;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      await invalidateCache(statePath);

      const afterInvalidate = await readState(statePath);
      expect(afterInvalidate.discovered_capabilities.last_updated).not.toBe(
        oldTimestamp
      );
    });
  });

  describe('isCacheValid', () => {
    test('should return true for fresh cache', async () => {
      const statePath = path.join(testStateDir, 'valid-cache.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [],
        agents: [],
        mcp_servers: [],
        plugins: [],
      });

      const valid = await isCacheValid(statePath, 3600000); // 1 hour

      expect(valid).toBe(true);
    });

    test('should return false for expired cache', async () => {
      const statePath = path.join(testStateDir, 'expired-cache.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [],
        agents: [],
        mcp_servers: [],
        plugins: [],
      });

      const valid = await isCacheValid(statePath, 0); // Immediate expiration

      expect(valid).toBe(false);
    });

    test('should return false for missing state', async () => {
      const statePath = path.join(testStateDir, 'missing-state.json');

      const valid = await isCacheValid(statePath);

      expect(valid).toBe(false);
    });

    test('should return false for state without timestamp', async () => {
      const statePath = path.join(testStateDir, 'no-timestamp.json');
      await initializeState(statePath);

      const valid = await isCacheValid(statePath);

      expect(valid).toBe(false);
    });
  });

  describe('refreshCapabilityCache', () => {
    test('should refresh all capabilities', async () => {
      const statePath = path.join(testStateDir, 'refresh.json');
      const pluginDir = path.join(__dirname, '../../fixtures/plugins');

      const capabilities = await refreshCapabilityCache(statePath, {
        scopes: [{ type: 'local', path: pluginDir }],
      });

      expect(capabilities).toBeDefined();
      expect(capabilities.skills.length).toBeGreaterThan(0);
      expect(capabilities.agents.length).toBeGreaterThan(0);
    });

    test('should update state file', async () => {
      const statePath = path.join(testStateDir, 'refresh-state.json');
      const pluginDir = path.join(__dirname, '../../fixtures/plugins');

      await refreshCapabilityCache(statePath, {
        scopes: [{ type: 'local', path: pluginDir }],
      });

      const state = await readState(statePath);
      expect(state.discovered_capabilities.skills.length).toBeGreaterThan(0);
    });
  });

  describe('getCacheStats', () => {
    test('should return cache statistics', async () => {
      const statePath = path.join(testStateDir, 'stats.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [{ name: 'skill1' }, { name: 'skill2' }],
        agents: [{ name: 'agent1' }],
        mcp_servers: [],
        plugins: [],
      });

      const stats = await getCacheStats(statePath);

      expect(stats).toBeDefined();
      expect(stats.total).toBe(3);
      expect(stats.byType.skills).toBe(2);
      expect(stats.byType.agents).toBe(1);
      expect(stats.age).toBeDefined();
    });

    test('should return null for missing state', async () => {
      const statePath = path.join(testStateDir, 'missing-stats.json');

      const stats = await getCacheStats(statePath);

      expect(stats).toBeNull();
    });
  });

  describe('mergeCapabilities', () => {
    test('should merge new capabilities with existing', async () => {
      const statePath = path.join(testStateDir, 'merge.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [{ name: 'skill1' }],
        agents: [{ name: 'agent1' }],
        mcp_servers: [],
        plugins: [],
      });

      const newCapabilities = {
        skills: [{ name: 'skill2' }],
        agents: [],
      };

      const merged = await mergeCapabilities(statePath, newCapabilities);

      expect(merged.skills).toHaveLength(2);
      expect(merged.agents).toHaveLength(1);
    });

    test('should deduplicate by name', async () => {
      const statePath = path.join(testStateDir, 'merge-dedup.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [{ name: 'skill1', version: '1.0' }],
        agents: [],
        mcp_servers: [],
        plugins: [],
      });

      const newCapabilities = {
        skills: [{ name: 'skill1', version: '2.0' }],
      };

      const merged = await mergeCapabilities(statePath, newCapabilities);

      expect(merged.skills).toHaveLength(1);
      expect(merged.skills[0].version).toBe('2.0');
    });

    test('should support replace strategy', async () => {
      const statePath = path.join(testStateDir, 'merge-replace.json');
      await initializeState(statePath);

      await updateDiscoveredCapabilities(statePath, {
        skills: [{ name: 'skill1' }],
        agents: [{ name: 'agent1' }],
        mcp_servers: [],
        plugins: [],
      });

      const newCapabilities = {
        skills: [{ name: 'skill2' }],
      };

      const merged = await mergeCapabilities(statePath, newCapabilities, {
        strategy: 'replace',
      });

      expect(merged.skills).toHaveLength(1);
      expect(merged.skills[0].name).toBe('skill2');
    });
  });

  describe('Integration tests', () => {
    test('should complete full cache workflow', async () => {
      const statePath = path.join(testStateDir, 'workflow.json');
      const pluginDir = path.join(__dirname, '../../fixtures/plugins');

      // 1. Initialize
      await initializeState(statePath);

      // 2. Refresh cache
      const capabilities = await refreshCapabilityCache(statePath, {
        scopes: [{ type: 'local', path: pluginDir }],
      });

      expect(capabilities.skills.length).toBeGreaterThan(0);

      // 3. Get capabilities
      const retrieved = await getDiscoveredCapabilities(statePath);
      expect(retrieved.skills.length).toBe(capabilities.skills.length);

      // 4. Check validity
      const valid = await isCacheValid(statePath);
      expect(valid).toBe(true);

      // 5. Get stats
      const stats = await getCacheStats(statePath);
      expect(stats.total).toBeGreaterThan(0);

      // 6. Invalidate
      await invalidateCache(statePath);
      const afterInvalidate = await getDiscoveredCapabilities(statePath);
      expect(afterInvalidate.skills).toEqual([]);
    });
  });
});
