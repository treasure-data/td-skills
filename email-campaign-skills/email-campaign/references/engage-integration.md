# Treasure Engage Integration

## Push Email to Engage

The skill uses a TD Workflow called `engage_email_builder` to create email templates in Treasure Engage.

### Step 1: Search for the workflow

```bash
tdx wf workflows engage_email_builder
```

If the workflow does not exist, inform the user:
> "The `engage_email_builder` workflow hasn't been deployed to this account yet. To set it up, you'll need a Treasure Workflow project that calls the Engage API to create email templates. For now, I can export the HTML so you can paste it into Engage Studio manually."

Then offer to save the final HTML to a named file the user can download.

### Step 2: Run the workflow

```bash
tdx wf run engage_email_builder --param template_name="Campaign Template Name" --param subject_line="Subject line here" --param html_content="$(cat /tmp/email_campaign_preview.html)"
```

Required parameters:
- `template_name` — display name for the template in Engage Studio
- `subject_line` — email subject line (may contain merge tags)
- `html_content` — the full HTML email content

### Step 3: Confirm

After the workflow runs, direct the user to check **Engage Studio → Email Templates** to see the new template.

The Engage Studio URL follows this pattern:
```
https://console-next.{region}.treasuredata.com/app/es/{workspace_id}/em/templates
```

Where `{region}` is the user's TD region (e.g., `us01`, `eu01`, `jp01`) and `{workspace_id}` is their workspace identifier.

### Fallback: Manual export

If the workflow is unavailable or fails, save the email to a permanent location:

```bash
cp /tmp/email_campaign_preview.html ~/email_exports/campaign_name_YYYY-MM-DD.html
```

Then open it for the user:
```
mcp__tdx-studio__preview_document(path="~/email_exports/campaign_name_YYYY-MM-DD.html")
```

Tell the user they can copy the HTML and paste it into Engage Studio's code editor.
