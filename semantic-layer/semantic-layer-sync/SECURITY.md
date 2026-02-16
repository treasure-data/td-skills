# Security Policy

## Overview

This document describes the security measures implemented in semantic-layer-sync and best practices for safe usage.

## Critical Security Features

### 1. SQL Injection Prevention

**Status**: ✅ SECURED (Fixed in v1.0.1)

#### Previous Risk
Earlier versions used subprocess calls to execute user-generated SQL, creating injection vulnerabilities:
```python
# ❌ DANGEROUS (OLD CODE)
subprocess.run(['tdx', 'query', '-'], input=user_sql)
```

#### Current Protection
All SQL execution now goes through pytd's secure client:
```python
# ✅ SAFE (NEW CODE)
pytd.Client().query(validated_sql)
```

**Why This is Safer**:
- pytd uses parameterized queries internally
- No shell interpretation of user input
- Proper error handling and logging
- Authentication handled securely

### 2. Input Validation

**Status**: ✅ IMPLEMENTED

All user inputs (from YAML) are validated before SQL generation:

```python
class InputValidator:
    - validate_identifier(): Ensures field/table names are safe
    - sanitize_text(): Escapes strings for SQL literals
    - validate_yaml_field(): Validates complete field definitions
```

**Validation Rules**:
- Identifiers: alphanumeric, underscore, dot only (max 128 chars)
- Text fields: max 1000 chars, no control characters, escaped quotes
- Tags: max 100 chars each
- PII categories: whitelist validation

### 3. Error Handling

**Status**: ✅ IMPROVED

Batch operations now provide detailed error reporting:

```python
class BatchExecutor:
    - Structured error reporting (type, message, context)
    - Separate handling for database vs. connection errors
    - Safe failure without cascade effects
    - Detailed logging for debugging
```

## Best Practices for Users

### Configuration Security

1. **API Keys**: Never commit API keys to Git
   ```bash
   # Export securely
   export TD_API_KEY="$(aws secretsmanager get-secret-value --secret-id td-api-key --query SecretString --output text)"

   # Or use environment files (NOT committed)
   source .env.local
   export TD_API_KEY="your-key-id/your-key-secret"
   ```

2. **YAML Files**: Treat data_dictionary.yaml like source code
   - Review all changes in pull requests
   - Never include credentials
   - Use YAML linting to catch syntax errors

### Runtime Security

1. **Dry-Run First**: Always test changes before applying
   ```bash
   # Preview changes
   python semantic_layer_sync.py --config config.yaml --dry-run

   # Apply only after review
   python semantic_layer_sync.py --config config.yaml --apply --approve
   ```

2. **Audit Trail**: Enable verbose logging to track changes
   ```bash
   python semantic_layer_sync.py --config config.yaml --apply --approve -v
   ```

3. **Least Privilege**: Use TD API keys with minimal permissions
   - Create dedicated service accounts
   - Restrict to required databases/tables
   - Regular key rotation (quarterly recommended)

### YAML Safety

1. **Field Names**: Only use alphanumeric, underscore, dot
   ```yaml
   # ✅ SAFE
   fields:
     - name: customer_id
     - name: email_address

   # ❌ DANGEROUS (will be rejected)
   fields:
     - name: "customer'; DROP TABLE users; --"
   ```

2. **Descriptions**: Any UTF-8 text is allowed
   ```yaml
   # ✅ SAFE (all allowed)
   fields:
     - name: customer_id
       description: |
         Customer identifier - Unicode: 你好 🌍
         Multi-line descriptions allowed
   ```

## Audit & Compliance

### Metadata Logging

All sync operations log:
- ✅ Timestamp of changes
- ✅ Number of records inserted
- ✅ Error details
- ✅ Validation warnings

Logs don't include:
- ❌ API keys or credentials
- ❌ Raw SQL statements
- ❌ User personal data

### Data Retention

- Metadata tables: Permanent (for data governance)
- Logs: 30 days retention recommended
- Failed attempts: Logged with full context

## Known Limitations

### Not Protected Against:
- **Physical access**: If someone gains server access, they can read credentials
- **Privilege escalation**: If TD account is compromised, all data is at risk
- **Network interception**: Always use HTTPS (enforced by pytd)

### Recommended Mitigations**:
- Use VPN/private networks for sensitive operations
- Implement IP whitelisting in Treasure Data
- Enable MFA for TD portal access
- Rotate API keys quarterly
- Monitor audit logs for suspicious activity

## Reporting Security Issues

**Do NOT** open public GitHub issues for security vulnerabilities.

Instead:
1. Email security@treasuredata.com with details
2. Include affected version and reproduction steps
3. Allow 90 days for fix before public disclosure

## Version History

### v1.0.1 (2026-02-15) - CRITICAL SECURITY FIX
- ✅ Replaced subprocess with pytd.Client (prevents SQL injection)
- ✅ Added InputValidator for all YAML fields
- ✅ Improved error handling with structured failure reporting
- ✅ Added SECURITY.md and best practices documentation

### v1.0.0 (Initial Release)
- Basic functionality for metadata sync
- Vulnerable to SQL injection via subprocess calls

## Compliance

This tool is designed to help with:
- ✅ GDPR compliance (PII detection and marking)
- ✅ Data governance frameworks (metadata tracking)
- ✅ Audit requirements (operation logging)

Not designed for:
- ❌ HIPAA (would need additional encryption at rest)
- ❌ FedRAMP (would need government cloud deployment)
- ❌ PCI-DSS (not a payment system)

## Questions?

Contact the Treasure Data team or open a discussion on GitHub Issues (non-security topics only).
