#!/usr/bin/env python3
"""1つの AI Voice 録音の会話を数える:発話量、沈黙、被り、自社側と顧客側のやりとり。

話者と開始・終了時刻だけの小さなJSONを読み、1つで完結したHTMLを書き出す。
Python 3.8 以上の標準ライブラリだけで動く(macOS 標準の python3 でも動く)。

使い方:
    python3 talk_analysis.py input.json output.html

入力JSON:
{
  "title": "A社 初回ヒアリング",             # ページの見出し(録音のタイトル)
  "recorded_at": "2026-10-28 15:51",       # 任意。ヘッダーに表示する
  "lang": "ja",                            # "ja" か "en"(ラベルの言語)
  "note": "...",                           # 任意。数字が変わる場合だけ書く1行の脚注
  "unit": "s",                             # start/end の単位:"s"(秒)か "ms"
  "speakers": [
    {"id": "Speaker 1", "name": "佐藤", "side": "self"},        # 自社側
    {"id": "Speaker 2", "name": "田中", "side": "customer"},    # 顧客側
    {"id": "Speaker 3", "name": "X氏", "side": "other"},        # どちらにも数えない
    {"id": "Speaker 4", "merge_into": "Speaker 2"}              # Speaker 2 と同じ人
  ],
  "segments": [{"speaker": "Speaker 1", "start": 2.24, "end": 34.88}, ...]
}

定義:
  沈黙   = 誰も話していない状態が3秒以上続いたこと(それまでの最大の終了時刻と比べる)
  被り   = 自社側と顧客側で話者が切り替わるとき、次の区間が前の区間の終了前に始まったこと
  ラリー = 連続する区間の間で、話す側(自社/顧客)が切り替わった回数(side が other は飛ばす)
話者の「発話の回数」は、同じ話者の連続する区間(その話者自身の前の発話の終了から3秒未満)を1回として数える。
発話量は区間の長さの合計。数字のJSONサマリーを標準出力に出す。
"""

# ruff: noqa: E501, PLR0915
# (単一ファイルのスクリプトのため、長いHTML・ラベルの文字列と長い描画関数は意図したもの)
import html
import json
import sys
from datetime import datetime
from pathlib import Path

SIL_MS = 3000
SELF_COL = ["#7B32DC", "#B793F0", "#4B1B8F"]  # our side: purple family
CUST_COL = ["#1E77FF", "#7FB1FF", "#0F4DB3"]  # customer side: blue family
OTHER_COL = "#9A96A8"
SIL_COL = "#CFC8E4"

LABELS = {
    "ja": {
        "meta": "会話の可視化 / 録音 {rec} / 生成 {today}",
        "meta_norec": "会話の可視化 / 生成 {today}",
        "people": "{n}人の通話",
        "cap": "{dur}の通話 / 自社側: {s} / 顧客側: {c}",
        "cap_other": " / その他: {o}",
        "sil": "3秒以上の沈黙",
        "ov": "被り",
        "cust": "顧客側",
        "self": "自社側",
        "other": "その他",
        "lbl_self": "自社",
        "lbl_cust": "顧客",
        "join": "",
        "k_ratio": "Talk : Listen（自社 : 顧客）",
        "k_sil": "沈黙回数（3秒以上）",
        "k_ov": "被り回数（自社と顧客の間）",
        "k_rally": "ラリー回数（自社と顧客の切り替え）",
        "k_long": "自社側の最長独演",
        "times": "回",
        "th": ["話者", "側", "発話時間", "割合", "発話の回数", "1回あたりの平均", "最長"],
        "sum_self": "自社側 合計",
        "sum_cust": "顧客側 合計",
        "donut": "自社側の割合",
        "finding": "所見",
        "f_share": "自社側と顧客側の発話量は {a} : {b} です（自社側 {at}、顧客側 {bt}）。",
        "f_side": "{label}側は{items}。",
        "f_sep": "、",
        "f_item": "{n} {p}%",
        "f_other": "側の指定がない{n}は{p}%で、「その他」として扱っています。",
        "f_tail": "自社側の最長の独演は{lng}、3秒以上の沈黙は{sil}回、自社側と顧客側の切り替えは{rally}回です。",
        "foot": "沈黙＝誰も話していない状態が3秒以上続いた回数 / 被り＝自社側と顧客側で、前の発話が終わる前に次の発話が始まった回数 / ラリー＝自社側と顧客側の間で話者が切り替わった回数",
        "tip_sil": "沈黙 {a}〜{b}（{s}秒）",
        "tip_ov": "被り {t}",
        "tip_sp": "{n} {s}秒",
        "aria_tl": "発話タイムライン",
        "aria_dn": "発話量の割合",
        "min": "{m}分{s:02d}秒",
        "sec": "{s}秒",
        "nobody": "-",
    },
    "en": {
        "meta": "Conversation analysis / recorded {rec} / generated {today}",
        "meta_norec": "Conversation analysis / generated {today}",
        "people": "{n} people",
        "cap": "{dur} call / Our side: {s} / Customer side: {c}",
        "cap_other": " / Other: {o}",
        "sil": "Silence (3s+)",
        "ov": "Overlap",
        "cust": "Customer",
        "self": "Our side",
        "other": "Other",
        "lbl_self": "Our",
        "lbl_cust": "Customer",
        "join": " ",
        "k_ratio": "Talk : Listen (ours : customer)",
        "k_sil": "Silences (3s+)",
        "k_ov": "Overlaps (ours vs customer)",
        "k_rally": "Back-and-forth (side switches)",
        "k_long": "Our longest monologue",
        "times": "",
        "th": ["Speaker", "Side", "Talk time", "Share", "Turns", "Avg per turn", "Longest"],
        "sum_self": "Our side total",
        "sum_cust": "Customer side total",
        "donut": "our share",
        "finding": "Findings",
        "f_share": "Talk time between our side and the customer side is {a} : {b} (ours {at}, customer {bt}).",
        "f_side": "{label} side: {items}.",
        "f_sep": ", ",
        "f_item": "{n} {p}%",
        "f_other": "{n} has no side and is counted as Other ({p}%).",
        "f_tail": "Our longest monologue was {lng}, with {sil} silences of 3s or more and {rally} side switches.",
        "foot": "Silence = nobody spoke for 3s or more / Overlap = the next speaker on the other side started before the previous one finished / Back-and-forth = times the speaking side switched between us and the customer",
        "tip_sil": "Silence {a}-{b} ({s}s)",
        "tip_ov": "Overlap {t}",
        "tip_sp": "{n} {s}s",
        "aria_tl": "Speaking timeline",
        "aria_dn": "Share of talk time",
        "min": "{m}m {s:02d}s",
        "sec": "{s}s",
        "nobody": "-",
    },
}

CSS = """:root{--ink:#140F24;--sub:#5A5570;--line:#E2DDEE;--brand:#7B32DC;--brand-d:#5A21A8;--soft:#EFE9FC;--bg:#F7F5F9}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.7 "Hiragino Sans","Noto Sans JP","Yu Gothic",system-ui,sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:24px 20px 56px}
.top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:2px solid var(--brand);padding-bottom:12px}
.top h1{font-size:24px;margin:0;line-height:1.3;color:var(--brand-d)}
.top .meta{color:var(--sub);font-size:13px;margin-top:2px}
.badges{display:flex;gap:6px}
.badge{display:inline-block;border:1px solid var(--line);background:#fff;border-radius:4px;padding:2px 10px;font-size:12px;color:var(--sub);white-space:nowrap}
.badge.key{border-color:var(--brand);color:var(--brand-d);font-weight:700}
section.panel{background:#fff;border:1px solid var(--line);border-radius:6px;padding:18px 20px;margin:18px 0 14px}
.cap{font-size:12px;color:var(--sub);margin:0 0 10px}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--sub);margin-bottom:4px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.legend i.dia{width:9px;height:9px;background:#140F24;transform:rotate(45deg);border-radius:0;margin-right:7px}
.kpis5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:16px 0}
.kpi{background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:10px 12px}
.kpi .k{font-size:11px;color:var(--sub);line-height:1.4;min-height:32px}
.kpi .v{font-size:26px;font-weight:700;line-height:1.3;color:var(--brand-d)}
.kpi .u{font-size:12px;color:var(--sub);margin-left:3px;font-weight:400}
.grid2{display:grid;grid-template-columns:230px 1fr;gap:22px;align-items:start}
.donutbox{text-align:center}
.dl{font-size:13px;text-align:left;display:inline-block;margin-top:6px}
.dl i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px}
table{border-collapse:collapse;width:100%;font-size:13px}
th{background:var(--soft);color:var(--brand-d);text-align:left;padding:7px 10px;border:1px solid var(--line);font-weight:700;white-space:nowrap}
td{padding:7px 10px;border:1px solid var(--line);vertical-align:top}
.chip{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:7px;vertical-align:-1px}
tr.sum td{background:var(--bg);font-weight:700;color:var(--brand-d)}
.note{font-size:14px;margin-top:12px}
.note b{display:block;font-size:12px;color:var(--brand);margin:0 0 2px}
footer{margin-top:22px;font-size:12px;color:var(--sub)}
footer p{margin:4px 0}
@media(max-width:760px){.kpis5{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr}}
@media print{body{background:#fff}.wrap{padding:0}section.panel{break-inside:avoid}}
"""


def today_iso():
    return datetime.now().astimezone().date().isoformat()


def fail(msg):
    sys.exit("ERROR: " + msg)


def resolve_merge(spk, remap):
    """merge_into を最後まで辿った話者IDを返す。循環していればエラーにする。"""
    path = []
    while spk in remap:
        if spk in path:
            fail("merge_into が循環しています: " + " → ".join([*path, spk]))
        path.append(spk)
        spk = remap[spk]
    return spk


# ---------- input ----------
def num(x, where):
    """数値に直す。数値でなければ、どの区間かを示してエラーにする。"""
    if isinstance(x, bool):
        fail(f"{where} が数値ではありません: {x!r}")
    try:
        return float(x)
    except (TypeError, ValueError):
        fail(f"{where} が数値ではありません: {x!r}")


def load(path):
    """入力を読む。黙って誤った数字を出さないよう、書き間違いはエラーで止める。"""
    d = json.loads(Path(path).read_text(encoding="utf-8"))
    unit = d.get("unit", "s")
    if unit not in ("s", "ms"):
        fail(f'unit は "s"(秒)か "ms"(ミリ秒)にしてください: {unit!r}')
    k = 1000 if unit == "s" else 1
    speakers = d.get("speakers") or []
    if not speakers:
        fail("speakers が空です")
    ids = []
    for i, sp in enumerate(speakers):
        if not sp.get("id"):
            fail(f"speakers[{i}] に id がありません")
        if sp["id"] in ids:
            fail(f"話者ID {sp['id']} が speakers に2回あります。1人1行にしてください")
        ids.append(sp["id"])
    remap, cfg, order = {}, {}, []
    for sp in speakers:
        if sp.get("merge_into"):
            if sp["merge_into"] not in ids or sp["merge_into"] == sp["id"]:
                fail(f"{sp['id']} の merge_into は、一覧にある別の話者IDにしてください")
            remap[sp["id"]] = sp["merge_into"]
    for sp_id in remap:  # 循環は、区間に出てこない話者も含めて先に弾く
        resolve_merge(sp_id, remap)
    for sp in speakers:
        if sp["id"] in remap:
            continue
        side = sp.get("side")
        if side not in ("self", "customer", "other"):
            fail(
                f"{sp['id']} の side を self / customer / other のどれかで指定してください: {side!r}"
            )
        cfg[sp["id"]] = {"name": sp.get("name") or sp["id"], "side": side}
        order.append(sp["id"])
    segs = []
    for i, s in enumerate(d.get("segments") or []):
        if s.get("speaker") not in ids:
            fail(
                f"segments[{i}] の話者 {s.get('speaker')!r} が speakers にありません。全員を speakers に入れてください"
            )
        spk = resolve_merge(s["speaker"], remap)
        a = round(num(s.get("start"), f"segments[{i}].start") * k)
        b = round(num(s.get("end"), f"segments[{i}].end") * k)
        if b < a:
            fail(
                f"segments[{i}] の end が start より前です(start={s.get('start')}, end={s.get('end')})。単位や列の取り違えがないか確認してください"
            )
        segs.append({"idx": i, "spk": spk, "start": a, "end": b})
    if not segs:
        fail("segments が空です")
    return d, cfg, order, segs


# ---------- metrics ----------
def metrics(segs, side_of):
    segs = sorted(segs, key=lambda s: (s["start"], s["idx"]))
    talk, run_max, sil_list = {}, None, []
    turns, cur, prev_spk = [], None, None
    for s in segs:
        talk[s["spk"]] = talk.get(s["spk"], 0) + s["end"] - s["start"]
        gap = None if run_max is None else s["start"] - run_max
        if gap is not None and gap >= SIL_MS:
            sil_list.append((run_max, s["start"]))
        own_gap = None if cur is None else s["start"] - cur["end"]  # 同じ話者の直前の終了からの間隔
        new_turn = cur is None or s["spk"] != prev_spk or own_gap >= SIL_MS
        if new_turn:
            cur = {"spk": s["spk"], "start": s["start"], "end": s["end"]}
            turns.append(cur)
        else:
            cur["end"] = max(cur["end"], s["end"])
        run_max = s["end"] if run_max is None else max(run_max, s["end"])
        prev_spk = s["spk"]
    mapped = [s for s in segs if side_of[s["spk"]] != "other"]
    rally, ov_list = 0, []
    # 隣り合う区間のペア。itertools.pairwise と zip(strict=) は Python 3.10 以上なので使わない
    for i in range(1, len(mapped)):
        p, s = mapped[i - 1], mapped[i]
        if side_of[s["spk"]] != side_of[p["spk"]]:
            rally += 1
            if s["start"] < p["end"]:
                ov_list.append(s["start"])
    tr = {}
    for sp in talk:
        tl = [t["end"] - t["start"] for t in turns if t["spk"] == sp]
        tr[sp] = {"n": len(tl), "avg": sum(tl) / len(tl), "mx": max(tl)}
    return {
        "talk": talk,
        "sil_list": sil_list,
        "ov_list": ov_list,
        "rally": rally,
        "total": max(s["end"] for s in segs),
        "turns": tr,
        "segs": segs,
    }


# ---------- rendering ----------
def mmss(ms):
    s = round(ms / 1000)
    return f"{s // 60}:{s % 60:02d}"


def dur(ms, lab):
    s = round(ms / 1000)
    return lab["min"].format(m=s // 60, s=s % 60) if s >= 60 else lab["sec"].format(s=s)


def esc(x):
    return html.escape(str(x), quote=True)


def pick_bin(total):
    for b in (1000, 2000, 3000, 5000, 10000, 15000, 30000, 60000, 120000):
        if total / b <= 150:
            return b
    return 300000


def pick_tick(total):
    for t in (10000, 30000, 60000, 120000, 300000, 600000, 1800000):
        if total / t <= 8:
            return t
    return 3600000


def timeline_svg(m, order, cfg, col, lab):
    total = max(m["total"], 1)
    w, ht, mid, amp = 940, 150, 75, 62
    bin_ms = pick_bin(total)
    nb = int(total // bin_ms) + 1
    bw = w / nb
    sides = {
        "self": [s for s in order if cfg[s]["side"] == "self"],
        "customer": [s for s in order if cfg[s]["side"] == "customer"],
    }
    bins = {s: [0] * nb for s in order if cfg[s]["side"] != "other"}
    for s in m["segs"]:
        if s["spk"] not in bins:
            continue
        a, b = s["start"], s["end"]
        while a < b:
            k = int(a // bin_ms)
            e = min(b, (k + 1) * bin_ms)
            bins[s["spk"]][k] += e - a
            a = e
    p = [
        f'<svg viewBox="0 0 {w} {ht + 22}" width="100%" role="img" aria-label="{esc(lab["aria_tl"])}">'
    ]
    for a, b in m["sil_list"]:
        x1, x2 = a / total * w, b / total * w
        tip = lab["tip_sil"].format(a=mmss(a), b=mmss(b), s=f"{(b - a) / 1000:.1f}")
        p.append(
            f'<rect x="{x1:.1f}" y="0" width="{max(x2 - x1, 2):.1f}" height="{ht}" fill="{SIL_COL}" opacity=".85"><title>{esc(tip)}</title></rect>'
        )
    for k in range(nb):
        for side, up in (("customer", -1), ("self", 1)):
            sps = sides[side]
            tot = sum(bins[s][k] for s in sps)
            if tot <= 0:
                continue
            f = min(1.0, bin_ms / tot)
            y = mid
            for s in sps:
                ms = bins[s][k]
                h = ms * f / bin_ms * amp
                if h < 0.4:
                    continue
                yy = (y - h) if up < 0 else y
                tip = lab["tip_sp"].format(n=cfg[s]["name"], s=f"{ms / 1000:.0f}")
                p.append(
                    f'<rect x="{k * bw + 0.5:.1f}" y="{yy:.1f}" width="{max(bw - 1, 0.5):.1f}" height="{h:.1f}" fill="{col[s]}" opacity=".92"><title>{esc(tip)}</title></rect>'
                )
                y = (y - h) if up < 0 else (y + h)
    p.append(f'<line x1="0" x2="{w}" y1="{mid}" y2="{mid}" stroke="#140F24" stroke-width="1"/>')
    for t in m["ov_list"]:
        x = t / total * w
        p.append(
            f'<path d="M{x:.1f} {mid - 7} l5 7 l-5 7 l-5 -7 z" fill="#140F24"><title>{esc(lab["tip_ov"].format(t=mmss(t)))}</title></path>'
        )
    step = pick_tick(total)
    for i in range(0, int(total // step) + 1):
        x = i * step / total * w
        p.append(
            f'<line x1="{x:.1f}" x2="{x:.1f}" y1="{ht}" y2="{ht + 5}" stroke="#5A5570"/>'
            f'<text x="{x:.1f}" y="{ht + 17}" font-size="11" fill="#5A5570" text-anchor="{"start" if i == 0 else "middle"}">{mmss(i * step)}</text>'
        )
    p.append(
        f'<text x="4" y="14" font-size="11" fill="#1E77FF" font-weight="700">{esc(lab["cust"])}</text>'
        f'<text x="4" y="{ht - 6}" font-size="11" fill="#7B32DC" font-weight="700">{esc(lab["self"])}</text></svg>'
    )
    return "".join(p)


def donut(slices, main, sub):
    r = 54
    c = 2 * 3.14159265 * r
    parts = ['<svg viewBox="0 0 140 140" width="150" role="img">']
    off = 0.0
    for share, color in slices:
        a = share * c
        parts.append(
            f'<circle cx="70" cy="70" r="{r}" fill="none" stroke="{color}" stroke-width="22" '
            f'stroke-dasharray="{a:.2f} {c - a:.2f}" stroke-dashoffset="{-off:.2f}" transform="rotate(-90 70 70)"/>'
        )
        off += a
    parts.append(
        f'<text x="70" y="68" text-anchor="middle" font-size="24" font-weight="700" fill="#5A21A8">{esc(main)}</text>'
        f'<text x="70" y="88" text-anchor="middle" font-size="11" fill="#5A5570">{esc(sub)}</text></svg>'
    )
    return "".join(parts)


def render(d, cfg, order, m):
    lab = LABELS[d.get("lang", "ja") if d.get("lang", "ja") in LABELS else "ja"]
    side_of = {s: cfg[s]["side"] for s in cfg}
    selfs = [s for s in order if side_of[s] == "self"]
    custs = [s for s in order if side_of[s] == "customer"]
    others = [s for s in order if side_of[s] == "other"]
    ordered = selfs + custs + others
    col, ns, nc = {}, 0, 0
    for s in ordered:
        if side_of[s] == "self":
            col[s] = SELF_COL[ns % 3]
            ns += 1
        elif side_of[s] == "customer":
            col[s] = CUST_COL[nc % 3]
            nc += 1
        else:
            col[s] = OTHER_COL
    talk = {s: m["talk"].get(s, 0) for s in ordered}
    tot = max(sum(talk.values()), 1)
    side_ms = {
        k: sum(talk[s] for s in ordered if side_of[s] == k) for k in ("self", "customer", "other")
    }
    tl = side_ms["self"] + side_ms["customer"]
    ratio = (
        f"{round(side_ms['self'] / tl * 100)} : {round(side_ms['customer'] / tl * 100)}"
        if tl
        else lab["nobody"]
    )
    mx_self = max((m["turns"][s]["mx"] for s in selfs if s in m["turns"]), default=None)
    multi = len(selfs) > 1 or len(custs) > 1 or bool(others)

    def pct(ms):
        return round(ms / tot * 100)

    def pair_pct(ms):  # 自社側と顧客側の合計を100%とする(KPI・サマリーと同じ。other は含めない)
        return round(ms / tl * 100) if tl else 0

    facts = [
        lab["f_share"].format(
            a=pair_pct(side_ms["self"]),
            at=dur(side_ms["self"], lab),
            b=pair_pct(side_ms["customer"]),
            bt=dur(side_ms["customer"], lab),
        )
    ]
    if multi:
        for sps, label in ((selfs, lab["lbl_self"]), (custs, lab["lbl_cust"])):
            if len(sps) > 1:
                items = lab["f_sep"].join(
                    lab["f_item"].format(n=cfg[s]["name"], p=pct(talk[s])) for s in sps
                )
                facts.append(lab["f_side"].format(label=label, items=items))
        facts.extend(lab["f_other"].format(n=cfg[o]["name"], p=pct(talk[o])) for o in others)
    facts.append(
        lab["f_tail"].format(
            lng=dur(mx_self, lab) if mx_self is not None else lab["nobody"],
            sil=len(m["sil_list"]),
            rally=m["rally"],
        )
    )

    legend = "".join(
        f'<span><i style="background:{col[s]}"></i>{esc(cfg[s]["name"])}</span>'
        for s in ordered
        if side_of[s] != "other"
    )
    legend += f'<span><i style="background:{SIL_COL}"></i>{esc(lab["sil"])}</span><span><i class="dia"></i>{esc(lab["ov"])}</span>'
    side_name = {"self": lab["self"], "customer": lab["cust"], "other": lab["other"]}
    rows = []
    for s in ordered:
        t = m["turns"].get(s, {"n": 0, "avg": 0, "mx": 0})
        rows.append(
            f'<tr><td><i class="chip" style="background:{col[s]}"></i>{esc(cfg[s]["name"])}</td><td>{esc(side_name[side_of[s]])}</td>'
            f"<td>{dur(talk[s], lab)}</td><td>{pct(talk[s])}%</td><td>{t['n']}{esc(lab['times'])}</td><td>{dur(t['avg'], lab)}</td><td>{dur(t['mx'], lab)}</td></tr>"
        )
    if multi:
        for key, label in (("self", lab["sum_self"]), ("customer", lab["sum_cust"])):
            rows.append(
                f'<tr class="sum"><td>{esc(label)}</td><td></td><td>{dur(side_ms[key], lab)}</td><td>{pct(side_ms[key])}%</td><td></td><td></td><td></td></tr>'
            )
    cap = lab["cap"].format(
        dur=dur(m["total"], lab),
        s="・".join(cfg[s]["name"] for s in selfs) or lab["nobody"],
        c="・".join(cfg[s]["name"] for s in custs) or lab["nobody"],
    )
    if others:
        cap += lab["cap_other"].format(o="・".join(cfg[s]["name"] for s in others))
    dl = "".join(
        f'<div><i style="background:{col[s]}"></i>{esc(cfg[s]["name"])} {dur(talk[s], lab)}</div>'
        for s in ordered
    )
    slices = [(talk[s] / tot, col[s]) for s in ordered]
    n_people = len(selfs) + len(custs)
    rec = d.get("recorded_at")
    meta = (
        lab["meta"].format(rec=rec, today=today_iso())
        if rec
        else lab["meta_norec"].format(today=today_iso())
    )
    times = esc(lab["times"])

    def kpi(k, v, u=""):
        return f'<div class="kpi"><div class="k">{esc(k)}</div><div class="v">{v}<span class="u">{u}</span></div></div>'

    kpis = (
        kpi(lab["k_ratio"], ratio)
        + kpi(lab["k_sil"], len(m["sil_list"]), times)
        + kpi(lab["k_ov"], len(m["ov_list"]), times)
        + kpi(lab["k_rally"], m["rally"], times)
        + kpi(lab["k_long"], dur(mx_self, lab) if mx_self is not None else lab["nobody"])
    )
    th = "".join(f"<th>{esc(h)}</th>" for h in lab["th"])
    note = f"<p>{esc(d['note'])}</p>" if d.get("note") else ""
    return f"""<!doctype html><html lang="{d.get("lang", "ja") if d.get("lang", "ja") in LABELS else "ja"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(d.get("title") or "Conversation analysis")}</title><style>{CSS}</style></head><body><div class="wrap">
<div class="top"><div><h1>{esc(d.get("title") or "Conversation analysis")}</h1><div class="meta">{esc(meta)}</div></div>
<div class="badges"><span class="badge key">{esc(lab["people"].format(n=n_people))}</span></div></div>
<section class="panel">
<p class="cap">{esc(cap)}</p>
<div class="legend">{legend}</div>
{timeline_svg(m, ordered, cfg, col, lab)}
<div class="kpis5">{kpis}</div>
<div class="grid2">
  <div class="donutbox">{donut(slices, f"{pair_pct(side_ms['self'])}%" if tl else lab["nobody"], lab["donut"])}<div class="dl">{dl}</div></div>
  <div><table><thead><tr>{th}</tr></thead><tbody>{"".join(rows)}</tbody></table>
  <div class="note"><b>{esc(lab["finding"])}</b>{esc(lab["join"].join(facts))}</div></div>
</div></section>
<footer><p>{esc(lab["foot"])}</p>{note}</footer>
</div></body></html>"""


def summary(d, cfg, order, m):
    talk_total = max(sum(m["talk"].values()), 1)
    side_ms = {"self": 0, "customer": 0}
    for sp, ms in m["talk"].items():
        if cfg[sp]["side"] in side_ms:
            side_ms[cfg[sp]["side"]] += ms
    both = side_ms["self"] + side_ms["customer"]
    return {
        "title": d.get("title"),
        # ページの Talk : Listen と同じ。自社側と顧客側の合計を100%とする(other は含めない)
        "side_share_pct": {k: round(v / both * 100) for k, v in side_ms.items()} if both else None,
        "total_ms": m["total"],
        "silences": len(m["sil_list"]),
        "overlaps": len(m["ov_list"]),
        "rallies": m["rally"],
        "segments": len(m["segs"]),
        "speakers": [
            {
                "id": s,
                "name": cfg[s]["name"],
                "side": cfg[s]["side"],
                "talk_ms": m["talk"].get(s, 0),
                "share_pct": round(m["talk"].get(s, 0) / talk_total * 100, 1),
                "turns": m["turns"].get(s, {}).get("n", 0),
                "longest_turn_ms": m["turns"].get(s, {}).get("mx", 0),
            }
            for s in order
        ],
    }


def main():
    if len(sys.argv) != 3:
        fail("usage: python3 talk_analysis.py input.json output.html")
    d, cfg, order, segs = load(sys.argv[1])
    m = metrics(segs, {s: cfg[s]["side"] for s in cfg})
    Path(sys.argv[2]).write_text(render(d, cfg, order, m), encoding="utf-8")
    print(json.dumps(summary(d, cfg, order, m), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
