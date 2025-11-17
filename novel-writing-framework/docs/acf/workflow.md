# ACF Novel Writing Workflow

**Complete process flow for collaborative novel writing with AI agents**

## Overview

ACF Novel Writing Framework адаптирует Agent Collaboration Framework для creative fiction writing. Вместо software development tasks, мы управляем writing/editing cycles с четкими states и quality gates.

## Core Principles

1. **Author owns the vision** - Автор задает direction
2. **Writer creates content** - Писатель воплощает vision
3. **Editors ensure quality** - Редакторы гарантируют quality
4. **Experts verify accuracy** - Эксперты проверяют authenticity
5. **Formatter prepares publication** - Верстальщик готовит к публикации

## Workflow States

### State Diagram

```
draft (Author)
  ↓
pending (Ready for Writer)
  ↓
in-progress (Writer working)
  ↓
completed (Chapter draft done)
  ↓
in-review (Editors analyzing)
  ↓
feedback (Consolidated recommendations)
  ↓
revision (Writer fixing) ──┐
  ↓                         │
completed (Re-review) ←─────┘ (loop max 3x)
  ↓
DECISION:
├─→ accepted ✓ (Chief Editor approved)
├─→ rejected ✗ (Needs major rework, retry)
└─→ blocked ⊗ (Unresolvable issues)
```

### State Descriptions

| State | Owner | Description | Next State |
|-------|-------|-------------|------------|
| **draft/** | Author | Prompts/ideas for chapters | → pending |
| **pending/** | - | Ready for Writer to pick up | → in-progress |
| **in-progress/** | Writer | Active writing | → completed |
| **completed/** | - | Draft ready for review | → in-review |
| **in-review/** | Chief Editor | Under editorial review | → feedback |
| **feedback/** | Editors/Experts | Recommendations collected | → revision |
| **revision/** | Writer | Addressing feedback | → completed (loop) |
| **accepted/** | - | ✓ Final approved | END (SUCCESS) |
| **rejected/** | - | ✗ Major issues (retry) | → revision or blocked |
| **blocked/** | - | ⊗ Unresolvable | END (FAIL - escalate) |

## Detailed Workflow

### Phase 1: Ideation (Author)

**Location**: `.backlog/draft/`

**Process**:
1. Author writes prompt describing what should happen in chapter/scene
2. Prompt includes:
   - Vision (high-level what should happen)
   - Key points to cover
   - Characters involved
   - Mood/tone
   - Any specific requirements
3. Saves as `.backlog/draft/chapter-XX-prompt-[timestamp].md`
4. Moves to `.backlog/pending/` when ready for Writer

**Prompt Template**:

```markdown
# Chapter [X]: [Working Title]

## Author's Vision
[High-level description of what should happen in this chapter]

## Key Points
- [Point 1]
- [Point 2]
- [...]

## Characters Involved
- [Character A]: [Role in this chapter]
- [Character B]: [Role in this chapter]

## Mood/Tone
[Tense, lighthearted, melancholic, etc.]

## Specific Requirements
- [Any must-haves]
- [Elements to include]
- [Things to avoid]

## Notes
[Any additional context for the Writer]

---

**Prompt Date**: YYYY-MM-DD
**Target Chapter**: [Number]
**Status**: draft → pending
```

### Phase 2: Writing (Writer Agent)

**Location**: `.backlog/pending/` → `.backlog/in-progress/` → `.backlog/completed/`

**Process**:
1. Writer picks prompt from `pending/`
2. Moves to `in-progress/`
3. Reads:
   - Author's prompt
   - Character sheets for characters in scene
   - Previous 2-3 chapters
   - Relevant worldbuilding
4. Writes chapter in `novels/[name]/chapters/chapter-XX.md`
5. Updates `novels/[name]/prompts/log.md` with:
   - What prompt was used
   - What was written
   - Key plot points covered
6. Self-reviews against quality gates
7. Moves to `completed/` with submission note

**Quality Gates** (Writer self-check):
- [ ] Prompt fulfilled
- [ ] Characters consistent with sheets
- [ ] Plot advances logically
- [ ] Engaging prose
- [ ] Proper markdown formatting
- [ ] No [TODO] placeholders

### Phase 3: Editorial Review (Chief Editor + Co-Editors + Experts)

**Location**: `.backlog/completed/` → `.backlog/in-review/` → `.backlog/feedback/`

#### Step 3.1: Chief Editor Initial Review

1. Reads completed chapter
2. Quick assessment: glaring issues?
3. Decides review strategy:
   - **Standard**: Co-editors (Character + Plot)
   - **Expert needed**: Identify which experts
   - **Fast-track**: Minor chapter, quick approval

4. Moves to `in-review/`
5. Assigns reviewers

#### Step 3.2: Co-Editors Analyze (Parallel)

**Co-Editor: Character Consistency**:
- Reviews all characters in chapter
- Checks voice, behavior, knowledge, relationships
- Documents issues with severity (critical/major/minor)
- Submits feedback to `.backlog/feedback/chapter-XX-character-[timestamp].md`

**Co-Editor: Plot Continuity**:
- Checks timeline, plot logic, world rules
- Verifies consistency with previous chapters
- Assesses pacing
- Submits feedback to `.backlog/feedback/chapter-XX-plot-[timestamp].md`

#### Step 3.3: Expert Consultation (If Needed)

Chief Editor identifies need for experts:
- **Light Novels**: Genre/style check
- **Military**: Weapons/tactics accuracy
- **SciFi**: Technology plausibility
- **Japanese Culture**: Cultural authenticity
- **[Other]**: As needed

Experts:
- Read chapter or specific sections
- Verify domain accuracy
- Provide corrections with alternatives
- Submit feedback to `.backlog/feedback/chapter-XX-expert-[domain]-[timestamp].md`

#### Step 3.4: Chief Editor Consolidation

1. Reads all feedback files
2. Assesses overall:
   - Critical issues (must fix)
   - Major issues (should fix)
   - Minor issues (suggestions)
3. Checks for conflicting feedback
4. Creates consolidated feedback document
5. Moves to `.backlog/feedback/chapter-XX-consolidated-[timestamp].md`

**Consolidated Feedback Template**:

```markdown
# Editorial Review: Chapter X

**Chief Editor**: [ID]
**Date**: YYYY-MM-DD
**Iteration**: [1/2/3]
**Decision**: [Needs Revision / Accept / Reject]

---

## Critical Issues (MUST FIX)

1. **[Category]**: [Issue]
   - **Location**: Paragraph X
   - **Problem**: [Description]
   - **Fix**: [Specific action]
   - **Source**: [Co-editor/Expert]

## Major Issues (Should Fix)

[Same structure]

## Minor Suggestions (Optional)

[Same structure]

---

## Positive Feedback

- [What works well]

---

## Overall Assessment

[Narrative evaluation]

**Next Steps**: [What Writer should do]

---

**Reviewers**:
- Co-Editor: Character
- Co-Editor: Plot
- Expert: [If applicable]
```

### Phase 4: Revision (Writer Agent)

**Location**: `.backlog/feedback/` → `.backlog/revision/` → `.backlog/completed/`

**Process**:
1. Writer reads consolidated feedback
2. Prioritizes: Critical → Major → Minor
3. Addresses issues in chapter
4. Documents changes in revision log
5. Moves task to `revision/`
6. After revising, moves to `completed/` for re-review
7. Iteration count incremented

**Revision Log Entry**:

```markdown
## Chapter X - Revision [N] - [Date]

**Feedback Addressed**:
- [Chief Editor]: [Issue fixed]
- [Co-Editor Character]: [Issue fixed]
- [Expert]: [Issue fixed]

**Changes Made**:
- Paragraphs X-Y: [What changed]
- Paragraph Z: [What changed]

**Status**: Ready for re-review
```

**Iteration Limit**: Max 3 revision cycles
- After 3 rejections → escalate to Chief Editor
- Chief Editor decides: simplify prompt, accept with known issues, or block

### Phase 5: Final Decision (Chief Editor)

**After revision(s)**, Chief Editor makes final call:

#### ACCEPT ✓

**Criteria**:
- All critical issues resolved
- Major issues addressed or acceptable
- Chapter meets quality standards
- Ready for readers

**Action**:
- Move to `.backlog/accepted/chapter-XX-[timestamp].md`
- Document acceptance with quality summary
- Chapter is now **final** for this volume

**Acceptance Document**:

```markdown
# Chapter X: ACCEPTED ✓

**Chief Editor**: [ID]
**Date**: YYYY-MM-DD

## Quality Summary
- Plot: ✓
- Characters: ✓
- Prose: ✓
- Continuity: ✓

## Revision History
- Draft: [Date]
- Revision 1: [Date] - [What fixed]
- Final: [Date] - Accepted

**Ready for compilation**: YES
```

#### REJECT ✗

**Criteria**:
- Critical issues remain after revision
- Quality below minimum standard
- Fundamental misunderstanding of prompt
- Max iterations not reached yet

**Action**:
- Move to `.backlog/rejected/chapter-XX-[timestamp].md`
- Clear explanation of why
- Guidance for next attempt
- If 3rd rejection → escalate/block

#### BLOCK ⊗

**Criteria**:
- After 3 rejection cycles
- Conflicting/unresolvable feedback
- Prompt itself is unclear/contradictory
- Technical impossibility

**Action**:
- Move to `.backlog/blocked/chapter-XX-[timestamp].md`
- Escalate to Author for new direction
- Document what went wrong
- Recommend path forward (new prompt, split chapter, etc.)

### Phase 6: Compilation (Formatter Agent)

**When**: Multiple chapters accepted, ready for book assembly

**Process**:
1. Formatter gathers all accepted chapters
2. Compiles in correct order (per outline)
3. Applies consistent formatting
4. Adds front matter (title, TOC, etc.)
5. Adds back matter (character sheets, appendices)
6. Marks illustration points
7. Generates export formats (MD, PDF, EPUB)
8. Submits to Chief Editor for final review
9. Delivers to Author

**Output**: `novels/[name]/book.md` (and other formats)

## File Naming Conventions

### Task Files (in `.backlog/`)

```
chapter-[XX]-[state]-[timestamp].md
chapter-[XX]-scene-[YY]-[state]-[timestamp].md

Examples:
- chapter-01-pending-20250117.md
- chapter-03-completed-20250117.md
- chapter-05-revision-20250117.md
```

### Feedback Files

```
chapter-[XX]-[role]-[timestamp].md

Examples:
- chapter-01-character-20250117.md
- chapter-01-plot-20250117.md
- chapter-01-expert-military-20250117.md
- chapter-01-consolidated-20250117.md
```

### Chapter Files (in `novels/[name]/chapters/`)

```
chapter-[XX].md

Examples:
- chapter-01.md
- chapter-02.md
- prologue.md
- epilogue.md
```

## Coordination Patterns

### Sequential Pattern (Standard)

```
Author → Writer → Co-Editors → Chief Editor → Writer (revision) → Chief Editor (decision)
```

Use for: Most chapters

### Parallel Pattern (Fast Review)

```
                ┌→ Co-Editor: Character ┐
Writer → Chief Editor →│                         ├→ Consolidated → Decision
                └→ Co-Editor: Plot      ┘
```

Use for: Straightforward chapters, no expert needed

### Expert Consultation Pattern

```
Writer → Co-Editors → Chief Editor → Identifies Need → Expert → Feedback → Writer (revision)
```

Use for: Chapters with specialized content

### Revision Loop Pattern

```
Writer → Review → Feedback → Writer (revision) → Review
                                ↑__________________|
                              (max 3 iterations)
```

Use for: Addressing feedback, improving quality

## Communication Protocols

### Writer ← Chief Editor

- Consolidated feedback (all reviewers combined)
- Clear actionable items with locations
- Prioritized by severity
- Examples where helpful

### Chief Editor ↔ Co-Editors

- Structured feedback format
- Severity classification (critical/major/minor)
- Specific locations (paragraph numbers)
- Recommendations, not just criticism

### Chief Editor → Experts

- Specific questions in domain
- Context from story
- Chapter or relevant sections
- Time constraints if any

### Experts → Chief Editor

- Domain-specific feedback
- Factual corrections with sources
- Alternatives that maintain story intent
- Balance accuracy with readability

## Quality Standards

### For Writer

**Chapter Quality**:
- Fulfills author's prompt
- Maintains character consistency
- Advances plot logically
- Engaging, compelling prose
- Proper formatting

**Technical Quality**:
- Markdown formatted correctly
- No [TODO] placeholders
- Length appropriate (~5-10k words typical)
- Grammar solid (editor polishes, but should be clean)

### For Editors

**Feedback Quality**:
- Specific, actionable
- Located (paragraph numbers)
- Severity assessed
- Examples provided
- Balanced (positive + critical)

**Process Quality**:
- Timely review
- Stays in domain
- Constructive tone
- Respects story vision

### For Experts

**Consultation Quality**:
- Factually accurate
- Sources cited if needed
- Alternatives provided
- Context-aware (story needs)

## Escalation Rules

### Writer → Chief Editor

**When**:
- Conflicting feedback from multiple reviewers
- Unclear what's being asked
- Prompt impossible to fulfill
- Need clarification

### Co-Editor → Chief Editor

**When**:
- Issue outside their domain
- Need expert consultation
- Conflicting with other editor
- Unsure of severity

### Chief Editor → Author

**When**:
- After 3 rejected iterations
- Prompt unclear/contradictory
- Fundamental story logic issue
- Need new direction

## Iteration Limits & Retry Logic

**Max 3 revision cycles** per chapter:

1. **First revision**: Address feedback, common iteration
2. **Second revision**: Fine-tuning, should be close
3. **Third revision**: Final attempt, quality check

**After 3rd rejection**:
- **STOP** - don't continue loop
- Chief Editor escalates to Author
- Options:
  - Simplify prompt
  - Split chapter into smaller pieces
  - Accept with known issues (rare)
  - Block task and move on

## Best Practices

### For All Agents

1. **Read full context** - Don't work in isolation
2. **Check established canon** - Character sheets, worldbuilding
3. **Reference previous chapters** - Maintain continuity
4. **Be specific** - Vague feedback wastes cycles
5. **Be constructive** - Balance criticism with encouragement
6. **Stay in role** - Don't overstep domain
7. **Document decisions** - Future reference

### For Efficiency

- **Co-editors work in parallel** - Don't wait sequentially
- **Fast-track simple chapters** - Not everything needs deep review
- **Batch expert consultations** - If multiple chapters need same expert
- **Maintain templates** - Consistent formats speed up process

### For Quality

- **Quality over speed** - Better one great chapter than three mediocre
- **Consistency trumps perfection** - Uniformity across chapters matters
- **Reader experience first** - All decisions serve the reader
- **Respect the vision** - Author's intent is paramount

## Metrics & Tracking

### Process Metrics

- **Chapters per week**: Writing velocity
- **Avg iterations**: Quality on first draft
- **Review time**: How long in review?
- **Acceptance rate**: % accepted first time

### Quality Metrics

- **Word count**: Track progress
- **Consistency scores**: From editors
- **Reader feedback**: If test readers available

### Track in:

- Prompts log (`novels/[name]/prompts/log.md`)
- Revision history (in chapter files)
- Compilation reports (from Formatter)

## Troubleshooting

### Problem: Writer keeps missing character voice

**Solution**:
- Co-Editor: Character provides examples
- Writer references character sheet more closely
- Consider updating character sheet if voice has evolved

### Problem: Conflicting feedback from editors

**Solution**:
- Chief Editor makes judgment call
- Explains reasoning to Writer
- Updates feedback consolidation

### Problem: Expert feedback contradicts story needs

**Solution**:
- Chief Editor balances accuracy vs story
- May allow deviation with acknowledgment
- Or find creative solution that satisfies both

### Problem: Stuck in revision loop

**Solution**:
- After 3 iterations, escalate
- Chief Editor reviews if ask is reasonable
- May simplify requirements or accept as-is

---

## Summary

```
Author (vision) → Writer (creates) → Editors (review) → Writer (revise) → Chief Editor (decide) → Formatter (compile) → Publication
```

**Keys to Success**:
1. Clear prompts from Author
2. Quality first drafts from Writer
3. Specific, actionable feedback from Editors
4. Efficient revision cycles
5. Decisive Chief Editor
6. Professional formatting

**Goal**: Create **compelling, consistent, publishable** fiction through **collaborative, iterative** process.

---

**ACF Novel Writing Framework** v1.0
**Last Updated**: 2025-11-17
