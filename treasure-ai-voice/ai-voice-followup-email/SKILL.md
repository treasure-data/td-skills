---
name: ai-voice-followup-email
description: "Draft a thank-you or follow-up email after a meeting or sales call from an AI Voice recording (e.g. 「お礼メールを書いて」「直近の打ち合わせのお礼メールを書いて」「商談のあとのお礼メールを作って」). Draft a thank-you and follow-up email to send after a meeting, sales call, or customer service interaction: recap, agreed items, next actions for both sides, and points to confirm. Always searches Treasure AI Voice recordings via the connector first — do not write from general knowledge. Triggers even when the user does not mention Voice (e.g. \"draft a thank-you email after my meeting with Company A\", \"follow-up email from the AI Voice recording\", \"email to confirm what we agreed in the call\"). Also triggers for Japanese requests such as「録音をもとに、打ち合わせのお礼メールを書いて」「A社との打ち合わせの録音からお礼メールを書いて」「さっきの打ち合わせのフォローメール」. Outputs subject and draft only — does not send."
---

# AI Voice Thank-You and Follow-Up Email

Draft an email that the user will send after a meeting. Ask in plain language, do not ask for the recording ID, and do the search yourself. The output is the draft only.

Write every message to the user in the user's own language (the language of their request), starting with the very first line. Do not open with a lead-in in another language, such as an English "I'll start by..." for a Japanese request.

## How to read recordings

Use the Treasure AI Voice connector. Tool names differ by app, so choose by role.

| Purpose | AI Studio connector | Treasure Work |
|---|---|---|
| List recordings | The list-recordings operation (`ai_voice.list_recordings`; in some environments it is split into 「自分の録音」 (my recordings) and 「組織の録音」 (organization recordings)) | `ai_voice_list_recordings` |
| Full transcript | `ai_voice.get_recording` | `ai_voice_get_recording` |
| Who spoke when (speaker and time) | `ai_voice.get_transcript_segments` | `ai_voice_get_recording` (`transcript_format: "json"`) |

- **Details**: finding recordings, paging, and reading long transcripts follow ai-voice-analysis, the connector basics.
- **When not connected**: Tell the user (in their language), for example: 「設定 → コネクション から Treasure AI Voice を接続してください。一覧にない場合は、管理者に Treasure AI Voice コネクタの有効化を依頼してください」, then stop.
- **Use the user's own recordings.** Open a recording made by another person only after the user confirms it (name the recording and its owner when you ask).
- **Connector basics**: if the ai-voice-analysis skill is available, follow its rules for finding recordings (paging, filtering) and for reading long transcripts. The rules in this skill take priority for this deliverable.
- **Dates and times**: show them in the user's time zone. The default is `Asia/Tokyo`; if the user names another time zone, use it for the rest of the conversation. Convert `recordedAt` and other timestamps before writing them.
- **Read-only, and never send.** Do not send the email, do not create a draft in a mail app, and do not change anything on the AI Voice side.
- Only recordings with status `COMPLETED` have a summary. If a recording is still processing or has failed, tell the user so.

## Step 1: Identify the meeting and the recipient

Always start by searching the recordings yourself. Never write the email from general knowledge, and never ask the user to describe the meeting. If no matching recording is found, say so and stop.

List the recent recordings and narrow down the candidates using the date or words from the title (「さっき」「今日」 means the most recent ones). If there are several candidates, show a numbered list with date and time, title and length, and let the user choose. Only if the user has not said who the recipient is and the transcript does not make it clear, ask once, in a single message:

> 誰宛てのメールですか?(例:「A社の田中様宛て」)

The default is: from the user, to the attendees on the other side, in polite business wording.

## Step 2: Choose what to include

Read the transcript. A speaker ID is not a name. When it matters who promised what, ask which speaker is on the recipient's side. Then choose from the following:

1. Thanks for the time they gave
2. Recap: 2 to 4 points that matter to the recipient
3. What was agreed
4. Next actions for both sides (add the dates if they were spoken)
5. Points to confirm, and materials to send
6. The next meeting (if it came up)

## Step 3: Write the draft

Unless told otherwise, write in the language used in the meeting, because the email goes to the counterpart. When that is unclear, use the language the user writes in. If the user asks for another language, use it. Output:

```text
件名: <短く具体的に。打ち合わせの話題を入れる>

<本文>
```

Mark the places the user has to fill in (recipient names you do not know, attachments, signature) with `[ ]`. For an English email, use `Subject:` and a plain business form (greeting, thanks, recap, next steps, closing, `[Signature]`). For a Japanese business email, follow the usual form: 「<会社名> <氏名>様」 (company name and name with the honorific), 「お世話になっております。<自社名>の<氏名>です。」 (opening greeting), the closing 「引き続きどうぞよろしくお願いいたします。」, and a signature placeholder `[署名]`.

## Rules

- **Do not make new promises.** Include only promises that were actually made in the meeting. Do not add a discount, date or deliverable that nobody agreed to.
- **Do not include internal matters.** Do not include statements made inside our own company, internal opinions about the recipient, or off-the-record talk.
- Keep names, numbers and dates exactly as spoken. For anything unclear, do not guess: either write it as a question in the email (「〜をご確認いただけますでしょうか」) or tell the user.
- Keep it short. Most follow-up emails fit in about 10 to 15 lines.

After the draft, state in one line what you deliberately left out, so that the user can judge (for example: 「外したもの:お客様が退席したあとの社内の話」).
