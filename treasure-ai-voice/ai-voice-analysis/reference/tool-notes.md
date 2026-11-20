# Tool Notes — Treasure AI Voice

This file is a fallback reference. Read it only when a call returns an unexpected error or schema mismatch. For normal operation, follow the Quick Reference and the main sections in SKILL.md directly.

## How to access

All AI Voice actions are executed via open-connector:

```
mcp__open-connector__execute_action  actionId: "ai_voice.<action_name>"
```

To discover available actions and their current schemas:

```
mcp__open-connector__search_actions  service: "ai_voice"
mcp__open-connector__get_action_guide  actionId: "ai_voice.<action_name>"
```

Run `get_action_guide` before calling any action whose parameter list or return structure is uncertain — schemas may gain new fields or arguments over time.

## Action behavioral contracts (stable)

These describe *when* to use each action, not the exact parameters.

### Listing recordings

Two distinct list actions exist:

- **`list_my_recordings`** — Returns only the caller's own recordings, regardless of their role. Use this by default.
- **`list_organization_recordings`** — Intended for ENTERPRISE_ADMIN callers. For anyone else the API silently returns their own recordings instead of failing, so the response alone does not confirm which happened.

Both support pagination via `nextToken`. Both accept server-side filters: `q` (free-text substring over owner email, owner name, and inferred title — case-sensitive), `tag`, `status`, `deviceSessionId`, and `deviceSerialNumber`. Neither accepts a date filter; apply date filtering client-side on returned records. Return results in newest-first order.

### Getting a recording

- **`get_recording`** — Returns the full transcript as plain text. Use when the words are sufficient.
- **`get_transcript_segments`** — Returns speaker-separated, timestamped turns. Use when speaker attribution, timing, or speaking statistics matter. Accepts a `maxSegments` limit (defaults to 500); the response reports whether it was cut short.

Do not call both for the same recording by default. Choose based on what the requested output actually needs.

### Organization confirmation

Check `search_actions` for a current `get_organization`-equivalent action; availability may vary by deployment.

## Field path notes (verify with get_action_guide before relying on)

Field paths are not guaranteed stable across versions. The following were verified at time of writing but should be rechecked if a call returns unexpected structure.

- List response: `{ recordings: [...], nextToken }` — each recording may include `externalMetadata` as a JSON-encoded string; keys vary per recording and are not always present.
- `get_recording` response: transcript text is on the recording object (check exact key with `get_action_guide`).
- `get_transcript_segments` response: speaker turns and statistics are on the transcript object (check exact keys with `get_action_guide`).

## General notes

- `get_recording` retrieves a complete representation; there is no server-side range parameter. Use local chunking to limit context exposure, not the fetch amount.
- List responses can contain more fields than the action description suggests. Inspect returned objects before assuming field absence.
