---
name: email-template
description: Complete email template lifecycle for TD Engage - create, manage, validate, and organize templates using tdx engage template commands.
---

# Email Template

## Purpose

Complete email template operations in TD Engage: creation, management, validation, and cleanup using `tdx engage template` commands.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access

## Template Creation

### Set Workspace Context
```bash
# Required before template operations
tdx engage workspace use "Marketing Team"
```

### Basic Creation
```bash
# Inline HTML
tdx engage template create --name "Welcome Email" \
  --subject "Welcome to Treasure Data!" \
  --html "<h1>Welcome!</h1><p>Thanks for joining us.</p>"

# From file with plaintext
tdx engage template create --name "Newsletter Template" \
  --subject "Monthly Updates from TD" \
  --html "$(cat newsletter.html)" \
  --plaintext "$(cat newsletter.txt)"

# Workspace override (skip workspace use)
tdx engage template create --name "Sales Email" \
  --subject "Product Demo Available" \
  --html "<h1>Ready for a demo?</h1>" \
  --workspace "Sales Team"

# Choose editor type: beefree (Visual Editor, default) or grapesjs (HTML Editor)
tdx engage template create --name "Custom HTML Email" \
  --subject "Handcrafted Design" \
  --html "$(cat custom.html)" \
  --editor-type grapesjs
```

### File-Based Template
```bash
# Create HTML file
cat > welcome-template.html << 'EOF'
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>Welcome!</h1>
  <p>Thank you for joining Treasure Data.</p>
  <p><a href="#" style="color: #007cba;">Get Started</a></p>
</body>
</html>
EOF

# Create template from file
tdx engage template create --name "Welcome Series Day 1" \
  --subject "Welcome to Treasure Data" \
  --html "$(cat welcome-template.html)"
```

## Template Management

### Discovery & Listing
```bash
# List templates in current workspace
tdx engage template list

# List in specific workspace
tdx engage template list --workspace "Marketing Team"

# Filter by pattern (glob-style)
tdx engage template list "welcome*"
tdx engage template list "*newsletter*"

# View template details
tdx engage template show "Template Name"
tdx engage template show "Template Name" --full

# Output formats
tdx engage template list --format table
tdx engage template list --format tsv
tdx engage template list --format json

# Extract HTML to file for inspection
tdx engage template show "Template Name" --full | \
  jq -r '.data.attributes.htmlTemplate' > template.html
```

### Update Templates
```bash
# Update name
tdx engage template update "Old Name" --name "New Name"

# Update subject
tdx engage template update "Template Name" --subject "New Subject Line"

# Update HTML from file
tdx engage template update "Template Name" --html "$(cat updated.html)"

# Update plaintext
tdx engage template update "Template Name" --plaintext "Updated plaintext version"
```

### Delete Templates
```bash
# Delete with confirmation
tdx engage template delete "Old Template"

# Delete without prompt
tdx engage template delete "Old Template" --yes

# Delete from specific workspace
tdx engage template delete "Template Name" --workspace "Old Workspace"
```

## Advanced Management

### Multi-Workspace Inventory
```bash
# Count templates in workspace
template_count=$(tdx engage template list --format tsv | wc -l)
echo "Total templates: $template_count"

# Multi-workspace inventory
for workspace in "Marketing" "Sales" "Support"; do
  echo "Templates in $workspace:"
  tdx engage template list --workspace "$workspace" 2>/dev/null || echo "  No access"
done
```

### Template Validation
```bash
# Validate template exists and has content
validate_template() {
  local template_name="$1"

  if ! tdx engage template show "$template_name" --full >/dev/null 2>&1; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  # Check HTML content exists
  html=$(tdx engage template show "$template_name" --full | \
    jq -r '.data.attributes.htmlTemplate')

  if [ "$html" = "null" ] || [ -z "$html" ]; then
    echo "❌ No HTML content"
    return 1
  fi

  # Check subject length (TD recommendation: ≤50 chars)
  subject=$(tdx engage template show "$template_name" --full | \
    jq -r '.data.attributes.subjectTemplate')

  if [ ${#subject} -gt 50 ]; then
    echo "⚠️  Subject too long: ${#subject} chars (recommended: ≤50)"
  fi

  echo "✅ Template valid"
}

# Validate all templates in workspace
validate_all_templates() {
  local workspace_name="$1"

  tdx engage workspace use "$workspace_name"
  templates=$(tdx engage template list --format tsv)

  echo "$templates" | while IFS=$'\t' read -r uuid name; do
    if [ -n "$name" ]; then
      if tdx engage template show "$name" --full >/dev/null 2>&1; then
        subject=$(tdx engage template show "$name" --full | \
          jq -r '.data.attributes.subjectTemplate')

        if [ -n "$subject" ] && [ "$subject" != "null" ]; then
          echo "✅ $name - Has subject: $subject"
        else
          echo "⚠️  $name - Missing subject"
        fi
      else
        echo "❌ $name - Not accessible"
      fi
    fi
  done
}
```

### Template Usage Analysis
```bash
# Check which campaigns use a template
check_template_usage() {
  local template_name="$1"

  if ! tdx engage template show "$template_name" >/dev/null 2>&1; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  echo "Campaigns using: $template_name"
  campaigns=$(tdx engage campaign list --format tsv)

  if [ -n "$campaigns" ]; then
    echo "$campaigns" | while IFS=$'\t' read -r uuid campaign_name status; do
      if [ -n "$campaign_name" ]; then
        template=$(tdx engage campaign show "$campaign_name" --full 2>/dev/null | \
          jq -r '.data.relationships.template.data.attributes.name' 2>/dev/null)

        if [ "$template" = "$template_name" ]; then
          echo "  - $campaign_name (Status: $status)"
        fi
      fi
    done
  fi
}
```

### Cleanup Unused Templates
```bash
# Find unused templates (list only or delete)
cleanup_unused_templates() {
  local workspace_name="$1"
  local confirm_delete="$2"  # "yes" to delete

  tdx engage workspace use "$workspace_name"

  # Get all templates
  templates=$(tdx engage template list --format tsv)

  # Get templates used in campaigns
  campaigns=$(tdx engage campaign list --format tsv)
  used_templates=()

  if [ -n "$campaigns" ]; then
    while IFS=$'\t' read -r uuid campaign_name status; do
      if [ -n "$campaign_name" ]; then
        template=$(tdx engage campaign show "$campaign_name" --full 2>/dev/null | \
          jq -r '.data.relationships.template.data.attributes.name' 2>/dev/null)

        if [ -n "$template" ] && [ "$template" != "null" ]; then
          used_templates+=("$template")
        fi
      fi
    done <<< "$campaigns"
  fi

  # Find unused
  echo "Unused templates:"
  while IFS=$'\t' read -r uuid template_name; do
    if [ -n "$template_name" ]; then
      is_used=false

      for used in "${used_templates[@]}"; do
        if [ "$used" = "$template_name" ]; then
          is_used=true
          break
        fi
      done

      if [ "$is_used" = "false" ]; then
        echo "  - $template_name"
        if [ "$confirm_delete" = "yes" ]; then
          tdx engage template delete "$template_name" --yes
          echo "    ✅ Deleted"
        fi
      fi
    fi
  done <<< "$templates"
}

# Usage:
# cleanup_unused_templates "Marketing Team"        # List only
# cleanup_unused_templates "Marketing Team" "yes"  # Delete
```

## TD-Specific Patterns

### Naming Conventions
```bash
# Use "Category - Description" format
tdx engage template create --name "Welcome - Day 1" --subject "Welcome!"

# Check naming patterns
tdx engage template list --format tsv | while IFS=$'\t' read -r uuid name; do
  if echo "$name" | grep -q " - "; then
    echo "✅ $name"
  else
    echo "⚠️  $name (consider 'Category - Description' format)"
  fi
done
```

## TD-Specific Errors

| Error | TD-Specific Solution |
|-------|---------------------|
| "Workspace context not set" | `tdx engage workspace use "Marketing Team"` or use `--workspace` flag |
| "Template name already exists" | Template names must be unique within workspace |
| "Subject line too long" | TD recommends ≤50 characters for mobile display |
| "Workspace not found" | Verify workspace: `tdx engage workspace list` |
| "HTML file too large" | TD limit: keep templates under 100KB |
| "Template variable syntax error" | Use Liquid syntax: `{{variable_name}}` for merge tags |
| "Merge tag not recognized" | Check TD Engage supported merge tags in documentation |
| "Invalid editor type" | Use `beefree` (Visual Editor) or `grapesjs` (HTML Editor) |
| "Template in use by active campaign" | Cannot delete templates referenced by active campaigns |

## Related Skills

**Next Steps:**
- **email-campaign-creator** - Use templates in campaigns
- **email-testing-validator** - Test template rendering

**Journey Integration:**
- **email-journey-builder** - Use templates in email sequences
- **tdx-skills:journey** - Reference templates in journey YAML (`template_id`)