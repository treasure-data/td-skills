# Deployment Guide - Semantic Layer UI

## Overview

There are multiple ways to deploy the Semantic Layer Config Manager for customers. Choose based on your distribution model and customer needs.

---

## 🎯 Deployment Options

### **Option 1: NPM Package (Component Library)**
**Best for:** Customers who want to embed this in their own React applications

#### Setup

**1. Create `package.json` configuration:**
```json
{
  "name": "@treasuredata/semantic-layer-ui",
  "version": "1.0.0",
  "description": "Semantic Layer configuration manager UI component",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md"
  ],
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles/base.css"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.2",
    "vite": "^5.0",
    "@vitejs/plugin-react": "^4.2"
  },
  "scripts": {
    "build": "tsc && vite build",
    "type-check": "tsc --noEmit"
  }
}
```

**2. Build for distribution:**
```bash
npm run build
```

**3. Publish to NPM Registry:**
```bash
npm login
npm publish
```

**4. Customer installation:**
```bash
npm install @treasuredata/semantic-layer-ui
```

**5. Customer usage:**
```tsx
import { ConfigProvider, SemanticLayerConfigManager } from '@treasuredata/semantic-layer-ui';
import '@treasuredata/semantic-layer-ui/styles';

function App() {
  return (
    <ConfigProvider
      initialConfig={config}
      onSave={async (config) => {
        await api.post('/semantic-layer/config', config);
      }}
    >
      <SemanticLayerConfigManager />
    </ConfigProvider>
  );
}
```

---

### **Option 2: Docker Container (Standalone Web App)**
**Best for:** Customers who want a turn-key web application they can run anywhere

#### Setup

**1. Create Dockerfile:**
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY src ./src
COPY tsconfig.json vite.config.ts ./
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT=3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

**2. Create `.dockerignore`:**
```
node_modules
dist
.git
.github
.gitignore
README.md
*.md
.env.example
```

**3. Build Docker image:**
```bash
docker build -t treasuredata/semantic-layer-ui:1.0.0 .
```

**4. Push to Docker Hub/Registry:**
```bash
docker login
docker push treasuredata/semantic-layer-ui:1.0.0
```

**5. Customer deployment (Docker):**
```bash
docker run -d \
  -p 3000:3000 \
  -e API_BASE_URL=https://api.treasuredata.com \
  -e TD_API_KEY=your_api_key \
  treasuredata/semantic-layer-ui:1.0.0
```

**6. Customer deployment (Docker Compose):**
```yaml
version: '3.8'
services:
  semantic-layer-ui:
    image: treasuredata/semantic-layer-ui:1.0.0
    ports:
      - "3000:3000"
    environment:
      API_BASE_URL: https://api.treasuredata.com
      TD_API_KEY: ${TD_API_KEY}
      ENABLE_DEV_MODE: false
    volumes:
      - ./config.yaml:/app/config.yaml
```

---

### **Option 3: SaaS - Hosted Cloud Application**
**Best for:** Customers who want zero setup - just a URL

#### Architecture

```
┌─────────────────────────────────────────┐
│   Customer Browser                      │
│   https://semantic-layer.treasuredata.com│
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Cloudflare/CDN                        │
│   (Caching & DDoS Protection)           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   Kubernetes Cluster (AWS/GCP/Azure)    │
│   - React Frontend (Vite SPA)           │
│   - API Gateway                         │
│   - Auth Service (OAuth2/OIDC)          │
│   - Config Storage                      │
└─────────────────────────────────────────┘
```

#### Deployment Steps

**1. Create `deploy.yaml` (Kubernetes):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: semantic-layer-ui
spec:
  replicas: 3
  selector:
    matchLabels:
      app: semantic-layer-ui
  template:
    metadata:
      labels:
        app: semantic-layer-ui
    spec:
      containers:
      - name: semantic-layer-ui
        image: treasuredata/semantic-layer-ui:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: API_BASE_URL
          value: "https://api.treasuredata.com"
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: semantic-layer-ui-service
spec:
  selector:
    app: semantic-layer-ui
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

**2. Deploy to Kubernetes:**
```bash
kubectl apply -f deploy.yaml
```

**3. Customer access:**
```
https://semantic-layer.treasuredata.com/customer/{customer_id}
```

---

### **Option 4: GitHub Pages (Static Site)**
**Best for:** Documentation, demos, or customers who want a simple hosted version

#### Setup

**1. Configure for GitHub Pages in `vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/semantic-layer-ui/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
```

**2. Create GitHub Actions workflow (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**3. Push to GitHub:**
```bash
git add .
git commit -m "Add CI/CD deployment"
git push origin main
```

**4. Access at:**
```
https://treasuredata.github.io/semantic-layer-ui/
```

---

### **Option 5: Vercel / Netlify (Serverless)**
**Best for:** Quick deployment, automatic scaling, global CDN

#### Vercel Deployment

**1. Create `vercel.json`:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_BASE_URL": "@api_base_url"
  }
}
```

**2. Connect GitHub repository to Vercel:**
```bash
# Via CLI
npm i -g vercel
vercel
```

**3. Set environment variables in Vercel Dashboard:**
- `VITE_API_BASE_URL`: https://api.treasuredata.com
- `VITE_API_KEY`: customer's TD API key

**4. Automatic deployment on push:**
```bash
git push origin main
# Vercel automatically builds and deploys
```

#### Netlify Deployment

**1. Create `netlify.toml`:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_API_BASE_URL = "https://api.treasuredata.com"
```

**2. Deploy:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## 🔐 Environment Configuration

Create `.env.example` for customers:

```env
# API Configuration
VITE_API_BASE_URL=https://api.treasuredata.com
VITE_API_TIMEOUT=30000

# Treasure Data Authentication
VITE_TD_API_KEY=your_api_key_here
VITE_TD_ENDPOINT=https://api.treasuredata.com

# Feature Flags
VITE_ENABLE_DEV_MODE=false
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_MULTI_ENV=true

# Multi-tenancy
VITE_CUSTOMER_ID=customer_123
VITE_ENVIRONMENT=production
```

---

## 📦 Build & Release Process

### **1. Version Management**

```bash
# Update version in package.json
npm version major|minor|patch

# Creates git tag automatically
# Example: v1.0.0 → v1.1.0
```

### **2. Create Release**

```bash
# Create GitHub Release
gh release create v1.1.0 \
  --title "Semantic Layer UI v1.1.0" \
  --notes "Added multi-environment support and improved validation"
```

### **3. Build Artifacts**

```bash
# Clean build
rm -rf dist
npm run build

# Create tarball
tar -czf semantic-layer-ui-1.1.0.tar.gz dist/
```

### **4. Release Checklist**

- [ ] Update CHANGELOG.md
- [ ] Run tests: `npm test`
- [ ] Build: `npm run build`
- [ ] Type check: `npm run type-check`
- [ ] Lint: `npm run lint`
- [ ] Create GitHub release
- [ ] Publish to NPM: `npm publish`
- [ ] Build Docker image
- [ ] Push to registry: `docker push treasuredata/semantic-layer-ui:1.1.0`
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Notify customers

---

## 🚀 Multi-Customer Deployment Strategy

### **Approach 1: Multi-Tenant SaaS**

Each customer gets same app, different data:

```typescript
// Get customer context from URL or auth
const customerId = useParams().customerId;

// ConfigProvider loads customer's config
<ConfigProvider
  initialConfig={await fetchConfig(customerId)}
  onSave={async (config) => {
    await saveConfig(customerId, config);
  }}
>
  <SemanticLayerConfigManager />
</ConfigProvider>
```

### **Approach 2: Per-Customer Docker Containers**

Each customer gets isolated container:

```bash
# Deploy for customer A
docker run -d \
  --name=semantic-layer-customer-a \
  -e CUSTOMER_ID=customer_a \
  -e TD_API_KEY=${CUSTOMER_A_API_KEY} \
  -p 3001:3000 \
  treasuredata/semantic-layer-ui:1.0.0

# Deploy for customer B
docker run -d \
  --name=semantic-layer-customer-b \
  -e CUSTOMER_ID=customer_b \
  -e TD_API_KEY=${CUSTOMER_B_API_KEY} \
  -p 3002:3000 \
  treasuredata/semantic-layer-ui:1.0.0
```

### **Approach 3: NPM Package Integration**

Customers embed in their own applications:

```bash
npm install @treasuredata/semantic-layer-ui
```

---

## 📋 Deployment Comparison Matrix

| Method | Setup Time | Scalability | Cost | Maintenance | Multi-tenant |
|--------|-----------|------------|------|-------------|-------------|
| **NPM Package** | 15 min | Customer handles | Free | Low | ✅ |
| **Docker** | 30 min | Manual | $50-200/mo | Medium | ✅ |
| **Kubernetes** | 1-2 hrs | Excellent | $200-500+/mo | High | ✅ |
| **SaaS (Vercel)** | 15 min | Automatic | $20-100/mo | Low | ✅ |
| **GitHub Pages** | 10 min | Limited | Free | Very Low | ❌ |

---

## 🔄 CI/CD Pipeline

### **GitHub Actions Workflow**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  docker-build:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: |
            treasuredata/semantic-layer-ui:latest
            treasuredata/semantic-layer-ui:${{ github.sha }}

  deploy-staging:
    needs: docker-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/semantic-layer-ui \
            semantic-layer-ui=treasuredata/semantic-layer-ui:${{ github.sha }} \
            -n staging
```

---

## 📊 Recommended Deployment Architecture

**For Production at Scale:**

```
┌──────────────────────────────────────────────────────────┐
│                    CDN (Cloudflare)                      │
│              (Static assets + caching)                   │
└────────┬─────────────────────────────────────────────────┘
         │
    ┌────▼────┐
    │ Vercel / │  ← SPA Frontend (React + Vite)
    │ Netlify  │     - Auto-scaling
    └────┬────┘     - Global CDN
         │          - Git-integrated CI/CD
         │
    ┌────▼───────────────────────────┐
    │  API Gateway / Load Balancer    │
    │  (AWS API Gateway / Nginx)      │
    └────┬───────────────────────────┘
         │
    ┌────▼──────────────────────┐
    │  Kubernetes Cluster        │
    │  - Auth Service            │
    │  - API Service             │
    │  - Config Service          │
    │  - Database                │
    └───────────────────────────┘
```

---

## 🎯 Quick Start Deployment Commands

### **Development:**
```bash
npm run dev
```

### **Production Build:**
```bash
npm run build
npm run preview
```

### **Docker:**
```bash
docker build -t semantic-layer-ui:latest .
docker run -p 3000:3000 semantic-layer-ui:latest
```

### **NPM Publish:**
```bash
npm version patch
npm publish
```

### **Deploy to Vercel:**
```bash
vercel --prod
```

---

## 📞 Customer Implementation Guide

Provide customers with this simple guide:

### **For SaaS Users:**
1. Visit: `https://semantic-layer.treasuredata.com`
2. Login with your Treasure Data account
3. Start configuring your semantic layer

### **For Docker/On-Premise:**
```bash
docker run -d -p 3000:3000 \
  -e TD_API_KEY=your_key \
  treasuredata/semantic-layer-ui:latest
# Visit http://localhost:3000
```

### **For NPM Package Users:**
```bash
npm install @treasuredata/semantic-layer-ui
# Follow integration docs in npm package README
```

---

## ✅ Deployment Checklist

- [ ] Choose deployment method
- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Create customer documentation
- [ ] Test in staging environment
- [ ] Load testing and performance validation
- [ ] Security audit (OWASP compliance)
- [ ] Set up backups and disaster recovery
- [ ] Create runbooks for common issues
- [ ] Train support team
- [ ] Announce to customers

