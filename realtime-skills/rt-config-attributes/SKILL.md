---
name: rt-config-attributes
description: Configure RT 2.0 attributes - single, list, counter, and batch attributes for real-time profile enrichment
---

# RT 2.0 Attribute Configuration

Configure real-time and batch attributes for profile enrichment.

## Prerequisites

- RT 2.0 enabled and event tables configured
- Use `rt-config-events` skill to configure events first

## Attribute Types

### Single Attributes

Latest or aggregated value from event field:

```yaml
- name: "last_product_viewed"
  type: "single"
  source_event: "page_view"
  source_field: "product_id"
  aggregation: "last"           # last, first, sum, min, max
  sensitivity: "non-sensitive"  # or "sensitive" for PII
  description: "Most recently viewed product"
```

**Aggregation options**:
- `last` - Most recent value
- `first` - First value seen
- `sum` - Sum of values
- `min` - Minimum value
- `max` - Maximum value

### List Attributes

Distinct values with expiry:

```yaml
- name: "viewed_products_30d"
  type: "list"
  source_event: "page_view"
  source_field: "product_id"
  aggregation: "distinct_list"
  max_items: 50               # Max list size
  expiry_days: 30             # Remove items after N days
  sensitivity: "non-sensitive"
  description: "Products viewed in last 30 days"
```

**Parameters**:
- `max_items` - Maximum list length (default: 100)
- `expiry_days` - Days before items expire (default: 90)
- Only `distinct_list` aggregation supported

### Counter Attributes

Event counts over time window:

```yaml
- name: "purchase_count_7d"
  type: "counter"
  source_event: "purchase"
  window_duration: "7d"       # 24h, 7d, 30d, 90d
  aggregation: "count"        # count or sum
  sensitivity: "non-sensitive"
  description: "Purchases in last 7 days"
```

**With field sum**:
```yaml
- name: "total_spend_30d"
  type: "counter"
  source_event: "purchase"
  source_field: "amount"      # Field to sum
  window_duration: "30d"
  aggregation: "sum"
  sensitivity: "non-sensitive"
```

**Window options**: `24h`, `7d`, `30d`, `90d`

### Imported Batch Attributes

From parent segment (updated on schedule):

```yaml
- name: "customer_tier"
  type: "imported_batch"
  source: "parent_segment"
  sensitivity: "non-sensitive"
  description: "Customer tier from parent segment"
```

**Note**: Attribute name must match parent segment attribute name exactly.

## E-commerce Attribute Examples

```yaml
attributes:
  # Last viewed product
  - name: "last_product_viewed"
    type: "single"
    source_event: "product_view"
    source_field: "product_id"
    aggregation: "last"
    sensitivity: "non-sensitive"

  # Viewed products list
  - name: "viewed_products_30d"
    type: "list"
    source_event: "product_view"
    source_field: "product_id"
    aggregation: "distinct_list"
    max_items: 50
    expiry_days: 30
    sensitivity: "non-sensitive"

  # Viewed categories
  - name: "browsed_categories"
    type: "list"
    source_event: "product_view"
    source_field: "category"
    aggregation: "distinct_list"
    max_items: 20
    expiry_days: 30
    sensitivity: "non-sensitive"

  # Cart value
  - name: "cart_value"
    type: "single"
    source_event: "add_to_cart"
    source_field: "total_amount"
    aggregation: "sum"
    sensitivity: "non-sensitive"

  # Purchase count
  - name: "purchase_count_30d"
    type: "counter"
    source_event: "purchase"
    window_duration: "30d"
    aggregation: "count"
    sensitivity: "non-sensitive"

  # Total spend
  - name: "total_spend_30d"
    type: "counter"
    source_event: "purchase"
    source_field: "amount"
    window_duration: "30d"
    aggregation: "sum"
    sensitivity: "non-sensitive"

  # Batch: Customer tier
  - name: "customer_tier"
    type: "imported_batch"
    source: "parent_segment"
    sensitivity: "non-sensitive"
```

## Media/Content Attribute Examples

```yaml
attributes:
  # Viewed content IDs
  - name: "viewed_content_ids"
    type: "list"
    source_event: "content_view"
    source_field: "content_id"
    aggregation: "distinct_list"
    max_items: 100
    expiry_days: 90
    sensitivity: "non-sensitive"

  # Favorite category
  - name: "favorite_category"
    type: "single"
    source_event: "content_view"
    source_field: "category"
    aggregation: "last"
    sensitivity: "non-sensitive"

  # Video watch count
  - name: "videos_watched_7d"
    type: "counter"
    source_event: "video_play"
    window_duration: "7d"
    aggregation: "count"
    sensitivity: "non-sensitive"

  # Last article read
  - name: "last_article_url"
    type: "single"
    source_event: "article_read"
    source_field: "url"
    aggregation: "last"
    sensitivity: "non-sensitive"
```

## SaaS/B2B Attribute Examples

```yaml
attributes:
  # Features used
  - name: "features_used"
    type: "list"
    source_event: "feature_used"
    source_field: "feature_name"
    aggregation: "distinct_list"
    max_items: 50
    expiry_days: 30
    sensitivity: "non-sensitive"

  # Login count
  - name: "login_count_7d"
    type: "counter"
    source_event: "login"
    window_duration: "7d"
    aggregation: "count"
    sensitivity: "non-sensitive"

  # Last login time
  - name: "last_login_time"
    type: "single"
    source_event: "login"
    source_field: "timestamp"
    aggregation: "last"
    sensitivity: "non-sensitive"

  # Account value (batch)
  - name: "account_value"
    type: "imported_batch"
    source: "parent_segment"
    sensitivity: "non-sensitive"
```

## Add RT Attributes via API

```bash
# Add single attribute
tdx api "/audiences/<parent_segment_id>/realtime_attributes" --type cdp --method POST --data '{
  "name": "last_product_viewed",
  "type": "single",
  "source_event": "page_view",
  "source_field": "product_id",
  "aggregation": "last",
  "sensitivity": "non-sensitive",
  "description": "Most recently viewed product"
}'

# Add list attribute
tdx api "/audiences/<parent_segment_id>/realtime_attributes" --type cdp --method POST --data '{
  "name": "viewed_products_30d",
  "type": "list",
  "source_event": "page_view",
  "source_field": "product_id",
  "aggregation": "distinct_list",
  "max_items": 50,
  "expiry_days": 30,
  "sensitivity": "non-sensitive"
}'

# Add counter attribute
tdx api "/audiences/<parent_segment_id>/realtime_attributes" --type cdp --method POST --data '{
  "name": "purchase_count_7d",
  "type": "counter",
  "source_event": "purchase",
  "window_duration": "7d",
  "aggregation": "count",
  "sensitivity": "non-sensitive"
}'

# Add batch attribute
tdx api "/audiences/<parent_segment_id>/realtime_attributes" --type cdp --method POST --data '{
  "name": "customer_tier",
  "type": "imported_batch",
  "source": "parent_segment",
  "sensitivity": "non-sensitive"
}'
```

## List RT Attributes

```bash
# List all RT attributes
tdx api "/audiences/<parent_segment_id>/realtime_attributes" --type cdp

# Filter by type
tdx api "/audiences/<parent_segment_id>/realtime_attributes" --type cdp | jq '.[] | select(.type=="single")'

# Get specific attribute
tdx api "/audiences/<parent_segment_id>/realtime_attributes/<attribute_id>" --type cdp
```

## Update RT Attributes

```bash
# Update attribute
tdx api "/audiences/<parent_segment_id>/realtime_attributes/<attribute_id>" --type cdp --method PATCH --data '{
  "description": "Updated description",
  "sensitivity": "sensitive"
}'

# Delete attribute
tdx api "/audiences/<parent_segment_id>/realtime_attributes/<attribute_id>" --type cdp --method DELETE
```

## Discover Parent Segment Attributes

For imported batch attributes:

```bash
# List parent segment attributes
tdx ps view <parent_segment_id> --json | jq '.attributes'

# View attribute details
tdx ps view <parent_segment_id> --json | jq '.attributes[] | {name, type, description}'
```

## Sensitivity Levels

- `non-sensitive` - General data (product IDs, categories, counts)
- `sensitive` - PII data (email, phone, address, names)

**Best practice**: Mark PII as `sensitive` for compliance tracking

## Common Errors

| Error | Solution |
|-------|----------|
| "Unknown event name" | Event must be defined in events section first |
| "Duplicate attribute name" | Each attribute name must be unique |
| "Invalid source_field" | Verify field exists in event table |
| "Batch attribute not found" | Verify attribute exists in parent segment |
| "Invalid window_duration" | Use: 24h, 7d, 30d, or 90d |
| "Invalid aggregation" | Check aggregation matches attribute type |

## Validation

```bash
# Validate configuration
tdx ps rt validate rt_config.yaml

# Check for:
# - Duplicate attribute names
# - Valid event references
# - Valid aggregation types
# - Valid window durations
```

## Attribute Naming Best Practices

- Use lowercase with underscores: `last_product_viewed`
- Include time window in name: `purchase_count_30d`
- Be specific: `viewed_products_30d` not `products`
- Avoid conflicts with parent segment attribute names (unless importing)

## Testing Attributes

After configuration, test attributes are populating:

```bash
# Query RT database (after processing starts)
tdx query "
select
  td_client_id,
  last_product_viewed,
  viewed_products_30d,
  purchase_count_30d
from cdp_audience_<parent_segment_id>_rt.customers
limit 10
"
```

## Next Steps

After configuring attributes:
- **ID Stitching**: Configure profile merging → Use `rt-config-id-stitching` skill
- **RT Personalization**: Use attributes in personalization services → Use `rt-pz-service` skill
- **RT Triggers**: Use attributes in journey activations → Use `rt-journey-create` skill

## Resources

- [RT Attributes Documentation](https://docs.treasuredata.com/display/public/PD/RT+Attributes)
- [Data Sensitivity Guide](https://docs.treasuredata.com/display/public/PD/Data+Privacy)
