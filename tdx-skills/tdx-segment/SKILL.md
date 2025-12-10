---
name: tdx-segment
description: Manage CDP child segments with tdx CLI using YAML-based configuration for rules and activations. Use when creating segments, setting up audience filters, or configuring data exports to external systems.
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
tdx sg view "High Value Customers"
tdx sg desc "High Value Customers"  # Show schema
tdx sg sql "High Value Customers"  # Get SQL query
tdx sg show "High Value Customers"  # Execute and show results

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
        unit: days
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

**Comparison**: Equal, NotEqual, Greater, GreaterEqual, Less, LessEqual
**List**: In, NotIn
**String**: Contain, StartWith, EndWith, Regexp
**Null**: IsNull
**Time**: TimeWithinPast

## Typical Workflow

```bash
# 1. Pull segments
tdx sg pull "Customer 360"

# 2. Edit or create segment YAML
vim segments/customer-360/vip-customers.yml

# 3. Preview changes
tdx sg push --dry-run

# 4. Push to TD
tdx sg push

# 5. Verify
tdx sg list -r
```

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

- **tdx-skills/tdx-parent-segment** - Manage parent segments and master tables
- **tdx-skills/tdx-basic** - Core tdx CLI operations and global options

## Resources

- Full documentation: https://tdx.treasuredata.com/commands/segment.html
- CDP Guide: https://docs.treasuredata.com/display/PD/Segments
