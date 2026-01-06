# Fichier pour récupérer des informations sur les ressources existantes dans us-east-1

# Récupérer la liste de tous les VPCs dans la région us-east-1
data "aws_vpcs" "all_us_east_1" {
}

# Récupérer la liste de toutes les instances EC2 dans la région us-east-1
data "aws_instances" "all_us_east_1" {
}

# Récupérer la liste de tous les buckets S3
# S3 est un service global, mais l'appel API peut être fait via le provider us-east-1
data "aws_s3_bucket" "all" {
  bucket = "clefcloud-partitions-dev"
}

output "us_east_1_vpc_ids" {
  description = "Liste des ID de tous les VPCs dans la région us-east-1"
  value       = data.aws_vpcs.all_us_east_1.ids
}

output "us_east_1_instance_ids" {
  description = "Liste des ID de toutes les instances EC2 dans la région us-east-1"
  value       = data.aws_instances.all_us_east_1.ids
}

output "all_s3_bucket_names" {
  description = "Liste des noms de tous les buckets S3"
  value       = data.aws_s3_bucket.all.bucket
}