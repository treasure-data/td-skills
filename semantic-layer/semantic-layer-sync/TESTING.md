# Testing Guide

## Quick Start

### 1. Unit Tests (Recommended)

Run the test suite:
```bash
# Install test dependencies
pip install pytest pytest-cov

# Run tests with coverage
pytest tests/ -v --cov=semantic_layer_sync --cov-report=html

# View coverage report
open htmlcov/index.html
```

### 2. Security Tests

Test SQL injection prevention:
```bash
# Manual test with malicious YAML
cat > test_injection.yaml << 'EOF'
tables:
  db.table:
    fields:
      - name: "test'; DROP TABLE users; --"
        description: "Should fail validation"
EOF

# This should fail with validation error
python semantic_layer_sync.py --config test_injection.yaml --dry-run
```

Expected output:
```
ERROR: Invalid identifier: Contains invalid characters
```

### 3. Integration Tests

#### Setup Test Environment

```bash
# Create test database
tdx query "CREATE DATABASE IF NOT EXISTS test_semantic_layer"

# Create metadata tables
tdx query < 01_create_semantic_database.sql

# Create test data table
tdx query << 'EOF'
CREATE TABLE test_semantic_layer.loyalty_profile (
  customer_id INT,
  email VARCHAR,
  created_at TIMESTAMP
)
EOF
```

#### Run Integration Test

```bash
# Create test config
cat > test_config.yaml << 'EOF'
scope:
  databases:
    - test_semantic_layer
  exclude_patterns: []

definitions:
  data_dictionary_path: test_data_dictionary.yaml
  relationships_path: null
  governance_path: null

semantic_database:
  name: test_semantic_layer
EOF

# Create test data dictionary
cat > test_data_dictionary.yaml << 'EOF'
tables:
  test_semantic_layer.loyalty_profile:
    description: "Test table"
    owner: "test-user"
    fields:
      - name: customer_id
        description: "Customer ID"
        type: int
        tags: ["ID"]
      - name: email
        description: "Email address"
        type: string
        is_pii: true
        pii_category: email
      - name: created_at
        description: "Creation timestamp"
        type: timestamp
        tags: ["timestamp"]

glossary:
  - term: "Customer ID"
    definition: "Unique identifier for a customer"
    owner: "data-team"
EOF

# Run dry-run test
python semantic_layer_sync.py --config test_config.yaml --dry-run -v

# Run with apply (test mode)
python semantic_layer_sync.py --config test_config.yaml --apply --approve -v
```

#### Verify Results

```bash
# Check metadata was inserted
tdx query "SELECT * FROM test_semantic_layer.field_metadata WHERE table_name = 'loyalty_profile' LIMIT 10"

# Check glossary
tdx query "SELECT * FROM test_semantic_layer.glossary"
```

## Test Scenarios

### Scenario 1: Valid YAML

**Input**: Clean, well-formed YAML
```yaml
tables:
  production.users:
    owner: data-team
    fields:
      - name: user_id
        type: bigint
        tags: [ID]
```

**Expected**: ✅ All records inserted successfully

### Scenario 2: Invalid Field Names

**Input**: Field name with SQL keywords
```yaml
fields:
  - name: "DROP TABLE"
```

**Expected**: ❌ Validation error, no records inserted

### Scenario 3: Missing Tables

**Input**: Tables in YAML but not in TD
```yaml
tables:
  nonexistent.table:
    fields:
      - name: col1
```

**Expected**: ⚠️ Warning logged, skipped gracefully

### Scenario 4: Large Batch Operations

**Input**: 10,000+ fields across 100+ tables

**Expected**: ✅ Batched efficiently, detailed progress logging

### Scenario 5: Network Errors

**Input**: TD connection drops during sync

**Expected**: ❌ Structured error, clear retry instructions

### Scenario 6: PII Detection

**Input**: Field with PII markers
```yaml
fields:
  - name: email_address
    is_pii: true
    pii_category: email
```

**Expected**: ✅ Records marked with [PII:email] tag

## Security Test Checklist

- [ ] SQL injection in field names (rejected)
- [ ] SQL injection in descriptions (escaped)
- [ ] SQL injection in tags (escaped)
- [ ] Reserved keywords in identifiers (rejected)
- [ ] Unicode and special characters (escaped)
- [ ] Very long values (truncated safely)
- [ ] Empty/null values (handled gracefully)
- [ ] Concurrent operations (safe with transactions)

## Performance Testing

### Benchmark Test

```bash
# Create large test dataset
python -c "
import yaml
import random

tables = {}
for t in range(50):
    fields = []
    for f in range(200):
        fields.append({
            'name': f'field_{t}_{f}',
            'type': random.choice(['bigint', 'varchar', 'timestamp']),
            'description': f'Test field {f} in table {t}'
        })
    tables[f'db_{t}.table_{t}'] = {
        'owner': 'test',
        'fields': fields
    }

with open('large_test.yaml', 'w') as f:
    yaml.dump({'tables': tables}, f)
"

# Run with timing
time python semantic_layer_sync.py --config test_config.yaml --dry-run -v
```

Expected metrics:
- ✅ < 5 seconds for 10,000 fields (dry-run)
- ✅ < 30 seconds for 10,000 fields (with network calls)

## Continuous Testing

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-cov
      - run: pytest tests/ --cov --cov-report=xml
      - uses: codecov/codecov-action@v2
```

## Troubleshooting Tests

### Import Errors

```bash
# Ensure packages installed
pip install -r requirements.txt

# Verify pytd version
python -c "import pytd; print(pytd.__version__)"
```

### TD Connection Issues

```bash
# Check authentication
tdx auth info

# Verify database access
tdx databases list
```

### Tests Pass Locally, Fail in CI

Check:
- [ ] Python version matches (3.8+)
- [ ] Dependencies pinned in requirements.txt
- [ ] TD_API_KEY set in CI environment
- [ ] No hardcoded paths (use relative paths)

## Test Coverage Goals

- **Target**: 80% overall, 100% for security-critical code
- **Security code**: Input validation, SQL generation
- **Configuration**: Config loading and validation
- **Error handling**: All error paths covered

## Contributing Tests

When submitting PRs:

1. Add tests for new features
2. Include security tests for any SQL generation
3. Ensure tests pass locally: `pytest tests/ -v`
4. Update this guide if adding new test scenarios

---

**Questions?** Open an issue or contact the team.
