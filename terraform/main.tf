# Configuration du provider AWS
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend S3 pour stocker l'état Terraform (optionnel)
  # backend "s3" {
  #   bucket = "clefcloud-terraform-state"
  #   key    = "terraform.tfstate"
  #   region = "eu-west-1"
  # }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "ClefCloud"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environnement (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "clefcloud"
}

variable "vpc_cidr" {
  description = "CIDR block pour le VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_username" {
  description = "Username pour la base de données RDS"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password pour la base de données RDS"
  type        = string
  sensitive   = true
}

# Outputs
output "vpc_id" {
  description = "ID du VPC"
  value       = aws_vpc.main.id
}

output "s3_bucket_name" {
  description = "Nom du bucket S3"
  value       = aws_s3_bucket.partitions.id
}

output "ec2_public_ip" {
  description = "IP publique de l'instance EC2"
  value       = aws_instance.app_server.public_ip
}

output "rds_endpoint" {
  description = "Endpoint de la base de données RDS"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "cognito_user_pool_id" {
  description = "ID du User Pool Cognito"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "ID du Client Cognito"
  value       = aws_cognito_user_pool_client.main.id
}

output "alb_dns_name" {
  description = "DNS name du Load Balancer"
  value       = aws_lb.main.dns_name
}
