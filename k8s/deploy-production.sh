#!/bin/bash

# Deploy to Production Environment
echo "🚀 Deploying RoastMe to Production Environment..."

# Create namespace if it doesn't exist
kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
echo "📦 Applying secrets..."
kubectl apply -f secrets-production.yaml

# Apply deployment
echo "🏗️ Applying deployment..."
kubectl apply -f deployment.yaml

# Apply ingress
echo "🌐 Applying ingress..."
kubectl apply -f ingress.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/roastme-web -n production

# Check pod status
echo "📊 Pod status:"
kubectl get pods -n production -l app=roastme-web

# Check service status
echo "🔗 Service status:"
kubectl get service -n production -l app=roastme-web

# Check ingress status
echo "🌍 Ingress status:"
kubectl get ingress -n production

echo "✅ Production deployment complete!"
echo "🌐 Application should be available at: https://roastme.tocld.com"