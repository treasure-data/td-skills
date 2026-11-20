# Treasure AI Voice Skills

Skills that turn Treasure AI Voice recordings into meeting minutes, sales call notes, follow-up email drafts, daily reports, and reports on the AI Voice data exported to Treasure Data CDP. They are written for people who are not necessarily technical: the user describes the meeting or period, and the skill finds the recordings.

Install:

```
/plugin marketplace add https://github.com/treasure-data/td-skills
/plugin install treasure-ai-voice@td-skills
```

## Skills

The skills read AI Voice data in one of two ways, and each way has its own permission.

**Connector skills** read recordings through the Treasure AI Voice connector. They can read only what the user's AI Voice permission allows.

| Skill | Output |
|---|---|
| `ai-voice-analysis` | Answers and reports that no dedicated skill covers (status reports for a manager on a customer, deal, or project; customer or deal histories; product feedback). Also holds the shared rules for finding and reading recordings, which the other connector skills follow |
| `ai-voice-meeting-minutes` | Minutes of one meeting |
| `ai-voice-sales-call-notes` | A note for a CRM (sales call) or a customer service log (store or event visit) |
| `ai-voice-followup-email` | A thank-you and follow-up email draft. It is never sent |
| `ai-voice-daily-report` | A daily or weekly report from the user's own recordings, including the user's own activity report to a manager |
| `ai-voice-talk-analysis` | One HTML page with talk share, silences, overlaps, and back-and-forth turns of one call |

**CDP skills** read the tables that AI Voice exports to Treasure Data CDP. They can be used by anyone with read permission on the export database, and their scope is the data that permission covers.

| Skill | Output |
|---|---|
| `ai-voice-cdp-table-guide` | What the four exported tables contain, and queries for the user's question |
| `ai-voice-cdp-meeting-digest` | A digest of the meetings in a period, with action items that are still open |
| `ai-voice-cdp-usage-report` | Recordings and hours per person and device, unused devices, failed recordings |

**Which way a request goes.** Connector skills are the default. A CDP skill is used only when the request needs organization-wide statistics, the exported tables themselves, or a join with other Treasure Data tables. Saying that a report is 「管理者向け」 (for managers) is not enough on its own. For reports to a manager, route by what the report is about: the user's own activity goes to `ai-voice-daily-report`; a customer, deal, or project goes to `ai-voice-analysis`; several people or the whole organization goes to the CDP skills, which need read permission on the export database. When the connector is not available and the CDP export is, `ai-voice-analysis` offers a CDP alternative: the meeting digest for several meetings, and the exported tables for one meeting.

## Requirements

- Connector skills: the Treasure AI Voice connector is connected in Treasure AI Studio or Treasure Work.
- CDP skills: AI Voice export to Treasure Data CDP is set up, the user can read the export database, and `tdx` is available.
- `ai-voice-talk-analysis`: `python3` (3.8 or later) runs its standard-library-only script.

## Behavior that the skills keep

Change these only after the maintainers and the PM agree, and update this section in the same pull request.

- **Own recordings by default.** A skill opens a recording made by someone else only after the user confirms it. Counts that use metadata only, without opening transcripts, do not need this confirmation.
- **Per-person and per-device numbers are not for evaluation.** `ai-voice-talk-analysis` and `ai-voice-cdp-usage-report` add one line in the chat saying that the numbers are for understanding usage and improving work, and that using them to evaluate people needs a separate agreement inside the customer's organization.
- **Time zone.** Dates and times are shown in `Asia/Tokyo` unless the user names another time zone, which is then used for the rest of the conversation.
- **Output language.** Output is written in the language the user writes in. An explicit request for another language takes priority. Two exceptions:
  - `ai-voice-followup-email` writes in the language used in the meeting, because the email goes to the counterpart. It falls back to the user's language when the meeting language is unclear.
  - The page from `ai-voice-talk-analysis` supports only Japanese and English. It uses Japanese when the user writes in Japanese and English otherwise; the chat reply is in the user's language.

  Every skill also writes its first line in the user's language, without a lead-in in another language.
- **Read only.** The skills do not send email, post files, or write to CRM systems. The user does the sharing.
- **CDP and teams.** The CDP skills count people by `user_email`. `team_id` is not used until it is populated, and team permissions are not handled in CDP.

The `description` fields are in English and list Japanese example requests, so that requests in either language select the skill. Several descriptions also say which neighboring skill to use instead. The SKILL.md bodies and references are in English. The output templates are in Japanese and are translated at run time.

## Known limitations

- In Treasure AI Studio, a short request such as 「お礼メールを書いて」 or 「直近の会議をまとめて」 did not always select a skill; adding 「AI Voice の録音から」 made it work. The descriptions now list such short requests as examples. Re-check this in Studio before removing the note.
- Treasure AI Studio has two list operations. `ai_voice.list_my_recordings` returns the caller's own recordings and is the default. `ai_voice.list_organization_recordings` is for ENTERPRISE_ADMIN users; for anyone else it silently returns their own recordings, so its response alone does not show which happened.
- The list operations filter by `q` (a case-sensitive substring of owner email, owner name, and inferred title), `tag`, `status`, `deviceSessionId`, and `deviceSerialNumber`. They have no date or `externalMetadata` filter, so the skill filters those on the returned records. A keyword search therefore covers titles, previews, and summaries, not full transcripts.
- Recordings longer than about 3 hours may have no row in the exported `recordings` table. Their `summaries` row is still there. The CDP skills do not cover them.
- Treasure AI Studio has no confirmed operation for checking the connected organization, so that check is skipped there.
- If another AI Voice plugin is installed in the same environment, a request can match skills in both plugins. Check which skill is selected for follow-up email and customer history requests.

## What to check when something outside this plugin changes

| When this changes | Update | Then test |
|---|---|---|
| Connector operation names or response fields | The table in `ai-voice-analysis/SKILL.md`, and the connector skills that rely on the fields | Every connector skill in Studio and Treasure Work |
| Connector operation names or response fields (detail) | `ai-voice-analysis/reference/tool-notes.md` | Same as above |
| The exported table schema | `ai-voice-cdp-table-guide/references/schema.md` and `queries.md`, and the column lists in each CDP skill | Every CDP skill |
| A new skill is added to the td-skills marketplace | Nothing, unless its description overlaps | `./tests/run-tests.sh` |

## Testing

Run the checks below before a pull request that changes a skill, and write the results in the pull request. Use only made-up recordings and data. Do not commit real recordings, customer names, or generated outputs, because this repository is public.

1. **Trigger tests** check which skill a request selects. The AI Voice cases are in `tests/trigger-tests.yml` at the repository root, with Japanese and English requests for every skill and pairs of skills that are easy to confuse. Run `CLAUDE_CONFIG_DIR=$(mktemp -d) ./tests/run-tests.sh --verbose`; it needs the `claude` CLI and `yq`. The fresh `CLAUDE_CONFIG_DIR` matters: the runner calls Claude Code, which loads the skills installed for the user, so without it an installed AI Voice skill (for example `ai-voice-customer-history-summary`) can be chosen instead of the expected one. Routing results for this revision are recorded in the PR; they do not replace behavior tests. The runner always picks one skill, so a passing test does not prove that a short request selects the skill in Studio (see Known limitations).
2. **Unit tests** check the numbers and the input checks of `talk_analysis.py`. They are in `tests/`, outside the skill folders, so they are not installed with the skills. Run `python3 -m unittest discover -s tests -v` from the `treasure-ai-voice` folder. They use only the standard library and made-up data, and the expected values are worked out by hand in the test files. The output-language tests in the same folder check that a Japanese request gives a Japanese page, and an English request gives an English page.
3. **Manual check in Treasure AI Studio** checks reading through the connector or CDP and the output. Run one request per skill and record the date, the Studio version, and the result.
4. **Japanese-output check (manual; calls the model).** `evals/japanese_output/run_eval.py` runs each skill on a Japanese request with made-up connector data, then lists the English words in the output. It makes about 11 model calls, so run it when a skill's output instructions change. Choose the model with `EVAL_MODEL` (default `opus`). Outputs go to `evals/japanese_output/out/`, which is git-ignored.

| Skill | Request to try | Check |
|---|---|---|
| `ai-voice-analysis` | 「AI Voice の録音から、A社の商談の状況を上長に報告できる形でまとめて」 | Groups by customer, separates facts from suggested actions, and cites evidence |
| `ai-voice-meeting-minutes` | 「AI Voice の録音から、さっきの会議の議事録を作って」 | Asks about unnamed speakers; decisions and action items have owners and due dates or say they were not stated |
| `ai-voice-sales-call-notes` | 「AI Voice の録音から、A社との商談メモを作って」 | Fields that did not come up say so; important facts have times in the recording |
| `ai-voice-followup-email` | 「AI Voice の録音から、A社との打ち合わせのお礼メールを書いて」 | Uses the meeting language; is not sent |
| `ai-voice-daily-report` | 「今日の AI Voice の録音から日報を書いて」 | Uses only the user's own recordings; 「上長への申し送り」 contains only requests and deadlines spoken in the recordings |
| `ai-voice-talk-analysis` | 「AI Voice の録音から、さっきの商談の話した量を見せて」 | `python3` runs; asks which side each speaker is on; adds the line about evaluation |
| `ai-voice-cdp-table-guide` | 「AI Voice のエクスポートデータの recordings テーブルには何が入っている?」 | Finds the export database; queries run |
| `ai-voice-cdp-meeting-digest` | 「AI Voice のエクスポートデータから、先月の会議をまとめて」 | Every action item appears once with a status |
| `ai-voice-cdp-usage-report` | 「AI Voice の利用状況を出して」 | Counts people by `user_email`; adds the line about evaluation |

Also repeat at least one request in English and confirm that the output is in English.

## Maintenance

- **Maintainers:** the JP SA team maintains these skills. The PM is accountable for them.
- **Bugs and requests:** open a GitHub issue in this repository and include the skill name, the environment (Treasure AI Studio or Treasure Work), the request, and what happened. Do not paste transcripts or customer data.
- **Changes:** open a pull request with the test results above. Studio and `tdx` read the stable channel, so a merged change reaches users after a maintainer of this repository tags a release and promotes it to stable.
