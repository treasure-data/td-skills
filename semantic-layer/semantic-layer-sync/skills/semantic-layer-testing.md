---
name: semantic-layer-testing
description: Configure test mode and development settings for semantic layer automation. Use when setting up test environments, configuring dry-run behavior, or managing development/testing workflows.
---

# Semantic Layer Testing Skill

**Focused skill for configuring test mode, dry-run behavior, and development settings for semantic layer automation.**

## Purpose

Configure testing and development to:
- Enable test mode for safe experimentation
- Configure dry-run behavior
- Set up test databases and fixtures
- Manage development workflows
- Test configurations before production

## When to Use This Skill

✅ **Use this skill when:**
- "Enable test mode for semantic layer"
- "Configure dry-run to preview changes"
- "Set up test database for development"
- "Test metadata generation patterns"
- "Validate configuration before production"

❌ **Don't use this skill for:**
- Configuring production sync (use `semantic-layer-sync-config`)
- Setting validation rules (use `semantic-layer-validation`)
- Managing notifications (use `semantic-layer-notifications`)

## Configuration Section

This skill manages the `testing` section of `config.yaml`:

```yaml
testing:
  enabled: bool                        # Enable test mode
  test_database: string               # Test database name
  test_tables: [string]               # Specific tables for testing
  test_sample_size: int               # Sample N tables
  dry_run_by_default: bool
  dry_run_output: string              # "console", "file", "both"
  dry_run_output_file: string
  preserve_test_data: bool
  cleanup_after_test: bool
  mock_external_services: bool
  test_fixtures_path: string
  validation_only: bool               # Only validate, don't process
```

## Test Modes

| Mode | Behavior | Data Changes | Use Case |
|------|----------|--------------|----------|
| `dry-run` | Preview changes without applying | None | Review before apply |
| `test` | Apply to test database only | Test DB only | Safe experimentation |
| `validation-only` | Check config, don't process | None | Config validation |
| `sample` | Process sample of tables | Production | Performance testing |

## Common Operations

### 1. Basic Dry-Run Configuration

```yaml
testing:
  enabled: true
  dry_run_by_default: true
  dry_run_output: "both"              # Console and file
  dry_run_output_file: "dry_run_results.yaml"
```

**User Request**: "Enable dry-run mode and save results to file"

### 2. Test Database Setup

```yaml
testing:
  enabled: true
  test_database: "semantic_layer_test"
  test_tables:
    - customers.users_test
    - orders.orders_test
  preserve_test_data: true
  cleanup_after_test: false
```

**User Request**: "Set up test database with specific test tables"

### 3. Sample Testing

```yaml
testing:
  enabled: true
  test_sample_size: 10                # Test with 10 tables
  test_sample_strategy: "random"      # or "first", "representative"
  dry_run_by_default: false
  test_database: "production"         # Test on production sample
```

**User Request**: "Test with 10 random tables from production"

### 4. Mock External Services

```yaml
testing:
  enabled: true
  mock_external_services: true
  mocks:
    slack:
      enabled: true
      capture_notifications: true
    email:
      enabled: true
      capture_emails: true
    api_calls:
      enabled: true
      response_fixtures: "test/fixtures/api_responses.yaml"
```

**User Request**: "Mock Slack and email for testing"

### 5. Validation-Only Mode

```yaml
testing:
  enabled: true
  validation_only: true               # Only validate config
  validate_patterns: true
  validate_scope: true
  validate_lineage: true
  validate_all: true
```

**User Request**: "Only validate configuration, don't process any data"

### 6. Development Environment

```yaml
testing:
  enabled: true
  test_database: "dev_semantic_layer"
  dry_run_by_default: true
  preserve_test_data: true
  cleanup_after_test: false
  verbose_output: true
  debug_mode: true
```

**User Request**: "Configure development environment with debugging"

## Examples

### Example 1: Development Environment

```yaml
# config.dev.yaml
testing:
  enabled: true
  test_database: "dev_semantic_layer"
  test_tables:
    - test_customers.users
    - test_orders.orders
    - test_products.catalog

  # Dry-run by default
  dry_run_by_default: true
  dry_run_output: "both"
  dry_run_output_file: "dev_dry_run.yaml"

  # Preserve data for debugging
  preserve_test_data: true
  cleanup_after_test: false

  # Mock external services
  mock_external_services: true
  mocks:
    slack:
      enabled: true
      capture_notifications: true
    email:
      enabled: true
      capture_emails: true

  # Debug output
  verbose_output: true
  debug_mode: true
  log_level: "DEBUG"

# Minimal scope for testing
scope:
  databases:
    - name: "test_*"
      all_tables: true

# Relaxed validation
validation:
  fail_on_errors: false
  warn_only: true
```

**Use Case**: Local development environment for safe experimentation

### Example 2: Pre-Production Testing

```yaml
# config.preprod.yaml
testing:
  enabled: true
  test_database: "preprod_semantic_layer"

  # Test with production sample
  test_sample_size: 50
  test_sample_strategy: "representative"

  # Dry-run first, then apply
  dry_run_by_default: false
  validation_only: false

  # Mock notifications but not data
  mock_external_services: true
  mocks:
    slack:
      enabled: false              # Use real Slack
    email:
      enabled: true               # Mock email
    api_calls:
      enabled: false              # Use real APIs

  # Preserve for review
  preserve_test_data: true
  cleanup_after_test: false

# Production-like scope
scope:
  databases:
    - name: "gld_*"
      all_tables: true

# Strict validation
validation:
  fail_on_errors: true
  require_table_description: true
```

**Use Case**: Pre-production testing with production-like data

### Example 3: CI/CD Pipeline Testing

```yaml
# config.ci.yaml
testing:
  enabled: true
  test_database: "ci_test_semantic_layer"

  # Use test fixtures
  test_fixtures_path: "tests/fixtures"
  test_tables:
    - fixture_customers.users
    - fixture_orders.orders

  # Validation only
  validation_only: true
  validate_all: true

  # Mock everything
  mock_external_services: true
  mocks:
    slack:
      enabled: true
    email:
      enabled: true
    database:
      enabled: true
      use_fixtures: true

  # Clean up after
  cleanup_after_test: true
  preserve_test_data: false

  # CI-specific
  fail_fast: true
  exit_on_error: true
  log_level: "ERROR"
```

**Use Case**: Automated CI/CD pipeline testing

## Dry-Run Output

### Console Output

```yaml
testing:
  dry_run_output: "console"
```

```
DRY-RUN RESULTS
===============

Changes to be applied:
----------------------

customers.email
  Action: Update field metadata
  Changes:
    - pii_category: None → email
    - tags: [] → [pii, contact_info, gdpr]
    - is_pii: false → true

customers.phone
  Action: Update field metadata
  Changes:
    - pii_category: None → phone
    - tags: [] → [pii, contact_info, gdpr]
    - is_pii: false → true

orders.billing_address
  Action: Update field metadata
  Changes:
    - pii_category: None → address
    - tags: [] → [pii, location, gdpr]
    - data_classification: Internal → Confidential

Summary:
--------
Total fields: 42
Fields to update: 3
New PII fields: 3
Conflicts: 0
Validation errors: 0
```

### File Output

```yaml
# dry_run_results.yaml
dry_run:
  timestamp: "2026-02-16T14:30:00Z"
  config_file: "config.yaml"
  mode: "delta"

changes:
  - field_path: "customers.email"
    action: "update"
    changes:
      pii_category:
        old: null
        new: "email"
      tags:
        old: []
        new: ["pii", "contact_info", "gdpr"]
      is_pii:
        old: false
        new: true
    confidence: 95

  - field_path: "customers.phone"
    action: "update"
    changes:
      pii_category:
        old: null
        new: "phone"
      tags:
        old: []
        new: ["pii", "contact_info", "gdpr"]
      is_pii:
        old: false
        new: true
    confidence: 95

summary:
  total_fields: 42
  fields_to_update: 3
  new_pii_fields: 3
  conflicts: 0
  validation_errors: 0
```

## Test Fixtures

### Database Fixtures

```yaml
# tests/fixtures/databases.yaml
databases:
  - name: "fixture_customers"
    tables:
      - name: "users"
        columns:
          - name: "user_id"
            type: "INTEGER"
          - name: "email"
            type: "VARCHAR"
          - name: "phone"
            type: "VARCHAR"

  - name: "fixture_orders"
    tables:
      - name: "orders"
        columns:
          - name: "order_id"
            type: "INTEGER"
          - name: "user_id"
            type: "INTEGER"
          - name: "amount"
            type: "DECIMAL"
```

### API Response Fixtures

```yaml
# tests/fixtures/api_responses.yaml
api_responses:
  - endpoint: "/api/metadata/customers.users"
    method: "GET"
    response:
      status: 200
      body:
        table: "users"
        database: "customers"
        columns: [...]

  - endpoint: "/api/lineage/customers.users"
    method: "GET"
    response:
      status: 200
      body:
        upstream: [...]
        downstream: [...]
```

## Testing Commands

### Dry-Run

```bash
# Basic dry-run
python semantic_layer_sync.py --config config.yaml --dry-run

# Dry-run with output file
python semantic_layer_sync.py --config config.yaml --dry-run --output dry_run.yaml

# Dry-run with verbose output
python semantic_layer_sync.py --config config.yaml --dry-run --verbose
```

### Validation Only

```bash
# Validate configuration
python semantic_layer_sync.py --config config.yaml --validate-only

# Validate specific section
python semantic_layer_sync.py --config config.yaml --validate-section scope

# Validate patterns
python semantic_layer_sync.py --config config.yaml --validate-patterns
```

### Test with Sample

```bash
# Test with 10 random tables
python semantic_layer_sync.py --config config.yaml --test-sample 10

# Test with specific table
python semantic_layer_sync.py --config config.yaml --test-table customers.users

# Test with specific database
python semantic_layer_sync.py --config config.yaml --test-database test_customers
```

### Run Test Suite

```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_semantic_layer.py

# Run with coverage
python -m pytest --cov=semantic_layer tests/
```

## Best Practices

### 1. Always Dry-Run First

```yaml
testing:
  dry_run_by_default: true           # ALWAYS in dev/test
```

```bash
# Production workflow
python semantic_layer_sync.py --config config.yaml --dry-run
# Review output
python semantic_layer_sync.py --config config.yaml --apply --approve
```

### 2. Use Test Database for Development

```yaml
# config.dev.yaml
testing:
  enabled: true
  test_database: "dev_semantic_layer"
  preserve_test_data: true
```

**Why**: Prevents accidentally modifying production metadata

### 3. Mock External Services in Tests

```yaml
testing:
  mock_external_services: true
  mocks:
    slack: {enabled: true}
    email: {enabled: true}
```

**Why**: Tests run faster and don't require external dependencies

### 4. Use Representative Samples

```yaml
testing:
  test_sample_size: 50
  test_sample_strategy: "representative"  # Not random
```

**Why**: Tests reflect production diversity

### 5. Preserve Test Data for Debugging

```yaml
testing:
  preserve_test_data: true
  cleanup_after_test: false           # In dev
```

### 6. Test Configuration Before Production

```bash
# Test in dev
python semantic_layer_sync.py --config config.dev.yaml --apply

# Validate prod config
python semantic_layer_sync.py --config config.prod.yaml --validate-only

# Dry-run prod config on test data
python semantic_layer_sync.py --config config.prod.yaml --test-database test_db --dry-run

# Apply to prod
python semantic_layer_sync.py --config config.prod.yaml --apply --approve
```

## Troubleshooting

### Dry-Run Output Not Showing

**Problem**: Dry-run not displaying results

**Solution**:
1. Check `dry_run_output` is set to "console" or "both"
2. Verify `dry_run_by_default: true`
3. Check log level isn't filtering output
4. Use `--verbose` flag
5. Check output file path if using file output

### Test Database Not Created

**Problem**: Test database doesn't exist

**Solution**:
1. Create test database manually first
2. Check database permissions
3. Verify database name in config
4. Check connection string
5. Review database creation logs

### Tests Failing in CI

**Problem**: Tests pass locally but fail in CI

**Solution**:
1. Check environment variables are set in CI
2. Verify test fixtures are in repo
3. Check database is available in CI
4. Review CI logs for errors
5. Ensure dependencies are installed
6. Check for hardcoded paths

### Mock Services Not Working

**Problem**: External services being called despite mocking

**Solution**:
1. Verify `mock_external_services: true`
2. Check specific service mocks are enabled
3. Review mock configuration
4. Check test isolation
5. Verify mock library is installed

## Integration

### With CI/CD

```yaml
# .github/workflows/test.yml
name: Test Semantic Layer

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Validate config
        run: python semantic_layer_sync.py --config config.prod.yaml --validate-only
      - name: Run tests
        run: pytest tests/
```

### With Pre-Commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: validate-config
        name: Validate semantic layer config
        entry: python semantic_layer_sync.py --config config.yaml --validate-only
        language: system
        pass_filenames: false
```

### With Monitoring

```yaml
testing:
  enabled: true
  test_sample_size: 10

monitoring:
  enabled: true
  metrics:
    - test_execution_time
    - test_success_rate
    - validation_errors
```

## Test Coverage

### Unit Tests

```python
# tests/test_patterns.py
def test_email_pattern_detection():
    """Test email field detection"""
    field_name = "customer_email"
    result = detect_pattern(field_name)
    assert result.pii_category == "email"
    assert "pii" in result.tags
```

### Integration Tests

```python
# tests/test_integration.py
def test_full_sync_flow():
    """Test complete sync workflow"""
    config = load_config("config.test.yaml")
    result = run_sync(config, dry_run=True)
    assert result.status == "success"
    assert len(result.changes) > 0
```

### End-to-End Tests

```bash
# tests/e2e/test_workflow.sh
#!/bin/bash
set -e

# Validate config
python semantic_layer_sync.py --config config.yaml --validate-only

# Dry-run
python semantic_layer_sync.py --config config.yaml --dry-run

# Apply to test DB
python semantic_layer_sync.py --config config.yaml --test-database test_db --apply

# Verify results
tdx query "SELECT COUNT(*) FROM test_semantic_layer_v1.field_metadata WHERE is_pii = 1"
```

## CLI Commands

```bash
# Dry-run (preview changes)
python semantic_layer_sync.py --config config.yaml --dry-run

# Dry-run with output file
python semantic_layer_sync.py --config config.yaml --dry-run --output results.yaml

# Validate configuration only
python semantic_layer_sync.py --config config.yaml --validate-only

# Test with specific table
python semantic_layer_sync.py --config config.yaml --test-table customers.users

# Test with sample
python semantic_layer_sync.py --config config.yaml --test-sample 10

# Test with test database
python semantic_layer_sync.py --config config.yaml --test-database test_semantic_layer --apply

# Verbose output
python semantic_layer_sync.py --config config.yaml --dry-run --verbose

# Debug mode
python semantic_layer_sync.py --config config.yaml --dry-run --debug

# Run unit tests
python -m pytest tests/

# Run with coverage
python -m pytest --cov=semantic_layer --cov-report=html tests/
```

## Related Skills

- **semantic-layer-sync-config** - Configure sync behavior for testing
- **semantic-layer-validation** - Validate test results
- **semantic-layer-scope** - Define test scope
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
