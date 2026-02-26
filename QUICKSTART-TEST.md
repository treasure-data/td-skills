# Quick Start - Test Consent Management Skill

**5-minute setup to test the skill locally**

## Step 1: Validate Skill (30 seconds)

```bash
cd /Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
./tdx-skills/consent-management/test-skill.sh
```

Expected: `✅ All tests passed!`

---

## Step 2: Open New Claude Code Session (1 minute)

Open a **new terminal** and start Claude Code:

```bash
claude
```

Or if using the CLI in your current directory:

```bash
cd /Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills
claude
```

---

## Step 3: Register Local Marketplace (1 minute)

In the Claude Code session, run:

```
/plugin marketplace add file:///Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
```

Expected response:
```
✓ Marketplace "td-skills" added successfully
```

---

## Step 4: Install Plugin (1 minute)

```
/plugin install tdx-skills@td-skills
```

Expected response:
```
✓ Plugin "tdx-skills" installed
  Includes: consent-management, parent-segment, segment, ...
```

---

## Step 5: Test the Skill (2 minutes)

### Quick Test 1: Basic Understanding

```
Use the consent-management skill to explain TD's consent architecture.
```

**Look for:**
- ✅ Mentions "architecture-first"
- ✅ References parent segment attributes
- ✅ Explains TD JS SDK Consent Manager

---

### Quick Test 2: Create Tables

```
Use the consent skill to create consent tracking tables for GDPR compliance.
```

**Look for:**
- ✅ Shows CREATE TABLE consent_tracking
- ✅ Shows consent_wide VIEW
- ✅ Uses td_interval(time, '-2y')
- ✅ References `templates/consent-table-ddl.sql`

---

### Quick Test 3: Build Segment

```
Use the consent-management skill to create an email segment that only includes users with valid consent.
```

**Look for:**
- ✅ Shows segment YAML
- ✅ Filters by email_marketing_consent = 'given'
- ✅ Uses TimeWithinPast with 24 months
- ✅ References `examples/consent-segment-rules.yml`

---

## Success Indicators

✅ **Skill Working Correctly:**
- Reads files from examples/, templates/, references/
- Uses TD-specific terminology (parent segment, tdx, td_interval)
- Provides working code examples
- Explains GDPR/CCPA requirements

❌ **Skill Not Working:**
- Generic CDP advice (not TD-specific)
- Doesn't reference example files
- Uses non-TD tools (OneTrust, etc.)
- Code doesn't match TD patterns

---

## Troubleshooting

**Issue:** Skill not found

```
/plugin list
```

If `tdx-skills` not shown, reinstall:

```
/plugin marketplace list
/plugin install tdx-skills@td-skills
```

---

**Issue:** Skill doesn't trigger

Use explicit trigger:

```
Use the **consent-management skill** to [task]
```

Or:

```
Use the **consent skill** to [task]
```

---

## Full Test Suite

For comprehensive testing, see:
- `TEST-PROMPTS.md` - 12 detailed test cases
- `TESTING-GUIDE.md` - Complete testing methodology

---

## What's Next?

After testing:

1. **Document results** - What worked, what didn't
2. **Report issues** - Note any gaps or problems
3. **Prepare contribution** - Ready for PR if tests pass

---

## Example Test Session

```
$ claude

Claude Code v1.0

> /plugin marketplace add file:///Users/adolfo.hernandez/AI-Projects/TDX-skills-playground/External-skills/td-skills
✓ Marketplace "td-skills" added

> /plugin install tdx-skills@td-skills
✓ Plugin "tdx-skills" installed

> Use the consent-management skill to create consent tracking tables.

Claude reads templates/consent-table-ddl.sql and provides:

-- Consent tracking table
CREATE TABLE customer_db.consent_tracking (
  customer_id VARCHAR,
  email VARCHAR,
  consent_type VARCHAR,
  consent_status VARCHAR,
  consent_timestamp BIGINT,
  ...
) WITH (format = 'ORC', partitioned_by = ARRAY['time']);

[... continues with full schema ...]

✓ Test passed! Skill is working.
```
