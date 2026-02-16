---
name: email-testing-validator
description: Tests and validates email campaigns and templates using tdx engage test commands before launch.
---

# Email Testing Validator

## Purpose

Tests email campaigns and templates using `tdx engage campaign test` and basic validation checks. Ensures campaigns are ready for launch.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- Email campaigns and templates created
- Test email addresses available

## Basic Testing Workflow

### 1. Campaign Test Send
```bash
# Send test email to verify campaign setup
tdx engage campaign test "Welcome Campaign" --email "test@treasuredata.com"

# Test with multiple recipients
tdx engage campaign test "Newsletter Campaign" --email "test1@example.com"
tdx engage campaign test "Newsletter Campaign" --email "test2@example.com"

# Test campaign in specific workspace
tdx engage campaign test "Campaign Name" --email "test@example.com" --workspace "Marketing"
```

### 2. Pre-Launch Campaign Validation
```bash
# Check campaign configuration
tdx engage campaign show "Campaign Name" --full

# Verify campaign status
tdx engage campaign show "Campaign Name" | grep -i status

# Check segment assignment
tdx engage campaign show "Campaign Name" | grep -i segment
```

### 3. Template Content Review
```bash
# Review template content
tdx engage template show "Template Name" --full

# Check template subject line length
tdx engage template show "Template Name" | grep -i subject

# Verify template HTML structure
tdx engage template show "Template Name" --full | grep -i html
```

## Testing Checklist

### Campaign Readiness Check
```bash
# Essential pre-launch checks
echo "Campaign Testing Checklist:"
echo ""

# 1. Campaign exists and accessible
echo "1. Campaign Configuration:"
tdx engage campaign show "Campaign Name"

# 2. Template exists and looks correct
echo "2. Template Content:"
tdx engage template show "Template Name"

# 3. Workspace context is correct
echo "3. Workspace Context:"
tdx use | grep engage_workspace

# 4. Send test email
echo "4. Test Email Send:"
tdx engage campaign test "Campaign Name" --email "your-test@email.com"
```

### Template Quality Check
```bash
# Quick template validation
check_template() {
  local template_name="$1"
  echo "Checking template: $template_name"

  # Get template info
  template_info=$(tdx engage template show "$template_name")

  # Check if template exists
  if [ $? -eq 0 ]; then
    echo "✅ Template exists and accessible"
  else
    echo "❌ Template not found or inaccessible"
    return 1
  fi

  # Show basic info
  echo "Template ready for use in campaigns"
}

# Usage: check_template "Welcome Email"
```

### Campaign Status Verification
```bash
# Check if campaign is ready for launch
check_campaign() {
  local campaign_name="$1"
  echo "Checking campaign: $campaign_name"

  # Get campaign status
  status=$(tdx engage campaign show "$campaign_name" 2>/dev/null | grep -i status || echo "ERROR")

  if [[ "$status" == *"ERROR"* ]]; then
    echo "❌ Campaign not found"
    return 1
  elif [[ "$status" == *"DRAFT"* ]]; then
    echo "✅ Campaign ready to launch (currently DRAFT)"
  elif [[ "$status" == *"ACTIVE"* ]]; then
    echo "✅ Campaign is ACTIVE and running"
  else
    echo "⚠️  Campaign status: $status"
  fi
}

# Usage: check_campaign "Newsletter Campaign"
```

## Testing Best Practices

### Test Email Setup
- Use multiple test email addresses
- Test with different email providers (Gmail, Outlook, etc.)
- Use internal company email addresses for initial testing
- Test both HTML and plaintext rendering

### Pre-Launch Testing Steps
1. **Template Review**: Verify content, links, and formatting
2. **Campaign Configuration**: Check settings, segments, and sender info
3. **Test Send**: Send to internal test addresses first
4. **Cross-Client Testing**: Test in major email clients
5. **Link Testing**: Verify all links work correctly

### Common Issues & Solutions

```bash
# Test send fails
echo "Troubleshooting test send failures:"

# Check campaign exists
tdx engage campaign list | grep "Campaign Name"

# Verify workspace access
tdx engage workspace show "Workspace Name"

# Check if campaign is in correct status
tdx engage campaign show "Campaign Name" | grep -i status

# Test with different email address
tdx engage campaign test "Campaign Name" --email "different@email.com"
```

## Post-Test Actions

### After Successful Testing
```bash
# If tests pass, campaign is ready for launch
echo "Campaign tested successfully"
echo "Next steps:"
echo "1. Launch campaign: tdx engage campaign launch 'Campaign Name'"
echo "2. Monitor delivery: Check email delivery logs"
echo "3. Track performance: Monitor open rates and clicks"
```

### If Testing Reveals Issues
```bash
# Fix issues before launching
echo "Issues found during testing:"
echo "1. Update template: tdx engage template update"
echo "2. Modify campaign: tdx engage campaign update"
echo "3. Test again: tdx engage campaign test"
echo "4. Only launch when all tests pass"
```

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates to test
- **email-campaign-creator** - Create campaigns to test

**Follow-up:**
- **email-campaign-orchestration** - Launch tested campaigns
- **email-performance-monitor** - Monitor campaign performance after launch