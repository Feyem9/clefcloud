# Fichier pour les ressources réseau spécifiques à us-east-1

# VPC pour la région us-east-1
resource "aws_vpc" "us_east_1" {

  cidr_block = "10.1.0.0/16" # Utilisez un CIDR différent de votre VPC principal

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}-us-east-1"
  }
}