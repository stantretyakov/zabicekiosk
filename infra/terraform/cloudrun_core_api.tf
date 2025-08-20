resource "google_cloud_run_service" "core_api" {
  name     = "core-api"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/services/core-api:latest"
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
        env {
          name  = "FIRESTORE_DATABASE_ID"
          value = var.firestore_database_id
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
