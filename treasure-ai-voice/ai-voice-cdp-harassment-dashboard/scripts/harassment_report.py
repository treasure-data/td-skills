#!/usr/bin/env python3
# ruff: noqa
"""Write a one-page HTML report from the results of the suspected customer-harassment (カスハラ) check
(standard library only, Python 3.8 or later).

Usage:
    python3 harassment_report.py harassment-input.json harassment-report.html

Input (JSON):
{
  "lang": "ja",                          # ja (default) or en. Language of the labels and the report
  "period_start": "2026-10-17",          # first day of the period read (left end of the daily trend)
  "period_end": "2026-11-16",            # last day of the period read
  "totals": {"recordings": 26,           # number of analyzed recordings (COMPLETED)
             "candidates": 12,           # number of recordings picked as candidates by the narrowing
             "judged": 12,               # number of those the AI judged
             "failed": 1, "in_progress": 1},   # recordings left out (failed, still processing)
  "findings": [                          # only the recordings judged "suspected"
    {"recording_id": "p1", "date": "2026-11-09", "time": "18:03",
     "recorder": "山口 美咲", "title": "...", "minutes": 4,
     "type": "暴言・侮辱", "severity": 3,
     "quote": "short excerpt of the customer's words (1-2 sentences)", "reason": "why it is suspected (1 sentence)",
     "context": [{"t": "03:12", "who": "客", "text": "one line of the conversation around it"}]}   # context is optional, up to 12 lines
  ]
}

All numbers (counts, by type, by day, ratios) are counted by this script. Never count by hand.
A mistake in the input stops the script with an error. All text is HTML-escaped.
Prints the counted result as JSON to standard output.
"""
import html
import json
import sys
from datetime import date, timedelta


LANG = "ja"

EN = {
    "暴言・侮辱": "Abuse and insults",
    "威圧・脅迫": "Intimidation and threats",
    "長時間の拘束・繰り返し": "Prolonged holding and repetition",
    "土下座・過度な要求": "Forced apology and excessive demands",
    "セクハラ・つきまとい": "Sexual remarks and stalking",
    "差別的な言動": "Discriminatory remarks",
    "その他": "Other",
    "客": "Customer",
    "店": "Staff",
    "この期間の録音 %d 件に、カスハラの疑いは見つかりませんでした。":
        "No suspected customer harassment was found in the %d recordings of this period.",
    "この期間の録音 %d 件のうち、カスハラの疑いが %d 件ありました。深刻度3は %d 件です。":
        "Of the %d recordings in this period, %d were suspected customer harassment (severity 3: %d).",
    "分析した録音": "Recordings analyzed",
    "候補にした録音 %d 件": "%d recordings were candidates",
    "カスハラの疑い": "Suspected harassment",
    "録音の %s%%": "%s%% of recordings",
    "深刻度3": "Severity 3",
    "深刻度2は %d 件、1は %d 件": "Severity 2: %d, severity 1: %d",
    "未判定": "Not judged",
    "判定の上限を超えた候補": "Candidates beyond the judging limit",
    "件": "",
    "%d件": "%d",
    "(無題)": "(untitled)",
    "%d分": "%d min",
    "前後の会話(%d行)": "Conversation around it (%d lines)",
    "深刻度%d": "Severity %d",
    "日時": "Date and time",
    "録音者": "Recorded by",
    "録音のタイトル": "Recording title",
    "類型": "Type",
    "深刻度": "Severity",
    "根拠の抜粋・理由・前後の会話": "Quote, reason, and conversation around it",
    "疑いのある録音はありませんでした。": "No suspected recordings.",
    "期間 %s / 除外: 失敗 %d 件・処理中 %d 件": "Period %s / excluded: %d failed, %d in progress",
    "期間 %s": "Period %s",
    "カスハラ検知レポート": "Customer Harassment Detection Report",
    "店舗の接客の録音から / 生成 %s": "From store-service recordings / generated %s",
    "疑いの一覧": "Suspected recordings",
    "深刻度の高い順。AI が録音の内容から付けた「疑い」です。録音を確認して判断してください。":
        "Highest severity first. These are suspicions the AI raised from the content of the recordings. Please check the recordings and decide.",
    "類型別の件数": "Counts by type",
    "疑いのあった %d 件の内訳": "Breakdown of the %d suspected recordings",
    "日別の推移": "Daily trend",
    "疑いのあった録音の件数(日ごと)": "Suspected recordings per day",
}


def T(s):
    return EN.get(s, s) if LANG == "en" else s


TYPES = ["暴言・侮辱", "威圧・脅迫", "長時間の拘束・繰り返し", "土下座・過度な要求",
         "セクハラ・つきまとい", "差別的な言動", "その他"]


def esc(x):
    return html.escape(str(x), quote=True)


def fail(msg):
    sys.exit("ERROR: " + msg)


def parse_date(s, name):
    try:
        y, m, d = (int(p) for p in str(s).split("-"))
        return date(y, m, d)
    except Exception:
        fail("%s must be in the form YYYY-MM-DD: %r" % (name, s))


def nonneg_int(v, name):
    if isinstance(v, bool) or not isinstance(v, int) or v < 0:
        fail("%s must be an integer of 0 or more: %r" % (name, v))
    return v


def load(path):
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    global LANG
    LANG = d.get("lang") or "ja"
    if LANG not in ("ja", "en"):
        fail("lang must be ja or en: %r" % (LANG,))
    start = parse_date(d.get("period_start"), "period_start")
    end = parse_date(d.get("period_end"), "period_end")
    if end < start:
        fail("period_end is before period_start")
    if (end - start).days > 400:
        fail("The period is too long (400 days at most)")
    t = d.get("totals") or {}
    totals = {k: nonneg_int(t.get(k, 0), "totals." + k)
              for k in ("recordings", "candidates", "judged", "failed", "in_progress")}
    if totals["judged"] > totals["candidates"]:
        fail("judged is larger than candidates")
    findings = d.get("findings") or []
    seen = set()
    rows = []
    for i, f in enumerate(findings):
        w = "findings[%d]" % i
        rid = str(f.get("recording_id") or "")
        if not rid:
            fail(w + ".recording_id is missing")
        if rid in seen:
            fail(w + ".recording_id is duplicated: " + rid)
        seen.add(rid)
        dt = parse_date(f.get("date"), w + ".date")
        if not (start <= dt <= end):
            fail("%s.date is outside the period: %s" % (w, dt))
        sev = f.get("severity")
        if isinstance(sev, bool) or sev not in (1, 2, 3):
            fail(w + ".severity must be 1, 2 or 3: %r" % (sev,))
        typ = f.get("type")
        if typ not in TYPES:
            fail("%s.type must be one of: %s (got: %r)" % (w, " / ".join(TYPES), typ))
        mins = f.get("minutes")
        if isinstance(mins, bool) or not isinstance(mins, (int, float)) or mins < 0:
            fail(w + ".minutes must be a number of 0 or more")
        ctx = []
        raw_ctx = f.get("context") or []
        if not isinstance(raw_ctx, list) or len(raw_ctx) > 12:
            fail(w + ".context must be a list of 12 lines at most")
        for j, c in enumerate(raw_ctx):
            if not isinstance(c, dict) or c.get("who") not in ("客", "店"):
                fail("%s.context[%d].who must be 客 or 店" % (w, j))
            ctx.append((str(c.get("t") or ""), c["who"], str(c.get("text") or "")))
        rows.append(dict(rid=rid, date=dt, time=str(f.get("time") or ""),
                         recorder=str(f.get("recorder") or "(不明)"), title=str(f.get("title") or ""),
                         minutes=int(round(mins)), type=typ, severity=sev,
                         quote=str(f.get("quote") or ""), reason=str(f.get("reason") or ""),
                         context=ctx))
    if len(rows) > totals["judged"]:
        fail("The number of findings is larger than judged")
    return start, end, totals, rows


def count(start, end, totals, rows):
    by_type = {t: 0 for t in TYPES}
    by_sev = {1: 0, 2: 0, 3: 0}
    by_day = {}
    day = start
    while day <= end:
        by_day[day] = 0
        day += timedelta(days=1)
    for r in rows:
        by_type[r["type"]] += 1
        by_sev[r["severity"]] += 1
        by_day[r["date"]] += 1
    return by_type, by_sev, by_day


CSS = """
:root{--ink:#140F24;--sub:#5A5570;--line:#E2DDEE;--brand:#7B32DC;--brand-d:#5A21A8;--soft:#EFE9FC;--bg:#F7F5F9;--grey:#C9C6D6;--alert:#C0392B}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.7 "Hiragino Sans","Noto Sans JP","Yu Gothic",system-ui,sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:24px 20px 56px}
.top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:2px solid var(--brand);padding-bottom:12px}
.top h1{font-size:24px;margin:0;line-height:1.3;color:var(--brand-d)}
.top .meta{color:var(--sub);font-size:13px;margin-top:2px}
.badges{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.badge{display:inline-block;border:1px solid var(--line);background:#fff;border-radius:4px;padding:2px 10px;font-size:12px;color:var(--sub);white-space:nowrap}
.badge.key{border-color:var(--brand);color:var(--brand-d);font-weight:700}
.badge.s3{background:var(--alert);border-color:var(--alert);color:#fff;font-weight:700}
.badge.s2{background:var(--soft);border-color:var(--brand);color:var(--brand-d);font-weight:700}
.badge.s1{background:#fff;border-color:var(--grey);color:var(--sub)}
.lead{margin:22px 0 6px;font-size:22px;font-weight:700;line-height:1.5}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.kpi{background:#fff;border:1px solid var(--line);border-radius:6px;padding:14px 16px}
.kpi .k{font-size:12px;color:var(--sub)}
.kpi .v{font-size:32px;font-weight:700;line-height:1.25;color:var(--brand-d)}
.kpi .u{font-size:13px;color:var(--sub);margin-left:3px;font-weight:400}
.kpi .sub{font-size:12px;color:var(--sub)}
section.panel{background:#fff;border:1px solid var(--line);border-radius:6px;padding:18px 20px;margin-bottom:14px}
section.panel h2{font-size:16px;margin:0 0 2px}
.cap{font-size:12px;color:var(--sub);margin:0 0 10px}
table{border-collapse:collapse;width:100%;font-size:13px}
th{background:var(--soft);color:var(--brand-d);text-align:left;padding:7px 10px;border:1px solid var(--line);font-weight:700;white-space:nowrap}
td{padding:7px 10px;border:1px solid var(--line);vertical-align:top}
td.nw{white-space:nowrap}
td .q{display:block}
td .r{display:block;color:var(--sub);font-size:12px;margin-top:2px}
details.ctx{margin-top:6px;font-size:12px}
details.ctx summary{cursor:pointer;color:var(--brand-d);font-weight:700}
.cl{display:grid;grid-template-columns:44px 22px 1fr;gap:4px;padding:2px 4px;border-radius:3px}
.cl .t{color:var(--sub);font-variant-numeric:tabular-nums}
.cl .w{font-weight:700;color:var(--sub)}
.cl.k .w{color:var(--brand-d)}
.cl.hl{background:var(--soft)}
.bars{display:flex;flex-direction:column;gap:11px}
.bar-row{display:grid;grid-template-columns:190px 1fr 60px;column-gap:8px;align-items:center;font-size:13px}
.bar-track{background:#efedf6;height:12px;border-radius:2px}
.bar-fill{height:12px;border-radius:2px;background:var(--brand)}
.bar-val{text-align:right;color:var(--sub);font-variant-numeric:tabular-nums}
.cols{display:flex;gap:3px;align-items:flex-end;height:190px}
.col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font-size:11px;text-align:center;height:100%;min-width:0}
.col .bar{width:100%;background:var(--brand);border-radius:3px 3px 0 0;min-height:2px}
.col .bar.z{background:var(--line)}
.col .cnt{font-weight:700;font-size:12px;margin-bottom:3px}
.col .lb{margin-top:5px;color:var(--sub);white-space:nowrap}
.empty{color:var(--sub);padding:8px 0}
footer{margin-top:22px;font-size:12px;color:var(--sub)}
footer p{margin:3px 0}
@media(max-width:760px){.kpis{grid-template-columns:1fr 1fr}.bar-row{grid-template-columns:130px 1fr 40px}}
@media print{body{background:#fff}.wrap{padding:0}section.panel,.kpi{break-inside:avoid}}
"""


def render(start, end, totals, rows):
    by_type, by_sev, by_day = count(start, end, totals, rows)
    n = len(rows)
    rec = totals["recordings"]
    days = (end - start).days + 1
    unjudged = totals["candidates"] - totals["judged"]
    excluded = totals["failed"] + totals["in_progress"]
    unit = T("件")

    if n == 0:
        lead = T("この期間の録音 %d 件に、カスハラの疑いは見つかりませんでした。") % rec
    else:
        lead = T("この期間の録音 %d 件のうち、カスハラの疑いが %d 件ありました。深刻度3は %d 件です。") % (
            rec, n, by_sev[3])

    pct = ("%.1f" % (n * 100.0 / rec)) if rec else "0"
    kpis = [
        (T("分析した録音"), rec, unit, T("候補にした録音 %d 件") % totals["candidates"]),
        (T("カスハラの疑い"), n, unit, T("録音の %s%%") % pct),
        (T("深刻度3"), by_sev[3], unit, T("深刻度2は %d 件、1は %d 件") % (by_sev[2], by_sev[1])),
        (T("未判定"), unjudged, unit, T("判定の上限を超えた候補")),
    ]
    kpi_html = "".join(
        '<div class="kpi"><div class="k">%s</div><div class="v">%d<span class="u">%s</span></div>'
        '<span class="sub">%s</span></div>' % (esc(k), v, esc(u), esc(s)) for k, v, u, s in kpis)

    # List of suspected recordings (highest severity first, then newest first)
    ordered = sorted(rows, key=lambda r: (-r["severity"], -r["date"].toordinal(), r["time"]))
    if ordered:
        trs = []
        for r in ordered:
            ctx_html = ""
            if r["context"]:
                lines = []
                for tm, who, tx in r["context"]:
                    hl = " hl" if (r["quote"] and r["quote"][:12] in tx) else ""
                    kk = " k" if who == "客" else ""
                    lines.append('<div class="cl%s%s"><span class="t">%s</span><span class="w">%s</span>'
                                 '<span>%s</span></div>' % (kk, hl, esc(tm), esc(T(who)), esc(tx)))
                ctx_html = ('<details class="ctx"><summary>%s</summary>%s</details>'
                            % (esc(T("前後の会話(%d行)") % len(r["context"])), "".join(lines)))
            trs.append(
                '<tr><td class="nw">%s<br>%s</td><td class="nw">%s</td>'
                '<td>%s<span class="r">%s</span></td><td>%s</td>'
                '<td><span class="badge s%d">%s</span></td>'
                '<td><span class="q">「%s」</span><span class="r">%s</span>%s</td></tr>' % (
                    esc(r["date"].strftime("%m/%d")), esc(r["time"]), esc(r["recorder"]),
                    esc(r["title"] or T("(無題)")), esc(T("%d分") % r["minutes"]), esc(T(r["type"])),
                    r["severity"], esc(T("深刻度%d") % r["severity"]),
                    esc(r["quote"]), esc(r["reason"]), ctx_html))
        heads = ["日時", "録音者", "録音のタイトル", "類型", "深刻度", "根拠の抜粋・理由・前後の会話"]
        table = "<table><thead><tr>%s</tr></thead><tbody>%s</tbody></table>" % (
            "".join("<th>%s</th>" % esc(T(h)) for h in heads), "".join(trs))
    else:
        table = '<div class="empty">%s</div>' % esc(T("疑いのある録音はありませんでした。"))

    # By type
    mx = max(by_type.values()) if n else 0
    type_rows = []
    for ty in TYPES:
        if by_type[ty] == 0 and ty == "その他":
            continue
        w = (by_type[ty] * 100.0 / mx) if mx else 0
        type_rows.append(
            '<div class="bar-row"><div>%s</div><div class="bar-track"><div class="bar-fill" '
            'style="width:%.1f%%"></div></div><div class="bar-val">%s</div></div>' % (
                esc(T(ty)), w, esc(T("%d件") % by_type[ty] if LANG == "ja" else str(by_type[ty]))))

    # By day
    dmax = max(by_day.values()) if by_day else 0
    cols = []
    step = 1 if days <= 14 else (2 if days <= 31 else 7)
    for i, (d, c) in enumerate(sorted(by_day.items())):
        h = int(round(c * 130.0 / dmax)) if dmax else 0
        h = max(h, 2)
        label = d.strftime("%m/%d").lstrip("0").replace("/0", "/") if i % step == 0 else "&nbsp;"
        cnt = ('<div class="cnt">%d</div>' % c) if c else ""
        cols.append('<div class="col">%s<div class="bar%s" style="height:%dpx"></div>'
                    '<div class="lb">%s</div></div>' % (cnt, "" if c else " z", h, label))

    badge = "%s 〜 %s" % (start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
    if excluded == 0:
        foot = T("期間 %s") % badge
    else:
        foot = T("期間 %s / 除外: 失敗 %d 件・処理中 %d 件") % (badge, totals["failed"], totals["in_progress"])

    title = esc(T("カスハラ検知レポート"))
    return (
        '<!doctype html>\n<html lang="%s"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        "<title>%s</title>\n<style>%s</style></head><body><div class=\"wrap\">\n"
        '<div class="top"><div><h1>%s</h1><div class="meta">%s</div></div>\n'
        '<div class="badges"><span class="badge key">%s</span></div></div>\n'
        '<p class="lead">%s</p>\n<div class="kpis">%s</div>\n'
        '<section class="panel"><h2>%s</h2><p class="cap">%s</p>%s</section>\n'
        '<section class="panel"><h2>%s</h2><p class="cap">%s</p><div class="bars">%s</div></section>\n'
        '<section class="panel"><h2>%s</h2><p class="cap">%s</p><div class="cols">%s</div></section>\n'
        "<footer><p>%s</p></footer>\n</div></body></html>\n"
    ) % (LANG, title, CSS, title,
         esc(T("店舗の接客の録音から / 生成 %s") % date.today().isoformat()), esc(badge), esc(lead), kpi_html,
         esc(T("疑いの一覧")),
         esc(T("深刻度の高い順。AI が録音の内容から付けた「疑い」です。録音を確認して判断してください。")), table,
         esc(T("類型別の件数")), esc(T("疑いのあった %d 件の内訳") % n), "".join(type_rows),
         esc(T("日別の推移")), esc(T("疑いのあった録音の件数(日ごと)")), "".join(cols), esc(foot))


def main():
    if len(sys.argv) != 3:
        sys.exit("Usage: python3 harassment_report.py <input.json> <output.html>")
    start, end, totals, rows = load(sys.argv[1])
    by_type, by_sev, by_day = count(start, end, totals, rows)
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(render(start, end, totals, rows))
    print(json.dumps({
        "suspected": len(rows), "analyzed": totals["recordings"],
        "severity": {str(k): v for k, v in by_sev.items()},
        "by_type": {k: v for k, v in by_type.items() if v},
        "unjudged": totals["candidates"] - totals["judged"],
        "excluded": totals["failed"] + totals["in_progress"],
        "output": sys.argv[2]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
