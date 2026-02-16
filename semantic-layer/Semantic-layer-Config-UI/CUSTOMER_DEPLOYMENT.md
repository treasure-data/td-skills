# Customer Deployment Guide

Welcome! This guide will help you deploy the Semantic Layer Configuration Manager for your environment.

## 📋 Prerequisites

- **Docker & Docker Compose** (for container-based deployment)
- **Node.js 16+** (for npm package deployment)
- **Treasure Data API Key** (for authentication)
- **Basic command line knowledge**

---

## 🚀 Deployment Options

### **Option 1: Quick Start (Docker - Recommended)**

Fastest way to get started. Perfect for testing and development.

#### Step 1: Clone or download the repository

```bash
git clone https://github.com/treasuredata/semantic-layer-ui.git
cd semantic-layer-ui
```

#### Step 2: Set up environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your details
# Add your Treasure Data API key
nano .env
```

**Example .env:**
```env
TD_API_KEY=your_treasure_data_api_key
TD_ENDPOINT=https://api.treasuredata.com
CUSTOMER_ID=your_company_name
ENVIRONMENT=production
```

#### Step 3: Run deployment script

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- ✓ Check for Docker installation
- ✓ Pull the latest image
- ✓ Start containers
- ✓ Verify deployment

#### Step 4: Access the application

Open your browser and navigate to:
```
http://localhost:3000
```

---

### **Option 2: Docker Compose (Production)**

For production deployments with better control and scalability.

#### Step 1: Create docker-compose.yml

The repo includes a `docker-compose.yml` file. No changes needed if using default settings.

#### Step 2: Create .env file

```bash
cat > .env << 'EOF'
# Treasure Data
TD_API_KEY=your_api_key
TD_ENDPOINT=https://api.treasuredata.com

# Application
ENVIRONMENT=production
ENABLE_DEV_MODE=false
CUSTOMER_ID=your_customer_id
PORT=3000
EOF
```

#### Step 3: Start services

```bash
docker-compose up -d
```

#### Step 4: View logs

```bash
docker-compose logs -f semantic-layer-ui
```

#### Step 5: Stop services

```bash
docker-compose down
```

---

### **Option 3: Kubernetes Deployment**

For enterprise deployments requiring high availability and auto-scaling.

#### Step 1: Create namespace

```bash
kubectl create namespace semantic-layer
```

#### Step 2: Create ConfigMap with environment

```bash
kubectl create configmap semantic-layer-config \
  --from-literal=VITE_API_BASE_URL=https://api.treasuredata.com \
  --from-literal=ENVIRONMENT=production \
  -n semantic-layer
```

#### Step 3: Create Secret with API key

```bash
kubectl create secret generic semantic-layer-secrets \
  --from-literal=TD_API_KEY=$(cat .env | grep TD_API_KEY | cut -d= -f2) \
  -n semantic-layer
```

#### Step 4: Apply deployment

```bash
kubectl apply -f kubernetes/deployment.yaml -n semantic-layer
```

#### Step 5: Expose service

```bash
kubectl expose deployment semantic-layer-ui \
  --type=LoadBalancer \
  --port=80 \
  --target-port=3000 \
  -n semantic-layer
```

#### Step 6: Get access URL

```bash
kubectl get service -n semantic-layer
```

---

### **Option 4: NPM Package (Developer Integration)**

For developers who want to embed this in their own React application.

#### Step 1: Install package

```bash
npm install @treasuredata/semantic-layer-ui
```

#### Step 2: Import in your app

```tsx
import { ConfigProvider, SemanticLayerConfigManager } from '@treasuredata/semantic-layer-ui';
import '@treasuredata/semantic-layer-ui/styles';

function MyApp() {
  return (
    <ConfigProvider
      initialConfig={initialConfig}
      onSave={async (config) => {
        // Your save logic here
        await fetch('/api/save-config', {
          method: 'POST',
          body: JSON.stringify(config),
        });
      }}
    >
      <SemanticLayerConfigManager />
    </ConfigProvider>
  );
}

export default MyApp;
```

---

### **Option 5: Vercel / Netlify (Serverless)**

For simple, serverless deployments with automatic scaling.

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_TD_API_KEY
vercel env add VITE_API_BASE_URL
```

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables via Netlify Dashboard
# Build settings > Environment > Set variables
```

---

## 📊 Deployment Comparison

| Method | Setup Time | Scalability | Cost | Best For |
|--------|-----------|-----------|------|----------|
| **Docker** | 5 min | Manual | Low | Single instance, development |
| **Docker Compose** | 10 min | Limited | Low | Small team, staging |
| **Kubernetes** | 30 min | Excellent | Medium | Enterprise, production |
| **NPM Package** | 15 min | Your app | N/A | Developer integration |
| **Vercel/Netlify** | 5 min | Automatic | Low-Medium | SaaS, quick deployment |

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Generate strong API key in Treasure Data console
- [ ] Store API key in secrets management system (not in git)
- [ ] Enable HTTPS/SSL for all connections
- [ ] Set up firewall rules to restrict access
- [ ] Enable authentication (OAuth2/OIDC if available)
- [ ] Configure CORS properly for API endpoints
- [ ] Enable audit logging
- [ ] Set up monitoring and alerting
- [ ] Regular security updates for dependencies
- [ ] Backup configuration regularly

---

## 📞 Troubleshooting

### **"Failed to pull image"**

```bash
# Make sure you're logged into Docker
docker login

# Try pulling with full URL
docker pull docker.io/treasuredata/semantic-layer-ui:latest
```

### **"Port 3000 already in use"**

```bash
# Use different port
docker run -p 3001:3000 treasuredata/semantic-layer-ui:latest

# Or kill existing process
lsof -i :3000
kill -9 <PID>
```

### **"Connection refused" to Treasure Data API**

Check your environment variables:
```bash
docker exec semantic-layer-ui env | grep -i td_
```

### **"Health check failing"**

Check logs:
```bash
docker logs semantic-layer-ui

# Or for Docker Compose
docker-compose logs semantic-layer-ui
```

### **"Cannot find Node.js/npm"**

Install from: https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

---

## 🔄 Updating

### **Docker**

```bash
# Pull latest image
docker pull treasuredata/semantic-layer-ui:latest

# Stop old container
docker stop semantic-layer-ui

# Remove old container
docker rm semantic-layer-ui

# Start new container
docker run -d -p 3000:3000 treasuredata/semantic-layer-ui:latest
```

### **Docker Compose**

```bash
# Update image and restart
docker-compose pull
docker-compose up -d
```

### **NPM Package**

```bash
npm update @treasuredata/semantic-layer-ui
```

---

## 📈 Performance Tuning

### **Docker Resource Limits**

```bash
docker run -d \
  -p 3000:3000 \
  --memory="512m" \
  --cpus="1.0" \
  treasuredata/semantic-layer-ui:latest
```

### **Enable Caching**

Set these headers in your reverse proxy (nginx/CloudFlare):

```nginx
# Static assets - cache for 1 year
location ~* \.(js|css|png|jpg|gif|svg)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}

# HTML - don't cache
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### **Enable Gzip Compression**

In nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;
```

---

## 📊 Monitoring

### **Docker Health Status**

```bash
docker ps --filter "name=semantic-layer-ui"

# View health status
docker inspect --format='{{json .State.Health}}' semantic-layer-ui
```

### **View Logs**

```bash
# Last 100 lines
docker logs --tail 100 semantic-layer-ui

# Follow logs in real-time
docker logs -f semantic-layer-ui

# With timestamps
docker logs -f -t semantic-layer-ui

# Since specific time
docker logs --since 2024-01-15T10:30:00 semantic-layer-ui
```

### **Resource Usage**

```bash
docker stats semantic-layer-ui
```

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs first** - Most issues are in the logs
2. **Review troubleshooting section** above
3. **Check prerequisites** - Node.js version, Docker installation
4. **Verify environment** - Correct API keys, URLs, network access
5. **Contact support** - Email: support@treasuredata.com

---

## 📚 Additional Resources

- **Documentation**: [docs.treasuredata.com](https://docs.treasuredata.com)
- **API Reference**: [api.treasuredata.com](https://api.treasuredata.com)
- **GitHub Issues**: [github.com/treasuredata/semantic-layer-ui/issues](https://github.com/treasuredata/semantic-layer-ui/issues)
- **Community**: [community.treasuredata.com](https://community.treasuredata.com)

---

## ✅ Quick Reference

### **Check If Running**
```bash
curl http://localhost:3000
```

### **View Configuration**
```bash
cat .env
```

### **Restart Service**
```bash
docker-compose restart semantic-layer-ui
```

### **See Resource Usage**
```bash
docker stats
```

### **Stop Everything**
```bash
docker-compose down
```

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Support:** support@treasuredata.com
