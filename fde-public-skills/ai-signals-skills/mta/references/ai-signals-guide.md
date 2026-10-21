# AI Signals MTA — Model Guide

Read this for any task about the AI Signals MTA (Multi-Touch Attribution) models: how the Markov and Shapley models credit channels, which API parameters exist, testing other parameters, or changing the input or output tables. The workflow template (`mta_markov_shapley_ai_signals.dig`, `config/input_params.yml`) is the source of truth for what this setup sends today; this guide covers what the API accepts and how the models behave. The four standard models (First Touch, Last Touch, Linear, U-Shaped) are workflow SQL, not AI Signals — see the template README.

**Public documentation:** https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals — the AI Signals overview. There is no public page for the MTA models yet; after answering a question about them from this guide, share this link for AI Signals in general and say the MTA page is not published yet.

## 1. What it does

Two independent API solutions credit marketing channels for conversions, from the same journeys the workflow builds (`mta_journeys`):

| | `mta_markov` | `mta_shapley` |
|---|---|---|
| Idea | Each journey is a walk `(start) → channel → … → (conversion \| null)`; a first-order transition matrix is estimated from all journeys | Cooperative game theory: each journey's channels form a coalition whose value is the conversion rate of journeys with that channel combination |
| Credit | **Removal effect** — how much reaching `(conversion)` drops when the channel is removed from the graph | **Shapley value** — the channel's average marginal contribution across every coalition it can join |
| Input grain | One row per journey, path pre-joined with ` > ` | One row per touch; the model groups touches by user and splits them at each conversion |
| Uses non-converting journeys | No — they carry zero weight | Yes — they form the denominator of every conversion rate |
| Order-sensitive | Always (transitions) | Configurable (`shapley_order`) |
| Recency view | No (full path) | Yes — sizes 1..N look only at the last N unique channels |
| Extra output | Transition matrix (optional second table) | One result set per size |
| Best for | "What if we cut channel X?", channel dependency, flow / Sankey views | Fair credit between channels that appear together, budget split, last-N-touch influence |

Default: run both in parallel (this template does) and compare them with the standard models in `mta_models_standard`; large disagreements are worth investigating, not averaging away.

## 2. Input tables

Both solutions load only the four configured columns (other columns are ignored), drop rows whose ID or channel is NULL, and fail when nothing is left. Table names must be `database.table` (letters, digits, `_`); column names letters, digits and `_`.

**Markov — one row per journey** (this template: `mta_markov_input_table`, built by `sql/ml_models/mta_journey_agg.sql`):

| Role (parameter) | Column here | Rule |
|---|---|---|
| Journey ID (`user_id_col`) | `conversion_journey_id` | Unique per journey; journeys must already be split at conversions (the workflow does this) |
| Path (`channel_colname`) | `journey` | Channels in time order joined with exactly ` > `. If no row contains the separator, the run is rejected as touch-level input. Single-touch journeys are fine when some journeys have several touches |
| Converted (`conversion_col_name`) | `conversion` | 1 if the journey ends in a conversion |
| Time (`time_col`) | `date_time` | The journey's last touch; only used to order a capped load |

**Shapley — one row per touch** (this template: `mta_shapely_input_table`, built by `sql/ml_models/mta_shapely_input_table.sql` — only multi-step, multi-channel journeys, at most `shapley_max_load_rows` rows):

| Role (parameter) | Column here | Rule |
|---|---|---|
| User (`user_id_col`) | `unique_user_id` | Touches are grouped by it and split at each conversion, so a customer can give a converting journey and a trailing non-converting one (passing `conversion_journey_id` gives the same split) |
| Time (`time_col`) | `date_time` | Timestamp or `YYYY-MM-DD HH:MM:SS` text — never epoch integers. Ties are broken by channel, so results are reproducible |
| Channel (`channel_colname`) | `channel` | One channel label per row |
| Converted (`conversion_col_name`) | `conversion_flag` | 1 on the converting touch, 0 elsewhere |

Common rules:
- **Conversion flag** may be boolean, any number (non-zero = converted) or text `true/false`, `t/f`, `yes/no`, `y/n`, `1/0`. NULL counts as not converted; any other value fails the run.
- **At least one conversion** — a run with none fails, so it never overwrites the previous output with an empty table.
- **Channel labels** become column names of the Markov transition matrix: short, lowercase, no spaces or punctuation (`paid_search`, not `Paid Search (Google)`). Keep about 15 distinct channels or fewer (the workflow maps the long tail to `other`) so coalitions stay dense and the matrix readable.
- **No post-conversion touches**: the Markov input must be split at conversions (the journey SQL does it); Shapley splits itself.

## 3. Parameters

Run request: `POST <endpoint>/v1/runs/`. `solution_name`, `input_table` and `output_table` are top-level fields, not inside `solution_arguments`. Digdag renders `${…}` values as text; numbers and booleans sent as strings (`"4"`, `"false"`) are parsed correctly.

| Field | Required | Description |
|---|---|---|
| `solution_name` | yes | `mta_markov` or `mta_shapley` |
| `input_table` | yes | `database.table` |
| `output_table` | yes | `database.table` for the attribution result |
| `solution_arguments` | yes | Per solution, below |
| `version` | no | `stable` (default) for customer and production runs |
| `dataset_size` | no | Normally omitted — the API counts the input rows for instance sizing |

Headers: `authorization` (as in the template — keep it exactly as is) plus `X-TD-ML-SESSION-ID` / `X-TD-ML-ATTEMPT-ID` (Digdag session and attempt, for run tracking).

**`mta_markov` `solution_arguments`**

| Argument | Required | Default | Description |
|---|---|---|---|
| `user_id_col` | yes | – | Journey ID column |
| `time_col` | yes | – | Journey timestamp; only orders a capped load |
| `channel_colname` | yes | – | Column with the ` > `-joined path |
| `conversion_col_name` | yes | – | Conversion flag column |
| `transition_output_table` | no | not written | `database.table` for the transition matrix — needed for `mta_markov_transition_final` and flow views |
| `max_load_rows` | no | `0` (no cap) | Row cap, applied converting journeys first, then most recent |
| `output_mode` | no | `overwrite` | `overwrite` or `append` |

**`mta_shapley` `solution_arguments`**

| Argument | Required | Default | Description |
|---|---|---|---|
| `user_id_col` | yes | – | User (or journey) column |
| `time_col` | yes | – | Touch timestamp |
| `channel_colname` | yes | – | Channel column |
| `conversion_col_name` | yes | – | Conversion flag column |
| `shapley_lookback_window` | no | `4` | Integer 1–10: one model per size 0..N |
| `shapley_order` | no | `true` | Whether channel order matters within a coalition |
| `max_load_rows` | no | `0` (no cap) | Cap on whole journeys, converting journeys first (may overshoot by one journey) |
| `output_mode` | no | `overwrite` | `overwrite` or `append` |

Tuning:

| Parameter | When to change it |
|---|---|
| `shapley_lookback_window` (config, template `4`) | Lower (2–3) when journeys are short (median under 3 unique channels) or the run is slow — each step removes one model; `3` reproduces older runs (sizes 0–3). Raise (5–10) only when journeys routinely have more than 4 unique channels and a longer window answers a business question |
| `shapley_order` (config, template `true`) | `false` when coalitions are sparse (many channels, little data), when touch order is unreliable (many touches share a timestamp), or when the business wants channel-set credit — order-free coalitions pool more journeys and give steadier estimates |
| `max_load_rows` (config `markov_max_load_rows` / `shapley_max_load_rows`, template `50000000`) | A memory safety net only. Bound the volume in the workflow instead (the source time filters). In this template `shapley_max_load_rows` is also the `LIMIT` of the Shapley input query. The Markov cap loses nothing while all converting journeys fit; a Shapley cap keeps converting journeys first and so **inflates conversion rates**. After a capped run, check `truncated` in the run statistics |
| `output_mode` (not sent) | Keep the default `overwrite`: MTA is a full recompute and the raw tables have no run column, so `append` would mix runs. History lives in the `*_final` tables |
| `version` (config `ml_batch_api_version`) | Keep `stable` |

### Endpoint by region

`ml_batch_api_endpoint` in the config:

Set it from the `site` that `tdx status` reports for the customer's account. It is the only place the endpoint is set — every AI Signals call in `mta_markov_shapley_ai_signals.dig` reads `${ml_batch_api_endpoint}`.

| `tdx status` site | Region | Endpoint |
|---|---|---|
| `us01` | US | `https://ml-batch-api.treasuredata.com` (template default) |
| `jp01` | Japan | `https://ml-batch-api.treasuredata.co.jp` |
| `eu01` | EU | `https://ml-batch-api.eu01.treasuredata.com` |
| `ap02` | AP | `https://ml-batch-api.ap02.treasuredata.com` |
| `ap03` | AP | `https://ml-batch-api.ap03.treasuredata.com` |

## 4. Workflow syntax

`mta_markov_shapley_ai_signals.dig` runs both branches in parallel. Each branch keeps its submit and poll steps in one group, so `http.last_content` always refers to that branch's own submit:

```yaml
+run_markov_and_shapley_models_parallel:
  _parallel: true
  +execute_markov_model:
    +agg_journey_for_markov_chains:           # one row per journey
      td>: sql/ml_models/mta_journey_agg.sql
      create_table: ${markov_input_table}
    +markov:
      http>: ${ml_batch_api_endpoint}/v1/runs/
      method: POST
      headers:
        - authorization: "TD1 ${secret:td.apikey}"
        - X-TD-ML-SESSION-ID: ${session_id}
        - X-TD-ML-ATTEMPT-ID: ${attempt_id}
      content_format: json
      content:
        input_table: ${sink_database}.${markov_input_table}
        output_table: ${sink_database}.${markov_output_table}
        solution_name: mta_markov
        version: ${ml_batch_api_version}
        solution_arguments:
          user_id_col: ${markov_user_id}
          time_col: ${time_col}
          channel_colname: ${markov_channel_colname}
          conversion_col_name: ${markov_conversion_col_name}
          max_load_rows: ${markov_max_load_rows}
          transition_output_table: ${sink_database}.${transition_output_table}
      store_content: true
    +markov_poll:                             # 408 while running, retried until 200
      http>: ${ml_batch_api_endpoint}/v1/runs/${JSON.parse(http.last_content)['id']}/status
      method: GET
      headers:
        - authorization: "TD1 ${secret:td.apikey}"
    # … *_final reporting steps
  +execute_shapley_model:
    # same pattern: input SQL → POST solution_name: mta_shapley (user_id_col: ${user_id_col} = unique_user_id,
    # time_col, channel_colname, conversion_col_name: ${shapley_conversion_col_name},
    # shapley_lookback_window, shapley_order, max_load_rows) → poll → shapley_attr_percentage.sql
```

No secret to set: the AI Signals architecture provides the key — never ask the user to set `td.apikey`, and keep the header exactly as in the template. The account's enabled AI Signals solutions must include `mta_markov` and `mta_shapley`, or the API rejects the run.

## 5. How it works

**Markov.** From all journeys the model estimates the probability of moving from each state to the next, then computes for each channel:
- `removal_effect` = 1 − P(conversion without the channel) / P(conversion).
- `attribution_markov_algorithmic` = the removal effects normalized to sum to 1, times the number of conversions — so the column **sums to the number of converting journeys**, not to 100%.

Weighting: no conversion-value column is passed, so each journey's transitions are weighted by its outcome — 1 for converting, 0 for non-converting. Non-converting journeys add no transition mass; their channels still appear with 0 credit. As a result `removal_effect` is in practice **the share of converting paths that pass through the channel**, not a measured drop in conversion rate. Explain it that way to users. (This matches the earlier Python implementation; R&D may add a value / frequency option later.)

**Shapley.** For each size N from 0 to `shapley_lookback_window`, only the last N unique channels of each journey are kept (channels counted, not days; size 0 = the whole journey) and one model runs. Credit is split so that a channel present in every journey cannot earn credit just by being there. Non-converting journeys are essential: sampling them changes the conversion rates and therefore the credit. Cost grows combinatorially with unique channels per journey × (window + 1) — the window is the main cost control.

**Run size.** Both solutions run on a single node over the whole table and cannot be split. Instances are sized from the input row count (about 2 GB per million rows; the smallest instance covers roughly 30M rows). Up to ~20M model-input rows is the design target; for larger accounts, narrow the source time filters.

## 6. Output tables

**Markov raw — `mta_markov_attribution`** (replaced every run)

| Column | Meaning |
|---|---|
| `channels` | Channel label |
| `attribution_markov_algorithmic` | Credited conversions (sums to the converting journeys), 3 decimals |
| `removal_effect` | Removal effect 0–1, 3 decimals |

**Markov transition matrix — `mta_markov_transition`** (only when `transition_output_table` is set): wide — `channels` is the source state and there is one column per destination state, including `(conversion)` (written as `_conversion_`). Probabilities, 3 decimals. The synthetic start and `(null)` states are removed. The column set depends on the data, so `markov_transition_matrix.sql` discovers it and unpivots it for channels with `removal_effect > removal_effect_limit`.

**Shapley raw — `mta_shapley_attribution`** (replaced every run)

| Column | Meaning |
|---|---|
| `channels` | Channel |
| `variable` | Internal model column name, e.g. `attribution_shapley_size2_conv_rate_order_algorithmic` (without `_order` when `shapley_order` is false) |
| `value` | Shapley attribution value |
| `size` | 0..N — 0 = whole journey, N = last N unique channels. Exactly N + 1 sizes are written |

`shapley_attr_percentage.sql` renames `size` to **`step`** in `mta_shapley_attribution_final`. Older (Python) runs wrote a `day` column instead; an existing `mta_shapley_attribution_final` from such runs has the old schema — use a new sink database or drop that table before the first AI Signals run.

**Reporting tables** (workflow SQL, appended with `time` and `run_time` every run):

| Table | Built by | Columns |
|---|---|---|
| `mta_markov_attribution_final` | `markov_insert_final.sql` | `time`, `run_time`, `channels`, `attribution_markov_algorithmic`, `removal_effect` |
| `mta_markov_transition_final` | `markov_transition_matrix.sql` (unpivot) | `time`, `run_time`, `channels`, `to_channel`, `trans_prob`, `_conversion_` |
| `mta_shapley_attribution_final` | `shapley_attr_percentage.sql` | `time`, `run_time`, `step` (= `size`), `channels`, `value`, `percentage` (value / sum within the step) |

### Validate

The workflow checks are in `workflow-setup.md` §4 (check 5 covers the models). Model-specific expectations:
- Markov: `SUM(attribution_markov_algorithmic)` ≈ the converting journeys in `mta_markov_input_table`; channels only seen in non-converting journeys have 0 credit and 0 removal effect.
- Shapley: steps 0..`shapley_lookback_window` present for the latest `run_time` in `mta_shapley_attribution_final`; `percentage` sums to 1 per step.
- Transition matrix: rows for the latest `run_time` for every channel with a removal effect above `removal_effect_limit`; destinations are only those channels, so a row's `trans_prob` values can sum to less than 1.
- The run statistics report `input_total_records`, `loaded_rows`, `truncated` and `output_rows`; `truncated = true` means a `max_load_rows` cap cut the input.

### Interpret and use

- Compare **shares**, not raw numbers, across Markov, Shapley and the standard models — each sees its own input (Shapley only the multi-step, multi-channel journeys).
- Shapley: in `mta_shapley_attribution_final` use `step = 0` for the whole-journey comparison; steps 1–3 answer "which channels matter just before conversion". Never sum across steps.
- Markov: compare the **attribution share** (`attribution_markov_algorithmic` / its total — what the dashboard shows) with Shapley %; the removal effect is a separate path-share measure.
- Markov removal effect above ~0.2 marks channels most converting paths depend on; pair it with the transition matrix to see what feeds them.
- High Markov or Shapley credit but low Last Touch credit = an assisting channel that last-click reporting undervalues.

### Diagnostics and limits

- Markov removal effect is a path-share measure, not an incrementality test (see §5).
- The template's Shapley input keeps only multi-step, multi-channel journeys. Single-channel journeys (converting or not) are part of the Shapley conversion-rate denominator, so leaving them out shifts credit toward channels that appear in multi-channel journeys. The `LIMIT` has no `ORDER BY`, so if it binds it can cut journeys mid-way. Treat Shapley shares as directional.
- Sessions that contain only `direct` touches are left out when journeys are built (`mta_journeys_base`).
- Channel names that collide after becoming column names (e.g. `Paid-Search` and `paid_search`) are not guarded — normalize channels in the workflow.

## 7. Common changes

| Change | How |
|---|---|
| Longer or shorter analysis period for the models | The source time filters (`apply_time_filter`, `time_filter_type`, dates or `lookback_period`) |
| Fewer Shapley input rows | `shapley_max_load_rows` (also the input query's `LIMIT`) |
| Shapley recency view or speed | `shapley_lookback_window` (1–10) |
| Order-free Shapley | `shapley_order: false` |
| Remove the memory cap | `markov_max_load_rows` / `shapley_max_load_rows` = `0` |
| More or fewer channels in the transition report | `removal_effect_limit` |
| Different channel grouping | Channel expressions in the config or the grouping `CASE` in `journeys_base_table.sql` — keep labels short and lowercase |
| Model input or output table names | Not configurable — the `.dig`, the reporting SQL, the agent and the dashboard use these names |

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Run rejected or 401/403 | Wrong regional endpoint, or `mta_markov` / `mta_shapley` not enabled for the account | Set `ml_batch_api_endpoint`; ask the account admin to enable the MTA solutions |
| Run fails: no rows / no conversions | Input empty after dropping NULL IDs or channels, or no conversion inside the window (stale data) | Relax the source time filters; check `conversion_flag` and channel values in the input table |
| Markov rejected as touch-level input | No `journey` value contains ` > ` | All journeys have one touch — check `session_length`, `max_journey_days` and the event time |
| Run fails on the conversion flag | Values other than numbers, booleans or true/false-style text | Fix the `conversion_flag` expression |
| `*_final` repeats the previous run's numbers | A model run failed (the status call still ends with 200) and the raw table kept the last output | Read `error_messages` in the poll task's log, fix and re-run |
| Shapley slow | Many unique channels per journey × window | Lower `shapley_lookback_window`; merge small channels into `other` |
| Transition matrix missing or odd columns | `transition_output_table` not sent, or channel labels with spaces / punctuation | Keep the template argument; normalize channel labels |
