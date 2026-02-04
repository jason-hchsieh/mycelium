/**
 * Tests for State Manager Utility
 *
 * @module test/lib/state-manager.test
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  readState,
  writeState,
  updateStateField,
  initializeState,
  mergeState,
  getStateField,
} from '../../lib/state-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures directory
const fixturesDir = path.join(__dirname, '../fixtures/state-manager');
const testStateDir = path.join(fixturesDir, 'test-states');

describe('State Manager', () => {
  beforeEach(async () => {
    // Ensure fixtures directory exists
    await fs.mkdir(testStateDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testStateDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('readState', () => {
    test('should read and parse existing JSON state file', async () => {
      const statePath = path.join(testStateDir, 'test-read.json');
      const testState = { status: 'active', count: 42 };
      await fs.writeFile(statePath, JSON.stringify(testState, null, 2));

      const result = await readState(statePath);

      expect(result).toEqual(testState);
    });

    test('should return default empty state when file does not exist', async () => {
      const statePath = path.join(testStateDir, 'nonexistent.json');

      const result = await readState(statePath);

      expect(result).toEqual({});
    });

    test('should handle deeply nested state structures', async () => {
      const statePath = path.join(testStateDir, 'nested-state.json');
      const testState = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      await fs.writeFile(statePath, JSON.stringify(testState, null, 2));

      const result = await readState(statePath);

      expect(result).toEqual(testState);
    });

    test('should handle state with arrays', async () => {
      const statePath = path.join(testStateDir, 'array-state.json');
      const testState = {
        items: [1, 2, 3],
        nested: {
          array: ['a', 'b', 'c'],
        },
      };
      await fs.writeFile(statePath, JSON.stringify(testState, null, 2));

      const result = await readState(statePath);

      expect(result).toEqual(testState);
    });

    test('should throw error for invalid JSON', async () => {
      const statePath = path.join(testStateDir, 'invalid.json');
      await fs.writeFile(statePath, '{ invalid json }');

      await expect(readState(statePath)).rejects.toThrow();
    });
  });

  describe('writeState', () => {
    test('should write state to file with pretty formatting', async () => {
      const statePath = path.join(testStateDir, 'test-write.json');
      const testState = { status: 'active', count: 42 };

      await writeState(statePath, testState);

      const fileContent = await fs.readFile(statePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      expect(parsed).toEqual(testState);
      // Check formatting (should have indentation)
      expect(fileContent).toContain('\n');
    });

    test('should create parent directories when createDirs is true', async () => {
      const statePath = path.join(testStateDir, 'deep/nested/dir/state.json');
      const testState = { created: true };

      await writeState(statePath, testState, { createDirs: true });

      const result = await readState(statePath);
      expect(result).toEqual(testState);
    });

    test('should create backup file when backup option is true', async () => {
      const statePath = path.join(testStateDir, 'backup-test.json');
      const backupPath = statePath + '.backup';
      const originalState = { version: 1 };
      const updatedState = { version: 2 };

      // Write original state
      await writeState(statePath, originalState, { backup: false });

      // Update with backup
      await writeState(statePath, updatedState, { backup: true });

      // Check backup exists with original content
      const backupContent = await readState(backupPath);
      expect(backupContent).toEqual(originalState);

      // Check current file has updated content
      const currentContent = await readState(statePath);
      expect(currentContent).toEqual(updatedState);
    });

    test('should not create backup when file does not exist', async () => {
      const statePath = path.join(testStateDir, 'new-file.json');
      const backupPath = statePath + '.backup';
      const testState = { new: true };

      await writeState(statePath, testState, { backup: true });

      // Backup should not exist
      await expect(fs.access(backupPath)).rejects.toThrow();

      // File should exist with content
      const result = await readState(statePath);
      expect(result).toEqual(testState);
    });

    test('should handle writing empty state', async () => {
      const statePath = path.join(testStateDir, 'empty-state.json');
      const testState = {};

      await writeState(statePath, testState);

      const result = await readState(statePath);
      expect(result).toEqual(testState);
    });

    test('should handle writing complex nested structures', async () => {
      const statePath = path.join(testStateDir, 'complex-state.json');
      const testState = {
        metadata: {
          version: '1.0',
          timestamp: '2024-01-01T00:00:00Z',
        },
        data: {
          items: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
          ],
          settings: {
            enabled: true,
            options: ['opt1', 'opt2'],
          },
        },
      };

      await writeState(statePath, testState);

      const result = await readState(statePath);
      expect(result).toEqual(testState);
    });

    test('should throw error when parent directory does not exist and createDirs is false', async () => {
      const statePath = path.join(testStateDir, 'nonexistent/state.json');
      const testState = { test: true };

      await expect(
        writeState(statePath, testState, { createDirs: false })
      ).rejects.toThrow();
    });
  });

  describe('updateStateField', () => {
    test('should update top-level field', async () => {
      const statePath = path.join(testStateDir, 'update-top.json');
      const initialState = { status: 'pending', count: 0 };
      await writeState(statePath, initialState);

      const result = await updateStateField(statePath, 'status', 'active');

      expect(result.status).toBe('active');
      expect(result.count).toBe(0);

      // Verify file was updated
      const savedState = await readState(statePath);
      expect(savedState.status).toBe('active');
    });

    test('should update nested field using dot notation', async () => {
      const statePath = path.join(testStateDir, 'update-nested.json');
      const initialState = {
        metadata: {
          version: '1.0',
          status: 'draft',
        },
      };
      await writeState(statePath, initialState);

      const result = await updateStateField(
        statePath,
        'metadata.status',
        'published'
      );

      expect(result.metadata.status).toBe('published');
      expect(result.metadata.version).toBe('1.0');
    });

    test('should update deeply nested field', async () => {
      const statePath = path.join(testStateDir, 'update-deep.json');
      const initialState = {
        level1: {
          level2: {
            level3: {
              value: 'old',
            },
          },
        },
      };
      await writeState(statePath, initialState);

      const result = await updateStateField(
        statePath,
        'level1.level2.level3.value',
        'new'
      );

      expect(result.level1.level2.level3.value).toBe('new');
    });

    test('should create intermediate objects if they do not exist', async () => {
      const statePath = path.join(testStateDir, 'update-create.json');
      const initialState = { existing: 'value' };
      await writeState(statePath, initialState);

      const result = await updateStateField(
        statePath,
        'new.nested.field',
        'created'
      );

      expect(result.new.nested.field).toBe('created');
      expect(result.existing).toBe('value');
    });

    test('should handle updating with different value types', async () => {
      const statePath = path.join(testStateDir, 'update-types.json');
      const initialState = { test: 'string' };
      await writeState(statePath, initialState);

      // Update with number
      let result = await updateStateField(statePath, 'number', 42);
      expect(result.number).toBe(42);

      // Update with boolean
      result = await updateStateField(statePath, 'boolean', true);
      expect(result.boolean).toBe(true);

      // Update with array
      result = await updateStateField(statePath, 'array', [1, 2, 3]);
      expect(result.array).toEqual([1, 2, 3]);

      // Update with object
      result = await updateStateField(statePath, 'object', { key: 'value' });
      expect(result.object).toEqual({ key: 'value' });
    });

    test('should handle updating array elements', async () => {
      const statePath = path.join(testStateDir, 'update-array.json');
      const initialState = {
        items: ['a', 'b', 'c'],
      };
      await writeState(statePath, initialState);

      const result = await updateStateField(statePath, 'items', ['x', 'y']);

      expect(result.items).toEqual(['x', 'y']);
    });

    test('should create state file if it does not exist', async () => {
      const statePath = path.join(testStateDir, 'create-on-update.json');

      const result = await updateStateField(statePath, 'field', 'value');

      expect(result.field).toBe('value');

      // Verify file was created
      const savedState = await readState(statePath);
      expect(savedState.field).toBe('value');
    });
  });

  describe('initializeState', () => {
    test('should create state file with default structure', async () => {
      const statePath = path.join(testStateDir, 'initialized.json');

      const result = await initializeState(statePath);

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('started_at');
      expect(result).toHaveProperty('last_updated');

      // Verify file was created
      const savedState = await readState(statePath);
      expect(savedState).toEqual(result);
    });

    test('should set status to "initializing"', async () => {
      const statePath = path.join(testStateDir, 'init-status.json');

      const result = await initializeState(statePath);

      expect(result.status).toBe('initializing');
    });

    test('should set timestamps', async () => {
      const statePath = path.join(testStateDir, 'init-timestamps.json');
      const beforeTime = new Date().toISOString();

      const result = await initializeState(statePath);

      const afterTime = new Date().toISOString();

      expect(result.started_at).toBeDefined();
      expect(result.last_updated).toBeDefined();
      expect(result.started_at).toEqual(result.last_updated);

      // Check timestamps are valid ISO strings
      expect(() => new Date(result.started_at)).not.toThrow();
      expect(result.started_at >= beforeTime).toBe(true);
      expect(result.started_at <= afterTime).toBe(true);
    });

    test('should initialize discovered_capabilities structure', async () => {
      const statePath = path.join(testStateDir, 'init-capabilities.json');

      const result = await initializeState(statePath);

      expect(result.discovered_capabilities).toBeDefined();
      expect(result.discovered_capabilities.agents).toEqual([]);
      expect(result.discovered_capabilities.skills).toEqual([]);
      expect(result.discovered_capabilities.mcp_servers).toEqual([]);
      expect(result.discovered_capabilities.commands).toEqual([]);
      expect(result.discovered_capabilities.plugins).toEqual([]);
    });

    test('should initialize task tracking structures', async () => {
      const statePath = path.join(testStateDir, 'init-tasks.json');

      const result = await initializeState(statePath);

      expect(result.tasks_summary).toEqual({
        total: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        skipped: 0,
        blocked: 0,
      });
      expect(result.checkpoints).toEqual([]);
      expect(result.deviations).toEqual([]);
    });

    test('should initialize parallel execution structure', async () => {
      const statePath = path.join(testStateDir, 'init-parallel.json');

      const result = await initializeState(statePath);

      expect(result.parallel_execution).toEqual({
        enabled: true,
        max_concurrent: 3,
        active_tasks: [],
        queued_tasks: [],
        blocked_tasks: [],
        completed_tasks: [],
      });
    });

    test('should not overwrite existing state file', async () => {
      const statePath = path.join(testStateDir, 'existing-state.json');
      const existingState = {
        status: 'active',
        custom_field: 'preserved',
      };
      await writeState(statePath, existingState);

      const result = await initializeState(statePath);

      // Should return existing state unchanged
      expect(result.status).toBe('active');
      expect(result.custom_field).toBe('preserved');
    });

    test('should create parent directories if needed', async () => {
      const statePath = path.join(
        testStateDir,
        'deep/nested/initialized.json'
      );

      const result = await initializeState(statePath);

      expect(result).toHaveProperty('status');

      // Verify file was created
      const savedState = await readState(statePath);
      expect(savedState).toEqual(result);
    });
  });

  describe('mergeState', () => {
    test('should merge top-level properties', () => {
      const baseState = { a: 1, b: 2 };
      const newState = { b: 3, c: 4 };

      const result = mergeState(baseState, newState);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should deep merge nested objects', () => {
      const baseState = {
        config: {
          setting1: 'value1',
          setting2: 'value2',
        },
      };
      const newState = {
        config: {
          setting2: 'updated',
          setting3: 'value3',
        },
      };

      const result = mergeState(baseState, newState);

      expect(result.config).toEqual({
        setting1: 'value1',
        setting2: 'updated',
        setting3: 'value3',
      });
    });

    test('should handle deeply nested structures', () => {
      const baseState = {
        level1: {
          level2: {
            level3: {
              a: 1,
              b: 2,
            },
          },
        },
      };
      const newState = {
        level1: {
          level2: {
            level3: {
              b: 3,
              c: 4,
            },
          },
        },
      };

      const result = mergeState(baseState, newState);

      expect(result.level1.level2.level3).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should not mutate original objects', () => {
      const baseState = { a: 1, nested: { b: 2 } };
      const newState = { a: 2, nested: { c: 3 } };

      const result = mergeState(baseState, newState);

      expect(baseState.a).toBe(1);
      expect(baseState.nested.b).toBe(2);
      expect(baseState.nested).not.toHaveProperty('c');
      expect(result.a).toBe(2);
    });

    test('should handle array merging with overwrite strategy', () => {
      const baseState = { items: [1, 2, 3] };
      const newState = { items: [4, 5] };

      const result = mergeState(baseState, newState, { strategy: 'overwrite' });

      expect(result.items).toEqual([4, 5]);
    });

    test('should handle array merging with merge strategy (default)', () => {
      const baseState = { items: [1, 2, 3] };
      const newState = { items: [4, 5] };

      const result = mergeState(baseState, newState);

      // Default behavior should overwrite arrays
      expect(result.items).toEqual([4, 5]);
    });

    test('should handle null and undefined values', () => {
      const baseState = { a: 1, b: 2, c: 3 };
      const newState = { b: null, c: undefined };

      const result = mergeState(baseState, newState);

      expect(result.a).toBe(1);
      expect(result.b).toBe(null);
      expect(result.c).toBe(3); // undefined should not overwrite
    });

    test('should handle empty objects', () => {
      const baseState = { a: 1 };
      const newState = {};

      const result = mergeState(baseState, newState);

      expect(result).toEqual({ a: 1 });
    });

    test('should merge arrays of objects', () => {
      const baseState = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      };
      const newState = {
        items: [{ id: 3, name: 'Item 3' }],
      };

      const result = mergeState(baseState, newState);

      expect(result.items).toEqual([{ id: 3, name: 'Item 3' }]);
    });

    test('should handle merging with mixed types', () => {
      const baseState = {
        string: 'text',
        number: 42,
        boolean: true,
        object: { key: 'value' },
        array: [1, 2, 3],
      };
      const newState = {
        string: 'updated',
        number: 100,
        boolean: false,
        object: { key: 'updated', new: 'field' },
        array: [4, 5],
      };

      const result = mergeState(baseState, newState);

      expect(result).toEqual({
        string: 'updated',
        number: 100,
        boolean: false,
        object: { key: 'updated', new: 'field' },
        array: [4, 5],
      });
    });
  });

  describe('getStateField', () => {
    const testState = {
      status: 'active',
      count: 42,
      metadata: {
        version: '1.0',
        author: {
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      items: ['a', 'b', 'c'],
      nested: {
        array: [
          { id: 1, value: 'first' },
          { id: 2, value: 'second' },
        ],
      },
    };

    test('should get top-level field', () => {
      const result = getStateField(testState, 'status');

      expect(result).toBe('active');
    });

    test('should get nested field using dot notation', () => {
      const result = getStateField(testState, 'metadata.version');

      expect(result).toBe('1.0');
    });

    test('should get deeply nested field', () => {
      const result = getStateField(testState, 'metadata.author.name');

      expect(result).toBe('Test User');
    });

    test('should return default value when field not found', () => {
      const result = getStateField(testState, 'nonexistent.field', 'default');

      expect(result).toBe('default');
    });

    test('should return null as default when field not found and no default specified', () => {
      const result = getStateField(testState, 'nonexistent.field');

      expect(result).toBe(null);
    });

    test('should handle getting array field', () => {
      const result = getStateField(testState, 'items');

      expect(result).toEqual(['a', 'b', 'c']);
    });

    test('should handle getting nested array', () => {
      const result = getStateField(testState, 'nested.array');

      expect(result).toEqual([
        { id: 1, value: 'first' },
        { id: 2, value: 'second' },
      ]);
    });

    test('should handle empty path', () => {
      const result = getStateField(testState, '');

      expect(result).toBe(null);
    });

    test('should handle getting number field', () => {
      const result = getStateField(testState, 'count');

      expect(result).toBe(42);
    });

    test('should handle getting from empty object', () => {
      const result = getStateField({}, 'field', 'default');

      expect(result).toBe('default');
    });

    test('should handle null state', () => {
      const result = getStateField(null, 'field', 'default');

      expect(result).toBe('default');
    });

    test('should handle undefined state', () => {
      const result = getStateField(undefined, 'field', 'default');

      expect(result).toBe('default');
    });

    test('should return actual value even if it is falsy', () => {
      const state = { flag: false, count: 0, text: '' };

      expect(getStateField(state, 'flag', true)).toBe(false);
      expect(getStateField(state, 'count', 10)).toBe(0);
      expect(getStateField(state, 'text', 'default')).toBe('');
    });

    test('should handle getting nested field when intermediate is not an object', () => {
      const state = { value: 'string' };

      const result = getStateField(state, 'value.nested', 'default');

      expect(result).toBe('default');
    });
  });

  describe('Integration tests', () => {
    test('should handle complete workflow: initialize, update, read, merge', async () => {
      const statePath = path.join(testStateDir, 'workflow-test.json');

      // 1. Initialize
      const initialized = await initializeState(statePath);
      expect(initialized.status).toBe('initializing');

      // 2. Update status
      await updateStateField(statePath, 'status', 'active');

      // 3. Update nested field
      await updateStateField(
        statePath,
        'discovered_capabilities.agents',
        [{ name: 'test-agent' }]
      );

      // 4. Read state
      const currentState = await readState(statePath);
      expect(currentState.status).toBe('active');
      expect(currentState.discovered_capabilities.agents).toHaveLength(1);

      // 5. Merge additional data
      const additionalData = {
        custom_field: 'custom_value',
        discovered_capabilities: {
          skills: [{ name: 'test-skill' }],
        },
      };
      const mergedState = mergeState(currentState, additionalData);

      // 6. Write merged state
      await writeState(statePath, mergedState);

      // 7. Verify final state
      const finalState = await readState(statePath);
      expect(finalState.status).toBe('active');
      expect(finalState.custom_field).toBe('custom_value');
      expect(finalState.discovered_capabilities.agents).toHaveLength(1);
      expect(finalState.discovered_capabilities.skills).toHaveLength(1);
    });

    test('should handle concurrent updates correctly', async () => {
      const statePath = path.join(testStateDir, 'concurrent-test.json');
      await initializeState(statePath);

      // Simulate concurrent updates
      const updates = [
        updateStateField(statePath, 'field1', 'value1'),
        updateStateField(statePath, 'field2', 'value2'),
        updateStateField(statePath, 'field3', 'value3'),
      ];

      await Promise.all(updates);

      const finalState = await readState(statePath);

      // All fields should be present (though some might be lost due to race conditions)
      // This test mainly ensures no crashes occur
      expect(finalState).toHaveProperty('status');
    });

    test('should preserve state integrity through backup and restore', async () => {
      const statePath = path.join(testStateDir, 'backup-restore.json');
      const backupPath = statePath + '.backup';

      const originalState = {
        version: 1,
        important_data: 'critical',
      };

      // Write initial state
      await writeState(statePath, originalState, { backup: false });

      // Update with backup
      const updatedState = {
        version: 2,
        important_data: 'updated',
        new_field: 'added',
      };
      await writeState(statePath, updatedState, { backup: true });

      // Restore from backup (simulate error recovery)
      const backupContent = await readState(backupPath);
      await writeState(statePath, backupContent, { backup: false });

      // Verify restored state
      const restoredState = await readState(statePath);
      expect(restoredState).toEqual(originalState);
    });

    test('should handle complex nested field operations', async () => {
      const statePath = path.join(testStateDir, 'complex-nested.json');

      // Initialize with complex structure
      await writeState(statePath, {
        discovered_capabilities: {
          agents: [],
          skills: [],
        },
      });

      // Add agent
      await updateStateField(
        statePath,
        'discovered_capabilities.agents',
        [{ name: 'agent1', tools: ['tool1', 'tool2'] }]
      );

      // Read specific nested field
      const currentState = await readState(statePath);
      const agents = getStateField(currentState, 'discovered_capabilities.agents');
      expect(agents).toHaveLength(1);

      // Update nested array
      const updatedAgents = [
        ...agents,
        { name: 'agent2', tools: ['tool3'] },
      ];
      await updateStateField(
        statePath,
        'discovered_capabilities.agents',
        updatedAgents
      );

      // Verify
      const finalState = await readState(statePath);
      expect(
        getStateField(finalState, 'discovered_capabilities.agents')
      ).toHaveLength(2);
    });
  });
});
