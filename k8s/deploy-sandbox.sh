#!/bin/bash

# Deploy to Sandbox Environment
echo "🚀 Deploying RoastMe to Sandbox Environment..."

# Create namespace if it doesn't exist
kubectl create namespace sandbox --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
echo "📦 Applying secrets..."
kubectl apply -f secrets-sandbox.yaml

# Apply deployment
echo "🏗️ Applying deployment..."
kubectl apply -f deployment-sandbox.yaml

# Apply ingress
echo "🌐 Applying ingress..."
kubectl apply -f ingress-sandbox.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/roastme-web -n sandbox

# Check pod status
echo "📊 Pod status:"
kubectl get pods -n sandbox -l app=roastme-web

# Check service status
echo "🔗 Service status:"
kubectl get service -n sandbox -l app=roastme-web

# Check ingress status
echo "🌍 Ingress status:"
kubectl get ingress -n sandbox

echo "✅ Sandbox deployment complete!"
echo "🌐 Application should be available at: https://sandbox.roastme.tocld.com"