# TD Workflow Project Scaffold

Directory structure, template, secrets setup, and deployment checklist for TD Workflow projects.

---

## Project Directory Structure

```
my_workflow/
  manifest.yml            # Workflow metadata (required)
  workflow.dig            # Main workflow definition
  sub/                    # Sub-workflows (optional, for call>)
    prepare.dig
    process.dig
  queries/                # SQL files referenced by td>
    extract.sql
    transform.sql
    load.sql
  tasks/                  # Python files referenced by py>
    __init__.py
    requirements.txt
  config/                 # td_load> configs (optional)
    import.yml
  templates/              # mail> templates (optional)
    alert.txt
```

### Conventions

- **`manifest.yml` is required** — every workflow must have one
- One `.dig` file per workflow at project root
- SQL files in `queries/` — one file per query, named by purpose
- Python code in `tasks/` with `__init__.py` as entry point
- Sub-workflows in `sub/` — referenced via `call>: sub/name.dig`
- Keep query files small and single-purpose

---

## Workflow Manifest

Every workflow project **must** include a `manifest.yml` at the project root. This metadata is stored locally in `~/.tdx/workflows/` and managed through Treasure Studio's TD Workflow panel.

### manifest.yml Specification

```yaml
name: daily_revenue_etl              # Workflow name = .dig filename (without extension)
project: pricing-watch-revenue-daily  # TD project name (used in tdx wf push)
owner: pricing-watch                  # Creator: agent name or user name
created: "2026-04-03"
purpose: "Aggregate daily revenue data into dim_revenue"
ttl: 90d                              # Review deadline: permanent / 30d / 90d / 180d
schedule: "daily 09:00 Asia/Tokyo"
tables:
  reads:
    - raw_data.events
    - raw_data.users
  writes:
    - analytics.dim_revenue
notify: "#data-alerts"                # Notification channel for failures
tags:
  - etl
  - revenue
  - production
```

### Field Reference

| Field | Required | Description |
|---|---|---|
| `name` | yes | Workflow name, must match `.dig` filename |
| `project` | yes | TD project name for `tdx wf push` |
| `owner` | yes | Agent name or user who created it |
| `created` | yes | Creation date (YYYY-MM-DD) |
| `purpose` | yes | One-line description of what this workflow does |
| `ttl` | yes | Time-to-live before review is required. `permanent` for long-lived workflows, or duration like `30d`, `90d`, `180d` |
| `schedule` | yes | Human-readable schedule summary |
| `tables.reads` | yes | List of `database.table` this workflow reads from |
| `tables.writes` | yes | List of `database.table` this workflow writes to |
| `notify` | no | Slack channel or email for failure notifications |
| `tags` | no | Tags for categorization and search |

### Local Storage

Workflows are stored in `~/.tdx/workflows/` as directories. Each directory contains:
- `manifest.yml` — workflow metadata (validated by Studio)
- `*.dig` — workflow definition file(s)
- `queries/`, `tasks/`, etc. — supporting files
- `.state.json` — deploy/run status (auto-managed by Studio)

Treasure Studio's TD Workflow panel automatically discovers all directories in `~/.tdx/workflows/` and displays them. No separate registration step is needed.

### Creating a Workflow

To create a new workflow, simply create a directory with a valid manifest.yml:

```bash
# Create workflow directory
mkdir -p ~/.tdx/workflows/daily_revenue_etl

# Create manifest.yml
cat > ~/.tdx/workflows/daily_revenue_etl/manifest.yml << 'EOF'
name: daily_revenue_etl
project: pricing-watch-revenue-daily
owner: pricing-watch
created: "2026-04-03"
purpose: "Aggregate daily revenue data into dim_revenue"
ttl: 90d
schedule: "daily 09:00 Asia/Tokyo"
tables:
  reads: [raw_data.events, raw_data.users]
  writes: [analytics.dim_revenue]
notify: "#data-alerts"
tags: [etl, revenue, production]
EOF

# Create workflow definition
# ... create .dig file, queries/, tasks/ etc.
```

The workflow will appear in Studio's TD Workflow panel immediately.

### Discovering Workflows

Agents can discover workflows by scanning the local directory:

```bash
# List all workflows
ls ~/.tdx/workflows/

# Read a specific manifest
cat ~/.tdx/workflows/daily_revenue_etl/manifest.yml

# Find workflows by grep
grep -rl "dim_revenue" ~/.tdx/workflows/*/manifest.yml
```

---

## Workflow Template

### SQL-only ETL

```yaml
# workflow.dig
timezone: Asia/Tokyo

schedule:
  daily>: "09:00:00"

_export:
  td:
    database: my_database
    engine: presto

_error:
  http>: ${secret:slack.webhook}
  method: POST
  content:
    text: ":rotating_light: `my_workflow` failed for ${session_date}"

+extract:
  td>: queries/extract.sql
  create_table: stg_table

+transform:
  td>: queries/transform.sql
  insert_into: result_table
```

### Python + SQL Hybrid

```yaml
# workflow.dig
timezone: Asia/Tokyo

schedule:
  daily>: "09:00:00"

_export:
  td:
    database: my_database
    engine: presto

_error:
  http>: ${secret:slack.webhook}
  method: POST
  content:
    text: ":rotating_light: `my_workflow` failed for ${session_date}"

+fetch:
  py>: tasks.Fetcher.run
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"
  _env:
    TD_API_KEY: ${secret:td.apikey}

+process:
  td>: queries/process.sql
  create_table: result_table

+notify:
  http>: ${secret:slack.webhook}
  method: POST
  content:
    text: ":white_check_mark: `my_workflow` completed for ${session_date}"
```

### Python Task Template

`tasks/__init__.py`:
```python
import digdag
import os


class Fetcher:
    def run(self):
        api_key = os.environ["TD_API_KEY"]
        # ... business logic ...
        digdag.env.store({"status": "ok", "count": 42})
```

`tasks/requirements.txt`:
```
httpx
pytd
```

---

## Secrets Management

### Required secrets

| Secret key | Description | Required for |
|---|---|---|
| `td.apikey` | TD API key | `td>`, `td_ddl>`, `td_load>`, `td_for_each>`, `td_wait>`, `td_run>` |
| `slack.webhook` | Slack Incoming Webhook URL | Error/success notifications via `http>` |
| `mail.host`, `mail.port`, `mail.username`, `mail.password` | SMTP credentials | `mail>` operator |
| `langfuse.public`, `langfuse.secret`, `langfuse.host` | Langfuse tracing keys | `py>` with Langfuse |

### Setting secrets

```bash
# Set secrets for a project
tdx wf secrets set --project my_project td.apikey YOUR_TD_API_KEY
tdx wf secrets set --project my_project slack.webhook https://hooks.slack.com/services/xxx

# For py> with Langfuse
tdx wf secrets set --project my_project langfuse.public YOUR_PUBLIC_KEY
tdx wf secrets set --project my_project langfuse.secret YOUR_SECRET_KEY
tdx wf secrets set --project my_project langfuse.host https://us.cloud.langfuse.com
```

### Referencing secrets in .dig

```yaml
# In _env for py> tasks
_env:
  TD_API_KEY: ${secret:td.apikey}
  SLACK_WEBHOOK: ${secret:slack.webhook}

# Directly in http>
+notify:
  http>: ${secret:slack.webhook}
  method: POST
```

---

## Deployment

### Initial setup

```bash
# 1. Verify manifest.yml exists and is valid
cat manifest.yml

# 2. Push project to TD (or use Studio's Push button)
tdx wf push my_project

# 3. Set secrets
tdx wf secrets set --project my_project td.apikey YOUR_KEY
tdx wf secrets set --project my_project slack.webhook YOUR_WEBHOOK

# 4. Verify
tdx wf list my_project
```

### Update workflow

```bash
# Push updated files (or use Studio's Push button)
tdx wf push my_project

# Verify schedule is active
tdx wf schedules
```

### Manual run

```bash
# Start workflow
tdx wf start my_project my_workflow

# Start with parameters
tdx wf start my_project my_workflow -p target_date=2026-04-01

# Start with custom session time
tdx wf start my_project my_workflow --session "2026-04-01 00:00:00"
```

### Monitoring

```bash
# View recent sessions
tdx wf sessions my_project my_workflow

# View attempt details
tdx wf attempts my_project

# View logs
tdx wf logs <attempt_id>

# View task timeline
tdx wf tasks <attempt_id>
```

---

## Deployment Checklist

Before pushing to production:

- [ ] **`manifest.yml`** exists with all required fields
- [ ] **`manifest.yml` name** matches `.dig` filename
- [ ] **Timezone** is set explicitly (`timezone: Asia/Tokyo`)
- [ ] **Schedule** matches the intended frequency
- [ ] **Database** and **engine** are set in `_export`
- [ ] **`_error` block** is defined with Slack or email notification
- [ ] **`_retry`** is set on fragile tasks (network calls, heavy queries)
- [ ] **Secrets** are registered via `tdx wf secrets set`
- [ ] **SQL files** use `${session_date}` / `${last_session_date}` for time ranges (not hardcoded dates)
- [ ] **Idempotent writes**: DELETE before INSERT, or use `create_table` to overwrite
- [ ] **No `sh>` or `rb>`** operators (not available on TD)
- [ ] **py> tasks** specify `docker.image` and `_env` with secrets
- [ ] **requirements.txt** exists for py> tasks with pinned versions
- [ ] **Workflow directory** exists in `~/.tdx/workflows/` with manifest.yml
- [ ] **Test locally** with `tdx wf start` before enabling schedule

---

## File Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Main workflow | `workflow.dig` or `<name>.dig` | `daily_etl.dig` |
| Sub-workflow | `sub/<name>.dig` | `sub/prepare.dig` |
| SQL query | `queries/<purpose>.sql` | `queries/extract_users.sql` |
| Python module | `tasks/__init__.py` | `tasks/__init__.py` |
| Load config | `config/<source>.yml` | `config/s3_import.yml` |
| Mail template | `templates/<name>.txt` | `templates/alert.txt` |
