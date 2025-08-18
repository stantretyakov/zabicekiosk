output "artifact_registry_repo" {
  description = "Artifact Registry repository for container images"
  value       = google_artifact_registry_repository.services.id
}
