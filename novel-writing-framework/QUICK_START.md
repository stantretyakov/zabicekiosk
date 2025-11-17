# Quick Start Guide - ACF Novel Writing Framework

## Installation

### Option 1: Use Existing Directory

```bash
cd /home/user/zabicekiosk/novel-writing-framework
```

Framework is ready to use!

### Option 2: Extract Archive to New Location

```bash
# Archive location
/home/user/zabicekiosk/acf-novel-writing-framework-v1.0.tar.gz

# Extract to your novels repository
mkdir ~/my-novels-repo
cd ~/my-novels-repo
tar -xzf /home/user/zabicekiosk/acf-novel-writing-framework-v1.0.tar.gz

# Initialize git (recommended)
git init
git add .
git commit -m "Initial ACF Novel Writing Framework"
```

---

## First Novel - 5 Minute Setup

### Step 1: Create Novel Project (1 min)

```bash
make novel NAME=my-first-novel
```

**Creates**:
```
novels/my-first-novel/
├── chapters/          (empty, ready for content)
├── characters/        (ready for character sheets)
├── worldbuilding/     (ready for world docs)
├── prompts/           (has log.md)
├── metadata.md        (fill this out)
└── outline.md         (plan your story)
```

### Step 2: Fill in Metadata (2 min)

```bash
vi novels/my-first-novel/metadata.md
```

**Add**:
- Title
- Author name
- Genre
- Synopsis

**Example**: See `novels/_example/metadata.md`

### Step 3: Create Story Outline (2 min)

```bash
vi novels/my-first-novel/outline.md
```

**Plan**:
- Chapter structure
- Story arcs
- Key plot points

**Example**: See `novels/_example/outline.md`

---

## Writing Your First Chapter

### Step 1: Create Character Sheet

```bash
vi novels/my-first-novel/characters/protagonist.md
```

**Use template from**: `novels/_example/characters/akira-tanaka.md`

**Include**:
- Basic info (name, age, role)
- Personality traits
- Background
- Speech patterns
- Relationships
- Character arc

### Step 2: Author Writes Prompt

```bash
vi .backlog/draft/chapter-01-prompt.md
```

**Use template from**: `novels/_example/prompts/chapter-01-prompt-example.md`

**Include**:
- Vision (what should happen)
- Key points to cover
- Characters involved
- Mood/tone
- Specific requirements

### Step 3: Move to Pending

```bash
mv .backlog/draft/chapter-01-prompt.md .backlog/pending/
```

### Step 4: Launch Writer Agent

**As Orchestrator** (main Claude Code):

```
Ask Claude to launch Writer agent:
"Please launch the Writer agent to create Chapter 1 from the prompt in .backlog/pending/"
```

**Claude will**:
1. Read `docs/agents/writer.md`
2. Read the prompt
3. Read character sheets
4. Read outline
5. Write chapter in `novels/my-first-novel/chapters/chapter-01.md`
6. Move task through states

### Step 5: Review Cycle

**Automatically managed**:
1. Writer submits to `.backlog/completed/`
2. Chief Editor launches co-editors
3. Co-editors provide feedback
4. Chief Editor consolidates
5. Writer revises (if needed)
6. Chief Editor accepts

**You just**:
- Monitor progress
- Provide clarification if asked
- Review accepted chapters

---

## Agents & Their Roles

### When to Call Each Agent

| Agent | When to Use | Example |
|-------|-------------|---------|
| **Writer** | Create chapter from prompt | "Write Chapter 1" |
| **Chief Editor** | Review completed chapter | "Review and approve Chapter 1" |
| **Co-Editor: Character** | Verify character consistency | (Called by Chief Editor) |
| **Co-Editor: Plot** | Check plot continuity | (Called by Chief Editor) |
| **Expert: Light Novels** | Genre/style check | (Called if genre is light novel) |
| **Expert: Military** | Verify weapons/tactics | (Called if combat scenes) |
| **Expert: SciFi** | Check tech accuracy | (Called if scifi tech featured) |
| **Expert: Japanese Culture** | Cultural authenticity | (Called if Japanese characters/setting) |
| **Formatter** | Compile final book | "Compile all accepted chapters" |

### Agent Manifests

Each agent has detailed instructions in `docs/agents/{agent-name}.md`

**Example**: `docs/agents/writer.md` tells Writer exactly how to:
- Read prompts
- Create chapters
- Format output
- Submit work

---

## Typical Workflow

### For a Single Chapter

```
1. Author writes prompt (5-10 min)
2. Move to pending
3. Launch Writer (via Claude)
4. Writer creates chapter (10-30 min AI time)
5. Launch Chief Editor (via Claude)
6. Review cycle (10-20 min AI time)
7. Writer revises if needed (5-15 min AI time)
8. Chief Editor accepts
9. Chapter in .backlog/accepted/ ✓
```

**Total time**: Variable, but ~1-2 hours for complete chapter cycle

### For Multiple Chapters

```
1. Write multiple prompts
2. Process sequentially or in batches
3. Maintain continuity by reading previous chapters
4. Build up accepted chapters
5. Compile when volume complete
```

---

## Commands Reference

```bash
# Project management
make novel NAME=my-novel         # Create new project
make status NOVEL=my-novel       # Show project status

# Backlog
make backlog                     # Show all states
make pending                     # List pending tasks
make accepted                    # List accepted chapters

# Utilities
make agents                      # List available agents
make clean                       # Clean temporary files
make help                        # Show all commands
```

---

## File Locations

### What Goes Where

**Author creates**:
- `.backlog/draft/*.md` - Prompts for chapters
- `novels/[name]/metadata.md` - Novel info
- `novels/[name]/outline.md` - Story structure
- `novels/[name]/characters/*.md` - Character sheets
- `novels/[name]/worldbuilding/*.md` - World details

**Writer creates**:
- `novels/[name]/chapters/chapter-XX.md` - Actual chapters

**Editors create**:
- `.backlog/feedback/chapter-XX-*.md` - Feedback files

**Formatter creates**:
- `novels/[name]/book.md` - Compiled final book
- `novels/[name]/book.pdf` - PDF version
- `novels/[name]/book.epub` - EPUB version

---

## Quality Assurance

### Before Accepting a Chapter

**Writer checks**:
- [ ] Fulfills author's prompt
- [ ] Characters consistent
- [ ] Plot logical
- [ ] Engaging prose
- [ ] Proper formatting

**Co-Editors check**:
- [ ] Character voices authentic
- [ ] Plot continuity maintained
- [ ] No contradictions
- [ ] Pacing appropriate

**Experts check** (if needed):
- [ ] Domain accuracy (military, scifi, culture, etc.)
- [ ] Alternatives provided
- [ ] Story-aware recommendations

**Chief Editor checks**:
- [ ] All critical issues resolved
- [ ] Major issues addressed
- [ ] Ready for readers

---

## Troubleshooting

### "Where do I start?"

1. Create novel project: `make novel NAME=my-novel`
2. Fill metadata and outline
3. Create character sheets
4. Write first chapter prompt
5. Launch Writer agent

### "Agent doesn't know what to do"

- Make sure agent reads their manifest: `docs/agents/{agent-name}.md`
- Check `CLAUDE.md` is loaded
- Provide clear instructions referencing the workflow

### "Too many revisions"

- Max 3 iteration cycles
- After 3 rejections, escalate to Chief Editor
- May need to simplify prompt or split chapter

### "Feedback conflicts"

- Chief Editor resolves conflicts
- Documents decision
- Provides clear guidance to Writer

### "How do I add new expert?"

1. Copy `docs/agents/expert-{template}.md`
2. Customize for new domain
3. Update `docs/agents/README.md`
4. Update `CLAUDE.md`
5. Chief Editor calls as needed

---

## Tips for Success

### 1. Start Small

- Write 1 chapter first
- Get comfortable with workflow
- Then scale up

### 2. Detailed Prompts

Better prompts = better first drafts = fewer revisions

**Good prompt**:
- Clear vision
- Specific key points
- Character details
- Mood/tone
- Requirements

### 3. Maintain Canon

- Keep character sheets updated
- Document worldbuilding
- Reference previous chapters
- Consistency is key

### 4. Trust the Process

- Multiple revisions are normal
- Editors help improve quality
- Experts add authenticity
- Final product is worth it

### 5. Iterate on Prompts

- Learn what works
- Refine prompt style
- Build prompt templates
- Improve over time

---

## Example Session

```bash
# Day 1: Setup
make novel NAME=space-opera
vi novels/space-opera/metadata.md    # 5 min
vi novels/space-opera/outline.md     # 15 min
vi novels/space-opera/characters/hero.md  # 10 min

# Day 2: First chapter
vi .backlog/draft/chapter-01-prompt.md    # 10 min
mv .backlog/draft/chapter-01-prompt.md .backlog/pending/

# Launch Writer agent (via Claude)
# "Please launch Writer agent to create Chapter 1"
# ... AI works for 20 minutes ...

# Launch Chief Editor for review
# "Please launch Chief Editor to review Chapter 1"
# ... Review cycle runs ...

# Chapter 1 accepted! ✓

# Day 3+: Continue with more chapters
# Build up to Volume 1 (10 chapters)

# Day N: Compile book
# "Please launch Formatter to compile all accepted chapters"
# ... book.md, book.pdf, book.epub created ...

# Novel complete! 📚
```

---

## Next Steps

1. **Read** `README.md` - Framework overview
2. **Explore** `novels/_example/` - Complete example
3. **Review** `docs/acf/workflow.md` - Detailed workflow
4. **Check** `docs/agents/` - Agent manifests
5. **Create** your first novel!

---

## Resources

**Framework Documentation**:
- `README.md` - Overview
- `CLAUDE.md` - AI agent instructions
- `IMPLEMENTATION_NOTES.md` - What was built and why
- `docs/acf/workflow.md` - Complete process
- `docs/agents/README.md` - Agent system

**Example Project**:
- `novels/_example/` - Full example novel structure

**Commands**:
- `make help` - All available commands

---

**Happy Writing! 🎉📖**

Create amazing stories with systematic collaboration!

**Version**: 1.0
**Date**: 2025-11-17
