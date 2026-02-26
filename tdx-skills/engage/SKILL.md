---
name: engage
description: Manage Treasure Engage campaigns (email/push) using `tdx engage` commands with YAML+HTML configs. Covers workspaces, campaigns, templates, pull/push workflow, audience/segment references, UTM tracking, and Treasure Studio preview. Use when creating, editing, or deploying Engage email or push campaigns, managing Engage workspaces, or working with email templates.
---

# tdx Engage - Campaign Management

## Core Commands

```bash
# Workspace
tdx engage workspaces                          # List workspaces
tdx engage workspace show "Name" --full --json  # Show workspace details + applicable parent segments
tdx engage workspace use "Name"                 # Set workspace context

# Campaigns
tdx engage campaigns                           # List campaigns (uses workspace context)
tdx engage campaign show "Name"                # Show campaign details
tdx engage campaign pull "Workspace Name" --yes # Pull all campaigns to YAML+HTML
tdx engage campaign push path/to/campaign.yaml --dry-run  # Validate without pushing
tdx engage campaign push path/to/campaign.yaml --yes      # Push to Engage
tdx engage campaign create --name "Name" --type email --workspace "Name"  # Create empty campaign
tdx engage campaign launch "Name"              # Launch campaign
tdx engage campaign pause "Name"               # Pause campaign

# Templates
tdx engage templates                           # List email templates
tdx engage template create --name "Name" --subject "Subject" --html "$(cat file.html)" --workspace "Name" --editor-type grapesjs
tdx engage template show "Name"                # Show template details
```

## Workspace Discovery

Identify which parent segments a workspace can use:

```bash
tdx engage workspace show "Marketing Team" --full --json
```

Look for `workspaceConfig.applicableParentSegments`:
```json
{
  "applicableParentSegments": [
    { "parentSegmentId": "1027645", "name": "engage_retail" }
  ]
}
```

Then list available segments under that parent segment:
```bash
tdx sg pull "engage_retail" --yes
tdx sg list "[1] Segments" -r    # Recursive tree view
```

## Campaign YAML Structure

See `references/campaign-yaml.md` for complete YAML schema and examples for both email and push campaigns.

## Workflow: Create a New Campaign

### Step 1: Discover workspace and segments

```bash
tdx engage workspace show "Workspace Name" --full --json   # Find applicable parent segments
tdx sg pull "parent_segment_name" --yes                     # Pull segments
tdx sg list "[1] Segments" -r                               # Browse available segments
```

### Step 2: Confirm or create template

**Always run this step** — a template must exist on the server before the campaign can reference it.

```bash
# 1. Check existing templates
tdx engage templates
```

If a suitable template already exists, note its **exact name** for use in the YAML. If not, create one:

```bash
# 2. Create new template with HTML content
tdx engage template create \
  --name "My Template" \
  --subject "Subject line" \
  --html "$(cat my-email.html)" \
  --workspace "Workspace Name" \
  --editor-type grapesjs
```

### Step 3: Write YAML + HTML files

Create campaign YAML. See `references/campaign-yaml.md` for the full schema.

- **`email.template`**: Use `ref:` + the **exact template name** from Step 2 (e.g., `ref:My Template`). Name must match exactly.
- **`html_file`** is required — for new campaigns, reference the same HTML file you used to create the template.

### Step 4: Validate

```bash
tdx engage campaign validate path/to/campaign.yaml   # Local YAML validation
tdx engage campaign push path/to/campaign.yaml --dry-run  # API validation
```

### Step 5: Preview in Treasure Studio

Use the `mcp__tdx-studio__preview_engage_campaign` tool to render a 5-tab visual preview (audience, email content, delivery, activation, UTM).

### Step 6: Push

```bash
tdx engage campaign push path/to/campaign.yaml --yes
```

If `ref:` resolution fails, verify that the referenced template exists on the server:
```bash
tdx engage templates   # Check available templates
```

## Workflow: Modify an Existing Campaign

### Step 1: Pull campaigns

```bash
tdx engage campaign pull "Workspace Name" --yes
```

This exports each campaign to a YAML file + HTML file (if campaign has HTML override) under `campaigns/<workspace-slug>/`.

### Step 2: Edit YAML and/or HTML

Modify the pulled YAML file. Common edits:
- Change `subject`, `segment`, `description`
- Edit the HTML file referenced by `html_file`
- Update `utm` parameters or `connector` columns

### Step 3: Validate and preview

```bash
tdx engage campaign validate path/to/campaign.yaml
tdx engage campaign push path/to/campaign.yaml --dry-run
```

Use `mcp__tdx-studio__preview_engage_campaign` for visual preview.

### Step 4: Push changes

```bash
tdx engage campaign push path/to/campaign.yaml --yes
```

The push command matches campaigns by name — if a campaign with the same name exists, it updates; otherwise it creates.

## Common Issues

| Issue | Solution |
|-------|----------|
| `ref:` prefix missing | `template`, `audience`, and `segment` fields **must** use `ref:Name` format. Raw IDs or plain names will be rejected by the validator |
| `ref:` template not found | Template does not exist on the server. Run `tdx engage templates` to check available templates, then create with `tdx engage template create` if needed |
| Segment not found | Use `tdx sg list "[1] Segments" -r` to find exact name; try with folder path: `ref:[1] Segments/Behavioral/Segment Name` |
| `sourceEmailTemplateName can't be blank` | tdx bug — use the create-then-update workaround above |
| Cannot find applicable parent segments | `tdx engage workspace show "Name" --full --json` to check `applicableParentSegments` |

## Personalization

Use Liquid merge tags in subject lines and HTML. All tags must start with `profile.` and the attribute name must exist in the parent segment's output columns.

```bash
tdx sg fields    # Check available attributes (after setting parent segment context)
```

```
{{profile.first_name}}
{{profile.customer_segment}}
{{profile.lifetime_spend}}
```

Liquid conditionals are supported:

```html
{% if profile.customer_segment == 'Gold' %}
  <p>Exclusive Gold member offer!</p>
{% endif %}
```

## Related Skills

- **segment** — Manage child segments used as campaign targets
- **parent-segment** — Configure parent segments that provide audience data
- **connector-config** — Configure activation connectors
- **journey** — Orchestrate multi-step customer journeys with activations

## Resources

- [Campaign YAML reference](references/campaign-yaml.md)
