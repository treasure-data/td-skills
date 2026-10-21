# Custom Audience Agent — Agent Setup

Audience-agent specifics for `../../shared/customer_agent_pattern.md` (name, staging build, install, verify). Template: `<solution_dir>/project_templates/agent_template/`. Agent name: `<project_slug>-agent` (`audience-agent` by default).

## What the agent does

A marketing analyst on one parent segment: explores attributes, behaviors and existing segments; answers customer-data and segment-analysis questions with SQL using the customer's definitions, categories and compliance rules; drafts child segments as YAML in `agent_outputs/<project_slug>/segments/` and pushes them only with explicit approval.

## Placeholders

Standard placeholders plus three audience ones, all in `.md` files:

| Placeholder | Value | Used in |
|---|---|---|
| `{{agent_name}}` | Confirmed agent name | `SKILL.md` frontmatter |
| `{{project_name}}` | Project display name (e.g. `Loyalty Audience Agent`) | `SKILL.md` title and description; context file titles |
| `{{project_slug}}` | Project slug | — (reserved) |
| `{{engagement_dir}}` | `agent_outputs/<project_slug>` | `SKILL.md` (schema snapshot, segment working directory, project state), `references/data-dictionary.md` |
| `{{parent_segment}}` | Parent segment name, exactly as in `tdx ps list` | `SKILL.md`, `references/data-dictionary.md` |
| `{{parent_segment_id}}` | Parent segment ID | `SKILL.md` (Console link), `references/data-dictionary.md` |
| `{{output_database}}` | Its output database (`cdp_audience_<parent_id>`) | `SKILL.md`, `references/data-dictionary.md` |

The two context files are filled in Phase 2 in the engagement folder (their `{{…}}` values included) and copied into `references/` at every build — the `*.template.md` skeletons are never installed.

## Agent files

Show this table after every build (`../../shared/customer_agent_pattern.md` Step 5), then a starter prompt (e.g. "Give me an overview of our customers and suggest three audiences we could build").

| File | What it is for | Ask it, for example |
|---|---|---|
| `SKILL.md` | The agent's instructions: discovery order, analysis and SQL rules, segment creation with approval, guardrails | "What can you help me with?" |
| `references/business-context.md` | Your business knowledge — terms and definitions (lead, conversion, VIP), product categories, priority attributes, naming, exclusion and compliance rules. Keep adding to it while you test: the more it says, the less the agent guesses | "How do you define a converted customer?" |
| `references/data-dictionary.md` | Every table and column of the parent segment, null rates, values, event time columns, existing segments | "Which behavior data can I use for recency?" |
| `references/runbook.md` (Phase 5) | Operating and updating the agent | "How do I refresh your data dictionary?" |

## Build checks (Phase 3)

From the Work Folder root:

1. `tdx query -d <output_database> "SELECT COUNT(*) FROM customers"` returns the profile count recorded in the data dictionary.
2. `grep -c "INFERRED\|NEEDS YOUR INPUT" .claude/skills/<agent-name>/references/business-context.md` — report the number of unconfirmed items to the user (expected before the customer's answers; must be 0 `NEEDS YOUR INPUT` after finalize).

## Finalize (Phase 5)

Rebuild with the confirmed `business-context.md` (Step 2 copies it), then add to the staging folder's `references/`:

| File | Content |
|---|---|
| `runbook.md` | Copy of `docs/runbook.md` if the docs were written; otherwise a short runbook: refresh the data dictionary (`tdx ps desc` + discovery queries) and rebuild, update the business context and rebuild, where segment drafts live |

Add `runbook.md` to the Session Start list in the staging `SKILL.md` as "read only for operations questions". Run the placeholder check (`../../shared/customer_agent_pattern.md` Step 2) before installing.
