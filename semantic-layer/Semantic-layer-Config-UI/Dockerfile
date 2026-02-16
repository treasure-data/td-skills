FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci

# Copy source code
COPY src ./src
COPY public ./public
COPY tsconfig.json vite.config.ts index.html ./

# Build application
RUN npm run build

# Verify build
RUN test -d dist || (echo "Build failed - dist directory not created" && exit 1)

# Production stage
FROM node:18-alpine

# Install serve to run the application
RUN npm install -g serve

# Create app directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Add healthcheck script
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'curl -f http://localhost:3000/ || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Environment variables
ENV PORT=3000 \
    NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD /healthcheck.sh

# Start application
CMD ["serve", "-s", "dist", "-l", "3000"]

# Labels for metadata
LABEL maintainer="Treasure Data" \
      description="Semantic Layer Configuration Manager UI" \
      version="1.0.0"
