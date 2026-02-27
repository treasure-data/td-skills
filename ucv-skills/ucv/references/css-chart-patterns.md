# CSS Chart Patterns for UCV Dashboards

All chart patterns below work in Treasure Studio's sandboxed iframe with **zero JavaScript**.

## Bar Charts

Flex container with proportional div heights. Highlight the customer's bar in blue against gray averages.

```html
<div class="bar-chart">
  <div class="bar-w">
    <div class="bar-v">$50,014</div>
    <div class="bar" style="height:90%;background:#CBD5E1"></div>
    <div class="bar-lbl">Bronze</div>
  </div>
  <div class="bar-w">
    <div class="bar-v" style="color:#3B82F6;font-weight:700">$2,141</div>
    <div class="bar" style="height:4%;background:#3B82F6"></div>
    <div class="bar-lbl" style="font-weight:700">Customer</div>
  </div>
  <div class="bar-w">
    <div class="bar-v">$49,990</div>
    <div class="bar" style="height:90%;background:#CBD5E1"></div>
    <div class="bar-lbl">Silver Avg</div>
  </div>
</div>
```

**Required CSS:**
```css
.bar-chart { display:flex; align-items:flex-end; gap:16px; height:180px; padding:20px 10px 0 }
.bar-w { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px }
.bar-v { font-size:12px; font-weight:600; color:#64748b }
.bar { width:100%; border-radius:6px 6px 0 0; min-height:4px }
.bar-lbl { font-size:11px; color:#64748b; text-align:center }
```

**Height calculation:** `height = (value / max_value) * 100%`. Use a minimum of 4% so zero values are still visible.

## Semicircle Gauges

CSS border-radius semicircle with rotation transform for the fill.

```html
<div class="gauge-wrap">
  <div class="gauge-bg"></div>
  <div class="gauge-fill" style="transform:rotate(-90deg) rotate(108deg);background:linear-gradient(90deg,#FEE2E2,#FEF3C7,#D1FAE5)"></div>
  <div class="gauge-cover"></div>
  <div class="gauge-val">3.0</div>
</div>
<p style="text-align:center;font-size:12px;color:#64748b">Customer Satisfaction (1-5 Scale)</p>
```

**Required CSS:**
```css
.gauge-wrap { position:relative; width:140px; height:80px; margin:0 auto 8px }
.gauge-bg { position:absolute; width:140px; height:70px; border-radius:70px 70px 0 0; background:#e2e8f0; overflow:hidden }
.gauge-fill { position:absolute; width:140px; height:70px; border-radius:70px 70px 0 0; transform-origin:center bottom }
.gauge-cover { position:absolute; width:108px; height:54px; background:#fff; border-radius:54px 54px 0 0; top:16px; left:16px }
.gauge-val { position:absolute; bottom:0; left:50%; transform:translateX(-50%); font-size:22px; font-weight:700; color:#1e293b }
```

**Rotation formula:** `rotate(-90deg) rotate(Xdeg)` where `X = (value / max) * 180`.
- For a 7.9/10 CSAT: `X = (7.9/10) * 180 = 142.2`
- For a 3.0/5.0 score: `X = (3.0/5.0) * 180 = 108`

## Progress Bars

Simple nested divs with percentage width.

```html
<div class="progress">
  <div class="progress-fill" style="width:75%;background:#3B82F6"></div>
</div>
```

**Required CSS:**
```css
.progress { height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden; margin:4px 0 }
.progress-fill { height:100%; border-radius:4px }
```

**Tier progress bar** (with labels):
```html
<div class="progress" style="height:12px">
  <div class="progress-fill" style="width:66%;background:linear-gradient(90deg,#94A3B8,#F59E0B)"></div>
</div>
<div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-top:4px">
  <span>Silver</span><span>33,975 pts to Gold</span><span>Gold</span>
</div>
```

## KPI Cards

Grid of 4 KPI cards with large value and small label.

```html
<div class="kpi-row">
  <div class="kpi"><div class="val">$2,141</div><div class="lbl">Predicted LTV</div></div>
  <div class="kpi"><div class="val green">$115</div><div class="lbl">Realised LTV</div></div>
  <div class="kpi"><div class="val">66,025</div><div class="lbl">Reward Points</div></div>
  <div class="kpi"><div class="val amber">0.45</div><div class="lbl">Propensity</div></div>
</div>
```

**Required CSS:**
```css
.kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px }
.kpi { background:#f8fafc; border-radius:10px; padding:14px; text-align:center }
.kpi .val { font-size:28px; font-weight:700; color:#2563EB }
.kpi .lbl { font-size:11px; color:#64748b; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px }
.kpi .val.green { color:#10B981 }
.kpi .val.red { color:#EF4444 }
.kpi .val.amber { color:#F59E0B }
```

## Insight Cards

Blue left-bordered cards for key insights and recommendations.

```html
<div class="insight">
  <div class="ttl">⚠️ High Churn Risk</div>
  <div class="desc">Customer flagged as high churn risk with very low recency. Cart Recovery recommended via Email.</div>
</div>
```

**Required CSS:**
```css
.insight { border-left:4px solid #3B82F6; padding:12px 16px; background:#f0f7ff; border-radius:0 8px 8px 0; margin-bottom:10px }
.insight .ttl { font-weight:600; font-size:13px; color:#1e293b; margin-bottom:4px }
.insight .desc { font-size:12px; color:#64748b }
```

## Activity Timeline

Vertical timeline with colored dots per activity type.

```html
<div class="timeline-item">
  <div class="tl-dot" style="background:#3B82F6"></div>
  <div class="tl-content">
    <div class="tl-title">Email Opened — Melt the Ice Campaign</div>
    <div class="tl-date">Mar 18, 2023</div>
  </div>
</div>
```

**Required CSS:**
```css
.timeline-item { display:flex; gap:12px; padding:10px 0; border-bottom:1px solid #f1f5f9 }
.tl-dot { width:10px; height:10px; border-radius:50%; margin-top:4px; flex-shrink:0 }
.tl-content .tl-title { font-size:13px; font-weight:600; color:#1e293b }
.tl-content .tl-date { font-size:11px; color:#94a3b8 }
```

**Dot colors by type:** Email=#3B82F6, Ad=#10B981, Purchase=#F59E0B, Unsubscribe=#EF4444, Review=#8B5CF6, App=#6366F1.

## Status Tags

Inline colored badges for status indicators.

```html
<span class="tag tag-green">Active</span>
<span class="tag tag-amber">Medium</span>
<span class="tag tag-red">At Risk</span>
<span class="tag tag-blue">Silver</span>
```

**Required CSS:**
```css
.tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600 }
.tag-green { background:#D1FAE5; color:#065F46 }
.tag-amber { background:#FEF3C7; color:#92400E }
.tag-red { background:#FEE2E2; color:#991B1B }
.tag-blue { background:#DBEAFE; color:#1E40AF }
.tag-gray { background:#F1F5F9; color:#475569 }
```

## SVG Identity Cluster Graph

Complete inline SVG template for the Cluster tab. Place 4 source nodes at corners with edges connecting them.

```html
<svg viewBox="0 0 600 360" style="width:100%;max-width:600px;margin:0 auto;display:block">
  <!-- Edges: solid=deterministic, dashed=probabilistic -->
  <line x1="150" y1="90" x2="450" y2="90" stroke="#94A3B8" stroke-width="3" opacity="0.5"/>
  <line x1="150" y1="90" x2="150" y2="270" stroke="#94A3B8" stroke-width="3" opacity="0.5"/>
  <line x1="150" y1="90" x2="450" y2="270" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="6,4" opacity="0.5"/>
  <line x1="450" y1="90" x2="450" y2="270" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="6,4" opacity="0.5"/>

  <!-- Score badges on edges -->
  <rect x="254" y="62" width="92" height="20" rx="10" fill="#D1FAE5"/>
  <text x="300" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="#065F46">99% email</text>

  <rect x="122" y="164" width="56" height="20" rx="10" fill="#D1FAE5"/>
  <text x="150" y="178" text-anchor="middle" font-size="11" font-weight="600" fill="#065F46">99% ID</text>

  <rect x="264" y="164" width="72" height="20" rx="10" fill="#FEF3C7"/>
  <text x="300" y="178" text-anchor="middle" font-size="11" font-weight="600" fill="#92400E">78% device</text>

  <!-- Node 1: Web (blue) -->
  <circle cx="150" cy="90" r="36" fill="#3B82F6" opacity="0.15"/>
  <circle cx="150" cy="90" r="28" fill="#3B82F6"/>
  <text x="150" y="86" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">WEB</text>
  <text x="150" y="100" text-anchor="middle" font-size="9" fill="#bfdbfe">user123</text>
  <text x="150" y="132" text-anchor="middle" font-size="12" font-weight="600" fill="#1E3A5F">Web Profile</text>
  <text x="150" y="146" text-anchor="middle" font-size="10" fill="#64748b">user@example.com</text>

  <!-- Node 2: App (green) at (450,90) -->
  <!-- Node 3: Store (amber) at (150,270) -->
  <!-- Node 4: CRM (purple) at (450,270) -->

  <!-- Legend -->
  <line x1="160" y1="350" x2="180" y2="350" stroke="#10B981" stroke-width="3"/>
  <text x="184" y="354" font-size="10" fill="#64748b">Deterministic</text>
  <line x1="270" y1="350" x2="290" y2="350" stroke="#F59E0B" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="294" y="354" font-size="10" fill="#64748b">Probabilistic</text>
</svg>
```

Adapt the number of nodes based on the actual identity sources discovered for each customer. Not all customers will have 4 sources.
