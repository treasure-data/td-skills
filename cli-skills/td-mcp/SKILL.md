---
name: td-mcp
description: Expert assistance for connecting Claude Code to Treasure Data via MCP (Model Context Protocol) server. Use this skill when users need help setting up TD MCP integration, using MCP tools to query TD, managing databases and tables through MCP, or troubleshooting MCP connections.
---

# Treasure Data MCP Server

Expert assistance for integrating Treasure Data with Claude Code using the Model Context Protocol (MCP) server.

## When to Use This Skill

Use this skill when:
- Setting up Claude Code to access Treasure Data via MCP
- Configuring TD MCP server for the first time
- Using MCP tools to query TD databases and tables
- Exploring TD data through Claude Code's natural language interface
- Managing TD workflows and CDP segments via MCP
- Troubleshooting MCP connection or authentication issues
- Understanding available MCP tools and their usage
- Switching between TD regions (US, JP, EU, AP)

## What is TD MCP Server?

The Treasure Data MCP (Model Context Protocol) server enables Claude Code and other AI assistants to interact with Treasure Data through a secure, controlled interface. It provides:

- **Direct TD Access**: Query databases, tables, and execute SQL from Claude Code
- **Read-Only by Default**: Secure access with optional write operations
- **Multi-Region Support**: Works with all TD deployment regions
- **Natural Language Queries**: Ask questions about your data in plain English
- **Workflow Management**: Monitor and control TD workflows
- **CDP Integration**: Manage customer segments and activations

**Status**: Public preview (free during preview, usage-based pricing planned)

## Core Principles

### 1. Installation

**Prerequisites:**
- Node.js 18.0.0 or higher
- TD API key with appropriate permissions
- Claude Code installed

**Check Node.js Version:**
```bash
node --version  # Should show v18.0.0 or higher
```

**Install Node.js if needed:**
```bash
# macOS (Homebrew)
brew install node

# Windows (winget)
winget install OpenJS.NodeJS

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**No Installation Required:**
The MCP server runs via npx, so no global installation is needed. However, you can optionally install globally:

```bash
npm install -g @treasuredata/mcp-server
```

### 2. Setup with Claude Code

**Quick Setup:**
```bash
# Set your TD API key
export TD_API_KEY="1/your_api_key_here"

# Add TD MCP server to Claude Code
claude mcp add td -e TD_API_KEY=$TD_API_KEY -- npx @treasuredata/mcp-server
```

**With Custom Configuration:**
```bash
# US region with default database
claude mcp add td \
  -e TD_API_KEY=$TD_API_KEY \
  -e TD_SITE=us01 \
  -e TD_DATABASE=sample_datasets \
  -- npx @treasuredata/mcp-server

# Tokyo region
claude mcp add td \
  -e TD_API_KEY=$TD_API_KEY \
  -e TD_SITE=jp01 \
  -- npx @treasuredata/mcp-server

# EU region
claude mcp add td \
  -e TD_API_KEY=$TD_API_KEY \
  -e TD_SITE=eu01 \
  -- npx @treasuredata/mcp-server
```

**Enable Write Operations (Optional):**
```bash
# Enable INSERT, UPDATE, DELETE, CREATE, DROP operations
claude mcp add td \
  -e TD_API_KEY=$TD_API_KEY \
  -e TD_ENABLE_UPDATES=true \
  -- npx @treasuredata/mcp-server
```

**Verify Installation:**
```bash
# List installed MCP servers
claude mcp list

# Should show 'td' in the list
```

### 3. Configuration Options

**Environment Variables:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TD_API_KEY` | Yes | - | Your Treasure Data API key |
| `TD_SITE` | No | `us01` | TD region: us01, jp01, eu01, ap02, ap03 |
| `TD_DATABASE` | No | - | Default database for queries |
| `TD_ENABLE_UPDATES` | No | `false` | Enable write operations |

**Regional Endpoints:**
- `us01` - United States (default)
- `jp01` - Tokyo, Japan
- `eu01` - European Union
- `ap02` - Asia Pacific (Seoul)
- `ap03` - Asia Pacific (Tokyo alternate)

### 4. Using MCP Tools in Claude Code

Once configured, you can use natural language to interact with TD:

**Example Queries:**
```
"Show me all databases in my TD account"
"List tables in the sample_datasets database"
"What's the schema of the nasdaq table?"
"Query the top 10 symbols by count from nasdaq table"
"Show me yesterday's events from the user_events table"
```

Claude Code will automatically use the appropriate MCP tools to fulfill your requests.

## Available MCP Tools

### Data Exploration Tools

#### 1. list_databases
Lists all databases in your TD account.

**Usage in Claude Code:**
```
"List all my TD databases"
"Show me what databases I have"
```

**Direct Tool Call:**
```json
{
  "tool": "list_databases"
}
```

#### 2. list_tables
Lists tables in a database.

**Usage in Claude Code:**
```
"List tables in sample_datasets"
"What tables are in my analytics database?"
```

**Direct Tool Call:**
```json
{
  "tool": "list_tables",
  "database": "sample_datasets"
}
```

#### 3. describe_table
Shows schema information for a specific table.

**Usage in Claude Code:**
```
"Describe the nasdaq table"
"What columns does user_events have?"
"Show me the schema of the transactions table"
```

**Direct Tool Call:**
```json
{
  "tool": "describe_table",
  "database": "sample_datasets",
  "table": "nasdaq"
}
```

#### 4. current_database
Shows the current database context.

**Usage in Claude Code:**
```
"What database am I currently using?"
"Show current database"
```

#### 5. use_database
Switches the database context for subsequent queries.

**Usage in Claude Code:**
```
"Switch to the analytics database"
"Use the sample_datasets database"
```

**Direct Tool Call:**
```json
{
  "tool": "use_database",
  "database": "analytics"
}
```

### Query Execution Tools

#### 6. query (Read-Only)
Executes read-only SQL queries (SELECT, SHOW, DESCRIBE).

**Features:**
- Default limit: 40 rows (optimized for LLM context)
- Configurable up to 10,000 rows
- Automatic timeout handling
- Safe for production use

**Usage in Claude Code:**
```
"Query the nasdaq table and show me the top 10 symbols"
"SELECT COUNT(*) FROM user_events WHERE TD_INTERVAL(time, '-1d')"
"Show me yesterday's revenue from transactions"
```

**Direct Tool Call:**
```json
{
  "tool": "query",
  "sql": "SELECT symbol, COUNT(*) as cnt FROM nasdaq GROUP BY symbol ORDER BY cnt DESC LIMIT 10"
}
```

**With Custom Row Limit:**
```json
{
  "tool": "query",
  "sql": "SELECT * FROM large_table LIMIT 100",
  "max_rows": 100
}
```

#### 7. execute (Write Operations)
Executes write operations (INSERT, UPDATE, DELETE, CREATE, DROP).

**Requirements:**
- Must set `TD_ENABLE_UPDATES=true`
- Use with caution in production

**Usage in Claude Code:**
```
"Create a table called test_table with columns id and name"
"Insert a test row into test_table"
```

**Direct Tool Call:**
```json
{
  "tool": "execute",
  "sql": "CREATE TABLE test_table (id INT, name VARCHAR)"
}
```

### CDP Tools (Experimental)

#### 8. list_parent_segments
Lists all parent segments in CDP.

**Usage in Claude Code:**
```
"List all parent segments"
"Show me my CDP parent segments"
```

#### 9. get_parent_segment
Gets details of a specific parent segment.

**Usage in Claude Code:**
```
"Get details for parent segment 12345"
```

#### 10. list_segments
Lists segments under a parent segment.

**Usage in Claude Code:**
```
"List segments in parent segment 12345"
```

#### 11. list_activations
Lists syndications/activations for a segment.

**Usage in Claude Code:**
```
"Show activations for segment 67890"
```

#### 12. get_segment
Returns segment details including rules.

**Usage in Claude Code:**
```
"Get segment 67890 details"
```

#### 13. parent_segment_sql
Retrieves parent segment SQL statement.

**Usage in Claude Code:**
```
"Show SQL for parent segment 12345"
```

#### 14. segment_sql
Gets segment SQL with filtering conditions.

**Usage in Claude Code:**
```
"Show SQL for segment 67890"
```

### Workflow Tools (Experimental)

#### 15. list_projects
Lists workflow projects with pagination.

**Usage in Claude Code:**
```
"List all workflow projects"
"Show me my digdag projects"
```

#### 16. list_workflows
Lists workflows, optionally filtered by project.

**Usage in Claude Code:**
```
"List workflows in project my_project"
"Show all workflows"
```

#### 17. list_sessions
Lists execution sessions with status and time filtering.

**Usage in Claude Code:**
```
"Show recent workflow sessions"
"List failed workflow executions"
```

## Common Patterns

### Pattern 1: Initial Setup and Data Exploration

```bash
# Step 1: Install and configure TD MCP
export TD_API_KEY="1/your_api_key"
claude mcp add td \
  -e TD_API_KEY=$TD_API_KEY \
  -e TD_SITE=us01 \
  -- npx @treasuredata/mcp-server

# Step 2: Start Claude Code
claude

# Step 3: Explore your data (in Claude Code conversation)
```

In Claude Code:
```
> List all my TD databases

> Switch to sample_datasets database

> List tables in this database

> Describe the nasdaq table

> Query: SELECT symbol, COUNT(*) as cnt FROM nasdaq
  GROUP BY symbol ORDER BY cnt DESC LIMIT 10
```

**Explanation:** This pattern establishes MCP connection and progressively explores TD data structure using natural language.

### Pattern 2: Time-Series Data Analysis

In Claude Code:
```
> Switch to the analytics database

> Query yesterday's events:
  SELECT
    event_name,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users
  FROM user_events
  WHERE TD_INTERVAL(time, '-1d', 'JST')
  GROUP BY event_name
  ORDER BY event_count DESC

> Now show me the last 7 days trend:
  SELECT
    TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as date,
    COUNT(*) as daily_events
  FROM user_events
  WHERE TD_INTERVAL(time, '-7d', 'JST')
  GROUP BY 1
  ORDER BY 1

> What's the hourly pattern for today?
  SELECT
    TD_TIME_FORMAT(time, 'HH', 'JST') as hour,
    COUNT(*) as event_count
  FROM user_events
  WHERE TD_INTERVAL(time, '0d', 'JST')
  GROUP BY 1
  ORDER BY 1
```

**Explanation:** Uses TD_INTERVAL for efficient time-based queries. MCP automatically limits results for optimal LLM context.

### Pattern 3: Multi-Database Analysis

In Claude Code:
```
> Switch to sales database

> What's the total revenue from yesterday?
  SELECT SUM(amount) as total_revenue
  FROM transactions
  WHERE TD_INTERVAL(time, '-1d', 'JST')

> Now switch to marketing database

> How many new users signed up yesterday?
  SELECT COUNT(DISTINCT user_id) as new_users
  FROM user_signups
  WHERE TD_INTERVAL(time, '-1d', 'JST')

> Can you join data from both databases to calculate
  revenue per new user?
```

**Explanation:** Demonstrates switching between databases and combining insights from multiple data sources.

### Pattern 4: Schema Discovery and Documentation

In Claude Code:
```
> List all tables in the production database

> For each table, show me:
  1. The table schema
  2. Row count
  3. Sample of first 5 rows

> Can you create a markdown document describing
  all tables and their relationships?

> Which tables have a 'user_id' column?
```

**Explanation:** Uses MCP tools to automatically document database schema and relationships.

### Pattern 5: Workflow Monitoring

In Claude Code:
```
> List all workflow projects

> Show workflows in the etl_pipeline project

> List recent workflow sessions for the daily_aggregation workflow

> Are there any failed workflow executions in the last 24 hours?

> Show me the details of the most recent failed session
```

**Explanation:** Monitors TD workflows through MCP, useful for debugging and operational awareness.

## Best Practices

1. **Use Read-Only Mode by Default**
   - Keep `TD_ENABLE_UPDATES=false` for safety
   - Only enable write operations when necessary
   - Create separate MCP connections for read and write if needed

2. **Leverage TD Time Functions**
   ```sql
   -- Good: Uses partition pruning
   WHERE TD_INTERVAL(time, '-1d', 'JST')

   -- Avoid: Scans entire table
   WHERE date = '2024-01-01'
   ```

3. **Be Mindful of Result Sizes**
   - Default 40 rows is optimized for LLM context
   - Use aggregations instead of raw data when possible
   - Add explicit LIMIT clauses for large tables

4. **Set Default Database**
   ```bash
   # Reduces need to specify database repeatedly
   claude mcp add td \
     -e TD_API_KEY=$TD_API_KEY \
     -e TD_DATABASE=your_main_database \
     -- npx @treasuredata/mcp-server
   ```

5. **Use Natural Language**
   - MCP works best with conversational queries
   - You can refine queries through dialogue
   - Claude Code understands context from previous messages

6. **Regional Configuration**
   - Always set `TD_SITE` to match your data location
   - Reduces latency and ensures data residency compliance

7. **Secure API Key Management**
   ```bash
   # Store in environment variable
   export TD_API_KEY="1/your_key"

   # Or use shell config
   echo 'export TD_API_KEY="1/your_key"' >> ~/.bashrc
   ```

8. **Test Queries Interactively**
   - Use Claude Code to test and refine queries
   - Once optimized, save to scripts or workflows

9. **Use Descriptive Names**
   - When adding MCP server, use descriptive names
   - Example: `claude mcp add td-production` vs `td-staging`

10. **Monitor Usage**
    - MCP is free during preview
    - Track your usage patterns for future planning

## Common Issues and Solutions

### Issue: Node.js Version Too Old

**Symptoms:**
- Error: "Node.js version 18.0.0 or higher required"
- MCP server fails to start

**Solutions:**
```bash
# Check current version
node --version

# Update Node.js (macOS)
brew upgrade node

# Update Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should show v18.0.0+
```

### Issue: Authentication Failed

**Symptoms:**
- "Authentication error"
- "Invalid API key"
- "403 Forbidden"

**Solutions:**
1. **Verify API Key Format**
   ```bash
   echo $TD_API_KEY
   # Should show: 1/abc123...
   ```

2. **Check API Key Permissions**
   - Log in to TD console
   - Verify key has appropriate permissions
   - Regenerate if necessary

3. **Verify Regional Endpoint**
   ```bash
   # Ensure TD_SITE matches your account region
   claude mcp remove td
   claude mcp add td \
     -e TD_API_KEY=$TD_API_KEY \
     -e TD_SITE=jp01 \
     -- npx @treasuredata/mcp-server
   ```

4. **Test API Key with curl**
   ```bash
   curl -H "Authorization: TD1 $TD_API_KEY" \
        https://api.treasuredata.com/v3/database/list
   ```

### Issue: MCP Server Not Found

**Symptoms:**
- "td: command not found"
- Claude Code doesn't see TD tools

**Solutions:**
1. **Verify MCP Installation**
   ```bash
   claude mcp list
   # Should show 'td' in output
   ```

2. **Re-add MCP Server**
   ```bash
   claude mcp remove td
   claude mcp add td -e TD_API_KEY=$TD_API_KEY -- npx @treasuredata/mcp-server
   ```

3. **Check npx is Available**
   ```bash
   which npx
   # Should show path to npx
   ```

4. **Restart Claude Code**
   ```bash
   # Exit and restart Claude Code
   ```

### Issue: Query Timeout

**Symptoms:**
- Query runs but never completes
- Timeout error after several minutes

**Solutions:**
1. **Add Time Filter**
   ```sql
   -- Add TD_INTERVAL for partition pruning
   SELECT * FROM large_table
   WHERE TD_INTERVAL(time, '-1d', 'JST')
   ```

2. **Use Aggregations**
   ```sql
   -- Instead of raw data
   SELECT * FROM huge_table

   -- Use aggregations
   SELECT date, COUNT(*) as cnt
   FROM huge_table
   GROUP BY date
   ```

3. **Reduce Result Size**
   ```sql
   SELECT * FROM table LIMIT 40
   ```

4. **Check Query Complexity**
   - Avoid complex joins on large tables
   - Use subqueries to filter data first

### Issue: Write Operations Blocked

**Symptoms:**
- "Write operations not enabled"
- Cannot execute CREATE, INSERT, UPDATE, DELETE

**Solutions:**
```bash
# Remove existing MCP server
claude mcp remove td

# Re-add with write operations enabled
claude mcp add td \
  -e TD_API_KEY=$TD_API_KEY \
  -e TD_ENABLE_UPDATES=true \
  -- npx @treasuredata/mcp-server

# Restart Claude Code
```

**Warning:** Only enable write operations if absolutely necessary and you understand the risks.

### Issue: Wrong Region/Site

**Symptoms:**
- Cannot see expected databases
- Data appears missing
- Slow query performance

**Solutions:**
```bash
# Check your account region in TD console
# Then update MCP configuration

claude mcp remove td
claude mcp add td \
  -e TD_API_KEY=$TD_API_KEY \
  -e TD_SITE=jp01 \
  -- npx @treasuredata/mcp-server
```

### Issue: MCP Tools Not Appearing in Claude Code

**Symptoms:**
- Claude Code doesn't suggest TD tools
- Natural language queries don't trigger MCP

**Solutions:**
1. **Restart Claude Code**
   ```bash
   # Exit and restart
   ```

2. **Verify MCP Configuration**
   ```bash
   claude mcp list
   claude mcp status
   ```

3. **Check MCP Server Logs**
   ```bash
   # Claude Code logs location (varies by OS)
   # macOS: ~/Library/Logs/Claude/
   # Linux: ~/.config/Claude/logs/
   # Windows: %APPDATA%\Claude\logs\
   ```

4. **Be Explicit in Queries**
   ```
   Instead of: "Show data"
   Try: "List tables in my TD database"
   ```

## Advanced Topics

### Multiple MCP Connections

You can set up multiple MCP connections for different environments:

```bash
# Production (read-only)
claude mcp add td-prod \
  -e TD_API_KEY=$TD_PROD_API_KEY \
  -e TD_SITE=us01 \
  -e TD_DATABASE=production \
  -- npx @treasuredata/mcp-server

# Staging (with write access)
claude mcp add td-staging \
  -e TD_API_KEY=$TD_STAGING_API_KEY \
  -e TD_SITE=us01 \
  -e TD_DATABASE=staging \
  -e TD_ENABLE_UPDATES=true \
  -- npx @treasuredata/mcp-server

# Development (full access)
claude mcp add td-dev \
  -e TD_API_KEY=$TD_DEV_API_KEY \
  -e TD_SITE=us01 \
  -e TD_DATABASE=development \
  -e TD_ENABLE_UPDATES=true \
  -- npx @treasuredata/mcp-server
```

In Claude Code, specify which connection:
```
"Using td-prod, list all databases"
"Using td-staging, create test table"
```

### Custom Configuration Files

Instead of command-line setup, you can manually edit Claude Code's MCP configuration:

**Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Example Configuration:**
```json
{
  "mcpServers": {
    "treasuredata": {
      "command": "npx",
      "args": ["@treasuredata/mcp-server"],
      "env": {
        "TD_API_KEY": "1/your_api_key",
        "TD_SITE": "us01",
        "TD_DATABASE": "sample_datasets",
        "TD_ENABLE_UPDATES": "false"
      }
    }
  }
}
```

### Using with Other MCP Servers

TD MCP can work alongside other MCP servers:

```bash
# Add TD MCP
claude mcp add td -e TD_API_KEY=$TD_API_KEY -- npx @treasuredata/mcp-server

# Add other MCP servers
claude mcp add github -- npx @modelcontextprotocol/server-github
claude mcp add postgres -- npx @modelcontextprotocol/server-postgres

# Use in Claude Code
"Query my TD data and compare with GitHub metrics"
```

### Programmatic Usage

While primarily used through Claude Code, you can also interact with TD MCP programmatically using MCP SDKs.

## Security Considerations

1. **API Key Storage**
   - Never commit API keys to version control
   - Use environment variables or secure vaults
   - Rotate keys regularly

2. **Read-Only by Default**
   - Keep `TD_ENABLE_UPDATES=false` unless necessary
   - Create separate read-only API keys for MCP use

3. **Network Security**
   - MCP communicates over HTTPS
   - API keys are never logged by default
   - All operations are audited in TD

4. **Least Privilege**
   - Use API keys with minimal required permissions
   - Create database-specific API keys if possible

5. **Multi-User Environments**
   - Each user should use their own API key
   - Avoid sharing MCP configurations

## Resources

- **GitHub Repository**: https://github.com/treasure-data/td-mcp-server
- **npm Package**: https://www.npmjs.com/package/@treasuredata/mcp-server
- **MCP Protocol**: https://modelcontextprotocol.io/
- **TD Documentation**: https://docs.treasuredata.com/
- **Claude Code Documentation**: https://docs.claude.com/claude-code

## Related Skills

- **trino**: Understanding SQL syntax for MCP queries
- **hive**: Hive-specific functions available through MCP
- **pytd**: Python alternative to MCP for programmatic access
- **trino-cli**: Command-line alternative to MCP

## Comparison with Other Tools

| Tool | Interface | Best For |
|------|-----------|----------|
| **TD MCP** | Natural language in Claude Code | Conversational data exploration, quick insights |
| **Trino CLI** | Command-line SQL | Scripting, automation, terminal workflows |
| **pytd** | Python SDK | ETL pipelines, complex transformations, notebooks |
| **TD Console** | Web UI | Visualization, sharing, collaboration |

**Recommendation:** Use TD MCP for interactive data exploration and ad-hoc analysis within Claude Code. Use other tools for production pipelines and automation.

---

*Last updated: 2025-01 | TD MCP Server: Public Preview | License: Apache-2.0*
