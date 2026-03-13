---
name: skill-check
description: Check a skill for duplicates, categorization, hardcoded credentials, and breaking changes. Use when reviewing a new or modified skill before publishing, or when the user asks to check, validate, or audit a skill.
---

# Skill Check

Run 4 quality checks against a SKILL.md file before publishing. Accepts a local path to a directory containing SKILL.md, or reads from the known install path if the skill was just created in this session.

## Input

Detect automatically from user input:
- **Local path**: a directory containing `SKILL.md` (e.g., `/path/to/my-skill/`)
- **Just-created skill**: if user says "check the skill I just created", read from `~/.cache/tdx/.claude/skills/<name>/SKILL.md`

If ambiguous, ask the user to clarify.

**Validation**: Confirm `SKILL.md` exists at the path before proceeding. If not found, stop and report the error.

## Checks

Run all 4 checks in order. Report results even if one check fails.

### Check 1: Dedupe — Is this too similar to existing skills?

1. Read the target skill's `name` and `description` from SKILL.md frontmatter.
2. Scan for existing skills in two locations:
   - **Local skills**: `~/.cache/tdx/.claude/skills/*/SKILL.md`
   - **Plugin cache (td-skills)**: find the latest non-orphaned version directory under `~/.cache/tdx/.claude/plugins/cache/td-skills/`, then read `marketplace.json` to get all skill paths. Read each skill's SKILL.md frontmatter.
3. Compare the target skill against each existing skill:
   - **Exact name match**: same `name` field → FAIL (duplicate)
   - **Semantic similarity**: compare descriptions and purpose. Use your judgment to assess overlap.
4. Scoring:
   - **HIGH overlap** (FAIL): same core functionality, should contribute to existing skill instead
   - **MEDIUM overlap** (WARN): related but distinct, note for awareness
   - **LOW/NONE** (PASS): no significant overlap

### Check 2: Categorize — Which product area does this belong to?

1. Read the skill's name, description, and body.
2. Compare against known product area categories:

   **td-skills (public):**
   sql-skills, workflow-skills, tdx-skills, studio-skills, realtime-skills, sdk-skills, analysis-skills, aps-doc-skills, email-campaign-skills, semantic-layer, field-agent-skills, template-skill

   **td-internal-skills:**
   aps-ml-workflow-skills, company-skills, engineering-skills, executive-skills, jp-ps-skills, ml-solutions-skills, onboarding-skills, ops-skills, product-analytics-skills, product-skills, support-skills, skill-eval-skills

3. Suggest the **best-fit category**. If none fit, suggest "new category" with a proposed name.
4. If the skill is already in a category (based on its path), flag if it appears miscategorized.

### Check 3: Validate — Are there hardcoded credentials or private data?

Scan the full SKILL.md content and any files in sibling `reference/` or `scripts/` directories for:

| Pattern | What to look for |
|---------|-----------------|
| API keys/tokens | `TD_API_KEY=<actual value>`, `Bearer <token>`, long hex/base64 strings |
| Hardcoded DB names | Database names that look customer-specific (not generic examples like `my_database` or `example_db`) |
| Hardcoded table names | Tables with customer-identifiable prefixes |
| Email addresses | Real email addresses (not `user@example.com` placeholders) |
| Internal URLs | URLs with internal hostnames (not public docs) |
| User-specific paths | Paths like `/home/username/...` or `/Users/specific.person/...` |

For each finding, report:
- Line number
- The offending content
- Recommendation (use placeholder, use env var, use generic example)

**PASS** if no issues found. **FAIL** if any credentials or customer-specific data detected.

### Check 4: Impact — New skill or breaking change?

1. Check if a skill with the same `name` already exists (locally or in plugin cache).
2. If **exists**:
   - Compare the old and new versions
   - Flag as **UPDATE** with a summary of what changed
   - Flag as **BREAKING CHANGE** if any of:
     - Description scope narrowed (could stop triggering for existing use cases)
     - Required inputs changed
     - Output format changed significantly
     - Tool usage changed (different commands prescribed)
3. If **does not exist**: flag as **NEW**

Report: NEW / UPDATE / BREAKING CHANGE

## Output Format

```markdown
## Skill Check: [skill-name]

**Source**: [path]

| Check | Status | Finding |
|-------|--------|---------|
| 1. Dedupe | PASS/WARN/FAIL | [summary] |
| 2. Category | [suggested category] | [reasoning] |
| 3. Validate | PASS/FAIL | [N issues found] |
| 4. Impact | NEW/UPDATE/BREAKING | [summary] |

### Check 1: Dedupe Details
[List similar skills found with overlap assessment]

### Check 2: Category Details
[Reasoning for category suggestion]

### Check 3: Validation Details
[List of findings with line numbers, or "No issues found"]

### Check 4: Impact Details
[For updates: summary of changes. For new: "No existing skill with this name"]

### Recommendations
1. [Most important action]
2. [Second action]
3. [Third action]
```