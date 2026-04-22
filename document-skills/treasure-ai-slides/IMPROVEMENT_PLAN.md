# Treasure AI Slides スキル改善プラン

## 現状の問題点

### 技術的問題
1. ✅ **pptxgenjs v4非互換** - グラデーション背景、ShapeType enumでクラッシュ
2. ✅ **ロゴ画像が空** - ASCIIテキストで実画像なし
3. ✅ **サンプルコードが動かない** - background, line指定が間違い

### 設計上の問題
4. ⚠️ **レイアウトが限定的** - 5種類しかない（Title, Section, Content, Bento, End）
5. ⚠️ **実用性が低い** - pptxgenjsで一から作るのは非効率
6. ⚠️ **テンプレート未活用** - 公式テンプレート（48レイアウト）を使っていない

## 改善方針

### Phase 1: 即時修正（pptxgenjs v4対応）

#### 1.1 動作確認済みサンプルコードに差し替え
- ✅ `working-example-v4.js` 作成済み
- グラデーション → 単色 + 装飾シェイプ
- ShapeType enum → 文字列リテラル
- background, line 指定を修正

#### 1.2 ロゴ画像問題の対応
- ✅ `LOGO_SETUP.md` 作成済み
- フォールバック処理を追加
- テキストロゴ代替オプション提供

### Phase 2: td-branded-slides アプローチ統合

#### 2.1 テンプレートベースのアプローチを追加

**アーキテクチャ**:
```
アプローチ1: pptxgenjs（クイックスタート）
├── 基本的なスライド生成
├── カスタマイズ性高い
└── 適用範囲: 簡単なプレゼン（5-10スライド）

アプローチ2: Python + テンプレート（プロダクション品質）
├── 公式テンプレート（tai-template.pptx）使用
├── 48レイアウトから選択
├── スクリプト駆動（rearrange.py, replace.py）
└── 適用範囲: 本格的なプレゼン（10-50スライド）
```

#### 2.2 必要なスクリプト

**rearrange.py**: テンプレートから必要なスライドを抽出・並び替え
```python
# 使用例
python rearrange.py tai-template.pptx output.pptx 1,3,18,23,34
# → スライド1,3,18,23,34だけを含む新しいPPTXを生成
```

**inventory.py**: スライド構造を解析してJSONに出力
```python
# 使用例
python inventory.py output.pptx inventory.json
# → 各スライドのシェイプ、テキストボックスの位置情報をJSON化
```

**replace.py**: replacement.jsonに従ってテキストを置換
```python
# 使用例
python replace.py output.pptx replacement.json final.pptx
# → 各シェイプのテキストを置換した最終PPTXを生成
```

**upload_gdrive.py**: Google Driveにアップロード（オプション）
```python
# 使用例
python upload_gdrive.py final.pptx --title "提案資料"
```

#### 2.3 レイアウトカタログ整備

`references/layouts.md` を作成：
- 48レイアウトの完全カタログ
- 各レイアウトのスクリーンショット
- 使用シーン（「3つの並列要素 → Slide 23」）
- クイック選択ガイド（デシジョンツリー）

#### 2.4 ワークフロー統合

SKILL.mdに両方のアプローチを記載：

```markdown
## Quick Start（pptxgenjs）

簡単なプレゼンを素早く作成する場合：

```bash
node working-example-v4.js
```

## Production Quality（Python + Template）

公式レイアウトを使った本格的なプレゼン：

```bash
# 1. レイアウト選択
# layouts.md を参照して使用するスライド番号を決定

# 2. テンプレートから抽出
python scripts/rearrange.py \
  assets/tai-template.pptx working.pptx \
  1,3,18,23,31,34

# 3. テキスト置換
python scripts/replace.py \
  working.pptx replacement.json output.pptx

# 4. Google Driveアップロード（オプション）
python scripts/upload_gdrive.py output.pptx
```
```

### Phase 3: 品質向上

#### 3.1 レイアウトバリエーション推奨ルール

td-branded-slides.mdの良い点を取り入れ：
- **同じレイアウトを3回以上連続使用しない**
- **箇条書きだけのContentスライドを連続させない**
- **セクション間にDividerを挟む**

#### 3.2 デシジョンツリー統合

```
コンテンツの性質は？
├─ 3つの並列要素（比較/フェーズ/柱）
│   └→ 3-Column (23) or Boxed 3-Column (25)
├─ 4つの並列要素
│   └→ 4-Column (27) or Text+4 Boxes (29)
├─ デモ画面/スクリーンショット
│   └→ Console (38) or Laptop+Text (31)
└─ ステップ/手順
    └→ Steps (58) or Timeline (59)
```

#### 3.3 サンプルプレゼンテーション

実際の使用例を追加：
- `examples/corporate-presentation/` - 社内報告用（14スライド）
- `examples/client-proposal/` - クライアント提案用（10スライド）
- `examples/seminar-materials/` - セミナー資料用（8スライド）

### Phase 4: アセット整備

#### 4.1 必要なアセット
- [ ] `assets/tai-template.pptx` - 公式テンプレート（48レイアウト）
- [ ] `references/logos/treasure-ai-logo.png` - 実際のロゴPNG
- [ ] `references/logos/treasure-ai-icon.png` - アイコンPNG
- [ ] `references/layouts.md` - レイアウトカタログ
- [ ] `references/layout-screenshots/` - 各レイアウトのプレビュー画像

#### 4.2 スクリプト
- [ ] `scripts/rearrange.py`
- [ ] `scripts/inventory.py`
- [ ] `scripts/replace.py`
- [ ] `scripts/upload_gdrive.py`
- [ ] `scripts/thumbnail.py` - プレビュー生成

## 実装優先順位

### P0（即時）
1. ✅ pptxgenjs v4対応コード作成 → `working-example-v4.js`
2. ✅ ロゴ対応ガイド作成 → `LOGO_SETUP.md`
3. ⬜ SKILL.md修正（v4対応、フォールバック記載）

### P1（1週間以内）
4. ⬜ Pythonスクリプト作成（rearrange, inventory, replace）
5. ⬜ `tai-template.pptx` 入手または作成
6. ⬜ `references/layouts.md` 作成

### P2（2週間以内）
7. ⬜ 実際のロゴPNG配置
8. ⬜ レイアウトスクリーンショット生成
9. ⬜ サンプルプレゼンテーション3種作成

### P3（1ヶ月以内）
10. ⬜ Google Drive連携スクリプト
11. ⬜ テンプレートカスタマイズガイド
12. ⬜ 日本語禁則処理の自動化

## 成功指標

- ✅ pptxgenjs v4でエラーなく動作
- ✅ ロゴなしでも動作する
- ⬜ 5分以内に10スライドのプレゼンを生成可能
- ⬜ 48レイアウトすべてが使用可能
- ⬜ Google Slidesで編集可能なPPTXを出力
- ⬜ 日本語テキストで禁則処理が適用される

## 次のアクション

1. **ユーザーにロゴPNGファイルを提供してもらう**
2. **tai-template.pptx の入手方法を確認**
3. **Pythonスクリプトの実装開始**
4. **修正版SKILL.mdのレビュー**
