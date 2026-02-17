# AI Platform Citation Patterns (2025-2026)

## Citation Sources by Platform

| Platform | Top cited sources | Citation style |
|----------|------------------|----------------|
| Google AI Overview | Reddit (21%), YouTube (19%), Quora (14%) | Source list, up to 10 links |
| Perplexity | YouTube (16%), Reddit, specialist sites | Numbered references |
| ChatGPT Search | Wikipedia (16%), Forbes, Reddit | Hyperlinks |
| Claude Search | Authoritative domains | Numbered references |

## Key Statistics

- Google AI Overview citations overlap with top-10 organic: **93.67%**
- ChatGPT citations overlap with Bing top-10: **87%**
- Perplexity and ChatGPT share **25.19%** of citation domains
- LLM-referred visitors convert at **4.4x** organic search rate

## Optimization by Platform

### Google AI Overview
- Maintain strong organic rankings (93% overlap with top-10)
- Create YouTube video content (cited 19% of the time)
- Build Reddit/Quora presence with authentic, helpful answers
- Use structured data: FAQ, HowTo, Article schemas

### Perplexity
- Prioritize content freshness (real-time crawl based)
- Provide data-dense, factual content with citations
- Use numbered lists and clear section boundaries
- Be specific and technical — Perplexity favors depth

### ChatGPT Search
- Optimize for Bing (87% overlap)
- Seek mentions on high-authority domains (Wikipedia, Forbes, G2)
- Build Reddit presence
- Ensure content has clear, quotable statements

## AI Crawler Access (robots.txt)

Ensure these user agents are not blocked:

```
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

~21% of top-1000 sites have GPTBot-specific rules in robots.txt.

## Technical Requirements by Platform

| Requirement | Google AI Overview | Perplexity | ChatGPT Search | Claude |
|-------------|-------------------|------------|----------------|--------|
| robots.txt User-Agent | Googlebot (standard) | PerplexityBot | GPTBot, ChatGPT-User | ClaudeBot |
| SSR required? | Yes (Googlebot renders JS but prefers SSR) | Yes (limited JS rendering) | Yes (limited JS rendering) | Yes (limited JS rendering) |
| TTFB target | < 800ms | < 1s | < 1s | < 1s |
| Preferred schema | FAQ, HowTo, Article, Speakable | Article, FAQ | Article, FAQ | Article |
| Content characteristics | BLUF format, concise answers (30-60 words), tables, lists | Data-dense, factual, numbered references, technical depth | Quotable statements, clear definitions, authoritative tone | Well-structured sections, factual claims with sources |
| Crawl frequency | Continuous (part of Google index) | Real-time (fresh content prioritized) | Periodic (Bing index dependent) | Periodic |
| AI Overview/citation format | Source cards with title + URL | Numbered inline references [1][2] | Hyperlinked inline citations | Numbered references |
