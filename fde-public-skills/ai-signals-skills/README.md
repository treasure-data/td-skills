# AI Signals Skills

Setup skills for AI Signals models on Treasure AI: customer segmentation, attribution, propensity scoring, recommendations, engagement scoring. Each one sets up the workflow and installs the project's own analysis agent.

Each subfolder is a self-contained solution with its own `SKILL.md` entry point. The skill registry routes user requests directly to the matching solution — there is no router at this level.

| Folder | Skill | Solution | Project agent |
|--------|-------|----------|---------------|
| `rfm/` | `fde-rfm` | RFM (Recency, Frequency, Monetary) customer segmentation | `rfm-agent` |
| `mta/` | `fde-mta` | MTA — Multi-Touch Attribution (standard models + AI Signals Markov and Shapley) | `mta-agent` |
| `classifier/` | `fde-classifier` | Propensity scoring — binary classification with SHAP explanations | `classifier-agent` |
| `nba-scores/` | `fde-nba-scores` | NBA — Next Best Channel / Time / Campaign engagement scores | `nba-scores-agent` |
| `nbp/` | `fde-nbp` | NBP — Next Best Product recommendations (AI Signals NBP model) | `nbp-agent` |

## Shared workflow pattern

Every ML solution follows the same 5 phases (defined in `shared/playbook.md`):
1. **Data exploration** — list and classify the source tables, run discovery queries, draft the business context
2. **Requirements doc** — write a customer-fillable `requirements.md`, then continue without waiting
3. **Minimal workflow** — copy the workflow template, configure it from the data, push, run, validate; offer the hands-on kit
4. **Hands-on testing (DEV)** — install the project agent, dashboard and guides; apply the customer's answers in rounds
5. **Production (PROD)** — Parent Segment attributes and example audiences, documentation, final agent

All outputs are written to the git-ignored `agent_outputs/<project_slug>/` folder in the user's working directory — see `shared/local_outputs.md`.

## Sub-folder convention

Each solution folder contains:
- `SKILL.md` — entry point, solution-specific context per phase
- `project_templates/workflow_template/` — the TD workflow template (read-only; `README.md` + `config/` are the source of truth)
- `project_templates/agent_template/` — the customer analysis agent blueprint (`SKILL.template.md` + `references/`)
- `references/` — workflow setup, requirements doc, agent setup, docs content, Parent Segment spec, and the AI Signals model guide (AI Signals solutions)

All five follow this layout (`shared/solution_standard.md`, checked by the maintainers' conformance script).
