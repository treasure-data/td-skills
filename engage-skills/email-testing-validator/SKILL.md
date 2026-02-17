---
name: email-testing-validator
description: Validates email campaigns and templates using verified tdx engage commands before launch. Focuses on configuration validation and pre-launch checks.
---

# Email Testing Validator

## Purpose

Validates email campaigns and templates using **confirmed tdx engage commands only**. Provides pre-launch configuration checks and manual testing guidance to ensure campaigns are ready for launch.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- Email campaigns and templates created

## Campaign Configuration Validation

### 1. Campaign Readiness Check
```bash
# Set workspace context
tdx engage workspace use "Marketing Team"

# Check campaign exists and configuration
tdx engage campaign show "Campaign Name"

# Get full campaign details
tdx engage campaign show "Campaign Name" --full

# Verify campaign status
campaign_status=$(tdx engage campaign show "Campaign Name" | grep -i status)
echo "Campaign Status: $campaign_status"
```

### 2. Template Content Validation
```bash
# Review template configuration
tdx engage template show "Template Name"

# Get complete template details including HTML
tdx engage template show "Template Name" --full

# Check template subject line
template_subject=$(tdx engage template show "Template Name" | grep -i subject)
echo "Subject: $template_subject"
```

### 3. Workspace Context Verification
```bash
# Verify current workspace context
current_workspace=$(tdx context | grep engage_workspace || echo "No engage workspace set")
echo "Current workspace: $current_workspace"

# List available workspaces
tdx engage workspace list

# Show workspace details
tdx engage workspace show "Marketing Team"
```

## Pre-Launch Validation Workflows

### Campaign Validation Checklist
```bash
# Comprehensive campaign validation
validate_campaign() {
  local campaign_name="$1"

  echo "Validating campaign: $campaign_name"

  # 1. Check campaign exists
  if ! tdx engage campaign show "$campaign_name" >/dev/null 2>&1; then
    echo "❌ Campaign not found: $campaign_name"
    return 1
  fi

  echo "✅ Campaign exists and accessible"

  # 2. Get campaign details
  campaign_info=$(tdx engage campaign show "$campaign_name" --full)

  # 3. Check campaign status
  status=$(echo "$campaign_info" | grep -i status || echo "Status not found")
  echo "Campaign Status: $status"

  # 4. Verify template association
  template_info=$(echo "$campaign_info" | grep -i template || echo "No template info")
  echo "Template Info: $template_info"

  # 5. Check segment configuration
  segment_info=$(echo "$campaign_info" | grep -i segment || echo "No segment info")
  echo "Segment Info: $segment_info"

  echo "✅ Campaign validation completed"
}

# Usage: validate_campaign "Newsletter Campaign"
```

### Template Quality Assessment
```bash
# Validate template configuration and content
validate_template() {
  local template_name="$1"

  echo "Validating template: $template_name"

  # Check template exists
  if ! tdx engage template show "$template_name" >/dev/null 2>&1; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  echo "✅ Template exists and accessible"

  # Get template details
  template_info=$(tdx engage template show "$template_name" --full)

  # Extract and validate subject
  subject=$(echo "$template_info" | grep -i subject | head -1)
  echo "Subject Line: $subject"

  # Check for HTML content
  if echo "$template_info" | grep -qi "html"; then
    echo "✅ HTML content detected"
  else
    echo "⚠️  No HTML content detected"
  fi

  # Check for plaintext content
  if echo "$template_info" | grep -qi "plaintext\|text"; then
    echo "✅ Plaintext content detected"
  else
    echo "⚠️  No plaintext content detected"
  fi

  echo "✅ Template validation completed"
}

# Usage: validate_template "Welcome Email"
```

### Bulk Campaign Assessment
```bash
# Validate multiple campaigns in workspace
validate_all_campaigns() {
  local workspace_name="$1"

  echo "Validating all campaigns in: $workspace_name"

  # Set workspace context
  tdx engage workspace use "$workspace_name"

  # Get campaign list
  campaigns=$(tdx engage campaign list --format tsv)

  if [ -z "$campaigns" ]; then
    echo "❌ No campaigns found in workspace"
    return 1
  fi

  # Process each campaign
  echo "$campaigns" | while IFS=$'\t' read -r uuid name status type; do
    if [ -n "$name" ]; then
      echo "Checking: $name (Status: $status, Type: $type)"

      # Quick validation
      if tdx engage campaign show "$name" >/dev/null 2>&1; then
        echo "  ✅ $name - Accessible"
      else
        echo "  ❌ $name - Not accessible"
      fi
    fi
  done

  echo "✅ Bulk campaign validation completed"
}

# Usage: validate_all_campaigns "Marketing Team"
```

## Manual Testing Guidance

### Pre-Launch Testing Steps

**Since automated test sending is not available via CLI, follow this manual testing process:**

1. **Configuration Validation** (Automated)
   ```bash
   validate_campaign "Campaign Name"
   validate_template "Template Name"
   ```

2. **Manual Email Testing** (External Process)
   - Use TD Engage web interface for test sends
   - Send test emails to multiple email providers:
     - Gmail: test.gmail@yourcompany.com
     - Outlook: test.outlook@yourcompany.com
     - Yahoo: test.yahoo@yourcompany.com

3. **Cross-Client Verification Checklist**
   - [ ] Email delivery successful
   - [ ] HTML rendering correct
   - [ ] Images display properly
   - [ ] Links are clickable
   - [ ] Mobile display responsive
   - [ ] Unsubscribe link works

4. **Content Quality Checks**
   - [ ] Subject line under 50 characters
   - [ ] No broken links
   - [ ] Proper branding/styling
   - [ ] Clear call-to-action
   - [ ] Compliance with regulations

### Campaign Readiness Report
```bash
# Generate pre-launch readiness report
generate_readiness_report() {
  local campaign_name="$1"
  local template_name="$2"

  echo "Campaign Readiness Report"
  echo "========================"
  echo "Campaign: $campaign_name"
  echo "Template: $template_name"
  echo "Date: $(date)"
  echo ""

  echo "1. CAMPAIGN VALIDATION:"
  validate_campaign "$campaign_name"

  echo ""
  echo "2. TEMPLATE VALIDATION:"
  validate_template "$template_name"

  echo ""
  echo "3. MANUAL TESTING CHECKLIST:"
  echo "   [ ] Test emails sent via web interface"
  echo "   [ ] Cross-client rendering verified"
  echo "   [ ] Links tested and working"
  echo "   [ ] Mobile display confirmed"
  echo "   [ ] Unsubscribe functionality tested"

  echo ""
  echo "4. NEXT STEPS:"
  echo "   - Complete manual testing checklist"
  echo "   - Launch campaign: tdx engage campaign launch '$campaign_name'"
  echo "   - Monitor delivery in web interface"

  echo ""
  echo "✅ Readiness report completed"
}

# Usage: generate_readiness_report "Newsletter Campaign" "Newsletter Template"
```

## Common Errors & Troubleshooting

### Campaign Validation Errors

| Error | Solution |
|-------|----------|
| "Campaign not found" | Verify campaign name: `tdx engage campaign list` |
| "Workspace context not set" | Run `tdx engage workspace use "Marketing Team"` |
| "Permission denied for campaign access" | Contact workspace admin for campaign view permissions |
| "Campaign configuration incomplete" | Check campaign has required fields: name, template, workspace |
| "Invalid campaign status" | Verify campaign status allows configuration changes |

### Template Validation Errors

| Error | Solution |
|-------|----------|
| "Template not found" | Check template exists: `tdx engage template list` |
| "Template HTML rendering issues" | Validate HTML syntax and inline CSS usage |
| "Missing template subject" | Ensure template has subject line configured |
| "Template content empty" | Verify template has HTML or plaintext content |
| "Template access denied" | Check workspace permissions for template access |

### Workspace & Context Errors

| Error | Solution |
|-------|----------|
| "Workspace not accessible" | Verify workspace access: `tdx engage workspace list` |
| "Invalid workspace context" | Set workspace: `tdx engage workspace use "Name"` |
| "Context not set" | Check current context: `tdx use` |
| "Multiple workspace conflict" | Explicitly specify workspace in commands |

### Manual Testing Issues

| Error | Solution |
|-------|----------|
| "Cannot access web interface" | Use TD Console web interface for test sends |
| "Test email not received" | Check spam folder and email filters |
| "HTML rendering broken" | Validate template HTML structure and CSS |
| "Links not working" | Verify URLs are absolute and accessible |
| "Mobile display issues" | Test responsive design in email clients |

## Validation Best Practices

### Configuration Validation
- Always validate campaigns and templates before launch
- Check workspace context before running validations
- Verify all required fields are populated
- Use full campaign and template details for thorough checks

### Manual Testing Workflow
- Use TD Engage web interface for actual test sends
- Test across multiple email clients (Gmail, Outlook, Yahoo)
- Verify both desktop and mobile rendering
- Check all links and call-to-action buttons
- Confirm unsubscribe functionality works

### Pre-Launch Checklist
- [ ] Campaign configuration validated via CLI
- [ ] Template content reviewed via CLI
- [ ] Test emails sent via web interface
- [ ] Cross-client rendering verified
- [ ] Links and functionality tested
- [ ] Campaign ready for launch

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates to validate
- **email-campaign-creator** - Create campaigns to validate

**Integration:**
- **email-template-manager** - Manage templates used in validation
- **email-journey-builder** - Validate journey email components

**Next Steps:**
- Launch validated campaigns: `tdx engage campaign launch "Campaign Name"`
- Monitor performance via TD Console web interface