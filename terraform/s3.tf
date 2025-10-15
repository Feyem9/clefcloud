# S3 Bucket pour les partitions
resource "aws_s3_bucket" "partitions" {
  bucket = "${var.project_name}-partitions-${var.environment}"

  tags = {
    Name        = "${var.project_name}-partitions-${var.environment}"
    Purpose     = "Store music sheet partitions"
  }
}

# Versioning
resource "aws_s3_bucket_versioning" "partitions" {
  bucket = aws_s3_bucket.partitions.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "partitions" {
  bucket = aws_s3_bucket.partitions.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access (sauf pour les fichiers spécifiques)
resource "aws_s3_bucket_public_access_block" "partitions" {
  bucket = aws_s3_bucket.partitions.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# CORS Configuration
resource "aws_s3_bucket_cors_configuration" "partitions" {
  bucket = aws_s3_bucket.partitions.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"] # À restreindre en production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lifecycle policy pour optimiser les coûts
resource "aws_s3_bucket_lifecycle_configuration" "partitions" {
  bucket = aws_s3_bucket.partitions.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Bucket policy pour accès public en lecture
resource "aws_s3_bucket_policy" "partitions" {
  bucket = aws_s3_bucket.partitions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.partitions.arn}/*"
      }
    ]
  })
}

# S3 Bucket pour les logs
resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-logs-${var.environment}"

  tags = {
    Name    = "${var.project_name}-logs-${var.environment}"
    Purpose = "Application and access logs"
  }
}

# Encryption pour les logs
resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle pour les logs
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}

# S3 Bucket pour les backups
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-backups-${var.environment}"

  tags = {
    Name    = "${var.project_name}-backups-${var.environment}"
    Purpose = "Database and application backups"
  }
}

# Versioning pour les backups
resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption pour les backups
resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
