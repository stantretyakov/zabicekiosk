# .backlog/draft/

This directory is for your personal task drafts and ideas.

## Purpose

The `draft/` directory is:
- **User-controlled** - Not managed by AI agents
- **Excluded from automation** - AI agents will not process files here
- **Your workspace** - Store task ideas, notes, planning documents

## Usage

Use this directory to:
- Brainstorm feature ideas
- Draft task descriptions before finalizing
- Store personal notes about upcoming work
- Plan sprints or milestones
- Keep reference materials

## Moving to Workflow

When a task draft is ready to be worked on:

1. **Refine the task** - Ensure it follows the task template (see `docs/acf/backlog/task-template.md`)
2. **Move to pending** - Move the file from `draft/` to `pending/`
3. **AI agents will pick it up** - Once in `pending/`, agents can start working on it

## Example Workflow

```bash
# Create a draft task
cat > .backlog/draft/feature-booking-flow.md << 'EOF'
# Ideas for booking flow improvement
- Add calendar view
- Show availability in real-time
- Send email confirmations
EOF

# Refine it following the task template
vim .backlog/draft/feature-booking-flow.md

# Move to pending when ready
mv .backlog/draft/feature-booking-flow.md .backlog/pending/feature-042-booking-flow.md
```

## What NOT to do

- Don't put completed work here
- Don't expect AI agents to process files here
- Don't use this as archive (use `accepted/` for that)

---

**Remember**: This directory is YOURS. Use it however you want for planning and ideation.
