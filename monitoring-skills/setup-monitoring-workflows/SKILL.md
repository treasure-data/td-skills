---
name: setup-monitoring-workflows
description: Deploys the monitoring workflow projects (basic_monitoring, cdp_monitoring, insights_monitoring, workflow_monitoring) via tdx CLI — cloning, config, secrets, and initial ingest. Use whenever the user wants to deploy, set up, or install monitoring workflows, wants to check whether an already-triggered deployment's initial ingest has finished (e.g. "is my monitoring ingest done yet?", "check on basic_monitoring_<suffix>"), or explicitly names this skill (e.g. "setup-monitoring-workflows", "set up monitoring workflows", or close variants). Not for analyzing already-ingested data — once ingest is confirmed done, use analyze-monitoring-data instead.
---

# Monitoring Workflows — Deploy & Test

A skill for deploying monitoring workflow projects inside Treasure AI Studio chat. Scope is **deployment + post-deploy testing only**. Data analysis is out of scope.

Source is cloned directly from the treasure-boxes GitHub repo via sparse checkout — the skill operates on the cloned working tree, not on uploaded archives.

After clone, projects live at `treasure-boxes/scenarios/monitoring/<project>/`, and each has a `common/settings.yaml` — that's the only file the skill mutates.

---

## Workflows reference

| Project | Initial workflow(s) | Incremental | Notes |
|---|---|---|---|
| `basic_monitoring` | `initial_ingest`, `initial_ingest_policy` | `incremental_ingest`, `incremental_ingest_policy` (daily 00:00 UTC) | `_policy` workflows only work if Policy-Based Permission is enabled |
| `cdp_monitoring` | `initial_ingest` | `incremental_ingest` (daily 00:00 UTC) | — |
| `insights_monitoring` | `ingest` | none — re-run manually | — |
| `workflow_monitoring` | `initial_ingest_session_attempt` | `incremental_ingest` (daily 00:00 UTC) | — |

---

## Renaming rule: database only

**Only rename the database in `settings.yaml`. Never rename table names.**

All hardcoded table references in `.dig` files run against `${td.database}`, so they resolve correctly within the renamed database. Renaming tables would break those references and the query samples.

In `common/settings.yaml`, change ONLY the `database:` line:
```yaml
database: <project>_<suffix>
```
Leave all `tables:` entries untouched.

---

## Region — derive, don't ask

Treasure AI Studio is bound to a single account, so the region is fixed for the session — but the cloned `settings.yaml` ships with US defaults regardless. Detect the studio's actual region from the active TD endpoint and patch `settings.yaml` only when it doesn't already match.

Detect once per session:

```bash
tdx auth
```

The output includes a `site:` field (e.g. `tdx profile: N/A (site: us01)`). Read the site value from that line — do not parse the endpoint hostname.

Map the endpoint host to the region row below (source: Treasure AI's *Sites and endpoints* doc, https://docs.treasure.ai/apis/endpoints/endpoints):

| Studio endpoint contains | Site | `api_endpoint` | `cdp_api_endpoint` (cdp_monitoring only) | Console base |
|---|---|---|---|---|
| `api.treasuredata.com` (no region prefix) | US (`us01`) | `api.treasuredata.com` | `api-cdp.treasuredata.com` | `https://console.us01.treasuredata.com` |
| `eu01.treasuredata.com` | EU (`eu01`) | `api.eu01.treasuredata.com` | `api-cdp.eu01.treasuredata.com` | `https://console.eu01.treasuredata.com` |
| `treasuredata.co.jp` | Japan (`ap01`) | `api.treasuredata.co.jp` | `api-cdp.treasuredata.co.jp` | `https://console.treasuredata.co.jp` |
| `ap02.treasuredata.com` | Korea (`ap02`) | `api.ap02.treasuredata.com` | `api-cdp.ap02.treasuredata.com` | `https://console.ap02.treasuredata.com` |

Apply the resolved values to every project deployed this session. **Never ask the user** which region — derive it.

---

## Step-by-step (per project)

### 0 — Gather session-level inputs interactively

Before touching any files:
1. Use `AskUserQuestion` (multi-select) to ask which projects to deploy. Phrase the question to make clear they can select multiple or all:

   > "Which monitoring projects would you like to deploy? Select one, multiple, or all."

   Options:
   - `basic_monitoring` — tracks job history, query patterns, and user access logs
   - `cdp_monitoring` — tracks CDP segment sync, activation, and journey run activity
   - `insights_monitoring` — tracks Insights data model query and usage metrics
   - `workflow_monitoring` — tracks workflow session and attempt history

   Only deploy the projects the user selects in subsequent steps.

2. **Detect region** silently from the active TD endpoint (see *Region — derive, don't ask* above). Cache the resolved region + console base for the session.
3. Use `AskUserQuestion` to collect **Suffix** — ask: "What suffix should I append to the database and project names?" (e.g., your username or a ticket ID). Use the same suffix for every project this session.

Do **not** ask the user for region.

### 1 — Clone the repo

Run once per session (skip if already cloned):

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/treasure-data/treasure-boxes.git
cd treasure-boxes && git sparse-checkout set scenarios/monitoring
```

Projects will be at `treasure-boxes/scenarios/monitoring/<project>/`. Verify `<project>/common/settings.yaml` exists before proceeding. If it doesn't, the clone may have failed — re-run the commands above.

### 2 — Template settings.yaml

Copy the project to a suffixed working directory first, then edit:

```bash
cp -r treasure-boxes/scenarios/monitoring/<project> ./<project>_<suffix>
```

In `<project>_<suffix>/common/settings.yaml`:
- Change `database:` to `<project>_<suffix>`
- Patch `api_endpoint` (and `cdp_api_endpoint` for `cdp_monitoring`) to the values from the region row resolved in step 0. The cloned defaults are US — only skip the patch if the resolved region is also US.

**For non-US deployments only:** also patch hardcoded US endpoints in any Python scripts under the project directory. Find and replace these three hostnames in all `.py` files:

```bash
grep -rl "api-workflow.treasuredata.com\|api\.treasuredata\.com\|api-cdp\.treasuredata\.com" <project>_<suffix>/
```

Replace each occurrence with the region-correct equivalent from the resolved row:
- `api-workflow.treasuredata.com` → `api-workflow.<region>.treasuredata.com` (e.g. `api-workflow.eu01.treasuredata.com`)
- `api.treasuredata.com` → resolved `api_endpoint`
- `api-cdp.treasuredata.com` → resolved `cdp_api_endpoint`

Do this with `sed -i` or by reading and rewriting each file. Skip this step entirely for US deployments — the defaults are already correct.

### 3 — Create tdx.json

Create `<project>_<suffix>/tdx.json`:
```json
{ "workflow_project": "<project>_<suffix>" }
```

### 4 — Lower-bound editing (interactive, only these two projects)

The lower-bound IDs determine how far back the initial ingest scans. Set too low → timeout. Set too high → miss recent history. Always present recent-from-account choices via `AskUserQuestion` so the user picks against real data, not a guessed number.

**`basic_monitoring`** — edit `initial_ingest.dig`, find the `lower_job_id:` line (~line 62).

Fetch the 4 newest jobs in the account and offer them as `AskUserQuestion` options:

```bash
tdx jobs --json | jq -r '.[0:4] | .[] | "\(.job_id)\t\(.created_at)\t\(.type)"'
```

Build the question with one option per job (label = `<job_id> · <relative_time> · <type>`, e.g. `3126349901 · ~2m ago · bulkload`). The user can also use the **Other** field to paste a specific job ID if none of the four are a good fit (e.g. they want a bound from days ago).

> Phrase the question: "Pick a recent job ID to use as the lower bound for `initial_ingest`. The ingest scans jobs *after* this ID — too recent = nearly empty ingest, too old = timeout. A job from the last day or two is usually right."

**`workflow_monitoring`** — edit `initial_ingest_session_attempt.dig`, find both:
- `lower_limit_session_id:` (default 180059011)
- `lower_limit_attempt_id:` (default 1040926253)

Same pattern — two separate `AskUserQuestion` calls, each offering the 4 newest from the user's account plus an Other field:

```bash
tdx wf sessions --json | jq -r '.[0:4] | .[] | "\(.id)\t\(.created_at)\t\(.workflow.name // .project.name)"'
tdx wf attempts --json | jq -r '.[0:4] | .[] | "\(.id)\t\(.created_at)\t\(.workflow.name // .project.name)"'
```

> Verify the JSON keys with one trial call (`tdx wf sessions --json | jq '.[0]'`) before building the options — if the field is `session_id` instead of `id`, adapt accordingly.

After editing, do NOT push yet — push happens in step 5 with all edits already applied.

### 5 — ⚠️ CONFIRM, then push

Show the user a summary:
- Project name: `<project>_<suffix>`
- Database to write: `<project>_<suffix>`
- Region patch applied (only if non-US)
- Lower bounds set (if applicable)

Use `AskUserQuestion` (Yes/Cancel) to wait for explicit confirmation, then:
```bash
cd <project>_<suffix> && tdx wf push -y
```

Always use `-y` — tdx is non-interactive and will error without it.

### 6 — ⚠️ API key (set as project secret via Console)

The workflow runs server-side and makes its own API calls. It needs an admin Master API Key set as a project secret named `td.apikey`.

**Never accept the API key in chat.** Treasure AI Studio runs in a shared chat surface — pasting a Master API Key into chat is a credential leak. Always direct the user to set it via the Console UI.

After step 5 push succeeds, parse the Console URL **directly from the `tdx wf push -y` output** — it contains the correct internal ID for the deep-link. The push output includes a line like:

```
Console: https://console.us01.treasuredata.com/app/workflows/47672915/info
```

Extract that full URL as-is. **Do not** run `tdx wf projects` or use the `Project ID` value from the push output — that numeric project ID is different from the ID in the Console URL and will produce a broken link.

Then build two clickable links — **from two different sources, don't conflate them:**

> **1. Copy your Master API Key:** [TD Console → Profile → API Keys](`<console_base>/app/mp/ak`) — copy the **Master API Key** (must belong to a full-access admin — a delegated admin with narrower scope won't have everything this needs).
>
> **2. Open your project and add the secret:** [`<project>_<suffix>`](`<CONSOLE_URL_FROM_PUSH>`) → **Secrets** tab → **Add Secret** → **Name:** `td.apikey`, **Secret Key:** paste the master key you copied.

Link 1 uses `<console_base>` — the region-derived value already cached from the *Region — derive, don't ask* step, same as every other console link in this skill. **Do not** build it from the Console URL you just extracted; `/app/mp/ak` is a fixed, account-level path, not tied to this specific project. Link 2 is the one that uses the just-extracted `<CONSOLE_URL_FROM_PUSH>` directly, as-is — that's the only place in this skill where the project-specific internal ID matters.

If the push output contained no `Console:` line, the push may not have landed — re-run step 5 before continuing.

After presenting the links, use `AskUserQuestion` (single option: **"Done — secret added"**, plus an Other field for issues) to wait for explicit user confirmation before moving on. Do not proceed until the user confirms.

Do not call `tdx wf secrets set` from this skill, and do not echo or store the key.

> The key must belong to a full-access admin, not just any admin-flagged user — a delegated admin with narrower scope will fail the policy ingest with 403 and may fail other steps.

### 7 — ⚠️ CONFIRM, then run initial ingests

**For `basic_monitoring` only:** run both `initial_ingest` and `initial_ingest_policy`. Policy-Based Permission is enabled by default — only skip `initial_ingest_policy` if it explicitly fails with a permissions error, in which case disable the incremental policy schedule too: `tdx wf schedule disable <id>`.

Use `AskUserQuestion` (Run / Skip) for each initial workflow before triggering it:

```bash
tdx wf run <project>_<suffix>.<initial-workflow-name>
```

After triggering the first workflow, use `AskUserQuestion` to ask:

> "The ingest is running. Would you like to continue deploying the remaining workflows now, or wait for this one to finish first?"

Options: **"Continue deploying the rest"** / **"Wait for this one first"**

If the user chooses to continue, proceed through steps 2–7 for the next project immediately — tracking all session IDs as you go. Collect every session ID across all projects before presenting the tracking summary in step 8.

### 8 — Hand off with timing, don't watch automatically

Neither background polling nor a watch task is reliable here — long-running background processes get killed on context resets regardless of how they're written, so don't attempt either. After all `tdx wf run` calls are done:

1. Parse the session ID from each command's output (look for `Session ID: <id>` or `session_id=<id>`).
2. Construct each console URL: `<console_base>/app/workflows/sessions/<session_id>`.
3. Present a single block with the session, its console link, and how long it typically takes — so the user can decide for themselves when to check back:

> **Deployment in progress:**
>
> - `basic_monitoring_<suffix>.initial_ingest` (~22 min) → [Session 123456789](`<console_base>/app/workflows/sessions/123456789`)
> - `basic_monitoring_<suffix>.initial_ingest_policy` (~18 min) → [Session 123456790](`<console_base>/app/workflows/sessions/123456790`)
> - `cdp_monitoring_<suffix>.initial_ingest` (~35 min) → [Session 123456791](`<console_base>/app/workflows/sessions/123456791`)
> - `workflow_monitoring_<suffix>.initial_ingest_session_attempt` (~36 min) → [Session 123456792](`<console_base>/app/workflows/sessions/123456792`)
> - `insights_monitoring_<suffix>.ingest` (~2–3 min) → [Session 123456793](`<console_base>/app/workflows/sessions/123456793`)

Durations are from a single observed deployment, not a true average across accounts — actual time depends on account size and data volume. Tell the user plainly: these run on their own schedule independent of this chat, there's no reliable way for this skill to notify them automatically, and they should check back after roughly the time above — either via the console links, or by asking in this chat (or a new one) to check status. See "Checking status later" below for that path.

#### Checking status later

When the user asks to check on an ingest — in this conversation or a new one, with or without the session ID handy — look it up rather than guessing:

```bash
# If you have the session ID:
tdx wf sessions --json | jq '.[] | select(.id == <session_id>)'

# If you don't (e.g. a new chat) — match by project/workflow name instead:
tdx wf sessions --json | jq '.[] | select(.project.name == "<project>_<suffix>" and .workflow.name == "<workflow_name>")'
```

**Discover the live field names first — don't assume them.** Run `tdx wf sessions --json | jq '.[0]'` and find whichever fields currently mean "this session's last attempt reached a terminal state" and "it succeeded." As of this writing that's `lastattempt.done` / `lastattempt.success`, but `tdx`'s JSON shape isn't a fixed contract this skill owns — re-check it here rather than assuming.

- **Not done yet**: tell the user it's still running, with the console link, and let them decide whether to wait longer or check again later. Don't offer to watch or poll for them.
- **Done and succeeded**: proceed to step 9's sanity check.
- **Done and failed**: pull that attempt's logs (`tdx wf attempt logs`) and suggest a fix from the Common Errors table.

### 9 — Post-deploy sanity check

After the initial ingest finishes (confirmed by checking status, per above), verify tables were created:
```bash
tdx tables --in <project>_<suffix>
```

Expected counts (rough guide):
- `basic_monitoring` (without policy ingest): ~8 tables
- `basic_monitoring` (with policy ingest): +4 more (users, databases, policies, plus `_history`)
- `cdp_monitoring`: ~10 tables
- `insights_monitoring`: 1 table per data model (varies by account)
- `workflow_monitoring`: ~5 tables

If the count is way off or expected tables are missing, flag it — the ingest may have partially failed even if the session shows success.

---

## Confirmation pattern

Always pause and use `AskUserQuestion` to confirm before:
- Pushing a project (step 5)
- Running any workflow attempt (step 7)

Never auto-proceed past these gates, even if the user said "do everything" earlier.

---

## What this skill does NOT cover

- **Deleting databases.** `tdx db delete` is not supported. Direct user to TD Console → Databases for cleanup.
- **Patching scripts** (e.g., `ingest_activation.py` 422-on-bad-segment issue). Surface the failure, apply the `try/except` fix to the affected script in the working directory, re-push, and retry.
- **Querying or analyzing ingested data.** Separate skill.

---

## Common errors

| Error | Cause | Fix |
|---|---|---|
| `Confirmation required but running in non-interactive mode` | Missing `-y` flag | Use `tdx wf push -y` |
| `No tdx.json found` | Step 3 was skipped | Create `tdx.json` and retry |
| `Invalid format: td.apikey` | Wrong secrets syntax | Pass `"td.apikey=<key>"` as a single quoted argument |
| `WORKFLOW_PROJECT_NOT_FOUND` | Pushing secrets/running before push completed | Run `tdx wf push -y` first |
| Initial ingest times out | `lower_job_id` / `lower_limit_*` set too low | Raise to a recent ID, edit the .dig, re-push, retry |
| `403 Forbidden` on any step | API key lacks admin permissions | User needs an admin master key |
| `422 Unprocessable Content` on CDP activation/journey ingest | Script bails on first 422 instead of skipping | Wrap the per-item loop in `try/except requests.exceptions.HTTPError`, re-push, retry. |
| `500 Internal Server Error` on `connections` or `schedules` task | Transient server error; script doesn't paginate | Comment out that task in the `.dig`, re-push, retry. Surface but don't auto-fix. |
| `Table 'td.<db>.users' does not exist` on a `_policy` task | Account lacks Policy-Based Permission | Stop running policy workflows. Disable the schedule: `tdx wf schedule disable <id>`. |
