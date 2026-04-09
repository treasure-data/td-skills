# TD JavaScript SDK Integration - Complete Guide

Detailed implementation patterns for capturing consent using TD JavaScript SDK.

## SDK Initialization

```html
<!-- TD JS SDK Loader -->
<script type="text/javascript">
!function(t,e){if(void 0===e[t]){e[t]=function(){e[t].clients.push(this),this._init=[Array.prototype.slice.call(arguments)]},e[t].clients=[];for(var r=function(t){return function(){return this["_"+t]=this["_"+t]||[],this["_"+t].push(Array.prototype.slice.call(arguments)),this}},s=["addRecord","blockEvents","collectTags","consentManager","fetchGlobalID","ready","resetUUID","setAnonymousMode","setSignedMode","trackEvent","trackPageview","unblockEvents"],c=0;c<s.length;c++){var o=s[c];e[t].prototype[o]=r(o)}var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://cdn.treasuredata.com/sdk/4.4.1/td.min.js";var i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(n,i)}}("Treasure",this);
</script>

<script type="text/javascript">
var td = new Treasure({
  database: 'customer_db',
  writeKey: '1234/xxxxxxxx',
  host: 'us01.records.in.treasuredata.com'
});

// Initialize consent manager
td.consentManager.configure({
  storageKey: 'td_consent',
  defaultConsent: false
});
</script>
```

## Consent Capture Functions

```javascript
// Save consent preference
function saveConsent(consentType, isGranted) {
  const status = isGranted ? 'given' : 'refused';

  // Save via Consent Manager API
  td.consentManager.saveConsent(consentType, {
    status: isGranted ? td.consentManager.states.GIVEN : td.consentManager.states.REFUSED,
    datatype: consentType,
    context: {
      channel: 'preference_center',
      version: 'v2',
      ip: window.clientIP,
      user_agent: navigator.userAgent
    }
  });

  // Also send to consent_tracking table
  td.addRecord('consent_tracking', {
    customer_id: window.userId,
    email: window.userEmail,
    consent_type: consentType,
    consent_status: status,
    consent_timestamp: Date.now(),
    consent_channel: 'web',
    consent_version: 'v2',
    consent_ip_address: window.clientIP,
    consent_user_agent: navigator.userAgent
  });
}

// Example usage
saveConsent('email_marketing', true);
saveConsent('sms', false);
```

## Privacy Controls

```javascript
// Enable anonymous mode (excludes PII)
function enablePrivacyMode() {
  td.setAnonymousMode();
  td.blockEvents();
}

// Disable anonymous mode
function disablePrivacyMode() {
  td.setSignedMode();
  td.unblockEvents();
}

// Reset user identity
function resetIdentity() {
  td.resetUUID();
}
```

## Cookie Banner Integration

```javascript
// Simple cookie banner
function showCookieBanner() {
  const banner = document.createElement('div');
  banner.innerHTML = `
    <div style="position: fixed; bottom: 0; width: 100%; background: #333; color: white; padding: 20px; text-align: center;">
      <p>We use cookies to improve your experience. Choose your preferences:</p>
      <button onclick="acceptAllCookies()">Accept All</button>
      <button onclick="acceptEssentialOnly()">Essential Only</button>
      <button onclick="showCookieSettings()">Customize</button>
    </div>
  `;
  document.body.appendChild(banner);
}

function acceptAllCookies() {
  saveConsent('cookies', true);
  saveConsent('analytics', true);
  saveConsent('advertising', true);
  hideCookieBanner();
}

function acceptEssentialOnly() {
  saveConsent('cookies', false);
  saveConsent('analytics', false);
  saveConsent('advertising', false);
  hideCookieBanner();
}
```

## Regional Endpoints

Configure the correct endpoint for your region:

```javascript
const REGIONS = {
  'US': 'us01.records.in.treasuredata.com',
  'Tokyo': 'ap01.records.in.treasuredata.com',
  'EU': 'eu01.records.in.treasuredata.com',
  'AP': 'ap02.records.in.treasuredata.com'
};

var td = new Treasure({
  database: 'customer_db',
  writeKey: '1234/xxxxxxxx',
  host: REGIONS['US']  // Change based on region
});
```

## See Also

- Complete preference center: `examples/preference-center.html`
- TD Consent Manager docs: https://api-docs.treasuredata.com/en/sdk/js-sdk/consent-manager/
