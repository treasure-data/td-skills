# Step 5: Frontend Integration with TD JavaScript SDK

**Audience:** Frontend developers  
**Duration:** ~40 minutes

## Overview

Integrate the TD JavaScript SDK to send events and fetch personalized in-app content.

Complete flow: event tracking → RT processing → personalization API → content rendering.

## Prerequisites

- Steps 1-4 completed
- Personalization token from Step 2
- Frontend codebase access

## 5.1 Load and Initialize TD SDK

Add SDK loader to `<head>` and initialize:

```html
<!-- TD SDK Loader -->
<script type="text/javascript">
!function(t,e){if(void 0===e[t]){e[t]=function(){e[t].clients.push(this),this._init=[Array.prototype.slice.call(arguments)]},e[t].clients=[];
for(var r=function(t){return function(){return this["_"+t]=this["_"+t]||[],this["_"+t].push(Array.prototype.slice.call(arguments)),this}},
    s=["collectTags","addRecord","blockEvents","fetchServerCookie","fetchGlobalID","fetchUserSegments","fetchPersonalization",
       "resetUUID","ready","setSignedMode","setAnonymousMode","set","trackEvent","trackPageview","trackClicks","unblockEvents"],
    c=0;c<s.length;c++){var o=s[c];e[t].prototype[o]=r(o)}
var n=document.createElement("script");n.type="text/javascript",n.async=!0,
    n.src="https://cdn.treasuredata.com/sdk/4.4.1/td.min.js";
var i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(n,i)}}("Treasure",this);
</script>

<!-- Initialize -->
<script>
var td = new Treasure({
  host: 'YOUR_REGION.records.in.treasuredata.com',  // e.g., us01.records.in.treasuredata.com
  writeKey: 'YOUR_WRITE_KEY',     // From TD Console → Integrations → JavaScript SDK
  database: 'web_events',
  startInSignedMode: true
});
</script>
```

## 5.2 Send Events to Trigger RT

Track events that match your RT key event configuration:

```javascript
// Track product view
td.trackEvent('product_views', {
  event_name: 'product_view',
  product_id: 'PROD-12345',
  product_status: 'on_sale',        // Must match entry criteria filters
  price: 79.99,
  user_id: getCurrentUserId()
});

// Set user identifiers (for ID stitching)
td.set('$global', {
  user_id: 'USER_001',
  email: 'user@example.com'
});
```

**Key fields:**
- `td_client_id` - Auto-set by SDK
- `user_id`, `email` - Set manually for ID stitching
- Event field names must match RT configuration exactly

## 5.3 Fetch Personalization

Configure and call the personalization API:

```javascript
// Config
const p13nConfig = {
  endpoint: 'https://us01.p13n.in.treasuredata.com',  // Your region
  database: 'web_events',
  table: 'product_views',
  token: 'YOUR_PERSONALIZATION_TOKEN'
};

// Request
const requestData = {
  td_client_id: td.client.track.uuid,
  user_id: getCurrentUserId(),
  product_status: 'on_sale'  // Match entry criteria
};

// Fetch
td.fetchPersonalization(p13nConfig, requestData, onSuccess, onError);

function onSuccess(response) {
  if (!response.offers) return;
  
  const offer = response.offers['on_sale_no_returns'];
  renderInAppMessage(offer);
}

function onError(error) {
  console.error('Personalization error:', error);
}
```

**Response structure:**
```json
{
  "offers": {
    "on_sale_no_returns": {
      "attributes": {
        "td_in_app.message_json": "{...}",
        "lastProduct": "PROD-12345"
      }
    }
  }
}
```

## 5.4 Render In-App Message

### 5.4.1 Parse and Extract Content

Extract the HTML content from the response.

```javascript
function renderInAppMessage(offer) {
  // Get attributes
  const attrs = offer.attributes || {};
  
  // Get message JSON
  const messageJson = attrs['td_in_app.message_json'];
  
  if (!messageJson) {
    console.log('No in-app message in payload');
    return;
  }
  
  // Parse JSON
  let message;
  try {
    message = JSON.parse(messageJson);
  } catch (e) {
    console.error('Failed to parse message JSON:', e);
    return;
  }
  
  console.log('Message:', message);
  
  // Extract content
  const contentHtml = message.content_html;
  const messageType = message.type;  // "modal", "embed", etc.
  const style = message.style || {};
  
  // Render based on type
  if (messageType === 'modal') {
    renderModal(contentHtml, style);
  } else if (messageType === 'embed') {
    renderEmbed(contentHtml, style);
  }
}
```

### 5.4.2 Render Modal Popup

Create and display a modal overlay.

```javascript
function renderModal(contentHtml, style) {
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'td-personalization-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  // Create modal content wrapper
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    position: relative;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  
  // Apply custom styles from message
  if (style.backgroundColor) {
    modalContent.style.backgroundColor = style.backgroundColor;
  }
  
  // Insert content HTML
  modalContent.innerHTML = contentHtml;
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
  `;
  closeButton.onclick = function() {
    modal.remove();
    trackModalClosed();
  };
  
  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);
  
  // Attach to DOM
  document.body.appendChild(modal);
  
  // Track impression
  trackModalShown();
  
  console.log('Modal rendered');
}
```

### 5.4.3 Render Embedded Content

Insert content inline in the page.

```javascript
function renderEmbed(contentHtml, style) {
  // Find target container (customize based on your page structure)
  const container = document.querySelector('#personalization-container');
  
  if (!container) {
    console.error('Personalization container not found');
    return;
  }
  
  // Create embed wrapper
  const embed = document.createElement('div');
  embed.id = 'td-personalization-embed';
  embed.innerHTML = contentHtml;
  
  // Apply styles
  if (style.backgroundColor) {
    embed.style.backgroundColor = style.backgroundColor;
  }
  
  // Insert into container
  container.appendChild(embed);
  
  // Track impression
  trackEmbedShown();
  
  console.log('Embed rendered');
}
```

### 5.4.4 Track Interactions

Track when users interact with the personalized content.

```javascript
function trackModalShown() {
  td.trackEvent('personalization_events', {
    event_name: 'modal_shown',
    section: 'on_sale_no_returns',
    timestamp: Date.now()
  });
}

function trackModalClosed() {
  td.trackEvent('personalization_events', {
    event_name: 'modal_closed',
    section: 'on_sale_no_returns',
    timestamp: Date.now()
  });
}

function trackEmbedShown() {
  td.trackEvent('personalization_events', {
    event_name: 'embed_shown',
    section: 'on_sale_no_returns',
    timestamp: Date.now()
  });
}
```

## 5.5 Complete Integration Example

A complete working example is provided below in this section.

**Quick overview:**

```javascript
// 1. Initialize SDK
var td = new Treasure({
  host: 'YOUR_REGION.records.in.treasuredata.com',  // e.g., us01.records.in.treasuredata.com
  writeKey: 'YOUR_WRITE_KEY',
  database: 'web_events'
});

// 2. Track event
td.trackEvent('product_views', {
  event_name: 'product_view',
  product_id: 'PROD-12345',
  product_status: 'on_sale'
});

// 3. Fetch personalization
td.fetchPersonalization(p13nConfig, requestData, onSuccess, onError);

// 4. Render content
function onSuccess(response) {
  const offer = response.offers['on_sale_no_returns'];
  const message = JSON.parse(offer.attributes['td_in_app.message_json']);
  renderModal(message.content_html, message.style);
}
```

## Verification Checklist

After integration, verify:

- [ ] TD SDK loads without errors (check browser console)
- [ ] Events are tracked (check TD Console → Data Browser)
- [ ] fetchPersonalization returns expected payload
- [ ] In-app message renders correctly (desktop + mobile)
- [ ] Close button works
- [ ] Impression tracking events are sent
- [ ] No console errors or warnings

## Troubleshooting

**SDK doesn't load:**
- Check network tab for script load errors
- Verify CDN URL is correct: `https://cdn.treasuredata.com/sdk/4.4.1/td.min.js`
- Check for ad blockers or CSP restrictions

**Events not appearing in TD:**
- Verify write key is correct (format: `<db_id>/<key>`)
- Check database name matches TD database
- Wait 1-2 minutes for events to appear
- Check browser console for SDK errors

**fetchPersonalization returns empty offers:**
- Verify entry criteria are met (check event filters and attribute conditions)
- Test with a user ID that has RT attributes populated
- Check personalization is Active (not Draft or Paused)
- Wait 1-2 minutes after sending event before fetching

**CORS errors:**
- Add your domain to allowed origins in personalization service (Step 2)
- Check browser console for specific CORS error
- Test from allowed domain or use `*` for testing

**Modal doesn't render:**
- Check `message_json` field exists in response
- Verify JSON.parse doesn't throw error (valid JSON)
- Check `content_html` is not empty
- Inspect DOM to see if modal element was created

**Content looks broken:**
- Preview content in Engage Studio first
- Check for CSS conflicts with your site styles
- Use Shadow DOM to isolate styles (advanced)
- Test with simplified HTML first

## Performance Optimization

**Lazy load SDK:**
```javascript
// Only load SDK when needed (e.g., on specific pages)
if (isProductPage()) {
  loadTDSDK();
}
```

**Cache personalization responses:**
```javascript
// Cache response for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
let cachedResponse = null;
let cacheTimestamp = null;

function getCachedPersonalization() {
  if (cachedResponse && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedResponse;
  }
  return null;
}
```

**Debounce event tracking:**
```javascript
// Avoid tracking duplicate events rapidly
let lastEventTime = 0;
const EVENT_DEBOUNCE = 2000;  // 2 seconds

function trackProductView(productId) {
  if (Date.now() - lastEventTime < EVENT_DEBOUNCE) {
    return;  // Skip duplicate
  }
  
  td.trackEvent('product_views', { product_id: productId });
  lastEventTime = Date.now();
}
```

## Related Skills

- `td-javascript-sdk` - Full SDK reference
- `rt-personalization` - Personalization API details

---

**Next:** [Step 6: Verification & Testing](06-verification.md)
