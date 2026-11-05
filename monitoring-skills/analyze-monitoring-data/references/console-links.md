# Console Links

Every dashboard row that identifies a job, workflow, session, attempt, parent segment, sub segment, journey, activation template, or activation should link to its TD console page. Read this file before writing the queries or the HTML for any dashboard that shows those entities.

## Step 1 — Resolve the region once

The account you're querying already has a known region — it's the `site` of the active `tdx` profile. Get it once per dashboard build (not per row):

```bash
tdx status
```

Parse the `site: <code>` line (e.g. `us01`, `eu01`, `ap01`, `ap02`) and look it up — **don't string-substitute the site code into a fixed template**, Japan is a genuine exception (different TLD, no site subdomain):

| Site | `BASE_CLASSIC` | `BASE_NEXT` |
|---|---|---|
| `us01` | `https://console.us01.treasuredata.com` | `https://console-next.us01.treasuredata.com` |
| `eu01` | `https://console.eu01.treasuredata.com` | `https://console-next.eu01.treasuredata.com` |
| `ap02` (Korea) | `https://console.ap02.treasuredata.com` | `https://console-next.ap02.treasuredata.com` |
| `ap01` (Japan) | `https://console.treasuredata.co.jp` | `https://console-next.treasuredata.co.jp` |

Source: [Treasure AI Sites and API Endpoints — Treasure Console URLs](https://docs.treasure.ai/apis/endpoints/endpoints#treasure-console-urls) — these are the only four sites listed there today.

If `tdx status` reports a site not in this table, stop and ask the user for its console domain rather than guessing a pattern — treat it the same way `ap01` would break a naive `console.<site>.treasuredata.com` substitution.

## Step 2 — Build the URL per entity type

Fetch these columns/joins in Step 1 of dashboard building (alongside the rest of the query) so link construction needs no extra round trip.

### Jobs (`basic_monitoring`)

| Field | Source |
|---|---|
| `job_id` | `jobs.job_id` |

```
{BASE_CLASSIC}/app/jobs/{job_id}/results
```

### Workflow definition (`workflow_monitoring`)

| Field | Source |
|---|---|
| `workflow_id` | `workflows.id`, or `JSON_EXTRACT_SCALAR(workflow, '$.id')` from `attempts`/`sessions`/`schedules` |

```
{BASE_CLASSIC}/app/workflows/{workflow_id}/info
```

**No separate project-level page exists** — opening any workflow within a project already shows the full project view. When a query groups by project only (no single workflow in scope), pick one representative workflow id, e.g. `MAX(JSON_EXTRACT_SCALAR(workflow, '$.id'))`, and link the project row to that workflow's `/info` page. If no workflow id is available at all, leave the project name unlinked rather than guessing.

### Workflow session, no attempt (`workflow_monitoring`)

| Field | Source |
|---|---|
| `workflow_id` | `JSON_EXTRACT_SCALAR(workflow, '$.id')` on `sessions` |
| `session_id` | `sessions.id` |

```
{BASE_CLASSIC}/app/workflows/{workflow_id}/sessions/{session_id}
```

### Workflow attempt (`workflow_monitoring`)

| Field | Source |
|---|---|
| `workflow_id` | `JSON_EXTRACT_SCALAR(workflow, '$.id')` on `attempts` |
| `session_id` | `attempts.sessionid` |
| `attempt_id` | `attempts.id` |

```
{BASE_CLASSIC}/app/workflows/{workflow_id}/sessions/{session_id}/attempt/{attempt_id}
```

### CDP entities (`cdp_monitoring`) — parent segment, sub segment, journey, realtime journey, activation template

All of these resolve through the `entities` table. `entities.id` is the `e` in the URL; `JSON_EXTRACT_SCALAR(entities.attributes, '$.audienceId')` is the parent segment id (`ps_id`). `entities.type` picks the URL suffix:

| `entities.type` | What it is | URL suffix |
|---|---|---|
| `folder-segment`, root only (`JSON_EXTRACT(relationships, '$.parentFolder.data') IS NULL`) | Parent segment | `/f/da` |
| `segment-batch` or `segment-realtime` | Sub segment | `/sb/da` |
| `journey` | Journey | `/j/da` |
| `realtime-journey` | Realtime journey | `/rtj/da` |
| `activation-template` | Activation template | `/at/de` |

```
{BASE_NEXT}/app/ps/{ps_id}/e/{entity_id}/{suffix}
```

Example resolution query for a parent segment's root folder:

```sql
SELECT id AS entity_id
FROM <cdp_db>.entities
WHERE type = 'folder-segment'
  AND JSON_EXTRACT_SCALAR(attributes, '$.audienceId') = '<ps_id>'
  AND JSON_EXTRACT(relationships, '$.parentFolder.data') IS NULL
```

Sub segments, journeys, realtime journeys, and activation templates need no root-filtering — the row's own `id` and `audienceId` are enough; there's exactly one entity per object.

**Journey note:** `journey_summary.journey_id` equals `entities.id` for the same journey. To get the `ps_id` needed for the URL, look up `JSON_EXTRACT_SCALAR(attributes, '$.audienceId')` from `entities` where `type = 'journey'` and `id = journey_id`. Do this in the initial parallel query batch — do not add a second round trip after the dashboard data is collected.

**Not yet confirmed — leave unlinked:** `predictive-segment`, `funnel`, `mlSolution`, `realtime-personalization`. Don't guess their URL suffix.

### Activation (`cdp_monitoring`)

Activations don't have an `entities` row — resolve straight from `activations`:

| Field | Source |
|---|---|
| `ps_id` | `activations.ps_id` |
| `entity_id` | `activations.segmentid` (the owning sub segment's entity id) |
| `activation_id` | `activations.id` |

```
{BASE_NEXT}/app/ps/{ps_id}/e/{entity_id}/sb/ac/{activation_id}/ea
```

## Rendering

Use the `linkCell(url, label)` helper from `dashboard-template.html` to wrap any table cell that identifies one of the entities above. If the id needed to build a URL is missing or null for a given row, render the plain label — never emit a link with a blank id.
