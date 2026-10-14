---
name: engage
description: Manage Treasure Engage templates and campaigns with `tdx engage` commands. Use for YAML+HTML email/template workflows, workspace management, and listing, creating, inspecting, or launching contact-list ListCampaign resources with `--campaign-type list-campaign`, even if the user only asks to create an email. Always use YAML wrappers for template, regular campaign, and ListCampaign writes; never push raw HTML.
---

# tdx Engage

## First: What Are You Building?

| User says... | Use this | Reference to read first |
|---|---|---|
| "create an email template", "build an email" | `type: template` YAML + HTML | `references/template-yaml.md` |
| "create a campaign", "set up an email send" | `type: campaign` YAML + HTML | `references/campaign-yaml.md` |
| "list contact-list campaigns", "ListCampaign" | `tdx engage campaign list --campaign-type list-campaign` | None — read-only |
| "create a contact-list campaign", "send to a contact list" | `type: list_campaign` YAML + HTML | Follow the ListCampaign workflow below |
| "show or launch a ListCampaign" | `campaign show/launch --campaign-type list-campaign` | ListCampaign workflow below |

For template and campaign writes, always use YAML definitions and companion content files — never push raw HTML. ListCampaign listing and show are read-only. ListCampaign create/update uses YAML; launch is a separate delivery action that requires a safety preview and explicit approval.

## After writing YAML+HTML, continue the workflow

Do not stop after writing regular template or campaign files and tell the user what to run. Proceed with local validation and an API-backed `push --dry-run`; for the established template and regular campaign workflow, apply the draft with `--yes` when authorized. ListCampaigns use the separate workflow below: always review its dry-run before applying, and obtain explicit approval before launch. Never treat a request to create or configure a ListCampaign as approval to send.

## Commands

```bash
# Workspace
tdx engage workspaces
tdx engage workspace show "Name" --full --json  # Shows applicable parent segments
tdx engage workspace use "Name"

# Templates — YAML-based workflow
tdx engage template pull "Workspace" --yes      # Pull to YAML+HTML
tdx engage template validate path/to.yaml       # Local schema check
tdx engage template push path/to.yaml --dry-run # API validation
tdx engage template push path/to.yaml --yes     # Push

# Campaigns — YAML-based workflow
tdx engage campaign pull "Workspace" --yes
tdx engage campaign validate path/to.yaml
tdx engage campaign push path/to.yaml --dry-run
tdx engage campaign push path/to.yaml --yes
tdx engage campaign launch "Name"
tdx engage campaign pause "Name"

# ListCampaigns — workspace-scoped contact-list email campaigns
tdx engage campaign list --campaign-type list-campaign --workspace "Name"
tdx engage campaign show "Name" --campaign-type list-campaign --workspace "Name"
tdx engage campaign validate path/to/list-campaign.yaml --campaign-type list-campaign
tdx engage campaign push path/to/list-campaign.yaml --campaign-type list-campaign --dry-run
tdx engage campaign push path/to/list-campaign.yaml --campaign-type list-campaign  # prompts before draft changes
tdx engage campaign launch "Name" --campaign-type list-campaign --workspace "Name" --dry-run

# Discovery
tdx engage templates                            # List templates
tdx engage campaigns                            # List regular campaigns (default)
tdx delivery senders --workspace "Name"          # List email senders
```

`--campaign-type` defaults to `campaign`; `list-campaign` selects workspace-scoped contact-list campaigns. ListCampaign operations require `--workspace` or a session workspace set with `tdx engage workspace use "Name"`. For ListCampaign, use `--type email`; valid statuses are `DRAFT`, `PLANNED`, `ACTIVE`, `SUSPENDED`, and `FINISHED`. ListCampaign YAML creates or updates drafts only; only DRAFT resources can be updated.

## Workspace Discovery

```bash
tdx engage workspace show "Marketing Team" --full --json
```

The `applicableParentSegments` field tells you which parent segments (and therefore which audience attributes) are available:

```bash
tdx ps desc <parent_segment> -o   # Output columns + non-null rates
```

Non-null rates matter because they determine whether template variables need `default_value` — see the template workflow below.

## Template Workflow

Read `references/template-yaml.md` before writing template YAML.

### 1. Check parent segment attributes

```bash
tdx ps desc <parent_segment> -o
```

This shows output columns and non-null rates. You need this to write correct `variables`.

### 2. Write YAML + HTML

```
my-template.yaml    # type: template
my-template.html    # HTML content
```

Always set `editor_type: grapesjs`. The `beefree` editor uses a proprietary JSON format that can't be generated from HTML — `grapesjs` works directly with the HTML you write.

**Variables:** every `{{profile.<name>}}` in HTML or subject needs a `variables` entry.

- `preview_value`: set to the Liquid tag itself (`"{{profile.first_name}}"`)
- `default_value`: set this when the attribute's non-null rate is below 100% — without it, recipients with null values see blank text
- `{{sender.email}}` is special (comes from workspace sender, not parent segment) and doesn't need a variable entry

### 3. Validate, preview, push

Execute these yourself immediately after writing the files — don't ask the user to run them:

```bash
tdx engage template validate path/to/template.yaml
tdx engage template push path/to/template.yaml --dry-run
```

Use `preview_engage_template` (with `file_path` for local YAML, or template name after push) to visually check the email. Then push:

```bash
tdx engage template push path/to/template.yaml --yes
```

## Campaign Workflow

Read `references/campaign-yaml.md` before writing campaign YAML.

### 1. Discover workspace, segments, and sender

```bash
tdx engage workspace show "Workspace" --full --json
tdx sg pull "parent_segment_name" --yes
tdx sg list "[1] Segments" -r
tdx delivery senders --workspace "Workspace"     # Note sender id
```

### 2. Create template (if needed)

A campaign references a template by name. Check existing templates:

```bash
tdx engage templates
```

If you need a new template rather than reusing an existing one, create it using the **Template Workflow** above (write YAML+HTML → validate → preview → push). The template must exist on the server before the campaign can reference it.

### 3. Write campaign YAML

Read `references/campaign-yaml.md` first. The schema has non-obvious nesting — common mistakes:
- `template`, `subject`, `html_file`, `variables` go inside `email:`, not top level
- `connector.email_sender_id`, not `from_email` / `from_name`
- `utm.source`, not `utm_source`
- `ref:` prefix required on `template`, `audience`, `segment`
- `email.template` must be `ref:` + the exact template name on the server

### 4. Validate, preview, push

Execute these yourself immediately — don't ask the user to run them:

```bash
tdx engage campaign validate path/to/campaign.yaml
tdx engage campaign push path/to/campaign.yaml --dry-run
```

Use `preview_engage_campaign` for visual preview. Then push:

```bash
tdx engage campaign push path/to/campaign.yaml --yes
```

## ListCampaign Workflow

Use this workflow for one-off email delivery to a workspace contact-list table. It is distinct from a regular campaign that targets a segment.

### 1. Confirm the workspace, contact table, template, and sender

- Resolve the workspace from `--workspace` or session context. ListCampaign commands require a workspace.
- Confirm the contact-list database/table and identify the recipient email column. The source mapping must contain `sql_name: email` with `type: string`.
- Confirm the email template exists in the workspace (`tdx engage templates`) and determine the sender ID (`tdx delivery senders --workspace "Workspace"`).

### 2. Write a ListCampaign YAML definition and content files

```yaml
type: list_campaign
name: Monthly Newsletter
contact_list:
  database_name: marketing
  table_name: subscribers
source_columns:
  - key: email
    sql_name: email
    type: string
  - key: first_name
    sql_name: first_name
    type: string
email:
  template: "ref:Newsletter Template"
  subject: "Hello {{ first_name }}"
  html_file: newsletter.html
  plaintext_file: newsletter.txt # optional
  sender_id: sender-uuid
enable_utm_tracking: true # optional
```

`enable_utm_tracking` is optional. `email.template` must use `ref:` and identify an existing template. HTML and optional plaintext content paths are relative to the YAML file. Only email ListCampaigns are currently supported.

### 3. Validate and preview draft changes

Run local validation, then API-backed dry-run. Review which draft will be created or updated before applying:

```bash
tdx engage campaign validate path/to/list-campaign.yaml --campaign-type list-campaign
tdx engage campaign push path/to/list-campaign.yaml --campaign-type list-campaign --dry-run
```

Push matches by exact name in the workspace, creates a missing resource as DRAFT, and updates only an existing DRAFT. The push dry-run resolves the template and reports create/update actions but performs no POST or PATCH.

### 4. Apply draft changes

Only after reviewing the dry-run, push interactively or use `--yes` if the user has explicitly authorized applying the draft changes:

```bash
tdx engage campaign push path/to/list-campaign.yaml --campaign-type list-campaign
```

### 5. Show and launch safely

Show a ListCampaign by name or UUID with `--campaign-type list-campaign`; the workspace is required. Launch can start delivery to the entire contact-list table. Always run the launch dry-run first, explain the workspace, campaign, and contact-list source to the user, and wait for explicit approval before the live command. Never use `--yes` to bypass approval.

```bash
tdx engage campaign show "Monthly Newsletter" --campaign-type list-campaign --workspace "Workspace"
tdx engage campaign launch "Monthly Newsletter" --campaign-type list-campaign --workspace "Workspace" --dry-run
# Only after explicit approval:
tdx engage campaign launch "Monthly Newsletter" --campaign-type list-campaign --workspace "Workspace"
```

The ListCampaign Console UI is not available; do not add or promise a Console link.

## Personalization

Liquid merge tags reference parent segment output columns:

```
{{profile.first_name}}         # Parent segment attribute
{{profile.customer_segment}}
{{sender.email}}               # Special: workspace email sender
```

```html
{% if profile.customer_segment == 'Gold' %}
  <p>Exclusive Gold member offer!</p>
{% endif %}
```

Check available attributes: `tdx ps desc <parent_segment> -o`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| HTML created but can't push | Write a YAML file (`type: template` or `type: campaign`) — push consumes YAML, not raw HTML |
| Blank merge tag in sent email | Attribute has nulls — add `default_value` to the variable |
| `ref:` template not found | Template must exist on server first. `tdx engage templates` to check |
| Segment not found | Try full path: `ref:[1] Segments/Behavioral/Name` |
| `ref:` prefix missing | `template`, `audience`, `segment` fields require `ref:Name` format |

## Related Skills

- **segment** — Child segments used as campaign targets
- **parent-segment** — Parent segments that provide audience attributes
- **connector-config** — Activation connectors
- **journey** — Multi-step customer journeys

## Resources

- [Template YAML reference](references/template-yaml.md)
- [Campaign YAML reference](references/campaign-yaml.md)
