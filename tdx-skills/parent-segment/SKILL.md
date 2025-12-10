---
name: parent-segment
description: Manages CDP parent segments using `tdx ps` commands with YAML configs. Covers master tables, attributes, behaviors, `tdx ps validate` for join validation, `tdx ps preview` for data preview, and schedule configuration (daily/hourly/cron). Use when creating customer master tables, validating join match rates, or troubleshooting parent segment workflows.
---

# tdx Parent-Segment - CDP Parent Segment Management

Manage CDP parent segments using `tdx parent-segment` (alias: `tdx ps`) with YAML-based configuration.

## What is a Parent Segment?

A parent segment defines the master customer table enriched with:
- **Master table**: Core customer/user records
- **Attributes**: Customer properties (user profiles, account info)
- **Behaviors**: Customer actions (purchases, page views, events)

Parent workflows create output database `cdp_audience_xxx` with enriched `customers` table for child segments.

## Core Commands

```bash
# List parent segments
tdx ps list
tdx ps list "Customer*"  # Filter with pattern

# Pull configuration to YAML (sets context to this parent segment)
tdx ps pull "Customer 360"
# Creates: parent_segments/customer-360.yml
# After pull, context is set, so you can omit parent segment name:

# Push configuration (create/update)
tdx ps push

# Validate configuration
tdx ps validate
tdx ps validate --master
tdx ps validate --attribute "User Profile"
tdx ps validate --behavior "Purchases" --interval "-7d"

# Preview sample data
tdx ps preview --master
tdx ps preview --attribute "User Profile"
tdx ps preview --enriched

# Push and run workflow
tdx ps run

# List segmentation fields
tdx ps fields
```

## YAML Configuration

### Basic Structure

```yaml
name: "Customer 360"
description: "Complete customer view"

master:
  database: cdp_db
  table: customers
  filters:  # Optional: max 2 filters
    - column: status
      values: ["active"]

schedule:
  type: daily
  time: "03:00:00"
  timezone: "America/Los_Angeles"

attributes:
  - name: "User Profile"
    source:
      database: cdp_db
      table: user_profiles
    join:
      parent_key: user_id
      child_key: customer_id
    columns:
      - column: age
        label: "Age"
        type: number

behaviors:
  - name: "Purchases"
    source:
      database: cdp_db
      table: purchase_events
    join:
      parent_key: user_id
      child_key: customer_id
    columns:
      - column: amount
        type: number
      - column: purchased_at
        type: timestamp
```

### Schedule Types

```yaml
schedule:
  type: none  # Manual trigger

schedule:
  type: hourly

schedule:
  type: daily
  time: "03:00:00"
  timezone: "America/Los_Angeles"

schedule:
  type: weekly
  repeat_sub_frequency: ["Monday", "Friday"]
  time: "03:00:00"
  timezone: "America/Los_Angeles"

schedule:
  type: cron
  cron: "0 3 * * *"
  timezone: "America/Los_Angeles"
```

## Typical Workflow

```bash
# 1. Pull existing configuration
tdx ps pull "Customer 360"

# 2. Edit YAML file
vim parent_segments/customer-360.yml

# 3. Validate changes
tdx ps validate "Customer 360"
tdx ps validate "Customer 360" --attribute "New Attribute"

# 4. Preview data
tdx ps preview "Customer 360" --enriched

# 5. Push and run
tdx ps push "Customer 360"
tdx ps run "Customer 360"
```

## Validation Best Practices

- **Always validate before running** - Catches schema and join issues early
- **Check join statistics** - Low match rates indicate data quality issues
- **Use appropriate time ranges** - Default `-1d` may be too short for low-activity behaviors
- **Preview enriched data** - Verify joins work correctly

## Common Issues

### Low Join Match Rate

```bash
# Check validation output
tdx ps validate "Customer 360" --attribute "User Profile"

# Preview both sides of join
tdx ps preview "Customer 360" --master
tdx ps preview "Customer 360" --attribute "User Profile"

# Verify key columns match and have no NULLs
```

### Workflow Fails

```bash
# Validate all components
tdx ps validate "Customer 360"

# Check specific components
tdx ps validate "Customer 360" --master
tdx ps validate "Customer 360" --attribute
tdx ps validate "Customer 360" --behavior
```

## Related Skills

- **tdx-skills/segment** - Manage child segments using parent segment data
- **tdx-skills/tdx-basic** - Core tdx CLI operations and global options

## Resources

- Full documentation: https://tdx.treasuredata.com/commands/parent-segment.html
