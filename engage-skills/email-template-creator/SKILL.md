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
tdx use engage_workspace "Marketing Team"

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

## Common Issues & Solutions

### Template Not Displaying Correctly
- Verify HTML syntax is valid
- Check that CSS uses inline styles
- Ensure template width is appropriate
- Test in different email clients

### Template Creation Fails
```bash
# Check workspace context
tdx use | grep engage_workspace

# Verify workspace access
tdx engage workspace show "Marketing Team"

# Check template name doesn't already exist
tdx engage template list | grep "Template Name"
```

## Related Skills

**Next Steps:**
- **email-campaign-creator** - Create campaigns using these templates
- **email-testing-validator** - Test template rendering and delivery

**Integration:**
- **email-journey-builder** - Use templates in customer journey flows
- **email-campaign-orchestration** - Coordinate templates with campaigns and journeys