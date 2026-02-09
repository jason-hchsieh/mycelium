# Changelog

All notable changes to the Mycelium plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-02-09

### Fixed
- Wrapped hooks.json events under top-level `"hooks"` key to match expected plugin loader schema

## [0.1.1] - 2026-02-09

### Fixed
- Corrected hooks.json format to use matcher/hooks nesting per Claude Code docs
- Added missing YAML frontmatter to review, setup, and orchestration skills
- Replaced hardcoded absolute paths with portable `${CLAUDE_PLUGIN_ROOT}` references
- Updated branding from "Adaptive Workflow" to "Mycelium" in LICENSE and CHANGELOG

## [0.1.0] - 2024-02-03

### Added

#### Core Workflow
- Phase -1: Project Bootstrap with interactive setup
- Phase 0: Context Loading with capability discovery
- Phases 1-3: Understanding, Research, Discovery, and Planning
- Phase 4: Implementation with Iron Law TDD enforcement
- Phase 4.5: Evidence-based verification (no "should work" claims)
- Phase 4.5B: Context window management
- Phase 5: Two-stage review (spec compliance + code quality)
- Phase 6: Knowledge capture with feedback loops

#### Commands (15 total)
- **Workflow orchestration**: setup, plan, work, review, compound, status, resume
- **Context management**: context-sync, metrics
- **Learning feedback**: create-skill, list-skills
- **Git worktrees**: worktree-create, worktree-merge, worktree-cleanup
- **Pull requests**: pr-create, pr-review

#### Skills (6 total)
- Iron Law TDD - Test-first development enforcement
- Task Planning - Systematic task breakdown
- Verification - Evidence-based testing
- Solution Capture - Learning documentation
- Context Management - Context window handling
- Recovery - Stuck state protocols

#### Agents (3 total)
- spec-compliance-reviewer - Stage 1 review
- code-quality-reviewer - Stage 2 review
- learning-agent - Knowledge capture

#### Infrastructure
- Hooks: SessionStart (load context), Stop (save state)
- Templates: 13 templates for bootstrap, plans, solutions, gitignore
- Schemas: 7 JSON schemas with strict validation
- Lib utilities: 13 utility modules (refactored from 23) with documented interfaces

#### Knowledge Systems
- Solutions library with pattern promotion (3+ → critical-patterns.md)
- Learning store: decisions, conventions, preferences, anti-patterns, effective-prompts
- Automatic skill generation from recurring patterns
- Cross-plugin capability discovery

#### Execution Features
- Parallel task execution via git worktrees (default)
- Task dependency management (blockedBy/blocks)
- Model tier selection (haiku/sonnet/opus)
- Context window management with fresh agent spawning
- Progress files for context bridging

#### Quality Features
- YAML frontmatter validation (BLOCKING)
- Test coverage tracking
- Metrics collection (tasks, context, recovery)
- Project maturity modes (prototype/development/production/regulated)
- Security checklist (OWASP Top 10 + AI-specific)

### Design Principles
- Compound engineering: each unit of work makes subsequent units easier
- Evidence-based verification: no assumptions, only proof
- Progressive disclosure: lean core with detailed references
- Parallel-by-default: maximize throughput with dependency management
- Feedback loops: work → knowledge → improved future work

### External Integration
- Compatible with github, gitlab, gitea plugins
- Works with commit-commands plugin
- CLI fallbacks (gh, glab, tea) when MCPs unavailable
- Cross-plugin skill/agent/MCP discovery

## [Unreleased]

### Planned
- lib/ utility implementations (currently stubs)
- Advanced pattern detection algorithms
- Machine learning for preference detection
- Automated test generation
- Performance profiling integration
- Cost optimization recommendations
- Multi-language test framework support
- CI/CD pipeline templates
- Docker/Kubernetes deployment workflows
- Observability and monitoring setup

### Under Consideration
- Visual workflow dashboard
- Real-time collaboration features
- Cloud synchronization of learned knowledge
- Marketplace for community-contributed patterns
- Integration with issue trackers
- Time tracking and estimation calibration
- Code complexity analysis
- Dependency vulnerability scanning

[0.1.0]: https://github.com/jason-hchsieh/mycelium/releases/tag/v0.1.0
