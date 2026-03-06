---
name: engage
description: Manage Treasure Engage email templates and campaigns using `tdx engage` commands with YAML+HTML configs. Use when creating, editing, previewing, validating, or deploying email templates, email/push campaigns, managing workspaces, or any task involving Engage email content — even if the user only mentions "create an email" or "build an HTML email". Always write YAML definition files alongside HTML — never push raw HTML without a YAML wrapper.
---

# tdx Engage

## First: What Are You Building?

| User says... | Write this | Reference to read first |
|---|---|---|
| "create an email template", "build an email" | `type: template` YAML + HTML | `references/template-yaml.md` |
| "create a campaign", "set up an email send" | `type: campaign` YAML + HTML | `references/campaign-yaml.md` |

Always produce **YAML + HTML together**. The YAML is what `tdx engage template push` or `tdx engage campaign push` consumes — HTML alone can't be pushed. This is the most common mistake: generating beautiful HTML, then realizing there's no YAML to push it with.

## After writing YAML+HTML, execute the full pipeline yourself

Do not stop after writing files and tell the user what to run. Immediately proceed: validate → fix errors → push `--dry-run` → push `--yes`. If workspace is missing from the YAML, add it yourself before validating.

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

# Discovery
tdx engage templates                            # List templates
tdx engage campaigns                            # List campaigns
tdx delivery senders --workspace "Name"          # List email senders
```

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

### 3. Validate and push

Execute these yourself immediately after writing the files — don't ask the user to run them:

```bash
tdx engage template validate path/to/template.yaml
tdx engage template push path/to/template.yaml --dry-run
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

### 2. Ensure template exists

A campaign references a template by name. Check existing templates or create one using the template workflow above:

```bash
tdx engage templates
```

### 3. Write YAML + HTML

Read `references/campaign-yaml.md` first. The schema has non-obvious nesting — common mistakes:
- `html_file` / `template` go inside `email:`, not top level
- `connector.email_sender_id`, not `from_email` / `from_name`
- `utm.source`, not `utm_source`
- `ref:` prefix required on `template`, `audience`, `segment`

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
