# Step 4: Design In-App Content in Engage Studio

**Audience:** Customer marketers / developers  
**Duration:** ~30 minutes

## Overview

Use Engage Studio to design the visual in-app message (popup or embed) that will be delivered via the personalization API.

This step creates the actual HTML content that users will see.

## Prerequisites

- Step 3 completed (Personalization and Section created in Audience Studio)
- Engage Studio access
- Content/copy for the in-app message prepared

## 4.1 Create In-App Message Campaign

**In Engage Studio:**

1. Navigate to **Campaigns**
2. Click **Create Campaign**
3. Select channel: **In-App Message**
4. Choose type:
   - **Popup** - Modal overlay on the page
   - **Embed** - Inline content embedded in page

**For this playbook, we'll use Popup.**

5. Enter campaign name: `on_sale_no_returns_popup`
6. Click **Create**

## 4.2 Link to Realtime Personalization

Connect the in-app message to the personalization section created in Step 3.

**In the campaign editor:**

1. Click **Audience & Targeting**
2. Select:
   - **Parent Segment**: Your parent segment
   - **Personalization**: `product_page_messages` (from Step 3)
   - **Section**: `on_sale_no_returns` (from Step 3)
3. Click **Save**

**What happens when you link:**
- The in-app message content will be written to the section's payload
- The payload field is typically: `td_in_app.message_json`
- This field contains the HTML and metadata needed to render the message

## 4.3 Design the Content

Use the in-app message editor to design your popup.

### 4.3.1 Choose Editor

**Two editor options:**

**BeeTree Editor (Recommended):**
- Visual drag-and-drop interface
- Pre-built templates
- Responsive design
- No coding required

**HTML Editor:**
- Full control with custom HTML/CSS
- For developers with specific design needs
- Can use external CSS frameworks

**For this playbook, we'll use BeeTree Editor.**

### 4.3.2 Design the Popup

**In the BeeTree Editor:**

1. **Choose a template** (or start blank)
   - Browse in-app message templates
   - Select a popup template that fits your design

2. **Customize the content**

   **Example: "No Returns" message**

   **Headline:**
   ```
   Sale Item - No Returns Allowed
   ```

   **Body text:**
   ```
   This product is on sale and cannot be returned or exchanged.
   All sales are final.
   ```

   **Call-to-action button:**
   ```
   Button text: "I Understand"
   Button action: Close popup
   ```

3. **Style the popup**
   - **Colors**: Match your brand colors
   - **Fonts**: Use web-safe fonts or brand fonts
   - **Layout**: Adjust spacing and alignment
   - **Images**: Add icons or product images (optional)

4. **Configure popup behavior**
   - **Display**: Center overlay, slide-in, etc.
   - **Close button**: Show/hide X button
   - **Backdrop**: Dim background or not
   - **Animation**: Fade in, slide in, etc.

### 4.3.3 Add Personalization Tags (Optional)

You can include dynamic content using Liquid syntax.

**Available variables:**
- RT attributes (configured in Step 1)
- Batch attributes (from parent segment)
- Section payload attributes (configured in Step 3)

**Example: Show user's loyalty tier**
```html
<p>As a {{profile.loyalty_tier}} member, you qualify for additional discounts.</p>
```

**Example: Show last viewed product**
```html
<p>You recently viewed: {{realtime.last_viewed_product}}</p>
```

**Note:** Test personalization tags with real user data to verify they render correctly.

### 4.3.4 Preview the Content

1. Click **Preview**
2. View desktop and mobile versions
3. Test close button functionality
4. Verify text is readable and layout is correct

## 4.4 Configure Campaign Settings

### 4.4.1 Frequency Capping (Optional)

Control how often users see the message.

**In Campaign Settings:**

1. Click **Frequency & Scheduling**
2. Configure:
   - **Max impressions per user**: 1 (show once per user)
   - **Time window**: Per session / per day / per week
   - **Delay**: Show immediately or after X seconds on page

**Example: Show once per day**
```
Max impressions: 1
Time window: 24 hours
Delay: 2 seconds after page load
```

### 4.4.2 A/B Testing (Optional)

Test multiple message variations.

**In Campaign Settings:**

1. Click **A/B Test**
2. Create variants:
   - **Variant A**: "No Returns Allowed" (serious tone)
   - **Variant B**: "All Sales Final" (friendly tone)
3. Set traffic split: 50% / 50%
4. Define success metric: Click-through rate or conversion

## 4.5 Save and Launch Campaign

1. Click **Save**
2. Click **Launch**
3. Confirm launch

**Campaign status:**
- **Draft** - Content created but not live
- **Active** - Campaign is live and messages are being served
- **Paused** - Temporarily disabled
- **Completed** - Campaign ended

## 4.6 Verify Content in Personalization Payload

Confirm that the in-app message content is written to the personalization section payload.

**Check via API:**

```bash
REGION="us01"
PS_ID="your_parent_segment_id"
PZ_ID="your_personalization_id"
TOKEN="your_personalization_token"

curl -X GET \
  "https://${REGION}.p13n.in.treasuredata.com/audiences/${PS_ID}/personalizations/${PZ_ID}?td_client_id=test_user" \
  -H "Authorization: TD1 ${TOKEN}"
```

**Expected response structure:**
```json
{
  "offers": {
    "on_sale_no_returns": {
      "attributes": {
        "td_in_app.message_json": "{\"type\":\"modal\",\"content_html\":\"<div class='popup'>...</div>\",\"style\":{...}}",
        "td_in_app.messages": [...],
        "lastProduct": "PROD-12345"
      }
    }
  }
}
```

**Key payload fields:**

| Field | Description | Example |
|-------|-------------|---------|
| `td_in_app.message_json` | Full message object (type, HTML, style) | `{"type":"modal","content_html":"<div>..."}` |
| `td_in_app.messages` | Array of messages (if multiple) | `[{...}]` |
| `td_in_app.content_html` | HTML content only (legacy) | `<div class='popup'>...</div>` |

**Parse the message_json:**
```javascript
const payload = response.offers.on_sale_no_returns.attributes;
const messageJson = JSON.parse(payload['td_in_app.message_json']);

console.log(messageJson.type);         // "modal"
console.log(messageJson.content_html); // "<div class='popup'>...</div>"
console.log(messageJson.style);        // {backgroundColor: "#fff", ...}
```

## Verification Checklist

Before proceeding to Step 5, verify:

- [ ] In-app message campaign created in Engage Studio
- [ ] Campaign linked to correct Personalization and Section
- [ ] Content designed and previewed (desktop + mobile)
- [ ] Campaign status is **Active**
- [ ] API response includes `td_in_app.message_json` field
- [ ] message_json contains expected HTML content

## Troubleshooting

**In-app message not showing in payload:**
- Verify campaign is **Active** (not Draft)
- Check campaign is linked to correct Personalization and Section
- Wait 1-2 minutes after launching campaign for payload to update
- Test with a different user ID

**message_json field is empty:**
- Verify content is saved in BeeTree Editor
- Check campaign has been launched (not just saved)
- Confirm section entry criteria are met for the test user

**HTML rendering issues:**
- Preview content in Engage Studio first
- Test with simple HTML before adding complex styling
- Check for special characters in content (quotes, brackets)
- Validate JSON structure of message_json

**Personalization tags not rendering:**
- Verify tag syntax: `{{profile.attribute_name}}`
- Check attribute exists in parent segment or RT config
- Use exact attribute names (case-sensitive)
- Test with user who has the attribute value

## Content Design Best Practices

**Keep it simple:**
- Clear headline (5-10 words)
- Concise body text (2-3 sentences)
- Single call-to-action

**Make it skimmable:**
- Use bullet points for lists
- Bold key information
- Include visual hierarchy (heading sizes)

**Mobile-first design:**
- Test on mobile viewport (320px width)
- Use large, tappable buttons (min 44px height)
- Avoid small text (min 14px font size)

**Accessibility:**
- Ensure sufficient color contrast (4.5:1 ratio)
- Include alt text for images
- Make close button keyboard-accessible

**Performance:**
- Optimize images (compress, use WebP)
- Minimize inline CSS (use classes)
- Avoid heavy animations

## Related Skills

- `engage` - Engage Studio campaign management
- `td-javascript-sdk` - Frontend SDK for rendering (next step)

---

**Next:** [Step 5: Frontend Integration with TD JavaScript SDK](05-frontend-integration.md)
