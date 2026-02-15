#!/bin/bash
# Schema Auto-Tagger - Project Setup Script
# Run this to initialize the schema tagger project structure

set -e

PROJECT_DIR="${1:-.}"
echo "Setting up Schema Auto-Tagger in: $PROJECT_DIR"

# Create directory structure
mkdir -p "$PROJECT_DIR/scripts"
mkdir -p "$PROJECT_DIR/rules"
mkdir -p "$PROJECT_DIR/workflows"
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/reports"

# Verify required files exist in current directory
required_files=(
    "schema_auto_tagger_implementation.py"
    "schema_tagger_td_api.py"
    "schema_tagger_rules.yaml"
    "auto_schema_tagger.dig"
)

echo "Checking for required files..."
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Copy files to appropriate locations
echo ""
echo "Installing files..."

cp schema_auto_tagger_implementation.py "$PROJECT_DIR/"
echo "✅ Core implementation installed"

cp schema_tagger_td_api.py "$PROJECT_DIR/"
echo "✅ TD API integration installed"

cp schema_tagger_rules.yaml "$PROJECT_DIR/rules/"
echo "✅ Tagging rules installed"

cp auto_schema_tagger.dig "$PROJECT_DIR/workflows/"
echo "✅ Workflow definition installed"

# Copy workflow scripts
if [ -d "workflow_scripts" ]; then
    cp workflow_scripts/*.py "$PROJECT_DIR/scripts/"
    echo "✅ Workflow scripts installed"
else
    echo "⚠️  Warning: workflow_scripts directory not found"
fi

# Create configuration template
cat > "$PROJECT_DIR/.env.example" << 'EOF'
# Treasure Data Configuration
export TD_API_KEY="your-api-key-here"
export TD_ENDPOINT="https://api.treasuredata.com"

# Database Configuration
export DATABASE="your_database_name"

# Slack Notifications (optional)
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Email Notifications (optional)
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"
export SMTP_FROM="noreply@company.com"
export SMTP_TO="admin@company.com"

# Tagging Configuration
export MIN_CONFIDENCE="HIGH"
export RULES_FILE="rules/schema_tagger_rules.yaml"
EOF
echo "✅ Created .env.example template"

# Create README for project
cat > "$PROJECT_DIR/README.md" << 'EOF'
# Schema Auto-Tagger for Treasure Data

Automatic schema tagging and resource classification for Treasure Data.

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Treasure Data credentials
source .env
```

### 2. Customize Rules

Edit `rules/schema_tagger_rules.yaml` to match your organization's tagging standards.

### 3. Test Locally

```bash
python schema_auto_tagger_implementation.py $DATABASE \
  --rules-file rules/schema_tagger_rules.yaml \
  --output-report reports/scan_report.txt
```

### 4. Deploy Workflow

```bash
tdx wf push workflows/auto_schema_tagger.dig
tdx wf run auto_schema_tagger
```

## Directory Structure

```
├── schema_auto_tagger_implementation.py  # Core engine
├── schema_tagger_td_api.py               # API integration
├── rules/
│   └── schema_tagger_rules.yaml         # Tagging rules
├── scripts/
│   ├── scan_schema.py
│   ├── generate_suggestions.py
│   ├── auto_approve_high_confidence.py
│   ├── apply_approved_tags.py
│   └── send_notification.py
├── workflows/
│   └── auto_schema_tagger.dig           # Scheduled workflow
├── logs/                                 # Workflow logs
├── reports/                              # Generated reports
└── .env                                  # Configuration
```

## Usage

### Manual Scan & Review

```bash
# Generate suggestions
python schema_auto_tagger_implementation.py my_database \
  --rules-file rules/schema_tagger_rules.yaml \
  --output-report reports/suggestions.txt

# Review report
cat reports/suggestions.txt
```

### Auto-Apply HIGH Confidence Tags

```bash
# Dry-run first
python schema_auto_tagger_implementation.py my_database \
  --rules-file rules/schema_tagger_rules.yaml \
  --approve-high --dry-run

# Apply for real
python schema_auto_tagger_implementation.py my_database \
  --rules-file rules/schema_tagger_rules.yaml \
  --approve-high
```

### Programmatic API

```python
from schema_tagger_td_api import TreasureDataTagAPI

api = TreasureDataTagAPI()
successful, failed, errors = api.bulk_apply_tags("database", tag_assignments)
```

## Workflow Management

```bash
# Deploy
tdx wf push workflows/auto_schema_tagger.dig

# Run manually
tdx wf run auto_schema_tagger

# Monitor
tdx wf sessions auto_schema_tagger -l 5

# Check logs
tdx wf attempt <attempt_id>
```

## Documentation

- `SCHEMA_TAGGER_COMPLETE_GUIDE.md` - Full documentation
- `SCHEMA_TAGGER_QUICK_REFERENCE.md` - Quick reference
- `SCHEMA_TAGGER_DELIVERY_SUMMARY.md` - What's included

## Support

For issues:
1. Check documentation files
2. Review workflow logs: `tdx wf attempt <attempt_id>`
3. Test components individually
4. Enable debug logging

---

For detailed information, see the documentation files.
EOF
echo "✅ Created README.md"

# Create validation script
cat > "$PROJECT_DIR/validate_setup.sh" << 'EOF'
#!/bin/bash
# Validate Schema Auto-Tagger setup

echo "Schema Auto-Tagger Setup Validation"
echo "===================================="
echo ""

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 installed: $(python3 --version)"
else
    echo "❌ Python 3 not found"
    exit 1
fi

# Check tdx CLI
if command -v tdx &> /dev/null; then
    echo "✅ tdx CLI installed: $(tdx --version)"
else
    echo "❌ tdx CLI not found"
    exit 1
fi

# Check files
echo ""
echo "Checking files..."
files=(
    "schema_auto_tagger_implementation.py"
    "schema_tagger_td_api.py"
    "rules/schema_tagger_rules.yaml"
    "workflows/auto_schema_tagger.dig"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file not found"
    fi
done

# Check Python dependencies
echo ""
echo "Checking Python dependencies..."
python3 -c "import requests" 2>/dev/null && echo "✅ requests" || echo "❌ requests"
python3 -c "import yaml" 2>/dev/null && echo "✅ PyYAML" || echo "❌ PyYAML"

# Check environment
echo ""
echo "Checking environment..."
if [ -z "$TD_API_KEY" ]; then
    echo "⚠️  TD_API_KEY not set (load .env with: source .env)"
else
    echo "✅ TD_API_KEY is set"
fi

if [ -z "$DATABASE" ]; then
    echo "⚠️  DATABASE not set"
else
    echo "✅ DATABASE is set to: $DATABASE"
fi

echo ""
echo "Validation complete!"
EOF
chmod +x "$PROJECT_DIR/validate_setup.sh"
echo "✅ Created validate_setup.sh"

# Create a test script
cat > "$PROJECT_DIR/test_local.sh" << 'EOF'
#!/bin/bash
# Test Schema Auto-Tagger locally

set -e

echo "Schema Auto-Tagger Local Test"
echo "============================="
echo ""

# Load environment
if [ -f ".env" ]; then
    source .env
else
    echo "❌ .env file not found. Run: cp .env.example .env"
    exit 1
fi

# Check API key
if [ -z "$TD_API_KEY" ]; then
    echo "❌ TD_API_KEY not set"
    exit 1
fi

# Check database
if [ -z "$DATABASE" ]; then
    echo "❌ DATABASE not set"
    exit 1
fi

echo "Database: $DATABASE"
echo ""

# Run test
echo "Running schema scan..."
python3 schema_auto_tagger_implementation.py "$DATABASE" \
    --rules-file rules/schema_tagger_rules.yaml \
    --output-report reports/test_report.txt \
    --output-json reports/test_suggestions.json

echo ""
echo "✅ Test complete!"
echo "Report: reports/test_report.txt"
echo "Suggestions: reports/test_suggestions.json"
EOF
chmod +x "$PROJECT_DIR/test_local.sh"
echo "✅ Created test_local.sh"

# Create GitHub Actions workflow (optional)
mkdir -p "$PROJECT_DIR/.github/workflows"
cat > "$PROJECT_DIR/.github/workflows/test.yml" << 'EOF'
name: Test Schema Auto-Tagger

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pyyaml requests

      - name: Validate Python syntax
        run: python -m py_compile schema_auto_tagger_implementation.py schema_tagger_td_api.py

      - name: Validate YAML rules
        run: python -c "import yaml; yaml.safe_load(open('rules/schema_tagger_rules.yaml'))"

      - name: Check file structure
        run: |
          ls -la schema_auto_tagger_implementation.py
          ls -la schema_tagger_td_api.py
          ls -la rules/schema_tagger_rules.yaml
EOF
echo "✅ Created GitHub Actions workflow"

# Summary
echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Configure: source .env"
echo "2. Customize: rules/schema_tagger_rules.yaml"
echo "3. Validate: ./validate_setup.sh"
echo "4. Test: ./test_local.sh"
echo "5. Deploy: tdx wf push workflows/auto_schema_tagger.dig"
echo ""
echo "Documentation:"
echo "- Complete Guide: SCHEMA_TAGGER_COMPLETE_GUIDE.md"
echo "- Quick Reference: SCHEMA_TAGGER_QUICK_REFERENCE.md"
echo "- Summary: SCHEMA_TAGGER_DELIVERY_SUMMARY.md"
echo ""
