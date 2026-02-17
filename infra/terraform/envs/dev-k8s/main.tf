provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

data "google_client_config" "default" {}

data "terraform_remote_state" "foundation" {
  backend = "local"

  config = {
    path = "../dev-foundation/terraform.tfstate"
  }
}

provider "kubernetes" {
  host                   = "https://${data.terraform_remote_state.foundation.outputs.cluster_endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(data.terraform_remote_state.foundation.outputs.cluster_ca_certificate)
}

provider "helm" {
  kubernetes {
    host                   = "https://${data.terraform_remote_state.foundation.outputs.cluster_endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(data.terraform_remote_state.foundation.outputs.cluster_ca_certificate)
  }
}

resource "kubernetes_namespace" "cert_manager" {
  metadata {
    name = "cert-manager"
  }
}

resource "kubernetes_service_account" "cert_manager" {
  metadata {
    name      = "cert-manager"
    namespace = kubernetes_namespace.cert_manager.metadata[0].name
    annotations = {
      "iam.gke.io/gcp-service-account" = data.terraform_remote_state.foundation.outputs.cert_manager_dns01_service_account_email
    }
  }

  automount_service_account_token = true
}

resource "helm_release" "cert_manager" {
  name       = "cert-manager"
  namespace  = kubernetes_namespace.cert_manager.metadata[0].name
  repository = "https://charts.jetstack.io"
  chart      = "cert-manager"
  version    = "1.14.5"

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "serviceAccount.create"
    value = "false"
  }

  set {
    name  = "serviceAccount.name"
    value = kubernetes_service_account.cert_manager.metadata[0].name
  }

  depends_on = [kubernetes_service_account.cert_manager]
}

resource "google_service_account_iam_binding" "cert_manager_workload_identity" {
  service_account_id = data.terraform_remote_state.foundation.outputs.cert_manager_dns01_service_account_email
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[cert-manager/cert-manager]",
  ]
}

resource "kubernetes_manifest" "cluster_issuer" {
  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "ClusterIssuer"
    metadata = {
      name = "letsencrypt-dns01"
    }
    spec = {
      acme = {
        email  = var.cert_manager_acme_email
        server = var.cert_manager_acme_server
        privateKeySecretRef = {
          name = "letsencrypt-dns01-account-key"
        }
        solvers = [
          {
            dns01 = {
              cloudDNS = {
                project        = var.project_id
                hostedZoneName = data.terraform_remote_state.foundation.outputs.dns_zone_name
              }
            }
          }
        ]
      }
    }
  }

  depends_on = [helm_release.cert_manager]
}

resource "kubernetes_namespace" "envoy_gateway_system" {
  metadata {
    name = "envoy-gateway-system"
  }
}

resource "helm_release" "envoy_gateway" {
  name       = "envoy-gateway"
  namespace  = kubernetes_namespace.envoy_gateway_system.metadata[0].name
  repository = "https://charts.envoyproxy.io"
  chart      = "gateway-helm"
  version    = "1.0.2"
}

module "wti_ai" {
  source             = "../../modules/wti-ai"
  conductor_hostname = var.conductor_hostname
  gateway_static_ip  = data.terraform_remote_state.foundation.outputs.gateway_static_ip

  depends_on = [helm_release.cert_manager, helm_release.envoy_gateway, kubernetes_manifest.cluster_issuer]
}
