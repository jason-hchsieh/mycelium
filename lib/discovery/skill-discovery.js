/**
 * Skill Discovery Utility
 *
 * Discovers available skills by name, description, or capability matching.
 * Integrates with plugin systems and project-specific skills.
 *
 * @module lib/discovery/skill-discovery
 */

import { promises as fs } from 'fs';
import path from 'path';
import { scanPlugins } from './capability-scanner.js';

/**
 * Discover all available skills
 *
 * @param {Object} options - Discovery options
 * @param {Array<{type: string, path: string}>} options.scopes - Scopes to search
 * @returns {Promise<Array<{name: string, plugin: string, description?: string, category?: string, trigger?: string, capabilities?: string[], path?: string}>>} All skills
 */
export async function discoverSkills(options = {}) {
  const { scopes = [] } = options;
  const plugins = await scanPlugins({ scopes });
  const skills = [];
  const seenSkills = new Set();

  for (const plugin of plugins) {
    for (const skillName of plugin.skills || []) {
      if (seenSkills.has(skillName)) continue;
      seenSkills.add(skillName);

      const skill = {
        name: skillName,
        plugin: plugin.name,
      };

      // Try to load metadata from SKILL.md file
      const skillPath = path.join(
        plugin.path,
        'skills',
        skillName,
        'SKILL.md'
      );
      const metadata = await getSkillMetadata(skillPath);

      if (metadata) {
        Object.assign(skill, metadata);
        skill.path = skillPath;
      }

      skills.push(skill);
    }
  }

  return skills;
}

/**
 * Find skills by name (fuzzy match)
 *
 * @param {string} name - Skill name to search
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching skills
 */
export async function findSkillsByName(name, options = {}) {
  const skills = await discoverSkills(options);
  const searchTerm = name.toLowerCase();

  return skills.filter((skill) => skill.name.toLowerCase().includes(searchTerm));
}

/**
 * Find skills by trigger
 *
 * @param {string} trigger - Trigger to search
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching skills
 */
export async function findSkillsByTrigger(trigger, options = {}) {
  const skills = await discoverSkills(options);
  const searchTerm = trigger.toLowerCase();

  return skills.filter(
    (skill) => skill.trigger && skill.trigger.toLowerCase() === searchTerm
  );
}

/**
 * Find skills by category
 *
 * @param {string} category - Category to search
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching skills
 */
export async function findSkillsByCategory(category, options = {}) {
  const skills = await discoverSkills(options);
  const searchTerm = category.toLowerCase();

  return skills.filter(
    (skill) => skill.category && skill.category.toLowerCase() === searchTerm
  );
}

/**
 * Get skill metadata from SKILL.md file
 *
 * @param {string} skillPath - Path to SKILL.md file
 * @returns {Promise<Object|null>} Skill metadata or null
 */
export async function getSkillMetadata(skillPath) {
  try {
    const content = await fs.readFile(skillPath, 'utf-8');
    return parseSkillFrontmatter(content);
  } catch (error) {
    return null;
  }
}

/**
 * Parse YAML frontmatter from skill markdown
 *
 * @param {string} content - Markdown content
 * @returns {Object|null} Parsed metadata or null
 */
export function parseSkillFrontmatter(content) {
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
 * Search skills by keyword in description or name
 *
 * @param {string} keyword - Keyword to search
 * @param {Object} options - Search options
 * @returns {Promise<Array<Object>>} Matching skills
 */
export async function searchSkillsByKeyword(keyword, options = {}) {
  const skills = await discoverSkills(options);
  const searchTerm = keyword.toLowerCase();

  const results = [];

  for (const skill of skills) {
    const nameMatch = skill.name.toLowerCase().includes(searchTerm);
    const descMatch =
      skill.description && skill.description.toLowerCase().includes(searchTerm);

    // Also check full markdown content if path is available
    let contentMatch = false;
    if (skill.path) {
      try {
        const content = await fs.readFile(skill.path, 'utf-8');
        contentMatch = content.toLowerCase().includes(searchTerm);
      } catch (error) {
        // Ignore read errors
      }
    }

    if (nameMatch || descMatch || contentMatch) {
      results.push(skill);
    }
  }

  return results;
}

/**
 * Cache skill metadata for faster lookups
 *
 * @param {Array<Object>} skills - Skills to cache
 * @param {string} cachePath - Path to cache file
 * @returns {Promise<void>}
 */
export async function cacheSkills(skills, cachePath) {
  const cacheData = {
    timestamp: Date.now(),
    skills: skills,
  };

  const dir = path.dirname(cachePath);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
}
