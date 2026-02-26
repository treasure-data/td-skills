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

### Step 2: Pull existing campaigns (for template references)

```bash
tdx engage campaign pull "Workspace Name" --yes
```

This creates YAML+HTML files under `campaigns/<workspace-slug>/` and is **required** before push — the `ref:` resolution for templates depends on previously pulled data.

### Step 3: Create template first (for new campaigns)

A template must exist before a campaign can reference it. Either reuse an existing template or create a new one:

```bash
# List existing templates
tdx engage templates

# Create new template with HTML content
tdx engage template create \
  --name "My Template" \
  --subject "Subject line" \
  --html "$(cat my-email.html)" \
  --workspace "Workspace Name" \
  --editor-type grapesjs
```

**Important**: `ref:` resolution depends on **local pull cache**, not the API server. Even if a template exists on the server, `ref:Template Name` will fail unless the template has been pulled locally. After creating a new template:

```bash
tdx engage campaign pull "Workspace Name" --yes   # Refresh local cache
```

Then `ref:` will resolve the new template name to its ID. If pull is not an option, use a previously pulled template (e.g., `ref:Existing_Template`) and override HTML with `html_file`.

### Step 4: Write YAML + HTML files

Create campaign YAML in the pulled campaigns directory. See `references/campaign-yaml.md` for the full schema.

### Step 5: Validate with dry-run

```bash
tdx engage campaign push path/to/campaign.yaml --dry-run
```

### Step 6: Preview in Treasure Studio

Use the `mcp__tdx-studio__preview_engage_campaign` tool to render a 5-tab visual preview (audience, email content, delivery, activation, UTM).

### Step 7: Push

```bash
tdx engage campaign push path/to/campaign.yaml --yes
```

If `ref:` resolution fails after push, ensure you have pulled recently:

```bash
tdx engage campaign pull "Workspace Name" --yes   # Refresh local cache
tdx engage campaign push path/to/campaign.yaml --yes
```

## Common Issues

| Issue | Solution |
|-------|----------|
| `ref:` template not found for new templates | `ref:` resolves from local pull cache. Run `tdx engage campaign pull` after creating a new template to refresh the cache |
| Segment not found | Use `tdx sg list "[1] Segments" -r` to find exact name; try with folder path: `ref:[1] Segments/Behavioral/Segment Name` |
| `sourceEmailTemplateName can't be blank` | tdx bug — use the create-then-update workaround above |
| Cannot find applicable parent segments | `tdx engage workspace show "Name" --full --json` to check `applicableParentSegments` |
| Push succeeds but HTML not showing | Ensure `html_file` field points to an HTML file in the same directory as the YAML |

## Personalization

Use Liquid syntax merge tags in subject lines and HTML:

```
{{profile.first_name}}
{{profile.customer_segment}}
{{profile.lifetime_spend}}
```

Available fields depend on the parent segment's output columns. Check with:

```bash
tdx sg fields    # After setting parent segment context
```

## Related Skills

- **segment** — Manage child segments used as campaign targets
- **parent-segment** — Configure parent segments that provide audience data
- **connector-config** — Configure activation connectors
- **journey** — Orchestrate multi-step customer journeys with activations

## Resources

- [Campaign YAML reference](references/campaign-yaml.md)
