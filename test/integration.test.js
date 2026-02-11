import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, 'fixtures');

// Import all modules
import * as schemaValidator from '../lib/schema-validator.js';
import * as templateRenderer from '../lib/template-renderer.js';
import * as stateManager from '../lib/state-manager.js';

describe('Integration Tests', () => {
  let testDir;

  beforeAll(async () => {
    // Create temp directory for integration tests
    testDir = await mkdtemp(join(tmpdir(), 'adaptive-workflow-test-'));
  });

  afterAll(async () => {
    // Clean up
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Workflow Setup Flow', () => {
    test('should initialize state, render templates, and validate', async () => {
      // 1. Initialize state
      const statePath = join(testDir, 'state.json');
      await stateManager.initializeState(statePath);

      // 2. Read initialized state
      const state = await stateManager.readState(statePath);
      expect(state).toBeDefined();
      expect(state.discovered_capabilities).toBeDefined();

      // 3. Update state with project info
      await stateManager.updateStateField(statePath, 'project_root', '/test/project');
      await stateManager.updateStateField(statePath, 'workflow_root', '/test/project/.mycelium');
      await stateManager.updateStateField(statePath, 'session_id', 'test-session-123');

      // 4. Validate updated state
      const updatedState = await stateManager.readState(statePath);
      const validation = await schemaValidator.validateState(updatedState, {
        schemaDir: join(fixturesDir, 'schemas')
      });
      expect(validation.valid).toBe(true);

      // 5. Render template with state
      const template = 'Project: {{project_root}}, Session: {{session_id}}';
      const rendered = await templateRenderer.render(template, updatedState);
      expect(rendered).toContain('/test/project');
      expect(rendered).toContain('test-session-123');
    });
  });

  describe('State Management Integration', () => {
    test('should handle complex nested state updates', async () => {
      const statePath = join(testDir, 'complex_state.json');

      // Initialize
      await stateManager.initializeState(statePath);

      // Add nested capabilities
      await stateManager.updateStateField(
        statePath,
        'discovered_capabilities.skills',
        [{ name: 'test-skill', version: '1.0.0' }]
      );

      await stateManager.updateStateField(
        statePath,
        'discovered_capabilities.agents',
        [{ name: 'test-agent', model: 'sonnet' }]
      );

      // Read and verify
      const state = await stateManager.readState(statePath);
      expect(state.discovered_capabilities.skills).toHaveLength(1);
      expect(state.discovered_capabilities.agents).toHaveLength(1);
      expect(state.discovered_capabilities.skills[0].name).toBe('test-skill');
    });

    test('should merge states correctly', async () => {
      const baseState = {
        session_id: 'base',
        project_root: '/base',
        metadata: {
          version: '1.0',
          author: 'base-author'
        }
      };

      const newState = {
        session_id: 'updated',
        metadata: {
          author: 'new-author',
          date: '2026-02-04'
        },
        extra_field: 'new'
      };

      const merged = await stateManager.mergeState(baseState, newState);

      expect(merged.session_id).toBe('updated');
      expect(merged.project_root).toBe('/base');
      expect(merged.metadata.version).toBe('1.0');
      expect(merged.metadata.author).toBe('new-author');
      expect(merged.metadata.date).toBe('2026-02-04');
      expect(merged.extra_field).toBe('new');
    });
  });

  describe('Template Rendering Integration', () => {
    test('should render complex templates with state', async () => {
      const template = `
# {{project_name}}

## Configuration
- Root: {{project_root}}
- Workflow: {{workflow_root}}
- Session: {{session_id}}

## Team
- Lead: {{team.lead}}
- Members: {{team.size}}

## Status
Environment: {{env | uppercase}}
`;

      const context = {
        project_name: 'Integration Test',
        project_root: '/test/project',
        workflow_root: '/test/project/.mycelium',
        session_id: 'test-123',
        team: {
          lead: 'Alice',
          size: 5
        },
        env: 'development'
      };

      const rendered = await templateRenderer.render(template, context);

      expect(rendered).toContain('Integration Test');
      expect(rendered).toContain('/test/project');
      expect(rendered).toContain('Alice');
      expect(rendered).toContain('DEVELOPMENT');
    });

    test('should render entire state objects', async () => {
      const obj = {
        greeting: 'Hello {{name}}',
        details: {
          message: 'Welcome to {{city}}',
          info: {
            status: 'Status: {{status}}'
          }
        },
        items: [
          '{{name}} in {{city}}',
          'Item 2'
        ]
      };

      const context = {
        name: 'Bob',
        city: 'Portland',
        status: 'active'
      };

      const rendered = await templateRenderer.renderObject(obj, context);

      expect(rendered.greeting).toBe('Hello Bob');
      expect(rendered.details.message).toBe('Welcome to Portland');
      expect(rendered.details.info.status).toBe('Status: active');
      expect(rendered.items[0]).toBe('Bob in Portland');
      expect(rendered.items[1]).toBe('Item 2');
    });
  });

  describe('Schema Validation Integration', () => {
    test('should validate workflow configurations', async () => {
      const workflow = {
        name: 'feature-development',
        version: '1.0.0',
        phases: ['planning', 'implementation', 'review'],
        metadata: {
          author: 'test-user',
          created: '2026-02-04'
        }
      };

      const schema = {
        type: 'object',
        required: ['name', 'version', 'phases'],
        properties: {
          name: { type: 'string' },
          version: { type: 'string' },
          phases: {
            type: 'array',
            items: { type: 'string' }
          },
          metadata: { type: 'object' }
        }
      };

      const result = await schemaValidator.validateConfig(workflow, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should detect validation errors', async () => {
      const invalid = {
        version: '1.0.0'
        // missing 'name'
      };

      const schema = {
        type: 'object',
        required: ['name', 'version'],
        properties: {
          name: { type: 'string' },
          version: { type: 'string' }
        }
      };

      const result = await schemaValidator.validateConfig(invalid, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should simulate complete setup workflow', async () => {
      // Step 1: Initialize session state
      const sessionPath = join(testDir, 'e2e_session.json');
      await stateManager.initializeState(sessionPath);

      // Step 2: Configure project
      await stateManager.updateStateField(sessionPath, 'session_id', 'e2e-test-001');
      await stateManager.updateStateField(sessionPath, 'project_root', '/projects/test');
      await stateManager.updateStateField(sessionPath, 'workflow_root', '/projects/test/.mycelium');

      // Step 3: Add discovered capabilities
      const capabilities = {
        skills: [
          { name: 'skill-1', version: '1.0' },
          { name: 'skill-2', version: '2.0' }
        ],
        agents: [
          { name: 'agent-1', model: 'sonnet' }
        ],
        mcps: []
      };

      await stateManager.updateStateField(
        sessionPath,
        'discovered_capabilities',
        capabilities
      );

      // Step 4: Read final state
      const finalState = await stateManager.readState(sessionPath);

      // Step 5: Validate state
      const validation = await schemaValidator.validateState(finalState, {
        schemaDir: join(fixturesDir, 'schemas')
      });
      expect(validation.valid).toBe(true);

      // Step 6: Render template with state
      const template = `
Session: {{session_id}}
Project: {{project_root}}
Skills Found: {{discovered_capabilities.skills.length}}
Agents Found: {{discovered_capabilities.agents.length}}
`;

      const rendered = await templateRenderer.render(template, finalState, { strict: false });
      expect(rendered).toContain('e2e-test-001');
      expect(rendered).toContain('/projects/test');

      // Step 7: Verify backup was created
      const backup = await stateManager.readState(sessionPath + '.backup');
      expect(backup).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('schema validation should be fast', async () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' }
        }
      };

      const config = { name: 'test' };

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        await schemaValidator.validateConfig(config, schema);
      }
      const duration = Date.now() - start;

      // Should validate 100 objects in under 1000ms (reasonable for async operations)
      expect(duration).toBeLessThan(1000);
    });

    test('template rendering should be fast', async () => {
      const template = 'Hello {{name}}, welcome to {{city}}!';
      const context = { name: 'Test', city: 'Portland' };

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        await templateRenderer.render(template, context);
      }
      const duration = Date.now() - start;

      // Should render 1000 templates in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
