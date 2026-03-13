---
name: skill-output-eval
description: Evaluate Claude's output quality when a skill is loaded. Tests whether SKILL.md instructions produce correct, useful results across test scenarios and model tiers. Use when testing if a skill actually works after triggering.
---

# Skill Output Evaluation

Evaluate whether a skill's SKILL.md instructions lead Claude to produce correct, useful output when invoked. This tests the skill *after* it triggers — does Claude follow the instructions and get good results?

## Evaluation Process

### Step 1: Read and Understand the Skill

Read the full SKILL.md. Identify:

- **Core task**: What is Claude supposed to do?
- **Key instructions**: What specific behaviors does the skill prescribe?
- **Output format**: Does the skill specify a particular output structure?
- **Tool usage**: Does the skill tell Claude to use specific tools/commands?
- **Constraints**: What must Claude avoid?

### Step 2: Create Test Scenarios

Design **5-8 test scenarios** across these dimensions:

| Dimension | What to Test | Example |
|-----------|-------------|---------|
| **Happy path** | Standard use case with clear input | "Review PR #42 on td-skills" |
| **Minimal input** | User gives very little context | "Review this" |
| **Ambiguous input** | User request could go multiple ways | "Check this code" |
| **Edge case** | Unusual but valid request | "Review a skill with no examples section" |
| **Error case** | Invalid input or impossible request | "Review a file that doesn't exist" |
| **Complex case** | Multi-step request requiring full skill | "Review all skills in this repo and compare" |

For each scenario, define:

```markdown
### Scenario: [Name]

**User prompt**: "[what the user says]"

**Expected behavior**:
- [ ] Claude should [specific action 1]
- [ ] Claude should [specific action 2]
- [ ] Output should include [specific element]
- [ ] Claude should NOT [specific anti-behavior]

**Key instruction tested**: [which part of SKILL.md this validates]
```

### Step 3: Evaluate Instruction Quality

Analyze the SKILL.md instructions for these failure modes:

| Failure Mode | What to Check | Impact |
|---|---|---|
| **Instruction gaps** | Is there a scenario where the skill gives no guidance? | Claude guesses, may get it wrong |
| **Instruction conflicts** | Do two sections contradict each other? | Claude follows one, ignores the other unpredictably |
| **Ambiguous instructions** | Could an instruction be interpreted multiple ways? | Inconsistent output across invocations |
| **Over-specification** | Does the skill micro-manage steps Claude can infer? | Wastes context, may cause rigid/unnatural output |
| **Missing constraints** | Are there things Claude should NOT do that aren't stated? | Claude may take undesirable actions |
| **Assumed context** | Does the skill assume knowledge it doesn't provide? | Claude may hallucinate missing details |
| **Inconsistent terminology** | Does the skill use multiple terms for the same concept? (e.g., "endpoint" vs "URL" vs "route") | Confuses Claude, degrades instruction following |
| **Wrong degrees of freedom** | Does the specificity match the task's fragility? Fragile ops (DB migrations) need exact scripts. Open-ended tasks (code review) need general guidance. | Too rigid = unnatural output. Too loose = errors on fragile operations |
| **Missing feedback loops** | For complex multi-step tasks: is there a validate → fix → repeat loop? | Claude may produce errors that cascade through later steps |
| **Missing workflow checklists** | For complex skills (5+ steps): is there a checklist Claude can track progress against? | Claude may skip steps or lose track in long workflows |

### Step 4: Model Tier Assessment

Check if the skill works across model tiers:
- **Haiku**: Enough explicit structure/examples for simpler models?
- **Sonnet**: Good baseline — any issues?
- **Opus**: Over-specified in ways that waste context?

### Step 5: Consistency Check

Evaluate whether the same prompt would produce consistent output:

- **Format consistency**: Does output structure stay the same across runs?
- **Content consistency**: Are facts and recommendations stable?
- **Tool usage consistency**: Does Claude use the same tools/commands?

Flag instructions that are likely to produce inconsistent results (vague guidance, multiple valid interpretations, no output format specified).

### Step 6: LLM-as-Judge Self-Evaluation

For each test scenario from Step 2, perform a structured self-evaluation:

1. **Simulate**: With the SKILL.md loaded as context, mentally simulate what Claude would output for the test prompt. Note: self-evaluation is inherently approximate — if the skill is installed locally, prefer real invocation over simulation.
2. **Judge**: For each expected behavior criterion, use chain-of-thought reasoning:
   - **Plan**: What should Claude do according to the instructions?
   - **Think**: Would the simulated output satisfy this criterion?
   - **Score**: PASS or FAIL
   - **Reason**: One-sentence justification
3. **Record**: Log each criterion result in the evaluation table
4. **Aggregate**: Report `X/Y criteria passed (Z% pass rate)` across all scenarios

## Output Format

```markdown
## Output Evaluation: [skill-name]

### Skill Summary
- **Core task**: [what the skill does]
- **Line count**: [N] lines
- **Key instructions**: [brief list]

### Test Scenarios

| # | Scenario | Prompt | Criterion | Score | Reason |
|---|----------|--------|-----------|-------|--------|
| 1 | Happy path | "..." | [criterion 1] | PASS/FAIL | [reason] |
| 1 | Happy path | "..." | [criterion 2] | PASS/FAIL | [reason] |
| 2 | Minimal input | "..." | [criterion 1] | PASS/FAIL | [reason] |
| ... | | | | | |
| | | | **Aggregate** | **X/Y (Z%)** | |

### Instruction Quality

| Check | Status | Notes |
|-------|--------|-------|
| No instruction gaps | Pass/Fail | [details] |
| No instruction conflicts | Pass/Fail | [details] |
| No ambiguous instructions | Pass/Fail | [details] |
| Not over-specified | Pass/Fail | [details] |
| Constraints defined | Pass/Fail | [details] |
| No assumed context | Pass/Fail | [details] |
| Consistent terminology | Pass/Fail | [details] |
| Appropriate degrees of freedom | Pass/Fail | [details] |
| Feedback loops (if multi-step) | Pass/Fail/N/A | [details] |
| Workflow checklist (if complex) | Pass/Fail/N/A | [details] |

### Model Tier Assessment
- **Haiku**: [Enough guidance? / Needs more detail in X area]
- **Sonnet**: [Balanced? / Any issues?]
- **Opus**: [Over-specified? / Good freedom level?]

### Consistency Assessment
- Format consistency: [High/Medium/Low]
- Content consistency: [High/Medium/Low]
- Tool usage consistency: [High/Medium/Low]

### Key Findings
1. [Most critical issue]
2. [Second issue]
3. [Third issue]

### Recommendations
1. [Specific fix with example]
2. [Specific fix with example]
```

## What Good Skill Output Looks Like

A well-written skill produces output that is:

- **Deterministic where it matters**: Same format, same tool usage, same constraints applied
- **Flexible where appropriate**: Adapts content to user's specific request
- **Complete**: Doesn't miss steps prescribed by the skill
- **Bounded**: Doesn't do more than the skill asks for
- **Correct**: Follows domain-specific conventions prescribed by the skill