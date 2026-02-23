---
name: engage-workspace-advanced
description: Advanced TD Engage workspace management using verified tdx commands for workspace operations and TD Console guidance for user permissions and policies.
---

# Engage Advanced Workspace Management

## Purpose

TD Engage workspace management using CLI operations. User/permission management requires TD Console web interface.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace administrator permissions
- TD Console access for user management

## Workspace Operations (CLI)

### Basic Commands
```bash
# List workspaces
tdx engage workspace list

# Show workspace details
tdx engage workspace show "Marketing Team"
tdx engage workspace show "Marketing Team" --full

# Create workspace
tdx engage workspace create --name "New Workspace" \
  --description "Workspace for marketing campaigns"

# Update workspace
tdx engage workspace update "Marketing Team" \
  --description "Updated workspace description"

# Set workspace context
tdx use engage_workspace "Marketing Team"

# Check current context
tdx use | grep engage_workspace

# Delete workspace (caution)
tdx engage workspace delete "Old Workspace"

# Output formats
tdx engage workspace list --format table
tdx engage workspace list --format tsv
tdx engage workspace list --format json
```

### Workspace Analysis
```bash
# Analyze workspace contents
analyze_workspace() {
  local workspace_name="$1"

  echo "Workspace Analysis: $workspace_name"

  # Set context
  tdx use engage_workspace "$workspace_name"

  # Count campaigns
  campaigns=$(tdx engage campaign list --format tsv | wc -l)
  active=$(tdx engage campaign list --status ACTIVE --format tsv 2>/dev/null | wc -l)
  echo "Campaigns: $campaigns (Active: $active)"

  # Count templates
  templates=$(tdx engage template list --format tsv | wc -l)
  echo "Templates: $templates"

  # Show config
  tdx engage workspace show "$workspace_name" --full
}

# Usage: analyze_workspace "Marketing Team"
```

### Multi-Workspace Inventory
```bash
# List all workspace contents
workspace_inventory() {
  tdx engage workspace list --format tsv | \
    while IFS=$'\t' read -r workspace_id workspace_name; do
      echo "Workspace: $workspace_name"

      if tdx use engage_workspace "$workspace_name" >/dev/null 2>&1; then
        campaigns=$(tdx engage campaign list --format tsv 2>/dev/null | wc -l)
        templates=$(tdx engage template list --format tsv 2>/dev/null | wc -l)
        echo "  Campaigns: $campaigns"
        echo "  Templates: $templates"
        echo "  Status: Accessible"
      else
        echo "  Status: No access"
      fi
      echo ""
    done
}
```

### Workspace Comparison
```bash
# Compare two workspaces
compare_workspaces() {
  local ws1="$1"
  local ws2="$2"

  echo "Workspace Comparison: $ws1 vs $ws2"

  for ws in "$ws1" "$ws2"; do
    echo "Workspace: $ws"
    if tdx use engage_workspace "$ws" >/dev/null 2>&1; then
      campaigns=$(tdx engage campaign list --format tsv 2>/dev/null | wc -l)
      templates=$(tdx engage template list --format tsv 2>/dev/null | wc -l)
      echo "  Campaigns: $campaigns"
      echo "  Templates: $templates"
    else
      echo "  Status: No access"
    fi
  done
}

# Usage: compare_workspaces "Marketing Team" "Sales Team"
```

## User Management (TD Console Only)

**Important**: No CLI user management - use TD Console web interface only.

### User Management Process
1. Navigate to: https://console.treasuredata.com
2. Go to: Engage > Workspace Settings
3. Select workspace
4. Manage Users & Permissions

### Available Operations (Web UI)
- Add users (invite by email)
- Assign roles (Admin, Editor, Viewer)
- Configure permissions
- Remove users
- View user activity

### Permission Roles
| Role | Access |
|------|--------|
| **Admin** | Full access, user management, settings |
| **Editor** | Create/edit campaigns and templates |
| **Viewer** | Read-only access |

## Workspace Policies (TD Console Only)

**Important**: No CLI policy configuration - use TD Console only.

**TD Console Path**: Engage > Workspace Settings > Policies

### Available Policies
- Campaign creation permissions
- Template management permissions
- Approval workflows
- Data retention policies
- API access controls
- Security & compliance settings

## Workspace Analytics

**Note**: Events table has no workspace column. Use `campaign_name` for analytics.
Find database: `tdx databases "*delivery_email*"`

### Campaign Activity by Workspace
```sql
-- Campaign activity metrics
SELECT
  campaign_name,
  COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) as total_emails,
  COUNT(DISTINCT to_plain_address) as unique_recipients,
  DATE(FROM_UNIXTIME(MIN(time))) as first_activity,
  DATE(FROM_UNIXTIME(MAX(time))) as last_activity
FROM {delivery_email_database}.events
WHERE td_interval(time, '-30d')
GROUP BY campaign_name
ORDER BY total_emails DESC
```

### Campaign Performance Comparison
```sql
-- Compare performance across campaigns
SELECT
  campaign_name,
  COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'Open' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'Click' THEN 1 END) as clicked,
  ROUND(COUNT(CASE WHEN event_type = 'Open' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END), 0), 2) as open_rate
FROM {delivery_email_database}.events
WHERE td_interval(time, '-7d')
GROUP BY campaign_name
ORDER BY delivered DESC
```

## TD-Specific Errors

| Error | TD-Specific Solution |
|-------|---------------------|
| "Workspace not found" | Verify name: `tdx engage workspace list` |
| "Permission denied" | Contact workspace admin via TD Console |
| "Context switching failed" | Verify workspace exists and accessible |
| "Cannot create workspace" | Check unique name and admin permissions |
| "User management failed" | No CLI support - use TD Console only |
| "Policy configuration failed" | No CLI support - use TD Console only |

## CLI vs. Web Interface

| Operation | CLI | Web Interface |
|-----------|-----|---------------|
| List workspaces | ✅ `tdx engage workspace list` | ❌ |
| Create workspace | ✅ `tdx engage workspace create` | ❌ |
| Update workspace | ✅ `tdx engage workspace update` | ❌ |
| Delete workspace | ✅ `tdx engage workspace delete` | ❌ |
| User management | ❌ | ✅ Required |
| Permission policies | ❌ | ✅ Required |
| Analytics | ✅ SQL via tdx | ✅ Both |

## TD-Specific Patterns

### Workspace Context
```bash
# Set workspace context for session
tdx use engage_workspace "Marketing Team"

# All subsequent commands use this context
tdx engage campaign list
tdx engage template list

# Check current context
tdx use | grep engage_workspace

# Override context for single command
tdx engage campaign list --workspace "Sales Team"
```

### Naming Conventions
```bash
# Recommended format: "Department - Environment"
tdx engage workspace create --name "Marketing - Production"
tdx engage workspace create --name "Marketing - Development"
tdx engage workspace create --name "Sales - Production"
```

## Important Notes

- **No CLI user management** - all user operations require TD Console
- **No CLI policy configuration** - workspace policies via TD Console only
- **Context persistence** - `tdx use engage_workspace` affects current session
- **Permission inheritance** - workspace permissions apply to all resources
- **Workspace isolation** - campaigns/templates scoped to workspaces

## Related Skills

**Workspace Operations:**
- **email-campaign-creator** - Create campaigns in workspace context
- **email-template-creator** - Create templates in workspace scope
- **email-template-manager** - Organize templates across workspaces

**Monitoring:**
- **sql-skills:trino** - Query workspace performance data
- **engage-deliverability** - Monitor deliverability across workspaces
- **email-testing-validator** - Validate campaigns in workspace context
