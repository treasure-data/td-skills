# TD Data Dictionary Builder

A CLI tool and Claude Code skill that automatically generates and maintains data dictionaries for Treasure Data Parent Segments. It extracts schema via TDX CLI, uses AI to generate human-readable column descriptions, provides a CSV review workflow, and writes approved descriptions back to TD as column metadata.

## Why This Matters

**Problem:** TD Parent Segment columns often lack meaningful descriptions, making it difficult for:
- Business users to understand what data is available
- AI agents (like Audience Agent) to correctly interpret schemas without hallucinating column meanings
- New team members to onboard onto complex data models

**Solution:** This tool automates the creation of semantic, business-friendly column descriptions that are:
- Clear for humans (marketing analysts can understand without asking engineering)
- Unambiguous for AI agents (reduces hallucination in downstream tools)
- Reviewable before write-back (CSV export for human editing)
- Versioned with rollback capability (before/after snapshots)

## Features

- **Schema Extraction**: Pull complete schema from Parent Segments via TDX CLI (master, attribute, behavior tables)
- **AI Description Generation**: Generate semantic descriptions using Claude with business context
- **PII Detection**: Automatically flag and redact potential PII in sample data
- **CSV Review Workflow**: Export to CSV for human review/edit in Excel or Google Sheets
- **Validation**: Validate edited CSV before write-back with detailed error reporting
- **Write-Back**: Push approved descriptions to TD via API with version tracking
- **Rollback**: Restore previous descriptions if write-back produces unexpected results
- **Claude Code Skill**: Invoke complete workflow via natural language in Claude Code

## Installation

### Prerequisites

- Node.js 20.0.0 or higher
- TDX CLI installed and authenticated (`npm install -g @treasuredata/tdx`)
- TD API access (for write-back)

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/td-data-dictionary.git
cd td-data-dictionary

# Install dependencies
npm install

# Verify TDX is authenticated
tdx auth status
```

## Usage

### CLI Commands

```bash
# List available Parent Segments
node src/index.js list

# Extract schema from a segment (with optional sample data)
node src/index.js extract "My Segment Name" --sample

# Generate AI descriptions
node src/index.js generate "My Segment Name"

# Export to CSV for review
node src/index.js review "My Segment Name"

# Validate edited CSV
node src/index.js validate "My Segment Name"

# Preview write-back (dry run)
node src/index.js writeback "My Segment Name" --dry-run

# Write descriptions to TD
node src/index.js writeback "My Segment Name"

# Rollback to previous descriptions
node src/index.js rollback "My Segment Name"
```

### Claude Code Skill

When installed as a Claude Code skill, invoke with natural language:

```
Create a data dictionary for segment "Customer 360"
```

The skill guides you through the complete workflow: context gathering → schema extraction → description generation → review → write-back.

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    TD Parent Segment                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (TDX CLI)
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: Extract Schema                                     │
│  - Master table columns (name, type, nullable)               │
│  - Attribute table columns                                   │
│  - Behavior table columns                                    │
│  - Optional: Sample data (50 rows, PII redacted)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ ./schemas/{segment}.json
┌─────────────────────────────────────────────────────────────┐
│  Stage 2: Gather Business Context                            │
│  - Industry (e-commerce, SaaS, healthcare, etc.)            │
│  - Company type                                              │
│  - Segment purpose                                           │
│  - Primary use cases                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 3: Generate Descriptions (Claude AI)                  │
│  - Semantic, business-friendly descriptions                  │
│  - Attribute vs behavior classification                      │
│  - Usage hints for non-obvious columns                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ ./descriptions/{segment}-descriptions.json
┌─────────────────────────────────────────────────────────────┐
│  Stage 4: Export for Review                                  │
│  - CSV export (Excel/Sheets compatible)                      │
│  - PII columns flagged                                       │
│  - Human can edit descriptions                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ ./reviews/{segment}.csv
┌─────────────────────────────────────────────────────────────┐
│  Stage 5: Validate                                           │
│  - Check CSV format and required fields                      │
│  - Ensure immutable fields unchanged (table, column, type)   │
│  - Collect all errors in single pass                         │
│  - Confirmation prompt before write-back                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Stage 6: Write-Back to TD                                   │
│  - Create before snapshot (for rollback)                     │
│  - Fetch current schema from TD                              │
│  - Merge descriptions (preserve existing columns)            │
│  - POST to /v3/table/update                                  │
│  - Create after snapshot (on success)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ ./snapshots/{segment}-{timestamp}.json
┌─────────────────────────────────────────────────────────────┐
│                    TD Tables Updated                         │
│            (descriptions visible in TD Console)              │
└─────────────────────────────────────────────────────────────┘
```

## Output Artifacts

| Stage | Artifact | Location |
|-------|----------|----------|
| Extract | Schema JSON | `./schemas/{segment}.json` |
| Generate | Descriptions JSON | `./descriptions/{segment}-descriptions.json` |
| Review | CSV for editing | `./reviews/{segment}.csv` |
| Write-back | Before snapshot | `./snapshots/{segment}-{timestamp}-before.json` |
| Write-back | After snapshot | `./snapshots/{segment}-{timestamp}-after.json` |
| Errors | Error log | `./reviews/{segment}-errors.csv` |

## Example Output

### Generated Description

```json
{
  "column_name": "cdp_customer_id",
  "description": "Unique identifier assigned by the CDP platform to track customers across all data sources. This is the primary key for joining customer data and should be used for identity resolution and cross-table lookups.",
  "classification": "attribute",
  "usage_hint": "Use for joining customer records across tables and deduplication."
}
```

### CSV Format

```csv
table,column,type,source,description,is_pii
master,cdp_customer_id,VARCHAR,cdp_audience_123,"Unique identifier assigned by CDP...",false
master,email,VARCHAR,cdp_audience_123,"Customer's primary email address...",true
master,first_name,VARCHAR,cdp_audience_123,"Customer's first name as provided...",false
```

## Architecture

```
src/
├── index.js                 # CLI entry point (Commander.js)
├── commands/
│   ├── list.js             # List Parent Segments
│   ├── extract.js          # Extract schema from TDX
│   ├── generate.js         # Generate descriptions with Claude
│   ├── review.js           # Export to CSV for review
│   ├── validate.js         # Validate edited CSV
│   ├── writeback.js        # Write to TD API
│   └── rollback.js         # Restore previous descriptions
├── lib/
│   ├── tdx-client.js       # TDX CLI wrapper
│   ├── td-api-client.js    # TD REST API client
│   ├── claude-client.js    # Claude API wrapper
│   ├── schema-validator.js # Schema validation
│   ├── pii-detector.js     # PII detection/redaction
│   ├── snapshot-manager.js # Version tracking
│   ├── storage.js          # File I/O utilities
│   └── ...
├── prompts/
│   ├── context-gatherer.js # Business context prompts
│   └── ...
├── export/
│   └── csv-exporter.js     # CSV export with encoding
├── import/
│   └── csv-importer.js     # CSV import with validation
└── validation/
    └── csv-validator.js    # CSV validation rules

skills/
└── data-dictionary.md      # Claude Code skill definition
```

## TD API Integration

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| TDX `ps list` | CLI | List Parent Segments |
| TDX `ps view {segment}` | CLI | Get segment structure |
| TDX `ps desc {segment}` | CLI | Get column schema |
| TDX `query` | CLI | Fetch sample data |
| `/v3/table/show/{db}/{table}` | GET | Current schema |
| `/v3/table/update/{db}/{table}` | POST | Update schema with descriptions |

### Schema Format

TD expects schema as array-of-arrays:
```json
[
  ["column_name", "column_type", "column_description"],
  ["cdp_customer_id", "varchar", "Unique identifier..."],
  ["email", "varchar", "Customer's primary email..."]
]
```

## Safety Features

- **Confirmation prompts**: Before any write operation
- **Dry-run mode**: Preview API payloads without executing
- **Before snapshots**: Created before ANY API calls
- **Rollback**: Restore previous descriptions instantly
- **PII redaction**: Sample data automatically redacted
- **Immutable field validation**: Can't accidentally change column types
- **Continue-on-error**: Batch mode completes all segments, reports failures

## Potential TDX Integration

This tool could be integrated into TDX as an official command:

```bash
# Proposed TDX integration
tdx data-dictionary create "My Segment"
tdx data-dictionary review "My Segment"
tdx data-dictionary push "My Segment"
tdx data-dictionary rollback "My Segment"
```

### Integration Points

1. **TDX CLI**: Already uses TDX for schema extraction
2. **TD API**: Uses standard REST API for write-back
3. **Claude Code**: Skill file format compatible with Claude Code skills

### What TD Would Need to Adopt

1. Rewrite in TypeScript/Go to match TDX codebase
2. Integrate Claude API calls (or use TD's internal AI infrastructure)
3. Add to TDX command registry
4. Implement TD-style authentication handling
5. Add telemetry/logging per TD standards

## License

ISC

## Author

Built as a proof-of-concept for Treasure Data Parent Segment documentation automation.

---

*This tool was built using Claude Code with the GSD workflow methodology.*
