<!--
PURPOSE OF THIS FILE
Schema facts for the tables the dashboard reads (SINK tables if a workflow ran, source tables
always), so the dashboard agent picks the right table, column and time field without re-exploring.
Business meaning belongs in business-context.md; formulas in metrics-catalog.md.

HOW TO USE
Skeleton — never filled in place, never installed. Written by the builder (Step 4) to
  agent_outputs/<project_slug>/data-dictionary.md
from discovery, the SINK tables (if any) and the columns the dashboard reads.
Every agent build copies the engagement file into the agent's references/. Fill every [bracketed]
field; delete sections that don't apply and this comment in the copy. Aggregates only — never raw
customer records or PII.
-->

# {{project_name}} — Data Dictionary

## SINK Database

**Database:** `[sink_db_name — or 'none (Non-Workflow path)']`  
**Created by:** [workflow_project_name]  
**Refresh schedule:** [daily/weekly — e.g., "Daily at 2 AM UTC"]  
**Source database:** `[source_db_name]`

---

## SINK Tables

### [fact_table_1] — [human label, e.g., "Booking KPIs"]

**Grain:** One row per [dimensions — e.g., "month × booking_type × destination"]  
**Row count (validated):** ~[N] rows  
**Use in dashboard:** [Tab/section — e.g., "Bookings tab, all charts"]

| Column | Type | Business Meaning | Notes |
|--------|------|-----------------|-------|
| [col_1] | VARCHAR | [Plain English definition] | [Exclusions/caveats — e.g., "Excludes Cancelled status"] |
| [col_2] | BIGINT | [Definition] | |
| [col_3] | DOUBLE | [Definition — e.g., "Total booking revenue in USD"] | [Source — e.g., "SUM(amount) from bookings table"] |
| [date_col] | VARCHAR | [Date format — e.g., "YYYY-MM, month boundary"] | [Range — e.g., "Jan 2024 – present"] |

### [fact_table_2] — [human label]

**Grain:** One row per [dimensions]  
**Row count (validated):** ~[N] rows  
**Use in dashboard:** [Tab/section]

| Column | Type | Business Meaning | Notes |
|--------|------|-----------------|-------|
| [col_1] | VARCHAR | [Definition] | |

---

## Source Tables (Fallback)

When SINK tables are unavailable, queries fall back to:

| SINK Table | Source Table | Key difference |
|---|---|---|
| `[sink_db].[fact_1]` | `[source_db].[raw_table]` | [What the SINK pre-aggregates that source doesn't — e.g., "SINK pre-groups by month; source is row-level"] |

---

## Source Tables

| Table | Grain | Event time column (timezone) | Used for |
|---|---|---|---|
| `[source_db].[table]` | [one row per …] | `[column]` ([timezone]) | [tabs / metrics] |

## Data Quality Notes
- [Data Quality Gate results that change how queries must be written — NULL handling, duplicates, fan-out, data that ends before today]
