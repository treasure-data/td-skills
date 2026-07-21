---
name: cas
description: Manages Composable Audience Studio (CAS) zero-copy audiences using `tdx cas` commands — audiences that query customer Cloud Data Warehouses (Snowflake, Databricks, BigQuery) directly instead of copying data into Treasure Data. Covers audience/attribute/behavior YAML, the composable segment rule DSL (distinct from standard `tdx sg` rules), connection resolution per CDW platform, and push safety (idempotent create/update, drift detection, `--delete`). Use when creating or updating composable parent segments, composable child segments, or composable activations, or when a task mentions zero-copy, Snowflake/Databricks/BigQuery audiences, or Composable Audience Studio.
owner: william.gonzalez@treasure.ai
tier: 1
classification: product
phase: 1
last-validated: 2026-07-21
validation-model: claude-sonnet-5
known-limitations: |
  A push target can only contain one composable audience YAML file — every segment/activation
  file in the target attaches to that one audience. Activation `connector_config` fields are
  connector-specific and not validated by `tdx cas validate`/`push` ahead of the API call; always
  run `tdx connection schema <type>` first (see the connector-config skill) rather than guessing
  field names. Snowflake schema/table name matching is case-sensitive; a lowercase `schema`/`table`
  pulled from an older audience may not match the CDW's actual (often uppercase) names.
---

# tdx CAS - Composable Audience Studio Management

**Composable audiences never copy data into Treasure Data** — they query the customer's own Snowflake/Databricks/BigQuery directly. This is the main reason CAS YAML differs from standard `tdx ps`/`tdx sg` YAML: every table reference needs a `connection`, and child segment rules use a different condition shape.

## Pushing composable audiences safely — read this first

All CAS writes go through the typed `tdx cas` commands. **Never** create or update a composable audience/segment/activation with raw `tdx api` HTTP calls — the request shapes below have real footguns that the typed command handles for you.

- **Audience updates are a full replace of `attributes`/`behaviors`, not a merge.** If you push a YAML that's missing an attribute/behavior the server currently has, `tdx cas push` **refuses before writing anything** and names exactly what would be removed. This is intentional — it is not a bug to work around. Either update the local YAML to include the missing field (pull first if it might be stale: `tdx cas pull`), or, if removing it is genuinely intended, re-run with `--delete`. Never assume `--delete` is safe to add reflexively just to make the refusal go away — confirm with the user first if you didn't write the YAML yourself.
- **Repeat pushes are idempotent by name.** Pushing the same audience/segment/activation name again updates the existing one — it does not create a duplicate. There's no need to check existence yourself before pushing.
- **No confirmation prompt on drift or errors.** Both the drift refusal above and any other push failure exit non-zero with a specific message (never a generic "push failed"). Read the message — it names the exact field/attribute/behavior involved.
- If a typed command seems not to exist for what you need, ask the user — do not fall back to raw `tdx api`.

## Core Commands

```bash
tdx cas list                              # List composable audiences
tdx cas desc <name>                       # Describe a composable audience
tdx cas pull <name> [--dir <dir>]         # Pull audience + segments to YAML
tdx cas validate <file_or_dir>            # Validate YAML locally (no API calls)
tdx cas push <file_or_dir>                # Preview, confirm, then push
tdx cas push <file_or_dir> --dry-run      # Preview only, no writes
tdx cas push <file_or_dir> -y             # Skip confirmation (CI/CD)
tdx cas push <file_or_dir> --delete       # Also apply a detected attribute/behavior removal
tdx cas preview <segment_name> --audience <name>  # Preview a segment query on the CDW
```

`tdx cas push` always previews first (dry-run pass showing create/update counts and any drift), prompts for confirmation on a real write unless `-y`, and refuses outright in non-interactive mode without `-y`.

## Audience YAML

```yaml
name: Customer360 Snowflake
description: Customer data from Snowflake
timezone: UTC
master:
  connection: '<federated_query_config_id>'   # Snowflake: raw zero-copy config ID, not a connector name
  schema: PUBLIC
  table: CUSTOMERS
  key_column: CDP_CUSTOMER_ID
attributes:
  - name: email
    connection: '<federated_query_config_id>'
    schema: PUBLIC
    table: CUSTOMERS
    join:
      table_key: CDP_CUSTOMER_ID
      master_key: CDP_CUSTOMER_ID
    column: EMAIL
    type: string          # Must match the real CDW column type — see Connection resolution below
behaviors:
  - name: purchases
    connection: '<federated_query_config_id>'
    schema: PUBLIC
    table: PURCHASE_HISTORY
    join:
      table_key: CDP_CUSTOMER_ID
      master_key: CDP_CUSTOMER_ID
    time_column: TIMESTAMP
    columns:                # required: this OR `all_columns: true`
      - name: amount
        type: number
        column: AMOUNT
```

**Attribute/behavior `type` must match the real CDW column type** (`string`, `number`, `timestamp`, `string_array`, `number_array`) — a string-typed attribute over a numeric CDW column is rejected by the API (400) even though it's syntactically valid YAML. If unsure, pull an existing audience over the same table and copy its types.

## Connection resolution — differs by CDW platform

The `connection:` field is a single generic value in the YAML, but what it means depends on the platform:

- **Snowflake**: a federated query config (zero-copy config) **ID**, e.g. `'204'` — never a connector name. This resource is never listed by `tdx connections`, so there's no name to look up; `tdx cas pull` on an existing Snowflake audience shows the exact ID in use. Passing a value that happens to match a registered connector name on a Snowflake field is always a mistake — `tdx cas validate`/`push` catch this and fail fast rather than silently misrouting the ID.
- **Databricks/BigQuery**: a connector name or ID from `tdx connections`, plus a required `catalog:` field alongside `connection:` in the same block (master, or per-attribute/behavior).

## Child segment YAML — different rule DSL from `tdx sg`

Composable segment conditions use `leftValue`/`rightValue`/`operator` — **not** the `attribute`/`operator: {type, value}` shape standard `tdx sg` segments use. Get this wrong and the API returns a 400 naming exactly which field is missing/invalid.

```yaml
type: composable_segment
name: High Value Customers
folder: Marketing/VIP        # optional — created automatically if it doesn't exist yet
rule:
  type: And
  conditions:
    - type: Value
      exclude: false
      leftValue:
        name: cdp_customer_id      # the attribute name, nested under leftValue
      operator:
        type: Equal                # Equal and other comparison types available
        not: false
        rightValue: "some-value"   # the comparison value, as a string
activations:
  - name: Export to Marketing
    connection: salesforce-connection
    all_columns: true               # or `columns:` — one of the two is required
    schedule:
      type: daily                   # none | daily | weekly | monthly
      timezone: UTC
```

**Unlike standard `tdx sg` rules, nested `And`/`Or` condition groups ARE supported** here (composable segments don't have the nested-group restriction `validate-segment` documents for standard segments).

For `activations[].connector_config` fields, **don't guess the field names** — run `tdx connection schema <connector_type>` first (see the **connector-config** skill) to discover them for the specific connector.

## Legacy endpoint toggle

`tdx cas` requests go to the current default CAS backend host. If a composable audience only exists on the older, standalone legacy host (rare — most accounts are fully migrated), set `TDX_CAS_LEGACY_ENDPOINT=1` before running the command. The two hosts do **not** share data — an audience visible on one is invisible on the other, so only toggle this if `tdx cas list` genuinely doesn't show an audience you expect to find.

## Common Issues

| Issue | Solution |
|-------|----------|
| Push refuses with "would remove attribute(s)/behavior(s) ..." | Intentional drift protection — see "Pushing composable audiences safely" above. Update the YAML or use `--delete` deliberately. |
| `CONNECTION_NOT_FOUND` | Check the `connection:` value against `tdx connections` (Databricks/BigQuery) or re-pull the audience to confirm the Snowflake zero-copy config ID (Snowflake). |
| 400 with a Snowflake connection that matches a connector name | You used a connector name where a zero-copy config ID is required — pull an existing Snowflake audience to see the correct ID format. |
| 400 naming a `type` mismatch on an attribute/behavior column | The YAML `type:` doesn't match the real CDW column type — check the source table's actual column type. |
| `catalog is required` | Databricks/BigQuery connections need `catalog:` set alongside `connection:` in the same block. |
| Segment rule 400 naming `leftValue`/`rightValue`/`operator` | Composable segment rules use a different shape than standard `tdx sg` — see "Child segment YAML" above, don't reuse a standard segment's rule YAML as-is. |
| Non-interactive mode error | Add `-y`: `tdx cas push -y <path>` |
| An audience you expect isn't in `tdx cas list` | It may only exist on the other host — try again with `TDX_CAS_LEGACY_ENDPOINT=1`. |

## Related Skills

- **connector-config** - Discover `connector_config` fields per connector type for activations
- **segment** - Standard (non-composable) child segment management — note the different rule DSL
- **parent-segment** - Standard (non-composable) parent segment management

## Resources

- https://tdx.treasuredata.com/commands/cas.html
