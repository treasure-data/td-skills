# TD Skills for Claude Code

Internal Treasure Data skills for [Claude Code](https://claude.com/claude-code) to enhance productivity with TD-specific tools and workflows.

## What Are Skills?

Skills are folders of instructions and resources that Claude loads dynamically to improve performance on specialized tasks. These TD skills teach Claude how to work with our internal tools and best practices.

## Available Skills

### SQL Skills

- **[sql-skills/trino](./sql-skills/trino)** - Write and optimize SQL queries for Trino with TD best practices
- **[sql-skills/hive](./sql-skills/hive)** - Create efficient Hive queries following TD conventions

### Workflow Skills

- **[workflow-skills/digdag](./workflow-skills/digdag)** - Design and implement digdag workflows with proper error handling
- **[workflow-skills/management](./workflow-skills/management)** - Manage, debug, and optimize existing TD workflows

### Reference

- **[template-skill](./template-skill)** - Template for creating new TD-specific skills

## Using These Skills

### Setup

1. Clone this repository to your local machine:
   ```bash
   git clone <repository-url>
   ```

2. In Claude Code, skills in this directory are automatically available if configured in your project.

### Invoking Skills

Once available, you can invoke skills in Claude Code:

```
# Claude will automatically use the appropriate skill
"Help me write a Trino query to analyze user events"

# Or explicitly reference a skill
"Use the trino skill to optimize this query"
```

## Creating Your Own TD Skills

To add a new TD-specific skill:

1. Create a new directory under the appropriate category:
   ```bash
   mkdir sql-skills/your-skill-name
   # or
   mkdir workflow-skills/your-skill-name
   ```

2. Create a `SKILL.md` file with YAML frontmatter (see [template-skill](./template-skill/SKILL.md))

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
