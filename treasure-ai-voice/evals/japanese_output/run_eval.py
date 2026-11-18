"""Run each AI Voice skill on a Japanese request (plus English controls) and measure the output language.

Tools are disabled, so each run starts from data that the connector would have returned (made-up).
The output of each run is saved under out/, and a summary lists the English words found.
This calls the model about 12 times, so it is a manual check, not a unit test.
Requires the `claude` CLI on PATH and an authenticated session. Choose the model with EVAL_MODEL (default: opus).
Run from the treasure-ai-voice folder: python3 evals/japanese_output/run_eval.py
Re-analyse saved outputs without calling the model: python3 evals/japanese_output/run_eval.py --analyze-only
"""
import concurrent.futures
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "out"
MODEL = os.environ.get("EVAL_MODEL", "opus")

PREAMBLE = """You are running the skill below for an evaluation. The Treasure AI Voice connector and all other tools are NOT available in this run.
The data in the user message is what the tools already returned. The user has already answered every question the skill would ask (speaker names, which meeting, which period), so do not ask questions.
Produce the final deliverable now, following the skill's instructions and output format exactly. Write only the deliverable or reply, with no preamble."""

TRANSCRIPT_JA = """録音: A社 定例ミーティング(2026-11-17 14:00〜14:32、録音の所有者: 佐藤)
話者(確認済み): Speaker 1 = 佐藤(自社)、Speaker 2 = 田中(A社)、Speaker 3 = 鈴木(A社)

[00:00] Speaker 1: 本日は、先週の宿題の確認と、見積もりの話をしましょう。
[00:20] Speaker 2: 先週お願いした導入範囲の資料は確認しました。見積もりは、来週の水曜までに社内で確認します。
[01:10] Speaker 3: 予算は今期中に決めたいです。ただ、来月の定例でもう一度相談させてください。
[02:30] Speaker 1: 承知しました。導入の範囲は、まず営業部だけにしませんか。
[03:05] Speaker 2: はい、それで進めましょう。営業部からです。決定にしてください。
[04:00] Speaker 1: 次回までに、料金の比較表を私が作って送ります。来週の金曜までに。
[05:20] Speaker 3: 社内のセキュリティ審査が必要かどうかは、まだ分かりません。確認します。
[06:00] Speaker 2: 次の定例は12月1日の午後でどうでしょう。"""

TRANSCRIPT_EN = """Recording: Customer A weekly meeting (2026-11-17 14:00-14:32, owner: Sato)
Speakers (confirmed): Speaker 1 = Sato (our side), Speaker 2 = Tanaka (Customer A), Speaker 3 = Suzuki (Customer A)

[00:00] Speaker 1: Today let's review last week's action items and talk about the estimate.
[00:20] Speaker 2: We reviewed the scope document. We will check the estimate internally by next Wednesday.
[01:10] Speaker 3: We want to decide the budget this fiscal year, but please let us discuss it again at next month's meeting.
[02:30] Speaker 1: Understood. Shall we start with only the sales department?
[03:05] Speaker 2: Yes, let's do that. Please record it as a decision: sales department first.
[04:00] Speaker 1: I will prepare a price comparison table and send it by next Friday.
[05:20] Speaker 3: We are not sure yet whether a security review is needed. We will check.
[06:00] Speaker 2: How about the next weekly meeting on the afternoon of December 1?"""

DAILY_JA = """今日の録音(本人の録音のみ、一覧と要約):
- 10:00-10:45 A社 定例ミーティング: 見積もりの確認。導入範囲は営業部から。料金の比較表を佐藤が来週金曜までに送る。
- 13:30-13:50 B社 電話: 納期の問い合わせ。回答は明日。
- 16:00-16:20 社内レビュー: 資料の修正点を確認。
含まれない録音: 15:00 の録音(処理中)"""

ANALYSIS_EXTRA_JA = """前回の録音(2026-11-10)の要約: 初回ヒアリング。課題は在庫管理の手作業。担当は佐藤、導入の検討は未定。"""

MEETINGS_JA = """エクスポートデータからの結果(会議、宿題、決定事項):
会議1: 2026-10-06 A社 定例 / 録音者: 佐藤 / 宿題: 見積もりを作る(担当: 佐藤、期限: 10/13)、状態: 完了を確認(10/20の会議で「送りました」と発言)
会議2: 2026-10-20 A社 定例 / 決定: 導入の範囲は営業部から / 宿題: セキュリティ資料の確認(担当: 鈴木、期限なし)、状態: その後言及なし
会議3: 2026-10-27 社内 定例 / 宿題: 採用面接の日程調整(担当: 田中)、状態: 未完了(本人が「まだです」と発言)"""

USAGE_JA = """エクスポートデータからの結果(人ごと・端末ごと、期間: 2026-10-01 〜 2026-10-31):
人: 佐藤 (sato@example.com): 録音 42 件、合計 9.5 時間、最後に録音 2026-10-30
人: 田中 (tanaka@example.com): 録音 18 件、合計 4.0 時間、最後に録音 2026-10-29
人: 鈴木 (suzuki@example.com): 録音 3 件、合計 0.8 時間、最後に録音 2026-10-12
端末: SN-0001 割り当て: 佐藤 / 最終同期 2026-10-30 / 期間中の録音 42 件
端末: SN-0002 割り当て: なし / 最終同期 2026-09-15 / 期間中の録音 0 件
端末: SN-0003 割り当て: なし / 最終同期 2026-10-02 / 期間中の録音 0 件
失敗した録音: 2 件、処理中の録音: 1 件
週ごと: 10/05 週 14 件、10/12 週 9 件、10/19 週 21 件、10/26 週 19 件"""

TALK_SUMMARY_JA = """スクリプトの実行が完了しました。標準出力のJSONサマリー:
{"side_share_pct": {"self": 43, "customer": 57}, "silences": 6, "overlaps": 6, "rallies": 86, "segments": 120}
ページのファイル名: talk-analysis-2026-11-18-A社_初回ヒアリング.html
ユーザーが日本語で依頼しています。SKILL の手順 4 に従って返信を書いてください。"""

HARASSMENT_SUMMARY_JA = """スクリプトの実行が完了しました。標準出力のJSON:
{"suspected": 3, "analyzed": 120, "severity": {"1": 1, "2": 1, "3": 1}, "by_type": {"暴言・侮辱": 2, "長時間の拘束・繰り返し": 1}, "unjudged": 0, "excluded": 4, "output": "harassment-report-2026-11-18.html"}
ユーザーが日本語で依頼しています。SKILL の手順 5 に従って返信を書いてください。"""

USAGE_EN = """Results from the export (per person and per device, period 2026-10-01 to 2026-10-31):
Person: Sato (sato@example.com): 42 recordings, 9.5 hours in total, last recording 2026-10-30
Person: Tanaka (tanaka@example.com): 18 recordings, 4.0 hours in total, last recording 2026-10-29
Person: Suzuki (suzuki@example.com): 3 recordings, 0.8 hours in total, last recording 2026-10-12
Device: SN-0001 assigned to Sato, last sync 2026-10-30, 42 recordings in the period
Device: SN-0002 unassigned, last sync 2026-09-15, 0 recordings in the period
Failed recordings: 2. Still processing: 1."""

SCHEMA = (ROOT / "ai-voice-cdp-table-guide/references/schema.md").read_text(encoding="utf-8")


def skill(name):
    return (ROOT / name / "SKILL.md").read_text(encoding="utf-8")


CASES = [
    # name, language expected, skill, system extras, user message
    ("minutes", "ja", "ai-voice-meeting-minutes", "",
     "さっき録音した定例の議事録を作って。\n\n[コネクタの結果]\n" + TRANSCRIPT_JA),
    ("sales-call-notes", "ja", "ai-voice-sales-call-notes", "",
     "A社との商談メモを作って。\n\n[コネクタの結果]\n" + TRANSCRIPT_JA),
    ("followup-email", "ja", "ai-voice-followup-email", "",
     "A社との打ち合わせのお礼メールを書いて。\n\n[コネクタの結果]\n" + TRANSCRIPT_JA),
    ("analysis-manager-report", "ja", "ai-voice-analysis", "",
     "A社の商談の状況を上長に報告できる形でまとめて。\n\n[コネクタの結果]\n" + TRANSCRIPT_JA + "\n\n" + ANALYSIS_EXTRA_JA),
    ("daily-report", "ja", "ai-voice-daily-report", "",
     "今日の録音から日報を書いて。\n\n[コネクタの結果]\n" + DAILY_JA),
    ("cdp-table-guide", "ja", "ai-voice-cdp-table-guide", "\n\n# Reference: schema.md\n" + SCHEMA,
     "AI Voiceのエクスポートデータで、recordingsテーブルには何が入っている？"),
    ("cdp-meeting-digest", "ja", "ai-voice-cdp-meeting-digest", "",
     "先月の会議をまとめて。\n\n[クエリの結果]\n" + MEETINGS_JA),
    ("cdp-usage-report", "ja", "ai-voice-cdp-usage-report", "",
     "AI Voiceの利用状況を出して。\n\n[クエリの結果]\n" + USAGE_JA),
    ("talk-analysis-reply", "ja", "ai-voice-talk-analysis", "",
     "さっきの商談の話した量を見せて。\n\n[スクリプトの結果]\n" + TALK_SUMMARY_JA),
    ("harassment-reply", "ja", "ai-voice-cdp-harassment-dashboard", "",
     "先月のカスハラの疑いがある録音を探して。\n\n[スクリプトの結果]\n" + HARASSMENT_SUMMARY_JA),
    # English controls
    ("en-minutes", "en", "ai-voice-meeting-minutes", "",
     "Write the minutes for the meeting I just recorded.\n\n[Connector result]\n" + TRANSCRIPT_EN),
    ("en-cdp-usage", "en", "ai-voice-cdp-usage-report", "",
     "Show me the AI Voice usage report for last month.\n\n[Query result]\n" + USAGE_EN),
]

JP = re.compile(r"[぀-ヿ㐀-鿿]")
HTML_FENCE = re.compile(r"```html\s*\n(.*?)```", re.S | re.I)
CODE = re.compile(r"```.*?```", re.S)
STYLE = re.compile(r"<(style|script)\b.*?</\1>", re.S | re.I)
INLINE = re.compile(r"`[^`\n]*`")
URL = re.compile(r"https?://\S+")
TAG = re.compile(r"<[^>]+>")
ENG = re.compile(r"\b[A-Za-z][A-Za-z'\-]{2,}\b")


def visible_part(text):
    """Text the reader sees: drop code blocks, inline code, URLs, and HTML tags (keep HTML text)."""
    t = HTML_FENCE.sub(r"\1", text)  # HTML wrapped in a fence is the deliverable: keep its text
    t = STYLE.sub(" ", t)
    t = CODE.sub(" ", t)  # other fenced blocks (SQL, code) are not prose
    t = INLINE.sub(" ", t)
    t = URL.sub(" ", t)
    t = TAG.sub(" ", t)
    return t


def run_case(case):
    name, lang, skill_dir, extra, user = case
    system = PREAMBLE + "\n\n# SKILL: " + skill_dir + "\n\n" + skill(skill_dir) + extra
    with tempfile.TemporaryDirectory() as cwd:
        proc = subprocess.run(
            ["claude", "-p", user, "--system-prompt", system, "--model", MODEL,
             "--tools", "", "--disable-slash-commands"],
            cwd=cwd, capture_output=True, text=True, encoding="utf-8", timeout=900,
        )
    text = proc.stdout.strip()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.md").write_text(text + "\n", encoding="utf-8")
    return name, lang, text, proc.returncode, proc.stderr[-300:]


def analyse(lang, text):
    vis = visible_part(text)
    jp = len(JP.findall(vis))
    en_words = sorted(set(ENG.findall(vis)))
    return {"jp_chars": jp, "en_words": en_words, "lang": lang}


def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(run_case, CASES))
    print(f"model={MODEL}  outputs saved to {OUT}")
    for name, lang, text, code, err in results:
        if code or text.startswith("API Error"):
            print(f"\n## {name}: FAILED TO RUN (exit={code}): {text[:160]}")
            continue
        a = analyse(lang, text)
        print(f"\n## {name} (expected {lang}) exit={code} jp_chars={a['jp_chars']} english_words={len(a['en_words'])}")
        print("   " + ", ".join(a["en_words"]) if a["en_words"] else "   (no English words outside code)")
        if code:
            print("   stderr:", err)


def analyze_saved():
    """Re-analyse the saved outputs without calling the model again."""
    for name, lang in [(c[0], c[1]) for c in CASES]:
        path = OUT / f"{name}.md"
        if not path.exists():
            print(f"{name}: no saved output"); continue
        text = path.read_text(encoding="utf-8")
        if text.startswith("API Error"):
            print(f"{name}: FAILED TO RUN"); continue
        a = analyse(lang, text)
        print(f"\n## {name} (expected {lang}) jp_chars={a['jp_chars']} english_words={len(a['en_words'])}")
        print("   " + (", ".join(a["en_words"]) if a["en_words"] else "(none)"))


if __name__ == "__main__":
    if "--analyze-only" in sys.argv:
        analyze_saved(); sys.exit(0)
    sys.exit(main())
