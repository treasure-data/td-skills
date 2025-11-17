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
- Converting tdx output to different formats
- Troubleshooting tdx CLI issues

## Installation and Setup

### Installing tdx

```bash
# Run directly with npx (no installation required)
npx @treasuredata/tdx databases

# Run latest version
npx @treasuredata/tdx@latest databases

# Or install globally
npm install -g @treasuredata/tdx

# Alternative: Use with Bun
bunx @treasuredata/tdx databases
```

### Configuring API Keys

Create `~/.config/tdx/.env`:

```bash
# Single API key (recommended for most users)
TD_API_KEY=your-key-id/your-key-secret

# Or use site-specific keys if working with multiple sites
# TD_API_KEY_US01=your-us-key-here/...
# TD_API_KEY_JP01=your-jp-key-here/...
```

Alternatively, set as environment variable:

```bash
# Export for all commands in session
export TD_API_KEY=your-key-id/your-key-secret

# Or set inline for a single command
TD_API_KEY=your-key-id/... tdx databases
```

## Context Management

tdx provides a unified context system to reduce repetitive flags. Context is resolved with this priority:

1. **CLI flags** (highest priority) - `--database`, `--site`, etc.
2. **Session context** - Shell-scoped overrides set with `tdx use`
3. **Project config** - Per-project defaults in `tdx.json`
4. **Profile config** - Account-specific settings in `~/.config/tdx/tdx.json`
5. **Global config** - Fallback defaults in `~/.config/tdx/tdx.json`

### Profiles

Profiles store long-lived account configurations:

```bash
# List all profiles with details
tdx profiles

# Set session profile (shell-scoped)
tdx use profile production
```

**Profile Structure** (`~/.config/tdx/tdx.json` or project `tdx.json`):

```json
{
  "profiles": {
    "production": {
      "description": "Production environment for US region",
      "site": "us01",
      "database": "analytics",
      "llm_project": "DataAnalytics"
    },
    "dev": {
      "description": "Development and testing environment",
      "site": "jp01",
      "database": "dev_db"
    }
  }
}
```

**Credentials** (store separately from profiles in `~/.config/tdx/.env.production`):

```bash
TD_API_KEY=1234/abcdefg...
```

### Session Context

Set temporary overrides for the current shell session:

```bash
# Set session database
tdx use database mydb

# Set session profile
tdx use profile production

# View current context
tdx context

# Clear session context
tdx context --clear
```

**How Session Scope Works:**

Sessions are automatically scoped to your current shell window using the parent process ID (PPID):
- Each terminal window maintains independent session context
- Context persists across multiple commands in the same terminal
- Sessions expire after 24 hours or when shell is closed

**Example:**
```bash
# Terminal Window 1
tdx use database analytics
tdx tables  # Uses database: analytics

# Terminal Window 2 (different session)
tdx tables  # Uses default database
```

### Project Config

Store per-project defaults in `tdx.json` at your project root:

```json
{
  "database": "customer_analytics",
  "parent_segment": "active_users",
  "llm_project": "CustomerInsights"
}
```

**Available Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `description` | string | Optional description | `"Production environment"` |
| `site` | string | TD site/region | `"us01"`, `"jp01"`, `"eu01"`, `"ap02"` |
| `database` | string | Default database | `"analytics"` |
| `parent_segment` | string | Default parent segment for CDP | `"active_users"` |
| `llm_project` | string | Default LLM project | `"DataAnalytics"` |

**Security Note:** Never commit API keys in project configs. Use profiles or global `.env` files.

### View Context

```bash
# Show current context
tdx context

# Show context with sources (debugging)
tdx context --debug
```

Example output:
```
[context]
site: us01 (global: ~/.config/tdx/tdx.json)
database: analytics (session)
profile: production (session)

Configuration Files:
  Session: /Users/user/.config/tdx/sessions/12345.json ✓
  Global: /Users/user/.config/tdx/tdx.json ✓
  Project: /Users/user/projects/myproject/tdx.json ✓
```

## Database Operations

### List Databases

```bash
# List all databases
tdx databases

# Filter by pattern (glob/wildcards)
tdx databases "prod_*"
tdx databases "*_analytics"

# Specify site/region
tdx databases --site jp01

# Output as JSON
tdx databases --format json
tdx databases --json  # shorthand
```

### Site Selection

Available sites:
- `us01` - United States (default)
- `jp01` - Japan (Tokyo)
- `eu01` - Europe
- `ap02` - Asia Pacific

```bash
# Query Tokyo region
tdx databases --site jp01

# Or set in session
tdx use site jp01
tdx databases  # Now uses jp01
```

## Table Operations

All table commands use dot-separated patterns: `(database).(table)`

### List Tables

```bash
# List all tables from all databases
tdx tables

# List all tables from specific database
tdx tables "mydb.*"
tdx tables --in mydb
tdx tables --database mydb
tdx tables -d mydb

# Filter tables with pattern
tdx tables "mydb.user_*"

# Database pattern with table
tdx tables "prod_*.access_log"

# Wildcard database and table
tdx tables "*.user*"
```

**Pattern Syntax:**
- Database wildcard: `"mydb.*"` → all tables from mydb
- Database.table: `mydb.users` → specific table
- Wildcards: `"*.users"`, `"prod_*.user*"` → pattern matching
- Catalog: `"td.mydb.users"` → with catalog prefix

**Alternative Syntax for Database:**

There are multiple ways to specify the database:

```bash
# Using dot notation (recommended for patterns)
tdx tables "mydb.*"

# Using --in flag (natural language style, no quotes needed)
tdx tables --in mydb

# Using --database flag (or -d shorthand)
tdx tables --database mydb
tdx tables -d mydb
```

### Describe Table Schema

```bash
# Show table schema
tdx describe mydb.users
tdx desc mydb.users  # alias

# Using flags
tdx describe users --in mydb
tdx describe users -d mydb

# With explicit catalog
tdx describe td.mydb.users
```

### Show Table Contents

```bash
# Show table contents (SELECT * with limit)
tdx show mydb.users

# With custom row limit
tdx show mydb.users --limit 10

# Using flags
tdx show users --in mydb
tdx show users -d mydb

# With explicit catalog
tdx show td.mydb.users --limit 5
```

## Query Operations

### Execute SQL Queries

```bash
# Execute SQL query (inline)
tdx query "SELECT * FROM mydb.users LIMIT 10"

# With database context
tdx query "SELECT * FROM users" --database mydb
tdx query "SELECT * FROM users" --in mydb
tdx query "SELECT * FROM users" -d mydb

# Without database (uses information_schema by default)
tdx query "SELECT 1"

# With catalog
tdx query "SELECT * FROM td.mydb.users" --catalog td
```

### Query from Files

```bash
# Execute SQL from file
tdx query --file query.sql
tdx query -f query.sql

# With options
tdx query -f query.sql --database mydb --format json --output results.json
```

### Multi-Statement Execution

Execute multiple SQL statements sequentially by separating with semicolons:

**From command line:**
```bash
tdx query "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM orders"
```

**From file** (`setup-and-query.sql`):
```sql
CREATE TABLE temp_users AS SELECT * FROM users WHERE active = true;
CREATE TABLE temp_orders AS SELECT * FROM orders WHERE user_id IN (SELECT id FROM temp_users);
SELECT COUNT(*) as order_count FROM temp_orders;
```

```bash
tdx query -f setup-and-query.sql
```

**Output Behavior:**
- Each statement executes sequentially with progress indication
- Console output: All results displayed as they complete
- File output (`--output results.txt`): All results appended to single file
- Fail-fast: Execution stops on first error

**Example Output:**
```
✔ Statement 1/3 - Query completed: Processed 1,000 rows in 2.3s
┌────────────┐
│ user_count │
├────────────┤
│ 1000       │
└────────────┘
✔ Statement 2/3 - Query completed: Processed 5,000 rows in 3.1s
...
```

## Output Formats

tdx supports multiple output formats for query results and command outputs.

### Table Format (default)

Human-readable ASCII table with column types and row counts:

```bash
tdx query "SELECT name, age FROM users LIMIT 2"
```

Output:
```
┌───────┬─────┐
│ name  │ age │
│ string│ int │
├───────┼─────┤
│ Alice │  25 │
│ Bob   │  30 │
├───────┴─────┤
│ 2 rows      │
└─────────────┘
```

**Interactive Table Navigation:**

When viewing table output in a terminal, tdx automatically pipes through `less` for easy navigation:

| Key | Action |
|-----|--------|
| `q` | Quit and return to terminal |
| `↑`/`↓` | Scroll up/down one line |
| `Space`/`Page Down` | Scroll down one page |
| `b`/`Page Up` | Scroll up one page |
| `←`/`→` | Scroll left/right (for wide tables) |
| `/pattern` | Search forward |
| `n` | Repeat search forward |
| `g` | Go to first line |
| `G` | Go to last line |

### JSON Format

Readable JSON array with newlines:

```bash
tdx query "SELECT name, age FROM users LIMIT 2" --format json
tdx query "SELECT name, age FROM users LIMIT 2" --json  # shorthand
```

Output:
```json
[
  {"name":"Alice","age":25},
  {"name":"Bob","age":30}
]
```

Perfect for piping to `jq`:
```bash
tdx query "SELECT * FROM users" --json | jq '.[0]'
tdx query "SELECT * FROM users" --json | jq 'length'
```

### JSON Lines Format (jsonl)

One JSON object per line - ideal for streaming:

```bash
tdx query "SELECT name, age FROM users LIMIT 2" --format jsonl
tdx query "SELECT name, age FROM users LIMIT 2" --jsonl  # shorthand
```

Output:
```
{"name":"Alice","age":25}
{"name":"Bob","age":30}
```

Process line by line:
```bash
tdx query "SELECT * FROM users" --jsonl | while read line; do
  echo "$line" | jq '.name'
done
```

### TSV Format

Tab-separated values with header row:

```bash
tdx query "SELECT name, age FROM users LIMIT 2" --format tsv
tdx query "SELECT name, age FROM users LIMIT 2" --tsv  # shorthand
```

Output:
```
name	age
Alice	25
Bob	30
```

### Color Output

tdx automatically adds ANSI colors in interactive terminals:

**Automatic Detection:**
- Enabled automatically when output is to a terminal (TTY)
- Disabled automatically when piped or saved to file
- Respects `NO_COLOR` environment variable

**Manual Control:**
```bash
# Force colors on
tdx databases --color

# Disable colors
tdx databases --no-color

# Disable via environment
NO_COLOR=1 tdx databases
```

**Priority Order:**
1. `--no-color` flag (highest)
2. `--color` flag
3. `NO_COLOR` environment variable
4. TTY detection (automatic)

### Save Output to File

```bash
# Save query results to file
tdx query "SELECT * FROM users" --output results.json

# Save database list
tdx databases --format json --output databases.json

# Combine verbose with output
tdx databases --verbose --output databases.json
```

## Global Options

Available for all commands:

- `--site <site>`: TD site/region (us01, jp01, eu01, ap02) - default: us01
- `--format <format>`: Output format (table, json, jsonl, tsv) - default: table
- `--json`: Output in JSON format (shorthand for --format json)
- `--jsonl`: Output in JSON Lines format (shorthand for --format jsonl)
- `--tsv`: Output in TSV format (shorthand for --format tsv)
- `--output <file>`: Save output to file
- `--limit <rows>`: Maximum rows to display in table format - default: 40
- `--color`: Force ANSI color output
- `--no-color`: Disable ANSI color output
- `--verbose`: Enable verbose logging
- `--timeout <seconds>`: Set operation timeout - default: 30
- `--dry-run`: Preview operation without executing
- `-y, --yes`: Skip confirmation prompts

**Note:** Shorthand flags (--json, --jsonl, --tsv) are only applied when --format is not explicitly specified.

## Common Patterns

### Pattern 1: Explore Database Structure

```bash
# List all databases
tdx databases

# Pick a database and list its tables
tdx tables --in sample_datasets

# Describe a specific table
tdx describe sample_datasets.www_access

# Preview table data
tdx show sample_datasets.www_access --limit 10
```

### Pattern 2: Query with Context

```bash
# Set session context
tdx use database customer_analytics
tdx use site jp01

# Now query without repeating flags
tdx tables  # Uses customer_analytics
tdx query "SELECT * FROM users LIMIT 5"  # Uses customer_analytics

# Clear context when done
tdx context --clear
```

### Pattern 3: Multi-Site Data Exploration

```bash
# Check US databases
tdx databases --site us01 --json > us_databases.json

# Check JP databases
tdx databases --site jp01 --json > jp_databases.json

# Compare
jq -r '.[] | .name' us_databases.json | sort
jq -r '.[] | .name' jp_databases.json | sort
```

### Pattern 4: Query and Transform Results

```bash
# Query as JSONL and process with jq
tdx query "SELECT user_id, email, created_at FROM users" --jsonl | \
  jq -r 'select(.created_at > "2025-01-01") | [.user_id, .email] | @tsv'

# Query as JSON and analyze
tdx query "SELECT country, COUNT(*) as count FROM users GROUP BY country" --json | \
  jq 'sort_by(-.count) | .[0:5]'
```

### Pattern 5: Profile-Based Workflow

**Setup** (`~/.config/tdx/tdx.json`):
```json
{
  "profiles": {
    "prod": {
      "site": "us01",
      "database": "production_analytics"
    },
    "dev": {
      "site": "jp01",
      "database": "dev_sandbox"
    }
  }
}
```

**Usage:**
```bash
# Switch to production
tdx use profile prod
tdx tables  # Lists production_analytics tables

# Switch to dev
tdx use profile dev
tdx tables  # Lists dev_sandbox tables
```

## Best Practices

1. **Use Context Management** - Set database/profile in session rather than repeating `--database` flag
2. **Use Profiles for Environments** - Define prod/dev/staging profiles instead of typing site/database each time
3. **Leverage Pattern Matching** - Use wildcards (`*`) to filter databases and tables efficiently
4. **Choose Right Output Format** - Use JSON/JSONL for scripting, table format for human review
5. **Save Results to Files** - Use `--output` for large result sets instead of terminal scrolling
6. **Use Multi-Statement for Setup** - Combine temp table creation and queries in single file
7. **Never Commit API Keys** - Store keys in `~/.config/tdx/.env`, not in project configs
8. **Use Project Configs** - Define project-specific defaults in `tdx.json` at project root
9. **Test Queries with LIMIT** - Always add LIMIT when exploring new tables to avoid long-running queries
10. **Use --dry-run for Safety** - Preview operations before executing on production

## Common Issues and Solutions

### Issue: "API key not found"

**Symptoms:**
- Error: "TD_API_KEY not found"
- Authentication failures

**Solutions:**
1. Create `~/.config/tdx/.env` with `TD_API_KEY=your-key-id/your-key-secret`
2. Or export environment variable: `export TD_API_KEY=your-key-id/...`
3. Verify key format: should be `key_id/key_secret`

### Issue: "Database not found"

**Symptoms:**
- Error: "Database 'mydb' does not exist"
- Empty table listings

**Solutions:**
1. Check database exists: `tdx databases`
2. Verify correct site: `tdx databases --site jp01`
3. Use correct database name in query: `tdx query "SELECT * FROM mydb.table"`

### Issue: Pattern matching not working

**Symptoms:**
- Wildcards not expanding correctly
- No results for pattern queries

**Solutions:**
1. Always quote patterns with wildcards: `tdx tables "prod_*"`
2. Check if shell is expanding the glob (quote to prevent)
3. Use `--in` flag for simple database filtering: `tdx tables --in mydb`

### Issue: Query timeout

**Symptoms:**
- Long-running queries timing out
- Default 30 second timeout too short

**Solutions:**
1. Increase timeout: `tdx query "..." --timeout 300`
2. Add LIMIT clause to reduce data scanned
3. Use TD_TIME_RANGE or TD_INTERVAL for time-based partitioning
4. Consider using job submission for very long queries

### Issue: Output truncated in terminal

**Symptoms:**
- Can't see all rows in table output
- Wide tables cut off

**Solutions:**
1. Use interactive navigation: Table format automatically uses `less`
2. Save to file: `tdx query "..." --output results.txt`
3. Use JSON/JSONL format for programmatic processing
4. Increase limit: `tdx query "..." --limit 1000`

### Issue: Session context not working across terminals

**Symptoms:**
- Context set in one terminal not available in another
- `tdx use database mydb` only works in one window

**Solutions:**
This is expected behavior - sessions are scoped per terminal (by PPID):
1. Use profiles instead: `tdx use profile prod` (then switch in other terminal too)
2. Use project config: Create `tdx.json` in project directory
3. Use `--session` option for explicit session sharing: `tdx --session my-session use database mydb`

## TD-Specific Conventions

### Table Naming

TD uses dot notation: `database_name.table_name`

```bash
# Correct
tdx show sample_datasets.www_access

# With catalog (optional)
tdx show td.sample_datasets.www_access
```

### Time-Based Filtering

For partitioned tables, always use time filters for performance:

```bash
# Use TD_INTERVAL for relative time
tdx query "
SELECT COUNT(*)
FROM mydb.access_logs
WHERE TD_INTERVAL(time, '-1d', 'JST')
"

# Use TD_TIME_RANGE for absolute time
tdx query "
SELECT COUNT(*)
FROM mydb.access_logs
WHERE TD_TIME_RANGE(time, '2025-01-01', '2025-01-31', 'JST')
"
```

### Timezone Considerations

- Use `JST` timezone for Japan data
- Use `UTC` for other regions or mixed datasets
- Always specify timezone in TD time functions

```bash
# Japan data
tdx query "SELECT TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') FROM mydb.japan_events" --site jp01

# US data
tdx query "SELECT TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'UTC') FROM mydb.us_events" --site us01
```

## Related Skills

- **sql-skills/trino** - Advanced Trino query optimization and TD-specific functions
- **sql-skills/hive** - Hive query patterns for batch processing
- **workflow-skills/digdag** - Automate tdx operations in workflows

## Resources

- [tdx GitHub Repository](https://github.com/treasure-data/tdx)
- [tdx README](https://github.com/treasure-data/tdx/blob/main/README.md)
- Treasure Data Documentation: https://docs.treasuredata.com
