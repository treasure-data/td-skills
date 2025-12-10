---
name: tdx-basic
description: Executes tdx CLI commands for Treasure Data. Covers `tdx databases`, `tdx tables`, `tdx query`, `tdx auth setup`, context management with profiles/sessions, and output formats (JSON/TSV/table). Use when users need tdx command syntax, authentication setup, database/table exploration, or query execution.
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
tdx query "select * from mydb.users"
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
# Simple query (single line)
tdx query "select * from mydb.users limit 10"

# With database context
tdx query "select * from users limit 10" --database mydb

# Complex query (use file)
tdx query -f query.sql

# Read SQL from stdin (use - as file argument)
echo "select 1" | tdx query -
cat query.sql | tdx query -

# Pipe segment SQL to query (see segment skill)
tdx sg sql "High Value Customers" | tdx query -

# Multi-statement from file
tdx query -f setup-and-query.sql
```

**Input options:**
- Inline SQL string: `tdx query "select ..."`
- File: `tdx query -f query.sql` or `tdx query query.sql`
- Stdin: `tdx query -` (reads from pipe or stdin)

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
tdx query "select * from users" --jsonl

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
tdx query "select * from users" --json | jq '.[0]'

# Query as JSONL and process line by line
tdx query "select * from users" --jsonl | while read line; do
  echo "$line" | jq '.name'
done
```

### Pattern 4: Segment Data Analysis

```bash
# Get segment SQL and run custom analysis
tdx sg sql "High Value Customers" | tdx query -

# Run segment SQL with output format
tdx sg sql "Active Users" | tdx query - --json

# Save segment data to file
tdx sg sql "VIP Customers" | tdx query - --json --output vip_data.json
```

### Pattern 5: Multi-Site Comparison

```bash
# Check databases in different regions
tdx databases --site us01 --json > us_dbs.json
tdx databases --site jp01 --json > jp_dbs.json
```

## Global Options

Use `tdx --help` or `tdx <command> --help` for complete options. Common options:
- `--profile <name>` - Use specific profile
- `--site <site>` - TD site (us01, jp01, eu01, ap02)
- `--json` / `--jsonl` / `--tsv` - Output format
- `--output <file>` - Save to file
- `--dry-run` - Preview without executing

## Best Practices

1. **Always Use Time Filters** - Most TD data is time-series. Use `td_interval` or `td_time_range` for partition pruning and better performance
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
select time, from_unixtime(time) as datetime from mydb.events limit 1
```

### Time-Based Filtering

For partitioned tables, use time filters for performance:

```bash
# Simple queries - use single-line format
tdx query "select count(*) from mydb.access_logs where td_interval(time, '-1d')"
tdx query "select count(*) from mydb.access_logs where td_interval(time, '-1d', 'JST')"
tdx query "select count(*) from mydb.access_logs where td_time_range(time, '2025-01-01', '2025-01-31')"

# Complex queries - use file with -f flag
tdx query -f time_analysis.sql
```

See **sql-skills/time-filtering** for comprehensive time filtering patterns.

### Timezone

- **UTC is the default** - timezone parameter can be omitted
- **JST for Japan data** - must specify explicitly: `td_interval(time, '-1d', 'JST')`
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

## Command-Specific Options

For table commands: `-d, --database <name>` or `--in <database>`
For query command: `-f, --file <path>` to read SQL from file

Use `tdx <command> --help` for complete options.

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
