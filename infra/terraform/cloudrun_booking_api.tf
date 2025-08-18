resource "google_cloud_run_service" "booking_api" {
  name     = "booking-api"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/services/booking-api:latest"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
