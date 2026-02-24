# Step 10: Verification & Testing

## Verification Checklist

After setup completes, verify all components:

```bash
# 1. RT status is "ok"
tdx ps rt list --json | jq -r --arg ps "<ps_id_or_name>" '.[] | select(.id==$ps or .name==$ps) | .status'
# Expected: "ok"

# 2. Key events exist
tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | jq '.data | length'
# Expected: > 0

# 3. RT attributes exist
tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | jq '.data | length'
# Expected: > 0

# 4. Personalization entity deployed
curl -s "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data | length'
# Expected: > 0

# 5. API endpoint responds
curl -X GET "https://${REGION}.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<pz_id>?td_client_id=test_user" \
  -H "Authorization: TD1 ${TD_API_KEY}"
# Expected: JSON with attributes (not 404)
```

If any check fails, review the corresponding setup step.

---

## Summary Output

```markdown
✅ RT Personalization Setup Complete!

Parent Segment: <ps_name> (<ps_id>)
Use Case: <use_case>

RT Configuration:
  - Event Tables: <count> configured
  - Key Events: <event_names>
  - RT Attributes: <count> created
  - Batch Attributes: <count> imported
  - ID Stitching Keys: <count> configured

Personalization:
  - Service: <service_name> (created)
  - Entity: <personalization_id> (deployed)
  - Sections: <section_count>

API Endpoint:
  https://<region>.p13n.in.treasuredata.com/audiences/<ps_id>/personalizations/<personalization_id>

Console URL:
  https://console-next.<region>.treasuredata.com/app/ps/<ps_id>/e/<personalization_id>/p/de

Next Steps:
  1. Test API endpoint with real user IDs
  2. Integrate into web/mobile app
  3. Monitor activation logs
```

---

## Error Handling

**RT not enabled:**
```
❌ RT 2.0 is not enabled for this parent segment.
→ Contact your CSM to enable RT 2.0.
```

**No RT-enabled parent segments:**
```
❌ No RT-enabled parent segments found in your account.
→ Contact your CSM to enable RT 2.0 for a parent segment.
```

**RT status "updating":**
```
⚠️  RT configuration is updating. Waiting for status "ok"...
→ This typically takes 30-90 seconds.
```

**Missing event tables:**
```
❌ No streaming event tables found in database "<db>".
→ Verify database name or check if events are being ingested.
```

---

## For RT Triggers (Journeys) Instead

If user wants **RT Triggers** (journeys) instead of personalization:
- Follow Steps 1-7 (same RT config needed)
- Skip Steps 8-9 (personalization service/entity)
- Use the `rt-setup-triggers` skill instead
