# Quick Reference: SQL Skills Invocation

## Decision Logic for Claude Code

### Step 1: Check User Input

Does the user's message contain these keywords?
- "optimize"
- "make faster"
- "reduce cost"
- "execution log" + query
- "query stats" + query

**YES → Use query-optimizer DIRECTLY**
**NO → Use query-explainer (DEFAULT)**

---

## Simple Rules

### Rule 1: Default to query-explainer
```
User provides query → query-explainer (DEFAULT)
```

### Rule 2: Direct to query-optimizer only if explicit
```
User says "optimize" → query-optimizer (DIRECT)
User provides log + query → query-optimizer (DIRECT)
```

### Rule 3: Automatic optimization
```
query-explainer detects CRITICAL issues → Auto-invoke query-optimizer
```

---

## Examples

### ✅ Use query-explainer (DEFAULT)

```
User: "Explain this query: SELECT * FROM orders"
User: "What does this query do: [SQL]"
User: "Why is this query slow: [SQL]"
User: "Help me understand: [SQL]"
User: "Check this query: [SQL]"
```

### ✅ Use query-optimizer (DIRECT)

```
User: "Optimize this query: SELECT * FROM orders"
User: "Make this faster: [SQL]"
User: "How can I optimize: [SQL]"
User: "Here's my query and log: [SQL + log]"
User: "Reduce the cost of: [SQL]"
```

---

## Workflow Flowchart

```
┌─────────────────────┐
│ User provides query │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Contains "optimize", │
    │ "make faster", or    │
    │ execution log?       │
    └──────┬───────┬───────┘
           │       │
       NO  │       │  YES
           │       │
           ▼       ▼
    ┌─────────┐ ┌──────────┐
    │ query-  │ │ query-   │
    │explainer│ │optimizer │
    └────┬────┘ └──────────┘
         │
         ▼
    ┌──────────────┐
    │ Detects      │
    │ CRITICAL or  │
    │ HIGH issues? │
    └───┬──────────┘
        │
    YES │
        ▼
    ┌──────────────┐
    │ Auto-invoke  │
    │ query-       │
    │ optimizer    │
    └──────────────┘
```

---

## Implementation Pseudo-code

```python
def choose_skill(user_input):
    # Check for explicit optimization keywords
    optimization_keywords = [
        "optimize",
        "make faster",
        "make it faster",
        "reduce cost",
        "execution log",
        "query stats"
    ]

    user_lower = user_input.lower()

    # Check if user explicitly asks for optimization
    for keyword in optimization_keywords:
        if keyword in user_lower:
            return "query-optimizer"  # DIRECT

    # Default to query-explainer
    return "query-explainer"  # DEFAULT


# Usage
skill = choose_skill(user_input)

if skill == "query-explainer":
    # 1. Explain query
    # 2. Detect issues
    # 3. Auto-invoke query-optimizer if CRITICAL/HIGH issues
    pass

elif skill == "query-optimizer":
    # 1. Analyze query/logs directly
    # 2. Apply optimizations
    # 3. Return optimized query + metrics
    pass
```

---

## Quick Reference Table

| User Says | Invoke | Auto-optimize? |
|-----------|--------|----------------|
| "Explain [SQL]" | query-explainer | If issues |
| "What does [SQL] do" | query-explainer | If issues |
| "Why slow [SQL]" | query-explainer | If issues |
| "Optimize [SQL]" | query-optimizer | N/A |
| "Make faster [SQL]" | query-optimizer | N/A |
| "[SQL] + log" | query-optimizer | N/A |

---

## Key Points

1. **Default = query-explainer**
   - Most queries should go here first
   - Provides explanation + automatic optimization

2. **Direct = query-optimizer**
   - Only for explicit optimization requests
   - Fast path without explanation

3. **Automatic = Smart**
   - query-explainer auto-invokes optimizer when needed
   - No manual coordination required

4. **User Experience**
   - Natural: "Explain this" → Full analysis
   - Fast: "Optimize this" → Direct optimization
