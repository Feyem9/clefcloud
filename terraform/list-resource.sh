#!/bin/bash

echo "🔍 VPCs in us-east-1:"
aws ec2 describe-vpcs \
  --region us-east-1 \
  --query 'Vpcs[*].{VpcId:VpcId,Cidr:CidrBlock}' \
  --output table

echo -e "\n🔍 EC2 Instances in us-east-1:"
aws ec2 describe-instances \
  --region us-east-1 \
  --query 'Reservations[*].Instances[*].{InstanceId:InstanceId,State:State.Name,Type:InstanceType,AZ:Placement.AvailabilityZone}' \
  --output table

echo -e "\n🔍 S3 Buckets in us-east-1:"
for bucket in $(aws s3api list-buckets --query 'Buckets[*].Name' --output text); do
  region=$(aws s3api get-bucket-location --bucket "$bucket" --query 'LocationConstraint' --output text 2>/dev/null)
  # Normalize region: null = us-east-1
  if [ "$region" == "None" ] || [ "$region" == "us-east-1" ]; then
    echo "✅ $bucket"
  fi
done

