# Adaptive AI Development Workflow

A meta-workflow orchestration plugin for Claude Code that implements systematic development with compounding knowledge capture. Inspired by Conductor, Superpowers, and Compound Engineering principles.

## Core Philosophy

> Each unit of work should make subsequent units easier through compounding knowledge and systematic processes.

## Workflow Overview

```mermaid
flowchart TD
    Start([Session Start]) --> CheckProject{Project<br/>Exists?}

    %% Phase -1: Bootstrap
    CheckProject -->|No| Bootstrap[-1: Project Bootstrap]
    Bootstrap --> Interactive[Interactive Setup<br/>One Question at a Time]
    Interactive --> CreateStructure[Create .workflow/<br/>Directory Structure]
    CreateStructure --> GitInit[Initialize Git<br/>MANDATORY]
    GitInit --> Phase0

    %% Phase 0: Context Loading
    CheckProject -->|Yes| Phase0[0: Context Loading]
    Phase0 --> LoadContext[Load Project Context<br/>product.md, tech-stack.md]
    LoadContext --> LoadKnowledge[Load Institutional Knowledge<br/>solutions/, learned/]
    LoadKnowledge --> DiscoverCaps[Discover Capabilities<br/>All Plugin Scopes]
    DiscoverCaps --> Phase1

    %% Phase 1: Clarify, Phase 2: Discover, Phase 3: Plan & Assign
    Phase1[1: Clarify Request] --> Analyze[Analyze Requirements<br/>Estimate Complexity]
    Analyze --> Research{Need External<br/>Research?}
    Research -->|Yes| Phase15[1.5: Research]
    Research -->|No| Phase2
    Phase15 --> Phase2[2: Discover Capabilities]
    Phase2 --> DiscoverSkills[Discover Skills<br/>All Plugin Scopes]
    DiscoverSkills --> DiscoverAgents[Discover Agents<br/>Built-in + External]
    DiscoverAgents --> DiscoverMCP[Discover MCPs<br/>All Configured]
    DiscoverMCP --> Phase3[3: Planning & Assignment]
    Phase3 --> CreatePlan[Create Implementation Plan<br/>Task Breakdown + Dependencies]
    CreatePlan --> AssignCaps[Assign to Each Task:<br/>• Best-fit agent<br/>• Relevant skills<br/>• Model tier haiku/sonnet/opus]
    AssignCaps --> VerifyAssign[Verify All Assignments<br/>Have Discovered Capabilities]
    VerifyAssign --> CheckTasks{Multiple<br/>Tasks?}

    %% Phase 4: Implementation - Parallel First
    CheckTasks -->|Yes| Parallel[4: Parallel Execution<br/>Git Worktrees DEFAULT]
    Parallel --> TaskScheduler[Task Scheduler<br/>Resolve DAG Dependencies]
    TaskScheduler --> SpawnAgents[Spawn Agent Per Task<br/>with Fresh Context]
    SpawnAgents --> ParallelTDD[Each Agent: Iron Law TDD]
    ParallelTDD --> Phase45

    CheckTasks -->|No| Phase4Single[4: Single Task Implementation]
    Phase4Single --> TDD[Iron Law TDD]
    TDD --> RED[1. Write Test FIRST]
    RED --> VerifyRed[2. Verify Test FAILS]
    VerifyRed --> GREEN[3. Implement Minimum Code]
    GREEN --> VerifyGreen[4. Verify Test PASSES]
    VerifyGreen --> EdgeCases[5. Add Edge Case Tests]
    EdgeCases --> HandleEdges[6. Handle Edge Cases]
    HandleEdges --> AllTests[7. Run Full Test Suite]
    AllTests --> Phase45

    %% Phase 4.5: Verification
    Phase45[4.5: Verification] --> EvidenceCheck[Evidence-Based Check<br/>NO 'should work']
    EvidenceCheck --> RunTests[Run All Tests]
    RunTests --> Coverage[Check Coverage ≥80%]
    Coverage --> Lint[Run Linters]
    Lint --> Build[Verify Build]
    Build --> ContextCheck{Context<br/>>80%?}

    %% Phase 4.5B: Context Management
    ContextCheck -->|Yes| Phase45B[4.5B: Context Sync]
    Phase45B --> Summarize[Summarize Work<br/>≤500 tokens]
    Summarize --> UpdateProgress[Update progress.md]
    UpdateProgress --> SpawnFresh[Spawn Fresh Agent<br/>with Compressed Context]
    SpawnFresh --> Phase5
    ContextCheck -->|No| Phase5

    %% Phase 5: Two-Stage Review
    Phase5[5: Review] --> Stage1[Stage 1: Spec Compliance]
    Stage1 --> SpecCheck{Meets All<br/>Requirements?}
    SpecCheck -->|No| FixSpec[Fix Missing Requirements]
    FixSpec --> Phase4
    SpecCheck -->|Yes| Stage2[Stage 2: Code Quality Review<br/>Parallel Multi-Agent]
    Stage2 --> Security[Security Analysis<br/>OWASP + AI-specific]
    Stage2 --> Performance[Performance Analysis<br/>Algorithms + Bottlenecks]
    Stage2 --> Architecture[Architecture Review<br/>Patterns + Design]
    Security --> CombineReview[Combine Reviews]
    Performance --> CombineReview
    Architecture --> CombineReview
    CombineReview --> CriticalIssues{Critical<br/>Issues?}
    CriticalIssues -->|Yes| FixIssues[Fix Critical Issues]
    FixIssues --> Phase4
    CriticalIssues -->|No| Phase6

    %% Phase 6: Knowledge Capture
    Phase6[6: Finalization] --> Commit[Git Commit<br/>with Co-Author]
    Commit --> CreatePR[Create Pull Request<br/>MCP or CLI]
    CreatePR --> Phase6E[6E: Pattern Detection]
    Phase6E --> DetectPatterns[Detect 3+ Similar Solutions]
    DetectPatterns --> PromotePattern{Pattern<br/>Found?}
    PromotePattern -->|Yes| UpdateCritical[Update critical-patterns.md]
    UpdateCritical --> Phase6ESkill
    PromotePattern -->|No| Phase6F
    Phase6ESkill{Generate<br/>Skill?}
    Phase6ESkill -->|Yes| GenSkill[Auto-Generate Skill<br/>from Pattern]
    GenSkill --> Phase6F
    Phase6ESkill -->|No| Phase6F

    Phase6F[6F: Store Learned Knowledge] --> CaptureSolution[Capture Solution<br/>with YAML Validation]
    CaptureSolution --> CaptureDecision[Capture Decisions<br/>.workflow/learned/decisions/]
    CaptureDecision --> CaptureConvention[Detect Conventions<br/>.workflow/learned/conventions/]
    CaptureConvention --> UpdatePrefs[Update Preferences<br/>.workflow/learned/preferences.yaml]
    UpdatePrefs --> TrackAntiPattern[Track Anti-Patterns<br/>.workflow/learned/anti-patterns/]
    TrackAntiPattern --> RecordPrompt[Record Effective Prompts<br/>.workflow/learned/effective-prompts/]
    RecordPrompt --> UpdateMetrics[Update Session Metrics]
    UpdateMetrics --> Done([Work Complete])

    %% Feedback Loops
    Done -.->|Knowledge<br/>Compounds| Phase0
    UpdateCritical -.->|Pattern<br/>→ Skill| Phase3
    RecordPrompt -.->|Learning<br/>→ Better Work| Phase4

    %% Styling
    classDef bootstrap fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef context fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef planning fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef implementation fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef verification fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef review fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef finalization fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef decision fill:#fff,stroke:#666,stroke-width:2px,stroke-dasharray: 5 5

    class Bootstrap,Interactive,CreateStructure,GitInit bootstrap
    class Phase0,LoadContext,LoadKnowledge,DiscoverCaps context
    class Phase1,Analyze,Phase15,Phase2,CreatePlan,Phase3,VerifyCaps planning
    class Phase4,TDD,RED,VerifyRed,GREEN,VerifyGreen,EdgeCases,HandleEdges,AllTests,Parallel,TaskScheduler,SpawnAgents implementation
    class Phase45,EvidenceCheck,RunTests,Coverage,Lint,Build,Phase45B,Summarize,UpdateProgress,SpawnFresh verification
    class Phase5,Stage1,Stage2,Security,Performance,Architecture,CombineReview,FixSpec,FixIssues review
    class Phase6,Commit,CreatePR,Phase6E,DetectPatterns,UpdateCritical,GenSkill,Phase6F,CaptureSolution,CaptureDecision,CaptureConvention,UpdatePrefs,TrackAntiPattern,RecordPrompt,UpdateMetrics finalization
    class CheckProject,Research,Phase4C,ContextCheck,SpecCheck,CriticalIssues,PromotePattern,Phase6ESkill decision
```

**Key Features:**
- 🔄 **Feedback Loops**: Knowledge compounds across sessions
- ⚡ **Parallel Execution**: Default mode with dependency management
- 🧪 **Iron Law TDD**: 11-step test-first cycle enforced
- 🎯 **Evidence-Based**: No "should work" - only verified proof
- 🧠 **Context Management**: Auto-sync at 80% threshold
- 📚 **Knowledge Capture**: Solutions → Patterns → Skills

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
