# GSC Query Patterns

Practical reference for Google Search Console MCP tool query patterns.

## Date Range Calculation

GSC data has a ~3 day processing delay. Always adjust dates:

```
end_date = today - 3 days
start_date = end_date - 27 days  (for a 28-day window)
```

For trend comparison (prior period):
```
prior_end_date = start_date - 3 days
prior_start_date = prior_end_date - 27 days
```

## Dimension Combinations

| Use Case | Dimensions | Row Limit |
|----------|-----------|-----------|
| Keyword + page mapping | `["query", "page"]` | 5000 |
| Device breakdown | `["query", "device"]` | 2000 |
| Country analysis | `["query", "country"]` | 2000 |
| Page performance | `["page"]` | 1000 |
| Date trend (single query) | `["date"]` | 90 |
| Full breakdown | `["query", "page", "date"]` | 5000 |

## Filtering Patterns

### Quick Wins (Striking Distance)
```
dimension_filters:
  - dimension: "query"
    operator: "notContains"
    expression: "brand_name"  # Exclude branded queries
```

Then filter results in post-processing:
- position >= 8 AND position <= 20
- impressions > 100

### CTR Opportunities
Post-process filter:
- impressions > 500
- ctr < 0.02 (2%)

### Brand vs Non-Brand
To separate branded traffic, filter by brand name:
```
dimension_filters:
  - dimension: "query"
    operator: "contains"
    expression: "your brand"
```

Run separately for brand and non-brand analysis.

### Page-Specific Analysis
```
dimension_filters:
  - dimension: "page"
    operator: "contains"
    expression: "/blog/"
```

### Country-Specific
```
dimension_filters:
  - dimension: "country"
    operator: "equals"
    expression: "jpn"  # ISO 3166-1 alpha-3
```

Common country codes: `usa`, `jpn`, `gbr`, `deu`, `fra`, `aus`, `can`, `ind`

## Pagination

The `row_limit` parameter controls result count (max 25000). For large sites:

1. First request: `row_limit: 5000`
2. If results = 5000, increase to 10000 or add dimension filters to narrow scope
3. For comprehensive analysis, run multiple filtered queries

## Cannibalization Detection Algorithm

1. Query with dimensions: `["query", "page"]`
2. Group results by `query`
3. For each query with 2+ distinct pages:
   - Sort pages by clicks (descending)
   - Primary page = most clicks
   - Flag secondary pages as cannibalization candidates
4. Severity:
   - **High**: Top 2 pages have similar impressions (within 30%)
   - **Medium**: Secondary page has > 50 impressions
   - **Low**: Secondary page has < 50 impressions

## Trend Calculation

Compare two periods by matching on `(query, page)` pairs:

```
position_delta = current_position - prior_position
impression_delta = current_impressions - prior_impressions
ctr_delta = current_ctr - prior_ctr
```

Classification:
- **Rising**: position_delta < -3 (lower position number = better ranking)
- **Falling**: position_delta > 3
- **Stable**: abs(position_delta) <= 3

## Common Pitfalls

1. **Date delay**: Always subtract 3 days from today for `end_date`
2. **Anonymous queries**: Some queries are hidden for privacy; high "anonymous" count is normal
3. **Position rounding**: GSC positions are averages; a position of 10.5 means the page appears at positions 10-11 on average
4. **Impression counting**: A page can get impressions for queries where it appeared but was never scrolled to
5. **sc-domain vs sc-url**: Prefer `sc-domain:` (covers all subdomains) over `sc-url:` (single URL prefix)
