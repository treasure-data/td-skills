# Treasure AI Voice Starter Skills

Nine skills for already-recorded Treasure AI Voice conversations and the AI Voice data exported to Treasure Data CDP. Customer-harassment review is being developed in a separately reviewed follow-up; it is not part of this starter set.

## Install

After this plugin is released:

```
/plugin marketplace add https://github.com/treasure-data/td-skills
/plugin install treasure-ai-voice@td-skills
```

Studio and `tdx` consume the stable release channel. A merge to `main` does not itself make the new skills available there; repository maintainers create and promote a release.

## Skills and access paths

Connector skills use the connected user's AI Voice access. The uploader, participant, customer owner, and action owner need not be the same person.

| Connector skill | Purpose |
|---|---|
| `ai-voice-analysis` | Default connector discovery/evidence rules; customer/deal histories, project status, product feedback, and reports without a dedicated deliverable skill |
| `ai-voice-meeting-minutes` | Minutes of one meeting, decisions, actions, and unresolved questions |
| `ai-voice-sales-call-notes` | Text notes for sales calls or customer service, reviewed before manual CRM entry |
| `ai-voice-followup-email` | Thank-you/follow-up subject and body only; never sends or creates a Gmail draft |
| `ai-voice-daily-report` | Daily/weekly activity from the user's own recordings, including a personal activity report for a manager |
| `ai-voice-talk-analysis` | Talk share, silence, overlap, and back-and-forth visualization for one call, after speaker-side confirmation |

CDP skills require source database/organization access. That access is not a replacement for establishing the permitted recording population or confirming the requested selection before content reads.

| CDP skill | Purpose |
|---|---|
| `ai-voice-cdp-table-guide` | Explain exported tables and run scoped queries; metadata-only previews precede applicable content reads |
| `ai-voice-cdp-meeting-digest` | Explicit CDP/export or multi-user meeting digest; confirm exact organization/recording keys before summaries, actions, or transcripts |
| `ai-voice-cdp-usage-report` | Metadata-only usage by creator and device; unknown creators are separate from identified people |

For manager-facing requests, route by subject: personal activity goes to daily-report; customer/deal/project status goes to analysis. Wording such as "for managers" or a week/month alone is not a reason to switch to CDP. A CDP alternative is an explicit source change with its own access and scope checks, not a silent fallback after a connector denial.

## Requirements and preserved behavior

- The AI Voice connector is connected for connector skills. CDP skills need an enabled export, an approved database/organization, read permission, and `tdx`. Do not switch TD profiles.
- Talk analysis uses Python 3.8+ and the standard library. The synthetic SQL regression tests use Python 3.9+ because their time-zone stand-ins use `zoneinfo`.
- Use the user's own recordings by default. Other-owner full content requires established access and the applicable selection confirmation. A role assertion or confirmation does not grant access.
- CDP table-guide/digest content reads use frozen organization/recording pairs. Preview returns no transcript, summary, action-item, or inferred-title fields. Missing metadata does not authorize orphan summaries/segments.
- Creator email, not current device assignment, identifies personal usage. Null, empty, and whitespace-only creators form an unknown-creator bucket: included in total recordings/hours, excluded from identified-person counts. Current device assignment is shown only in the device view.
- `team_id` is not populated and is not used for grouping, filtering, or implied team permissions.
- Default time zone is `Asia/Tokyo`; use a requested IANA zone consistently. Freeze explicit periods instead of moving `now` between related queries. Segment time includes the utterance offset, so approved calls crossing midnight need duration-backed segment bounds.
- Output is in the user's language unless another is requested. Follow-up email drafts use the meeting language unless explicitly overridden. The talk-analysis HTML page supports Japanese and English; explain the page-language limitation for other languages. Japanese trigger examples and output labels remain Japanese; developer comments are English.
- The skills do not automatically send messages/files, create calendar entries, publish reports, or write CRM records. Usage/talk metrics are not employee-performance grades.

## Known limitations

- Studio action availability/schema must be checked. The documented list actions are `ai_voice.list_my_recordings` and the admin-only `ai_voice.list_organization_recordings`; a non-admin organization-list response may silently contain only own recordings, not prove organization-wide access.
- Connector list responses can themselves include summaries/previews. Project fields where supported and record the actual response contract; do not claim an unprojected response was metadata-only. Listing supports `q`, `tag`, `status`, and device filters; date and external metadata filtering are client-side under the documented contract.
- Short Studio requests did not always select a skill; adding "from AI Voice recordings" helped. Descriptions now include short examples, but revised routing still needs an updated-commit Studio check.
- The export can omit a whole `recordings` row when a long transcript exceeds the event-size limit, even while summaries/segments exist. Content workflows conservatively exclude those rows without an independently reviewed mapping.
- Query examples assume stable source keys and recording timestamps across versions. Conflicting latest rows, changed metadata, unknown duration, or uncertain authorization require stopping/refreshing scope, not widening a query.
- Database query plans, host retention, and actual access enforcement are not established by local SQLite tests. Local temporary-file deletion does not erase tool responses, chat history, query/job results, logs, or backups.
- Installed skills from another plugin can compete with this plugin. Use an isolated configuration for routing classification, while preserving a valid authenticated CLI environment. Do not delete a user's installed skills for a test.

## Validation

Every skill includes `owner`, `tier: 1`, `classification: product`, and a `test.yml` with measurable synthetic behavior specifications. A scenario file is not an executed test result.

From the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover -s treasure-ai-voice/tests -v
claude plugin validate .
```

The local suite covers the talk renderer/language behavior, scoped table-guide/digest queries, and unknown-creator/device-reassignment attribution. SQL checks execute the documented queries using explicit SQLite adaptations. They are not native Trino syntax/partition-plan proof or Studio/Work permission tests.

Routing cases live in repository-root `tests/trigger-tests.yml`. `./tests/run-tests.sh --verbose` requires `claude` and `yq`. Use a fresh configuration if the CLI loads competing installed skills; do not discard required authentication or override a Treasure Work TD profile. Classification does not execute connector tools.

The manual `evals/japanese_output/run_eval.py` uses synthetic evidence and tools-disabled model calls to inspect Japanese output plus English controls (11 calls). Outputs are git-ignored. This does not replace tool-enabled host validation, and errors/empty responses must not be recorded as passes.

The [staging checklist](validation/staging-checklist.md) records the remaining updated-commit platform scenarios. Public results must include the exact commit, test surface/build, role, scenario, actual outcome, and sanitized trace. Never publish real transcripts, identifiers, or credentials.

## Maintenance

The confirmed maintenance owner is the **JP SA team**, with PM accountability. Public bug and request contact is [GitHub Issues in this repository](https://github.com/treasure-data/td-skills/issues). No unconfirmed personal email has been assigned as owner.

When connector operations/responses change, update the analysis tool table and `reference/tool-notes.md`, then exercise every connector skill on each supported surface. When export columns or timestamp semantics change, update the table guide and all affected CDP queries and revalidate scope and attribution. Keep test specifications and observed results distinct.
