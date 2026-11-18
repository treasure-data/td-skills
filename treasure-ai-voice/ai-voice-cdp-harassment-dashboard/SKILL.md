---
name: ai-voice-cdp-harassment-dashboard
description: "Find suspected customer harassment (カスハラ) in store-service recordings from AI Voice tables exported to Treasure Data CDP, and build a one-page HTML report: a list of suspected recordings with severity, a short quote and the lines around it, counts by type, and a daily trend. Narrows candidates by conversation shape and a harassment lexicon, then the AI judges only the candidates. Read-only; results are not saved. Use when a store or site manager wants to check harassment across many recordings (e.g. \"find recordings with suspected customer harassment\", \"customer harassment report for last month\", \"were there any aggressive customers at the store\"). Also triggers for Japanese requests such as「カスハラの疑いがある録音を探して」「カスハラの検知レポートを出して」「先月のカスハラの状況は」「店舗で威圧的なお客様がいなかったか見たい」. Reads many people's recordings through the CDP export, so it is for managers; for one person's own recordings use the connector skills."
---

# AI Voice CDP Harassment Dashboard

Find suspected customer harassment (カスハラ) in store-service recordings that AI Voice exports to Treasure Data CDP, and show the result as a one-page report. The readers are store or site managers, and they are not necessarily technical. Run the queries yourself, and show numbers and plain conclusions, not SQL. For what each table means, see ai-voice-cdp-table-guide.

Reference: the definition and the examples of behavior follow the MHLW manual 「カスタマーハラスメント対策企業マニュアル」(厚生労働省, 令和8年度改訂版, September 2026; the 2022 edition for the older wording). The law that makes countermeasures an employer's duty (改正労働施策総合推進法) takes effect on 2026-10-01.

The result is a **suspicion**, never a verdict. It can miss cases (some phrasings are in no dictionary), so never say "no harassment happened".

## Before you start

- AI Voice's CDP export must be enabled (an AI Voice admin turns it on under Export in the AI Voice Console). If the tables cannot be found, tell the user exactly that and stop.
- Permission: this skill reads the export database, so the user needs read permission on that database. The scope follows that database permission, not the AI Voice permission on each recording. If the user cannot read it, tell them to ask an AI Voice administrator, and stop.
- Whose recordings: this skill reads the recordings of many people (the store staff), because that is its purpose. Before the first query, confirm once, in one plain sentence, that the user is the manager who wants to check them (for example: 「店舗の録音全体を読んで、カスハラの疑いを探します。管理者として確認する、でよいですか」). If the user is not that person, stop.
- Read only. Do not create tables, write results to CDP, or schedule workflows. The report is a file in the working folder, nothing else.
- Language: write the reply in the language the user writes in, or in the language the user asks for. The report page supports only Japanese and English: set `lang` to `ja` when the reply is in Japanese and to `en` otherwise.
- Time zone: `{tz}` in the queries defaults to Asia/Tokyo. If the user names another time zone, use its IANA name (for example UTC, America/Los_Angeles) everywhere `{tz}` appears and keep it for the rest of the conversation.
- You need to write files and run `python3` (the report numbers come from `scripts/harassment_report.py`). If you cannot, tell the user that this skill needs it and stop.
- Do not show the SQL unless asked. When you need to ask permission to run commands, explain it in one plain sentence (for example: 「`aiv_export` から直近30日の録音を読んで、カスハラの疑いを探します(読み取りのみ)」) and ask for permission once for both queries together.
- Use the queries below as they are, replacing only `{database}`, `{tz}`, and the period. The default period is the last 30 days. Do not ask about it unless the user's wording is ambiguous.
- Never run `select *` or print rows of the tables. Read recordings only through the queries below.

## Step 1: Find the AI Voice tables (do not ask the user first)

If the user gave a name (for example 「`aiv_export` にエクスポート済み」), treat it as a CDP database name, not a work folder, and use it as is without searching (do not run `tdx tables`). If no name was given, search:

```bash
tdx tables "*.transcript_segments"
```

- Exactly one match: use that database (`recordings` and `devices` should be in the same place).
- Several matches: show them as a numbered list and ask which one.
- No match: ask which database AI Voice exports to (it is shown in the Settings tab of the Export page in the AI Voice Console).

## Check the columns once

Run `tdx describe {database}.recordings`, `tdx describe {database}.transcript_segments`, and `tdx describe {database}.devices` once per conversation, and check that the columns used below exist (`recordings`: `id`, `status`, `duration_seconds`, `inferred_name`, `user_name`, `device_serial_number`; `transcript_segments`: `recording_id`, `speaker_id`, `start_ms`, `end_ms`, `text`; `devices`: `serial_number`, `assigned_user_name`). If a column is missing or renamed, tell the user which one and do not run the queries. `team_id` is not populated yet, so do not group, filter, or show by team.

## Rules for every query

- **Remove duplicates.** Repeated exports append the same record again with the same `unique_id`. For each `unique_id`, keep only the latest row (the one with the largest `updated_at`).
- **Filter by time.** Use `td_interval(time, '-30d/now', '{tz}')` (adjust the range; for a calendar month use `td_time_range(time, '2026-10-01', '2026-11-01', '{tz}')`). Do not filter `devices` by time.
- **Only `COMPLETED` recordings are judged.** Count `FAILED` and in-progress recordings separately (Query 0) and report them as excluded.
- **Who is the staff member and who is the customer is not in the data** (`speaker_label` is usually empty). The queries infer it per recording: the speaker who most often uses staff phrases (いらっしゃいませ, ございます, 恐れ入ります, かしこまりました, 申し訳, …) is the staff member, and everyone else is a customer. If two speakers tie, the one who spoke first is the staff member.
- **Identify the recorder** by the device assignment: join `recordings.device_serial_number` to `devices.serial_number` and use `assigned_user_name`. If there is none, fall back to `recordings.user_name`.
- Save query results to a file in the working folder and read them from there. Do not print them to the screen. Long SQL passed as an argument can fail, so write it to a file and use `tdx query -f`.

## Step 2: Narrow down the candidates

### Query 0: counts per status

```sql
select status, count(*) as n
from (
  select *, row_number() over (partition by unique_id order by updated_at desc) as rn
  from {database}.recordings
  where td_interval(time, '-30d/now', '{tz}')
)
where rn = 1
group by 1
```

### Query A: candidate recordings with a short excerpt

Put the contents of `references/lexicon.sql` (the `lexicon as (...)` block, 162 patterns) right after `with`, followed by a comma. A recording is a candidate when **either** the customer talks most of the time in a long recording (customer talk ratio 0.72 or more and 15 minutes or longer), **or** at least one lexicon pattern is found.

```sql
with
-- paste references/lexicon.sql here (lexicon as (...)), then a comma
r as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.recordings
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1 and status = 'COMPLETED'
),
d as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.devices
  ) where rn = 1
),
s as (
  select t.recording_id, t.speaker_id, t.start_ms, t.end_ms, t.text
  from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.transcript_segments
    where td_interval(time, '-30d/now', '{tz}')
  ) t
  where t.rn = 1 and t.recording_id in (select id from r)
),
marked as (
  select *,
    case when regexp_like(text, 'いらっしゃいませ|ございます|いたします|恐れ入り|かしこまり|申し訳|承知|少々お待ち|お待たせ|お伺い|お気をつけて|ありがとうございました')
         then 1 else 0 end as staff_marker
  from s
),
spk as (
  select recording_id, speaker_id, sum(end_ms - start_ms) as ms,
         avg(cast(staff_marker as double)) as rate, min(start_ms) as first_ms
  from marked group by 1, 2
),
side as (
  select recording_id, speaker_id, ms,
         case when row_number() over (partition by recording_id order by rate desc, first_ms asc) = 1
              then 'S' else 'C' end as side
  from spk
),
agg as (
  select recording_id,
         sum(case when side = 'C' then ms else 0 end) * 1.0 / nullif(sum(ms), 0) as cust_ratio
  from side group by 1
),
hitc as (
  select m.recording_id, m.start_ms, l.category
  from marked m join lexicon l on strpos(m.text, l.pattern) > 0
  group by 1, 2, 3
),
hitseg as (select recording_id, start_ms from hitc group by 1, 2),
hitrec as (
  select recording_id, count(distinct start_ms) as hit_segments,
         array_join(array_distinct(array_agg(category)), ',') as hit_categories
  from hitc group by 1
),
lines0 as (
  select m.recording_id, m.start_ms, ro.side, m.text,
         case when h.start_ms is not null then 1 else 0 end as is_hit,
         row_number() over (partition by m.recording_id order by m.start_ms) as ord
  from marked m
  join side ro on ro.recording_id = m.recording_id and ro.speaker_id = m.speaker_id
  left join hitseg h on h.recording_id = m.recording_id and h.start_ms = m.start_ms
),
lines as (
  select recording_id, start_ms, side, text, is_hit,
         max(is_hit) over (partition by recording_id order by ord
                           rows between 3 preceding and 3 following) as near_hit
  from lines0
),
ranked as (
  select *, row_number() over (
           partition by recording_id
           order by case when near_hit = 1 then 0 else 1 end,
                    case when side = 'C' then 0 else 1 end, start_ms) as pr
  from lines
),
excerpt as (
  select recording_id,
         array_join(array_agg(
           '[' || lpad(cast(start_ms / 60000 as varchar), 2, '0') || ':'
               || lpad(cast((start_ms / 1000) % 60 as varchar), 2, '0') || '] '
               || case when side = 'C' then '客: ' || substr(text, 1, 140)
                       else '店: ' || substr(text, 1, 80) end
           order by start_ms), chr(10)) as excerpt
  from ranked where pr <= 100 group by 1
)
select r.id as recording_id,
       date_format(from_unixtime(r.time, '{tz}'), '%Y-%m-%d') as recorded_date,
       date_format(from_unixtime(r.time, '{tz}'), '%H:%i') as recorded_time,
       coalesce(d.assigned_user_name, r.user_name, '(不明)') as recorder,
       r.inferred_name as title,
       round(r.duration_seconds / 60.0, 0) as minutes,
       round(a.cust_ratio, 2) as cust_ratio,
       coalesce(h.hit_segments, 0) as hit_segments,
       h.hit_categories,
       e.excerpt
from r
join agg a on a.recording_id = r.id
join excerpt e on e.recording_id = r.id
left join hitrec h on h.recording_id = r.id
left join d on d.serial_number = r.device_serial_number
where (a.cust_ratio >= 0.72 and r.duration_seconds >= 900) or coalesce(h.hit_segments, 0) >= 1
order by coalesce(h.hit_segments, 0) desc, a.cust_ratio desc
```

Notes:

- The dictionary has 162 patterns taken from the MHLW manual (see Reference above). It finds phrasings someone thought of and misses the rest, so the customer talk ratio is the second net. Tell the user once, in the chat, that unusual phrasings can be missed.
- Recordings longer than about 3 hours may be missing from `recordings`. They are not covered. Do not guess.

## Step 3: Judge the candidates

Read `references/judge-criteria.md` and follow it. In short:

- Judge the candidates yourself, 5 recordings per batch, from the header fields and the `excerpt`. Judge at most 40 candidates in total. If there are more, take the first 40 in the order of the query result and count the rest as unjudged (they are reported as 未判定).
- Each judgment is `suspected`, a `type` (one of the fixed types), a `severity` from 1 to 3, a short `quote` of the customer's own words (at most 60 characters, with names and phone numbers masked), a one-sentence `reason`, and `context`: the lines just before and after the quote (up to 7 lines in time order, copied from the excerpt, with names and phone numbers masked).
- A lexicon hit alone is not enough. Training talk, news, jokes, and calm confirmations are not harassment. A firm but reasonable demand is not harassment. Do not decide by politeness.
- Do not judge or comment on how the staff member handled it.

## Step 4: Build the report

1. Write `harassment-input.json` (see the top of `scripts/harassment_report.py` for the exact fields). `lang` is `ja` or `en`, as decided under Language above. `period_start` and `period_end` are the first and last day of the period you read. `totals.recordings` is the number of `COMPLETED` recordings from Query 0, `totals.candidates` is the number of rows Query A returned, `totals.judged` is the number you judged, and `failed` / `in_progress` come from Query 0. `findings` has only the recordings you judged `suspected`; `date`, `time`, `recorder`, `title`, and `minutes` come from the Query A row, and `context` comes from your judgment.
2. Run `python3 scripts/harassment_report.py harassment-input.json harassment-report-<today's date>.html` (use the real path of the `scripts` folder). It writes the page and prints the counts as JSON. If it prints an error, fix the input file as the message says and run it again.
3. Do not edit the generated HTML, its colors, or its numbers. Never count the findings by hand.

## Step 5: Reply

Tell the user the file location and write at most 5 lines in the user's language, only in this form:

```
<file name or path>
録音 N件のうち、カスハラの疑い M件(深刻度3が K件)
いちばん多い類型:<type> X件
```

Then add this one line (do not write it from the second time on in the same conversation): 「これは AI が録音の内容から付けた『疑い』で、確定ではありません。見逃しをゼロにはできません。従業員の評価に使う場合は、社内での取り決めが別途必要です。」 Do not write it inside the page.

If no recording was suspected, say so in one line and still give the file. Do not add advice, legal conclusions, or praise. Do not send the file or post it anywhere. The user shares it.

## Do not

- Do not call anyone guilty. The customer is not named, and the recorder's name is shown only because the report is for the manager. Do not rank staff members.
- Show only a short quote and the few lines around it (`context`, up to 7 lines) for each suspected recording, and only in the report. Do not put the full transcript in the chat. Mask names, phone numbers, and addresses everywhere.
- Do not write to CDP, create tables, or run workflows.
- Do not use these results to evaluate employees. If the user asks whether they can, say that it needs a separate agreement inside the company, and do not decide for them.
