output "gateway_static_ip" {
  value = data.terraform_remote_state.foundation.outputs.gateway_static_ip
}

output "conductor_a_record" {
  value = data.terraform_remote_state.foundation.outputs.conductor_a_record
}
