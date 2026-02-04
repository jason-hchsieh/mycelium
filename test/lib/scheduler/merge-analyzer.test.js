/**
 * Tests for Merge Analyzer
 *
 * @module test/lib/scheduler/merge-analyzer.test
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  analyzeConflicts,
  getConflictComplexity,
  suggestResolution,
  estimateMergeRisk,
  compareWorktrees,
  findCommonAncestor,
  generateMergeReport,
} from '../../../lib/scheduler/merge-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures directory
const fixturesDir = path.join(__dirname, '../../fixtures/merge-analyzer');
const testRepoDir = path.join(fixturesDir, 'test-repo');

describe('Merge Analyzer', () => {
  beforeEach(async () => {
    // Ensure fixtures directory exists
    await fs.mkdir(testRepoDir, { recursive: true });

    // Initialize a test git repository
    try {
      execSync('git init', { cwd: testRepoDir, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: testRepoDir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: testRepoDir, stdio: 'pipe' });

      // Create initial commit
      await fs.writeFile(path.join(testRepoDir, 'README.md'), '# Test Repo\n');
      execSync('git add .', { cwd: testRepoDir, stdio: 'pipe' });
      execSync('git commit -m "Initial commit"', { cwd: testRepoDir, stdio: 'pipe' });

      // Create branch1
      execSync('git checkout -b branch1', { cwd: testRepoDir, stdio: 'pipe' });
      await fs.writeFile(path.join(testRepoDir, 'file1.txt'), 'Content from branch1\n');
      execSync('git add .', { cwd: testRepoDir, stdio: 'pipe' });
      execSync('git commit -m "Add file1"', { cwd: testRepoDir, stdio: 'pipe' });

      // Create branch2
      execSync('git checkout main || git checkout master', { cwd: testRepoDir, stdio: 'pipe' });
      execSync('git checkout -b branch2', { cwd: testRepoDir, stdio: 'pipe' });
      await fs.writeFile(path.join(testRepoDir, 'file2.txt'), 'Content from branch2\n');
      execSync('git add .', { cwd: testRepoDir, stdio: 'pipe' });
      execSync('git commit -m "Add file2"', { cwd: testRepoDir, stdio: 'pipe' });

      // Go back to main/master
      execSync('git checkout main || git checkout master', { cwd: testRepoDir, stdio: 'pipe' });
    } catch (error) {
      // Ignore setup errors for tests that don't need git
    }
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(fixturesDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('analyzeConflicts', () => {
    test('should return empty conflicts when branches have no conflicts', async () => {
      // Use the same branch twice to ensure no conflicts
      const result = await analyzeConflicts(testRepoDir, 'branch1', 'branch1');

      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('has_conflicts');
      expect(result.has_conflicts).toBe(false);
      expect(Array.isArray(result.conflicts)).toBe(true);
    });

    test('should detect conflicts between branches', async () => {
      const result = await analyzeConflicts(testRepoDir, 'branch1', 'branch2');

      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('has_conflicts');
      expect(result).toHaveProperty('total_conflicts');
    });

    test('should include file paths in conflict data', async () => {
      const result = await analyzeConflicts(testRepoDir, 'branch1', 'branch2');

      if (result.has_conflicts) {
        expect(result.conflicts[0]).toHaveProperty('file');
        expect(result.conflicts[0]).toHaveProperty('type');
      }
    });

    test('should handle non-existent branches gracefully', async () => {
      await expect(
        analyzeConflicts(testRepoDir, 'non-existent-1', 'non-existent-2')
      ).rejects.toThrow();
    });

    test('should handle non-git directory', async () => {
      const nonGitDir = path.join(fixturesDir, 'non-git');
      await fs.mkdir(nonGitDir, { recursive: true });

      await expect(
        analyzeConflicts(nonGitDir, 'branch1', 'branch2')
      ).rejects.toThrow();
    });
  });

  describe('getConflictComplexity', () => {
    test('should return low complexity for no conflicts', () => {
      const conflicts = [];
      const result = getConflictComplexity(conflicts);

      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('score');
      expect(result.level).toBe('low');
      expect(result.score).toBe(0);
    });

    test('should calculate complexity based on number of conflicts', () => {
      const conflicts = [
        { file: 'file1.js', type: 'content', lines: 10 },
        { file: 'file2.js', type: 'content', lines: 20 },
        { file: 'file3.js', type: 'content', lines: 15 },
      ];

      const result = getConflictComplexity(conflicts);

      expect(result.level).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(result.level);
    });

    test('should consider number of lines in complexity', () => {
      const fewLines = [{ file: 'file1.js', type: 'content', lines: 5 }];
      const manyLines = [{ file: 'file1.js', type: 'content', lines: 500 }];

      const resultFew = getConflictComplexity(fewLines);
      const resultMany = getConflictComplexity(manyLines);

      expect(resultMany.score).toBeGreaterThan(resultFew.score);
    });

    test('should handle different conflict types', () => {
      const conflicts = [
        { file: 'file1.js', type: 'content', lines: 10 },
        { file: 'file2.js', type: 'delete', lines: 0 },
        { file: 'file3.js', type: 'rename', lines: 0 },
      ];

      const result = getConflictComplexity(conflicts);

      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('details');
    });

    test('should return high complexity for many conflicts', () => {
      const conflicts = Array.from({ length: 20 }, (_, i) => ({
        file: `file${i}.js`,
        type: 'content',
        lines: 50,
      }));

      const result = getConflictComplexity(conflicts);

      expect(result.level).toBe('high');
      expect(result.score).toBeGreaterThan(70);
    });
  });

  describe('suggestResolution', () => {
    test('should suggest strategy for content conflict', () => {
      const conflict = {
        file: 'file.js',
        type: 'content',
        lines: 10,
      };

      const result = suggestResolution(conflict);

      expect(result).toHaveProperty('strategy');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('automated');
      expect(typeof result.strategy).toBe('string');
    });

    test('should suggest strategy for delete conflict', () => {
      const conflict = {
        file: 'file.js',
        type: 'delete',
        lines: 0,
      };

      const result = suggestResolution(conflict);

      expect(result.strategy).toBeDefined();
      expect(result.description).toBeDefined();
    });

    test('should suggest strategy for rename conflict', () => {
      const conflict = {
        file: 'file.js',
        type: 'rename',
        lines: 0,
      };

      const result = suggestResolution(conflict);

      expect(result.strategy).toBeDefined();
      expect(result.description).toBeDefined();
    });

    test('should indicate if resolution can be automated', () => {
      const conflict = {
        file: 'file.js',
        type: 'content',
        lines: 5,
      };

      const result = suggestResolution(conflict);

      expect(typeof result.automated).toBe('boolean');
    });

    test('should handle unknown conflict types', () => {
      const conflict = {
        file: 'file.js',
        type: 'unknown',
        lines: 0,
      };

      const result = suggestResolution(conflict);

      expect(result.strategy).toBe('manual');
      expect(result.automated).toBe(false);
    });
  });

  describe('estimateMergeRisk', () => {
    test('should return low risk for identical branches', async () => {
      const result = await estimateMergeRisk(testRepoDir, 'branch1', 'branch1');

      expect(result).toHaveProperty('risk_score');
      expect(result).toHaveProperty('risk_level');
      expect(result.risk_score).toBe(0);
      expect(result.risk_level).toBe('low');
    });

    test('should calculate risk score between 0 and 100', async () => {
      const result = await estimateMergeRisk(testRepoDir, 'branch1', 'branch2');

      expect(result.risk_score).toBeGreaterThanOrEqual(0);
      expect(result.risk_score).toBeLessThanOrEqual(100);
    });

    test('should include risk factors in result', async () => {
      const result = await estimateMergeRisk(testRepoDir, 'branch1', 'branch2');

      expect(result).toHaveProperty('risk_factors');
      expect(Array.isArray(result.risk_factors)).toBe(true);
    });

    test('should categorize risk as low, medium, or high', async () => {
      const result = await estimateMergeRisk(testRepoDir, 'branch1', 'branch2');

      expect(['low', 'medium', 'high']).toContain(result.risk_level);
    });

    test('should handle non-existent branches', async () => {
      await expect(
        estimateMergeRisk(testRepoDir, 'non-existent-1', 'non-existent-2')
      ).rejects.toThrow();
    });
  });

  describe('compareWorktrees', () => {
    test('should compare two worktree paths', async () => {
      const result = await compareWorktrees(
        testRepoDir,
        '/path/to/worktree1',
        '/path/to/worktree2'
      );

      expect(result).toHaveProperty('differences');
      expect(result).toHaveProperty('files_changed');
      expect(result).toHaveProperty('insertions');
      expect(result).toHaveProperty('deletions');
    });

    test('should return zero differences for same worktree', async () => {
      const result = await compareWorktrees(
        testRepoDir,
        testRepoDir,
        testRepoDir
      );

      expect(result.files_changed).toBe(0);
      expect(result.insertions).toBe(0);
      expect(result.deletions).toBe(0);
    });

    test('should list changed files', async () => {
      const result = await compareWorktrees(
        testRepoDir,
        '/path/to/worktree1',
        '/path/to/worktree2'
      );

      expect(result).toHaveProperty('changed_files');
      expect(Array.isArray(result.changed_files)).toBe(true);
    });

    test('should handle non-existent paths', async () => {
      // compareWorktrees doesn't actually check if paths exist, it just runs git diff
      // So this test should check that it doesn't throw an error
      const result = await compareWorktrees(testRepoDir, '/non/existent/1', '/non/existent/2');
      expect(result).toHaveProperty('files_changed');
    });
  });

  describe('findCommonAncestor', () => {
    test('should find merge base between branches', async () => {
      const result = await findCommonAncestor(testRepoDir, 'branch1', 'branch2');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should return commit hash', async () => {
      const result = await findCommonAncestor(testRepoDir, 'branch1', 'branch1');

      // Git commit hash should be 40 characters (SHA-1) or 64 (SHA-256)
      expect(result.length).toBeGreaterThanOrEqual(7); // Short hash minimum
    });

    test('should handle same branch', async () => {
      const result = await findCommonAncestor(testRepoDir, 'branch1', 'branch1');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle non-existent branches', async () => {
      await expect(
        findCommonAncestor(testRepoDir, 'non-existent-1', 'non-existent-2')
      ).rejects.toThrow();
    });

    test('should handle non-git directory', async () => {
      const nonGitDir = path.join(fixturesDir, 'non-git-2');
      await fs.mkdir(nonGitDir, { recursive: true });

      await expect(
        findCommonAncestor(nonGitDir, 'branch1', 'branch2')
      ).rejects.toThrow();
    });
  });

  describe('generateMergeReport', () => {
    test('should generate report from analysis data', () => {
      const analysis = {
        branch1: 'feature-1',
        branch2: 'main',
        conflicts: {
          has_conflicts: false,
          conflicts: [],
          total_conflicts: 0,
        },
        risk: {
          risk_score: 15,
          risk_level: 'low',
          risk_factors: [],
        },
        complexity: {
          level: 'low',
          score: 10,
        },
        common_ancestor: 'abc123',
      };

      const result = generateMergeReport(analysis);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should include summary section', () => {
      const analysis = {
        branch1: 'feature-1',
        branch2: 'main',
        conflicts: {
          has_conflicts: false,
          conflicts: [],
          total_conflicts: 0,
        },
        risk: {
          risk_score: 15,
          risk_level: 'low',
          risk_factors: [],
        },
        complexity: {
          level: 'low',
          score: 10,
        },
        common_ancestor: 'abc123',
      };

      const result = generateMergeReport(analysis);

      expect(result).toContain('Merge Analysis Report');
      expect(result).toContain('feature-1');
      expect(result).toContain('main');
    });

    test('should include conflict details when conflicts exist', () => {
      const analysis = {
        branch1: 'feature-1',
        branch2: 'main',
        conflicts: {
          has_conflicts: true,
          conflicts: [
            { file: 'file1.js', type: 'content', lines: 10 },
            { file: 'file2.js', type: 'delete', lines: 0 },
          ],
          total_conflicts: 2,
        },
        risk: {
          risk_score: 65,
          risk_level: 'medium',
          risk_factors: ['conflicts detected', 'large changeset'],
        },
        complexity: {
          level: 'medium',
          score: 60,
        },
        common_ancestor: 'abc123',
      };

      const result = generateMergeReport(analysis);

      expect(result).toContain('Conflicts');
      expect(result).toContain('file1.js');
      expect(result).toContain('file2.js');
    });

    test('should include risk assessment', () => {
      const analysis = {
        branch1: 'feature-1',
        branch2: 'main',
        conflicts: {
          has_conflicts: false,
          conflicts: [],
          total_conflicts: 0,
        },
        risk: {
          risk_score: 45,
          risk_level: 'medium',
          risk_factors: ['large changeset', 'multiple files'],
        },
        complexity: {
          level: 'low',
          score: 10,
        },
        common_ancestor: 'abc123',
      };

      const result = generateMergeReport(analysis);

      expect(result).toContain('Risk');
      expect(result).toContain('MEDIUM'); // Report uses uppercase
      expect(result).toContain('45');
    });

    test('should include complexity assessment', () => {
      const analysis = {
        branch1: 'feature-1',
        branch2: 'main',
        conflicts: {
          has_conflicts: false,
          conflicts: [],
          total_conflicts: 0,
        },
        risk: {
          risk_score: 15,
          risk_level: 'low',
          risk_factors: [],
        },
        complexity: {
          level: 'high',
          score: 85,
        },
        common_ancestor: 'abc123',
      };

      const result = generateMergeReport(analysis);

      expect(result).toContain('Complexity');
      expect(result).toContain('HIGH'); // Report uses uppercase
    });

    test('should format report with proper structure', () => {
      const analysis = {
        branch1: 'feature-1',
        branch2: 'main',
        conflicts: {
          has_conflicts: false,
          conflicts: [],
          total_conflicts: 0,
        },
        risk: {
          risk_score: 15,
          risk_level: 'low',
          risk_factors: [],
        },
        complexity: {
          level: 'low',
          score: 10,
        },
        common_ancestor: 'abc123',
      };

      const result = generateMergeReport(analysis);

      // Check for section headers
      expect(result).toMatch(/#{1,3}/); // Markdown headers
      expect(result).toContain('\n'); // Line breaks
    });
  });

  describe('Integration tests', () => {
    test('should perform complete merge analysis workflow', async () => {
      // Analyze conflicts
      const conflicts = await analyzeConflicts(testRepoDir, 'branch1', 'branch2');
      expect(conflicts).toHaveProperty('has_conflicts');

      // Get complexity
      const complexity = getConflictComplexity(conflicts.conflicts);
      expect(complexity).toHaveProperty('level');

      // Estimate risk
      const risk = await estimateMergeRisk(testRepoDir, 'branch1', 'branch2');
      expect(risk).toHaveProperty('risk_score');

      // Find common ancestor
      const ancestor = await findCommonAncestor(testRepoDir, 'branch1', 'branch2');
      expect(ancestor.length).toBeGreaterThan(0);

      // Generate report
      const analysis = {
        branch1: 'branch1',
        branch2: 'branch2',
        conflicts,
        risk,
        complexity,
        common_ancestor: ancestor,
      };
      const report = generateMergeReport(analysis);
      expect(report.length).toBeGreaterThan(0);
    });

    test('should handle conflicts with resolution suggestions', async () => {
      const conflicts = await analyzeConflicts(testRepoDir, 'branch1', 'branch2');

      if (conflicts.has_conflicts) {
        for (const conflict of conflicts.conflicts) {
          const suggestion = suggestResolution(conflict);
          expect(suggestion).toHaveProperty('strategy');
          expect(suggestion).toHaveProperty('automated');
        }
      }
    });
  });
});
