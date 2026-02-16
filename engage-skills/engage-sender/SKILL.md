---
name: engage-sender
description: Guidance for managing email sender profiles and domain configuration for TD Engage campaigns using the web interface and DNS tools for deliverability setup.
---

# Engage Sender Management Guide

## Purpose

Provides guidance for managing email sender profiles, domain configuration, and deliverability settings for TD Engage campaigns. Focuses on **web interface procedures** and **DNS configuration** using verified tools.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- Access to TD Console web interface (console.treasuredata.com)
- TD Engage workspace with sender management permissions
- Domain ownership and DNS configuration access

## ⚠️ Important Note

**Sender profile management is primarily done through the TD Console web interface**, not via CLI. This skill provides guidance for web interface operations plus DNS configuration using standard tools.

## Sender Profile Management (Web Interface)

### Access Sender Management
```bash
# Verify workspace access via CLI
tdx engage workspace list
tdx engage workspace show "Marketing Team"

# Then access sender management via web interface:
# 1. Open TD Console: https://console.treasuredata.com
# 2. Navigate to Engage > Settings > Senders
# 3. Select your workspace: "Marketing Team"
```

### Sender Profile Operations (Web Interface Guide)

**Create Sender Profile:**
1. In TD Console, go to **Engage > Settings > Senders**
2. Click **"Add Sender"** or **"Create Sender"**
3. Fill in sender details:
   - **Name**: "Marketing Team"
   - **Email**: marketing@company.com
   - **Display Name**: "Marketing Team"
   - **Reply-To**: noreply@company.com
4. Save and verify via email confirmation

**Update Sender Profile:**
1. Go to **Engage > Settings > Senders**
2. Select existing sender profile
3. Update fields as needed
4. Save changes

**Verify Sender Profile:**
1. Check email inbox for verification email
2. Click verification link
3. Confirm sender status is "Verified" in TD Console

## Domain Configuration & DNS Setup

### DNS Authentication Records

These DNS configurations work with **any DNS provider** and can be verified with standard tools:

### SPF Record Configuration
```bash
# Get TD Engage sending IPs for your region
get_td_spf_include() {
  local region="$1"  # us01, eu01, jp01, ap02

  case $region in
    "us01")
      echo "include:ses-us01.treasuredata.com"
      ;;
    "eu01")
      echo "include:ses-eu01.treasuredata.com"
      ;;
    "jp01")
      echo "include:ses-jp01.treasuredata.com"
      ;;
    "ap02")
      echo "include:ses-ap02.treasuredata.com"
      ;;
    *)
      echo "Unknown region: $region"
      return 1
      ;;
  esac
}

# Generate SPF record for domain
generate_spf_record() {
  local domain="$1"
  local region="$2"

  spf_include=$(get_td_spf_include "$region")
  echo "Add this TXT record to $domain:"
  echo "v=spf1 $spf_include ~all"
}

# Usage: generate_spf_record "company.com" "us01"
```

### Verify DNS Records
```bash
# Check SPF record
check_spf_record() {
  local domain="$1"

  echo "Checking SPF record for: $domain"
  spf_record=$(dig +short txt "$domain" | grep "v=spf1")

  if [ -n "$spf_record" ]; then
    echo "✅ SPF record found: $spf_record"
  else
    echo "❌ No SPF record found"
  fi
}

# Check DMARC record
check_dmarc_record() {
  local domain="$1"

  echo "Checking DMARC record for: $domain"
  dmarc_record=$(dig +short txt "_dmarc.$domain" | grep "v=DMARC1")

  if [ -n "$dmarc_record" ]; then
    echo "✅ DMARC record found: $dmarc_record"
  else
    echo "❌ No DMARC record found"
  fi
}

# Usage: check_spf_record "company.com"
# Usage: check_dmarc_record "company.com"
```

### DKIM Configuration (Web Interface + DNS)

**Step 1: Generate DKIM in TD Console**
1. Go to **Engage > Settings > Domains**
2. Add your domain: company.com
3. Enable DKIM authentication
4. Copy the DKIM DNS records provided

**Step 2: Add DKIM Records to DNS**
```bash
# Verify DKIM records are published (replace selector as provided by TD)
check_dkim_record() {
  local domain="$1"
  local selector="$2"  # Provided by TD Console

  echo "Checking DKIM record for: $selector._domainkey.$domain"
  dkim_record=$(dig +short txt "$selector._domainkey.$domain")

  if [ -n "$dkim_record" ]; then
    echo "✅ DKIM record found: $dkim_record"
  else
    echo "❌ No DKIM record found"
  fi
}

# Usage: check_dkim_record "company.com" "td-selector"
```

### DMARC Policy Setup
```bash
# Generate basic DMARC record
generate_dmarc_record() {
  local domain="$1"
  local report_email="$2"

  echo "Add this TXT record to _dmarc.$domain:"
  echo "v=DMARC1; p=quarantine; rua=mailto:$report_email; pct=100"
}

# Usage: generate_dmarc_record "company.com" "dmarc-reports@company.com"
```

## Domain Verification Workflow

### Complete Domain Setup Process
```bash
# Complete domain authentication setup
setup_domain_authentication() {
  local domain="$1"
  local region="$2"
  local dmarc_email="$3"

  echo "Domain Authentication Setup for: $domain"
  echo "======================================="

  echo "1. SPF Record Setup:"
  generate_spf_record "$domain" "$region"

  echo -e "\n2. DMARC Record Setup:"
  generate_dmarc_record "$domain" "$dmarc_email"

  echo -e "\n3. DKIM Setup:"
  echo "   a. Add domain in TD Console: Engage > Settings > Domains"
  echo "   b. Enable DKIM and copy DNS records"
  echo "   c. Add DKIM records to your DNS"
  echo "   d. Verify with: check_dkim_record \"$domain\" \"selector\""

  echo -e "\n4. Verification:"
  echo "   - Wait 24-48 hours for DNS propagation"
  echo "   - Run verification checks:"
  echo "   check_spf_record \"$domain\""
  echo "   check_dmarc_record \"$domain\""
  echo "   check_dkim_record \"$domain\" \"selector\""
}

# Usage: setup_domain_authentication "company.com" "us01" "dmarc-reports@company.com"
```

## Sender Reputation Monitoring

### DNS Blacklist Checking
```bash
# Check domain against major blacklists
check_blacklist_status() {
  local domain="$1"

  echo "Checking blacklist status for: $domain"

  # Major blacklists to check
  blacklists=(
    "zen.spamhaus.org"
    "bl.spamcop.net"
    "dnsbl.sorbs.net"
  )

  # Get domain IP
  domain_ip=$(dig +short "$domain" | head -1)

  if [ -n "$domain_ip" ]; then
    echo "Domain IP: $domain_ip"

    for blacklist in "${blacklists[@]}"; do
      # Reverse IP for blacklist query
      reversed_ip=$(echo "$domain_ip" | awk -F. '{print $4"."$3"."$2"."$1}')
      result=$(dig +short "$reversed_ip.$blacklist" 2>/dev/null)

      if [ -n "$result" ]; then
        echo "⚠️  Listed on $blacklist: $result"
      else
        echo "✅ Clean on $blacklist"
      fi
    done
  else
    echo "❌ Could not resolve domain IP"
  fi
}

# Usage: check_blacklist_status "company.com"
```

## Workspace Context Management

### Sender Context Operations (Verified Commands Only)
```bash
# Set workspace context for sender operations
set_sender_workspace() {
  local workspace_name="$1"

  echo "Setting workspace context for sender management..."

  # Verify workspace exists
  if tdx engage workspace show "$workspace_name" >/dev/null 2>&1; then
    tdx use engage_workspace "$workspace_name"
    echo "✅ Workspace context set: $workspace_name"
    echo "Now use TD Console web interface for sender management"
  else
    echo "❌ Workspace not found: $workspace_name"
    echo "Available workspaces:"
    tdx engage workspace list
    return 1
  fi
}

# Get workspace information
get_workspace_info() {
  local workspace_name="$1"

  echo "Workspace information for: $workspace_name"
  tdx engage workspace show "$workspace_name"
}

# Usage: set_sender_workspace "Marketing Team"
# Usage: get_workspace_info "Marketing Team"
```
## Common Errors & Troubleshooting

### Web Interface Access Errors

| Error | Solution |
|-------|----------|
| "Cannot access TD Console" | Verify login credentials and workspace permissions |
| "Sender management not available" | Contact workspace admin for Engage permissions |
| "Workspace not found in Console" | Check workspace name and access permissions |
| "Sender verification email not received" | Check spam folder, resend verification email |

### DNS Configuration Errors

| Error | Solution |
|-------|----------|
| "DNS record not found" | Verify DNS propagation (wait 24-48 hours) |
| "SPF record syntax error" | Check SPF format: `v=spf1 include:ses-region.treasuredata.com ~all` |
| "DMARC record invalid" | Verify DMARC format: `v=DMARC1; p=quarantine; rua=mailto:email` |
| "DKIM record missing" | Add DKIM records provided by TD Console |
| "DNS propagation timeout" | Wait 24-48 hours, check with multiple DNS servers |

### Domain Authentication Issues

| Error | Solution |
|-------|----------|
| "Domain verification failed" | Check all required DNS records are published |
| "SPF alignment failed" | Ensure SPF includes correct TD region servers |
| "DKIM signature invalid" | Verify DKIM records match TD Console values exactly |
| "DMARC policy failure" | Check SPF and DKIM alignment settings |

### Workspace Context Errors

| Error | Solution |
|-------|----------|
| "Workspace context not set" | Run `tdx use engage_workspace "Marketing Team"` |
| "Workspace not accessible via CLI" | Verify workspace exists: `tdx engage workspace list` |
| "Permission denied for workspace" | Contact admin for workspace access permissions |

## Email Reputation & Monitoring

### SQL-Based Sender Analysis (Verified)
```sql
-- Query email events by sender (using verified data tables)
SELECT
  from_email,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT email) as unique_recipients
FROM delivery_email_treasuredata_com.events
WHERE
  td_interval(time, '-7d')
  AND from_email = 'marketing@company.com'
GROUP BY from_email, event_type
ORDER BY event_count DESC
```

### Reputation Monitoring Script
```bash
# Monitor sender performance using verified tools
monitor_sender_performance() {
  local sender_email="$1"
  local days="$2"

  echo "Sender Performance Analysis: $sender_email"
  echo "Period: Last $days days"
  echo "================================"

  # Use tdx query for email event analysis
  tdx query <<EOF
SELECT
  from_email,
  event_type,
  COUNT(*) as events,
  COUNT(DISTINCT email) as unique_recipients,
  DATE(time) as date
FROM delivery_email_treasuredata_com.events
WHERE
  td_interval(time, '-${days}d')
  AND from_email = '$sender_email'
GROUP BY from_email, event_type, DATE(time)
ORDER BY date DESC, event_type
EOF

  echo "Check TD Console for additional reputation metrics"
}

# Usage: monitor_sender_performance "marketing@company.com" "30"
```

## Best Practices

### Sender Profile Management
- **Use TD Console web interface** for all sender profile operations
- Create descriptive sender names that recipients recognize
- Configure reply-to addresses that are actively monitored
- Verify sender profiles via email confirmation before campaigns
- Separate transactional and marketing sender profiles

### DNS Authentication Setup
- **Complete SPF, DKIM, and DMARC** authentication for all domains
- Use region-specific SPF includes (ses-us01.treasuredata.com for US)
- Wait 24-48 hours for DNS propagation before testing
- Test DNS records with multiple DNS servers for verification
- Keep DNS records updated when changing TD regions

### Domain Management
- Add domains via **TD Console: Engage > Settings > Domains**
- Enable DKIM and follow DNS setup instructions exactly
- Use subdomains for different email types (marketing.company.com)
- Monitor blacklist status regularly with DNS tools
- Implement DMARC policies gradually (start with p=none)

## Validation & Health Checks

### Complete Sender Setup Validation
```bash
# Comprehensive sender validation using verified tools
validate_complete_sender_setup() {
  local domain="$1"
  local sender_email="$2"

  echo "Complete Sender Setup Validation"
  echo "Domain: $domain"
  echo "Sender: $sender_email"
  echo "================================"

  # 1. DNS Authentication Check
  echo "1. DNS Authentication:"
  check_spf_record "$domain"
  check_dmarc_record "$domain"
  echo "   DKIM: Check TD Console for verification status"

  # 2. Blacklist Status
  echo -e "\n2. Reputation Check:"
  check_blacklist_status "$domain"

  # 3. Workspace Context
  echo -e "\n3. Workspace Context:"
  tdx use | grep engage_workspace || echo "⚠️  No workspace context set"

  # 4. Manual verification steps
  echo -e "\n4. Manual Verification Required:"
  echo "   ✓ Check TD Console: Engage > Settings > Senders"
  echo "   ✓ Verify sender email confirmation completed"
  echo "   ✓ Confirm domain shows as 'Verified' in TD Console"
  echo "   ✓ Test sender profile in a campaign"

  echo -e "\n✅ Automated validation completed"
  echo "Complete manual verification steps in TD Console"
}

# Usage: validate_complete_sender_setup "company.com" "marketing@company.com"
```

### Pre-Campaign Sender Checklist
```bash
# Generate pre-campaign sender checklist
sender_pre_campaign_checklist() {
  local campaign_name="$1"

  echo "Sender Pre-Campaign Checklist: $campaign_name"
  echo "=============================================="
  echo ""
  echo "CLI Verification:"
  echo "[ ] Workspace context set: tdx use engage_workspace \"Workspace\""
  echo "[ ] DNS records verified with check_spf_record/check_dmarc_record"
  echo "[ ] Domain not blacklisted (check_blacklist_status)"
  echo ""
  echo "TD Console Verification:"
  echo "[ ] Sender profile created and verified"
  echo "[ ] Domain added and shows 'Verified' status"
  echo "[ ] DKIM enabled and DNS records published"
  echo "[ ] Campaign configured with correct sender"
  echo ""
  echo "Final Testing:"
  echo "[ ] Test campaign delivery via TD Console"
  echo "[ ] Check email rendering and deliverability"
  echo "[ ] Verify unsubscribe functionality"
  echo ""
  echo "Ready for campaign launch: tdx engage campaign launch \"$campaign_name\""
}

# Usage: sender_pre_campaign_checklist "Newsletter Campaign"
```

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates that reference sender profiles
- **email-campaign-creator** - Configure campaigns with verified sender profiles

**Integration:**
- **email-testing-validator** - Validate campaigns with sender configurations
- **engage-deliverability** - Advanced deliverability and reputation monitoring

**Advanced Features:**
- **engage-workspace-advanced** - Workspace-level sender policies and management
- **email-journey-builder** - Use sender profiles in journey email steps

**Data Analysis:**
- **sql-skills:trino** - Query email event data for sender performance analysis