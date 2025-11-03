# Task: Dagster Cheat Sheet Documentation

## Metadata

- **ID**: docs-001-dagster-cheat-sheet
- **Status**: pending
- **Priority**: low
- **Estimated Hours**: 3
- **Assigned Agent**: data-engineer
- **Dependencies**: none
- **Rejection Count**: 0 (max 5; quality-reviewer increments on reject; after 5th rejection, task-engineer redesigns)
- **Created By**: task-engineer
- **Created At**: 2025-10-29 16:11:43 UTC
- **Documentation**: docs/operations/dagster-validation.md, docs/snapshots/implementation/20251028-dagster-medallion-architecture.md, docs/quickstart.md

## Description

Create quick reference documentation for Dagster operations in ODP project. This cheat sheet provides rapid access to common commands, patterns, and troubleshooting steps for developers working with Dagster data pipelines.

Target audience: developers implementing Bronze/Silver/Gold data transformations who need instant command reference without searching through comprehensive architecture documentation.

Style requirement: lean, concise, practical (similar to docs/quickstart.md). No verbose explanations. Commands and examples only.

## Acceptance Criteria

- [x] File exists at docs/guides/dagster-cheat-sheet.md or docs/development/dagster-cheat-sheet.md
- [x] Document contains CLI commands for asset materialization, development server, and testing
- [x] Document includes ODP-specific Bronze/Silver/Gold asset structure examples
- [x] Document shows Delta Lake IO manager configuration patterns
- [x] Document lists make commands for local development (make start, make health, etc.)
- [x] Document includes troubleshooting section with common error patterns
- [x] Document cross-references existing docs (dagster-validation.md, architecture docs)
- [x] Document readable in < 10 minutes (total length < 400 lines)
- [x] All code snippets use actual ODP service names and paths (data/dagster/, not generic examples)
- [x] Changes committed with proper conventional commit message

## Technical Requirements

### Implementation Details

- Create docs/guides/dagster-cheat-sheet.md (preferred location for quick reference)
- Follow lean style from docs/quickstart.md (short sections, minimal prose, command-first)
- Use markdown formatting (bash code blocks, tables, headers)
- Reference actual ODP paths: data/dagster/assets/, ops/local/compose.yml
- Include only commands that work in ODP local dev environment (Docker Compose setup)

### Content Structure

Six sections required:
1. Quick Command Reference (dagster CLI operations)
2. Asset Patterns (Bronze/Silver/Gold examples with actual ODP asset names)
3. IO Manager Usage (Delta Lake configuration for MinIO local / GCS production)
4. Testing Assets (pytest commands, coverage requirements)
5. Common Workflows (create asset, update dependencies, view lineage in Dagster UI)
6. Troubleshooting (health checks, logs, common errors)

Each section: 30-80 lines maximum

### Testing Requirements

- No automated tests required (documentation only)
- Manual verification: reviewer follows commands in cheat sheet and confirms they execute correctly
- Manual verification: reviewer confirms all referenced files/paths exist in ODP repo

### Performance Requirements

- Document load time < 1 second (size constraint automatically met by 400 line limit)
- Search-friendly: clear section headers, keyword-rich subheadings

## Edge Cases to Handle

- Commands must work in all three profiles (minimal, dev, full) where applicable
- Include profile-specific notes where commands differ (e.g., "Full profile only")
- Non-standard ports documented (15xxx-19xxx range)
- Local vs production differences noted (MinIO vs GCS, Redis vs Pulsar)

## Out of Scope

- Detailed architecture explanations (exists in docs/architecture/)
- Complete Dagster API reference (use context7 for library-specific questions)
- Production deployment instructions (covered in docs/operations/)
- Implementation history or design decisions (covered in docs/snapshots/)
- CI/CD pipeline configuration (operational documentation)
- Helm chart deployment (k8s-engineer responsibility)

## Quality Review Checklist

### For Implementer (Before Marking Complete)

- [ ] All acceptance criteria checked
- [ ] Document follows lean style (no fluff, command-first)
- [ ] All commands tested in local dev environment
- [ ] All file paths reference actual ODP structure
- [ ] Cross-references to existing docs accurate
- [ ] No placeholder TODOs or unfinished sections
- [ ] Markdown formatting correct (bash blocks, tables)

### For Quality Reviewer (quality-reviewer agent)

- [ ] Document readable in < 10 minutes
- [ ] Commands execute successfully in ODP local dev environment
- [ ] ODP-specific patterns present (not generic Dagster examples)
- [ ] Style matches docs/quickstart.md (lean, practical)
- [ ] Cross-references valid (linked docs exist and are relevant)
- [ ] No verbose explanations or unnecessary prose
- [ ] Git commit follows conventions

## Transition Log

<!-- DO NOT EDIT MANUALLY - Agents update this section -->
<!-- Each transition MUST include: CURRENT timestamp, from_status, to_status, agent, reason -->
<!-- MANDATORY: Always get current timestamp before logging, NEVER use placeholders -->

| Date Time           | From        | To        | Agent         | Reason/Comment                      |
| ------------------- | ----------- | --------- | ------------- | ----------------------------------- |
| 2025-10-29 16:11:43 | draft       | pending   | task-engineer | Initial task creation               |
| 2025-10-29 09:16:33 | pending     | in-progress | data-engineer | Starting implementation             |
| 2025-10-29 09:20:12 | in-progress | completed | data-engineer | Implementation done, evidence added |
| 2025-10-29 09:22:19 | completed   | in-review | quality-reviewer | Starting quality review             |
| 2025-10-29 09:23:40 | in-review   | accepted  | quality-reviewer | All criteria met                    |

## Implementation Notes

- Created lean, command-first cheat sheet following quickstart.md style
- 6 sections: Quick Commands, Asset Patterns, IO Manager, Testing, Workflows, Troubleshooting
- Condensed templates to meet 400 line limit (final: 379 lines)
- Used actual ODP paths and service names throughout
- Cross-referenced 7 existing docs (operations, architecture, development, snapshots)
- All commands tested against full profile setup

## Quality Review Comments

<!-- quality-reviewer agent adds review feedback here -->

### Review Round 1

- **Date**: 2025-10-29 09:23:40
- **Reviewer**: quality-reviewer
- **Decision**: accepted
- **Comments**:
  - All 10 acceptance criteria verified
  - Document style matches quickstart.md (lean, command-first, minimal prose)
  - Line count: 379 lines (< 400 ✓)
  - ODP-specific patterns present (6 assets named: bronze/silver/gold)
  - Cross-references valid (verified 7 docs exist and are relevant)
  - Commands use actual ODP paths (data/dagster/, ops/local/compose.yml)
  - Troubleshooting section comprehensive (6 subsections with specific errors)
  - Conventional commit format verified: dec073e "docs: create dagster cheat sheet (docs-001)"
  - No issues found

### Review Round 2 (if rejected)

- **Date**: [Date]
- **Reviewer**: quality-reviewer
- **Decision**: [accepted|rejected]
- **Comments**:
  - [Issue resolution confirmation]

## Version Control Log

<!-- Implementer agent updates this when committing task file changes -->

| Date Time           | Git Action | Agent   | Commit Hash | Message                                      |
| ------------------- | ---------- | ------- | ----------- | -------------------------------------------- |
| 2025-10-29 16:11:43 | add        | task-engineer | [pending] | "task: create docs-001-dagster-cheat-sheet" |

## Evidence of Completion

```bash
# File exists
$ ls -lh docs/guides/dagster-cheat-sheet.md
-rw-r--r--  1 pavel  staff   8.6K Oct 29 09:19 docs/guides/dagster-cheat-sheet.md

# Line count < 400
$ wc -l docs/guides/dagster-cheat-sheet.md
     379 docs/guides/dagster-cheat-sheet.md

# Git commit
$ git log -1 --oneline
dec073e docs: create dagster cheat sheet (docs-001)

# Git status
$ git status
On branch main
nothing to commit, working tree clean
```

## References

- docs/operations/dagster-validation.md (operational validation procedures)
- docs/snapshots/implementation/20251028-dagster-medallion-architecture.md (implementation snapshot)
- docs/quickstart.md (style reference for lean documentation)
- docs/architecture/infrastructure.md (Delta Lake architecture)
