---
name: engage-sender
description: Sender profile creation and domain setup for TD Engage using TD Console automatic DNS generation and sender management.
---

# Engage Sender Management

## Purpose

TD Engage sender profiles and domain configuration using TD Console's **automatic DNS generation**. No manual DNS record creation needed.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- TD Console access (console.treasuredata.com)
- Domain ownership and DNS configuration access

## Domain Configuration (TD Console Only)

### Automatic DNS Setup

**TD Engage automatically generates all DNS records - no manual creation needed.**

**Step 1: Domain Provisioning**
1. Navigate to: **Engage > Sending Configurations > Create New**
2. Enter domain name and Write-only API key
3. Click **"Start domain deployment"** (auto-generates DNS records)
4. Click **"Verify DNS records"** (provides complete zone file)

**Step 2: DNS Implementation**
1. Copy generated zone file from TD Console
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
2. TD polls verification automatically for 72 hours
3. Status: `SUSPENDED → DEPLOYING → ACTIVE`

## DNS Verification (CLI)

### Check DNS Records
```bash
# Check SPF record
check_spf_record() {
  local domain="$1"
  spf=$(dig +short txt "$domain" | grep "v=spf1")

  if [ -n "$spf" ]; then
    echo "✅ SPF: $spf"
  else
    echo "❌ SPF not found"
  fi
}

# Check DMARC record
check_dmarc_record() {
  local domain="$1"
  dmarc=$(dig +short txt "_dmarc.$domain" | grep "v=DMARC1")

  if [ -n "$dmarc" ]; then
    echo "✅ DMARC: $dmarc"
  else
    echo "❌ DMARC not found"
  fi
}

# Check DKIM record (selector from TD Console)
check_dkim_record() {
  local domain="$1"
  local selector="$2"  # From TD Console
  dkim=$(dig +short txt "$selector._domainkey.$domain")

  if [ -n "$dkim" ]; then
    echo "✅ DKIM: $dkim"
  else
    echo "❌ DKIM not found"
  fi
}

# Usage:
# check_spf_record "company.com"
# check_dmarc_record "company.com"
# check_dkim_record "company.com" "td-selector"
```

## Sender Profile Management (TD Console Only)

**Important**: No CLI sender profile management - use TD Console only.

### Create Sender Profile (Web UI)
1. Navigate to: **Engage > Settings > Senders**
2. Click **"Add Sender"** or **"Create Sender"**
3. Configure:
   - **Name**: "Marketing Team"
   - **Email**: marketing@company.com
   - **Display Name**: "Marketing Team"
   - **Reply-To**: noreply@company.com
4. Save and verify via email confirmation

### Verify Sender Profile (Web UI)
1. Check email inbox for verification email
2. Click verification link
3. Confirm status shows "Verified" in TD Console

## Workspace Context (CLI)

```bash
# Set workspace for sender operations
tdx use engage_workspace "Marketing Team"

# Check current context
tdx use | grep engage_workspace

# Verify workspace exists
tdx engage workspace show "Marketing Team"

# List workspaces
tdx engage workspace list
```

## Sender Performance Monitoring

### Email Event Analysis by Sender
```bash
# Monitor sender performance
# Find database: tdx databases "*delivery_email*"
monitor_sender_performance() {
  local sender_email="$1"
  local days="$2"

  echo "Sender: $sender_email (Last $days days)"

  # Note: "from" is reserved word in Trino - must quote
  tdx query <<EOF
SELECT
  "from",
  event_type,
  COUNT(*) as events,
  COUNT(DISTINCT to_plain_address) as unique_recipients,
  DATE(FROM_UNIXTIME(time)) as date
FROM {delivery_email_database}.events
WHERE
  td_interval(time, '-${days}d')
  AND "from" = '$sender_email'
GROUP BY "from", event_type, DATE(FROM_UNIXTIME(time))
ORDER BY date DESC, event_type
EOF
}

# Usage: monitor_sender_performance "marketing@company.com" "30"
```

## Domain Health Monitoring

### Blacklist Checking
```bash
# Check domain against major blacklists
check_blacklist_status() {
  local domain="$1"

  # Major blacklists
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

## Complete Sender Validation

### Validation Workflow
```bash
validate_sender_setup() {
  local domain="$1"
  local sender_email="$2"

  echo "Sender Setup Validation"
  echo "Domain: $domain"
  echo "Sender: $sender_email"
  echo "======================="

  # DNS Authentication
  echo "1. DNS Records:"
  check_spf_record "$domain"
  check_dmarc_record "$domain"
  echo "   DKIM: Check TD Console for verification status"

  # Blacklist Status
  echo ""
  echo "2. Reputation:"
  check_blacklist_status "$domain"

  # Workspace Context
  echo ""
  echo "3. Workspace:"
  tdx use | grep engage_workspace || echo "⚠️  No workspace context set"

  # Manual Verification
  echo ""
  echo "4. Manual Steps (TD Console):"
  echo "   [ ] Check Engage > Settings > Senders"
  echo "   [ ] Verify sender email confirmation"
  echo "   [ ] Confirm domain status: Verified"
  echo "   [ ] Test sender in campaign"
}

# Usage: validate_sender_setup "company.com" "marketing@company.com"
```

## TD-Specific Errors

| Error | TD-Specific Solution |
|-------|---------------------|
| "Domain verification failed" | Wait 24-48 hours for DNS propagation |
| "SPF record not found" | Copy SPF from TD Console zone file |
| "DKIM verification failed" | Check DKIM selector and CNAME record |
| "Sender profile not verified" | Check email inbox for verification link |
| "No CLI sender management" | Use TD Console web interface only |
| "Workspace context not set" | `tdx use engage_workspace "Marketing Team"` |

## TD-Specific Patterns

### Domain Status Flow
```
SUSPENDED → DEPLOYING → ACTIVE
```

### Subdomain Recommendation
```bash
# Use subdomain for email sending (avoid conflicts)
# Good: mail.company.com
# Avoid: company.com (may conflict with existing email)
```

### DNS Propagation Check
```bash
# Check DNS propagation across multiple servers
dig @8.8.8.8 txt company.com         # Google DNS
dig @1.1.1.1 txt company.com         # Cloudflare DNS
dig @208.67.222.222 txt company.com  # OpenDNS
```

## Important Notes

- **No manual DNS record creation** - TD auto-generates zone files
- **No CLI sender profile commands** - use TD Console only
- **Domain verification automatic** - TD polls DNS for 72 hours
- **DNS records auto-generated** - copy from TD Console
- **Workspace context required** - set with `tdx use engage_workspace`

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates with sender profiles
- **email-campaign-creator** - Configure campaigns with senders

**Integration:**
- **email-testing-validator** - Test campaigns with sender configs
- **engage-deliverability** - Monitor deliverability with TD features
- **engage-workspace-advanced** - Workspace-level sender management
- **email-journey-builder** - Use sender profiles in journeys
