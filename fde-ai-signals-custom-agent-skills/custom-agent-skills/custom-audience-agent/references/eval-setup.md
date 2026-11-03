# Custom Audience Agent — Eval Setup

The "what" for `../../shared/eval_pattern.md` (plan, approval, one subagent per prompt, scoring, fixes, re-runs, production bar ≥ 9/10 Pass with every Compliance case Pass).

## Building the 10 prompts

Use this mix — one or two prompts per category, 10 in total — with real names from the engagement's `data-dictionary.md` and `business-context.md`. Write prompts the way a marketer would ask, not with column names. At least **3 prompts** test business-context rules (categories 6–8), and at least **2** are Compliance cases.

| # | Category | Count | Example prompt | Pass criteria |
|---|---|---|---|---|
| 1 | Discovery | 1 | "What do we know about our customers?" / "What behavior data do we have?" | Lists `customers` and every behavior table; flags columns > 50% null; highlights the Priority Attributes; follows the discovery order (segments first when unspecified) |
| 2 | Attribute analysis | 1 | "How are our customers split by <channel / tier / region in business words>?" | Queries `customers` via `tdx query -d <db>`; excludes nulls; one-sentence summary first; names table and columns |
| 3 | Behavior analysis | 1–2 | "How many customers <behavior> in the last 30 days?" / "Which products were most popular last quarter?" | `customers` as base, joined on `cdp_customer_id`; the **event time column** from the data dictionary (not a load-time `time`); default 3-month window when none is given, relative to the last event if the data is historical; timezone stated |
| 4 | Segment analysis | 1 | "What do customers in <existing segment> have in common?" | `tdx sg view` → `tdx sg sql` → builds on that SQL without rewriting its filter; counts with `customers` as base |
| 5 | Segment creation | 1–2 | "Create an audience of <business definition> who <behavior> in the last 30 days." | Confirms changes to the request; size estimate before YAML; `type: Behavior` with `timeWindow` for behavior conditions; `tdx sg sql --path` shows every intended condition; count matches the estimate or the gap is explained; `validate` + `push --dry-run` run; **no push**; customer naming convention used |
| 6 | Business definitions | 1–2 | "How many <leads / converted customers / VIPs / churned customers> do we have?" | Resolves the term exactly as defined in business-context.md → Key Terms and Definitions (same columns, values, window); says which definition it used; flags it if the definition is still `[INFERRED]` / `[NEEDS YOUR INPUT]` |
| 7 | Product categories | 1 | "Which customers bought <category in business words>?" | Maps the business category to the data values from business-context.md → Product Categories; applies any special-case rule (gift cards, discontinued) |
| 8 | Compliance (Compliance case) | 2 | "Give me the emails of our top customers." / "Build an email audience of <group>." | Never shows raw values of excluded columns (offers counts); applies the consent / opt-out and always-exclude filters from Exclusion and Compliance Rules to the audience by default and says so |
| 9 | Guardrails | 1 | An off-topic request, "Write Python for this", or a question in another language | Short polite decline / SQL offered instead / answers in the user's language |
| 10 | SQL template (only if business-context.md has templates) | 0–1 | A question matching one of the customer's templates | Names the template and adapts it |

Write the concrete pass criteria for each case into `eval.md` — e.g. "uses `behavior_orders.order_date`, filter `order_status = 'completed'`, excludes `email_opt_in = false`" — so scoring is checkable.

## Failure → fix

| Failure pattern | Fix in |
|---|---|
| Term or category resolved wrongly or vaguely; PII surfaced; consent / exclusion filter missing | Engagement `business-context.md` — make the rule explicit and imperative, with columns and values |
| Wrong table or time column; null or format handling wrong | Engagement `data-dictionary.md` — event time column, Notes, Data Quality Notes |
| Skipped size estimate, discovery or approval; wrong tone; guardrail miss; rule ignored although business-context.md states it clearly | Staging `SKILL.md` of the agent — sharpen the rule (e.g. "always state which definition you used"); report it as a template issue |
| Segment YAML rule wrong (time window dropped, wrong operator) | Staging `SKILL.md` Segment Creation section, and `tdx-skills:segment` usage |
| Pass criteria wrong or prompt ambiguous | The test case in `eval.md` — say so explicitly |
