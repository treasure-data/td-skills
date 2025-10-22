---
name: trino-cli
description: Expert assistance for using the Trino CLI to query Treasure Data interactively from the command line. Use this skill when users need help with trino command-line tool, interactive query execution, connecting to TD via CLI, or terminal-based data exploration.
---

# Trino CLI for Treasure Data

Expert assistance for using the Trino CLI to query and explore Treasure Data interactively from the command line.

## When to Use This Skill

Use this skill when:
- Running interactive queries against TD from the terminal
- Exploring TD databases, tables, and schemas via command line
- Quick ad-hoc data analysis without opening a web console
- Writing shell scripts that execute TD queries
- Debugging queries with immediate feedback
- Working in terminal-based workflows (SSH, tmux, screen)
- Executing batch queries from the command line
- Testing queries before integrating into applications

## Core Principles

### 1. Installation

**Download Trino CLI:**
```bash
# Download the latest version
curl -o trino https://repo1.maven.org/maven2/io/trino/trino-cli/477/trino-cli-477-executable.jar

# Make it executable
chmod +x trino

# Move to PATH (optional)
sudo mv trino /usr/local/bin/

# Verify installation
trino --version
```

**Requirements:**
- Java 11 or later (Java 22+ recommended)
- Network access to TD API endpoint
- TD API key

**Alternative for Windows:**
```powershell
# Run with Java directly
java -jar trino-cli-477-executable.jar --version
```

### 2. Connecting to Treasure Data

**Basic Connection:**
```bash
trino \
  --server https://api-presto.treasuredata.com \
  --catalog td \
  --user YOUR_TD_API_KEY \
  --schema your_database
```

**Using Environment Variable:**
```bash
# Set TD API key as environment variable (recommended)
export TD_API_KEY="your_api_key_here"

# Connect using environment variable
trino \
  --server https://api-presto.treasuredata.com \
  --catalog td \
  --user $TD_API_KEY \
  --schema sample_datasets
```

**Regional Endpoints:**
- **US**: `https://api-presto.treasuredata.com`
- **Tokyo**: `https://api-presto.treasuredata.co.jp`
- **EU**: `https://api-presto.eu01.treasuredata.com`

### 3. Interactive Mode

Once connected, you enter an interactive SQL prompt:

```sql
trino:sample_datasets> SELECT COUNT(*) FROM nasdaq;
  _col0
---------
 8807790
(1 row)

Query 20250123_123456_00001_abcde, FINISHED, 1 node
Splits: 17 total, 17 done (100.00%)
0.45 [8.81M rows, 0B] [19.6M rows/s, 0B/s]

trino:sample_datasets> SHOW TABLES;
   Table
-----------
 nasdaq
 www_access
(2 rows)
```

**Interactive Commands:**
- `QUIT` or `EXIT` - Exit the CLI
- `CLEAR` - Clear the screen
- `HELP` - Show help information
- `HISTORY` - Show command history
- `USE schema_name` - Switch to different database
- `SHOW CATALOGS` - List available catalogs
- `SHOW SCHEMAS` - List databases
- `SHOW TABLES` - List tables in current schema
- `DESCRIBE table_name` - Show table structure
- `EXPLAIN query` - Show query execution plan

### 4. Batch Mode (Non-Interactive)

Execute queries from command line without entering interactive mode:

**Single Query:**
```bash
trino \
  --server https://api-presto.treasuredata.com \
  --catalog td \
  --user $TD_API_KEY \
  --schema sample_datasets \
  --execute "SELECT COUNT(*) FROM nasdaq"
```

**From File:**
```bash
trino \
  --server https://api-presto.treasuredata.com \
  --catalog td \
  --user $TD_API_KEY \
  --schema sample_datasets \
  --file queries.sql
```

**From stdin (pipe):**
```bash
echo "SELECT symbol, COUNT(*) as cnt FROM nasdaq GROUP BY symbol LIMIT 10" | \
  trino \
    --server https://api-presto.treasuredata.com \
    --catalog td \
    --user $TD_API_KEY \
    --schema sample_datasets
```

## Common Patterns

### Pattern 1: Interactive Data Exploration

```bash
# Connect to TD
export TD_API_KEY="your_api_key"

trino \
  --server https://api-presto.treasuredata.com \
  --catalog td \
  --user $TD_API_KEY \
  --schema sample_datasets

# Then in the interactive prompt:
```

```sql
-- List all databases
trino:sample_datasets> SHOW SCHEMAS;

-- Switch to a different database
trino:sample_datasets> USE analytics;

-- List tables
trino:analytics> SHOW TABLES;

-- Describe table structure
trino:analytics> DESCRIBE user_events;

-- Preview data
trino:analytics> SELECT * FROM user_events LIMIT 10;

-- Quick aggregation
trino:analytics> SELECT
    event_name,
    COUNT(*) as cnt
FROM user_events
WHERE TD_INTERVAL(time, '-1d', 'JST')
GROUP BY event_name
ORDER BY cnt DESC
LIMIT 10;

-- Exit
trino:analytics> EXIT;
```

**Explanation:** Interactive mode is perfect for exploring data, testing queries, and understanding table structures with immediate feedback.

### Pattern 2: Scripted Query Execution

```bash
#!/bin/bash
# daily_report.sh - Generate daily report from TD

export TD_API_KEY="your_api_key"
TD_SERVER="https://api-presto.treasuredata.com"
DATABASE="analytics"

# Create SQL file
cat > /tmp/daily_report.sql <<'EOF'
SELECT
    TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as date,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    APPROX_PERCENTILE(session_duration, 0.5) as median_duration
FROM user_events
WHERE TD_INTERVAL(time, '-1d', 'JST')
GROUP BY 1;
EOF

# Execute query and save results
trino \
  --server $TD_SERVER \
  --catalog td \
  --user $TD_API_KEY \
  --schema $DATABASE \
  --file /tmp/daily_report.sql \
  --output-format CSV_HEADER > daily_report_$(date +%Y%m%d).csv

echo "Report saved to daily_report_$(date +%Y%m%d).csv"

# Clean up
rm /tmp/daily_report.sql
```

**Explanation:** Batch mode is ideal for automation, scheduled reports, and integrating TD queries into shell scripts.

### Pattern 3: Multiple Queries with Error Handling

```bash
#!/bin/bash
# etl_pipeline.sh - Run multiple queries in sequence

export TD_API_KEY="your_api_key"
TD_SERVER="https://api-presto.treasuredata.com"

run_query() {
    local query="$1"
    local description="$2"

    echo "Running: $description"

    if trino \
        --server $TD_SERVER \
        --catalog td \
        --user $TD_API_KEY \
        --schema analytics \
        --execute "$query"; then
        echo "✓ Success: $description"
        return 0
    else
        echo "✗ Failed: $description"
        return 1
    fi
}

# Step 1: Create aggregated table
run_query "
CREATE TABLE IF NOT EXISTS daily_summary AS
SELECT
    TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as date,
    user_id,
    COUNT(*) as event_count
FROM raw_events
WHERE TD_INTERVAL(time, '-1d', 'JST')
GROUP BY 1, 2
" "Create daily summary table" || exit 1

# Step 2: Validate row count
COUNT=$(trino \
    --server $TD_SERVER \
    --catalog td \
    --user $TD_API_KEY \
    --schema analytics \
    --execute "SELECT COUNT(*) FROM daily_summary" \
    --output-format CSV_UNQUOTED)

echo "Processed $COUNT rows"

if [ "$COUNT" -gt 0 ]; then
    echo "✓ Pipeline completed successfully"
else
    echo "✗ Warning: No data processed"
    exit 1
fi
```

**Explanation:** Demonstrates error handling, sequential query execution, and validation in shell scripts using Trino CLI.

### Pattern 4: Configuration File for Easy Access

```bash
# Create ~/.trino_config
cat > ~/.trino_config <<EOF
server=https://api-presto.treasuredata.com
catalog=td
user=$TD_API_KEY
schema=sample_datasets
output-format-interactive=ALIGNED
EOF

# Now you can simply run:
trino

# No need to specify server, user, etc. every time
```

**Alternative - Create a wrapper script:**
```bash
# Create ~/bin/td-trino
cat > ~/bin/td-trino <<'EOF'
#!/bin/bash
trino \
  --server https://api-presto.treasuredata.com \
  --catalog td \
  --user ${TD_API_KEY} \
  --schema ${1:-sample_datasets}
EOF

chmod +x ~/bin/td-trino

# Usage:
td-trino                    # connects to sample_datasets
td-trino analytics          # connects to analytics database
```

**Explanation:** Configuration files and wrapper scripts simplify repeated connections and reduce typing.

### Pattern 5: Formatted Output for Different Use Cases

```bash
export TD_API_KEY="your_api_key"
TD_SERVER="https://api-presto.treasuredata.com"
DATABASE="sample_datasets"
QUERY="SELECT symbol, COUNT(*) as cnt FROM nasdaq GROUP BY symbol ORDER BY cnt DESC LIMIT 10"

# CSV for spreadsheets
trino \
  --server $TD_SERVER \
  --catalog td \
  --user $TD_API_KEY \
  --schema $DATABASE \
  --execute "$QUERY" \
  --output-format CSV_HEADER > results.csv

# JSON for APIs/applications
trino \
  --server $TD_SERVER \
  --catalog td \
  --user $TD_API_KEY \
  --schema $DATABASE \
  --execute "$QUERY" \
  --output-format JSON > results.json

# TSV for data processing
trino \
  --server $TD_SERVER \
  --catalog td \
  --user $TD_API_KEY \
  --schema $DATABASE \
  --execute "$QUERY" \
  --output-format TSV_HEADER > results.tsv

# Markdown for documentation
trino \
  --server $TD_SERVER \
  --catalog td \
  --user $TD_API_KEY \
  --schema $DATABASE \
  --execute "$QUERY" \
  --output-format MARKDOWN > results.md
```

**Explanation:** Different output formats enable integration with various downstream tools and workflows.

## Command-Line Options Reference

### Connection Options

| Option | Description | Example |
|--------|-------------|---------|
| `--server` | TD Presto endpoint | `https://api-presto.treasuredata.com` |
| `--catalog` | Catalog name | `td` |
| `--user` | TD API key | `$TD_API_KEY` |
| `--schema` | Default database | `sample_datasets` |
| `--password` | Enable password prompt | Not used for TD |

### Execution Options

| Option | Description |
|--------|-------------|
| `--execute "SQL"` | Execute single query and exit |
| `--file queries.sql` | Execute queries from file |
| `--ignore-errors` | Continue on error (batch mode) |
| `--client-request-timeout` | Query timeout (default: 2m) |

### Output Options

| Option | Description | Values |
|--------|-------------|--------|
| `--output-format` | Batch mode output format | CSV, JSON, TSV, MARKDOWN, etc. |
| `--output-format-interactive` | Interactive mode format | ALIGNED, VERTICAL, AUTO |
| `--no-progress` | Disable progress indicator | |
| `--pager` | Custom pager program | `less`, `more`, etc. |

### Display Options

| Option | Description |
|--------|-------------|
| `--debug` | Enable debug output |
| `--log-levels-file` | Custom logging configuration |
| `--disable-auto-suggestion` | Turn off autocomplete |

### Configuration

| Option | Description |
|--------|-------------|
| `--config` | Configuration file path | Alternative to `~/.trino_config` |
| `--session property=value` | Set session property |
| `--timezone` | Session timezone |
| `--client-tags` | Add metadata tags |

## Output Formats

Available output formats:

### Batch Mode Formats

- **CSV** - Comma-separated, quoted strings (default for batch)
- **CSV_HEADER** - CSV with header row
- **CSV_UNQUOTED** - CSV without quotes
- **CSV_HEADER_UNQUOTED** - CSV with header, no quotes
- **TSV** - Tab-separated values
- **TSV_HEADER** - TSV with header row
- **JSON** - JSON array of objects
- **MARKDOWN** - Markdown table format
- **NULL** - Execute but discard output

### Interactive Mode Formats

- **ALIGNED** - Pretty-printed table (default)
- **VERTICAL** - One column per line
- **AUTO** - Automatic format selection

**Example:**
```bash
# CSV with header for Excel
trino --execute "SELECT * FROM table" --output-format CSV_HEADER

# JSON for jq processing
trino --execute "SELECT * FROM table" --output-format JSON | jq '.[] | .user_id'

# Aligned for terminal viewing
trino --output-format-interactive ALIGNED
```

## Best Practices

1. **Always Use Environment Variables for API Keys**
   ```bash
   # In ~/.bashrc or ~/.zshrc
   export TD_API_KEY="your_api_key"
   ```
   Never hardcode API keys in scripts or commands

2. **Create Configuration File for Frequent Use**
   ```bash
   # ~/.trino_config
   server=https://api-presto.treasuredata.com
   catalog=td
   user=$TD_API_KEY
   ```

3. **Use TD Time Functions for Partition Pruning**
   ```sql
   -- Good: Uses partition pruning
   SELECT * FROM events WHERE TD_INTERVAL(time, '-1d', 'JST')

   -- Bad: Scans entire table
   SELECT * FROM events WHERE date = '2024-01-01'
   ```

4. **Add LIMIT for Exploratory Queries**
   ```sql
   -- Safe exploratory query
   SELECT * FROM large_table LIMIT 100;
   ```

5. **Use Batch Mode for Automation**
   ```bash
   # Don't use interactive mode in cron jobs
   trino --execute "SELECT ..." --output-format CSV > output.csv
   ```

6. **Enable Debug Mode for Troubleshooting**
   ```bash
   trino --debug --execute "SELECT ..."
   ```

7. **Set Reasonable Timeouts**
   ```bash
   # For long-running queries
   trino --client-request-timeout 30m --execute "SELECT ..."
   ```

8. **Use Appropriate Output Format**
   - CSV/TSV for data processing
   - JSON for programmatic parsing
   - ALIGNED for human viewing
   - MARKDOWN for documentation

9. **Leverage History in Interactive Mode**
   - Use ↑/↓ arrow keys to navigate history
   - Use Ctrl+R for reverse search
   - History saved in `~/.trino_history`

10. **Test Queries Interactively First**
    Test complex queries in interactive mode before adding to scripts

## Common Issues and Solutions

### Issue: Connection Refused or Timeout

**Symptoms:**
- `Connection refused`
- `Read timed out`
- Cannot connect to server

**Solutions:**
1. **Verify Endpoint URL**
   ```bash
   # Check you're using the correct regional endpoint
   # US: https://api-presto.treasuredata.com
   # Tokyo: https://api-presto.treasuredata.co.jp
   # EU: https://api-presto.eu01.treasuredata.com
   ```

2. **Check Network Connectivity**
   ```bash
   curl -I https://api-presto.treasuredata.com
   ```

3. **Verify Firewall/Proxy Settings**
   ```bash
   # If behind proxy
   trino --http-proxy proxy.example.com:8080 --server ...
   ```

4. **Increase Timeout**
   ```bash
   trino --client-request-timeout 10m --server ...
   ```

### Issue: Authentication Errors

**Symptoms:**
- `Authentication failed`
- `Unauthorized`
- `403 Forbidden`

**Solutions:**
1. **Check API Key Format**
   ```bash
   # Verify API key is set
   echo $TD_API_KEY  # Should display your API key
   ```

2. **Verify API Key is Set**
   ```bash
   if [ -z "$TD_API_KEY" ]; then
       echo "TD_API_KEY is not set"
   fi
   ```

3. **Test API Key with curl**
   ```bash
   curl -H "Authorization: TD1 $TD_API_KEY" \
        https://api.treasuredata.com/v3/database/list
   ```

4. **Regenerate API Key**
   - Log in to TD console
   - Generate new API key
   - Update environment variable

### Issue: Query Timeout

**Symptoms:**
- Query runs but never completes
- `Query exceeded maximum time limit`

**Solutions:**
1. **Add Time Filter**
   ```sql
   -- Add partition pruning
   SELECT * FROM table
   WHERE TD_INTERVAL(time, '-1d', 'JST')
   ```

2. **Increase Timeout**
   ```bash
   trino --client-request-timeout 30m --execute "..."
   ```

3. **Use Aggregations Instead**
   ```sql
   -- Instead of fetching all rows
   SELECT * FROM huge_table

   -- Aggregate first
   SELECT date, COUNT(*) FROM huge_table GROUP BY date
   ```

4. **Add LIMIT Clause**
   ```sql
   SELECT * FROM large_table LIMIT 10000
   ```

### Issue: Java Not Found

**Symptoms:**
- `java: command not found`
- `JAVA_HOME not set`

**Solutions:**
1. **Install Java**
   ```bash
   # macOS
   brew install openjdk@17

   # Ubuntu/Debian
   sudo apt-get install openjdk-17-jdk

   # RHEL/CentOS
   sudo yum install java-17-openjdk
   ```

2. **Set JAVA_HOME**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export JAVA_HOME=$(/usr/libexec/java_home -v 17)  # macOS
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk    # Linux
   ```

3. **Verify Java Version**
   ```bash
   java -version  # Should show 11 or higher
   ```

### Issue: Output Not Formatted Correctly

**Symptoms:**
- Broken table alignment
- Missing columns
- Garbled characters

**Solutions:**
1. **Specify Output Format Explicitly**
   ```bash
   # For batch mode
   trino --execute "..." --output-format CSV_HEADER

   # For interactive mode
   trino --output-format-interactive ALIGNED
   ```

2. **Check Terminal Width**
   ```bash
   # Wider terminal for better formatting
   stty size  # Check current size
   ```

3. **Use VERTICAL Format for Wide Tables**
   ```sql
   trino> SELECT * FROM wide_table\G
   -- Or set format
   trino> --output-format-interactive VERTICAL
   ```

4. **Disable Pager if Issues**
   ```bash
   trino --pager=''  # Disable pager
   ```

### Issue: History Not Working

**Symptoms:**
- Arrow keys don't show previous commands
- History not saved between sessions

**Solutions:**
1. **Check History File Permissions**
   ```bash
   ls -la ~/.trino_history
   chmod 600 ~/.trino_history
   ```

2. **Specify Custom History File**
   ```bash
   trino --history-file ~/my_trino_history
   ```

3. **Check Disk Space**
   ```bash
   df -h ~  # Ensure home directory has space
   ```

## Advanced Topics

### Session Properties

Set query-specific properties:

```bash
# Set query priority
trino \
  --session query_priority=1 \
  --server https://api-presto.treasuredata.com \
  --catalog td \
  --user $TD_API_KEY \
  --execute "SELECT * FROM large_table"

# Set multiple properties
trino \
  --session query_max_run_time=1h \
  --session query_priority=2 \
  --execute "SELECT ..."
```

### Using with jq for JSON Processing

```bash
# Query and process with jq
trino \
  --server https://api-presto.treasuredata.com \
  --catalog td \
  --user $TD_API_KEY \
  --schema sample_datasets \
  --execute "SELECT symbol, COUNT(*) as cnt FROM nasdaq GROUP BY symbol LIMIT 10" \
  --output-format JSON | \
  jq '.[] | select(.cnt > 1000) | .symbol'
```

### Parallel Query Execution

```bash
#!/bin/bash
# Run multiple queries in parallel

export TD_API_KEY="your_api_key"

run_query() {
    local database=$1
    local output=$2
    trino \
      --server https://api-presto.treasuredata.com \
      --catalog td \
      --user $TD_API_KEY \
      --schema $database \
      --execute "SELECT COUNT(*) FROM events WHERE TD_INTERVAL(time, '-1d', 'JST')" \
      --output-format CSV > $output
}

# Run in parallel using background jobs
run_query "database1" "count1.csv" &
run_query "database2" "count2.csv" &
run_query "database3" "count3.csv" &

# Wait for all to complete
wait

echo "All queries completed"
```

### Integration with Other Tools

**With csvkit:**
```bash
trino --execute "SELECT * FROM table" --output-format CSV | \
  csvstat
```

**With awk:**
```bash
trino --execute "SELECT symbol, cnt FROM nasdaq_summary" --output-format TSV | \
  awk '$2 > 1000 { print $1 }'
```

**With Python:**
```bash
trino --execute "SELECT * FROM table" --output-format JSON | \
  python -c "import sys, json; data = json.load(sys.stdin); print(len(data))"
```

## Interactive Commands Reference

Commands available in interactive mode:

| Command | Description |
|---------|-------------|
| `QUIT` or `EXIT` | Exit the CLI |
| `CLEAR` | Clear the screen |
| `HELP` | Show help information |
| `HISTORY` | Display command history |
| `USE schema` | Switch to different database |
| `SHOW CATALOGS` | List available catalogs |
| `SHOW SCHEMAS` | List all databases |
| `SHOW TABLES` | List tables in current schema |
| `SHOW COLUMNS FROM table` | Show table structure |
| `DESCRIBE table` | Show detailed table info |
| `EXPLAIN query` | Show query execution plan |
| `SHOW FUNCTIONS` | List available functions |

## Resources

- **Trino CLI Documentation**: https://trino.io/docs/current/client/cli.html
- **TD Presto Endpoints**:
  - US: https://api-presto.treasuredata.com
  - Tokyo: https://api-presto.treasuredata.co.jp
  - EU: https://api-presto.eu01.treasuredata.com
- **TD Documentation**: https://docs.treasuredata.com/
- **Trino SQL Reference**: https://trino.io/docs/current/sql.html

## Related Skills

- **trino**: SQL query syntax and optimization for Trino
- **hive**: Understanding Hive SQL differences
- **pytd**: Python-based querying (alternative to CLI)
- **td-javascript-sdk**: Browser-based data collection

## Comparison with Other Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Trino CLI** | Interactive command-line queries | Ad-hoc queries, exploration, shell scripts |
| **TD Console** | Web-based query interface | GUI preference, visualization, sharing |
| **pytd** | Python SDK | Complex ETL, pandas integration, notebooks |
| **TD Toolbelt** | TD-specific CLI | Bulk import, job management, administration |

**Recommendation:** Use Trino CLI for quick interactive queries and terminal-based workflows. Use TD Console for visualization and sharing. Use pytd for complex data pipelines.

---

*Last updated: 2025-01 | Trino CLI version: 477+*
