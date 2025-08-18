resource "google_secret_manager_secret" "hmac_secret" {
  secret_id = "HMAC_SECRET"
  replication {
    automatic = true
  }
}
