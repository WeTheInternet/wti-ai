provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

module "project_services" {
  source     = "../../modules/project-services"
  project_id = var.project_id
}

module "network" {
  source              = "../../modules/network"
  project_id          = var.project_id
  region              = var.region
  network_name        = var.network_name
  subnet_name         = var.subnet_name
  subnet_cidr         = var.subnet_cidr
  pods_range_name     = var.pods_range_name
  pods_cidr           = var.pods_cidr
  services_range_name = var.services_range_name
  services_cidr       = var.services_cidr

  depends_on = [module.project_services]
}

module "gke" {
  source       = "../../modules/gke-autopilot"
  project_id   = var.project_id
  region       = var.region
  cluster_name = var.cluster_name
  network      = module.network.network_self_link
  subnetwork   = module.network.subnet_self_link

  depends_on = [module.network]
}

module "static_ip" {
  source     = "../../modules/static-ip"
  project_id = var.project_id
  region     = var.region
  name       = "${var.cluster_name}-gw-ip"

  depends_on = [module.project_services]
}

module "dns" {
  source          = "../../modules/dns"
  project_id      = var.project_id
  zone_name       = var.dns_zone_name
  dns_name        = "${var.dns_domain}."
  record_hostname = var.conductor_hostname
  record_ip       = module.static_ip.address

  depends_on = [module.project_services]
}

resource "google_service_account" "cert_manager_dns01" {
  project      = var.project_id
  account_id   = "cert-manager-dns01"
  display_name = "cert-manager DNS01"
}

resource "google_project_iam_member" "cert_manager_dns_admin" {
  project = var.project_id
  role    = "roles/dns.admin"
  member  = "serviceAccount:${google_service_account.cert_manager_dns01.email}"
}
