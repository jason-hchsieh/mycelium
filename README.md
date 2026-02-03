# Adaptive AI Development Workflow

A meta-workflow orchestration plugin for Claude Code that implements systematic development with compounding knowledge capture. Inspired by Conductor, Superpowers, and Compound Engineering principles.

## Core Philosophy

> Each unit of work should make subsequent units easier through compounding knowledge and systematic processes.

## Features

### 🎯 Comprehensive Workflow Phases

- **Phase -1: Project Bootstrap** - Initialize projects with .workflow/ structure
- **Phase 0: Context Loading** - Load institutional knowledge and capabilities
- **Phases 1-2: Understanding & Planning** - Break down work into parallelizable tasks
- **Phase 4: Implementation** - Iron Law TDD with parallel worktree execution
- **Phase 4.5: Verification** - Evidence-based testing (no "should work" claims)
- **Phase 5: Review** - Two-stage review (spec compliance + code quality)
- **Phase 6: Finalization** - Knowledge capture with feedback loops

### 📚 Knowledge Compounding System

**Solutions Library (`.workflow/solutions/`):**
- Pattern-based knowledge capture
- Automatic promotion (3+ occurrences → critical-patterns.md)
- Searchable by problem type and tags

**Learning Store (`.workflow/learned/`):**
- `decisions/` - Architectural decisions with context
- `conventions/` - Detected code patterns
- `preferences.yaml` - User preferences learned from corrections
- `anti-patterns/` - Mistakes to avoid
- `effective-prompts/` - Approaches that worked

### 🔄 Feedback Loops

- **Pattern → Skill**: Auto-generate skills from recurring patterns
- **Work → Knowledge**: Capture solutions, decisions, conventions
- **Context → Discovery**: Auto-discover capabilities from all plugin scopes
- **Corrections → Learning**: Learn preferences from user feedback

### ⚡ Parallel Execution (Default)

- Git worktrees for isolated parallel tasks
- Dependency management (blockedBy/blocks)
- Task scheduler with DAG resolution
- Model tier selection (haiku/sonnet/opus)

### 🧠 Context Window Management

- Phase 4.5B: Automatic context sync
- Progress files bridge context between sessions
- Fresh agent spawning when context > 80%
- Checkpoint-based resumption

## Installation

### From Local Directory

```bash
# Test locally
claude-code --plugin-dir /path/to/adaptive-workflow

# Or symlink to project plugins
ln -s /path/to/adaptive-workflow /path/to/project/.claude/plugins/adaptive-workflow
```

### From Git Repository

```bash
# Clone to user plugins directory
git clone https://github.com/yourusername/adaptive-workflow ~/.claude/plugins/adaptive-workflow
```

## Quick Start

### 1. Initialize a Project

```bash
/workflow:setup
```

This creates the `.workflow/` directory structure:
```
.workflow/
├── context/           # Project information
│   ├── product.md
│   ├── tech-stack.md
│   └── workflow.md
├── plans/             # Implementation plans
├── solutions/         # Documented solutions
│   └── patterns/
│       └── critical-patterns.md
├── learned/           # Learning store
│   ├── decisions/
│   ├── conventions/
│   ├── preferences.yaml
│   ├── anti-patterns/
│   └── effective-prompts/
└── state/             # Session state
    ├── session_state.json
    └── progress.md
```

### 2. Create an Implementation Plan

```bash
/workflow:plan "Add user authentication"
```

Creates a detailed plan with:
- Task breakdown with complexity estimates
- Dependency relationships (blockedBy/blocks)
- Agent, skill, and model assignments
- Acceptance criteria for each task
- Test strategy

### 3. Execute the Plan

```bash
/workflow:work
```

Executes tasks with:
- Parallel worktree execution (default)
- Iron Law TDD enforcement
- Evidence-based verification
- Automatic context sync

### 4. Review Implementation

```bash
/workflow:review
```

Two-stage review:
- **Stage 1**: Spec compliance (blocking gate)
- **Stage 2**: Code quality (security, performance, architecture)

### 5. Capture Knowledge

```bash
/workflow:compound
```

Captures:
- Solutions with validated YAML frontmatter
- Architectural decisions
- Code conventions
- Patterns (promotes to critical-patterns.md after 3+)
- Generates skills from recurring patterns

## Commands Reference

### Core Workflow

| Command | Phase | Description |
|---------|-------|-------------|
| `/workflow:setup` | -1 | Initialize project with .workflow/ structure |
| `/workflow:plan` | 1-3 | Create implementation plan with task breakdown |
| `/workflow:work` | 4 | Execute tasks with TDD and parallel execution |
| `/workflow:review` | 5 | Two-stage comprehensive review |
| `/workflow:compound` | 6 | Capture knowledge with feedback loops |
| `/workflow:status` | - | Show session state and progress |
| `/workflow:resume` | - | Resume interrupted session |

### Context Management

| Command | Description |
|---------|-------------|
| `/workflow:context-sync` | Sync context, spawn fresh agent if needed |
| `/workflow:metrics` | Display session effectiveness metrics |

### Learning & Feedback

| Command | Description |
|---------|-------------|
| `/workflow:create-skill` | Generate skill from detected patterns |
| `/workflow:list-skills` | List all discovered skills |

### Git Worktrees

| Command | Description |
|---------|-------------|
| `/workflow:worktree-create` | Create isolated worktree for task |
| `/workflow:worktree-merge` | Merge completed worktree |
| `/workflow:worktree-cleanup` | Remove completed worktrees |

### Pull Requests

| Command | Description |
|---------|-------------|
| `/workflow:pr-create` | Create PR (uses MCP or CLI fallback) |
| `/workflow:pr-review` | Automated PR review |

## Skills

The plugin provides 6 workflow-specific skills:

| Skill | Purpose | Triggers |
|-------|---------|----------|
| **Iron Law TDD** | Enforce test-first development | "implement feature", "write code", "fix bug" |
| **Task Planning** | Break down work systematically | "create a plan", "estimate complexity" |
| **Verification** | Evidence-based testing | "verify this works", "test the implementation" |
| **Solution Capture** | Document learnings | "capture this solution", "document the fix" |
| **Context Management** | Manage context windows | "context sync", "fresh agent" |
| **Recovery** | Handle stuck states | "stuck", "debugging failed", "try different approach" |

## Agents

3 specialized agents for workflow tasks:

| Agent | Purpose | Tools |
|-------|---------|-------|
| **spec-compliance-reviewer** | Verify implementation matches requirements | Read, Grep, Glob, Bash |
| **code-quality-reviewer** | Assess security, performance, architecture | Read, Grep, Glob, Bash |
| **learning-agent** | Capture and analyze institutional knowledge | Read, Write, Grep, Glob, Bash |

## Hooks

- **SessionStart**: Load project context + discover capabilities
- **Stop**: Save session state

## Configuration

### Project-Level (`.workflow/context/`)

**product.md** - Product vision and goals
**tech-stack.md** - Technical stack details
**workflow.md** - Development practices

### Session State (`.workflow/state/session_state.json`)

Tracks:
- Current session ID and timestamps
- Active tracks and worktrees
- Discovered capabilities (agents, skills, MCPs)
- Metrics (tasks completed/failed, context resets, interventions)

## Project Maturity Modes

Configure in `.workflow/context/workflow.md`:

| Mode | TDD | Coverage | Review | Use Case |
|------|-----|----------|--------|----------|
| **prototype** | flexible | 50% | minimal | Rapid experimentation |
| **development** | standard | 80% | full | Active development |
| **production** | strict | 90% | full | Production code |
| **regulated** | strict | 95% | full + compliance | Regulated industries |

## Task Complexity Classification

Beyond simple T/S/M/L sizing:

```yaml
complexity: M
integration_points: 2
domain_novelty: partially_known
test_complexity: integration
reversibility: requires_migration
uncertainty: medium
```

## Dependency Management

Enable parallel execution:

```yaml
Task 1.1: Setup database
  blockedBy: []
  blocks: [1.2, 1.3]

Task 1.2: User model
  blockedBy: [1.1]
  blocks: [2.1]
```

Plugin manages execution order automatically.

## Model Tier Selection

```yaml
# Per-task model assignment
Task 1.1: Database schema
  model: opus      # Complex architecture

Task 1.2: CRUD endpoints
  model: sonnet    # Standard implementation (default)

Task 1.3: Code review
  model: haiku     # Fast, cheap
```

## External Plugin Integration

Works with these external plugins (optional):

| Plugin | Provides | Fallback |
|--------|----------|----------|
| **github** | github-mcp, GitHub skills | gh CLI |
| **gitlab** | gitlab-mcp, GitLab skills | glab CLI |
| **gitea** | gitea-mcp, Gitea skills | tea CLI |
| **commit-commands** | /commit, /commit-push-pr | git commands |

## Directory Structure

```
adaptive-workflow/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── agents/
│   ├── review/
│   │   ├── spec-compliance.md
│   │   └── code-quality.md
│   └── learning-agent.md
├── commands/
│   ├── workflow/             # Core workflow (7 commands)
│   ├── context/              # Context management (2 commands)
│   ├── learning/             # Learning & feedback (2 commands)
│   ├── worktree/             # Git worktrees (3 commands)
│   └── pr/                   # Pull requests (2 commands)
├── skills/
│   ├── workflow/
│   │   ├── tdd/
│   │   ├── planning/
│   │   ├── verification/
│   │   └── solution-capture/
│   ├── context/
│   └── recovery/
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       ├── session-start.sh
│       └── save-state.sh
├── templates/                # 12 templates
│   ├── project/
│   ├── plans/
│   ├── solutions/
│   ├── state/
│   └── gitignore/
├── schemas/                  # 7 JSON schemas
│   ├── session-state.schema.json
│   ├── solution-frontmatter.schema.json
│   ├── plan-frontmatter.schema.json
│   ├── enums.json
│   └── ...
└── lib/                      # 23 utility modules (stubs)
    ├── discovery/
    ├── learning/
    ├── scheduler/
    └── agents/
```

## Best Practices

### 1. Always Use TDD
Tests first, implementation second. No exceptions.

### 2. Document Solutions
Every non-trivial fix should be captured in `.workflow/solutions/`.

### 3. Plan Before Implementing
Use `/workflow:plan` to break down work systematically.

### 4. Leverage Parallelism
Design tasks with minimal dependencies for maximum parallelism.

### 5. Track Deviations
Update plans when requirements change, log reasons in deviations section.

### 6. Context Sync Regularly
Run `/workflow:context-sync` in long sessions to prevent context overload.

### 7. Review Comprehensively
Use two-stage review: spec compliance first, code quality second.

### 8. Capture Knowledge
Run `/workflow:compound` after completing work to build institutional knowledge.

## Troubleshooting

### "No .workflow directory found"
Run `/workflow:setup` to initialize the project.

### "Cannot create worktree"
Ensure you're in a git repository and the branch doesn't already have a worktree.

### "Tests not found"
Check test paths in your project configuration and ensure test framework is installed.

### "Pattern detection not working"
Ensure solution files have proper YAML frontmatter with tags. Patterns detected at 3+ occurrences.

### "Context window exceeded"
Run `/workflow:context-sync` to compress context or spawn fresh agent.

## Development

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage
npm run coverage
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the Iron Law TDD
4. Run `/workflow:review` before submitting
5. Document solutions in PR description
6. Submit pull request

## License

MIT

## Credits

Inspired by:
- **Conductor** - Workflow orchestration patterns
- **Superpowers** - Knowledge compounding principles
- **Compound Engineering** - Systematic improvement methodology

Built for **Claude Code** by Anthropic.

## Support

- Issues: [GitHub Issues](https://github.com/yourusername/adaptive-workflow/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/adaptive-workflow/discussions)
- Documentation: This README and inline documentation

## Version

**v0.1.0** - Initial release

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
