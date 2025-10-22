---
name: dbt-trino-td
description: Expert guidance for using dbt (data build tool) with Treasure Data Trino. Use this skill when users need help setting up dbt with TD, creating models, using TD-specific macros, handling incremental models, or troubleshooting dbt-trino adapter issues.
---

# dbt with Treasure Data Trino

Expert assistance for using dbt (data build tool) with Treasure Data's Trino engine.

## When to Use This Skill

Use this skill when:
- Setting up dbt with Treasure Data Trino
- Creating dbt models for TD
- Writing TD-specific dbt macros
- Implementing incremental models with TD_INTERVAL
- Troubleshooting dbt-trino adapter errors
- Overriding dbt-trino macros for TD compatibility
- Managing dbt projects with TD data pipelines

## Prerequisites

### Installation

**Recommended: Using uv (modern Python package manager):**
```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create and activate virtual environment with uv
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dbt-core and dbt-trino
uv pip install dbt-core dbt-trino==1.9.3

# Verify installation
dbt --version
```

**Alternative: Using traditional pip and venv:**
```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Note: brew install dbt doesn't work well on Mac OS X
# Install dbt-core and dbt-trino
pip install dbt-core dbt-trino==1.9.3

# Verify installation
dbt --version
# Expected output:
# Core: 1.10.9
# Plugins: trino: 1.9.3
```

### TD Connection Setup

Create `~/.dbt/profiles.yml`:

```yaml
td_project:
  target: dev
  outputs:
    dev:
      type: trino
      method: none                          # Use 'none' for API key authentication
      user: "{{ env_var('TD_API_KEY') }}"  # TD API key from environment variable
      password: dummy                       # Password is not used with API key
      host: api-presto.treasuredata.com
      port: 443
      database: td                          # Always 'td' for Treasure Data
      schema: your_td_database_name         # Your actual TD database name (e.g., 'production', 'analytics')
      threads: 4
      http_scheme: https
      session_properties:
        query_max_run_time: 8h
```

**Important TD-specific settings:**
- `method`: Set to `none` for API key authentication (not `ldap`)
- `user`: Use TD API key from `TD_API_KEY` environment variable
- `password`: Set to `dummy` (not used with API key authentication)
- `host`: Always `api-presto.treasuredata.com` (even though it's actually Trino)
- `database`: Always set to `td` for Treasure Data
- `schema`: Set to your actual TD database name (what you see in TD Console)

**Set up your TD API key:**
```bash
# Get your API key from TD Console: https://console.treasuredata.com/app/users
export TD_API_KEY="your_api_key_here"

# Or add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
echo 'export TD_API_KEY="your_api_key_here"' >> ~/.zshrc
```

### dbt Project Configuration

Create or update `dbt_project.yml` with TD-specific settings:

```yaml
name: 'td_project'
version: '1.0.0'
config-version: 2

# This setting configures which "profile" dbt uses for this project.
profile: 'td_project'

# These configurations specify where dbt should look for different types of files.
model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["seeds"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

# Global variable for default time range
vars:
  target_range: '-3M/now'  # Default: last 3 months to now

# Model configuration with TD-specific settings
models:
  td_project:
    +materialized: table
    +on_schema_change: "append_new_columns"  # Auto-add new columns instead of failing
    +views_enabled: false                     # TD doesn't support views (use tables)

    # Staging models
    staging:
      +materialized: table
      +tags: ["staging"]

    # Marts models
    marts:
      +materialized: table
      +tags: ["marts"]

    # Incremental models
    incremental:
      +materialized: incremental
      +on_schema_change: "append_new_columns"
      +tags: ["incremental"]
```

**Key TD-specific settings:**
- `vars.target_range: '-3M/now'` - Default time range for all models using the variable
- `+on_schema_change: "append_new_columns"` - Automatically add new columns to existing tables (prevents rebuild on schema changes)
- `+views_enabled: false` - Explicitly disable views since TD doesn't support `CREATE VIEW`

**Benefits:**
- **Schema evolution**: New columns are added automatically without dropping tables
- **Default time window**: All models using `{{ var('target_range') }}` get sensible default
- **No views**: Prevents accidental view creation attempts

## Required TD-Specific Overrides

TD's Presto/Trino has limitations that require overriding some dbt-trino macros. You MUST create this file in your dbt project.

### Create `macros/override_dbt_trino.sql`

This file overrides dbt-trino macros to work with TD Presto/Trino limitations:

**Key changes:**
1. Removes table ownership queries (TD doesn't support)
2. Simplifies catalog queries
3. Replaces `CREATE VIEW` with `CREATE TABLE` (TD doesn't support views)

See the full macro file in [macros/override_dbt_trino.sql](./macros/override_dbt_trino.sql) in this skill directory.

**Why this is needed:**
- TD Presto doesn't support `CREATE VIEW` statements
- TD doesn't expose table ownership information
- Some information_schema queries need simplification

## TD-Specific dbt Macros

### 1. Incremental Scan Macro

For incremental models that process new data only:

```sql
-- macros/td_incremental_scan.sql
{% macro incremental_scan(table_name) -%}
(
  SELECT * FROM {{ table_name }}
  WHERE TD_INTERVAL(time, '{{ var("target_range", "-3M/now") }}')
{% if is_incremental() -%}
    AND time > {{ get_max_time(this.table) }}
{%- endif %}
)
{%- endmacro %}

{% macro get_max_time(table_name) -%}
  (SELECT MAX(time) FROM {{ table_name }})
{%- endmacro %}
```

**Default behavior:** Scans last 3 months to now (`-3M/now`) if no `target_range` variable is provided.

**Usage in model:**
```sql
-- models/incremental_events.sql
{{
  config(
    materialized='incremental',
    unique_key='event_id'
  )
}}

SELECT
  event_id,
  user_id,
  event_type,
  time
FROM {{ incremental_scan('raw_events') }}
```

**Run with default (last 3 months):**
```bash
dbt run --models incremental_events
```

**Or override with specific range:**
```bash
# Yesterday only
dbt run --vars '{"target_range": "-1d"}' --models incremental_events

# Last 7 days
dbt run --vars '{"target_range": "-7d/now"}' --models incremental_events

# Specific date range
dbt run --vars '{"target_range": "2024-01-01/2024-01-31"}' --models incremental_events
```

**Note:** No need to create wrapper macros for TD time functions - they're already simple enough to use directly in your SQL.

## dbt Model Patterns for TD

### Basic Model

```sql
-- models/daily_events.sql
{{
  config(
    materialized='table'
  )
}}

SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  event_type,
  COUNT(*) as event_count,
  approx_distinct(user_id) as unique_users
FROM {{ source('raw', 'events') }}
WHERE TD_INTERVAL(time, '-30d', 'JST')
GROUP BY 1, 2
```

### Incremental Model

```sql
-- models/incremental_user_events.sql
{{
  config(
    materialized='incremental',
    unique_key='user_date_key'
  )
}}

SELECT
  CONCAT(CAST(user_id AS VARCHAR), '_', TD_TIME_STRING(time, 'd!', 'JST')) as user_date_key,
  user_id,
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  COUNT(*) as event_count
FROM {{ source('raw', 'events') }}
WHERE TD_INTERVAL(time, '{{ var('target_range', '-1d') }}', 'JST')
{% if is_incremental() %}
  -- Only process data after last run
  AND time > (SELECT MAX(time) FROM {{ this }})
{% endif %}
GROUP BY 1, 2, 3
```

### CTE (Common Table Expression) Pattern

```sql
-- models/user_metrics.sql
{{
  config(
    materialized='table'
  )
}}

WITH events_filtered AS (
  SELECT *
  FROM {{ source('raw', 'events') }}
  WHERE TD_INTERVAL(time, '-7d', 'JST')
),

user_sessions AS (
  SELECT
    user_id,
    TD_SESSIONIZE(time, 1800, user_id) as session_id,
    MIN(time) as session_start,
    MAX(time) as session_end
  FROM events_filtered
  GROUP BY user_id, session_id
)

SELECT
  user_id,
  COUNT(DISTINCT session_id) as session_count,
  AVG(session_end - session_start) as avg_session_duration
FROM user_sessions
GROUP BY user_id
```

## Sources Configuration

Define TD tables as sources:

```yaml
# models/sources.yml
version: 2

sources:
  - name: raw
    database: production
    schema: default
    tables:
      - name: events
        description: Raw event data from applications
        columns:
          - name: time
            description: Event timestamp (Unix time)
          - name: user_id
            description: User identifier
          - name: event_type
            description: Type of event

      - name: users
        description: User profile data
```

**Usage in models:**
```sql
SELECT * FROM {{ source('raw', 'events') }}
```

## Testing with TD

### Schema Tests

```yaml
# models/schema.yml
version: 2

models:
  - name: daily_events
    description: Daily event aggregations
    columns:
      - name: date
        description: Event date
        tests:
          - not_null
          - unique

      - name: event_count
        description: Number of events
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"

      - name: unique_users
        description: Unique user count (approximate)
        tests:
          - not_null
```

### Custom TD Tests

```sql
-- tests/assert_positive_events.sql
-- Returns records that fail the test
SELECT *
FROM {{ ref('daily_events') }}
WHERE event_count < 0
```

## Running dbt with TD

### Basic Commands

```bash
# Test connection
dbt debug

# Run all models
dbt run

# Run specific model
dbt run --models daily_events

# Run with variables
dbt run --vars '{"target_range": "-7d"}'

# Run tests
dbt test

# Generate documentation
dbt docs generate
dbt docs serve
```

### Incremental Run Pattern

```bash
# Daily incremental run
dbt run --models incremental_events --vars '{"target_range": "-1d"}'

# Full refresh
dbt run --models incremental_events --full-refresh

# Backfill specific date
dbt run --models incremental_events --vars '{"target_range": "2024-01-15"}'
```

## Common Issues and Solutions

### Issue 1: "This connector does not support creating views"

**Error:**
```
TrinoUserError: This connector does not support creating views
```

**Solution:**
Add `macros/override_dbt_trino.sql` that overrides `trino__create_view_as` to use `CREATE TABLE` instead.

### Issue 2: Catalog Query Failures

**Error:**
```
Database Error: Table ownership information not available
```

**Solution:**
Use the override macros that remove table ownership queries from catalog operations.

### Issue 3: Connection Timeout

**Error:**
```
Connection timeout
```

**Solution:**
Increase session timeout in `profiles.yml`:
```yaml
session_properties:
  query_max_run_time: 8h
```

### Issue 4: Incremental Model Not Working

**Problem:**
Incremental model processes all data every time.

**Solution:**
Ensure unique_key is set and check incremental logic:
```sql
{{
  config(
    materialized='incremental',
    unique_key='event_id'  -- Must be specified
  )
}}

{% if is_incremental() %}
  -- This block only runs on incremental runs
  WHERE time > (SELECT MAX(time) FROM {{ this }})
{% endif %}
```

### Issue 5: Variable Not Found

**Error:**
```
Compilation Error: Var 'target_range' is undefined
```

**Solution:**
Provide default value:
```sql
WHERE TD_INTERVAL(time, '{{ var('target_range', '-1d') }}', 'JST')
```

Or pass variable:
```bash
dbt run --vars '{"target_range": "-1d"}'
```

## Project Structure

```
dbt_project/
├── dbt_project.yml
├── profiles.yml (in ~/.dbt/)
├── macros/
│   ├── override_dbt_trino.sql      # Required TD overrides
│   └── td_incremental_scan.sql     # Optional: Incremental helper
├── models/
│   ├── sources.yml                 # Source definitions
│   ├── schema.yml                  # Tests and documentation
│   ├── staging/
│   │   └── stg_events.sql
│   └── marts/
│       ├── daily_events.sql
│       └── user_metrics.sql
└── tests/
    └── assert_positive_events.sql
```

## Best Practices

1. **Include time filters in all models**
   - Use TD_INTERVAL or TD_TIME_RANGE directly
   - Critical for performance on large tables

2. **Use incremental models wisely**
   - Good for append-only event data
   - Requires careful unique_key selection
   - Test thoroughly before production

3. **Leverage sources**
   - Define all TD tables as sources
   - Enables lineage tracking
   - Centralizes table documentation

4. **Use variables for flexibility**
   - Date ranges
   - Environment-specific settings
   - Makes models reusable

5. **Test your models**
   - Not null checks on key columns
   - Unique checks on IDs
   - Custom assertions for business logic

6. **Document everything**
   - Model descriptions
   - Column descriptions
   - Include TD-specific notes

## Integration with TD Workflows

### Digdag + dbt Integration

```yaml
# workflow.dig
+dbt_run:
  sh>: dbt run --vars '{"target_range": "${session_date}"}'

+dbt_test:
  sh>: dbt test
```

### Scheduled dbt Runs

```yaml
# daily_dbt_workflow.dig
timezone: Asia/Tokyo

schedule:
  daily>: 03:00:00

_export:
  session_date: ${session_date}

+run_incremental_models:
  sh>: |
    cd /path/to/dbt_project
    dbt run --models tag:incremental --vars '{"target_range": "-1d"}'

+run_tests:
  sh>: |
    cd /path/to/dbt_project
    dbt test --models tag:incremental

+notify_completion:
  echo>: "dbt run completed for ${session_date}"
```

## Advanced Patterns

### Dynamic Table Selection

```sql
-- models/flexible_aggregation.sql
{{
  config(
    materialized='table'
  )
}}

{% set table_name = var('source_table', 'events') %}
{% set metric = var('metric', 'event_count') %}

SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  COUNT(*) as {{ metric }}
FROM {{ source('raw', table_name) }}
WHERE TD_INTERVAL(time, '{{ var('target_range', '-7d') }}', 'JST')
GROUP BY 1
```

### Multi-Source Union

```sql
-- models/unified_events.sql
{{
  config(
    materialized='table'
  )
}}

{% set sources = ['mobile_events', 'web_events', 'api_events'] %}

{% for source in sources %}
  SELECT
    '{{ source }}' as source_type,
    *
  FROM {{ source('raw', source) }}
  WHERE TD_INTERVAL(time, '-1d', 'JST')
  {% if not loop.last %}UNION ALL{% endif %}
{% endfor %}
```

## Resources

- dbt Documentation: https://docs.getdbt.com/
- dbt-trino adapter: https://github.com/starburstdata/dbt-trino
- TD Query Engine: Use Trino-specific SQL
- TD Functions: TD_INTERVAL, TD_TIME_STRING, etc.

## Migration from SQL Scripts to dbt

If migrating existing TD SQL workflows to dbt:

1. **Convert queries to models**
   - Add config block
   - Use source() for table references
   - Add TD-specific macros

2. **Add tests**
   - Start with basic not_null tests
   - Add unique key tests
   - Create custom business logic tests

3. **Implement incrementally**
   - Start with simple table materializations
   - Add incremental models gradually
   - Test each model thoroughly

4. **Update orchestration**
   - Replace direct SQL in digdag with dbt commands
   - Maintain existing schedules
   - Add dbt test steps
