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
