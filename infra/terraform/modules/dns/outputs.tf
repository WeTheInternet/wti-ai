output "zone_name" {
  value = google_dns_managed_zone.zone.name
}

output "a_record_fqdn" {
  value = google_dns_record_set.a.name
}
