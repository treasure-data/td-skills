# Intent Classification from SERP Features

Classify search intent by analyzing which SERP features appear for a keyword. Use this mapping to select the optimal content format for each target keyword.

## SERP Feature to Intent Mapping

| SERP Feature | Primary Intent | Secondary Intent | Confidence |
|-------------|---------------|-----------------|------------|
| Answer Box (definition) | Informational | — | High |
| Answer Box (list/steps) | Informational | Transactional (if product-related) | High |
| Answer Box (calculator) | Informational | Transactional | High |
| Knowledge Graph (entity) | Navigational | Informational | High |
| Knowledge Graph (brand) | Navigational | — | Very High |
| People Also Ask (4+ questions) | Informational | — | High |
| Shopping results | Transactional | Commercial | Very High |
| Local Pack | Local/Navigational | Transactional | High |
| Top Stories | Informational | — | Medium |
| Video carousel | Informational | — | Medium |
| Image pack | Informational | Navigational | Low |
| Sitelinks | Navigational | — | Very High |
| No special features | Mixed | — | Low |

## Content Format Recommendations by Intent

| Intent | Recommended Format | Key Elements | BLUF Pattern |
|--------|-------------------|--------------|--------------|
| Informational | Guide / How-to article | BLUF answers, FAQ schema, tables, 1,500-2,500 words | Pattern 1 (Definition) or Pattern 4 (Steps) |
| Transactional | Product/service page | Pricing, CTAs, comparison tables, review schema | Pattern 2 (Number-first) |
| Commercial | Comparison / review | Side-by-side tables, verdict, pros/cons, review stars | Pattern 3 (Verdict-first) |
| Navigational | Landing page | Brand schema, clear navigation, sitelinks-eligible structure | Pattern 1 (Definition) |
| Local | Location page | LocalBusiness schema, NAP, Google Maps embed, reviews | Pattern 2 (Number-first) for services |

## Multi-Intent Keywords

Some keywords have mixed intent — multiple SERP feature types appear simultaneously:

| Feature Combination | Likely Intent Mix | Content Strategy |
|--------------------|-------------------|------------------|
| Answer Box + Shopping | Informational → Transactional | Guide with product recommendations and affiliate/purchase links |
| Knowledge Graph + PAA | Navigational + Informational | Entity page with comprehensive FAQ section |
| Local Pack + Answer Box | Local + Informational | Location-specific guide with local service details |
| Video + PAA | Informational (how-to) | Step-by-step guide with embedded video and FAQ schema |

## Applying Intent to Cannibalization Resolution

When multiple pages on the same site rank for one keyword (cannibalization), use intent classification to decide which page to keep:

1. **Determine intent** from SERP features using the table above
2. **Match intent to page type**: The page whose format best matches the classified intent should be the canonical target
3. **Consolidate or differentiate**: If both pages match the intent, merge them. If they serve different intents, ensure they target different keyword variations

Example:
- Query: "project management software" → Shopping results + Answer Box = Commercial + Informational
- Page A: Blog post "What is project management software?" → Informational ✓
- Page B: Product page "/pricing" → Transactional ✓
- Decision: Keep both, but ensure Page A targets informational variations ("what is", "best") and Page B targets transactional variations ("pricing", "buy", "free trial")

## SerpAPI Intent Inference

When running `serpapi_google_search`, infer intent using this priority:

1. `answerBox` present → Informational (unless calculator → Transactional)
2. Shopping/local results present → Transactional
3. `knowledgeGraph` with brand → Navigational
4. `peopleAlsoAsk` dominant (4+) → Informational
5. Mixed or no features → Analyze organic result URLs for intent signals (blog = informational, /product or /pricing = transactional)
