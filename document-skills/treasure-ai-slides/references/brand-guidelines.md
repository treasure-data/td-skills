# Treasure AI Brand Guidelines - Quick Reference

このドキュメントは design.md からの要約版です。スライド作成時のクイックリファレンスとして使用します。

## Brand Colors

### Primary Colors
- **Navy Blue**: `#2D40AA` - メインブランドカラー（タイトル、見出し）
- **Off-White**: `#F9FEFF` - ライト背景
- **White**: `#FFFFFF` - コンテンツスライド背景
- **Black**: `#000000` - 本文テキスト

### Accent Colors
- **Purple (Lavender)**: `#847BF2` - ハイライト、アイコン
- **Pink (Mauve)**: `#C466D4` - セカンダリアクセント
- **Sky Blue**: `#80B3FA` - サポート要素
- **Lilac**: `#F3CCF2` - 淡い背景、装飾
- **Peach**: `#FFE2BD` - ウォームアクセント
- **Coral**: `#FDB893` - ウォームサポート
- **Link Blue**: `#494FFF` - リンク、CTA

### RGB Values (for python-pptx)
```python
from pptx.dml.color import RGBColor

NAVY = RGBColor(45, 64, 170)      # #2D40AA
PURPLE = RGBColor(132, 123, 242)  # #847BF2
PINK = RGBColor(196, 102, 212)    # #C466D4
SKY_BLUE = RGBColor(128, 179, 250) # #80B3FA
LILAC = RGBColor(243, 204, 242)   # #F3CCF2
WHITE = RGBColor(255, 255, 255)
BLACK = RGBColor(0, 0, 0)
```

## Typography

### Font Stack
- **English**: Manrope (primary), Arial (fallback)
- **Japanese**: Noto Sans JP (primary), MS Pゴシック (fallback)

### Font Sizes
| 要素 | サイズ | ウェイト | カラー |
|------|--------|---------|--------|
| スライドタイトル | 36-44pt | Bold | `#000000` or `#FFFFFF` |
| セクションヘッダー | 20-24pt | Bold | `#000000` |
| サブタイトル | 16-18pt | Regular | `#2D40AA` or `#C466D4` |
| 本文テキスト | 13-16pt | Regular | `#000000` |
| キャプション・注記 | 10-12pt | Regular | `#666666` |
| 大きな数値（KPI） | 48-72pt | Bold | `#2D40AA` or `#847BF2` |

### python-pptx Implementation
```python
from pptx.util import Pt

# タイトル
title_para.font.name = 'Arial'  # または 'Manrope'
title_para.font.size = Pt(40)
title_para.font.bold = True
title_para.font.color.rgb = BLACK

# 日本語本文
body_para.font.name = 'Noto Sans JP'  # または 'MS Pゴシック'
body_para.font.size = Pt(14)
body_para.font.color.rgb = BLACK
```

## Logo Usage

### Standard Placement
- **位置**: 左上コーナー
- **座標**: x: 0.2in, y: 0.15in
- **サイズ**: w: 1.5in, h: 0.35in

### python-pptx Implementation
```python
from pptx.util import Inches

# ロゴ追加
logo_path = 'references/logos/treasure-ai-logo.png'
slide.shapes.add_picture(
    logo_path,
    Inches(0.2),   # x
    Inches(0.15),  # y
    height=Inches(0.35)  # 高さ（幅は自動調整）
)
```

### Fallback (テキストロゴ)
```python
# 画像が使えない場合
logo_box = slide.shapes.add_textbox(
    Inches(0.2), Inches(0.15), Inches(2), Inches(0.35)
)
logo_frame = logo_box.text_frame
logo_frame.text = '◆ Treasure AI'
logo_para = logo_frame.paragraphs[0]
logo_para.font.name = 'Arial'
logo_para.font.size = Pt(14)
logo_para.font.bold = True
logo_para.font.color.rgb = NAVY
```

## Gradient Themes

### 1. Default (Dark) - フォーマル/エグゼクティブ
- Stop 1: `#FF86B4` (Pink)
- Stop 2: `#9864FF` (Purple)
- Stop 3: `#3D9CFF` (Blue)
- Direction: 45° (top-left to bottom-right)

### 2. Sunset - カスタマー向け/親しみ
- Stop 1: `#FFF1DD` (Beige)
- Stop 2: `#DD71DA` (Pink)
- Stop 3: `#B4AEF7` (Lavender)

### 3. Rainbow - 製品群紹介/多様性
- Stop 1: `#FFE5C3` (Warm Orange)
- Stop 2: `#DBA2E5` (Mauve)
- Stop 3: `#B4AEF7` (Lavender)

### 4. Dusk - テクノロジー/データ
- Stop 1: `#8855FF` (Deep Purple)
- Stop 2: `#4485FF` (Blue)
- Stop 3: `#00B6FF` (Cyan)

### 5. Lavender - パートナー/信頼性
- Similar to Sunset, soft tones

**Note**: python-pptxではグラデーション背景は非対応。単色背景（Navy `#2D40AA`）を推奨。

## Design Rules

### ✓ Must Do
- すべてのスライドにビジュアル要素（画像、アイコン、シェイプ）
- グラデーション背景: タイトル、セクション区切り、エンドスライドのみ
- コンテンツスライド: 白背景のみ
- ロゴ: 左上に配置
- タイトルはBold、本文はRegular
- 画像は角丸
- ブランドシェイプ（有機的な円・楕円）を装飾に使用

### ✗ Never Do
- タイトル下に装飾ライン
- コンテンツスライドにクリーム・ベージュ背景
- テキストのみのスライド
- すべて同じレイアウトを繰り返す
- テキストをセンタリング（タイトル除く）
- テキストをボックスからはみ出させる
- アクセントカラー（パープル/ピンク）を多用

### Color Usage Ratio
- 白/ライトグレー（背景）: 60-70%
- ブランドカラー（アクセント）: 20-30%
- テキスト（黒/紺）: 残り

## Slide Types

### A. Title Slide (表紙)
- Background: Gradient
- Content: Large title (centered, white, bold) + subtitle
- Logo: Bottom-right or top-left

### B. Section Divider (区切り)
- Background: Gradient (theme consistent)
- Content: Left-aligned white text, large section name
- Optional: Right-side image or abstract shapes

### C. Content Slide (標準)
- Background: Solid white (`#FFFFFF`) or off-white (`#F9FEFF`)
- Header: Top-left title (black, bold)
- Content: Text + visual elements
- Logo: Top-left corner

### D. End Slide (Thank You)
- Background: Same gradient as title
- Content: "Thank you" centered (white)
- Optional CTA: Chat-style box

## Layout Patterns

### 1-Column (Text-Focused)
- Title + subtitle + body text
- Bullet points (max 3 levels)

### 2-Column (Text + Visual)
- Left: Title + text (55% width)
- Right: Image, chart, icon (40% width)

### 3-Column Grid
- Equal width columns (~30% each)
- Each column: Icon + header + text

### 4-Column Grid
- Four equal columns
- Use for feature lists, comparisons

### Bento Grid
- Asymmetric grid: Large main area + multiple small areas
- Mix images, numbers, text

### Device Mockup
- Left: Large product image (laptop, mobile)
- Right: Text explanation

## Japanese Typography Rules

### 行頭禁則文字 (No Line-Start)
- 閉じ括弧: `）` `］` `｝` `」` `』`
- 句読点: `、` `。` `,` `.`
- 中点・記号: `・` `：` `；` `:` `;`
- ハイフン: `‐` `゠` `–` `ー`
- 感嘆符: `!` `?` `！` `？`
- 小書き仮名: `ぁ` `ぃ` `ぅ` `ぇ` `ぉ` `ゃ` `ゅ` `ょ` `っ` `ァ` `ィ` 等

### 行末禁則文字 (No Line-End)
- 開き括弧: `（` `［` `｛` `「` `『`

### 分離禁止 (No Separation)
- 連続記号: `……` (ellipsis, 2 sets), `——` (dashes)
- 英単語: `PowerPoint` → `Power-Point` に分割しない
- 数値: `1,000`, `2024年3月22日`, `10:30`
- URL: `https://example.com`

### python-pptx Implementation
```python
# 日本語フォント設定で自動適用
text_frame.word_wrap = True
para.font.name = 'Noto Sans JP'  # または 'MS Pゴシック'
```

## Quick Decision Tree

```
スライドの目的は？
├─ 表紙・タイトル → Title Slide (Gradient背景)
├─ セクション区切り → Section Divider (Gradient背景)
├─ 標準的な説明 → Content Slide (白背景)
├─ 3つの並列要素 → 3-Column Grid
├─ 4つの並列要素 → 4-Column Grid
├─ デモ画面表示 → Device Mockup or Bento Grid
├─ ステップ/手順 → Numbered list in Content Slide
├─ 終了 → End Slide (Gradient背景)
└─ その他 → Content Slide with visual elements
```

## Tagline
"The Agentic Experience Platform"

## Common Mistakes

1. **クリーム/ベージュ背景** → 白に変更
2. **テキストのみ** → アイコンやシェイプを追加
3. **ロゴなし** → 左上に配置
4. **グラデーション乱用** → コンテンツは白背景
5. **同じレイアウト連続** → バリエーションを持たせる
6. **アクセントカラー多用** → 控えめに使用

## References
- Full specification: [`design.md`](design.md)
- Logo files: [`logos/treasure-ai-logo.png`](logos/treasure-ai-logo.png)
