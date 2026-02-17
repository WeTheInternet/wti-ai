resource "kubernetes_namespace" "wti_ai" {
  metadata {
    name = "wti-ai"
  }
}

resource "kubernetes_deployment" "placeholder" {
  metadata {
    name      = "conductor-placeholder"
    namespace = kubernetes_namespace.wti_ai.metadata[0].name
    labels = {
      app = "conductor-placeholder"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "conductor-placeholder"
      }
    }

    template {
      metadata {
        labels = {
          app = "conductor-placeholder"
        }
      }

      spec {
        container {
          name  = "http-echo"
          image = "hashicorp/http-echo:1.0.0"

          args = ["-text=conductor placeholder"]

          port {
            name           = "http"
            container_port = 5678
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "placeholder" {
  metadata {
    name      = "conductor-placeholder"
    namespace = kubernetes_namespace.wti_ai.metadata[0].name
  }

  spec {
    selector = {
      app = "conductor-placeholder"
    }

    port {
      name        = "http"
      port        = 80
      target_port = "http"
    }
  }
}

resource "kubernetes_manifest" "certificate" {
  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "Certificate"
    metadata = {
      name      = "conductor-wti-net"
      namespace = kubernetes_namespace.wti_ai.metadata[0].name
    }
    spec = {
      secretName = "conductor-wti-net-tls"
      dnsNames   = [var.conductor_hostname]
      issuerRef = {
        name = "letsencrypt-dns01"
        kind = "ClusterIssuer"
      }
    }
  }
}

resource "kubernetes_manifest" "gateway" {
  manifest = {
    apiVersion = "gateway.networking.k8s.io/v1"
    kind       = "Gateway"
    metadata = {
      name      = "conductor-gateway"
      namespace = kubernetes_namespace.wti_ai.metadata[0].name
    }
    spec = {
      gatewayClassName = "envoy-gateway"
      addresses = [
        {
          type  = "IPAddress"
          value = var.gateway_static_ip
        }
      ]
      listeners = [
        {
          name     = "https"
          hostname = var.conductor_hostname
          port     = 443
          protocol = "HTTPS"
          tls = {
            mode = "Terminate"
            certificateRefs = [
              {
                kind = "Secret"
                name = "conductor-wti-net-tls"
              }
            ]
          }
        }
      ]
    }
  }
}

resource "kubernetes_manifest" "httproute" {
  manifest = {
    apiVersion = "gateway.networking.k8s.io/v1"
    kind       = "HTTPRoute"
    metadata = {
      name      = "conductor"
      namespace = kubernetes_namespace.wti_ai.metadata[0].name
    }
    spec = {
      parentRefs = [
        {
          name = kubernetes_manifest.gateway.manifest.metadata.name
        }
      ]
      hostnames = [var.conductor_hostname]
      rules = [
        {
          matches = [
            {
              path = {
                type  = "PathPrefix"
                value = "/"
              }
            }
          ]
          backendRefs = [
            {
              name = kubernetes_service.placeholder.metadata[0].name
              port = 80
            }
          ]
        }
      ]
    }
  }
}
