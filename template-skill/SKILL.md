---
name: template-skill
description: Replace with a clear description of what this skill does and when Claude should use it. Be specific about the use cases, tools, or workflows this skill addresses.
---

# Skill Name

Brief introduction explaining what this skill helps users accomplish.

## When to Use This Skill

Use this skill when:
- Specific use case 1
- Specific use case 2
- Specific use case 3

## Core Principles

### 1. First Key Concept

Explanation of the first important concept or pattern.

**Example:**
```yaml
# Show concrete example
key: value
```

### 2. Second Key Concept

Explanation of the second important concept.

```sql
-- SQL example if relevant
SELECT * FROM table_name
```

### 3. Additional Concepts

Continue with other important concepts, patterns, or best practices.

## Common Patterns

### Pattern 1: Descriptive Name

```yaml
# Show a complete, realistic example
example:
  key: value
  nested:
    - item1
    - item2
```

**Explanation:** Describe what this pattern does and when to use it.

### Pattern 2: Another Pattern

Provide another common use case with example code.

## Best Practices

1. **Practice 1** - Clear guideline
2. **Practice 2** - Another guideline
3. **Practice 3** - And so on

## Common Issues and Solutions

### Issue: Problem Description

**Symptoms:**
- What the user sees
- Error messages

**Solutions:**
1. First solution approach
2. Alternative approach
3. Workaround if needed

**Example:**
```yaml
# Show the fix
corrected:
  example: here
```

## Advanced Topics

### Advanced Feature 1

For users who need more sophisticated functionality.

### Advanced Feature 2

Additional advanced patterns or techniques.

## Workflow Example

Step-by-step example of a complete workflow:

1. **Step 1:** Do this first
2. **Step 2:** Then do this
3. **Step 3:** Finally complete with this

```yaml
# Complete working example
complete:
  workflow:
    step1: value
    step2: value
```

## Related Skills

- Link to related skill if applicable
- Another related skill

## Resources

- Official documentation links
- Internal TD resources
- Related tools or services

---

## Template Usage Notes

When creating a new skill from this template:

1. **Update the frontmatter:**
   - Change `name` to your skill's unique identifier (lowercase-with-hyphens)
   - Write a clear `description` that explains when Claude should use this skill

2. **Replace the content:**
   - Update the main heading
   - Fill in "When to Use This Skill" with specific scenarios
   - Add core principles and concepts specific to your domain
   - Provide realistic, working examples
   - Include common patterns from your area of expertise

3. **Focus on TD-specific patterns:**
   - Include TD conventions and best practices
   - Reference internal tools and workflows
   - Use realistic TD table names and data patterns
   - Include timezone considerations (JST/UTC)

4. **Make it actionable:**
   - Provide complete, copy-paste-ready examples
   - Include error handling patterns
   - Show debugging approaches
   - Add troubleshooting sections

5. **Keep it maintainable:**
   - Add version comments if tracking changes
   - Include last updated date
   - Link to authoritative documentation
   - Note any TD-specific limitations or requirements

6. **Test your skill:**
   - Verify all examples work
   - Test with Claude Code
   - Get feedback from potential users
   - Update based on real-world usage
