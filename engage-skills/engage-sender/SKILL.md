---
name: engage-sender
description: Manages email sender profiles and domain configuration for TD Engage campaigns using tdx engage commands and API integration for deliverability setup.
---

# Engage Sender Management

## Purpose

Manages email sender profiles, domain configuration, and deliverability settings for TD Engage campaigns. Handles sender verification, domain authentication, and DKIM configuration for optimal email delivery.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access with sender management permissions
- Domain ownership verification for custom domains
- Access to DNS configuration for domain authentication

## Sender Profile Management

### List and View Sender Profiles
```bash
# List all sender profiles in workspace
tdx api "/workspaces/{workspace-id}/senders" --type engage

# View specific sender profile details
tdx api "/workspaces/{workspace-id}/senders/{sender-id}" --type engage

# List sender profiles with verification status
tdx api "/workspaces/{workspace-id}/senders" --type engage | jq '.data[] | {name: .attributes.name, email: .attributes.email, status: .attributes.verification_status}'
```

### Create Sender Profiles
```bash
# Create sender profile via API
tdx api "/workspaces/{workspace-id}/senders" --type engage --method POST --data '{
  "data": {
    "type": "senders",
    "attributes": {
      "name": "Marketing Team",
      "email": "marketing@company.com",
      "reply_to_email": "noreply@company.com"
    }
  }
}'

# Create sender with display name
tdx api "/workspaces/{workspace-id}/senders" --type engage --method POST --data '{
  "data": {
    "type": "senders",
    "attributes": {
      "name": "Customer Success",
      "email": "success@company.com",
      "display_name": "Customer Success Team",
      "reply_to_email": "success@company.com"
    }
  }
}'
```

### Update Sender Profiles
```bash
# Update sender display name
tdx api "/workspaces/{workspace-id}/senders/{sender-id}" --type engage --method PATCH --data '{
  "data": {
    "type": "senders",
    "id": "{sender-id}",
    "attributes": {
      "display_name": "Updated Marketing Team"
    }
  }
}'

# Update reply-to email
tdx api "/workspaces/{workspace-id}/senders/{sender-id}" --type engage --method PATCH --data '{
  "data": {
    "type": "senders",
    "id": "{sender-id}",
    "attributes": {
      "reply_to_email": "new-reply@company.com"
    }
  }
}'
```

## Domain Configuration

### Domain Verification Setup
```bash
# Add custom domain for email sending
tdx api "/workspaces/{workspace-id}/domains" --type engage --method POST --data '{
  "data": {
    "type": "domains",
    "attributes": {
      "domain": "company.com"
    }
  }
}'

# Check domain verification status
tdx api "/workspaces/{workspace-id}/domains" --type engage | jq '.data[] | {domain: .attributes.domain, status: .attributes.verification_status}'

# Get domain verification records
tdx api "/workspaces/{workspace-id}/domains/{domain-id}" --type engage | jq '.data.attributes.verification_records'
```

### DKIM Configuration
```bash
# Enable DKIM for domain
tdx api "/workspaces/{workspace-id}/domains/{domain-id}/dkim" --type engage --method POST

# Get DKIM configuration records
tdx api "/workspaces/{workspace-id}/domains/{domain-id}/dkim" --type engage | jq '.data.attributes.dkim_records'

# Verify DKIM setup
tdx api "/workspaces/{workspace-id}/domains/{domain-id}/dkim/verify" --type engage --method POST
```

## Workspace Context & Helper Functions

### Workspace Context Management
```bash
# Set workspace context for sender operations
tdx use engage_workspace "Marketing Team"

# Get current workspace details
get_workspace_info() {
  local workspace_name="$1"
  tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r
}

# Usage: workspace_id=$(get_workspace_info "Marketing Team")
```

### Sender Profile Helpers
```bash
# Create sender profile with validation
create_sender_profile() {
  local name="$1"
  local email="$2"
  local display_name="$3"
  local workspace_id="$4"

  echo "Creating sender profile: $name ($email)"

  tdx api "/workspaces/$workspace_id/senders" --type engage --method POST --data "{
    \"data\": {
      \"type\": \"senders\",
      \"attributes\": {
        \"name\": \"$name\",
        \"email\": \"$email\",
        \"display_name\": \"$display_name\",
        \"reply_to_email\": \"$email\"
      }
    }
  }"
}

# Usage: create_sender_profile "Marketing" "marketing@company.com" "Marketing Team" "$workspace_id"
```

### Domain Management Helpers
```bash
# Check domain verification status
check_domain_status() {
  local domain="$1"
  local workspace_id="$2"

  echo "Checking domain status for: $domain"

  tdx api "/workspaces/$workspace_id/domains" --type engage | jq --arg domain "$domain" '
    .data[] | select(.attributes.domain == $domain) | {
      domain: .attributes.domain,
      status: .attributes.verification_status,
      dkim_enabled: .attributes.dkim_enabled
    }'
}

# Usage: check_domain_status "company.com" "$workspace_id"
```

## Email Deliverability Setup

### SPF Record Configuration
```dns
# Add to DNS TXT record for your domain
# Replace {region} with your TD region (us01, eu01, jp01, ap02)
"v=spf1 include:ses-{region}.treasuredata.com ~all"

# Example for US region:
"v=spf1 include:ses-us01.treasuredata.com ~all"
```

### DMARC Policy Setup
```dns
# Add DMARC TXT record for domain policy
# _dmarc.yourdomain.com TXT record:
"v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.com"
```

### Verification Workflow
```bash
# Complete domain verification workflow
verify_domain_setup() {
  local domain="$1"
  local workspace_id="$2"

  echo "Starting domain verification for: $domain"

  # 1. Add domain
  echo "1. Adding domain..."
  domain_response=$(tdx api "/workspaces/$workspace_id/domains" --type engage --method POST --data "{
    \"data\": {
      \"type\": \"domains\",
      \"attributes\": {
        \"domain\": \"$domain\"
      }
    }
  }")

  domain_id=$(echo "$domain_response" | jq '.data.id' -r)
  echo "Domain ID: $domain_id"

  # 2. Get verification records
  echo "2. Getting DNS verification records..."
  tdx api "/workspaces/$workspace_id/domains/$domain_id" --type engage | jq '.data.attributes.verification_records'

  echo "3. Add these DNS records to your domain, then run DKIM setup:"
  echo "   tdx api \"/workspaces/$workspace_id/domains/$domain_id/dkim\" --type engage --method POST"
}

# Usage: verify_domain_setup "company.com" "$workspace_id"
```

## Sender Reputation Monitoring

### Bounce and Complaint Monitoring
```bash
# Check sender reputation metrics
check_sender_reputation() {
  local sender_id="$1"
  local workspace_id="$2"

  echo "Checking sender reputation for: $sender_id"

  # Get sender statistics
  tdx api "/workspaces/$workspace_id/senders/$sender_id/statistics" --type engage | jq '{
    bounce_rate: .data.attributes.bounce_rate,
    complaint_rate: .data.attributes.complaint_rate,
    delivery_rate: .data.attributes.delivery_rate
  }'
}

# Usage: check_sender_reputation "$sender_id" "$workspace_id"
```

### Email Events by Sender
```sql
-- Query email events for specific sender
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

## Common Errors & Troubleshooting

### Sender Profile Errors

| Error | Solution |
|-------|----------|
| "Email address already exists" | Use different email or update existing sender profile |
| "Invalid email format" | Verify email address format is valid |
| "Domain not verified" | Complete domain verification process first |
| "Sender verification pending" | Check email for verification link |
| "Insufficient permissions" | Contact workspace admin for sender management permissions |

### Domain Configuration Errors

| Error | Solution |
|-------|----------|
| "Domain verification failed" | Check DNS records are correctly configured |
| "DKIM setup failed" | Verify DKIM DNS records are published |
| "SPF record not found" | Add SPF record to domain DNS configuration |
| "DMARC policy missing" | Add DMARC TXT record for domain |
| "Domain already claimed" | Contact TD support if domain is incorrectly claimed |

### Deliverability Issues

| Error | Solution |
|-------|----------|
| "High bounce rate" | Clean email lists, validate addresses before sending |
| "High complaint rate" | Review email content, provide clear unsubscribe options |
| "Domain reputation poor" | Implement gradual sending ramp-up, monitor engagement |
| "SPF alignment failed" | Ensure SPF record includes TD Engage sending IPs |
| "DKIM signature invalid" | Verify DKIM DNS records match TD configuration |

## Best Practices

### Sender Profile Setup
- Use descriptive sender names that recipients recognize
- Configure reply-to addresses that are monitored
- Use consistent sender profiles across campaign types
- Separate transactional and marketing sender profiles
- Verify all sender profiles before campaign launch

### Domain Configuration
- Complete domain verification before sending campaigns
- Set up SPF, DKIM, and DMARC records for authentication
- Use subdomains for different email types (marketing.company.com)
- Monitor domain reputation regularly
- Keep DNS records updated when changing configurations

### Deliverability Optimization
- Implement gradual sending volume ramp-up for new domains
- Monitor bounce and complaint rates regularly
- Use double opt-in for email list subscriptions
- Provide clear unsubscribe mechanisms
- Segment email lists by engagement levels

## Validation & Health Checks

### Pre-Campaign Sender Validation
```bash
# Comprehensive sender and domain check
validate_sender_setup() {
  local sender_id="$1"
  local workspace_id="$2"

  echo "Validating sender setup..."

  # Check sender profile
  sender_info=$(tdx api "/workspaces/$workspace_id/senders/$sender_id" --type engage)
  verification_status=$(echo "$sender_info" | jq '.data.attributes.verification_status' -r)

  if [ "$verification_status" = "verified" ]; then
    echo "✅ Sender profile verified"
  else
    echo "❌ Sender profile not verified: $verification_status"
    return 1
  fi

  # Check domain configuration
  domain=$(echo "$sender_info" | jq '.data.attributes.email' -r | cut -d'@' -f2)
  echo "Checking domain configuration for: $domain"

  domain_status=$(check_domain_status "$domain" "$workspace_id")
  echo "$domain_status"

  echo "✅ Sender and domain validation complete"
}

# Usage: validate_sender_setup "$sender_id" "$workspace_id"
```

## Related Skills

**Campaign Integration:**
- **email-campaign-creator** - Use verified sender profiles in campaigns
- **email-template-creator** - Reference sender profiles in email templates

**Deliverability & Monitoring:**
- **engage-deliverability** - Advanced deliverability configuration
- **engage-events** - Monitor email events and sender performance

**Workspace Management:**
- **engage-workspace-advanced** - Advanced workspace configuration including sender policies

**Journey Integration:**
- **email-journey-builder** - Configure sender profiles for journey email steps
- **tdx-skills:journey** - Reference sender profiles in journey activation configurations