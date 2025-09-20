#!/bin/bash

# Script to update secrets in both environments
echo "🔐 Updating Kubernetes secrets..."

# Function to update secrets for an environment
update_environment_secrets() {
    local env=$1
    local secrets_file=$2
    
    echo "📝 Updating $env environment secrets..."
    
    # Delete existing secret if it exists (ignore errors if it doesn't exist)
    kubectl delete secret roastme-app-secrets -n $env --ignore-not-found=true
    
    # Apply new secret
    kubectl apply -f $secrets_file
    
    # Restart deployment to pick up new secrets
    kubectl rollout restart deployment/roastme-web -n $env
    
    # Wait for rollout to complete
    kubectl rollout status deployment/roastme-web -n $env
    
    echo "✅ $env secrets updated successfully!"
}

# Update sandbox environment
if [ -f "secrets-sandbox.yaml" ]; then
    update_environment_secrets "sandbox" "secrets-sandbox.yaml"
else
    echo "⚠️ secrets-sandbox.yaml not found, skipping sandbox update"
fi

# Update production environment
if [ -f "secrets-production.yaml" ]; then
    update_environment_secrets "production" "secrets-production.yaml"
else
    echo "⚠️ secrets-production.yaml not found, skipping production update"
fi

echo "🎉 All secrets updated successfully!"