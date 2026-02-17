output "namespace" {
  value = kubernetes_namespace.wti_ai.metadata[0].name
}
