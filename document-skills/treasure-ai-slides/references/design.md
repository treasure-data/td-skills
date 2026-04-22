# Treasure AI – Presentation Design System
# Claude Code用スライド作成ガイド

このファイルはClaude CodeがTreasure AIブランドに準拠したPowerPointスライドを作成する際の
すべての設計仕様を定めます。スライド作成前に必ずこのファイルを参照してください。

---

## 1. ブランドカラーパレット

### コアカラー（ベースカラー）

| 用途 | 名前 | HEX | 使用場面 |
|------|------|-----|---------|
| Primary Dark | Navy Blue | `#2D40AA` | テキスト・アクセント |
| Primary Light | Off-White | `#F9FEFF` | 背景・軽量エリア |
| Accent Purple | Lavender | `#847BF2` | ハイライト・アイコン |
| Accent Pink | Mauve | `#C466D4` | セカンダリアクセント |
| Accent Blue | Sky | `#80B3FA` | サポート要素 |
| Accent Lilac | Pale Pink | `#F3CCF2` | 淡い背景・装飾 |
| Accent Peach | Warm | `#FFE2BD` | ウォームアクセント |
| Accent Coral | Soft | `#FDB893` | ウォームサポート |
| Black | Text | `#000000` | 本文テキスト |
| White | Base | `#FFFFFF` | 背景・反転テキスト |
| Link Blue | Hyperlink | `#494FFF` | リンク・CTA |

### グラデーション定義

スライドの背景グラデーションはTreasure AI独自のものを以下を正確に再現すること。

**メインタイトルグラデーション（Title & Section slides）**
- 左上 → 右下の斜めグラデーション
- Stop 1: `#FF86B4` (ピンク)
- Stop 2: `#9864FF` → `#8470FF` (パープル)
- Stop 3: `#3D9CFF` → `#00C3FF` (ブルー)
- 角度: 約45度（左上から右下）

**Sunsetグラデーション（暖色系スライド）**
- `#FFF1DD` → `#DD71DA` → `#B4AEF7`
- 淡いベージュからラベンダー

**Rainbowグラデーション**
- `#FFE5C3` → `#DBA2E5` → `#B4AEF7`
- ウォームオレンジからパープルへ

**Dusk / Lavenderグラデーション**
- `#8855FF` → `#4485FF` → `#00B6FF`
- ディープパープルからブルーへ

**コンテンツスライド背景**
- 白 (`#FFFFFF`) またはごく薄いオフホワイト (`#F9FEFF`)
- グラデーションは「タイトル」「セクション区切り」「エンドスライド」専用

---

## 2. タイポグラフィ

### フォント

| 要素 | フォント | 代替 |
|------|---------|------|
| 見出し (Heading) | Arial | Arial Black |
| 本文 (Body) | Arial | Calibri |
| 日本語 | ＭＳ Ｐゴシック | — |

### フォントサイズ規定

| 要素 | サイズ | ウェイト | カラー |
|------|--------|---------|--------|
| スライドタイトル | 36〜44pt | Bold | `#000000` または `#FFFFFF`（背景に依存）|
| セクションヘッダー | 20〜24pt | Bold | `#000000` |
| サブタイトル | 16〜18pt | Regular | `#2D40AA` または `#C466D4` |
| 本文テキスト | 13〜16pt | Regular | `#000000` |
| キャプション・注記 | 10〜12pt | Regular | `#666666` |
| 大きな数値（KPI） | 48〜72pt | Bold | `#2D40AA` または `#847BF2` |

---

## 3. ロゴ & ブランド要素

### Treasure AI ロゴファイル

| ファイル | パス | 用途 | サイズ目安 |
|---------|------|------|-----------|
| メインロゴ（横） | `assets/logos/treasure-ai-logo.png` | スライド標準配置 | W: 150-200px |
| アイコンのみ | `assets/logos/treasure-ai-icon.png` | 小サイズ・装飾 | W: 40-60px |

**ロゴの特徴**:
- ダイヤモンド型アイコン: グラデーション（紫 → ピンク → 青）
- テキスト "Treasure AI": Navy Blue `#2D40AA`
- 透過PNG形式

### スライド内配置ルール

**標準配置（ほとんどのスライド）**:
- 位置: 左上コーナー
- 座標: x: 0.2in (約0.5cm), y: 0.15in (約0.4cm)
- サイズ: w: 1.5in, h: 0.35in

**右下配置（オプション）**:
- 座標: x: 11.5in, y: 6.3in
- サイズ: w: 1.2in, h: 0.28in

**ダーク背景スライド**:
- 白抜きロゴまたはアイコンのみ使用を推奨
- グラデーション背景では視認性を確保

### pptxgenjsでの実装

```javascript
// メインロゴ追加（左上）
slide.addImage({
  path: 'assets/logos/treasure-ai-logo.png',
  x: 0.2,    // 左端から0.2インチ
  y: 0.15,   // 上端から0.15インチ
  w: 1.5,    // 幅1.5インチ
  h: 0.35,   // 高さ0.35インチ
});

// アイコンのみ（装飾用・右下）
slide.addImage({
  path: 'assets/logos/treasure-ai-icon.png',
  x: 11.5,
  y: 6.5,
  w: 0.5,
  h: 0.5,
});
```

### タグライン
- "Making you Super🤩 at all things Treasure✨" – エンドスライド・フッター右側に小さく表示
- "The Agentic Experience Platform" – タイトルスライドのサブタイトル

---

## 4. レイアウトシステム

### スライドサイズ
- **16:9 ワイドスクリーン**: 33.87cm × 19.05cm（標準）
- EMU換算: 12192000 × 6858000

### マージン規定
- 上下左右: 最低 0.5インチ（457,200 EMU）
- コンテンツエリア: 左端から約0.7インチ以降

### 利用可能なレイアウトタイプ

#### A. タイトルスライド（表紙）
- フルスクリーングラデーション背景（メインタイトルグラデーション）
- 中央上寄せに大きなタイトル（白・Bold）
- サブタイトルは `#C466D4` でイタリック風アクセント
- 右下にロゴ

#### B. セクション区切りスライド（Divider）
- グラデーション背景（4種類から選択）
- 左寄せに白テキスト
- オプション: 右側に画像（角丸）または抽象シェイプ（ブランドカラーの円・楕円）

#### C. コンテンツスライド（標準）
- 白またはごく薄いグラデーション背景
- 左上にタイトル（黒・Bold）
- サブタイトルは `#2D40AA` または `#C466D4`
- 本文エリアにテキスト + ビジュアル要素

#### D. エンドスライド（Thank You）
- タイトルスライドと同じグラデーション背景
- 中央に "Thank you" テキスト（白）
- AIチャット風のCTAボックス（"Let's build something amazing"）

### 主要レイアウトパターン

**1カラム（テキスト中心）**
- タイトル + サブタイトル + 本文テキスト
- 箇条書きは最大3レベル

**2カラム（テキスト + ビジュアル）**
- 左: タイトル + テキスト（幅55%）
- 右: 画像・グラフ・アイコン（幅40%）

**3カラム（グリッド）**
- 等幅3分割（各約30%）
- 各カラムにアイコン + ヘッダー + 本文

**ボックス付3カラム**
- 角丸ボックス（border: `#847BF2`, 薄紫）で囲む

**Bentoグリッド**
- 非対称グリッド: 大きなメインエリア + 複数の小エリア
- 画像・数値・テキストを組み合わせ

**ラップトップ/デバイスモックアップ**
- 左: 大きな製品画像（デバイス）
- 右: テキスト説明

---

## 5. デザインルール

### 必須ルール ✓
- **すべてのスライドにビジュアル要素を入れる** – 画像・アイコン・チャート・シェイプのいずれか
- **グラデーション背景はタイトル・セクション・エンドスライドのみ**、コンテンツスライドは白
- **ロゴを左上または右下に必ず配置**
- **タイトルはBold、本文はRegular** – ウェイトの差でヒエラルキーを出す
- **アクセントカラー（パープル系）は強調箇所のみ** – 多用しない
- **画像は角丸（rounded corners）** でクリッピング
- **ブランドシェイプ（有機的な円・楕円）** を装飾に活用

### 禁止事項 ✗
- タイトル下に装飾ラインを引かない（AI生成スライドの典型的悪例）
- コンテンツスライドにクリーム・ベージュ系の背景を使わない
- テキストのみのスライドを作らない
- すべてのスライドで同じレイアウトを繰り返さない
- テキストをセンタリングしない（タイトルを除く）
- テキストをボックスからはみ出させない

### カラー使用比率
- 白/ライトグレー（背景）: 60〜70%
- ブランドカラー（アクセント）: 20〜30%
- テキスト（黒/紺）: 残り

---

## 6. 図形・シェイプライブラリ

Treasure AIテンプレートで使用される有機的シェイプ（装飾用）:

| シェイプ名 | 用途 | カラー |
|-----------|------|--------|
| 大きな円（ゼロ） | 右側装飾 | `#80B3FA`（薄ブルー）, `#C466D4`（ピンク） |
| 楕円（小） | アクセント | `#847BF2`（パープル） |
| 流動的ブロブ | セクション背景 | グラデーション |
| 角丸四角 | カード・ボックス | 枠線 `#847BF2`、背景白 |

---

## 7. Claude Code向け実装ガイド

### スライド作成フロー

```bash
# 1. テンプレートをコピーして作業開始
cp /path/to/2026_Treasure_AI_Official_Template.pptx output.pptx

# 2. アンパック
python scripts/office/unpack.py output.pptx unpacked/

# 3. スライドXMLを編集

# 4. 再パック
python scripts/office/pack.py unpacked/ output.pptx

# 5. 画像変換してQA
python scripts/office/soffice.py --headless --convert-to pdf output.pptx
pdftoppm -jpeg -r 150 output.pdf slide
```

### pptxgenjsで一から作成する場合

```javascript
const pptxgen = require('pptxgenjs');

// カラー定数
const COLORS = {
  navy: '2D40AA',
  purple: '847BF2',
  pink: 'C466D4',
  skyBlue: '80B3FA',
  lilac: 'F3CCF2',
  peach: 'FFE2BD',
  black: '000000',
  white: 'FFFFFF',
  offWhite: 'F9FEFF',
  linkBlue: '494FFF',
};

// グラデーション背景（タイトルスライド用）
const titleGradient = {
  type: 'linear',
  angle: 45,
  stops: [
    { position: 0,   color: 'FF86B4' },
    { position: 0.3, color: '9864FF' },
    { position: 0.6, color: '3D9CFF' },
    { position: 1,   color: '00C3FF' },
  ]
};

// フォント設定
const FONTS = {
  heading: { fontFace: 'Arial', bold: true },
  body:    { fontFace: 'Arial', bold: false },
};

// プレゼンテーション作成
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 33.87cm × 19.05cm

// ロゴ追加ヘルパー
function addLogo(slide) {
  slide.addImage({
    path: 'assets/logos/treasure-ai-logo.png',
    x: 0.2,
    y: 0.15,
    w: 1.5,
    h: 0.35,
  });
}
```

### スライドタイプ別テンプレートコード

**タイトルスライド**
```javascript
function createTitleSlide(title, subtitle) {
  const slide = pres.addSlide();
  
  // グラデーション背景（簡易版：実際はtitleGradient使用）
  slide.background = { fill: { color: COLORS.navy } };
  
  // ロゴ
  addLogo(slide);
  
  // タイトル
  slide.addText(title, {
    x: 0.94, y: 2.37, w: 9.94, h: 1.64,
    fontFace: 'Arial', fontSize: 40, bold: true, color: COLORS.white,
  });
  
  // サブタイトル
  slide.addText(subtitle, {
    x: 0.94, y: 3.8, w: 6, h: 0.5,
    fontFace: 'Arial', fontSize: 20, color: COLORS.pink,
  });
}
```

**コンテンツスライド（白背景）**
```javascript
function createContentSlide(title, content) {
  const slide = pres.addSlide();
  slide.background = { fill: COLORS.white };
  
  // ロゴ
  addLogo(slide);
  
  // タイトル
  slide.addText(title, {
    x: 0.38, y: 0.3, w: 9, h: 0.7,
    fontFace: 'Arial', fontSize: 28, bold: true, color: COLORS.black,
  });
  
  // サブタイトル（オプション）
  slide.addText('サブタイトル', {
    x: 0.38, y: 0.95, w: 7, h: 0.35,
    fontFace: 'Arial', fontSize: 16, color: COLORS.navy,
  });
  
  // 本文
  slide.addText(content, {
    x: 0.38, y: 1.4, w: 5.5, h: 4.5,
    fontFace: 'Arial', fontSize: 14, color: COLORS.black,
    valign: 'top', bullet: true,
  });
  
  // ビジュアル要素（例：装飾ボックス）
  slide.addShape('roundRect', {
    x: 7, y: 1.5, w: 5.5, h: 4,
    fill: { color: COLORS.lilac },
    line: { color: COLORS.purple, width: 2 },
  });
}
```

---

## 8. QAチェックリスト

スライド完成後、以下を確認すること:

- [ ] すべてのスライドにTreasure AIロゴが表示されている
- [ ] タイトル・セクションスライドにグラデーション背景が適用されている
- [ ] コンテンツスライドの背景は白（クリーム・ベージュではない）
- [ ] フォントはArialを使用している
- [ ] テキストがボックスからはみ出していない
- [ ] タイトル下に装飾ラインがない
- [ ] すべてのスライドにビジュアル要素（画像・アイコン・シェイプ）がある
- [ ] 画像に角丸が適用されている
- [ ] アクセントカラー（パープル/ピンク）を多用していない

---

*このdesign.mdはTreasure AIの2026年公式テンプレートから抽出した仕様に基づいています。*
*テンプレートファイル: `2026_Treasure_AI_Official_Template.pptx`*
*ロゴファイル: `assets/logos/treasure-ai-logo.png`, `assets/logos/treasure-ai-icon.png`*
