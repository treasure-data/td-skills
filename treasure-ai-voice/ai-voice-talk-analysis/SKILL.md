---
name: ai-voice-talk-analysis
description: "Visualize the shape of one conversation from a Treasure AI Voice recording as a single HTML page: talk share per speaker, silences, overlaps, and back-and-forth turns between own side and customer side. Reads recordings via the AI Voice connector. Use when asked about talk-to-listen ratio, silence and interruption counts, or whether a rep is talking too much (e.g. \"show the talk-to-listen ratio of my sales call\", \"count silences and interruptions\", \"is the rep talking too much\", \"visualize this call\"). Also triggers for Japanese requests such as「商談の話した量を見せて」「沈黙や被りを数えて」「営業が話しすぎていないか見たい」「さっきの通話を可視化して」. For meeting minutes, use ai-voice-meeting-minutes."
compatibility: Requires running python3 (3.8 or later, standard library only) and writing files.
owner: JP SA team
tier: 1
classification: product
---

# AI Voice Conversation Visualization

Show the shape of one conversation: who talked how much, where it went quiet, where speakers overlapped. One page per recording. The user is not necessarily technical. Ask in plain words, do not ask for a recording ID, and do the search yourself.

Write every message to the user in the user's own language (the language of their request), starting with the very first line. Do not open with a lead-in in another language, such as an English "I'll start by..." for a Japanese request.

The numbers come from the bundled `scripts/talk_analysis.py`. **Do not count silences, overlaps, or shares by hand or in your head.** A long call has hundreds of segments, and you will miscount. If you cannot write a file and run `python3`, tell the user that this skill needs that ability and stop.

## Reading the recording

Use the Treasure AI Voice connector. Tool names differ by app, so choose by role.

| Purpose | AI Studio connector | Treasure Work |
|---|---|---|
| List recordings | `ai_voice.list_my_recordings` (default) or `ai_voice.list_organization_recordings` (ENTERPRISE_ADMIN only) | `ai_voice_list_recordings` |
| Who spoke when (speakers and times) | `ai_voice.get_transcript_segments` (set `maxSegments` high, for example 5000; the default is 500) | `ai_voice_get_recording` (`transcript_format: "json"`) |

For each segment, you get the speaker ID, the start and end times (in seconds), and the text.

- **Details**: finding recordings, paging, and reading long transcripts follow ai-voice-analysis, the connector basics.
- **In Treasure Work**, the `rows` in the `json` merge consecutive speech by the same person into one row (they are not the segments themselves). Use `speaker`, `start`, and `end` of `rows` as the segments. Silences in the middle of one person's speech cannot be counted, so write 「同じ人の発話の途中の沈黙は含みません。」 in the `note` of the input file. Do not use the `speakers` totals (such as `sharePercent`); get the numbers from the script.

- **If the connector is not connected**: tell the user (in their language), for example: 「設定 → コネクション から Treasure AI Voice を接続してください。一覧にない場合は、管理者に Treasure AI Voice コネクタの有効化を依頼してください」 and stop.
- **Use the user's own recordings.** Open a recording made by another person only after the user confirms it (name the recording and its owner when you ask).
- **Connector basics**: if the ai-voice-analysis skill is available, follow its rules for finding recordings (paging, filtering) and for reading long transcripts. The rules in this skill take priority for this deliverable.
- **Read-only.** Do not change anything on the AI Voice side, such as renaming speakers or re-running transcription, even if a tool allows it.

## Step 1: Identify the call

If the user has not specified one, ask just one question, for example: 「どの通話ですか?日付、時刻、タイトルの一部のどれかで大丈夫です」 List recent recordings and narrow them down yourself by date or title. If there are several candidates, show them with numbers, date and time, title, and length, and let the user choose. One call is one recording.

## Step 2: Read the segments and sort out the speakers

1. Get the segments split by speaker.
   - If the result comes back truncated, tell the user how far you could read (for example, "the first 40 minutes") and continue. Add a footnote to the page (see below).
   - If there is **only one speaker ID**, the voices were not separated. Say so in one sentence, offer meeting minutes instead, and stop. There is no one to compare with.
2. A speaker ID ("Speaker 1") is not a name. For **all speakers, including small ones**, show each one's talk share and one representative remark, and ask in a single message:
   - 「どの話者が自社側で、どの話者が顧客側ですか?」 Names are optional. A speaker without a name stays "Speaker 1". Do not guess names or affiliations from what was said.
   - 「同じ人が2つの話者に分かれていませんか?まとめる話者を教えてください」
   - Ask even when the speaker labels already say it (for example 「営業 佐藤」 or 「顧客 山本」). Write what you read into the question so the user can just answer yes (for example 「自社側は佐藤さんと高橋さん、顧客側は山本さんと森さん、で合っていますか?」). Do not build the page before you get the answer.
3. Speakers placed on neither the own side nor the customer side become `other`. They are included in talk share and the pie chart, but not in overlaps or the back-and-forth count.
4. Do not re-ask what the user has already said (for example, 「私が佐藤で、あとの2人はA社です」).

## Step 3: Build the page

1. Write a working file `talk-input.json` with only speakers and times, in the OS temporary folder (never inside the working folder or the project). **Do not include the transcript text.** Delete it after the page is built; if you could not delete it, tell the user where it is.

```json
{
  "title": "A社 初回ヒアリング",
  "recorded_at": "2026-10-28 15:51",
  "lang": "ja",
  "unit": "s",
  "speakers": [
    {"id": "Speaker 1", "name": "佐藤", "side": "self"},
    {"id": "Speaker 2", "name": "田中", "side": "customer"},
    {"id": "Speaker 3", "name": "鈴木", "side": "customer"},
    {"id": "Speaker 4", "merge_into": "Speaker 3"}
  ],
  "segments": [{"speaker": "Speaker 1", "start": 2.24, "end": 34.88}]
}
```

   - Put every speaker ID that appears in the segments into `speakers`. Always write `side` for a speaker without `merge_into`. `side` is one of `self` (the user's company), `customer`, or `other`. `merge_into` merges one speaker ID into another (the same person).
   - The script stops with an error on mistakes (a bad `unit` value, duplicate IDs, a missing `side`, a speaker not in the list). If an error appears, fix the input file as the message says and run again.
   - The page supports only `ja` and `en`. Use `ja` when the user writes in Japanese and `en` for any other language, unless the user asks for one of the two.
   - Write `recorded_at` in the user's time zone (default `Asia/Tokyo`; if the user names another time zone, use it).
   - Add `"note"` only when the numbers cover just part of the call (when the segments were truncated) and in the Treasure Work case above. Example: `"全体62分のうち最初の40分が対象です。"` Do not write it in any other case.
2. Find the script with the Glob tool (pattern: `**/ai-voice-talk-analysis/scripts/talk_analysis.py`). Then run `python3 <found-path> <temp folder>/talk-input.json talk-analysis-<today's date>-<title>.html`. It writes the page and prints a JSON summary of the numbers.
3. Do not edit the generated HTML, its colors, or its definitions. If something looks wrong, fix the input file and run again.

## Step 4: Reply

Tell the user where the file is, and write at most 3 lines from the printed summary. Write it in the user's language (if the page is in English and the user writes in another language, keep the page's terms in parentheses), use only the following form (in English: `Talk share: ours 43% / customer 57%`, `Silences (3s+): 6 / Overlaps: 6 / Back-and-forth: 86`), and write nothing else:

```
<ファイル名またはパス>
話した量:自社側 43% / 顧客側 57%
沈黙(3秒以上):6回 / 被り:6回 / ラリー:86回
```

Then add only the following one line (do not write it from the second time on in the same conversation): 「この数字は、会話の形を見て業務を改善するためのものです。個人の評価に使う場合は、社内での取り決めが別途必要です。」 Do not write it inside the page.

Use the same words as the page: `話した量` (talk share), `沈黙` (silence), `被り` (overlap), `ラリー` (back-and-forth turns). For `話した量`, use `side_share_pct` from the summary (the same numbers as Talk : Listen on the page). Do not add a table, praise, interpretation, or advice. Only when asked "was it good?" or "what should I improve?", answer based on the numbers alone, and also say what the numbers cannot show (for example, an overlap may be a backchannel and not an interruption).

Do not send or post the file. The user does the sharing.

## What the page counts

- **Talk share (発話量)**: the total length of each speaker's segments.
- **`沈黙` (silence)**: a stretch of 3 seconds or more in which nobody is speaking.
- **`被り` (overlap)**: when the speaker switches between the own side and the customer side, the next segment starts before the previous one ends.
- **`ラリー` (back-and-forth turns)**: the number of times the speaking side switches between the own side and the customer side (`other` speakers are skipped).
- **`最長の独演` (longest monologue)**: the longest time one person on the own side kept talking without a gap of 3 seconds or more.

## Troubleshooting

- Missing connection, denied access, or uncertain recording scope: explain the missing prerequisite and stop the affected read. Do not request credentials, switch TD profiles, or silently use a broader source.
- Missing or truncated evidence: state the coverage limit; do not invent content or report a failed request as an empty successful result.
- For connector schema differences, follow ai-voice-analysis and discover the current tool contract. For CDP schema differences, verify the table guide before using a query.

## Behavior validation

Measurable synthetic scenarios are in [test.yml](test.yml). They are specifications, not recorded staging passes. Record the exact commit, supported surface/build, role, scenario, actual tool/query trace, and result when executing them. The JP SA team maintains this skill with PM accountability; public bug/request contact is this repository's GitHub Issues.
