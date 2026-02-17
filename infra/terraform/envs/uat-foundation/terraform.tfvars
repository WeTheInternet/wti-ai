project_id = "we-the-internet"
region     = "northamerica-northeast2"
zone       = "northamerica-northeast2-a"

env          = "uat"
cluster_name = "wti-uat"

network_name = "wti-ai-net"
subnet_name  = "wti-ai-subnet"

subnet_cidr         = "10.45.0.0/24"
pods_range_name     = "pods"
pods_cidr           = "10.45.8.0/21"
services_range_name = "services"
services_cidr       = "10.45.4.0/23"

dns_zone_name = "wti-net"
dns_domain    = "wti.net"

conductor_hostname = "conductor-uat.wti.net"
