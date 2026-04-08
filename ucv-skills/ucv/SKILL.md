---
name: ucv
description: Use this skill to look up, find, or visualize a single customer's profile — also called a Unified Customer View (UCV) or Customer 360. Generates a 10-tab CSS/SVG dashboard in Treasure Studio with live preview, covering attributes, purchase history, engagement, loyalty, segments, and identity graph. Works with any CDP parent segment or database. For a single specific customer — not for aggregate analysis across all customers (use parent-segment-analysis for that).
---

# Unified Customer View (UCV)

This skill generates customer profile dashboards with up to 10 tabbed views, rendered in Treasure Studio via `mcp__tdx-studio__preview_document`. It queries any CDP parent segment or database dynamically, discovers the schema, and builds a pure CSS/SVG dashboard — no JavaScript required.

## Prerequisites

This skill requires:
- **Treasure Studio MCP server** (`tdx-studio`) — for dashboard preview via `preview_document`
- **tdx CLI** — for parent segment discovery (`tdx ps desc`) and data queries (`tdx query`)
- **A CDP parent segment or database** — containing customer profile and behavior data

If Studio preview is unavailable, skip the `preview_document` call and tell the user: "Studio preview is unavailable. The dashboard has been saved to `/tmp/ucv-<customer-name>.html` — open it in any browser."

## Core Principles

### 1. Studio Iframe Blocks All JavaScript

Treasure Studio's artifact panel renders HTML in a sandboxed iframe that blocks **all** script execution. This means:
- **No** `<script>` tags of any kind (inline or external)
- **No** React, Plotly, Babel, D3, or any JavaScript library
- **No** CDN imports (unpkg, cdn.plot.ly, etc.)
- **No** inline event handlers (`onclick`, `onload`, etc.)

All interactivity must use **CSS-only techniques**: radio button tabs, `:checked` selectors, and CSS transitions.

### 2. Schema-Driven Dashboard Generation

Never hardcode column names. Always discover the schema first via `tdx ps desc` and categorize columns by type:

| Group | Example Columns | Dashboard Use |
|-------|----------------|---------------|
| **Identity** | name, email, phone, cdp_customer_id | Header |
| **Demographics** | age, gender, city, state, country | Attributes tab |
| **Satisfaction** | csat, nps, customer_satisfaction | KPI cards + Overview |
| **Purchase** | orders, aov, monetary, frequency, recency | Behaviors tab |
| **Engagement** | visits, page_views, email_opens, cart_abandons | Engagement tab |
| **Loyalty** | tier, points, rewards, member_status | Loyalty tab |
| **Risk/Prediction** | churn_prediction, predicted_ltv, propensity | KPI cards |
| **Channel** | channel_preference, next_best_channel | Engagement tab |
| **NBA** | next_best_action, next_best_offer, next_best_product | Segments tab |

Only build tabs for data groups that actually exist in the schema. Some parent segments may have 88 columns, others may have 20.

### 3. Unique File Naming

Each dashboard must have a unique filename so previous lookups are not overwritten. Use the customer's name (lowercase, hyphens for spaces) as the filename:

```
/tmp/ucv-<customer-name>.html
```

**Examples:**
- John Smith → `/tmp/ucv-john-smith.html`
- Customer #12345 → `/tmp/ucv-12345.html`
- Unknown (random lookup) → `/tmp/ucv-<cdp_customer_id>.html`

### 4. Chunked HTML Generation

**Never use the Write tool for HTML files — it fails silently above ~300 lines.**

Large HTML files (300-500+ lines) must be written using sequential `cat >>` commands in Bash.

**Pattern:**
```bash
# Start fresh — use unique filename
cat > /tmp/ucv-john-smith.html << 'EOF'
<!DOCTYPE html>...styles...header...
EOF

# Append chunks
cat >> /tmp/ucv-john-smith.html << 'EOF'
...tab content...
EOF

# Repeat for 4-8 total chunks
```

### 5. CSS Radio Button Tabs

Tab switching uses hidden radio inputs with CSS sibling combinators. The `input:checked+label` selector highlights the active tab, and `#id:checked~.wrap-c .class` shows the matching content panel.

All inputs, labels, and the `.wrap-c` content div must be **direct children of the same parent** (`.tabs`) for the sibling combinators to work.

## Workflow

The skill follows a five-step process: **Discover → Query → Compare → Build → Render**.

### Step 1: Discover the Data Source

**Option A — Parent segment** (preferred):
```bash
tdx ps desc "Parent Segment Name" -o /tmp/ucv_schema.json
```
Read the JSON to discover the output database name, `customers` table columns, and `behavior_*` tables.

If the user doesn't specify a parent segment:
```bash
tdx ps list
```

If `tdx ps desc` fails, check authentication (`tdx auth status`) and verify the segment name with `tdx ps list`.

**Option B — Direct database** (when user specifies a database):
```bash
tdx tables "database_name.*"
tdx describe database_name.table_name
```

**Important:** Some parent segments have columns with all-null data (e.g., `first_name` may be null for all 15M rows). Always run a count query to verify which columns have data before querying customers:
```sql
SELECT COUNT(first_name) as has_first, COUNT(email) as has_email,
       COUNT(loyalty_tier) as has_tier
FROM database.customers
```

### Step 2: Query the Customer

```sql
SELECT c.column1, c.column2, ...
FROM database.customers c
WHERE c.name LIKE '%SearchTerm%'
  AND c.loyalty_tier IS NOT NULL
LIMIT 5
```

Use `--jsonl` output format. If multiple results, show them and let the user pick.

For customers with behavior data, find one that has activity across multiple tables:
```sql
SELECT c.cdp_customer_id, c.email, c.loyalty_tier, ...,
  COUNT(eo.cdp_customer_id) as ecom_orders
FROM database.customers c
LEFT JOIN database.behavior_ecommerce_orders eo
  ON c.cdp_customer_id = eo.cdp_customer_id
WHERE c.loyalty_tier IS NOT NULL
GROUP BY c.cdp_customer_id, c.email, c.loyalty_tier, ...
HAVING COUNT(eo.cdp_customer_id) > 0
LIMIT 1
```

### Step 3: Query Behavior Tables and Comparison Averages

**Behavior tables** — query each relevant `behavior_*` table:
```sql
SELECT * FROM database.behavior_ecommerce_orders
WHERE cdp_customer_id = 'customer_id'
ORDER BY time DESC LIMIT 10
```

**Comparison averages** — group by loyalty tier or another segmentation dimension:
```sql
SELECT loyalty_tier, COUNT(*) as customers,
  ROUND(AVG(predicted_ltv), 0) as avg_ltv,
  ROUND(AVG(rewards_points), 0) as avg_points
FROM database.customers
WHERE loyalty_tier IS NOT NULL
GROUP BY loyalty_tier
```

### Step 4: Build the HTML Dashboard

Write the dashboard to `/tmp/ucv-<customer-name>.html` using 4-8 chunked `cat >>` calls. Follow the HTML architecture documented below.

### Step 5: Render in Studio

```
mcp__tdx-studio__preview_document(path="/tmp/ucv-john-smith.html", title="UCV — John Smith")
```

Tell the user: "Here's the customer profile dashboard. Click the tabs to explore different views, or tell me if you'd like to look up a different customer."

## Dashboard HTML Architecture

### Page Structure

```html
<!DOCTYPE html><html><head>
<style>/* All CSS here */</style>
</head><body>
<div class="wrap">
  <div class="header"><!-- gradient header with avatar, name, badges --></div>
  <div class="tabs">
    <!-- radio inputs + labels + wrap-c content -->
  </div>
</div>
</body></html>
```

### Tab System (CSS Radio Buttons + Grid)

```html
<div class="tabs">
  <input type="radio" name="tab" id="t-ov"><label for="t-ov">📊 Overview</label>
  <input type="radio" name="tab" id="t-attr"><label for="t-attr">👤 Attributes</label>
  <input type="radio" name="tab" id="t-beh"><label for="t-beh">🛒 Behaviors</label>
  <input type="radio" name="tab" id="t-act"><label for="t-act">⚡ Actions</label>
  <input type="radio" name="tab" id="t-eng"><label for="t-eng">📱 Engagement</label>
  <input type="radio" name="tab" id="t-loy"><label for="t-loy">⭐ Loyalty</label>
  <input type="radio" name="tab" id="t-seg" checked><label for="t-seg">🎯 Segments</label>
  <input type="radio" name="tab" id="t-clus"><label for="t-clus">🔗 Cluster</label>
  <input type="radio" name="tab" id="t-stitch"><label for="t-stitch">🧩 Stitched</label>
  <input type="radio" name="tab" id="t-comp"><label for="t-comp">📈 Comparison</label>
  <div class="wrap-c">
    <div class="tc c-seg"><!-- Segments content (DEFAULT) --></div>
    <div class="tc c-ov"><!-- Overview --></div>
    <div class="tc c-attr"><!-- Attributes --></div>
    <!-- ... one div per tab ... -->
  </div>
</div>
```

### Critical CSS

```css
/* Hidden inputs — remain DOM siblings but don't take grid cells */
.tabs input[type="radio"] { display:none; position:absolute }

/* 5-column grid: 10 labels flow into 2 clean rows */
.tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  background: #fff;
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}
.tabs label {
  padding: 10px 4px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #64748b;
  text-align: center;
  display: block;
}
.tabs input:checked+label { background:#2563EB; color:#fff; font-weight:600 }
.wrap-c { grid-column: 1/-1; padding-top: 16px }
.tc { display: none }

/* Show content for checked tab */
#t-seg:checked~.wrap-c .c-seg,
#t-ov:checked~.wrap-c .c-ov,
#t-attr:checked~.wrap-c .c-attr,
#t-beh:checked~.wrap-c .c-beh,
#t-act:checked~.wrap-c .c-act,
#t-eng:checked~.wrap-c .c-eng,
#t-loy:checked~.wrap-c .c-loy,
#t-clus:checked~.wrap-c .c-clus,
#t-stitch:checked~.wrap-c .c-stitch,
#t-comp:checked~.wrap-c .c-comp { display: block }
```

### Tab Order

1. Overview, 2. Attributes, 3. Behaviors, 4. Actions, 5. Engagement
6. Loyalty, 7. **Segments** (DEFAULT — has `checked`), 8. Cluster, 9. Stitched, 10. Comparison

### CSS-Only Chart Patterns

See `references/css-chart-patterns.md` for full HTML/CSS patterns for bar charts, gauges, progress bars, and timelines.

### Inline SVG for Identity Cluster Graph

The Cluster tab uses inline SVG with circles for nodes, lines for edges, and rect+text for score badges. See `references/css-chart-patterns.md` for the complete SVG template.

**Node layout:** 4 nodes in a 2x2 grid at (150,90), (450,90), (150,270), (450,270).
**Node colors:** Web=#3B82F6, App=#10B981, Store=#F59E0B, CRM=#8B5CF6.
**Edge styles:** Solid lines for deterministic matches (≥90%), dashed for probabilistic (<90%).
**Score badges:** Green (#D1FAE5) for high confidence, amber (#FEF3C7) for medium.

### Design Rules

- **Max width:** 1200px centered (`.wrap{max-width:1200px;margin:0 auto}`)
- **Cards:** White background, 10px border-radius, subtle shadow (`0 1px 3px rgba(0,0,0,0.06)`)
- **Header:** Gradient blue (`linear-gradient(135deg, #1E3A5F, #2563EB)`) with 72px avatar circle, name, location, and colored badges
- **Colors:** Primary `#2563EB`, Success `#10B981`, Warning `#F59E0B`, Danger `#EF4444`
- **KPI values:** 28px bold; Labels: 11px uppercase gray (`#64748b`)
- **Tables:** Striped rows (`tr:nth-child(even){background:#f8fafc}`), gray header
- **Tags:** Inline badges with `.tag-green`, `.tag-amber`, `.tag-red`, `.tag-blue` for status indicators

### Tab Content Guide

| Tab | Key Elements |
|-----|-------------|
| **Overview** | CSAT gauge, 3 key insight cards (blue left border), recent activity timeline with colored dots |
| **Attributes** | Two-column grid: demographics table + preferences/consent table, predictive scores with progress bars |
| **Behaviors** | 4 mini-KPIs (orders, LTV, spend decile, reviews), purchase tables (ecommerce + store), line items table |
| **Actions** | Activity timeline (colored dots per channel), channel engagement bar chart |
| **Engagement** | 4 mini-KPIs (sessions, avg duration, logins, open rate), engagement tier table, channel performance table, nearest stores |
| **Loyalty** | 4 mini-KPIs (tier, points, frequency, recency), tier progress gauge + progress bar, recommendation insight cards |
| **Segments** (DEFAULT) | Segment membership table with status tags, next best actions table, 4 summary KPIs |
| **Cluster** | Inline SVG network graph, identity records table, match confidence table with progress bars |
| **Stitched** | Source match rate bar chart, stitched sources table with method/confidence, resolution summary table |
| **Comparison** | LTV bar chart (customer vs tier avgs), rewards points bar chart, full tier comparison table |

## Common Patterns

### Pattern 1: Parent Segment Customer Lookup

The most common use case — look up a customer from a CDP parent segment.

1. `tdx ps desc "Segment Name"` to discover schema
2. Count non-null columns to find where data lives
3. Find a customer with behavior data via JOIN + HAVING
4. Query all relevant behavior tables in parallel
5. Query tier averages for comparison
6. Build and render the dashboard

**When to use:** User asks "look up a customer in [parent segment]" or "show me a customer from PacSun/etc."

### Pattern 2: Named Customer Lookup

Look up a specific customer by name from a known database.

1. Query by name: `WHERE first_name LIKE '%John%' AND last_name LIKE '%Smith%'`
2. If multiple matches, show the list and ask the user to pick
3. Query behavior tables for the selected customer
4. Build dashboard

**When to use:** User asks "look up Michael Brown" or "find customer John Smith".

### Pattern 3: Cohort/Segment Analysis

Compare aggregate metrics across segments or tiers instead of individual lookup.

1. Discover schema
2. Query aggregates grouped by cohort dimension (loyalty tier, churn prediction, etc.)
3. Build comparison dashboard with CSS bar charts and per-cohort summary tables

**When to use:** User asks "compare loyalty tiers" or "show me segment averages".

## Best Practices

1. **Discover before querying** — Always run `tdx ps desc` or schema discovery before writing any SQL. Never assume column names.
2. **Check for null columns** — Some parent segments have columns defined but with 0 non-null values. Use `COUNT(column)` to verify data exists before including it.
3. **Find customers with behaviors** — Use JOIN + HAVING to find customers that actually have behavior table data, not just profile attributes.
4. **Parallel behavior queries** — Once you have a customer ID, query all behavior tables in parallel to save time.
5. **Chunked HTML always** — Never try to write the full dashboard in one Write call. Always use 4-8 sequential `cat >>` chunks via Bash.
6. **Save before preview** — Always finish writing the HTML file before calling `preview_document`.
7. **Adapt tabs to data** — Only generate tabs for data groups that exist. If there's no engagement data, skip the Engagement tab. For N tabs: use `grid-template-columns: repeat(ceil(N/2), 1fr)` for 2 rows, or `repeat(N, 1fr)` for 1 row if N ≤ 6. Remove the CSS `:checked` selectors for any skipped tabs.
8. **Currency awareness** — Check the `currency` field in order tables. Not all amounts are USD.
9. **Timestamp conversion** — Always convert Unix timestamps in SQL before building the HTML: `FROM_UNIXTIME(time)` works in TD Trino/Presto. Do not attempt timestamp formatting in HTML — no JavaScript is available.
10. **Highlight the customer** — In comparison charts, always highlight the customer's bar in blue (#3B82F6) against gray tier averages (#CBD5E1).

## Common Issues and Solutions

### Issue: Dashboard appears blank in Studio

**Symptoms:**
- HTML file renders correctly when opened in a browser but shows nothing in Treasure Studio's artifact panel

**Solutions:**
1. Remove ALL `<script>` tags — Studio's iframe blocks JavaScript execution entirely.
2. Remove any `onclick`, `onload`, or other inline event handlers.
3. Ensure CSS doesn't reference external fonts or stylesheets.
4. Verify the file path passed to `preview_document` is absolute (e.g., `/tmp/ucv-john-smith.html`).

### Issue: Tabs don't switch when clicked

**Symptoms:**
- Tab labels are visible but clicking them doesn't change the content

**Solutions:**
1. Verify all `<input>`, `<label>`, and `.wrap-c` are **direct children** of the same `.tabs` parent — the `~` sibling combinator requires this.
2. Check that each `<input>` is immediately followed by its `<label>` — the `+` adjacent sibling combinator requires this.
3. Ensure radio inputs use `display:none` (not `visibility:hidden`) — they must not participate in the CSS grid layout.
4. Verify the `id` on each input matches the `for` attribute on its label.
5. Verify the CSS selectors match: `#t-seg:checked~.wrap-c .c-seg` requires `.wrap-c` to contain a child with class `.c-seg`.

### Issue: Write tool fails silently on large HTML files

**Symptoms:**
- The Write tool completes without error but the file is empty or truncated

**Solutions:**
1. Use chunked `cat >>` commands in Bash instead of the Write tool.
2. Start with `cat > file << 'EOF'` for the first chunk, then `cat >> file << 'EOF'` for subsequent chunks.
3. Keep each chunk under 100 lines for reliability.
4. Verify the file length after writing: `wc -l /tmp/ucv-john-smith.html`.

### Issue: Customer query returns no results

**Symptoms:**
- Query completes with 0 rows, even though the parent segment has millions of customers

**Solutions:**
1. Check which columns have non-null data: `SELECT COUNT(first_name), COUNT(email) FROM table`.
2. Some parent segments don't have name columns populated — search by email or cdp_customer_id instead.
3. Use a JOIN with behavior tables to find customers that actually have activity data.
4. Presto API may time out on large tables — retry if you get a "Connect Timeout Error".

### Issue: SVG cluster graph doesn't render

**Symptoms:**
- The Cluster tab shows a blank space where the graph should be

**Solutions:**
1. Verify the SVG has proper `viewBox` attribute: `viewBox="0 0 600 360"`.
2. Ensure SVG is inline (not referenced via `<img src="...">`).
3. Check for unclosed tags — SVG is XML-strict and requires closing all elements.

## Related Skills

- **tdx-skills:parent-segment** — Create and manage CDP parent segments that feed into UCV dashboards.
- **tdx-skills:parent-segment-analysis** — Query parent segment data for deeper analysis beyond individual customer profiles.
- **tdx-skills:segment** — Create child segments based on customer attributes discovered in UCV dashboards.
- **sql-skills:trino** — Trino SQL syntax for querying Treasure Data databases.
- **sql-skills:time-filtering** — td_interval patterns for time-based behavior queries.

## Resources

- [CSS chart patterns reference](references/css-chart-patterns.md)
- [Studio rendering constraints](references/studio-constraints.md)
- [Sample UCV dashboard (PacSun)](examples/sample-pacsun-dashboard.html)
