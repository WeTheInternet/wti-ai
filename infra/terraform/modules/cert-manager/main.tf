resource "google_service_account" "dns01" {
  project      = var.project_id
  account_id   = "cert-manager-dns01"
  display_name = "cert-manager DNS01"
}

resource "google_project_iam_member" "dns_admin" {
  project = var.project_id
  role    = "roles/dns.admin"
  member  = "serviceAccount:${google_service_account.dns01.email}"
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
      "iam.gke.io/gcp-service-account" = google_service_account.dns01.email
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

resource "google_service_account_iam_binding" "workload_identity" {
  service_account_id = google_service_account.dns01.name
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
        email  = var.acme_email
        server = var.acme_server
        privateKeySecretRef = {
          name = "letsencrypt-dns01-account-key"
        }
        solvers = [
          {
            dns01 = {
              cloudDNS = {
                project                 = var.project_id
                hostedZoneName = var.zone_name
              }
            }
          }
        ]
      }
    }
  }

  depends_on = [helm_release.cert_manager]
}
