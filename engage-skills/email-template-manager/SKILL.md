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