import { describe, test, expect } from '@jest/globals';
import {
  detectPatterns,
  detectSequencePatterns,
  detectObjectPatterns,
  detectKeywordPatterns,
  findSimilarPatterns,
  analyzePatternTiming,
} from '../../lib/pattern-detector.js';

describe('pattern-detector', () => {
  describe('detectPatterns', () => {
    test('detects patterns that occur 3+ times with default options', async () => {
      const items = [
        'error: connection timeout',
        'error: connection timeout',
        'error: connection timeout',
        'error: file not found',
        'error: file not found',
        'success',
      ];

      const patterns = await detectPatterns(items);

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toEqual({
        pattern: 'error: connection timeout',
        count: 3,
        examples: expect.arrayContaining(['error: connection timeout']),
      });
    });

    test('detects multiple patterns meeting threshold', async () => {
      const items = [
        'A', 'A', 'A',
        'B', 'B', 'B',
        'C', 'C',
      ];

      const patterns = await detectPatterns(items);

      expect(patterns).toHaveLength(2);
      expect(patterns.map(p => p.pattern).sort()).toEqual(['A', 'B']);
      expect(patterns.find(p => p.pattern === 'A').count).toBe(3);
      expect(patterns.find(p => p.pattern === 'B').count).toBe(3);
    });

    test('respects custom minOccurrences threshold', async () => {
      const items = ['A', 'A', 'B', 'B', 'B'];

      const patterns = await detectPatterns(items, { minOccurrences: 2 });

      expect(patterns).toHaveLength(2);
      expect(patterns.map(p => p.pattern).sort()).toEqual(['A', 'B']);
    });

    test('returns patterns sorted by frequency (descending)', async () => {
      const items = [
        'A', 'A', 'A', 'A', 'A',
        'B', 'B', 'B',
        'C', 'C', 'C', 'C',
      ];

      const patterns = await detectPatterns(items);

      expect(patterns[0].pattern).toBe('A');
      expect(patterns[0].count).toBe(5);
      expect(patterns[1].pattern).toBe('C');
      expect(patterns[1].count).toBe(4);
      expect(patterns[2].pattern).toBe('B');
      expect(patterns[2].count).toBe(3);
    });

    test('returns empty array when no patterns meet threshold', async () => {
      const items = ['A', 'B', 'C', 'D'];

      const patterns = await detectPatterns(items);

      expect(patterns).toEqual([]);
    });

    test('handles empty array', async () => {
      const patterns = await detectPatterns([]);
      expect(patterns).toEqual([]);
    });

    test('detects fuzzy patterns with similarity threshold', async () => {
      const items = [
        'npm install',
        'npm instal',
        'npm installed',
        'npm i',
        'npm i',
        'npm i',
      ];

      const patterns = await detectPatterns(items, {
        algorithm: 'fuzzy',
        fuzzySimilarity: 0.8,
      });

      expect(patterns.length).toBeGreaterThan(0);
      const npmPattern = patterns.find(p => p.pattern === 'npm i');
      expect(npmPattern).toBeDefined();
      expect(npmPattern.count).toBeGreaterThanOrEqual(3);
    });

    test('fuzzy matching groups similar items', async () => {
      const items = [
        'connection error',
        'conection error',
        'connection eror',
        'unrelated item',
      ];

      const patterns = await detectPatterns(items, {
        algorithm: 'fuzzy',
        fuzzySimilarity: 0.85,
        minOccurrences: 2,
      });

      expect(patterns.length).toBeGreaterThan(0);
    });

    test('exact matching does not group similar but different items', async () => {
      const items = [
        'npm install',
        'npm instal',
        'npm installed',
      ];

      const patterns = await detectPatterns(items, { algorithm: 'exact' });

      expect(patterns).toEqual([]);
    });

    test('includes examples for each pattern', async () => {
      const items = ['test', 'test', 'test', 'other'];

      const patterns = await detectPatterns(items);

      expect(patterns[0].examples).toBeDefined();
      expect(patterns[0].examples).toBeInstanceOf(Array);
      expect(patterns[0].examples[0]).toBe('test');
    });
  });

  describe('detectSequencePatterns', () => {
    test('detects repeating sequences with default options', async () => {
      const sequence = [
        'A', 'B', 'C',
        'A', 'B', 'C',
        'A', 'B', 'C',
        'D',
      ];

      const patterns = await detectSequencePatterns(sequence);

      expect(patterns.length).toBeGreaterThan(0);
      const abcPattern = patterns.find(p =>
        JSON.stringify(p.pattern) === JSON.stringify(['A', 'B', 'C'])
      );
      expect(abcPattern).toBeDefined();
      expect(abcPattern.count).toBe(3);
      expect(abcPattern.positions).toEqual([0, 3, 6]);
    });

    test('detects multiple sequence patterns', async () => {
      const sequence = [
        'A', 'B',
        'A', 'B',
        'A', 'B',
        'C', 'D',
        'C', 'D',
        'C', 'D',
      ];

      const patterns = await detectSequencePatterns(sequence);

      expect(patterns.length).toBe(2);
    });

    test('respects minimum sequence length', async () => {
      const sequence = ['A', 'A', 'A', 'B', 'C', 'B', 'C', 'B', 'C'];

      const patterns = await detectSequencePatterns(sequence, { minLength: 2 });

      const singlePattern = patterns.find(p => p.pattern.length === 1);
      expect(singlePattern).toBeUndefined();
    });

    test('respects minOccurrences option', async () => {
      const sequence = ['A', 'B', 'A', 'B', 'C', 'D'];

      const patterns = await detectSequencePatterns(sequence, {
        minOccurrences: 2,
      });

      expect(patterns.length).toBeGreaterThan(0);
      const abPattern = patterns.find(p =>
        JSON.stringify(p.pattern) === JSON.stringify(['A', 'B'])
      );
      expect(abPattern).toBeDefined();
      expect(abPattern.count).toBe(2);
    });

    test('handles overlapping patterns', async () => {
      const sequence = ['A', 'B', 'A', 'B', 'A'];

      const patterns = await detectSequencePatterns(sequence, {
        minOccurrences: 2,
      });

      expect(patterns.length).toBeGreaterThan(0);
    });

    test('returns empty array when no sequences repeat', async () => {
      const sequence = ['A', 'B', 'C', 'D', 'E', 'F'];

      const patterns = await detectSequencePatterns(sequence);

      expect(patterns).toEqual([]);
    });

    test('handles empty sequence', async () => {
      const patterns = await detectSequencePatterns([]);
      expect(patterns).toEqual([]);
    });

    test('handles single element sequence', async () => {
      const patterns = await detectSequencePatterns(['A']);
      expect(patterns).toEqual([]);
    });

    test('includes positions of all occurrences', async () => {
      const sequence = ['X', 'Y', 'Z', 'X', 'Y', 'Z', 'X', 'Y', 'Z'];

      const patterns = await detectSequencePatterns(sequence);

      const xyzPattern = patterns.find(p =>
        JSON.stringify(p.pattern) === JSON.stringify(['X', 'Y', 'Z'])
      );
      expect(xyzPattern.positions).toEqual([0, 3, 6]);
    });
  });

  describe('detectObjectPatterns', () => {
    test('detects patterns in object field values', async () => {
      const objects = [
        { status: 'success', id: 1 },
        { status: 'success', id: 2 },
        { status: 'success', id: 3 },
        { status: 'error', id: 4 },
      ];

      const patterns = await detectObjectPatterns(objects, 'status');

      expect(patterns).toHaveLength(1);
      expect(patterns[0].value).toBe('success');
      expect(patterns[0].count).toBe(3);
      expect(patterns[0].objects).toHaveLength(3);
    });

    test('detects multiple field patterns', async () => {
      const objects = [
        { type: 'A' },
        { type: 'A' },
        { type: 'A' },
        { type: 'B' },
        { type: 'B' },
        { type: 'B' },
      ];

      const patterns = await detectObjectPatterns(objects, 'type');

      expect(patterns).toHaveLength(2);
      expect(patterns.map(p => p.value).sort()).toEqual(['A', 'B']);
    });

    test('respects minOccurrences option', async () => {
      const objects = [
        { level: 'high' },
        { level: 'high' },
        { level: 'low' },
      ];

      const patterns = await detectObjectPatterns(objects, 'level', {
        minOccurrences: 2,
      });

      expect(patterns).toHaveLength(1);
      expect(patterns[0].value).toBe('high');
    });

    test('includes references to objects with each pattern', async () => {
      const objects = [
        { id: 1, category: 'test' },
        { id: 2, category: 'test' },
        { id: 3, category: 'test' },
      ];

      const patterns = await detectObjectPatterns(objects, 'category');

      expect(patterns[0].objects).toEqual(objects);
    });

    test('handles missing field in some objects', async () => {
      const objects = [
        { status: 'ok' },
        { status: 'ok' },
        { status: 'ok' },
        { other: 'value' },
      ];

      const patterns = await detectObjectPatterns(objects, 'status');

      expect(patterns).toHaveLength(1);
      expect(patterns[0].count).toBe(3);
    });

    test('handles null and undefined field values', async () => {
      const objects = [
        { value: null },
        { value: null },
        { value: null },
        { value: undefined },
      ];

      const patterns = await detectObjectPatterns(objects, 'value');

      expect(patterns.length).toBeGreaterThanOrEqual(0);
    });

    test('returns empty array when no patterns meet threshold', async () => {
      const objects = [
        { type: 'A' },
        { type: 'B' },
        { type: 'C' },
      ];

      const patterns = await detectObjectPatterns(objects, 'type');

      expect(patterns).toEqual([]);
    });

    test('handles empty array', async () => {
      const patterns = await detectObjectPatterns([], 'field');
      expect(patterns).toEqual([]);
    });

    test('returns patterns sorted by frequency', async () => {
      const objects = [
        { x: 'A' },
        { x: 'A' },
        { x: 'A' },
        { x: 'A' },
        { x: 'B' },
        { x: 'B' },
        { x: 'B' },
      ];

      const patterns = await detectObjectPatterns(objects, 'x');

      expect(patterns[0].value).toBe('A');
      expect(patterns[0].count).toBe(4);
    });
  });

  describe('detectKeywordPatterns', () => {
    test('detects frequent keywords in texts', async () => {
      const texts = [
        'Failed to connect to database',
        'Connection failed to establish',
        'Failed connection error',
      ];

      const patterns = await detectKeywordPatterns(texts);

      const failedPattern = patterns.find(p => p.keyword === 'failed');
      expect(failedPattern).toBeDefined();
      expect(failedPattern.count).toBeGreaterThanOrEqual(2);
    });

    test('filters keywords by minimum length', async () => {
      const texts = [
        'a big test is a big thing',
        'a big test is a big thing',
        'a big test is a big thing',
      ];

      const patterns = await detectKeywordPatterns(texts, {
        minKeywordLength: 3,
      });

      const shortWords = patterns.filter(p => p.keyword.length < 3);
      expect(shortWords).toHaveLength(0);
    });

    test('excludes specified keywords', async () => {
      const texts = [
        'the error occurred',
        'the error occurred',
        'the error occurred',
      ];

      const patterns = await detectKeywordPatterns(texts, {
        excludeKeywords: new Set(['the', 'occurred']),
      });

      expect(patterns.find(p => p.keyword === 'the')).toBeUndefined();
      expect(patterns.find(p => p.keyword === 'occurred')).toBeUndefined();
    });

    test('includes contexts for each keyword', async () => {
      const texts = [
        'error in module A',
        'error in module B',
        'error in module C',
      ];

      const patterns = await detectKeywordPatterns(texts);

      const errorPattern = patterns.find(p => p.keyword === 'error');
      expect(errorPattern).toBeDefined();
      expect(errorPattern.contexts).toBeDefined();
      expect(errorPattern.contexts).toBeInstanceOf(Array);
      expect(errorPattern.contexts.length).toBeGreaterThan(0);
    });

    test('handles case-insensitive matching', async () => {
      const texts = [
        'Error occurred',
        'error happened',
        'ERROR detected',
      ];

      const patterns = await detectKeywordPatterns(texts);

      const errorPattern = patterns.find(p => p.keyword.toLowerCase() === 'error');
      expect(errorPattern).toBeDefined();
      expect(errorPattern.count).toBe(3);
    });

    test('tokenizes text correctly', async () => {
      const texts = [
        'word1,word2,word3',
        'word1.word2.word3',
        'word1 word2 word3',
      ];

      const patterns = await detectKeywordPatterns(texts, {
        minOccurrences: 2,
      });

      expect(patterns.length).toBeGreaterThan(0);
    });

    test('returns keywords sorted by frequency', async () => {
      const texts = [
        'test test test test',
        'bug bug bug',
      ];

      const patterns = await detectKeywordPatterns(texts);

      if (patterns.length >= 2) {
        expect(patterns[0].count).toBeGreaterThanOrEqual(patterns[1].count);
      }
    });

    test('handles empty text array', async () => {
      const patterns = await detectKeywordPatterns([]);
      expect(patterns).toEqual([]);
    });

    test('handles empty strings in array', async () => {
      const texts = ['', '', 'valid text', 'valid text', 'valid text'];

      const patterns = await detectKeywordPatterns(texts);

      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('findSimilarPatterns', () => {
    test('clusters similar items using fuzzy matching', async () => {
      const items = [
        'npm install',
        'npm instal',
        'npm installed',
        'git commit',
        'git comit',
        'git commit',
      ];

      const clusters = await findSimilarPatterns(items, { threshold: 0.8 });

      expect(clusters).toBeDefined();
      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters[0]).toBeInstanceOf(Array);
    });

    test('respects similarity threshold', async () => {
      const items = [
        'testing',
        'testng',  // 1 char different, similarity = 6/7 = 0.857
        'completely different string',
      ];

      // With high threshold 0.9, similar items should NOT cluster
      const strictClusters = await findSimilarPatterns(items, { threshold: 0.9 });
      const strictHighSimilarityCluster = strictClusters.find(
        cluster => cluster.length >= 2
      );
      expect(strictHighSimilarityCluster).toBeUndefined();

      // With lower threshold 0.8, similar items SHOULD cluster
      const looseClusters = await findSimilarPatterns(items, { threshold: 0.8 });
      const looseHighSimilarityCluster = looseClusters.find(
        cluster => cluster.length >= 2
      );
      expect(looseHighSimilarityCluster).toBeDefined();
    });

    test('includes distance metrics in results', async () => {
      const items = ['test', 'test', 'tst'];

      const clusters = await findSimilarPatterns(items, { threshold: 0.7 });

      expect(clusters.length).toBeGreaterThan(0);
      expect(clusters[0][0]).toHaveProperty('item');
      expect(clusters[0][0]).toHaveProperty('distance');
    });

    test('groups identical items together', async () => {
      const items = ['same', 'same', 'same', 'different'];

      const clusters = await findSimilarPatterns(items, { threshold: 1.0 });

      const sameCluster = clusters.find(cluster =>
        cluster.some(c => c.item === 'same')
      );
      expect(sameCluster).toBeDefined();
      expect(sameCluster.length).toBe(3);
    });

    test('handles empty array', async () => {
      const clusters = await findSimilarPatterns([]);
      expect(clusters).toEqual([]);
    });

    test('handles single item', async () => {
      const clusters = await findSimilarPatterns(['only one']);
      expect(clusters).toHaveLength(1);
      expect(clusters[0]).toHaveLength(1);
    });

    test('does not cluster dissimilar items', async () => {
      const items = [
        'apple',
        'banana',
        'cherry',
        'date',
      ];

      const clusters = await findSimilarPatterns(items, { threshold: 0.9 });

      // Should result in separate clusters or small clusters
      const largeClusters = clusters.filter(c => c.length > 2);
      expect(largeClusters).toHaveLength(0);
    });

    test('handles special characters and punctuation', async () => {
      const items = [
        'error: connection',
        'error: conection',
        'error! connection',
      ];

      const clusters = await findSimilarPatterns(items, { threshold: 0.8 });

      expect(clusters.length).toBeGreaterThan(0);
    });
  });

  describe('analyzePatternTiming', () => {
    test('analyzes temporal distribution of patterns', async () => {
      const now = Date.now();
      const timestampedItems = [
        { item: 'error', timestamp: now - 1000 },
        { item: 'error', timestamp: now - 500 },
        { item: 'error', timestamp: now },
        { item: 'success', timestamp: now },
      ];

      const analysis = await analyzePatternTiming(timestampedItems);

      expect(analysis).toHaveLength(1);
      expect(analysis[0].pattern).toBe('error');
      expect(analysis[0].count).toBe(3);
      expect(analysis[0].firstSeen).toBe(now - 1000);
      expect(analysis[0].lastSeen).toBe(now);
    });

    test('calculates frequency descriptors', async () => {
      const now = Date.now();
      const timestampedItems = [
        { item: 'event', timestamp: now - 2000 },
        { item: 'event', timestamp: now - 1000 },
        { item: 'event', timestamp: now },
      ];

      const analysis = await analyzePatternTiming(timestampedItems);

      expect(analysis[0]).toHaveProperty('frequency');
      expect(analysis[0].frequency).toBeDefined();
    });

    test('respects minOccurrences option', async () => {
      const now = Date.now();
      const timestampedItems = [
        { item: 'A', timestamp: now },
        { item: 'A', timestamp: now },
        { item: 'B', timestamp: now },
      ];

      const analysis = await analyzePatternTiming(timestampedItems, {
        minOccurrences: 2,
      });

      expect(analysis).toHaveLength(1);
      expect(analysis[0].pattern).toBe('A');
    });

    test('handles patterns with same timestamp', async () => {
      const now = Date.now();
      const timestampedItems = [
        { item: 'event', timestamp: now },
        { item: 'event', timestamp: now },
        { item: 'event', timestamp: now },
      ];

      const analysis = await analyzePatternTiming(timestampedItems);

      expect(analysis).toHaveLength(1);
      expect(analysis[0].firstSeen).toBe(analysis[0].lastSeen);
    });

    test('sorts patterns by frequency', async () => {
      const now = Date.now();
      const timestampedItems = [
        { item: 'A', timestamp: now },
        { item: 'A', timestamp: now },
        { item: 'A', timestamp: now },
        { item: 'A', timestamp: now },
        { item: 'B', timestamp: now },
        { item: 'B', timestamp: now },
        { item: 'B', timestamp: now },
      ];

      const analysis = await analyzePatternTiming(timestampedItems);

      expect(analysis[0].pattern).toBe('A');
      expect(analysis[0].count).toBe(4);
    });

    test('handles empty array', async () => {
      const analysis = await analyzePatternTiming([]);
      expect(analysis).toEqual([]);
    });

    test('tracks first and last occurrence correctly', async () => {
      const timestamps = [1000, 2000, 3000];
      const timestampedItems = timestamps.map(ts => ({
        item: 'test',
        timestamp: ts,
      }));

      const analysis = await analyzePatternTiming(timestampedItems);

      expect(analysis[0].firstSeen).toBe(1000);
      expect(analysis[0].lastSeen).toBe(3000);
    });

    test('identifies recent vs historical patterns', async () => {
      const now = Date.now();
      const hourAgo = now - 3600000;
      const weekAgo = now - 604800000;

      const timestampedItems = [
        { item: 'recent', timestamp: now - 100 },
        { item: 'recent', timestamp: now - 200 },
        { item: 'recent', timestamp: now - 300 },
        { item: 'old', timestamp: weekAgo },
        { item: 'old', timestamp: weekAgo + 1000 },
        { item: 'old', timestamp: weekAgo + 2000 },
      ];

      const analysis = await analyzePatternTiming(timestampedItems);

      expect(analysis).toHaveLength(2);
      const recentPattern = analysis.find(a => a.pattern === 'recent');
      const oldPattern = analysis.find(a => a.pattern === 'old');

      expect(recentPattern).toBeDefined();
      expect(oldPattern).toBeDefined();
      expect(recentPattern.lastSeen).toBeGreaterThan(oldPattern.lastSeen);
    });
  });
});
