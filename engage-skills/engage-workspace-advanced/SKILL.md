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

# Set workspace context (short form)
tdx engage workspace use "Marketing Team"

# Set workspace context (long form, equivalent)
tdx use engage_workspace "Marketing Team"

# Check current context
tdx use | grep engage_workspace

# Delete workspace (caution)
tdx engage workspace delete "Old Workspace"

# Output formats (global flags work on all list commands)
tdx engage workspace list --format table
tdx engage workspace list --format tsv
tdx engage workspace list --format json
```

### Workspace Inventory
```bash
# Analyze contents across workspaces
workspace_inventory() {
  tdx engage workspace list --format tsv | \
    while IFS=$'\t' read -r workspace_id workspace_name; do
      echo "Workspace: $workspace_name"
      if tdx use engage_workspace "$workspace_name" >/dev/null 2>&1; then
        campaigns=$(tdx engage campaign list --format tsv 2>/dev/null | wc -l)
        templates=$(tdx engage template list --format tsv 2>/dev/null | wc -l)
        echo "  Campaigns: $campaigns | Templates: $templates"
      else
        echo "  No access"
      fi
    done
}
```

## User Management (TD Console Only)

**Important**: No CLI user management - use TD Console web interface only.

### Connection & Integration Discovery
```bash
# List data connections available in the account
tdx connection list

# Show details for a specific connection
tdx connection show "Connection Name"

# List available connector types for activations
tdx connection types
```

### User Management Process
1. Navigate to: https://console.treasuredata.com
2. Go to: Engage > Workspace Settings > select workspace
3. Manage Users & Permissions (roles: Admin, Editor, Viewer)

## Workspace Policies (TD Console Only)

**TD Console Path**: Engage > Workspace Settings > Policies

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
| List workspaces | `tdx engage workspace list` | N/A |
| Create workspace | `tdx engage workspace create` | N/A |
| Update workspace | `tdx engage workspace update` | N/A |
| Delete workspace | `tdx engage workspace delete` | N/A |
| Set context | `tdx engage workspace use` | N/A |
| List connections | `tdx connection list` | N/A |
| User management | N/A | Required |
| Permission policies | N/A | Required |
| Analytics | SQL via `tdx query` | Both |

## TD-Specific Patterns

### Naming Conventions
```bash
# Recommended format: "Department - Environment"
tdx engage workspace create --name "Marketing - Production"
tdx engage workspace create --name "Sales - Production"
```

## Related Skills

**Workspace Operations:**
- **email-campaign-creator** - Create campaigns in workspace context
- **email-template-creator** - Create templates in workspace scope
- **email-template-manager** - Organize templates across workspaces

**Monitoring:**
- **sql-skills:trino** - Query workspace performance data
- **engage-deliverability** - Monitor deliverability across workspaces
- **email-testing-validator** - Validate campaigns in workspace context
