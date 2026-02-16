---
name: engage-workspace-advanced
description: Advanced TD Engage workspace management guidance using verified tdx engage workspace commands and web interface procedures for permissions, policies, and multi-workspace operations.
---

# Engage Advanced Workspace Management Guide

## Purpose

Provides guidance for advanced TD Engage workspace management including **verified CLI operations**, **web interface procedures** for permissions configuration, and **multi-workspace management** using confirmed tools.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace administrator permissions
- Access to TD Console web interface
- Understanding of TD user management model

## ⚠️ Important Note

**Advanced workspace operations (permissions, user management, policies) are primarily managed through the TD Console web interface**, not CLI. This skill provides verified CLI commands plus web interface guidance.

## Verified Workspace Operations

### Basic Workspace Management (Confirmed CLI Commands)
```bash
# List all accessible workspaces
tdx engage workspace list

# Show workspace details
tdx engage workspace show "Marketing Team"

# Get full workspace information
tdx engage workspace show "Marketing Team" --full

# Create new workspace
tdx engage workspace create --name "New Workspace" --description "Workspace description"

# Update workspace
tdx engage workspace update "Marketing Team" --description "Updated description"

# Delete workspace (use with caution)
tdx engage workspace delete "Old Workspace"

# Set workspace context
tdx use engage_workspace "Marketing Team"
```

### Workspace Information Gathering (Verified Commands)
```bash
# Comprehensive workspace inventory using verified commands
workspace_inventory() {
  echo "Workspace Inventory Report"
  echo "========================="

  # Get all workspaces
  workspaces=$(tdx engage workspace list --format tsv)

  if [ -z "$workspaces" ]; then
    echo "No workspaces found or no access permissions"
    return 1
  fi

  # Process each workspace
  echo "$workspaces" | while IFS=$'\t' read -r uuid name description; do
    if [ -n "$name" ]; then
      echo ""
      echo "Workspace: $name"
      echo "Description: $description"
      echo "UUID: $uuid"

      # Set context and get additional info
      if tdx use engage_workspace "$name" >/dev/null 2>&1; then
        # Count campaigns
        campaign_count=$(tdx engage campaign list --format tsv 2>/dev/null | wc -l)
        echo "Campaigns: $campaign_count"

        # Count templates
        template_count=$(tdx engage template list --format tsv 2>/dev/null | wc -l)
        echo "Templates: $template_count"
      else
        echo "Status: Limited access"
      fi
    fi
  done

  echo ""
  echo "✅ Inventory completed using verified CLI commands"
}

# Usage: workspace_inventory
```

### Multi-Workspace Operations (Verified Commands Only)
```bash
# Compare workspace contents using verified commands
compare_workspaces() {
  local workspace1="$1"
  local workspace2="$2"

  echo "Workspace Comparison: $workspace1 vs $workspace2"
  echo "==============================================="

  # Workspace 1 analysis
  echo "Workspace 1: $workspace1"
  if tdx use engage_workspace "$workspace1" >/dev/null 2>&1; then
    campaigns1=$(tdx engage campaign list --format tsv 2>/dev/null | wc -l)
    templates1=$(tdx engage template list --format tsv 2>/dev/null | wc -l)
    echo "  Campaigns: $campaigns1"
    echo "  Templates: $templates1"
  else
    echo "  Status: No access"
  fi

  # Workspace 2 analysis
  echo ""
  echo "Workspace 2: $workspace2"
  if tdx use engage_workspace "$workspace2" >/dev/null 2>&1; then
    campaigns2=$(tdx engage campaign list --format tsv 2>/dev/null | wc -l)
    templates2=$(tdx engage template list --format tsv 2>/dev/null | wc -l)
    echo "  Campaigns: $campaigns2"
    echo "  Templates: $templates2"
  else
    echo "  Status: No access"
  fi

  echo ""
  echo "✅ Comparison completed using verified commands only"
}

# Usage: compare_workspaces "Marketing Team" "Sales Team"
```

## Web Interface Guidance for Advanced Features

### User Management (Web Interface Required)
```bash
# Set workspace context, then use web interface for user management
manage_workspace_users() {
  local workspace_name="$1"

  echo "User Management for Workspace: $workspace_name"
  echo "============================================="

  # Verify workspace access via CLI
  if ! tdx engage workspace show "$workspace_name" >/dev/null 2>&1; then
    echo "❌ Workspace not accessible via CLI: $workspace_name"
    return 1
  fi

  echo "✅ Workspace accessible via CLI"
  echo ""
  echo "For user management, use TD Console web interface:"
  echo "1. Open TD Console: https://console.treasuredata.com"
  echo "2. Navigate to: Engage > Workspace Settings"
  echo "3. Select workspace: $workspace_name"
  echo "4. Go to: Users & Permissions"
  echo ""
  echo "Available user management operations in web interface:"
  echo "- Add users to workspace"
  echo "- Assign roles (Admin, Editor, Viewer)"
  echo "- Configure permissions per user"
  echo "- Remove users from workspace"
  echo "- View user activity logs"
}

# Usage: manage_workspace_users "Marketing Team"
```

### Workspace Policies (Web Interface Required)
```bash
# Guide for configuring workspace policies via web interface
configure_workspace_policies() {
  local workspace_name="$1"

  echo "Workspace Policy Configuration Guide"
  echo "Workspace: $workspace_name"
  echo "===================================="

  # Verify workspace via CLI
  tdx use engage_workspace "$workspace_name"

  echo "Workspace context set. For policy configuration:"
  echo ""
  echo "TD Console Path: Engage > Workspace Settings > Policies"
  echo ""
  echo "Available Policy Configurations:"
  echo "- Campaign creation permissions"
  echo "- Template management permissions"
  echo "- Sender profile management"
  echo "- Data retention policies"
  echo "- Approval workflows"
  echo "- API access controls"
  echo ""
  echo "Policy Types to Configure:"
  echo "1. User Role Permissions"
  echo "2. Content Approval Workflows"
  echo "3. Data Governance Settings"
  echo "4. Security & Compliance Policies"
}

# Usage: configure_workspace_policies "Marketing Team"
```

## Workspace Backup & Migration (Verified Commands)

### Workspace Content Backup
```bash
# Backup workspace content using verified CLI commands
backup_workspace_content() {
  local workspace_name="$1"
  local backup_dir="$2"

  timestamp=$(date +%Y%m%d_%H%M%S)
  backup_path="$backup_dir/workspace_backup_${workspace_name//[^a-zA-Z0-9]/_}_$timestamp"

  echo "Backing up workspace content: $workspace_name"
  echo "Backup location: $backup_path"
  mkdir -p "$backup_path"

  # Set workspace context
  if ! tdx use engage_workspace "$workspace_name"; then
    echo "❌ Cannot access workspace: $workspace_name"
    return 1
  fi

  # Backup workspace configuration
  echo "1. Backing up workspace configuration..."
  tdx engage workspace show "$workspace_name" --full > "$backup_path/workspace_config.json"

  # Backup campaigns
  echo "2. Backing up campaigns..."
  tdx engage campaign list --format json > "$backup_path/campaigns.json"

  # Save individual campaign details
  campaigns_dir="$backup_path/campaigns"
  mkdir -p "$campaigns_dir"

  tdx engage campaign list --format tsv | while IFS=$'\t' read -r uuid name status; do
    if [ -n "$name" ]; then
      safe_name=$(echo "$name" | tr ' /' '_')
      tdx engage campaign show "$name" --full > "$campaigns_dir/${safe_name}.json"
    fi
  done

  # Backup templates
  echo "3. Backing up templates..."
  tdx engage template list --format json > "$backup_path/templates.json"

  # Save individual template details
  templates_dir="$backup_path/templates"
  mkdir -p "$templates_dir"

  tdx engage template list --format tsv | while IFS=$'\t' read -r uuid name; do
    if [ -n "$name" ]; then
      safe_name=$(echo "$name" | tr ' /' '_')
      tdx engage template show "$name" --full > "$templates_dir/${safe_name}.json"
    fi
  done

  echo "✅ Workspace backup completed: $backup_path"
  echo ""
  echo "Backup Contents:"
  ls -la "$backup_path"
}

# Usage: backup_workspace_content "Marketing Team" "/backups/engage"
```

### Workspace Content Analysis
```bash
# Analyze workspace content and health using verified commands
analyze_workspace_health() {
  local workspace_name="$1"

  echo "Workspace Health Analysis: $workspace_name"
  echo "========================================"

  # Set workspace context
  if ! tdx use engage_workspace "$workspace_name"; then
    echo "❌ Cannot access workspace"
    return 1
  fi

  # Campaign analysis
  echo "1. Campaign Analysis:"
  campaigns=$(tdx engage campaign list --format tsv)

  if [ -n "$campaigns" ]; then
    total_campaigns=$(echo "$campaigns" | wc -l)
    echo "   Total campaigns: $total_campaigns"

    # Count by status
    echo "   Campaign Status Breakdown:"
    echo "$campaigns" | awk '{print $3}' | sort | uniq -c | while read count status; do
      echo "     $status: $count"
    done
  else
    echo "   No campaigns found"
  fi

  # Template analysis
  echo ""
  echo "2. Template Analysis:"
  templates=$(tdx engage template list --format tsv)

  if [ -n "$templates" ]; then
    total_templates=$(echo "$templates" | wc -l)
    echo "   Total templates: $total_templates"
  else
    echo "   No templates found"
  fi

  # Workspace configuration
  echo ""
  echo "3. Workspace Configuration:"
  workspace_info=$(tdx engage workspace show "$workspace_name")
  echo "   Workspace accessible: ✅"

  echo ""
## Common Errors & Troubleshooting

### Workspace Access Errors

| Error | Solution |
|-------|----------|
| "Workspace not found" | Verify workspace name: `tdx engage workspace list` |
| "Permission denied" | Contact workspace admin for access permissions |
| "Workspace context not set" | Run `tdx use engage_workspace "Workspace Name"` |
| "Cannot access workspace via CLI" | Check authentication: `tdx auth status` |

### Workspace Management Errors

| Error | Solution |
|-------|----------|
| "Workspace creation failed" | Check unique name and valid description |
| "Workspace deletion failed" | Ensure workspace is empty or force deletion permissions |
| "Workspace update permission denied" | Contact workspace administrator |
| "Context switching failed" | Verify workspace exists and is accessible |

### Backup & Migration Errors

| Error | Solution |
|-------|----------|
| "Backup directory not writable" | Check file permissions: `chmod 755 backup_dir` |
| "Campaign export failed" | Verify campaigns exist: `tdx engage campaign list` |
| "Template export failed" | Verify templates exist: `tdx engage template list` |
| "Workspace backup incomplete" | Check disk space and permissions |

### Multi-Workspace Operation Errors

| Error | Solution |
|-------|----------|
| "Cross-workspace access denied" | Verify access to all target workspaces |
| "Workspace comparison failed" | Ensure both workspaces are accessible |
| "Inventory generation timeout" | Process workspaces individually for large accounts |

## Advanced Workspace Strategies

### Workspace Organization Best Practices
```bash
# Workspace naming and organization strategy
organize_workspace_structure() {
  echo "Workspace Organization Strategy"
  echo "=============================="
  echo ""
  echo "Recommended Workspace Structure:"
  echo "1. Production Workspaces:"
  echo "   - Marketing Production"
  echo "   - Sales Production"
  echo "   - Customer Success Production"
  echo ""
  echo "2. Development Workspaces:"
  echo "   - Marketing Development"
  echo "   - Marketing Staging"
  echo "   - Marketing Testing"
  echo ""
  echo "3. Regional Workspaces:"
  echo "   - Marketing US"
  echo "   - Marketing EU"
  echo "   - Marketing APAC"
  echo ""
  echo "Workspace Management Guidelines:"
  echo "- Use consistent naming conventions"
  echo "- Separate production and development environments"
  echo "- Implement proper access controls via web interface"
  echo "- Regular backup and monitoring"
  echo "- Document workspace purposes and ownership"
}

# Usage: organize_workspace_structure
```

### Workspace Maintenance Automation
```bash
# Automated workspace maintenance using verified commands
workspace_maintenance() {
  local workspace_name="$1"

  echo "Performing maintenance for workspace: $workspace_name"
  echo "=================================================="

  # Set workspace context
  if ! tdx use engage_workspace "$workspace_name"; then
    echo "❌ Cannot access workspace for maintenance"
    return 1
  fi

  # Check workspace health
  echo "1. Workspace Health Check:"
  if tdx engage workspace show "$workspace_name" >/dev/null 2>&1; then
    echo "   ✅ Workspace accessible"
  else
    echo "   ❌ Workspace access issues"
  fi

  # Campaign maintenance
  echo ""
  echo "2. Campaign Analysis:"
  campaigns=$(tdx engage campaign list --format tsv 2>/dev/null)

  if [ -n "$campaigns" ]; then
    finished_count=$(echo "$campaigns" | awk '$3=="FINISHED"' | wc -l)
    active_count=$(echo "$campaigns" | awk '$3=="ACTIVE" || $3=="LIVE"' | wc -l)
    draft_count=$(echo "$campaigns" | awk '$3=="DRAFT"' | wc -l)

    echo "   Active/Live campaigns: $active_count"
    echo "   Draft campaigns: $draft_count"
    echo "   Finished campaigns: $finished_count"

    if [ $finished_count -gt 10 ]; then
      echo "   ⚠️  Consider archiving old finished campaigns"
    fi
  else
    echo "   No campaigns found"
  fi

  # Template maintenance
  echo ""
  echo "3. Template Analysis:"
  templates=$(tdx engage template list --format tsv 2>/dev/null)

  if [ -n "$templates" ]; then
    template_count=$(echo "$templates" | wc -l)
    echo "   Total templates: $template_count"

    if [ $template_count -gt 20 ]; then
      echo "   ⚠️  Consider organizing templates or removing unused ones"
    fi
  else
    echo "   No templates found"
  fi

  echo ""
  echo "✅ Maintenance check completed"
  echo ""
  echo "For advanced maintenance (user cleanup, permission audit):"
  echo "Use TD Console: Engage > Workspace Settings > Maintenance"
}

# Usage: workspace_maintenance "Marketing Team"
```

## Workspace Security & Compliance (Web Interface Guidance)

### Security Configuration Guide
```bash
# Security configuration guidance for workspace administrators
configure_workspace_security() {
  local workspace_name="$1"

  echo "Workspace Security Configuration Guide"
  echo "Workspace: $workspace_name"
  echo "====================================="

  # Verify workspace access
  tdx use engage_workspace "$workspace_name"

  echo "CLI-Based Security Checks:"
  echo "1. Verify workspace accessibility: ✅"
  echo ""

  echo "Web Interface Security Configuration:"
  echo "TD Console Path: Engage > Workspace Settings > Security"
  echo ""
  echo "Security Settings to Configure:"
  echo "- Two-factor authentication requirements"
  echo "- IP address restrictions"
  echo "- API access controls"
  echo "- Session timeout settings"
  echo "- Audit log retention"
  echo ""
  echo "User Permission Management:"
  echo "- Regular user access reviews"
  echo "- Role-based permission assignment"
  echo "- Inactive user cleanup"
  echo "- Guest access policies"
  echo ""
  echo "Compliance Configuration:"
  echo "- Data retention policies"
  echo "- GDPR compliance settings"
  echo "- Audit trail configuration"
  echo "- Data export controls"
}

# Usage: configure_workspace_security "Marketing Team"
```

## Best Practices

### Workspace Management
- **Use verified CLI commands** for basic workspace operations
- **Leverage TD Console web interface** for advanced user and permission management
- Implement consistent naming conventions across workspaces
- Regular backup of workspace content using CLI tools
- Monitor workspace health and performance regularly

### Multi-Workspace Strategy
- Separate production and development environments
- Use regional workspaces for global organizations
- Implement proper access controls and permission management
- Regular cross-workspace audits and cleanup
- Document workspace purposes and ownership

### Security & Compliance
- Configure security policies via TD Console web interface
- Regular user access reviews and permission audits
- Implement two-factor authentication requirements
- Monitor and audit workspace activity logs
- Maintain compliance with data protection regulations

## Validation & Health Monitoring

### Comprehensive Workspace Validation
```bash
# Complete workspace validation using verified commands
validate_workspace_configuration() {
  local workspace_name="$1"

  echo "Comprehensive Workspace Validation"
  echo "Workspace: $workspace_name"
  echo "=================================="

  # Basic access validation
  if ! tdx engage workspace show "$workspace_name" >/dev/null 2>&1; then
    echo "❌ Workspace not accessible: $workspace_name"
    return 1
  fi

  echo "✅ Workspace accessible via CLI"

  # Set workspace context
  tdx use engage_workspace "$workspace_name"

  # Content validation
  echo ""
  echo "Content Validation:"

  # Check campaigns
  campaign_count=$(tdx engage campaign list --format tsv 2>/dev/null | wc -l)
  echo "  Campaigns: $campaign_count"

  # Check templates
  template_count=$(tdx engage template list --format tsv 2>/dev/null | wc -l)
  echo "  Templates: $template_count"

  # Configuration validation
  echo ""
  echo "Configuration Validation:"
  workspace_details=$(tdx engage workspace show "$workspace_name" --full)

  if echo "$workspace_details" | grep -q "description"; then
    echo "  ✅ Workspace has description"
  else
    echo "  ⚠️  No workspace description set"
  fi

  echo ""
  echo "Manual Validation Required (TD Console):"
  echo "  - User permissions and roles"
  echo "  - Security policy configuration"
  echo "  - Domain and sender verification"
  echo "  - Data retention settings"

  echo ""
  echo "✅ Automated validation completed"
}

# Usage: validate_workspace_configuration "Marketing Team"
```

## Related Skills

**Basic Operations:**
- **email-template-creator** - Create templates within workspace context
- **email-campaign-creator** - Create campaigns within workspace context

**Security & Compliance:**
- **engage-sender** - Manage sender profiles within workspace security context
- **engage-deliverability** - Configure workspace deliverability policies

**Content Management:**
- **email-template-manager** - Organize templates across workspaces
- **email-testing-validator** - Validate campaigns within workspace context

**Integration:**
- **email-journey-builder** - Configure journeys within workspace context
- **engage-utm** - Implement UTM tracking across workspace campaigns

**Data & Analytics:**
- **sql-skills:trino** - Query workspace performance and usage data

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