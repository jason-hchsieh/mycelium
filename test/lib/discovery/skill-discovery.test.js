/**
 * Tests for Skill Discovery Utility
 *
 * @module test/lib/discovery/skill-discovery.test
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  discoverSkills,
  findSkillsByName,
  findSkillsByTrigger,
  findSkillsByCategory,
  getSkillMetadata,
  parseSkillFrontmatter,
  searchSkillsByKeyword,
  cacheSkills,
} from '../../../lib/discovery/skill-discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, '../../fixtures/plugins');
const testCacheDir = path.join(__dirname, '../../fixtures/cache-test');

describe('Skill Discovery', () => {
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

  describe('discoverSkills', () => {
    test('should discover skills from plugins', async () => {
      const skills = await discoverSkills({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });

    test('should include skill name and plugin source', async () => {
      const skills = await discoverSkills({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const skill = skills[0];
      expect(skill).toHaveProperty('name');
      expect(skill).toHaveProperty('plugin');
    });

    test('should load skill metadata when available', async () => {
      const skills = await discoverSkills({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      const skillWithMetadata = skills.find((s) => s.name === 'test-skill-2');
      expect(skillWithMetadata).toBeDefined();
      expect(skillWithMetadata).toHaveProperty('description');
      expect(skillWithMetadata).toHaveProperty('category');
      expect(skillWithMetadata).toHaveProperty('trigger');
    });

    test('should handle empty directory gracefully', async () => {
      const emptyDir = path.join(testCacheDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      const skills = await discoverSkills({
        scopes: [{ type: 'local', path: emptyDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });

    test('should deduplicate skills from multiple scopes', async () => {
      const skills = await discoverSkills({
        scopes: [
          { type: 'local', path: fixturesDir },
          { type: 'project', path: fixturesDir },
        ],
      });

      const names = skills.map((s) => s.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe('findSkillsByName', () => {
    test('should find skill by exact name', async () => {
      const skills = await findSkillsByName('test-skill-2', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0].name).toBe('test-skill-2');
    });

    test('should find skills by partial name (fuzzy match)', async () => {
      const skills = await findSkillsByName('test', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });

    test('should be case insensitive by default', async () => {
      const skills = await findSkillsByName('TEST-SKILL', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });

    test('should return empty array when no match found', async () => {
      const skills = await findSkillsByName('nonexistent-skill-xyz', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });
  });

  describe('findSkillsByTrigger', () => {
    test('should find skills with specific trigger', async () => {
      const skills = await findSkillsByTrigger('/test-skill-2', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty('trigger');
      expect(skills[0].trigger).toBe('/test-skill-2');
    });

    test('should return empty array when trigger not found', async () => {
      const skills = await findSkillsByTrigger('/nonexistent-trigger', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });

    test('should be case insensitive', async () => {
      const skills = await findSkillsByTrigger('/TEST-SKILL-2', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });
  });

  describe('findSkillsByCategory', () => {
    test('should find skills in specific category', async () => {
      const skills = await findSkillsByCategory('testing', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0].category).toBe('testing');
    });

    test('should return empty array when category not found', async () => {
      const skills = await findSkillsByCategory('nonexistent-category', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });

    test('should be case insensitive', async () => {
      const skills = await findSkillsByCategory('TESTING', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });
  });

  describe('getSkillMetadata', () => {
    test('should extract metadata from SKILL.md file', async () => {
      const skillPath = path.join(
        fixturesDir,
        'test-plugin-2/skills/test-skill-2/SKILL.md'
      );
      const metadata = await getSkillMetadata(skillPath);

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('test-skill-2');
      expect(metadata.description).toBeDefined();
      expect(metadata.category).toBe('testing');
      expect(metadata.trigger).toBe('/test-skill-2');
      expect(metadata.capabilities).toContain('file-io');
    });

    test('should return null for non-existent file', async () => {
      const metadata = await getSkillMetadata('/nonexistent/path.md');

      expect(metadata).toBeNull();
    });

    test('should handle file without frontmatter', async () => {
      const tempPath = path.join(testCacheDir, 'no-frontmatter.md');
      await fs.writeFile(tempPath, '# Skill\n\nNo frontmatter here.');

      const metadata = await getSkillMetadata(tempPath);

      expect(metadata).toBeNull();
    });
  });

  describe('parseSkillFrontmatter', () => {
    test('should parse YAML frontmatter from markdown content', () => {
      const content = `---
name: test-skill
description: A test skill
category: testing
trigger: /test-skill
capabilities:
  - capability1
  - capability2
---

# Skill Content`;

      const metadata = parseSkillFrontmatter(content);

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('test-skill');
      expect(metadata.description).toBe('A test skill');
      expect(metadata.category).toBe('testing');
      expect(metadata.trigger).toBe('/test-skill');
      expect(metadata.capabilities).toContain('capability1');
    });

    test('should return null for content without frontmatter', () => {
      const content = '# Just a heading\n\nNo frontmatter.';
      const metadata = parseSkillFrontmatter(content);

      expect(metadata).toBeNull();
    });

    test('should handle empty content', () => {
      const metadata = parseSkillFrontmatter('');

      expect(metadata).toBeNull();
    });

    test('should handle malformed YAML gracefully', () => {
      const content = `---
name: test
invalid yaml: [missing bracket
---

Content`;

      const metadata = parseSkillFrontmatter(content);

      expect(metadata).toBeNull();
    });
  });

  describe('searchSkillsByKeyword', () => {
    test('should find skills matching keyword in description', async () => {
      const skills = await searchSkillsByKeyword('test skill', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });

    test('should be case insensitive', async () => {
      const skills = await searchSkillsByKeyword('TEST SKILL', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });

    test('should return empty array when no match found', async () => {
      const skills = await searchSkillsByKeyword('xyzzzynonexistent', {
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(0);
    });
  });

  describe('cacheSkills', () => {
    test('should write skills to cache file', async () => {
      const cachePath = path.join(testCacheDir, 'skills.json');
      const skills = [
        { name: 'test-skill', plugin: 'test-plugin', description: 'Test' },
      ];

      await cacheSkills(skills, cachePath);

      const fileExists = await fs
        .access(cachePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    test('should include timestamp in cache', async () => {
      const cachePath = path.join(testCacheDir, 'skills-ts.json');
      const skills = [{ name: 'test-skill' }];

      await cacheSkills(skills, cachePath);

      const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
      expect(cached).toHaveProperty('timestamp');
      expect(cached).toHaveProperty('skills');
    });

    test('should create parent directories if needed', async () => {
      const cachePath = path.join(testCacheDir, 'deep/nested/skills.json');
      const skills = [{ name: 'test-skill' }];

      await cacheSkills(skills, cachePath);

      const fileExists = await fs
        .access(cachePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('Integration tests', () => {
    test('should complete full discovery workflow', async () => {
      const skills = await discoverSkills({
        scopes: [{ type: 'local', path: fixturesDir }],
      });

      expect(skills.length).toBeGreaterThan(0);

      // Search by name
      const byName = await findSkillsByName(skills[0].name, {
        scopes: [{ type: 'local', path: fixturesDir }],
      });
      expect(byName.length).toBeGreaterThan(0);

      // Cache results
      const cachePath = path.join(testCacheDir, 'workflow-skills.json');
      await cacheSkills(skills, cachePath);

      const cached = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
      expect(cached.skills.length).toBe(skills.length);
    });
  });
});
