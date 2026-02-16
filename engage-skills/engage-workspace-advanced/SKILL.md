---
name: engage-workspace-advanced
description: Advanced TD Engage workspace management including permissions, policies, configuration settings, and multi-workspace operations using tdx engage workspace commands and API integration.
---

# Engage Advanced Workspace Management

## Purpose

Advanced workspace management for TD Engage including permissions configuration, workspace policies, multi-workspace operations, and enterprise-grade workspace administration.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace administrator permissions
- Understanding of TD user management and permissions model
- Access to workspace configuration APIs

## Advanced Workspace Operations

### Workspace Configuration Management
```bash
# Get comprehensive workspace information
tdx engage workspace show "Marketing Team" --full

# List workspaces with detailed configuration
tdx api "/workspaces" --type engage | jq '.data[] | {
  id: .id,
  name: .attributes.name,
  owner: .attributes.owner_user.name,
  domain_count: .attributes.domain_count,
  segment_count: .attributes.segment_count,
  created_at: .attributes.created_at
}'

# View workspace configuration settings
tdx api "/workspaces/{workspace-id}/settings" --type engage
```

### Multi-Workspace Operations
```bash
# List all accessible workspaces with metadata
list_all_workspaces() {
  echo "Workspace Inventory:"
  tdx engage workspace list --format json | jq '.data[] | {
    name: .attributes.name,
    id: .id,
    description: .attributes.description,
    owner: .attributes.owner_name,
    campaigns: .attributes.campaign_count,
    templates: .attributes.template_count,
    status: .attributes.status
  }'
}

# Clone workspace configuration
clone_workspace_config() {
  local source_workspace="$1"
  local target_workspace="$2"

  echo "Cloning configuration from $source_workspace to $target_workspace"

  # Get source workspace configuration
  source_id=$(tdx engage workspace show "$source_workspace" --json | jq '.data.id' -r)
  target_id=$(tdx engage workspace show "$target_workspace" --json | jq '.data.id' -r)

  # Copy workspace settings
  source_settings=$(tdx api "/workspaces/$source_id/settings" --type engage)

  echo "Applying configuration to target workspace..."
  echo "$source_settings" | jq '.data.attributes' | tdx api "/workspaces/$target_id/settings" --type engage --method PUT --data @-
}

# Usage: clone_workspace_config "Marketing Team" "Marketing Staging"
```

## Workspace Permissions & User Management

### User Access Management
```bash
# List workspace users and their roles
list_workspace_users() {
  local workspace_name="$1"
  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Users in workspace: $workspace_name"
  tdx api "/workspaces/$workspace_id/users" --type engage | jq '.data[] | {
    name: .attributes.name,
    email: .attributes.email,
    role: .attributes.role,
    permissions: .attributes.permissions,
    last_active: .attributes.last_active_at
  }'
}

# Add user to workspace with specific permissions
add_workspace_user() {
  local workspace_name="$1"
  local user_email="$2"
  local role="$3"  # admin, editor, viewer

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Adding user $user_email to $workspace_name with role $role"

  tdx api "/workspaces/$workspace_id/users" --type engage --method POST --data "{
    \"data\": {
      \"type\": \"workspace_users\",
      \"attributes\": {
        \"email\": \"$user_email\",
        \"role\": \"$role\"
      }
    }
  }"
}

# Usage: add_workspace_user "Marketing Team" "john.doe@company.com" "editor"
```

### Permission Policy Configuration
```bash
# Configure workspace-level permission policies
configure_workspace_policies() {
  local workspace_name="$1"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Configuring permission policies for: $workspace_name"

  tdx api "/workspaces/$workspace_id/policies" --type engage --method PUT --data '{
    "data": {
      "type": "workspace_policies",
      "attributes": {
        "campaign_creation": {
          "allowed_roles": ["admin", "editor"],
          "approval_required": false,
          "max_campaigns_per_user": 50
        },
        "template_management": {
          "allowed_roles": ["admin", "editor", "template_manager"],
          "template_approval_workflow": true,
          "version_control_enabled": true
        },
        "sender_profile_management": {
          "allowed_roles": ["admin"],
          "domain_verification_required": true
        },
        "workspace_settings": {
          "allowed_roles": ["admin"],
          "require_2fa": true
        }
      }
    }
  }'
}

# Usage: configure_workspace_policies "Marketing Team"
```

## Domain & Sender Management

### Multi-Domain Workspace Configuration
```bash
# Configure multiple domains for workspace
configure_workspace_domains() {
  local workspace_name="$1"
  local domains=("$@")  # Array of domains

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Configuring domains for workspace: $workspace_name"

  for domain in "${domains[@]:1}"; do  # Skip first argument (workspace name)
    echo "Adding domain: $domain"

    tdx api "/workspaces/$workspace_id/domains" --type engage --method POST --data "{
      \"data\": {
        \"type\": \"domains\",
        \"attributes\": {
          \"domain\": \"$domain\",
          \"verification_method\": \"dns\",
          \"auto_dkim_setup\": true
        }
      }
    }"
  done
}

# Usage: configure_workspace_domains "Marketing Team" "marketing.company.com" "newsletter.company.com"
```

### Default Sender Configuration
```bash
# Set workspace default sender profiles
configure_default_senders() {
  local workspace_name="$1"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Configuring default sender profiles for: $workspace_name"

  tdx api "/workspaces/$workspace_id/settings" --type engage --method PATCH --data '{
    "data": {
      "type": "workspace_settings",
      "attributes": {
        "default_senders": {
          "marketing": {
            "name": "Marketing Team",
            "email": "marketing@company.com",
            "reply_to": "noreply@company.com"
          },
          "transactional": {
            "name": "Customer Service",
            "email": "service@company.com",
            "reply_to": "support@company.com"
          },
          "newsletter": {
            "name": "Company Newsletter",
            "email": "newsletter@company.com",
            "reply_to": "unsubscribe@company.com"
          }
        }
      }
    }
  }'
}

# Usage: configure_default_senders "Marketing Team"
```

## Workspace Templates & Standardization

### Template Library Management
```bash
# Setup workspace template library structure
setup_template_library() {
  local workspace_name="$1"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Setting up template library for: $workspace_name"

  # Create template categories
  template_categories=(
    "newsletters"
    "promotional"
    "transactional"
    "welcome_series"
    "seasonal"
  )

  for category in "${template_categories[@]}"; do
    echo "Creating template category: $category"

    tdx api "/workspaces/$workspace_id/template-folders" --type engage --method POST --data "{
      \"data\": {
        \"type\": \"template_folders\",
        \"attributes\": {
          \"name\": \"$category\",
          \"description\": \"Templates for $category campaigns\"
        }
      }
    }"
  done
}

# Usage: setup_template_library "Marketing Team"
```

### Workspace Branding Configuration
```bash
# Configure workspace branding and defaults
configure_workspace_branding() {
  local workspace_name="$1"
  local brand_colors="$2"
  local logo_url="$3"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Configuring branding for: $workspace_name"

  tdx api "/workspaces/$workspace_id/branding" --type engage --method PUT --data "{
    \"data\": {
      \"type\": \"workspace_branding\",
      \"attributes\": {
        \"primary_color\": \"$brand_colors\",
        \"logo_url\": \"$logo_url\",
        \"default_template_settings\": {
          \"font_family\": \"Arial, sans-serif\",
          \"header_color\": \"$brand_colors\",
          \"footer_template\": \"standard_footer\"
        },
        \"utm_defaults\": {
          \"utm_source\": \"treasuredata\",
          \"utm_medium\": \"email\"
        }
      }
    }
  }"
}

# Usage: configure_workspace_branding "Marketing Team" "#007cba" "https://company.com/logo.png"
```

## Workspace Monitoring & Analytics

### Workspace Health Monitoring
```bash
# Monitor workspace health metrics
monitor_workspace_health() {
  local workspace_name="$1"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Workspace Health Report: $workspace_name"
  echo "=================================="

  # Get workspace statistics
  workspace_stats=$(tdx api "/workspaces/$workspace_id/statistics" --type engage)

  echo "$workspace_stats" | jq '{
    active_campaigns: .data.attributes.active_campaigns,
    total_templates: .data.attributes.total_templates,
    monthly_sends: .data.attributes.monthly_email_sends,
    deliverability_rate: .data.attributes.average_deliverability_rate,
    user_count: .data.attributes.user_count,
    domain_count: .data.attributes.verified_domains
  }'

  # Check for workspace issues
  echo -e "\nWorkspace Issues:"
  echo "$workspace_stats" | jq '.data.attributes.health_checks[] | select(.status == "warning" or .status == "error")'
}

# Usage: monitor_workspace_health "Marketing Team"
```

### Cross-Workspace Performance Comparison
```bash
# Compare performance across workspaces
compare_workspace_performance() {
  local workspaces=("$@")

  echo "Workspace Performance Comparison"
  echo "================================"

  for workspace in "${workspaces[@]}"; do
    workspace_id=$(tdx engage workspace show "$workspace" --json | jq '.data.id' -r)

    echo -e "\n$workspace:"
    tdx api "/workspaces/$workspace_id/performance" --type engage | jq '{
      name: .data.attributes.workspace_name,
      campaigns_this_month: .data.attributes.campaigns_this_month,
      avg_open_rate: .data.attributes.average_open_rate,
      avg_click_rate: .data.attributes.average_click_rate,
      deliverability_score: .data.attributes.deliverability_score
    }'
  done
}

# Usage: compare_workspace_performance "Marketing Team" "Sales Team" "Customer Success"
```

## Workspace Compliance & Governance

### Data Retention Policy Configuration
```bash
# Configure workspace data retention policies
configure_data_retention() {
  local workspace_name="$1"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Configuring data retention policies for: $workspace_name"

  tdx api "/workspaces/$workspace_id/compliance" --type engage --method PUT --data '{
    "data": {
      "type": "compliance_settings",
      "attributes": {
        "data_retention": {
          "email_events": "2_years",
          "campaign_data": "5_years",
          "template_versions": "1_year",
          "user_activity_logs": "90_days"
        },
        "gdpr_compliance": {
          "enabled": true,
          "consent_tracking": true,
          "right_to_deletion": true,
          "data_export_enabled": true
        },
        "audit_settings": {
          "log_all_actions": true,
          "export_audit_logs": true,
          "retention_period": "7_years"
        }
      }
    }
  }'
}

# Usage: configure_data_retention "Marketing Team"
```

### Compliance Audit & Reporting
```bash
# Generate compliance audit report
generate_compliance_audit() {
  local workspace_name="$1"
  local audit_period="$2"  # 30d, 90d, 1y

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)

  echo "Generating compliance audit for: $workspace_name ($audit_period)"

  # Get audit data
  audit_data=$(tdx api "/workspaces/$workspace_id/audit?period=$audit_period" --type engage)

  echo "Audit Summary:"
  echo "$audit_data" | jq '{
    total_campaigns: .data.attributes.total_campaigns,
    gdpr_requests: .data.attributes.gdpr_requests,
    data_exports: .data.attributes.data_exports,
    policy_violations: .data.attributes.policy_violations,
    security_events: .data.attributes.security_events
  }'

  # Export detailed audit log
  audit_filename="compliance_audit_${workspace_name//[^a-zA-Z0-9]/_}_$(date +%Y%m%d).json"
  echo "$audit_data" > "$audit_filename"
  echo "Detailed audit saved to: $audit_filename"
}

# Usage: generate_compliance_audit "Marketing Team" "90d"
```

## Workspace Migration & Backup

### Workspace Configuration Backup
```bash
# Comprehensive workspace backup
backup_workspace() {
  local workspace_name="$1"
  local backup_dir="$2"

  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)
  timestamp=$(date +%Y%m%d_%H%M%S)
  backup_path="$backup_dir/workspace_backup_${workspace_name//[^a-zA-Z0-9]/_}_$timestamp"

  echo "Creating workspace backup: $workspace_name"
  mkdir -p "$backup_path"

  # Backup workspace configuration
  echo "Backing up workspace configuration..."
  tdx engage workspace show "$workspace_name" --full > "$backup_path/workspace_config.json"

  # Backup campaigns
  echo "Backing up campaigns..."
  tdx engage campaign list --workspace "$workspace_name" --format json > "$backup_path/campaigns.json"

  # Backup templates
  echo "Backing up templates..."
  tdx engage template list --workspace "$workspace_name" --format json > "$backup_path/templates.json"

  # Backup sender profiles
  echo "Backing up sender profiles..."
  tdx api "/workspaces/$workspace_id/senders" --type engage > "$backup_path/senders.json"

  # Backup domains
  echo "Backing up domains..."
  tdx api "/workspaces/$workspace_id/domains" --type engage > "$backup_path/domains.json"

  # Backup user permissions
  echo "Backing up user permissions..."
  tdx api "/workspaces/$workspace_id/users" --type engage > "$backup_path/users.json"

  echo "✅ Workspace backup completed: $backup_path"
}

# Usage: backup_workspace "Marketing Team" "/backups/engage"
```

### Workspace Migration
```bash
# Migrate workspace to new region/account
migrate_workspace() {
  local source_workspace="$1"
  local target_workspace="$2"
  local backup_path="$3"

  echo "Migrating workspace: $source_workspace → $target_workspace"

  # Create backup first
  backup_workspace "$source_workspace" "$(dirname "$backup_path")"

  # Create target workspace
  echo "Creating target workspace..."
  tdx engage workspace create --name "$target_workspace"

  # Restore configuration
  echo "Restoring configuration..."
  # (Implementation would involve reading backup files and applying to target)

  echo "✅ Workspace migration completed"
  echo "⚠️  Manual verification required for sender profiles and domain verification"
}

# Usage: migrate_workspace "Marketing Team" "Marketing Team New" "/backups/engage/migration"
```

## Common Errors & Troubleshooting

### Workspace Configuration Errors

| Error | Solution |
|-------|----------|
| "Insufficient workspace permissions" | Contact workspace admin for elevated permissions |
| "Domain verification failed" | Check DNS records and domain ownership |
| "User already exists in workspace" | Update user role instead of creating new user |
| "Workspace policy conflict" | Review and resolve conflicting permission policies |
| "Template library initialization failed" | Check workspace storage limits and permissions |

### Multi-Workspace Operation Errors

| Error | Solution |
|-------|----------|
| "Cross-workspace access denied" | Verify user has access to all referenced workspaces |
| "Configuration clone failed" | Check API permissions for both source and target workspaces |
| "Workspace migration incomplete" | Review migration logs and complete manual verification steps |
| "Backup restoration failed" | Verify backup file integrity and workspace compatibility |

### Compliance & Audit Errors

| Error | Solution |
|-------|----------|
| "Audit log access denied" | Contact system administrator for audit permissions |
| "Data retention policy conflict" | Review policy settings and resolve conflicts |
| "GDPR compliance check failed" | Update workspace compliance configuration |
| "Export audit report timeout" | Reduce audit period or contact support for large datasets |

## Best Practices

### Workspace Organization
- Use consistent naming conventions across workspaces
- Implement workspace-level permission policies
- Configure default sender profiles and branding
- Set up template libraries with organized folder structures
- Establish regular backup and audit schedules

### Security & Compliance
- Enable two-factor authentication requirements
- Configure appropriate data retention policies
- Regular compliance audit reviews
- Implement least-privilege access principles
- Monitor workspace activity logs

### Performance Optimization
- Monitor workspace health metrics regularly
- Set up alerts for deliverability issues
- Optimize template libraries for performance
- Implement workspace resource limits
- Regular cleanup of unused campaigns and templates

## Validation & Health Checks

### Comprehensive Workspace Validation
```bash
# Complete workspace health check
validate_workspace_configuration() {
  local workspace_name="$1"

  echo "Comprehensive validation for: $workspace_name"

  # Check basic workspace access
  if ! tdx engage workspace show "$workspace_name" >/dev/null 2>&1; then
    echo "❌ Workspace access failed"
    return 1
  fi

  # Check domain configuration
  echo "Checking domain configuration..."
  workspace_id=$(tdx engage workspace show "$workspace_name" --json | jq '.data.id' -r)
  domain_status=$(tdx api "/workspaces/$workspace_id/domains" --type engage)

  unverified_domains=$(echo "$domain_status" | jq '.data[] | select(.attributes.verification_status != "verified") | .attributes.domain')

  if [ -n "$unverified_domains" ]; then
    echo "⚠️ Unverified domains found: $unverified_domains"
  else
    echo "✅ All domains verified"
  fi

  # Check sender profiles
  echo "Checking sender profiles..."
  sender_issues=$(tdx api "/workspaces/$workspace_id/senders" --type engage | jq '.data[] | select(.attributes.verification_status != "verified")')

  if [ -n "$sender_issues" ]; then
    echo "⚠️ Unverified sender profiles found"
  else
    echo "✅ All sender profiles verified"
  fi

  echo "✅ Workspace validation completed"
}

# Usage: validate_workspace_configuration "Marketing Team"
```

## Related Skills

**Core Workspace Management:**
- **tdx-skills:tdx-basic** - Basic workspace operations and context management

**Campaign & Template Management:**
- **email-campaign-creator** - Create campaigns within configured workspaces
- **email-template-creator** - Create templates within workspace template libraries

**Sender & Deliverability:**
- **engage-sender** - Manage sender profiles within workspace context
- **engage-deliverability** - Configure workspace deliverability settings

**Performance & Analytics:**
- **engage-utm** - Configure workspace-level UTM defaults
- **engage-events** - Analyze workspace performance across campaigns

**Security & Compliance:**
- **tdx-skills:parent-segment** - Configure workspace parent segment access
- **sql-skills:trino** - Query workspace audit and compliance data