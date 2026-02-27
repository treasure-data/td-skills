# Schema Auto-Tagger - Quick Reference

## One-Line Usage

```bash
# Scan and show suggestions
python schema_auto_tagger_implementation.py my_database \
  --rules-file rules/schema_tagger_rules.yaml \
  --output-report report.txt

# Auto-approve HIGH confidence tags (dry-run)
python schema_auto_tagger_implementation.py my_database \
  --rules-file rules/schema_tagger_rules.yaml \
  --approve-high --dry-run

# Apply HIGH confidence tags (for real)
python schema_auto_tagger_implementation.py my_database \
  --rules-file rules/schema_tagger_rules.yaml \
  --approve-high

# Save suggestions to JSON for review
python schema_auto_tagger_implementation.py my_database \
  --output-json suggestions.json
```

## Tag Categories

### Data Classification
- `data_classification:pii` - Personally Identifiable Information
- `data_classification:sensitive` - Sensitive business data
- `data_classification:confidential` - Restricted access
- `data_classification:public` - Non-sensitive
- `data_classification:internal` - Internal use only

### Business Domain
- `business_domain:customer` - Customer data
- `business_domain:product` - Product information
- `business_domain:financial` - Financial/billing
- `business_domain:marketing` - Marketing/campaigns
- `business_domain:operations` - Operational metrics

### Technical
- `technical:staging` - Raw/staging data
- `technical:production` - Production-ready
- `technical:experimental` - Test/experimental
- `technical:deprecated` - Legacy/deprecated
- `technical:derived` - Calculated/transformed

### Compliance
- `compliance:gdpr` - GDPR subject data
- `compliance:ccpa` - CCPA regulated
- `compliance:hipaa` - Protected health info
- `compliance:sox` - Financial reporting
- `compliance:pci-dss` - Payment card data

### Governance
- `governance:validated` - Quality validated
- `governance:monitored` - Under data quality monitoring
- `governance:raw_data` - Raw/untransformed
- `governance:archived` - Archived/legacy

## Common Tag Combinations

```
Customer PII:
  - data_classification:pii
  - business_domain:customer
  - compliance:gdpr

Financial Amount:
  - data_classification:sensitive
  - business_domain:financial
  - compliance:sox

Marketing UTM:
  - business_domain:marketing
  - technical:production

Staging/Raw:
  - technical:staging
  - governance:raw_data
```

## Pattern Examples in Rules

```yaml
# PII Detection
pattern: "^email|phone|ssn|credit_card|password"

# Financial Data
pattern: "^amount|^price|^salary|balance|transaction"

# Timestamps
pattern: "^created_at|^updated_at|timestamp"

# Customer Data
pattern: "customer_|user_id|account_id"

# Staging Tables
table_pattern: "^stg_|_staging|^raw_"

# Production Tables
table_pattern: "^prod_|_production$"
```

## Workflow Monitoring

```bash
# View workflow runs
tdx wf sessions auto_schema_tagger -l 5

# View specific run
tdx wf session -l <session_id>

# View task logs
tdx wf attempt <attempt_id>

# Kill workflow
tdx wf kill -f <session_id>

# Re-run workflow
tdx wf run auto_schema_tagger
```

## Debugging

```bash
# Test scanning
python workflow_scripts/scan_schema.py

# Test suggestions
python workflow_scripts/generate_suggestions.py

# Test approval
python workflow_scripts/auto_approve_high_confidence.py

# Validate rules file
python -c "import yaml; print(yaml.safe_load(open('schema_tagger_rules.yaml')))"

# Check API access
python schema_tagger_td_api.py --database my_db --command list-tags
```

## Python API

```python
from schema_auto_tagger_implementation import SchemaTagger
from schema_tagger_td_api import TreasureDataTagAPI

# Scan
tagger = SchemaTagger("my_database")
tables = tagger.scan_database()

# Analyze
suggestions = tagger.analyze_column(column, table_name)

# Report
report = tagger.generate_report(tables, suggestions)

# Apply via API
api = TreasureDataTagAPI()
success, failed, errors = api.bulk_apply_tags("db", tag_assignments)

# Audit
audit = api.export_tags_audit_log("db")
```

## Environment Variables

```bash
# Required
export TD_API_KEY="your-api-key"
export DATABASE="your_database"

# Notifications
export SLACK_WEBHOOK="https://hooks.slack.com/..."
export SMTP_HOST="smtp.example.com"
export SMTP_FROM="noreply@company.com"
export SMTP_TO="admin@company.com"
```

## File Locations

```
~/td-projects/schema-tagger/
├── schema_auto_tagger_implementation.py  # Core engine
├── schema_tagger_td_api.py               # TD API
├── schema_tagger_rules.yaml              # Rules
├── auto_schema_tagger.dig                # Workflow
├── workflows/                            # Workflow files
│   └── auto_schema_tagger.dig
└── scripts/                              # Task scripts
    ├── scan_schema.py
    ├── generate_suggestions.py
    ├── auto_approve_high_confidence.py
    ├── apply_approved_tags.py
    └── send_notification.py
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tags not found | Run `tdx tags list` to see available tags |
| Column not found | Verify column exists: `tdx show schema db table` |
| API errors | Check `TD_API_KEY` is set correctly |
| Suggestions seem wrong | Check pattern in `schema_tagger_rules.yaml` |
| Workflow fails | Check logs: `tdx wf attempt <id>` |
| Permission denied | Verify TD API key has write permissions |

## Common Commands

```bash
# Initialize
cd ~/td-projects/schema-tagger
export TD_API_KEY="your-key"

# Scan
python schema_auto_tagger_implementation.py my_db --output-report report.txt

# Approve
python schema_auto_tagger_implementation.py my_db --approve-high --dry-run

# Apply
python schema_auto_tagger_implementation.py my_db --approve-high

# List tags
python schema_tagger_td_api.py --database my_db --command list-tags

# Deploy
tdx wf push auto_schema_tagger.dig

# Run
tdx wf run auto_schema_tagger

# Monitor
tdx wf sessions auto_schema_tagger -l 5
```

## Performance Tips

- Process 1,000 columns in ~1-2 minutes
- Use `--table` flag to limit scope
- Batch 100+ tags per API call
- Run workflow daily during low-traffic hours

## Support

- See `SCHEMA_TAGGER_COMPLETE_GUIDE.md` for full documentation
- Check workflow logs: `tdx wf attempt <attempt_id>`
- Test components individually first
