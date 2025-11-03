# devops Documentation Manifest

## Agent Identity

**Role**: Deployment and infrastructure specialist

**Technology Focus**: Firebase, Google Cloud Platform, GitHub Actions, CI/CD

**Scope**: Firebase deployment, Cloud Run services, GitHub Actions workflows, environment configuration, monitoring

**Out of Scope**: Application code → typescript-engineer/react-engineer | Database schema → database-engineer

---

## Priority 1: MUST READ

1. **Infrastructure** - Review .github/workflows/ for CI/CD pipelines
2. **Firebase Config** - firebase.json configuration
3. **Cloud Build** - cloudbuild.yaml for GCP deployment

---

## Priority 2: SHOULD READ

1. **Environment Variables** - Environment configuration patterns
2. **Terraform** - Infrastructure as code in infra/ directory
3. **Monitoring** - Firebase monitoring and logging

---

## Priority 3: REFERENCE

1. **Rollback Procedures** - Deployment rollback strategies
2. **Scaling** - Auto-scaling configuration
3. **Cost Optimization** - GCP cost management

---

## Scope Boundaries

**IS responsible for**:
- Firebase deployment configuration
- GitHub Actions CI/CD pipelines
- Cloud Run service deployment
- Environment variable management
- Terraform infrastructure
- Monitoring and alerting setup

**NOT responsible for**:
- Application logic → typescript-engineer
- UI implementation → react-engineer
- Database schema → database-engineer

---

## Quality Gates

**Before marking task complete**:

```bash
# Validate Firebase configuration
firebase deploy --only hosting --project=dev --dry-run

# Validate Terraform
cd infra
terraform fmt -check
terraform validate
terraform plan

# Test GitHub Actions locally (using act)
act -n  # Dry run

# Deploy to dev environment
firebase deploy --only hosting --project=dev
```

**Requirements**:
- All deployments tested in dev first
- Rollback procedure documented
- Environment variables documented
- CI/CD pipeline passes all checks

---

## Common Patterns

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-api.yml
name: Deploy Core API

on:
  push:
    branches: [main]
    paths:
      - 'services/core-api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd services/core-api
          npm ci

      - name: Build
        run: |
          cd services/core-api
          npm run build

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: core-api
          region: us-central1
          source: ./services/core-api
```

### Firebase Configuration

```json
// firebase.json
{
  "hosting": {
    "public": "web/admin-portal/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### Terraform Resource

```hcl
# infra/main.tf
resource "google_cloud_run_service" "core_api" {
  name     = "core-api"
  location = "us-central1"

  template {
    spec {
      containers {
        image = "gcr.io/project-id/core-api:latest"

        env {
          name  = "NODE_ENV"
          value = "production"
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
```

---

## Anti-Patterns

**DON'T**:
- ❌ Deploy directly to production - Always deploy to dev first
- ❌ Hardcode secrets - Use Secret Manager or environment variables
- ❌ Skip rollback testing - Always test rollback procedure
- ❌ Manual deployments - Use CI/CD pipelines
- ❌ Ignore monitoring - Set up alerts for critical services
- ❌ Large containers - Optimize Docker image size

**DO**:
- ✅ Use infrastructure as code (Terraform)
- ✅ Version control all configuration
- ✅ Implement blue-green deployments
- ✅ Set up health checks
- ✅ Monitor service metrics
- ✅ Document deployment procedures

---

## Integration Points

**Receives work from**:
- `task-engineer` - Infrastructure task specifications
- `lean-architect` - Architecture decisions

**Hands off work to**:
- `quality-reviewer` - For deployment review

**Collaborates with**:
- `typescript-engineer` - Service deployment
- `react-engineer` - Frontend hosting
- `database-engineer` - Database migrations

---

**Last Updated**: 2025-11-03
