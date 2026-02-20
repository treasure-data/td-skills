# Topical Authority Map — Clustering & Knowledge Graph

Build a topical authority map by clustering GSC queries and cross-referencing with Knowledge Graph data.

## Query Clustering Algorithm

From Step 2 GSC data (dimensions: `["query", "page"]`):

1. **Extract keyword stems** — primary root from each query (e.g., "best project management tools" → "project management")
2. **Group queries by stem**
3. **Per cluster, calculate**:
   - Query count (distinct queries)
   - Page count (distinct pages ranking)
   - Average position across cluster
   - Page-1 rate: % of queries with position ≤ 10

## Knowledge Graph Check (requires SerpAPI)

For each cluster, search the primary keyword stem:

```
serpapi_google_search
  query: "<cluster keyword stem>"
  num: 5
  gl: "<user's market>"
```

Check:
- Knowledge Graph entry exists for your brand/entity
- Your site appears in the KG `source`
- Competitors have KG entries for the same topic

> **SerpAPI budget**: Limit to top 10 clusters by total impressions.

## Authority Map Table Schema

```
| Topic Cluster | Queries | Pages | Avg Position | Page-1 Rate | KG Present? | Authority Level |
|--------------|---------|-------|-------------|-------------|-------------|-----------------|
| "project management" | 45 | 8 | 6.2 | 78% | Yes (brand) | Strong |
| "team collaboration" | 12 | 3 | 18.5 | 25% | No | Emerging |
| "remote work" | 5 | 2 | 32.1 | 0% | No | Weak |
```

## Authority Level Classification

| Level | Criteria |
|-------|----------|
| **Strong** | Page-1 rate > 60% AND 5+ queries in cluster |
| **Emerging** | Page-1 rate 20-60% OR 3-5 queries with improving positions |
| **Weak** | Page-1 rate < 20% OR fewer than 3 queries |
| **Opportunity** | Competitor has KG entry but you have no cluster coverage |

## Recommended Actions by Level

| Level | Action |
|-------|--------|
| **Strong** | Maintain and expand — add subtopic pages, build internal links |
| **Emerging** | Prioritize — create pillar content, add FAQ schema, target PAA questions |
| **Weak** | Evaluate ROI — either invest heavily or deprioritize |
| **Opportunity** | Research and plan — create content cluster strategy |
