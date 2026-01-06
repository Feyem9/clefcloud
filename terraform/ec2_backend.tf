resource "aws_instance" "backend" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public_1.id
  associate_public_ip_address = true

  tags = {
    Name = "clefcloud-backend"
  }
}
