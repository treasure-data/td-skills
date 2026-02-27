# Steps 3-6: Data Exploration & RT Attribute Definition

## Step 3: Explore Parent Segment Attributes

```bash
# Get all PS attributes (batch layer)
tdx ps view <ps_id> --json | jq '.attributes[] | {
  name, type, description
}' > ps_attributes.json

# Review attributes relevant to use case
cat ps_attributes.json | jq -r '.name'
```

**For Web Personalization use case**, look for:
- Customer tier: `loyalty_tier`, `customer_segment`, `vip_status`
- Demographics: `city`, `country`, `age_group`
- Historical data: `total_purchase_value`, `lifetime_orders`

**Ask user:** "Which batch attributes should be available in personalization responses?"
- Multi-select from discovered attributes
- Suggest relevant attributes based on use case

**Checkpoint:** Batch attributes identified for personalization payload.

---

## Step 4: Discover Streaming Event Tables

```bash
# List databases
tdx databases --json | jq -r '.[].name'

# Ask user for event database
# Then list tables
tdx tables "<event_db>.*" --json | jq -r '.[].name'

# Search for common event patterns
tdx tables "<event_db>.*" --json | jq -r '.[].name' | \
  grep -E '(pageview|page_view|cart|purchase|event|click|view)'
```

**For Web Personalization**, suggest tables like:
- `pageviews`, `page_view`, `web_events`
- `product_views`, `item_views`
- `clicks`, `interactions`

**Get table schema:**
```bash
tdx describe <event_db>.<table> --json | jq '.columns[] | {
  name, type
}'
```

**Ask user:** "Which event tables should RT track?"
- Multi-select from discovered tables
- For each table, ask: "What should this event be called?" (e.g., "page_view")

**Checkpoint:** Event tables discovered and selected.

---

## Step 5: Define ID Stitching Keys

**Discover ID columns from event schemas:**
```bash
# Find ID-like columns
tdx describe <event_db>.<table> --json | jq -r '.columns[] |
  select(.name | test("id|email|user|client|canonical")) | .name'
```

**Common stitching keys:**
- `td_client_id` (cookie-based, always recommended)
- `email`
- `user_id`, `customer_id`
- `canonical_id` (master ID, recommended as primary key)

**Ask user:** "Which columns should be used for ID stitching?"
- Multi-select discovered ID columns
- Recommend: td_client_id, email, canonical_id
- Ask: "Which should be the primary key?" (suggest canonical_id or most complete)

**Checkpoint:** ID stitching keys defined, primary key selected.

---

## Step 6: Define RT Attributes

Based on use case, suggest RT attributes:

**For Web Personalization:**
```yaml
attributes:
  - name: last_product_viewed
    type: single
    source_event: page_view
    source_field: product_id
    aggregation: last

  - name: browsed_products_list
    type: list
    source_event: page_view
    source_field: product_id
    aggregation: distinct_list
    max_items: 100
    expiry_days: 60

  - name: page_views_24h
    type: counter
    source_event: page_view
    aggregation: count
    window_duration: 24h
```

**Ask user:** "Use recommended attributes or customize?"
- Show recommendations based on use case
- Allow customization: add/remove attributes

**Checkpoint:** RT attributes defined (single, list, counter types selected).
