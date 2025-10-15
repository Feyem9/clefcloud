#!/bin/bash
set -e

# Script d'initialisation pour les instances EC2
# Ce script configure l'environnement et déploie l'application

echo "🚀 Starting ClefCloud EC2 initialization..."

# Mise à jour du système
apt-get update
apt-get upgrade -y

# Installation de Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Installation de PM2 pour la gestion des processus
npm install -g pm2

# Installation de nginx comme reverse proxy
apt-get install -y nginx

# Installation de CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb

# Création du répertoire de l'application
mkdir -p /opt/clefcloud
cd /opt/clefcloud

# Création du fichier de configuration
cat > /opt/clefcloud/.env << EOF
NODE_ENV=${environment}
PORT=3000
AWS_REGION=${aws_region}
S3_BUCKET=${s3_bucket}
RDS_ENDPOINT=${rds_endpoint}
DB_NAME=${db_name}
DB_USERNAME=${db_username}
COGNITO_USER_POOL_ID=${cognito_pool_id}
COGNITO_CLIENT_ID=${cognito_client}
EOF

# Configuration de nginx
cat > /etc/nginx/sites-available/clefcloud << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Activation du site nginx
ln -sf /etc/nginx/sites-available/clefcloud /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Configuration de CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/clefcloud/${environment}/nginx",
            "log_stream_name": "{instance_id}/access.log"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/clefcloud/${environment}/nginx",
            "log_stream_name": "{instance_id}/error.log"
          },
          {
            "file_path": "/opt/clefcloud/logs/app.log",
            "log_group_name": "/aws/ec2/clefcloud/${environment}/app",
            "log_stream_name": "{instance_id}/app.log"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "ClefCloud/${environment}",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
        ],
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ]
      }
    }
  }
}
EOF

# Démarrage de CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Note: Le code de l'application doit être déployé séparément via CI/CD
# Ce script prépare uniquement l'environnement

echo "✅ EC2 initialization completed!"
echo "📝 Application directory: /opt/clefcloud"
echo "🔧 Environment: ${environment}"
echo "📦 S3 Bucket: ${s3_bucket}"
