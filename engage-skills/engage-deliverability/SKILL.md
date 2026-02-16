---
name: engage-deliverability
description: Email deliverability optimization and authentication for TD Engage campaigns including SPF, DKIM, DMARC configuration, reputation monitoring, and bounce management using tdx commands and deliverability APIs.
---

# Engage Email Deliverability & Authentication

## Purpose

Optimizes email deliverability for TD Engage campaigns through proper authentication setup (SPF, DKIM, DMARC), reputation monitoring, bounce management, and deliverability best practices implementation.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access with domain management permissions
- Domain ownership and DNS configuration access
- Understanding of email authentication protocols
- Sender profiles configured (use `engage-sender`)

## Email Authentication Setup

### SPF (Sender Policy Framework) Configuration
```bash
# Get TD Engage sending IPs for SPF record
get_td_sending_ips() {
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
  local existing_spf="$3"  # Optional existing SPF includes

  td_include=$(get_td_sending_ips "$region")

  if [ -n "$existing_spf" ]; then
    echo "v=spf1 $existing_spf $td_include ~all"
  else
    echo "v=spf1 $td_include ~all"
  fi

  echo ""
  echo "Add this TXT record to your DNS:"
  echo "Name: $domain"
  echo "Type: TXT"
  echo "Value: \"v=spf1 $td_include ~all\""
}

# Usage: generate_spf_record "company.com" "us01"
```

### DKIM Configuration & Management
```bash
# Enable DKIM for domain
enable_domain_dkim() {
  local domain="$1"
  local workspace_name="$2"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  # Get domain ID
  domain_id=$(tdx api "/workspaces/$workspace_id/domains" --type engage | jq --arg domain "$domain" '.data[] | select(.attributes.domain == $domain) | .id' -r)

  if [ -z "$domain_id" ]; then
    echo "❌ Domain not found: $domain"
    return 1
  fi

  echo "Enabling DKIM for domain: $domain"

  # Enable DKIM
  dkim_response=$(tdx api "/workspaces/$workspace_id/domains/$domain_id/dkim" --type engage --method POST)

  echo "✅ DKIM enabled. Add these DNS records:"
  echo "$dkim_response" | jq '.data.attributes.dkim_records[]'
}

# Verify DKIM DNS records
verify_dkim_records() {
  local domain="$1"
  local workspace_name="$2"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)
  domain_id=$(tdx api "/workspaces/$workspace_id/domains" --type engage | jq --arg domain "$domain" '.data[] | select(.attributes.domain == $domain) | .id' -r)

  echo "Verifying DKIM configuration for: $domain"

  verification_result=$(tdx api "/workspaces/$workspace_id/domains/$domain_id/dkim/verify" --type engage --method POST)

  if echo "$verification_result" | jq '.data.attributes.verified' | grep -q "true"; then
    echo "✅ DKIM verification successful"
  else
    echo "❌ DKIM verification failed"
    echo "Check DNS records:"
    tdx api "/workspaces/$workspace_id/domains/$domain_id/dkim" --type engage | jq '.data.attributes.dkim_records[]'
  fi
}

# Usage: enable_domain_dkim "company.com" "Marketing Team"
```

### DMARC Policy Implementation
```bash
# Generate DMARC policy record
generate_dmarc_record() {
  local domain="$1"
  local policy="$2"        # none, quarantine, strict
  local report_email="$3"  # Email for DMARC reports
  local percentage="$4"    # Percentage of emails to apply policy (default: 100)

  percentage=${percentage:-100}

  case $policy in
    "none")
      dmarc_policy="p=none"
      ;;
    "quarantine")
      dmarc_policy="p=quarantine"
      ;;
    "strict")
      dmarc_policy="p=reject"
      ;;
    *)
      echo "Invalid policy: $policy (use: none, quarantine, strict)"
      return 1
      ;;
  esac

  dmarc_record="v=DMARC1; $dmarc_policy; pct=$percentage; rua=mailto:$report_email; ruf=mailto:$report_email; sp=quarantine; adkim=r; aspf=r"

  echo "DMARC Record for $domain:"
  echo "Name: _dmarc.$domain"
  echo "Type: TXT"
  echo "Value: \"$dmarc_record\""
  echo ""
  echo "Policy: $policy ($percentage% of emails)"
  echo "Reports sent to: $report_email"
}

# Usage: generate_dmarc_record "company.com" "quarantine" "dmarc-reports@company.com" "50"
```

## Deliverability Monitoring

### Bounce Rate Analysis
```bash
# Monitor bounce rates by sender and domain
monitor_bounce_rates() {
  local workspace_name="$1"
  local days="$2"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Bounce Rate Analysis (Last $days days)"
  echo "===================================="

  # Query bounce events
  tdx query --database "delivery_email_treasuredata_com" <<EOF
SELECT
  from_domain,
  from_email,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN event_type = 'bounced' THEN 1 END) as bounces,
  ROUND(COUNT(CASE WHEN event_type = 'bounced' THEN 1 END) * 100.0 / COUNT(*), 2) as bounce_rate,
  COUNT(CASE WHEN event_type = 'complained' THEN 1 END) as complaints,
  ROUND(COUNT(CASE WHEN event_type = 'complained' THEN 1 END) * 100.0 / COUNT(*), 2) as complaint_rate
FROM events
WHERE
  td_interval(time, '-${days}d')
  AND workspace_id = '$workspace_id'
GROUP BY from_domain, from_email
HAVING COUNT(*) > 10
ORDER BY bounce_rate DESC
EOF
}

# Usage: monitor_bounce_rates "Marketing Team" "30"
```

### Reputation Scoring
```bash
# Calculate sender reputation score
calculate_reputation_score() {
  local sender_email="$1"
  local days="$2"

  echo "Reputation Analysis for: $sender_email"
  echo "================================"

  # Query email events for reputation metrics
  reputation_data=$(tdx query --format json --database "delivery_email_treasuredata_com" <<EOF
SELECT
  COUNT(*) as total_emails,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked,
  COUNT(CASE WHEN event_type = 'bounced' THEN 1 END) as bounced,
  COUNT(CASE WHEN event_type = 'complained' THEN 1 END) as complained
FROM events
WHERE
  td_interval(time, '-${days}d')
  AND from_email = '$sender_email'
EOF
)

  # Calculate reputation score
  python3 -c "
import json
data = json.loads('''$reputation_data''')[0]

total = data['total_emails']
if total == 0:
    print('No email data found')
    exit()

delivered = data['delivered']
opened = data['opened']
clicked = data['clicked']
bounced = data['bounced']
complained = data['complained']

# Calculate rates
delivery_rate = (delivered / total) * 100
open_rate = (opened / delivered) * 100 if delivered > 0 else 0
click_rate = (clicked / opened) * 100 if opened > 0 else 0
bounce_rate = (bounced / total) * 100
complaint_rate = (complained / total) * 100

# Calculate reputation score (0-100)
reputation_score = (
    (delivery_rate * 0.4) +
    (open_rate * 0.3) +
    (click_rate * 0.2) +
    (max(0, 100 - bounce_rate * 10) * 0.05) +
    (max(0, 100 - complaint_rate * 20) * 0.05)
)

print(f'Total Emails: {total:,}')
print(f'Delivery Rate: {delivery_rate:.2f}%')
print(f'Open Rate: {open_rate:.2f}%')
print(f'Click Rate: {click_rate:.2f}%')
print(f'Bounce Rate: {bounce_rate:.2f}%')
print(f'Complaint Rate: {complaint_rate:.2f}%')
print(f'Reputation Score: {reputation_score:.1f}/100')

if reputation_score >= 80:
    print('Status: ✅ Excellent')
elif reputation_score >= 60:
    print('Status: ⚠️ Good')
elif reputation_score >= 40:
    print('Status: ⚠️ Fair - Needs improvement')
else:
    print('Status: ❌ Poor - Immediate action required')
"
}

# Usage: calculate_reputation_score "marketing@company.com" "30"
```

### Blacklist Monitoring
```bash
# Check domain/IP blacklist status
check_blacklist_status() {
  local domain="$1"

  echo "Blacklist Status Check for: $domain"
  echo "=================================="

  # Common blacklists to check
  blacklists=(
    "zen.spamhaus.org"
    "bl.spamcop.net"
    "dnsbl.sorbs.net"
    "b.barracudacentral.org"
  )

  for blacklist in "${blacklists[@]}"; do
    echo -n "Checking $blacklist: "

    # Check if domain is listed
    if nslookup "$domain.$blacklist" >/dev/null 2>&1; then
      echo "❌ LISTED"
    else
      echo "✅ Clear"
    fi
  done

  echo ""
  echo "Note: If listed, contact the blacklist provider for removal"
}

# Usage: check_blacklist_status "company.com"
```

## Bounce Management

### Bounce Processing & Suppression
```bash
# Process and categorize bounces
process_bounces() {
  local workspace_name="$1"
  local days="$2"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Bounce Processing (Last $days days)"
  echo "================================="

  # Categorize bounces by type
  tdx query --database "delivery_email_treasuredata_com" <<EOF
WITH bounce_analysis AS (
  SELECT
    email,
    bounce_type,
    bounce_subtype,
    diagnostic_code,
    COUNT(*) as bounce_count,
    MAX(time) as last_bounce
  FROM events
  WHERE
    td_interval(time, '-${days}d')
    AND event_type = 'bounced'
    AND workspace_id = '$workspace_id'
  GROUP BY email, bounce_type, bounce_subtype, diagnostic_code
)
SELECT
  bounce_type,
  bounce_subtype,
  COUNT(*) as unique_emails,
  SUM(bounce_count) as total_bounces,
  CASE
    WHEN bounce_type = 'Permanent' THEN 'SUPPRESS'
    WHEN bounce_count >= 3 THEN 'SUPPRESS'
    ELSE 'MONITOR'
  END as recommended_action
FROM bounce_analysis
GROUP BY bounce_type, bounce_subtype
ORDER BY total_bounces DESC
EOF
}

# Create suppression list from hard bounces
create_suppression_list() {
  local workspace_name="$1"
  local output_file="$2"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Creating suppression list..."

  # Get emails to suppress
  tdx query --format tsv --database "delivery_email_treasuredata_com" <<EOF | cut -f1 > "$output_file"
SELECT DISTINCT email
FROM events
WHERE
  td_interval(time, '-90d')
  AND event_type = 'bounced'
  AND workspace_id = '$workspace_id'
  AND (
    bounce_type = 'Permanent' OR
    (bounce_type = 'Transient' AND
     email IN (
       SELECT email
       FROM events
       WHERE event_type = 'bounced' AND bounce_type = 'Transient'
       GROUP BY email
       HAVING COUNT(*) >= 3
     ))
  )
EOF

  echo "Suppression list created: $output_file"
  echo "Emails to suppress: $(wc -l < "$output_file")"
}

# Usage: process_bounces "Marketing Team" "30"
# Usage: create_suppression_list "Marketing Team" "suppression_list.txt"
```

### Complaint Management
```bash
# Process spam complaints and unsubscribes
process_complaints() {
  local workspace_name="$1"
  local days="$2"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Complaint Analysis (Last $days days)"
  echo "==================================="

  # Analyze complaints by campaign and sender
  tdx query --database "delivery_email_treasuredata_com" <<EOF
SELECT
  campaign_name,
  from_email,
  COUNT(*) as complaints,
  COUNT(DISTINCT email) as unique_complainers,
  ROUND(COUNT(*) * 100.0 /
    (SELECT COUNT(*) FROM events e2
     WHERE e2.campaign_name = events.campaign_name
     AND e2.event_type = 'delivered'
     AND td_interval(e2.time, '-${days}d')), 4) as complaint_rate
FROM events
WHERE
  td_interval(time, '-${days}d')
  AND event_type = 'complained'
  AND workspace_id = '$workspace_id'
GROUP BY campaign_name, from_email
HAVING complaint_rate > 0.1  -- Above 0.1% is concerning
ORDER BY complaint_rate DESC
EOF
}

# Usage: process_complaints "Marketing Team" "30"
```

## Deliverability Optimization

### Warming Up New Domains
```bash
# Domain warm-up schedule generator
generate_warmup_schedule() {
  local domain="$1"
  local total_list_size="$2"

  echo "Domain Warm-up Schedule for: $domain"
  echo "Total list size: $total_list_size emails"
  echo "===================================="

  # Calculate warm-up volumes (gradual increase)
  python3 -c "
import math

total_size = $total_list_size
days = 30  # 30-day warm-up

print('Week 1 (Days 1-7): Establish baseline')
for day in range(1, 8):
    volume = min(int(total_size * 0.01 * day), total_size // 10)
    print(f'  Day {day}: {volume:,} emails')

print('\nWeek 2 (Days 8-14): Gradual increase')
for day in range(8, 15):
    volume = min(int(total_size * 0.05 * (day - 7)), total_size // 5)
    print(f'  Day {day}: {volume:,} emails')

print('\nWeek 3 (Days 15-21): Moderate volume')
for day in range(15, 22):
    volume = min(int(total_size * 0.1 * (day - 14)), total_size // 2)
    print(f'  Day {day}: {volume:,} emails')

print('\nWeek 4+ (Days 22+): Full volume')
for day in range(22, 30):
    volume = min(int(total_size * 0.8), total_size)
    print(f'  Day {day}: {volume:,} emails (monitor closely)')

print('\nWarm-up Guidelines:')
print('- Monitor bounce/complaint rates daily')
print('- Pause if bounce rate >5% or complaint rate >0.3%')
print('- Focus on engaged subscribers first')
print('- Maintain consistent sending schedule')
"
}

# Usage: generate_warmup_schedule "marketing.company.com" "100000"
```

### List Hygiene & Segmentation
```bash
# Segment list by engagement level
segment_by_engagement() {
  local workspace_name="$1"
  local days="$2"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Email List Segmentation by Engagement"
  echo "===================================="

  # Create engagement segments
  tdx query --database "delivery_email_treasuredata_com" <<EOF
WITH engagement_analysis AS (
  SELECT
    email,
    COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opens,
    COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicks,
    MAX(CASE WHEN event_type = 'opened' THEN time END) as last_open,
    MAX(CASE WHEN event_type = 'clicked' THEN time END) as last_click,
    COUNT(DISTINCT campaign_name) as campaigns_received
  FROM events
  WHERE
    td_interval(time, '-${days}d')
    AND workspace_id = '$workspace_id'
  GROUP BY email
)
SELECT
  CASE
    WHEN clicks >= 5 OR (opens >= 10 AND last_open >= UNIX_TIMESTAMP(CURRENT_DATE - INTERVAL '30' DAY)) THEN 'Highly Engaged'
    WHEN opens >= 3 OR last_open >= UNIX_TIMESTAMP(CURRENT_DATE - INTERVAL '60' DAY) THEN 'Moderately Engaged'
    WHEN opens >= 1 OR last_open >= UNIX_TIMESTAMP(CURRENT_DATE - INTERVAL '90' DAY) THEN 'Low Engagement'
    ELSE 'Inactive'
  END as engagement_segment,
  COUNT(*) as email_count,
  ROUND(AVG(opens), 2) as avg_opens,
  ROUND(AVG(clicks), 2) as avg_clicks
FROM engagement_analysis
GROUP BY 1
ORDER BY
  CASE engagement_segment
    WHEN 'Highly Engaged' THEN 1
    WHEN 'Moderately Engaged' THEN 2
    WHEN 'Low Engagement' THEN 3
    ELSE 4
  END
EOF
}

# Usage: segment_by_engagement "Marketing Team" "180"
```

## Common Errors & Troubleshooting

### Authentication Errors

| Error | Solution |
|-------|----------|
| "SPF record not found" | Add SPF TXT record to domain DNS |
| "DKIM signature verification failed" | Verify DKIM DNS records are correctly published |
| "DMARC policy failure" | Check SPF and DKIM alignment with DMARC policy |
| "Domain not authenticated" | Complete domain verification process first |
| "DNS propagation timeout" | Wait 24-48 hours for DNS changes to propagate |

### Deliverability Issues

| Error | Solution |
|-------|----------|
| "High bounce rate (>5%)" | Clean email list, verify addresses before sending |
| "High complaint rate (>0.3%)" | Review content, improve unsubscribe process |
| "Low engagement rates" | Segment list, improve content relevance |
| "Blacklist detection" | Contact blacklist provider, improve sending practices |
| "ISP blocking" | Implement domain warm-up, monitor reputation |

### Configuration Issues

| Error | Solution |
|-------|----------|
| "DKIM key rotation failed" | Update DNS records with new DKIM keys |
| "Subdomain authentication" | Configure separate SPF/DKIM for subdomains |
| "IP warming incomplete" | Follow gradual volume increase schedule |
| "Feedback loop setup missing" | Configure ISP feedback loops for complaints |

## Best Practices

### Email Authentication
- Implement SPF, DKIM, and DMARC for all sending domains
- Use dedicated IP addresses for high-volume senders
- Configure feedback loops with major ISPs
- Monitor authentication alignment regularly
- Keep DNS records updated during infrastructure changes

### Reputation Management
- Maintain bounce rates below 5%
- Keep complaint rates under 0.3%
- Monitor engagement rates and segment accordingly
- Implement proper list hygiene practices
- Use double opt-in for new subscriptions

### Deliverability Optimization
- Warm up new domains and IPs gradually
- Send consistent volumes on regular schedules
- Focus on engaged subscribers for new domains
- Monitor blacklist status regularly
- Implement proper unsubscribe mechanisms

## Validation & Health Checks

### Comprehensive Deliverability Assessment
```bash
# Complete deliverability health check
assess_deliverability_health() {
  local workspace_name="$1"
  local domain="$2"

  echo "Deliverability Health Assessment"
  echo "Workspace: $workspace_name"
  echo "Domain: $domain"
  echo "==============================="

  # Check DNS authentication
  echo "1. DNS Authentication Status:"
  echo "   SPF: $(dig +short txt "$domain" | grep "v=spf1" || echo "❌ Not found")"
  echo "   DKIM: $(dig +short txt "_domainkey.$domain" || echo "Check specific selectors")"
  echo "   DMARC: $(dig +short txt "_dmarc.$domain" | grep "v=DMARC1" || echo "❌ Not found")"

  # Check recent performance
  echo -e "\n2. Recent Performance (30 days):"
  monitor_bounce_rates "$workspace_name" "30"

  # Check blacklist status
  echo -e "\n3. Blacklist Status:"
  check_blacklist_status "$domain"

  # Reputation score
  echo -e "\n4. Reputation Analysis:"
  # Get primary sender for domain
  primary_sender=$(tdx api "/workspaces/$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)/senders" --type engage | jq --arg domain "$domain" '.data[] | select(.attributes.email | contains($domain)) | .attributes.email' -r | head -1)

  if [ -n "$primary_sender" ]; then
    calculate_reputation_score "$primary_sender" "30"
  else
    echo "No sender profiles found for domain"
  fi

  echo -e "\n✅ Deliverability assessment complete"
}

# Usage: assess_deliverability_health "Marketing Team" "company.com"
```

## Related Skills

**Domain & Sender Management:**
- **engage-sender** - Configure sender profiles with proper authentication
- **engage-workspace-advanced** - Set workspace-level deliverability policies

**Campaign Integration:**
- **email-campaign-creator** - Apply deliverability best practices to campaigns
- **email-template-creator** - Design templates for optimal deliverability

**Monitoring & Analytics:**
- **engage-events** - Monitor email events for deliverability insights
- **engage-utm** - Track campaign performance with deliverability correlation

**Data & Queries:**
- **sql-skills:trino** - Query email event data for deliverability analysis
- **tdx-skills:tdx-basic** - Basic data operations for bounce and complaint management