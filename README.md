# zabicekiosk

Kiosk + admin app for online accounting and booking of infant swimming exercises.

## Quick Start

```bash
# Install dependencies
make install

# Start development servers
make dev

# Run quality checks
make quality

# Show all available commands
make help
```

## Repository Structure

### Services (Backend)
- `services/core-api/` – Fastify service for core operations (TypeScript)
- `services/booking-api/` – Fastify service for schedule and bookings (TypeScript, feature-flagged)

### Web (Frontend)
- `web/admin-portal/` – Backoffice web application for administrators (React + TypeScript)
- `web/kiosk-pwa/` – Kiosk Progressive Web App for scanning passes (React + TypeScript)
- `web/parent-web/` – Parent portal for managing bookings (React + TypeScript)

### Infrastructure
- `infra/` – Terraform configuration for Google Cloud infrastructure
- `.github/workflows/` – GitHub Actions pipelines for building and deploying services
- `firebase.json` – Firebase configuration (Hosting, Firestore)
- `firestore.indexes.json` – Firestore index definitions
- `firestore.rules` – Firestore security rules

### ACF Framework (Agent Development)
- `docs/agents/` – Agent manifests for specialized AI agents
- `docs/acf/` – ACF process documentation (task workflow, git conventions, style guides)
- `.backlog/` – Task management (pending, in-progress, completed, accepted, etc.)
- `CLAUDE.md` – AI assistant instructions for Claude Code
- `Makefile` – Development workflow commands

## Tech Stack

**Backend**: TypeScript, Fastify, Node.js 18+, Firebase Admin SDK
**Frontend**: React, TypeScript, Vite, CSS Modules, React Router
**Database**: Firestore (Firebase)
**Infrastructure**: Google Cloud Platform (Cloud Run, Cloud Build), Firebase (Hosting, Firestore, Auth)
**Testing**: Jest, Testing Library, Playwright
**CI/CD**: GitHub Actions
**IaC**: Terraform

## Development Workflow

### Using ACF Framework

This project uses **ACF (Agentic Continuous Flow)** for AI-assisted development with specialized agents.

**Available Agents**:
- `typescript-engineer` – Backend services (Fastify APIs)
- `react-engineer` – Frontend applications
- `database-engineer` – Firestore schema and security rules
- `devops` – Firebase/GCP deployment
- `test-engineer` – Testing (Jest, Playwright)
- `quality-reviewer` – Quality assurance
- `task-engineer` – Task management
- `lean-architect` – System architecture
- `retro` – Process improvement
- `precommit` – Pre-commit hooks

See `docs/agents/README.md` for full agent documentation.

### Task Management

Tasks are managed in `.backlog/` directory with workflow states:

```
.backlog/
├── draft/          # User-controlled ideas
├── pending/        # Ready to start
├── in-progress/    # Active work
├── completed/      # Awaiting review
├── in-review/      # Under quality review
├── rejected/       # Needs fixes
├── blocked/        # Unresolvable issues
└── accepted/       # Successfully completed
```

Check backlog status: `make acf-backlog`

### Quality Gates

Before committing code, ensure all quality checks pass:

```bash
# For backend services
cd services/core-api
npm run lint && npm run typecheck && npm run build && npm test

# For frontend apps
cd web/admin-portal
npm run lint && npm run typecheck && npm run build && npm test

# For all projects
make quality
```

**Coverage Requirements**:
- Backend services: >80% test coverage
- Frontend apps: >70% test coverage

## CI/CD Pipeline

### Quality Gates

All code must pass quality gates before deployment. The CI/CD pipeline enforces the following checks:

**For TypeScript Backend Services** (core-api, booking-api):
- ESLint: No errors or warnings
- TypeScript typecheck: No type errors
- Tests: Jest with >80% coverage
- Build: Successful compilation

**For React Frontend Apps** (admin-portal, kiosk-pwa, parent-web):
- ESLint: No errors or warnings
- TypeScript typecheck: No type errors
- Tests: Jest with >70% coverage
- Build: Successful Vite build

### Running Quality Gates Locally

```bash
# Backend services
cd services/core-api
npm run lint && npm run typecheck && npm test && npm run build

# Frontend apps
cd web/admin-portal
npm run lint && npm run typecheck && npm test && npm run build

# All projects
make quality
```

### Deployment Process

**GitHub Actions Workflows**:
1. Push to `main` branch
2. Quality gates run automatically (lint, typecheck, test, build)
3. If ALL gates pass - Deploy to Cloud Run / Firebase Hosting
4. If ANY gate fails - Deployment blocked, fix issues

**Cloud Build (GCP)**:
1. Submit build to Google Cloud Build
2. Quality gates run for all services and apps
3. If all pass - Deploy to Cloud Run and Firebase Hosting
4. If any fail - Build fails, no deployment

### Pipeline Architecture

```
┌─────────────────────┐
│   Code Push/Submit  │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Quality Gates      │
│  ├─ Install deps    │
│  ├─ Lint            │
│  ├─ TypeCheck       │
│  ├─ Test (coverage) │
│  └─ Build           │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Database Verify     │
│ (Pre-deployment)    │
└──────────┬──────────┘
           │
           v
    ┌──────┴──────┐
    │   Pass?     │
    └──┬──────┬───┘
       │      │
      Yes     No
       │      │
       v      v
  ┌────────┐ ┌────────┐
  │ Deploy │ │ Block  │
  └────┬───┘ └────────┘
       │
       v
┌─────────────────────┐
│ Database Migration  │
│ (Post-deployment)   │
└─────────────────────┘
```

### Database Integrity in Pipeline

The CI/CD pipeline includes automated database verification and migration steps:

**Pre-Deployment Verification** (Fail-Fast):
- Runs BEFORE any deployment
- Verifies database integrity (clients, passes, redeems)
- Checks searchTokens, tokenHashes, foreign keys
- **Blocks deployment if critical issues found**

**Post-Deployment Migration** (Data Optimization):
- Runs AFTER successful deployment
- Repairs searchTokens for optimized search
- Fixes fullNameLower for case-insensitive search
- Updates tokenHashes if needed
- Re-verifies database after migration

**Service Account Permissions**:

The Cloud Build service account requires these IAM roles:
- `roles/datastore.user` - Read/write Firestore data
- `roles/secretmanager.secretAccessor` - Access TOKEN_SECRET
- `roles/run.admin` - Deploy to Cloud Run
- `roles/storage.admin` - Access Cloud Storage for artifacts

To grant permissions:

```bash
PROJECT_ID="your-project-id"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

**Manual Database Operations**:

```bash
# Verify database integrity
cd services/core-api
export GOOGLE_CLOUD_PROJECT="your-project-id"
export TOKEN_SECRET="your-secret"
npm run verify:data-integrity

# Repair database (dry-run first)
npm run repair:data-integrity:dry-run
npm run repair:data-integrity
```

See `services/core-api/scripts/README.md` for detailed documentation.

### Quality Gate Failures

If quality gates fail:
1. **Check logs**: Review CI/CD logs for specific errors
2. **Fix locally**: Run the failing command locally to reproduce
3. **Test**: Ensure all quality gates pass locally
4. **Push**: Commit and push fixes
5. **Verify**: Confirm pipeline passes

### Bypassing Quality Gates

**WARNING**: Quality gates should NEVER be bypassed.

If absolutely necessary:
- `[skip ci]` in commit message (skips CI entirely)
- `--no-verify` flag (skips pre-commit hooks only, NOT CI)

**Note**: Bypassing quality gates can lead to broken deployments.

### Performance Targets

- Quality gates: <5 minutes total
- Test execution: <2 minutes per service/app
- Build time: <2 minutes per service/app
- Total pipeline time: <15 minutes

## Common Commands

```bash
make help              # Show all available commands
make install           # Install all dependencies
make dev               # Start development servers
make build             # Build all projects
make test              # Run all tests
make test-coverage     # Run tests with coverage
make lint              # Lint all code
make format            # Format code with Prettier
make typecheck         # Run TypeScript type checking
make quality           # Run all quality checks
make clean             # Clean build artifacts

# Firebase
make firebase-emulators  # Start Firebase emulators
make deploy-dev        # Deploy to dev environment
make deploy-prod       # Deploy to production

# Terraform
make tf-plan           # Run Terraform plan
make tf-apply          # Run Terraform apply

# ACF
make acf-backlog       # Show backlog status
make acf-agents        # List available agents
```

## Contributing

1. Check `CLAUDE.md` for AI assistant instructions
2. Review agent manifests in `docs/agents/` for specialized work
3. Follow task workflow in `docs/acf/backlog/workflow.md`
4. Adhere to git conventions in `docs/acf/git/commit-conventions.md`
5. Ensure quality gates pass before committing
6. All tasks must have binary acceptance criteria

## Documentation

- **AI Instructions**: `CLAUDE.md` – Instructions for Claude Code agents
- **Agent Manifests**: `docs/agents/` – Specialized agent documentation
- **ACF Process**: `docs/acf/` – Task workflow, git conventions, style guides
- **API Specs**: `services/*/openapi.yaml` – OpenAPI specifications

More components and documentation will be added as development progresses.
