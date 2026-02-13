---
name: rt-pz-api
description: Integrate RT personalization services with web/mobile apps - API requests, responses, testing, and monitoring
---

# RT Personalization API Integration

Integrate personalization services with web and mobile applications via API.

## Prerequisites

- Personalization service created and deployed
- API key with CDP access
- Web/mobile application ready to consume API

## API Endpoints by Region

```bash
# US
https://us01.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization/<service_name>

# Tokyo
https://jp01.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization/<service_name>

# EU
https://eu01.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization/<service_name>
```

## API Request

```bash
POST https://<region>.cdp.treasuredata.com/audiences/<parent_segment_id>/personalization/<service_name>
Authorization: TD1 <api_key>
Content-Type: application/json

{
  "user_id": "customer_12345",
  "page_url": "/products/electronics",
  "device_type": "mobile"
}
```

## API Response

```json
{
  "user_id": "customer_12345",
  "section": "premium_users",
  "outputs": {
    "recommended_products": ["prod_123", "prod_456", "prod_789"],
    "exclusive_offers": ["offer_10", "offer_20"],
    "customer_tier": "premium",
    "purchase_count_30d": 12,
    "viewed_products_30d": ["prod_100", "prod_200"]
  },
  "timestamp": "2024-02-13T10:30:00Z",
  "processing_time_ms": 45
}
```

## JavaScript/Web Integration

```javascript
// Fetch personalization data
async function getPersonalization(userId, context = {}) {
  const response = await fetch(
    `https://us01.cdp.treasuredata.com/audiences/394649/personalization/product_recommendations`,
    {
      method: 'POST',
      headers: {
        'Authorization': `TD1 ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        ...context
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Personalization API error: ${response.status}`);
  }

  return await response.json();
}

// Usage
const userId = getUserId(); // From cookie or session
const personalization = await getPersonalization(userId, {
  page_url: window.location.pathname,
  device_type: isMobile() ? 'mobile' : 'desktop'
});

// Render recommendations
renderRecommendations(personalization.outputs.recommended_products);
```

## React Integration

```jsx
import { useState, useEffect } from 'react';

function usePersonalization(userId, context) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPersonalization() {
      try {
        setLoading(true);
        const response = await fetch(
          `https://us01.cdp.treasuredata.com/audiences/394649/personalization/product_recommendations`,
          {
            method: 'POST',
            headers: {
              'Authorization': `TD1 ${process.env.REACT_APP_TD_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId, ...context })
          }
        );

        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchPersonalization();
    }
  }, [userId, context]);

  return { data, loading, error };
}

// Component usage
function ProductRecommendations({ userId }) {
  const { data, loading, error } = usePersonalization(userId, {
    page_url: window.location.pathname
  });

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div>Error loading recommendations</div>;

  return (
    <div>
      <h3>Recommended for You</h3>
      {data?.outputs?.recommended_products?.map(productId => (
        <ProductCard key={productId} productId={productId} />
      ))}
    </div>
  );
}
```

## Python Integration

```python
import requests

def get_personalization(user_id, api_key, parent_segment_id, service_name, **context):
    """Fetch personalization data from TD API"""
    url = f"https://us01.cdp.treasuredata.com/audiences/{parent_segment_id}/personalization/{service_name}"

    headers = {
        'Authorization': f'TD1 {api_key}',
        'Content-Type': 'application/json'
    }

    payload = {
        'user_id': user_id,
        **context
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    return response.json()

# Usage
result = get_personalization(
    user_id='customer_123',
    api_key=os.environ['TD_API_KEY'],
    parent_segment_id='394649',
    service_name='product_recommendations',
    page_url='/products',
    device_type='mobile'
)

print(f"Section: {result['section']}")
print(f"Recommendations: {result['outputs']['recommended_products']}")
```

## cURL Examples

```bash
# Basic request
curl -X POST \
  "https://us01.cdp.treasuredata.com/audiences/394649/personalization/product_recommendations" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "customer_12345"
  }'

# With context parameters
curl -X POST \
  "https://us01.cdp.treasuredata.com/audiences/394649/personalization/product_recommendations" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "customer_12345",
    "page_url": "/products/electronics",
    "device_type": "mobile",
    "current_product_id": "prod_789"
  }'

# Save response to file
curl -X POST \
  "https://us01.cdp.treasuredata.com/audiences/394649/personalization/product_recommendations" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "customer_12345"}' \
  -o response.json
```

## Testing

### Test Endpoint

```bash
# Test with specific user
curl -X POST \
  "https://us01.cdp.treasuredata.com/audiences/394649/personalization/product_recommendations/test" \
  -H "Authorization: TD1 ${TD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user_123",
    "input_params": {
      "page_url": "/products",
      "device_type": "mobile"
    }
  }'
```

### Test Different Users

```bash
# Test VIP user
curl -X POST "..." -d '{"user_id": "vip_user_001"}'

# Test new user
curl -X POST "..." -d '{"user_id": "new_user_123"}'

# Test cart abandoner
curl -X POST "..." -d '{"user_id": "cart_abandon_456"}'
```

## Performance Optimization

### Client-side Caching

```javascript
// Cache responses for 5 minutes
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedPersonalization(userId, context) {
  const cacheKey = `${userId}_${JSON.stringify(context)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await getPersonalization(userId, context);
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}
```

### CDN Caching

Use CDN with short TTL:

```javascript
// Add cache headers (server-side)
res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute

// Cloudflare cache example
const response = await fetch(url, {
  cf: {
    cacheTtl: 60,
    cacheEverything: true
  }
});
```

### Batch Requests

Fetch personalization for multiple users:

```javascript
async function batchPersonalization(userIds) {
  const promises = userIds.map(userId =>
    getPersonalization(userId).catch(err => ({
      userId,
      error: err.message
    }))
  );

  return await Promise.all(promises);
}
```

## Error Handling

```javascript
async function getPersonalizationWithFallback(userId, context) {
  try {
    const data = await getPersonalization(userId, context);
    return data.outputs;
  } catch (error) {
    console.error('Personalization API error:', error);

    // Fallback to default recommendations
    return {
      recommended_products: getDefaultRecommendations(),
      section: 'fallback'
    };
  }
}
```

## Monitoring

### Service Metrics (API)

```bash
# View service metrics
tdx api "/audiences/<parent_segment_id>/personalization_services/<service_id>/metrics" \
  --type cdp

# Check recent responses
tdx api "/audiences/<parent_segment_id>/personalization_services/<service_id>/logs" \
  --type cdp | jq '.logs[] | {user_id, section, timestamp}'

# Monitor error rate
tdx api "/audiences/<parent_segment_id>/personalization_services/<service_id>/metrics" \
  --type cdp | jq '.error_rate'
```

### Application Monitoring

```javascript
// Track API latency
const start = performance.now();
const data = await getPersonalization(userId, context);
const latency = performance.now() - start;

// Send to analytics
analytics.track('Personalization API', {
  latency_ms: latency,
  section: data.section,
  user_id: userId
});
```

## Rate Limits

- **Default**: 100 requests/second per service
- **Burst**: 200 requests/second for 10 seconds
- **Daily**: No daily limit

## Common Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 401 | Unauthorized | Check API key |
| 404 | Service not found | Verify service name and parent segment ID |
| 429 | Rate limit exceeded | Implement exponential backoff |
| 500 | Server error | Retry with exponential backoff |
| 503 | Service unavailable | Check RT configuration status |

## Best Practices

### API Keys
- **Server-side only**: Never expose API keys in client-side code
- **Environment variables**: Store keys in env vars
- **Rotate regularly**: Update keys periodically

### Performance
- **Cache responses**: Cache for 1-5 minutes
- **Async loading**: Load personalization asynchronously
- **Fallback content**: Always have default content

### Security
- **HTTPS only**: Use HTTPS for all requests
- **Input validation**: Validate user_id before sending
- **Error handling**: Don't expose error details to users

## Next Steps

After integration:
- **A/B Testing**: Test personalization impact
- **Analytics**: Track conversion rates
- **Optimization**: Refine sections based on performance
- **Monitoring**: Set up alerts for errors

## Resources

- [API Reference](https://docs.treasuredata.com/display/public/PD/Personalization+API)
- [Authentication Guide](https://docs.treasuredata.com/display/public/PD/API+Authentication)
- [Rate Limits](https://docs.treasuredata.com/display/public/PD/API+Rate+Limits)
