"""Check that the script output follows the requested language.

With lang "ja", every visible string in the HTML page should be Japanese, except for
a short allowlist of terms that are deliberately kept in English.
With lang "en", the visible text should contain no Japanese.
Run from the treasure-ai-voice folder: python3 -m unittest discover -s tests -v
"""
import html.parser
import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TALK = ROOT / "ai-voice-talk-analysis" / "scripts" / "talk_analysis.py"
HARASSMENT = ROOT / "ai-voice-cdp-harassment-dashboard" / "scripts" / "harassment_report.py"

JAPANESE = re.compile(r"[぀-ヿ㐀-鿿]")
ENGLISH_WORD = re.compile(r"[A-Za-z][A-Za-z'\-]+")

# English terms that the Japanese page keeps on purpose (product terms, units, and file-format names).
ALLOWED_ENGLISH = {
    "Talk", "Listen",  # "Talk : Listen" is the product term shown in the Japanese KPI label
    "HTML", "CSS", "ID", "KPI", "SVG", "ai", "AI",
}


class _VisibleText(html.parser.HTMLParser):
    """Collect the text a reader sees, plus tooltip and accessibility labels."""

    def __init__(self):
        super().__init__()
        self.parts = []
        self._hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self._hidden += 1
        for key, value in attrs:
            if key in ("title", "aria-label", "alt") and value:
                self.parts.append(value)

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._hidden:
            self._hidden -= 1

    def handle_data(self, data):
        if not self._hidden and data.strip():
            self.parts.append(data)


def visible_text(page):
    parser = _VisibleText()
    parser.feed(page)
    return "\n".join(parser.parts)


def english_words(text):
    """English words in the visible text that are not on the allowlist."""
    return sorted({w for w in ENGLISH_WORD.findall(text) if w not in ALLOWED_ENGLISH})


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# ---------- talk analysis: Japanese input and English input ----------
TALK_JA = {
    "title": "A社 初回ヒアリング",
    "recorded_at": "2026-11-17 14:00",
    "lang": "ja",
    "unit": "s",
    "speakers": [
        {"id": "Speaker 1", "name": "佐藤", "side": "self"},
        {"id": "Speaker 2", "name": "田中", "side": "customer"},
        {"id": "Speaker 3", "name": "鈴木", "side": "customer"},
    ],
    "segments": [
        {"speaker": "Speaker 1", "start": 0.0, "end": 12.0},
        {"speaker": "Speaker 2", "start": 12.5, "end": 25.0},
        {"speaker": "Speaker 3", "start": 29.0, "end": 40.0},
        {"speaker": "Speaker 1", "start": 40.5, "end": 52.0},
    ],
}


def render_talk(mod, data):
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "in.json"
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        d, cfg, order, segs = mod.load(path)
        m = mod.metrics(segs, {s: cfg[s]["side"] for s in cfg})
        return mod.render(d, cfg, order, m)


# ---------- harassment report: Japanese input and English input ----------
HARASSMENT_JA = {
    "lang": "ja",
    "period_start": "2026-11-01",
    "period_end": "2026-11-07",
    "totals": {"recordings": 20, "candidates": 5, "judged": 4, "failed": 1, "in_progress": 2},
    "findings": [
        {
            "recording_id": "r1", "date": "2026-11-02", "time": "18:03",
            "recorder": "山田 太郎", "title": "夕方の対応", "minutes": 4,
            "type": "暴言・侮辱", "severity": 3,
            "quote": "ふざけるな", "reason": "侮辱的な言葉を繰り返している",
            "context": [
                {"t": "03:12", "who": "客", "text": "ふざけるなよ"},
                {"t": "03:14", "who": "店", "text": "申し訳ございません"},
            ],
        },
        {
            "recording_id": "r2", "date": "2026-11-05", "time": "12:00",
            "recorder": "佐藤 花子", "title": "", "minutes": 10,
            "type": "長時間の拘束・繰り返し", "severity": 1,
            "quote": "もう一回説明して", "reason": "同じ質問を繰り返している",
        },
    ],
}

HARASSMENT_EN = json.loads(json.dumps(HARASSMENT_JA))
HARASSMENT_EN["lang"] = "en"
HARASSMENT_EN["findings"][0].update(
    recorder="Recorder A", title="Evening service", quote="Are you serious?",
    reason="Repeated insults", context=[{"t": "03:12", "who": "客", "text": "Are you serious?"}],
)
HARASSMENT_EN["findings"][1].update(recorder="Recorder B", title="", quote="Explain it again", reason="Repeated question")


def render_harassment(mod, data):
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "in.json"
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        start, end, totals, rows = mod.load(path)
        return mod.render(start, end, totals, rows)


class TalkOutputLanguageTest(unittest.TestCase):
    def setUp(self):
        self.mod = load(TALK, "talk_analysis_lang")

    def test_japanese_input_gives_a_japanese_page(self):
        text = visible_text(render_talk(self.mod, TALK_JA))
        self.assertTrue(JAPANESE.search(text))
        self.assertEqual(english_words(text), [], "English words in a Japanese talk page")

    def test_english_input_gives_an_english_page(self):
        data = json.loads(json.dumps(TALK_JA))
        data["lang"] = "en"
        data["title"] = "Customer A: first hearing"
        data["speakers"] = [
            {"id": "Speaker 1", "name": "Alice", "side": "self"},
            {"id": "Speaker 2", "name": "Bob", "side": "customer"},
            {"id": "Speaker 3", "name": "Carol", "side": "customer"},
        ]
        text = visible_text(render_talk(self.mod, data))
        self.assertEqual(JAPANESE.findall(text), [], "Japanese text in an English talk page")


class HarassmentOutputLanguageTest(unittest.TestCase):
    def setUp(self):
        self.mod = load(HARASSMENT, "harassment_lang")

    def test_japanese_input_gives_a_japanese_page(self):
        text = visible_text(render_harassment(self.mod, HARASSMENT_JA))
        self.assertTrue(JAPANESE.search(text))
        self.assertEqual(english_words(text), [], "English words in a Japanese harassment page")

    def test_english_input_gives_an_english_page(self):
        text = visible_text(render_harassment(self.mod, HARASSMENT_EN))
        self.assertEqual(JAPANESE.findall(text), [], "Japanese text in an English harassment page")


if __name__ == "__main__":
    unittest.main()
