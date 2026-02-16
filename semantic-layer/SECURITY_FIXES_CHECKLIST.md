# Security Fixes Checklist
## Semantic Layer Projects - Remediation Tracking

**Last Updated**: 2026-02-16

---

## 🚨 CRITICAL - Fix Immediately

### SQL Injection Vulnerabilities
- [ ] **populate_semantic_layer.py** - Replace string concatenation with parameterized queries
  - File: `semantic-layer-sync/populate_semantic_layer.py`
  - Lines: 38-51, 60-64
  - Status: 🔴 VULNERABLE
  - Owner: _____
  - ETA: _____

### Command Injection Vulnerabilities
- [ ] **workflow_generator.py** - Add input validation for project names and paths
  - File: `semantic-layer-sync/workflow_generator.py`
  - Lines: 257-264
  - Status: 🔴 VULNERABLE
  - Owner: _____
  - ETA: _____

- [ ] **tdx-client.js** - Remove shell command injection, use spawn with arrays
  - File: `data-dictionary-helper/src/lib/tdx-client.js`
  - Lines: 27-38
  - Status: 🔴 VULNERABLE
  - Owner: _____
  - ETA: _____

---

## 🔥 HIGH PRIORITY - Fix Within 1 Week

### Authentication & Authorization
- [ ] **Add JWT authentication** to all API endpoints
  - Files: All `backend/api.py` files
  - Status: ⚪ MISSING
  - Owner: _____
  - ETA: _____

- [ ] **Add API key authentication** for service-to-service calls
  - Files: All `backend/api.py` files
  - Status: ⚪ MISSING
  - Owner: _____
  - ETA: _____

### CORS Configuration
- [ ] **Fix CORS settings** - Whitelist specific origins
  - Files:
    - `semantic-layer-metadata-mgmt/backend/api.py`
    - `Semantic-layer-Config-UI/backend/api.py`
  - Line: 16
  - Status: 🟡 MISCONFIGURED
  - Owner: _____
  - ETA: _____

### Path Traversal
- [ ] **Validate file paths** in environment variables
  - File: `Semantic-layer-Config-UI/backend/api.py`
  - Lines: 19, 164, 256
  - Status: 🔴 VULNERABLE
  - Owner: _____
  - ETA: _____

### Rate Limiting
- [ ] **Add rate limiting** to all API endpoints
  - Files: All `backend/api.py` files
  - Status: ⚪ MISSING
  - Owner: _____
  - ETA: _____

### Debug Mode
- [ ] **Disable debug mode** in production
  - Files: All `backend/api.py` files
  - Status: 🟡 RISKY
  - Owner: _____
  - ETA: _____

---

## 🟡 MEDIUM PRIORITY - Fix Within 2 Weeks

### Input Validation
- [ ] **Strengthen identifier validation** regex
  - File: `semantic-layer-sync/semantic_layer_sync.py`
  - Lines: 84-86
  - Status: 🟡 WEAK
  - Owner: _____
  - ETA: _____

- [ ] **Add JSON schema validation** for all POST endpoints
  - Files: All API endpoints accepting JSON
  - Status: ⚪ MISSING
  - Owner: _____
  - ETA: _____

- [ ] **Add request body size limits**
  - Files: All Flask apps
  - Status: ⚪ MISSING
  - Owner: _____
  - ETA: _____

### Error Handling
- [ ] **Sanitize error messages** - Remove sensitive data from logs
  - File: `data-dictionary-helper/src/lib/claude-client.js`
  - Lines: 96-98
  - Status: 🟡 RISKY
  - Owner: _____
  - ETA: _____

- [ ] **Validate API keys exist** before use
  - File: `data-dictionary-helper/src/lib/claude-client.js`
  - Status: 🟡 WEAK
  - Owner: _____
  - ETA: _____

### File Handling
- [ ] **Use secure temp files** with tempfile module
  - File: `Semantic-layer-Config-UI/backend/api.py`
  - Lines: 256-258
  - Status: 🟡 INSECURE
  - Owner: _____
  - ETA: _____

---

## 🔵 LOW PRIORITY - Fix Within 1 Month

### Dependencies
- [ ] **Update Python dependencies**
  ```bash
  pip install --upgrade flask flask-cors pytd pandas pyyaml
  ```
  - Status: 🟡 OUTDATED
  - Owner: _____
  - ETA: _____

- [ ] **Update Node.js dependencies**
  ```bash
  npm audit fix
  ```
  - Status: 🟡 OUTDATED
  - Owner: _____
  - ETA: _____

### Security Headers
- [ ] **Add security headers** to all responses
  - Files: All Flask apps
  - Headers needed:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Content-Security-Policy
  - Status: ⚪ MISSING
  - Owner: _____
  - ETA: _____

### Audit Logging
- [ ] **Add request/response logging**
  - Files: All Flask apps
  - Status: ⚪ MISSING
  - Owner: _____
  - ETA: _____

### Version Control
- [ ] **Create/update .gitignore** for secrets
  - Files: Root of each project
  - Status: 🟡 INCOMPLETE
  - Owner: _____
  - ETA: _____

---

## 📋 Testing Checklist

### Security Testing
- [ ] Run **bandit** on Python code
  ```bash
  bandit -r semantic-layer-sync/
  bandit -r semantic-layer-metadata-mgmt/backend/
  ```

- [ ] Run **npm audit** on Node.js projects
  ```bash
  cd data-dictionary-helper && npm audit
  cd Semantic-layer-Config-UI && npm audit
  ```

- [ ] Run **eslint security plugin** on JavaScript
  ```bash
  npm install --save-dev eslint-plugin-security
  eslint --plugin security src/
  ```

- [ ] Run **OWASP ZAP** API scan
  ```bash
  zap-cli quick-scan http://localhost:5000
  ```

- [ ] Manual **penetration testing**
  - SQL injection testing
  - Command injection testing
  - Path traversal testing
  - CSRF testing
  - Rate limiting testing

### Code Quality
- [ ] Add **unit tests** for critical functions
- [ ] Add **integration tests** for API endpoints
- [ ] Set up **CI/CD security scans**
- [ ] Add **pre-commit hooks** for linting

---

## 📊 Progress Tracking

### Overall Status
- **Critical Issues**: 3 of 3 remaining (0% complete)
- **High Priority**: 6 of 6 remaining (0% complete)
- **Medium Priority**: 6 of 6 remaining (0% complete)
- **Low Priority**: 4 of 4 remaining (0% complete)

### By Project
| Project | Critical | High | Medium | Low | Total |
|---------|----------|------|--------|-----|-------|
| semantic-layer-sync | 1 | 1 | 2 | 1 | 5 |
| data-dictionary-helper | 1 | 1 | 3 | 1 | 6 |
| semantic-layer-metadata-mgmt | 0 | 2 | 1 | 1 | 4 |
| Semantic-layer-Config-UI | 0 | 2 | 1 | 1 | 4 |
| schema-auto-tagger | 1 | 0 | 0 | 0 | 1 |

---

## 🔗 Quick Links

- [Full Security Audit Report](SECURITY_AUDIT_REPORT.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Python Security Best Practices](https://bandit.readthedocs.io/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 📝 Notes

### Deployment Blockers
The following issues MUST be fixed before production deployment:
1. SQL injection in populate_semantic_layer.py
2. Command injection in workflow_generator.py
3. Command injection in tdx-client.js

### Review Schedule
- **Weekly**: Review progress on HIGH priority items
- **Bi-weekly**: Review progress on MEDIUM priority items
- **Monthly**: Review progress on LOW priority items
- **Quarterly**: Full security audit

### Responsible Parties
- **Security Lead**: _____
- **Backend Lead**: _____
- **Frontend Lead**: _____
- **DevOps Lead**: _____

---

*Last reviewed: 2026-02-16*
