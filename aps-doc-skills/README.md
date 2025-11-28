# APS Documentation Skills

Modular technical documentation generation for Treasure Data pipeline layers. Each skill is a specialized expert for a specific layer type with intelligent auto-detection and comprehensive documentation capabilities.

## Skills Overview

This plugin collection contains **7 specialized documentation skills**:

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **core** | Shared documentation framework | Custom documentation, understanding core patterns |
| **ingestion** | Ingestion layer expert | Document data source ingestion workflows |
| **staging** | Staging transformation expert | Document transformation and data quality layers |
| **hist-union** | Hist-union workflow expert | Document historical data combination |
| **id-unification** | ID unification expert | Document identity resolution and merging |
| **golden** | Golden layer expert | Document analytics-ready golden tables |
| **master-segment** | CDP master segment expert | Document CDP parent segment configurations |

**Total:** 7 focused, production-ready skills optimized for clarity and maintainability

---

## Why Modular Architecture?

### ✅ Key Benefits

| Aspect | Modular Approach | Benefit |
|--------|-----------------|---------|
| **Maintainability** | Focused, concise skills | Easy to update and modify |
| **Readability** | Read only what you need | Quick reference and learning |
| **Loading Speed** | Parse smaller files | Faster activation and response |
| **Specialization** | Expert per layer | Deep intelligence per domain |
| **Versioning** | Per-skill versions | Granular updates and rollback |
| **Testing** | Test independently | Isolated validation |

### 🎯 Follows Repository Best Practices

Consistent with other skill collections:
- **sql-skills**: 6 focused skills (trino, hive, optimizer, etc.)
- **workflow-skills**: 3 focused skills (digdag, management, dbt)
- **field-agent-skills**: 3 focused skills (deployment, docs, visualization)

**aps-doc-skills** follows the same proven modular pattern!

---

## Installation

### Install All Documentation Skills

```bash
# Install the complete collection
/plugin install aps-doc-skills@td-skills
```

This installs all 7 skills:
- aps-doc-core
- aps-doc-ingestion
- aps-doc-staging
- aps-doc-hist-union
- aps-doc-id-unification
- aps-doc-golden
- aps-doc-master-segment

### Install Specific Skills (Optional)

```bash
# Install only ingestion documentation skill
/plugin install aps-doc-skills:ingestion@td-skills

# Install only staging documentation skill
/plugin install aps-doc-skills:staging@td-skills
```

---

## Usage

### Automatic Skill Selection

Claude automatically selects the right skill based on your request:

```
"Document the Klaviyo ingestion workflow"
→ Uses: aps-doc-ingestion

"Document the staging transformation for customer events"
→ Uses: aps-doc-staging

"Document the ID unification layer"
→ Uses: aps-doc-id-unification

"Document the golden customer 360 table"
→ Uses: aps-doc-golden

"Document the master segment configuration for segment ID 1035571"
→ Uses: aps-doc-master-segment
```

### With Template Reference

```
"Document the Shopify ingestion following this template:
https://treasure-data.atlassian.net/wiki/spaces/.../pages/.../Template"
→ Fetches template, uses aps-doc-ingestion, generates matching documentation
```

### Multi-Layer Documentation

```
"Document the entire data pipeline:
1. Ingestion layer
2. Staging layer
3. ID Unification
4. Golden layer"
→ Uses all appropriate skills sequentially
```

---

## Skill Details

### 1. Core (`aps-doc-skills/core`)

**Purpose:** Shared documentation framework and patterns

**Contains:**
- Template-based generation workflow
- Quality validation framework (60+ checks)
- Documentation testing (6 test categories)
- Visual diagram generation (Mermaid)
- Confluence integration patterns
- Common troubleshooting

**When to use directly:**
- Creating custom documentation
- Understanding core principles
- Extending layer skills

### 2. Ingestion (`aps-doc-skills/ingestion`)

**Purpose:** Expert for ingestion layer documentation

**Auto-detects:**
- ✅ Connector types (REST API, Database, File, Streaming)
- ✅ Authentication patterns (OAuth, API Key, JWT, Basic)
- ✅ Rate limiting strategies (throttling, backoff)
- ✅ Incremental patterns (timestamp, sequence, cursor, full)

**Generates:**
- Connector configuration documentation
- Data source comparison matrices
- Incremental logic explanation
- Monitoring queries
- Security documentation (PII inventory)

**Use for:** Salesforce, HubSpot, MySQL, BigQuery, S3, Kafka ingestion

### 3. Staging (`aps-doc-skills/staging`)

**Purpose:** Expert for staging transformation documentation

**Auto-detects:**
- ✅ SQL engine (Presto/Trino vs Hive)
- ✅ Transformation rules (dates, strings, JSON, PII)
- ✅ Deduplication strategies (window functions)
- ✅ Data quality rules (validations, constraints)
- ✅ Performance optimizations (partition pruning)

**Generates:**
- Comprehensive transformation rule documentation
- PII handling details (hashing, masking)
- Deduplication logic explanation
- Complexity scoring
- Table-specific transformation rules

**Use for:** Data cleaning, standardization, quality layers

### 4. Hist-Union (`aps-doc-skills/hist-union`)

**Purpose:** Expert for hist-union workflow documentation

**Auto-detects:**
- ✅ Historical vs incremental table patterns
- ✅ Union strategies (UNION ALL, deduplication)
- ✅ Schema validation logic
- ✅ Time-based partitioning

**Generates:**
- Data combination logic documentation
- Schema validation documentation
- Backfill process guides
- Monitoring queries (coverage, overlaps)

**Use for:** Historical data combination, backfill workflows

### 5. ID Unification (`aps-doc-skills/id-unification`)

**Purpose:** Expert for ID unification documentation

**Auto-detects:**
- ✅ Identity resolution algorithms (deterministic, fuzzy, probabilistic)
- ✅ Merge strategies (first-seen, last-updated, priority)
- ✅ Match rules and keys
- ✅ Multi-workflow patterns (prep, unification, enrichment)

**Generates:**
- Identity resolution logic documentation
- Entity graph visualizations
- Merge strategy documentation
- Configuration examples (unify.yml)
- Monitoring queries (merge stats, match quality)

**Use for:** Customer 360, identity resolution, entity merging

### 6. Golden (`aps-doc-skills/golden`)

**Purpose:** Expert for golden layer documentation

**Auto-detects:**
- ✅ SCD types (Type 0/1/2/3/4)
- ✅ Business rules (calculations, classifications)
- ✅ Aggregation logic (time-based, customer-level)
- ✅ Data quality scoring (completeness, accuracy)

**Generates:**
- SCD implementation documentation
- Business rule documentation
- Metric definition documentation
- Data quality metrics
- Source lineage tracking

**Use for:** Customer master, product catalog, analytics-ready tables

### 7. Master Segment (`aps-doc-skills/master-segment`)

**Purpose:** Expert for CDP Master Segment (Parent Segment) documentation

**Auto-detects:**
- ✅ Star schema relationships (master, attributes, behaviors)
- ✅ Attribute categorization (identity, transactions, engagement, preferences)
- ✅ Behavior table patterns (events, pageviews, campaigns)
- ✅ Privacy controls (hash columns, consent tracking)

**Generates:**
- Star schema documentation with ASCII diagrams
- Complete attribute catalog grouped by category
- Behavior table schemas with business applications
- Segmentation use cases and recommendations
- Privacy and compliance documentation

**Use for:** CDP parent segments, customer 360 configurations, audience databases

**Requires:** TD MCP server (preferred) OR tdx CLI access to query CDP database schemas

---

## Features

### Layer-Specific Intelligence

Each skill has deep layer-specific knowledge:

**Ingestion:**
- 4 connector type patterns
- 4 authentication methods
- 4 incremental strategies

**Staging:**
- 7 transformation rule types
- 4 PII handling patterns
- 3 deduplication strategies

**ID Unification:**
- 3 matching algorithms
- 3 merge strategies
- 4 workflow patterns

**Golden:**
- 5 SCD types
- Multiple business rule patterns
- Aggregation strategies

### Quality Validation

All skills use the core 60+ quality checks:
- ✅ Content accuracy (file paths, tables, columns)
- ✅ Functional validation (SQL execution, config validation)
- ✅ Structure & formatting (headings, syntax, diagrams)
- ✅ Completeness (all sections, examples, troubleshooting)
- ✅ Layer-specific validation
- ✅ Metadata validation (schemas, lineage)

### Visual Diagrams

Auto-generated Mermaid diagrams:
- 📊 Data flow diagrams
- 🔄 Workflow execution graphs
- 🔗 Entity relationship diagrams
- 🌳 Dependency trees

### Documentation Testing

6 test categories before publishing:
1. Code examples validation (SQL execution)
2. Configuration validation (YAML syntax)
3. Link validation (Confluence pages)
4. Diagram rendering (Mermaid syntax)
5. Accuracy verification (tables, columns exist)
6. Completeness check (all sections present)

---

## Examples

### Example 1: Ingestion Documentation

**Request:**
```
Document the Klaviyo ingestion workflow following the Google BigQuery template
```

**Process:**
1. aps-doc-ingestion activates
2. Fetches Google BigQuery template
3. Analyzes Klaviyo ingestion codebase
4. Auto-detects: REST API, OAuth 2.0, timestamp-based incremental
5. Generates comprehensive documentation
6. Validates with 60+ quality checks
7. Publishes to Confluence

**Result:** Production-ready documentation in 4-6 hours vs manual

### Example 2: Staging Documentation

**Request:**
```
Document staging transformation for customer events with PII handling
```

**Process:**
1. aps-doc-staging activates
2. Analyzes staging SQL files
3. Auto-detects: Presto engine, email/phone hashing, ROW_NUMBER dedup
4. Extracts all transformation rules
5. Documents PII protection methods
6. Generates complexity scoring
7. Publishes with monitoring queries

**Result:** Comprehensive transformation documentation in 6-8 hours vs manual

### Example 3: Complete Pipeline

**Request:**
```
Document the entire data pipeline for this client
```

**Process:**
1. Uses multiple skills sequentially:
   - aps-doc-ingestion for data sources
   - aps-doc-staging for transformations
   - aps-doc-id-unification for identity resolution
   - aps-doc-golden for final tables
2. Creates parent + child page hierarchy
3. Links all documentation together
4. Validates cross-references

**Result:** Complete pipeline documentation in 2-3 days vs 2 weeks manual

---

## File Structure

```
aps-doc-skills/
├── README.md                          # This file
├── core/
│   └── SKILL.md                       # Shared framework
├── ingestion/
│   └── SKILL.md                       # Ingestion expert
├── staging/
│   └── SKILL.md                       # Staging expert
├── hist-union/
│   └── SKILL.md                       # Hist-union expert
├── id-unification/
│   └── SKILL.md                       # ID unification expert
├── golden/
│   └── SKILL.md                       # Golden layer expert
└── master-segment/
    └── SKILL.md                       # Master segment expert
```

---

## Best Practices

1. **Let Claude choose** - Auto-detection selects the right skill
2. **Provide templates** - Reference existing Confluence pages for consistency
3. **Be specific** - "Document Klaviyo ingestion" vs "document everything"
4. **Provide codebase path** - Essential for extracting real data

---

## Summary

**aps-doc-skills** provides 7 specialized documentation skills for Treasure Data pipeline layers and CDP:

- ✅ **Template-based generation** - Follows proven documentation structures
- ✅ **Codebase-driven** - Extracts real data from actual code and TD databases
- ✅ **Layer-specific intelligence** - Deep auto-detection per layer
- ✅ **60+ quality checks** - Comprehensive validation framework
- ✅ **Visual diagrams** - Mermaid and ASCII auto-generation
- ✅ **Confluence integration** - Parent/child page hierarchy
- ✅ **TD MCP integration** - Direct database schema extraction for CDP segments

**Result:** Production-ready technical documentation with real code examples, working SQL, and comprehensive coverage.
