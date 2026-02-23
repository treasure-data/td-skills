---
name: email-template-manager
description: Basic email template management using tdx engage template commands for listing, updating, and organizing templates.
---

# Email Template Manager

## Purpose

Template management using `tdx engage template` commands. Discovery, updates, and cleanup operations.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access

## Template Operations

### List & Discover
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
```

### Update Templates
```bash
# Update name
tdx engage template update "Old Name" --name "New Name"

# Update subject
tdx engage template update "Template Name" --subject "New Subject Line"

# Update HTML from file
tdx engage template update "Template Name" --html "$(cat updated-template.html)"

# Update plaintext
tdx engage template update "Template Name" --plaintext "Updated plaintext version"
```

### Delete Templates
```bash
# Delete with confirmation prompt
tdx engage template delete "Old Template"

# Delete without prompt
tdx engage template delete "Old Template" --yes

# Delete from specific workspace
tdx engage template delete "Template Name" --workspace "Old Workspace"
```

## Template Management Functions

### Template Inventory
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

### Template Usage Check
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
        # Extract template name from campaign
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

## TD-Specific Errors

| Error | TD-Specific Solution |
|-------|---------------------|
| "Template not found" | Verify name: `tdx engage template list` |
| "Workspace context not set" | `tdx engage workspace use "Marketing Team"` |
| "Template name already exists" | Template names must be unique within workspace |
| "Template in use by active campaign" | Cannot delete templates referenced by active campaigns |
| "Subject line too long" | TD recommends ≤50 characters |
| "Workspace mismatch" | Use `--workspace` flag or set context correctly |

## Naming Conventions

```bash
# TD recommended format: "Category - Description"
tdx engage template update "welcome_email_1" --name "Welcome - Day 1"
tdx engage template update "weekly_news" --name "Newsletter - Weekly"
tdx engage template update "promo_flash" --name "Promotion - Flash Sale"

# Check naming patterns
tdx engage template list --format tsv | while IFS=$'\t' read -r uuid name; do
  if echo "$name" | grep -q " - "; then
    echo "✅ $name"
  else
    echo "⚠️  $name (consider 'Category - Description' format)"
  fi
done
```

## Related Skills

- **email-template-creator** - Create new templates
- **email-campaign-creator** - Use templates in campaigns
- **email-testing-validator** - Test templates before use
