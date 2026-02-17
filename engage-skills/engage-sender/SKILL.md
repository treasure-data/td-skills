---
name: engage-sender
description: Sender profile creation and domain setup for TD Engage using TD Console automatic DNS generation and sender management.
---

# Engage Sender Management

## Purpose

Provides guidance for TD Engage sender profiles and domain configuration using TD Console's **automatic DNS generation** and web interface sender management.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access with sender management permissions
- Access to TD Console web interface (console.treasuredata.com)
- Domain ownership and DNS configuration access

## Domain Configuration (TD Console Only)

### Automatic DNS Setup Process
TD Engage automatically generates all required DNS records. **No manual DNS creation needed.**

**Step 1: Domain Provisioning**
1. Navigate to **Engage > Sending Configurations > Create New**
2. Enter domain name and Write-only API key
3. Click **"Start domain deployment"** (generates DNS records automatically)
4. Click **"Verify DNS records"** (provides complete zone file)

**Step 2: DNS Implementation**
1. Copy the generated zone file from TD Console
2. Provide to IT team for DNS configuration
3. TD automatically generates:
   - **SPF (TXT)** - Authorizes TD to send emails
   - **DKIM (TXT)** - Cryptographic email signing
   - **DMARC (TXT)** - Authentication policy
   - **CNAME (Click Tracking)** - Link tracking
   - **CNAME (Image Hosting)** - CDN delivery
   - **MX (Mail Exchange)** - Bounce processing

**Step 3: Domain Verification**
1. Click **"Verify Domain"** in TD Console
2. TD automatically polls verification for 72 hours
3. Status updates: SUSPENDED → DEPLOYING → ACTIVE

## DNS Verification Tools

### DNS Record Verification
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

# Check DKIM record (selector provided by TD Console)
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

# Usage: check_spf_record "company.com"
# Usage: check_dmarc_record "company.com"
# Usage: check_dkim_record "company.com" "td-selector"
```

## Sender Profile Management (TD Console Only)

### Sender Profile Operations
**Important**: Sender profiles are created and managed **only through TD Console web interface**.

**Create Sender Profile:**
1. Navigate to **Engage > Settings > Senders**
2. Click **"Add Sender"** or **"Create Sender"**
3. Configure sender details:
   - **Name**: "Marketing Team"
   - **Email**: marketing@company.com
   - **Display Name**: "Marketing Team"
   - **Reply-To**: noreply@company.com
4. Save and verify via email confirmation

**Verify Sender Profile:**
1. Check email inbox for verification email
2. Click verification link
3. Confirm sender status shows "Verified" in TD Console

## Workspace Context Management

### Workspace Operations (CLI)
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

## Sender Performance Monitoring

### Email Event Analysis
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

## Domain Health Monitoring

### Blacklist Checking
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

## Complete Setup Validation

### Sender Setup Validation
```bash
# Comprehensive sender validation
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
  tdx context | grep engage_workspace || echo "⚠️  No workspace context set"

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

## Best Practices

### Domain Setup
- **Use TD Console automatic DNS generation** - no manual record creation needed
- Use subdomains for email sending (mail.company.com) to avoid conflicts
- Wait 24-48 hours for DNS propagation before verification
- Test DNS records with multiple DNS servers for verification

### Sender Profile Management
- **Use TD Console web interface** for all sender profile operations
- Create descriptive sender names that recipients recognize
- Configure reply-to addresses that are actively monitored
- Verify sender profiles via email confirmation before campaigns
- Separate transactional and marketing sender profiles

### Monitoring & Maintenance
- Monitor blacklist status regularly using DNS tools
- Track sender performance with TD event data queries
- Check domain verification status in TD Console
- Keep DNS records updated when changing TD regions

## Important Notes

- **No manual DNS record creation needed** - TD automatically generates complete zone files
- **No CLI commands for sender profiles** - use TD Console web interface only
- **Domain verification handled automatically** - TD polls DNS for 72 hours
- **DNS records auto-generated** - copy from TD Console, don't create manually
- **Workspace context required** - set with `tdx use engage_workspace`

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates that reference sender profiles
- **email-campaign-creator** - Configure campaigns with verified sender profiles

**Integration:**
- **email-testing-validator** - Validate campaigns with sender configurations
- **engage-deliverability** - Monitor deliverability with TD's automatic features

**Advanced Features:**
- **engage-workspace-advanced** - Workspace-level sender management
- **email-journey-builder** - Use sender profiles in journey email steps