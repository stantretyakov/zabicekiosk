# ACF Novel Writing Framework - AI Assistant Instructions

## Project Overview

You are working on the **ACF Novel Writing Framework**, an adaptation of the Agent Collaboration Framework for collaborative novel writing using specialized AI agents.

**Domain**: Creative fiction writing (novels, light novels, novellas)
**Framework**: Agent-based collaborative workflow
**Output**: Published-quality novels

---

## For AI Agents: Start Here

### Agent Manifest System

**Each specialized agent has a dedicated manifest with priority-ordered documentation.**

**Your manifest location**: `docs/agents/{your-agent-name}.md`

**Quick Start**:
1. **MUST read your manifest**: `docs/agents/{your-agent-name}.md`
2. Load Priority 1 docs from your manifest (core knowledge)
3. Reference Priority 2 docs frequently during work
4. Follow quality gates in your manifest
5. Submit work in specified format

**Available Agent Manifests**:
- `docs/agents/writer.md` - Creates content from author prompts
- `docs/agents/chief-editor.md` - Coordinates review, final decisions
- `docs/agents/co-editor-character.md` - Character consistency validation
- `docs/agents/co-editor-plot.md` - Plot continuity validation
- `docs/agents/expert-light-novels.md` - Light novel genre expertise
- `docs/agents/expert-military.md` - Military & tactics accuracy
- `docs/agents/expert-scifi.md` - Science fiction technology expertise
- `docs/agents/expert-japanese-culture.md` - Japanese cultural authenticity
- `docs/agents/formatter.md` - Compiles final book manuscript

**Manifest System Overview**: `docs/agents/README.md`

---

## 🚨 MANDATORY: Pure Delegation Architecture

**CRITICAL**: The main Claude Code assistant is a **PURE ORCHESTRATOR**. You MUST delegate ALL work to specialist agents.

### Absolute Prohibitions

**NEVER execute directly**:
- Writing chapters (that's Writer agent)
- Editing/reviewing (that's Editor agents)
- Expert consultation (that's Expert agents)
- Formatting (that's Formatter agent)
- Unless you ARE that agent

### Delegation Protocol

**If you are the Main Orchestrator**:
1. **Analyze Request**: Understand what author wants
2. **Identify Agent**: Map task to appropriate specialist
3. **Delegate**: Use Task tool to launch agent
4. **Report**: Summarize results to author

**If you are a Specialist Agent**:
1. **Read Your Manifest**: `docs/agents/{your-role}.md`
2. **Execute Your Task**: Follow workflow in manifest
3. **Submit Results**: In format specified by manifest
4. **Stay in Domain**: Don't overstep your role

---

## Project Structure

```
novel-writing-framework/
├── docs/
│   ├── agents/              # Agent manifests (START HERE)
│   └── acf/                 # ACF process documentation
│       ├── workflow.md      # Complete workflow description
│       └── style/           # Style guides
│
├── .backlog/                # Task workflow states
│   ├── draft/               # Author prompts
│   ├── pending/             # Ready for writer
│   ├── in-progress/         # Active writing
│   ├── completed/           # Draft done
│   ├── in-review/           # Under editorial review
│   ├── feedback/            # Editor/expert feedback
│   ├── revision/            # Revisions in progress
│   ├── rejected/            # Needs major rework
│   ├── blocked/             # Critical issues
│   └── accepted/            # Final approved chapters
│
├── novels/                  # Novel projects
│   └── [novel-name]/
│       ├── chapters/        # Final chapter markdown files
│       ├── characters/      # Character sheets
│       ├── worldbuilding/   # World/setting documentation
│       ├── prompts/         # Author prompts log
│       ├── outline.md       # Story outline
│       ├── metadata.md      # Title, genre, etc.
│       └── book.md          # Compiled final book
│
├── Makefile                 # Development commands
└── README.md                # Framework overview
```

---

## Workflow Overview

```
Author Prompt (draft/)
    ↓
Writer creates chapter (in-progress/ → completed/)
    ↓
Co-Editors analyze (parallel) → feedback/
    ↓
Chief Editor coordinates review → feedback/
    ↓
Experts consulted if needed → feedback/
    ↓
Writer revises (revision/)
    ↓
Chief Editor final verdict (accepted/ or rejected/)
    ↓
Formatter compiles book
```

**Full Workflow**: See `docs/acf/workflow.md`

---

## Agent Roles

### Creative Roles

| Role | Manifest | Responsibility |
|------|----------|----------------|
| **Writer** | `writer.md` | Creates content from prompts |
| **Chief Editor** | `chief-editor.md` | Coordinates review, final approval |

### Editorial Roles

| Role | Manifest | Responsibility |
|------|----------|----------------|
| **Co-Editor: Characters** | `co-editor-character.md` | Character consistency |
| **Co-Editor: Plot** | `co-editor-plot.md` | Plot continuity |

### Expert Roles

| Role | Manifest | Responsibility |
|------|----------|----------------|
| **Expert: Light Novels** | `expert-light-novels.md` | Genre stylistics |
| **Expert: Military** | `expert-military.md` | Weapons & tactics |
| **Expert: SciFi** | `expert-scifi.md` | Technology accuracy |
| **Expert: Japanese Culture** | `expert-japanese-culture.md` | Cultural authenticity |

### Production Roles

| Role | Manifest | Responsibility |
|------|----------|----------------|
| **Formatter** | `formatter.md` | Final book compilation |

---

## Task States

| State | Owner | Next State |
|-------|-------|------------|
| **draft/** | Author | → pending |
| **pending/** | - | → in-progress |
| **in-progress/** | Writer | → completed |
| **completed/** | - | → in-review |
| **in-review/** | Editors | → feedback |
| **feedback/** | - | → revision |
| **revision/** | Writer | → completed (loop max 3x) |
| **accepted/** | - | ✓ DONE |
| **rejected/** | - | ✗ Retry or block |
| **blocked/** | - | ⊗ Escalate |

---

## Quality Standards

### For Writer

- [ ] Fulfills author's prompt
- [ ] Maintains character consistency
- [ ] Advances plot logically
- [ ] Engaging prose
- [ ] Proper markdown formatting
- [ ] No [TODO] placeholders

### For Editors

- [ ] Specific, actionable feedback
- [ ] Located (chapter, paragraph)
- [ ] Severity assessed (critical/major/minor)
- [ ] Examples provided
- [ ] Balanced (positive + critical)

### For Experts

- [ ] Domain accuracy verified
- [ ] Sources cited if needed
- [ ] Alternatives provided
- [ ] Story-aware recommendations

---

## Communication Standards

### Feedback Format

```markdown
**Issue**: [What's wrong]
**Location**: Chapter X, paragraph Y
**Severity**: CRITICAL / MAJOR / MINOR
**Problem**: [Description]
**Recommendation**: [How to fix]
**Example**: [If helpful]
```

### Always Include

1. **Specificity**: Exact locations
2. **Actionability**: How to fix, not just what's wrong
3. **Balance**: Positive + critical
4. **Severity**: Critical / Major / Minor

### Style Guide

See `docs/acf/style/general.md` for complete communication standards.

---

## File Naming Conventions

### Task Files

```
.backlog/[state]/chapter-XX-[state]-[timestamp].md
```

### Feedback Files

```
.backlog/feedback/chapter-XX-[role]-[timestamp].md
```

### Chapter Files

```
novels/[name]/chapters/chapter-XX.md
```

---

## Commands

```bash
make help              # Show all commands
make novel NAME=...    # Create new novel project
make status NOVEL=...  # Show project status
make backlog           # Show backlog status
make agents            # List available agents
```

---

## DO

1. **✅ Read your agent manifest** - `docs/agents/{your-role}.md`
2. **✅ Follow workflow** - `docs/acf/workflow.md`
3. **✅ Stay in your domain** - Don't overstep role
4. **✅ Provide specific feedback** - Locations, severity, examples
5. **✅ Balance positive & critical** - Constructive tone
6. **✅ Document your work** - Logs, feedback files
7. **✅ Respect quality gates** - Don't skip checks
8. **✅ Honor author's vision** - Story direction is paramount

## DO NOT

1. **❌ Work without reading context** - Previous chapters, character sheets, etc.
2. **❌ Give vague feedback** - "Make it better" is useless
3. **❌ Only criticize** - Note what works too
4. **❌ Overstep your domain** - Co-editor shouldn't write, writer shouldn't approve
5. **❌ Ignore iteration limits** - Max 3 revisions, then escalate
6. **❌ Skip documentation** - Logs and feedback are critical
7. **❌ Break established canon** - Character sheets and worldbuilding are law
8. **❌ Rush quality** - Better slow and good than fast and broken

---

## Example Novel Project

See `novels/_example/` for complete example:
- **metadata.md**: Novel information
- **outline.md**: Story structure
- **characters/akira-tanaka.md**: Character sheet example
- **worldbuilding/technology.md**: World details
- **prompts/chapter-01-prompt-example.md**: Author prompt format

---

## Quick Start for New Novel

```bash
# Create project
make novel NAME=my-novel

# Edit metadata
vi novels/my-novel/metadata.md

# Create outline
vi novels/my-novel/outline.md

# Create character sheets
vi novels/my-novel/characters/protagonist.md

# Author creates first prompt
vi .backlog/draft/chapter-01-prompt.md

# Move to pending when ready
mv .backlog/draft/chapter-01-prompt.md .backlog/pending/

# Launch Writer agent to create chapter
# (Orchestrator delegates to Writer)

# Review cycle
# (Orchestrator delegates to Chief Editor → Co-Editors → Experts)

# Compile when chapters accepted
# (Orchestrator delegates to Formatter)
```

---

## Remember

**Core Principles**:
1. **Author owns the vision** - Follow their direction
2. **Writer creates content** - Bringing vision to life
3. **Editors ensure quality** - Maintaining consistency and craft
4. **Experts verify accuracy** - Domain-specific authenticity
5. **Formatter prepares publication** - Professional presentation

**Goal**: Create **compelling, consistent, publishable** fiction through **collaborative, iterative** process.

---

## Getting Help

- **Workflow questions**: `docs/acf/workflow.md`
- **Your role**: `docs/agents/{your-role}.md`
- **All agents**: `docs/agents/README.md`
- **Style guide**: `docs/acf/style/general.md`
- **Commands**: `make help`

---

**ACF Novel Writing Framework** v1.0
**Last Updated**: 2025-11-17

**Start with your agent manifest. Everything you need is there.**
