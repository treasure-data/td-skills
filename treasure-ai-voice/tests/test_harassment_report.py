"""ai-voice-cdp-harassment-dashboard/scripts/harassment_report.py の単体テスト。

架空の検知結果を入力にし、件数と入力チェックを確かめる。
実行: treasure-ai-voice フォルダで `python3 -m unittest discover -s tests -v`
"""
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

SCRIPT = (
    Path(__file__).resolve().parent.parent
    / "ai-voice-cdp-harassment-dashboard" / "scripts" / "harassment_report.py"
)

# 架空の結果。候補5件のうち4件を判定、3件を「疑い」とした。
# 判定しなかった候補は 5 - 4 = 1件(未判定)。失敗・処理中は 1 + 2 = 3件(除外)。
BASE = {
    "lang": "ja",
    "period_start": "2026-11-01",
    "period_end": "2026-11-07",
    "totals": {"recordings": 20, "candidates": 5, "judged": 4, "failed": 1, "in_progress": 2},
    "findings": [
        {
            "recording_id": "r1", "date": "2026-11-02", "time": "18:03",
            "recorder": "山口 美咲", "title": "夕方の対応", "minutes": 4.4,
            "type": "暴言・侮辱", "severity": 3,
            "quote": "ふざけるな", "reason": "強い侮辱語を繰り返している",
            "context": [
                {"t": "03:12", "who": "客", "text": "ふざけるなよ"},
                {"t": "03:14", "who": "店", "text": "申し訳ございません"},
            ],
        },
        {
            "recording_id": "r2", "date": "2026-11-02", "time": "10:00",
            "recorder": "佐藤", "title": "", "minutes": 10,
            "type": "長時間の拘束・繰り返し", "severity": 1,
            "quote": "もう一回説明して", "reason": "同じ質問を繰り返している",
        },
        {
            "recording_id": "r3", "date": "2026-11-05", "time": "12:00",
            "recorder": "鈴木", "title": "レジ前", "minutes": 2,
            "type": "暴言・侮辱", "severity": 2,
            "quote": "バカにしてるのか", "reason": "侮辱的な言い方を繰り返している",
        },
    ],
}


def load_module():
    """スクリプトを新しいモジュールとして読む。LANG などの状態をテストどうしで持ち越さないため。"""
    spec = importlib.util.spec_from_file_location("harassment_report", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class HarassmentTestCase(unittest.TestCase):
    def setUp(self):
        self.mod = load_module()
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write_input(self, data, name="input.json"):
        path = Path(self.tmp.name) / name
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        return path

    def data(self, **changes):
        d = json.loads(json.dumps(BASE))
        d.update(changes)
        return d

    def finding(self, index, **changes):
        d = json.loads(json.dumps(BASE))
        d["findings"][index].update(changes)
        return d


class CountTest(HarassmentTestCase):
    def setUp(self):
        super().setUp()
        self.start, self.end, self.totals, self.rows = self.mod.load(self.write_input(BASE))
        self.by_type, self.by_sev, self.by_day = self.mod.count(self.start, self.end, self.totals, self.rows)

    def test_period_is_read_as_dates(self):
        self.assertEqual((self.start, self.end), (date(2026, 11, 1), date(2026, 11, 7)))

    def test_counts_by_type(self):
        self.assertEqual(self.by_type["暴言・侮辱"], 2)
        self.assertEqual(self.by_type["長時間の拘束・繰り返し"], 1)
        self.assertEqual(self.by_type["その他"], 0)

    def test_counts_by_severity(self):
        self.assertEqual(self.by_sev, {1: 1, 2: 1, 3: 1})

    def test_daily_trend_covers_every_day_of_the_period(self):
        self.assertEqual(len(self.by_day), 7)
        self.assertEqual(self.by_day[date(2026, 11, 1)], 0)
        self.assertEqual(self.by_day[date(2026, 11, 2)], 2)
        self.assertEqual(self.by_day[date(2026, 11, 5)], 1)

    def test_minutes_are_rounded_to_whole_minutes(self):
        self.assertEqual(self.rows[0]["minutes"], 4)

    def test_context_lines_are_kept_in_order(self):
        self.assertEqual([c[1] for c in self.rows[0]["context"]], ["客", "店"])


class MainTest(HarassmentTestCase):
    def run_script(self, data):
        out = Path(self.tmp.name) / "harassment-report.html"
        proc = subprocess.run(
            [sys.executable, str(SCRIPT), str(self.write_input(data)), str(out)],
            capture_output=True, text=True, encoding="utf-8",
        )
        return proc, out

    def test_prints_the_counts_as_json(self):
        proc, out = self.run_script(BASE)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        summary = json.loads(proc.stdout)
        self.assertEqual(summary["suspected"], 3)
        self.assertEqual(summary["analyzed"], 20)
        self.assertEqual(summary["severity"], {"1": 1, "2": 1, "3": 1})
        self.assertEqual(summary["by_type"], {"暴言・侮辱": 2, "長時間の拘束・繰り返し": 1})
        self.assertEqual(summary["unjudged"], 1)
        self.assertEqual(summary["excluded"], 3)
        self.assertTrue(out.exists())

    def test_zero_findings_still_writes_the_page(self):
        data = self.data(findings=[], totals={"recordings": 0, "candidates": 0, "judged": 0,
                                              "failed": 0, "in_progress": 0})
        proc, out = self.run_script(data)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(json.loads(proc.stdout)["suspected"], 0)
        self.assertIn("疑いのある録音はありませんでした。", out.read_text(encoding="utf-8"))

    def test_bad_input_exits_with_an_error_message(self):
        proc, _ = self.run_script(self.finding(0, type="不明"))
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("ERROR:", proc.stderr)


class RenderTest(HarassmentTestCase):
    def render(self, data):
        start, end, totals, rows = self.mod.load(self.write_input(data))
        return self.mod.render(start, end, totals, rows)

    def test_quote_and_context_are_html_escaped(self):
        html = self.render(self.finding(0, quote="<script>alert(1)</script>"))
        self.assertNotIn("<script>alert(1)", html)
        self.assertIn("&lt;script&gt;", html)

    def test_untitled_recording_is_labelled(self):
        html = self.render(BASE)
        self.assertIn("(無題)", html)

    def test_english_labels_when_lang_is_en(self):
        start, end, totals, rows = self.mod.load(self.write_input(self.data(lang="en")))
        html = self.mod.render(start, end, totals, rows)
        self.assertIn(self.mod.EN["カスハラ検知レポート"], html)
        self.assertNotIn("カスハラ検知レポート", html)


class InputErrorTest(HarassmentTestCase):
    def assert_rejected(self, data, message):
        with self.assertRaisesRegex(SystemExit, message):
            self.mod.load(self.write_input(data))

    def test_period_dates_must_be_yyyy_mm_dd(self):
        self.assert_rejected(self.data(period_start="2026/11/01"), "YYYY-MM-DD")

    def test_period_end_must_not_be_before_start(self):
        self.assert_rejected(self.data(period_start="2026-11-07", period_end="2026-11-01"), "before")

    def test_period_is_at_most_400_days(self):
        self.assert_rejected(self.data(period_end="2028-01-01"), "400 days")

    def test_lang_must_be_ja_or_en(self):
        self.assert_rejected(self.data(lang="fr"), "lang must be ja or en")

    def test_type_must_be_one_of_the_fixed_types(self):
        self.assert_rejected(self.finding(0, type="不明"), "type must be one of")

    def test_severity_must_be_1_2_or_3(self):
        self.assert_rejected(self.finding(0, severity=4), "severity")

    def test_severity_as_a_string_is_rejected(self):
        self.assert_rejected(self.finding(0, severity="3"), "severity")

    def test_finding_date_must_be_inside_the_period(self):
        self.assert_rejected(self.finding(0, date="2026-12-01"), "outside the period")

    def test_recording_id_must_be_unique(self):
        data = self.data()
        data["findings"][1]["recording_id"] = "r1"
        self.assert_rejected(data, "duplicated")

    def test_judged_cannot_exceed_candidates(self):
        data = self.data(totals={"recordings": 20, "candidates": 3, "judged": 4,
                                 "failed": 0, "in_progress": 0})
        self.assert_rejected(data, "judged is larger than candidates")

    def test_findings_cannot_exceed_judged(self):
        data = self.data(totals={"recordings": 20, "candidates": 5, "judged": 2,
                                 "failed": 0, "in_progress": 0})
        self.assert_rejected(data, "larger than judged")

    def test_context_speaker_must_be_customer_or_staff(self):
        data = self.finding(0, context=[{"t": "00:01", "who": "お客様", "text": "..."}])
        self.assert_rejected(data, "who must be 客 or 店")

    def test_context_is_at_most_12_lines(self):
        lines = [{"t": "00:01", "who": "客", "text": "..."}] * 13
        self.assert_rejected(self.finding(0, context=lines), "12 lines at most")

    def test_negative_counts_are_rejected(self):
        data = self.data(totals={"recordings": -1, "candidates": 0, "judged": 0,
                                 "failed": 0, "in_progress": 0})
        self.assert_rejected(data, "0 or more")


if __name__ == "__main__":
    unittest.main()
