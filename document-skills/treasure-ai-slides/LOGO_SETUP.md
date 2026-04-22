# ロゴ画像のセットアップ

## 問題

現在、`references/logos/` 内のPNGファイルが空（ASCIIテキスト）で、実際の画像データが含まれていません。

## 対応方法

### オプション 1: 実際のロゴPNGを配置（推奨）

1. Treasure AIの公式ロゴPNGファイルを取得
2. 以下の場所に配置：

```bash
# グローバルスキル
~/.claude/skills/treasure-ai-slides/references/logos/treasure-ai-logo.png
~/.claude/skills/treasure-ai-slides/references/logos/treasure-ai-icon.png

# リポジトリ
td-skills/creative-skills/treasure-ai-slides/references/logos/treasure-ai-logo.png
td-skills/creative-skills/treasure-ai-slides/references/logos/treasure-ai-icon.png
```

### オプション 2: 公式テンプレートから抽出

もし `tai-template.pptx` や `2026_Treasure_AI_Official_Template.pptx` がある場合：

```bash
# PPTXを解凍
unzip tai-template.pptx -d temp_extract

# メディアフォルダ内の画像を確認
ls -la temp_extract/ppt/media/

# ロゴらしきPNGをコピー
cp temp_extract/ppt/media/image1.png references/logos/treasure-ai-logo.png
cp temp_extract/ppt/media/image2.png references/logos/treasure-ai-icon.png

# クリーンアップ
rm -rf temp_extract
```

### オプション 3: ロゴなしで動作（フォールバック）

`working-example-v4.js` のようにロゴ追加部分をコメントアウト、または：

```javascript
function addLogoIfExists(slide) {
  const logoPath = '../references/logos/treasure-ai-logo.png';
  const fs = require('fs');
  
  try {
    // ファイルが存在し、かつ100バイト以上（実画像）の場合のみ追加
    const stats = fs.statSync(logoPath);
    if (stats.size > 100) {
      slide.addImage({
        path: logoPath,
        x: 0.2, y: 0.15, w: 1.5, h: 0.35,
      });
    } else {
      console.warn('⚠️  ロゴファイルが空です。スキップします。');
    }
  } catch (err) {
    console.warn('⚠️  ロゴファイルが見つかりません:', logoPath);
  }
}
```

### オプション 4: テキストロゴで代替

```javascript
// 画像の代わりにテキストでロゴを表現
function addTextLogo(slide) {
  slide.addText('◆ Treasure AI', {
    x: 0.2, y: 0.15, w: 2, h: 0.35,
    fontFace: 'Arial',
    fontSize: 14,
    bold: true,
    color: '2D40AA', // Navy Blue
  });
}
```

## 推奨サイズ

- **メインロゴ（横型）**: 200px × 50px 程度（アスペクト比 4:1）
- **アイコンのみ**: 80px × 80px（正方形）
- ファイル形式: PNG（透過背景推奨）

## 確認方法

```bash
# ファイルサイズ確認（100バイト以上なら実画像の可能性が高い）
ls -lh references/logos/*.png

# ファイル形式確認
file references/logos/*.png
# 正常: "PNG image data, 200 x 50, 8-bit/color RGBA, non-interlaced"
# 異常: "ASCII text, with no line terminators"
```

## 次のステップ

1. 実際のロゴPNGを入手・配置
2. `working-example-v4.js` を実行してテスト
3. ロゴが正しく表示されることを確認
