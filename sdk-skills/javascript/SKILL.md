---
name: td-javascript-sdk
description: Expert assistance for importing data to Treasure Data using the JavaScript SDK. Use this skill when users need help with browser-based event tracking, page analytics, client-side data collection, or implementing TD's JS SDK for web applications.
---

# Treasure Data JavaScript SDK

Expert assistance for implementing client-side data collection and event tracking with the Treasure Data JavaScript SDK.

## When to Use This Skill

Use this skill when:
- Implementing browser-based event tracking for web applications
- Setting up page view analytics and user behavior tracking
- Collecting client-side data (clicks, form submissions, user interactions)
- Integrating TD data collection into JavaScript/frontend applications
- Migrating from other analytics platforms to TD's event tracking
- Troubleshooting JS SDK configuration or data import issues

## Core Principles

### 1. Installation Methods

**Script Loader (Recommended for Most Cases):**
```html
<script type="text/javascript">
  !function(t,e){if(void 0===e[t]){e[t]=function(){e[t].clients.push(this),this._init=[Array.prototype.slice.call(arguments)]},e[t].clients=[];for(var r=function(t){return function(){return this["_"+t]=this["_"+t]||[],this["_"+t].push(Array.prototype.slice.call(arguments)),this}},n=["addRecord","blockEvents","fetchServerCookie","fetchGlobalID","fetchUserSegments","resetUUID","ready","setSignedMode","setAnonymousMode","set","trackEvent","trackPageview","trackClicks","unblockEvents"],s=0;s<n.length;s++){var c=n[s];e[t].prototype[c]=r(c)}var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=("https:"===document.location.protocol?"https:":"http:")+"//cdn.treasuredata.com/sdk/2.5/td.min.js";var i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(o,i)}}("Treasure",this);
</script>
```

**NPM Package (For Bundlers like Webpack/Browserify):**
```bash
npm install --save td-js-sdk
```

```javascript
import Treasure from 'td-js-sdk';
```

**Important:** The SDK is **browser-only** and does not work with Node.js. For server-side data import, use the REST API or other SDKs.

### 2. SDK Initialization

Initialize the SDK with your database name and write-only API key:

```javascript
var treasure = new Treasure({
  database: 'your_database_name',
  writeKey: 'your_write_only_api_key',
  startInSignedMode: false  // Start in anonymous mode (default)
});
```

**Configuration Options:**
- `database` (required): TD database name
- `writeKey` (required): Write-only API key from TD console
- `clientId`: Custom UUID for client identification (auto-generated if not provided)
- `startInSignedMode`: `false` for anonymous mode (default), `true` to include PII
- `host`: Custom ingestion endpoint (advanced use cases)
- `development`: Set to `true` to enable console logging for debugging

**Obtaining API Keys:**
1. Log in to Treasure Data console
2. Navigate to your profile settings
3. Generate a write-only API key
4. Never use master or read-write keys in client-side code

### 3. Data Import Methods

#### addRecord() - Custom Event Data

Send custom data objects to specified tables:

```javascript
// Basic usage
treasure.addRecord('events', {
  event_type: 'purchase',
  product_id: 'SKU-12345',
  amount: 99.99,
  currency: 'USD',
  user_id: 'user_abc123'
});

// With callback
treasure.addRecord('user_actions', {
  action: 'form_submit',
  form_id: 'newsletter_signup',
  success: true
}, function(response) {
  console.log('Data sent successfully', response);
});
```

#### trackPageview() - Page View Tracking

Track page impressions with automatic context data:

```javascript
// Track to 'pageviews' table
treasure.trackPageview('pageviews');

// Track with custom properties
treasure.trackPageview('pageviews', {
  category: 'product_page',
  product_id: 'SKU-12345'
});
```

**Automatic Context Data Included:**
- Page URL, title, referrer, host, path
- Screen resolution, viewport dimensions, color depth
- Browser language, user agent, platform
- TD client ID, SDK version
- Timestamp

#### trackEvent() - Custom Event Tracking

Track custom events with context:

```javascript
// Basic event
treasure.trackEvent('button_click', {
  button_id: 'cta_signup',
  location: 'hero_section'
});

// Complex event with nested data
treasure.trackEvent('video_interaction', {
  video_id: 'intro_video_v2',
  action: 'play',
  timestamp_seconds: 45,
  playback_rate: 1.0,
  quality: '1080p'
});
```

## Common Patterns

### Pattern 1: E-commerce Tracking

```javascript
// Initialize SDK
var treasure = new Treasure({
  database: 'ecommerce_analytics',
  writeKey: 'your_write_only_key'
});

// Set global context (user session data)
treasure.set('$global', {
  user_id: getCurrentUserId(),
  session_id: getSessionId(),
  environment: 'production'
});

// Track product views
function trackProductView(product) {
  treasure.trackEvent('product_view', {
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    price: product.price,
    currency: 'USD'
  });
}

// Track add to cart
function trackAddToCart(product, quantity) {
  treasure.trackEvent('add_to_cart', {
    product_id: product.id,
    quantity: quantity,
    price: product.price,
    total_value: product.price * quantity
  });
}

// Track purchase completion
function trackPurchase(order) {
  treasure.addRecord('purchases', {
    order_id: order.id,
    total_amount: order.total,
    currency: 'USD',
    items: order.items,
    payment_method: order.payment_method,
    shipping_address: order.shipping.country
  });
}
```

**Explanation:** This pattern sets up comprehensive e-commerce tracking with global context shared across all events, ensuring consistent user and session identification.

### Pattern 2: Form Tracking with Error Handling

```javascript
// Form submission tracking
document.getElementById('signup-form').addEventListener('submit', function(e) {
  e.preventDefault();

  var formData = {
    form_id: 'user_signup',
    email: this.email.value,
    plan: this.plan.value,
    referral_source: document.referrer
  };

  // Send to TD before form submission
  treasure.addRecord('form_submissions', formData, function(error, response) {
    if (error) {
      console.error('TD tracking failed:', error);
      // Continue with form submission even if tracking fails
    }

    // Proceed with actual form submission
    submitForm(formData);
  });
});

// Form abandonment tracking
var formStarted = false;
document.querySelectorAll('form input').forEach(function(input) {
  input.addEventListener('focus', function() {
    if (!formStarted) {
      formStarted = true;
      treasure.trackEvent('form_started', {
        form_id: 'user_signup'
      });
    }
  });
});

window.addEventListener('beforeunload', function() {
  if (formStarted && !formSubmitted) {
    treasure.trackEvent('form_abandoned', {
      form_id: 'user_signup',
      fields_completed: getCompletedFieldCount()
    });
  }
});
```

**Explanation:** Tracks form interactions including starts, submissions, and abandonments. Uses callbacks to ensure tracking doesn't block user experience.

### Pattern 3: User Session Tracking with Privacy Controls

```javascript
var treasure = new Treasure({
  database: 'user_analytics',
  writeKey: 'your_write_only_key',
  startInSignedMode: false  // Start anonymous
});

// Check user consent
function initializeTracking() {
  var hasConsent = checkUserConsent();

  if (hasConsent) {
    // User consented, enable full tracking
    treasure.setSignedMode();
    treasure.unblockEvents();

    treasure.set('$global', {
      user_id: getUserId(),
      consent_given: true,
      consent_date: new Date().toISOString()
    });
  } else {
    // User declined, use anonymous mode
    treasure.setAnonymousMode();
    treasure.blockEvents();  // Or collect minimal data
  }
}

// Update when consent changes
function onConsentGranted() {
  treasure.setSignedMode();
  treasure.unblockEvents();
  treasure.resetUUID();  // Generate new client ID

  treasure.trackEvent('consent_granted', {
    timestamp: new Date().toISOString()
  });
}

function onConsentRevoked() {
  treasure.trackEvent('consent_revoked', {
    timestamp: new Date().toISOString()
  });

  treasure.setAnonymousMode();
  treasure.blockEvents();
}
```

**Explanation:** Implements GDPR/privacy-compliant tracking with consent management. Starts in anonymous mode and only enables full tracking after user consent.

### Pattern 4: Single Page Application (SPA) Tracking

```javascript
// Initialize once
var treasure = new Treasure({
  database: 'spa_analytics',
  writeKey: 'your_write_only_key'
});

// Track route changes (example with vanilla JS)
var currentPage = window.location.pathname;

function trackPageChange() {
  var newPage = window.location.pathname;

  if (newPage !== currentPage) {
    // Track page view
    treasure.trackPageview('pageviews', {
      previous_page: currentPage,
      navigation_type: 'spa_route_change'
    });

    currentPage = newPage;
  }
}

// Listen for history changes
window.addEventListener('popstate', trackPageChange);

// Override pushState and replaceState
var pushState = history.pushState;
history.pushState = function() {
  pushState.apply(history, arguments);
  trackPageChange();
};

var replaceState = history.replaceState;
history.replaceState = function() {
  replaceState.apply(history, arguments);
  trackPageChange();
};

// Track time on page
var pageStartTime = Date.now();

window.addEventListener('beforeunload', function() {
  treasure.trackEvent('page_engagement', {
    page: window.location.pathname,
    time_spent_seconds: Math.round((Date.now() - pageStartTime) / 1000)
  });
});
```

**Explanation:** Handles SPA routing by intercepting navigation events and tracking virtual page views. Includes time-on-page metrics for engagement analysis.

## Best Practices

1. **Use Write-Only API Keys** - Never expose master or read-write keys in client-side code. Generate write-only keys specifically for JS SDK use.

2. **Set Global Defaults** - Use `treasure.set('$global', {...})` for properties that apply to all events (user_id, environment, app_version).

3. **Table-Level Defaults** - Set common properties per table: `treasure.set('table_name', 'property', 'value')`.

4. **Asynchronous Loading** - Use the async loader script to avoid blocking page rendering.

5. **Privacy by Default** - Start in anonymous mode and only enable signed mode after obtaining user consent.

6. **Validate Data Client-Side** - Check data types and required fields before sending to avoid ingestion errors.

7. **Use Callbacks for Critical Events** - For important events (purchases, signups), use callbacks to ensure data is sent before navigation.

8. **Include Context** - Add contextual information (page section, feature version, A/B test variant) to events for richer analysis.

9. **Batch Related Events** - The SDK handles batching internally, but group related `addRecord` calls together in code for clarity.

10. **Monitor Console in Development** - Use `development: true` config option during testing to see SDK activity.

## Common Issues and Solutions

### Issue: Events Not Appearing in TD

**Symptoms:**
- Data sent from browser but not visible in TD console
- No errors in browser console

**Solutions:**
1. **Check API Key Permissions**
   - Verify you're using a write-only key
   - Ensure key has write access to the specified database
   - Check key hasn't been revoked

2. **Verify Database Name**
   ```javascript
   // Incorrect: using underscores or special characters incorrectly
   database: 'my-database'  // May fail

   // Correct: use valid database names
   database: 'my_database'  // Works
   ```

3. **Check Browser Network Tab**
   - Look for requests to `in.treasuredata.com`
   - Verify 200 OK responses
   - Check for CORS errors (rare, but possible with custom configurations)

4. **Data Delay**
   - Browser SDK uses streaming ingestion
   - Data may take 1-5 minutes to appear in TD console
   - For v4.0+ SDK, data should appear within ~1 minute

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS policy errors
- Requests to TD endpoints blocked

**Solutions:**
1. Ensure using official TD CDN URL for SDK
2. Check custom `host` configuration if set
3. Verify SSL/HTTPS configuration matches your site

**Example Fix:**
```javascript
// Don't customize host unless necessary
var treasure = new Treasure({
  database: 'your_database',
  writeKey: 'your_key'
  // Remove custom 'host' setting
});
```

### Issue: Data Not Matching Expected Schema

**Symptoms:**
- Fields have wrong data types in TD
- Nested objects not properly stored

**Solutions:**
1. **Flatten Complex Objects**
   ```javascript
   // Problematic: deeply nested
   treasure.addRecord('events', {
     user: {
       profile: {
         name: 'John',
         age: 30
       }
     }
   });

   // Better: flattened structure
   treasure.addRecord('events', {
     user_name: 'John',
     user_age: 30
   });
   ```

2. **Consistent Data Types**
   ```javascript
   // Ensure consistent types across events
   treasure.addRecord('events', {
     user_id: String(userId),  // Always string
     amount: parseFloat(amount),  // Always number
     timestamp: new Date().toISOString()  // Always ISO string
   });
   ```

3. **Handle Null/Undefined Values**
   ```javascript
   function sendEvent(data) {
     // Remove undefined/null values
     var cleanData = Object.keys(data).reduce(function(acc, key) {
       if (data[key] != null) {
         acc[key] = data[key];
       }
       return acc;
     }, {});

     treasure.addRecord('events', cleanData);
   }
   ```

### Issue: SDK Not Loading

**Symptoms:**
- `Treasure is not defined` errors
- SDK script fails to load

**Solutions:**
1. **Check Script Placement**
   ```html
   <!-- Place in <head> before other scripts that use it -->
   <head>
     <script type="text/javascript">
       /* Treasure loader script */
     </script>
   </head>
   ```

2. **Verify CDN Availability**
   - Check network connectivity
   - Verify CDN URL is correct: `https://cdn.treasuredata.com/sdk/2.5/td.min.js`
   - Check for ad blockers or privacy extensions blocking the script

3. **Use Ready Callback**
   ```javascript
   var treasure = new Treasure({
     database: 'your_database',
     writeKey: 'your_key'
   });

   treasure.ready(function() {
     // SDK fully loaded, safe to track
     treasure.trackPageview('pageviews');
   });
   ```

## Advanced Topics

### Custom Client ID Management

For cross-device tracking or specific user identification:

```javascript
var treasure = new Treasure({
  database: 'your_database',
  writeKey: 'your_key',
  clientId: getUserIdFromYourSystem()  // Use your own UUID
});

// Reset UUID when user logs out
function onUserLogout() {
  treasure.resetUUID();
  treasure.setAnonymousMode();
}
```

### Server-Side Cookie Integration

Fetch server-side TD cookies for unified tracking:

```javascript
treasure.fetchServerCookie(function(error, cookie) {
  if (!error && cookie) {
    console.log('Server cookie:', cookie);
    // Use cookie data for unified tracking
  }
});
```

### Global ID and User Segments

Fetch TD Global ID and user segments for personalization:

```javascript
// Fetch Global ID
treasure.fetchGlobalID(function(error, globalId) {
  if (!error) {
    console.log('TD Global ID:', globalId);
  }
});

// Fetch user segments (requires audience configuration)
treasure.fetchUserSegments({
  audienceToken: 'your_audience_token',
  keys: {
    td_global_id: 'global_id_value'
  }
}, function(error, segments) {
  if (!error) {
    console.log('User segments:', segments);
    // Use for personalization
  }
});
```

### Automatic Click Tracking

Enable automatic tracking of all link clicks:

```javascript
treasure.trackClicks({
  element: document.body,  // Track clicks within body
  tableName: 'clicks',     // Target table
  attributes: {            // Custom attributes to include
    page: window.location.pathname
  }
});
```

## Testing and Debugging

### Development Mode

Enable console logging during development:

```javascript
var treasure = new Treasure({
  database: 'your_database',
  writeKey: 'your_key',
  development: true  // Enables console logging
});
```

### Manual Testing Checklist

1. **Verify SDK Initialization**
   ```javascript
   console.log('Treasure SDK loaded:', typeof Treasure !== 'undefined');
   console.log('Treasure instance:', treasure);
   ```

2. **Test Event Sending**
   ```javascript
   treasure.addRecord('test_events', {
     test_field: 'test_value',
     timestamp: new Date().toISOString()
   }, function(error, response) {
     console.log('Error:', error);
     console.log('Response:', response);
   });
   ```

3. **Check Network Traffic**
   - Open browser DevTools > Network tab
   - Filter by `treasuredata.com`
   - Verify POST requests return 200 OK
   - Inspect request payload

4. **Verify in TD Console**
   - Wait 1-5 minutes for data to appear
   - Query your table: `SELECT * FROM your_database.test_events ORDER BY time DESC LIMIT 10`

### Common Testing Patterns

```javascript
// Create test helper
function testTreasureSDK() {
  console.group('TD SDK Test');

  // Test 1: SDK loaded
  console.log('1. SDK loaded:', typeof Treasure !== 'undefined');

  // Test 2: Instance created
  console.log('2. Instance:', treasure);

  // Test 3: Send test event
  treasure.addRecord('sdk_tests', {
    test_name: 'connection_test',
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent
  }, function(error, response) {
    console.log('3. Test event error:', error);
    console.log('3. Test event response:', response);
  });

  console.groupEnd();
}

// Run tests
testTreasureSDK();
```

## Migration from Other Analytics Platforms

### From Google Analytics

```javascript
// GA pageview
ga('send', 'pageview');

// TD equivalent
treasure.trackPageview('pageviews');

// GA event
ga('send', 'event', 'category', 'action', 'label', value);

// TD equivalent
treasure.trackEvent('ga_events', {
  event_category: 'category',
  event_action: 'action',
  event_label: 'label',
  event_value: value
});

// GA user ID
ga('set', 'userId', 'USER_12345');

// TD equivalent
treasure.set('$global', { user_id: 'USER_12345' });
```

### From Mixpanel

```javascript
// Mixpanel track
mixpanel.track('Event Name', { property: 'value' });

// TD equivalent
treasure.trackEvent('Event Name', { property: 'value' });

// Mixpanel identify
mixpanel.identify('USER_12345');

// TD equivalent
treasure.set('$global', { user_id: 'USER_12345' });

// Mixpanel people.set
mixpanel.people.set({ $email: 'user@example.com' });

// TD equivalent (separate table for user properties)
treasure.addRecord('user_properties', {
  user_id: 'USER_12345',
  email: 'user@example.com'
});
```

## SDK Version and Updates

**Current Recommended Version:** 2.5.x

**Version 4.0+ Important Note:**
If using SDK version 4.0 or higher, configuration changes are required for the new streaming ingestion endpoint. Consult the official migration documentation.

**Version Check:**
```javascript
console.log('TD SDK Version:', Treasure.version);
```

## Resources

- **Official Documentation:** https://api-docs.treasuredata.com/en/sdk/js-sdk/
- **GitHub Repository:** https://github.com/treasure-data/td-js-sdk
- **TD Console:** https://console.treasuredata.com/
- **API Keys:** Profile > API Keys in TD Console
- **Support:** https://support.treasuredata.com/

## Related Skills

- **trino**: Query and analyze data collected via JS SDK using Trino SQL
- **hive**: Query and analyze data using Hive SQL
- **digdag**: Create workflows to process JS SDK event data
- **dbt**: Transform and model JS SDK event data using dbt

---

*Last updated: 2025-01 | SDK Version: 2.5.x*
