# RDS PostgreSQL Database

# Subnet group pour RDS
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-${var.environment}"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "${var.project_name}-db-subnet-${var.environment}"
  }
}

# Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-db-params-${var.environment}"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_checkpoints"
    value = "1"
  }

  tags = {
    Name = "${var.project_name}-db-params-${var.environment}"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db-${var.environment}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "clefcloud"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment == "dev" ? null : "${var.project_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  deletion_protection = var.environment == "prod" ? true : false

  tags = {
    Name = "${var.project_name}-db-${var.environment}"
  }
}

# RDS Read Replica (pour production)
resource "aws_db_instance" "replica" {
  count = var.environment == "prod" ? 1 : 0

  identifier          = "${var.project_name}-db-replica-${var.environment}"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = "db.t3.micro"

  skip_final_snapshot = false
  publicly_accessible = false

  tags = {
    Name = "${var.project_name}-db-replica-${var.environment}"
  }
}
