/**
 * Template Renderer Utility
 *
 * Handles variable substitution and template rendering for workflow configurations.
 * Supports context variables, environment variables, and computed values.
 *
 * @module lib/template-renderer
 */

// Built-in filters
const builtInFilters = {
  uppercase: (value) => String(value).toUpperCase(),
  lowercase: (value) => String(value).toLowerCase(),
  trim: (value) => String(value).trim(),
  capitalize: (value) => {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
};

// Custom filters registry
const customFilters = {};

/**
 * Extract variables from a template string
 *
 * @param {string} template - Template string
 * @returns {string[]} Array of variable names (deduplicated)
 */
export function extractVariables(template) {
  const variableRegex = /\{\{([^}|]+)(?:\|[^}]*)?\}\}/g;
  const variables = [];
  let match;

  while ((match = variableRegex.exec(template)) !== null) {
    const varName = match[1].trim();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Get value from context using dot notation or array indexing
 *
 * @param {Object} context - Context object
 * @param {string} path - Path to value (e.g., 'user.name' or 'items[0]')
 * @returns {*} Value at path or undefined
 */
function getValueByPath(context, path) {
  // Handle array indexing: items[0]
  const arrayMatch = path.match(/^([^[]+)\[(\d+)\]$/);
  if (arrayMatch) {
    const [, arrayPath, index] = arrayMatch;
    const array = getValueByPath(context, arrayPath);
    return array ? array[parseInt(index, 10)] : undefined;
  }

  // Handle dot notation: user.name
  const parts = path.split('.');
  let value = context;

  for (const part of parts) {
    if (value === undefined || value === null) {
      return undefined;
    }
    value = value[part];
  }

  return value;
}

/**
 * Apply filters to a value
 *
 * @param {*} value - Value to filter
 * @param {string[]} filters - Array of filter names
 * @returns {*} Filtered value
 */
function applyFilters(value, filters) {
  let result = value;

  for (const filterName of filters) {
    const filter = customFilters[filterName] || builtInFilters[filterName];
    if (filter) {
      result = filter(result);
    }
  }

  return result;
}

/**
 * Render a template string with variable substitution
 *
 * @param {string} template - Template string with {{variable}} syntax
 * @param {Object} context - Context variables for substitution
 * @param {Object} options - Rendering options
 * @param {boolean} options.strict - Fail on undefined variables (default: true)
 * @returns {Promise<string>} Rendered template
 */
export async function render(template, context, options = {}) {
  const { strict = true } = options;

  const variableRegex = /\{\{([^}]+)\}\}/g;

  const result = template.replace(variableRegex, (match, content) => {
    content = content.trim();

    // Parse variable and filters: variable | filter1 | filter2
    const parts = content.split('|').map(p => p.trim());
    const varName = parts[0];
    const filters = parts.slice(1);

    // Get value from context
    let value = getValueByPath(context, varName);

    // Handle missing values
    if (value === undefined || value === null) {
      if (strict) {
        throw new Error(`Missing variable: ${varName}`);
      }
      return match; // Keep placeholder
    }

    // Apply filters
    if (filters.length > 0) {
      value = applyFilters(value, filters);
    }

    return String(value);
  });

  return result;
}

/**
 * Render a template with environment variables
 *
 * @param {string} template - Template string
 * @param {Object} additionalContext - Additional context variables (overrides env)
 * @returns {Promise<string>} Rendered template
 */
export async function renderWithEnv(template, additionalContext = {}) {
  const context = {
    ...process.env,
    ...additionalContext
  };

  return render(template, context, { strict: false });
}

/**
 * Recursively render all string values in an object
 *
 * @param {*} obj - Object to render (can be object, array, or primitive)
 * @param {Object} context - Context variables
 * @param {Object} options - Rendering options
 * @returns {Promise<*>} Rendered object
 */
export async function renderObject(obj, context, options = {}) {
  if (typeof obj === 'string') {
    return render(obj, context, options);
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => renderObject(item, context, options)));
  }

  if (obj !== null && typeof obj === 'object') {
    const rendered = {};
    for (const [key, value] of Object.entries(obj)) {
      rendered[key] = await renderObject(value, context, options);
    }
    return rendered;
  }

  // Primitives (numbers, booleans, null) pass through unchanged
  return obj;
}

/**
 * Validate that all variables in a template are present in context
 *
 * @param {string} template - Template string
 * @param {Object} context - Context variables
 * @returns {Promise<{valid: boolean, missing: string[]}>} Validation result
 */
export async function validateTemplate(template, context) {
  const variables = extractVariables(template);
  const missing = [];

  for (const varName of variables) {
    const value = getValueByPath(context, varName);
    if (value === undefined || value === null) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Register a custom filter function
 *
 * @param {string} name - Filter name
 * @param {Function} fn - Filter function (value => transformedValue)
 */
export function addFilter(name, fn) {
  customFilters[name] = fn;
}
