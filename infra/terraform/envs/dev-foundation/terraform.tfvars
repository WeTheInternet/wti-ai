project_id = "we-the-internet"
region     = "northamerica-northeast2"
zone       = "northamerica-northeast2-a"

env          = "dev"
cluster_name = "wti-dev"

network_name = "wti-ai-net"
subnet_name  = "wti-ai-subnet"

subnet_cidr         = "10.44.0.0/24"
pods_range_name     = "pods"
pods_cidr           = "10.44.8.0/21"
services_range_name = "services"
services_cidr       = "10.44.4.0/23"

dns_zone_name = "wti-net"
dns_domain    = "wti.net"

conductor_hostname = "conductor-dev.wti.net"
