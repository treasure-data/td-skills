---
name: tdx-basic
description: Executes tdx CLI commands for Treasure Data. Covers `tdx databases`, `tdx tables`, `tdx describe`, `tdx query`, `tdx auth setup`, context management with profiles/sessions, and output formats (JSON/TSV/table). Use when users need tdx command syntax, authentication setup, database/table exploration, schema inspection, or query execution.
---

# tdx CLI - Basic Operations

## Setup

```bash
npm install -g @treasuredata/tdx

# Interactive setup (recommended)
tdx auth setup
tdx auth setup --profile production  # Multiple accounts

# Or manual: create ~/.config/tdx/.env
TDX_API_KEY=your-key-id/your-key-secret

# Verify
tdx auth
```

## Context Management

Context priority: CLI flags > session > project `tdx.json` > profile > global config

```bash
# Session context (scoped to current shell, expires after 24h)
tdx use database mydb
tdx profile use production   # Switch profile
tdx status                   # View current context and auth
tdx unset database           # Clear specific context
tdx use --clear              # Clear all session context
```

Session database eliminates the need for fully-qualified table names across commands:

```bash
tdx use database mydb
tdx tables                   # Lists mydb tables
tdx describe users           # Describes mydb.users
tdx query "select * from users limit 10"  # Queries mydb.users
```

### Profile Management

```bash
tdx profile list             # List all profiles
tdx profile create staging   # Create new profile (interactive)
tdx profile set database=dev # Set profile config
tdx --profile staging query "..." # One-off with different profile
```

### Profiles (~/.config/tdx/tdx.json)

```json
{
  "profiles": {
    "production": { "site": "us01", "database": "analytics" },
    "dev": { "site": "jp01", "database": "dev_db" }
  }
}
```

### Project Config (tdx.json in project root)

```json
{
  "site": "us01",
  "database": "customer_analytics",
  "parent_segment": "active_users"
}
```

## Core Commands

### Databases

```bash
tdx databases                    # List all
tdx databases "prod_*"           # Filter with pattern
tdx databases --json             # JSON output
```

Sites: `us01` (default), `jp01`, `eu01`, `ap02`

### Tables

When the target database is known, set context first:

```bash
tdx use database mydb            # Set context first
tdx tables                       # List tables in context database
tdx tables "user_*"              # Filter by pattern within context database

# Pattern syntax
tdx tables "mydb.*"              # All tables from mydb
```

Avoid `tdx tables "*.table_name"` — cross-database wildcard search is expensive. Set the database context instead.

### Schema Inspection

**Use `tdx describe` (or `tdx desc`) to check table schema** — column names, types, and partition info:

```bash
# Fully-qualified (works without session context)
tdx describe mydb.users
tdx desc mydb.users              # Short alias

# With session database set
tdx use database mydb
tdx describe users

# JSON output for programmatic use
tdx describe mydb.users --json

# Preview actual data (not schema)
tdx show mydb.users --limit 10
```

When exploring an unfamiliar table, run `tdx describe` first to understand columns before writing queries.

### Queries

```bash
# With session database set, use unqualified table names
tdx use database mydb
tdx query "select * from users limit 10"

# Or use fully-qualified names without session context
tdx query "select * from mydb.users limit 10"

tdx query -f query.sql           # From file
tdx query -                      # From stdin
echo "select 1" | tdx query -
tdx sg sql "Segment Name" | tdx query -  # Pipe segment SQL
```

### Output Formats

```bash
tdx databases --json             # JSON
tdx query "..." --jsonl          # JSON Lines (streaming)
tdx databases --tsv              # TSV
tdx databases --output out.json  # Save to file
```

## Global Options

```bash
tdx <command> --help             # Command help
--profile <name>                 # Use specific profile
--json / --jsonl / --tsv         # Output format
--output <file>                  # Save to file
--dry-run                        # Preview without executing
```

## TD-Specific Conventions

- **Table naming**: `database_name.table_name`
- **Time column**: Unix timestamp (seconds since epoch), not datetime
- **Time filtering**: Use `td_interval(time, '-1d/now')` or `td_time_range(time, 'start', 'end')` for partition pruning
- **Timezone**: UTC default; use `td_interval(time, '-1d', 'JST')` for Japan

```sql
select time, from_unixtime(time) as datetime from mydb.events limit 1
```


## Project Folder Structure

tdx organizes resources into conventional folders:

```
my-project/
├── tdx.json                    # Project config (site, database, contexts)
├── parent_segments/            # Parent segment definitions
│   ├── customer-360.yml
│   └── demo-audience.yml
├── segments/                   # Child segments and journeys (per parent)
│   └── customer-360/
│       ├── tdx.json            # { "parent_segment": "Customer 360" }
│       ├── high-value.yml      # Segment
│       ├── onboarding.yml      # Journey (type: journey)
│       └── marketing/          # Folder organization
│           └── newsletter.yml
├── workflows/                  # Digdag workflow projects
│   └── daily-etl/
│       ├── tdx.json            # { "workflow_project": "daily-etl" }
│       └── main.dig
└── agents/                     # LLM agents (per project)
    └── my-llm-project/
        ├── tdx.json            # { "llm_project": "My LLM Project" }
        ├── support-agent/
        │   ├── agent.yml
        │   └── prompt.md
        └── knowledge_bases/
            └── faq.yml
```

Each `tdx.json` stores context for its directory—commands run from any subdirectory use the nearest config.

## Resources

- Documentation: https://tdx.treasuredata.com/
- Related: **sql-skills/time-filtering**, **segment**, **journey**, **agent**
