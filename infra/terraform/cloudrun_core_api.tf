resource "google_cloud_run_service" "core_api" {
  name     = "core-api"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/services/core-api:latest"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
