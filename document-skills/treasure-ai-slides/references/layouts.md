# Treasure AI Slide Layouts - Quick Selection Guide

スライドのコンテンツに応じて最適なレイアウトを選択するためのガイドです。

## Layout Selection Decision Tree

```
コンテンツの性質は？
├─ 表紙・タイトル
│   └→ Title Slide (A)
│
├─ セクション区切り（大項目の開始）
│   └→ Section Divider (B)
│
├─ 標準的な説明・箇条書き
│   └→ Content Slide (C)
│
├─ 2つの対比・比較（左右）
│   └→ 2-Column Layout
│
├─ 3つの並列要素（フェーズ/柱/比較）
│   └→ 3-Column Grid
│
├─ 4つの並列要素
│   └→ 4-Column Grid
│
├─ デモ画面/スクリーンショット（大きく見せたい）
│   └→ Console Layout または Laptop+Text Layout
│
├─ ステップ/手順/タイムライン
│   └→ Steps Layout または Content with numbered list
│
├─ 引用/顧客の声
│   └→ Quote Layout (装飾付きテキスト)
│
├─ 複数メトリクス/ダッシュボード風
│   └→ Bento Grid Layout
│
├─ 終了・Thank You
│   └→ End Slide (D)
│
└─ その他
    └→ Content Slide with visual elements
```

## Layout Catalog

### Tier 1: Core Layouts（必須・頻出）

#### A. Title Slide（タイトルスライド）
**用途**: プレゼンテーション表紙

**特徴**:
- グラデーション背景（テーマに応じて選択）
- 中央上寄せの大きなタイトル（白、Bold、36-44pt）
- サブタイトル（アクセントカラー、16-20pt）
- ロゴ配置（右下または左上）

**python-pptx実装**:
```python
slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = NAVY  # または他のグラデーション色

# タイトル
title_box = slide.shapes.add_textbox(
    Inches(0.94), Inches(2.37), Inches(9.94), Inches(1.64)
)
# ...
```

**いつ使う**: プレゼンの最初のスライドのみ

---

#### B. Section Divider（セクション区切り）
**用途**: 大きなセクション間の区切り

**特徴**:
- グラデーション背景（タイトルと同じテーマ）
- 左寄せの大きな白テキスト（セクション名）
- オプション: 右側に画像または抽象シェイプ

**python-pptx実装**:
```python
slide = prs.slides.add_slide(prs.slide_layouts[6])
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = NAVY

# セクション名（左寄せ）
section_box = slide.shapes.add_textbox(
    Inches(0.94), Inches(2.5), Inches(6), Inches(1.5)
)
section_frame = section_box.text_frame
section_frame.text = 'Section Title'
section_para = section_frame.paragraphs[0]
section_para.font.name = 'Arial'
section_para.font.size = Pt(40)
section_para.font.bold = True
section_para.font.color.rgb = WHITE
section_para.alignment = PP_ALIGN.LEFT

# 装飾シェイプ（右側・オプション）
from pptx.enum.shapes import MSO_SHAPE
shape = slide.shapes.add_shape(
    MSO_SHAPE.OVAL,
    Inches(10), Inches(1), Inches(3), Inches(3)
)
shape.fill.solid()
shape.fill.fore_color.rgb = PURPLE
shape.fill.transparency = 0.4  # 40% 透明
shape.line.fill.background()  # 枠線なし
```

**いつ使う**: 「課題提起」→「ソリューション」→「事例」のような大きなセクション間

---

#### C. Content Slide（コンテンツスライド）
**用途**: 最も頻繁に使用する標準スライド

**特徴**:
- 白背景（`#FFFFFF` または `#F9FEFF`）
- 左上にタイトル（黒、Bold、28pt）
- オプション: サブタイトル（Navy または Pink、16pt）
- 本文エリア: テキスト（箇条書き）+ ビジュアル要素

**python-pptx実装**:
```python
slide = prs.slides.add_slide(prs.slide_layouts[6])
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = WHITE

# タイトル
title_box = slide.shapes.add_textbox(
    Inches(0.38), Inches(0.3), Inches(9), Inches(0.7)
)
title_frame = title_box.text_frame
title_frame.text = 'Slide Title'
title_para = title_frame.paragraphs[0]
title_para.font.name = 'Arial'
title_para.font.size = Pt(28)
title_para.font.bold = True
title_para.font.color.rgb = BLACK

# 本文（箇条書き）
body_box = slide.shapes.add_textbox(
    Inches(0.38), Inches(1.4), Inches(5.5), Inches(4.5)
)
body_frame = body_box.text_frame
body_frame.word_wrap = True

items = ['First point', 'Second point', 'Third point']
for idx, item in enumerate(items):
    if idx == 0:
        p = body_frame.paragraphs[0]
    else:
        p = body_frame.add_paragraph()
    p.text = item
    p.font.name = 'Arial'
    p.font.size = Pt(14)
    p.font.color.rgb = BLACK
    p.level = 0  # 箇条書きレベル

# 装飾ボックス（右側）
shape = slide.shapes.add_shape(
    MSO_SHAPE.ROUNDED_RECTANGLE,
    Inches(7), Inches(1.5), Inches(5.5), Inches(4)
)
shape.fill.solid()
shape.fill.fore_color.rgb = LILAC
shape.line.color.rgb = PURPLE
shape.line.width = Pt(2)
```

**バリエーション**:
- **Content + Gradient**: タイトル下にアクセント用グラデーション帯
- **Content + Subtitle**: サブタイトル追加
- **Content No Gradient**: シンプル版（テキスト量が多い場合）

**いつ使う**: 説明、箇条書き、詳細情報、まとめ

---

#### D. End Slide（終了スライド）
**用途**: プレゼンテーション終了

**特徴**:
- タイトルと同じグラデーション背景
- 中央に "Thank You"（白、大きく）
- オプション: CTA（"Let's build something amazing"）
- オプション: 連絡先情報

**python-pptx実装**:
```python
slide = prs.slides.add_slide(prs.slide_layouts[6])
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = NAVY

# "Thank You"
thank_box = slide.shapes.add_textbox(
    Inches(0), Inches(2.5), Inches(13.33), Inches(1.5)
)
thank_frame = thank_box.text_frame
thank_frame.text = 'Thank You'
thank_para = thank_frame.paragraphs[0]
thank_para.font.name = 'Arial'
thank_para.font.size = Pt(60)
thank_para.font.bold = True
thank_para.font.color.rgb = WHITE
thank_para.alignment = PP_ALIGN.CENTER

# CTA（オプション）
cta_box = slide.shapes.add_textbox(
    Inches(0), Inches(4.3), Inches(13.33), Inches(0.5)
)
cta_frame = cta_box.text_frame
cta_frame.text = "Let's build something amazing"
cta_para = cta_frame.paragraphs[0]
cta_para.font.name = 'Arial'
cta_para.font.size = Pt(20)
cta_para.font.color.rgb = PINK
cta_para.alignment = PP_ALIGN.CENTER
```

**いつ使う**: プレゼンテーションの最後のスライドのみ

---

### Tier 2: Multi-Column Layouts（並列要素）

#### 2-Column Layout（2カラム）
**用途**: テキスト + ビジュアルの組み合わせ

**構成**:
- 左（55%）: タイトル + テキスト（箇条書きまたは段落）
- 右（40%）: 画像、チャート、アイコン

**いつ使う**:
- デモ画面/スクリーンショットの説明
- フロー/ハイライトの視覚化
- Before/After比較

**python-pptx実装**:
```python
# 左カラム（テキスト）
left_box = slide.shapes.add_textbox(
    Inches(0.38), Inches(1.4), Inches(6), Inches(4.5)
)
# ... テキスト追加

# 右カラム（ビジュアル用プレースホルダー）
right_box = slide.shapes.add_shape(
    MSO_SHAPE.ROUNDED_RECTANGLE,
    Inches(7), Inches(1.4), Inches(5.5), Inches(4.5)
)
right_box.fill.solid()
right_box.fill.fore_color.rgb = LILAC
right_box.text_frame.text = '[画像をここに配置]'
```

---

#### 3-Column Grid（3カラムグリッド）
**用途**: 3つの並列要素を並べて表示

**構成**:
- 等幅3分割（各約30%）
- 各カラム: アイコン + ヘッダー + 説明文

**いつ使う**:
- 3つの柱/フェーズ/特徴
- "What / Why / How"
- "Past / Present / Future"
- 製品の3つの強み

**python-pptx実装**:
```python
col_width = 3.8
col_height = 4.5
start_y = 1.4
spacing = 0.3

columns = [
    {'header': 'Column 1', 'text': 'Description 1'},
    {'header': 'Column 2', 'text': 'Description 2'},
    {'header': 'Column 3', 'text': 'Description 3'},
]

for idx, col in enumerate(columns):
    x = 0.38 + (col_width + spacing) * idx
    
    # カラムボックス
    box = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(x), Inches(start_y), Inches(col_width), Inches(col_height)
    )
    box.fill.solid()
    box.fill.fore_color.rgb = WHITE
    box.line.color.rgb = PURPLE
    box.line.width = Pt(2)
    
    # アイコン（円）
    icon = slide.shapes.add_shape(
        MSO_SHAPE.OVAL,
        Inches(x + col_width/2 - 0.4), Inches(start_y + 0.3),
        Inches(0.8), Inches(0.8)
    )
    icon.fill.solid()
    icon.fill.fore_color.rgb = PURPLE
    icon.line.fill.background()
    
    # ヘッダー
    header_box = slide.shapes.add_textbox(
        Inches(x), Inches(start_y + 1.3), Inches(col_width), Inches(0.5)
    )
    header_frame = header_box.text_frame
    header_frame.text = col['header']
    header_para = header_frame.paragraphs[0]
    header_para.font.name = 'Arial'
    header_para.font.size = Pt(18)
    header_para.font.bold = True
    header_para.font.color.rgb = NAVY
    header_para.alignment = PP_ALIGN.CENTER
    
    # 説明文
    text_box = slide.shapes.add_textbox(
        Inches(x + 0.2), Inches(start_y + 1.9),
        Inches(col_width - 0.4), Inches(2.3)
    )
    text_frame = text_box.text_frame
    text_frame.text = col['text']
    text_frame.word_wrap = True
    text_para = text_frame.paragraphs[0]
    text_para.font.name = 'Arial'
    text_para.font.size = Pt(13)
    text_para.font.color.rgb = BLACK
```

**バリエーション**:
- **Boxed 3-Column**: 各カラムをボックスで囲む（上記実装）
- **Simple 3-Column**: ボックスなし、テキストのみ

---

#### 4-Column Grid（4カラムグリッド）
**用途**: 4つの並列要素

**構成**:
- 等幅4分割
- 各カラム: アイコン + ヘッダー + 説明文

**いつ使う**:
- 4つの製品/サービス
- 4ステップのプロセス
- 4つの機能

**python-pptx実装**: 3-Columnと同様（4列に調整）

---

### Tier 3: Specialized Layouts（特殊用途）

#### Bento Grid Layout（ベントグリッド）
**用途**: 複数のメトリクス/情報を非対称に配置

**構成**:
- 大きなメインエリア（KPI、重要情報）
- 複数の小エリア（補足情報、サブメトリクス）

**いつ使う**:
- ダッシュボード風の表示
- 複数KPIの同時表示
- 複雑な情報の整理

**例**:
```
┌─────────────┬───┬───┐
│             │ 2 │ 3 │
│      1      ├───┼───┤
│   (Main)    │ 4 │ 5 │
├─────┬───────┴───┴───┤
│  6  │       7       │
└─────┴───────────────┘
```

---

#### Device Mockup Layout（デバイスモックアップ）
**用途**: 製品画面/UIを大きく見せる

**構成**:
- 左（60%）: ノートPC/スマホ画面の大きな画像
- 右（35%）: 説明テキスト

**いつ使う**:
- 製品デモ
- UI/UX説明
- 機能ハイライト

**別名**: Console Layout, Laptop+Text Layout

---

#### Quote Layout（引用レイアウト）
**用途**: 顧客の声、推薦文、重要な引用

**構成**:
- 大きな引用符装飾
- センタリングされた引用文（大きめ）
- 引用元（小さめ、下部）

**いつ使う**:
- 顧客の声（testimonial）
- 業界の引用
- インパクトのある一言

---

#### Steps/Timeline Layout（ステップ/タイムライン）
**用途**: 手順、プロセス、時系列の表示

**構成**:
- 番号付きステップ
- 矢印/線で接続
- 各ステップの説明

**いつ使う**:
- 導入手順
- プロジェクトフェーズ
- 歴史・沿革

---

## Layout Variation Rules

### レイアウト選択の原則

1. **同じレイアウトを3回以上連続使用しない**
   - ❌ Content → Content → Content → Content
   - ✅ Content → 3-Column → Content → 2-Column

2. **箇条書きだけのContentスライドを連続させない**
   - ❌ Content(bullet) → Content(bullet) → Content(bullet)
   - ✅ Content(bullet) → 3-Column → Content(bullet)

3. **セクション間にDividerを挟む**
   - ✅ Content → Divider → Content (新セクション)

### 良い構成例（14スライド・社内All Hands）

```
1.  Title Slide              - 表紙
2.  Section Divider          - セクション区切り
3.  Content                  - データ分析（チャート領域）
4.  Section Divider          - セクション区切り
5.  Device Mockup            - ハイライト説明（図+テキスト）
6.  3-Column Grid            - 3フェーズの構成（What/Status/Next）
7.  Content                  - 詳細テキスト（箇条書き多）
8.  Content + Visual         - アクション付きフロー
9.  Section Divider          - セクション区切り
10. Content                  - 手順ガイド
11. Device Mockup            - クロージング（大きな図）
12. End Slide                - Thank You
```

この構成の特徴:
- レイアウトバリエーション豊富
- Dividerで明確なセクション分け
- ビジュアル要素とテキストのバランス
- 単調さを避けた構成

---

## Quick Reference Table

| コンテンツ | 推奨レイアウト | 避けるべきパターン |
|-----------|--------------|------------------|
| 3つの並列要素 | 3-Column Grid | Content + 箇条書きで3つ羅列 |
| 4つの並列要素 | 4-Column Grid | Content + 箇条書きで4つ羅列 |
| デモ画面 | Device Mockup or Console | Content + [画像placeholder] |
| 大きな画像を貼りたい | Console/Mockup（タイトル上部+広い画像領域） | Content + 空白BODY |
| フロー/ハイライト説明 | Laptop+Text（左に図、右にテキスト） | 全部箇条書き |
| ステップ/手順 | Steps or Timeline | Content + 番号付きリスト |
| 引用/顧客の声 | Quote Layout | Content + 引用符テキスト |
| セクション間の区切り | Divider | 空のContentスライド |

---

## Implementation Checklist

スライド生成時の確認項目:

- [ ] 各スライドのコンテンツを分析した
- [ ] 最適なレイアウトを選択した
- [ ] 同じレイアウトが3回以上連続していない
- [ ] セクション間にDividerを配置した
- [ ] すべてのスライドにビジュアル要素がある
- [ ] タイトル、本文のフォントサイズが適切
- [ ] ブランドカラーを正しく使用した
- [ ] 日本語テキストで禁則処理が適用される設定

---

## Next Steps

このカタログを参考に、プレゼンテーションの構成を計画してください。

1. 各スライドの内容を決定
2. このガイドから最適なレイアウトを選択
3. `brand-guidelines.md` でカラー・フォントを確認
4. python-pptx で実装
5. QAチェックリストで品質確認
