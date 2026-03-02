---
name: channel-strategy
description: Recommend optimal paid media channel mix using TD CDP audience data and campaign performance queries when available, or industry-standard best practices when historical data is missing. Analyzes TD campaign data to suggest budget allocation across Meta, Google, LinkedIn, TikTok, and other platforms based on segment characteristics, funnel objectives, and business model.
---

# Channel Strategy

Use TD CDP audience data and campaign performance queries to recommend paid media channel mix and budget allocation.

## When to Use This Skill

Use this skill when:
- User asks to optimize channel mix or budget allocation for paid media campaigns
- Need channel recommendations based on TD CDP audience insights
- Analyzing historical channel performance to inform strategy
- Evaluating which platforms to use for a specific audience segment
- Determining budget distribution across advertising channels

## Recommendation Approach

**Always follow this workflow:**

1. **Check for TD data first** - Attempt to query historical campaign performance and CDP audience data
2. **Use TD context when available** - Base recommendations on actual performance data from TD tables
3. **Fall back to industry standards** - When TD data is missing or insufficient, provide general best practices
4. **Be transparent** - Clearly indicate whether recommendations are data-driven (TD-based) or best-practice-based

**Example workflow:**
```sql
-- Step 1: Check if campaign data exists
select count(*) as row_count
from marketing.paid_media_campaigns
where td_interval(time, '-90d', 'JST')
```

**If row_count > 0:** Use TD data for recommendations (data-driven)
**If row_count = 0:** Use industry benchmarks (best-practice-based)

Tell the user which approach you're using:
- ✅ "Based on your TD campaign data from the last 90 days..."
- ✅ "No historical campaign data found in TD. Using industry best practices..."

## Core Principles

### 1. Query TD Campaign Performance by Channel (When Available)

**First, check if campaign data exists:**

```sql
-- Verify campaign data availability
select
  min(td_time_string(time, 'd!', 'JST')) as earliest_date,
  max(td_time_string(time, 'd!', 'JST')) as latest_date,
  count(distinct channel) as channel_count,
  count(*) as total_records
from marketing.paid_media_campaigns
where td_interval(time, '-90d', 'JST')
```

**If data exists, analyze historical performance:**

```sql
select
  channel,
  sum(spend) as total_spend,
  sum(conversions) as total_conversions,
  sum(revenue) / nullif(sum(spend), 0) as roas,
  sum(conversions) / nullif(sum(clicks), 0) as cvr
from marketing.paid_media_campaigns
where td_interval(time, '-90d', 'JST')
  and campaign_status = 'active'
group by channel
order by roas desc
```

**TD table assumptions:**
- `marketing.paid_media_campaigns` contains campaign data from ad platforms
- `time` column (BIGINT, unix timestamp) for time filtering
- Standard columns: `channel`, `spend`, `conversions`, `revenue`, `clicks`, `impressions`

Adjust database/table names to match your TD schema.

**If no data exists:** Skip to industry standard recommendations (see "Fallback: Industry Standard Recommendations" section).

### 2. Integrate CDP Audience Attributes

Match audience characteristics from parent segments to channel strengths:

```sql
-- Analyze audience demographics for channel fit
select
  case
    when age between 18 and 24 then 'Gen Z'
    when age between 25 and 40 then 'Millennials'
    when age between 41 and 56 then 'Gen X'
    else 'Boomers+'
  end as age_group,
  count(distinct user_id) as audience_size,
  avg(ltv) as avg_ltv
from cdp_db.customers_master
where td_interval(time, '-30d', 'JST')
  and segment_id = 'high_intent_buyers'
group by 1
order by audience_size desc
```

**Channel recommendations based on age group:**
- Gen Z (18-24): TikTok, Instagram, Snapchat
- Millennials (25-40): Meta, YouTube, Pinterest
- Gen X (41-56): Meta, Google, LinkedIn
- Boomers+ (57+): Google Search, YouTube, Connected TV

**CDP integration pattern:**
1. Query parent segment for audience attributes (age, industry, job_title, purchase_behavior)
2. Identify dominant audience profile
3. Match profile to channel strengths
4. Query historical campaign performance for those channels
5. Recommend mix with budget allocation

### 3. Budget-Driven Channel Count

Minimum viable budget per channel: **$2,000-3,000/month** for statistical significance.

```sql
-- Calculate recommended channel count based on total budget
select
  total_budget,
  case
    when total_budget < 10000 then 1
    when total_budget between 10000 and 50000 then 2
    when total_budget between 50000 and 100000 then 3
    else 4
  end as recommended_channels,
  total_budget / recommended_channels as budget_per_channel
from (
  select 50000 as total_budget  -- Example: $50K monthly budget
)
```

**Rule:** Allocate at least 10% of total budget to any channel. Below this threshold, data is insufficient for optimization.

## Common Patterns

### Pattern 1: B2B Lead Generation (TD CDP + LinkedIn)

**Use case:** Enterprise SaaS targeting decision-makers

**Step 1 - Query CDP for B2B audience profile:**
```sql
select
  job_title,
  company_industry,
  count(distinct user_id) as audience_size
from cdp_db.customers_master
where td_interval(time, '-30d', 'JST')
  and segment_id = 'enterprise_leads'
group by 1, 2
order by audience_size desc
limit 10
```

**Step 2 - Query historical B2B channel performance:**
```sql
select
  channel,
  sum(spend) as total_spend,
  sum(mqls) as marketing_qualified_leads,
  sum(spend) / nullif(sum(mqls), 0) as cost_per_mql
from marketing.b2b_campaigns
where td_interval(time, '-90d', 'JST')
  and campaign_type = 'lead_gen'
group by channel
order by cost_per_mql asc
```

**Recommended channel mix:**
- Google Search: 50-60% (demand capture, high-intent keywords)
- LinkedIn Ads: 30-40% (job title/company/industry targeting)
- Google Display: 10-15% (remarketing only, if budget > $30K)

**Key metrics:** Cost per MQL, SQL conversion rate, CAC payback period

### Pattern 2: E-commerce (TD CDP + Shopping Platforms)

**Use case:** DTC brand, online retail

**Step 1 - Query CDP for purchase behavior:**
```sql
select
  purchase_frequency,
  avg_order_value,
  count(distinct user_id) as segment_size
from cdp_db.customers_master
where td_interval(time, '-30d', 'JST')
  and total_orders > 0
group by 1, 2
order by segment_size desc
```

**Step 2 - Query historical e-commerce performance:**
```sql
select
  channel,
  sum(revenue) / nullif(sum(spend), 0) as roas,
  sum(new_customers) / nullif(sum(total_customers), 0) as new_customer_rate
from marketing.ecommerce_campaigns
where td_interval(time, '-90d', 'JST')
group by channel
order by roas desc
```

**Recommended channel mix:**
- Google Shopping: 35-45% (product discovery, visual search)
- Meta Ads: 25-35% (prospecting + dynamic product ads)
- Google Search: 20-25% (branded + category keywords)
- TikTok/Pinterest: 10-15% (if audience < 35 years old)

**Key metrics:** ROAS, CAC:LTV ratio, new vs. returning customer split

### Pattern 3: Analyze Audience Overlap for Channel Selection

**Query to identify channel overlap/cannibalization:**
```sql
with channel_users as (
  select
    channel,
    user_id
  from marketing.campaign_conversions
  where td_interval(time, '-30d', 'JST')
)
select
  a.channel as channel_a,
  b.channel as channel_b,
  count(distinct a.user_id) as overlap_count,
  count(distinct a.user_id) * 100.0 /
    nullif(count(distinct case when a.user_id is not null then a.user_id end), 0) as overlap_pct
from channel_users a
join channel_users b
  on a.user_id = b.user_id
  and a.channel < b.channel  -- Avoid duplicate pairs
group by 1, 2
order by overlap_pct desc
```

**Interpretation:**
- High overlap (>50%): Channels reaching same users, potential cannibalization
- Low overlap (<20%): Channels reaching distinct audiences, good diversification
- Use exclusion lists or assign clear funnel roles to reduce overlap

## Fallback: Industry Standard Recommendations

**When TD campaign data is unavailable or insufficient, use these industry-standard channel allocations:**

### By Business Model

**B2B SaaS / Enterprise:**
- Google Search: 50-60%
- LinkedIn Ads: 30-40%
- Google Display (remarketing): 10% (only if budget > $30K)

**E-commerce / DTC:**
- Google Shopping: 35-45%
- Meta Ads (Facebook/Instagram): 25-35%
- Google Search: 20-25%
- TikTok/Pinterest: 10-15% (if target age < 35)

**Lead Generation (Local Services, B2C):**
- Google Search: 60-70%
- Google Local Services Ads: 20-30%
- Meta Ads: 10-20%

**Brand Awareness:**
- YouTube Ads: 40-50%
- Connected TV: 25-35%
- Programmatic Display: 15-20%
- Social Media (Meta/TikTok): 10-15%

### By Budget Size

| Monthly Budget | Channel Strategy |
|----------------|------------------|
| < $10K | 1 channel: Pick best fit (Google Search for B2B, Meta for E-commerce) |
| $10K - $30K | 2 channels: Primary (60-70%) + Secondary (30-40%) |
| $30K - $50K | 2-3 channels: Diversify across funnel stages |
| $50K - $100K | 3-4 channels: Full funnel coverage |
| > $100K | 4-6 channels: Multi-platform testing |

### By Audience Demographics (when no CDP data available)

**Age-based channel selection:**
- 18-24 (Gen Z): TikTok (40%), Instagram (30%), YouTube (20%), Snapchat (10%)
- 25-40 (Millennials): Meta (35%), YouTube (25%), Google (25%), Pinterest (15%)
- 41-56 (Gen X): Meta (40%), Google (35%), LinkedIn (15%), YouTube (10%)
- 57+ (Boomers): Google Search (50%), YouTube (30%), Connected TV (20%)

**Industry-based defaults:**
- Technology/SaaS: Google (55%), LinkedIn (35%), Display (10%)
- Retail/E-commerce: Shopping (40%), Meta (35%), Search (25%)
- Healthcare: Google Search (60%), Display (25%), YouTube (15%)
- Financial Services: Google (50%), LinkedIn (30%), Display (20%)

**When using fallback recommendations, state clearly:**
> "⚠️ These recommendations are based on industry benchmarks. For data-driven recommendations, set up campaign data ingestion to TD from your ad platforms (Meta, Google, LinkedIn, etc.)."

## Best Practices

1. **Check for TD data first** - Always attempt to query historical campaign data before using industry standards
2. **Be transparent about recommendation basis** - Clearly state whether using TD data or industry benchmarks
3. **Always filter by time in TD queries** - Include `td_interval(time, ...)` for partition pruning and performance
4. **Use parent segment data when available** - Query CDP master tables for audience age, industry, behavior patterns
5. **Respect minimum budgets** - At least $2-3K/month per channel, or 10% of total budget (whichever is higher)
6. **Match audience to platform** - Use CDP demographic data (if available) or age/industry defaults (if not)
7. **Query conversion paths for optimization** - When TD data exists, understand multi-touch attribution before consolidating channels
8. **Use approx_* functions for large datasets** - `approx_distinct(user_id)`, `approx_percentile(spend, 0.5)`

## Common Issues and Solutions

### Issue: Insufficient Campaign Data in TD

**Symptoms:**
- Query returns empty results or very few rows
- Unable to analyze historical performance by channel

**Solutions:**
1. **Check if ad platform data is ingested:**
   ```sql
   select
     min(td_time_string(time, 'd!', 'JST')) as earliest_date,
     max(td_time_string(time, 'd!', 'JST')) as latest_date,
     count(*) as row_count
   from marketing.paid_media_campaigns
   ```

2. **Verify table name/schema:**
   - Use `tdx tables <database>` to list available tables
   - Use `tdx tables describe <database>.<table>` to check schema

3. **Expand time range:**
   ```sql
   where td_interval(time, '-180d', 'JST')  -- 6 months instead of 90 days
   ```

4. **Use industry standard recommendations** if no TD data available:
   - See "Fallback: Industry Standard Recommendations" section above
   - Provide recommendations based on business model, budget size, and audience demographics
   - Clearly indicate that recommendations are best-practice-based, not data-driven
   - Suggest setting up campaign data ingestion from ad platforms for future optimization

### Issue: Low Match Rate Between CDP and Campaign Data

**Symptoms:**
- Campaign conversions don't join to CDP customer master table
- Unable to attribute campaign performance to audience segments

**Solutions:**
1. **Check join key format:**
   ```sql
   -- Compare key formats
   select distinct regexp_extract(user_id, '^[a-z]+') as id_prefix
   from marketing.campaign_conversions
   limit 10
   ```

2. **Use ID stitching table if available:**
   ```sql
   select
     c.channel,
     count(distinct s.canonical_id) as matched_users
   from marketing.campaign_conversions c
   join cdp_db.id_stitching s
     on c.user_id = s.external_id
   group by 1
   ```

3. **Validate match rate before analysis:**
   ```sql
   with campaign_users as (
     select distinct user_id from marketing.campaign_conversions
     where td_interval(time, '-30d', 'JST')
   )
   select
     count(distinct c.user_id) as campaign_users,
     count(distinct m.user_id) as matched_to_master,
     count(distinct m.user_id) * 100.0 / nullif(count(distinct c.user_id), 0) as match_rate
   from campaign_users c
   left join cdp_db.customers_master m
     on c.user_id = m.user_id
   ```

   Target match rate: >70%. Below 50%, investigate ID format mismatches.

### Issue: Channel Recommendation Conflicts with User Constraints

**Symptoms:**
- User has budget/platform constraints that conflict with data-driven recommendations
- Example: Best channel is LinkedIn but user doesn't have LinkedIn Ads account

**Solutions:**
1. **Ask about constraints upfront:**
   - "Are there any channels you cannot use or prefer to avoid?"
   - "Do you have existing accounts on Meta/Google/LinkedIn?"

2. **Provide alternative recommendations:**
   - If top channel unavailable, show 2nd/3rd best alternatives from TD data
   - Suggest channel that matches audience profile even if no historical data

3. **Recommend testing plan:**
   - Start with 10-15% budget on new channel for 2-4 weeks
   - Query results after test period to validate performance

## Related Skills

- **sql-skills:trino** - TD Trino query syntax and optimization
- **sql-skills:time-filtering** - Time-based filtering with `td_interval()` and `td_time_range()`
- **tdx-skills:parent-segment** - CDP parent segment setup and audience attributes
- **tdx-skills:segment** - CDP child segment creation for channel activation
- **workflow-skills:digdag** - Automate channel analysis reports with TD Workflows

## Resources

**TD Documentation:**
- [Treasure Data Connectors](https://docs.treasuredata.com/categories/connectors/) - Ad platform integrations
- [CDP Parent Segments](https://docs.treasuredata.com/articles/cdp-parent-segments) - Audience master tables
- [Trino SQL Reference](https://docs.treasuredata.com/articles/trino) - Query syntax

**TD Internal:**
- Campaign data schema documentation (if available in your organization)
- Standard table naming conventions for marketing databases
- CDP segmentation field catalog

**Platform Documentation:**
- [Google Ads API](https://developers.google.com/google-ads/api/docs)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [LinkedIn Marketing Developer Platform](https://docs.microsoft.com/en-us/linkedin/marketing/)

---

**Version:** 1.0
**Last Updated:** 2025-02-26
