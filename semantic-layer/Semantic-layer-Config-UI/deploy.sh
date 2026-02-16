#!/bin/bash
# deploy.sh - Simple deployment script for customers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Semantic Layer UI Deployment ===${NC}\n"

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
else
    PLATFORM="windows"
fi

echo -e "${YELLOW}Detected Platform: $PLATFORM${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "  Please install Docker from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

if ! command_exists docker-compose; then
    echo -e "${RED}✗ Docker Compose not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}\n"

# 2. Environment setup
echo -e "${YELLOW}Step 2: Setting up environment...${NC}"

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Treasure Data Configuration
TD_API_KEY=your_api_key_here
TD_ENDPOINT=https://api.treasuredata.com

# Application Configuration
API_BASE_URL=http://localhost:3000/api
ENVIRONMENT=development
ENABLE_DEV_MODE=false

# Multi-tenancy (optional)
CUSTOMER_ID=default
EOF
    echo -e "${YELLOW}⚠ Created .env file - please update with your credentials${NC}"
    echo "  Edit .env and add your TD_API_KEY"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi
echo ""

# 3. Check Docker credentials
echo -e "${YELLOW}Step 3: Checking Docker credentials...${NC}"

if docker login 2>/dev/null; then
    echo -e "${GREEN}✓ Docker login successful${NC}"
else
    echo -e "${YELLOW}⚠ Skipping Docker login${NC}"
fi
echo ""

# 4. Pull image
echo -e "${YELLOW}Step 4: Pulling Docker image...${NC}"

IMAGE_VERSION=${1:-latest}
IMAGE="treasuredata/semantic-layer-ui:${IMAGE_VERSION}"

echo "Pulling $IMAGE..."
docker pull "$IMAGE" || {
    echo -e "${RED}✗ Failed to pull image${NC}"
    exit 1
}
echo -e "${GREEN}✓ Image pulled successfully${NC}\n"

# 5. Start containers
echo -e "${YELLOW}Step 5: Starting containers...${NC}"

if [ -f docker-compose.yml ]; then
    docker-compose up -d
    echo -e "${GREEN}✓ Containers started with Docker Compose${NC}"
else
    docker run -d \
        -p 3000:3000 \
        --name semantic-layer-ui \
        --env-file .env \
        "$IMAGE"
    echo -e "${GREEN}✓ Container started${NC}"
fi
echo ""

# 6. Verify deployment
echo -e "${YELLOW}Step 6: Verifying deployment...${NC}"

sleep 3

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Application is running${NC}"
    echo ""
    echo -e "${GREEN}=== Deployment Complete ===${NC}"
    echo ""
    echo -e "🚀 ${GREEN}Access the application at: ${YELLOW}http://localhost:3000${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Open http://localhost:3000 in your browser"
    echo "  2. Login with your Treasure Data credentials"
    echo "  3. Start configuring your semantic layer"
    echo ""
    echo "To view logs:"
    echo "  docker logs -f semantic-layer-ui"
    echo ""
    echo "To stop:"
    echo "  docker-compose down  # (if using docker-compose)"
    echo "  docker stop semantic-layer-ui  # (if using docker run)"
else
    echo -e "${RED}✗ Application failed to start${NC}"
    echo "Checking logs..."
    docker logs semantic-layer-ui
    exit 1
fi
