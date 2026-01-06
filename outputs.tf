output "ec2_public_ip" {
  description = "IP publique de l instance EC2 clefcloud-backend"
  value       = aws_instance.clefcloud-backend.public_ip
}
