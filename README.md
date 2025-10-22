# TD Skills for Claude Code

Treasure Data skills for [Claude Code](https://claude.com/claude-code) to enhance productivity with TD-specific tools and workflows.

## What Are Skills?

Skills are folders of instructions and resources that Claude loads dynamically to improve performance on specialized tasks. These TD skills teach Claude how to work with our internal tools and best practices.

## Available Skills

### SQL Skills

- **[sql-skills/trino](./sql-skills/trino)** - Write and optimize SQL queries for Trino with TD best practices
- **[sql-skills/hive](./sql-skills/hive)** - Create efficient Hive queries following TD conventions
- **[sql-skills/trino-optimizer](./sql-skills/trino-optimizer)** - Optimize slow Trino queries, fix timeouts and memory errors, reduce costs
- **[sql-skills/trino-to-hive-migration](./sql-skills/trino-to-hive-migration)** - Convert Trino queries to Hive to resolve memory errors and handle large datasets
- **[sql-skills/trino-cli](./sql-skills/trino-cli)** - Use Trino CLI for interactive queries, data exploration, and terminal-based workflows with TD
- **[sql-skills/td-mcp](./sql-skills/td-mcp)** - Connect Claude Code to TD via MCP server for natural language data exploration and queries

### Workflow Skills

- **[workflow-skills/digdag](./workflow-skills/digdag)** - Design and implement digdag workflows with proper error handling
- **[workflow-skills/management](./workflow-skills/management)** - Manage, debug, and optimize existing TD workflows
- **[workflow-skills/dbt](./workflow-skills/dbt)** - Use dbt (data build tool) with TD Trino, includes setup, TD-specific macros, and incremental models

### SDK Skills

- **[sdk-skills/javascript](./sdk-skills/javascript)** - Import data to TD using the JavaScript SDK for browser-based event tracking and page analytics
- **[sdk-skills/python](./sdk-skills/python)** - Query and import data using pytd (Python SDK) for analytical workflows, pandas integration, and ETL pipelines

### Reference

- **[template-skill](./template-skill)** - Template for creating new TD-specific skills

## Using These Skills

### In Claude Code

1. **Register the TD skills marketplace:**
   ```
   /plugin marketplace add https://github.com/treasure-data/td-skills
   ```

2. **Browse and install plugins:**

   Select "Browse and install plugins" from the menu, then choose from:
   - `sql-skills` - Trino and Hive query assistance, Trino CLI, and TD MCP server
   - `workflow-skills` - Digdag workflow creation, management, and dbt transformations
   - `sdk-skills` - TD JavaScript SDK and pytd Python SDK
   - `template-skill` - Template for creating new skills

3. **Or install directly:**
   ```
   /plugin install sql-skills@td-skills
   /plugin install workflow-skills@td-skills
   /plugin install sdk-skills@td-skills
   ```

### Invoking Skills

Once installed, explicitly reference skills using the `skill` keyword to trigger them:

```
"Use the Trino skill to extract data from sample_datasets.nasdaq table"
"Use the Hive skill to write a query for daily user aggregation"
"Use the Trino CLI skill to help me connect to TD from the terminal"
"Use the TD MCP skill to set up Claude Code to access my TD databases"
"Use the digdag skill to create a workflow that runs every morning"
"Use the workflow-management skill to debug this failing digdag workflow"
"Use the dbt skill to create an incremental model for user events"
"Use the JavaScript SDK skill to implement event tracking on my website"
"Use the pytd skill to query TD from Python and load results into pandas"
```

Tips for triggering skills:
- Include the skill name (Trino, Hive, Trino CLI, TD MCP, digdag, dbt, JavaScript SDK, pytd)
- Use the word "skill" in your request
- Be specific about what you want to accomplish

## Creating Your Own TD Skills

To add a new TD-specific skill:

1. Create a new directory under the appropriate category:
   ```bash
   mkdir sql-skills/your-skill-name
   # or
   mkdir workflow-skills/your-skill-name
   ```

2. Create a `SKILL.md` file with YAML frontmatter (see [template-skill](./template-skill/SKILL.md))

3. Update `.claude-plugin/marketplace.json` to register the new skill:
   ```json
   {
     "name": "sql-skills",
     "skills": [
       "./sql-skills/trino",
       "./sql-skills/hive",
       "./sql-skills/your-skill-name"  // Add your skill path here (must start with ./)
     ]
   }
   ```

## Contributing

To contribute a new skill or improve an existing one:

1. Create or update the skill in a feature branch
2. Test the skill with Claude Code
3. Submit a pull request with clear documentation

## Support

For questions or issues:
- Open an issue in this repository
- Contact the Data Engineering team

---

**Note:** These skills are for internal TD use only.
