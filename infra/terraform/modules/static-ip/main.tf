resource "google_compute_address" "addr" {
  project      = var.project_id
  region       = var.region
  name         = var.name
  address_type = "EXTERNAL"
}
