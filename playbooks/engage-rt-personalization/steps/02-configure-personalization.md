# Step 2: Configure Personalization Service

**Audience:** Customer developers / TD CSM  
**Duration:** ~20 minutes

## Overview

Create and configure the personalization service that will be called from the frontend or backend.

This step sets up the API access model and generates authentication tokens.

## Prerequisites

- Step 1 completed (RT configuration with status "OK")
- Master API key available

## 2.1 Create Personalization Service

**In Data Workbench:**

1. Navigate to **Parent Segments** → Select your parent segment
2. Click **Personalization** tab
3. Click **Create Personalization Service**

## 2.2 Choose Access Model

Select how the personalization API will be accessed:

### Option A: Public Access (Client-Side)

**Use when:** Frontend (website/mobile app) calls the personalization API directly.

**Characteristics:**
- API called from user's browser or mobile device
- Token is embedded in client-side code
- Use read-only tokens with limited scope
- Suitable for public-facing personalization

**Example use case:**
- E-commerce product recommendations
- Website banner personalization
- Mobile app content customization

**Security considerations:**
- Token is visible in browser dev tools
- Use CORS restrictions
- Implement rate limiting

### Option B: Private Access (Server-Side)

**Use when:** Backend server proxies requests to the personalization API.

**Characteristics:**
- API called from your backend server
- Token stored securely on server
- Full API key can be used
- Additional business logic can be applied before/after API call

**Example use case:**
- Server-side rendering with personalization
- Personalization combined with internal business rules
- API gateway integration

**Security considerations:**
- Token never exposed to client
- Server IP can be whitelisted
- Request logging and auditing

### Recommendation for This Playbook

For client-side in-app content delivery, choose **Public Access**.

## 2.3 Generate and Register Access Token

**In the Personalization Service settings:**

1. Click **Generate Token**
2. Configure token settings:
   - **Name**: `frontend_personalization_token` (descriptive name)
   - **Permissions**: Read-only
   - **Rate limit**: 1000 requests/minute (adjust based on traffic)
   - **CORS allowed origins**: `https://yourwebsite.com` (or `*` for testing)
3. Click **Create**
4. **Copy the token immediately** (it won't be shown again)

**Token format example:**
```
p13n_1234567890abcdef1234567890abcdef
```

**Store the token securely:**
```bash
# Add to environment variables
export TD_P13N_TOKEN="p13n_1234567890abcdef1234567890abcdef"

# Or add to .env file (frontend projects)
VITE_TD_P13N_TOKEN=p13n_1234567890abcdef1234567890abcdef
REACT_APP_TD_P13N_TOKEN=p13n_1234567890abcdef1234567890abcdef
```

## 2.4 Configure Regional Endpoint

Identify your TD region to use the correct personalization API endpoint.

**Regional endpoints:**

| Region | Endpoint |
|--------|----------|
| US (us01) | `https://us01.p13n.in.treasuredata.com` |
| EU (eu01) | `https://eu01.p13n.in.treasuredata.com` |
| Tokyo (ap01) | `https://ap01.p13n.in.treasuredata.com` |
| Seoul (ap02) | `https://ap02.p13n.in.treasuredata.com` |
| Tokyo (ap03) | `https://ap03.p13n.in.treasuredata.com` |

**Detect region from tdx CLI:**
```bash
REGION=$(tdx config get endpoint 2>/dev/null | grep -o '[a-z][a-z][0-9][0-9]' | head -1)
echo "Region: ${REGION:-us01}"
```

**Store endpoint in configuration:**
```javascript
const TD_P13N_ENDPOINT = 'https://us01.p13n.in.treasuredata.com';
```

## 2.5 Test API Access

Validate that the token can successfully call the personalization API.

**Using curl:**
```bash
REGION="us01"
PS_ID="your_parent_segment_id"
TOKEN="p13n_1234567890abcdef1234567890abcdef"

curl -X GET \
  "https://${REGION}.p13n.in.treasuredata.com/audiences/${PS_ID}/personalizations/test?td_client_id=test_user" \
  -H "Authorization: TD1 ${TOKEN}" \
  -H "Content-Type: application/json"
```

**Expected response (even if personalization doesn't exist yet):**
```json
{
  "error": "Personalization not found"
}
```

This confirms the token is valid and the endpoint is accessible.

**If authentication fails:**
```json
{
  "error": "Invalid authentication token"
}
```

Check:
- Token is correct (no extra spaces)
- Authorization header format: `TD1 <token>` (space-separated)
- Region endpoint matches your account region

## 2.6 Document Token Usage

For team members and future reference:

**Create a configuration document:**
```markdown
# Personalization API Configuration

**Parent Segment ID:** 1234567
**Region:** us01
**Endpoint:** https://us01.p13n.in.treasuredata.com
**Token Name:** frontend_personalization_token
**Token Permissions:** Read-only
**Rate Limit:** 1000 req/min
**CORS Origins:** https://yourwebsite.com

**Access Model:** Public (client-side)

**Usage in frontend:**
```javascript
const TD_CONFIG = {
  endpoint: 'https://us01.p13n.in.treasuredata.com',
  parentSegmentId: '1234567',
  token: process.env.VITE_TD_P13N_TOKEN
};
```
```

## Verification Checklist

Before proceeding to Step 3, verify:

- [ ] Personalization service created in Data Workbench
- [ ] Access model selected (Public recommended for this playbook)
- [ ] Token generated and securely stored
- [ ] Regional endpoint identified
- [ ] Test API call succeeds (even if returns "not found")
- [ ] Token and endpoint documented for team

## Troubleshooting

**Cannot create personalization service:**
- Verify RT configuration is complete (Step 1)
- Check RT status is "OK"
- Ensure you have admin permissions on the parent segment

**Token generation fails:**
- Check Master API key has personalization permissions
- Verify account has RT 2.0 entitlement
- Contact TD support if issue persists

**Test API call times out:**
- Check network connectivity
- Verify endpoint URL (no typos in region code)
- Try from different network (corporate proxy may block)

**CORS errors in browser:**
- Add your website domain to CORS allowed origins
- Use `*` for testing (not recommended for production)
- Check browser console for specific CORS error details

## Security Best Practices

**For production deployments:**

1. **Never commit tokens to git**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Rotate tokens periodically**
   - Generate new token every 90 days
   - Update client-side code with new token

3. **Monitor API usage**
   - Set up alerts for unusual traffic patterns
   - Review rate limit usage weekly

4. **Restrict CORS origins**
   - Only allow specific domains (no wildcard `*`)
   - Update CORS list when adding new domains

## Related Skills

- `rt-personalization` - Personalization entity creation (next step)
- `td-javascript-sdk` - Frontend SDK integration (Step 5)

---

**Next:** [Step 3: Configure Personalization & Section in Audience Studio](03-audience-studio-setup.md)
