---
name: segment
description: Manages CDP child segments using `tdx sg` commands with YAML rule configs. Covers filtering with operators (Equal, In, Greater, TimeWithinPast, Contain), folder organization, and activations for Salesforce/Google Ads exports. Use when creating audience segments, validating with `tdx sg push --dry-run`, or listing fields with `tdx sg fields`.
---

# tdx Segment - CDP Child Segment Management

Manage CDP child segments using `tdx segment` (alias: `tdx sg`) with YAML-based configuration.

## What is a Child Segment?

Child segments filter audiences within parent segments using rules and activations:
- Query enriched customer data from parent segment workflows
- Apply filtering rules (e.g., country = 'US' AND age > 25)
- Organize in folder hierarchies
- Export data to external systems via activations

## Core Commands

```bash
# Set parent segment context (required)
tdx sg use "Customer 360"

# List segments
tdx sg list
tdx sg list marketing  # Specific folder
tdx sg list -r  # Recursive tree view

# Pull segments to YAML (auto-sets context)
tdx sg pull "Customer 360"
# Creates: segments/customer-360/*.yml

# Push YAML to Treasure Data
tdx sg push
tdx sg push --dry-run  # Preview changes
tdx sg push --delete  # Delete segments not in local files

# View segment details
tdx sg view "High Value Customers"  # Show segment metadata
tdx sg desc "High Value Customers"  # Show schema/fields

# Check segment data
tdx sg show "High Value Customers"  # Execute query and show sample results

# Get SQL query for segment data access
tdx sg sql "High Value Customers"

# Pipe segment SQL directly to query
tdx sg sql "High Value Customers" | tdx query -

# List available fields
tdx sg fields
```

## YAML Configuration

### Basic Segment

```yaml
name: US Customers
description: All customers in the United States
kind: batch  # batch, realtime, or funnel_stage
visible: true

rule:
  type: And
  conditions:
    - type: Value
      attribute: country
      operator:
        type: Equal
        value: US
```

### Multiple Conditions

```yaml
name: High Value US Customers
kind: batch

rule:
  type: And
  conditions:
    - type: Value
      attribute: country
      operator:
        type: Equal
        value: US
    - type: Value
      attribute: ltv
      operator:
        type: Greater
        value: 1000
```

### OR Logic and IN Operator

```yaml
name: North America Customers
kind: batch

rule:
  type: Or
  conditions:
    - type: Value
      attribute: country
      operator:
        type: In
        value: ["US", "CA", "MX"]
```

### Time-Based Filter

```yaml
name: Recent Purchasers
kind: batch

rule:
  type: And
  conditions:
    - type: Value
      attribute: last_purchase_date
      operator:
        type: TimeWithinPast
        value: 30
        unit: day  # Valid units: year, quarter, month, week, day, hour, minute, second
```

### String Matching

```yaml
name: Gmail Users
kind: batch

rule:
  type: And
  conditions:
    - type: Value
      attribute: email
      operator:
        type: EndWith
        value: "@gmail.com"
```

## Activations (Data Exports)

### Basic Activation

```yaml
activations:
  - name: Daily Salesforce Sync
    description: Sync to SFDC daily
    connection: my-salesforce-connection
    columns:
      - email
      - first_name
      - ltv
    schedule:
      type: daily
      timezone: America/Los_Angeles
```

### Activation with Connector Config

```yaml
activations:
  - name: Salesforce Contact Sync
    connection: salesforce-prod
    columns:
      - email
      - first_name
    schedule:
      type: daily
      timezone: America/Los_Angeles
    connector_config:
      object: Contact
      mode: upsert
      external_id: email
```

### Activation with Notifications

```yaml
activations:
  - name: Critical Data Sync
    connection: my-connection
    columns:
      - email
      - status
    schedule:
      type: hourly
    notification:
      notify_on:
        - onSuccess
        - onFailure
      email_recipients:
        - team@company.com
```

## Supported Operators

See [full operator reference](https://tdx.treasuredata.com/commands/segment.html#supported-operators) for complete details.

### Comparison Operators

- **Equal**: Exact match - `value: "active"`
- **NotEqual**: Not equal - `value: "inactive"`
- **Greater**: Greater than - `value: 1000`
- **GreaterEqual**: Greater or equal - `value: 18`
- **Less**: Less than - `value: 100`
- **LessEqual**: Less or equal - `value: 65`

### List Operators

- **In**: Value in set - `value: ["US", "CA", "MX"]`
- **NotIn**: Value not in set - `value: ["spam", "test"]`

### String Operators

- **Contain**: Contains substring - `value: ["@gmail.com"]`
- **StartWith**: Starts with prefix - `value: ["Premium"]`
- **EndWith**: Ends with suffix - `value: [".com"]`
- **Regexp**: Regex match - `value: "^[A-Z]{2}[0-9]{4}$"`

### Null Operators

- **IsNull**: Field is null - (no value needed)

### Time Operators

- **TimeWithinPast**: Within past N units - `value: 30, unit: day`

**Available time units** (per [CDP API spec](https://api-docs.treasuredata.com/apis/td_cdp_api-public/segments)):
- `year` - Calendar years
- `quarter` - Calendar quarters
- `month` - Calendar months
- `week` - Weeks
- `day` - Days
- `hour` - Hours
- `minute` - Minutes
- `second` - Seconds

**Note**: All operators use unified `value` field. For set-based operators (In, NotIn, Contain, StartWith, EndWith), provide an array. The CLI auto-detects single vs array values.

## Accessing Segment Data

Use `tdx sg sql` to get the exact SQL query that accesses segment data, then pipe to `tdx query` for custom analysis:

```bash
# Quick data check - show sample results directly
tdx sg show "High Value Customers"

# Get the SQL query for segment data
tdx sg sql "High Value Customers"
# Output: SELECT * FROM cdp_audience_xxxxxx.segment_yyyyyy WHERE ...

# Pipe segment SQL directly to tdx query (stdin support)
tdx sg sql "High Value Customers" | tdx query -

# Works with segment name or YAML path
tdx sg sql segments/customer-360/vip.yml | tdx query -

# Add output format options
tdx sg sql "High Value Customers" | tdx query - --json
tdx sg sql "Active Users" | tdx query - --json --output active_users.json
```

## Typical Workflow

```bash
# 1. Pull segments
tdx sg pull "Customer 360"

# 2. Edit or create segment YAML
vim segments/customer-360/vip-customers.yml

# 3. Validate YAML syntax (use validate-segment skill for detailed checks)

# 4. Preview changes
tdx sg push --dry-run

# 5. Push to TD
tdx sg push

# 6. Verify
tdx sg list -r
```

For detailed YAML validation against the CDP API spec, use the **validate-segment** skill.

## Folder Structure

```
segments/customer-360/
├── active-users.yml
├── high-value-customers.yml
├── marketing/
│   └── email-subscribers.yml
└── sales/
    └── enterprise-leads.yml
```

## Important Behaviors

- **Filename collisions**: Sanitized names (lowercase, spaces→hyphens) get numeric suffixes
- **Activation matching**: Matched by name only; renaming creates new activation
- **Segment matching**: Matched by folder + name; moving YAML creates new segment

## Common Issues

### Context Not Set

```bash
tdx sg use "Customer 360"
```

### Field Not Available

```bash
# List available fields
tdx sg fields

# Ensure parent workflow has run
tdx ps run "Customer 360"
```

### Activation Not Working

```bash
# Verify connection exists
tdx connections

# Check activation logs in UI
```

## Related Skills

- **tdx-skills/validate-segment** - Validate segment YAML syntax against CDP API spec
- **tdx-skills/parent-segment** - Manage parent segments and master tables
- **tdx-skills/tdx-basic** - Core tdx CLI operations and global options

## Resources

- Full documentation: https://tdx.treasuredata.com/commands/segment.html
