# Kubernetes Deployment for RoastMe

This directory contains all the Kubernetes manifests and deployment scripts for the RoastMe application.

## Environment Setup

The application supports two environments:
- **Sandbox**: `sandbox.roastme.tocld.com` - For testing and development
- **Production**: `roastme.tocld.com` - For live users

## Files Overview

### Secrets
- `secrets-sandbox.yaml` - Environment variables and secrets for sandbox
- `secrets-production.yaml` - Environment variables and secrets for production

### Deployments
- `deployment-sandbox.yaml` - Sandbox deployment configuration
- `deployment.yaml` - Production deployment configuration (legacy name)

### Ingress
- `ingress-sandbox.yaml` - Sandbox ingress configuration with TLS
- `ingress.yaml` - Production ingress configuration with TLS

### Scripts
- `deploy-sandbox.sh` - Deploy to sandbox environment
- `deploy-production.sh` - Deploy to production environment
- `update-secrets.sh` - Update secrets in both environments

## Quick Start

### Deploy to Sandbox
```bash
cd k8s
./deploy-sandbox.sh
```

### Deploy to Production
```bash
cd k8s
./deploy-production.sh
```

### Update Secrets Only
```bash
cd k8s
./update-secrets.sh
```

## Manual Deployment

### 1. Create Namespaces
```bash
kubectl create namespace sandbox
kubectl create namespace production
```

### 2. Apply Secrets
```bash
# Sandbox
kubectl apply -f secrets-sandbox.yaml

# Production
kubectl apply -f secrets-production.yaml
```

### 3. Apply Deployments
```bash
# Sandbox
kubectl apply -f deployment-sandbox.yaml

# Production
kubectl apply -f deployment.yaml
```

### 4. Apply Ingress
```bash
# Sandbox
kubectl apply -f ingress-sandbox.yaml

# Production
kubectl apply -f ingress.yaml
```

## Environment Variables

The secrets contain the following environment variables:

### Supabase Configuration
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### AI Configuration
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `OPENAI_API_KEY`
- `AI_GATEWAY_API_KEY`

### App Configuration
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_URL_DEV`
- `NEXT_PUBLIC_API_URL`

### Polar Payment Configuration
- `POLAR_ACCESS_TOKEN` / `POLAR_SANDBOX_ACCESS_TOKEN`
- `POLAR_SERVER` (sandbox/production)
- `POLAR_WEBHOOK_SECRET` / `POLAR_SANDBOX_WEBHOOK_SECRET`

### Polar Product IDs
- `POLAR_SANDBOX_PRODUCT_ID_20_CREDITS`
- `POLAR_SANDBOX_PRODUCT_ID_50_CREDITS`
- `POLAR_SANDBOX_PRODUCT_ID_250_CREDITS`
- `POLAR_PRODUCTION_PRODUCT_ID_20_CREDITS`
- `POLAR_PRODUCTION_PRODUCT_ID_50_CREDITS`
- `POLAR_PRODUCTION_PRODUCT_ID_250_CREDITS`

## Monitoring

### Check Pod Status
```bash
# Sandbox
kubectl get pods -n sandbox -l app=roastme-web

# Production
kubectl get pods -n production -l app=roastme-web
```

### Check Service Status
```bash
# Sandbox
kubectl get service -n sandbox -l app=roastme-web

# Production
kubectl get service -n production -l app=roastme-web
```

### Check Ingress Status
```bash
# Sandbox
kubectl get ingress -n sandbox

# Production
kubectl get ingress -n production
```

### View Logs
```bash
# Sandbox
kubectl logs -n sandbox -l app=roastme-web -f

# Production
kubectl logs -n production -l app=roastme-web -f
```

## Scaling

### Scale Sandbox
```bash
kubectl scale deployment roastme-web --replicas=2 -n sandbox
```

### Scale Production
```bash
kubectl scale deployment roastme-web --replicas=3 -n production
```

## Troubleshooting

### Restart Deployment
```bash
# Sandbox
kubectl rollout restart deployment/roastme-web -n sandbox

# Production
kubectl rollout restart deployment/roastme-web -n production
```

### Check Deployment Status
```bash
# Sandbox
kubectl rollout status deployment/roastme-web -n sandbox

# Production
kubectl rollout status deployment/roastme-web -n production
```

### Delete and Redeploy
```bash
# Sandbox
kubectl delete -f deployment-sandbox.yaml
kubectl apply -f deployment-sandbox.yaml

# Production
kubectl delete -f deployment.yaml
kubectl apply -f deployment.yaml
```

## Security Notes

⚠️ **Important**: The secrets files contain sensitive information including:
- Database credentials
- API keys
- Webhook secrets
- Access tokens

**Never commit these files to version control.** They should be:
1. Stored securely
2. Applied directly to the cluster
3. Updated through secure channels only

## TLS/SSL

Both environments are configured with automatic TLS certificate management using cert-manager and Let's Encrypt:
- Sandbox: `sandbox.roastme.tocld.com`
- Production: `roastme.tocld.com`

Certificates are automatically provisioned and renewed.

## Health Checks

Both deployments include:
- **Liveness Probe**: `/api/health` endpoint
- **Readiness Probe**: `/api/health` endpoint

These ensure pods are healthy and ready to receive traffic.