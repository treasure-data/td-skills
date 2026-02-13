---
name: rt-config-events
description: Configure RT 2.0 event tables and key events - define which streaming events to track and filter for real-time processing
---

# RT 2.0 Event Configuration

Configure event tables and key events for real-time processing.

## Prerequisites

- RT 2.0 enabled (use `rt-config-setup` skill first)
- Streaming event tables with data
- Event table schema knowledge

## Event Table Structure

```yaml
events:
  - name: "page_view"              # Event identifier
    database: "events_db"           # Database name
    table: "web_events"             # Table name
    filter:                         # Optional: filter events
      field: "td_path"              # Field to filter on
      pattern: "^/pageview/"        # Regex pattern
    description: "Page view events" # Optional

  - name: "purchase"
    database: "events_db"
    table: "commerce_events"
    filter:
      field: "event_type"
      pattern: "^purchase$"
    description: "Purchase completion events"
```

## Event Filters

Filter events using regex patterns:

### Common Patterns

```yaml
# Exact match
filter:
  field: "event_type"
  pattern: "^purchase$"

# Starts with
filter:
  field: "td_path"
  pattern: "^/cart/add"

# Contains
filter:
  field: "url"
  pattern: ".*product.*"

# Multiple options (OR)
filter:
  field: "event_type"
  pattern: "^(purchase|add_to_cart|checkout)$"

# No filter (all events)
# Omit filter section
```

### Field Selection

Common fields to filter on:
- `td_path` - Event path/name from SDK
- `event_type` - Custom event type field
- `event_name` - Event name field
- `action` - Action field
- Custom fields in your event table

## Discover Event Tables

```bash
# List databases
tdx databases --json

# List tables in database
tdx tables list events_db --json

# View table schema
tdx table describe events_db web_events

# Preview events
tdx query "select * from events_db.web_events limit 10"

# Check event types
tdx query "
select
  td_path,
  event_type,
  count(*) as event_count
from events_db.web_events
where td_interval(time, '-1d')
group by td_path, event_type
order by event_count desc
limit 20
"

# Check field values for filtering
tdx query "
select distinct td_path
from events_db.web_events
where td_interval(time, '-1d')
limit 50
"
```

## E-commerce Event Examples

```yaml
events:
  # Product views
  - name: "product_view"
    database: "events"
    table: "web_events"
    filter:
      field: "event_type"
      pattern: "^product_view$"

  # Add to cart
  - name: "add_to_cart"
    database: "events"
    table: "web_events"
    filter:
      field: "event_type"
      pattern: "^add_to_cart$"

  # Purchase
  - name: "purchase"
    database: "events"
    table: "commerce_events"
    filter:
      field: "event_type"
      pattern: "^purchase$"

  # Cart abandon (no filter - track all cart events)
  - name: "cart_events"
    database: "events"
    table: "cart_events"
```

## Media/Content Event Examples

```yaml
events:
  # Content views
  - name: "content_view"
    database: "events"
    table: "content_events"
    filter:
      field: "action"
      pattern: "^view$"

  # Video play
  - name: "video_play"
    database: "events"
    table: "media_events"
    filter:
      field: "event_type"
      pattern: "^video_play$"

  # Article read
  - name: "article_read"
    database: "events"
    table: "content_events"
    filter:
      field: "td_path"
      pattern: "^/article/"
```

## SaaS/B2B Event Examples

```yaml
events:
  # User login
  - name: "login"
    database: "events"
    table: "user_events"
    filter:
      field: "event_type"
      pattern: "^login$"

  # Feature usage
  - name: "feature_used"
    database: "events"
    table: "app_events"
    filter:
      field: "event_type"
      pattern: "^feature_"

  # Trial signup
  - name: "trial_signup"
    database: "events"
    table: "conversion_events"
    filter:
      field: "event_type"
      pattern: "^trial_signup$"
```

## Key Events

Key events are important business events used for RT triggers:

```bash
# List key events (API)
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp

# Create key event (API)
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp --method POST --data '{
  "name": "high_value_purchase",
  "event_name": "purchase",
  "description": "Purchase over $100",
  "filters": {
    "purchase_amount": {
      "operator": "greater_than",
      "value": 100
    }
  }
}'

# Update key event (API)
tdx api "/audiences/<parent_segment_id>/realtime_key_events/<event_id>" --type cdp --method PATCH --data '{
  "description": "Updated description"
}'

# Delete key event (API)
tdx api "/audiences/<parent_segment_id>/realtime_key_events/<event_id>" --type cdp --method DELETE
```

## Update Event Tables

Update via API (YAML update not yet available):

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
    },
    {
      "database": "events_db",
      "table": "commerce_events",
      "event_name": "purchase",
      "filter_field": "event_type",
      "filter_pattern": "^purchase$"
    }
  ]
}'
```

## Validate Event Configuration

```bash
# Check event tables are accessible
tdx table describe <database> <table>

# Test regex pattern
tdx query "
select td_path
from events_db.web_events
where td_interval(time, '-1h')
  and regexp_like(td_path, '^/pageview/')
limit 10
"

# Count events matching filter
tdx query "
select count(*) as matching_events
from events_db.web_events
where td_interval(time, '-1d')
  and regexp_like(td_path, '^/pageview/')
"
```

## Common Errors

| Error | Solution |
|-------|----------|
| "Event table not accessible" | Verify table exists with `tdx tables list` |
| "Invalid regex pattern" | Test pattern with `regexp_like()` in query |
| "No events matching filter" | Check filter pattern matches actual data |
| "Database not found" | Verify database name with `tdx databases` |
| "Permission denied" | Verify API key has access to database |

## Event Table Requirements

- **Time column**: Table must have `time` column (epoch seconds)
- **Profile keys**: Must contain ID fields (td_client_id, email, user_id, etc.)
- **Event data**: Fields to use in RT attributes
- **Streaming**: Table should receive real-time data
- **Retention**: Consider data retention for RT processing

## Best Practices

- **Specific filters**: Use precise regex patterns to avoid unwanted events
- **Event naming**: Use clear, descriptive event names
- **Multiple tables**: OK to use same table for multiple events with different filters
- **Test patterns**: Always test regex patterns against actual data
- **Document events**: Add descriptions to help team understand each event

## Next Steps

After configuring events:
- **RT Attributes**: Configure attributes from event data → Use `rt-config-attributes` skill
- **Key Events**: Create key events for triggers → See key events section above
- **RT Triggers**: Create event-triggered journeys → Use `rt-journey-create` skill

## Resources

- [RT 2.0 Events Documentation](https://docs.treasuredata.com/display/public/PD/RT+Events)
- [Regex Pattern Reference](https://docs.treasuredata.com/display/public/PD/Regular+Expressions)
