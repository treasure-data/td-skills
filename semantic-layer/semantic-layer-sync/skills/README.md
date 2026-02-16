# Semantic Layer Skills - Complete Index

**Focused, single-responsibility skills for managing semantic layer configuration in Treasure Data.**

## Overview

The semantic layer skills provide a **microservices-style architecture** for configuring metadata automation, with each skill managing a specific configuration area. This design improves:

- ✅ **Discoverability** - Claude knows exactly which skill to use for each task
- ✅ **Maintainability** - Each skill has clear boundaries and single responsibility
- ✅ **Usability** - Smaller, focused configuration surfaces
- ✅ **Composability** - Skills can call each other and build workflows

## Skill Architecture

```
semantic-layer-sync/
├── semantic-config-master-skill.md    # Master skill (all config sections)
└── skills/
    ├── semantic-layer-scope.md        # Database/table selection
    ├── semantic-layer-lineage.md      # Lineage detection
    ├── semantic-layer-validation.md   # Validation rules
    ├── semantic-layer-patterns.md     # Auto-generation patterns
    ├── semantic-layer-pii.md          # PII detection
    ├── semantic-layer-tags.md         # Semantic tagging
    ├── semantic-layer-conflicts.md    # Conflict resolution
    ├── semantic-layer-notifications.md # Alerts
    ├── semantic-layer-approval.md     # Approval workflows
    ├── semantic-layer-sync-config.md  # Sync behavior
    └── semantic-layer-testing.md      # Test mode
```

---

## 📋 All Skills (12 Total)

### Master Skill

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **[semantic-config-master-skill](../semantic-config-master-skill.md)** | Comprehensive configuration management | Full setup, multi-section changes, cross-cutting concerns |

### Focused Skills (11)

| # | Skill | Config Section | Purpose | Common Tasks |
|---|-------|----------------|---------|--------------|
| 1 | **[semantic-layer-scope](semantic-layer-scope.md)** | `scope` | Database/table selection | Add databases, exclude patterns, define processing scope |
| 2 | **[semantic-layer-lineage](semantic-layer-lineage.md)** | `lineage` | Lineage detection | Enable dbt/workflow lineage, set confidence thresholds |
| 3 | **[semantic-layer-validation](semantic-layer-validation.md)** | `validation` | Validation rules | Require descriptions, custom rules, PII validation |
| 4 | **[semantic-layer-patterns](semantic-layer-patterns.md)** | `auto_generation.patterns` | Metadata generation patterns | Add custom patterns, extend built-ins, domain-specific rules |
| 5 | **[semantic-layer-pii](semantic-layer-pii.md)** | `auto_generation.patterns` + `pii_validation` | PII detection | Add PII patterns, configure categorization, compliance |
| 6 | **[semantic-layer-tags](semantic-layer-tags.md)** | `auto_generation.generate.tags` | Semantic tagging | Manage tag taxonomy, tag assignment rules |
| 7 | **[semantic-layer-conflicts](semantic-layer-conflicts.md)** | `conflict_handling` | Merge strategies | Configure conflict resolution, merge policies |
| 8 | **[semantic-layer-notifications](semantic-layer-notifications.md)** | `notifications` | Alerts | Slack/email notifications, error alerts |
| 9 | **[semantic-layer-approval](semantic-layer-approval.md)** | `approval` | Approval workflow | Change approval requirements, governance |
| 10 | **[semantic-layer-sync-config](semantic-layer-sync-config.md)** | `sync` | Sync behavior | Batch size, sync mode, scheduling, retries |
| 11 | **[semantic-layer-testing](semantic-layer-testing.md)** | `testing` | Test mode | Dry-run, test database, mock services, CI/CD |

---

## 🎯 Skill Selection Guide

### By Use Case

#### Initial Setup
1. Start with **[semantic-config-master-skill](../semantic-config-master-skill.md)** for full configuration
2. Then use focused skills for fine-tuning specific areas

#### Daily Operations
- Add database → **[semantic-layer-scope](semantic-layer-scope.md)**
- Add pattern → **[semantic-layer-patterns](semantic-layer-patterns.md)**
- Add PII pattern → **[semantic-layer-pii](semantic-layer-pii.md)**
- Configure alerts → **[semantic-layer-notifications](semantic-layer-notifications.md)**

#### Governance & Compliance
- PII governance → **[semantic-layer-pii](semantic-layer-pii.md)**
- Validation rules → **[semantic-layer-validation](semantic-layer-validation.md)**
- Approval workflows → **[semantic-layer-approval](semantic-layer-approval.md)**
- Conflict resolution → **[semantic-layer-conflicts](semantic-layer-conflicts.md)**

#### Development & Testing
- Test configuration → **[semantic-layer-testing](semantic-layer-testing.md)**
- Sync behavior → **[semantic-layer-sync-config](semantic-layer-sync-config.md)**

### By User Intent

| User Says | Use This Skill |
|-----------|----------------|
| "Add gld_cstore database to scope" | semantic-layer-scope |
| "Enable dbt lineage detection" | semantic-layer-lineage |
| "Require descriptions for all fields" | semantic-layer-validation |
| "Add pattern for risk_* fields" | semantic-layer-patterns |
| "Detect SSN fields as PII" | semantic-layer-pii |
| "Tag all revenue fields as financial" | semantic-layer-tags |
| "Set merge strategy to manual wins" | semantic-layer-conflicts |
| "Send Slack notification on errors" | semantic-layer-notifications |
| "Require approval for PII changes" | semantic-layer-approval |
| "Set batch size to 50 tables" | semantic-layer-sync-config |
| "Enable test mode with dev database" | semantic-layer-testing |
| "Configure entire semantic layer" | semantic-config-master-skill |

---

## 📊 Skills by Priority

### Phase 1: Core (Start Here)
1. ✅ **semantic-layer-scope** - Define what to process
2. ✅ **semantic-layer-patterns** - Most used, highest impact
3. ✅ **semantic-layer-pii** - Compliance critical
4. ✅ **semantic-layer-validation** - Governance requirements

### Phase 2: Workflow
5. ✅ **semantic-layer-conflicts** - Merge strategy management
6. ✅ **semantic-layer-sync-config** - Sync behavior
7. ✅ **semantic-layer-approval** - Change management

### Phase 3: Integration
8. ✅ **semantic-layer-lineage** - Lineage tracking
9. ✅ **semantic-layer-notifications** - Alerting
10. ✅ **semantic-layer-tags** - Tag management
11. ✅ **semantic-layer-testing** - Development/testing

---

## 🔗 Skill Relationships

### Dependencies

```
semantic-layer-scope (defines what to process)
    ↓
semantic-layer-patterns (how to generate metadata)
    ↓
semantic-layer-pii (specialized patterns for PII)
    ↓
semantic-layer-validation (verify results)
    ↓
semantic-layer-conflicts (resolve conflicts)
    ↓
semantic-layer-sync-config (how to sync)
    ↓
semantic-layer-approval (require approval)
    ↓
semantic-layer-notifications (alert on results)

semantic-layer-lineage (detects relationships)
semantic-layer-tags (organizes metadata)
semantic-layer-testing (validates configuration)
```

### Common Combinations

#### GDPR Compliance Setup
1. **semantic-layer-pii** - Add GDPR PII patterns
2. **semantic-layer-validation** - Require PII owners
3. **semantic-layer-approval** - Require approval for PII changes
4. **semantic-layer-notifications** - Alert on PII detection

#### Production Setup
1. **semantic-layer-scope** - Define production databases
2. **semantic-layer-patterns** - Add domain patterns
3. **semantic-layer-conflicts** - Set manual_wins strategy
4. **semantic-layer-sync-config** - Daily scheduled sync
5. **semantic-layer-notifications** - Slack notifications

#### Development Setup
1. **semantic-layer-testing** - Enable test mode
2. **semantic-layer-scope** - Use dev databases
3. **semantic-layer-sync-config** - Manual sync mode
4. **semantic-layer-conflicts** - Relaxed conflict handling

---

## 📝 Documentation Structure

Each skill follows this consistent structure:

### 1. Frontmatter
```yaml
---
name: skill-name
description: Brief description for Claude
---
```

### 2. Core Sections
- **Purpose** - What the skill manages
- **When to Use** - Clear use cases with ✅ and ❌
- **Configuration Section** - YAML schema and examples
- **Common Operations** - 5+ real user requests with solutions

### 3. Examples
- **Real-World Examples** - 2-3 comprehensive scenarios
- **Output Examples** - What results look like
- **Testing** - How to test configuration

### 4. Reference
- **Best Practices** - 5+ tips with rationale
- **Troubleshooting** - Common issues with solutions
- **Performance** - Considerations and optimization
- **Integration** - How it works with other skills
- **CLI Commands** - Complete command reference
- **Related Skills** - Links to related skills

### 5. Footer
- Status (Production Ready)
- Skill Type (Focused / Single-Responsibility)
- Last Updated date

---

## 🚀 Quick Start

### Option 1: Start with Master Skill
```bash
# Full configuration setup
Use semantic-config-master-skill to:
1. Create initial config.yaml
2. Set up all sections
3. Deploy to TD
```

### Option 2: Start with Core Skills
```bash
# Incremental setup
1. semantic-layer-scope: Define databases to process
2. semantic-layer-patterns: Add domain-specific patterns
3. semantic-layer-pii: Configure PII detection
4. semantic-layer-validation: Set governance rules
```

### Option 3: Task-Driven
```bash
# Solve specific problem
"Add PII pattern for SSN"
→ Use semantic-layer-pii skill
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [semantic-config-master-skill.md](../semantic-config-master-skill.md) | Master skill documentation |
| [README.md](../README.md) | Project setup and usage guide |
| [AUTO_GENERATION_GUIDE.md](../AUTO_GENERATION_GUIDE.md) | Detailed pattern guide |
| [COMPLETE_GUIDE.md](../COMPLETE_GUIDE.md) | Comprehensive documentation |
| [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) | Command cheat sheet |
| [config.yaml](../config.yaml) | Configuration template |
| [data_dictionary.yaml](../data_dictionary.yaml) | Data structure template |

---

## 🔧 CLI Reference

### View Configuration

```bash
# Show specific skill config
python semantic_layer_sync.py --config config.yaml --show-scope
python semantic_layer_sync.py --config config.yaml --show-patterns
python semantic_layer_sync.py --config config.yaml --show-pii
```

### Test Configuration

```bash
# Dry-run (all skills)
python semantic_layer_sync.py --config config.yaml --dry-run

# Validate configuration
python semantic_layer_sync.py --config config.yaml --validate-only
```

### Apply Configuration

```bash
# Apply changes
python semantic_layer_sync.py --config config.yaml --apply --approve

# Apply with verbose logging
python semantic_layer_sync.py --config config.yaml --apply --approve -v
```

---

## 🎓 Examples by Industry

### E-Commerce
- **Scope**: gld_cstore, gld_loyalty, gld_marketing
- **Patterns**: product_*, order_*, customer_*
- **PII**: email, phone, address (CCPA)
- **Tags**: customer, product, financial

### Healthcare
- **Scope**: patient_data, clinical_*, phi_*
- **Patterns**: mrn, insurance_*, diagnosis_*
- **PII**: ssn, dob, patient_id (HIPAA)
- **Tags**: healthcare, phi, clinical

### Financial Services
- **Scope**: transactions, accounts, customers
- **Patterns**: account_*, transaction_*, balance_*
- **PII**: ssn, credit_card, account_number (SOX, PCI-DSS)
- **Tags**: financial, regulatory, sensitive

---

## 💡 Best Practices

### 1. Start Small, Iterate
- Begin with 1-2 databases
- Add patterns incrementally
- Test thoroughly before scaling

### 2. Use Focused Skills
- Prefer focused skills over master for specific changes
- Use master skill only for comprehensive setup

### 3. Document Rationale
- Add comments explaining why patterns exist
- Document custom rules and their purpose
- Track changes in version control

### 4. Test Before Production
- Always use `--dry-run` first
- Test on dev database
- Validate results before applying

### 5. Monitor and Iterate
- Review validation errors regularly
- Update patterns as schema evolves
- Collect team feedback

---

## 📊 Statistics

- **Total Skills**: 12 (1 master + 11 focused)
- **Total Documentation**: 8,000+ lines
- **Configuration Sections**: 10
- **Common Operations**: 60+ examples
- **Real-World Scenarios**: 30+ examples
- **Best Practices**: 70+ tips
- **CLI Commands**: 100+ examples

---

## 🔗 Related Resources

- [Treasure Data Documentation](https://docs.treasuredata.com/)
- [tdx CLI Reference](https://tdx.treasuredata.com/)
- [Semantic Layer Sync Tool](../README.md)
- [Auto-Generation Guide](../AUTO_GENERATION_GUIDE.md)

---

**Status**: ✅ Complete Skill Ecosystem
**Last Updated**: 2026-02-16
**Version**: 2.0.0
