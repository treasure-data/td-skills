# Schema Auto-Tagger - Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER/TRIGGER                                         │
│  - Manual invocation                                                        │
│  - Scheduled workflow (daily 2 AM UTC)                                      │
│  - Data import/load trigger                                                │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCHEMA SCANNING LAYER                                    │
│  schema_auto_tagger_implementation.py::SchemaTagger                         │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Database Connection                                              │  │
│  │    └─> tdx CLI: list tables                                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 2. Schema Discovery                                                 │  │
│  │    └─> tdx show schema: get columns & metadata                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 3. Change Detection                                                 │  │
│  │    └─> Compare with baseline → new tables/columns                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────────────────────────────────┘
                 │
                 ▼ (Database Schema Data)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ANALYSIS & SUGGESTION LAYER                              │
│  schema_auto_tagger_implementation.py::SchemaTagger.analyze_column()        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Column Metadata Analysis                                             │  │
│  │ ├─ Column name patterns                                              │  │
│  │ ├─ Data type inference                                               │  │
│  │ ├─ Description/comments                                              │  │
│  │ └─ Sample value detection                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Pattern Matching (50+ built-in patterns)                             │  │
│  │ ├─ PII Detection     (email, phone, SSN, credit card, etc.)          │  │
│  │ ├─ Financial         (amount, salary, revenue, balance)             │  │
│  │ ├─ Timestamp         (created_at, updated_at, timestamp)            │  │
│  │ ├─ Business Domain   (customer, product, order, marketing)          │  │
│  │ └─ Compliance        (GDPR, CCPA, HIPAA, SOX, PCI-DSS)             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Confidence Scoring                                                   │  │
│  │ ├─ HIGH (90%+ confidence)    → Auto-approve                          │  │
│  │ ├─ MEDIUM (70% confidence)   → Human review                          │  │
│  │ └─ LOW (50% confidence)      → Investigation                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────────────────────────────────┘
                 │
                 ▼ (Tag Suggestions with Confidence Scores)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REPORTING & REVIEW LAYER                                 │
│  schema_auto_tagger_implementation.py::SchemaTagger.generate_report()       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Human-Readable Report                                                │  │
│  │ ├─ Suggestion Summary (HIGH/MEDIUM/LOW)                              │  │
│  │ ├─ Per-Column Breakdown                                              │  │
│  │ ├─ Confidence Scores                                                 │  │
│  │ └─ Reasoning & Context                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ JSON Export (for programmatic processing)                            │  │
│  │ └─ Structured suggestions for automation                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────────────────────────────────┘
                 │
                 ├─→ HUMAN REVIEW (Optional)
                 │   └─> Approve/Reject/Modify
                 │
                 ▼ (Approved Tag Assignments)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TAG APPLICATION LAYER                                    │
│  schema_tagger_td_api.py::TreasureDataTagAPI                               │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Tag Validation                                                       │  │
│  │ ├─ Check tag format                                                  │  │
│  │ ├─ Verify tags exist in system                                       │  │
│  │ └─ Create missing tags                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Bulk Application (with retry logic)                                  │  │
│  │ ├─ API call per tag: tdx tag set db.table column tag                 │  │
│  │ ├─ Exponential backoff on failure                                    │  │
│  │ ├─ Success/failure tracking                                          │  │
│  │ └─ Audit logging                                                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────────────────────────────────┘
                 │
                 ▼ (Execution Log)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION & AUDIT LAYER                               │
│  send_notification.py                                                      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Slack Notification                                                   │  │
│  │ ├─ Status emoji (✅ / ⚠️ / ❌)                                       │  │
│  │ ├─ Summary statistics                                                │  │
│  │ ├─ Success/failure counts                                            │  │
│  │ └─ Failed tag details (if any)                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Email Report (optional)                                              │  │
│  │ └─ Detailed execution log                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Audit Log Storage                                                    │  │
│  │ └─> TD table: audit_logs.schema_tagger_YYYY_MM_DD                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│  Treasure    │
│  Data        │
│  Database    │
└──────┬───────┘
       │ (tdx CLI)
       ▼
┌─────────────────────────────────┐
│ Scan Database                   │
│ └─ Get all tables & columns    │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Compare with Baseline            │
│ └─ Detect new/modified schemas  │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Apply Tagging Rules              │
│ └─ 50+ pattern matching          │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐       ┌─────────────────┐
│ Generate Suggestions             │──────→│ Human Review    │
│ ├─ HIGH confidence (auto)        │       │ ├─ Approve     │
│ ├─ MEDIUM confidence (review)    │       │ ├─ Reject      │
│ └─ LOW confidence (investigate)  │       │ └─ Modify      │
└──────────┬──────────────────────┘       └────────┬────────┘
           │                                        │
           │ HIGH confidence tags ←────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Apply Tags via API               │
│ ├─ Validate tags                │
│ ├─ Create missing tags          │
│ └─ Apply to columns             │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Audit & Notify                   │
│ ├─ Store execution log          │
│ ├─ Send Slack notification      │
│ └─ Send email report            │
└─────────────────────────────────┘
```

## Workflow Execution Timeline

```
Daily Workflow (auto_schema_tagger.dig)
Run at: 2 AM UTC

Time    Task                          Duration   Output
────    ──────────────────────────    ────────   ──────────────────
2:00    +setup                        1s         Log message
2:01    +scan_schema                  30-60s     schema_scan.json
2:02    +generate_suggestions         30s        suggestions.json
2:03    +validate_suggestions         10s        validation_report.json
2:04    +approve_high_confidence      5s         approved_tags.json
2:05    +apply_tags                   60-120s    apply_tags_log.json
2:07    +send_notification            5s         Slack/Email sent
2:08    +store_audit_log              5s         Audit table updated
2:09    +cleanup                      1s         Temp files removed
────────────────────────────────────────────────────────────────
Total:  2-4 minutes for typical database
```

## Integration Points

```
┌─────────────────────────────────────────────┐
│    Treasure Data Platform                   │
│  ┌─────────────────────────────────────────┐│
│  │ Schema Auto-Tagger                      ││
│  │ ┌──────────────┐                        ││
│  │ │ Scan Database├─→ Detect Changes       ││
│  │ └──────────────┘                        ││
│  └────────────────────┬─────────────��────────┤
│                       │                      │
└───────────────────────┼──────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │  Slack   │  │  Email   │  │  Audit   │
    │  Notify  │  │  Report  │  │  Logging │
    └──────────┘  └──────────┘  └──────────┘
          │
          ▼
    ┌──────────────────────┐
    │ Optional Integrations│
    ├──────────────────────┤
    │ • Data Catalogs      │
    │   (Collibra, Alation)│
    │ • Access Control     │
    │   (Column-level SEC) │
    │ • Data Quality       │
    │   (Rule Engine)      │
    │ • Lineage Tracking   │
    └──────────────────────┘
```

## Rule Matching Priority

```
1. Pattern Rules (Highest Priority)
   ├─ Column name exact patterns
   ├─ Data type + name combinations
   └─ Sample value analysis

2. Table Rules
   ├─ Table name patterns
   └─ Database patterns

3. Custom Organization Rules
   ├─ Domain-specific patterns
   ├─ Compliance requirements
   └─ Internal standards

4. Compliance Rules (Lowest Priority)
   ├─ Industry-specific (Healthcare, Finance)
   ├─ Regulatory mappings
   └─ Default standards
```

## Confidence Scoring Algorithm

```
For each column:

1. Pattern Matching Score
   Score = (matches found / total patterns) * 100

2. Data Type Alignment Score
   Score = (type matches pattern) ? 20 : 0

3. Context Score
   Score = (exists in domain knowledge base) ? 15 : 0

4. Uniqueness Score
   Score = (unique pattern match) ? 10 : 0

CONFIDENCE =
  if Total_Score >= 80%  → HIGH
  if Total_Score >= 60%  → MEDIUM
  if Total_Score >= 40%  → LOW
  else                   → SKIP
```

## Error Handling & Retry Logic

```
Apply Tag to Column:

try:
  │
  ├─→ API Call
  │   ├─ Success (200/201) → Log & Continue
  │   ├─ Tag Not Found (404)
  │   │   └─→ Create Tag → Retry Apply
  │   ├─ Server Error (5xx)
  │   │   └─→ Exponential Backoff (max 3 retries)
  │   └─ Client Error (4xx, non-404)
  │       └─→ Log Error & Skip
  │
  └─→ Network/Connection Error
      └─→ Exponential Backoff (max 3 retries)

Total: Up to 6 retries with 2s, 4s, 8s waits
```

## Performance Characteristics

```
Database Size    Scan Time    Suggestion Time    Apply Time    Total
─────────────    ─────────    ──────────────    ──────────    ─────
100 columns      5-10s        5s                 5s            20s
500 columns      15-20s       10s                10s           40s
1,000 columns    30-45s       20s                20s           80s
5,000 columns    2-3 min      40s                60s           4 min
10,000 columns   4-5 min      80s                2 min         7 min

Linear scaling: ~0.3-0.5 ms per column
```

---

This architecture ensures scalability, reliability, and maintainability for enterprise-grade schema tagging.
