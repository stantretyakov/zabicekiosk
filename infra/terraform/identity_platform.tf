# Placeholder for Identity Platform configuration
# Enables Google as an identity provider for the admin portal.
resource "google_identity_platform_config" "default" {
  project = var.project_id
}
