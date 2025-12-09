# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is a Claude Code skills marketplace for Treasure Data internal tools. It contains skill definitions that teach Claude how to work with TD-specific technologies: Trino SQL, Hive SQL, and digdag workflows.

## Architecture

### Skill Structure

Each skill is a directory containing a `SKILL.md` file with:
- **YAML frontmatter**: `name` and `description` fields that define when Claude should use the skill
- **Markdown content**: Detailed instructions, examples, and best practices that Claude follows

### Organization

```
.claude-plugin/marketplace.json  # Plugin registry defining skill collections
sql-skills/
  ├── trino/SKILL.md            # Trino query expertise
  └── hive/SKILL.md             # Hive query expertise
workflow-skills/
  ├── digdag/SKILL.md           # Digdag workflow creation
  └── management/SKILL.md       # Workflow debugging/optimization
template-skill/SKILL.md         # Template for new skills
```

### Plugin Collections

The `marketplace.json` defines three plugin collections:
1. **sql-skills**: Trino and Hive query assistance
2. **workflow-skills**: Digdag workflow creation and management
3. **template-skill**: Template for creating new TD skills

## Creating New Skills

When adding a new skill:

1. **Choose the correct category**: Place SQL-related skills under `sql-skills/`, workflow-related skills under `workflow-skills/`, or create a new category if needed

2. **Create directory and SKILL.md**:
   ```bash
   mkdir sql-skills/your-skill-name
   # Copy structure from template-skill/SKILL.md
   ```

3. **Write YAML frontmatter**:
   - `name`: lowercase-with-hyphens, unique identifier
   - `description`: Clear explanation of what the skill does and when Claude should use it

4. **Include TD-specific patterns**:
   - Use TD table naming: `database_name.table_name`
   - Include TD functions: `TD_INTERVAL`, `TD_TIME_RANGE`, `TD_SCHEDULED_TIME`
   - Use JST timezone for Japan data, UTC for others
   - Provide complete, working examples with realistic TD data patterns

5. **Update marketplace.json**: Add the new skill path (with `./` prefix) to the appropriate plugin's `skills` array

## TD-Specific Conventions

### SQL Skills
- Always include time filters using `TD_INTERVAL` or `TD_TIME_RANGE` for partition pruning
- Prefer `TD_INTERVAL` for relative time filtering (e.g., `-1d` for yesterday)
- Use `APPROX_*` functions for large-scale aggregations in Trino
- Include timezone parameter in all TD time functions

### Workflow Skills
- Digdag workflows use `.dig` files with YAML syntax
- Session variables: `${session_date}`, `${session_time}`, `${session_date_compact}`
- Always include error handling with `_error:` tasks
- Use `TD_SCHEDULED_TIME()` to establish reference date for `TD_INTERVAL`

## Testing Skills

1. Install the marketplace locally:
   ```
   /plugin marketplace add https://github.com/treasure-data/td-skills
   ```

2. Install and test the skill:
   ```
   /plugin install sql-skills@td-skills
   ```

3. Verify skill triggers with explicit references:
   ```
   "Use the [skill-name] skill to [specific task]"
   ```

## Validation Requirements

- All skill paths in `marketplace.json` must start with `./`
- YAML frontmatter must include both `name` and `description`
- Examples should use TD-specific patterns and conventions
- Include error handling and troubleshooting sections

## Claude Code Skills Best Practices

When creating skills, follow these core principles:

- **Be concise**: Assume Claude is smart; only add context it doesn't have.
- **Set appropriate degrees of freedom**: Match specificity to task fragility.
- **Use progressive disclosure**: Keep SKILL.md under 500 lines; split into referenced files.
- **Write effective descriptions**: Use third person, be specific, include key terms and when to use.
- **Implement feedback loops**: validation → fix → repeat.
- **Test iteratively**: Build evaluations first; develop with one Claude instance to help other instances.

Additional guidelines:
- Use gerund form for naming (`processing-pdfs`)
- Avoid time-sensitive info
- Maintain consistent terminology
- Keep file references one level deep

For comprehensive guidance including workflows, templates, anti-patterns, and executable code patterns, see the [official Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

## Repository Management

This is a documentation-only repository with no build, lint, or test commands. Changes should follow the branch and pull request workflow.

### Making Changes via Pull Request

```bash
# Create feature branch and make changes
git checkout -b descriptive-branch-name
# Update SKILL.md files, marketplace.json, or README.md as needed

# Commit and push
git add .
git commit -m "feat: add [skill-name]" # or "docs: update [description]"
git push -u origin descriptive-branch-name

# Create PR
gh pr create --title "Add [feature]" --body "Description of changes"
```

### Direct Push (urgent fixes only)

```bash
git add . && git commit -m "fix: urgent fix" && git push origin main
```
