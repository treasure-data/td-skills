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

### Important: Never handle secret values programmatically

**Do not** attempt to retrieve, store, or set API keys or credentials via scripts, LLM agents, or automation. Secret values must be entered by the user directly. The agent's role is to tell the user **which secrets are needed** and provide the **exact commands to run** — with placeholder values that the user replaces.

### Required secrets

| Secret key | Format | Required for | Where to find |
|---|---|---|---|
| `td.apikey` | `ACCOUNT_ID/KEY` (e.g., `1234/abcdef01...`) | `td>`, `td_ddl>`, `td_load>`, `td_for_each>`, `td_wait>`, `td_run>`, `http>` with LLM Proxy | TD Console → My Settings → API Keys |
| `slack.webhook` | `https://hooks.slack.com/services/...` | Error/success notifications via `http>` | Slack App → Incoming Webhooks |
| `mail.host`, `mail.port`, `mail.username`, `mail.password` | SMTP credentials | `mail>` operator (local digdag only — **not needed on TD platform**) | Your SMTP provider |
| `langfuse.public`, `langfuse.secret`, `langfuse.host` | Langfuse keys | `py>` with Langfuse | Langfuse dashboard → Settings |

### How to set secrets

After pushing the workflow project, the user sets secrets via CLI. The agent should present the exact commands with `YOUR_...` placeholders:

```bash
# Required: TD Master API Key
# Get your key from: TD Console → My Settings → API Keys
tdx wf secrets set <project-name> "td.apikey=YOUR_MASTER_API_KEY"

# Optional: Slack webhook for error notifications
tdx wf secrets set <project-name> "slack.webhook=YOUR_SLACK_WEBHOOK_URL"

# Optional: Langfuse tracing
tdx wf secrets set <project-name> "langfuse.public=YOUR_PUBLIC_KEY"
tdx wf secrets set <project-name> "langfuse.secret=YOUR_SECRET_KEY"
tdx wf secrets set <project-name> "langfuse.host=YOUR_LANGFUSE_HOST"
```

### About `td.apikey`

- **Must be a Master API Key** in `ACCOUNT_ID/KEY` format. OAuth tokens and write-only keys will **not** work.
- **Where to find it**: TD Console → click your avatar (top-right) → My Settings → API Keys. Copy the Master API Key.
- **OAuth tokens (e.g., from Treasure Studio) cannot be used** as `td.apikey`. The workflow engine authenticates with `TD1` scheme, which only accepts Master API Keys.
- **If `td.apikey` is not set**, `td>` operators fall back to the workflow owner's default key. However, `${secret:td.apikey}` references in `http>` headers (e.g., LLM Proxy calls) will fail.

### Referencing secrets in .dig

```yaml
# In _env for py> tasks
_env:
  TD_API_KEY: ${secret:td.apikey}
  SLACK_WEBHOOK: ${secret:slack.webhook}

# In http> headers (e.g., LLM Proxy)
+call_llm:
  http>: https://llm-proxy.us01.treasuredata.com/v1/messages
  method: POST
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 1024
    messages:
      - role: user
        content: "Hello"
  content_format: json

# Directly in http> URL
+notify:
  http>: ${secret:slack.webhook}
  method: POST
```

### Verifying secrets

```bash
# List registered secret keys (values are never shown)
tdx wf secrets list <project-name>

# Delete a secret
tdx wf secrets delete <project-name> <key> --yes
```

### Important notes

- **Secrets are project-scoped.** Each workflow project needs its own secret configuration.
- **Secret values are never displayed** in logs, CLI output, or the TD Console.
- **`mail>` on TD platform does not require SMTP secrets.** TD provides a built-in SMTP relay. Only set `mail.*` secrets when running digdag locally.

---

## Deployment

### Initial setup

```bash
# 1. Verify manifest.yml exists and is valid
cat manifest.yml

# 2. Push project to TD (or use Studio's Push button)
tdx wf push my_project

# 3. Set secrets (user must run — see Secrets Management above)
tdx wf secrets set my_project "td.apikey=YOUR_MASTER_API_KEY"
tdx wf secrets set my_project "slack.webhook=YOUR_SLACK_WEBHOOK_URL"

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
