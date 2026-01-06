
resource "aws_s3_bucket" "partitions" {
  bucket   = "clefcloud-partitions-dev"
  provider = aws.us-east-1

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Environment = "dev"
    Project     = "clefcloud"
  }
}
