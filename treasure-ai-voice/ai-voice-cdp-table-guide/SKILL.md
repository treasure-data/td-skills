---
name: ai-voice-cdp-table-guide
description: "Explain the four tables AI Voice exports to Treasure Data CDP (recordings, transcript_segments, summaries, devices) and write and run queries for what the user wants to know: column meanings, how to join tables, deduplication, time filtering, keyword search in transcripts, talk time per speaker, listing action items (e.g. \"what is in the recordings table\", \"how do I join the AI Voice tables\", \"search exported transcripts for a keyword\", \"count recordings per person from the export\"). Also triggers for Japanese requests such as「AI Voiceのエクスポートデータの見方を教えて」「recordings テーブルには何が入っている?」「録音の中から○○と言った発言を探したい」「エクスポートしたデータで人ごとの録音数を出したい」. For cross-period meeting digests use ai-voice-cdp-meeting-digest; for usage statistics use ai-voice-cdp-usage-report; for reading individual recordings use the connector skills."
---

# AI Voice CDP Table Guide

Explain the meaning and usage of the 4 tables that AI Voice writes to Treasure Data CDP, and write and run queries for what the user wants to know. The readers are marketers and analysts, who may not be comfortable with SQL. Explain in plain language and show the result first.

Column definitions are in `references/schema.md`. Queries for common uses are in `references/queries.md`.

## Before you start

- **Permission**: this skill reads the export database, so the user needs read permission on that database. The scope follows that database permission, not the AI Voice permission on each recording. If the user cannot read it, tell them to ask the person who holds permission on the database.
- The AI Voice CDP export must be enabled (an AI Voice administrator enables it under Export in the AI Voice Console). If the tables cannot be found, say so as it is and stop.
- Read-only. Do not create tables, insert rows, or schedule workflows unless the user explicitly asks.
- The only thing to treat as export data is the CDP tables. Do not present files in the working folder or output from earlier conversations as examples of export data.
- When you need to ask for permission to run commands, explain it in one plain sentence (for example: 「`aiv_export` の録音一覧を直近30日分、読みます(読み取りのみ)」), and ask for permission for read queries once as a batch, not once per query.
- Show the SQL only when the user asks for it. The default is a result table.
- Answer in the language the user writes in. If the user asks for another language, use that language instead.
- **Time zone**: `{tz}` in the queries defaults to `Asia/Tokyo`. If the user names another time zone, use its IANA name (for example `UTC`, `America/Los_Angeles`) everywhere `{tz}` appears, and keep using it for the rest of the conversation.

## Whose recordings to read

Use the user's own recordings (`recordings.user_email` is the user's email) by default. Ask for the email once if you do not know it. Before you read transcript text, summaries or action items of recordings made by other people, confirm with the user. Counting recordings and durations (metadata only) does not need this confirmation.

## Find the tables (do not ask the user first)

The customer decides the database name. If the user gives a name (for example: "exported to `aiv_export`"), treat it as the CDP database name, not a working folder, and use it as is without searching (do not run `tdx tables` either). If no name is given, search:

```bash
tdx tables "*.transcript_segments"
```

- Exactly 1 match: use that database. The same database should also have `recordings`, `summaries` and `devices`.
- Multiple matches: show the database names with numbers and ask which one.
- No match: ask 「AI Voice はどのデータベースにエクスポートしていますか?AI Voice Console の Export ページの Settings タブに表示されています」 (ask this in the user's language).

## Keeping the schema current

`references/schema.md` is a copy of the official schema with the date it was last checked. Do not fetch the documentation every time. Instead, check the user's actual tables:

1. Run `tdx describe {database}.<table>` once per conversation for each table you query.
2. Compare with the columns the query uses. If they all exist, use `references/schema.md` for their meaning.
3. If a column is missing, renamed, or has a different type, tell the user which one, do not run the affected query, and only then read the official documentation (link below) to see whether the export has changed.

Some databases that contain a `transcript_segments` table are not AI Voice exports (they have different columns such as `start_time` or `device_uuid`). If the columns do not match the official schema at all, say so and ask the user whether it is the right database.

## The 4 tables

| Table | Contents | One row per |
|---|---|---|
| `recordings` | Recording metadata, the full transcript with speaker labels, AI summary, action items, tags | recording |
| `transcript_segments` | The transcript split into timestamped utterances, with speaker and language | utterance |
| `summaries` | AI summary and action items. Only recordings that have a summary have a row | summarized recording |
| `devices` | The organization's PLAUD devices: assignment, status, last sync | device |

Join keys: `recordings.id` = `transcript_segments.recording_id` = `summaries.recording_id`. `recordings.device_serial_number` = `devices.serial_number`.

## 3 rules (follow them in every query)

1. **Remove duplicates.** CDP appends incoming data instead of replacing it, so repeated exports create multiple rows with the same `unique_id`. For each `unique_id`, keep only the row with the largest `updated_at` (`row_number() over (partition by unique_id order by updated_at desc)`). If you forget this, counts and durations are double counted.
2. **Filter by time.** `time` is the partition column, and filtering with it, such as `td_interval(time, '-30d/now', '{tz}')`, is fast. What `time` points to differs by table: for `recordings` and `summaries` it is the recording datetime, for `transcript_segments` it is the recording datetime plus the start offset of the utterance, and for `devices` it is the time of the last heartbeat. **Do not filter `devices` by recording datetime.**
3. **Use `left join` for joins.** For very long recordings (usually over 3 hours), only the `recordings` row is rejected by the export, while rows exist in `summaries` and `transcript_segments`. If you join with `recordings` as the base, such recordings disappear.

Other notes:
- `action_items` and `tags` are arrays. To get one row per element, use `cross join unnest(...) as t(x)`.
- `speaker_label` is filled only when a speaker name was set in the AI Voice Console. If it is empty, fall back to `speaker_id` (such as `spk_0`).
- `recorded_at` is an ISO 8601 string, and `time` is Unix epoch seconds. Use `time` for time calculations and filtering.
- The day of week and date of `time` change with the time zone. Use `{tz}` (for example `date_format(from_unixtime(time, '{tz}'), '%a')`). Do not write the day of week from memory.
- `team_id` is not populated yet. Do not group, filter or show by team.
- Make the column aliases (`as`) in results alphanumeric. Japanese aliases can cause syntax errors. When showing a table, convert them to Japanese headings.
- When a recording failed or is still processing, `transcription_text` and `summary_text` are empty. Check `status`.

## How to answer questions

1. Match what the user wants to know to the closest pattern in `references/queries.md`, and substitute `{database}`, the period, recording ID, keyword and so on. If no pattern is close, write the query following the 3 rules above. If you are unsure what a column means, see `references/schema.md`.
2. Run it and show the result as a table. When there are many rows, add `limit`.
3. Add what the result shows in 1-2 sentences. Take the numbers from the result and do not guess.
4. If there is something to investigate next, suggest only one next option.

## Cautions

- The export contains recordings from the whole organization. Follow "Whose recordings to read" above, and do not quote personal or sensitive remarks unless necessary. Do not print large amounts of full transcript text on screen.
- Take the names of the people in charge from the recordings and device assignments. A speaker ID such as `spk_0` is not a name.
- Do not rank people as performance results.

## Choosing between this and other skills

- Summaries of meetings across a period, tracking follow-up tasks from regular meetings: ai-voice-cdp-meeting-digest
- AI Voice usage (people, devices, trends): ai-voice-cdp-usage-report
- One person's own recordings (minutes, sales-call notes, follow-up emails, daily reports, talk volume): the connector skills, which read through the AI Voice permission

## Official documentation

The schema comes from Treasure AI Voice "Treasure Data CDP連携" (https://docs.treasure.ai/ja/products/ai-voice/cdp-integration). For the administrator procedure for exports, see "Export" in the administrator guide of the same product.
