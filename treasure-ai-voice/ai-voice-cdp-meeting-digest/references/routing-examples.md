# Meeting digest routing examples

Choose this skill for a **multi-meeting digest** when the user explicitly names CDP/exported data, requests organization-wide or multi-recorder meeting coverage, or needs joins to other Treasure Data tables. A period alone does not imply CDP. A customer/deal-status report or personal review is not automatically a meeting digest. Preserve an explicit source constraint; if the routed skill cannot honor it, explain the mismatch rather than silently changing sources.

| Request (English / Japanese) | Route and first step |
|---|---|
| “Summarize last month's meetings.” / 「先月の会議をまとめて」 | `ai-voice-analysis` by default. A calendar period alone does not establish exported-data or multi-user intent. |
| “Which action items from my weekly meetings are still open?” / 「自分の定例の宿題で終わっていないものは？」 | `ai-voice-analysis` unless CDP/exported tables or broader coverage is explicitly requested. |
| “Use the AI Voice export in `aiv_export` to digest my October meetings.” / 「`aiv_export` のAI Voiceエクスポートで、自分の10月の会議をまとめて」 | This skill. Explicit CDP/export intent can cover the user's own recordings. Preview only their metadata, then confirm organization/IDs. |
| “List this month's decisions across our team's recorded meetings, including other recorders.” / 「ほかのメンバーが録音した会議も含めて、チームの今月の決定事項を一覧にして」 | This skill if authorized exported coverage is available. Establish organization/access context, preview requested recorders' metadata, and wait for exact ID confirmation. A team name is not a populated `team_id` filter. |
| “Digest exported meetings and join them to our CDP project reference table.” / 「エクスポートした会議をCDPのプロジェクト表と突き合わせてまとめて」 | This skill for the digest. First establish and confirm the recording set; a join cannot expand it or establish authorization. Verify join keys separately. |
| “Make minutes for this one recording.” / 「この1件の議事録を作って」 | `ai-voice-meeting-minutes`, not a cross-period digest. If a CDP-only source is explicitly required, explain the dedicated skill's source limits before proceeding. |
| “What's the current status of the Acme deal, and what should I do next?” / 「Acme案件の現状と次にやることを整理して」 | `ai-voice-analysis`, even when the evidence spans several meetings. The goal is deal status, not a period digest. Do not reinterpret a deal/customer as an organization-wide scope. |
| “Review my recent conversations and prepare my manager report.” / 「最近の自分の会話を振り返って上司向けに報告を作って」 | `ai-voice-analysis`; a manager audience does not itself request multi-user CDP coverage. |

## CDP scope and confirmation examples

**Input:** “All of October, including everyone else's meetings.” / 「10月全部。ほかの人の会議も含めて」

**Expected behavior:** The period and multi-user intent select the metadata preview, not permission to read content. Verify applicable access first. Show the organization plus exact recording IDs, dates, recorders, durations and statuses from `recordings`, without inferred titles. Ask the user to confirm the displayed IDs and wait. Database read permission and this selection confirmation do not by themselves prove per-recording authorization.

**Input:** “For the October digest, also check whether the tasks were finished in November.” / 「10月の会議の宿題が11月に終わったかも確認して」

**Expected behavior:** Label October candidates `target` and bounded November candidates `followup` in metadata-only previews. Confirm both sets explicitly before content reads. If November candidates are proposed later, reconfirm the additions; never search all November summaries because the series name looks similar.

**Input:** “Only include the weekly project meeting.” / 「プロジェクト定例だけでいい」

**Expected behavior:** Use recorder/date/tags for the pre-confirmation metadata selection. An inferred title is content, including `recordings.inferred_name`. If title-based refinement is necessary, first confirm a bounded metadata-backed set, then refine only within it. Do not read summaries or inferred names merely to decide which other people's recordings to propose.

**Input:** “Include this long recording even if its metadata is missing.” / 「メタデータがなくても、この長時間録音を入れて」

**Expected behavior:** Do not broaden or query orphan summaries/transcripts. Explain that the workflow cannot establish ownership/scope for it from exported metadata, so it remains excluded. Ask for the approved access/metadata remediation path if necessary; confirmation alone does not fix the missing boundary.

**Input:** “The selected call started at 23:59 on the last day.” / 「選んだ通話は最終日の23:59開始です」

**Expected behavior:** Select by recording start in the stated time zone, but retrieve its approved transcript through the metadata-backed duration. Keep relevant context after midnight. Do not read other calls that happen inside the expanded segment partition window.
