---
name: parent-segment
description: Expert assistance for managing CDP parent segments with tdx CLI including YAML-based configuration, validation, preview, and workflow execution. Use when working with parent segment setup, master tables, attributes, behaviors, or audience definitions.
---

# tdx Parent-Segment - CDP Parent Segment Management

Expert assistance for using `tdx parent-segment` (alias: `tdx ps`) to manage CDP parent segments with YAML-based configuration files.

## When to Use This Skill

Use this skill when:
- Setting up or configuring parent segments for CDP
- Managing master customer tables with attributes and behaviors
- Validating parent segment configurations
- Previewing sample data from parent segments
- Running parent segment workflows
- Troubleshooting parent segment issues

## What is a Parent Segment?

A parent segment defines the master customer table and related data sources (attributes and behaviors) for CDP audience building. It creates an enriched customer view by joining:
- **Master table**: Core customer/user records
- **Attributes**: Customer properties (e.g., user profiles, account info)
- **Behaviors**: Customer actions (e.g., purchases, page views, events)

When a parent workflow runs, it creates output database `cdp_audience_xxx` containing enriched `customers` table that child segments query.

## Core Commands

### List Parent Segments

```bash
# List all parent segments
tdx ps list

# Filter with wildcard pattern (case-insensitive)
tdx ps list "Customer*"
tdx ps list "*prod*"
```

### Set Context

```bash
# Set parent segment context
tdx ps use "Customer 360"

# Show current context
tdx ps use

# Alternative: use global context command
tdx use parent_segment "Customer 360"
```

### Pull Configuration

```bash
# Pull parent segment config to YAML (auto-sets context)
tdx ps pull "Customer 360"
# Creates: parent_segments/customer-360.yml

# Specify custom output path
tdx ps pull "Customer 360" -o config/my-segment.yml

# Skip confirmation
tdx ps pull "Customer 360" -y
```

**Behavior:**
- Automatically sets context to pulled parent segment
- Normalizes name to lowercase with hyphens for filename
- Creates `parent_segments/` directory if it doesn't exist

### Push Configuration

```bash
# Push YAML config to create/update parent segment
tdx ps push "Customer 360"

# Skip confirmation
tdx ps push "Customer 360" -y

# Push from specific file
tdx ps push parent_segments/customer-360.yml
```

**Behavior:**
- Creates new parent segment if doesn't exist
- Updates existing parent segment if exists
- Validates YAML schema before pushing

### Validate Configuration

```bash
# Validate all components (master, attributes, behaviors)
tdx ps validate "Customer 360"

# Validate only master table
tdx ps validate "Customer 360" --master

# Validate specific attribute
tdx ps validate "Customer 360" --attribute "User Profile"

# Validate all attributes
tdx ps validate "Customer 360" --attribute

# Validate specific behavior with custom time range
tdx ps validate "Customer 360" --behavior "Purchases" --interval "-7d"

# Validate enriched master schema
tdx ps validate "Customer 360" --enriched
```

**What validation does:**
- Executes schema queries to verify table structures
- Shows join statistics (row counts, match rates)
- Checks column types and availability
- Default interval `-1d` counts last 24 hours
- Use `-7d` or `-30d` for lower-activity behaviors

### Preview Sample Data

```bash
# Preview master table sample
tdx ps preview "Customer 360" --master

# Preview specific attribute
tdx ps preview "Customer 360" --attribute "User Profile"

# Preview specific behavior with time range
tdx ps preview "Customer 360" --behavior "Purchases" --interval "-7d"

# Preview enriched master (after join)
tdx ps preview "Customer 360" --enriched
```

**Requirements:**
- One of `--master`, `--attribute`, `--behavior`, or `--enriched` required
- Default interval `-1d` for behaviors
- Use `--interval` to adjust time range

### Run Workflow

```bash
# Push changes (if any) and trigger workflow
tdx ps run "Customer 360"

# Skip confirmation
tdx ps run "Customer 360" -y
```

**Behavior:**
- Pushes local YAML if exists before running
- Executes workflow to regenerate audience
- Creates/updates output database `cdp_audience_xxx`

### View Details

```bash
# Show parent segment details
tdx ps view "Customer 360"

# Open in web browser
tdx ps view "Customer 360" -w

# JSON output for scripting
tdx ps view "Customer 360" --json
```

### Schema and SQL

```bash
# Show schema (column names and types)
tdx ps desc "Customer 360"

# Get SQL query
tdx ps sql "Customer 360"

# Execute SQL and show results
tdx ps show "Customer 360"
tdx ps show "Customer 360" --limit 50
```

### List Segmentation Fields

```bash
# List all available fields for segmentation
tdx ps fields "Customer 360"

# With context set
tdx ps use "Customer 360"
tdx ps fields
```

**Output:**
- Field name, type, and source (master, attribute, or behavior)
- Used for building child segment rules

## YAML Configuration Format

### Complete Example

```yaml
name: "Customer 360"
description: "Complete customer view with profile and behavior data"

master:
  database: cdp_db
  table: customers
  filters:                      # Optional: max 2 filters
    - column: status
      values: ["active"]
    - column: country
      values: ["US", "CA"]

schedule:
  type: daily                   # none, hourly, daily, weekly, monthly, cron
  time: "03:00"                 # Required for daily/weekly/monthly
  timezone: "America/Los_Angeles"

engine:
  hive_only: false              # false = Trino + Hive (default)
  trino_pool: null              # Optional: specify pool
  hive_pool: null

attributes:
  - name: "User Profile"
    source:
      database: cdp_db
      table: user_profiles
    join:
      parent_key: user_id       # Column in master table
      child_key: customer_id    # Column in attribute table
    columns:
      - column: age
        label: "Age"
        type: number
      - column: gender
        label: "Gender"
        type: string
      - column: country
        type: string

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
        label: "Purchase Amount"
        type: number
      - column: product_id
        label: "Product ID"
        type: string
      - column: purchased_at
        type: timestamp

  - name: "Page Views"
    source:
      database: cdp_db
      table: pageview_events
    join:
      parent_key: visitor_id
      child_key: customer_id
    all_columns: true           # Include all columns from source
```

### Schedule Types

```yaml
# No schedule (manual trigger only)
schedule:
  type: none

# Hourly
schedule:
  type: hourly

# Daily
schedule:
  type: daily
  time: "03:00"
  timezone: "America/Los_Angeles"

# Weekly
schedule:
  type: weekly
  repeat_sub_frequency: ["Monday", "Friday"]
  time: "03:00"
  timezone: "America/Los_Angeles"

# Monthly
schedule:
  type: monthly
  repeat_sub_frequency: [1, 15]  # Day of month
  time: "03:00"
  timezone: "America/Los_Angeles"

# Cron expression
schedule:
  type: cron
  cron: "0 3 * * *"
  timezone: "America/Los_Angeles"
```

### Master Table Configuration

```yaml
master:
  database: cdp_db
  table: customers
  filters:                      # Optional: max 2 filters
    - column: status
      values: ["active", "trial"]
    - column: created_at
      values: ["2024-01-01"]
```

**Constraints:**
- Maximum 2 filters allowed
- Filters use IN operator (multiple values)

### Attribute Configuration

```yaml
attributes:
  - name: "User Profile"
    source:
      database: cdp_db
      table: user_profiles
    join:
      parent_key: user_id       # Master table column
      child_key: customer_id    # Attribute table column
    columns:                    # Explicit columns
      - column: age
        label: "Age"            # Optional: display label
        type: number
      - column: gender
        type: string
```

**Best Practices:**
- Use explicit `columns` list for clarity
- Add `label` for better UI display
- Specify `type` for proper handling

### Behavior Configuration

```yaml
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
        label: "Purchase Amount"
        type: number
      - column: purchased_at
        type: timestamp
```

**Alternative: Include all columns**

```yaml
behaviors:
  - name: "Page Views"
    source:
      database: cdp_db
      table: pageview_events
    join:
      parent_key: visitor_id
      child_key: customer_id
    all_columns: true
```

## Typical Workflows

### Workflow 1: Create New Parent Segment

```bash
# 1. Create YAML file manually or from template
mkdir -p parent_segments
cat > parent_segments/customer-360.yml << 'EOF'
name: "Customer 360"
description: "Complete customer view"
master:
  database: cdp_db
  table: customers
schedule:
  type: daily
  time: "03:00"
  timezone: "America/Los_Angeles"
EOF

# 2. Push to create parent segment
tdx ps push parent_segments/customer-360.yml

# 3. Validate configuration
tdx ps validate "Customer 360"

# 4. Preview master data
tdx ps preview "Customer 360" --master

# 5. Run workflow
tdx ps run "Customer 360"
```

### Workflow 2: Update Existing Parent Segment

```bash
# 1. Pull current configuration
tdx ps pull "Customer 360"

# 2. Edit YAML file
vim parent_segments/customer-360.yml

# 3. Validate changes
tdx ps validate "Customer 360"

# 4. Preview affected data
tdx ps preview "Customer 360" --enriched

# 5. Push and run
tdx ps push "Customer 360"
tdx ps run "Customer 360"
```

### Workflow 3: Add Attribute to Parent Segment

```bash
# 1. Pull configuration
tdx ps pull "Customer 360"

# 2. Edit YAML to add attribute
vim parent_segments/customer-360.yml
# Add new attribute in attributes section

# 3. Validate new attribute
tdx ps validate "Customer 360" --attribute "New Attribute"

# 4. Preview attribute data
tdx ps preview "Customer 360" --attribute "New Attribute"

# 5. Push and run
tdx ps push "Customer 360"
tdx ps run "Customer 360"
```

### Workflow 4: Debug Join Issues

```bash
# 1. Validate to see join statistics
tdx ps validate "Customer 360" --attribute "User Profile"
# Look for low match rates

# 2. Preview master table
tdx ps preview "Customer 360" --master
# Check parent_key values

# 3. Preview attribute table
tdx ps preview "Customer 360" --attribute "User Profile"
# Check child_key values

# 4. Get SQL query for manual debugging
tdx ps sql "Customer 360"
# Run in query editor to investigate
```

## Common Patterns

### Pattern 1: Multi-Environment Setup

```bash
# Development
tdx use profile dev
tdx ps pull "Customer 360 Dev"
vim parent_segments/customer-360-dev.yml
tdx ps push "Customer 360 Dev"

# Production
tdx use profile prod
tdx ps pull "Customer 360"
vim parent_segments/customer-360.yml
tdx ps push "Customer 360"
```

### Pattern 2: Validation Before Production

```bash
# Pull production config
tdx use profile prod
tdx ps pull "Customer 360"

# Make changes locally
vim parent_segments/customer-360.yml

# Validate all components
tdx ps validate "Customer 360"
tdx ps validate "Customer 360" --master
tdx ps validate "Customer 360" --attribute
tdx ps validate "Customer 360" --behavior

# Preview enriched data
tdx ps preview "Customer 360" --enriched

# If all looks good, push and run
tdx ps push "Customer 360" -y
tdx ps run "Customer 360" -y
```

### Pattern 3: Batch Preview All Components

```bash
# Set context once
tdx ps use "Customer 360"

# Preview all components
tdx ps preview --master
tdx ps preview --attribute "User Profile"
tdx ps preview --attribute "Account Info"
tdx ps preview --behavior "Purchases" --interval "-7d"
tdx ps preview --behavior "Page Views" --interval "-7d"
tdx ps preview --enriched
```

## Folder Structure

```
parent_segments/
├── customer-360.yml
├── demo-audience.yml
├── sales-leads.yml
└── marketing-audience.yml
```

**Best Practices:**
- Keep YAML files in `parent_segments/` directory
- Use normalized names (lowercase with hyphens)
- One file per parent segment
- Version control YAML files in git

## Parent-Child Relationship

Parent segments and child segments work together:

1. **Parent Segment**: Defines master table + attributes + behaviors
2. **Parent Workflow**: Creates enriched customer table in `cdp_audience_xxx` database
3. **Child Segments**: Filter audiences from enriched data using rules
4. **Activations**: Export child segment data to external systems

**Example Flow:**

```bash
# 1. Create parent segment
tdx ps push "Customer 360"
tdx ps run "Customer 360"
# Creates: cdp_audience_123.customers (enriched)

# 2. Create child segments using tdx segment
tdx sg use "Customer 360"
tdx sg pull "Customer 360"
# Edit child segment rules in segments/customer-360/*.yml
tdx sg push

# 3. Child segments query cdp_audience_123.customers
# with rules like: country = 'US' AND age > 25
```

## Best Practices

1. **Always Validate Before Running** - Use `validate` to catch issues early
2. **Preview Data Samples** - Use `preview` to verify joins and data quality
3. **Use Appropriate Time Ranges** - Use `-7d` or `-30d` for low-activity behaviors
4. **Version Control YAML** - Keep parent segment configs in git
5. **Test in Dev First** - Validate changes in dev environment before production
6. **Monitor Join Statistics** - Check match rates in validation output
7. **Use Meaningful Names** - Clear names for attributes and behaviors
8. **Document Custom Logic** - Add descriptions to YAML files
9. **Limit Master Filters** - Maximum 2 filters, use carefully
10. **Schedule Appropriately** - Consider data freshness needs and resource usage

## Common Issues

### Low Join Match Rate

**Problem:** Validation shows low match rate between master and attribute/behavior

**Solution:**
1. Preview both tables to inspect key values
2. Check for data type mismatches
3. Verify key column names are correct
4. Check for NULL values in join keys
5. Consider data quality issues in source tables

```bash
tdx ps validate "Customer 360" --attribute "User Profile"
# Shows: 50% match rate

tdx ps preview "Customer 360" --master
# Check parent_key values

tdx ps preview "Customer 360" --attribute "User Profile"
# Check child_key values
```

### Workflow Fails

**Problem:** `tdx ps run` fails with error

**Solution:**
1. Check validation output for schema issues
2. Verify all source tables exist and are accessible
3. Check schedule configuration
4. Review error message for specific issues
5. Test SQL query manually

```bash
tdx ps validate "Customer 360"
tdx ps sql "Customer 360"
# Copy SQL and test in query editor
```

### YAML Syntax Error

**Problem:** Push fails with YAML parsing error

**Solution:**
1. Check YAML indentation (use spaces, not tabs)
2. Verify quotes around string values
3. Check array syntax `["value1", "value2"]`
4. Validate YAML with online validator
5. Compare with working examples

### Missing Fields in Child Segments

**Problem:** Expected fields not available in child segment rules

**Solution:**
1. Verify columns are defined in parent segment YAML
2. Run parent workflow to update enriched table
3. Check field list with `tdx ps fields`
4. Verify attribute/behavior is properly joined

```bash
tdx ps fields "Customer 360"
tdx ps run "Customer 360"
```

## Global Options

Available for all parent-segment commands:

- `--profile <name>` - Use specific profile configuration
- `--site <site>` - TD site/region (us01, jp01, eu01, ap02)
- `--format <format>` - Output format (table, json, jsonl, tsv)
- `--json` - JSON output (shorthand)
- `--output <file>` - Save to file
- `--verbose` - Verbose logging
- `--timeout <seconds>` - Timeout (default: 30)
- `--dry-run` - Preview without executing
- `-y, --yes` - Skip confirmations

## Related Skills

- **tdx-skills/segment** - Manage child segments and activations
- **tdx-skills/tdx-basic** - Core tdx CLI operations
- **sql-skills/trino** - Query enriched customer tables
- **workflow-skills/digdag** - Automate parent segment workflows

## Resources

- tdx Documentation: https://tdx.treasuredata.com/commands/parent-segment.html
- CDP Documentation: https://docs.treasuredata.com/
- Parent Segment Guide: https://docs.treasuredata.com/display/PD/Parent+Segments
