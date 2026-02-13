---
name: rt-config-setup
description: Initial RT 2.0 setup - check enablement status, initialize configuration, and verify prerequisites for parent segments
---

# RT 2.0 Setup & Initialization

Check RT 2.0 enablement, initialize configuration templates, and validate prerequisites.

## Prerequisites

- `tdx` CLI installed and authenticated
- Parent segment created in Data Workbench
- Master API key with full permissions

## Check RT Status

```bash
# View RT enablement status
tdx ps view <parent_segment_id> --json

# Expected response when enabled:
# {
#   "realtime_enabled": true,
#   "realtime_config_exists": true,
#   "status": "enabled"
# }

# When not enabled:
# {
#   "realtime_enabled": false,
#   "message": "Contact CSM to enable RT 2.0"
# }
```

## Request RT Enablement

If RT is not enabled, contact your CSM with:

```markdown
Subject: Request to Enable RT 2.0 for Parent Segment

Please enable RT 2.0 (Real-Time Personalization) for:

**Parent Segment Details:**
- Parent Segment ID: <id>
- Parent Segment Name: <name>
- Region: <region>
- Environment: production

**Use Case:**
[Describe your RT 2.0 use case: triggers, personalization, or both]

**Requirements:**
- Enable RT 2.0 feature
- Provide Reactor Instance ID
- Confirm enablement completion
```

## Initialize Configuration

```bash
# Option 1: Initialize new configuration template
tdx ps pz init <parent_segment_id> -o rt_config.yaml

# This creates a YAML template with:
# - Sample event tables
# - Example RT attributes
# - ID stitching configuration
# - Batch attribute imports

# Option 2: View existing configuration
tdx ps view <parent_segment_id> --json

# Option 3: Set parent segment context
tdx ps use <parent_segment_id>

# Now commands default to this parent segment:
tdx ps pz init -o rt_config.yaml
tdx ps view
```

## Configuration Template Structure

The generated `rt_config.yaml` includes:

```yaml
parent_segment_id: "394649"

# Event tables - Configure with rt-config-events skill
events:
  - name: "page_view"
    database: "events_db"
    table: "web_events"
    filter:
      field: "td_path"
      pattern: "^/pageview/"

# RT attributes - Configure with rt-config-attributes skill
attributes:
  - name: "last_product_viewed"
    type: "single"
    source_event: "page_view"
    source_field: "product_id"

# ID stitching - Configure with rt-config-id-stitching skill
id_stitching:
  primary_key: "td_client_id"
  stitching_keys:
    - name: "td_client_id"
    - name: "email"
```

## Discover Available Data

Before configuring, discover what data is available:

```bash
# List databases
tdx databases --json

# List tables in database
tdx tables list <database_name> --json

# View table schema
tdx table describe <database_name> <table_name>

# Preview table data
tdx query "select * from <database>.<table> limit 10"

# Check existing parent segment attributes (batch layer)
tdx ps view <parent_segment_id> --json | jq '.attributes'

# List all parent segments
tdx ps list --json
```

## Validate Configuration

```bash
# Validate YAML syntax
tdx ps rt validate rt_config.yaml

# Common validation checks:
# - parent_segment_id exists
# - Event tables are accessible
# - Attribute names are unique
# - primary_key is in stitching_keys
# - Regex patterns are valid
```

## Push Configuration

```bash
# Push to Treasure Data
tdx ps push rt_config.yaml

# Monitor push status
tdx ps view <parent_segment_id> --json | jq '.realtime_config.status'

# Status values:
# - "ok" - Configuration active
# - "updating" - Push in progress
# - "error" - Configuration failed
```

## Verification

```bash
# Verify RT configuration
tdx ps view <parent_segment_id> --json

# Open in browser
tdx ps view <parent_segment_id> --web

# Check specific components
tdx ps view <parent_segment_id> --json | jq '.realtime_config.events'
tdx ps view <parent_segment_id> --json | jq '.realtime_config.key_columns'
```

## Configuration Workflow

1. **Check Status**: Verify RT is enabled
2. **Initialize**: Create configuration template
3. **Discover Data**: Find available tables and attributes
4. **Configure Events**: Add event tables → Use `rt-config-events` skill
5. **Configure Attributes**: Add RT attributes → Use `rt-config-attributes` skill
6. **Configure ID Stitching**: Set up profile merging → Use `rt-config-id-stitching` skill
7. **Validate**: Check configuration syntax
8. **Push**: Deploy to Treasure Data
9. **Verify**: Confirm configuration is active

## Common Errors

| Error | Solution |
|-------|----------|
| "RT 2.0 not enabled" | Contact CSM with enablement request |
| "Parent segment not found" | Verify ID with `tdx ps list` |
| "Configuration invalid" | Run `tdx ps rt validate` for details |
| "Permission denied" | Verify API key has full permissions |

## Update Configuration

To update existing RT configuration:

```bash
# Pull current config (not yet available in tdx)
# Use API to view current state
tdx ps view <parent_segment_id> --json

# Make changes to YAML file
# Push updated configuration
tdx ps push rt_config.yaml

# Note: Some updates require API calls
# See rt-config-events, rt-config-attributes skills for API updates
```

## Next Steps

After initialization:
- **Configure Events**: Add event tables → Use `rt-config-events` skill
- **Configure Attributes**: Add RT attributes → Use `rt-config-attributes` skill
- **Configure ID Stitching**: Set up profile merging → Use `rt-config-id-stitching` skill

After RT configuration complete:
- **RT Triggers**: Create event-triggered journeys → Use `rt-journey-create` skill
- **RT Personalization**: Create personalization services → Use `rt-pz-service` skill

## Resources

- [RT 2.0 Documentation](https://docs.treasuredata.com/display/public/PD/RT+2.0)
- [Parent Segment Guide](https://docs.treasuredata.com/display/public/PD/Parent+Segments)
