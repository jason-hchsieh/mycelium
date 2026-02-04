/**
 * Schema Validator Utility
 *
 * Validates YAML/JSON configuration files against predefined schemas.
 * Provides validation for workflow configurations, plugin specs, and state files.
 *
 * @module lib/schema-validator
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Schema cache
const schemaCache = new Map();

// Schema paths relative to project root
const SCHEMA_DIR = join(__dirname, '../schemas');
const SCHEMAS = {
  workflow: 'workflow-config.schema.json',
  plugin: 'plugin-spec.schema.json',
  state: 'session-state.schema.json'
};

/**
 * Load a schema from file
 *
 * @param {string} schemaPath - Path to the schema file (JSON)
 * @returns {Promise<Object>} Parsed schema object
 */
export async function loadSchema(schemaPath) {
  const absolutePath = resolve(schemaPath);

  // Check cache first
  if (schemaCache.has(absolutePath)) {
    return schemaCache.get(absolutePath);
  }

  try {
    const content = await readFile(absolutePath, 'utf-8');
    const schema = JSON.parse(content);

    // Cache the schema
    schemaCache.set(absolutePath, schema);

    return schema;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in schema file: ${schemaPath}`);
    }
    throw error;
  }
}

/**
 * Create AJV instance with schema loading
 *
 * @param {string} schemaDir - Directory containing schemas
 * @returns {Ajv} Configured AJV instance
 */
function createAjv(schemaDir) {
  const ajvInstance = new Ajv({
    allErrors: true,
    strict: false,
    loadSchema: async (uri) => {
      // Extract filename from URI
      const filename = uri.split('/').pop();
      const schemaPath = join(schemaDir, filename);
      return loadSchema(schemaPath);
    }
  });

  addFormats(ajvInstance);
  return ajvInstance;
}

/**
 * Format AJV errors into readable messages
 *
 * @param {Array} errors - AJV errors array
 * @returns {string[]} Formatted error messages
 */
function formatErrors(errors) {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map(err => {
    const path = err.instancePath || 'root';
    const message = err.message || 'validation failed';

    if (err.keyword === 'required') {
      return `${path}: missing required property '${err.params.missingProperty}'`;
    }

    if (err.keyword === 'additionalProperties') {
      return `${path}: additional property '${err.params.additionalProperty}' not allowed`;
    }

    if (err.keyword === 'type') {
      return `${path}: must be ${err.params.type}`;
    }

    return `${path}: ${message}`;
  });
}

/**
 * Validate a configuration object against a schema
 *
 * @param {Object} config - The configuration object to validate
 * @param {Object} schema - The schema definition to validate against
 * @param {Object} options - Validation options
 * @param {boolean} options.strict - Enforce strict validation (default: false)
 * @param {string} options.schemaDir - Directory for resolving $ref (default: SCHEMA_DIR)
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
export async function validateConfig(config, schema, options = {}) {
  const { schemaDir = SCHEMA_DIR } = options;

  // Create AJV instance with schema directory
  const ajv = createAjv(schemaDir);

  // Compile schema (with async ref resolution if needed)
  let validate;
  try {
    validate = await ajv.compileAsync(schema);
  } catch (error) {
    // If async compilation fails, try sync (no $ref)
    validate = ajv.compile(schema);
  }

  // Validate the config
  const valid = validate(config);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = formatErrors(validate.errors);

  return {
    valid: false,
    errors
  };
}

/**
 * Validate workflow configuration
 *
 * @param {Object} workflow - Workflow configuration object
 * @param {Object} options - Validation options
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
export async function validateWorkflow(workflow, options = {}) {
  const schemaDir = options.schemaDir || SCHEMA_DIR;
  const schemaPath = join(schemaDir, SCHEMAS.workflow);
  const schema = await loadSchema(schemaPath);
  return validateConfig(workflow, schema, { ...options, schemaDir });
}

/**
 * Validate plugin specification
 *
 * @param {Object} pluginSpec - Plugin specification object
 * @param {Object} options - Validation options
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
export async function validatePluginSpec(pluginSpec, options = {}) {
  const schemaDir = options.schemaDir || SCHEMA_DIR;
  const schemaPath = join(schemaDir, SCHEMAS.plugin);
  const schema = await loadSchema(schemaPath);
  return validateConfig(pluginSpec, schema, { ...options, schemaDir });
}

/**
 * Validate state file
 *
 * @param {Object} state - State object to validate
 * @param {Object} options - Validation options
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
export async function validateState(state, options = {}) {
  const schemaDir = options.schemaDir || SCHEMA_DIR;
  const schemaPath = join(schemaDir, SCHEMAS.state);
  const schema = await loadSchema(schemaPath);
  return validateConfig(state, schema, { ...options, schemaDir });
}
