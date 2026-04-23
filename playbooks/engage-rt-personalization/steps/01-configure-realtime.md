# Step 1: Configure Realtime in Data Workbench

**Audience:** Customer developers / TD CSM  
**Duration:** ~30 minutes

## Overview

Configure RT 2.0 infrastructure for the parent segment, including event tables, key events, RT attributes, and ID stitching.

This step creates the foundation for real-time event processing and personalization.

## Prerequisites

- Parent segment created in Data Workbench
- RT 2.0 enabled by TD CSM (Reactor instance provisioned)
- Streaming event data ingesting to TD
- Master API key with full permissions

## 1.1 Select Parent Segment and Open Realtime Configuration

1. Navigate to **Data Workbench** → **Parent Segments**
2. Select your target parent segment
3. Click **Configure settings for Realtime**

## 1.2 Add Streaming Event Table

Register the streaming event table that provides trigger events.

**In the Realtime configuration UI:**

1. Click **Add Event Table**
2. Select database and table (e.g. `web_events.pageviews`)
3. Click **Save**

**Supported event sources:**
- Web SDK events (`td.trackEvent`, `td.trackPageview`)
- Mobile SDK events
- Server-side API events
- Third-party event streams

**Example event table schema:**
```
td_client_id: string
user_id: string
event_name: string
product_id: string
product_status: string (e.g. 'on_sale', 'regular')
price: double
time: long
```

## 1.3 Define Key Events

Create event definitions that will trigger personalization.

**In the Realtime configuration UI:**

1. Click **Create Key Event**
2. Fill in:
   - **Name**: `product_view` (descriptive name)
   - **Event table**: Select the table from step 1.2
   - **Filters**: Define event matching criteria

**Filter configuration:**

Supported operators:
- **is** / **is not** - exact match
- **is null** / **is not null** - null checks
- **greater than** / **less than** / **at least** / **at most** - numeric comparisons
- **regex** / **not regex** - pattern matching

**Example: Filter for product view events**
```
Condition: event_name is "product_view"
```

**Example: Filter for on-sale products only**
```
Condition 1: event_name is "product_view"
Condition 2: product_status is "on_sale"
Match logic: all (AND)
```

3. Click **Save**

## 1.4 Configure Realtime Attributes

Create attributes that will be available in personalization responses.

**Attribute types:**

### Single Value Attribute
Stores the most recent value from an event.

**Example: Last viewed product**
- **Name**: `last_viewed_product`
- **Type**: Single value
- **Key event**: `product_view`
- **Value column**: `product_id`
- **Data type**: String
- **Duration**: 1 day

### List Attribute
Stores a list of values (deduplicated).

**Example: Browsed products**
- **Name**: `browsed_products`
- **Type**: List
- **Key event**: `product_view`
- **ID column**: `product_id`
- **Max items**: 100
- **Aggregations**:
  - Name: `items`
  - Identifier: `items`
  - Column: `product_id`
  - Type: distinct_list
- **Duration**: 60 days

### Counter Attribute
Counts occurrences of events.

**Example: Page views in 24 hours**
- **Name**: `page_views_24h`
- **Type**: Counter
- **Key event**: `product_view`
- **Counter type**: Total
- **Increment**: Constant 1
- **Duration**: 24 hours

### Lookup Catalog Attribute
Joins with batch data tables.

**Example: Product details**
- **Name**: `product_catalog_lookup`
- **Type**: Lookup catalog
- **Catalog table**: `products_master`
- **Lookup key column**: `product_id`
- **Return columns**: `name`, `price`, `category`

### Import Batch Attribute
Uses pre-computed values from parent segment.

**Example: Customer loyalty tier**
- **Name**: `loyalty_tier`
- **Type**: Import batch
- **Source column**: Parent segment's `loyalty_tier` column

## 1.5 Set Up ID Stitching

Configure how RT merges user profiles across different identifiers.

**In the Realtime configuration UI:**

1. Click **ID Stitching Settings**
2. Add stitching keys:

**Example configuration:**
```
Stitching keys:
- td_client_id (cookie-based)
- email (validated with regex: ^[^@]+@[^@]+\.[^@]+$)
- user_id (member ID)

Profile key: user_id (canonical identifier)

Invalid values to exclude:
- "unknown"
- "null"
- "undefined"
```

**How ID stitching works:**

```
Event 1: td_client_id=abc123
Event 2: td_client_id=abc123, email=user@example.com
Event 3: email=user@example.com, user_id=USER_001

→ All three events merge into canonical profile: USER_001
```

3. Click **Save**

## 1.6 Wait for RT Status "OK"

After configuration, RT needs to initialize:

1. Check RT status in the parent segment overview
2. Wait for status to change from **"Updating"** to **"OK"**
3. Typical wait time: 30-90 seconds

**Using tdx CLI to check status:**
```bash
tdx ps rt list --json | jq -r '.[] | select(.name=="<ps_name>") | .status'
```

Expected: `"ok"`

## Verification Checklist

Before proceeding to Step 2, verify:

- [ ] Event table added and visible in RT configuration
- [ ] At least one key event created
- [ ] RT attributes created (single/list/counter as needed)
- [ ] ID stitching keys configured with profile key selected
- [ ] RT status shows **"OK"** (not "updating" or "error")

## Troubleshooting

**RT status stuck on "updating":**
- Wait up to 5 minutes
- Refresh the page
- Check for validation errors in the UI

**Event table not visible:**
- Verify streaming events are ingesting (`SELECT * FROM <table> LIMIT 10`)
- Check table is not a batch table (must be streaming)

**Key event not triggering:**
- Verify event filters match actual event data
- Use exact column names and values (case-sensitive)
- Test with a simple filter first, then add complexity

**Attributes not populating:**
- Check RT status is "OK"
- Verify events are arriving after RT configuration
- Wait 1-2 minutes for first events to process
- Query identity logs to verify event processing

## Related Skills

- `rt-config` - RT configuration automation
- `rt-config-events` - Event table and key event management
- `rt-config-attributes` - RT attribute creation
- `rt-config-id-stitching` - ID stitching setup

---

**Next:** [Step 2: Configure Personalization Service](02-configure-personalization.md)
