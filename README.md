# TD Skills for Claude Code

Treasure Data skills for [Claude Code](https://claude.com/claude-code) to enhance productivity with TD-specific tools and workflows.

## What Are Skills?

Skills are folders of instructions and resources that Claude loads dynamically to improve performance on specialized tasks. These TD skills teach Claude how to use our tools and follow our best practices.

## SQL Analyst Suite

**Five core SQL skills for data analysis:**

| Skill | Triggers For | Examples |
|-------|------------------|----------|
| **analytical-query** | Analysis/metrics/trends queries | "Top 10 products by revenue", "Count daily signups", "Show revenue trends" |
| **smart-sampler** | Data samples/records | "Show 100 sample orders", "Give me examples of null emails", "Preview recent data" |
| **schema-explorer** | Schema/structure/PII discovery | "What tables are available?", "Show me the schema for orders", "Find PII columns" |
| **data-profiler** | Data quality/distributions | "Profile the orders table", "Analyze data quality", "What's the distribution of revenue?" |
| **query-explainer** | SQL query explanations | "Explain this query: [SQL]", "What does this do?", "Break down this query" |

## Available Skills

### SQL Skills

#### Core Analyst Skills

**Analytical & Data Exploration Suite:**

- **[sql-skills/analytical-query](./sql-skills/analytical-query)** - Natural language to SQL analytics for summarizing, aggregating, analyzing trends, metrics, and KPIs. Generates optimized queries, executes them, and creates professional Plotly visualizations. **Also uses smart-sampler for sampling/data preview requests.**

- **[sql-skills/smart-sampler](./sql-skills/smart-sampler)** - Intelligent data sampling with multiple strategies (random, time-based, stratified, edge-case) for exploring data and finding examples without full scans.

#### Query Support & Optimization

**Schema Discovery & Analysis:**
- **[sql-skills/schema-explorer](./sql-skills/schema-explorer)** - Discover databases, tables, columns, and PII fields across your TD environment.

- **[sql-skills/data-profiler](./sql-skills/data-profiler)** - Analyze data quality, distributions, completeness, null rates, and outliers with professional visualizations.

- **[sql-skills/query-explainer](./sql-skills/query-explainer)** - Convert SQL queries to natural language explanations, identify performance issues, and generate documentation.

**Query Optimization & Development:**
- **[sql-skills/trino](./sql-skills/trino)** - Write and optimize SQL queries for Trino with TD best practices (td_interval, approx functions, time filtering)
- **[sql-skills/hive](./sql-skills/hive)** - Create efficient Hive queries following TD conventions for large data processing
- **[sql-skills/time-filtering](./sql-skills/time-filtering)** - Advanced time-based filtering with td_interval() and td_time_range() for partition pruning and query performance
- **[sql-skills/trino-optimizer](./sql-skills/trino-optimizer)** - Optimize slow Trino queries, fix timeouts and memory errors, reduce costs with execution log analysis
- **[sql-skills/trino-to-hive-migration](./sql-skills/trino-to-hive-migration)** - Convert Trino queries to Hive to resolve memory errors and handle large datasets

#### Data Discovery & Profiling

(See SQL Analyst Suite section above - schema-explorer and data-profiler are listed there)

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

#### RT ID Analysis & Debugging
- **[realtime-skills/identify-top-key-values](./realtime-skills/identify-top-key-values)** - Analyze RT event tables to identify most common stitching key values, debug data quality and distribution issues
- **[realtime-skills/id-graph-canonical-id-size](./realtime-skills/id-graph-canonical-id-size)** - Query ID graph to analyze canonical ID group sizes and identify over-stitching patterns
- **[realtime-skills/id-graph-ids-to-canonical-id](./realtime-skills/id-graph-ids-to-canonical-id)** - Detect individual IDs mapping to multiple canonical IDs (over-stitching detection)

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
- **[tdx-skills/parent-segment-analysis](./tdx-skills/parent-segment-analysis)** - Query and analyze CDP parent segment output databases: customers table, behavior tables, and attribute exploration
- **[tdx-skills/engage](./tdx-skills/engage)** - Manage Treasure Engage email templates and campaigns using `tdx engage` with YAML+HTML configs, preview, and deployment

### Field Agent Skills

- **[field-agent-skills/deployment](./field-agent-skills/deployment)** - Best practices for developing, testing, and deploying production-ready Field Agents including R&D workflows and release management
- **[field-agent-skills/documentation](./field-agent-skills/documentation)** - Comprehensive templates and guidelines for documenting Field Agents with standardized structure, system prompts, and tool specifications
- **[field-agent-skills/visualization](./field-agent-skills/visualization)** - Professional Plotly visualization best practices with TD color palette, chart specifications, and formatting standards for executive-ready visualizations

### Analysis Skills

- **[analysis-skills/grid-dashboard](./analysis-skills/grid-dashboard)** - YAML format reference for grid dashboards rendered via `preview_grid_dashboard`: page structure, cell types, layout rules
- **[analysis-skills/action-report](./analysis-skills/action-report)** - YAML format reference for action reports rendered via `preview_action_report`: prioritized recommendations with as-is/to-be diffs
- **[analysis-skills/seo-analysis](./analysis-skills/seo-analysis)** - SEO and AEO (Answer Engine Optimization) audit producing data dashboards and action reports with before/after recommendations

### Creative Skills

- **[creative-skills/multi-channel-ad-ideation](./creative-skills/multi-channel-ad-ideation)** - Orchestrate multi-channel ad ideation for email, SMS, and Instagram with structured creative direction workflows, text concepts, and HTML previews
- **[creative-skills/brand-compliance](./creative-skills/brand-compliance)** - Review creative content for brand guideline compliance with 8-dimension scoring and visual dashboards
- **[creative-skills/brand-onboarding](./creative-skills/brand-onboarding)** - Create comprehensive brand guidelines through an interactive wizard (~15 min setup)

### Studio Skills

- **[studio-skills/work](./studio-skills/work)** - Manage workspace documents (items, goals, notes, guides, references) using file operations with YAML frontmatter, wiki-links, and status lifecycles
- **[studio-skills/skill-creator](./studio-skills/skill-creator)** - Create, write, and optimize custom skills (SKILL.md files) in Treasure Studio with description optimization and writing patterns
- **[studio-skills/react-dashboard](./studio-skills/react-dashboard)** - Build interactive React dashboards in Treasure Studio using `render_react` for custom components beyond `render_chart`
- **[studio-skills/schedule-task](./studio-skills/schedule-task)** - Create and configure scheduled tasks in Treasure Studio: TASK.md authoring, schedule.yaml, and cron setup
- **[studio-skills/schedule-review](./studio-skills/schedule-review)** - Review and validate scheduled tasks before enabling, with structural and quality checks via parallel sub-agents
- **[studio-skills/web-search](./studio-skills/web-search)** - Web search and URL content extraction using `web_search` with query optimization, search operators, and structured research patterns

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
   - `sql-skills` - Analyst suite (analytical-query, smart-sampler, data-profiler), Trino and Hive query assistance, and query optimization
   - `realtime-skills` - RT 2.0 end-to-end orchestrators, configuration, personalization services, real-time journeys, and activation/identity log monitoring
   - `workflow-skills` - Treasure Workflow creation, management, and dbt transformations
   - `sdk-skills` - TD JavaScript SDK and pytd Python SDK
   - `tdx-skills` - tdx CLI for managing TD from command line
   - `field-agent-skills` - Field Agent deployment, documentation, and visualization best practices
   - `studio-skills` - Treasure Studio skills: workspace management, skill creation, React dashboards, scheduled tasks, and web search
   - `creative-skills` - Multi-channel ad ideation, brand compliance, and brand onboarding
   - `template-skill` - Template for creating new skills

3. **Or install directly:**
   ```
   /plugin install sql-skills@td-skills
   /plugin install realtime-skills@td-skills
   /plugin install workflow-skills@td-skills
   /plugin install sdk-skills@td-skills
   /plugin install tdx-skills@td-skills
   /plugin install field-agent-skills@td-skills
   /plugin install studio-skills@td-skills
   /plugin install creative-skills@td-skills
   ```

### Invoking Skills

Once installed, skills are triggered based on their description fields matching your question. Examples:

```
"Show me the top 10 products by revenue last 30 days" → analytical-query
"Sample 100 recent orders from the sales table" → smart-sampler
"Give me examples of null email addresses" → smart-sampler
"Analyze the revenue trend by month" → analytical-query
"Profile the customers table for data quality" → data-profiler
"What tables are available in my database?" → schema-explorer
"Show me the schema for the orders table" → schema-explorer
"Find tables with PII columns" → schema-explorer
"What columns does the sales table have?" → schema-explorer
"Explain this query: SELECT * FROM orders WHERE time > now() - 7d" → query-explainer
"What does this SQL do? [paste query]" → query-explainer
"Break down this complex query step by step" → query-explainer
"Profile the events table for null values and distribution" → data-profiler
"Show me data quality metrics for the users table" → data-profiler
```

You can also explicitly reference skills:

```
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
"Use the identify-top-key-values skill to debug stitching key distributions for parent segment 394649"
"Use the id-graph-canonical-id-size skill to analyze canonical ID group sizes for parent segment 394649"
"Use the id-graph-ids-to-canonical-id skill to detect over-stitching issues for parent segment 394649"
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
"Use the multi-channel-ad-ideation skill to brainstorm ad concepts for our product launch"
"Use the brand-compliance skill to review this email for brand guideline compliance"
"Use the brand-onboarding skill to set up brand guidelines for my company"
```

Tips for triggering skills:
- Include the skill name (Trino, Hive, time-filtering, Trino CLI, TD MCP, rt-setup-personalization, rt-setup-triggers, rt-config-setup, rt-config-events, rt-config-attributes, rt-config-id-stitching, rt-personalization, rt-journey-create, rt-journey-activations, rt-journey-monitor, activations, identity, identify-top-key-values, id-graph-canonical-id-size, id-graph-ids-to-canonical-id, digdag, workflow, dbt, JavaScript SDK, pytd, tdx, tdx-basic, validate-segment, journey, validate-journey, connector-config, agent, agent-test, agent-prompt, deployment, documentation, visualization, multi-channel-ad-ideation, brand-compliance, brand-onboarding)
- Use the word "skill" in your request
- Be specific about what you want to accomplish

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

4. Add trigger tests to `tests/trigger-tests.yml`:
   ```yaml
   - prompt: "A realistic prompt that should trigger your skill"
     expected: your-skill-name
   ```

5. Run `./tests/run-tests.sh` to verify your skill triggers correctly

## Release Channels

Skills are published through two release channels:

| Channel | Source | Consumer |
|---------|--------|----------|
| **next** | Prerelease tags on `main` (`vYYYY.M.patch`) | Early testing |
| **stable** | Promoted GitHub releases | tdx, Treasure Studio |

### Workflow

1. **Tag a prerelease** — maintainer runs `./scripts/release.sh` on `main`, which tags and pushes. A GitHub Action auto-creates a prerelease.
2. **Promote to stable** — maintainer runs `./scripts/release.sh promote`, which creates a PR targeting the `release` branch (an orphan branch containing only `.stable-version`).
3. **Approve and merge** — an engineer reviews and merges the PR. A GitHub Action removes the prerelease flag, making it the latest stable release.

```bash
./scripts/release.sh            # Tag a next prerelease
./scripts/release.sh promote    # Create PR to promote next -> stable
./scripts/release.sh status     # Show channel info
```

Only maintainers listed in `.github/maintainers.yml` can run these commands.

## Testing

### Trigger Tests

Every skill must have trigger tests to verify it activates for realistic user prompts.

```bash
# Run all trigger tests
./tests/run-tests.sh

# Run with verbose output
./tests/run-tests.sh --verbose
```

Tests are defined in `tests/trigger-tests.yml`:

```yaml
tests:
  - prompt: "Write a Trino query to count users"
    expected: trino
  - prompt: "Create a segment for recent purchasers"
    expected: segment
```

**Philosophy**: Test prompts should be realistic. If a test fails, consider improving the skill description rather than making the prompt artificially specific.

## Contributing

To contribute a new skill or improve an existing one:

1. Create or update the skill in a feature branch
2. Add trigger tests to `tests/trigger-tests.yml`
3. Run `./tests/run-tests.sh` to verify triggers work
4. Test the skill manually with Claude Code
5. Submit a pull request with clear documentation

## Documentation

For detailed documentation on individual skills, each skill contains a `SKILL.md` file with comprehensive information:

- **SQL Skills Documentation**: See individual `SKILL.md` files in each skill directory (e.g., `./sql-skills/analytical-query/SKILL.md`)

## Support

For questions or issues:
- Open an issue in this repository
- Contact the Data Engineering team

---

**Note:** These skills are for internal TD use only.

**Latest Updates:**
- Analytical-Query and Smart-Sampler skills now available
- Comprehensive SQL analyst suite for data analysis and exploration
