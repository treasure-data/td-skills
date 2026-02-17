---
name: engage-workspace-advanced
description: Advanced TD Engage workspace management using verified tdx commands for workspace operations and TD Console guidance for user permissions and policies.
---

# Engage Advanced Workspace Management

## Purpose

Provides guidance for TD Engage workspace management using verified CLI operations and TD Console web interface for advanced features like user management and permissions.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace administrator permissions
- Access to TD Console web interface for user/permission management

## Workspace Management (CLI)

### Basic Workspace Operations
```bash
# List all accessible workspaces
tdx engage workspace list

# Show workspace details
tdx engage workspace show "Marketing Team"

# Get full workspace information
tdx engage workspace show "Marketing Team" --full

# Create new workspace
tdx engage workspace create --name "New Workspace" \
  --description "Workspace for marketing campaigns"

# Update workspace description
tdx engage workspace update "Marketing Team" \
  --description "Updated workspace description"

# Set workspace context for subsequent commands
tdx use engage_workspace "Marketing Team"

# Delete workspace (use with caution)
tdx engage workspace delete "Old Workspace"
```

### Workspace Information Gathering
```bash
# Get workspace details with campaigns and templates
analyze_workspace() {
  local workspace_name="$1"

  echo "Workspace Analysis: $workspace_name"
  echo "================================"

  # Set workspace context
  tdx use engage_workspace "$workspace_name"

  # Campaign analysis
  echo "1. Campaign Analysis:"
  campaigns=$(tdx engage campaign list --format tsv)

  if [ -n "$campaigns" ]; then
    total_campaigns=$(echo "$campaigns" | wc -l)
    active_campaigns=$(echo "$campaigns" | grep "ACTIVE" | wc -l)
    echo "   Total campaigns: $total_campaigns"
    echo "   Active campaigns: $active_campaigns"
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
  tdx engage workspace show "$workspace_name" --full
}

# Usage: analyze_workspace "Marketing Team"
```

### Multi-Workspace Operations
```bash
# Compare workspace contents
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
}

# Usage: compare_workspaces "Marketing Team" "Sales Team"
```

### Workspace Inventory
```bash
# Generate inventory across all accessible workspaces
workspace_inventory() {
  echo "Workspace Inventory Report"
  echo "========================="

  # Get all workspaces
  workspaces=$(tdx engage workspace list --format tsv)

  if [ -z "$workspaces" ]; then
    echo "No workspaces accessible"
    return 1
  fi

  echo "$workspaces" | while read -r workspace_id workspace_name; do
    echo ""
    echo "Workspace: $workspace_name"
    echo "------------------------"

    # Set context and gather data
    if tdx use engage_workspace "$workspace_name" >/dev/null 2>&1; then
      campaigns=$(tdx engage campaign list --format tsv 2>/dev/null | wc -l)
      templates=$(tdx engage template list --format tsv 2>/dev/null | wc -l)

      echo "  Campaigns: $campaigns"
      echo "  Templates: $templates"
      echo "  Status: Accessible"
    else
      echo "  Status: Access denied"
    fi
  done
}
```

## User Management & Permissions (TD Console Only)

### User Management Process
**Important**: User and permission management is **not available via CLI** - use TD Console web interface only.

1. **Navigate to TD Console**: https://console.treasuredata.com
2. **Go to Engage**: Select Engage from navigation menu
3. **Workspace Settings**: Navigate to Engage > Workspace Settings
4. **Select Workspace**: Choose the target workspace
5. **User Management**: Go to Users & Permissions section

### Available User Operations (Web Interface)
- **Add users to workspace** - Invite by email address
- **Assign user roles** - Admin, Editor, Viewer permissions
- **Configure user permissions** - Granular access control
- **Remove users** - Revoke workspace access
- **View user activity** - Monitor user actions and login history

### Permission Roles
| Role | Permissions |
|------|-------------|
| **Admin** | Full workspace access, user management, settings |
| **Editor** | Create/edit campaigns and templates, view analytics |
| **Viewer** | Read-only access to campaigns and reports |

## Workspace Policies & Configuration (TD Console Only)

### Policy Configuration Process
**Important**: Policy configuration is **not available via CLI** - use TD Console web interface only.

**TD Console Path**: Engage > Workspace Settings > Policies

### Available Policy Configurations
- **Campaign creation permissions** - Who can create campaigns
- **Template management permissions** - Template edit access
- **Approval workflows** - Campaign approval requirements
- **Data retention policies** - Data storage and cleanup rules
- **API access controls** - External integration permissions
- **Security & compliance policies** - Data protection settings

## Monitoring & Analytics

### Workspace Usage Analysis
```sql
-- Workspace activity and usage metrics
SELECT
  workspace_name,
  COUNT(DISTINCT campaign_name) as total_campaigns,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as total_emails_sent,
  COUNT(DISTINCT email) as unique_recipients,
  DATE(MIN(time)) as first_activity,
  DATE(MAX(time)) as last_activity
FROM delivery_email_treasuredata_com.events
WHERE td_interval(time, '-30d')
GROUP BY workspace_name
ORDER BY total_emails_sent DESC
```

### Cross-Workspace Performance
```sql
-- Compare performance across workspaces
SELECT
  workspace_name,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked,
  ROUND(COUNT(CASE WHEN event_type = 'opened' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN event_type = 'delivered' THEN 1 END), 0), 2) as open_rate
FROM delivery_email_treasuredata_com.events
WHERE td_interval(time, '-7d')
GROUP BY workspace_name
ORDER BY delivered DESC
```

## Best Practices

### Workspace Organization
- **Use consistent naming conventions**: "Department - Environment" format
- **Separate production and development**: Avoid mixing environments
- **Implement access controls**: Use TD Console for proper user permissions
- **Regular monitoring**: Track workspace usage and performance
- **Documentation**: Document workspace purposes and ownership

### Multi-Workspace Management
- **Centralized user management** via TD Console for consistency
- **Cross-workspace reporting** using SQL queries for analytics
- **Workspace-specific contexts** using `tdx use engage_workspace`
- **Regular inventory audits** to track resources across workspaces

### Security & Compliance
- **Role-based access** through TD Console user management
- **Regular access reviews** - audit user permissions quarterly
- **Policy enforcement** via TD Console workspace policies
- **Activity monitoring** using workspace analytics queries

## Troubleshooting

### Common Issues
| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| Workspace not found | Incorrect name or no access | Check `tdx engage workspace list` |
| Permission denied | Insufficient user permissions | Contact workspace admin via TD Console |
| Context switching failed | Workspace doesn't exist | Verify workspace exists and is accessible |
| Cannot create workspace | Name conflict or permissions | Use unique name, check admin permissions |

### CLI vs. Web Interface
| Operation | CLI Available | Web Interface Required |
|-----------|---------------|----------------------|
| List workspaces | ✅ `tdx engage workspace list` | ❌ |
| Create workspace | ✅ `tdx engage workspace create` | ❌ |
| Update workspace | ✅ `tdx engage workspace update` | ❌ |
| User management | ❌ | ✅ TD Console only |
| Permission policies | ❌ | ✅ TD Console only |
| Analytics/reporting | ✅ SQL queries via tdx | ✅ Both available |

## Important Notes

- **No CLI user management** - all user operations require TD Console web interface
- **No CLI policy configuration** - workspace policies managed via TD Console only
- **Context persistence** - `tdx use engage_workspace` sets context for current session
- **Permission inheritance** - workspace permissions apply to campaigns and templates
- **Workspace isolation** - resources are scoped to individual workspaces

## Related Skills

**Workspace Operations:**
- **email-campaign-creator** - Create campaigns within workspace context
- **email-template-creator** - Create templates within workspace scope

**Monitoring & Analytics:**
- **sql-skills:trino** - Query workspace performance and usage data
- **engage-deliverability** - Monitor deliverability across workspaces

**Content Management:**
- **email-template-manager** - Organize templates across workspaces
- **email-testing-validator** - Validate campaigns within workspace context