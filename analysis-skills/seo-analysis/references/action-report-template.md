# Action Report Template

Output this markdown report for each analyzed page, alongside the dashboard. The report contains **all actionable recommendations** — the dashboard shows data only.

Save as `./seo/action-report-{slug}.md`.

## Structure

```markdown
# [Page Title] — SEO Action Report

## Current Structure Analysis

### Strengths

| Item | Current State | Rating |
|------|--------------|--------|
| H1 Tag | [actual H1] | [rating] |
| Subheading | [actual subhead] | [rating] |
| CTA Placement | [description] | [rating] |
| Customer Logos | [list] | [rating] |
| Heading Hierarchy | [description] | [rating] |

### Issues

| Item | Current State | Problem |
|------|--------------|---------|
| [item] | [current] | [issue description] |

---

## Specific Changes

### 1. [Change Title] (Priority: High/Medium/Low)

**Current:**
\```html
[actual current HTML]
\```

**Problem:**
- [bullet point explaining the issue]
- [cite data: SERP feature, AEO score dimension, competitor pattern]

**Recommended:**
\```html
[recommended HTML replacement]
\```

**Expected Effect:**
- [metric]: [expected change]

---

### 2. [Next Change]
[same structure]

---

## Schema Markup Additions

**Current schemas:** [list current]

**Recommended additions:**
\```html
<script type="application/ld+json">
[complete JSON-LD code ready to paste]
</script>
\```

---

## Internal Linking Strategy

| From Page | Anchor Text | To Page | Rationale |
|-----------|-------------|---------|-----------|
| [page] | [anchor] | [target] | [reason] |

---

## Recommended Content Outline

Based on top SERP winners ([avg word count], [avg headings], [format]):

1. **H1: [recommended]**
2. **H2: [section]** *(BLUF Pattern X — [target])*
   - H3: [subsection]
3. ...

**Target:** ~[word count] words | [heading count] H2 sections | [visual count] images/charts

---

## Topical Authority Strategy

- **Expand** ([strong cluster]): [recommendation]
- **Prioritize** ([emerging cluster]): [recommendation]
- **Evaluate** ([weak cluster]): [recommendation]

---

## Implementation Priority

### High Priority (1-2 weeks)
1. [change] — [reason it's high priority]

### Medium Priority (2-4 weeks)
2. [change]

### Low Priority (1+ month)
3. [change]

---

## Expected Impact

| Change | Expected Effect | Measurement | Timeline |
|--------|----------------|-------------|----------|
| [change] | [effect] | [how to measure] | [when] |

---

## Monitoring Checklist

- [ ] [metric to track] ([expected timeline])
- [ ] [metric]
- [ ] GSC URL inspection — request re-index after changes
- [ ] Rich Results Test — validate schema markup
- [ ] Re-run analysis in 2-3 months
```

## Key Principles

- Every recommendation includes **actual current HTML** and **complete replacement code** — not vague suggestions
- Schema markup is provided as **copy-paste-ready JSON-LD**
- Internal links include specific anchor text and source/target pages
- Content outline reflects SERP winner patterns and BLUF patterns from references
- Priority is based on effort-to-impact ratio
