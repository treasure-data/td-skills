# RT Skills - Fixes Applied

## Summary

Applied 8 critical fixes to RT personalization skills based on code review feedback.

## Files Updated

1. ✅ `realtime-skills/rt-personalization/SKILL.md` - **COMPLETE**
2. ⏳ `realtime-skills/rt-setup-personalization/SKILL.md` - **PENDING** (apply same patterns)
3. ⏳ `realtime-skills/rt-setup-triggers/SKILL.md` - **PENDING** (apply same patterns)

## Fixes Applied to rt-personalization/SKILL.md

### ✅ 1. HTTP Status Checking (High Priority)

**Before:**
```bash
RESPONSE=$(curl -s "https://api-cdp.treasuredata.com/..." ...)
PERSONALIZATION_ID=$(echo "$RESPONSE" | jq -r '.data.id')
```

**After:**
```bash
RESPONSE=$(curl -s -w "\n%{http_code}" "https://api-cdp.treasuredata.com/..." ...)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "❌ API request failed (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.errors[]? | .detail' 2>/dev/null || echo "$BODY"
  exit 1
fi

PERSONALIZATION_ID=$(echo "$BODY" | jq -r '.data.id')
```

**Applied to:**
- Get folder ID (line 211)
- Get key event ID (line 240)
- Get RT attributes (line 269)
- Create personalization entity (line 401)
- List personalizations (line 483)
- Get specific personalization (line 501)
- Test API endpoint (line 533)

### ✅ 2. TD_API_KEY Validation (High Priority)

Added validation before Step 2 (line 200):

```bash
# Validate API key is set
if [ -z "$TD_API_KEY" ]; then
  echo "❌ TD_API_KEY environment variable not set"
  echo "Set it with: export TD_API_KEY=your_master_api_key"
  exit 1
fi
```

### ✅ 3. Region-Aware Endpoints (High Priority)

**Detection at workflow start (line 87):**
```bash
# Detect region from tdx config
REGION=$(tdx config get endpoint 2>/dev/null | grep -o '[a-z][a-z][0-9][0-9]' | head -1)
REGION="${REGION:-us01}"
echo "Using region: $REGION"
```

**Updated URLs:**
- Console URL (line 519): `https://console-next.<region>.treasuredata.com/...`
- API endpoint (line 528): `https://${REGION}.p13n.in.treasuredata.com/...`
- JavaScript example (line 562): Uses `REGION` variable
- Node.js example (line 580): Uses `process.env.TD_REGION || 'us01'`

### ✅ 4. Migration Guide (High Priority)

Added complete migration section (lines 34-82):

**Sections:**
- Check if Entity Exists (with HTTP status checking)
- If Entity is Missing (two options)
- Verify Migration

### ✅ 5. JSON Escaping via Heredoc (Medium Priority)

**Before (complex jq piping):**
```bash
CUSTOM_BODY='{"event": "{{event_name}}"}'
EXPORT_JSON=$(jq -n --arg url "$WEBHOOK_URL" ... | jq -c | jq -Rs)
```

**After (heredoc with sed replacement):**
```bash
cat > personalization_payload.json <<'EOF'
{
  "attributes": {
    "audienceId": "<ps_id>",
    ...
  }
}
EOF

sed -i.bak -e "s/<ps_id>/$PS_ID/g" ... personalization_payload.json
```

Applied at line 325 for entity creation payload.

### ✅ 6. Improved Error Messages (Medium Priority)

Enhanced error message for entity creation (line 410):

```bash
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "❌ Failed to create Personalization entity (HTTP $HTTP_CODE)"
  echo ""
  echo "Possible causes:"
  echo "  - Invalid folder ID (check parent segment has folders)"
  echo "  - Invalid key event ID (verify key event exists)"
  echo "  - Missing RT attribute IDs (check attributes are configured)"
  echo "  - Invalid attribute payload (check subAttributeIdentifier for list attrs)"
  echo ""
  echo "API Response:"
  echo "$BODY" | jq '.errors[]? | .detail' 2>/dev/null || echo "$BODY"
  exit 1
fi
```

Similar improvements added for:
- Folder ID validation (line 226)
- Key event ID validation (line 255)

### ✅ 7. Verification Checklist (Medium Priority)

Added complete verification section (lines 599-627):

```bash
# 1. RT status is "ok"
tdx ps view <ps_id> --json | jq -r '.realtime_config.status'
# Expected: "ok"

# 2. Key events exist
tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | jq '.data | length'
# Expected: > 0

# 3. RT attributes exist
tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | jq '.data | length'
# Expected: > 0

# 4. Personalization entity exists
curl -s "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data | length'
# Expected: > 0

# 5. API endpoint responds
curl -X GET "https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<pz_id>?td_client_id=test_user" \
  -H "Authorization: TD1 ${TD_API_KEY}"
# Expected: JSON with attributes (not 404)
```

### ✅ 8. Prerequisites Updated

Added to prerequisites (line 17):
- TD_API_KEY environment variable set

## Patterns to Apply to Orchestrator Skills

The same patterns need to be applied to:
1. `rt-setup-personalization/SKILL.md`
2. `rt-setup-triggers/SKILL.md`

### For rt-setup-personalization

**HTTP Status Checking needed in:**
- Step 7a: Event table configuration API calls
- Step 7b: ID stitching configuration API call
- Step 7c: RT attributes creation API calls
- Step 9b: Get key event ID
- Step 9c: Get RT attribute IDs
- Step 9: Create personalization entity

**TD_API_KEY validation:** Add before Step 7 (Create RT Configuration)

**Region detection:** Add at beginning after Step 1

**Verification checklist:** Add after Step 10

### For rt-setup-triggers

**HTTP Status Checking needed in:**
- Step 7a: Event table configuration
- Step 7b: ID stitching configuration
- Step 7c: RT attributes creation
- Step 8: Get segment folder
- Step 8: Create journey
- Step 9a: Create authentication
- Step 9b: Create activation step
- Step 10: Configure journey stage
- Step 12: Launch journey

**TD_API_KEY validation:** Add before Step 8 (Create RT Journey)

**Region detection:** Add at beginning after Step 1

**uuidgen fallback:** Add at Step 9b (line ~300)

```bash
# Generate UUID with fallback
if command -v uuidgen >/dev/null 2>&1; then
  STEP_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
elif command -v python3 >/dev/null 2>&1; then
  STEP_UUID=$(python3 -c 'import uuid; print(str(uuid.uuid4()))')
else
  echo "❌ Neither uuidgen nor python3 available. Cannot generate UUID."
  exit 1
fi
```

**Verification checklist:** Add after Step 13

## Testing Checklist

Before merging:

- [ ] Test HTTP status checking with invalid API key
- [ ] Test HTTP status checking with API errors (400/500)
- [ ] Test TD_API_KEY validation (unset variable)
- [ ] Test region detection for us01, eu01, ap01, ap02
- [ ] Test uuidgen fallback on Linux without uuidgen
- [ ] Test migration guide with existing services
- [ ] Test verification checklist commands
- [ ] Verify all URLs use $REGION variable

## Line Count Check

- ✅ rt-personalization/SKILL.md: 693 lines (over 500 - consider splitting)
- ⏳ rt-setup-personalization/SKILL.md: TBD
- ⏳ rt-setup-triggers/SKILL.md: TBD

**Note:** rt-personalization is now 693 lines, exceeding the 500-line guideline in CLAUDE.md. Consider splitting into:
- rt-personalization-service (Step 1)
- rt-personalization-entity (Step 2)

Or move examples/integration code to separate files.

## Breaking Changes

### Migration Required

Users who previously created personalization services (before this update) will need to:

1. **Check if entity exists** (see Migration section)
2. **If missing**: Run Step 2 only to create entity
3. **Verify**: Test API endpoint returns data

This is a **backward-compatible** change - old services still work, but need entity creation for Console visibility.

## Next Steps

1. Apply same patterns to rt-setup-personalization/SKILL.md
2. Apply same patterns to rt-setup-triggers/SKILL.md
3. Test all error scenarios
4. Consider splitting rt-personalization (693 lines > 500)
5. Update PR description with fixes applied
6. Request review from team

## Review Checklist

- [x] HTTP status checking on all curl commands
- [x] TD_API_KEY validation
- [x] Region-aware endpoints
- [ ] uuidgen fallback (not needed in rt-personalization)
- [x] Migration guide
- [x] Simplified JSON escaping (heredoc)
- [x] Improved error messages
- [x] Verification checklist
