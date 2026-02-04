/**
 * Pattern Detector Utility
 *
 * Detects patterns that occur 3 or more times in data structures.
 * Used for learning workflow patterns, error patterns, and solution approaches.
 *
 * @module lib/pattern-detector
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

/**
 * Detect patterns that occur 3 or more times in an array
 *
 * @param {Array<string>} items - Array of items to analyze
 * @param {Object} options - Detection options
 * @param {number} options.minOccurrences - Minimum occurrences to consider a pattern (default: 3)
 * @param {string} options.algorithm - 'exact' or 'fuzzy' matching (default: 'exact')
 * @param {number} options.fuzzySimilarity - Similarity threshold for fuzzy matching (default: 0.8)
 * @returns {Promise<Array<{pattern: string, count: number, examples: string[]}>>} Detected patterns
 *
 * @example
 * const patterns = await detectPatterns([
 *   'error: connection timeout',
 *   'error: connection timeout',
 *   'error: connection timeout',
 *   'error: file not found'
 * ]);
 * // Returns patterns with count >= 3
 */
async function detectPatterns(items, options = {}) {
  const {
    minOccurrences = 3,
    algorithm = 'exact',
    fuzzySimilarity = 0.8
  } = options;

  if (!items || items.length === 0) {
    return [];
  }

  if (algorithm === 'exact') {
    // Exact matching using HashMap
    const countMap = new Map();

    for (const item of items) {
      countMap.set(item, (countMap.get(item) || 0) + 1);
    }

    const patterns = [];
    for (const [pattern, count] of countMap.entries()) {
      if (count >= minOccurrences) {
        patterns.push({
          pattern,
          count,
          examples: [pattern]
        });
      }
    }

    // Sort by frequency descending
    return patterns.sort((a, b) => b.count - a.count);
  } else if (algorithm === 'fuzzy') {
    // Fuzzy matching using similarity clustering
    const clusters = [];

    for (const item of items) {
      let foundCluster = false;

      for (const cluster of clusters) {
        const similarity = calculateSimilarity(item, cluster.representative);
        if (similarity >= fuzzySimilarity) {
          cluster.items.push(item);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({
          representative: item,
          items: [item]
        });
      }
    }

    const patterns = [];
    for (const cluster of clusters) {
      if (cluster.items.length >= minOccurrences) {
        patterns.push({
          pattern: cluster.representative,
          count: cluster.items.length,
          examples: [cluster.representative]
        });
      }
    }

    // Sort by frequency descending
    return patterns.sort((a, b) => b.count - a.count);
  }

  return [];
}

/**
 * Detect sequence patterns (sequences that repeat 3+ times)
 *
 * @param {Array<*>} sequence - Sequence to analyze
 * @param {Object} options - Detection options
 * @param {number} options.minLength - Minimum sequence length (default: 2)
 * @param {number} options.minOccurrences - Minimum occurrences (default: 3)
 * @returns {Array<{pattern: Array, count: number, positions: number[]}>} Detected sequences
 *
 * @example
 * const patterns = await detectSequencePatterns([
 *   'A', 'B', 'C',
 *   'A', 'B', 'C',
 *   'A', 'B', 'C',
 *   'D'
 * ]);
 * // Detects ['A', 'B', 'C'] pattern
 */
async function detectSequencePatterns(sequence, options = {}) {
  const {
    minLength = 2,
    minOccurrences = 3
  } = options;

  if (!sequence || sequence.length < minLength) {
    return [];
  }

  const patternMap = new Map();

  // Sliding window to find subsequences
  for (let length = minLength; length <= Math.floor(sequence.length / 2); length++) {
    for (let i = 0; i <= sequence.length - length; i++) {
      const subseq = sequence.slice(i, i + length);
      const key = JSON.stringify(subseq);

      if (!patternMap.has(key)) {
        patternMap.set(key, {
          pattern: subseq,
          positions: []
        });
      }

      patternMap.get(key).positions.push(i);
    }
  }

  const patterns = [];
  for (const [key, data] of patternMap.entries()) {
    if (data.positions.length >= minOccurrences) {
      patterns.push({
        pattern: data.pattern,
        count: data.positions.length,
        positions: data.positions
      });
    }
  }

  // Sort by count descending, then by pattern length descending
  return patterns.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return b.pattern.length - a.pattern.length;
  });
}

/**
 * Detect patterns in object field values
 *
 * @param {Array<Object>} objects - Array of objects to analyze
 * @param {string} fieldName - Field name to analyze
 * @param {Object} options - Detection options
 * @returns {Promise<Array<{value: string, count: number, objects: Object[]}>>} Patterns in field
 *
 * @example
 * const patterns = await detectObjectPatterns(
 *   [
 *     { status: 'success', id: 1 },
 *     { status: 'success', id: 2 },
 *     { status: 'success', id: 3 }
 *   ],
 *   'status'
 * );
 */
async function detectObjectPatterns(objects, fieldName, options = {}) {
  const { minOccurrences = 3 } = options;

  if (!objects || objects.length === 0) {
    return [];
  }

  const valueMap = new Map();

  for (const obj of objects) {
    if (obj.hasOwnProperty(fieldName)) {
      const value = obj[fieldName];
      const key = JSON.stringify(value);

      if (!valueMap.has(key)) {
        valueMap.set(key, {
          value,
          objects: []
        });
      }

      valueMap.get(key).objects.push(obj);
    }
  }

  const patterns = [];
  for (const [key, data] of valueMap.entries()) {
    if (data.objects.length >= minOccurrences) {
      patterns.push({
        value: data.value,
        count: data.objects.length,
        objects: data.objects
      });
    }
  }

  // Sort by count descending
  return patterns.sort((a, b) => b.count - a.count);
}

/**
 * Detect keyword patterns in text
 *
 * @param {Array<string>} texts - Array of text strings to analyze
 * @param {Object} options - Detection options
 * @param {number} options.minKeywordLength - Minimum word length (default: 3)
 * @param {Set<string>} options.excludeKeywords - Keywords to exclude
 * @returns {Promise<Array<{keyword: string, count: number, contexts: string[]}>>} Keyword patterns
 *
 * @example
 * const patterns = await detectKeywordPatterns([
 *   'Failed to connect to database',
 *   'Connection failed to establish',
 *   'Failed connection error'
 * ]);
 */
async function detectKeywordPatterns(texts, options = {}) {
  const {
    minKeywordLength = 3,
    excludeKeywords = new Set(),
    minOccurrences = 3
  } = options;

  if (!texts || texts.length === 0) {
    return [];
  }

  const keywordMap = new Map();

  for (const text of texts) {
    if (!text || text.length === 0) continue;

    // Tokenize: split by non-word characters
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0);

    for (const word of words) {
      if (word.length < minKeywordLength) continue;
      if (excludeKeywords.has(word)) continue;

      if (!keywordMap.has(word)) {
        keywordMap.set(word, {
          count: 0,
          contexts: []
        });
      }

      const data = keywordMap.get(word);
      data.count++;
      if (data.contexts.length < 10) {  // Limit contexts stored
        data.contexts.push(text);
      }
    }
  }

  const patterns = [];
  for (const [keyword, data] of keywordMap.entries()) {
    if (data.count >= minOccurrences) {
      patterns.push({
        keyword,
        count: data.count,
        contexts: data.contexts
      });
    }
  }

  // Sort by count descending
  return patterns.sort((a, b) => b.count - a.count);
}

/**
 * Find similar patterns using distance algorithms
 *
 * @param {Array<string>} items - Items to find similarities in
 * @param {Object} options - Detection options
 * @param {number} options.threshold - Similarity threshold (0-1, default: 0.8)
 * @returns {Promise<Array<Array<{item: string, distance: number}>>>} Clusters of similar items
 *
 * @example
 * const clusters = await findSimilarPatterns([
 *   'npm install',
 *   'npm install',
 *   'npm i',
 *   'npm i'
 * ], { threshold: 0.8 });
 */
async function findSimilarPatterns(items, options = {}) {
  const { threshold = 0.8 } = options;

  if (!items || items.length === 0) {
    return [];
  }

  const clusters = [];
  const processed = new Set();

  for (let i = 0; i < items.length; i++) {
    if (processed.has(i)) continue;

    const cluster = [{
      item: items[i],
      distance: 0
    }];
    processed.add(i);

    for (let j = i + 1; j < items.length; j++) {
      if (processed.has(j)) continue;

      const similarity = calculateSimilarity(items[i], items[j]);
      if (similarity >= threshold) {
        const distance = 1 - similarity;
        cluster.push({
          item: items[j],
          distance
        });
        processed.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Analyze pattern temporal distribution
 *
 * @param {Array<{item: string, timestamp: number}>} timestampedItems - Items with timestamps
 * @param {Object} options - Analysis options
 * @param {number} options.minOccurrences - Minimum occurrences (default: 3)
 * @returns {Promise<Array<{pattern: string, count: number, firstSeen: number, lastSeen: number, frequency: string}>>} Temporal analysis
 *
 * @example
 * const analysis = await analyzePatternTiming(events);
 * // Returns patterns with temporal distribution info
 */
async function analyzePatternTiming(timestampedItems, options = {}) {
  const { minOccurrences = 3 } = options;

  if (!timestampedItems || timestampedItems.length === 0) {
    return [];
  }

  const patternMap = new Map();

  for (const { item, timestamp } of timestampedItems) {
    if (!patternMap.has(item)) {
      patternMap.set(item, {
        count: 0,
        timestamps: []
      });
    }

    const data = patternMap.get(item);
    data.count++;
    data.timestamps.push(timestamp);
  }

  const patterns = [];
  for (const [pattern, data] of patternMap.entries()) {
    if (data.count >= minOccurrences) {
      const timestamps = data.timestamps.sort((a, b) => a - b);
      const firstSeen = timestamps[0];
      const lastSeen = timestamps[timestamps.length - 1];
      const timeSpan = lastSeen - firstSeen;

      let frequency;
      if (timeSpan === 0) {
        frequency = 'simultaneous';
      } else if (timeSpan < 60000) {
        frequency = 'very frequent (< 1 min)';
      } else if (timeSpan < 3600000) {
        frequency = 'frequent (< 1 hour)';
      } else if (timeSpan < 86400000) {
        frequency = 'regular (< 1 day)';
      } else {
        frequency = 'sporadic (> 1 day)';
      }

      patterns.push({
        pattern,
        count: data.count,
        firstSeen,
        lastSeen,
        frequency
      });
    }
  }

  // Sort by count descending
  return patterns.sort((a, b) => b.count - a.count);
}

export {
  detectPatterns,
  detectSequencePatterns,
  detectObjectPatterns,
  detectKeywordPatterns,
  findSimilarPatterns,
  analyzePatternTiming,
};
