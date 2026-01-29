---
name: agent-test
description: Run automated tests for LLM agents using `tdx agent test`. Covers test.yml format with user_input/criteria, single and multi-round tests, evaluation by judge agent, and criteria development workflow.
---

# tdx Agent Test

Run automated tests against agents using YAML test definitions. Tests are evaluated by a judge agent for binary pass/fail results.

## Commands

```bash
# Run tests from current agent directory
tdx agent test

# Run tests from specific path
tdx agent test ./agents/my-project/my-agent/

# Run specific tests by name
tdx agent test --name "greeting_test" --name "context_test"

# Run tests with specific tags
tdx agent test --tags "smoke,regression"

# Validate test file without running
tdx agent test --dry-run

# Run without evaluation (just execute conversations)
tdx agent test --no-eval

# Re-evaluate last test run with updated criteria
tdx agent test --reeval
```

## Test File Structure

Create `test.yml` in your agent directory:

```
agents/{project-name}/{agent-name}/
├── agent.yml
├── prompt.md
└── test.yml
```

## test.yml Format

### Single-Round Tests (Flat Format)

```yaml
tests:
  - name: greeting_test
    tags: [smoke, core]
    user_input: Hello
    criteria: Should respond with a friendly greeting

  - name: calculation_test
    tags: [regression]
    user_input: What is 2 + 2?
    criteria: Should respond with the correct answer (4)
```

### Multi-Round Tests (Rounds Format)

```yaml
tests:
  - name: context_memory_test
    tags: [memory, core]
    rounds:
      - user_input: My name is Alice
        criteria: Should acknowledge the name
      - user_input: What's my name?
        criteria: Should remember and respond with "Alice"

  - name: multi_step_task
    rounds:
      - user_input: I want to analyze sales data
        criteria: Should ask clarifying questions about the data
      - user_input: It's in the sales_2024 table
        criteria: Should acknowledge and proceed with analysis
```

## Writing Good Criteria

Criteria are evaluated by a judge agent. Be specific and measurable:

```yaml
# Good - specific and measurable
criteria: Should respond with the number 4

# Good - describes expected behavior
criteria: Should ask for the customer's email address before proceeding

# Good - includes negative constraints
criteria: Should provide help without mentioning competitor products

# Bad - too vague
criteria: Should give a good response

# Bad - subjective
criteria: Should be helpful and friendly
```

## Writing Good Test Cases

### Test Core Functionality

```yaml
tests:
  - name: primary_use_case
    user_input: Help me with a billing question
    criteria: Should ask clarifying questions about the billing issue
```

## Re-evaluation Workflow

Iterate on criteria without re-running conversations:

```bash
# 1. Run tests to generate conversations
tdx agent test

# 2. Edit criteria in test.yml

# 3. Re-evaluate with cached conversations
tdx agent test --reeval
```

Cache is stored in `.cache/tdx/last_agent_test_run.json`.

## Options

| Option | Description |
|--------|-------------|
| `--name <name>` | Filter to specific test(s) by name (can repeat) |
| `--tags <tags>` | Filter to tests with specific tags (comma-separated) |
| `--dry-run` | Parse and validate without running |
| `--no-eval` | Run conversations without evaluation |
| `--reeval` | Re-evaluate last run with updated criteria |

## Related Skills

- **agent** - Agent configuration and `pull/push` workflow
- **agent-prompt** - Writing effective system prompts
