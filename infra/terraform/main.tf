terraform {
  required_version = ">= 1.3.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Artifact Registry
resource "google_artifact_registry_repository" "services" {
  location      = var.region
  repository_id = "services"
  description   = "Container images for services"
  format        = "DOCKER"
}

# Firestore enablement
resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"
}

resource "google_firestore_database" "default" {
  name        = "(default)"
  location_id = var.region
  project     = var.project_id
  type        = "FIRESTORE_NATIVE"
  depends_on  = [google_project_service.firestore]
}

# Identity Platform enablement
resource "google_project_service" "identity_platform" {
  service = "identitytoolkit.googleapis.com"
}
