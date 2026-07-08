---
name: audit-dashboard
description: >
  Generates a rich, interactive HTML dashboard from Treasure Data audit log data
  (td_audit_log.access). Queries platform activity metrics — event volumes, top
  users, event types, denied access, IP addresses, resource types, and hourly
  patterns — then renders everything as a polished, self-contained HTML file the
  user can open in any browser.

  Use this skill whenever the user says anything like:
  - "create a dashboard based on my audit logs"
  - "visualize audit log activity"
  - "show me a report of what's happening in TD"
  - "who is doing what in Treasure Data?"
  - "audit log report / dashboard / visualization"
  Even if they just say "audit logs" with any hint of wanting to see or analyze them.
---

# TD Audit Log Dashboard

## Overview

The `td_audit_log.access` table records every significant action taken on a
Treasure Data account — queries, table operations, sign-ins, workflow runs,
segment activity, bulk imports, and more. This skill turns that raw event
stream into a readable, visual HTML dashboard.

## Step 1 — Authenticate

```bash
export TDX_ACCESS_TOKEN=$(curl -sf http://172.30.0.1:18080/credentials/td_api_production_aws)
export TDX_SITE=us01
```

If `TDX_ACCESS_TOKEN` is already set and commands succeed, skip this step.

## Step 2 — Verify the audit log table exists

```bash
tdx tables "td_audit_log.*" --json
```

Expected: `[{"table_name":"access"}]`

If the table is missing, tell the user that `td_audit_log.access` is not
available on this account and stop.

## Step 3 — Inspect the schema

```bash
tdx describe td_audit_log.access --json
```

Skim the columns. Key ones that drive the dashboard:

| Column | Purpose |
|--------|---------|
| `time` | Unix timestamp (seconds) — use `td_interval` for partition pruning |
| `event_name` | The action type (e.g. `job_issue`, `sign_in`, `table_delete`) |
| `event_result` | Usually null; `"denied"` when access was blocked |
| `user_email` | Who triggered the event |
| `ip_address` | Caller IP (`"internal"` for server-side calls) |
| `resource_type` | CDP resource category (audience, segment, etc.) |

## Step 4 — Run the analytical queries

Run these in parallel where possible (they are all independent reads).

### 4a. Summary stats
```sql
SELECT
  COUNT(*)                        AS total_events,
  MIN(from_unixtime(time))        AS earliest,
  MAX(from_unixtime(time))        AS latest
FROM td_audit_log.access
WHERE td_interval(time, '-90d/now')
```

### 4b. Top event names
```sql
SELECT event_name, COUNT(*) AS cnt
FROM td_audit_log.access
WHERE td_interval(time, '-90d/now')
GROUP BY event_name
ORDER BY cnt DESC
LIMIT 20
```

### 4c. Event results (success / denied breakdown)
```sql
SELECT event_result, COUNT(*) AS cnt
FROM td_audit_log.access
WHERE td_interval(time, '-90d/now')
GROUP BY event_result
ORDER BY cnt DESC
```

### 4d. Top users
```sql
SELECT user_email, COUNT(*) AS cnt
FROM td_audit_log.access
WHERE td_interval(time, '-90d/now')
  AND user_email IS NOT NULL
GROUP BY user_email
ORDER BY cnt DESC
LIMIT 15
```

### 4e. Top IP addresses
```sql
SELECT ip_address, COUNT(*) AS cnt
FROM td_audit_log.access
WHERE td_interval(time, '-90d/now')
  AND ip_address IS NOT NULL
GROUP BY ip_address
ORDER BY cnt DESC
LIMIT 10
```

### 4f. Daily event volume (last 30 days)
```sql
SELECT
  DATE_FORMAT(from_unixtime(time), '%Y-%m-%d') AS day,
  COUNT(*) AS cnt
FROM td_audit_log.access
WHERE td_interval(time, '-30d/now')
GROUP BY 1
ORDER BY 1
```
Use `--limit 35` to be safe.

### 4g. Hourly distribution (last 30 days)
```sql
SELECT
  DATE_FORMAT(from_unixtime(time), '%H') AS hour_utc,
  COUNT(*) AS cnt
FROM td_audit_log.access
WHERE td_interval(time, '-30d/now')
GROUP BY 1
ORDER BY 1
```

### 4h. Resource types (CDP activity)
```sql
SELECT resource_type, COUNT(*) AS cnt
FROM td_audit_log.access
WHERE td_interval(time, '-90d/now')
  AND resource_type IS NOT NULL
GROUP BY resource_type
ORDER BY cnt DESC
LIMIT 12
```

### 4i. Denied events breakdown
```sql
SELECT event_name, COUNT(*) AS cnt
FROM td_audit_log.access
WHERE td_interval(time, '-90d/now')
  AND event_result = 'denied'
GROUP BY event_name
ORDER BY cnt DESC
LIMIT 10
```

## Step 5 — Build the KPI numbers

Derive these from the query results before writing HTML:

- **Total Events** — from 4a
- **Avg Events / Day** — total ÷ days in range (round to nearest integer)
- **Active Users** — count of rows from 4d
- **Denied Events** — sum of counts from 4i (or from 4c where result = 'denied')
- **Denial Rate** — denied ÷ total × 100, formatted as `0.XX%`
- **Date range string** — e.g. `Apr 08 – Jul 07, 2026`

## Step 6 — Generate the HTML dashboard

Write a single self-contained HTML file. All data is embedded as JavaScript
constants — no server required, opens in any browser.

### Required visual sections

1. **Header** — title, date range badge, "live data" indicator
2. **KPI cards** (4 cards): Total Events, Avg/Day, Active Users, Denied Events
3. **Activity Timeline** — line chart, daily volume for the last 30 days
4. **Top Event Types** — horizontal bar chart, top 10
5. **Activity by Hour (UTC)** — vertical bar chart, 24 hours
6. **Top Active Users** — horizontal bar chart, top 10
7. **Resource Types** — doughnut chart (show when data exists)
8. **Top IP Addresses** — table with rank, IP, event count, share %
9. **Denied Events** — table with rank, event name, count
10. **Footer** — data source (`td_audit_log.access · us01`), generation date

### Design requirements

- Use **Chart.js 4.x** via CDN for all charts
- Dark navy theme (`#060c1e` background), teal accent (`#00d4b0`)
- Monospace font (`IBM Plex Mono` from Google Fonts) for numbers and data
- Display font (`Sora` from Google Fonts) for headings
- Subtle dot-grid background, top radial glow
- Each KPI card has a colored top border strip and counter animation on load
- Charts: custom dark tooltips, no default legend clutter, muted grid lines
- Horizontal bar charts sorted descending (highest at top)
- IP table: `"internal"` row rendered in green to distinguish from external IPs
- Fully responsive (collapses to single column on mobile)
- Entrance animations (fade + slide up) with staggered delays

### Naming the output file

Save as `audit_dashboard.html` in the current working directory (or wherever
the user's project files are). After writing, open the file using
`mcp__tas__open_file` so the user sees it immediately.

## Tips

- Shorten user email labels for charts: strip `+tag@domain`, keep
  `firstname.lastname` → capitalize first letter of each part.
- For hourly charts, color-code bars by intensity: peaks in amber/red,
  low-traffic hours in muted blue.
- If `resource_type` data is sparse (< 5 non-null rows), omit that section.
- Trim long event names in tables with `text-overflow: ellipsis` and a `title`
  attribute for the full name on hover.
- The `"internal"` IP entry dominates totals; normalize bar widths against the
  max *external* IP count so external bars are readable.

## Related Skills

- **tdx-basic** — TDX CLI fundamentals, authentication, query syntax
- **parent-segment-analysis** — Deeper analysis of CDP audience data
- **frontend-design** — General frontend design patterns for HTML artifacts
