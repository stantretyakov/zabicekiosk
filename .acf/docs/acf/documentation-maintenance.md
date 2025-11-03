# Documentation Maintenance

## Update Workflow

**Before modifying ANY documentation**:

1. **Identify Impact**:
   ```bash
   grep -r "term" docs/ --include="*.md"
   grep -r "file" docs/agents/
   ```

2. **Execute Updates**:
   - Update single source (authoritative location)
   - Update version marker with date
   - Update all references if paths changed
   - Update agent manifests if structure changed

3. **Validation**:
   - Run link validator (if available)
   - Check for contradictions
   - Verify manifest references exist

## Scheduled Audits

**Weekly** (1 hour, Monday):
- Review documentation commits from past week
- Verify single source pattern maintained
- Check for new duplications

**Monthly** (4 hours, first Monday):
- Complete documentation review
- Contradiction scan
- Reference validation
- Agent manifest sync

## Success Metrics

- Zero contradictions (verified monthly)
- <5% duplication rate
- 100% reference accuracy
- <24 hour update lag

---

**Last Updated**: 2025-10-27
