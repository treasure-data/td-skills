# Consent Management Skill - Test Prompts

Test the consent-management skill with these prompts in Claude Code.

## Setup Instructions

1. **Register local marketplace** (only needed once):
   ```
   /plugin marketplace add file:///Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
   ```

2. **Install tdx-skills plugin**:
   ```
   /plugin install tdx-skills
   ```

3. **Verify installation**:
   ```
   /plugin list
   ```
   Should show `tdx-skills` with consent-management included.

---

## Test Cases

### Test 1: Create Consent Tables

**Prompt:**
```
Use the consent-management skill to help me create the database tables for GDPR consent tracking.
```

**Expected Behavior:**
- Claude reads `templates/consent-table-ddl.sql`
- Provides CREATE TABLE statements for:
  - consent_tracking
  - email_preferences
  - sms_preferences
  - privacy_settings
  - consent_wide view
- Explains the schema structure

**Success Criteria:**
- ✅ References `templates/consent-table-ddl.sql`
- ✅ Explains consent_tracking immutable log pattern
- ✅ Shows consent_wide view with ROW_NUMBER() for latest status
- ✅ Includes td_interval(time, '-2y') for GDPR 24-month expiry

---

### Test 2: Configure Parent Segment

**Prompt:**
```
Use the consent skill to show me how to add consent attributes to my parent segment.
```

**Expected Behavior:**
- Claude reads `examples/consent-parent-segment.yml`
- Provides YAML configuration for parent segment
- Shows attributes section with consent_wide table join
- Explains the attribute columns (email_marketing_consent, sms_consent, etc.)

**Success Criteria:**
- ✅ References `examples/consent-parent-segment.yml`
- ✅ Shows join on customer_id
- ✅ Includes consent_updated_at for expiry checks
- ✅ Mentions running `tdx ps push` to apply changes

---

### Test 3: Build Preference Center

**Prompt:**
```
Use the consent-management skill to create a customer preference center for my website.
```

**Expected Behavior:**
- Claude reads `examples/preference-center.html`
- Provides complete HTML with TD JS SDK integration
- Shows consent toggles for email, SMS, profiling
- Explains saveConsent() function

**Success Criteria:**
- ✅ References `examples/preference-center.html`
- ✅ Shows TD SDK initialization with regional endpoint
- ✅ Includes consentManager.saveConsent() API
- ✅ Also sends to consent_tracking table via addRecord()
- ✅ Shows privacy controls (setAnonymousMode, blockEvents)

---

### Test 4: Create Privacy-Compliant Segments

**Prompt:**
```
Use the consent skill to create an email marketing segment that only includes users who opted in and have valid consent.
```

**Expected Behavior:**
- Claude reads `examples/consent-segment-rules.yml`
- Provides segment YAML with consent filters
- Shows TimeWithinPast operator for 24-month expiry
- Explains GDPR compliance requirements

**Success Criteria:**
- ✅ References `examples/consent-segment-rules.yml`
- ✅ Filters by email_marketing_consent = 'given'
- ✅ Checks consent_updated_at within 24 months
- ✅ Uses TimeWithinPast operator with unit: month
- ✅ Mentions running `tdx sg push` to create segment

---

### Test 5: Handle DSAR Request (Data Export)

**Prompt:**
```
Use the consent skill to help me export all data for customer ID "cust_12345" for a GDPR data access request.
```

**Expected Behavior:**
- Claude reads `examples/dsar-export.sql`
- Provides SQL query to export all customer data
- Joins customers, consent_wide, purchase_summary, behavioral_summary
- Explains 30-day GDPR timeline

**Success Criteria:**
- ✅ References `examples/dsar-export.sql`
- ✅ Shows LEFT JOIN pattern for all data sources
- ✅ Includes consent preferences in export
- ✅ Mentions archiving for compliance audit
- ✅ References `references/dsar-workflows.md` for detailed workflow

---

### Test 6: Handle DSAR Request (Data Deletion)

**Prompt:**
```
Use the consent-management skill to anonymize customer data for customer ID "cust_12345" per GDPR right to deletion.
```

**Expected Behavior:**
- Claude reads `examples/dsar-export.sql` (deletion section)
- Provides UPDATE statement to anonymize PII
- Shows DELETE statements for consent/events
- Explains anonymization vs. complete deletion

**Success Criteria:**
- ✅ Shows UPDATE to set email = 'deleted_...@anonymized.com'
- ✅ Sets first_name/last_name to 'DELETED'
- ✅ Sets gdpr_deleted = TRUE
- ✅ Suggests using workflow for multi-table deletion
- ✅ References `references/dsar-workflows.md`

---

### Test 7: Audit Consent Coverage

**Prompt:**
```
Use the consent skill to show me how to check consent coverage metrics for compliance reporting.
```

**Expected Behavior:**
- Claude reads SKILL.md or `references/audit-queries.md`
- Provides SQL for consent coverage metrics
- Shows opt-in rates, expired consents count
- Explains compliance monitoring

**Success Criteria:**
- ✅ Shows COUNT with CASE for opt-in rates
- ✅ Calculates percentage opt-in rate
- ✅ Identifies expired consents (older than 24 months)
- ✅ References `references/audit-queries.md` for more queries

---

### Test 8: Validate Activation Compliance

**Prompt:**
```
Use the consent skill to create a workflow that validates consent before activating an email campaign.
```

**Expected Behavior:**
- Claude reads `templates/consent-sync-workflow.dig`
- Provides Digdag workflow YAML
- Shows validation query checking consent status
- Blocks activation if invalid consents found

**Success Criteria:**
- ✅ References `templates/consent-sync-workflow.dig`
- ✅ Shows +validate_consent step with SQL query
- ✅ Uses if> condition to check results
- ✅ Sends alert if compliance check fails
- ✅ Only proceeds if all consents valid

---

### Test 9: Multi-Channel Consent Segment

**Prompt:**
```
Use the consent-management skill to create a segment for users who opted into both email and SMS marketing.
```

**Expected Behavior:**
- Claude reads `examples/consent-segment-rules.yml`
- Provides multi-channel consent pattern
- Shows filtering by multiple consent types
- Explains use case for cross-channel campaigns

**Success Criteria:**
- ✅ Uses And condition with multiple consent filters
- ✅ Checks email_marketing_consent = 'given'
- ✅ Checks sms_consent = 'given'
- ✅ Includes consent expiry check
- ✅ Suggests use case (high-value multi-channel campaigns)

---

### Test 10: CCPA Do Not Sell Compliance

**Prompt:**
```
Use the consent skill to create a segment that excludes users who opted out of data selling per CCPA.
```

**Expected Behavior:**
- Claude reads `examples/consent-segment-rules.yml` or SKILL.md
- Provides CCPA-compliant segment pattern
- Shows do_not_sell = false filter
- Explains CCPA vs GDPR differences

**Success Criteria:**
- ✅ Filters by do_not_sell = false
- ✅ Checks third_party_sharing_allowed = true
- ✅ Explains CCPA opt-out vs GDPR opt-in
- ✅ References `references/consent-categories.md` for CCPA details

---

## Advanced Tests

### Test 11: Reference Documentation

**Prompt:**
```
Use the consent-management skill to explain the difference between GDPR and CCPA consent requirements.
```

**Expected Behavior:**
- Claude reads `references/consent-categories.md`
- Explains GDPR requires opt-in, CCPA opt-out
- Shows consent type comparison table
- References expiration timelines

**Success Criteria:**
- ✅ References `references/consent-categories.md`
- ✅ Explains GDPR Article 6(1)(a) opt-in requirement
- ✅ Explains CCPA "Do Not Sell" opt-out right
- ✅ Shows 24-month GDPR vs 12-month CCPA expiry

---

### Test 12: SDK Integration Details

**Prompt:**
```
Use the consent skill to show me all the TD JavaScript SDK consent methods available.
```

**Expected Behavior:**
- Claude reads `references/sdk-integration.md`
- Lists all consent-related SDK methods
- Shows consentManager configuration
- Provides code examples

**Success Criteria:**
- ✅ References `references/sdk-integration.md`
- ✅ Shows consentManager.configure()
- ✅ Shows consentManager.saveConsent()
- ✅ Shows privacy controls (setAnonymousMode, blockEvents, resetUUID)
- ✅ Includes regional endpoint configuration

---

## Verification Checklist

After running tests, verify:

- [ ] Skill correctly references example files (not just generating from memory)
- [ ] TD-specific patterns used (td_interval, parent segments, tdx commands)
- [ ] SKILL.md referenced for core patterns
- [ ] References/* files used for detailed information
- [ ] Examples/* files used for complete implementations
- [ ] Templates/* files used for schemas and workflows
- [ ] Skill provides actionable, copy-paste-ready code
- [ ] Explanations are concise and TD-specific

---

## Troubleshooting

**Issue:** Skill not found
- **Fix:** Run `/plugin list` to verify installation
- **Fix:** Re-install with `/plugin install tdx-skills`

**Issue:** Skill doesn't reference files
- **Fix:** Use explicit trigger: "Use the **consent-management skill**"
- **Fix:** Add "skill" keyword in prompt

**Issue:** Generic responses (not TD-specific)
- **Fix:** Be explicit: "Use TD parent segments" or "Use tdx CLI"
- **Fix:** Ask for specific file: "Show me the consent-parent-segment.yml example"

---

## Expected Skill Behavior

The consent-management skill should:
- ✅ Read files from examples/, templates/, references/
- ✅ Provide TD-specific implementations (not generic CDP)
- ✅ Use TD terminology (parent segments, tdx, td_interval)
- ✅ Reference SKILL.md for core patterns
- ✅ Reference detailed docs in references/ for deep dives
- ✅ Provide working code examples
- ✅ Explain compliance requirements (GDPR/CCPA)

The skill should NOT:
- ❌ Provide generic CDP advice without TD context
- ❌ Ignore the example files and generate from scratch
- ❌ Use non-TD tools (OneTrust, Segment.io, etc.)
- ❌ Skip compliance best practices
