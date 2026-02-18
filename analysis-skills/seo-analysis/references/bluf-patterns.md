# BLUF (Bottom Line Up Front) Writing Patterns

BLUF is a military-origin writing principle: place the most important conclusion at the very beginning. AI search engines extract the first paragraph after headings as citation candidates. Optimal length: 30-60 words.

## Pattern 1: Definition-first

**Bad:**
> Over the past decade, the landscape of search engine optimization has evolved dramatically. What was once a simple matter of keyword stuffing has transformed into a complex discipline. Today, we explore what AEO means.

**Good:**
> Answer Engine Optimization (AEO) is the practice of structuring content so AI-powered search engines — such as Google AI Overview, Perplexity, and ChatGPT — cite it as a source. Unlike traditional SEO, AEO prioritizes machine-readable structure over keyword density.

## Pattern 2: Number-first (for "how much" / "how many" queries)

**Bad:**
> Pricing depends on many factors, including the scope of work, the agency's experience level, and geographic location. Let's break down the various considerations.

**Good:**
> SEO services cost $500-5,000/month for most businesses. Small businesses typically pay $500-1,500/month for local SEO, while enterprise companies pay $3,000-10,000/month for comprehensive campaigns. The exact cost depends on three factors:

## Pattern 3: Verdict-first (for "vs" / comparison queries)

**Bad:**
> Both tools have their strengths and weaknesses. To understand which is better, we need to examine several criteria including features, pricing, and user experience.

**Good:**
> Ahrefs is better for backlink analysis and technical SEO audits, while Semrush excels at keyword research and competitive intelligence. Choose Ahrefs if your priority is link building; choose Semrush for content marketing workflows.

## Pattern 4: Step-first (for "how to" queries)

**Bad:**
> There are many approaches to setting up Google Search Console, and the process can seem daunting at first. In this guide, we'll walk through everything you need to know.

**Good:**
> Set up Google Search Console in 4 steps: (1) sign in at search.google.com/search-console, (2) add your property as a domain or URL prefix, (3) verify ownership via DNS record, HTML tag, or Google Analytics, (4) submit your sitemap. The full process takes 5-10 minutes.

## Pattern 5: Yes/No-first (for yes/no questions)

**Bad:**
> This is a complex question with many nuances. The answer depends on your specific situation, goals, and resources. Let's examine the various factors.

**Good:**
> Yes, AEO is worth investing in for 2026. AI search engines now drive 4.4x higher conversion rates than organic search, and Gartner projects traditional search volume will drop 25% by end of 2026. Focus on structured data and BLUF content patterns.

## Answer Box to BLUF Pattern Mapping

Use this table to select the correct BLUF pattern based on the SERP's Answer Box type (from `serpapi_google_search` results):

| Answer Box Type | SERP Signal | Recommended BLUF Pattern | Notes |
|----------------|-------------|--------------------------|-------|
| organic (definition) | `answerBox.type: "organic"`, snippet is a definition | Pattern 1: Definition-first | Lead with "[Term] is..." — most common AB format |
| featured_snippet (list) | `answerBox.type: "featured_snippet"`, content is ordered/unordered list | Pattern 4: Step-first | Use numbered steps or bullet list in first paragraph |
| featured_snippet (table) | `answerBox.type: "featured_snippet"`, content is tabular | Pattern 3: Verdict-first | Include comparison table immediately after H2 |
| calculator / instant | `answerBox.type: "calculator"` or numeric answer | Pattern 2: Number-first | Lead with the number/price/quantity |
| absent (no Answer Box) | No `answerBox` in SerpAPI response | Analyze competitors | Check top 3 organic results' BLUF patterns and match the dominant format |

When the Answer Box is absent, analyze the top 3 competitors' `bluf_pattern_type` (from `extract_page_signals.py`) and adopt the most common pattern among ranking pages.

## Anti-patterns to avoid

- "In today's digital landscape..." — empty filler
- "Let's dive into..." — delays the answer
- "This is a great question..." — wastes tokens
- "There are many factors to consider..." — avoids commitment
- Paragraphs over 4 sentences before reaching the core answer
