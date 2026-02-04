/**
 * Tests for Worktree Tracker
 *
 * @module test/lib/scheduler/worktree-tracker.test
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getActiveWorktrees,
  getWorktreeInfo,
  isWorktreeActive,
  trackWorktree,
  untrackWorktree,
  getWorktreeForTrack,
  getWorktreeStats,
} from '../../../lib/scheduler/worktree-tracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures directory
const fixturesDir = path.join(__dirname, '../../fixtures/worktree-tracker');
const testStateDir = path.join(fixturesDir, 'test-states');

describe('Worktree Tracker', () => {
  let testStatePath;

  beforeEach(async () => {
    // Ensure fixtures directory exists
    await fs.mkdir(testStateDir, { recursive: true });
    testStatePath = path.join(testStateDir, `test-state-${Date.now()}.json`);
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testStateDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('getActiveWorktrees', () => {
    test('should return empty array when no worktrees are tracked', async () => {
      const result = await getActiveWorktrees(testStatePath);

      expect(result).toEqual([]);
    });

    test('should return all tracked worktrees', async () => {
      const worktree1 = {
        path: '/path/to/worktree1',
        branch: 'feature-1',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };
      const worktree2 = {
        path: '/path/to/worktree2',
        branch: 'feature-2',
        track_id: 'track-2',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree1);
      await trackWorktree(testStatePath, worktree2);

      const result = await getActiveWorktrees(testStatePath);

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe(worktree1.path);
      expect(result[1].path).toBe(worktree2.path);
    });

    test('should handle state file not existing', async () => {
      const nonExistentPath = path.join(testStateDir, 'non-existent.json');
      const result = await getActiveWorktrees(nonExistentPath);

      expect(result).toEqual([]);
    });
  });

  describe('getWorktreeInfo', () => {
    test('should return worktree info for existing path', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree);

      const result = await getWorktreeInfo(testStatePath, worktree.path);

      expect(result).toEqual(worktree);
    });

    test('should return null for non-existent worktree', async () => {
      const result = await getWorktreeInfo(testStatePath, '/non/existent/path');

      expect(result).toBe(null);
    });

    test('should handle state file not existing', async () => {
      const nonExistentPath = path.join(testStateDir, 'non-existent.json');
      const result = await getWorktreeInfo(nonExistentPath, '/some/path');

      expect(result).toBe(null);
    });
  });

  describe('isWorktreeActive', () => {
    test('should return true for tracked worktree', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree);

      const result = await isWorktreeActive(testStatePath, worktree.path);

      expect(result).toBe(true);
    });

    test('should return false for non-tracked worktree', async () => {
      const result = await isWorktreeActive(testStatePath, '/non/existent/path');

      expect(result).toBe(false);
    });

    test('should handle state file not existing', async () => {
      const nonExistentPath = path.join(testStateDir, 'non-existent.json');
      const result = await isWorktreeActive(nonExistentPath, '/some/path');

      expect(result).toBe(false);
    });
  });

  describe('trackWorktree', () => {
    test('should add new worktree to state', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree);

      const result = await getWorktreeInfo(testStatePath, worktree.path);
      expect(result).toEqual(worktree);
    });

    test('should create worktrees array if it does not exist', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree);

      const worktrees = await getActiveWorktrees(testStatePath);
      expect(worktrees).toHaveLength(1);
    });

    test('should update existing worktree if path already exists', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree);

      const updatedWorktree = {
        ...worktree,
        status: 'completed',
      };

      await trackWorktree(testStatePath, updatedWorktree);

      const result = await getWorktreeInfo(testStatePath, worktree.path);
      expect(result.status).toBe('completed');

      const worktrees = await getActiveWorktrees(testStatePath);
      expect(worktrees).toHaveLength(1);
    });

    test('should validate required fields', async () => {
      const invalidWorktree = {
        path: '/path/to/worktree',
        // missing branch, track_id, created_at, status
      };

      await expect(trackWorktree(testStatePath, invalidWorktree)).rejects.toThrow();
    });

    test('should handle multiple worktrees', async () => {
      const worktree1 = {
        path: '/path/to/worktree1',
        branch: 'feature-1',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };
      const worktree2 = {
        path: '/path/to/worktree2',
        branch: 'feature-2',
        track_id: 'track-2',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree1);
      await trackWorktree(testStatePath, worktree2);

      const worktrees = await getActiveWorktrees(testStatePath);
      expect(worktrees).toHaveLength(2);
    });
  });

  describe('untrackWorktree', () => {
    test('should remove worktree from state', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree);
      await untrackWorktree(testStatePath, worktree.path);

      const result = await getWorktreeInfo(testStatePath, worktree.path);
      expect(result).toBe(null);
    });

    test('should not throw error when removing non-existent worktree', async () => {
      await expect(
        untrackWorktree(testStatePath, '/non/existent/path')
      ).resolves.not.toThrow();
    });

    test('should remove only specified worktree', async () => {
      const worktree1 = {
        path: '/path/to/worktree1',
        branch: 'feature-1',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };
      const worktree2 = {
        path: '/path/to/worktree2',
        branch: 'feature-2',
        track_id: 'track-2',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree1);
      await trackWorktree(testStatePath, worktree2);
      await untrackWorktree(testStatePath, worktree1.path);

      const worktrees = await getActiveWorktrees(testStatePath);
      expect(worktrees).toHaveLength(1);
      expect(worktrees[0].path).toBe(worktree2.path);
    });

    test('should handle state file not existing', async () => {
      const nonExistentPath = path.join(testStateDir, 'non-existent.json');
      await expect(
        untrackWorktree(nonExistentPath, '/some/path')
      ).resolves.not.toThrow();
    });
  });

  describe('getWorktreeForTrack', () => {
    test('should return worktree for given track ID', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree);

      const result = await getWorktreeForTrack(testStatePath, 'track-1');

      expect(result).toEqual(worktree);
    });

    test('should return null for non-existent track ID', async () => {
      const result = await getWorktreeForTrack(testStatePath, 'non-existent-track');

      expect(result).toBe(null);
    });

    test('should handle multiple worktrees with different tracks', async () => {
      const worktree1 = {
        path: '/path/to/worktree1',
        branch: 'feature-1',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };
      const worktree2 = {
        path: '/path/to/worktree2',
        branch: 'feature-2',
        track_id: 'track-2',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      await trackWorktree(testStatePath, worktree1);
      await trackWorktree(testStatePath, worktree2);

      const result = await getWorktreeForTrack(testStatePath, 'track-2');

      expect(result.path).toBe(worktree2.path);
    });

    test('should handle state file not existing', async () => {
      const nonExistentPath = path.join(testStateDir, 'non-existent.json');
      const result = await getWorktreeForTrack(nonExistentPath, 'track-1');

      expect(result).toBe(null);
    });
  });

  describe('getWorktreeStats', () => {
    test('should return statistics for empty worktree list', async () => {
      const result = await getWorktreeStats(testStatePath);

      expect(result).toEqual({
        total: 0,
        active: 0,
        completed: 0,
        failed: 0,
        by_status: {},
      });
    });

    test('should count worktrees by status', async () => {
      const worktree1 = {
        path: '/path/to/worktree1',
        branch: 'feature-1',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };
      const worktree2 = {
        path: '/path/to/worktree2',
        branch: 'feature-2',
        track_id: 'track-2',
        created_at: new Date().toISOString(),
        status: 'active',
      };
      const worktree3 = {
        path: '/path/to/worktree3',
        branch: 'feature-3',
        track_id: 'track-3',
        created_at: new Date().toISOString(),
        status: 'completed',
      };

      await trackWorktree(testStatePath, worktree1);
      await trackWorktree(testStatePath, worktree2);
      await trackWorktree(testStatePath, worktree3);

      const result = await getWorktreeStats(testStatePath);

      expect(result.total).toBe(3);
      expect(result.active).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.by_status).toEqual({
        active: 2,
        completed: 1,
      });
    });

    test('should handle failed status', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'failed',
      };

      await trackWorktree(testStatePath, worktree);

      const result = await getWorktreeStats(testStatePath);

      expect(result.total).toBe(1);
      expect(result.active).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.by_status).toEqual({
        failed: 1,
      });
    });

    test('should handle custom status values', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'paused',
      };

      await trackWorktree(testStatePath, worktree);

      const result = await getWorktreeStats(testStatePath);

      expect(result.total).toBe(1);
      expect(result.by_status).toEqual({
        paused: 1,
      });
    });

    test('should handle state file not existing', async () => {
      const nonExistentPath = path.join(testStateDir, 'non-existent.json');
      const result = await getWorktreeStats(nonExistentPath);

      expect(result).toEqual({
        total: 0,
        active: 0,
        completed: 0,
        failed: 0,
        by_status: {},
      });
    });
  });

  describe('Integration tests', () => {
    test('should handle complete worktree lifecycle', async () => {
      const worktree = {
        path: '/path/to/worktree',
        branch: 'feature-branch',
        track_id: 'track-1',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      // Track worktree
      await trackWorktree(testStatePath, worktree);
      expect(await isWorktreeActive(testStatePath, worktree.path)).toBe(true);

      // Get info
      let info = await getWorktreeInfo(testStatePath, worktree.path);
      expect(info.status).toBe('active');

      // Update status
      await trackWorktree(testStatePath, { ...worktree, status: 'completed' });
      info = await getWorktreeInfo(testStatePath, worktree.path);
      expect(info.status).toBe('completed');

      // Check stats
      let stats = await getWorktreeStats(testStatePath);
      expect(stats.total).toBe(1);
      expect(stats.completed).toBe(1);

      // Untrack
      await untrackWorktree(testStatePath, worktree.path);
      expect(await isWorktreeActive(testStatePath, worktree.path)).toBe(false);
    });

    test('should handle multiple worktrees with different tracks', async () => {
      const worktrees = [
        {
          path: '/path/to/worktree1',
          branch: 'feature-1',
          track_id: 'track-1',
          created_at: new Date().toISOString(),
          status: 'active',
        },
        {
          path: '/path/to/worktree2',
          branch: 'feature-2',
          track_id: 'track-2',
          created_at: new Date().toISOString(),
          status: 'completed',
        },
        {
          path: '/path/to/worktree3',
          branch: 'feature-3',
          track_id: 'track-3',
          created_at: new Date().toISOString(),
          status: 'failed',
        },
      ];

      // Track all
      for (const wt of worktrees) {
        await trackWorktree(testStatePath, wt);
      }

      // Verify all tracked
      const active = await getActiveWorktrees(testStatePath);
      expect(active).toHaveLength(3);

      // Find by track
      const track2 = await getWorktreeForTrack(testStatePath, 'track-2');
      expect(track2.path).toBe(worktrees[1].path);

      // Check stats
      const stats = await getWorktreeStats(testStatePath);
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });
});
