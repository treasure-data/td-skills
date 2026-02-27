# Steps 1-2: Parent Segment Validation & Use Case Discovery

## Step 1: Parent Segment Validation

### Check if user provided PS

**If user provided PS ID or name:**
```bash
# Check if PS has RT enabled
tdx ps rt list --json | jq '.[] | select(.id=="<ps_id>" or .name=="<ps_name>") | {
  id, name,
  rt_status: .status,
  event_tables: (.event_tables | length),
  key_events: (.key_events | length)
}'
```

**Expected outputs:**
- `rt_status: "ok"` → RT enabled, proceed to Step 2
- `rt_status: "updating"` → Wait for RT to be ready
- Empty result → PS not RT-enabled. Show error: "RT not enabled for this parent segment. Contact CSM."

**If user did NOT provide PS:**
```bash
# List all RT-enabled parent segments
tdx ps rt list --json
```

**Display to user:**
```bash
# Show RT-enabled parent segments with status
tdx ps rt list --json | jq '.[] | {
  id, name,
  rt_status: .status,
  event_tables: (.event_tables | length),
  key_events: (.key_events | length)
}'
```

**Ask user:** "Which parent segment should we use for RT personalization?"
- Present list of RT-enabled segments
- If none found: "No RT-enabled parent segments. Contact CSM to enable RT."

### Region Detection

```bash
# Detect user's region from tdx config
REGION=$(tdx config get endpoint 2>/dev/null | grep -o '[a-z][a-z][0-9][0-9]' | head -1)
REGION="${REGION:-us01}"
echo "Using region: $REGION"
```

**Checkpoint:** Parent segment ID confirmed, region detected, RT status validated.

---

## Step 2: Use Case Discovery

**Ask user:** "What's your RT personalization use case?"

**Common use cases:**
- **Web Personalization**: Show personalized content/recommendations on page load
  - Events: pageviews, product_views
  - Attributes: last_product_viewed, browsed_products_list, page_views_24h

- **Cart Recovery**: Personalized offers when user adds to cart
  - Events: add_to_cart, cart_view
  - Attributes: cart_items_list, cart_value, last_cart_update

- **User Profile API**: Return user profile data in real-time
  - Events: login, session_start
  - Attributes: loyalty_tier, total_purchase_value, lifetime_orders

- **Content Recommendations**: Personalized content based on consumption
  - Events: content_view, video_watch
  - Attributes: viewed_content_list, favorite_categories, watch_time_24h

**Store use case** for attribute/event suggestions in next steps.

**Checkpoint:** Use case selected, event requirements identified.
