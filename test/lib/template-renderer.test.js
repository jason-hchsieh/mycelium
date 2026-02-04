import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  render,
  renderWithEnv,
  renderObject,
  validateTemplate,
  extractVariables,
  addFilter
} from '../../lib/template-renderer.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, '../fixtures');

describe('template-renderer', () => {
  describe('extractVariables', () => {
    test('extracts simple variables', () => {
      const template = 'Hello {{name}}, welcome to {{city}}!';
      const variables = extractVariables(template);

      expect(variables).toContain('name');
      expect(variables).toContain('city');
      expect(variables).toHaveLength(2);
    });

    test('extracts nested object variables', () => {
      const template = '{{user.name}} works at {{user.company}}';
      const variables = extractVariables(template);

      expect(variables).toContain('user.name');
      expect(variables).toContain('user.company');
    });

    test('extracts array index variables', () => {
      const template = '{{items[0]}} and {{items[1]}}';
      const variables = extractVariables(template);

      expect(variables).toContain('items[0]');
      expect(variables).toContain('items[1]');
    });

    test('handles templates with no variables', () => {
      const template = 'Hello world!';
      const variables = extractVariables(template);

      expect(variables).toEqual([]);
    });

    test('deduplicates repeated variables', () => {
      const template = '{{name}} and {{name}} and {{name}}';
      const variables = extractVariables(template);

      expect(variables).toEqual(['name']);
    });
  });

  describe('render', () => {
    test('renders simple variable substitution', async () => {
      const template = 'Hello {{name}}!';
      const context = { name: 'World' };

      const result = await render(template, context);
      expect(result).toBe('Hello World!');
    });

    test('renders multiple variables', async () => {
      const template = '{{greeting}} {{name}}, welcome to {{city}}!';
      const context = {
        greeting: 'Hello',
        name: 'Alice',
        city: 'Wonderland'
      };

      const result = await render(template, context);
      expect(result).toBe('Hello Alice, welcome to Wonderland!');
    });

    test('renders nested object access', async () => {
      const template = '{{user.name}} works at {{user.company}}!';
      const context = {
        user: {
          name: 'Bob',
          company: 'Acme Corp'
        }
      };

      const result = await render(template, context);
      expect(result).toBe('Bob works at Acme Corp!');
    });

    test('renders array indexing', async () => {
      const template = 'First: {{items[0]}}, Second: {{items[1]}}';
      const context = {
        items: ['apple', 'banana', 'cherry']
      };

      const result = await render(template, context);
      expect(result).toBe('First: apple, Second: banana');
    });

    test('throws error on missing variable in strict mode', async () => {
      const template = 'Hello {{name}}!';
      const context = {};

      await expect(render(template, context, { strict: true }))
        .rejects.toThrow('Missing variable');
    });

    test('leaves placeholder on missing variable in non-strict mode', async () => {
      const template = 'Hello {{name}}!';
      const context = {};

      const result = await render(template, context, { strict: false });
      expect(result).toBe('Hello {{name}}!');
    });

    test('renders numbers and booleans', async () => {
      const template = 'Count: {{count}}, Active: {{active}}';
      const context = {
        count: 42,
        active: true
      };

      const result = await render(template, context);
      expect(result).toBe('Count: 42, Active: true');
    });
  });

  describe('renderWithEnv', () => {
    test('includes environment variables', async () => {
      process.env.TEST_VAR = 'test_value';

      const template = 'User: {{USER}}, Test: {{TEST_VAR}}';
      const result = await renderWithEnv(template);

      expect(result).toContain('test_value');
      expect(result).toContain('User:');

      delete process.env.TEST_VAR;
    });

    test('merges additional context with env variables', async () => {
      process.env.TEST_VAR = 'from_env';

      const template = '{{TEST_VAR}} and {{custom}}';
      const context = { custom: 'from_context' };

      const result = await renderWithEnv(template, context);
      expect(result).toBe('from_env and from_context');

      delete process.env.TEST_VAR;
    });

    test('context overrides environment variables', async () => {
      process.env.TEST_VAR = 'from_env';

      const template = '{{TEST_VAR}}';
      const context = { TEST_VAR: 'from_context' };

      const result = await renderWithEnv(template, context);
      expect(result).toBe('from_context');

      delete process.env.TEST_VAR;
    });
  });

  describe('renderObject', () => {
    test('renders all string values in an object', async () => {
      const obj = {
        greeting: 'Hello {{name}}',
        message: 'Welcome to {{city}}'
      };
      const context = { name: 'Alice', city: 'Wonderland' };

      const result = await renderObject(obj, context);

      expect(result.greeting).toBe('Hello Alice');
      expect(result.message).toBe('Welcome to Wonderland');
    });

    test('recursively renders nested objects', async () => {
      const obj = {
        user: {
          greeting: 'Hello {{name}}',
          info: {
            message: 'Age: {{age}}'
          }
        }
      };
      const context = { name: 'Bob', age: 30 };

      const result = await renderObject(obj, context);

      expect(result.user.greeting).toBe('Hello Bob');
      expect(result.user.info.message).toBe('Age: 30');
    });

    test('renders array elements', async () => {
      const obj = {
        items: ['Hello {{name}}', 'Welcome {{name}}']
      };
      const context = { name: 'Charlie' };

      const result = await renderObject(obj, context);

      expect(result.items[0]).toBe('Hello Charlie');
      expect(result.items[1]).toBe('Welcome Charlie');
    });

    test('preserves non-string values', async () => {
      const obj = {
        text: 'Hello {{name}}',
        count: 42,
        active: true,
        data: null
      };
      const context = { name: 'Dave' };

      const result = await renderObject(obj, context);

      expect(result.text).toBe('Hello Dave');
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.data).toBe(null);
    });
  });

  describe('validateTemplate', () => {
    test('validates template with all variables present', async () => {
      const template = 'Hello {{name}}, welcome to {{city}}!';
      const context = { name: 'Alice', city: 'Wonderland' };

      const result = await validateTemplate(template, context);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    test('detects missing variables', async () => {
      const template = 'Hello {{name}}, welcome to {{city}}!';
      const context = { name: 'Alice' };

      const result = await validateTemplate(template, context);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('city');
    });

    test('validates nested variables', async () => {
      const template = '{{user.name}} at {{user.company}}';
      const context = {
        user: {
          name: 'Bob'
        }
      };

      const result = await validateTemplate(template, context);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('user.company');
    });
  });

  describe('filters', () => {
    test('applies built-in uppercase filter', async () => {
      const template = 'Hello {{name | uppercase}}!';
      const context = { name: 'alice' };

      const result = await render(template, context);
      expect(result).toBe('Hello ALICE!');
    });

    test('applies built-in lowercase filter', async () => {
      const template = 'Hello {{name | lowercase}}!';
      const context = { name: 'ALICE' };

      const result = await render(template, context);
      expect(result).toBe('Hello alice!');
    });

    test('applies custom filter', async () => {
      addFilter('double', (value) => value + value);

      const template = '{{word | double}}';
      const context = { word: 'test' };

      const result = await render(template, context);
      expect(result).toBe('testtest');
    });

    test('chains multiple filters', async () => {
      const template = '{{name | lowercase | uppercase}}';
      const context = { name: 'Alice' };

      const result = await render(template, context);
      expect(result).toBe('ALICE');
    });
  });

  describe('integration with real templates', () => {
    test('renders sample template from fixtures', async () => {
      const template = readFileSync(
        join(fixturesDir, 'templates/sample_template.md'),
        'utf-8'
      );

      const context = {
        project_name: 'Test Project',
        workflow_type: 'feature-development',
        project_root: '/test/project',
        user_name: 'testuser',
        env: 'development',
        team: {
          name: 'Engineering',
          lead: 'Alice'
        },
        items: ['first', 'second', 'third']
      };

      const result = await render(template, context);

      expect(result).toContain('Test Project');
      expect(result).toContain('feature-development');
      expect(result).toContain('/test/project');
      expect(result).toContain('Engineering');
      expect(result).toContain('first');
    });
  });
});
