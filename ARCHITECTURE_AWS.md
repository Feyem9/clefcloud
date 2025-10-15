# Architecture AWS de ClefCloud

## 📐 Vue d'ensemble

ClefCloud utilise une architecture AWS complète et scalable pour gérer l'application de partitions musicales.

## 🏗️ Composants AWS

### 1. **VPC (Virtual Private Cloud)**
- CIDR: `10.0.0.0/16`
- 2 Subnets publics (pour ALB et NAT Gateway)
- 2 Subnets privés (pour EC2 et RDS)
- Internet Gateway pour accès externe
- NAT Gateway pour accès sortant depuis subnets privés

### 2. **EC2 (Elastic Compute Cloud)**
- **Instance Type**: t3.micro (dev) / t3.small (prod)
- **OS**: Ubuntu 22.04 LTS
- **Auto Scaling**: 1-4 instances selon la charge
- **Services**:
  - Backend NestJS (port 3000)
  - Nginx reverse proxy
  - PM2 pour gestion des processus
  - CloudWatch Agent pour monitoring

### 3. **RDS (Relational Database Service)**
- **Engine**: PostgreSQL 15
- **Instance**: db.t3.micro
- **Storage**: 20GB (auto-scaling jusqu'à 100GB)
- **Backup**: 7 jours de rétention
- **Multi-AZ**: Activé en production
- **Encryption**: Activée

### 4. **S3 (Simple Storage Service)**
- **Bucket Partitions**: Stockage des fichiers PDF/images
  - Versioning activé
  - Encryption AES-256
  - Lifecycle: Transition vers Glacier après 180 jours
- **Bucket Logs**: Logs applicatifs
- **Bucket Backups**: Sauvegardes de la base de données

### 5. **Cognito (Authentification)**
- **User Pool**: Gestion des utilisateurs
- **Identity Pool**: Accès direct aux ressources AWS
- **MFA**: Optionnel
- **Password Policy**: 8+ caractères, majuscules, minuscules, chiffres

### 6. **ALB (Application Load Balancer)**
- Distribution du trafic entre instances EC2
- Health checks sur `/health`
- SSL/TLS termination
- Sticky sessions activées

### 7. **IAM (Identity and Access Management)**
- **EC2 Role**: Accès à S3, CloudWatch, RDS
- **CI/CD User**: Déploiement automatisé
- **Cognito Roles**: Utilisateurs authentifiés

### 8. **CloudWatch**
- **Logs**: Application, Nginx, RDS
- **Metrics**: CPU, Memory, Disk, Network
- **Alarms**: CPU > 80%, Storage < 2GB
- **Dashboard**: Vue d'ensemble des métriques

## 📊 Diagramme d'architecture

```
                                    Internet
                                       |
                                       v
                            [Route 53 - DNS]
                                       |
                                       v
                        [Application Load Balancer]
                                       |
                    +------------------+------------------+
                    |                                     |
                    v                                     v
            [EC2 - Public Subnet 1]          [EC2 - Public Subnet 2]
            (Backend NestJS + Nginx)         (Backend NestJS + Nginx)
                    |                                     |
                    +------------------+------------------+
                                       |
                                       v
                            [NAT Gateway]
                                       |
                    +------------------+------------------+
                    |                                     |
                    v                                     v
            [RDS - Private Subnet 1]          [RDS - Private Subnet 2]
            (PostgreSQL Primary)              (PostgreSQL Replica)
                    
                    
[S3 Buckets]                    [Cognito]              [CloudWatch]
- Partitions                    - User Pool            - Logs
- Logs                          - Identity Pool        - Metrics
- Backups                                              - Alarms
```

## 🔐 Sécurité

### Network Security
- **Security Groups**:
  - ALB: Ports 80, 443 ouverts
  - EC2: Port 3000 depuis ALB uniquement
  - RDS: Port 5432 depuis EC2 uniquement
- **NACLs**: Configuration par défaut
- **VPC Flow Logs**: Activés

### Data Security
- **Encryption at Rest**: 
  - RDS: Activée
  - S3: AES-256
- **Encryption in Transit**: 
  - HTTPS/TLS pour toutes les communications
- **Secrets Management**: 
  - Variables d'environnement
  - AWS Secrets Manager (recommandé pour prod)

### Access Control
- **IAM Roles**: Principe du moindre privilège
- **Cognito**: Authentification centralisée
- **MFA**: Disponible pour les utilisateurs

## 💰 Estimation des coûts (mensuel)

### Environnement Dev
- EC2 (t3.micro): ~$7.50
- RDS (db.t3.micro): ~$15
- S3 (50GB): ~$1.15
- ALB: ~$16
- Data Transfer: ~$5
- **Total**: ~$45/mois

### Environnement Production
- EC2 (2x t3.small): ~$30
- RDS (db.t3.small + replica): ~$60
- S3 (500GB): ~$11.50
- ALB: ~$16
- CloudWatch: ~$10
- Data Transfer: ~$20
- **Total**: ~$150/mois

## 🚀 Déploiement

### 1. Prérequis
```bash
# Installer Terraform
brew install terraform  # macOS
# ou télécharger depuis terraform.io

# Installer AWS CLI
brew install awscli  # macOS
aws configure
```

### 2. Déployer l'infrastructure
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Éditer terraform.tfvars avec vos valeurs

terraform init
terraform plan
terraform apply
```

### 3. Déployer l'application
```bash
# Récupérer l'IP de l'instance EC2
EC2_IP=$(terraform output -raw ec2_public_ip)

# Déployer le backend
EC2_HOST=$EC2_IP ./scripts/deploy-backend.sh
```

## 📈 Scalabilité

### Auto Scaling
- **Metric**: CPU Utilization
- **Scale Up**: CPU > 80% pendant 2 minutes
- **Scale Down**: CPU < 20% pendant 2 minutes
- **Min Instances**: 1 (dev), 2 (prod)
- **Max Instances**: 4

### Database Scaling
- **Vertical**: Augmenter la taille de l'instance
- **Read Replicas**: Pour les lectures intensives
- **Connection Pooling**: TypeORM avec pool de 20 connexions

### Storage Scaling
- **RDS**: Auto-scaling jusqu'à 100GB
- **S3**: Illimité, avec lifecycle policies

## 🔄 Backup & Recovery

### RDS
- **Automated Backups**: 7 jours
- **Manual Snapshots**: Avant changements majeurs
- **Point-in-Time Recovery**: Activé

### S3
- **Versioning**: Activé sur bucket partitions
- **Cross-Region Replication**: Recommandé pour prod

## 📊 Monitoring

### CloudWatch Dashboards
- Vue d'ensemble des métriques
- Graphiques en temps réel
- Alertes configurées

### Logs
- Application logs: `/aws/ec2/clefcloud/{env}/app`
- Nginx logs: `/aws/ec2/clefcloud/{env}/nginx`
- RDS logs: `/aws/rds/instance/{instance}/postgresql`

### Alertes
- CPU > 80%
- Memory > 85%
- Disk < 2GB
- Unhealthy targets sur ALB
- RDS connections > 80%

## 🛠️ Maintenance

### Updates
- **OS**: Automatiques via unattended-upgrades
- **Application**: CI/CD avec GitHub Actions
- **Database**: Fenêtre de maintenance configurée

### Disaster Recovery
- **RTO**: < 1 heure
- **RPO**: < 15 minutes
- **Procédure**: Restauration depuis snapshot RDS

## 📚 Ressources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [NestJS Documentation](https://docs.nestjs.com/)
