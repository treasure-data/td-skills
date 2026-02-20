# SQL Skills Invocation Patterns

## Overview

Clear rules for when to invoke **query-explainer** vs **query-optimizer** based on user input.

---

## 🔴 DEFAULT BEHAVIOR: query-explainer First

### Rule: query-explainer is the DEFAULT entry point

**When user provides a query WITHOUT explicit optimization request:**

```
User Input Examples:
- "Explain this query: [SQL]"
- "What does this query do: [SQL]"
- "Help me understand: [SQL]"
- "Why is this query slow: [SQL]"
- "Break down this query: [SQL]"
- "Check this query: [SQL]"
```

**→ Invoke: query-explainer (DEFAULT)**

**Workflow:**
```
1. query-explainer explains the query
   ↓
2. query-explainer detects performance issues
   ↓
3. If CRITICAL/HIGH issues found:
   ↓
4. query-explainer AUTOMATICALLY invokes query-optimizer
   ↓
5. Return: Explanation + Issues + Optimized Query + Metrics
```

---

## 🎯 DIRECT OPTIMIZATION: query-optimizer Only

### Rule: query-optimizer for explicit optimization requests

**When user EXPLICITLY asks for optimization:**

```
User Input Examples:
- "Optimize this query: [SQL]"
- "Make this faster: [SQL]"
- "How can I optimize: [SQL]"
- "Reduce the cost of this query: [SQL]"
- "Here's my query and execution log - optimize it"
- "This query took 5 minutes - make it faster"
- "Query stats show high CPU - help me fix it"
```

**→ Invoke: query-optimizer DIRECTLY (skip query-explainer)**

**Workflow:**
```
1. query-optimizer analyzes query
   ↓
2. Parses execution logs (if provided)
   ↓
3. Applies all optimizations
   ↓
4. Return: Optimized Query + Before/After Metrics
```

---

## Decision Tree

```
┌─────────────────────────────┐
│   User provides query       │
└──────────┬──────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │ Does user explicitly say │
    │ "optimize" or "make      │
    │ faster"?                 │
    └──────┬───────────┬───────┘
           │           │
       NO  │           │  YES
           │           │
           ▼           ▼
    ┌──────────┐  ┌──────────────┐
    │ query-   │  │ query-       │
    │ explainer│  │ optimizer    │
    │ (DEFAULT)│  │ (DIRECT)     │
    └────┬─────┘  └──────┬───────┘
         │               │
         ▼               │
    ┌──────────┐         │
    │ Detects  │         │
    │ issues?  │         │
    └────┬─────┘         │
         │               │
     YES │               │
         ▼               │
    ┌──────────┐         │
    │ Auto     │         │
    │ invoke   │         │
    │ optimizer│         │
    └────┬─────┘         │
         │               │
         └───────┬───────┘
                 │
                 ▼
          ┌─────────────┐
          │ Return:     │
          │ - Explain   │
          │ - Issues    │
          │ - Optimized │
          │ - Metrics   │
          └─────────────┘
```

---

## Examples

### Example 1: Default Behavior (query-explainer)

**User Input:**
```
"Explain this query:

SELECT customer_id, COUNT(*) as orders
FROM sales_db.orders
GROUP BY customer_id
"
```

**Processing:**
```
1. Invoke: query-explainer (DEFAULT)
2. Explains: "This query counts orders per customer"
3. Detects: Missing time filter (CRITICAL)
4. Auto-invokes: query-optimizer
5. Returns:
   - Explanation ✅
   - Issue detected: Missing time filter ✅
   - Optimized query with WHERE td_interval(...) ✅
   - Performance: 100x faster ✅
```

---

### Example 2: Direct Optimization (query-optimizer)

**User Input:**
```
"Optimize this query:

SELECT customer_id, COUNT(*) as orders
FROM sales_db.orders
GROUP BY customer_id
"
```

**Processing:**
```
1. Invoke: query-optimizer (DIRECT - skip explainer)
2. Analyzes: Detects missing time filter
3. Optimizes: Adds WHERE td_interval(...)
4. Returns:
   - Optimized query ✅
   - Before/After metrics ✅
   - Performance improvement: 100x ✅
```

**Note:** No explanation of what the query does - goes straight to optimization.

---

### Example 3: Query + Execution Log (query-optimizer)

**User Input:**
```
"This query took 5 minutes and scanned 100GB - optimize it:

SELECT * FROM orders

Execution Log:
Query Time: 300s
Data Scanned: 100GB
Partitions: 365
"
```

**Processing:**
```
1. Invoke: query-optimizer (DIRECT - explicit optimization + log)
2. Parses log: Identifies full table scan (365 partitions)
3. Analyzes: Missing time filter
4. Optimizes: Adds WHERE td_interval(...)
5. Returns:
   - Log analysis ✅
   - Bottleneck identified: Full table scan ✅
   - Optimized query ✅
   - Expected improvement: 100x faster, 99% less data ✅
```

---

### Example 4: Well-Optimized Query (query-explainer only)

**User Input:**
```
"Explain this query:

SELECT customer_id, COUNT(*) as orders
FROM sales_db.orders
WHERE td_interval(time, '-30d', 'JST')
GROUP BY customer_id
ORDER BY orders DESC
LIMIT 10
"
```

**Processing:**
```
1. Invoke: query-explainer (DEFAULT)
2. Explains: "This query finds top 10 customers by order count..."
3. Detects: No CRITICAL/HIGH issues
4. Does NOT invoke optimizer (query is well-optimized)
5. Returns:
   - Explanation ✅
   - Performance notes: "Well-optimized query" ✅
   - No optimization needed ✅
```

---

### Example 5: "Why is this slow?" (query-explainer → optimizer)

**User Input:**
```
"Why is this query slow:

SELECT customer_id, COUNT(DISTINCT product_id)
FROM sales_db.orders
GROUP BY customer_id
"
```

**Processing:**
```
1. Invoke: query-explainer (DEFAULT - not explicit "optimize")
2. Explains: "This query counts unique products per customer"
3. Detects:
   - Missing time filter (CRITICAL)
   - Exact DISTINCT on large dataset (HIGH)
4. Auto-invokes: query-optimizer (2 major issues)
5. Returns:
   - Explanation ✅
   - Issues: Missing filter + Exact distinct ✅
   - Optimized query: Added time filter + approx_distinct() ✅
   - Performance: 100x faster ✅
```

---

## Summary Table

| User Input | Skill Invoked | Auto-invoke Optimizer? |
|------------|---------------|------------------------|
| "Explain this query: [SQL]" | query-explainer (DEFAULT) | If issues found |
| "What does this do: [SQL]" | query-explainer (DEFAULT) | If issues found |
| "Why is this slow: [SQL]" | query-explainer (DEFAULT) | If issues found |
| "Optimize this: [SQL]" | query-optimizer (DIRECT) | N/A |
| "Make this faster: [SQL]" | query-optimizer (DIRECT) | N/A |
| "Here's query + log: [SQL+log]" | query-optimizer (DIRECT) | N/A |
| "Help me understand: [SQL]" | query-explainer (DEFAULT) | If issues found |
| "Check this query: [SQL]" | query-explainer (DEFAULT) | If issues found |

---

## Automatic Invocation Triggers

**query-explainer AUTOMATICALLY invokes query-optimizer when:**

1. ✅ CRITICAL issues detected:
   - Missing time filter
   - Correlated subquery
   - Time function in WHERE clause

2. ✅ Multiple HIGH priority issues:
   - Exact DISTINCT on large dataset
   - SELECT * pattern
   - Inefficient JOINs

3. ✅ User mentions performance:
   - "Why is this slow?"
   - "This query times out"
   - "Takes forever to run"

4. ✅ Potential speedup > 10x

**query-explainer DOES NOT invoke optimizer when:**

1. ❌ No CRITICAL or HIGH issues
2. ❌ Query is already well-optimized
3. ❌ Only LOW/MEDIUM issues (just recommend)

---

## Key Takeaways

1. **Default = query-explainer**
   - Use for ANY query without explicit "optimize" request
   - Explains first, then optimizes if needed

2. **Direct = query-optimizer**
   - Use ONLY for explicit optimization requests
   - Skip explanation, go straight to optimization

3. **Automatic optimization**
   - query-explainer auto-invokes optimizer for serious issues
   - Seamless integration - user gets both explanation + optimization

4. **User experience**
   - Default behavior: Complete analysis (explain + optimize if needed)
   - Explicit optimization: Fast path to optimized query
   - Flexible: Works for both scenarios

---

## Implementation Notes

**For Claude Code:**
- When user provides query → Check for "optimize" keyword
- No "optimize" → Use query-explainer as entry point
- Has "optimize" → Use query-optimizer directly
- query-explainer handles automatic optimization invocation
- Always return complete context (explanation + optimization)
