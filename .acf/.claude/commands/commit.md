# commit - Create git commit following conventions

## Command

Stage and commit changes following project conventions.

### Arguments: $ARGUMENTS

## Execution

**MANDATORY**: Follow ALL conventions from `docs/acf/git/commit-conventions.md`:

- Format: `<type>(<scope>): <subject>`
- Types (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert)
- Subject rules (imperative, no caps, no period, max 50 chars)
- Body rules (72 char wrap, what/why not how)
- Attribution rules (no AI-generated footers)

## Algorithm

1. **Analyze Changes**:

   - Run `git status` to identify modified files
   - Group changes by logical area/scope
   - Determine appropriate commit type

2. **Stage Files**:

   - Stage related changes together (atomic commits)
   - Never use `git add -A` or `git add .`
   - Explicitly add only files for current logical change

3. **Craft Message**:

   - Type: Based on change nature (per conventions)
   - Scope: Affected area (optional)
   - Subject: Complete "This commit will..."
   - Body: Include context if needed (blank line before)

4. **Commit**:

   - Execute commit with crafted message
   - Verify commit follows conventions
   - Report success/failure

5. **Verify**:

   - Make sure ALL conventions from `docs/acf/git-commit-conventions.md` are followed

6. **Repeat**

- Repeat steps 1-5 until `git status` shows no uncommitted changes

## Critical Rules

- **Atomic commits**: One logical change per commit
- **Project builds**: Must compile after every commit
- **Never include**: AI attribution or co-authorship
- **Always reference**: docs/acf/git-commit-conventions.md for details
- **No --no-verify**: Never bypass pre-commit hooks using any methods

## Communication Style

Minimal, to the point and direct, no sugar-coating.

- "Done. Committed 3 files."
- "Done. Created X commits:<newline with well formatted table of all conducted commits with each commit hashes, authors and descriptions>."
- "Failed. 5 test failures."
- "Quality gates not met."
