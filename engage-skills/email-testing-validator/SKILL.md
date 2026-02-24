---
name: email-testing-validator
description: Validates email campaigns and templates using verified tdx engage commands before launch. Focuses on configuration validation and pre-launch checks.
---

# Email Testing Validator

## Purpose

Pre-launch validation for campaigns and templates using `tdx engage` commands. CLI configuration checks + manual testing guidance.

**Important**: No CLI test sending available - use TD Engage web interface for test emails.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- Campaigns and templates created

## Campaign Validation

### Basic Checks
```bash
# Set workspace context
tdx engage workspace use "Marketing Team"

# Check campaign configuration
tdx engage campaign show "Campaign Name"
tdx engage campaign show "Campaign Name" --full

# Extract campaign status
tdx engage campaign show "Campaign Name" --full | jq -r '.data.attributes.status'

# Verify template association
tdx engage campaign show "Campaign Name" --full | \
  jq -r '.data.relationships.template.data.id'
```

### Campaign Validation Function
```bash
validate_campaign() {
  local campaign_name="$1"

  if ! tdx engage campaign show "$campaign_name" >/dev/null 2>&1; then
    echo "❌ Campaign not found: $campaign_name"
    return 1
  fi

  campaign_info=$(tdx engage campaign show "$campaign_name" --full)

  # Check status
  status=$(echo "$campaign_info" | jq -r '.data.attributes.status')
  echo "Status: $status"

  # Check template association
  template=$(echo "$campaign_info" | jq -r '.data.relationships.template.data.id' 2>/dev/null)
  if [ "$template" != "null" ] && [ -n "$template" ]; then
    echo "✅ Template linked: $template"
  else
    echo "⚠️  No template linked"
  fi

  echo "✅ Campaign validation completed"
}
```

## Template Validation

### Basic Checks
```bash
# View template configuration
tdx engage template show "Template Name"
tdx engage template show "Template Name" --full

# Extract subject line
tdx engage template show "Template Name" --full | \
  jq -r '.data.attributes.subjectTemplate'

# Extract HTML content
tdx engage template show "Template Name" --full | \
  jq -r '.data.attributes.htmlTemplate' > template.html

# Check subject length (TD recommends ≤50 chars)
subject=$(tdx engage template show "Template Name" --full | \
  jq -r '.data.attributes.subjectTemplate')
echo "Subject length: ${#subject} characters"
```

### Template Validation Function
```bash
validate_template() {
  local template_name="$1"

  if ! tdx engage template show "$template_name" >/dev/null 2>&1; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  template_info=$(tdx engage template show "$template_name" --full)

  # Check subject
  subject=$(echo "$template_info" | jq -r '.data.attributes.subjectTemplate')
  if [ "$subject" != "null" ] && [ -n "$subject" ]; then
    echo "✅ Subject: $subject (${#subject} chars)"
    [ ${#subject} -gt 50 ] && echo "⚠️  Subject exceeds 50 chars (mobile display)"
  else
    echo "❌ Missing subject line"
  fi

  # Check HTML content
  html=$(echo "$template_info" | jq -r '.data.attributes.htmlTemplate')
  if [ "$html" != "null" ] && [ -n "$html" ]; then
    echo "✅ HTML content present"
  else
    echo "⚠️  No HTML content"
  fi

  # Check plaintext
  plaintext=$(echo "$template_info" | jq -r '.data.attributes.plainTextTemplate')
  if [ "$plaintext" != "null" ] && [ -n "$plaintext" ]; then
    echo "✅ Plaintext version present"
  else
    echo "⚠️  No plaintext version"
  fi

  echo "✅ Template validation completed"
}
```

## Bulk Validation

### Validate All Campaigns
```bash
validate_all_campaigns() {
  local workspace_name="$1"

  tdx engage workspace use "$workspace_name"
  campaigns=$(tdx engage campaign list --format tsv)

  echo "$campaigns" | while IFS=$'\t' read -r uuid name status type; do
    if [ -n "$name" ]; then
      if tdx engage campaign show "$name" >/dev/null 2>&1; then
        echo "✅ $name (Status: $status)"
      else
        echo "❌ $name - Not accessible"
      fi
    fi
  done
}
```

## Journey Validation

### Validate Journey YAML
```bash
# Validate journey YAML syntax before deployment
tdx journey validate welcome-series.yml

# Validate all journey files in current directory
for f in *.yml; do
  echo "Validating: $f"
  tdx journey validate "$f" && echo "  ✅ Valid" || echo "  ❌ Invalid"
done
```

### Journey Pre-Deploy Check
```bash
validate_journey_for_launch() {
  local journey_file="$1"

  echo "Journey Validation: $journey_file"

  # 1. YAML syntax
  if ! tdx journey validate "$journey_file"; then
    echo "❌ YAML validation failed"
    return 1
  fi
  echo "✅ YAML syntax valid"

  # 2. Parent segment exists
  parent_segment=$(grep "parent_segment:" "$journey_file" | \
    sed 's/.*: *["'"'"']*\([^"'"'"']*\)["'"'"']*.*/\1/')
  if tdx ps view "$parent_segment" >/dev/null 2>&1; then
    echo "✅ Parent segment exists: $parent_segment"
  else
    echo "❌ Parent segment not found: $parent_segment"
    return 1
  fi

  echo "✅ Journey ready for deployment"
}
```

## Manual Testing Process

### Pre-Launch Testing Steps

1. **CLI Validation** (Automated)
   ```bash
   validate_campaign "Campaign Name"
   validate_template "Template Name"
   ```

2. **Test Email Sending** (Web Interface Required)
   - Navigate to TD Engage web interface > Open campaign > Send test emails

### Readiness Report Function
```bash
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
  echo "3. MANUAL TESTING (Web Interface):"
  echo "   [ ] Test emails sent"
  echo "   [ ] Cross-client verified"
  echo "   [ ] Links tested"
  echo "   [ ] Mobile display confirmed"

  echo ""
  echo "4. LAUNCH COMMAND:"
  echo "   tdx engage campaign launch '$campaign_name'"
}
```

## TD-Specific Errors

| Error | TD-Specific Solution |
|-------|---------------------|
| "Campaign not found" | Verify: `tdx engage campaign list` |
| "Template not found" | Verify: `tdx engage template list` |
| "Workspace context not set" | `tdx engage workspace use "Marketing Team"` |
| "Campaign configuration incomplete" | Check template and segment associations with `--full` |
| "Missing template subject" | Templates require subject line |
| "Template content empty" | Templates must have HTML or plaintext content |
| "Cannot send test email via CLI" | No CLI test command - use TD Engage web interface |

## Pre-Launch Checklist

```bash
# 1. Verify workspace context
tdx use | grep engage_workspace

# 2. Validate campaign
tdx engage campaign show "Campaign Name" --full

# 3. Validate template
tdx engage template show "Template Name" --full

# 4. Check campaign-template link
tdx engage campaign show "Campaign Name" --full | \
  jq '.data.relationships.template'

# 5. Manual test (web interface required)
# Navigate to TD Engage UI and send test emails

# 6. Launch campaign
tdx engage campaign launch "Campaign Name"
```

## Related Skills

**Prerequisites:**
- **email-template** - Create templates to validate
- **email-campaign-creator** - Create campaigns to validate

**Integration:**
- **email-template** - Manage templates
- **email-journey-builder** - Validate journey email components
- **tdx-skills:validate-journey** - Full journey YAML validation
