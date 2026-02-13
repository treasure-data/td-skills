---
name: rt-personalization
description: Create RT 2.0 Personalization services that return real-time personalized responses via API using tdx ps pz commands or API
---

# RT 2.0 Personalization Setup Skill

**Skill ID**: `tdx-skills:rt-personalization`
**Version**: 2.1.0
**Category**: CDP Real-Time Personalization
**Commands Used**: `tdx ps pz`, `tdx ps rt`, `tdx ps`, `tdx api`

## Description

Guides users through creating RT 2.0 Personalization services that return real-time personalized responses via API. This includes service creation, section configuration, API integration, and end-to-end testing.

## When to Use This Skill

Use this skill when you need to:
- Create real-time personalization API services
- Configure personalization sections with criteria
- Set up API integrations for web/mobile apps
- Return personalized content, recommendations, or offers
- Test and validate personalization responses

**User Intent Patterns**:
- "Set up RT personalization"
- "Create personalization API"
- "Build real-time personalization service"
- "Return personalized responses"
- "Show recommendations based on user behavior"

## Prerequisites

Before running this skill, ensure:
1. **RT Configuration Complete**: Run `tdx-skills:rt-config` first
2. **RT Enabled**: Parent segment has RT 2.0 enabled
3. **Attributes Configured**: RT attributes are capturing user data
4. **API Access**: Ability to call TD personalization APIs
5. **Integration Point**: Web/mobile app ready to consume API

## Skill Instructions

When this skill is invoked, follow these steps systematically:

---

### Phase 1: Prerequisites Validation

#### Step 1.1: Verify RT Configuration

```bash
tdx ps view <PARENT_SEGMENT_ID> --json
```

**Validation**:
- ✅ `realtime_config.status: "ok"` → Proceed
- ❌ `realtime_config` is null or empty → Stop and run `tdx-skills:rt-config` first

#### Step 1.2: List Existing Personalization Services

```bash
tdx ps pz list <PARENT_SEGMENT_ID> --json
```

**Check**:
- If services exist: Ask user if they want to create new or modify existing
- If no services: Proceed to create new service

#### Step 1.3: Get RT Attributes

```bash
tdx ps view <PARENT_SEGMENT_ID> --json | jq '.attributes'
```

Extract available attributes (these can be returned in API responses):
- RT attributes (single, list, counter)
- Batch attributes (from parent segment)

---

### Phase 2: Gather Personalization Requirements

Use `AskUserQuestion` to understand the personalization use case:

**Question 1**: "What is your personalization use case?"
- **Header**: "Use Case"
- **Options**:
  - **Product Recommendations**: "Show recommended products based on browsing"
  - **Content Personalization**: "Personalize page content for users"
  - **Offer Targeting**: "Show targeted offers/promotions"
  - **User Profile**: "Return user profile data"
  - **Custom**: "Other personalization use case"

**Question 2**: "What should trigger the personalization response?"
- **Header**: "Trigger Event"
- **Options**: (Dynamically from RT config events)
  - Example: "page_view - Return personalization on page load"
  - Example: "add_to_cart - Return personalization on cart add"
  - Example: "custom_event - Return on custom event"

**Question 3**: "Do you need audience-based sections?"
- **Header**: "Segmentation"
- **Options**:
  - **Yes**: "Return different responses for different audiences"
  - **No**: "Same response structure for all users"

If "Yes", ask:
- How many audience sections? (e.g., "VIP", "New User", "Default")
- For each section:
  - Section name
  - Section criteria (e.g., "loyalty_tier = VIP")
  - Priority (higher priority sections checked first)

**Question 4**: "What data should be returned in the API response?"
- **Header**: "Response Fields"
- **multiSelect**: true
- **Options**: (Dynamically from RT attributes)
  - Example: "last_product_viewed - Show recently viewed product"
  - Example: "browsed_products_list - List of browsed products"
  - Example: "page_views_24h - User's page view count"
  - Example: "loyalty_tier - User's loyalty level"
  - **Batch Segments**: "Include batch segment memberships"

---

### Phase 3: Create Personalization Service

#### Step 3.1: Generate Service Template

Use `tdx ps pz init` to generate the correct YAML template:

```bash
tdx ps pz init <PARENT_SEGMENT_ID>
```

This creates a file `personalization_<PARENT_SEGMENT_ID>_new.yaml` with the correct structure.

#### Step 3.2: Define Service Structure

**Correct Service YAML Structure**:
```yaml
parent_segment_id: '{PARENT_SEGMENT_ID}'
parent_segment_name: '{PARENT_SEGMENT_NAME}'
personalization_service:
  name: '{SERVICE_NAME}'
  description: '{SERVICE_DESCRIPTION}'
  trigger_event: '{EVENT_NAME}'  # e.g., 'page_view'

  sections:
    # Section 1 - Evaluated first
    - name: '{SECTION_1_NAME}'
      criteria: '{SQL_EXPRESSION}'  # e.g., 'page_views_24h > 5'
      attributes:
        - {ATTRIBUTE_NAME_1}  # Simple list of attribute names
        - {ATTRIBUTE_NAME_2}
        - {ATTRIBUTE_NAME_3}
      batch_segments:
        - {SEGMENT_NAME_1}  # Simple list of segment names (optional)

    # Section 2 - Default fallback (evaluated if Section 1 doesn't match)
    - name: '{SECTION_2_NAME}'
      criteria: ''  # Empty criteria = matches all (default section)
      attributes:
        - {ATTRIBUTE_NAME_1}
        - {ATTRIBUTE_NAME_2}
      batch_segments: []
```

**Important Changes from Old Schema**:
- ❌ **Removed**: `section_id`, `priority`, `settings`
- ✅ **Top-level structure**: `parent_segment_id`, `parent_segment_name`, `personalization_service`
- ✅ **Criteria**: Single SQL-like expression string (NOT an array)
- ✅ **Attributes**: Simple list of attribute names (NO aliases)
- ✅ **Evaluation order**: Sections evaluated in YAML array order (first match wins)

**Save to**: `pz_service_{SERVICE_NAME}.yaml`

---

### Phase 4: Configure Service Sections

Based on user requirements, create section configurations:

#### Section Pattern 1: Simple Single Section

**Use Case**: Return same data for all users

```yaml
sections:
  - name: "Default Section"
    criteria: ''  # Empty criteria = matches all users
    attributes:
      - last_product_viewed
      - browsed_products_list
      - page_views_24h
    batch_segments: []
```

**API Response** (attribute names used directly):
```json
{
  "last_product_viewed": "product_123",
  "browsed_products_list": ["product_123", "product_456", "product_789"],
  "page_views_24h": 42
}
```

**Note**: Attributes are returned with their original names. No aliases/renaming supported in CLI method.

#### Section Pattern 2: Multi-Section with Criteria

**Use Case**: Different responses for VIP vs. regular users

```yaml
sections:
  # VIP Section (evaluated first)
  - name: "VIP Customers"
    criteria: 'loyalty_tier = ''VIP'''  # SQL expression
    attributes:
      - vip_exclusive_products_list
      - vip_discount_percentage
      - loyalty_points
    batch_segments:
      - vip_members_segment  # Segment name, not ID

  # Regular Section (fallback - evaluated if VIP criteria doesn't match)
  - name: "Regular Customers"
    criteria: ''  # Matches everyone (default)
    attributes:
      - browsed_products_list
      - standard_discount_percentage
    batch_segments: []
```

**API Response (VIP User)**:
```json
{
  "vip_exclusive_products_list": ["vip_product_1", "vip_product_2"],
  "vip_discount_percentage": 20,
  "loyalty_points": 5000,
  "vip_members_segment": true
}
```

**API Response (Regular User)**:
```json
{
  "browsed_products_list": ["product_1", "product_2"],
  "standard_discount_percentage": 10
}
```

#### Section Pattern 3: Dynamic Segmentation

**Use Case**: Return response based on user behavior (cart value, page views, etc.)

```yaml
sections:
  # High Intent Section (evaluated first)
  - name: "High Purchase Intent"
    criteria: 'cart_value > 500 AND page_views_24h > 10'  # SQL expression with AND
    attributes:
      - cart_items_list
      - recommended_accessories
      - checkout_discount_amount
    batch_segments: []

  # Low Intent Section (evaluated second)
  - name: "Browsing Users"
    criteria: 'page_views_24h < 5'  # Numeric comparison
    attributes:
      - browsed_categories_list
      - popular_products_list
    batch_segments: []

  # Default Section (evaluated last - catches all remaining users)
  - name: "Default"
    criteria: ''  # Empty = matches everyone
    attributes:
      - last_product_viewed
    batch_segments: []
```

**Criteria Expression Syntax** (SQL-like):
- **Comparison**: `>`, `<`, `>=`, `<=`, `=`, `!=`
- **Logical**: `AND`, `OR`, `NOT`
- **Null checks**: `IS NULL`, `IS NOT NULL`
- **Pattern matching**: `LIKE`, `NOT LIKE` (use single quotes for strings)
- **List membership**: `IN ('val1', 'val2', 'val3')`

**Examples**:
```yaml
# Simple comparison
criteria: 'page_views_24h > 5'

# Multiple conditions
criteria: 'page_views_24h > 5 AND loyalty_tier = ''VIP'''

# Null handling
criteria: 'email IS NOT NULL AND page_views_24h > 0'

# Pattern matching
criteria: 'last_page_viewed LIKE ''%/pricing%'''

# List membership
criteria: 'loyalty_tier IN (''VIP'', ''Premium'', ''Gold'')'
```

---

### Phase 5: Execute Service Creation (Push to TD)

Now **actually create** the Personalization Service in Treasure Data:

#### Step 5.1: Show Service Summary

Display what will be created:
```
=== Personalization Service to be Created ===

Name: {SERVICE_NAME}
Description: {SERVICE_DESCRIPTION}
Parent Segment: {PARENT_SEGMENT_NAME} ({PARENT_SEGMENT_ID})

Trigger Event: {EVENT_NAME}

Sections: {COUNT}
  1. {SECTION_1_NAME} (Priority: 1)
     Criteria: {CRITERIA}
     Attributes: {ATTR_COUNT}
     Segments: {SEGMENT_COUNT}

  2. {SECTION_2_NAME} (Priority: 2)
     Criteria: {CRITERIA or "Default - matches all"}
     Attributes: {ATTR_COUNT}
     Segments: {SEGMENT_COUNT}

Total Attributes Returned: {TOTAL_ATTRS}
```

#### Step 5.2: Confirm Creation

**Question**: "Ready to create this Personalization Service?"
- **Options**:
  - **Create now**: Create service immediately
  - **Save YAML first**: Save to file for review
  - **Cancel**: Don't create yet

#### Step 5.3: Execute Service Creation

If user confirms, **execute the creation**:

```bash
# Save Service YAML
cat > pz_service_{SERVICE_NAME}.yaml << 'EOF'
{GENERATED_SERVICE_YAML}
EOF

# Create/update service
echo "Creating personalization service..."
tdx ps push pz_service_{SERVICE_NAME}.yaml -y

# Get service ID from list
SERVICE_ID=$(tdx ps pz list {PARENT_SEGMENT_ID} --json | jq -r '.[] | select(.name=="{SERVICE_NAME}") | .id')

if [ -n "$SERVICE_ID" ]; then
  echo "✅ Personalization service created successfully!"
  echo "Service ID: $SERVICE_ID"
  echo "$SERVICE_ID" > .service_id
else
  echo "❌ Failed to create service. Check errors above."
  exit 1
fi
```

**Note**: Use `tdx ps rt validate` to validate RT and personalization configuration. The `tdx ps push` command also validates automatically before pushing.

#### Step 5.4: Verify Service Created

After successful creation, **verify** the service:

```bash
PARENT_SEGMENT_ID="{PARENT_SEGMENT_ID}"
SERVICE_ID=$(cat .service_id)

echo "=== Service Verification ==="
tdx ps pz list $PARENT_SEGMENT_ID --json | jq ".[] | select(.id==\"$SERVICE_ID\")"
```

**Expected Output**:
```json
{
  "id": "service_abc123",
  "name": "{SERVICE_NAME}",
  "description": "{SERVICE_DESCRIPTION}",
  "parent_segment_id": "{PARENT_SEGMENT_ID}",
  "trigger_event": "{EVENT_NAME}",
  "sections": [
    {
      "id": "section_1",
      "name": "{SECTION_NAME}",
      "priority": 1,
      "criteria": [...],
      "attributes": [...],
      "batch_segments": [...]
    }
  ],
  "status": "active",
  "created_at": "{TIMESTAMP}"
}
```

**Verification Checklist**:
- ✅ Service ID created
- ✅ Status: Active
- ✅ All sections configured
- ✅ Trigger event set
- ✅ Attributes mapped correctly

#### Step 5.5: Get API Endpoint

Retrieve the API endpoint for this service:

```bash
SERVICE_ID=$(cat .service_id)
PARENT_SEGMENT_ID="{PARENT_SEGMENT_ID}"
REGION="{REGION}"

# API Endpoint
API_ENDPOINT="https://${REGION}.p13n.in.treasuredata.com/audiences/${PARENT_SEGMENT_ID}/services/${SERVICE_ID}"

echo "API Endpoint:"
echo "$API_ENDPOINT"
echo ""
echo "Saved to .api_endpoint"
echo "$API_ENDPOINT" > .api_endpoint
```

#### Step 5.6: Display Success Summary

```
✅ Personalization Service Created Successfully!

Service Details:
  - Service ID: {SERVICE_ID}
  - Service Name: {SERVICE_NAME}
  - Parent Segment: {PARENT_SEGMENT_NAME}
  - Status: ✓ ACTIVE
  - Trigger Event: {EVENT_NAME}
  - Sections: {SECTION_COUNT}
  - Attributes: {ATTR_COUNT}

API Endpoint:
  {API_ENDPOINT}

Service Configuration:
  ✓ Sections: {SECTION_NAMES}
  ✓ Attributes: {ATTRIBUTE_NAMES}
  ✓ Batch Segments: {SEGMENT_NAMES}

⚠️ Note: Personalization Services created via YAML (`tdx ps pz` workflow) may not be immediately visible in TD Console UI. Use `tdx ps pz list` to verify creation.
   For Console-visible personalizations, use the API-based method (see "Advanced" section below).

Next Steps:
  1. ✅ Service: CREATED
  2. → Generate: API integration code (Phase 6)
  3. → Test: API endpoint (Phase 7)
```

---

### Phase 6: Generate API Integration Code

Based on integration environment, generate API client code:

#### Integration Pattern 1: Server-Side (Node.js)

**File**: `personalization_client.js`

```javascript
/**
 * RT 2.0 Personalization API Client
 * Server-Side Integration (Node.js)
 */

const https = require('https');

class PersonalizationClient {
  constructor(config) {
    this.region = config.region || 'us01';
    this.parentSegmentId = config.parentSegmentId;
    this.serviceId = config.serviceId;
    this.apiKey = config.apiKey;  // TD API Key

    this.baseUrl = `${this.region}.p13n.in.treasuredata.com`;
    this.endpoint = `/audiences/${this.parentSegmentId}/services/${this.serviceId}`;
  }

  /**
   * Get personalization for a user
   *
   * @param {Object} user - User identifiers
   * @param {string} user.td_client_id - Cookie-based client ID
   * @param {string} user.email - User email (optional)
   * @param {Object} event - Event data (optional)
   * @returns {Promise<Object>} Personalization response
   */
  async getPersonalization(user, event = {}) {
    const params = new URLSearchParams({
      // User identifiers
      ...user,

      // Event context
      event_name: event.name || '{TRIGGER_EVENT}',
      event_time: event.time || new Date().toISOString(),

      // Additional event attributes
      ...event.attributes
    });

    const options = {
      hostname: this.baseUrl,
      path: `${this.endpoint}?${params.toString()}`,
      method: 'GET',
      headers: {
        'Authorization': `TD1 ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Get personalization with caching
   */
  async getPersonalizationCached(user, event = {}, cacheTTL = 300) {
    const cacheKey = `pz_${user.td_client_id || user.email}`;

    // Check cache (implement your cache - Redis, memory, etc.)
    // const cached = await cache.get(cacheKey);
    // if (cached) return cached;

    const result = await this.getPersonalization(user, event);

    // Store in cache
    // await cache.set(cacheKey, result, cacheTTL);

    return result;
  }
}

// Usage Example
const client = new PersonalizationClient({
  region: '{REGION}',
  parentSegmentId: '{PARENT_SEGMENT_ID}',
  serviceId: '{SERVICE_ID}',
  apiKey: process.env.TD_API_KEY
});

// Get personalization for a user
client.getPersonalization({
  td_client_id: 'user_123',
  email: 'user@example.com'
}, {
  name: '{TRIGGER_EVENT}',
  attributes: {
    td_path: '/product/shoes',
    product_id: 'prod_456'
  }
})
.then(response => {
  console.log('Personalization:', response);
  // Example response:
  // {
  //   section: "vip",
  //   recommendations: ["product_1", "product_2"],
  //   discount: 20,
  //   is_vip: true
  // }
})
.catch(error => {
  console.error('Error:', error.message);
});

module.exports = PersonalizationClient;
```

#### Integration Pattern 2: Client-Side (JavaScript)

**File**: `personalization_client_browser.js`

```javascript
/**
 * RT 2.0 Personalization API Client
 * Client-Side Integration (Browser)
 */

class PersonalizationClient {
  constructor(config) {
    this.region = config.region || 'us01';
    this.parentSegmentId = config.parentSegmentId;
    this.serviceId = config.serviceId;
    this.publicToken = config.publicToken;  // Public personalization token

    this.endpoint = `https://${this.region}.p13n.in.treasuredata.com/audiences/${this.parentSegmentId}/services/${this.serviceId}`;
  }

  /**
   * Get TD client ID from cookie
   */
  getTDClientId() {
    const match = document.cookie.match(/_td=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get personalization for current user
   */
  async getPersonalization(eventData = {}) {
    const td_client_id = this.getTDClientId();

    if (!td_client_id) {
      console.warn('TD client ID not found - user may not be tracked');
      return null;
    }

    const params = new URLSearchParams({
      td_client_id: td_client_id,
      token: this.publicToken,
      event_name: eventData.name || '{TRIGGER_EVENT}',
      event_time: new Date().toISOString(),
      ...eventData.attributes
    });

    try {
      const response = await fetch(`${this.endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Personalization API error:', error);
      return null;
    }
  }

  /**
   * Apply personalization to page
   */
  async applyToPage(elementId, formatter) {
    const personalization = await this.getPersonalization();

    if (!personalization) return;

    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = formatter(personalization);
    }
  }
}

// Usage Example
const pzClient = new PersonalizationClient({
  region: '{REGION}',
  parentSegmentId: '{PARENT_SEGMENT_ID}',
  serviceId: '{SERVICE_ID}',
  publicToken: '{PUBLIC_TOKEN}'
});

// On page load, get personalization and display recommendations
window.addEventListener('DOMContentLoaded', async () => {
  const pz = await pzClient.getPersonalization({
    name: 'page_view',
    attributes: {
      td_path: window.location.pathname,
      page_title: document.title
    }
  });

  if (pz) {
    console.log('Personalization received:', pz);

    // Apply to page
    if (pz.recommendations) {
      displayRecommendations(pz.recommendations);
    }

    if (pz.discount) {
      displayOffer(pz.discount);
    }
  }
});

function displayRecommendations(products) {
  const container = document.getElementById('recommendations');
  if (!container) return;

  container.innerHTML = products.map(p => `
    <div class="recommendation-item">
      <img src="/products/${p}/image.jpg" />
      <h3>${p}</h3>
    </div>
  `).join('');
}

function displayOffer(discount) {
  const banner = document.getElementById('offer-banner');
  if (banner) {
    banner.textContent = `Special offer: ${discount}% off!`;
    banner.style.display = 'block';
  }
}
```

#### Integration Pattern 3: Python (FastAPI)

**File**: `personalization_client.py`

```python
"""
RT 2.0 Personalization API Client
Server-Side Integration (Python/FastAPI)
"""

import httpx
from typing import Optional, Dict, Any
from datetime import datetime
import os

class PersonalizationClient:
    def __init__(
        self,
        region: str = "us01",
        parent_segment_id: str = None,
        service_id: str = None,
        api_key: str = None
    ):
        self.region = region
        self.parent_segment_id = parent_segment_id
        self.service_id = service_id
        self.api_key = api_key or os.getenv("TD_API_KEY")

        self.base_url = f"https://{region}.p13n.in.treasuredata.com"
        self.endpoint = f"/audiences/{parent_segment_id}/services/{service_id}"

    async def get_personalization(
        self,
        user: Dict[str, str],
        event: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get personalization for a user

        Args:
            user: User identifiers (td_client_id, email, etc.)
            event: Event data (name, attributes, etc.)

        Returns:
            Personalization response dict or None
        """
        event = event or {}

        params = {
            **user,
            "event_name": event.get("name", "{TRIGGER_EVENT}"),
            "event_time": event.get("time", datetime.utcnow().isoformat() + "Z"),
            **event.get("attributes", {})
        }

        headers = {
            "Authorization": f"TD1 {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}{self.endpoint}",
                    params=params,
                    headers=headers,
                    timeout=5.0
                )
                response.raise_for_status()
                return response.json()

            except httpx.HTTPError as e:
                print(f"Personalization API error: {e}")
                return None

# FastAPI Integration Example
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

pz_client = PersonalizationClient(
    region="{REGION}",
    parent_segment_id="{PARENT_SEGMENT_ID}",
    service_id="{SERVICE_ID}",
    api_key=os.getenv("TD_API_KEY")
)

@app.get("/api/personalize")
async def get_personalization(request: Request):
    """
    Endpoint to get personalization for current user
    """
    # Get user ID from cookie, header, or query param
    td_client_id = request.cookies.get("_td")
    email = request.query_params.get("email")

    if not td_client_id and not email:
        return JSONResponse(
            {"error": "User identifier required"},
            status_code=400
        )

    user = {}
    if td_client_id:
        user["td_client_id"] = td_client_id
    if email:
        user["email"] = email

    # Get event context from request
    event = {
        "name": request.query_params.get("event", "page_view"),
        "attributes": {
            "td_path": request.query_params.get("path", "/"),
            "referrer": request.headers.get("referer")
        }
    }

    # Get personalization
    pz = await pz_client.get_personalization(user, event)

    if pz:
        return JSONResponse(pz)
    else:
        return JSONResponse(
            {"error": "Personalization not available"},
            status_code=404
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Phase 7: Test Personalization API

#### Step 7.1: Create Test Script

**File**: `test_personalization_api.sh`

```bash
#!/bin/bash

# Test RT Personalization API
# Service: {SERVICE_NAME}

REGION="{REGION}"
PARENT_SEGMENT_ID="{PARENT_SEGMENT_ID}"
SERVICE_ID="{SERVICE_ID}"
TD_API_KEY="${TD_API_KEY}"

API_URL="https://${REGION}.p13n.in.treasuredata.com/audiences/${PARENT_SEGMENT_ID}/services/${SERVICE_ID}"

echo "=== RT Personalization API Test ==="
echo "Service: {SERVICE_NAME}"
echo "Endpoint: $API_URL"
echo ""

# Test 1: Simple request with td_client_id
echo "Test 1: Basic personalization request"
curl -s -X GET \
  "${API_URL}?td_client_id=test_user_123&event_name={TRIGGER_EVENT}" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""

# Test 2: Request with multiple identifiers
echo "Test 2: Request with email and td_client_id"
curl -s -X GET \
  "${API_URL}?td_client_id=test_user_123&email=test@example.com&event_name={TRIGGER_EVENT}" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""

# Test 3: Request with event attributes
echo "Test 3: Request with event context"
curl -s -X GET \
  "${API_URL}?td_client_id=test_user_456&event_name={TRIGGER_EVENT}&td_path=/product/shoes&product_id=prod_123" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""

# Test 4: Performance test (response time)
echo "Test 4: Performance test (10 requests)"
for i in {1..10}; do
  START=$(date +%s%3N)
  curl -s -X GET \
    "${API_URL}?td_client_id=perf_user_${i}&event_name={TRIGGER_EVENT}" \
    -H "Authorization: TD1 ${TD_API_KEY}" \
    -H "Content-Type: application/json" \
    > /dev/null
  END=$(date +%s%3N)
  DURATION=$((END - START))
  echo "  Request $i: ${DURATION}ms"
done

echo ""
echo "✅ Tests complete"
```

Make executable and run:
```bash
chmod +x test_personalization_api.sh
./test_personalization_api.sh
```

#### Step 7.2: Validate Response Structure

**Expected Response**:
```json
{
  "section": "vip",
  "attributes": {
    "recommended_product": "product_123",
    "recent_products": ["product_123", "product_456", "product_789"],
    "activity_score": 42,
    "loyalty_tier": "VIP",
    "discount": 20
  },
  "segments": {
    "is_vip": true,
    "is_high_value": true
  },
  "meta": {
    "parent_segment_id": "{PARENT_SEGMENT_ID}",
    "service_id": "{SERVICE_ID}",
    "timestamp": "2026-02-11T22:30:45Z"
  }
}
```

**Validation Checklist**:
- ✅ Response contains expected section
- ✅ All requested attributes are present
- ✅ Batch segment memberships included (if requested)
- ✅ Response time < 100ms
- ✅ No sensitive attributes in response

---

### Phase 8: Pull Existing Service (Optional)

⚠️ **Important Limitation**: `tdx ps pull` (when pulling parent segment with personalization services) only returns service metadata (id, name, description, timestamps). It does **NOT** include:
- Sections configuration
- Attributes list
- Criteria expressions
- Batch segments

**Recommended approach**: Keep your original YAML file and edit that, rather than relying on pull.

If you need to modify an existing service:

```bash
# Pull service metadata only (NOT full configuration)
tdx ps pull <PARENT_SEGMENT_ID> <SERVICE_ID> -o pz_service_{SERVICE_NAME}.yaml

# WARNING: This file will NOT contain sections/attributes/criteria
# You'll need to reconstruct them manually or use your original YAML

# Edit YAML file to add full configuration
vi pz_service_{SERVICE_NAME}.yaml

# Push updates
tdx ps push pz_service_{SERVICE_NAME}.yaml -y
```

**Better Workflow**:
```bash
# Keep your original YAML file
cp pz_service_original.yaml pz_service_updated.yaml

# Edit the copy
vi pz_service_updated.yaml

# Push updates
tdx ps push pz_service_updated.yaml -y
```

---

### Phase 9: Monitor & Optimize

#### Step 9.1: Create Monitoring Script

**File**: `monitor_personalization.sh`

```bash
#!/bin/bash

# Monitor RT Personalization Service

SERVICE_ID="{SERVICE_ID}"
PARENT_SEGMENT_ID="{PARENT_SEGMENT_ID}"

echo "=== RT Personalization Monitoring ==="
echo "Service: {SERVICE_NAME}"
echo "Started: $(date)"
echo ""

# Service Status
echo "📊 Service Status:"
tdx ps pz list $PARENT_SEGMENT_ID --json | jq ".[] | select(.id==\"$SERVICE_ID\")"

echo ""
echo "📈 Recent Metrics (Last 1 Hour):"
# Note: Metrics API may vary - adjust as needed
tdx ps pz metrics $SERVICE_ID --time-range "last_1_hour" --json 2>/dev/null | jq '{
  api_calls: .metrics.api_calls,
  unique_users: .metrics.unique_users,
  avg_response_time: .metrics.avg_response_time_ms,
  error_rate: .metrics.error_rate
}' || echo "Metrics not available via CLI - check TD console"

echo ""
echo "⚡ Recent API Calls (Sample):"
echo "  Check TD console: Data Workbench > Parent Segments > Personalization Services > Logs"

echo ""
echo "💡 Optimization Tips:"
echo "  - Cache responses for 5-10 minutes to reduce API calls"
echo "  - Use batch segments for complex criteria instead of real-time attributes"
echo "  - Monitor response times - should be < 100ms"
echo "  - Set cache_ttl based on data freshness requirements"
```

#### Step 9.2: Optimization Recommendations

**Performance**:
- Enable caching: `cache_ttl: 300` (5 minutes)
- Use CDN for static personalization content
- Implement client-side caching in browsers
- Consider edge compute (Cloudflare Workers) for ultra-low latency

**Cost**:
- Cache API responses to reduce call volume
- Use batch segments instead of complex real-time criteria when possible
- Implement fallback responses for cache misses

**Scalability**:
- Monitor API rate limits
- Implement circuit breakers for API failures
- Use async/non-blocking API clients

---

### Phase 10: Create Implementation Guide

Generate final implementation guide:

**File**: `PERSONALIZATION_IMPLEMENTATION_GUIDE.md`

```markdown
# RT 2.0 Personalization Implementation Guide

**Service Name**: {SERVICE_NAME}
**Service ID**: {SERVICE_ID}
**Created**: {TIMESTAMP}
**Parent Segment**: {PARENT_SEGMENT_NAME} ({PARENT_SEGMENT_ID})

## Quick Start

### 1. API Endpoint

```
https://{REGION}.p13n.in.treasuredata.com/audiences/{PARENT_SEGMENT_ID}/services/{SERVICE_ID}
```

### 2. Authentication

**Server-Side**:
- Use TD API Key: `Authorization: TD1 {YOUR_API_KEY}`

**Client-Side**:
- Use Public Token: `?token={PUBLIC_TOKEN}`

### 3. Request Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `td_client_id` | Yes* | Cookie-based client ID |
| `email` | Yes* | User email |
| `event_name` | Yes | Trigger event name |
| `event_time` | No | Event timestamp (ISO 8601) |

*At least one user identifier required

### 4. Example Request

```bash
curl -X GET \
  "https://{REGION}.p13n.in.treasuredata.com/audiences/{PARENT_SEGMENT_ID}/services/{SERVICE_ID}?td_client_id=user_123&event_name={TRIGGER_EVENT}" \
  -H "Authorization: TD1 {API_KEY}"
```

### 5. Example Response

```json
{
  "section": "vip",
  "recommended_product": "product_123",
  "recent_products": ["product_123", "product_456"],
  "discount": 20,
  "is_vip": true
}
```

## Integration Code

**Server-Side (Node.js)**: `personalization_client.js`
**Client-Side (JavaScript)**: `personalization_client_browser.js`
**Python**: `personalization_client.py`

## Service Configuration

### Sections ({SECTION_COUNT})

{LIST_OF_SECTIONS_WITH_CRITERIA}

### Attributes Returned ({ATTRIBUTE_COUNT})

{LIST_OF_ATTRIBUTES}

### Batch Segments ({SEGMENT_COUNT})

{LIST_OF_BATCH_SEGMENTS}

## Testing

**Test Script**: `./test_personalization_api.sh`

Run test:
```bash
export TD_API_KEY="your_api_key"
./test_personalization_api.sh
```

## Monitoring

**Monitoring Script**: `./monitor_personalization.sh`

Run monitoring:
```bash
./monitor_personalization.sh
```

**TD Console**:
- Data Workbench > Parent Segments > {PARENT_SEGMENT_NAME}
- Personalization Services > {SERVICE_NAME}
- View API call logs and metrics

## Performance

**SLA**: < 100ms response time
**Cache TTL**: {CACHE_TTL} seconds
**Rate Limits**: {RATE_LIMIT} requests/second (check with CSM)

## Best Practices

1. **Caching**: Implement client-side caching for {CACHE_TTL} seconds
2. **Error Handling**: Always have fallback responses
3. **User Privacy**: Don't log sensitive user data
4. **Performance**: Monitor response times, optimize slow sections

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | Service ID or parent segment incorrect | Verify IDs: `tdx ps pz list {PARENT_SEGMENT_ID}` |
| 401 Unauthorized | Invalid API key or token | Check API key permissions |
| Empty response | User not in parent segment | Verify user exists, check ID stitching |
| Slow responses | Complex criteria or many attributes | Reduce attributes, optimize section criteria |

## Files Generated

- pz_service_{SERVICE_NAME}.yaml
- personalization_client.js
- personalization_client_browser.js
- personalization_client.py
- test_personalization_api.sh
- monitor_personalization.sh
- PERSONALIZATION_IMPLEMENTATION_GUIDE.md

## Next Steps

### Production Deployment
- [ ] Test API with production traffic
- [ ] Monitor response times and error rates
- [ ] Implement caching strategy
- [ ] Set up alerting for API failures

### Optimization
- [ ] A/B test different personalization strategies
- [ ] Analyze section hit rates (which sections users fall into)
- [ ] Add/remove attributes based on usage
- [ ] Fine-tune section criteria

## Resources

- Service in TD Console: {CONSOLE_URL}
- Parent Segment: {PS_CONSOLE_URL}
- RT Configuration: Run `tdx ps view {PARENT_SEGMENT_ID}`
- API Documentation: https://docs.treasuredata.com/display/public/PD/RT+2.0+API
```

---

## Error Handling

### Common Errors

**Error**: "User not found"
- **Cause**: User doesn't exist in parent segment or ID stitching mismatch
- **Solution**: Verify user exists, check stitching keys match

**Error**: "No matching section"
- **Cause**: No section criteria matched the user
- **Solution**: Add a default section with empty criteria as fallback

**Error**: "Attribute not found"
- **Cause**: Referenced attribute doesn't exist in RT config
- **Solution**: Add attribute to RT config using POST API: `tdx api "/audiences/{PARENT_SEGMENT_ID}/realtime_attributes" --type cdp -X POST --data '{...}'`

**Error**: "API rate limit exceeded"
- **Cause**: Too many API calls
- **Solution**: Implement caching, reduce call frequency

**Error**: "Timeout"
- **Cause**: API taking too long to respond
- **Solution**: Reduce number of attributes, optimize criteria, check system status

---

## Tool Usage Summary

This skill uses the following tools:

- **AskUserQuestion**: Gather personalization requirements
- **Bash**: Run `tdx ps pz`, `tdx ps rt`, `tdx ps` commands, `tdx api` for direct API access
- **Write**: Generate service YAML, integration code, test scripts, guides
- **Read**: Read RT configuration and existing services

---

## Validation Checklist

Before completing this skill, verify:

- ✅ RT configuration has the trigger event
- ✅ Service YAML is valid (validation passed)
- ✅ Service is created and active
- ✅ Test API call returns expected response structure
- ✅ Response time < 100ms
- ✅ Integration code generated
- ✅ Test script runs successfully
- ✅ Implementation guide created

---

## Advanced: API-Based RT Personalization (Console UI Feature)

⚠️ **Note**: This section covers the advanced API-based RT Personalization feature that appears in the TD Console. This is different from the Personalization Services created via `tdx ps pz` (covered in earlier phases).

**Use Case**: When you need advanced features or programmatic control not available in `tdx ps pz` YAML workflow:
- Custom output field names
- Static strings in responses
- More granular profile criteria
- Console UI integration

### Prerequisites for API Method

1. ✅ RT Configuration complete
2. ✅ Parent segment has a folder (created automatically)
3. ✅ RT attributes and key events configured

### Step 1: Get Parent Segment Folder ID

```bash
API_KEY="{YOUR_API_KEY}"

curl -s -X GET \
  'https://api-cdp.treasuredata.com/audiences/{PARENT_SEGMENT_ID}/folders' \
  -H "Authorization: TD1 ${API_KEY}" | jq '.[0].id'
```

**Example Output**: `"1544797"`

Save this folder ID - you'll need it for the creation request.

### Step 2: Create RT Personalization via API

**Endpoint**: `POST /entities/realtime_personalizations`

**Important**: Must include `parentFolder` relationship!

```bash
FOLDER_ID="{FOLDER_ID_FROM_STEP_1}"

curl -s -X POST \
  'https://api-cdp.treasuredata.com/entities/realtime_personalizations' \
  -H "Authorization: TD1 ${API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  -d '{
    "attributes": {
      "audienceId": "{PARENT_SEGMENT_ID}",
      "name": "My RT Personalization",
      "description": "Real-time personalization description",
      "sections": [
        {
          "name": "Default_Section",
          "entryCriteria": {
            "name": "Trigger Description",
            "description": "Entry criteria description",
            "keyEventCriteria": {
              "keyEventId": "{KEY_EVENT_ID}",
              "keyEventFilters": {
                "type": "And",
                "conditions": []
              }
            },
            "profileCriteria": null
          },
          "payload": {
            "response_node": {
              "type": "ResponseNode",
              "name": "Response Name",
              "description": "Response description",
              "definition": {
                "attributePayload": [
                  {
                    "realtimeAttributeId": "{SINGLE_ATTR_ID}",
                    "outputName": "custom_output_name"
                  }
                ],
                "segmentPayload": null,
                "stringBuilder": [
                  {
                    "values": [
                      {
                        "value": "Static message",
                        "type": "String"
                      }
                    ],
                    "outputName": "message"
                  }
                ]
              }
            }
          },
          "includeSensitive": false
        }
      ]
    },
    "relationships": {
      "parentFolder": {
        "data": {
          "id": "'"${FOLDER_ID}"'",
          "type": "folder-segment"
        }
      }
    }
  }'
```

**Success Response**: Returns personalization object with ID

```bash
# Extract the personalization ID from response
PERSONALIZATION_ID=$(curl -s -X POST ... | jq -r '.data.id')

echo "✅ RT Personalization created!"
echo "Personalization ID: ${PERSONALIZATION_ID}"
echo ""
echo "View in TD Console:"
echo "https://console-next.us01.treasuredata.com/app/ps/{PARENT_SEGMENT_ID}/e/${PERSONALIZATION_ID}/p/de"
```

**Console URL Pattern**:
```
https://console-next.us01.treasuredata.com/app/ps/{PARENT_SEGMENT_ID}/e/{PERSONALIZATION_ID}/p/de
```

Where:
- `{PARENT_SEGMENT_ID}` = Your parent segment ID (e.g., 1069943)
- `{PERSONALIZATION_ID}` = The ID returned from POST response
- `/e/` = Entity path
- `/p/de` = Personalization detail/edit view

### Step 3: Add List Attributes (If Needed)

**Important**: List attributes require `subAttributeIdentifier` field!

The `subAttributeIdentifier` must match the aggregation identifier from your list attribute definition.

**Example** - Update personalization to add list attributes:

```bash
PERSONALIZATION_ID="{ID_FROM_STEP_2}"

curl -s -X PATCH \
  'https://api-cdp.treasuredata.com/entities/realtime_personalizations/'${PERSONALIZATION_ID} \
  -H "Authorization: TD1 ${API_KEY}" \
  -H 'Content-Type: application/vnd.treasuredata.v1+json' \
  -d '{
    "attributes": {
      "audienceId": "{PARENT_SEGMENT_ID}",
      "name": "My RT Personalization",
      "description": "Updated with list attributes",
      "sections": [
        {
          "name": "Default_Section",
          "entryCriteria": {
            "name": "Trigger Description",
            "keyEventCriteria": {
              "keyEventId": "{KEY_EVENT_ID}",
              "keyEventFilters": {
                "type": "And",
                "conditions": []
              }
            },
            "profileCriteria": null
          },
          "payload": {
            "response_node": {
              "type": "ResponseNode",
              "name": "Response Name",
              "definition": {
                "attributePayload": [
                  {
                    "realtimeAttributeId": "{SINGLE_ATTR_ID}",
                    "outputName": "single_value"
                  },
                  {
                    "realtimeAttributeId": "{LIST_ATTR_ID}",
                    "subAttributeIdentifier": "aggregation_identifier",
                    "outputName": "list_values"
                  },
                  {
                    "realtimeAttributeId": "{COUNTER_ATTR_ID}",
                    "outputName": "count_value"
                  }
                ],
                "segmentPayload": null,
                "stringBuilder": [
                  {
                    "values": [
                      {
                        "value": "Static message",
                        "type": "String"
                      }
                    ],
                    "outputName": "message"
                  }
                ]
              }
            }
          },
          "includeSensitive": false,
          "id": "{SECTION_ID_FROM_STEP_2}"
        }
      ]
    }
  }'
```

### Finding subAttributeIdentifier for List Attributes

For list attributes, you need to specify which aggregation to use:

1. **Get your list attribute details**:
   ```bash
   curl -s -X GET \
     "https://api-cdp.treasuredata.com/audiences/{PARENT_SEGMENT_ID}/realtime_attributes" \
     -H "Authorization: TD1 ${API_KEY}" | jq '.data[] | select(.id == "{LIST_ATTR_ID}")'
   ```

2. **Look for the aggregations array**:
   ```json
   {
     "id": "2336",
     "name": "my_list_attribute",
     "aggregations": [
       {
         "name": "items",
         "identifier": "items",  // ← Use this value!
         "aggregationType": "distinct_list",
         "column": "item_name"
       }
     ]
   }
   ```

3. **Use the `identifier` value** as `subAttributeIdentifier`:
   ```json
   {
     "realtimeAttributeId": "2336",
     "subAttributeIdentifier": "items",
     "outputName": "item_list"
   }
   ```

### Attribute Type Summary

| Attribute Type | subAttributeIdentifier | Example |
|----------------|------------------------|---------|
| Single | Not needed | `{"realtimeAttributeId": "123", "outputName": "name"}` |
| List | **Required** | `{"realtimeAttributeId": "456", "subAttributeIdentifier": "agg_id", "outputName": "list"}` |
| Counter | Not needed | `{"realtimeAttributeId": "789", "outputName": "count"}` |

### Verify Creation

```bash
# List all RT Personalizations for the parent segment
curl -s -X GET \
  'https://api-cdp.treasuredata.com/entities/parent_segments/{PARENT_SEGMENT_ID}/realtime_personalizations' \
  -H "Authorization: TD1 ${API_KEY}" | jq '.data[] | {id, name, sections_count: (.attributes.sections | length)}'

# Get the personalization ID
PERSONALIZATION_ID=$(curl -s -X GET \
  'https://api-cdp.treasuredata.com/entities/parent_segments/{PARENT_SEGMENT_ID}/realtime_personalizations' \
  -H "Authorization: TD1 ${API_KEY}" | jq -r '.data[0].id')

# Display Console URL
echo "View in Console:"
echo "https://console-next.us01.treasuredata.com/app/ps/{PARENT_SEGMENT_ID}/e/${PERSONALIZATION_ID}/p/de"
```

**Console URL**: `https://console-next.us01.treasuredata.com/app/ps/{PARENT_SEGMENT_ID}/e/{PERSONALIZATION_ID}/p/de`

### Comparison: CLI vs API Method

| Feature | CLI (`tdx ps pz`) | API Method |
|---------|----------------|------------|
| **Creation** | `tdx ps push` | `POST /entities/realtime_personalizations` |
| **Console Visible** | ❌ No | ✅ Yes |
| **Custom Output Names** | ❌ No (uses attribute names) | ✅ Yes |
| **Static Strings** | ❌ No | ✅ Yes |
| **List Attributes** | ⚠️ Simple | ✅ Requires subAttributeIdentifier |
| **Complexity** | Simple | More complex |
| **Recommended For** | Quick setup, simple needs | Production, full features |

---

## Success Criteria

Skill is successful when:
1. Personalization service is created and active (via CLI or API)
2. API returns personalized responses
3. Response structure matches expected format
4. Test calls succeed with < 100ms latency
5. Integration code is ready for deployment
6. User understands how to integrate into their app
7. (API method) Personalization visible in TD Console

---

**Version**: 2.0.1
**Last Updated**: February 12, 2026
**Maintained By**: RTAM Team

**Changelog**:
- 2.1.0 (Feb 11, 2026): Updated to use `tdx ps pz` and `tdx ps rt` commands (previously `tdx pz` and `tdx rt`)
- 2.0.1 (Feb 12, 2026): Added API-based RT Personalization section with working examples
- 2.0.0 (Feb 2026): Updated with correct personalization YAML schema
