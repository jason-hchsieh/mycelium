/**
 * Tests for Agent Discovery Utility
 *
 * @module test/lib/discovery/agent-discovery.test
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  discoverAgents,
  findAgentsByName,
  findAgentsByCapability,
  findAgentsByCategory,
  getAgentMetadata,
  parseAgentFrontmatter,
  searchAgentsByKeyword,
  cacheAgents,
} from '../../../lib/discovery/agent-discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../../fixtures/plugins');
const testCacheDir = path.join(__dirname, '../../fixtures/cache-test');

describe('Agent Discovery', () => {
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

  describe('discoverAgents', () => {
    test('should discover agents from plugins', async () => {
      const agents = await discoverAgents({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    test('should include agent name and plugin source', async () => {
      const agents = await discoverAgents({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const agent = agents[0];
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('plugin');
    });

    test('should load agent metadata when available', async () => {
      const agents = await discoverAgents({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const agentWithMetadata = agents.find((a) => a.name === 'test-agent-2');
      expect(agentWithMetadata).toBeDefined();
      expect(agentWithMetadata).toHaveProperty('description');
      expect(agentWithMetadata).toHaveProperty('category');
    });

    test('should handle empty directory gracefully', async () => {
      const emptyDir = path.join(testCacheDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      const agents = await discoverAgents({
        scopes: [{ type: 'local', path: emptyDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
    });

    test('should deduplicate agents from multiple scopes', async () => {
      const agents = await discoverAgents({
        scopes: [
          { type: 'local', path: fixturesDir },
          { type: 'project', path: fixturesDir },
        ],
      });

      const names = agents.map((a) => a.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('findAgentsByName', () => {
    test('should find agent by exact name', async () => {
      const agents = await findAgentsByName('test-agent-2', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents[0].name).toBe('test-agent-2');
    });

    test('should find agents by partial name (fuzzy match)', async () => {
      const agents = await findAgentsByName('test', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    test('should be case insensitive by default', async () => {
      const agents = await findAgentsByName('TEST-AGENT', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    test('should return empty array when no match found', async () => {
      const agents = await findAgentsByName('nonexistent-agent-xyz', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
    });
  });

  describe('findAgentsByCapability', () => {
    test('should find agents with specific capability', async () => {
      const agents = await findAgentsByCapability('code-review', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents[0]).toHaveProperty('capabilities');
      expect(agents[0].capabilities).toContain('code-review');
    });

    test('should return empty array when capability not found', async () => {
      const agents = await findAgentsByCapability('nonexistent-capability', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
    });

    test('should be case insensitive', async () => {
      const agents = await findAgentsByCapability('CODE-REVIEW', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });
  });

  describe('findAgentsByCategory', () => {
    test('should find agents in specific category', async () => {
      const agents = await findAgentsByCategory('development', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents[0].category).toBe('development');
    });

    test('should return empty array when category not found', async () => {
      const agents = await findAgentsByCategory('nonexistent-category', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
    });

    test('should be case insensitive', async () => {
      const agents = await findAgentsByCategory('DEVELOPMENT', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });
  });

  describe('getAgentMetadata', () => {
    test('should extract metadata from agent markdown file', async () => {
      const agentPath = path.join(
        fixturesDir,
        'test-plugin-2/agents/test-agent-2.md'
      );
      const metadata = await getAgentMetadata(agentPath);

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('test-agent-2');
      expect(metadata.description).toBeDefined();
      expect(metadata.category).toBe('development');
      expect(metadata.capabilities).toContain('code-review');
    });

    test('should return null for non-existent file', async () => {
      const metadata = await getAgentMetadata('/nonexistent/path.md');

      expect(metadata).toBeNull();
    });

    test('should handle file without frontmatter', async () => {
      const tempPath = path.join(testCacheDir, 'no-frontmatter.md');
      await fs.writeFile(tempPath, '# Agent\n\nNo frontmatter here.');

      const metadata = await getAgentMetadata(tempPath);

      expect(metadata).toBeNull();
    });
  });

  describe('parseAgentFrontmatter', () => {
    test('should parse YAML frontmatter from markdown content', () => {
      const content = `---
name: test-agent
description: A test agent
category: testing
capabilities:
  - capability1
  - capability2
---

# Agent Content`;

      const metadata = parseAgentFrontmatter(content);

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('test-agent');
      expect(metadata.description).toBe('A test agent');
      expect(metadata.category).toBe('testing');
      expect(metadata.capabilities).toContain('capability1');
    });

    test('should return null for content without frontmatter', () => {
      const content = '# Just a heading\n\nNo frontmatter.';
      const metadata = parseAgentFrontmatter(content);

      expect(metadata).toBeNull();
    });

    test('should handle empty content', () => {
      const metadata = parseAgentFrontmatter('');

      expect(metadata).toBeNull();
    });

    test('should handle malformed YAML gracefully', () => {
      const content = `---
name: test
invalid yaml: [missing bracket
---

Content`;

      const metadata = parseAgentFrontmatter(content);

      expect(metadata).toBeNull();
    });
  });

  describe('searchAgentsByKeyword', () => {
    test('should find agents matching keyword in description', async () => {
      const agents = await searchAgentsByKeyword('code review', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    test('should be case insensitive', async () => {
      const agents = await searchAgentsByKeyword('CODE REVIEW', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    test('should return empty array when no match found', async () => {
      const agents = await searchAgentsByKeyword('xyzzzynonexistent', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
    });
  });

  describe('cacheAgents', () => {
    test('should write agents to cache file', async () => {
      const cachePath = path.join(testCacheDir, 'agents.json');
      const agents = [
        { name: 'test-agent', plugin: 'test-plugin', description: 'Test' },
      ];

      await cacheAgents(agents, cachePath);

      const fileExists = await fs
        .access(cachePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should include timestamp in cache', async () => {
      const cachePath = path.join(testCacheDir, 'agents-ts.json');
      const agents = [{ name: 'test-agent' }];

      await cacheAgents(agents, cachePath);

      const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
      expect(cached).toHaveProperty('timestamp');
      expect(cached).toHaveProperty('agents');
    });

    test('should create parent directories if needed', async () => {
      const cachePath = path.join(testCacheDir, 'deep/nested/agents.json');
      const agents = [{ name: 'test-agent' }];

      await cacheAgents(agents, cachePath);

      const fileExists = await fs
        .access(cachePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('Integration tests', () => {
    test('should complete full discovery workflow', async () => {
      const agents = await discoverAgents({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(agents.length).toBeGreaterThan(0);

      // Search by name
      const byName = await findAgentsByName(agents[0].name, {
        scopes: [{ type: 'local', path: fixturesDir }],
      });
      expect(byName.length).toBeGreaterThan(0);

      // Cache results
      const cachePath = path.join(testCacheDir, 'workflow-agents.json');
      await cacheAgents(agents, cachePath);

      const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
      expect(cached.agents.length).toBe(agents.length);
    });
  });
});
