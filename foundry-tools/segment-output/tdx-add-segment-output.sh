#!/bin/bash
#
# tdx-add-segment-output.sh
#
# Add :segment: output to a Foundry agent
#
# Usage:
#   ./tdx-add-segment-output.sh "My Project" "my-agent"
#

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

# Check arguments
if [[ -z "$1" ]] || [[ -z "$2" ]]; then
    error "Missing required arguments"
    echo ""
    echo "Usage: $0 <project-name> <agent-name>"
    echo ""
    echo "Example:"
    echo "  $0 \"My Audience Project\" \"audience-agent\""
    echo ""
    exit 1
fi

PROJECT="$1"
AGENT="$2"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/segment_output.schema.json"

# Check if schema file exists
if [[ ! -f "$SCHEMA_FILE" ]]; then
    error "Schema file not found: $SCHEMA_FILE"
    exit 1
fi

# Check if required commands are available
for cmd in tdx yq jq; do
    if ! command -v $cmd &> /dev/null; then
        error "$cmd command not found. Please install it first."
        if [[ "$cmd" == "yq" ]] || [[ "$cmd" == "jq" ]]; then
            info "Install with: brew install $cmd"
        fi
        exit 1
    fi
done

# Check tdx authentication
info "Checking tdx authentication..."
if ! tdx auth status &> /dev/null; then
    error "Not authenticated with tdx. Please run: tdx auth login"
    exit 1
fi

# Pull agent configuration
info "Pulling agent configuration from '$PROJECT'..."
if ! tdx agent pull "$PROJECT" -y; then
    error "Failed to pull agent configuration"
    exit 1
fi

# Determine agent directory path
AGENT_DIR="agents/$PROJECT/$AGENT"
AGENT_YML="$AGENT_DIR/agent.yml"

# Check if agent.yml exists
if [[ ! -f "$AGENT_YML" ]]; then
    error "Agent configuration not found: $AGENT_YML"
    info "Available agents:"
    ls -1 "agents/$PROJECT/" 2>/dev/null || echo "  (none)"
    exit 1
fi

# Check if :segment: output already exists
if grep -q "name: ':segment:'" "$AGENT_YML" 2>/dev/null; then
    warn ":segment: output already exists in $AGENT"
    read -p "Do you want to overwrite it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Operation cancelled"
        exit 0
    fi
    # Remove existing :segment: output
    yq eval 'del(.outputs[] | select(.name == ":segment:"))' -i "$AGENT_YML"
fi

# Read schema file and convert to compact JSON string
export SCHEMA_JSON=$(jq -c . "$SCHEMA_FILE")

# Add :segment: output to agent.yml
info "Adding :segment: output to $AGENT..."

# Create the output definition using environment variable
yq eval '.outputs += [{
  "name": ":segment:",
  "function_name": "create_segment_draft",
  "function_description": "Generate a segment rule draft that users can review and save in the segment editor. This function creates the segment rule JSON data but does not create the final segment. Users must open the segment editor link and save to create the actual segment. ## Existing Segment Referencing - **baseSegmentIds**: Reference existing segments using their IDs - **Logic**: ALL (AND), ANY (OR), or EXCLUDE (NOT) to combine base segments - Create derivative segments by adding conditions to existing ones ## Schema Guide - **Attribute conditions**: Use column names as left_value - **Behavioral conditions**: Use behaviorCondition object for aggregated analysis - **Logic**: \"ALL\" for AND, \"ANY\" for OR between conditions - **Nested groups**: Create condition groups with logic and conditions for mixed expressions - **Time filtering**: \"TIME WITHIN PAST\" operator with value/unit objects",
  "json_schema": strenv(SCHEMA_JSON)
}]' -i "$AGENT_YML"

success ":segment: output added to $AGENT_YML"

# Push updated configuration
info "Pushing updated configuration to Foundry..."
if ! tdx agent push "agents/$PROJECT/" -y; then
    error "Failed to push agent configuration"
    exit 1
fi

success "Successfully added :segment: output to $AGENT"

echo ""
info "Next steps:"
echo "  1. Open Treasure Studio or Foundry Console"
echo "  2. Navigate to project: $PROJECT"
echo "  3. Open agent: $AGENT"
echo "  4. Verify the :segment: output in the Outputs tab"
echo "  5. Test by asking the agent to create a segment"
echo ""
