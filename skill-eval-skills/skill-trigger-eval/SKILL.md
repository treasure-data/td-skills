---
name: skill-trigger-eval
description: Evaluate whether a Claude Code skill's description triggers correctly. Tests for over-broad triggers, missed triggers, and overlap with other skills. Use when testing if a skill's description will match the right user prompts.
---

# Skill Trigger Evaluation

Evaluate whether a skill's `description` field will cause Claude Code to invoke it for the right user prompts — and not invoke it for wrong ones.

## How Triggering Works

All skill descriptions are loaded into the system prompt at startup. When a user sends a message, Claude decides which skill (if any) to invoke based on description match. This means:

- All descriptions **compete** in the same system prompt
- Overlapping descriptions cause **ambiguity** — Claude may pick the wrong skill
- Overly broad descriptions cause **false triggers** on unrelated queries
- Overly narrow descriptions cause **missed triggers** on relevant queries

## Evaluation Process

### Step 1: Read the Skill

Fetch the skill's `name`, `description`, and skim the SKILL.md body to understand intended scope.

```bash
# Option A: Local path (primary) — read SKILL.md directly from a directory
# Read SKILL.md frontmatter from the provided path

# Option B: PR — extract from diff
gh pr diff [N] --repo [owner/repo]
```

### Step 2: Generate Test Prompts

Create a test matrix with 4 categories:

| Category | Description | Expected Result |
|----------|-------------|-----------------|
| **Direct match** | Prompts that clearly match the skill's purpose | SHOULD trigger |
| **Indirect match** | Prompts that relate to the skill but don't use exact keywords | SHOULD trigger |
| **Adjacent miss** | Prompts for related but different tasks (neighboring skills) | Should NOT trigger |
| **Unrelated** | Completely unrelated prompts | Should NOT trigger |

Generate **3-5 prompts per category** (12-20 total).

**Example for a `code-review` skill:**

```
DIRECT MATCH (should trigger):
- "Review this pull request"
- "Check this code for issues"
- "Give me feedback on this diff"

INDIRECT MATCH (should trigger):
- "Is this code ready to merge?"
- "What's wrong with this implementation?"
- "Can you spot any bugs here?"

ADJACENT MISS (should NOT trigger — belongs to other skills):
- "Write a function to parse JSON" → coding skill, not review
- "Refactor this class" → refactoring skill
- "Add unit tests" → testing skill

UNRELATED (should NOT trigger):
- "What's the weather today?"
- "Create a new project"
- "How do I install Node.js?"
```

### Step 3: Evaluate Description Against Prompts

For each test prompt, assess: **Would Claude select this skill based on the description alone?**

Score each prompt:
- **TP** (True Positive): Should trigger and description supports it
- **FN** (False Negative): Should trigger but description doesn't cover it
- **FP** (False Positive): Should NOT trigger but description is broad enough to match
- **TN** (True Negative): Should NOT trigger and description correctly excludes it

### Step 4: Check for Overlap

Compare the skill's description against all other skills in the same marketplace.json. Flag:

- **Hard overlap**: Two descriptions cover the same trigger conditions
- **Soft overlap**: Descriptions are adjacent and Claude may hesitate between them
- **Gap**: No skill covers a reasonable user query in this domain

```bash
# Read all skill descriptions from marketplace
# Search ancestor directories from skill path for marketplace.json, then extract descriptions
# If no marketplace.json found, skip overlap analysis and note it in the report
```

### Step 5: Evaluate Description Properties

| Property | Good | Bad |
|----------|------|-----|
| **Specificity** | Mentions specific tools/commands | Generic ("helps with data") |
| **Trigger keywords** | Contains terms users would say | Uses internal jargon only |
| **Boundary clarity** | Clear what it does AND doesn't do | Ambiguous scope |
| **Length** | 1-2 sentences | Paragraph or multi-line block |
| **Perspective** | Third person ("Converts queries...") | First/second person ("I help you...") |

## Output Format

```markdown
## Trigger Evaluation: [skill-name]

### Description Under Test
> [paste the description]

### Test Matrix

| # | Prompt | Category | Expected | Predicted | Result |
|---|--------|----------|----------|-----------|--------|
| 1 | "Optimize this query..." | Direct | Trigger | Trigger | TP |
| 2 | "Query keeps timing out" | Indirect | Trigger | Trigger | TP |
| 3 | "Write a Trino query" | Adjacent | No trigger | Trigger | FP |
| ... | | | | | |

### Scores
- Precision: [TP / (TP + FP)] — How often it triggers correctly when it fires
- Recall: [TP / (TP + FN)] — How often it fires when it should
- F1: Harmonic mean

### Overlap Analysis
[List any skills with overlapping descriptions]

### Undertriggering Risk: [Low/Medium/High]
[Assessment of whether description is "pushy" enough per Anthropic guidance]

### Recommendations
1. [Specific description rewording if needed]
2. [Keywords to add/remove]
3. [Boundary clarifications]
4. [Undertriggering fixes if needed]
```

### Step 6: Undertriggering Risk Assessment

**Key insight from Anthropic:** Claude has a tendency to **undertrigger** skills — to not use them when they'd be useful. Simple, one-step queries may not trigger a skill even if the description matches, because Claude can handle them directly.

**Check for these undertriggering risks:**

| Risk | What to Look For | Fix |
|------|-----------------|-----|
| **Description too modest** | Description states facts but doesn't encourage use | Make description "pushy" — add "Make sure to use this skill whenever..." |
| **Missing adjacent contexts** | Description only covers exact use case, not related ones | Add adjacent triggers: "even if they don't explicitly ask for X" |
| **Simple queries won't trigger** | Test prompts are too simple (one-step tasks) | Ensure test prompts are substantive enough that Claude would benefit from consulting the skill |
| **No "Use when" clause** | Description says what skill does but not when to use it | Always include "Use when [contexts]" at the end |

**Anthropic's recommended pattern:**
Instead of: `"How to build a fast dashboard to display internal data."`
Write: `"How to build a fast dashboard to display internal data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'"`

**Score the undertriggering risk:**
- **Low risk**: Description includes "Use when" + adjacent contexts + pushy language
- **Medium risk**: Description has "Use when" but misses adjacent contexts
- **High risk**: Description only states what skill does, no trigger guidance

## Common Trigger Problems

| Problem | Symptom | Fix |
|---------|---------|-----|
| Too broad | Triggers on unrelated queries | Add specificity ("for TD Trino queries" not just "for queries") |
| Too narrow | Misses paraphrased requests | Add alternate phrasings in description |
| Keyword-dependent | Only triggers on exact words | Describe the *task* not just the *tool* |
| Overlapping | User gets wrong skill | Differentiate with "Use when X, not Y" |
| Jargon-heavy | Users don't use those terms | Include user-facing language |
| **Undertriggering** | Skill exists but Claude doesn't use it | Make description "pushy" with adjacent contexts |