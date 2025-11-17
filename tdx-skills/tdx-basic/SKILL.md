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

### Quick Start

```bash
# Run directly with Bun (recommended - always uses latest version)
bunx @treasuredata/tdx@latest databases

# Or install globally
npm install -g @treasuredata/tdx
tdx databases
```

### Configure API Key

Create `~/.config/tdx/.env`:

```bash
TD_API_KEY=your-key-id/your-key-secret
```

Or use environment variable:
```bash
export TD_API_KEY=your-key-id/your-key-secret
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

**Note:** Sessions are automatically scoped per terminal window (by PPID).

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
bunx @treasuredata/tdx@latest databases

# Filter with pattern
bunx @treasuredata/tdx@latest databases "prod_*"

# Specify site
bunx @treasuredata/tdx@latest databases --site jp01

# JSON output
bunx @treasuredata/tdx@latest databases --json
```

Sites: `us01` (default), `jp01`, `eu01`, `ap02`

### Tables

```bash
# List all tables
bunx @treasuredata/tdx@latest tables

# Tables from specific database
bunx @treasuredata/tdx@latest tables "mydb.*"
bunx @treasuredata/tdx@latest tables --in mydb
bunx @treasuredata/tdx@latest tables -d mydb

# Filter with pattern
bunx @treasuredata/tdx@latest tables "mydb.user_*"

# Describe table schema
bunx @treasuredata/tdx@latest describe mydb.users
bunx @treasuredata/tdx@latest desc users --in mydb

# Show table contents
bunx @treasuredata/tdx@latest show mydb.users --limit 10
bunx @treasuredata/tdx@latest show users --in mydb
```

**Pattern Syntax:**
- `mydb.*` - all tables from mydb
- `*.users` - users table from all databases
- `prod_*.access_log` - access_log from databases starting with prod_

### Queries

```bash
# Execute SQL query
bunx @treasuredata/tdx@latest query "SELECT * FROM mydb.users LIMIT 10"

# With database context
bunx @treasuredata/tdx@latest query "SELECT * FROM users" --database mydb

# From file
bunx @treasuredata/tdx@latest query -f query.sql

# Multi-statement from file
bunx @treasuredata/tdx@latest query -f setup-and-query.sql
```

**Multi-statement execution:**
Separate statements with semicolons. Execution stops on first error.

### Output Formats

```bash
# Table format (default, human-readable)
bunx @treasuredata/tdx@latest databases

# JSON (for jq/scripting)
bunx @treasuredata/tdx@latest databases --json

# JSON Lines (streaming)
bunx @treasuredata/tdx@latest query "SELECT * FROM users" --jsonl

# TSV (tab-separated)
bunx @treasuredata/tdx@latest databases --tsv

# Save to file
bunx @treasuredata/tdx@latest databases --json --output databases.json
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
bunx @treasuredata/tdx@latest query "SELECT * FROM users" --json | jq '.[0]'

# Query as JSONL and process line by line
bunx @treasuredata/tdx@latest query "SELECT * FROM users" --jsonl | while read line; do
  echo "$line" | jq '.name'
done
```

### Pattern 4: Multi-Site Comparison

```bash
# Check databases in different regions
bunx @treasuredata/tdx@latest databases --site us01 --json > us_dbs.json
bunx @treasuredata/tdx@latest databases --site jp01 --json > jp_dbs.json
```

## Global Options

Available for all commands:

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

1. **Use Context Management** - Set database/profile once instead of repeating flags
2. **Use Profiles** - Define prod/dev/staging profiles for easy switching
3. **Pattern Matching** - Use wildcards (`*`) to filter databases/tables
4. **Right Output Format** - JSON/JSONL for scripting, table for review
5. **Always Use Latest** - Run with `bunx @treasuredata/tdx@latest` for latest features
6. **Never Commit Keys** - Store API keys in `~/.config/tdx/.env`, not in git
7. **Test with LIMIT** - Add LIMIT when exploring to avoid long queries
8. **Use --dry-run** - Preview operations on production

## TD-Specific Conventions

### Table Naming

TD uses dot notation: `database_name.table_name`

```bash
bunx @treasuredata/tdx@latest show sample_datasets.www_access
```

### Time-Based Filtering

For partitioned tables, use time filters for performance:

```bash
# Use TD_INTERVAL for relative time
bunx @treasuredata/tdx@latest query "
SELECT COUNT(*)
FROM mydb.access_logs
WHERE TD_INTERVAL(time, '-1d', 'JST')
"

# Use TD_TIME_RANGE for absolute time
bunx @treasuredata/tdx@latest query "
SELECT COUNT(*)
FROM mydb.access_logs
WHERE TD_TIME_RANGE(time, '2025-01-01', '2025-01-31', 'JST')
"
```

### Timezone

- Use `JST` for Japan data
- Use `UTC` for other regions
- Always specify timezone in TD time functions

## Common Issues

### API Key Not Found

**Error:** "TD_API_KEY not found"

**Solution:**
1. Create `~/.config/tdx/.env` with `TD_API_KEY=key_id/key_secret`
2. Or: `export TD_API_KEY=key_id/key_secret`
3. Verify format: `key_id/key_secret` (not just key_id)

### Database Not Found

**Error:** "Database 'mydb' does not exist"

**Solution:**
1. List databases: `bunx @treasuredata/tdx@latest databases`
2. Check correct site: `bunx @treasuredata/tdx@latest databases --site jp01`
3. Use correct name in query

### Pattern Matching Not Working

**Solution:**
1. Always quote patterns: `bunx @treasuredata/tdx@latest tables "prod_*"`
2. Or use `--in` flag: `bunx @treasuredata/tdx@latest tables --in mydb`

### Query Timeout

**Solution:**
1. Increase timeout: `bunx @treasuredata/tdx@latest query "..." --timeout 300`
2. Add LIMIT clause
3. Use TD_INTERVAL/TD_TIME_RANGE for partition pruning

### Session Context Not Working Across Terminals

**Expected Behavior:** Sessions are scoped per terminal window (by PPID)

**Solution:**
1. Use profiles instead: `tdx use profile prod`
2. Use project config: Create `tdx.json`
3. Use explicit session: `tdx --session my-session use database mydb`

## Table-Specific Options

For table commands (tables, describe, show):

- `-d, --database <name>` - Specify database
- `--in <database>` - Alias for --database (natural language)

```bash
# All equivalent
bunx @treasuredata/tdx@latest tables "mydb.*"
bunx @treasuredata/tdx@latest tables --in mydb
bunx @treasuredata/tdx@latest tables -d mydb
```

## Query-Specific Options

For query command:

- `-f, --file <path>` - Read SQL from file
- `-d, --database <db>` - Database to query (default: information_schema)
- `--catalog <catalog>` - Trino catalog (default: td)

## Complete Command Reference

For full command list and advanced features, visit:
**https://www.npmjs.com/package/@treasuredata/tdx**

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

- npm Package: https://www.npmjs.com/package/@treasuredata/tdx
- GitHub: https://github.com/treasure-data/tdx
- TD Documentation: https://docs.treasuredata.com
