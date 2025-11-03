# ACF File Organization

## Transactional vs Timeless Documents

### Classification Rules

**Transactional (Temporal)** - Documents that track state over time:
- **Require timestamp**: YYYYMMDD-description.md format
- **Location**: docs/snapshots/{category}/
- **Create new version when state changes**
- **Keep history**: Previous versions remain in place
- **Examples**: Implementation status, project mappings, evaluations, planning snapshots

**Timeless** - Documents that define systems/processes:
- **No timestamp**: feature-name.md format
- **Location**: docs/{subject}/
- **Update in place**: Valid until superseded
- **Single source of truth**: No versioning needed
- **Examples**: Architecture specs, quality gates, workflow definitions, agent manifests

### Temporal Document Locations

```
docs/snapshots/
├── implementation/    # Implementation status snapshots
├── mappings/         # Cross-reference mappings between systems/phases
├── migrations/       # Data/service migration plans
├── evaluations/      # Technology evaluations and decisions
├── planning/         # Sprint/iteration planning snapshots
├── risks/           # Risk register snapshots
└── budget/          # Budget tracking snapshots
```

### Naming Conventions

**Temporal Documents**:
- Format: `YYYYMMDD-description.md`
- NO hyphens in date portion (20251027, not 2025-10-27)
- Use hyphens between date and description
- Examples: `20251027-monorepo-foundation.md`, `20251028-ml-platform-evaluation.md`

**Timeless Documents**:
- Format: `feature-name.md`
- Lowercase, hyphen-separated
- No dates or version numbers
- Examples: `system-architecture.md`, `quality-gates.md`

### Update Workflow

**For Transactional Documents**:
1. When state changes significantly, create NEW dated snapshot
2. Keep previous snapshots in place (history preserved)
3. Reference older snapshots if needed: `See 20251020-initial-plan.md`

**For Timeless Documents**:
1. Update existing file in place
2. Git history provides change tracking
3. No need for manual versions

### Archive Strategy

**Temporal Documents**:
- Retention: 3 months in docs/snapshots/
- After 3 months: Move to archive/snapshots/YYYY-MM/
- Access via git history if needed

**Timeless Documents**:
- No archiving needed
- Git history tracks evolution
- Update in place

---

## Directory Structure

```
odp/
├── docs/                        # ALL documentation
│   ├── README.md               # Documentation hub
│   ├── agents/                 # Agent manifests (START HERE)
│   ├── product/                # Product vision
│   ├── architecture/           # Technical design
│   ├── operations/             # DevOps, deployment
│   ├── development/            # Developer workflow
│   ├── acf/                    # ACF process
│   ├── research/               # Research findings (ALWAYS YYYYMMDD-topic.md)
│   ├── retrospectives/         # Sprint retrospectives (ALWAYS YYYYMMDD-topic.md)
│   └── snapshots/              # Temporal documents (ALWAYS YYYYMMDD-description.md)
│       ├── implementation/     # Implementation status
│       ├── mappings/          # Cross-reference mappings
│       ├── migrations/        # Migration plans
│       ├── evaluations/       # Tech evaluations
│       ├── planning/          # Sprint planning
│       ├── risks/             # Risk registers
│       └── budget/            # Budget tracking
├── ops/scripts/                # Operational scripts
├── logs/                       # Log files (gitignored)
└── .backlog/                   # Task files ONLY
```

## Naming Conventions

**Documentation**: `feature-name.md` (lowercase, hyphens)
**Agent Manifests**: `{agent-name}.md`
**Task Files**: `{category}-{XXX}-{description}.md`
**Scripts**: `action-target.sh`

**Exceptions**: README.md, CLAUDE.md, LICENSE

## Forbidden in Root

- `.git-evidence.txt` (NEVER create)
- `*.log` files (must be in `logs/`)
- `*.sh` scripts (must be in `ops/scripts/`)
- Documentation except CLAUDE.md, README.md, LICENSE

## Single Source of Truth

CRITICAL: Every piece of information has ONE authoritative location. All other references MUST link, never duplicate.

**Reference Format**:
```markdown
## Quality Requirements

See `docs/development/quality-gates.md`.
```

---

**Last Updated**: 2025-10-27
