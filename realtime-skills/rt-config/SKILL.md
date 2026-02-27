---
name: rt-config
description: Configure RT 2.0 (Real-Time Personalization) for parent segments including event tables, key events, RT attributes, and ID stitching using tdx ps rt commands or API
---

# RT 2.0 Configuration

Configure real-time personalization for parent segments: event tables, RT attributes, batch attributes, and ID stitching.

## Prerequisites

- `tdx` CLI installed and authenticated
- Parent segment created in Data Workbench
- RT 2.0 enabled by CSM (contact CSM if not enabled)
- Streaming event tables configured and receiving data

## Quick Start

```bash
# Check RT status
tdx ps view <parent_segment_id> --json

# Initialize configuration template
tdx ps pz init <parent_segment_id> -o rt_config.yaml

# Validate configuration
tdx ps rt validate rt_config.yaml

# Push configuration
tdx ps push rt_config.yaml
```

## Configuration Structure

```yaml
parent_segment_id: "394649"

# Event tables to track
events:
  - name: "page_view"
    database: "events_db"
    table: "web_events"
    filter:
      field: "td_path"
      pattern: "^/pageview/"

  - name: "purchase"
    database: "events_db"
    table: "commerce_events"
    filter:
      field: "event_type"
      pattern: "^purchase$"

# Real-time attributes
attributes:
  # Single - Latest value
  - name: "last_product_viewed"
    type: "single"
    source_event: "page_view"
    source_field: "product_id"
    aggregation: "last"
    sensitivity: "non-sensitive"

  # List - Array with expiry
  - name: "viewed_products_30d"
    type: "list"
    source_event: "page_view"
    source_field: "product_id"
    aggregation: "distinct_list"
    max_items: 50
    expiry_days: 30
    sensitivity: "non-sensitive"

  # Counter - Event counts
  - name: "purchase_count_7d"
    type: "counter"
    source_event: "purchase"
    window_duration: "7d"
    aggregation: "count"
    sensitivity: "non-sensitive"

  # Imported batch - From parent segment
  - name: "customer_tier"
    type: "imported_batch"
    source: "parent_segment"
    sensitivity: "non-sensitive"

# ID stitching
id_stitching:
  primary_key: "td_client_id"
  stitching_keys:
    - name: "td_client_id"
      exclude_regex: "^test_.*"
    - name: "email"
      exclude_regex: ".*@test\\.com$"
    - name: "user_id"
  ext_lookup_key: "email"
```

## Attribute Types

### Single Attributes

Latest or first value from event field:

```yaml
- name: "last_page_url"
  type: "single"
  source_event: "page_view"
  source_field: "url"
  aggregation: "last"  # or "first", "sum", "min", "max"
```

### List Attributes

Distinct values with expiry:

```yaml
- name: "browsed_categories"
  type: "list"
  source_event: "page_view"
  source_field: "category"
  aggregation: "distinct_list"
  max_items: 100
  expiry_days: 60
```

### Counter Attributes

Event counts over time window:

```yaml
- name: "clicks_24h"
  type: "counter"
  source_event: "click"
  window_duration: "24h"  # 24h, 7d, 30d
  aggregation: "count"    # or "sum" with source_field
```

### Imported Batch Attributes

From parent segment (updated on schedule):

```yaml
- name: "total_lifetime_value"
  type: "imported_batch"
  source: "parent_segment"
  sensitivity: "non-sensitive"
```

## Event Filters

Filter events by field pattern:

```yaml
events:
  - name: "add_to_cart"
    database: "events_db"
    table: "web_events"
    filter:
      field: "td_path"
      pattern: "^/cart/add"
```

Common patterns:
- `^/pageview/` - Starts with /pageview/
- `^purchase$` - Exactly "purchase"
- `.*product.*` - Contains "product"

## ID Stitching

```yaml
id_stitching:
  primary_key: "td_client_id"        # Unique, stable identifier
  stitching_keys:
    - name: "td_client_id"
      exclude_regex: "^test_.*"      # Exclude test IDs
    - name: "email"
      exclude_regex: ".*@example\\.com$"
    - name: "user_id"
  ext_lookup_key: "email"            # External lookup (optional)
```

**Requirements**:
- `primary_key` must be in `stitching_keys`
- All keys should exist in event tables
- Use `exclude_regex` to filter invalid values

## View Configuration

```bash
# View current RT config
tdx ps view <parent_segment_id> --json

# Check event tables
tdx ps view <parent_segment_id> --json | jq '.realtime_config.events'

# List RT attributes (API)
tdx api "/audiences/<parent_segment_id>/realtime_attributes" --type cdp

# List key events (API)
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp
```

## Update Configuration

Update via API (no YAML update available yet):

```bash
# Update event tables
tdx api "/audiences/<parent_segment_id>/realtime_setting" --type cdp --method PATCH --data '{
  "event_tables": [
    {
      "database": "events_db",
      "table": "web_events",
      "event_name": "page_view",
      "filter_field": "td_path",
      "filter_pattern": "^/pageview/"
    }
  ],
  "key_columns": {
    "primary_key": "td_client_id",
    "stitching_keys": ["td_client_id", "email", "user_id"]
  }
}'

# Add RT attribute
tdx api "/audiences/<parent_segment_id>/realtime_attributes" --type cdp --method POST --data '{
  "name": "last_product_viewed",
  "type": "single",
  "source_event": "page_view",
  "source_field": "product_id",
  "aggregation": "last",
  "sensitivity": "non-sensitive"
}'

# Add key event
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp --method POST --data '{
  "name": "purchase",
  "event_name": "purchase",
  "description": "Customer completed purchase"
}'
```

## Validation

```bash
# Validate YAML syntax
tdx ps rt validate rt_config.yaml

# Check for common issues:
# - primary_key not in stitching_keys
# - duplicate attribute names
# - invalid regex patterns
# - missing required fields
```

## Discover Available Data

```bash
# List databases
tdx databases --json

# List tables in database
tdx tables list <database_name> --json

# View table schema
tdx table describe <database_name> <table_name>

# Preview table data
tdx query "select * from <database>.<table> limit 10"

# Check parent segment attributes (batch layer)
tdx ps view <parent_segment_id> --json | jq '.attributes'
```

## Common Patterns

### E-commerce

```yaml
events:
  - name: "product_view"
    database: "events"
    table: "web_events"
    filter: {field: "event_type", pattern: "^product_view$"}

  - name: "add_to_cart"
    database: "events"
    table: "web_events"
    filter: {field: "event_type", pattern: "^add_to_cart$"}

  - name: "purchase"
    database: "events"
    table: "commerce_events"
    filter: {field: "event_type", pattern: "^purchase$"}

attributes:
  - name: "last_product_viewed"
    type: "single"
    source_event: "product_view"
    source_field: "product_id"
    aggregation: "last"

  - name: "cart_value"
    type: "single"
    source_event: "add_to_cart"
    source_field: "total_amount"
    aggregation: "sum"

  - name: "purchase_count_30d"
    type: "counter"
    source_event: "purchase"
    window_duration: "30d"
```

### Media/Content

```yaml
events:
  - name: "content_view"
    database: "events"
    table: "content_events"
    filter: {field: "action", pattern: "^view$"}

attributes:
  - name: "viewed_content_ids"
    type: "list"
    source_event: "content_view"
    source_field: "content_id"
    aggregation: "distinct_list"
    max_items: 100
    expiry_days: 90

  - name: "favorite_category"
    type: "single"
    source_event: "content_view"
    source_field: "category"
    aggregation: "last"
```

## Common Errors

| Error | Solution |
|-------|----------|
| "RT 2.0 not enabled" | Contact CSM to enable RT 2.0 for parent segment |
| "Parent segment not found" | Verify parent segment ID with `tdx ps list` |
| "Event table not accessible" | Check table exists: `tdx tables list <database>` |
| "Invalid regex pattern" | Test regex separately, escape special characters |
| "Duplicate attribute name" | Remove duplicate or rename attribute |
| "Primary key not in stitching_keys" | Add primary_key to stitching_keys list |
| "Unknown event name" | Verify event defined in events section |

## Next Steps

After RT configuration:
- **RT Triggers**: Create event-triggered journeys → Use `rt-triggers` skill
- **RT Personalization**: Create personalization services → Use `rt-personalization` skill

## Detailed Guides

- [Setup Workflow](./docs/setup-workflow.md) - Step-by-step configuration process
- [Troubleshooting](./docs/troubleshooting.md) - Detailed error solutions

## Resources

- [RT 2.0 Documentation](https://docs.treasuredata.com/display/public/PD/RT+2.0)
- [Parent Segment Guide](https://docs.treasuredata.com/display/public/PD/Parent+Segments)
