# AWS Cognito User Pool pour l'authentification

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-user-pool-${var.environment}"

  # Configuration des attributs utilisateur
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Schéma des attributs
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Politique de mot de passe
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # Configuration MFA (optionnel)
  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  # Configuration de récupération de compte
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Configuration email
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Messages de vérification
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "ClefCloud - Code de vérification"
    email_message        = "Votre code de vérification est {####}"
  }

  # Configuration des invitations
  admin_create_user_config {
    allow_admin_create_user_only = false

    invite_message_template {
      email_subject = "Bienvenue sur ClefCloud"
      email_message = "Votre nom d'utilisateur est {username} et votre mot de passe temporaire est {####}"
      sms_message   = "Votre nom d'utilisateur est {username} et votre mot de passe temporaire est {####}"
    }
  }

  # Lambda triggers (optionnel)
  # lambda_config {
  #   pre_sign_up = aws_lambda_function.pre_signup.arn
  #   post_confirmation = aws_lambda_function.post_confirmation.arn
  # }

  tags = {
    Name = "${var.project_name}-user-pool-${var.environment}"
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  # OAuth configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = ["http://localhost:5173", "https://your-domain.com"]
  logout_urls                          = ["http://localhost:5173", "https://your-domain.com"]

  # Token validity
  refresh_token_validity = 30
  access_token_validity  = 1
  id_token_validity      = 1

  token_validity_units {
    refresh_token = "days"
    access_token  = "hours"
    id_token      = "hours"
  }

  # Attributs lisibles et modifiables
  read_attributes  = ["email", "name", "email_verified"]
  write_attributes = ["email", "name"]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito Identity Pool (pour accès direct aux ressources AWS)
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.project_name}_identity_pool_${var.environment}"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.main.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = {
    Name = "${var.project_name}-identity-pool-${var.environment}"
  }
}

# IAM Role pour utilisateurs authentifiés
resource "aws_iam_role" "authenticated" {
  name = "${var.project_name}-cognito-authenticated-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })
}

# Policy pour utilisateurs authentifiés
resource "aws_iam_role_policy" "authenticated" {
  name = "${var.project_name}-cognito-authenticated-policy-${var.environment}"
  role = aws_iam_role.authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.partitions.arn}/$${cognito-identity.amazonaws.com:sub}/*"
      }
    ]
  })
}

# Attachment du role à l'Identity Pool
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    authenticated = aws_iam_role.authenticated.arn
  }
}
