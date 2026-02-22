---
name: email-template-creator
description: Creates email templates for TD Engage campaigns using tdx engage template create command with HTML and plaintext content.
---

# Email Template Creator

## Purpose

Creates email templates in TD Engage workspaces using the `tdx engage template create` command. Focuses on template content creation and basic template setup.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- HTML content prepared for template

## Requirements Gathering

Before creating templates:

**Template Basics:**
- Template name (descriptive, unique within workspace)
- Email subject line (recommended: ≤50 characters)
- HTML content (can be simple or complex)
- Plaintext version (optional but recommended)

**Workspace Context:**
- Target workspace name
- Template naming conventions for your organization

## Template Creation Workflow

### 1. Set Workspace Context
```bash
# Set workspace for template creation
tdx engage workspace use "Marketing Team"

# Verify workspace access
tdx engage workspace show "Marketing Team"
```

### 2. Basic Template Creation
```bash
# Create simple text template
tdx engage template create --name "Welcome Email" \
  --subject "Welcome to Treasure Data!" \
  --html "<h1>Welcome!</h1><p>Thanks for joining us.</p>"

# Create template with both HTML and plaintext
tdx engage template create --name "Newsletter Template" \
  --subject "Monthly Updates from TD" \
  --html "$(cat newsletter.html)" \
  --plaintext "$(cat newsletter.txt)"

# Create with workspace override
tdx engage template create --name "Sales Email" \
  --subject "Product Demo Available" \
  --html "<h1>Ready for a demo?</h1>" \
  --workspace "Sales Team"
```

### 3. Template with File Content
```bash
# Prepare HTML file first
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

## Template Content Guidelines

### HTML Content Best Practices
```html
<!-- Mobile-responsive template structure -->
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <h1 style="color: #2c3e50;">Your Subject Here</h1>

  <!-- Content -->
  <p>Your message content goes here.</p>

  <!-- Call to Action -->
  <p style="text-align: center;">
    <a href="#" style="background: #007cba; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 4px;">
      Call to Action
    </a>
  </p>

  <!-- Footer with unsubscribe -->
  <p style="font-size: 12px; color: #666; margin-top: 30px;">
    <a href="#">Unsubscribe</a>
  </p>

</body>
</html>
```

### Template Validation
```bash
# View created template
tdx engage template show "Welcome Email"

# List templates to verify creation
tdx engage template list

# Check template details including HTML
tdx engage template show "Welcome Email" --full
```

## Template Management

### Update Existing Templates
```bash
# Update template subject line
tdx engage template update "Welcome Email" --subject "New Welcome Message"

# Update template HTML content
tdx engage template update "Newsletter Template" --html "$(cat updated-newsletter.html)"

# Update template name
tdx engage template update "Old Name" --name "New Template Name"
```

### Template Organization
```bash
# List all templates in workspace
tdx engage template list

# View specific template details
tdx engage template show "Template Name"

# Delete unused templates
tdx engage template delete "Old Template" --yes
```

## Best Practices

### Template Design
- Keep subject lines under 50 characters for mobile display
- Use inline CSS for email client compatibility
- Include both HTML and plaintext versions when possible
- Test templates across different email clients
- Always include unsubscribe links

### Content Guidelines
- Use web-safe fonts (Arial, Helvetica, sans-serif)
- Keep template width under 600px for email clients
- Use table-based layouts for better compatibility
- Include alt text for images
- Test with and without images loaded

### Naming Conventions
```bash
# Use descriptive, categorized names
tdx engage template create --name "Welcome - Day 1" --subject "Welcome!"
tdx engage template create --name "Newsletter - Weekly" --subject "This Week's Updates"
tdx engage template create --name "Promotion - Flash Sale" --subject "Limited Time Offer"
```

## Common Errors & Troubleshooting

### Template Creation Errors

| Error | Solution |
|-------|----------|
| "Workspace context not set" | Run `tdx engage workspace use "Marketing Team"` |
| "Template name already exists" | Use unique template name or update existing template |
| "Invalid HTML content" | Validate HTML syntax and structure |
| "Subject line too long" | Keep subject under 50 characters for mobile compatibility |
| "Permission denied" | Contact workspace administrator for template creation permissions |
| "Workspace not found" | Verify workspace name: `tdx engage workspace list` |
| "File not found" | Check file path exists: `ls -la template-file.html` |
| "HTML content empty" | Ensure HTML file contains valid content |
| "Character encoding issues" | Use UTF-8 encoding: `file -bi template.html` |

### Template Content & Design Errors

| Error | Solution |
|-------|----------|
| "Template not rendering properly" | Use inline CSS styles instead of external stylesheets |
| "Images not loading" | Use absolute URLs or base64-encoded images |
| "Layout broken in email clients" | Use table-based layouts for better compatibility |
| "Text not displaying correctly" | Check character encoding and use web-safe fonts |
| "Mobile display issues" | Set max-width: 600px and use responsive design |
| "Missing unsubscribe link" | Always include unsubscribe functionality |
| "CTA buttons not clickable" | Ensure proper anchor tag formatting with href |

### Template Management Errors

| Error | Solution |
|-------|----------|
| "Template update failed" | Check template exists: `tdx engage template show "Name"` |
| "Cannot delete template" | Verify template not used in active campaigns |
| "Template list empty" | Check workspace context and permissions |
| "Template name change failed" | Ensure new name doesn't conflict with existing templates |
| "HTML file too large" | Optimize images and reduce template size under 100KB |

### HTML Content Validation Errors

| Error | Solution |
|-------|----------|
| "Invalid HTML syntax" | Validate HTML structure and close all tags properly |
| "CSS not applied" | Use inline styles: `style="color: red;"` not external CSS |
| "Broken links" | Use absolute URLs: `https://company.com/page` |
| "Image alt text missing" | Add alt attributes: `<img src="url" alt="description">` |
| "Table rendering issues" | Use proper table structure with tbody, thead elements |
| "Special characters broken" | Use HTML entities: `&amp;` for `&`, `&lt;` for `<` |

### File Input & Content Errors

| Error | Solution |
|-------|----------|
| "File reading permission denied" | Check file permissions: `chmod 644 template.html` |
| "Binary content detected" | Ensure HTML file is text-based, not binary |
| "Line ending issues" | Convert line endings: `dos2unix template.html` |
| "Template variable syntax error" | Use proper Liquid syntax: `{{variable_name}}` |
| "Merge tag not recognized" | Check supported merge tags in TD Engage documentation |

## Advanced Troubleshooting

### Template Validation Workflow
```bash
# Comprehensive template validation
validate_template() {
  local template_name="$1"

  echo "Validating template: $template_name"

  # Check template exists
  if ! tdx engage template show "$template_name" >/dev/null 2>&1; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  # Check template content
  template_info=$(tdx engage template show "$template_name" --full)

  # Validate HTML content exists
  html_content=$(echo "$template_info" | jq -r '.data.attributes.htmlTemplate' 2>/dev/null)
  if [ "$html_content" = "null" ] || [ -z "$html_content" ]; then
    echo "❌ No HTML content found"
    return 1
  fi

  # Check subject line
  subject=$(echo "$template_info" | jq -r '.data.attributes.subjectTemplate' 2>/dev/null)
  subject_length=${#subject}
  if [ $subject_length -gt 50 ]; then
    echo "⚠️  Subject line too long: $subject_length characters (recommended: ≤50)"
  fi

  echo "✅ Template validation completed"
}

# Usage: validate_template "Welcome Email"
```

### HTML Content Debugging
```bash
# Debug HTML content issues
debug_html_template() {
  local template_name="$1"

  echo "Debugging HTML content for: $template_name"

  # Extract HTML content to file for inspection
  tdx engage template show "$template_name" --full | \
    jq -r '.data.attributes.htmlTemplate' > temp_template.html

  # Check HTML syntax
  echo "HTML syntax check:"
  if command -v tidy >/dev/null; then
    tidy -e temp_template.html 2>&1 | head -10
  else
    echo "Install 'tidy' for HTML validation: brew install tidy-html5"
  fi

  # Check for common issues
  echo -e "\nCommon issues check:"
  grep -n "style=" temp_template.html >/dev/null && echo "✅ Inline styles found" || echo "⚠️  No inline styles detected"
  grep -n "http://" temp_template.html && echo "⚠️  HTTP links found (use HTTPS)"
  grep -n "alt=" temp_template.html >/dev/null && echo "✅ Alt tags found" || echo "⚠️  Missing alt tags for images"

  rm -f temp_template.html
}

# Usage: debug_html_template "Newsletter Template"
```

### Workspace Permission Troubleshooting
```bash
# Check template permissions and workspace access
check_template_permissions() {
  local workspace_name="$1"

  echo "Checking template permissions for workspace: $workspace_name"

  # Verify workspace access
  if ! tdx engage workspace show "$workspace_name" >/dev/null 2>&1; then
    echo "❌ Cannot access workspace: $workspace_name"
    echo "Available workspaces:"
    tdx engage workspace list
    return 1
  fi

  # Check current workspace context
  echo "Current workspace context:"
  tdx use | grep engage_workspace || echo "⚠️ No engage workspace context set"

  # Set workspace context for testing
  tdx engage workspace use "$workspace_name"

  # Test template creation permissions
  test_template_name="permission_test_$(date +%s)"
  if tdx engage template create --name "$test_template_name" --subject "Test" --html "<p>Test</p>" >/dev/null 2>&1; then
    echo "✅ Template creation permissions verified"
    # Clean up test template
    tdx engage template delete "$test_template_name" --yes >/dev/null 2>&1
  else
    echo "❌ Template creation permissions denied"
    echo "Contact workspace administrator for template management permissions"
    return 1
  fi
}

# Usage: check_template_permissions "Marketing Team"
```

## Related Skills

**Next Steps:**
- **email-campaign-creator** - Create campaigns using these templates
- **email-testing-validator** - Test template rendering and delivery

**Journey Integration:**
- **email-journey-builder** - Use templates in simple email sequences
- **tdx-skills:journey** - Use templates in advanced multi-channel journeys
  - Templates created here can be referenced in journey activation steps
  - Configure template_id in journey YAML activation config
- **Complete workflow**: email-template-creator → email-campaign-creator → email-journey-builder

**Advanced Configuration:**
- **tdx-skills:connector-config** - Configure advanced email connectors for template delivery