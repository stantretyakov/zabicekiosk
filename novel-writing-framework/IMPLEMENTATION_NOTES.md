# ACF Novel Writing Framework - Implementation Notes

## What Was Created

**Version**: 1.0
**Date**: 2025-11-17
**Based on**: ACF Framework (zabicekiosk adaptation)

---

## Complete Framework Structure

### Documentation (`docs/`)

**Agent Manifests** (`docs/agents/`):
- ✅ `README.md` - Agent system overview, coordination patterns
- ✅ `writer.md` - Content creation agent (15+ pages)
- ✅ `chief-editor.md` - Editorial coordination agent (15+ pages)
- ✅ `co-editor-character.md` - Character consistency specialist (12+ pages)
- ✅ `co-editor-plot.md` - Plot continuity specialist (12+ pages)
- ✅ `expert-light-novels.md` - Light novel genre expert (10+ pages)
- ✅ `expert-military.md` - Military & tactics expert (10+ pages)
- ✅ `expert-scifi.md` - Science fiction technology expert (10+ pages)
- ✅ `expert-japanese-culture.md` - Japanese culture expert (12+ pages)
- ✅ `formatter.md` - Book compilation agent (10+ pages)

**ACF Process** (`docs/acf/`):
- ✅ `workflow.md` - Complete workflow documentation (20+ pages)
- ✅ `style/general.md` - Communication and quality standards

### Infrastructure

**Backlog System** (`.backlog/`):
- ✅ `draft/` - Author prompts
- ✅ `pending/` - Ready for writer
- ✅ `in-progress/` - Active writing
- ✅ `completed/` - Draft done
- ✅ `in-review/` - Under review
- ✅ `feedback/` - Editor/expert feedback
- ✅ `revision/` - Revisions in progress
- ✅ `rejected/` - Needs rework
- ✅ `blocked/` - Critical issues
- ✅ `accepted/` - Final approved

**Development Tools**:
- ✅ `Makefile` - Commands for novel management
- ✅ `README.md` - Framework overview and quick start
- ✅ `CLAUDE.md` - AI assistant instructions

### Example Project (`novels/_example/`)

Complete example novel structure:
- ✅ `metadata.md` - Novel information template
- ✅ `outline.md` - Story structure example (10 chapters)
- ✅ `characters/akira-tanaka.md` - Complete character sheet
- ✅ `worldbuilding/technology.md` - Tech specs and rules
- ✅ `prompts/chapter-01-prompt-example.md` - Author prompt template

---

## Key Features

### 1. Agent-Based Collaboration

**9 Specialized Agent Roles**:
- 1 Writer (content creation)
- 1 Chief Editor (coordination)
- 2 Co-Editors (character, plot)
- 4 Experts (light novels, military, scifi, Japanese culture)
- 1 Formatter (compilation)

**Each agent has**:
- Dedicated manifest with workflow
- Priority documentation system
- Quality gates
- Input/output formats
- Collaboration protocols

### 2. Workflow Management

**10 Task States**:
draft → pending → in-progress → completed → in-review → feedback → revision → [accepted/rejected/blocked]

**Features**:
- Clear state transitions
- Iteration limits (max 3 revisions)
- Escalation procedures
- Parallel co-editor review
- Expert consultation on-demand

### 3. Quality Assurance

**Multiple Review Layers**:
- Writer self-review
- Co-editor specialized reviews (parallel)
- Expert domain verification
- Chief Editor consolidation
- Final acceptance criteria

**Severity Classification**:
- Critical (must fix)
- Major (should fix)
- Minor (suggestions)

### 4. Documentation System

**For Each Novel**:
- Metadata (title, genre, status)
- Story outline (structure)
- Character sheets (detailed profiles)
- Worldbuilding (tech, culture, setting)
- Prompts log (chronological)

---

## Optimizations Over Original User Proposal

### Original Proposal

User suggested:
- Single log file for all feedback
- Sequential expert review
- Unclear state management
- No clear escalation path

### Implemented Improvements

**1. Structured Feedback Files**:
- Separate files per reviewer per chapter
- Easy to track, review, and reference
- Chief Editor consolidates into single document for Writer

**2. Parallel Co-Editor Review**:
- Character and Plot editors work simultaneously
- Faster turnaround
- Independent perspectives

**3. Clear State Management**:
- 10 distinct states with clear transitions
- Task files move between `.backlog/` directories
- Easy to track progress visually

**4. Iteration Limits**:
- Max 3 revision cycles prevents infinite loops
- Escalation to Chief Editor after 3 rejections
- Block state for unresolvable issues

**5. Expert Consultation Triggers**:
- Chief Editor decides when to call experts
- Experts only engaged when needed
- Clear domain boundaries

**6. Formatter Separation**:
- Dedicated role for compilation
- Runs after multiple chapters accepted
- Generates multiple formats (MD, PDF, EPUB)

---

## Agent Manifest Structure

Each manifest includes:

**Role Definition**: What this agent does
**Core Responsibilities**: Specific duties
**Workflow**: Step-by-step process
**Priority Documentation**: What to read (Priority 1/2/3)
**Quality Gates**: Checklist before completion
**Input/Output Formats**: Standardized structures
**Collaboration**: Who they interact with
**Common Scenarios**: Examples of typical tasks
**Red Flags**: What to watch out for
**Success Metrics**: What good looks like

---

## Example Workflow

### Chapter 1 Creation (Happy Path)

1. **Author** writes prompt → `.backlog/draft/chapter-01-prompt.md`
2. **Author** moves to → `.backlog/pending/`
3. **Writer** picks up, moves to → `.backlog/in-progress/`
4. **Writer** creates `novels/my-novel/chapters/chapter-01.md`
5. **Writer** submits to → `.backlog/completed/`
6. **Chief Editor** reviews, assigns co-editors
7. **Chief Editor** moves to → `.backlog/in-review/`
8. **Co-Editor: Character** reviews → `.backlog/feedback/chapter-01-character.md`
9. **Co-Editor: Plot** reviews → `.backlog/feedback/chapter-01-plot.md`
10. **Chief Editor** consolidates → `.backlog/feedback/chapter-01-consolidated.md`
11. **Writer** reads feedback, revises chapter
12. **Writer** moves to → `.backlog/revision/`
13. **Writer** resubmits to → `.backlog/completed/`
14. **Chief Editor** re-reviews
15. **Chief Editor** approves → `.backlog/accepted/chapter-01-final.md`

**Result**: High-quality chapter ready for compilation

### With Expert Consultation

If chapter has Japanese characters:
- **Chief Editor** identifies need for cultural accuracy check
- **Expert: Japanese Culture** reviews honorifics, social behavior
- **Expert** submits → `.backlog/feedback/chapter-01-expert-japanese.md`
- **Chief Editor** includes in consolidated feedback
- **Writer** addresses cultural issues in revision

---

## Technologies & Formats

**File Format**: Markdown (.md)
- Universal, version-controllable
- Easy to read and write
- Can export to PDF, EPUB, HTML

**Export Formats** (Formatter):
- Markdown (master)
- PDF (print/digital)
- EPUB (e-readers)
- Web-friendly markdown

**Tools Suggested**:
- Pandoc (format conversion)
- epubcheck (EPUB validation)
- Git (version control recommended)

---

## Usage Instructions

### For Author

```bash
# Create novel project
make novel NAME=my-novel

# Fill in metadata, outline, character sheets
# Write prompts in .backlog/draft/
# Move to .backlog/pending/ when ready

# Launch Writer agent (via orchestrator)
# Review cycles happen automatically
# Accept/reject feedback iterations
```

### For AI Agents

```bash
# 1. Read your manifest
cat docs/agents/{your-role}.md

# 2. Read Priority 1 docs from manifest
# 3. Execute workflow from manifest
# 4. Submit in specified format
# 5. Move task to appropriate state
```

### For Orchestrator

```bash
# Monitor .backlog/ states
# Delegate to appropriate agents
# Launch Writer for pending tasks
# Launch Chief Editor for completed drafts
# Launch Formatter when chapters accepted
```

---

## Extensibility

### Adding New Experts

To add domain expert (e.g., "Expert: Historical Europe"):

1. Create `docs/agents/expert-historical-europe.md` (copy template)
2. Define domain (medieval history, Renaissance, etc.)
3. Add consultation triggers (Chief Editor calls when needed)
4. Update `CLAUDE.md` and `docs/agents/README.md` with new role

### Adding New Novel

```bash
make novel NAME=my-new-novel
# Creates full structure in novels/my-new-novel/
```

---

## Differences from Software ACF

| Aspect | Software ACF | Novel ACF |
|--------|--------------|-----------|
| Product | Code | Creative text |
| Quality Gates | Linters, tests | Style, consistency, compelling |
| Acceptance | Binary (works/broken) | Subjective (good/better/best) |
| Experts | Tech specialists | Domain experts |
| Iterations | Build-fix cycles | Draft-revise cycles |
| Final Artifact | Deployed service | Published book |
| Version Control | Git commits | Chapter revisions |
| Success Metric | Functionality | Reader engagement |

---

## File Count & Size

**Total Files Created**: 25+
- 10 Agent manifests
- 5 Example novel files
- 3 Documentation files
- 3 Framework files
- 10+ directory structures

**Total Documentation**: ~150 pages
**Archive Size**: 63KB (compressed)

---

## Next Steps for User

1. **Download/Move Framework**:
   ```bash
   # Archive already created
   acf-novel-writing-framework-v1.0.tar.gz

   # Extract in new repository
   tar -xzf acf-novel-writing-framework-v1.0.tar.gz
   ```

2. **Initialize Git** (recommended):
   ```bash
   cd novel-writing-framework
   git init
   git add .
   git commit -m "Initial ACF Novel Writing Framework setup"
   ```

3. **Create First Novel**:
   ```bash
   make novel NAME=my-first-novel
   vi novels/my-first-novel/metadata.md
   # Fill in details
   ```

4. **Configure AI Agents**:
   - Point Claude Code to this repository
   - Agents will read `CLAUDE.md` automatically
   - Each agent reads its manifest from `docs/agents/`

5. **Start Writing**:
   - Author creates prompts in `.backlog/draft/`
   - Move to `.backlog/pending/` when ready
   - Launch Writer agent to create chapter
   - Review cycles automatically managed

---

## Notes & Recommendations

### Best Practices

1. **One novel per project** - Keep projects separate
2. **Git version control** - Track all changes
3. **Backup character sheets** - They're your canon
4. **Update worldbuilding** - Keep it current as story evolves
5. **Trust the process** - Multiple revisions are normal

### Performance Tips

- **Parallel co-editors** - Faster than sequential
- **Batch expert consultations** - Multiple chapters at once
- **Fast-track simple chapters** - Not everything needs deep review
- **Clear prompts** - Better prompts = fewer iterations

### Common Pitfalls

- ❌ Skipping character sheets - leads to inconsistency
- ❌ Vague author prompts - confuses Writer
- ❌ Ignoring feedback - wastes revision cycles
- ❌ Infinite revisions - use iteration limits
- ❌ Working without context - read previous chapters

---

## Framework Philosophy

**Core Belief**: Great fiction comes from collaboration between creative vision (Author), skilled execution (Writer), and rigorous quality control (Editors/Experts).

**Principles**:
1. **Author is the source of truth** - Vision comes first
2. **Writer translates vision** - Creative execution matters
3. **Editors ensure quality** - Consistency and craft
4. **Experts ensure authenticity** - Domain accuracy
5. **Formatter ensures presentation** - Professional delivery

**Goal**: Create **exceptional fiction** that readers **love** through **systematic collaboration**.

---

## Contact & Feedback

This framework is adapted from ACF (zabicekiosk). Customize for your needs.

**Version**: 1.0
**Release Date**: 2025-11-17
**Status**: Production Ready

---

**Happy Writing! 📚✨**
