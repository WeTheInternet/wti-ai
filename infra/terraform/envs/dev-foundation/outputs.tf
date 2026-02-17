output "project_id" {
  value = var.project_id
}

output "region" {
  value = var.region
}

output "cluster_name" {
  value = module.gke.name
}

output "cluster_endpoint" {
  value = module.gke.endpoint
}

output "cluster_ca_certificate" {
  value = module.gke.ca_certificate
}

output "gateway_static_ip" {
  value = module.static_ip.address
}

output "dns_zone_name" {
  value = module.dns.zone_name
}

output "conductor_a_record" {
  value = module.dns.a_record_fqdn
}

output "cert_manager_dns01_service_account_email" {
  value = google_service_account.cert_manager_dns01.email
}
