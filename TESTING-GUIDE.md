# Local Testing Guide - Consent Management Skill

Complete step-by-step guide to test the consent-management skill locally.

## Prerequisites

- Claude Code CLI installed
- Local td-skills repository cloned

---

## Step 1: Verify Skill Files

Run the validation script:

```bash
cd /Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
./tdx-skills/consent-management/test-skill.sh
```

**Expected Output:**
```
✅ All tests passed!
```

---

## Step 2: Register Local Marketplace

In a **new Claude Code session**, register the local td-skills marketplace:

```
/plugin marketplace add file:///Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
```

**Expected Response:**
```
Marketplace "td-skills" added successfully
```

---

## Step 3: List Available Plugins

Check that tdx-skills is available:

```
/plugin marketplace list
```

**Expected Output:**
```
Available marketplaces:
- td-skills (file:///Users/...)
```

Then browse plugins:

```
/plugin marketplace browse td-skills
```

**Expected Output:**
Should show:
- sql-skills
- realtime-skills
- **tdx-skills** ← This one includes consent-management
- workflow-skills
- etc.

---

## Step 4: Install tdx-skills Plugin

Install the plugin containing consent-management:

```
/plugin install tdx-skills@td-skills
```

**Expected Response:**
```
Plugin "tdx-skills" installed successfully
Installed skills:
- tdx-basic
- parent-segment
- segment
- consent-management  ← Should appear here
- ... (other skills)
```

---

## Step 5: Verify Installation

List installed plugins:

```
/plugin list
```

**Expected Output:**
```
Installed plugins:
- tdx-skills
  - tdx-basic
  - parent-segment
  - segment
  - consent-management
  - ...
```

---

## Step 6: Test Skill Invocation

Now test the skill with these prompts:

### Test 1: Basic Invocation

**Prompt:**
```
Use the consent-management skill to help me understand TD's consent architecture.
```

**What to Look For:**
- ✅ Claude mentions "architecture-first" approach
- ✅ References parent segment attributes
- ✅ Mentions TD JS SDK with Consent Manager
- ✅ Explains centralized storage vs. external CMP

---

### Test 2: Create Consent Tables

**Prompt:**
```
Use the consent-management skill to create the database tables for GDPR consent tracking.
```

**What to Look For:**
- ✅ Reads `templates/consent-table-ddl.sql`
- ✅ Shows CREATE TABLE for consent_tracking
- ✅ Shows consent_wide VIEW with ROW_NUMBER()
- ✅ Includes td_interval(time, '-2y') for GDPR expiry
- ✅ Explains immutable event log pattern

**Verify File Reference:**
Ask follow-up: "Which file did you reference?"
Expected: `templates/consent-table-ddl.sql`

---

### Test 3: Parent Segment Configuration

**Prompt:**
```
Use the consent skill to show me how to add consent attributes to my parent segment configuration.
```

**What to Look For:**
- ✅ Reads `examples/consent-parent-segment.yml`
- ✅ Shows attributes section with consent_wide join
- ✅ Includes columns: email_marketing_consent, sms_consent, consent_updated_at
- ✅ Explains join on customer_id

**Verify File Reference:**
The response should include or reference:
```yaml
attributes:
  - name: "Consent Preferences"
    source:
      database: customer_db
      table: consent_wide
```

---

### Test 4: Build Preference Center

**Prompt:**
```
Use the consent-management skill to create a customer preference center with TD JavaScript SDK.
```

**What to Look For:**
- ✅ Reads `examples/preference-center.html`
- ✅ Shows complete HTML template
- ✅ TD SDK initialization code
- ✅ consentManager.configure() and saveConsent() methods
- ✅ Privacy controls (setAnonymousMode, blockEvents)

**Verify File Reference:**
Ask: "Show me the complete preference-center.html file"
Expected: Should display or reference the full HTML file

---

### Test 5: Privacy-Compliant Segment

**Prompt:**
```
Use the consent skill to create an email marketing segment that respects GDPR consent and expiry rules.
```

**What to Look For:**
- ✅ Reads `examples/consent-segment-rules.yml`
- ✅ Shows segment YAML with:
  - email_marketing_consent = 'given'
  - TimeWithinPast operator with 24 months
  - unit: month
- ✅ Explains GDPR 24-month renewal requirement

**Verify TD-Specific Pattern:**
The segment should use TD operators like:
```yaml
operator:
  type: TimeWithinPast
  value: 24
  unit: month
```

---

### Test 6: DSAR - Data Export

**Prompt:**
```
Use the consent-management skill to export all data for customer ID "cust_12345" for a GDPR access request.
```

**What to Look For:**
- ✅ Reads `examples/dsar-export.sql`
- ✅ Shows SELECT with LEFT JOINs
- ✅ Includes customers, consent_wide, purchase_summary, behavioral_summary
- ✅ Mentions 30-day GDPR timeline
- ✅ Suggests archiving for audit trail

---

### Test 7: DSAR - Data Deletion

**Prompt:**
```
Use the consent skill to anonymize customer data for GDPR right to deletion request.
```

**What to Look For:**
- ✅ Shows UPDATE statement for anonymization
- ✅ Sets email to 'deleted_...@anonymized.com'
- ✅ Sets first_name/last_name to 'DELETED'
- ✅ Sets gdpr_deleted = TRUE
- ✅ Suggests workflow for multi-table deletion
- ✅ References `references/dsar-workflows.md`

---

### Test 8: Compliance Validation Workflow

**Prompt:**
```
Use the consent-management skill to create a workflow that validates consent before email activations.
```

**What to Look For:**
- ✅ Reads `templates/consent-sync-workflow.dig`
- ✅ Shows Digdag workflow YAML
- ✅ Includes +validate_consent step
- ✅ Uses if> condition to check compliance
- ✅ Blocks activation if invalid consents found

---

### Test 9: Reference Documentation

**Prompt:**
```
Use the consent skill to explain the difference between GDPR and CCPA consent requirements.
```

**What to Look For:**
- ✅ Reads `references/consent-categories.md`
- ✅ Explains GDPR opt-in vs CCPA opt-out
- ✅ Shows expiration timelines (24 vs 12 months)
- ✅ References specific articles (GDPR Article 6(1)(a))

---

### Test 10: SDK Integration Details

**Prompt:**
```
Use the consent-management skill to show me all TD JavaScript SDK consent methods.
```

**What to Look For:**
- ✅ Reads `references/sdk-integration.md`
- ✅ Lists consentManager methods
- ✅ Shows privacy controls (setAnonymousMode, blockEvents, resetUUID)
- ✅ Includes regional endpoint configuration

---

## Verification Checklist

After running all tests, verify:

### File References
- [ ] Skill reads from `examples/` directory
- [ ] Skill reads from `templates/` directory
- [ ] Skill reads from `references/` directory
- [ ] Skill references SKILL.md for core patterns

### TD-Specific Patterns
- [ ] Uses `td_interval()` function
- [ ] References parent segments (not generic tables)
- [ ] Uses `tdx` CLI commands
- [ ] Shows TD JS SDK (not generic JavaScript)
- [ ] Uses TD segment operators (TimeWithinPast, Equal, etc.)

### Content Quality
- [ ] Provides working, copy-paste-ready code
- [ ] Explains GDPR/CCPA compliance requirements
- [ ] Includes TD-specific best practices
- [ ] References appropriate documentation files
- [ ] Doesn't hallucinate non-existent features

### Skill Behavior
- [ ] Triggers on "consent-management skill" or "consent skill"
- [ ] Doesn't provide generic CDP advice
- [ ] Uses Treasure Data terminology
- [ ] Provides complete examples (not partial snippets)

---

## Troubleshooting

### Skill Not Found

**Issue:** `/plugin install tdx-skills@td-skills` fails

**Solution:**
1. Verify marketplace is added:
   ```
   /plugin marketplace list
   ```
2. Check marketplace path is correct:
   ```
   file:///Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
   ```
3. Verify marketplace.json exists:
   ```bash
   ls -la /Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills/.claude-plugin/marketplace.json
   ```

---

### Skill Doesn't Trigger

**Issue:** Prompts don't invoke the skill

**Solutions:**
1. Use explicit trigger: "Use the **consent-management skill** to..."
2. Include "skill" keyword in prompt
3. Verify skill is installed: `/plugin list`
4. Try alternative name: "Use the **consent skill** to..."

---

### Generic Responses (Not TD-Specific)

**Issue:** Skill provides generic CDP advice instead of TD patterns

**Solutions:**
1. Be more explicit: "Use TD parent segments" or "Use tdx CLI"
2. Ask for specific file: "Show me the consent-parent-segment.yml example"
3. Reference TD features: "Use TD JavaScript SDK Consent Manager"

---

### File Not Referenced

**Issue:** Skill generates code instead of reading example files

**Solutions:**
1. Ask directly: "Read the examples/preference-center.html file"
2. Verify file exists:
   ```bash
   ls -la tdx-skills/consent-management/examples/
   ```
3. Check SKILL.md references the file correctly

---

## Success Criteria

The skill is working correctly if:

✅ **File-Based**: Reads examples, templates, and references (not generating from scratch)
✅ **TD-Specific**: Uses TD terminology, tools, and patterns
✅ **Compliant**: Explains GDPR/CCPA requirements accurately
✅ **Actionable**: Provides copy-paste-ready code
✅ **Complete**: References full implementations, not partial snippets
✅ **Documented**: Points to relevant files for deeper learning

---

## Next Steps After Testing

Once local testing is complete:

1. **Document Test Results**
   - Note which prompts worked best
   - Identify any gaps or issues
   - Suggest improvements

2. **Prepare for Contribution**
   - Create feature branch
   - Commit all files
   - Write PR description

3. **Share with Team**
   - Demo the skill internally
   - Get feedback from TD users
   - Iterate based on feedback

---

## Quick Test Commands

Run all tests quickly:

```bash
# Validate skill structure
./tdx-skills/consent-management/test-skill.sh

# In Claude Code session:
/plugin marketplace add file:///Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
/plugin install tdx-skills@td-skills
/plugin list

# Test basic invocation
Use the consent-management skill to help me understand TD's consent architecture.

# Test file reference
Use the consent skill to create consent tracking tables.
```

---

## Report Template

After testing, fill out this report:

```
# Consent Management Skill - Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** Claude Code [version]

## Installation
- [ ] Marketplace registration successful
- [ ] Plugin installation successful
- [ ] Skill appears in /plugin list

## Test Results

### Test 1: Create Consent Tables
- Status: [ ] Pass / [ ] Fail
- Notes:

### Test 2: Parent Segment Configuration
- Status: [ ] Pass / [ ] Fail
- Notes:

### Test 3: Preference Center
- Status: [ ] Pass / [ ] Fail
- Notes:

[... continue for all tests]

## Overall Assessment
- File References: [ ] Good / [ ] Needs Work
- TD-Specific Patterns: [ ] Good / [ ] Needs Work
- Content Quality: [ ] Good / [ ] Needs Work

## Recommendations
1.
2.
3.

## Ready for Contribution?
[ ] Yes / [ ] No (explain why)
```
