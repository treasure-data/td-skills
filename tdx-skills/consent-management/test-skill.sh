#!/bin/bash
# Test script for consent-management skill
# Validates all required files and structure

set -e

echo "🧪 Testing Consent Management Skill"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
ERRORS=0

# Test 1: Check SKILL.md exists and is under 500 lines
echo "Test 1: SKILL.md validation"
if [ -f "$SKILL_DIR/SKILL.md" ]; then
    LINES=$(wc -l < "$SKILL_DIR/SKILL.md")
    if [ "$LINES" -le 500 ]; then
        echo -e "${GREEN}✓${NC} SKILL.md exists and is $LINES lines (under 500 limit)"
    else
        echo -e "${RED}✗${NC} SKILL.md has $LINES lines (exceeds 500 limit)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} SKILL.md not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 2: Check required examples exist
echo "Test 2: Example files validation"
EXAMPLES=(
    "examples/consent-parent-segment.yml"
    "examples/consent-segment-rules.yml"
    "examples/preference-center.html"
    "examples/dsar-export.sql"
)

for file in "${EXAMPLES[@]}"; do
    if [ -f "$SKILL_DIR/$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Test 3: Check required templates exist
echo "Test 3: Template files validation"
TEMPLATES=(
    "templates/consent-table-ddl.sql"
    "templates/consent-sync-workflow.dig"
)

for file in "${TEMPLATES[@]}"; do
    if [ -f "$SKILL_DIR/$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Test 4: Check required references exist
echo "Test 4: Reference files validation"
REFERENCES=(
    "references/consent-categories.md"
    "references/dsar-workflows.md"
    "references/sdk-integration.md"
    "references/audit-queries.md"
)

for file in "${REFERENCES[@]}"; do
    if [ -f "$SKILL_DIR/$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Test 5: Validate SKILL.md YAML frontmatter
echo "Test 5: SKILL.md frontmatter validation"
if head -n 5 "$SKILL_DIR/SKILL.md" | grep -q "^name: consent-management"; then
    echo -e "${GREEN}✓${NC} Skill name is correct"
else
    echo -e "${RED}✗${NC} Skill name missing or incorrect"
    ERRORS=$((ERRORS + 1))
fi

if head -n 5 "$SKILL_DIR/SKILL.md" | grep -q "^description:"; then
    echo -e "${GREEN}✓${NC} Description exists"
else
    echo -e "${RED}✗${NC} Description missing"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 6: Check for TD-specific patterns
echo "Test 6: TD-specific patterns validation"
if grep -q "td_interval" "$SKILL_DIR/SKILL.md"; then
    echo -e "${GREEN}✓${NC} Uses td_interval() function"
else
    echo -e "${YELLOW}⚠${NC}  Missing td_interval() pattern"
fi

if grep -q "parent_segment" "$SKILL_DIR/SKILL.md"; then
    echo -e "${GREEN}✓${NC} References parent segments"
else
    echo -e "${YELLOW}⚠${NC}  Missing parent segment pattern"
fi

if grep -q "Treasure" "$SKILL_DIR/SKILL.md"; then
    echo -e "${GREEN}✓${NC} References TD SDK"
else
    echo -e "${YELLOW}⚠${NC}  Missing TD SDK reference"
fi
echo ""

# Test 7: Validate SQL examples
echo "Test 7: SQL syntax validation"
SQL_FILES=(
    "examples/dsar-export.sql"
    "templates/consent-table-ddl.sql"
)

for file in "${SQL_FILES[@]}"; do
    if grep -q "SELECT\|CREATE\|INSERT\|UPDATE\|DELETE" "$SKILL_DIR/$file"; then
        echo -e "${GREEN}✓${NC} $file contains SQL"
    else
        echo -e "${RED}✗${NC} $file missing SQL statements"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Test 8: Check marketplace registration
echo "Test 8: Marketplace registration"
MARKETPLACE_FILE="$SKILL_DIR/../../.claude-plugin/marketplace.json"
if [ -f "$MARKETPLACE_FILE" ]; then
    if grep -q "consent-management" "$MARKETPLACE_FILE"; then
        echo -e "${GREEN}✓${NC} Skill registered in marketplace.json"
    else
        echo -e "${RED}✗${NC} Skill not registered in marketplace.json"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} marketplace.json not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "===================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Skill is ready for testing with Claude Code."
    echo ""
    echo "To test, use these prompts:"
    echo "  • Use the consent-management skill to create consent tracking tables"
    echo "  • Use the consent skill to build a preference center"
    echo "  • Use the consent skill to create privacy-compliant email segments"
    exit 0
else
    echo -e "${RED}❌ $ERRORS test(s) failed${NC}"
    exit 1
fi
