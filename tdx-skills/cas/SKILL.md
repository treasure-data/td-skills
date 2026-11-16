---
name: cas
description: Manages Composable Audience Studio (CAS) zero-copy audiences using `tdx cas` commands — audiences that query customer Cloud Data Warehouses (Snowflake, Databricks, BigQuery) directly instead of copying data into Treasure Data. Covers audience/attribute/behavior YAML, the composable segment rule DSL (distinct from standard `tdx sg` rules), connection resolution per CDW platform, push safety (idempotent create/update, drift detection, `--delete` for both audience attribute/behavior drift and single-named-target child segment deletion), and composable journeys (`tdx cas journey list/view/pull/push` — composable constraints like account enablement, one version per journey, and no custom entry criteria after stage 1). Use when creating, updating, or deleting composable parent segments, composable child segments, or composable activations, managing journeys on a composable audience, or when a task mentions zero-copy, Snowflake/Databricks/BigQuery audiences, or Composable Audience Studio.
owner: william.gonzalez@treasure.ai
tier: 1
classification: product
phase: 1
last-validated: 2026-08-26
validation-model: claude-sonnet-5
known-limitations: |
  A push target can only contain one composable audience YAML file — every segment/activation
  file in the target attaches to that one audience. Activation `connector_config` fields are
  connector-specific and not validated by `tdx cas validate`/`push` ahead of the API call; always
  run `tdx connection schema <type>` first (see the connector-config skill) rather than guessing
  field names. Snowflake schema/table name matching is case-sensitive; a lowercase `schema`/`table`
  pulled from an older audience may not match the CDW's actual (often uppercase) names. Composable
  segment YAML now gets structural validation ahead of push (a missing/malformed `rule:` is
  caught client-side with a clear error) plus a `leftValue.name` check against the parent
  audience's real attribute/behavior names — but only condition/operator shapes `tdx` recognizes
  are checked; unrecognized condition types pass through unvalidated by design, so a malformed
  unrecognized shape can still reach the backend as a raw error. `type: composable_segment` must
  be present verbatim or the file is validated against the wrong (audience) schema entirely.
---

# tdx CAS - Composable Audience Studio Management

**Composable audiences never copy data into Treasure Data** — they query the customer's own Snowflake/Databricks/BigQuery directly. This is the main reason CAS YAML differs from standard `tdx ps`/`tdx sg` YAML: every table reference needs a `connection`, and child segment rules use a different condition shape.

## Pushing composable audiences safely — read this first

All CAS writes go through the typed `tdx cas` commands. **Never** create or update a composable audience/segment/activation with raw `tdx api` HTTP calls — the request shapes below have real footguns that the typed command handles for you.

- **Audience updates are a full replace of `attributes`/`behaviors`, not a merge.** If you push a YAML that's missing an attribute/behavior the server currently has, `tdx cas push` **refuses before writing anything** and names exactly what would be removed. This is intentional — it is not a bug to work around. Either update the local YAML to include the missing field (pull first if it might be stale: `tdx cas pull`), or, if removing it is genuinely intended, re-run with `--delete`. Never assume `--delete` is safe to add reflexively just to make the refusal go away — confirm with the user first if you didn't write the YAML yourself.
- **Renaming an attribute/behavior (same source `schema`/`table`/`column`, new `name`) does NOT need `--delete`.** `tdx cas push` detects this as a rename, not a removal, and applies it directly. Under the hood the backend recreates the attribute/behavior with a new server-side id every time (it can't rename in place) — push output reports this explicitly, e.g. `Renamed attribute: "email" → "email_updated" (server id changed 10095 → 10096)`. If anything else is keyed on that id (an activation, an external system), it needs to be updated separately; `tdx cas push` has no way to know about or update such references.
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
tdx cas sg push <segment_file> --audience <name>  # Push one child segment standalone
tdx cas sg push <segment_file> --audience <name> --delete  # Delete that one named segment
tdx cas preview <segment_name> --audience <name>  # Preview a segment query on the CDW
tdx cas journey list [pattern] --audience <name>  # List journeys of a composable audience
tdx cas journey view <name> --audience <name>     # Show a composable journey's details
tdx cas journey pull [name] --audience <name> [--dir <dir>]  # Pull journeys to YAML
tdx cas journey push [file] --audience <name> [--dir <dir>]  # Push journeys from YAML
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

**Attribute/behavior `type` must match the real CDW column type** (`string`, `number`, `boolean`, `date`, `timestamp`, `string_array`, `number_array`) — a string-typed attribute over a numeric CDW column is rejected by the API (400) even though it's syntactically valid YAML. If unsure, pull an existing audience over the same table and copy its types.

**Every audience needs at least one attribute.** `tdx cas validate`/`push` reject an audience with an empty or missing `attributes:` list — the backend requires at least one.

**`all_columns: true` for a behavior only works if that behavior already has it set server-side.** The backend rejects `all_columns: true` for a brand-new behavior, or when flipping an existing behavior from explicit `columns:` to `all_columns: true` — this only succeeds on a behavior that was already created with it (e.g. an older audience predating this restriction). For any new or changed behavior, use an explicit `columns:` list instead; don't reach for `all_columns: true` as a shortcut. (Note: this is different from segment activations below, which do support `all_columns: true` freely.)

## Connection resolution — differs by CDW platform

The `connection:` field is a single generic value in the YAML, but what it means depends on the platform:

- **Snowflake**: a federated query config (zero-copy config) **ID** — a raw numeric ID, never a connector name. This resource is never listed by `tdx connections`, so there's no name to look up; `tdx cas pull` on an existing Snowflake audience shows the exact ID in use. Passing a value that happens to match a registered connector name on a Snowflake field is always a mistake — `tdx cas validate`/`push` catch this and fail fast rather than silently misrouting the ID.
- **Databricks/BigQuery**: a connector name or ID from `tdx connections`, plus a required `catalog:` field alongside `connection:` in the same block (master, or per-attribute/behavior).

## Child segment YAML — different rule DSL from `tdx sg`

Composable segment conditions use `leftValue` (the attribute) and `operator` (the comparison, which itself nests `type`, `not`, and `rightValue`) — **not** the `attribute`/`operator: {type, value}` shape standard `tdx sg` segments use. `rightValue` is not a sibling of `leftValue`/`operator`; it nests inside `operator`, as shown below. Get this wrong and the API returns a 400 naming exactly which field is missing/invalid.

**`leftValue.name` must exactly match the parent audience's attribute/behavior `name:` field — not the underlying CDW column, and not a lowercased or otherwise reformatted version of it.** For example, if the audience attribute is `name: STATE` (mapped to CDW column `STATE`), the rule must use `leftValue: { name: STATE }`, not `name: state`. This match is case-sensitive. **`tdx cas sg push` and `tdx cas validate` now catch a mismatched name before it reaches the backend** — `tdx cas sg push` resolves the live parent audience to check it, and `tdx cas validate` checks it too when a sibling `audience.yml` is present in the same directory (which `tdx cas pull` always writes). The error suggests the real name when it looks like a case-only typo. If you're validating a lone segment file with no sibling audience YAML, this check can't run (there's nothing to check the name against) — in that case a mismatched name still silently matches zero rows and shows a blank rule in the Console UI, so if that happens, check `leftValue.name` against the audience's actual attribute/behavior names (`tdx cas pull` the parent audience to see them) before assuming anything else is wrong.

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

Nested `And`/`Or` condition groups are supported here, same as standard `tdx sg` rules (nesting there only produces a validator *warning* about the Console UI's SQL preview, not a rejection — segment execution isn't affected either way).

For `activations[].connector_config` fields, **don't guess the field names** — run `tdx connection schema <connector_type>` first (see the **connector-config** skill) to discover them for the specific connector.

**`type: composable_segment` at the top level is mandatory, exact literal** — not just documentation, it's how `tdx` tells this file apart from a composable audience file. Omit it and the file gets validated against the *audience* schema instead, producing a confusing error about an unrelated field (e.g. a missing `master:`) rather than anything about the segment itself. If you see an error naming `master` or other audience-only fields while pushing something you intend as a segment, check `type:` first.

Composable segment YAML now gets structural validation ahead of push — a missing or malformed `rule:` is caught client-side with a clear error, same as composable audience YAML. This only covers condition/operator shapes `tdx` recognizes (`Value` conditions, `And`/`Or` groups); an unrecognized condition type (e.g. a `Behavior`-style condition) passes through unvalidated by design, so a malformed shape of that kind can still reach the backend as a raw error — if you hit an unfamiliar low-level error pushing a segment with an unusual condition type, suspect that first.

## Pushing a single child segment standalone

`tdx cas sg push <segment_file> --audience <name>` creates or updates **one** child segment without needing a co-located `audience.yml` in the same directory — the parent audience is resolved by name (via `--audience`, or the session context set by `tdx use cas <name>`). Same idempotent-by-name behavior as `tdx cas push`: pushing the same segment name again updates it in place, never creates a duplicate.

```bash
tdx cas sg push high-value-customers.yml --audience "Customer360 Snowflake"
tdx cas sg push high-value-customers.yml --audience "Customer360 Snowflake" --dry-run
tdx cas sg push high-value-customers.yml --audience "Customer360 Snowflake" -y
```

Use this instead of `tdx cas push <dir>` when you only need to manage one segment file independently — e.g. a CI/CD pipeline that touches one segment at a time, or when the parent audience is managed elsewhere and shouldn't be re-pushed alongside every segment change.

### Deleting a single child segment

`tdx cas sg push <segment_file> --audience <name> --delete` deletes **exactly the one segment** named in that file's `name:` field. This is **single-named-target delete only** — not a directory/bulk prune. Passing a directory with `--delete` is rejected outright, not silently interpreted as "delete everything not in this directory."

```bash
tdx cas sg push high-value-customers.yml --audience "Customer360 Snowflake" --delete
tdx cas sg push high-value-customers.yml --audience "Customer360 Snowflake" --delete --dry-run
tdx cas sg push high-value-customers.yml --audience "Customer360 Snowflake" --delete -y
```

This `--delete` means something different from `tdx cas push`'s own `--delete` (which authorizes removing audience attributes/behaviors detected as drift) — each is scoped to its own command's domain. Don't assume `--delete` always means the same thing across `cas push` and `cas sg push`. The confirmation prompt names the segment and audience explicitly since this is destructive and irreversible — never skip the confirmation (`-y`) on a segment you didn't write the YAML for yourself without confirming with the user first.

## Journeys

**Requires tdx v2026.10.3 or later.** Before using composable journey commands, check `tdx --version`, `tdx cas journey --help`, and `tdx cas journey validate --help`. If the commands are unavailable, explain the version requirement and stop. Ask for explicit confirmation before upgrading to a prerelease; do not fall back to top-level `tdx journey`, which supports complete audiences only.

Composable audience journeys use `tdx cas journey`, not top-level `tdx journey` — `tdx journey push` resolves complete audiences only and refuses a composable audience name outright (`SEGMENT_NOT_FOUND`). Composable stays under `tdx cas` until the core `tdx journey` commands reach parity with it. Reuse the **journey** skill's 5-step order and journey structure, applying the **Composable authoring overrides** below before following its templates.

```bash
tdx cas journey list [pattern] --audience <name>              # List journeys (glob filter on name)
tdx cas journey view <name> --audience <name>                 # Show one journey's details
tdx cas journey pull [name] --audience <name> [--dir <dir>]   # Pull journey(s) to YAML
tdx cas journey pull [name] --audience <name> --dry-run       # Preview the pull, write nothing
tdx cas journey push [file] --audience <name> [--dir <dir>]   # Push journey(s) from YAML
tdx cas journey push [file] --audience <name> --dry-run       # Preview the push, write nothing
tdx cas journey push [file] --audience <name> -y              # Skip confirmation (CI/CD)
```

`--audience` can be omitted once the `composable_audience` session context is set — `tdx cas pull` and `cas journey pull` both set it.

**File layout**: `cas/<audience>/<folder path>/<name>.journey.yml` — journeys land next to the audience and segment files `tdx cas pull` writes in that same tree. `--dir` overrides the audience root (default `cas/<audience>`); a single file passed to `push` must sit under it, since folder paths are read relative to that root. `tdx cas validate`/`push` skip `*.journey.yml` files — they belong to `cas journey push`, not the audience/segment push.

### Composable authoring overrides

These instructions take precedence over the **journey** skill's prerequisites, template discovery commands in Steps 1 and 2, file location, and Step 5 commands.

**Initial discovery (before Step 1):** explicitly select the composable audience and pull its definition before editing local files:

```bash
tdx cas list
tdx cas desc "Audience Name"
tdx cas pull "Audience Name"
tdx cas journey pull --audience "Audience Name"
```

Read the pulled `audience.yml` for exact attribute/behavior names, types, source tables, and connections. Inspect pulled segments and journeys for existing rule examples. In Step 2, reread these local definitions to design decision branches; do not pull again into the authoring root after Step 1, which would overwrite local journey edits. If a refresh is needed, pull into a separate discovery directory. Replace the templates' `tdx sg pull`, `tdx ps desc -o`, `tdx sg fields`, and TD output-table queries with this discovery; complete-audience session context does not identify the composable audience. If real CDW values or distributions are needed, use an available read-only tool for that CDW connection or ask the user for sample values before choosing thresholds; do not guess or query an unrelated TD table.

**File location (Steps 1–4):** write `cas/<audience>/<folder path>/<name>.journey.yml` under the root created by `tdx cas pull`, alongside any existing journeys. For a custom root, use the same `--dir` on audience pull, journey pull, and journey push. Do not use the complete-audience `segments/<parent-segment>/` location. Apply the composable constraints below while building each stage.

**Embedded segment rules (Steps 1 and 2):** composable `.journey.yml` files use the shared journey rule format from the templates (`attribute` and `operator.value`). Use the exact exposed attribute/behavior names from audience discovery. Standalone `type: composable_segment` files use the CAS `leftValue`/`operator.rightValue` format; do not copy those rules into the journey unchanged. Reuse embedded rule examples from pulled journeys rather than standalone segment files.

**Supported structure (Steps 2–4):** complete-audience templates include condition waits and cross-journey jumps that composable journeys do not support. Use supported duration waits and decision points; if the client's design requires an unsupported feature, explain the limitation before proposing an alternative. Local composable validation checks these restrictions and activation String Builder mappings as well as the shared journey structure.

**Local validation (Step 5):** replace `tdx journey validate` with the composable validator before API reconciliation:

```bash
tdx cas journey validate cas/<audience>/<folder path>/<name>.journey.yml
```

Use the exact local file path for custom roots; this command has no `--dir` flag and performs no API calls. Fix errors before proceeding.

**API dry-run, visual preview, and push (Step 5):** use the **journey** skill's visual `preview_journey` step and obtain client confirmation. Replace both its API dry-run and real push commands with the exact composable journey file and audience:

```bash
tdx cas journey push cas/<audience>/<folder path>/<name>.journey.yml --audience "Audience Name" --dry-run
tdx cas journey push cas/<audience>/<folder path>/<name>.journey.yml --audience "Audience Name" --yes
```

Run the dry-run and fix errors before visual confirmation and real push. Add the same `--dir` to both commands when using a custom root. The real push requires client confirmation; a dry-run or visual preview does not deploy anything. `tdx cas preview` queries a saved server segment on the CDW; it does not accept a local journey file or an unsaved embedded segment and cannot replace these validation and preview steps.

**Push never deletes.** A server journey with no local file is reported, not removed. Repeat pushes are idempotent by name, same as `tdx cas push`. A server-side rejection (an unsupported journey feature) can land mid-write — whatever was already created (folder, journey, its segments, an activation) stays; fix the YAML and push again, which reuses what exists rather than duplicating it.

**Composable journey constraints** — each is a pre-write guard, checked before anything is sent and visible under `--dry-run`:

- **Account enablement**: journey orchestration must be enabled for the composable account. An account without it reports that clearly instead of a raw error or a silently empty list.
- **One definition, not versions**: a file with more than one entry under `journeys:` is refused (`JOURNEY_MULTI_VERSION_UNSUPPORTED`) — composable audiences have no journey versions. The journey's name comes from the file's top-level `name:`, not a `version:` label (`version:` is a label only).
- **No independent entry criteria after stage 1**: only the first stage sets its own `entry_criteria`. Every later stage is entered by reaching the milestone of the stage before it — that's the only entry criteria a composable journey stores. A later stage stating anything else is refused (`COMPOSABLE_JOURNEY_STAGE_ENTRY_CRITERIA`); fix is to adjust the **previous** stage's `milestone`, not the later stage's entry criteria.
- **A journey needs a folder**: a composable audience with no root folder refuses the push outright (`JOURNEY_FOLDER_REQUIRED`) rather than writing a folder-less journey.

```bash
tdx cas journey pull --audience "Customer360 Snowflake"
tdx cas journey pull "Welcome Series" --audience "Customer360 Snowflake" --dry-run
tdx cas journey push --audience "Customer360 Snowflake" --dry-run
tdx cas journey push cas/customer360-snowflake/Welcome/onboarding.journey.yml -y
```

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
| `cas sg push`/`cas validate` reports a `leftValue.name` mismatch | `leftValue.name` doesn't exactly match the audience's attribute/behavior `name:` (case-sensitive). Use the suggested name if one is offered, or `tdx cas pull` the parent audience to check the real attribute/behavior names. |
| Segment pushes fine but shows a blank rule in Console / preview returns 0 rows | Only happens now when validating a lone segment file with no sibling `audience.yml` (the name-mismatch check has nothing to check against). `leftValue.name` doesn't exactly match the audience's attribute/behavior `name:` — `tdx cas pull` the parent audience and check the real attribute/behavior names. |
| `cas sg push` fails naming `master` or another audience-only field | The file is missing `type: composable_segment` at the top level and got validated as an audience file instead. Add the field — this isn't about the field the error names. |
| `cas sg push --delete` against a directory is rejected | Single-named-target delete only — point it at the one segment file to delete, not a directory. |
| Unfamiliar low-level/database error pushing a segment | Structural validation catches `Value`/`And`/`Or` shape mistakes (missing/malformed `rule:`), but not unrecognized condition types (e.g. `Behavior`-style) — check those first if the error is unfamiliar. |
| `all_columns: true` rejected for a behavior | Only works on a behavior that already has it set server-side — use an explicit `columns:` list for any new or changed behavior instead. |
| Non-interactive mode error | Add `-y`: `tdx cas push -y <path>` |
| An audience you expect isn't in `tdx cas list` | It may only exist on the other host — try again with `TDX_CAS_LEGACY_ENDPOINT=1`. |
| `tdx journey push`/`list`/`view` fails on a composable audience name | Expected — those commands resolve complete audiences only. Use `tdx cas journey push`/`list`/`view` instead. |
| `JOURNEY_MULTI_VERSION_UNSUPPORTED` | A composable journey file has more than one entry under `journeys:` — composable audiences have no versions. Keep one entry. |
| `COMPOSABLE_JOURNEY_STAGE_ENTRY_CRITERIA` | A stage after the first states its own `entry_criteria` — not supported. Adjust the previous stage's `milestone` instead. |
| `JOURNEY_FOLDER_REQUIRED` | The composable audience has no root folder to push the journey into. |
| `cas journey` reports journey orchestration isn't enabled | Composable account enablement is required — ask the user to confirm with their Customer Success Representative before assuming the command is broken. |

## Related Skills

- **connector-config** - Discover `connector_config` fields per connector type for activations
- **segment** - Standard (non-composable) child segment management — note the different rule DSL
- **parent-segment** - Standard (non-composable) parent segment management
- **journey** - 5-step authoring process and journey structure — apply this skill's Composable authoring overrides when using its templates

## Resources

- https://tdx.treasuredata.com/commands/cas.html
