---
name: semantic-layer-conflicts
description: Configure conflict resolution and merge strategies for semantic layer updates. Use when handling metadata conflicts, setting merge strategies, or managing concurrent updates.
---

# Semantic Layer Conflicts Skill

**Focused skill for configuring how the semantic layer automation handles conflicts between existing metadata and new auto-generated metadata.**

## Purpose

Configure conflict resolution to:
- Define merge strategies for metadata conflicts
- Handle concurrent updates safely
- Preserve manual overrides
- Manage metadata evolution

## When to Use This Skill

✅ **Use this skill when:**
- "How should conflicts be handled?"
- "Preserve manual description edits"
- "Auto-merge non-conflicting changes"
- "Require approval for description changes"
- "Configure conflict resolution strategy"

❌ **Don't use this skill for:**
- Configuring approval workflows (use `semantic-layer-approval`)
- Setting validation rules (use `semantic-layer-validation`)
- Managing sync behavior (use `semantic-layer-sync-config`)

## Configuration Section

This skill manages the `conflict_resolution` section of `config.yaml`:

```yaml
conflict_resolution:
  strategy: string                       # "manual", "auto_merge", "prefer_existing", "prefer_new"
  preserve_manual_edits: bool           # Preserve manual description edits
  fields_to_preserve: [string]          # Always preserve these fields
  fields_to_auto_merge: [string]        # Auto-merge these fields
  require_approval_for: [string]        # Require approval for changes to these fields
```

## Conflict Resolution Strategies

| Strategy | Behavior | Use Case | Risk |
|----------|----------|----------|------|
| `manual` | Stop and require manual resolution | Critical production data | Low - safest |
| `auto_merge` | Merge non-conflicting, stop on conflicts | Development environments | Medium |
| `prefer_existing` | Keep existing metadata on conflict | Preserve production metadata | Low-Medium |
| `prefer_new` | Overwrite with new metadata on conflict | Fresh starts, rebuilds | High - data loss |

## Conflict Types

### 1. Description Conflicts

**Scenario**: Existing description vs. new auto-generated description

```yaml
# Existing
description: "Customer unique identifier (manually edited)"

# New (auto-generated)
description: "Unique customer ID"

# Conflict!
```

### 2. Tag Conflicts

**Scenario**: Existing tags vs. new auto-generated tags

```yaml
# Existing
tags: ["customer_data", "manually_added"]

# New
tags: ["customer_data", "identifier"]

# Merge or conflict?
```

### 3. Owner Conflicts

**Scenario**: Existing owner vs. new auto-detected owner

```yaml
# Existing
owner: "data-team"

# New (from lineage)
owner: "customer-analytics"

# Which to keep?
```

### 4. Type Conflicts

**Scenario**: Existing data type vs. new detected type

```yaml
# Existing
semantic_type: "dimension"

# New
semantic_type: "metric"

# Type changed?
```

## Common Operations

### 1. Manual Conflict Resolution

```yaml
conflict_resolution:
  strategy: "manual"
  preserve_manual_edits: true
  require_approval_for:
    - description
    - owner
    - pii_category
```

**User Request**: "Require manual approval for all conflicts"

**Behavior**: Stops processing on any conflict, requires review

### 2. Auto-Merge Non-Conflicting

```yaml
conflict_resolution:
  strategy: "auto_merge"
  preserve_manual_edits: true
  fields_to_auto_merge:
    - tags                  # Merge tags (union)
    - semantic_type         # Update type if changed
    - is_nullable          # Update nullability
  fields_to_preserve:
    - description          # Never overwrite descriptions
    - owner               # Never overwrite owners
```

**User Request**: "Auto-merge tags and types, but preserve descriptions and owners"

**Behavior**: Merges non-conflicting fields, stops on description/owner conflicts

### 3. Prefer Existing Metadata

```yaml
conflict_resolution:
  strategy: "prefer_existing"
  preserve_manual_edits: true
  fields_to_auto_merge:
    - tags                  # Add new tags to existing
```

**User Request**: "Keep existing metadata, only add new tags"

**Behavior**: Preserves all existing metadata, only adds new tags

### 4. Prefer New Metadata

```yaml
conflict_resolution:
  strategy: "prefer_new"
  preserve_manual_edits: false
  fields_to_preserve:
    - owner                # Keep existing owners
```

**User Request**: "Overwrite all metadata except owners"

**Behavior**: Overwrites all fields with new values except owner

**⚠️ WARNING**: This can lose manual edits!

### 5. Selective Preservation

```yaml
conflict_resolution:
  strategy: "auto_merge"
  preserve_manual_edits: true
  fields_to_preserve:
    - description
    - owner
    - data_classification
    - pii_category
  fields_to_auto_merge:
    - tags
    - semantic_type
    - lineage_source
    - is_nullable
```

**User Request**: "Preserve critical fields, auto-merge everything else"

**Behavior**: Protects critical fields, auto-updates non-critical fields

### 6. Require Approval for Sensitive Changes

```yaml
conflict_resolution:
  strategy: "auto_merge"
  preserve_manual_edits: true
  require_approval_for:
    - pii_category         # Changing PII category requires approval
    - data_classification  # Changing classification requires approval
    - owner               # Changing owner requires approval
  fields_to_auto_merge:
    - tags
    - semantic_type
    - description
```

**User Request**: "Auto-merge most fields, but require approval for PII, classification, and owner changes"

## Examples

### Example 1: Production Environment (Conservative)

```yaml
conflict_resolution:
  strategy: "prefer_existing"
  preserve_manual_edits: true

  # Only auto-merge these safe fields
  fields_to_auto_merge:
    - tags                  # Add new tags
    - lineage_source       # Update lineage

  # Never touch these
  fields_to_preserve:
    - description
    - owner
    - pii_category
    - data_classification

  # Require approval for these
  require_approval_for:
    - semantic_type        # Type changes need review
```

**Use Case**: Production environment with strict change control

**Behavior**: Very conservative, preserves most existing metadata

### Example 2: Development Environment (Aggressive)

```yaml
conflict_resolution:
  strategy: "prefer_new"
  preserve_manual_edits: false

  # Keep these from existing
  fields_to_preserve:
    - owner

  # Everything else gets overwritten
```

**Use Case**: Development environment, frequent schema changes

**Behavior**: Aggressive updates, minimal preservation

### Example 3: Balanced Approach

```yaml
conflict_resolution:
  strategy: "auto_merge"
  preserve_manual_edits: true

  # Auto-merge these
  fields_to_auto_merge:
    - tags                  # Union of old and new
    - semantic_type         # Update if changed
    - is_nullable          # Update if changed
    - lineage_source       # Update lineage

  # Preserve these
  fields_to_preserve:
    - description          # Only if manually edited
    - owner               # Never change

  # Require approval for these changes
  require_approval_for:
    - pii_category         # PII changes are sensitive
    - data_classification  # Classification changes are sensitive
```

**Use Case**: Production environment with automated updates

**Behavior**: Balances automation with safety

## Conflict Detection

### Manual Edit Detection

The system detects manual edits by tracking:

1. **Edit timestamp**: `last_manual_edit` metadata field
2. **Edit markers**: Special comments or flags in YAML
3. **Edit history**: Git history of data_dictionary.yaml

```yaml
# data_dictionary.yaml
fields:
  - name: customer_id
    description: "Customer unique identifier"
    last_manual_edit: "2026-02-10T15:30:00Z"
    edited_by: "john.doe@company.com"
```

### Conflict Report

```yaml
conflicts:
  - field: "customers.customer_id.description"
    existing: "Customer unique identifier (manually edited)"
    new: "Unique customer ID"
    conflict_type: "manual_edit_conflict"
    last_edited: "2026-02-10"
    edited_by: "john.doe@company.com"

  - field: "orders.amount.semantic_type"
    existing: "dimension"
    new: "metric"
    conflict_type: "type_conflict"
```

## Merge Strategies

### Tag Merging

```yaml
# Union merge (default)
existing_tags: ["customer_data", "manually_added"]
new_tags: ["customer_data", "identifier"]
result: ["customer_data", "manually_added", "identifier"]

# Intersection merge
result: ["customer_data"]

# Replace merge
result: ["customer_data", "identifier"]
```

### Description Merging

```yaml
conflict_resolution:
  description_merge_strategy: "preserve_manual"  # or "append", "replace"

# Preserve manual (default)
existing: "Customer ID (manually edited)"
new: "Unique customer ID"
result: "Customer ID (manually edited)"

# Append
result: "Customer ID (manually edited). Auto-generated: Unique customer ID"

# Replace
result: "Unique customer ID"
```

## Testing

### Preview Conflicts

```bash
# See what conflicts would occur
python semantic_layer_sync.py --config config.yaml --dry-run --show-conflicts
```

### Conflict Resolution Dry-Run

```bash
# Test conflict resolution without applying
python semantic_layer_sync.py --config config.yaml --dry-run --resolve-conflicts
```

### Validate Conflict Config

```bash
# Check conflict resolution config
python semantic_layer_sync.py --config config.yaml --validate-only
```

## Best Practices

### 1. Always Preserve Manual Edits

```yaml
conflict_resolution:
  preserve_manual_edits: true    # ALWAYS set this to true
```

**Why**: Manual edits represent business knowledge that shouldn't be lost

### 2. Use Conservative Strategy in Production

```yaml
# Production config
conflict_resolution:
  strategy: "prefer_existing"    # or "manual"
  preserve_manual_edits: true
```

**Why**: Prevents accidental overwrites of curated metadata

### 3. Test Conflict Resolution

```bash
# Always test with dry-run first
python semantic_layer_sync.py --config config.yaml --dry-run --show-conflicts
```

**Why**: See what would change before applying

### 4. Document Conflict Decisions

```yaml
conflict_resolution:
  strategy: "auto_merge"
  # Rationale: We auto-merge tags and types to keep metadata current,
  # but preserve descriptions and owners to maintain business context.
  # Approved by: Data Governance Committee, 2026-02-15
  fields_to_auto_merge: [tags, semantic_type]
  fields_to_preserve: [description, owner]
```

### 5. Use Approval for Sensitive Changes

```yaml
conflict_resolution:
  require_approval_for:
    - pii_category         # PII changes affect compliance
    - data_classification  # Classification affects access control
    - owner               # Owner changes affect accountability
```

### 6. Monitor Conflict Patterns

```sql
-- Track conflict frequency
SELECT
    field_path,
    conflict_type,
    COUNT(*) as occurrence_count,
    MAX(detected_at) as last_occurrence
FROM semantic_layer_v1.conflicts
GROUP BY field_path, conflict_type
ORDER BY occurrence_count DESC;
```

## Troubleshooting

### Conflicts Not Detected

**Problem**: Expected conflicts not showing up

**Solution**:
1. Check `preserve_manual_edits: true` is set
2. Verify manual edit timestamps exist
3. Check field names match exactly
4. Use `--show-conflicts` to debug

### Too Many Conflicts

**Problem**: Every run generates many conflicts

**Solution**:
1. Review conflict resolution strategy
2. Increase `fields_to_auto_merge` list
3. Check if patterns are too broad
4. Consider using `prefer_existing` strategy

### Manual Edits Being Overwritten

**Problem**: Manual edits are lost despite `preserve_manual_edits: true`

**Solution**:
1. Check manual edit detection is working
2. Verify `fields_to_preserve` includes the field
3. Check strategy isn't `prefer_new`
4. Ensure manual edit markers are present

### Approval Not Required

**Problem**: Changes happening without approval despite `require_approval_for`

**Solution**:
1. Check approval workflow is enabled
2. Verify field names in `require_approval_for` match
3. Check if `--approve` flag is being used
4. Review approval configuration

## Integration

### With Approval Workflows

```yaml
conflict_resolution:
  strategy: "auto_merge"
  require_approval_for:
    - pii_category
    - data_classification
    - owner

approval:
  enabled: true
  require_approval_for_conflicts: true
  approvers: ["data-governance@company.com"]
```

### With Notifications

```yaml
conflict_resolution:
  strategy: "manual"

notifications:
  slack:
    enabled: true
    channel: "#data-governance"
    notify_on_conflicts: true
```

### With Validation

```yaml
conflict_resolution:
  strategy: "auto_merge"
  fields_to_auto_merge: [tags, semantic_type]

validation:
  # Validate after conflict resolution
  validate_after_merge: true
  fail_on_validation_errors: true
```

## CLI Commands

```bash
# Show conflicts (dry-run)
python semantic_layer_sync.py --config config.yaml --dry-run --show-conflicts

# Resolve conflicts interactively
python semantic_layer_sync.py --config config.yaml --resolve-conflicts-interactive

# Apply with conflict resolution
python semantic_layer_sync.py --config config.yaml --apply --approve

# Validate conflict config
python semantic_layer_sync.py --config config.yaml --validate-only

# View conflict history
tdx query "SELECT * FROM semantic_layer_v1.conflicts ORDER BY detected_at DESC LIMIT 50"
```

## Related Skills

- **semantic-layer-approval** - Configure approval workflows for conflicts
- **semantic-layer-notifications** - Get notified of conflicts
- **semantic-layer-sync-config** - Manage sync behavior
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
