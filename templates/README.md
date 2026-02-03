# Adaptive Workflow Templates

This directory contains all templates used by the adaptive-workflow plugin for creating project structure and documentation.

## Template Structure

```
templates/
├── project/              # Project context templates
│   ├── CLAUDE.md.template
│   ├── product.md.template
│   ├── tech-stack.md.template
│   ├── workflow.md.template
│   └── critical-patterns.md.template
├── plans/                # Plan document templates
│   └── plan.md.template
├── solutions/            # Solution documentation templates
│   └── solution.md.template
├── state/                # Progress tracking templates
│   └── progress.md.template
└── gitignore/            # Language-specific gitignore templates
    ├── node.gitignore
    ├── python.gitignore
    ├── go.gitignore
    └── rust.gitignore
```

## Template Variables

All templates use `{{VARIABLE}}` syntax for placeholders that should be replaced when instantiating.

### Project Templates

**CLAUDE.md.template** - Quick project context file
- `{{PROJECT_NAME}}` - Name of the project
- `{{PROJECT_DESCRIPTION}}` - One-line description
- `{{PRIMARY_LANGUAGE}}` - Main programming language
- `{{FRAMEWORK}}` - Framework being used
- `{{DATABASE}}` - Database system
- `{{TDD_STRICTNESS}}` - TDD enforcement level
- `{{COVERAGE_TARGET}}` - Test coverage percentage target
- `{{COMMIT_STYLE}}` - Git commit message style
- `{{TEST_COMMAND}}` - Command to run tests
- `{{DEV_COMMAND}}` - Command to start development
- `{{BUILD_COMMAND}}` - Command to build project

**product.md.template** - Product vision and goals
- `{{PROJECT_NAME}}` - Product name
- `{{VERSION}}` - Current version
- `{{LAST_UPDATED}}` - Last update date
- `{{PRODUCT_VISION}}` - Vision statement
- `{{PROBLEM_STATEMENT}}` - Problem being solved
- `{{TARGET_USERS}}` - User personas
- `{{GOAL_N}}` - Key goals (1-3)
- `{{METRIC_N}}` - Success metrics
- `{{IN_SCOPE_N}}` - In-scope features
- `{{OUT_OF_SCOPE_N}}` - Out-of-scope features

**tech-stack.md.template** - Technical stack documentation
- `{{PRIMARY_LANGUAGE}}` - Main language
- `{{LANGUAGE_VERSION}}` - Language version
- `{{SECONDARY_LANGUAGES}}` - Additional languages
- `{{FRAMEWORK}}` - Framework name
- `{{FRAMEWORK_VERSION}}` - Framework version
- `{{FRAMEWORK_PURPOSE}}` - Why this framework
- `{{DATABASE_TYPE}}` - SQL/NoSQL/None
- `{{DATABASE_SYSTEM}}` - Specific system
- `{{HOSTING_PLATFORM}}` - Where hosted
- `{{CI_CD_PLATFORM}}` - CI/CD system
- `{{PACKAGE_N}}` - Key dependencies
- `{{PURPOSE_N}}` - Dependency purposes
- `{{VERSION_N}}` - Dependency versions
- `{{RECOMMENDED_EDITOR}}` - Suggested editor
- `{{LINTER_TOOL}}` - Linting tool
- `{{FORMATTER_TOOL}}` - Formatting tool
- `{{TEST_FRAMEWORK}}` - Testing framework

**workflow.md.template** - Development practices
- `{{TDD_STRICTNESS}}` - strict|flexible|none
- `{{COMMIT_STYLE}}` - conventional|descriptive|atomic
- `{{COVERAGE_TARGET}}` - Coverage percentage
- `{{REVIEW_REQUIRED}}` - true|false
- `{{LAST_UPDATED}}` - Last update date
- `{{TEST_FRAMEWORK}}` - Testing framework
- `{{BRANCH_NAMING_PATTERN}}` - Branch naming convention
- `{{PR_REQUIREMENTS}}` - PR requirements
- `{{REVIEWER_COUNT}}` - Required reviewers
- `{{AUTO_MERGE}}` - yes|no
- `{{REVIEW_CHECKLIST}}` - Review checklist
- `{{STAGING_STRATEGY}}` - Staging deployment
- `{{PRODUCTION_STRATEGY}}` - Production deployment

**critical-patterns.md.template** - Pattern documentation
- `{{LAST_UPDATED}}` - Last update date
- `{{PATTERN_NAME}}` - Pattern name
- `{{OCCURRENCE_COUNT}}` - Times seen
- `{{WHAT_GOES_WRONG}}` - Problem description
- `{{WHAT_TO_DO_INSTEAD}}` - Solution description
- `{{LANGUAGE}}` - Code language
- `{{BAD_CODE_EXAMPLE}}` - Anti-pattern example
- `{{GOOD_CODE_EXAMPLE}}` - Correct pattern example
- `{{CATEGORY}}` - Solution category
- `{{FILE_N}}` - Reference files

### Plan Template

**plan.md.template** - Implementation plan with YAML frontmatter
- `{{TRACK_ID}}` - Track identifier (format: name_YYYYMMDD)
- `{{TRACK_TYPE}}` - feature|bug|chore|refactor
- `{{SIZE}}` - trivial|small|medium|large
- `{{CREATED_TIMESTAMP}}` - ISO 8601 timestamp
- `{{TOTAL_TASKS}}` - Total task count
- `{{TRACK_TITLE}}` - Plan title
- `{{TRACK_OVERVIEW}}` - Plan description
- `{{CRITERION_N}}` - Success criteria
- `{{PHASE_N_NAME}}` - Phase names
- `{{TASK_X_Y_TITLE}}` - Task titles
- `{{TASK_X_Y_DESCRIPTION}}` - Task descriptions
- `{{FILE_PATH}}` - File paths for tasks
- `{{COVERAGE_TARGET}}` - Coverage target

### Solution Template

**solution.md.template** - Solution documentation with YAML frontmatter
- `{{DATE}}` - Solution date (YYYY-MM-DD)
- `{{PROBLEM_TYPE}}` - Enum from ProblemType
- `{{COMPONENT}}` - Enum from ComponentType
- `{{ROOT_CAUSE}}` - Enum from RootCause
- `{{SEVERITY}}` - critical|high|medium|low
- `{{SYMPTOM_N}}` - Observable symptoms
- `{{TAG_N}}` - Searchable tags
- `{{MODULE_NAME}}` - Affected module
- `{{FILE_N}}` - Related files
- `{{SOLUTION_TITLE}}` - Title
- `{{WHAT_WENT_WRONG}}` - Problem description
- `{{WHY_IT_HAPPENED}}` - Root cause explanation
- `{{WHAT_FIXED_IT}}` - Solution explanation
- `{{LANGUAGE}}` - Code language
- `{{BROKEN_CODE}}` - Before code
- `{{FIXED_CODE}}` - After code
- `{{HOW_TO_AVOID_IN_FUTURE}}` - Prevention tips
- `{{REFERENCE_N}}` - External references

### Progress Template

**progress.md.template** - Context bridging file for agent handoffs
- `{{TIMESTAMP}}` - Current timestamp
- `{{TRACK_ID}}` - Track identifier
- `{{CURRENT_PHASE}}` - Phase number
- `{{CURRENT_TASK}}` - Task ID
- `{{CURRENT_WORK_DESCRIPTION}}` - What's being worked on
- `{{TASK_ID_N}}` - Completed task IDs
- `{{TASK_SUMMARY_N}}` - Task summaries
- `{{DECISION_WHAT}}` - Decision made
- `{{DECISION_WHY}}` - Rationale
- `{{NEXT_TASK_ID}}` - Next task ID
- `{{NEXT_TASK_DESCRIPTION}}` - Next task description
- `{{ISSUE_DESCRIPTION_N}}` - Known issues
- `{{ADDITIONAL_CONTEXT}}` - Extra notes

### Gitignore Templates

Pre-configured `.gitignore` templates for different languages:
- **node.gitignore** - Node.js/JavaScript projects
- **python.gitignore** - Python projects
- **go.gitignore** - Go projects
- **rust.gitignore** - Rust projects

All gitignore templates include:
- `.worktrees/` - Parallel agent workspaces
- `.workflow/state/` - Session state
- Environment files (`.env*`)
- Language-specific build artifacts and dependencies

## Usage

Templates are used by the bootstrap process (Phase -1) to create initial project structure and by various workflow phases to create new documents.

The plugin will:
1. Read the appropriate template
2. Replace all `{{VARIABLE}}` placeholders with actual values
3. Write the instantiated file to the correct location

## JSON Schemas

Related JSON schemas for validation are in the `../schemas/` directory.
