# Zero-Click Root Cause Classification

Zero-click queries are keywords where a site has impressions but receives zero clicks. This reference classifies root causes and provides targeted remediation strategies.

## Root Cause Classification Matrix

| Type | Root Cause | SERP Signal (from SerpAPI) | Typical Queries |
|------|-----------|---------------------------|-----------------|
| Type A: AI Overview / Answer Box Absorption | Google's AI Overview or Answer Box fully satisfies the query — users get the answer without clicking | `aiOverview` present with inline content, or `answerBox` present with complete answer | Definitions, "what is", factual questions, calculations |
| Type B: Intent Mismatch | The page appears in results but its content format does not match the searcher's intent | No SERP feature capturing clicks; page title/snippet misaligned with query intent | Informational queries landing on product pages, transactional queries landing on blog posts |
| Type C: Brand Answer Box Owned | A competitor's branded Answer Box dominates the SERP — clicks go exclusively to the AB owner | `answerBox.url` belongs to a well-known competitor domain | Brand-adjacent queries, "[competitor] vs [you]" comparisons |
| Type D: PAA Absorption | People Also Ask (PAA) boxes expand to answer sub-questions, reducing click-through to organic results | Multiple `peopleAlsoAsk` entries covering the same topic as the page; page position 4+ | Long-tail informational queries, "how to" queries with multiple sub-steps |

## Remediation Strategies

### Type A: AI Overview / Answer Box Absorption

1. **Capture the Answer Box**: Restructure the page's primary section using BLUF format (30-60 words) matching the Answer Box type (see `content-brief/references/bluf-patterns.md` for AB→BLUF mapping)
2. **Add differentiated value**: Include data, tools, or interactive content that cannot be replicated in an AI Overview — give users a reason to click through
3. **Target the AI Overview references**: Ensure the page is cited as a source in the AI Overview by adding structured data and authoritative content
4. **Accept and redirect**: If the query is truly zero-click, redirect optimization effort to related keywords that still drive clicks

### Type B: Intent Mismatch

1. **Align content format to intent**: If the query is informational, ensure the ranking page is a guide/article, not a product page
2. **Create a dedicated page**: If no page matches the intent, create new content targeting the query
3. **Improve title and meta description**: Rewrite to clearly signal the content matches the searcher's intent
4. **Check cannibalization**: Ensure a better-matched page isn't being suppressed by an intent-mismatched page (see gsc-analytics Step 6)

### Type C: Brand Answer Box Owned

1. **Create comparison content**: Build "[You] vs [Competitor]" pages with BLUF verdicts
2. **Strengthen brand entity**: Add Organization schema with sameAs links to social profiles
3. **Target adjacent queries**: Focus on non-branded variations where the competitor doesn't own the Answer Box
4. **Build Knowledge Graph presence**: Ensure your brand has a Knowledge Graph entry through Wikipedia, Wikidata, and consistent NAP (Name, Address, Phone)

### Type D: PAA Absorption

1. **Answer PAA questions directly**: Add H2 sections that directly answer each PAA question found in SerpAPI results
2. **Add FAQ schema**: Implement FAQPage JSON-LD covering the PAA questions
3. **Target PAA ownership**: Structure content to be selected as the PAA answer source
4. **Consolidate content**: If the page only partially addresses the topic, expand it to be the comprehensive resource

## Diagnosis Workflow

For each zero-click query (impressions > 200, clicks = 0):

1. Run `serpapi_google_search` for the query
2. Check for `aiOverview` or `answerBox` → if present, classify as **Type A** or **Type C** (check `answerBox.url` domain)
3. If no AI Overview/AB, check `peopleAlsoAsk` count — if 4+ PAA entries covering the topic → **Type D**
4. If none of the above, analyze organic results for intent alignment → **Type B**
5. Output diagnosis table with type, root cause, and specific remediation

## SerpAPI Call Budget

Limit SerpAPI calls to the **top 10 zero-click queries by impressions** to avoid excessive API usage. Prioritize queries with the highest impression counts, as these represent the largest traffic recovery opportunities.
