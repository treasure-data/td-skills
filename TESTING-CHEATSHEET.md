# Testing Cheat Sheet - Quick Reference

## Installation Commands (Copy-Paste Ready)

### 1. Register Marketplace
```
/plugin marketplace add file:///Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
```

### 2. Verify Marketplace
```
/plugin marketplace list
```

### 3. Install Plugin
```
/plugin install tdx-skills@td-skills
```

### 4. Verify Installation
```
/plugin list
```

---

## Test Prompts (Copy-Paste Ready)

### Test 1: Architecture Understanding
```
Use the consent-management skill to explain TD's consent architecture.
```
**Look for:** "architecture-first", "parent segment attributes", "TD JS SDK"

---

### Test 2: Create Tables
```
Use the consent-management skill to create consent tracking tables for GDPR compliance.
```
**Look for:** `templates/consent-table-ddl.sql`, CREATE TABLE, td_interval(time, '-2y')

---

### Test 3: Parent Segment
```
Use the consent skill to show me how to add consent attributes to my parent segment.
```
**Look for:** `examples/consent-parent-segment.yml`, consent_wide join

---

### Test 4: Preference Center
```
Use the consent-management skill to create a customer preference center with TD JavaScript SDK.
```
**Look for:** `examples/preference-center.html`, consentManager.saveConsent()

---

### Test 5: Email Segment
```
Use the consent skill to create an email marketing segment that respects GDPR consent and expiry.
```
**Look for:** `examples/consent-segment-rules.yml`, TimeWithinPast, 24 months

---

## Success Checklist

For each test, verify:
- [ ] ✅ Skill reads actual files (not generating from scratch)
- [ ] ✅ Uses TD-specific terms (parent segment, tdx, td_interval)
- [ ] ✅ Provides working code (copy-paste ready)
- [ ] ✅ References source files (examples/, templates/, references/)
- [ ] ✅ Explains GDPR/CCPA requirements

---

## Red Flags (Skill NOT Working)

- ❌ Generic CDP advice (not TD-specific)
- ❌ Doesn't mention source files
- ❌ Uses non-TD tools (OneTrust, Segment.io)
- ❌ Missing compliance context
- ❌ Code doesn't match TD patterns

---

## Quick Troubleshooting

**Skill not found:**
```
/plugin list
/plugin install tdx-skills@td-skills
```

**Skill doesn't trigger:**
```
Use the **consent-management skill** to [task]
```

**Want to see a file:**
```
Show me the examples/preference-center.html file from the consent-management skill.
```

---

## Testing Progress Tracker

- [ ] Step 1: Claude Code started
- [ ] Step 2: Marketplace registered
- [ ] Step 3: Plugin installed
- [ ] Step 4: Installation verified
- [ ] Test 1: Architecture (PASS/FAIL)
- [ ] Test 2: Create Tables (PASS/FAIL)
- [ ] Test 3: Parent Segment (PASS/FAIL)
- [ ] Test 4: Preference Center (PASS/FAIL)
- [ ] Test 5: Email Segment (PASS/FAIL)

**Overall:** __/5 tests passed
