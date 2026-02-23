---
name: email-template-creator
description: Creates email templates for TD Engage campaigns using tdx engage template create command with HTML and plaintext content.
---

# Email Template Creator

## Purpose

Creates email templates in TD Engage workspaces using `tdx engage template create`. Focuses on TD-specific template syntax and CLI operations.

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

## Template Operations

### View & Validate
```bash
# Show template summary
tdx engage template show "Welcome Email"

# Show full template including HTML
tdx engage template show "Welcome Email" --full

# List all templates
tdx engage template list

# Extract HTML to file for inspection
tdx engage template show "Template Name" --full | \
  jq -r '.data.attributes.htmlTemplate' > template.html
```

### Update Templates
```bash
# Update subject
tdx engage template update "Welcome Email" --subject "New Welcome Message"

# Update HTML from file
tdx engage template update "Newsletter Template" --html "$(cat updated.html)"

# Rename template
tdx engage template update "Old Name" --name "New Template Name"
```

### Delete Templates
```bash
# Delete with confirmation
tdx engage template delete "Old Template"

# Delete without prompt
tdx engage template delete "Old Template" --yes
```

## TD-Specific Patterns

### Naming Conventions
```bash
# Use descriptive, categorized names
tdx engage template create --name "Welcome - Day 1" --subject "Welcome!"
tdx engage template create --name "Newsletter - Weekly" --subject "This Week's Updates"
tdx engage template create --name "Promotion - Flash Sale" --subject "Limited Time Offer"
```

### Template Validation Function
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

## Related Skills

**Next Steps:**
- **email-campaign-creator** - Use templates in campaigns
- **email-testing-validator** - Test template rendering

**Journey Integration:**
- **email-journey-builder** - Use templates in email sequences
- **tdx-skills:journey** - Reference templates in journey YAML (`template_id`)
