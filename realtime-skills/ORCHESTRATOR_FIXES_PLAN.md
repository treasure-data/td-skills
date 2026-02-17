# Orchestrator Skills - Fixes Plan

## Files to Update

1. `rt-setup-personalization/SKILL.md` (516 lines)
2. `rt-setup-triggers/SKILL.md` (468 lines)

## Fixes to Apply

### Common Fixes (Both Files)

#### 1. Add Region Detection (After Step 1)

**Insert after line ~60 (after parent segment validation):**

```bash
# Detect user's region
REGION=$(tdx config get endpoint 2>/dev/null | grep -o '[a-z][a-z][0-9][0-9]' | head -1)
REGION="${REGION:-us01}"
echo "Using region: $REGION"
```

#### 2. Add TD_API_KEY Validation

**rt-setup-personalization:** Insert before Step 7 (Create RT Configuration)
**rt-setup-triggers:** Insert before Step 8 (Create RT Journey)

```bash
# Validate API key is set
if [ -z "$TD_API_KEY" ]; then
  echo "❌ TD_API_KEY environment variable not set"
  echo "Set it with: export TD_API_KEY=your_master_api_key"
  exit 1
fi
```

#### 3. HTTP Status Checking Pattern

Replace ALL occurrences of:
```bash
RESPONSE=$(curl -s "URL" ...)
VARIABLE=$(echo "$RESPONSE" | jq ...)
```

With:
```bash
RESPONSE=$(curl -s -w "\n%{http_code}" "URL" ...)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "❌ API request failed (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.errors[]? | .detail' 2>/dev/null || echo "$BODY"
  exit 1
fi

VARIABLE=$(echo "$BODY" | jq ...)
```

#### 4. Region-Aware URLs

Replace:
- `https://console-next.us01.treasuredata.com` → `https://console-next.${REGION}.treasuredata.com`
- `https://us01.p13n.in.treasuredata.com` → `https://${REGION}.p13n.in.treasuredata.com`

#### 5. Verification Checklist

Add at the end of each file (before Summary Output):

```markdown
## Verification Checklist

After setup completes, verify:

\`\`\`bash
# 1. RT status is "ok"
tdx ps view <ps_id> --json | jq -r '.realtime_config.status'
# Expected: "ok"

# 2. Key events exist
tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | jq '.data | length'
# Expected: > 0

# 3. RT attributes exist
tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | jq '.data | length'
# Expected: > 0

# 4. Personalization entity exists (or Journey for triggers)
curl -s "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data | length'
# Expected: > 0

# 5. API endpoint responds
curl -X GET "https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<pz_id>?td_client_id=test_user" \
  -H "Authorization: TD1 ${TD_API_KEY}"
# Expected: JSON with attributes (not 404)
\`\`\`

If any check fails, review the corresponding setup step.
```

### rt-setup-personalization Specific

#### API Calls to Fix (Apply HTTP Status Checking)

**Step 7a: Configure Event Tables**
- Line ~150: `tdx api "/audiences/<ps_id>/realtime_setting" --type cdp -X PATCH`

**Step 7a: Create Key Events**
- Line ~170: `tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp -X POST`

**Step 7b: Configure ID Stitching**
- Line ~195: `tdx api "/audiences/<ps_id>/realtime_setting" --type cdp -X PATCH`

**Step 7c: Create RT Attributes**
- Line ~210: Multiple `tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp -X POST`

**Step 9b: Get Parent Segment Folder**
- Line ~325: `curl "https://api-cdp.treasuredata.com/audiences/<ps_id>/folders"`

**Step 9b: Get Key Event ID**
- Line ~340: `curl "https://api-cdp.treasuredata.com/audiences/<ps_id>/realtime_key_events"`

**Step 9c: Get RT Attribute IDs**
- Line ~360: `curl "https://api-cdp.treasuredata.com/audiences/<ps_id>/realtime_attributes"`

**Step 9: Create Personalization Entity**
- Line ~380: `curl -X POST "https://api-cdp.treasuredata.com/entities/realtime_personalizations"`

### rt-setup-triggers Specific

#### uuidgen Fallback (Add before Step 9b)

**Insert before STEP_UUID generation (~line 300):**

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

#### API Calls to Fix (Apply HTTP Status Checking)

**Step 7: Same as rt-setup-personalization**

**Step 8a: Get Segment Folder**
- Line ~240: `curl "https://api-cdp.treasuredata.com/tree/audiences/<ps_id>/segment_folders"`

**Step 8b: Create Journey**
- Line ~255: `curl -X POST "https://api-cdp.treasuredata.com/entities/realtime_journeys"`

**Step 9a: Create Authentication**
- Line ~290: `curl -X POST "https://api.treasuredata.com/v4/streaming_task_auths"`

**Step 9b: Create Activation Step**
- Line ~325: `curl -X POST "https://api-cdp.treasuredata.com/entities/realtime_journeys/.../activations"`

**Step 10: Configure Journey Stage**
- Line ~360: `curl -X PATCH "https://api-cdp.treasuredata.com/entities/realtime_journeys/..."`

**Step 11: Wait for RT Ready**
- Line ~390: `curl "https://api-cdp.treasuredata.com/audiences/<ps_id>/realtime_setting"`

**Step 12: Launch Journey**
- Line ~420: `curl -X PATCH "https://api-cdp.treasuredata.com/entities/realtime_journeys/..."`

**Step 13: Verify**
- Line ~450: `curl "https://api-cdp.treasuredata.com/entities/realtime_journeys/..."`

## Estimated Changes

### rt-setup-personalization
- **Lines to add:** ~150
- **Lines to modify:** ~80
- **Total changes:** ~230 lines
- **Final line count:** ~670 lines (over CLAUDE.md 500-line guideline)

### rt-setup-triggers
- **Lines to add:** ~160
- **Lines to modify:** ~90
- **Total changes:** ~250 lines
- **Final line count:** ~630 lines (over CLAUDE.md 500-line guideline)

## Recommendation

Given both files will exceed 500 lines after fixes:

**Option 1:** Apply all fixes now, accept 600+ line files
- Pros: Complete, production-ready error handling
- Cons: Violates CLAUDE.md guideline

**Option 2:** Apply critical fixes only (HTTP status, TD_API_KEY, region)
- Pros: Stays closer to 500 lines
- Cons: Less comprehensive error handling

**Option 3:** Split files into smaller skills
- Pros: Follows guidelines, modular
- Cons: More complex, requires restructuring

## Decision

**Recommend Option 1** - Apply all fixes now:
- Production readiness > guideline
- Files are orchestrators (naturally longer)
- Can split later if needed
- Users need robust error handling

## Implementation Plan

1. Create fixed version of rt-setup-personalization/SKILL.md
2. Create fixed version of rt-setup-triggers/SKILL.md
3. Test key sections (region detection, API calls)
4. Commit with detailed message
5. Update PR description
6. Update FIXES_APPLIED.md

Proceed with Option 1?
