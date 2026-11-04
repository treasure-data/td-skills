# Probabilistic ID Unification — Customer Agent Setup

Probabilistic ID Unification specifics for `../../shared/customer_agent_pattern.md` (agent name, staging build, install, verify). Template: `<solution_dir>/project_templates/agent_template/`. Agent name: `<project_slug>-agent` (`prob-idu-agent` by default).

## What the agent does

Answers questions about the deployed unification — how many duplicate IDs were merged, how good the matches are (similarity bands, cluster purity), whether clusters look over-merged, which settings a run used, run-to-run changes, "how was it built" — by querying the `prob_*` stats tables and the cluster tables in the sink database, and charts the answers in chat with `render_chart`. This solution has no standalone HTML dashboard and no generator script.

## Placeholders

Standard placeholders plus three Probabilistic ID Unification ones, all in `.md` files:

| Placeholder | Value | Used in |
|---|---|---|
| `{{agent_name}}` | Confirmed agent name | `SKILL.md` frontmatter |
| `{{project_name}}` | Project display name (e.g. `Customer Probabilistic IDU`) | `SKILL.md` description and intro, `business-context.template.md` |
| `{{project_slug}}` | Project slug (e.g. `retail-prob-idu`) | Standard; not used in the template files |
| `{{sink_database}}` | Confirmed sink database | `SKILL.md`, `references/data-dictionary.md` |
| `{{engagement_dir}}` | `agent_outputs/<project_slug>` | `SKILL.md` |
| `{{output_table}}` | `output_table` from the deployed config (default `prob_idu_clusters`) | Table names in `SKILL.md` and `references/data-dictionary.md` |
| `{{id_col}}` | `id_col` from the deployed config | `SKILL.md`, `references/data-dictionary.md` |
| `{{cluster_col_name}}` | `cluster_col_name` from the deployed config (default `prob_id`) | `SKILL.md`, `references/data-dictionary.md` |

Two files are copied in at every build (`../../shared/customer_agent_pattern.md` Step 2): the engagement's `business-context.md` (drafted from `references/business-context.template.md` in Phase 1 — the skeleton itself is never installed) and `<solution_dir>/references/ai-signals-guide.md`, unchanged.

`references/workflow-guide.template.md` and `references/model-setup-walkthrough.template.md` are **guide skeletons**: removed from every build and filled only when the user chose the guides — interim in Phase 4, final in Phase 5 (Guides, below).

## Agent files

Show this table to the user after every build (`../../shared/customer_agent_pattern.md` Step 6), with only the files the build contains, then a starter prompt.

| File | What it is for | Ask it, for example |
|---|---|---|
| `SKILL.md` | The agent's instructions: what it answers, which tables it queries, its accuracy rules | "What can you help me with?" |
| `references/business-context.md` | Your business knowledge — what counts as the same person, which identifiers are reliable, placeholder values, merge rules and exclusions, goals. Keep adding to it while you test: the more it says, the less the agent guesses | "Which of our business definitions are still unconfirmed?" |
| `references/ai-signals-guide.md` | How the probabilistic unification works: input it needs, blocking and clustering parameters, how to tune, how to validate and read the outputs | "What would change if we raised the cluster threshold?" |
| `references/tuning-advisor.md` | How the agent recommends the best cluster / Jaccard thresholds and column weights from several runs, with the Jaccard ≤ cluster rule | "What thresholds and weights do you recommend?" |
| `references/data-dictionary.md` | Every output table and column, the quality bands, how to pick a run | "What does the cluster purity mean?" |
| `references/workflow-guide.md` (if built) | The deployed workflow end to end: input SQL, dedupe columns and weights, config values, output tables | "Which columns are compared, and with what weights?" |
| `references/model-setup-walkthrough.md` (if built) | What was decided during setup and why, the validation baseline and accuracy rules | "Why were these thresholds chosen?" |
| `references/runbook.md` (Phase 5) | Operating the production workflow | "How do I re-run the unification?" |

## Build checks (Phase 4 Part A)

After installing, from the Work Folder root:

1. `tdx query -d <sink_database> "SELECT s.session_id, s.avg_similarity_score, p.deduped_ids FROM prob_uni_config_stats_table s JOIN prob_model_table_params p ON p.session_id = s.session_id JOIN prob_session_global_filter f ON f.session_id = s.session_id AND f.session_rnk = 1"` returns one row for the validated run.
2. `tdx query -d <sink_database> "SELECT COUNT(*) FROM dedupe_<output_table>"` returns the matched IDs.

Nothing else — no screenshots, browser tests or extra QA scripts.

## Guides (Phase 4 interim, Phase 5 final)

Built only when the user chose them (Phase 3 end question for interim, Phase 5 question for final) — mechanics and the Interim / Final status line in `../../shared/customer_agent_pattern.md` Step 4:

| File | Content |
|---|---|
| `workflow-guide.md` | Fill `<solution_dir>/project_templates/agent_template/references/workflow-guide.template.md` — the as-built workflow: pipeline, input table SQL, dedupe columns and weights, settings, output tables. Follow the skeleton's build instructions |
| `model-setup-walkthrough.md` | Fill `<solution_dir>/project_templates/agent_template/references/model-setup-walkthrough.template.md` — discovery, requirements, decision log, cleaning and quality checks, runs and validation baseline, downstream use, accuracy rules. Follow the skeleton's build instructions |

Interim guides describe the setup deployed so far — assumed defaults marked "to confirm", downstream-use sections "Not done yet — Phase 5". They are already routed by the **How It Was Built** section of `SKILL.md`.

## Finalize (Phase 5)

Rebuild with the confirmed `business-context.md` (playbook Phase 5 step 3; Step 2 copies it), then add to the staging folder's `references/`:

| File | Content |
|---|---|
| `runbook.md` | Copy of `docs/runbook.md` |

Add `runbook.md` to the **Initialization** list in the staging `SKILL.md` as "read only for operations questions"; then ask about the final guides (Guides, above). Add one line under **Query Rules**: "When `workflow-guide.md` and the settings columns of the latest `prob_model_table_params` row disagree, report the difference — the table reflects what actually ran." Run the placeholder check in `../../shared/customer_agent_pattern.md` Step 2 before installing.
