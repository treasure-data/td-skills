# Step 3: Configure Personalization & Section in Audience Studio

**Audience:** Customer developers / TD CSM  
**Duration:** ~30 minutes

## Overview

Create the Personalization entity and Section in Audience Studio, defining entry criteria and response payload.

This is the core configuration that determines:
- **When** personalization is triggered (entry criteria)
- **What** content is returned (payload)

## Prerequisites

- Step 1 completed (RT configuration)
- Step 2 completed (Personalization service created)
- Key events and RT attributes configured

## 3.1 Create Personalization Entity

**In Audience Studio:**

1. Navigate to your parent segment
2. Click **Personalization** tab
3. Click **Create Personalization**
4. Enter:
   - **Name**: `product_page_messages` (descriptive name)
   - **Description**: "In-app messages for product detail pages"
5. Click **Create**

## 3.2 Create Section

A section represents one placement or use case within the personalization.

**Example sections:**
- `homepage_banner` - Banner on homepage
- `product_page_popup` - Popup on product pages
- `checkout_upsell` - Upsell message on checkout

**For this playbook:**

1. Click **Add Section**
2. Enter:
   - **Name**: `on_sale_no_returns` (descriptive name)
3. Click **Create**

**Multiple sections:**

You can create multiple sections within one personalization, each with different entry criteria and payloads.

```
Personalization: product_page_messages
├── Section: on_sale_no_returns (when product.status = "on_sale")
├── Section: vip_exclusive_offer (when user.loyalty_tier = "VIP")
└── Section: default_recommendation (default fallback)
```

## 3.3 Define Section Entry Criteria

Entry criteria determine when this section's content is returned.

**Two types of conditions:**
1. **Event-based conditions** (from key events)
2. **Attribute-based conditions** (from RT/batch attributes)

### 3.3.1 Event-Based Conditions

**Configure the trigger event:**

1. In the section editor, click **Entry Criteria**
2. Select **Key Event**: `product_view` (from Step 1)

**Add event filters:**

Event filters let you narrow down which events trigger this section.

**Example: Only trigger for on-sale products**

1. Click **Add Event Filter**
2. Select column: `product_status`
3. Select operator: **is**
4. Enter value: `on_sale`
5. Click **Save**

**Supported operators for event filters:**

| Operator | Use Case | Example |
|----------|----------|---------|
| **is** | Exact match | `product_status is "on_sale"` |
| **is not** | Exclusion | `product_status is not "discontinued"` |
| **is null** | Check for missing value | `discount_code is null` |
| **is not null** | Check value exists | `user_id is not null` |
| **greater than** | Numeric comparison | `price greater than 100` |
| **less than** | Numeric comparison | `stock less than 10` |
| **at least** | Numeric ≥ | `quantity at least 5` |
| **at most** | Numeric ≤ | `rating at most 3` |
| **regex** | Pattern match | `product_id regex "^SALE-.*"` |
| **not regex** | Pattern exclusion | `category not regex "test"` |

**Multiple event filters:**

You can add multiple filters with match logic:

```
Event: product_view
Filter 1: product_status is "on_sale"
Filter 2: price greater than 50
Match logic: all (AND)

→ Only triggers when BOTH conditions are true
```

Or use `any (OR)` logic:
```
Event: product_view
Filter 1: product_status is "on_sale"
Filter 2: product_status is "clearance"
Match logic: any (OR)

→ Triggers when EITHER condition is true
```

### 3.3.2 Attribute-Based Conditions

Add conditions based on user profile attributes.

**Available attribute types:**
- RT attributes (created in Step 1)
- RT drag-on rules (business rules)
- Batch attributes (from parent segment)

**Example: Only show to logged-in users**

1. Click **Add Attribute Condition**
2. Drag **RT attribute**: `user_id` (single value attribute)
3. Select operator: **is not null**
4. Click **Save**

**Example: Only show to VIP customers**

1. Click **Add Attribute Condition**
2. Drag **Batch attribute**: `loyalty_tier` (from parent segment)
3. Select operator: **is**
4. Enter value: `VIP`
5. Click **Save**

**Attribute match logic:**

Configure how multiple attribute conditions combine:

**Option 1: All (AND)**
```
Condition 1: loyalty_tier is "VIP"
Condition 2: page_views_24h at least 5
Match logic: all

→ User must be VIP AND have 5+ page views
```

**Option 2: Any (OR)**
```
Condition 1: loyalty_tier is "VIP"
Condition 2: loyalty_tier is "Gold"
Match logic: any

→ User is either VIP OR Gold
```

**Option 3: Advanced (Nested Boolean Logic)**

For complex conditions, use advanced mode:

```
(loyalty_tier = "VIP" AND page_views_24h >= 5)
OR
(loyalty_tier = "Gold" AND page_views_24h >= 10)
```

1. Click **Switch to Advanced**
2. Build expression using drag-and-drop
3. Group conditions with parentheses
4. Choose AND/OR for each group

### 3.3.3 Combined Example: Product Sale Message

**Use case:** Show "No returns allowed" message when:
- Event: User views a product detail page
- Event filter: Product is on sale
- Attribute: User is logged in

**Configuration:**
```
Event-based:
  Key event: product_view
  Event filters:
    - product_status is "on_sale"

Attribute-based:
  Match logic: all
  Conditions:
    - user_id is not null
```

## 3.4 Configure Section Payload

The payload defines what data the personalization API returns for this section.

**Four payload types:**

### 3.4.1 Attribute Payload

Return RT or batch attribute values.

**Example: Return last viewed product and browsing history**

1. Click **Attribute Payload**
2. Click **Add Attribute**
3. Select attributes:
   - `last_viewed_product` (RT single attribute)
   - `browsed_products` (RT list attribute)
   - `loyalty_tier` (batch attribute)
4. Configure output names:
   - `last_viewed_product` → output as `lastProduct`
   - `browsed_products` → output as `browsingHistory`
   - `loyalty_tier` → output as `loyaltyTier`
5. Click **Save**

**API response example:**
```json
{
  "offers": {
    "on_sale_no_returns": {
      "attributes": {
        "lastProduct": "PROD-12345",
        "browsingHistory": ["PROD-12345", "PROD-67890", "PROD-11111"],
        "loyaltyTier": "Gold"
      }
    }
  }
}
```

### 3.4.2 String Builder

Compose static strings or JSON fragments.

**Example: Add a static message**

1. Click **String Builder**
2. Click **Add String**
3. Enter:
   - **Output name**: `message`
   - **Value**: `This item is on sale and cannot be returned.`
4. Click **Save**

**API response example:**
```json
{
  "offers": {
    "on_sale_no_returns": {
      "attributes": {
        "message": "This item is on sale and cannot be returned."
      }
    }
  }
}
```

**Note for Engage Studio integration:**

When you design in-app content in Engage Studio (Step 4), the HTML content will be automatically added to the payload. You typically don't need to manually add it via String Builder.

### 3.4.3 Segment Payload

Include batch segment membership.

**Example: Return which campaigns the user belongs to**

1. Click **Segment Payload**
2. Select segments:
   - `spring_sale_2024`
   - `loyal_customers`
3. Click **Save**

**API response example:**
```json
{
  "offers": {
    "on_sale_no_returns": {
      "batch_segments": ["spring_sale_2024", "loyal_customers"]
    }
  }
}
```

### 3.4.4 Catalog Lookup Payload

Return enriched data from catalog tables.

**Example: Return product details from catalog**

1. Click **Catalog Payload**
2. Select:
   - **Lookup attribute**: `last_viewed_product` (contains product ID)
   - **Catalog table**: `products_master`
   - **Lookup column**: `product_id`
   - **Return columns**: `name`, `price`, `image_url`
   - **Output name**: `productDetails`
3. Click **Save**

**API response example:**
```json
{
  "offers": {
    "on_sale_no_returns": {
      "catalog_lookups": {
        "productDetails": {
          "name": "Wireless Headphones",
          "price": 79.99,
          "image_url": "https://cdn.example.com/headphones.jpg"
        }
      }
    }
  }
}
```

## 3.5 Save and Activate

1. Review entry criteria and payload configuration
2. Click **Save**
3. Click **Activate** to enable the personalization

**Status indicators:**
- **Draft** - Personalization created but not active
- **Active** - Personalization is live and serving API responses
- **Paused** - Temporarily disabled

## Verification Checklist

Before proceeding to Step 4, verify:

- [ ] Personalization entity created
- [ ] At least one section created
- [ ] Entry criteria configured (event + optional attribute conditions)
- [ ] Payload configured (at least one payload type)
- [ ] Personalization status is **Active**

## Troubleshooting

**Section doesn't trigger:**
- Verify event filters match actual event data (case-sensitive)
- Check RT attributes are populated (`tdx ps rt list --json`)
- Test with simplified criteria first (remove attribute conditions)

**Empty payload returned:**
- Check RT attributes have values for the test user
- Verify attribute names in payload match RT attribute names
- Wait 1-2 minutes after activating personalization

**"Personalization not found" error:**
- Verify personalization is **Active** (not Draft)
- Check personalization ID in API call URL
- Confirm parent segment ID is correct

**Entry criteria too complex:**
- Start simple: event-only criteria
- Add attribute conditions one at a time
- Test after each change

## Tips for Entry Criteria Design

**Start broad, then narrow:**
```
Iteration 1: Any product_view event
Iteration 2: product_view WHERE product_status = "on_sale"
Iteration 3: + attribute condition (logged in users only)
```

**Test with real user IDs:**
- Use actual `td_client_id` values from your event data
- Query recent events: `SELECT td_client_id FROM events LIMIT 10`
- Test API with those IDs

**Use match logic strategically:**
- **all (AND)**: Strict targeting (fewer users, more relevant)
- **any (OR)**: Broad targeting (more users, less specific)
- **advanced**: Complex business rules

## Related Skills

- `rt-personalization` - Personalization entity creation automation
- `rt-personalization-validation` - Payload validation

---

**Next:** [Step 4: Design In-App Content in Engage Studio](04-engage-studio-content.md)
