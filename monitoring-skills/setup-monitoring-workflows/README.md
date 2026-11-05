# Setup Monitoring Workflows

A **Treasure AI Studio** skill that deploys monitoring workflow projects — `basic_monitoring`, `cdp_monitoring`, `insights_monitoring`, `workflow_monitoring` — via the `tdx` CLI, from cloning the project source through the initial data ingest.

**Scope is deployment + post-deploy sanity checking only.** Querying or dashboarding the ingested data is a separate skill — see [`analyze-monitoring-data`](../analyze-monitoring-data/README.md).

## Installing in AI Studio

Published on the `td-skills` marketplace as part of the `monitoring-skills` plugin:

1. Open **Settings → Marketplace** (Web or Desktop).
2. Find **td-skills** (listed as `PRE-INSTALLED`) and expand it.
3. Find **monitoring-skills** and set it to **On**.
4. Start a **new chat** — plugin changes only apply to sessions started after you enable it.

See [Plugin Marketplace](https://docs.treasure.ai/products/ai-studio/skills/marketplace) for the full flow, including what `Default`/`On`/`Off` mean for a pre-installed marketplace's plugins.

Once enabled, it applies automatically whenever a request matches its domain, or you can invoke it explicitly with `/monitoring-skills:setup-monitoring-workflows`.

## What It Does

Each monitoring project is a workflow that, once deployed, calls the platform's own REST API directly (not an existing table) and ingests the result into a database you choose a name for:

| Project | Tables ingested | Source API | Incremental schedule |
|---|---|---|---|
| `basic_monitoring` | `jobs` (incremental); `connections`, `schedules` (daily replace); `users`, `databases`, `policies` + detail/assignment tables (daily replace) | Jobs, Connections, Schedules, Access Control Users/Policies, Database APIs | Daily 00:00 UTC |
| `cdp_monitoring` | `parent_segments`, `entities`, `activations`, `journey_statistics`, `journey_summary`, `journey_activation` (all six re-ingested daily, snapshotting the previous state into `*_history` first) | Audience API | Daily 00:00 UTC |
| `workflow_monitoring` | `sessions`, `attempts` (incremental); `projects`, `schedules`, `workflows`, `revisions` (daily replace) | Digdag/Treasure Workflow API | Daily 00:00 UTC |
| `insights_monitoring` | `datamodels` — one row per Insights data model | Insights Reporting API (`/reporting/datamodels`) | None — re-run manually |

"Incremental" tables only ever add rows for what's new since the last run; "daily replace" tables are fully overwritten each run with the API's current state; `cdp_monitoring` uses a third pattern — every one of its six tables gets its current state snapshotted into `*_history` and then re-ingested daily, so none of it is purely incremental or purely replace. `basic_monitoring`/`workflow_monitoring` keep `*_history` only for their replace-style tables (not for `jobs`/`sessions`/`attempts`, which are event-level); `insights_monitoring` has no history table at all. See `analyze-monitoring-data`'s [schema reference](../analyze-monitoring-data/references/schema.md) for the exact table-by-table breakdown and full column-level detail once you're querying this data, not just deploying it.

This skill clones the project source directly from the `treasure-boxes` GitHub repo (`scenarios/monitoring/<project>/`), templates each project's `common/settings.yaml` with a suffixed database name and the right regional API endpoints, pushes it with `tdx wf push`, walks the user through adding an admin Master API Key as a project secret, and triggers the initial ingest.

## When to Use

Load this skill when you need to:
- Deploy one or more of the four monitoring workflow projects
- Set up a fresh monitoring database for an account
- Re-deploy a monitoring project under a new suffix/database

**Example requests:**
- "Set up monitoring workflows"
- "Deploy basic_monitoring and workflow_monitoring"
- "Install the TD monitoring workflows"

Not for analyzing already-ingested data — once deployed, use `analyze-monitoring-data` instead.

## Prerequisites

- **A Treasure AI Studio chat session connected to a Treasure AI account** — `tdx`/`git` access comes automatically with that connection; the skill runs those commands directly, so it needs a session where tool calls are available, not just chat. (It also derives the region/site from `tdx auth` automatically — it never asks the user for it.)
- **Admin Master API Key** for the account, to be pasted into the TD Console (never into chat) as a project secret during setup — must belong to a full-access admin, not just any admin-flagged user (a delegated admin with narrower scope will fail the policy ingest with 403).
- **Internet access to GitHub** — setup clones `treasure-data/treasure-boxes` via sparse checkout.

## How It Works

1. **Gather inputs**: which project(s) to deploy, and a suffix to append to the database/project name (e.g. username or ticket ID).
2. **Detect region**: reads the active TD endpoint from `tdx auth` and maps it to the right `api_endpoint`/`cdp_api_endpoint`/console base — never asks the user.
3. **Clone + template**: sparse-checks out `scenarios/monitoring/<project>/` from `treasure-boxes`, copies it to a suffixed working directory, and patches `database:` and region-specific endpoints in `settings.yaml` (and, for non-US regions, hardcoded endpoints in any `.py` scripts).
4. **Lower bounds** (`basic_monitoring`, `workflow_monitoring` only): interactively picks a recent job/session/attempt ID as the ingest's starting point, from the account's own recent activity.
5. **Confirm, then push**: `tdx wf push -y`, only after an explicit user confirmation.
6. **API key**: directs the user to add an admin Master API Key as a `td.apikey` project secret via the Console UI — never accepted in chat.
7. **Confirm, then run** the initial ingest workflow(s), then hand off console links and typical durations — there's no reliable way to watch or poll for completion automatically (background processes get killed on context resets), so the user checks back themselves and can ask this skill to check status anytime after.
8. **Sanity check**: verifies the expected tables exist after ingest completes.

## Renaming rule

Only the database name is templated (`database: <project>_<suffix>`). Table names are never renamed — all `.dig` workflow files reference `${td.database}`, so renaming tables would break them.

## Limitations

- **Deployment only** — does not query or dashboard the ingested data (see `analyze-monitoring-data`).
- **Cannot delete databases** — `tdx db delete` isn't supported; direct the user to the TD Console for cleanup.
- Confirmation gates before pushing and before running any workflow attempt are never skipped, even if the user said "do everything" earlier.

## Related Skills

- **analyze-monitoring-data**: Query and dashboard the data once a monitoring project is deployed and ingesting. **Wait for the initial ingest to actually finish first** (check status by asking this skill, or check the console link) — Step 9's sanity check exists because a session can show "running" or even "success" while tables are still incomplete; analyzing too early can produce a dashboard that looks broken (under-reported job counts, a false "stale data" alert) when the account is actually fine. You can move straight into analysis in the same chat once it's done — no new chat is required to switch skills, since both ship in the same plugin. Starting a fresh chat for analysis is a reasonable choice if you'd rather not carry the setup conversation's history/cost forward, but it's discretionary, not a requirement.

## Technical Details

- **Deploy tool**: `tdx` CLI (`tdx wf push`, `tdx wf run`, `tdx wf schedule`)
- **Source**: `treasure-boxes/scenarios/monitoring/<project>/`, cloned via `git clone --filter=blob:none --sparse`
- **Mutated file**: `<project>_<suffix>/common/settings.yaml` only
- **Secret name**: `td.apikey` (admin Master API Key, set via TD Console, never in chat)

See [`SKILL.md`](./SKILL.md) for the full step-by-step instructions, region-mapping table, and the common-errors table.
