---
name: composable-setup
description: End-to-end setup guide for Composable Audience Studio (CAS) with Snowflake Zero-Copy integration. Covers feature flag enablement, Snowflake key pair auth, Zero-Copy configuration, parent segment JSON creation via CAS API, and accessing the CAS UI. Use when setting up CAS from scratch, configuring Zero-Copy Snowflake connections, or uploading composable parent segment configurations.
---

# Composable Audience Studio - End-to-End Setup

## Overview

Composable Audience Studio (CAS) lets you build audience segments directly on Snowflake data via Zero-Copy — no ETL into Treasure Data required.

**Setup flow:** Feature flags → Snowflake prep → Key pair auth → Zero-Copy config → Parent segment JSON → CAS API upload → CAS UI

---

## Step 1: Enable Feature Flags

Request via CS ticket to enable all three flags for the account:

| Flag | Purpose |
|------|---------|
| `eng-lc-composable-audience-studio` | Enables CAS |
| `zero-copy-ui` | Enables Zero-Copy UI in Data Workbench |
| `zero-copy-snowflake` | Enables Snowflake integration |

---

## Step 2: Prepare Snowflake Tables

Your Snowflake pipeline should follow: **Sources → STG → GOLDEN → PS Tables**

PS Tables must include:
- **Master table**: Central customer table with a unique key (e.g., `cdp_customer_id`)
- **Attribute tables**: Customer property tables (can reuse master table)
- **Behavior tables**: Event/activity tables with a `time` column

---

## Step 3: Generate Key Pair for Snowflake Auth

```bash
# Generate private key (PKCS#8 format required)
openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out rsa_key.p8 -nocrypt

# Generate public key
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
```

Assign public key to Snowflake user:

```sql
ALTER USER <username> SET RSA_PUBLIC_KEY='<public_key_string>';
```

Keep `rsa_key.p8` — needed for Zero-Copy config.

---

## Step 4: Configure Zero-Copy in Data Workbench

Navigate to **Data Workbench → Integrations → Integration Hub → Zero-Copy → Snowflake**

Required fields:
| Field | Value |
|-------|-------|
| Account | Snowflake account identifier |
| Warehouse | Snowflake warehouse name |
| Database | Database containing PS tables |
| Schema | Default schema |
| User | Snowflake user with permissions |
| Authentication | Key Pair (paste `rsa_key.p8` content) |
| Role | Snowflake role (optional) |

After saving, note the `federatedQueryConfigId` — used in every parent segment config.

---

## Step 5: Create Parent Segment JSON

```json
{
  "name": "Retail Composable Audience",
  "description": "Composable audience from Snowflake CDW",
  "timezone": "UTC",
  "kind": "composable",
  "isComposable": true,
  "master": {
    "name": "customers",
    "federatedQueryConfigId": "167",
    "schema": "public",
    "table": "customers",
    "keyColumn": "cdp_customer_id"
  },
  "attributes": [
    {
      "id": "1",
      "name": "email",
      "federatedQueryConfigId": "167",
      "schema": "public",
      "table": "customers",
      "tableKey": "cdp_customer_id",
      "masterKey": "cdp_customer_id",
      "column": "email",
      "type": "string",
      "createdAt": "2025-11-21T06:05:04.037Z",
      "updatedAt": "2025-11-21T06:05:04.037Z"
    }
  ],
  "behaviors": [
    {
      "id": "1",
      "name": "behavior_pageviews",
      "federatedQueryConfigId": "167",
      "schema": "public",
      "table": "behavior_pageviews",
      "tableKey": "cdp_customer_id",
      "masterKey": "cdp_customer_id",
      "timeColumn": "time",
      "createdAt": "2025-11-21T06:05:04.056Z",
      "updatedAt": "2025-11-21T06:05:04.056Z",
      "columnMapping": [
        {
          "name": "td_url",
          "type": "string",
          "cdwColumn": "td_url"
        }
      ]
    }
  ]
}
```

**Key fields:**

| Field | Notes |
|-------|-------|
| `federatedQueryConfigId` | ID from Step 4 — same value for all entries |
| `keyColumn` | Primary key on master table |
| `tableKey` | Foreign key on attribute/behavior table |
| `masterKey` | Primary key on master table (for join) |
| `type` | `string`, `number`, `boolean`, or `date` |
| `timeColumn` | Required for behavior tables only |
| `columnMapping` | Additional columns to expose from behavior table |

> **Current limitation**: Behaviors are configurable but not yet usable in segment builder rule conditions.

---

## Step 6: Upload via CAS API

```bash
curl -X POST https://api-cas.us01.treasuredata.com/composable_audiences \
  -H "Authorization: TD1 <your_api_key>" \
  -H "Content-Type: application/json" \
  -d @parent_segment_config.json
```

The response includes the assigned parent segment ID — save it for reference.

**Region endpoints:**
- US: `https://api-cas.us01.treasuredata.com`
- EU: `https://api-cas.eu01.treasuredata.com`
- JP: `https://api-cas.jp01.treasuredata.com`

---

## Step 7: Access Composable Audience Studio

Navigate to your TD console → Composable Audience Studio.

> **Current limitation**: Use the preview URL to access CAS:
> `https://console-next.us01.treasuredata.com/app/assets/releases/CAS-34/index.html#/ps/<ps_id>/e/<env_id>/f/<folder_id>`

Your parent segment will appear with a **Composable** tag. You can:
- Browse available attributes
- Create audience segments via the visual builder
- Preview segment counts
- Activate segments to destinations

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Zero-Copy connection fails | Verify private key is PKCS#8 format; check Snowflake role has SELECT on database/schema |
| Parent segment upload fails | Validate JSON format; confirm `federatedQueryConfigId` matches; verify all tables/columns exist |
| CAS UI not visible | Confirm all 3 feature flags are enabled; use preview URL |
| Segment counts show 0 | Check join keys (`masterKey` ↔ `tableKey`) match; verify master table has data |

---

## Related Skills

- **parent-segment** - Standard (non-composable) parent segment management via `tdx ps`
- **segment** - Child segment creation using CAS parent segments
- **connector-config** - Configure activations for segment exports
