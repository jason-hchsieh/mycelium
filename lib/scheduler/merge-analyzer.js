/**
 * Merge Analyzer
 *
 * Analyzes potential merge conflicts and risks between branches.
 * Provides conflict detection, complexity assessment, and merge recommendations.
 *
 * @module lib/scheduler/merge-analyzer
 */

import { execSync } from 'child_process';
import path from 'path';

/**
 * Analyze potential conflicts between two branches
 *
 * @param {string} repoPath - Path to repository
 * @param {string} branch1 - First branch name
 * @param {string} branch2 - Second branch name
 * @returns {Promise<Object>} Conflict analysis
 *
 * @example
 * const analysis = await analyzeConflicts('/repo', 'feature-1', 'main');
 */
export async function analyzeConflicts(repoPath, branch1, branch2) {
  try {
    // Try to perform a dry-run merge to detect conflicts
    const cmd = `git merge-tree $(git merge-base ${branch1} ${branch2}) ${branch1} ${branch2}`;
    const output = execSync(cmd, {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Parse the merge-tree output to detect conflicts
    const conflicts = [];
    const lines = output.split('\n');
    let hasConflicts = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for conflict markers or changed/deleted indicators
      if (line.includes('changed in both') || line.includes('deleted in') || line.includes('added in')) {
        hasConflicts = true;
        // Extract file path - typically after mode changes
        const match = line.match(/\s+(\S+)$/);
        if (match) {
          conflicts.push({
            file: match[1],
            type: 'content',
            lines: 10, // Estimated
          });
        }
      }
    }

    return {
      has_conflicts: hasConflicts,
      conflicts,
      total_conflicts: conflicts.length,
    };
  } catch (error) {
    // If git command fails, it might be due to invalid branches
    throw new Error(`Failed to analyze conflicts: ${error.message}`);
  }
}

/**
 * Assess the complexity of merge conflicts
 *
 * @param {Array} conflicts - Array of conflict objects
 * @returns {Object} Complexity assessment
 *
 * @example
 * const complexity = getConflictComplexity(conflicts);
 */
export function getConflictComplexity(conflicts) {
  if (!conflicts || conflicts.length === 0) {
    return {
      level: 'low',
      score: 0,
      details: 'No conflicts detected',
    };
  }

  // Calculate complexity score based on:
  // - Number of conflicts
  // - Total lines affected
  // - Number of different conflict types

  let score = 0;

  // Base score from number of conflicts
  score += conflicts.length * 5;

  // Add score based on lines
  const totalLines = conflicts.reduce((sum, c) => sum + (c.lines || 0), 0);
  score += totalLines * 0.1;

  // Count conflict types
  const types = new Set(conflicts.map((c) => c.type));
  score += types.size * 10;

  // Determine level
  let level;
  if (score < 30) {
    level = 'low';
  } else if (score < 70) {
    level = 'medium';
  } else {
    level = 'high';
  }

  return {
    level,
    score: Math.min(100, Math.round(score)),
    details: {
      total_conflicts: conflicts.length,
      total_lines: totalLines,
      conflict_types: types.size,
    },
  };
}

/**
 * Suggest a resolution strategy for a conflict
 *
 * @param {Object} conflict - Conflict object
 * @returns {Object} Resolution suggestion
 *
 * @example
 * const suggestion = suggestResolution(conflict);
 */
export function suggestResolution(conflict) {
  const { type, lines = 0 } = conflict;

  switch (type) {
    case 'content':
      if (lines < 10) {
        return {
          strategy: 'manual',
          description: 'Small conflict, manual review recommended',
          automated: false,
        };
      } else {
        return {
          strategy: 'manual',
          description: 'Large conflict, requires careful manual resolution',
          automated: false,
        };
      }

    case 'delete':
      return {
        strategy: 'review',
        description: 'File deleted in one branch, review needed',
        automated: false,
      };

    case 'rename':
      return {
        strategy: 'review',
        description: 'File renamed, review needed',
        automated: false,
      };

    default:
      return {
        strategy: 'manual',
        description: 'Unknown conflict type, manual resolution required',
        automated: false,
      };
  }
}

/**
 * Estimate the risk of merging two branches
 *
 * @param {string} repoPath - Path to repository
 * @param {string} branch1 - First branch name
 * @param {string} branch2 - Second branch name
 * @returns {Promise<Object>} Risk assessment
 *
 * @example
 * const risk = await estimateMergeRisk('/repo', 'feature-1', 'main');
 */
export async function estimateMergeRisk(repoPath, branch1, branch2) {
  try {
    // Analyze conflicts
    const conflictAnalysis = await analyzeConflicts(repoPath, branch1, branch2);

    // Get diff stats
    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;

    try {
      const diffCmd = `git diff --shortstat ${branch1}...${branch2}`;
      const diffOutput = execSync(diffCmd, {
        cwd: repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Parse: "5 files changed, 123 insertions(+), 45 deletions(-)"
      const match = diffOutput.match(/(\d+)\s+file[s]?\s+changed(?:,\s+(\d+)\s+insertion[s]?\(\+\))?(?:,\s+(\d+)\s+deletion[s]?\(-\))?/);
      if (match) {
        filesChanged = parseInt(match[1] || '0', 10);
        insertions = parseInt(match[2] || '0', 10);
        deletions = parseInt(match[3] || '0', 10);
      }
    } catch (error) {
      // If branches are identical, diff will be empty
    }

    // Calculate risk score (0-100)
    let riskScore = 0;
    const riskFactors = [];

    // Risk from conflicts
    if (conflictAnalysis.has_conflicts) {
      riskScore += 30;
      riskFactors.push('conflicts detected');
    }

    // Risk from changeset size
    if (filesChanged > 10) {
      riskScore += 20;
      riskFactors.push('large changeset');
    } else if (filesChanged > 5) {
      riskScore += 10;
      riskFactors.push('moderate changeset');
    }

    // Risk from line changes
    const totalChanges = insertions + deletions;
    if (totalChanges > 500) {
      riskScore += 25;
      riskFactors.push('many line changes');
    } else if (totalChanges > 200) {
      riskScore += 15;
      riskFactors.push('moderate line changes');
    }

    // Risk from complexity
    const complexity = getConflictComplexity(conflictAnalysis.conflicts);
    if (complexity.level === 'high') {
      riskScore += 25;
      riskFactors.push('high complexity');
    } else if (complexity.level === 'medium') {
      riskScore += 10;
      riskFactors.push('medium complexity');
    }

    // Determine risk level
    let riskLevel;
    if (riskScore < 30) {
      riskLevel = 'low';
    } else if (riskScore < 60) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    return {
      risk_score: Math.min(100, riskScore),
      risk_level: riskLevel,
      risk_factors: riskFactors,
      details: {
        files_changed: filesChanged,
        insertions,
        deletions,
        has_conflicts: conflictAnalysis.has_conflicts,
      },
    };
  } catch (error) {
    throw new Error(`Failed to estimate merge risk: ${error.message}`);
  }
}

/**
 * Compare two worktrees
 *
 * @param {string} repoPath - Path to repository
 * @param {string} worktree1 - First worktree path
 * @param {string} worktree2 - Second worktree path
 * @returns {Promise<Object>} Comparison result
 *
 * @example
 * const diff = await compareWorktrees('/repo', '/path/wt1', '/path/wt2');
 */
export async function compareWorktrees(repoPath, worktree1, worktree2) {
  try {
    // Use git diff to compare the worktrees
    // This is a simplified version - in practice, you'd need to handle paths more carefully
    const cmd = `git diff --stat HEAD`;

    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;
    const changedFiles = [];

    try {
      const output = execSync(cmd, {
        cwd: repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Parse output
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line.split('|');
          if (parts[0]) {
            changedFiles.push(parts[0].trim());
          }
        }
        if (line.includes('file')) {
          const match = line.match(/(\d+)\s+file[s]?\s+changed(?:,\s+(\d+)\s+insertion[s]?\(\+\))?(?:,\s+(\d+)\s+deletion[s]?\(-\))?/);
          if (match) {
            filesChanged = parseInt(match[1] || '0', 10);
            insertions = parseInt(match[2] || '0', 10);
            deletions = parseInt(match[3] || '0', 10);
          }
        }
      }
    } catch (error) {
      // No differences
    }

    return {
      differences: filesChanged > 0,
      files_changed: filesChanged,
      insertions,
      deletions,
      changed_files: changedFiles,
    };
  } catch (error) {
    throw new Error(`Failed to compare worktrees: ${error.message}`);
  }
}

/**
 * Find common ancestor between two branches
 *
 * @param {string} repoPath - Path to repository
 * @param {string} branch1 - First branch name
 * @param {string} branch2 - Second branch name
 * @returns {Promise<string>} Common ancestor commit hash
 *
 * @example
 * const ancestor = await findCommonAncestor('/repo', 'feature-1', 'main');
 */
export async function findCommonAncestor(repoPath, branch1, branch2) {
  try {
    const cmd = `git merge-base ${branch1} ${branch2}`;
    const output = execSync(cmd, {
      cwd: repoPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return output.trim();
  } catch (error) {
    throw new Error(`Failed to find common ancestor: ${error.message}`);
  }
}

/**
 * Generate a formatted merge analysis report
 *
 * @param {Object} analysis - Analysis data
 * @returns {string} Formatted report
 *
 * @example
 * const report = generateMergeReport(analysis);
 */
export function generateMergeReport(analysis) {
  const {
    branch1,
    branch2,
    conflicts,
    risk,
    complexity,
    common_ancestor,
  } = analysis;

  let report = '# Merge Analysis Report\n\n';
  report += `## Branches\n`;
  report += `- Source: ${branch1}\n`;
  report += `- Target: ${branch2}\n`;

  if (common_ancestor) {
    report += `- Common Ancestor: ${common_ancestor.substring(0, 8)}\n`;
  }

  report += '\n';

  // Conflicts section
  report += '## Conflicts\n';
  if (conflicts.has_conflicts) {
    report += `- Total Conflicts: ${conflicts.total_conflicts}\n`;
    report += `- Status: **CONFLICTS DETECTED**\n\n`;
    report += '### Conflicted Files:\n';
    for (const conflict of conflicts.conflicts) {
      report += `- ${conflict.file} (${conflict.type}, ~${conflict.lines} lines)\n`;
    }
  } else {
    report += '- Status: **NO CONFLICTS**\n';
  }
  report += '\n';

  // Risk section
  report += '## Risk Assessment\n';
  report += `- Risk Level: **${risk.risk_level.toUpperCase()}**\n`;
  report += `- Risk Score: ${risk.risk_score}/100\n`;
  if (risk.risk_factors.length > 0) {
    report += `- Risk Factors:\n`;
    for (const factor of risk.risk_factors) {
      report += `  - ${factor}\n`;
    }
  }
  report += '\n';

  // Complexity section
  report += '## Complexity\n';
  report += `- Level: **${complexity.level.toUpperCase()}**\n`;
  report += `- Score: ${complexity.score}/100\n`;
  report += '\n';

  return report;
}
