"""ai-voice-talk-analysis/scripts/talk_analysis.py の単体テスト。

架空の短い会話を入力にし、期待値は手で計算した数字と比べる。
実行: treasure-ai-voice フォルダで `python3 -m unittest discover -s tests -v`
"""
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "ai-voice-talk-analysis" / "scripts" / "talk_analysis.py"

# 秒単位の架空の会話。期待値は下のテストの説明どおり手で計算している。
#   S1(自社) 0.0-10.0 / C1(顧客) 10.5-20.0 / S1 23.5-30.0 / C1 29.0-35.0 / O1(other) 35.5-38.0 / S1 38.5-40.0
SAMPLE = {
    "title": "A社 初回ヒアリング",
    "unit": "s",
    "speakers": [
        {"id": "S1", "name": "佐藤", "side": "self"},
        {"id": "C1", "name": "田中", "side": "customer"},
        {"id": "O1", "name": "X氏", "side": "other"},
    ],
    "segments": [
        {"speaker": "S1", "start": 0.0, "end": 10.0},
        {"speaker": "C1", "start": 10.5, "end": 20.0},
        {"speaker": "S1", "start": 23.5, "end": 30.0},
        {"speaker": "C1", "start": 29.0, "end": 35.0},
        {"speaker": "O1", "start": 35.5, "end": 38.0},
        {"speaker": "S1", "start": 38.5, "end": 40.0},
    ],
}


def load_module():
    """スクリプトを新しいモジュールとして読む(テストどうしで状態を持ち越さないため)。"""
    spec = importlib.util.spec_from_file_location("talk_analysis", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TalkTestCase(unittest.TestCase):
    def setUp(self):
        self.mod = load_module()
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def write_input(self, data, name="input.json"):
        path = Path(self.tmp.name) / name
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        return path

    def analyze(self, data):
        d, cfg, order, segs = self.mod.load(self.write_input(data))
        m = self.mod.metrics(segs, {s: cfg[s]["side"] for s in cfg})
        return d, cfg, order, m, self.mod.summary(d, cfg, order, m)


class SampleMetricsTest(TalkTestCase):
    """SAMPLE の期待値(手計算)。

    - 発話量: S1 = 10 + 6.5 + 1.5 = 18.0 秒、C1 = 9.5 + 6 = 15.5 秒、O1 = 2.5 秒
    - 自社側と顧客側だけで100%にする: 18 / 33.5 = 53.7% → 54、15.5 / 33.5 = 46.3% → 46
    - 沈黙: 20.0 から 23.5 まで 3.5 秒(3秒以上) → 1回
    - 被り: 29.0 に始まった C1 が、前の S1(〜30.0)より前に始まる → 1回
    - ラリー: other を飛ばして並べると S1,C1,S1,C1,S1 → 切り替わり 4回
    - 発話の回数: S1 は3回(10, 6.5, 1.5 秒)、C1 は2回(9.5, 6 秒)
    """

    def setUp(self):
        super().setUp()
        self.d, self.cfg, self.order, self.m, self.summary = self.analyze(SAMPLE)

    def test_total_is_the_last_end_time(self):
        self.assertEqual(self.m["total"], 40000)

    def test_talk_time_per_speaker(self):
        self.assertEqual(self.m["talk"], {"S1": 18000, "C1": 15500, "O1": 2500})

    def test_side_share_leaves_out_other(self):
        self.assertEqual(self.summary["side_share_pct"], {"self": 54, "customer": 46})

    def test_silence_is_a_gap_of_three_seconds_or_more(self):
        self.assertEqual(self.m["sil_list"], [(20000, 23500)])

    def test_overlap_when_the_next_side_starts_before_the_previous_ends(self):
        self.assertEqual(self.m["ov_list"], [29000])

    def test_rally_counts_side_switches_and_skips_other(self):
        self.assertEqual(self.m["rally"], 4)

    def test_turns_per_speaker(self):
        s1 = next(s for s in self.summary["speakers"] if s["id"] == "S1")
        c1 = next(s for s in self.summary["speakers"] if s["id"] == "C1")
        self.assertEqual((s1["turns"], s1["longest_turn_ms"]), (3, 10000))
        self.assertEqual((c1["turns"], c1["longest_turn_ms"]), (2, 9500))

    def test_share_per_speaker_uses_all_speakers(self):
        shares = {s["id"]: s["share_pct"] for s in self.summary["speakers"]}
        self.assertEqual(shares, {"S1": 50.0, "C1": 43.1, "O1": 6.9})


class TurnTest(TalkTestCase):
    def test_short_pause_by_the_same_speaker_stays_one_turn(self):
        data = {
            "speakers": [{"id": "S1", "side": "self"}, {"id": "C1", "side": "customer"}],
            "segments": [
                {"speaker": "S1", "start": 0, "end": 5},
                {"speaker": "S1", "start": 6.5, "end": 9},  # 1.5 秒の間は同じ発話
            ],
            "unit": "s",
        }
        *_, summary = self.analyze(data)
        s1 = summary["speakers"][0]
        self.assertEqual((s1["turns"], s1["longest_turn_ms"]), (1, 9000))

    def test_pause_of_three_seconds_starts_a_new_turn(self):
        data = {
            "speakers": [{"id": "S1", "side": "self"}],
            "segments": [
                {"speaker": "S1", "start": 0, "end": 5},
                {"speaker": "S1", "start": 9, "end": 12},  # 4 秒の間は別の発話
            ],
            "unit": "s",
        }
        *_, summary = self.analyze(data)
        self.assertEqual(summary["speakers"][0]["turns"], 2)


class MergeTest(TalkTestCase):
    def test_merged_speaker_counts_as_the_target_and_joins_its_turn(self):
        data = {
            "unit": "s",
            "speakers": [
                {"id": "S1", "side": "self"},
                {"id": "C1", "name": "田中", "side": "customer"},
                {"id": "S2", "merge_into": "C1"},  # 同じ人が別の端末で録音した
            ],
            "segments": [
                {"speaker": "S1", "start": 0, "end": 10},
                {"speaker": "C1", "start": 10.5, "end": 20},
                {"speaker": "S2", "start": 21, "end": 25},  # 1 秒の間で C1 の発話に続く
            ],
        }
        _, cfg, order, m, summary = self.analyze(data)
        self.assertNotIn("S2", order)
        self.assertEqual(m["talk"]["C1"], 9500 + 4000)
        c1 = next(s for s in summary["speakers"] if s["id"] == "C1")
        self.assertEqual((c1["turns"], c1["longest_turn_ms"]), (1, 14500))
        self.assertEqual(m["rally"], 1)  # S1 → C1 の1回だけ。S2 は C1 と同じ側


class UnitTest(TalkTestCase):
    def test_milliseconds_give_the_same_numbers_as_seconds(self):
        ms = json.loads(json.dumps(SAMPLE))
        ms["unit"] = "ms"
        for seg in ms["segments"]:
            seg["start"] = round(seg["start"] * 1000)
            seg["end"] = round(seg["end"] * 1000)
        _, _, _, m_s, summary_s = self.analyze(SAMPLE)
        _, _, _, m_ms, summary_ms = self.analyze(ms)
        self.assertEqual(m_ms["talk"], m_s["talk"])
        self.assertEqual(m_ms["sil_list"], m_s["sil_list"])
        self.assertEqual(summary_ms["side_share_pct"], summary_s["side_share_pct"])


class InputErrorTest(TalkTestCase):
    def assert_rejected(self, data, message):
        with self.assertRaisesRegex(SystemExit, message):
            self.mod.load(self.write_input(data))

    def base(self, **changes):
        data = json.loads(json.dumps(SAMPLE))
        data.update(changes)
        return data

    def test_unit_must_be_s_or_ms(self):
        self.assert_rejected(self.base(unit="min"), "unit")

    def test_speaker_id_must_be_unique(self):
        data = self.base()
        data["speakers"].append({"id": "S1", "side": "self"})
        self.assert_rejected(data, "2回")

    def test_speaker_needs_a_side_unless_merged(self):
        data = self.base()
        data["speakers"].append({"id": "S2"})
        self.assert_rejected(data, "side")

    def test_side_must_be_self_customer_or_other(self):
        data = self.base()
        data["speakers"][1]["side"] = "unknown"
        self.assert_rejected(data, "self / customer / other")

    def test_every_segment_speaker_must_be_listed(self):
        data = self.base()
        data["segments"].append({"speaker": "S9", "start": 41, "end": 42})
        self.assert_rejected(data, "speakers にありません")

    def test_end_before_start_is_rejected(self):
        data = self.base()
        data["segments"][0] = {"speaker": "S1", "start": 10, "end": 5}
        self.assert_rejected(data, "end が start より前")

    def test_non_numeric_time_is_rejected(self):
        data = self.base()
        data["segments"][0]["start"] = "0:10"
        self.assert_rejected(data, "数値ではありません")

    def test_merge_cycle_is_rejected(self):
        data = self.base()
        data["speakers"] = [
            {"id": "S1", "merge_into": "C1"},
            {"id": "C1", "merge_into": "S1"},
        ]
        self.assert_rejected(data, "循環")

    def test_merge_target_must_be_listed(self):
        data = self.base()
        data["speakers"].append({"id": "S2", "merge_into": "Z9"})
        self.assert_rejected(data, "merge_into")

    def test_empty_segments_are_rejected(self):
        self.assert_rejected(self.base(segments=[]), "segments が空です")


class RenderTest(TalkTestCase):
    def test_speaker_names_are_html_escaped(self):
        data = self.base_with_name("<img src=x onerror=alert(1)>")
        d, cfg, order, m, _ = self.analyze(data)
        html = self.mod.render(d, cfg, order, m)
        self.assertIn("&lt;img", html)
        self.assertNotIn("<img src=x", html)

    def test_page_is_a_single_html_document(self):
        d, cfg, order, m, _ = self.analyze(SAMPLE)
        html = self.mod.render(d, cfg, order, m)
        self.assertTrue(html.lstrip().lower().startswith("<!doctype html>"))

    def base_with_name(self, name):
        data = json.loads(json.dumps(SAMPLE))
        data["speakers"][1]["name"] = name
        return data

    def base(self):
        return json.loads(json.dumps(SAMPLE))


class CommandLineTest(TalkTestCase):
    def run_script(self, data):
        out = Path(self.tmp.name) / "talk-analysis.html"
        proc = subprocess.run(
            [sys.executable, str(SCRIPT), str(self.write_input(data)), str(out)],
            capture_output=True, text=True, encoding="utf-8",
        )
        return proc, out

    def test_writes_the_page_and_prints_the_numbers(self):
        proc, out = self.run_script(SAMPLE)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        summary = json.loads(proc.stdout)
        self.assertEqual(summary["side_share_pct"], {"self": 54, "customer": 46})
        self.assertEqual((summary["silences"], summary["overlaps"], summary["rallies"]), (1, 1, 4))
        self.assertTrue(out.exists())

    def test_bad_input_exits_with_an_error_message(self):
        data = json.loads(json.dumps(SAMPLE))
        data["unit"] = "min"
        proc, _ = self.run_script(data)
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("ERROR:", proc.stderr)


if __name__ == "__main__":
    unittest.main()
