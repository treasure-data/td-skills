# AEO Scoring Model (0-100)

Scores page structure for AI citation readiness across 5 dimensions. This model evaluates on-page signals only — no SERP data required.

## Dimension 1: Content Structure (26 points)

| Criteria | Points | How to evaluate |
|----------|--------|-----------------|
| BLUF presence | 0-7 | Each H2 section starts with a direct answer in the first paragraph (30-60 words). Score = (sections with BLUF / total H2 sections) × 7 |
| Paragraph optimization | 0-5 | Paragraphs are 2-4 sentences. Deduct for walls of text or single-sentence paragraphs |
| Question-based headings | 0-5 | H2/H3 phrased as questions users would ask. Score = (question headings / total headings) × 5 |
| Lists and tables | 0-5 | Presence of comparison tables, numbered lists, bullet points. 0=none, 3=some, 5=well-used |
| Article length | 0-4 | Optimal: 1,500-2,500 words. Deduct for <500 or >4,000 |

## Dimension 2: Structured Data (26 points)

| Criteria | Points | How to evaluate |
|----------|--------|-----------------|
| JSON-LD presence | 0-6 | Any valid JSON-LD on page. 0=none, 6=present |
| FAQPage schema | 0-5 | FAQPage with Q&A pairs. Most impactful for AI citation |
| Article/Author schema | 0-5 | Article type with author, datePublished, dateModified |
| Additional schemas | 0-5 | HowTo, Product, Review, Speakable, BreadcrumbList. +1 per additional type (max 5) |
| Schema stacking depth | 0-5 | 1 type=1, 2 types=3, 3+=5. Sites with 3+ schema types are ~13% more likely to be cited by AI |

## Dimension 3: E-E-A-T Signals (21 points)

| Criteria | Points | How to evaluate |
|----------|--------|-----------------|
| Author information | 0-6 | Author name, bio, credentials visible on page |
| Organization schema | 0-5 | Organization JSON-LD with name, url, logo |
| Citations and sources | 0-5 | External references, data sources, linked studies |
| Date freshness | 0-5 | Published/updated date visible and recent (<6 months = 5, <1 year = 3, older = 1, none = 0) |

## Dimension 4: AI Readability (21 points)

| Criteria | Points | How to evaluate |
|----------|--------|-----------------|
| Direct answer blocks | 0-6 | Clear definition or answer within first 60 words of key sections |
| Section self-containment | 0-6 | Each section answers one question completely without requiring other sections |
| FAQ/Q&A patterns | 0-5 | Explicit Q&A format in content (not just schema) |
| Summary/TL;DR | 0-4 | Executive summary, key takeaways, or TL;DR section present |

## Dimension 5: Technical AEO (6 points)

| Criteria | Points | How to evaluate |
|----------|--------|-----------------|
| Meta description | 0-2 | Present, 120-160 chars, contains target keyword |
| Canonical tag | 0-1 | Correct canonical URL set |
| Open Graph tags | 0-1 | og:title, og:description present |
| Mobile usability | 0-2 | Use URL Inspection API result if available, otherwise check viewport meta |

## Grading Scale

| Score | Grade | Meaning |
|-------|-------|---------|
| 90-100 | A+ | Excellent AEO readiness |
| 80-89 | A | Strong, minor improvements possible |
| 70-79 | B | Good foundation, notable gaps |
| 60-69 | C | Average, significant optimization needed |
| 40-59 | D | Poor, major structural issues |
| 0-39 | F | Not optimized for AI search |

## Key Research Data

- Sites with 3+ schema types: **~13% higher** AI citation rate
- BLUF-structured content: **2.8x more likely** to be cited by AI
- AI Overview citations overlap with top-10 organic results: **93.67%**
- LLM-referred visitors convert at **4.4x** the rate of organic search visitors
- Optimal direct answer length for AI extraction: **30-60 words**
- Optimal article length for AI citation: **~2,500 words** (citation likelihood drops above this)
