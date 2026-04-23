# Step 6: Verification & Testing

**Audience:** Developers / QA  
**Duration:** ~20 minutes

## Overview

Verify that the complete integration works end-to-end and test various scenarios.

This step ensures everything is configured correctly before going to production.

## 6.1 End-to-End Verification Checklist

Work through this checklist to verify each component.

### RT Configuration

- [ ] **RT status is "OK"**
  ```bash
  tdx ps rt list --json | jq -r '.[] | select(.name=="<ps_name>") | .status'
  # Expected: "ok"
  ```

- [ ] **Event table is registered**
  ```bash
  tdx ps rt list --json | jq -r '.[] | select(.name=="<ps_name>") | .event_tables'
  # Should list your event table
  ```

- [ ] **Key events exist**
  ```bash
  tdx api "/audiences/<ps_id>/realtime_key_events" --type cdp | jq '.data | length'
  # Expected: > 0
  ```

- [ ] **RT attributes are configured**
  ```bash
  tdx api "/audiences/<ps_id>/realtime_attributes?page[size]=100" --type cdp | jq '.data | length'
  # Expected: > 0
  ```

- [ ] **ID stitching is configured**
  ```bash
  tdx ps rt list --json | jq -r '.[] | select(.name=="<ps_name>") | .key_columns'
  # Should list your stitching keys
  ```

### Personalization Configuration

- [ ] **Personalization entity exists**
  ```bash
  curl -s "https://api-cdp.treasuredata.com/entities/parent_segments/<ps_id>/realtime_personalizations" \
    -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data | length'
  # Expected: > 0
  ```

- [ ] **Personalization is Active**
  ```bash
  curl -s "https://api-cdp.treasuredata.com/entities/realtime_personalizations/<pz_id>" \
    -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data.attributes.status'
  # Expected: "active"
  ```

- [ ] **Section entry criteria configured**
  - Check in Audience Studio UI that event + attribute conditions are set

- [ ] **Section payload includes td_in_app.message_json**
  ```bash
  curl -X POST "https://<p13n_host>/<database>/<event_table>" \
    -H "Content-Type: application/vnd.treasuredata.v1+json" \
    -H "Authorization: TD1 ${TD_API_KEY}" \
    -H "wp13n-token: ${TD_PERSONALIZATION_TOKEN}" \
    -d '{"email":"test@example.com","event_name":"product_view","page_url":"/test"}' | jq '.offers | keys'
  # Should return section names
  ```

### Engage Studio Content

- [ ] **In-app message campaign created**
  - Check in Engage Studio UI

- [ ] **Campaign is linked to Personalization & Section**
  - Verify in campaign settings

- [ ] **Campaign status is Active**
  - Check campaign status in Engage Studio

- [ ] **Content renders correctly in preview**
  - Preview in Engage Studio editor (desktop + mobile)

### Frontend Integration

- [ ] **TD SDK loads without errors**
  - Check browser console for initialization message

- [ ] **Events are tracked successfully**
  ```javascript
  // After sending event, check TD Console → Data Browser
  // Or query: SELECT * FROM <event_table> ORDER BY time DESC LIMIT 10
  ```

- [ ] **fetchPersonalization returns payload**
  - Check browser console for API response
  - Verify offers object is not empty

- [ ] **In-app message renders on page**
  - Visual confirmation that popup/embed appears

- [ ] **Close button works**
  - Click X button and verify modal closes

- [ ] **Impression tracking works**
  - Check that modal_shown/embed_shown events are tracked

## 6.2 Test Scenarios

Test different user scenarios to ensure correct behavior.

### Scenario 1: Matching User (Should See Message)

**Setup:**
- User visits product page
- Product status is "on_sale"
- User is logged in (if required by entry criteria)

**Steps:**
1. Open product detail page in browser
2. Open browser dev tools → Console
3. Verify event tracked: `Product view tracked: PROD-12345`
4. Wait 1-2 seconds
5. Verify API called: `Personalization response: {...}`
6. Verify modal appears

**Expected result:**
- ✅ Modal appears with "No returns" message
- ✅ Console shows successful API response
- ✅ No console errors

### Scenario 2: Non-Matching User (Should NOT See Message)

**Setup:**
- User visits product page
- Product status is "regular" (NOT on sale)

**Steps:**
1. Open regular product page
2. Open browser dev tools → Console
3. Verify event tracked
4. Wait 1-2 seconds
5. Check console for API response

**Expected result:**
- ✅ Event tracked successfully
- ✅ API response shows empty offers: `{offers: {}}`
- ✅ No modal appears
- ✅ No console errors

### Scenario 3: Anonymous User

**Setup:**
- User is not logged in
- Clear cookies to simulate new visitor

**Steps:**
1. Clear browser cookies and local storage
2. Visit product page (on sale)
3. Check console

**Expected result:**
- ✅ Event tracked with auto-generated td_client_id
- ✅ If entry criteria allows anonymous users → modal appears
- ✅ If entry criteria requires login → no modal
- ✅ No console errors

### Scenario 4: Multiple Visits (Frequency Capping)

**Setup:**
- Frequency cap set to "1 impression per day"

**Steps:**
1. Visit product page → modal appears
2. Close modal
3. Refresh page
4. Check if modal appears again

**Expected result:**
- ✅ First visit: Modal appears
- ✅ Second visit (same session): Modal does NOT appear (frequency cap working)

### Scenario 5: Different Sections

If you have multiple sections with different entry criteria:

**Setup:**
- Section A: On-sale products
- Section B: VIP customers

**Steps:**
1. Test as regular user on sale page → should see Section A
2. Test as VIP user on regular page → should see Section B
3. Test as VIP user on sale page → should see one section (priority rules)

**Expected result:**
- ✅ Correct section content shown based on entry criteria
- ✅ Only one message shown if multiple sections match (first match wins)

## 6.3 Debugging Tools

### Browser DevTools

**Console Tab:**
- Check for SDK initialization messages
- View tracked events
- See API responses
- Identify JavaScript errors

**Network Tab:**
- Filter by "treasuredata" to see TD requests
- Check event tracking requests (POST to in.treasuredata.com)
- Check personalization API requests (GET to p13n.in.treasuredata.com)
- Verify request/response payloads

**Application Tab:**
- Check cookies → `_td` cookie (client ID)
- Check Local Storage → any cached data

### TD Console

**Data Browser:**
```sql
-- Check recent events
SELECT *
FROM <event_database>.<event_table>
WHERE time > TD_TIME_ADD(TD_SCHEDULED_TIME(), '-1h')
ORDER BY time DESC
LIMIT 100
```

**Identity Logs:**
```sql
-- Check ID stitching activity
SELECT *
FROM <ps_database>.identity_log
WHERE time > TD_TIME_ADD(TD_SCHEDULED_TIME(), '-1h')
ORDER BY time DESC
LIMIT 100
```

**Activation Logs:**
```sql
-- Check personalization API calls (if logged)
SELECT *
FROM <ps_database>.activations_log
WHERE time > TD_TIME_ADD(TD_SCHEDULED_TIME(), '-1h')
ORDER BY time DESC
LIMIT 100
```

### API Testing with curl

**Test personalization API directly:**

```bash
#!/bin/bash

P13N_HOST="your_p13n_host"  # e.g., p13n-api.treasuredata.com or p13n-api-staging.treasuredata.com
DATABASE="your_database"
EVENT_TABLE="your_event_table"
API_KEY="your_master_api_key"
P13N_TOKEN="your_personalization_token"

# Test with specific user and event
curl -X POST \
  "https://${P13N_HOST}/${DATABASE}/${EVENT_TABLE}" \
  -H "Content-Type: application/vnd.treasuredata.v1+json" \
  -H "Authorization: TD1 ${API_KEY}" \
  -H "wp13n-token: ${P13N_TOKEN}" \
  -d '{
    "email": "test_user_123@example.com",
    "event_name": "product_view",
    "page_url": "/products/PROD-12345",
    "product_status": "on_sale"
  }' | jq '.'
```

**Test with different parameters:**

```bash
# Test matching criteria (should return offers)
curl -X POST \
  "https://${P13N_HOST}/${DATABASE}/${EVENT_TABLE}" \
  -H "Content-Type: application/vnd.treasuredata.v1+json" \
  -H "Authorization: TD1 ${API_KEY}" \
  -H "wp13n-token: ${P13N_TOKEN}" \
  -d '{
    "email": "test@example.com",
    "event_name": "product_view",
    "page_url": "/test",
    "product_status": "on_sale"
  }' | jq '.offers | keys'
# Should return section names

# Test non-matching criteria (should return empty offers)
curl -X POST \
  "https://${P13N_HOST}/${DATABASE}/${EVENT_TABLE}" \
  -H "Content-Type: application/vnd.treasuredata.v1+json" \
  -H "Authorization: TD1 ${API_KEY}" \
  -H "wp13n-token: ${P13N_TOKEN}" \
  -d '{
    "email": "test@example.com",
    "event_name": "product_view",
    "page_url": "/test",
    "product_status": "regular"
  }' | jq '.offers | keys'
# Should return empty array []
```

## 6.4 Common Issues and Solutions

### Issue: API returns empty offers {}

**Possible causes:**
1. Entry criteria not met
   - Check event filters match event data exactly (case-sensitive)
   - Verify attribute conditions are satisfied
   
2. User not in parent segment
   - Check ID stitching logs
   - Verify user has events in RT
   
3. Personalization not Active
   - Check status in Audience Studio
   
4. RT attributes not populated
   - Wait 1-2 minutes after first event
   - Query RT attributes: `tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp`

**Solution:**
```bash
# Simplify entry criteria to test
# Remove all attribute conditions
# Use simple event filter: event_name = "product_view"
# Gradually add back complexity
```

### Issue: td_in_app.message_json field missing

**Possible causes:**
1. Engage campaign not Active
2. Campaign not linked to correct Section
3. Campaign launched after personalization was created

**Solution:**
1. Check campaign status in Engage Studio
2. Re-link campaign to Personalization & Section
3. Wait 1-2 minutes after launching campaign
4. Test API again

### Issue: Modal doesn't render

**Possible causes:**
1. JavaScript error in rendering code
2. CSS conflicts with page styles
3. message_json format unexpected

**Solution:**
```javascript
// Add detailed logging
console.log('Offer:', offer);
console.log('Message JSON:', offer.attributes['td_in_app.message_json']);

try {
  const message = JSON.parse(offer.attributes['td_in_app.message_json']);
  console.log('Parsed message:', message);
  console.log('Content HTML:', message.content_html);
} catch (e) {
  console.error('JSON parse error:', e);
}
```

### Issue: CORS errors

**Error message:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
1. Add your domain to CORS allowed origins (Step 2)
2. For testing, temporarily use `*` wildcard
3. Check token permissions include CORS access

### Issue: High API latency

**Symptoms:** Personalization API takes > 2 seconds to respond

**Possible causes:**
1. Complex entry criteria with many attribute lookups
2. Large catalog lookup payloads
3. Network latency

**Solution:**
1. Simplify entry criteria (remove unnecessary conditions)
2. Reduce catalog lookup columns
3. Implement client-side caching
4. Consider server-side proxy for personalization API

## 6.5 Performance Testing

### Measure API Response Time

```javascript
const startTime = performance.now();

td.fetchPersonalization(p13nConfig, requestData, function(response) {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log('Personalization API latency:', duration + 'ms');
  
  // Track latency for monitoring
  td.trackEvent('performance_metrics', {
    metric: 'personalization_latency',
    duration_ms: Math.round(duration),
    timestamp: Date.now()
  });
}, function(error) {
  console.error('API error:', error);
});
```

**Target latency:** < 500ms

### Load Testing

Use browser dev tools or tools like Lighthouse to test:
- Page load time with/without personalization
- SDK script load time
- Memory usage

**Recommendations:**
- SDK load: < 100ms (async, from CDN)
- First Contentful Paint: Not significantly delayed by personalization
- Memory usage: < 5MB additional

## 6.6 Pre-Production Checklist

Before deploying to production:

- [ ] All test scenarios pass
- [ ] No console errors or warnings
- [ ] API latency is acceptable (< 500ms)
- [ ] Content renders correctly on all target devices/browsers
- [ ] Frequency capping works as expected
- [ ] Token is stored securely (not hardcoded in source)
- [ ] CORS origins are restricted to production domains (no `*`)
- [ ] Monitoring/alerting set up for API errors
- [ ] Fallback content defined for API failures
- [ ] Documentation updated for team

## 6.7 Monitoring in Production

After deployment, monitor:

**Metrics to track:**
- Personalization API call volume
- API error rate (should be < 1%)
- API latency (p50, p95, p99)
- Modal impression rate
- Modal close rate
- Conversion impact (A/B test)

**Set up alerts:**
- API error rate > 5%
- API latency p95 > 1000ms
- No impressions for 1 hour (may indicate configuration issue)

**Query personalization events:**
```sql
-- Daily impression count
SELECT
  TD_TIME_FORMAT(time, 'yyyy-MM-dd') AS date,
  COUNT(*) AS impressions
FROM personalization_events
WHERE event_name = 'modal_shown'
  AND TD_INTERVAL(time, '-7d')
GROUP BY 1
ORDER BY 1 DESC
```

## Congratulations!

You've successfully set up end-to-end RT Personalization with Engage Studio content delivery.

**What you've built:**
1. ✅ RT infrastructure for real-time event processing
2. ✅ Personalization API with dynamic entry criteria
3. ✅ Visual in-app content designed in Engage Studio
4. ✅ Frontend integration with TD JavaScript SDK
5. ✅ Complete verification and testing

**Next steps:**
- Monitor performance and user engagement
- Create A/B tests for content optimization
- Expand to additional use cases and sections
- Explore advanced features (catalog lookups, segment payload, etc.)

## Related Resources

- **Code examples:** [examples/](../examples/)
- **Skills:** rt-config, rt-personalization, engage, td-javascript-sdk
- **API documentation:** [TD API Docs](https://api-docs.treasuredata.com/)

---

**Playbook complete!** Return to [SKILL.md](../SKILL.md) for overview.
