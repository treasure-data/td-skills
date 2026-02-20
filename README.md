# TD Skills for Claude Code

Treasure Data skills for [Claude Code](https://claude.com/claude-code) to enhance productivity with TD-specific tools and workflows.

## What Are Skills?

Skills are folders of instructions and resources that Claude loads dynamically to improve performance on specialized tasks. These TD skills teach Claude how to use our tools and follow our best practices.

## 🔴 MANDATORY AUTO-INVOCATION - SQL Analyst Suite

**Five core SQL skills now automatically invoke based on your questions:**

| Skill | Auto-Invokes When | Examples |
|-------|------------------|----------|
| **analytical-query** | Asking for analysis/metrics/trends | "Top 10 products by revenue", "Count daily signups", "Show revenue trends" |
| **smart-sampler** | Asking for data samples/records | "Show 100 sample orders", "Give me examples of null emails", "Preview recent data" |
| **schema-explorer** | Asking about schema/structure/PII | "What tables are available?", "Show me the schema for orders", "Find PII columns" |
| **data-profiler** | Asking for data quality/distributions | "Profile the orders table", "Analyze data quality", "What's the distribution of revenue?" |
| **query-explainer** | Sharing SQL queries to understand | "Explain this query: [SQL]", "What does this do?", "Break down this query" |

## Available Skills

### SQL Skills

#### Core Analyst Skills ⭐ MANDATORY AUTO-INVOCATION

**Analytical & Data Exploration Suite:**

- **[sql-skills/analytical-query](./sql-skills/analytical-query)** - 🔴 **MANDATORY** - Natural language to SQL analytics. Auto-invokes on: summarize, aggregate, analyze, top N, trends, metrics, KPI. Generates optimized queries, executes automatically, and creates professional Plotly visualizations. **Also auto-invokes smart-sampler for sampling/data preview requests.**

- **[sql-skills/smart-sampler](./sql-skills/smart-sampler)** - Intelligent data sampling with multiple strategies (random, time-based, stratified, edge-case). Auto-invokes for: sample, show records, preview data, show examples. Perfect for data exploration and finding examples without full scans.

#### Query Support & Optimization

**Schema Discovery & Analysis:**
- **[sql-skills/schema-explorer](./sql-skills/schema-explorer)** - 🔴 **AUTO-INVOKED** - Discover databases, tables, columns, and PII fields across your TD environment. Auto-invokes on: "What tables", "Show schema", "Find tables with", "List columns", "Describe table"

- **[sql-skills/data-profiler](./sql-skills/data-profiler)** - 🔴 **AUTO-INVOKED** - Analyze data quality, distributions, completeness, null rates, and outliers with professional visualizations. Auto-invokes on: "Profile table", "Analyze data quality", "Show distribution", "Data stats"

- **[sql-skills/query-explainer](./sql-skills/query-explainer)** - 🔴 **AUTO-INVOKED** - Convert SQL queries to natural language explanations, identify performance issues, and generate documentation. Auto-invokes on: "Explain this query", "What does this SQL do?", "Break down this query"

**Query Optimization & Development:**
- **[sql-skills/trino](./sql-skills/trino)** - Write and optimize SQL queries for Trino with TD best practices (td_interval, approx functions, time filtering)
- **[sql-skills/hive](./sql-skills/hive)** - Create efficient Hive queries following TD conventions for large data processing
- **[sql-skills/time-filtering](./sql-skills/time-filtering)** - Advanced time-based filtering with td_interval() and td_time_range() for partition pruning and query performance
- **[sql-skills/trino-optimizer](./sql-skills/trino-optimizer)** - Optimize slow Trino queries, fix timeouts and memory errors, reduce costs with execution log analysis
- **[sql-skills/trino-to-hive-migration](./sql-skills/trino-to-hive-migration)** - Convert Trino queries to Hive to resolve memory errors and handle large datasets
- **[sql-skills/td-mcp](./sql-skills/td-mcp)** - Connect Claude Code to TD via MCP server for natural language data exploration and queries

#### Data Discovery & Profiling

(See auto-invocation section above - schema-explorer and data-profiler are included above with auto-invocation rules)

### Realtime Skills

#### End-to-End Orchestrators (Recommended for New Setups)
- **[realtime-skills/rt-setup-personalization](./realtime-skills/rt-setup-personalization)** - Complete personalization setup workflow: validates parent segment RT status, discovers events/attributes, configures RT infrastructure (events, attributes, ID stitching), creates personalization service AND entity with payload. Implements full 9-step workflow from discovery to deployment.
- **[realtime-skills/rt-setup-triggers](./realtime-skills/rt-setup-triggers)** - Complete RT triggers/journey setup workflow: same RT configuration as personalization, then creates RT journey with activations (webhook, Salesforce, email) and launches for event processing.

#### RT 2.0 Setup & Configuration
- **[realtime-skills/rt-config](./realtime-skills/rt-config)** - RT 2.0 configuration overview (entry point)
- **[realtime-skills/rt-config-setup](./realtime-skills/rt-config-setup)** - Initial RT setup: check enablement, initialize configuration, verify prerequisites
- **[realtime-skills/rt-config-events](./realtime-skills/rt-config-events)** - Configure event tables and key events with filters
- **[realtime-skills/rt-config-attributes](./realtime-skills/rt-config-attributes)** - Configure RT attributes: single, list, counter, and batch attributes
- **[realtime-skills/rt-config-id-stitching](./realtime-skills/rt-config-id-stitching)** - Configure ID stitching and profile merging

#### RT Personalization
- **[realtime-skills/rt-personalization](./realtime-skills/rt-personalization)** - Create RT personalization service AND entity (both required). Creates service configuration via YAML and Personalization entity via API with payload definition, making it visible in Console UI. Handles proper subAttributeIdentifier for list attributes.

#### RT Journeys (Triggers)
- **[realtime-skills/rt-triggers](./realtime-skills/rt-triggers)** - RT journeys overview (entry point)
- **[realtime-skills/rt-journey-create](./realtime-skills/rt-journey-create)** - Create RT journeys with event triggers
- **[realtime-skills/rt-journey-activations](./realtime-skills/rt-journey-activations)** - Configure activations: webhook, Salesforce, email
- **[realtime-skills/rt-journey-monitor](./realtime-skills/rt-journey-monitor)** - Monitor journeys, debug failures, query activation logs

#### Activation & Identity Monitoring
- **[realtime-skills/activations](./realtime-skills/activations)** - Query activation logs to check for errors and view volume for digital marketing activations
- **[realtime-skills/identity](./realtime-skills/identity)** - Query id change logs to get information about new, updated and merged realtime profiles

### Workflow Skills

- **[workflow-skills/digdag](./workflow-skills/digdag)** - Design and implement Treasure Workflow with proper error handling
- **[workflow-skills/workflow-management](./workflow-skills/workflow-management)** - Manage, debug, and optimize existing Treasure Workflows
- **[workflow-skills/dbt](./workflow-skills/dbt)** - Use dbt (data build tool) with TD Trino, includes setup, TD-specific macros, and incremental models

### SDK Skills

- **[sdk-skills/javascript](./sdk-skills/javascript)** - Import data to TD using the JavaScript SDK for browser-based event tracking and page analytics
- **[sdk-skills/python](./sdk-skills/python)** - Query and import data using pytd (Python SDK) for analytical workflows, pandas integration, and ETL pipelines

### TDX CLI Skills

- **[tdx-skills/tdx-basic](./tdx-skills/tdx-basic)** - Core [tdx](https://tdx.treasuredata.com) CLI operations for managing TD from command line: databases, tables, queries, and context management
- **[tdx-skills/parent-segment](./tdx-skills/parent-segment)** - Manage CDP parent segments with YAML-based configuration for master tables, attributes, and behaviors
- **[tdx-skills/segment](./tdx-skills/segment)** - Manage CDP child segments with rules, activations, and folder organization
- **[tdx-skills/validate-segment](./tdx-skills/validate-segment)** - Validate segment YAML configurations against CDP API spec for correct operators, time units, and field names
- **[tdx-skills/journey](./tdx-skills/journey)** - Create CDP journey definitions in YAML with stages, steps (wait, activation, decision_point, ab_test, merge, jump, end), and simulation workflow
- **[tdx-skills/validate-journey](./tdx-skills/validate-journey)** - Validate journey YAML configurations for correct step types, parameters, and segment references
- **[tdx-skills/connector-config](./tdx-skills/connector-config)** - Configure connector_config for segment/journey activations using `tdx connection schema` to discover fields
- **[tdx-skills/agent](./tdx-skills/agent)** - Build LLM agents using `tdx agent pull/push` with YAML/Markdown config, tools, and knowledge bases
- **[tdx-skills/agent-test](./tdx-skills/agent-test)** - Run automated tests for LLM agents using `tdx agent test` with test.yml format and judge evaluation
- **[tdx-skills/agent-prompt](./tdx-skills/agent-prompt)** - Write effective system prompts for TD AI agents with role definition, constraints, and output formatting
- **[tdx-skills/workflow](./tdx-skills/workflow)** - Manage TD workflows via `tdx wf` commands: project sync, run, sessions, timeline, attempts, retry, and secrets

### Field Agent Skills

- **[field-agent-skills/deployment](./field-agent-skills/deployment)** - Best practices for developing, testing, and deploying production-ready Field Agents including R&D workflows and release management
- **[field-agent-skills/documentation](./field-agent-skills/documentation)** - Comprehensive templates and guidelines for documenting Field Agents with standardized structure, system prompts, and tool specifications
- **[field-agent-skills/visualization](./field-agent-skills/visualization)** - Professional Plotly visualization best practices with TD color palette, chart specifications, and formatting standards for executive-ready visualizations

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
   - `sql-skills` - Analyst suite (analytical-query, smart-sampler, data-profiler), Trino and Hive query assistance, query optimization, and TD MCP server
   - `realtime-skills` - RT 2.0 end-to-end orchestrators, configuration, personalization services, real-time journeys, and activation/identity log monitoring
   - `workflow-skills` - Treasure Workflow creation, management, and dbt transformations
   - `sdk-skills` - TD JavaScript SDK and pytd Python SDK
   - `tdx-skills` - tdx CLI for managing TD from command line
   - `field-agent-skills` - Field Agent deployment, documentation, and visualization best practices
   - `template-skill` - Template for creating new skills

3. **Or install directly:**
   ```
   /plugin install sql-skills@td-skills
   /plugin install realtime-skills@td-skills
   /plugin install workflow-skills@td-skills
   /plugin install sdk-skills@td-skills
   /plugin install tdx-skills@td-skills
   /plugin install field-agent-skills@td-skills
   ```

### Invoking Skills

Once installed, explicitly reference skills using the `skill` keyword to trigger them:

```
"Show me the top 10 products by revenue last 30 days" → analytical-query (AUTO-INVOKED)
"Sample 100 recent orders from the sales table" → smart-sampler (AUTO-INVOKED)
"Give me examples of null email addresses" → smart-sampler (AUTO-INVOKED)
"Analyze the revenue trend by month" → analytical-query (AUTO-INVOKED)
"Profile the customers table for data quality" → data-profiler (AUTO-INVOKED)
"What tables are available in my database?" → schema-explorer (AUTO-INVOKED)
"Show me the schema for the orders table" → schema-explorer (AUTO-INVOKED)
"Find tables with PII columns" → schema-explorer (AUTO-INVOKED)
"What columns does the sales table have?" → schema-explorer (AUTO-INVOKED)
"Explain this query: SELECT * FROM orders WHERE time > now() - 7d" → query-explainer (AUTO-INVOKED)
"What does this SQL do? [paste query]" → query-explainer (AUTO-INVOKED)
"Break down this complex query step by step" → query-explainer (AUTO-INVOKED)
"Profile the events table for null values and distribution" → data-profiler (AUTO-INVOKED)
"Show me data quality metrics for the users table" → data-profiler (AUTO-INVOKED)
"Use the Trino skill to extract data from sample_datasets.nasdaq table"
"Use the Hive skill to write a query for daily user aggregation"
"Use the time-filtering skill to add partition pruning to my query"
"Use the Trino CLI skill to help me connect to TD from the terminal"
"Use the TD MCP skill to set up Claude Code to access my TD databases"
"Use the rt-setup-personalization skill to create realtime personalization for product recommendations"
"Use the rt-setup-triggers skill to set up a welcome email trigger when users sign up"
"Use the rt-config-setup skill to check RT enablement status"
"Use the rt-config-events skill to configure event tables for parent segment 394649"
"Use the rt-config-attributes skill to add RT attributes"
"Use the rt-config-id-stitching skill to configure profile merging"
"Use the rt-personalization skill to create a product recommendation service"
"Use the rt-personalization skill to build a cart recovery service"
"Use the rt-personalization skill to integrate personalization API with my web app"
"Use the rt-journey-create skill to create a welcome email journey"
"Use the rt-journey-activations skill to configure webhook activations"
"Use the rt-journey-monitor skill to debug activation failures"
"Use the activations skill to query activation logs for parent segment 394649"
"Use the identity skill to check recent profile merges for parent segment 394649"
"Use the digdag skill to create a workflow that runs every morning"
"Use the workflow-management skill to debug this failing workflow"
"Use the dbt skill to create an incremental model for user events"
"Use the JavaScript SDK skill to implement event tracking on my website"
"Use the pytd skill to query TD from Python and load results into pandas"
"Use the tdx-basic skill to list all databases in the Tokyo region"
"Use the parent-segment skill to configure a CDP parent segment"
"Use the segment skill to create child segments with activation rules"
"Use the validate-segment skill to check my segment YAML for errors"
"Use the journey skill to create a customer onboarding journey"
"Use the validate-journey skill to check my journey YAML for errors"
"Use the connector-config skill to configure an SFMC activation"
"Use the agent skill to create an LLM agent with knowledge base tools"
"Use the agent-test skill to run automated tests for my agent"
"Use the agent-prompt skill to write an effective system prompt for my agent"
"Use the workflow skill to debug a failing workflow session"
"Use the deployment skill to set up a production publishing workflow"
"Use the documentation skill to create comprehensive Field Agent documentation"
"Use the visualization skill to create a Plotly chart with TD colors"
```

**🔴 AUTO-INVOCATION NOTES:**
- **Analytical-Query**: Automatically invoked for analysis questions (top, trends, count, sum, metrics)
- **Smart-Sampler**: Automatically invoked for sampling requests (sample, show records, preview, examples)
- **Schema-Explorer**: Automatically invoked for schema questions (what tables, show schema, find columns, describe table)
- **Data-Profiler**: Automatically invoked for data quality/profiling requests (profile, analyze quality, distributions)
- **Query-Explainer**: Automatically invoked when sharing SQL queries to understand (explain query, what does this do)

## Creating Your Own TD Skills

To add a new TD-specific skill:

1. Create a new directory under the appropriate category:
   ```bash
   mkdir sql-skills/your-skill-name
   # or
   mkdir workflow-skills/your-skill-name
   # or
   mkdir field-agent-skills/your-skill-name
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

## Documentation

For detailed documentation on individual skills, each skill contains a `SKILL.md` file with comprehensive information:

- **SQL Skills Documentation**: See individual `SKILL.md` files in each skill directory (e.g., `./sql-skills/analytical-query/SKILL.md`)
- **Architecture & Development Guides**: See `./sql-skills/docs/` for detailed guides and blueprints

## Support

For questions or issues:
- Open an issue in this repository
- Contact the Data Engineering team

---

**Note:** These skills are for internal TD use only.

**Latest Updates:**
- Analytical-Query and Smart-Sampler skills now available with auto-invocation
- Comprehensive SQL analyst suite for data analysis and exploration
- Detailed documentation available in `sql-skills/docs/` directory
