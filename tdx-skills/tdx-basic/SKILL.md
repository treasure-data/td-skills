---
name: tdx-basic
description: Core tdx CLI operations for managing Treasure Data from the command line including database management, table operations, queries, and context management. Use this skill when helping users with tdx commands, configuration, or basic data operations.
---

# tdx CLI - Basic Operations

Expert assistance for using tdx, the AI-native CLI for Treasure Data, to manage databases, tables, queries, and CLI context.

## When to Use This Skill

Use this skill when:
- Setting up or configuring tdx CLI
- Managing databases and tables via command line
- Executing SQL queries from terminal
- Working with tdx context (profiles, sessions, project config)
- Troubleshooting tdx CLI issues

## Installation and Setup

### Installation

```bash
npm install -g @treasuredata/tdx
```

After installation, use `tdx` command directly:
```bash
tdx databases
tdx tables
tdx query "SELECT * FROM mydb.users"
```

### Configure API Key

**Recommended: Use the interactive setup command**

```bash
# Interactive setup (single account)
tdx auth setup

# Or use profiles for multiple accounts (e.g., dev/prod)
tdx auth setup --profile development
tdx auth setup --profile production

# Check authentication status
tdx auth
```

**Alternative: Manual configuration**

Create `~/.config/tdx/.env`:

```bash
TD_API_KEY=your-key-id/your-key-secret
```

Or use environment variable:
```bash
export TD_API_KEY=your-key-id/your-key-secret
```

### Getting Help

Use the `--help` option with any tdx command to learn about its usage, options, and examples:

```bash
tdx --help
tdx query --help
```

## Context Management

tdx context is resolved with this priority:
1. CLI flags (highest) - `--database`, `--site`
2. Session context - `tdx use database mydb`
3. Project config - `tdx.json` in project root
4. Profile config - `~/.config/tdx/tdx.json`
5. Global config - `~/.config/tdx/tdx.json`

### Profiles

Define reusable configurations in `~/.config/tdx/tdx.json`:

```json
{
  "profiles": {
    "production": {
      "site": "us01",
      "database": "analytics"
    },
    "dev": {
      "site": "jp01",
      "database": "dev_db"
    }
  }
}
```

Usage:
```bash
# Switch profile
tdx use profile production

# List profiles
tdx profiles
```

### Session Context

Set temporary overrides for current shell:

```bash
# Set session database
tdx use database mydb

# Set session site
tdx use site jp01

# View current context
tdx context

# Clear session
tdx context --clear
```

### Project Config

Create `tdx.json` in project root:

```json
{
  "site": "us01",
  "database": "customer_analytics",
  "parent_segment": "active_users"
}
```

**Security:** Never commit API keys. Use profiles or `~/.config/tdx/.env`.

## Core Commands

### Databases

```bash
# List all databases
tdx databases

# Filter with pattern
tdx databases "prod_*"

# Specify site
tdx databases --site jp01

# JSON output
tdx databases --json
```

Sites: `us01` (default), `jp01`, `eu01`, `ap02`

### Tables

```bash
# Set database context first (recommended)
tdx use database mydb

# Then list tables without repeating database
tdx tables
tdx tables "user_*"

# Describe table schema
tdx describe users

# Show table contents
tdx show users --limit 10

# Alternative: specify database inline
tdx tables "mydb.*"
tdx tables --in mydb
tdx describe mydb.users
```

**Pattern Syntax:**
- `mydb.*` - all tables from mydb
- `*.users` - users table from all databases
- `prod_*.access_log` - access_log from databases starting with prod_

### Queries

```bash
# Execute SQL query
tdx query "SELECT * FROM mydb.users LIMIT 10"

# With database context
tdx query "SELECT * FROM users" --database mydb

# From file (recommended for complex queries)
tdx query -f query.sql

# Multi-statement from file
tdx query -f setup-and-query.sql
```

**Best Practice:** For complex or multi-line SQL queries, save to a file and use `-f` option:
```bash
tdx query -f my_complex_query.sql
```

**Multi-statement execution:**
Separate statements with semicolons. Execution stops on first error.

### Output Formats

```bash
# Table format (default, human-readable)
tdx databases

# JSON (for jq/scripting)
tdx databases --json

# JSON Lines (streaming)
tdx query "SELECT * FROM users" --jsonl

# TSV (tab-separated)
tdx databases --tsv

# Save to file
tdx databases --json --output databases.json
```

## Common Patterns

### Pattern 1: Explore Database

```bash
# Set context once
tdx use database sample_datasets
tdx use site jp01

# Now explore without flags
tdx tables
tdx describe www_access
tdx show www_access --limit 10
```

### Pattern 2: Profile-Based Workflow

```bash
# Switch to production
tdx use profile prod
tdx tables

# Switch to dev
tdx use profile dev
tdx tables
```

### Pattern 3: Query and Process

```bash
# Query and pipe to jq
tdx query "SELECT * FROM users" --json | jq '.[0]'

# Query as JSONL and process line by line
tdx query "SELECT * FROM users" --jsonl | while read line; do
  echo "$line" | jq '.name'
done
```

### Pattern 4: Multi-Site Comparison

```bash
# Check databases in different regions
tdx databases --site us01 --json > us_dbs.json
tdx databases --site jp01 --json > jp_dbs.json
```

## Global Options

Available for all commands:

- `--profile <name>` - Use specific profile configuration
- `--site <site>` - TD site/region (us01, jp01, eu01, ap02)
- `--format <format>` - Output format (table, json, jsonl, tsv)
- `--json` - JSON output (shorthand)
- `--jsonl` - JSON Lines output (shorthand)
- `--tsv` - TSV output (shorthand)
- `--output <file>` - Save to file
- `--limit <rows>` - Max rows (table format, default: 40)
- `--verbose` - Verbose logging
- `--timeout <seconds>` - Timeout (default: 30)
- `--dry-run` - Preview without executing
- `-y, --yes` - Skip confirmations

## Best Practices

1. **Always Use Time Filters** - Most TD data is time-series. Use `TD_INTERVAL` or `TD_TIME_RANGE` for partition pruning and better performance
2. **Use Context Management** - Set database/profile once instead of repeating flags
3. **Use Profiles** - Define prod/dev/staging profiles for easy switching
4. **Pattern Matching** - Use wildcards (`*`) to filter databases/tables
5. **Right Output Format** - JSON/JSONL for scripting, table for review
6. **Never Commit Keys** - Store API keys in `~/.config/tdx/.env`, not in git
7. **Test with LIMIT** - Add LIMIT when exploring to avoid long queries
8. **Use --dry-run** - Preview operations on production

## TD-Specific Conventions

### Table Naming

TD uses dot notation: `database_name.table_name`

```bash
tdx show sample_datasets.www_access
```

### Time Column

The `time` column in TD tables is a **Unix timestamp** (seconds since epoch 1970-01-01 00:00:00 UTC). This is an integer value, not a datetime.

```sql
-- time column contains values like: 1735689600 (2025-01-01 00:00:00 UTC)
SELECT time, FROM_UNIXTIME(time) AS datetime FROM mydb.events LIMIT 1
```

### Time-Based Filtering

For partitioned tables, use time filters for performance:

```bash
# Use TD_INTERVAL for relative time (UTC default)
tdx query "
SELECT COUNT(*)
FROM mydb.access_logs
WHERE TD_INTERVAL(time, '-1d')
"

# With explicit timezone for Japan data
tdx query "
SELECT COUNT(*)
FROM mydb.access_logs
WHERE TD_INTERVAL(time, '-1d', 'JST')
"

# Use TD_TIME_RANGE for absolute time (UTC default)
tdx query "
SELECT COUNT(*)
FROM mydb.access_logs
WHERE TD_TIME_RANGE(time, '2025-01-01', '2025-01-31')
"
```

### Timezone

- **UTC is the default** - timezone parameter can be omitted
- **JST for Japan data** - must specify explicitly: `TD_INTERVAL(time, '-1d', 'JST')`
- Other timezones must be explicitly specified

## Common Issues

### API Key Not Found

**Error:** "TD_API_KEY not found"

**Solution:**
1. Run the interactive setup: `tdx auth setup`
2. Or manually create `~/.config/tdx/.env` with `TD_API_KEY=key_id/key_secret`
3. Or: `export TD_API_KEY=key_id/key_secret`
4. Verify format: `key_id/key_secret` (not just key_id)
5. Check authentication status: `tdx auth`

### Database Not Found

**Error:** "Database 'mydb' does not exist"

**Solution:**
1. List databases: `tdx databases`
2. Check correct site: `tdx databases --site jp01`
3. Use correct name in query

### Pattern Matching Not Working

**Solution:**
1. Always quote patterns: `tdx tables "prod_*"`
2. Or use `--in` flag: `tdx tables --in mydb`

## Table-Specific Options

For table commands (tables, describe, show):

- `-d, --database <name>` - Specify database
- `--in <database>` - Alias for --database (natural language)

```bash
# All equivalent
tdx tables "mydb.*"
tdx tables --in mydb
tdx tables -d mydb
```

## Query-Specific Options

For query command:

- `-f, --file <path>` - Read SQL from file
- `-d, --database <db>` - Database to query (default: information_schema)
- `--catalog <catalog>` - Trino catalog (default: td)

## Complete Command Reference

For full command list and advanced features, visit:
**https://tdx.treasuredata.com/**

Additional commands available:
- Job management (submit, list, kill, results)
- Segment operations (CDP)
- Activation commands
- Workflow commands
- LLM agent management
- Chat interface
- API access

## Related Skills

- **sql-skills/trino** - Advanced Trino query optimization
- **sql-skills/hive** - Hive query patterns
- **workflow-skills/digdag** - Automate tdx operations

## Resources

- Official Documentation: https://tdx.treasuredata.com/
- npm Package: https://www.npmjs.com/package/@treasuredata/tdx
- GitHub: https://github.com/treasure-data/tdx
- TD Documentation: https://docs.treasuredata.com
