# Classifier — Documentation Set Content

Classifier content for the Phase 5 docs. File names, audience headers, create order and update rules are in `../../shared/customer_docs_pattern.md`. Docs go to `agent_outputs/<project_slug>/docs/`. Doc titles: `# <Project Name> <Doc Name>` (e.g. `# Churn Classifier Runbook`).

Sources for every value: `project_state.md`, `requirements.md`, `business-context.md`, the deployed working copy (`workflow/config.yml`, `workflow/sql/input_features.sql`, `workflow/classify.dig` for schedule and alert email), and the latest validation results. Describe what is deployed, not template defaults. Parameter meanings come from `workflow/README.md` — customer docs reword them in business language (style below); internal docs may use technical names.

## Customer docs — writing style

`architecture.md`, `behavior.md` and `eval_results.md` are read by business stakeholders (marketing, sales, CRM leads). Write as if presenting to a non-technical manager.

| Do | Don't |
|---|---|
| Business language: customers, buyers, "likely to leave", campaigns | SQL, YAML, config keys, column or table names in the body |
| Short sentences, one idea per bullet; lead with what it means for them | Model internals (Optuna, CV folds, SHAP values, PSI formulas) |
| Real numbers rounded and as people ("about 1 in 5 customers") | Raw decimals (0.8731), metric acronyms without explanation |
| Their own terms from `business-context.md` (segment names, KPIs) | Generic data-science jargon |
| A worked example ("Anna, last purchase 4 months ago, scores high") — invented, never real customer data | Bare lists of features |
| "What you can do with this" at the end of each section | Caveats without a recommendation |

Translate every technical term:

| Technical | Say instead |
|---|---|
| Score / probability | Likelihood score — how likely the customer is to <outcome> compared with others. With the default balancing it is a ranking, not an exact percentage; say so |
| Threshold, `predicted_label` | The cut-off above which we flag a customer as "likely" |
| Score bucket | Likelihood band (e.g. 90–100% = top band) |
| Label, target, horizon | The outcome we predict, and the time window (e.g. "within the next 90 days") |
| Features, observation window | Signals from the last N months of behavior (purchases, visits, emails) |
| Training snapshots | The model learned from N past moments in time, so it has seen several seasons |
| AUC-ROC | How well the model ranks: 0.5 = coin flip, 1.0 = perfect — give the plain verdict (good / strong) |
| Precision / recall | "Of the customers we flag, X in 10 actually <outcome>" / "We catch X in 10 of those who do" |
| SHAP drivers | The main reasons a customer gets a high or low likelihood |
| PSI / drift | Whether today's customers still look like the ones the model learned from |
| Parent Segment attributes | New fields you can use to build audiences in Audience Studio |

Technical names (project, database, tables) go only in a closing **"For your data team"** table in `architecture.md`.

## 1. `docs/architecture.md` (customer)

- **How it works, in one picture:** your data → the model learns from past customers → every customer gets a likelihood → it appears in Audience Studio → teams use it in campaigns. A simple flow diagram in words or ASCII, no system names
- **What runs and when:** how often the model relearns and how often scores refresh, in plain words ("scores refresh every Monday morning")
- **What you get:** the new fields in Audience Studio (likelihood, likelihood band, "likely" flag) and the example audiences
- **Who to contact** when something looks wrong
- **For your data team** (closing table): TD workflow project and entry point, sink database, model name, predictions and latest-scores tables, Parent Segment attribute names

## 2. `docs/behavior.md` (customer)

- **What we predict** — the outcome in one sentence, the time window, who gets a score and who is left out (and why)
- **What the model looks at** — the kinds of signals (recent purchases, visits, email engagement…) and the history used; that it only uses what was known before the moment of prediction, so it doesn't "cheat"
- **How it learned** — from N past moments in time across the seasons; it relearns every <cadence>
- **How to read a score** — likelihood, bands and the "likely" flag with a worked example; scores are best used to rank and compare customers
- **Top reasons** — the five strongest drivers from the latest run, each as one plain sentence with its direction ("customers who haven't bought in 60+ days are much more likely to leave")
- **Good to know** — caveats in plain words, each with what to do about it (e.g. "few past examples — treat the first months as a pilot")
- **Using it** — the example audiences from Phase 5 and 2–3 campaign ideas tied to the customer's goals

## 3. `docs/eval_results.md` (customer)

- **Verdict first** — one sentence: is the model good enough for the planned use, and why
- **How accurate it is** — in people: "of every 100 customers we flag, about N will <outcome>; we catch about N of every 10 who do"; ranking quality as a plain verdict (with the AUC number in brackets)
- **Compared with no model** — flagged customers vs the average rate ("3× more likely than a random customer")
- **Stable over time** — whether today's customers still look like the training data, in one line
- **What happens next** — once real outcomes are in, we compare predictions with what actually happened (`workflow-setup.md` §4 check 6) and report it here; known limitations and what would improve them
- Date of the validated run (session ID only in a footnote)

## 4. `docs/runbook.md` (internal)

- Working copy path and TD project name; re-deploy: edit `workflow/config.yml` or `workflow/sql/input_features.sql` → `( cd workflow && tdx wf push -y )` → `tdx wf run <project>.classify` (or `.train` / `.predict`) → validate
- Monitoring: `tdx wf sessions <project>`, `tdx wf timeline <project>.classify --follow`, `tdx wf attempt <id> tasks` / `logs +<task>`
- Schedules and failure-alert recipient (from the `.dig` files); how to change them (edit the `.dig`, re-push)
- Model: the AI Signals classifier, `model_type`, `model_name` (retraining replaces it — use a versioned name for rollback), the API endpoint (region); no secrets to manage
- Retraining guidance: when to retrain (PSI over 0.25, live performance below the test metrics — check 6, a changed population or source) and how to compare two models (separate `model_name`s)
- The troubleshooting tables from `workflow-setup.md` and `ai-signals-guide.md` §7, filtered to what applies to this customer
- The feature SQL as deployed (path) and every change made beyond the config, with dates
- Rebuilding the customer agent after config or SQL changes (`../../shared/customer_agent_pattern.md`)

## 5. `docs/access_ownership.md` (internal)

Standard content per `../../shared/customer_docs_pattern.md`, plus: TD project name, sink database, model name, predictions table, Parent Segment name, customer agent name and path (`.claude/skills/<agent-name>/`).
