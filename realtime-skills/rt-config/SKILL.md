---
name: rt-config
description: Configure RT 2.0 (Real-Time Personalization) for parent segments including event tables, key events, RT attributes, and ID stitching using tdx ps rt commands or API
---

# RT 2.0 Configuration Setup Skill

**Skill ID**: `tdx-skills:rt-config`
**Version**: 2.1.0
**Category**: CDP Real-Time Configuration
**Commands Used**: `tdx ps rt`, `tdx ps pz`, `tdx ps`, `tdx api`

## Description

Guides users through complete RT 2.0 (Real-Time Personalization) core configuration setup including keyColumns, eventTables, batchAttributes, and extLookupKey. This is the foundation required for both RT Triggers and RT Personalization implementations.

## When to Use This Skill

Use this skill when you need to:
- Set up RT 2.0 for the first time on a parent segment
- Configure real-time events, attributes, and ID stitching
- Validate RT 2.0 enablement status
- Pull existing RT configuration for modification
- Initialize RT configuration from scratch

**User Intent Patterns**:
- "Set up RT 2.0 configuration"
- "Configure real-time personalization for my parent segment"
- "Initialize RT 2.0"
- "Check if RT is enabled"
- "Pull my RT configuration"

## Prerequisites

Before running this skill, ensure:
1. **TD CLI Installed**: `tdx` command available
2. **Authenticated**: `tdx auth setup` completed
3. **Parent Segment Created**: Parent segment must exist in Data Workbench
4. **Streaming Event Tables**: Event tables configured and receiving data
5. **Master API Key**: Full permissions required for RT configuration

## Skill Instructions

When this skill is invoked, follow these steps systematically:

**Important Note on Commands**:
This skill uses `tdx` CLI commands where available. If a command is not available in your version of tdx, the skill provides API fallback options using `tdx api request`. Always prefer CLI commands when available as they provide better error handling and user experience.

---

### Phase 1: Discovery & Requirements Gathering

#### Step 1.1: Gather Parent Segment Information

Use `AskUserQuestion` to collect:

**Question 1**: "Which parent segment do you want to enable RT 2.0 for?"
- **Header**: "Parent Segment"
- **Options**:
  - **List segments**: "Show me all parent segments" (run `tdx ps list`)
  - **I know the ID**: "I have the parent segment ID"
  - **I know the name**: "I have the parent segment name"

**Question 2**: "What is your use case for RT 2.0?"
- **Header**: "Use Case"
- **Options**:
  - **Triggers**: "Real-time event triggers and activations"
  - **Personalization**: "Real-time personalization responses"
  - **Both**: "Both triggers and personalization"

Store the responses for later use.

#### Step 1.2: Validate Parent Segment Exists

Run the appropriate command based on user input:

```bash
# If user provided ID
tdx ps list --json | jq '.[] | select(.id=="<PARENT_SEGMENT_ID>")'

# If user provided name
tdx ps list --json | jq '.[] | select(.name=="<PARENT_SEGMENT_NAME>")'
```

**Validation**:
- ✅ If found: Extract `id` and `name` for use in next steps
- ❌ If not found: Inform user and suggest running `tdx ps list` to see available segments

---

### Phase 2: Check RT 2.0 Enablement Status

#### Step 2.1: Check Current RT Status

Run:
```bash
tdx ps view <PARENT_SEGMENT_ID> --json
```

**Expected Responses**:

**Response 1: RT Enabled** ✅
```json
{
  "parent_segment_id": "1069944",
  "parent_segment_name": "RT_Lab_ACME_EV_00",
  "realtime_enabled": true,
  "realtime_config_exists": true,
  "status": "enabled"
}
```
→ **Action**: Skip to Phase 3 (configuration already exists)

**Response 2: RT Not Enabled** ⚠️
```json
{
  "parent_segment_id": "1069944",
  "realtime_enabled": false,
  "realtime_config_exists": false,
  "status": "disabled",
  "message": "RT 2.0 is not enabled. Contact CSM to enable RT 2.0 for this parent segment."
}
```
→ **Action**: Proceed to Step 2.2 (CSM enablement required)

#### Step 2.2: Generate CSM Enablement Request (if needed)

If RT is not enabled, generate a CSM request:

```markdown
# CSM Enablement Request Template

Subject: Request to Enable RT 2.0 for Parent Segment

Hello CSM Team,

Please enable RT 2.0 (Real-Time Personalization) for the following parent segment:

**Parent Segment Details:**
- Parent Segment ID: {PARENT_SEGMENT_ID}
- Parent Segment Name: {PARENT_SEGMENT_NAME}
- Region: {REGION} (from tdx context or user input)
- Environment: production

**Use Case:**
{USER_USE_CASE}

**Requirements:**
- Please enable RT 2.0 feature
- Provide Reactor Instance ID for configuration
- Confirm enablement completion

**Expected Timeline:**
Please confirm estimated timeline for enablement.

Thank you!
```

**Action**:
- Save this to `csm_rt_enablement_request.md`
- Inform user: "RT 2.0 is not yet enabled. I've created a CSM enablement request template. Please send this to your CSM and re-run this skill after enablement is confirmed."
- **STOP HERE** until RT is enabled

---

### Phase 3: Initialize or Pull Configuration

Now that RT is enabled, decide whether to:
- Initialize a new configuration (if none exists)
- Pull existing configuration (if it exists)

#### Step 3.1: Check if Configuration Exists

From Phase 2 status check, if `realtime_config_exists: true`:

**View Existing Configuration** (Recommended)
```bash
tdx ps view <PARENT_SEGMENT_ID> --json
```

This will show the current RT configuration including:
- Event tables
- Key columns and profile key
- Key events (use separate API call to get details)
- RT attributes (use separate API call to get details)

If `realtime_config_exists: false`:

**Option C: Initialize New Configuration**
```bash
tdx ps pz init <PARENT_SEGMENT_ID> -o rt_config_<PARENT_SEGMENT_ID>.yaml
```

This creates a template YAML file with sample events, attributes, and ID stitching.

---

### Phase 4: Intelligent Discovery & Configuration

#### Step 4.1: Discover Available Data Sources

**Important**: RT 2.0 uses two data layers:
- **Batch Layer**: Attributes from Parent Segment (pre-computed, updated on schedule)
- **Realtime Layer**: Columns from streaming event tables (live data)

First, discover what data is available:

**Discover Databases**:
```bash
# List all databases
tdx databases --json
# or
tdx database list --json

# API fallback (if tdx CLI not available):
# tdx api /v3/database/list --type td
```

**Question**: "Which database contains your streaming event data?"
- **Header**: "Database"
- **Options**:
  - **Show databases**: "List all available databases"
  - **I know the name**: "I'll enter the database name"

Store the database name as `{EVENT_DATABASE}`.

---

#### Step 4.2: Intelligent Event Table Discovery

Once database is identified, search for common event table patterns:

```bash
# List all tables in the database
tdx tables "{EVENT_DATABASE}.*" --json > tables.json
# or
tdx table list "{EVENT_DATABASE}.*" --json > tables.json

# API fallback (if tdx CLI not available):
# tdx api "/v3/table/list/{EVENT_DATABASE}" --type td > tables.json

# Search for common event table patterns
cat tables.json | jq -r '.[] | .table_name // .name' | grep -E '(pageview|page_view|formfill|form_fill|add_to_cart|cart|purchase|order|click|event|activity|interaction|behavior)' > potential_event_tables.txt
```

**Common Event Table Patterns**:
- `pageviews`, `page_view`, `pv` - Website page views
- `formfills`, `form_fill`, `form_submission` - Form submissions
- `add_to_cart`, `cart_add`, `cart_events` - Shopping cart actions
- `purchase`, `order`, `transaction` - Purchase/order events
- `clicks`, `click_events` - Click tracking
- `events`, `tracking_events` - Generic event tracking
- `user_activity`, `user_events` - User activity logs

**Present to User**:

If potential event tables found:
```
Found {COUNT} potential event tables in database '{EVENT_DATABASE}':
  1. pageviews (12.5M rows, last updated: 2 minutes ago)
  2. formfills (340K rows, last updated: 5 minutes ago)
  3. add_to_cart (89K rows, last updated: 1 minute ago)
  4. purchase (23K rows, last updated: 3 minutes ago)
```

**Question**: "Which event tables should RT 2.0 track?"
- **Header**: "Event Tables"
- **multiSelect**: true
- **Options**: (Dynamically generated from discovery)
  - For each discovered table: "{table_name} - {description based on name pattern}"
  - **Other tables**: "I want to use different tables"

If no potential tables found or user selects "Other tables":
- Ask for table names manually

---

#### Step 4.3: Discover Event Table Schemas

For each selected event table, get the schema to discover available columns:

```bash
# Get table schema
tdx describe {EVENT_DATABASE}.{TABLE_NAME} --json > {TABLE_NAME}_schema.json
# or
tdx desc {EVENT_DATABASE}.{TABLE_NAME} --json > {TABLE_NAME}_schema.json

# API fallback (if tdx CLI not available):
# tdx api "/v3/table/show/{EVENT_DATABASE}/{TABLE_NAME}" --type td > {TABLE_NAME}_schema.json

# Alternative: Query table to discover columns
tdx query "SELECT * FROM {EVENT_DATABASE}.{TABLE_NAME} LIMIT 1" --format json | jq -r '.[0] | keys' > {TABLE_NAME}_columns.txt
```

**Example Output**:
```
td_client_id (string)
email (string)
user_id (string)
canonical_id (string)
event_name (string)
td_path (string)
td_url (string)
product_id (string)
product_name (string)
product_category (string)
price (double)
quantity (int)
time (long)
```

**Present Schema to User**:
```
Table: {TABLE_NAME}
Available columns ({COUNT}):
  - td_client_id (string) - Recommended for ID stitching
  - email (string) - Recommended for ID stitching
  - canonical_id (string) - Recommended as primary key
  - product_id (string) - Useful for RT attributes
  - product_name (string) - Useful for RT attributes
  - price (double) - Useful for RT attributes
  - ...
```

For each event table, ask:
- **Event name**: What should this event be called in RT? (e.g., "page_view", "add_to_cart")
- **Event filter** (optional): Only process rows matching regex pattern?
  - For pageviews: "^/product/.*" (only product page views)
  - For cart events: None (process all)

---

#### Step 4.4: Discover Batch Layer Attributes (Parent Segment)

Get existing attributes from the parent segment:

```bash
# Get parent segment attributes (batch layer)
tdx ps view {PARENT_SEGMENT_ID} --json | jq '.attributes[] | {name, type, description}' > batch_attributes.json

# API fallback (if tdx CLI not available):
# tdx api "/audiences/{PARENT_SEGMENT_ID}" --type cdp | jq '.attributes[] | {name, type, description}' > batch_attributes.json
```

**Example Output**:
```json
[
  {"name": "canonical_id", "type": "string", "description": "Master customer ID"},
  {"name": "email", "type": "string", "description": "Primary email"},
  {"name": "first_name", "type": "string", "description": "First name"},
  {"name": "last_name", "type": "string", "description": "Last name"},
  {"name": "loyalty_tier", "type": "string", "description": "VIP, Gold, Silver, Bronze"},
  {"name": "total_purchase_value", "type": "double", "description": "Lifetime purchase value"},
  {"name": "city", "type": "string", "description": "City"},
  {"name": "country", "type": "string", "description": "Country"}
]
```

**Present to User**:
```
Batch Layer Attributes from Parent Segment ({COUNT} available):

These are pre-computed attributes updated on schedule.
Best for: Demographics, customer tier, lifetime values

Available attributes:
  ✓ canonical_id - Master customer ID
  ✓ loyalty_tier - VIP/Gold/Silver/Bronze tier
  ✓ total_purchase_value - Lifetime purchase value
  ✓ city, country - Geographic data
  ✓ ...
```

---

#### Step 4.5: Intelligent Attribute Recommendations

Based on the user's use case (from Phase 1), recommend relevant attributes:

**Use Case: Product Recommendations**
```
Recommended Batch Attributes:
  - loyalty_tier (for personalized recommendations)
  - total_purchase_value (for high-value customer treatment)

Recommended Realtime Attributes:
  - last_product_viewed (single) from product_id column
  - browsed_products_list (list) from product_id column
  - browsed_categories (list) from product_category column
  - page_views_24h (counter) from pageview events
```

**Use Case: Cart Abandonment**
```
Recommended Batch Attributes:
  - email (for sending reminders)
  - first_name (for personalization)

Recommended Realtime Attributes:
  - cart_items_list (list) from product_id column in add_to_cart events
  - cart_value (single, sum) from price column
  - cart_item_count (counter) from add_to_cart events
  - last_cart_update (single) from time column
```

**Use Case: Event Triggers**
```
Recommended Batch Attributes:
  - email (for activations)
  - canonical_id (for matching in external systems)
  - loyalty_tier (for conditional routing)

Recommended Realtime Attributes:
  - purchase_amount (single) from price column
  - product_purchased (single) from product_id column
  - purchase_count_30d (counter) from purchase events
```

**Present Recommendations**:

**Question**: "I've analyzed your use case and data. Here are my recommendations for attributes:"

Show recommendations with explanations:
```
Based on your use case: {USE_CASE}

Batch Layer (from Parent Segment):
  ✓ loyalty_tier - For personalized treatment
  ✓ email - For communication
  ✓ total_purchase_value - For high-value customer identification

Realtime Layer (from event tables):
  ✓ last_product_viewed - Latest product viewed (for recommendations)
  ✓ browsed_products_list - Products viewed in last 60 days (for recommendations)
  ✓ page_views_24h - Activity indicator (for engagement scoring)

Do you want to use these recommendations?
```

Options:
- **Use recommendations**: "Yes, use these attributes"
- **Customize**: "I want to add/remove attributes"
- **Start from scratch**: "I'll select attributes manually"

---

#### Step 4.6: Gather ID Stitching Keys

Discover potential stitching keys from event table schemas:

**Common Stitching Key Patterns**:
- `td_client_id` - Cookie-based ID (always recommended)
- `email` - Email address
- `user_id`, `customer_id` - Custom user IDs
- `canonical_id` - Master customer ID (best as primary key)
- `phone`, `mobile` - Phone numbers
- `external_id` - External system IDs

**Search Event Table Schemas**:
```bash
# Find ID-like columns across all event tables
for table in {SELECTED_EVENT_TABLES}; do
  tdx tables desc {EVENT_DATABASE} $table --json | \
    jq -r '.columns[] | select(.name | test("id|email|phone|canonical")) | .name'
done | sort -u
```

**Present Discovered Keys**:
```
Discovered potential ID stitching keys:
  ✓ td_client_id (found in: pageviews, add_to_cart, purchase)
  ✓ email (found in: pageviews, formfills, purchase)
  ✓ canonical_id (found in: purchase)
  ✓ user_id (found in: pageviews, add_to_cart)
```

**Question**: "Which columns should be used for ID stitching?"
- **Header**: "Stitching Keys"
- **multiSelect**: true
- **Options**: (Dynamically generated from discovered keys)
  - For each discovered key with recommendation
  - Example: "td_client_id - Cookie-based ID (✓ Recommended)"
  - Example: "canonical_id - Master customer ID (✓ Recommended as primary key)"
  - Example: "email - Email address"

**Recommendation Logic**:
- ✅ Always recommend: `td_client_id` (cookie-based, available in most events)
- ✅ Recommend as primary key: `canonical_id` (if exists in parent segment)
- ✅ Recommend: `email` (if available and not too sparse)
- ⚠️ Caution: `user_id` (may be null for anonymous users)

For each key selected, ask:
- Should this be the **primary key**? (Yes/No)
  - Note: Primary key must be unique, stable, and present for most users
  - Recommendation: {CANONICAL_ID or most complete key}
- Exclude regex pattern? (Optional - e.g., "^test_.*" to filter test users)

---

#### Step 4.7: Configure Batch Attributes (Parent Segment Layer)

**Question**: "Which batch attributes from parent segment should be included?"
- **Header**: "Batch Attributes"
- **multiSelect**: true
- **Options**: (Dynamically from batch_attributes.json discovered in Step 4.4)
  - Show each attribute with description
  - Mark recommended attributes based on use case

**Example Options**:
```
✓ loyalty_tier - Customer tier (Recommended for your use case)
✓ email - Email address (Recommended for activations)
  total_purchase_value - Lifetime value
  city - City
  country - Country
  first_name - First name
  last_name - Last name
```

**Guidance**:
- Batch attributes are updated on schedule (hourly/daily)
- Best for: Demographics, customer tiers, lifetime metrics
- Limitations: Not real-time, updated per parent segment schedule

---

#### Step 4.8: Configure Real-Time Attributes (Event Table Layer)

**Question**: "Do you want to create real-time attributes from event data?"
- **Header**: "RT Attributes"
- **Options**:
  - **Use recommendations**: "Yes, use recommended attributes for my use case"
  - **Customize**: "I want to customize the attributes"
  - **Skip**: "Skip for now, I'll add later"

**If "Use recommendations"**, automatically configure recommended attributes from Step 4.5.

**If "Customize"**, for each attribute ask:

**Attribute Name**: (e.g., "last_product_viewed")

**Attribute Type**:
- **single**: Latest value
  - Example: `last_product_viewed` from product_id column
  - Use when: You want the most recent value
  - Aggregation options: first, last, sum, min, max

- **list**: Array of values with expiry
  - Example: `browsed_products_list` from product_id column (last 60 days)
  - Use when: You want history of values
  - Settings: max_items (default 100), expiry_days (default 60)
  - Aggregation options: distinct_list, first, last

- **counter**: Event count or sum
  - Example: `page_views_24h` counting pageview events in 24 hours
  - Use when: You want to count events or sum values
  - Settings: window_duration (24h, 7d, 30d, or custom)
  - Aggregation options: count, sum

**Source Event**: Which event provides this data?
- **Options**: (List of configured events)

**Source Field**: Which column has the value?
- **Options**: (List of columns from selected event table schema)
- Show column type to help user select appropriate field

**Sensitivity**:
- **sensitive**: Excluded from API responses (PII)
  - Example: email, phone, SSN
- **non-sensitive**: Included in API responses
  - Example: product_id, category, page_views

**Aggregation Logic**: (Based on type selected)

**For Single Attributes**:
- `last` - Most recent value (most common)
- `first` - First value seen
- `sum` - Sum of values
- `min` - Minimum value
- `max` - Maximum value

**For List Attributes**:
- `distinct_list` - Unique values (most common)
- `first` - First N values
- `last` - Last N values

**For Counter Attributes**:
- `count` - Count events
- `sum` - Sum a field value

**Example Attribute Configurations**:

```yaml
# Example 1: Last product viewed (Single)
- name: last_product_viewed
  type: single
  source_event: product_view
  source_field: product_id
  sensitivity: non-sensitive
  aggregation: last

# Example 2: Browsed products (List)
- name: browsed_products_list
  type: list
  source_event: product_view
  source_field: product_id
  sensitivity: non-sensitive
  aggregation: distinct_list
  max_items: 100
  expiry_days: 60

# Example 3: Page views in 24h (Counter)
- name: page_views_24h
  type: counter
  source_event: page_view
  sensitivity: non-sensitive
  aggregation: count
  window_duration: 24h

# Example 4: Cart value (Single, Sum)
- name: cart_value
  type: single
  source_event: add_to_cart
  source_field: price
  sensitivity: non-sensitive
  aggregation: sum
```

**Summary of Configured Attributes**:
```
Batch Layer (from Parent Segment):
  - loyalty_tier
  - email
  - total_purchase_value

Realtime Layer (from Event Tables):
  - last_product_viewed (single)
  - browsed_products_list (list)
  - page_views_24h (counter)
  - cart_value (single, sum)
```

---

#### Step 4.9: Configuration Summary

Before proceeding, summarize the configuration to user:

```
=== RT 2.0 Configuration Summary ===

Database: {EVENT_DATABASE}

Event Tables ({COUNT}):
  1. {TABLE_NAME} → Event: {EVENT_NAME}
  2. {TABLE_NAME} → Event: {EVENT_NAME}
  ...

ID Stitching Keys ({COUNT}):
  - Primary Key: {PRIMARY_KEY}
  - Stitching Keys: {KEY1}, {KEY2}, {KEY3}

Batch Layer Attributes ({COUNT}):
  (From Parent Segment - Updated on schedule)
  - {ATTRIBUTE_1}
  - {ATTRIBUTE_2}
  ...

Realtime Layer Attributes ({COUNT}):
  (From Event Tables - Updated in real-time)
  - {RT_ATTRIBUTE_1} (single) from {SOURCE_FIELD}
  - {RT_ATTRIBUTE_2} (list) from {SOURCE_FIELD}
  - {RT_ATTRIBUTE_3} (counter)
  ...

Total Attributes: {BATCH_COUNT} batch + {RT_COUNT} realtime = {TOTAL_COUNT}
```

**Question**: "Does this configuration look correct?"
- **Yes, proceed**: Generate YAML
- **No, let me modify**: Go back to adjust settings

---

### Phase 5: Generate Configuration YAML

Based on gathered requirements, generate a complete RT configuration YAML:

```yaml
# RT 2.0 Configuration for Parent Segment: {PARENT_SEGMENT_NAME}
# Generated: {TIMESTAMP}

parent_segment_id: "{PARENT_SEGMENT_ID}"
parent_segment_name: "{PARENT_SEGMENT_NAME}"

# Event Tables - Streaming tables to track
events:
  - name: "{EVENT_NAME}"
    database: "{DATABASE_NAME}"
    table: "{TABLE_NAME}"
    filter:
      field: "td_path"
      pattern: "{REGEX_PATTERN}"
    description: "{EVENT_DESCRIPTION}"

# Real-Time Attributes
attributes:
  # Single Attributes - Latest value
  - name: "{ATTRIBUTE_NAME}"
    type: "single"
    source_event: "{EVENT_NAME}"
    source_field: "{FIELD_NAME}"
    sensitivity: "non-sensitive"  # or "sensitive" for PII
    aggregation: "last"  # first, last, sum, min, max
    description: "{DESCRIPTION}"

  # List Attributes - Array with expiry
  - name: "{LIST_ATTRIBUTE_NAME}"
    type: "list"
    source_event: "{EVENT_NAME}"
    source_field: "{FIELD_NAME}"
    sensitivity: "non-sensitive"
    aggregation: "distinct_list"
    max_items: 100
    expiry_days: 60
    description: "{DESCRIPTION}"

  # Counter Attributes - Event counts
  - name: "{COUNTER_ATTRIBUTE_NAME}"
    type: "counter"
    source_event: "{EVENT_NAME}"
    sensitivity: "non-sensitive"
    window_duration: "24h"  # 24h, 7d, 30d
    aggregation: "count"  # or "sum" for summing a field
    description: "{DESCRIPTION}"

  # Imported Batch Attributes - From parent segment
  - name: "{BATCH_ATTRIBUTE_NAME}"
    type: "imported_batch"
    source: "parent_segment"
    sensitivity: "non-sensitive"
    description: "{DESCRIPTION}"

# ID Stitching Configuration
id_stitching:
  primary_key: "{PRIMARY_KEY}"  # Must be unique and stable
  stitching_keys:
    - name: "td_client_id"
      exclude_regex: "^test_.*"
    - name: "email"
      exclude_regex: ".*@(test|example)\\.com$"
    - name: "{CUSTOM_KEY}"
      workflow_only: false  # true = batch-only, false = real-time
  ext_lookup_key: "{EXTERNAL_LOOKUP_KEY}"  # Optional
```

Save this to `rt_config_<PARENT_SEGMENT_ID>.yaml`

---

### Phase 6: Validate Configuration

Before pushing, validate the configuration:

```bash
tdx ps rt validate rt_config_<PARENT_SEGMENT_ID>.yaml
```

**Expected Output**:
```
✅ Configuration is valid

Validation Results:
  ✓ Parent segment ID exists
  ✓ All event tables are accessible
  ✓ All attributes have valid types
  ✓ ID stitching has primary key
  ✓ No duplicate attribute names
  ✓ Regex patterns are valid

Warnings:
  ⚠ event 'page_view' has no filter - will process all rows
  ⚠ attribute 'email' is marked non-sensitive - consider marking as sensitive

Ready to push!
```

**If validation fails**:
- Review error messages
- Edit YAML file to fix issues
- Re-run validation

---

### Phase 7: Execute Configuration (Push to TD via API)

Now **actually create** the RT configuration in Treasure Data using direct API calls:

**Important**: Use `tdx ps push` to push the full parent segment configuration including RT settings. Alternatively, use direct API calls for programmatic control.

#### Step 7.1: Show Configuration Summary

Display what will be created:
```
=== RT Configuration to be Created ===

Parent Segment: {PARENT_SEGMENT_NAME} ({PARENT_SEGMENT_ID})

Event Tables: {COUNT}
  ✓ {EVENT_1} from {DATABASE}.{TABLE}
  ✓ {EVENT_2} from {DATABASE}.{TABLE}

ID Stitching Keys: {COUNT}
  ✓ Primary Key: {PRIMARY_KEY}
  ✓ Stitching Keys: {KEY_1}, {KEY_2}, {KEY_3}

Key Events: {COUNT}
  ✓ {EVENT_1} (from {TABLE_1})
  ✓ {EVENT_2} (from {TABLE_2})

Realtime Attributes: {COUNT}
  ✓ {RT_ATTR_1} (single) from {EVENT}.{FIELD}
  ✓ {RT_ATTR_2} (list) from {EVENT}.{FIELD}
  ✓ {RT_ATTR_3} (counter) from {EVENT}

Total: {EVENT_TABLE_COUNT} event tables, {KEY_EVENT_COUNT} key events, {ATTR_COUNT} attributes
```

#### Step 7.2: Confirm with User

**Question**: "Ready to create this RT configuration in Treasure Data?"
- **Options**:
  - **Create now**: Push configuration immediately via API
  - **Save YAML for reference**: Save to file for documentation
  - **Cancel**: Don't create yet

#### Step 7.3: Execute API Calls

If user confirms, **execute the configuration via API**:

```bash
echo "=== Creating RT Configuration via API ==="
echo ""

# Step 1: Configure Event Tables
echo "Step 1/4: Configuring event tables..."
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_setting" --type cdp -X PATCH --data '{
  "eventTables": [
    {"database": "{DATABASE}", "table": "{TABLE_1}"},
    {"database": "{DATABASE}", "table": "{TABLE_2}"}
  ]
}'

if [ $? -eq 0 ]; then
  echo "✓ Event tables configured"
else
  echo "❌ Failed to configure event tables"
  exit 1
fi

echo ""

# Step 2: Configure Key Columns and Profile Key
echo "Step 2/4: Configuring ID stitching keys..."
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_setting" --type cdp -X PATCH --data '{
  "keyColumns": [
    {"name": "{KEY_1}", "validRegexp": null, "invalidTexts": [], "internal": false},
    {"name": "{KEY_2}", "validRegexp": null, "invalidTexts": [], "internal": false},
    {"name": "{KEY_3}", "validRegexp": null, "invalidTexts": [], "internal": false}
  ],
  "extLookupKey": "{PRIMARY_KEY}"
}'

if [ $? -eq 0 ]; then
  echo "✓ ID stitching keys configured"
else
  echo "❌ Failed to configure key columns"
  exit 1
fi

echo ""

# Wait for processing
echo "Waiting for RT infrastructure to process (5 seconds)..."
sleep 5

# Step 3: Create Key Events
echo "Step 3/4: Creating key events..."

# Create event 1
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_key_events" --type cdp -X POST --data '{
  "name": "{EVENT_NAME_1}",
  "databaseName": "{DATABASE}",
  "tableName": "{TABLE_1}",
  "description": "{EVENT_1_DESCRIPTION}",
  "filterRule": {"type": "And", "conditions": []}
}' > /dev/null

# Create event 2
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_key_events" --type cdp -X POST --data '{
  "name": "{EVENT_NAME_2}",
  "databaseName": "{DATABASE}",
  "tableName": "{TABLE_2}",
  "description": "{EVENT_2_DESCRIPTION}",
  "filterRule": {"type": "And", "conditions": []}
}' > /dev/null

# Get key event IDs
KEY_EVENT_IDS=$(tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_key_events" --type cdp | jq -r '.data[] | .id' | tr '\n' ' ')
echo "✓ Key events created: $KEY_EVENT_IDS"

echo ""

# Step 4: Create RT Attributes
echo "Step 4/4: Creating RT attributes..."

# For each attribute, create via API
# Example: Single attribute
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_attributes" --type cdp -X POST --data '{
  "name": "{ATTR_NAME}",
  "identifier": "{ATTR_IDENTIFIER}",
  "type": "single",
  "description": "{ATTR_DESCRIPTION}",
  "realtimeKeyEventId": "{KEY_EVENT_ID}",
  "valueColumn": "{COLUMN_NAME}",
  "dataType": "string",
  "duration": {"value": 1, "unit": "day"}
}' > /dev/null

# Example: List attribute
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_attributes" --type cdp -X POST --data '{
  "name": "{LIST_ATTR_NAME}",
  "identifier": "{LIST_ATTR_IDENTIFIER}",
  "type": "list",
  "description": "{LIST_ATTR_DESCRIPTION}",
  "realtimeKeyEventId": "{KEY_EVENT_ID}",
  "valueColumn": "{COLUMN_NAME}",
  "dataType": "string",
  "idColumn": "{COLUMN_NAME}",
  "maxItems": 100,
  "aggregations": [
    {
      "name": "items",
      "identifier": "items",
      "column": "{COLUMN_NAME}",
      "aggregationType": "distinct_list"
    }
  ],
  "duration": {"value": 60, "unit": "day"}
}' > /dev/null

# Example: Counter attribute
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_attributes" --type cdp -X POST --data '{
  "name": "{COUNTER_ATTR_NAME}",
  "identifier": "{COUNTER_ATTR_IDENTIFIER}",
  "type": "counter",
  "description": "{COUNTER_ATTR_DESCRIPTION}",
  "realtimeKeyEventId": "{KEY_EVENT_ID}",
  "counterType": "total",
  "increment": {"type": "const", "value": 1},
  "duration": {"value": 24, "unit": "hour"}
}' > /dev/null

echo "✓ RT attributes created"

echo ""
echo "✅ All configuration steps completed successfully!"
```

**API Schemas for RT Attributes**:

**Single Attribute**:
```json
{
  "name": "attribute_name",
  "identifier": "attribute_identifier",
  "type": "single",
  "description": "description",
  "realtimeKeyEventId": "810",
  "valueColumn": "column_name",
  "dataType": "string",
  "duration": {"value": 1, "unit": "day"}
}
```

**List Attribute**:
```json
{
  "name": "list_attribute",
  "identifier": "list_attribute",
  "type": "list",
  "description": "description",
  "realtimeKeyEventId": "810",
  "valueColumn": "column_name",
  "dataType": "string",
  "idColumn": "column_name",
  "maxItems": 100,
  "aggregations": [
    {
      "name": "items",
      "identifier": "items",
      "column": "column_name",
      "aggregationType": "distinct_list"
    }
  ],
  "duration": {"value": 60, "unit": "day"}
}
```

**Counter Attribute**:
```json
{
  "name": "counter_attribute",
  "identifier": "counter_attribute",
  "type": "counter",
  "description": "description",
  "realtimeKeyEventId": "810",
  "counterType": "total",
  "increment": {"type": "const", "value": 1},
  "duration": {"value": 24, "unit": "hour"}
}
```

#### Step 7.4: Verify Configuration Created

After successful API calls, **verify** the configuration:

```bash
echo "=== Verification ==="
echo ""

# Check RT status
echo "1. RT Status:"
tdx ps view {PARENT_SEGMENT_ID} --json | jq '{
  config_id: .realtime_config.id,
  status: .realtime_config.status,
  event_tables: (.realtime_config.eventTables | length),
  key_columns: (.realtime_config.keyColumns | length),
  profile_key: .realtime_config.extLookupKey
}'

echo ""
echo "2. Key Events:"
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_key_events" --type cdp | jq '.data[] | {id, name, table: .tableName}'

echo ""
echo "3. RT Attributes:"
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_attributes?page[size]=100" --type cdp | jq '{
  total: (.data | length),
  single: [.data[] | select(.type=="single") | .name],
  list: [.data[] | select(.type=="list") | .name],
  counter: [.data[] | select(.type=="counter") | .name]
}'
```

**Expected Output**:
```json
{
  "config_id": "290",
  "status": "ok",
  "event_tables": 2,
  "key_columns": 3,
  "profile_key": "canonical_id"
}
```

**Verification Checklist**:
- ✅ Status: "ok" or "updating"
- ✅ All event tables configured
- ✅ All key events created
- ✅ All RT attributes created
- ✅ ID stitching keys set
- ✅ Profile key configured

#### Step 7.5: Display Success Summary

```
✅ RT Configuration Created Successfully!

Summary:
  - Parent Segment: {PARENT_SEGMENT_NAME} ({PARENT_SEGMENT_ID})
  - Event Tables: {COUNT} configured
  - Key Events: {COUNT} created
  - Realtime Attributes: {COUNT} created
    - Single: {SINGLE_COUNT}
    - List: {LIST_COUNT}
    - Counter: {COUNTER_COUNT}
  - ID Stitching: {KEY_COUNT} keys configured
  - Primary Key: {PRIMARY_KEY}
  - Status: {STATUS}

Configuration Details:
  ✓ Events: {EVENT_NAMES}
  ✓ Attributes: {ATTRIBUTE_NAMES}
  ✓ Keys: {KEY_NAMES}

View in TD Console:
  {CONSOLE_URL}/app/dw/parentSegments/{PARENT_SEGMENT_ID}/realtime

Next Steps:
  1. ✅ RT Configuration: COMPLETE
  2. → RT Triggers: Run tdx-skills:rt-triggers (if needed)
  3. → RT Personalization: Run tdx-skills:rt-personalization (if needed)
```

---

### Phase 8: Verification & Next Steps

#### Step 8.1: Verify Configuration

```bash
# View updated configuration
tdx ps view <PARENT_SEGMENT_ID>

# Or open in browser
tdx ps view <PARENT_SEGMENT_ID> --web
```

#### Step 8.2: Provide Next Steps Guidance

Based on the user's use case from Phase 1:

**If use case = "Triggers"**:
```
✅ RT Configuration Complete!

Next: Set up RT Triggers
→ Run skill: tdx-skills:rt-triggers
→ This will create Journey-based event triggers and activations
```

**If use case = "Personalization"**:
```
✅ RT Configuration Complete!

Next: Set up RT Personalization
→ Run skill: tdx-skills:rt-personalization
→ This will create Personalization services and responses
```

**If use case = "Both"**:
```
✅ RT Configuration Complete!

You can now set up:
1. RT Triggers (Journey-based event triggers)
   → Run skill: tdx-skills:rt-triggers

2. RT Personalization (Personalization responses)
   → Run skill: tdx-skills:rt-personalization

Recommended order: Triggers first, then Personalization
```

#### Step 8.3: Generate Summary Report

Create `RT_CONFIG_SUMMARY.md`:

```markdown
# RT 2.0 Configuration Summary

**Parent Segment**: {PARENT_SEGMENT_NAME} ({PARENT_SEGMENT_ID})
**Configured**: {TIMESTAMP}
**Status**: ✅ ENABLED

## Configuration Details

### Event Tables ({COUNT})
{LIST_OF_EVENTS_WITH_FILTERS}

### Real-Time Attributes ({COUNT})
{LIST_OF_RT_ATTRIBUTES_WITH_TYPES}

### Batch Attributes ({COUNT})
{LIST_OF_BATCH_ATTRIBUTES}

### ID Stitching
- **Primary Key**: {PRIMARY_KEY}
- **Stitching Keys**: {LIST_OF_KEYS}
- **External Lookup Key**: {EXT_LOOKUP_KEY}

## Files Generated
- rt_config_{PARENT_SEGMENT_ID}.yaml
- RT_CONFIG_SUMMARY.md

## Next Steps
{NEXT_STEPS_BASED_ON_USE_CASE}

## Useful Commands
```bash
# View RT configuration
tdx ps view {PARENT_SEGMENT_ID} --json

# List key events
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_key_events" --type cdp

# List RT attributes
tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_attributes" --type cdp

# Check RT processing status
tdx ps view {PARENT_SEGMENT_ID} --json | jq '.realtime_config.status'

# For updates, use direct API calls as shown in Phase 7
# - PATCH /audiences/{PARENT_SEGMENT_ID}/realtime_setting (event tables, key columns)
# - POST /audiences/{PARENT_SEGMENT_ID}/realtime_key_events (key events)
# - POST /audiences/{PARENT_SEGMENT_ID}/realtime_attributes (RT attributes)
```

## Resources
- [RT 2.0 Documentation](https://docs.treasuredata.com/display/public/PD/RT+2.0)
- [Parent Segment Guide](https://docs.treasuredata.com/display/public/PD/Parent+Segments)
```

---

## Error Handling

### Common Errors and Solutions

**Error**: "Parent segment not found"
- **Solution**: Run `tdx ps list` to verify parent segment exists
- **Cause**: Incorrect parent segment ID

**Error**: "RT 2.0 not enabled"
- **Solution**: Contact CSM with enablement request template
- **Cause**: RT 2.0 feature not activated for account

**Error**: "Event table not accessible"
- **Solution**: Verify table exists: `tdx tables list <DATABASE>`
- **Cause**: Table name incorrect or table doesn't exist

**Error**: "Invalid regex pattern"
- **Solution**: Test regex pattern separately, escape special characters
- **Cause**: Malformed regex in event filter

**Error**: "Duplicate attribute name"
- **Solution**: Remove duplicate or rename one attribute
- **Cause**: Same attribute name used multiple times

**Error**: "Primary key not in stitching_keys"
- **Solution**: Add primary key to stitching_keys list
- **Cause**: primary_key must be one of the stitching_keys

---

## Tool Usage Summary

This skill uses the following tools:

- **AskUserQuestion**: Gather configuration requirements
- **Bash**: Run `tdx ps rt`, `tdx ps pz`, `tdx ps` commands, `tdx api` for direct API access
- **Write**: Generate YAML configuration and summary files
- **Read**: Read existing configurations if pulling

---

## Validation Checklist

Before completing this skill, verify:

- ✅ Parent segment exists and is accessible
- ✅ RT 2.0 is enabled (status check passed)
- ✅ Configuration YAML is valid (validation passed)
- ✅ Configuration pushed successfully
- ✅ Verification command shows correct setup
- ✅ Summary report generated
- ✅ Next steps provided to user

---

## Success Criteria

Skill is successful when:
1. RT 2.0 is enabled for the parent segment
2. Configuration YAML is created and validated
3. Configuration is pushed to Treasure Data
4. User can view configuration in TD console or via CLI
5. User understands next steps (Triggers or Personalization)

---

**Version**: 2.1.0
**Last Updated**: February 2026
**Maintained By**: RTAM Team

**Changelog**:
- v2.1.0: Updated to use `tdx ps rt` and `tdx ps pz` commands (previously `tdx rt` and `tdx pz`)
- v2.0.0: Initial API-based RT configuration workflow
