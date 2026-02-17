resource "google_dns_managed_zone" "zone" {
  project = var.project_id
  name    = var.zone_name
  dns_name = var.dns_name
}

locals {
  record_hostname_trimmed = trim(var.record_hostname, ".")
}

resource "google_dns_record_set" "a" {
  project      = var.project_id
  managed_zone = google_dns_managed_zone.zone.name

  name = "${local.record_hostname_trimmed}."
  type = "A"
  ttl  = 300

  rrdatas = [var.record_ip]
}
