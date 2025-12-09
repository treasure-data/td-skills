---
name: segment
description: Expert assistance for managing CDP child segments with tdx CLI including YAML-based configuration, folder organization, rules, and activations. Use when working with segment creation, audience filtering, activation setup, or segment management.
---

# tdx Segment - CDP Child Segment Management

Expert assistance for using `tdx segment` (alias: `tdx sg`) to manage CDP child segments with YAML-based configuration files.

## When to Use This Skill

Use this skill when:
- Creating or managing child segments for audiences
- Setting up segment rules and filters
- Configuring activations (data exports to external systems)
- Organizing segments in folders
- Syncing segments between local YAML files and Treasure Data
- Troubleshooting segment issues

## What is a Child Segment?

A child segment filters audiences within parent segments using rules. Child segments:
- Query enriched customer data from parent segment workflows
- Apply filtering rules (e.g., country = 'US' AND age > 25)
- Can be organized in folder hierarchies
- Support activations to export data to external systems

## Core Commands

### Set Context

```bash
# Set parent segment context (required for child segment operations)
tdx sg use "Customer 360"

# Show current context
tdx sg use

# Alternative: use global context command
tdx use parent_segment "Customer 360"
```

**Important**: Most child segment commands require parent segment context to be set.

### List Segments

```bash
# List segments in current folder
tdx sg list

# List segments in specific folder
tdx sg list marketing

# Recursive list (tree view)
tdx sg list -r
tdx sg list marketing -r

# Limit recursion depth
tdx sg list -r --max-depth 2
```

### Pull Segments

```bash
# Pull all child segments from parent to YAML files
tdx sg pull "Customer 360"
# Creates: segments/customer-360/*.yml

# Preview changes without writing files
tdx sg pull "Customer 360" --dry-run

# Skip confirmation
tdx sg pull "Customer 360" -y
```

**Behavior:**
- Automatically sets parent segment context
- Creates `segments/<parent-name>/` directory
- One YAML file per segment
- Preserves folder structure
- Sanitizes filenames (lowercase, spaces→hyphens)

### Push Segments

```bash
# Push local YAML files to Treasure Data
tdx sg push

# Push from specific directory
tdx sg push segments/customer-360

# Preview changes without applying
tdx sg push --dry-run

# Delete segments not in local files
tdx sg push --delete

# Skip confirmation
tdx sg push -y
```

**Behavior:**
- Creates new segments if they don't exist
- Updates existing segments if they exist
- Validates YAML schema before pushing
- With `--delete`: removes segments not in local files

### View Segment Details

```bash
# Show segment or folder details
tdx sg view "High Value Customers"
tdx sg view marketing

# JSON output for scripting
tdx sg view "High Value Customers" --json
```

### Schema and Data

```bash
# Show segment schema (columns and types)
tdx sg desc "High Value Customers"

# Get SQL query for segment
tdx sg sql "High Value Customers"

# Execute SQL and show results
tdx sg show "High Value Customers"
tdx sg show "High Value Customers" --limit 50
```

### List Available Fields

```bash
# List all fields available for segmentation
tdx sg fields

# With parent segment context
tdx sg use "Customer 360"
tdx sg fields
```

**Output:**
- Field name, type, and source (master, attribute, or behavior)
- Used for building segment rules

## YAML Configuration Format

### Basic Segment

```yaml
name: US Customers
description: All customers in the United States
kind: batch              # batch, realtime, or funnel_stage
visible: true           # Show in UI (default: true)

rule:
  type: And
  conditions:
    - type: Value
      attribute: country
      operator:
        type: Equal
        value: US
```

### Segment with Multiple Conditions

```yaml
name: High Value US Customers
description: US customers with high lifetime value
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

### Segment with OR Logic

```yaml
name: US or Canada Customers
description: Customers from US or Canada
kind: batch

rule:
  type: Or
  conditions:
    - type: Value
      attribute: country
      operator:
        type: Equal
        value: US
    - type: Value
      attribute: country
      operator:
        type: Equal
        value: CA
```

### Segment with IN Operator

```yaml
name: North America Customers
description: Customers from North America
kind: batch

rule:
  type: And
  conditions:
    - type: Value
      attribute: country
      operator:
        type: In
        value:
          - US
          - CA
          - MX
```

### Segment with Time-Based Filter

```yaml
name: Recent Purchasers
description: Customers who purchased in last 30 days
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

### Segment with String Matching

```yaml
name: Gmail Users
description: Customers with Gmail addresses
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

## Activation Configuration

Activations export segment data to external systems (Salesforce, Google Ads, etc.).

### Basic Activation

```yaml
activations:
  - name: Daily Salesforce Sync
    description: Sync to SFDC daily
    connection: my-salesforce-connection
    columns:
      - email
      - first_name
      - last_name
      - ltv
    schedule:
      type: daily
      timezone: America/Los_Angeles
```

### Activation with All Columns

```yaml
activations:
  - name: Full Data Export
    connection: my-connection
    all_columns: true  # Export all available columns
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
      - ltv
    schedule:
      type: daily
      timezone: America/Los_Angeles
    connector_config:
      object: Contact       # Salesforce object
      mode: upsert         # insert, update, or upsert
      external_id: email   # Field for matching
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
        - alerts@company.com
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
  timezone: America/Los_Angeles

# Weekly
schedule:
  type: weekly
  repeat_sub_frequency:
    - Monday
    - Friday
  timezone: America/Los_Angeles

# Monthly
schedule:
  type: monthly
  repeat_sub_frequency:
    - 1   # First day of month
    - 15  # 15th day of month
  timezone: America/Los_Angeles

# Cron expression
schedule:
  type: cron
  cron: "0 */6 * * *"  # Every 6 hours
  timezone: America/Los_Angeles
```

## Supported Operators

### Comparison Operators

- **Equal**: Exact match
- **NotEqual**: Not equal to
- **Greater**: Greater than
- **GreaterEqual**: Greater than or equal to
- **Less**: Less than
- **LessEqual**: Less than or equal to

### List Operators

- **In**: Value in list
- **NotIn**: Value not in list

### String Operators

- **Contain**: String contains substring
- **StartWith**: String starts with prefix
- **EndWith**: String ends with suffix
- **Regexp**: Regular expression match

### Null Operators

- **IsNull**: Field is null

### Time Operators

- **TimeWithinPast**: Time within past N units (days, weeks, months)

## Folder Structure

```
segments/customer-360/
├── tdx.json
├── active-users.yml
├── high-value-customers.yml
├── marketing/
│   ├── email-subscribers.yml
│   └── newsletter-subs.yml
└── sales/
    └── enterprise-leads.yml
```

**Best Practices:**
- Use folders to organize related segments
- Keep folder hierarchy shallow (2-3 levels max)
- Use descriptive folder names
- One segment per YAML file

## Typical Workflows

### Workflow 1: Create New Segments

```bash
# 1. Set parent segment context
tdx sg use "Customer 360"

# 2. Pull existing segments (optional)
tdx sg pull "Customer 360"

# 3. Create new segment YAML file
cat > segments/customer-360/vip-customers.yml << 'EOF'
name: VIP Customers
description: High value customers with recent activity
kind: batch

rule:
  type: And
  conditions:
    - type: Value
      attribute: ltv
      operator:
        type: Greater
        value: 5000
    - type: Value
      attribute: last_purchase_date
      operator:
        type: TimeWithinPast
        value: 90
        unit: days
EOF

# 4. Push to Treasure Data
tdx sg push

# 5. Verify
tdx sg list -r
```

### Workflow 2: Update Existing Segments

```bash
# 1. Pull current segments
tdx sg pull "Customer 360"

# 2. Edit YAML file
vim segments/customer-360/high-value-customers.yml

# 3. Preview changes
tdx sg push --dry-run

# 4. Push changes
tdx sg push

# 5. Verify
tdx sg view "High Value Customers"
```

### Workflow 3: Add Activation

```bash
# 1. Pull segments
tdx sg pull "Customer 360"

# 2. Edit segment YAML to add activation
vim segments/customer-360/high-value-customers.yml
# Add activations section

# 3. Push changes
tdx sg push

# 4. Verify activation
tdx activations "High Value Customers"
```

### Workflow 4: Organize with Folders

```bash
# 1. Pull segments
tdx sg pull "Customer 360"

# 2. Create folder structure
mkdir -p segments/customer-360/marketing
mkdir -p segments/customer-360/sales

# 3. Move segment files
mv segments/customer-360/email-subscribers.yml segments/customer-360/marketing/
mv segments/customer-360/enterprise-leads.yml segments/customer-360/sales/

# 4. Push changes
tdx sg push

# 5. Verify folder structure
tdx sg list -r
```

### Workflow 5: Sync Between Environments

```bash
# Development
tdx use profile dev
tdx sg pull "Customer 360 Dev"
# Edit segments locally
tdx sg push

# Production (copy YAML files)
cp -r segments/customer-360-dev segments/customer-360
tdx use profile prod
tdx sg push segments/customer-360
```

## Common Patterns

### Pattern 1: Geographic Segmentation

```yaml
name: US East Coast Customers
rule:
  type: And
  conditions:
    - type: Value
      attribute: country
      operator:
        type: Equal
        value: US
    - type: Value
      attribute: state
      operator:
        type: In
        value: ["NY", "NJ", "PA", "MA", "CT"]
```

### Pattern 2: Behavioral Segmentation

```yaml
name: Active Shoppers
rule:
  type: And
  conditions:
    - type: Value
      attribute: purchase_count
      operator:
        type: GreaterEqual
        value: 3
    - type: Value
      attribute: last_purchase_date
      operator:
        type: TimeWithinPast
        value: 30
        unit: days
```

### Pattern 3: Value-Based Segmentation

```yaml
name: High Value Segment
rule:
  type: Or
  conditions:
    - type: Value
      attribute: ltv
      operator:
        type: Greater
        value: 10000
    - type: And
      conditions:
        - type: Value
          attribute: avg_order_value
          operator:
            type: Greater
            value: 500
        - type: Value
          attribute: purchase_count
          operator:
            type: GreaterEqual
            value: 5
```

### Pattern 4: Engagement Segmentation

```yaml
name: Engaged Email Subscribers
rule:
  type: And
  conditions:
    - type: Value
      attribute: email_subscribed
      operator:
        type: Equal
        value: true
    - type: Value
      attribute: email_open_rate
      operator:
        type: Greater
        value: 0.2
    - type: Value
      attribute: last_email_open_date
      operator:
        type: TimeWithinPast
        value: 14
        unit: days
```

## Best Practices

1. **Always Set Context** - Use `tdx sg use` before child segment operations
2. **Use Descriptive Names** - Clear segment names help with organization
3. **Version Control YAML** - Keep segment configs in git
4. **Test with Dry Run** - Use `--dry-run` before pushing changes
5. **Organize with Folders** - Group related segments
6. **Document Rules** - Add descriptions to explain segment logic
7. **Validate Before Push** - Review YAML syntax and logic
8. **Use Appropriate Operators** - Choose operators that match data types
9. **Monitor Activations** - Set up notifications for critical syncs
10. **Keep Rules Simple** - Complex logic is harder to maintain

## Important Behaviors

### Filename Collisions

Sanitized filenames (lowercase, spaces→hyphens) receive numeric suffixes if conflicts occur:
- "High Value" → `high-value.yml`
- "High-Value" → `high-value-1.yml` (if first already exists)

### Activation Matching

Activations are matched by name only:
- Renaming an activation deletes the old one and creates new
- This loses activation history
- Be careful when renaming activations

### Segment Matching

Segments are matched by folder + name:
- Same names allowed in different folders
- Moving YAML file creates new segment rather than moving existing
- To move: update folder in UI, then pull

## Common Issues

### Parent Segment Context Not Set

**Problem:** "Parent segment context not set"

**Solution:**
```bash
tdx sg use "Customer 360"
# Or
tdx use parent_segment "Customer 360"
```

### YAML Syntax Error

**Problem:** Push fails with YAML parsing error

**Solution:**
1. Check YAML indentation (use spaces, not tabs)
2. Verify quotes around string values
3. Check list syntax `["value1", "value2"]`
4. Validate with online YAML validator
5. Compare with working examples

### Field Not Available

**Problem:** Segment rule references non-existent field

**Solution:**
1. List available fields: `tdx sg fields`
2. Verify field name spelling
3. Check parent segment configuration
4. Ensure parent workflow has run

### Activation Not Working

**Problem:** Activation doesn't export data

**Solution:**
1. Verify connection exists: `tdx connections`
2. Check connection permissions
3. Verify schedule configuration
4. Check activation logs in UI
5. Ensure columns exist in segment

### Segment Not Updating

**Problem:** Changes not reflected after push

**Solution:**
1. Verify parent segment context
2. Check for YAML syntax errors
3. Use `--dry-run` to preview changes
4. Verify file is in correct directory
5. Check segment matching (folder + name)

## Global Options

Available for all segment commands:

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

- **tdx-skills/parent-segment** - Manage parent segments and master tables
- **tdx-skills/tdx-basic** - Core tdx CLI operations
- **sql-skills/trino** - Query segment data
- **workflow-skills/digdag** - Automate segment operations

## Resources

- tdx Documentation: https://tdx.treasuredata.com/commands/segment.html
- CDP Documentation: https://docs.treasuredata.com/
- Segment Guide: https://docs.treasuredata.com/display/PD/Segments
- Activation Guide: https://docs.treasuredata.com/display/PD/Activations
