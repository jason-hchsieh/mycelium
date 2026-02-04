import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  validateConfig,
  loadSchema,
  validateWorkflow,
  validatePluginSpec,
  validateState
} from '../../lib/schema-validator.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, '../fixtures');

describe('schema-validator', () => {
  describe('loadSchema', () => {
    test('loads a valid schema file', async () => {
      const schemaPath = join(fixturesDir, 'schemas/workflow-config.schema.json');
      const schema = await loadSchema(schemaPath);

      expect(schema).toBeDefined();
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.type).toBe('object');
    });

    test('caches loaded schemas', async () => {
      const schemaPath = join(fixturesDir, 'schemas/workflow-config.schema.json');

      const start1 = Date.now();
      await loadSchema(schemaPath);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await loadSchema(schemaPath);
      const time2 = Date.now() - start2;

      // Second load should be faster (cached)
      expect(time2).toBeLessThanOrEqual(time1);
    });

    test('throws error for non-existent schema', async () => {
      await expect(loadSchema('/non/existent/schema.json'))
        .rejects.toThrow();
    });

    test('throws error for invalid JSON', async () => {
      const invalidPath = join(fixturesDir, 'templates/sample_template.md');
      await expect(loadSchema(invalidPath))
        .rejects.toThrow();
    });
  });

  describe('validateConfig', () => {
    test('validates valid config against schema', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const config = { name: 'Test', age: 25 };
      const result = await validateConfig(config, schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('returns errors for invalid config', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const config = { age: 'not a number' };
      const result = await validateConfig(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some(e => e.includes('required'))).toBe(true);
    });

    test('supports strict mode to reject unknown properties', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        additionalProperties: false
      };

      const config = { name: 'Test', extra: 'field' };
      const result = await validateConfig(config, schema, { strict: true });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('additional'))).toBe(true);
    });

    test('formats errors with detailed messages', async () => {
      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      };

      const config = { items: [1, 2, 3] };
      const result = await validateConfig(config, schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('items');
    });
  });

  describe('validateWorkflow', () => {
    test('validates valid workflow config', async () => {
      const workflow = {
        name: 'test-workflow',
        version: '1.0.0',
        phases: ['planning', 'execution'],
        metadata: {}
      };

      const result = await validateWorkflow(workflow, { schemaDir: join(fixturesDir, 'schemas') });
      expect(result.valid).toBe(true);
    });

    test('rejects workflow without required fields', async () => {
      const workflow = {
        version: '1.0.0'
      };

      const result = await validateWorkflow(workflow, { schemaDir: join(fixturesDir, 'schemas') });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });
  });

  describe('validatePluginSpec', () => {
    test('validates valid plugin spec', async () => {
      const pluginSpec = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        author: 'Test Author'
      };

      const result = await validatePluginSpec(pluginSpec, { schemaDir: join(fixturesDir, 'schemas') });
      expect(result.valid).toBe(true);
    });

    test('rejects plugin spec without required fields', async () => {
      const pluginSpec = {
        version: '1.0.0'
      };

      const result = await validatePluginSpec(pluginSpec, { schemaDir: join(fixturesDir, 'schemas') });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateState', () => {
    test('validates valid state object', async () => {
      const state = JSON.parse(
        readFileSync(join(fixturesDir, 'states/sample_session_state.json'), 'utf-8')
      );

      const result = await validateState(state, { schemaDir: join(fixturesDir, 'schemas') });
      expect(result.valid).toBe(true);
    });

    test('rejects state without required fields', async () => {
      const state = {
        session_id: 'test'
      };

      const result = await validateState(state, { schemaDir: join(fixturesDir, 'schemas') });
      expect(result.valid).toBe(false);
    });
  });

  describe('integration with real schemas', () => {
    test('validates all test schemas in test fixtures', async () => {
      const schemaFiles = [
        'workflow-config.schema.json',
        'plugin-spec.schema.json',
        'session-state.schema.json'
      ];

      for (const file of schemaFiles) {
        const schemaPath = join(fixturesDir, 'schemas', file);
        const schema = await loadSchema(schemaPath);
        expect(schema).toBeDefined();
        expect(schema.$schema).toBeDefined();
      }
    });
  });
});
