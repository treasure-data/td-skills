# Schema Auto-Tagger - Complete Implementation Guide

## Overview
This implementation provides a complete end-to-end solution for automated schema tagging in Treasure Data, including:

1. **Python Implementation Script** - Core tagging engine
2. **Tagging Rules Configuration** - Customizable detection patterns
3. **Treasure Data API Integration** - Programmatic tag application
4. **Scheduled Workflow** - Automated execution via digdag
5. **Supporting Scripts** - Individual workflow tasks

## Quick Start

### 1. Prerequisites

```bash
# Python packages
pip install pytd tdx pyyaml requests slack-sdk

# Treasure Data CLI
# (Already installed if you have tdx CLI)

# API Key setup
export TD_API_KEY="your-treasure-data-api-key"
```

### 2. Installation

```bash
# Copy files to your project
mkdir -p ~/td-projects/schema-tagger
mkdir -p ~/td-projects/schema-tagger/scripts
mkdir -p ~/td-projects/schema-tagger/rules
mkdir -p ~/td-projects/schema-tagger/workflows

# Copy implementation files
cp schema_auto_tagger_implementation.py ~/td-projects/schema-tagger/
cp schema_tagger_td_api.py ~/td-projects/schema-tagger/
cp schema_tagger_rules.yaml ~/td-projects/schema-tagger/rules/

# Copy workflow files
cp auto_schema_tagger.dig ~/td-projects/schema-tagger/workflows/
cp workflow_scripts/*.py ~/td-projects/schema-tagger/scripts/
```

### 3. Configure Your Database

Edit the workflow and scripts to use your database:

```yaml
# In auto_schema_tagger.dig
database: my_database

# In workflow_scripts/scan_schema.py
database = os.environ.get('DATABASE', 'my_database')
```

### 4. Customize Tagging Rules

Edit `schema_tagger_rules.yaml` to match your organization:

```yaml
pattern_rules:
  - name: "Custom Rule"
    pattern: "your_pattern_here"
    tags:
      - "your_tag:value"
    confidence: "HIGH"
```

### 5. Test Locally

```bash
# Scan a database
python schema_auto_tagger_implementation.py my_database \
  --rules-file rules/schema_tagger_rules.yaml \
  --output-report /tmp/report.txt \
  --output-json /tmp/suggestions.json

# Approve and apply (dry-run first)
python schema_auto_tagger_implementation.py my_database \
  --rules-file rules/schema_tagger_rules.yaml \
  --approve-high \
  --dry-run
```

### 6. Deploy Workflow

```bash
# Navigate to project directory
cd ~/td-projects/schema-tagger

# Push workflow to Treasure Data
tdx wf push workflows/auto_schema_tagger.dig

# Run workflow manually (test)
tdx wf run auto_schema_tagger

# Schedule workflow (daily at 2 AM UTC)
# The schedule is defined in the .dig file
```

## Usage Scenarios

### Scenario 1: One-Time Schema Analysis

```bash
# Generate suggestions for review
python schema_auto_tagger_implementation.py analytics_db \
  --rules-file rules/schema_tagger_rules.yaml \
  --output-report report.txt

# Review the report
cat report.txt

# Manually approve and apply HIGH confidence tags
python schema_auto_tagger_implementation.py analytics_db \
  --rules-file rules/schema_tagger_rules.yaml \
  --approve-high
```

### Scenario 2: Immediate Tagging After Data Import

```bash
# After new data is loaded into Treasure Data:

# 1. Scan and generate suggestions
python schema_auto_tagger_implementation.py my_database \
  --table imported_table_name \
  --output-json /tmp/import_suggestions.json \
  --output-report /tmp/import_report.txt

# 2. Review report
cat /tmp/import_report.txt

# 3. Approve and apply
python schema_auto_tagger_implementation.py my_database \
  --approve-high
```

### Scenario 3: Programmatic Tag Application

```python
from schema_tagger_td_api import TreasureDataTagAPI

# Initialize API
api = TreasureDataTagAPI(api_key="your-api-key")

# Apply tags programmatically
tag_assignments = {
    "my_table": {
        "customer_email": ["data_classification:pii", "compliance:gdpr"],
        "transaction_amount": ["business_domain:financial", "compliance:sox"]
    }
}

successful, failed, errors = api.bulk_apply_tags("my_database", tag_assignments)
print(f"Applied: {successful}, Failed: {failed}")
```

## Workflow Architecture

```
auto_schema_tagger.dig (Daily at 2 AM)
├── +setup
│   └── Log start
│
├── +scan_schema
│   └── scan_schema.py
│       • Lists all tables in database
│       • Compares with baseline to detect changes
│       • Outputs JSON scan results
│
├── +generate_suggestions
│   └── generate_suggestions.py
│       • Loads scan results
│       • Applies tagging rules
│       • Generates tag suggestions
│       • Outputs suggestions JSON
│
├── +validate_suggestions
│   └── validate_suggestions.py
│       • Validates tag formats
│       • Checks confidence levels
│       • Outputs validation report
│
├── +approve_high_confidence
│   └── auto_approve_high_confidence.py
│       • Filters for HIGH confidence tags
│       • Auto-approves high-confidence suggestions
│       • Outputs approved tags JSON
│
├── +apply_tags
│   └── apply_approved_tags.py
│       • Uses TD API to apply tags
│       • Logs all applications
│       • Handles failures gracefully
│
├── +send_notification
│   └── send_notification.py
│       • Sends Slack notification with results
│       • Sends email report (optional)
│       • Includes execution summary
│
├── +store_audit_log
│   └── Stores execution log in audit table
│
└── +cleanup
    └── Remove temporary files

Error Handler (_error):
└── Send email alert if workflow fails
```

## Configuration

### Environment Variables

Set these for the workflow:

```bash
# Required
export TD_API_KEY="your-api-key"
export DATABASE="your_database"

# For Slack notifications
export SLACK_WEBHOOK="https://hooks.slack.com/services/xxx"

# For email notifications
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="587"
export SMTP_USER="user@example.com"
export SMTP_PASSWORD="password"
export SMTP_FROM="noreply@example.com"
export SMTP_TO="admin@example.com"
```

### Tagging Rules Format

```yaml
pattern_rules:
  - name: "Rule Name"
    pattern: "regex_pattern"
    tags:
      - "category:tag_name"
    confidence: "HIGH|MEDIUM|LOW"

table_rules:
  - name: "Rule Name"
    table_pattern: "table_name_regex"
    tags:
      - "category:tag_name"
    confidence: "HIGH|MEDIUM|LOW"
```

### Custom Rules Example

```yaml
pattern_rules:
  - name: "Internal Salary"
    pattern: "^salary|^comp|compensation"
    tags:
      - "data_classification:confidential"
      - "compliance:internal"
    confidence: "HIGH"

  - name: "GDPR-Subject Data"
    pattern: "personal_data|subject_data"
    tags:
      - "compliance:gdpr"
      - "governance:monitored"
    confidence: "HIGH"

table_rules:
  - name: "EU Customer Data"
    table_pattern: "eu_|_eu_customers"
    tags:
      - "compliance:gdpr"
    confidence: "HIGH"
```

## API Reference

### Core Tagging Engine

```python
from schema_auto_tagger_implementation import SchemaTagger

tagger = SchemaTagger(
    database="my_database",
    tagging_rules={"pattern_rules": [...]}
)

# Scan database
tables = tagger.scan_database()

# Analyze column
suggestions = tagger.analyze_column(column, table_name)

# Generate report
report = tagger.generate_report(tables_data, suggestions)

# Apply tags
successful, failed = tagger.apply_tags(approved_tags, dry_run=False)
```

### TD API Integration

```python
from schema_tagger_td_api import TreasureDataTagAPI

api = TreasureDataTagAPI(api_key="key", endpoint="https://api.treasuredata.com")

# List tags
tags = api.list_tags(database="my_db")

# Create tag
response = api.create_tag("my_tag", description="...", category="custom")

# Apply tag
response = api.apply_tag_to_column("db", "table", "column", "tag")

# Bulk apply
success, failed, errors = api.bulk_apply_tags("db", tag_assignments)

# Get audit log
audit_log = api.export_tags_audit_log("db", table="table_name")

# Compliance report
api.generate_compliance_report("db", "report.json")
```

## Monitoring & Troubleshooting

### Check Workflow Status

```bash
# View recent runs
tdx wf sessions auto_schema_tagger -l 5

# View specific run details
tdx wf session -l <session_id>

# View task logs
tdx wf attempt <attempt_id>
```

### Common Issues

**Issue: Tags not appearing after application**
```bash
# Verify tags exist
python schema_tagger_td_api.py --database my_db --command list-tags

# Check if column exists
tdx show schema my_db my_table --format json

# Check permissions
tdx auth show
```

**Issue: Suggestions seem wrong**
- Check rule configuration in `schema_tagger_rules.yaml`
- Verify pattern regex is correct
- Test with specific table: `--table my_table`

**Issue: Workflow fails in digdag**
- Check workflow logs: `tdx wf attempt <attempt_id>`
- Verify environment variables are set
- Test scripts individually first

### Validation

```bash
# Validate workflow file
tdx wf validate workflows/auto_schema_tagger.dig

# Test scan script
python workflow_scripts/scan_schema.py

# Test suggestions
python workflow_scripts/generate_suggestions.py

# Test approval
python workflow_scripts/auto_approve_high_confidence.py
```

## Performance Optimization

### For Large Databases

1. **Limit scope with table filter**:
   ```bash
   python schema_auto_tagger_implementation.py db --table specific_table
   ```

2. **Batch processing**:
   - Modify workflow to process tables in parallel
   - Adjust confidence thresholds

3. **Caching**:
   - Store baseline schema locally
   - Compare only deltas

### Scaling Considerations

- Each column analysis takes ~10-50ms
- 1,000 columns processed in 1-2 minutes
- Bulk API calls recommended for 100+ tags

## Integration Points

### Data Catalogs

Sync tags to external catalogs:
- Collibra: `api.sync_tags_to_catalog("db", "collibra", ...)`
- Alation: `api.sync_tags_to_catalog("db", "alation", ...)`

### Access Control

Use tags to enforce column-level security:
- Apply `data_classification:pii` → restrict access
- Apply `compliance:gdpr` → enforce retention policies

### Data Quality

Link tags to quality rules:
- `governance:validated` → must pass quality checks
- `governance:monitored` → included in dashboards

## Best Practices

1. **Start with HIGH confidence**
   - Only auto-apply HIGH confidence suggestions
   - Have humans review MEDIUM and LOW

2. **Build custom rules gradually**
   - Start with provided patterns
   - Add domain-specific rules after initial run
   - Document exceptions

3. **Audit regularly**
   - Export audit logs weekly
   - Review tagging patterns
   - Adjust rules based on findings

4. **Maintain tagging taxonomy**
   - Document all custom tags
   - Keep tag list in version control
   - Update documentation with new tags

5. **Compliance tracking**
   - Regularly export compliance reports
   - Use tags for regulatory reporting
   - Archive audit logs

## Support & Customization

### Extending the Implementation

1. **Add new detection types**:
   - Add method to `SchemaTagger` class
   - Add patterns to `schema_tagger_rules.yaml`

2. **Custom notification channels**:
   - Modify `send_notification.py`
   - Add PagerDuty, Teams, etc.

3. **Integration with your tools**:
   - Use `TreasureDataTagAPI` for programmatic access
   - Build custom reporting dashboards

## Files Reference

| File | Purpose |
|------|---------|
| `schema_auto_tagger_implementation.py` | Core tagging engine |
| `schema_tagger_td_api.py` | TD API integration |
| `schema_tagger_rules.yaml` | Tagging rules configuration |
| `auto_schema_tagger.dig` | Scheduled workflow definition |
| `workflow_scripts/scan_schema.py` | Database scanning |
| `workflow_scripts/generate_suggestions.py` | Suggestion generation |
| `workflow_scripts/auto_approve_high_confidence.py` | Auto-approval logic |
| `workflow_scripts/apply_approved_tags.py` | Tag application |
| `workflow_scripts/send_notification.py` | Result notifications |

## Next Steps

1. ✅ Review this guide
2. ✅ Customize `schema_tagger_rules.yaml` for your organization
3. ✅ Test locally with a small database
4. ✅ Deploy workflow to Treasure Data
5. ✅ Monitor first few runs
6. ✅ Adjust rules and thresholds
7. ✅ Scale to full production

## Support

For issues or questions:
- Check troubleshooting section above
- Review logs: `tdx wf attempt <attempt_id>`
- Test components individually
- Contact data governance team

---

**Version**: 1.0
**Last Updated**: 2025-02-15
**Maintained By**: Data Governance Team
