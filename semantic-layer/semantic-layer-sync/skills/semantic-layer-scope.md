---
name: semantic-layer-scope
description: Manage database and table selection for semantic layer processing. Use when including/excluding databases, defining processing scope, or filtering tables with patterns.
---

# Semantic Layer Scope Skill

**Focused skill for managing which databases and tables are included in semantic layer metadata processing.**

## Purpose

Configure the `scope` section of semantic layer automation to:
- Include specific databases and tables
- Exclude patterns (temp tables, staging, etc.)
- Define processing boundaries
- Manage multi-environment scopes

## When to Use This Skill

✅ **Use this skill when:**
- "Add the marketing database to semantic layer"
- "Exclude all temp tables from processing"
- "Which databases are currently in scope?"
- "Process only fact and dimension tables"
- "Scope semantic layer to production databases only"

❌ **Don't use this skill for:**
- Adding patterns for metadata generation (use `semantic-layer-patterns`)
- Configuring sync behavior (use `semantic-layer-sync-config`)
- Managing lineage detection sources (use `semantic-layer-lineage`)

## Configuration Section

This skill manages the `scope` section of `config.yaml`:

```yaml
scope:
  databases:
    - name: string              # Database name or pattern
      tables: [string]          # Specific tables (optional)
      all_tables: bool          # Process all tables (optional)
  exclude_patterns:             # Patterns to exclude
    - string                    # Regex patterns
```

## Common Operations

### 1. Add Database to Scope

```yaml
scope:
  databases:
    - name: "gld_cstore"
      all_tables: true
```

**User Request**: "Add gld_cstore database to semantic layer scope"

### 2. Include Specific Tables

```yaml
scope:
  databases:
    - name: "staging_sales"
      tables:
        - orders
        - customers
        - products
```

**User Request**: "Process only orders, customers, and products tables from staging_sales"

### 3. Exclude Patterns

```yaml
scope:
  databases:
    - name: "analytics"
      all_tables: true
  exclude_patterns:
    - ".*_temp$"
    - ".*_backup$"
    - "^test_.*"
```

**User Request**: "Exclude all temp, backup, and test tables from processing"

### 4. Wildcard Patterns

```yaml
scope:
  databases:
    - name: "gld_*"            # All golden layer databases
      all_tables: true
    - name: "prod_*"           # All production databases
      all_tables: true
```

**User Request**: "Process all golden layer and production databases"

### 5. Multi-Environment Setup

```yaml
# Development
scope:
  databases:
    - name: "dev_analytics"
      all_tables: true

# Production
scope:
  databases:
    - name: "gld_*"
      all_tables: true
    - name: "fact_*"
      all_tables: true
    - name: "dim_*"
      all_tables: true
  exclude_patterns:
    - ".*_staging$"
```

**User Request**: "Configure scope for production - include all gld, fact, and dim databases, exclude staging"

## Examples

### Example 1: E-Commerce Data Platform

```yaml
scope:
  databases:
    # Golden layer
    - name: "gld_cstore"
      all_tables: true
    - name: "gld_loyalty"
      all_tables: true

    # Analytics
    - name: "analytics"
      tables:
        - customer_360
        - product_insights
        - sales_summary

  exclude_patterns:
    - ".*_temp$"
    - ".*_test$"
    - ".*_backup$"
```

### Example 2: CDP Parent Segments Only

```yaml
scope:
  databases:
    - name: "parent_segment_*"
      all_tables: true

  exclude_patterns:
    - ".*_behaviors$"          # Exclude behavior tables (too granular)
```

### Example 3: Fact/Dimension Tables

```yaml
scope:
  databases:
    - name: "data_warehouse"
      all_tables: false

  # Use table patterns
  include_patterns:
    - "^fact_.*"               # All fact tables
    - "^dim_.*"                # All dimension tables

  exclude_patterns:
    - ".*_staging$"
    - ".*_raw$"
```

## Validation

The skill validates:
- ✅ Database names are valid
- ✅ Tables exist in specified databases
- ✅ Patterns are valid regex
- ✅ At least one database is specified
- ✅ No conflicting include/exclude patterns

## Testing

### Preview Scope

```bash
# See what will be processed
python semantic_layer_sync.py --config config.yaml --show-scope
```

### Dry-Run on Scope

```bash
# Process scope without applying
python semantic_layer_sync.py --config config.yaml --dry-run
```

## Best Practices

### 1. Start Small
```yaml
# Start with one database
scope:
  databases:
    - name: "gld_cstore"
      tables: [customers, orders]  # Just 2 tables
```

Verify results, then expand to `all_tables: true`

### 2. Use Exclude Patterns
```yaml
# More maintainable than listing all tables
scope:
  databases:
    - name: "analytics"
      all_tables: true
  exclude_patterns:
    - ".*_temp$"
    - ".*_test$"
```

### 3. Separate by Environment
```yaml
# config.dev.yaml
scope:
  databases:
    - name: "dev_*"
      all_tables: true

# config.prod.yaml
scope:
  databases:
    - name: "gld_*"
      all_tables: true
```

### 4. Document Rationale
```yaml
scope:
  databases:
    # Customer data
    - name: "gld_cstore"
      all_tables: true

    # Marketing campaigns
    - name: "gld_marketing"
      all_tables: true

  exclude_patterns:
    - ".*_staging$"   # Staging tables are transient
    - ".*_backup$"    # Backup tables don't need metadata
```

## Performance Considerations

### Scope Size Impact

| Scope | Tables | Processing Time | Recommendation |
|-------|--------|-----------------|----------------|
| 1 database, 10 tables | 10 | 10-30 seconds | ✅ Ideal for testing |
| 3 databases, 100 tables | 100 | 2-5 minutes | ✅ Good for production |
| 10 databases, 1000 tables | 1000 | 15-30 minutes | ⚠️ Consider batching |

### Optimization Tips

1. **Use `sync_mode: delta`** for large scopes
```yaml
sync:
  sync_mode: "delta"           # Only new/changed tables
```

2. **Batch processing**
```yaml
sync:
  batch_size: 50               # Process 50 tables at a time
```

3. **Exclude unnecessary tables**
```yaml
exclude_patterns:
  - ".*_raw$"                  # Raw data doesn't need rich metadata
  - ".*_staging$"              # Staging is transient
```

## Troubleshooting

### No Tables Found

**Problem**: "No tables found matching scope"

**Solution**:
1. Check database name is correct: `tdx databases`
2. Check table names exist: `tdx tables <database>`
3. Verify exclude patterns aren't too broad
4. Use `--show-scope` to debug

### Too Many Tables

**Problem**: Processing taking too long

**Solution**:
1. Add exclude patterns for non-essential tables
2. Use specific table lists instead of `all_tables: true`
3. Enable `sync_mode: delta`
4. Reduce `batch_size`

### Wildcard Not Working

**Problem**: `gld_*` pattern not matching databases

**Solution**:
1. Wildcards only work for database names in `scope.databases[].name`
2. For table-level wildcards, use `include_patterns` (not standard in base config - may need custom)
3. Check database names: `tdx databases | grep gld_`

## Integration

### With Lineage Detection

```yaml
scope:
  databases:
    - name: "gld_cstore"
      all_tables: true

lineage:
  auto_detect:
    - type: "dbt"
      path: "dbt/models/gld_cstore/"  # Match scope
```

### With Validation

```yaml
scope:
  databases:
    - name: "gld_*"
      all_tables: true

validation:
  require_table_description: true    # All in-scope tables need descriptions
```

## CLI Commands

```bash
# Show current scope
python semantic_layer_sync.py --config config.yaml --show-scope

# Test scope with dry-run
python semantic_layer_sync.py --config config.yaml --dry-run

# Process scope
python semantic_layer_sync.py --config config.yaml --apply --approve

# Validate scope config
python semantic_layer_sync.py --config config.yaml --validate-only
```

## Related Skills

- **semantic-layer-patterns** - Define metadata generation patterns
- **semantic-layer-validation** - Set validation rules for in-scope tables
- **semantic-layer-sync-config** - Configure how scope is processed
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
