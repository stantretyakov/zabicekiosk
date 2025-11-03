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
