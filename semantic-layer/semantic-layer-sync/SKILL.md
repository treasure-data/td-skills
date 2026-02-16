---
name: semantic-config-master-skill
description: Master skill for managing all aspects of TD semantic layer configuration including scope, patterns, PII, lineage, validation, notifications, and sync behavior. Use for comprehensive config management or when you need to manage multiple configuration areas at once.
redirect: semantic-config-master-skill.md
---

# ⚠️ SKILL RENAMED

The original `semantic-layer-sync` skill has been renamed to **`semantic-config-master-skill`**.

## New Skill Architecture

The semantic layer configuration is now organized into **12 skills** (1 master + 11 focused):

### 🎯 Master Skill
- **[semantic-config-master-skill.md](semantic-config-master-skill.md)** - Comprehensive configuration management

### 🔧 Focused Skills (Single-Responsibility)

| # | Skill | Purpose |
|---|-------|---------|
| 1 | [semantic-layer-scope](skills/semantic-layer-scope.md) | Database/table selection |
| 2 | [semantic-layer-lineage](skills/semantic-layer-lineage.md) | Lineage detection |
| 3 | [semantic-layer-validation](skills/semantic-layer-validation.md) | Validation rules |
| 4 | [semantic-layer-patterns](skills/semantic-layer-patterns.md) | Auto-generation patterns |
| 5 | [semantic-layer-pii](skills/semantic-layer-pii.md) | PII detection |
| 6 | [semantic-layer-tags](skills/semantic-layer-tags.md) | Semantic tagging |
| 7 | [semantic-layer-conflicts](skills/semantic-layer-conflicts.md) | Conflict resolution |
| 8 | [semantic-layer-notifications](skills/semantic-layer-notifications.md) | Alerts |
| 9 | [semantic-layer-approval](skills/semantic-layer-approval.md) | Approval workflows |
| 10 | [semantic-layer-sync-config](skills/semantic-layer-sync-config.md) | Sync behavior |
| 11 | [semantic-layer-testing](skills/semantic-layer-testing.md) | Test mode |

## Which Skill Should You Use?

### Use the Master Skill when:
- Setting up semantic layer for the first time
- Making changes across multiple configuration sections
- Reviewing or auditing entire configuration

### Use Focused Skills when:
- Making targeted changes to one configuration area
- Adding/updating specific patterns, rules, or settings
- Example: "Add PII pattern" → use `semantic-layer-pii`

## Quick Reference

| User Says | Use This Skill |
|-----------|----------------|
| "Add database to semantic layer" | semantic-layer-scope |
| "Add pattern for risk metrics" | semantic-layer-patterns |
| "Detect SSN as PII" | semantic-layer-pii |
| "Require field descriptions" | semantic-layer-validation |
| "Enable dbt lineage" | semantic-layer-lineage |
| "Send Slack alerts on errors" | semantic-layer-notifications |
| "Configure entire semantic layer" | semantic-config-master-skill |

## Full Documentation

See **[skills/README.md](skills/README.md)** for complete skill index and usage guide.

---

**Effective Date**: 2026-02-16
**Version**: 2.0.0
