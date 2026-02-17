---
name: email-template-manager
description: Basic email template management using tdx engage template commands for listing, updating, and organizing templates.
---

# Email Template Manager

## Purpose

Basic template management using `tdx engage template` commands. Simple template discovery, updates, and cleanup operations.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access

## Template Management Operations

### List and Discover Templates
```bash
# List templates in current workspace
tdx engage template list

# List templates in specific workspace
tdx engage template list --workspace "Marketing Team"

# Filter templates by pattern
tdx engage template list "welcome*"
tdx engage template list "*newsletter*"

# View template details
tdx engage template show "Template Name"
tdx engage template show "Template Name" --full
```

### Update Templates
```bash
# Update template name
tdx engage template update "Old Name" --name "New Name"

# Update template subject
tdx engage template update "Template Name" --subject "New Subject Line"

# Update template HTML
tdx engage template update "Template Name" --html "$(cat updated-template.html)"

# Update template plaintext
tdx engage template update "Template Name" --plaintext "Updated plaintext version"
```

### Template Cleanup
```bash
# Delete unused templates
tdx engage template delete "Old Template"

# Delete with confirmation skip
tdx engage template delete "Old Template" --yes

# Delete by workspace
tdx engage template delete "Template Name" --workspace "Old Workspace"
```

### Basic Organization
```bash
# Check template naming patterns
echo "Current templates:"
tdx engage template list --format table

# Look for specific template types
tdx engage template list | grep -i "welcome"
tdx engage template list | grep -i "newsletter"
```

## Simple Workflows

### Template Inventory
```bash
# Get basic template count
template_count=$(tdx engage template list --format tsv | wc -l)
echo "Total templates: $template_count"

# List by workspace
for workspace in "Marketing" "Sales" "Support"; do
  echo "Templates in $workspace:"
  tdx engage template list --workspace "$workspace" 2>/dev/null || echo "  No access or no templates"
done
```

### Template Maintenance
```bash
# Basic template check
check_template() {
  local template_name="$1"
  if tdx engage template show "$template_name" >/dev/null 2>&1; then
    echo "✅ $template_name exists"
  else
    echo "❌ $template_name not found"
  fi
}

# Usage: check_template "Welcome Email"
```

## Common Errors & Troubleshooting

### Template Access Errors

| Error | Solution |
|-------|----------|
| "Template not found" | Verify template name: `tdx engage template list` |
| "Workspace context not set" | Run `tdx engage workspace use "Marketing Team"` |
| "Permission denied" | Contact workspace admin for template management permissions |
| "Template access restricted" | Verify user has access to template's workspace |
| "Workspace not found" | Check available workspaces: `tdx engage workspace list` |

### Template Update Errors

| Error | Solution |
|-------|----------|
| "Template name already exists" | Use unique name or choose different naming pattern |
| "Template in use by active campaign" | Pause campaigns using template before making major changes |
| "Invalid HTML syntax" | Validate HTML content before updating |
| "File not found for template content" | Verify file path exists: `ls -la template-file.html` |
| "Template update permission denied" | Check user has edit permissions for workspace |
| "Subject line too long" | Keep subject under 50 characters |

### Template Deletion Errors

| Error | Solution |
|-------|----------|
| "Cannot delete template" | Check if template is used in active campaigns |
| "Template deletion permission denied" | Contact workspace admin for deletion permissions |
| "Template not found for deletion" | Verify template exists: `tdx engage template show "Name"` |
| "Workspace mismatch" | Ensure template exists in specified workspace |

### Template Listing & Discovery Errors

| Error | Solution |
|-------|----------|
| "No templates found" | Check workspace context and permissions |
| "Template list empty" | Verify workspace has templates created |
| "Search pattern no results" | Try broader search patterns or check spelling |
| "Workspace filter invalid" | Verify workspace name: `tdx engage workspace list` |

## Advanced Template Management

### Bulk Template Operations
```bash
# Bulk template validation
validate_all_templates() {
  local workspace_name="$1"

  echo "Validating all templates in: $workspace_name"

  # Set workspace context
  tdx engage workspace use "$workspace_name"

  # Get template list
  templates=$(tdx engage template list --format tsv 2>/dev/null)

  if [ -z "$templates" ]; then
    echo "❌ No templates found or no access to workspace"
    return 1
  fi

  # Validate each template
  echo "$templates" | while IFS=$'\t' read -r uuid name; do
    if [ -n "$name" ]; then
      echo "Checking: $name"

      # Check template accessibility
      if tdx engage template show "$name" >/dev/null 2>&1; then
        echo "  ✅ $name - Accessible"

        # Check for basic content
        template_info=$(tdx engage template show "$name" --full)
        subject=$(echo "$template_info" | jq -r '.data.attributes.subjectTemplate' 2>/dev/null)

        if [ -n "$subject" ] && [ "$subject" != "null" ]; then
          echo "  ✅ $name - Has subject: $subject"
        else
          echo "  ⚠️  $name - Missing subject line"
        fi
      else
        echo "  ❌ $name - Not accessible"
      fi
    fi
  done

  echo "✅ Template validation completed"
}

# Usage: validate_all_templates "Marketing Team"
```

### Template Usage Analysis
```bash
# Check which campaigns use specific templates
check_template_usage() {
  local template_name="$1"

  echo "Checking usage for template: $template_name"

  # Verify template exists
  if ! tdx engage template show "$template_name" >/dev/null 2>&1; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  # Check campaigns using this template
  echo "Campaigns using this template:"
  campaign_list=$(tdx engage campaign list --format tsv 2>/dev/null)

  if [ -n "$campaign_list" ]; then
    found_usage=false

    echo "$campaign_list" | while IFS=$'\t' read -r uuid campaign_name status; do
      if [ -n "$campaign_name" ]; then
        # Check if campaign uses this template
        campaign_template=$(tdx engage campaign show "$campaign_name" --full 2>/dev/null | jq '.data.relationships.template.data.attributes.name' -r 2>/dev/null)

        if [ "$campaign_template" = "$template_name" ]; then
          echo "  - $campaign_name (Status: $status)"
          found_usage=true
        fi
      fi
    done

    if [ "$found_usage" != "true" ]; then
      echo "  No campaigns currently using this template"
      echo "  ✅ Safe to delete or modify"
    fi
  else
    echo "  No campaigns found or no access"
  fi
}

# Usage: check_template_usage "Newsletter Template"
```

### Template Cleanup & Organization
```bash
# Find and clean up unused templates
cleanup_unused_templates() {
  local workspace_name="$1"
  local confirm_delete="$2"  # "yes" to auto-delete, anything else to list only

  echo "Finding unused templates in: $workspace_name"

  # Set workspace context
  tdx engage workspace use "$workspace_name"

  # Get all templates
  templates=$(tdx engage template list --format tsv 2>/dev/null)

  if [ -z "$templates" ]; then
    echo "❌ No templates found"
    return 1
  fi

  # Get all campaigns and their templates
  campaigns=$(tdx engage campaign list --format tsv 2>/dev/null)
  used_templates=()

  if [ -n "$campaigns" ]; then
    echo "$campaigns" | while IFS=$'\t' read -r uuid campaign_name status; do
      if [ -n "$campaign_name" ]; then
        template_name=$(tdx engage campaign show "$campaign_name" --full 2>/dev/null | jq '.data.relationships.template.data.attributes.name' -r 2>/dev/null)
        if [ -n "$template_name" ] && [ "$template_name" != "null" ]; then
          used_templates+=("$template_name")
        fi
      fi
    done
  fi

  # Find unused templates
  unused_count=0
  echo "Unused templates:"

  echo "$templates" | while IFS=$'\t' read -r uuid template_name; do
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
        ((unused_count++))

        if [ "$confirm_delete" = "yes" ]; then
          echo "    Deleting..."
          tdx engage template delete "$template_name" --yes
        fi
      fi
    fi
  done

  if [ $unused_count -eq 0 ]; then
    echo "  No unused templates found"
  else
    echo "Found $unused_count unused templates"
    if [ "$confirm_delete" != "yes" ]; then
      echo "Run with 'yes' parameter to delete unused templates"
    fi
  fi
}

# Usage: cleanup_unused_templates "Marketing Team"        # List only
# Usage: cleanup_unused_templates "Marketing Team" "yes"  # Delete unused
```

### Template Naming Standardization
```bash
# Standardize template naming across workspace
standardize_template_names() {
  local workspace_name="$1"

  echo "Analyzing template naming in: $workspace_name"

  # Set workspace context
  tdx engage workspace use "$workspace_name"

  # Get templates and analyze naming patterns
  templates=$(tdx engage template list --format tsv 2>/dev/null)

  if [ -z "$templates" ]; then
    echo "❌ No templates found"
    return 1
  fi

  echo "Current template naming patterns:"
  echo "================================"

  # Analyze naming patterns
  echo "$templates" | while IFS=$'\t' read -r uuid template_name; do
    if [ -n "$template_name" ]; then
      # Check naming patterns
      if echo "$template_name" | grep -q " - "; then
        echo "✅ Standard format: $template_name"
      elif echo "$template_name" | grep -q "_"; then
        echo "⚠️  Underscore format: $template_name (consider using ' - ')"
      elif echo "$template_name" | grep -q "\."; then
        echo "⚠️  Dot format: $template_name (consider using ' - ')"
      else
        echo "⚠️  No delimiter: $template_name (consider adding category)"
      fi
    fi
  done

  echo ""
  echo "Recommended naming convention:"
  echo "  Category - Description"
  echo "  Examples:"
  echo "    Welcome - Day 1"
  echo "    Newsletter - Weekly Summary"
  echo "    Promotion - Flash Sale"
}

# Usage: standardize_template_names "Marketing Team"
```

## Best Practices

### Template Naming
- Use descriptive names: "Welcome - Day 1", "Newsletter - Weekly"
- Include purpose: "Promotion - Flash Sale", "Transactional - Order Confirmation"
- Be consistent across workspace

### Template Maintenance
- Regularly review and clean up unused templates
- Update templates when content becomes outdated
- Use clear naming conventions for easy discovery

## Related Skills

- **email-template-creator** - Create new templates
- **email-campaign-creator** - Use templates in campaigns
- **email-testing-validator** - Test templates before use