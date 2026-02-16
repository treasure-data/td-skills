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

## Common Errors & Troubleshooting

### Test Send Failures

| Error | Solution |
|-------|----------|
| "Campaign not found" | Verify campaign name: `tdx engage campaign list` |
| "Test email delivery failed" | Check email address format and deliverability |
| "Workspace context not set" | Run `tdx use engage_workspace "Marketing Team"` |
| "Permission denied for test send" | Contact workspace admin for campaign testing permissions |
| "Campaign not in testable state" | Ensure campaign is in DRAFT or PAUSED status |
| "Invalid email address format" | Use valid email format: user@domain.com |
| "Sender profile not configured" | Configure sender profile before testing |
| "Template not associated with campaign" | Verify campaign has template assigned |

### Campaign Validation Errors

| Error | Solution |
|-------|----------|
| "Campaign status is FINISHED" | Cannot test finished campaigns - duplicate or create new |
| "Campaign missing required fields" | Check campaign configuration: subject, template, sender |
| "Parent segment not configured" | Set parent segment for always-on campaigns |
| "No template assigned to campaign" | Assign template: `tdx engage campaign update "Name" --template "Template"` |
| "Sender verification pending" | Complete sender profile verification process |
| "Campaign audience is empty" | Verify segment has recipients or use test segment |

### Template Testing Errors

| Error | Solution |
|-------|----------|
| "Template not found" | Check template exists: `tdx engage template list` |
| "Template HTML rendering issues" | Validate HTML syntax and inline CSS usage |
| "Missing merge tags" | Ensure all {{variables}} have valid data sources |
| "Image loading failures" | Use absolute URLs or verify image accessibility |
| "Link validation failures" | Test all links manually and fix broken URLs |
| "Unsubscribe link missing" | Add required unsubscribe functionality |

### Email Delivery & Rendering Issues

| Error | Solution |
|-------|----------|
| "Test email not received" | Check spam folder, email filters, and delivery logs |
| "Email rendering broken" | Use email client testing tools and fix compatibility |
| "Images not displaying" | Use absolute URLs and check image hosting |
| "Links not clickable" | Verify proper anchor tag formatting |
| "Mobile display issues" | Test responsive design and mobile compatibility |
| "Plain text version missing" | Add plain text alternative for better deliverability |

### Authentication & Deliverability Issues

| Error | Solution |
|-------|----------|
| "SPF authentication failed" | Configure proper SPF records in DNS |
| "DKIM signature invalid" | Verify DKIM setup with domain provider |
| "Domain not verified" | Complete domain verification process |
| "High spam score detected" | Review content and avoid spam trigger words |
| "Bounce rate too high" | Clean email list and verify addresses |
| "Reputation issues" | Monitor sender reputation and engagement metrics |

## Advanced Testing & Validation

### Comprehensive Campaign Testing
```bash
# Complete pre-launch testing workflow
comprehensive_campaign_test() {
  local campaign_name="$1"
  local test_email="$2"

  echo "Starting comprehensive testing for: $campaign_name"

  # 1. Basic campaign validation
  echo "1. Validating campaign configuration..."
  if ! tdx engage campaign show "$campaign_name" >/dev/null 2>&1; then
    echo "❌ Campaign not found: $campaign_name"
    return 1
  fi

  # 2. Check campaign status
  status=$(tdx engage campaign show "$campaign_name" | grep -i status | awk '{print $2}' 2>/dev/null)
  if [[ "$status" != *"DRAFT"* && "$status" != *"PAUSED"* ]]; then
    echo "⚠️  Campaign status: $status (may not be testable)"
  else
    echo "✅ Campaign status acceptable for testing: $status"
  fi

  # 3. Template validation
  echo "2. Validating template..."
  template_name=$(tdx engage campaign show "$campaign_name" --full | grep -i template | awk '{print $2}' 2>/dev/null)
  if [ -n "$template_name" ] && [ "$template_name" != "null" ]; then
    if tdx engage template show "$template_name" >/dev/null 2>&1; then
      echo "✅ Template validated: $template_name"
    else
      echo "❌ Template not found: $template_name"
      return 1
    fi
  else
    echo "❌ No template assigned to campaign"
    return 1
  fi

  # 4. Sender profile validation
  echo "3. Validating sender configuration..."
  sender_info=$(tdx engage campaign show "$campaign_name" --full | grep -i sender 2>/dev/null)
  if [ -n "$sender_info" ]; then
    echo "✅ Sender profile configured"
  else
    echo "⚠️  No sender profile configured"
  fi

  # 5. Send test email
  echo "4. Sending test email..."
  if tdx engage campaign test "$campaign_name" --email "$test_email"; then
    echo "✅ Test email sent successfully to: $test_email"
    echo "Check your inbox and spam folder"
  else
    echo "❌ Test email send failed"
    return 1
  fi

  echo "✅ Comprehensive testing completed"
}

# Usage: comprehensive_campaign_test "Newsletter Campaign" "test@company.com"
```

### Template Content Validation
```bash
# Validate template content and structure
validate_template_content() {
  local template_name="$1"

  echo "Validating template content: $template_name"

  # Get template information
  template_info=$(tdx engage template show "$template_name" --full 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  # Check subject line
  subject=$(echo "$template_info" | jq '.data.attributes.subject' -r 2>/dev/null)
  if [ -n "$subject" ] && [ "$subject" != "null" ]; then
    subject_length=${#subject}
    if [ $subject_length -gt 50 ]; then
      echo "⚠️  Subject line long ($subject_length chars): $subject"
    else
      echo "✅ Subject line OK ($subject_length chars): $subject"
    fi
  else
    echo "❌ No subject line configured"
  fi

  # Check HTML content
  html_content=$(echo "$template_info" | jq '.data.attributes.html_content' -r 2>/dev/null)
  if [ -n "$html_content" ] && [ "$html_content" != "null" ]; then
    # Basic HTML validation checks
    if echo "$html_content" | grep -q "<html\|<HTML"; then
      echo "✅ HTML structure detected"
    else
      echo "⚠️  No HTML structure tags found"
    fi

    if echo "$html_content" | grep -q "style="; then
      echo "✅ Inline CSS detected"
    else
      echo "⚠️  No inline CSS found (may cause rendering issues)"
    fi

    if echo "$html_content" | grep -q "unsubscribe\|UNSUBSCRIBE"; then
      echo "✅ Unsubscribe link detected"
    else
      echo "⚠️  No unsubscribe link found"
    fi
  else
    echo "❌ No HTML content found"
  fi

  echo "✅ Template validation completed"
}

# Usage: validate_template_content "Newsletter Template"
```

### Email Deliverability Pre-Check
```bash
# Check deliverability factors before testing
check_deliverability_factors() {
  local campaign_name="$1"

  echo "Checking deliverability factors for: $campaign_name"

  # Get campaign details
  campaign_info=$(tdx engage campaign show "$campaign_name" --full 2>/dev/null)
  workspace_id=$(echo "$campaign_info" | jq '.data.relationships.workspace.data.id' -r 2>/dev/null)

  # Check sender domain verification
  echo "1. Checking sender authentication..."
  if [ -n "$workspace_id" ]; then
    # Check workspace domains
    domains_status=$(tdx api "/workspaces/$workspace_id/domains" --type engage 2>/dev/null)
    unverified=$(echo "$domains_status" | jq '.data[] | select(.attributes.verification_status != "verified")' 2>/dev/null)

    if [ -z "$unverified" ]; then
      echo "✅ All domains verified"
    else
      echo "⚠️  Unverified domains detected - may impact deliverability"
    fi
  fi

  # Check sender profile status
  echo "2. Checking sender profile..."
  sender_id=$(echo "$campaign_info" | jq '.data.attributes.email_sender_id' -r 2>/dev/null)
  if [ -n "$sender_id" ] && [ "$sender_id" != "null" ]; then
    echo "✅ Sender profile configured"
  else
    echo "⚠️  No sender profile configured"
  fi

  # Basic content spam check
  echo "3. Basic content analysis..."
  template_name=$(echo "$campaign_info" | jq '.data.relationships.template.data.attributes.name' -r 2>/dev/null)
  if [ -n "$template_name" ]; then
    template_content=$(tdx engage template show "$template_name" --full | jq '.data.attributes.html_content' -r 2>/dev/null)

    # Check for common spam triggers
    spam_triggers=("URGENT" "ACT NOW" "LIMITED TIME" "CLICK HERE" "FREE MONEY" "GUARANTEED")
    found_triggers=0

    for trigger in "${spam_triggers[@]}"; do
      if echo "$template_content" | grep -qi "$trigger"; then
        echo "⚠️  Potential spam trigger detected: $trigger"
        ((found_triggers++))
      fi
    done

    if [ $found_triggers -eq 0 ]; then
      echo "✅ No obvious spam triggers detected"
    fi
  fi

  echo "✅ Deliverability pre-check completed"
}

# Usage: check_deliverability_factors "Newsletter Campaign"
```

### Multi-Client Email Testing
```bash
# Test email across multiple test addresses/clients
multi_client_test() {
  local campaign_name="$1"

  # Define test email addresses for different providers
  test_emails=(
    "test.gmail@company.com"
    "test.outlook@company.com"
    "test.yahoo@company.com"
    "test.internal@treasuredata.com"
  )

  echo "Testing campaign across multiple email clients: $campaign_name"

  for email in "${test_emails[@]}"; do
    echo "Sending test to: $email"

    if tdx engage campaign test "$campaign_name" --email "$email"; then
      echo "✅ Test sent to $email"
    else
      echo "❌ Failed to send to $email"
    fi

    # Rate limiting
    sleep 2
  done

  echo ""
  echo "✅ Multi-client testing completed"
  echo "Check all test inboxes and verify:"
  echo "  - Email delivery success"
  echo "  - HTML rendering quality"
  echo "  - Image display"
  echo "  - Link functionality"
  echo "  - Mobile responsiveness"
}

# Usage: multi_client_test "Newsletter Campaign"
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