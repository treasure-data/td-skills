// Treasure AI スライド生成例（pptxgenjs使用）
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// カラー定数（design.mdから）
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

// プレゼンテーション作成
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 16:9

// **ロゴ追加ヘルパー関数**
function addLogo(slide, variant = 'main') {
  const logoConfig = {
    main: {
      path: '../references/logos/treasure-ai-logo.png',
      x: 0.2, y: 0.15, w: 1.5, h: 0.35,
    },
    icon: {
      path: '../references/logos/treasure-ai-icon.png',
      x: 11.5, y: 6.5, w: 0.5, h: 0.5,
    },
  };

  const config = logoConfig[variant] || logoConfig.main;
  slide.addImage(config);
}

// **方法2: Base64エンコードから追加（オフライン環境向け）**
function addLogoFromBase64(slide) {
  // ロゴをBase64エンコードする場合:
  // const logoData = fs.readFileSync('../references/logos/treasure-ai-logo.png').toString('base64');
  // const dataUrl = `data:image/png;base64,${logoData}`;

  slide.addImage({
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', // 実際のBase64データ
    x: 0.2, y: 0.15, w: 1.5, h: 0.35,
  });
}

// タイトルスライド作成
function createTitleSlide() {
  const slide = pres.addSlide();

  // グラデーション背景（簡易版：紺色）
  // 本格的なグラデーションはPowerPointで直接定義
  slide.background = { color: COLORS.navy };

  // ロゴ追加（左上）
  addLogo(slide, 'main');

  // タイトル
  slide.addText('Treasure AI', {
    x: 0.94, y: 2.37, w: 9.94, h: 1.64,
    fontFace: 'Arial',
    fontSize: 40,
    bold: true,
    color: COLORS.white,
  });

  // サブタイトル
  slide.addText('The Agentic Experience Platform', {
    x: 0.94, y: 3.8, w: 6, h: 0.5,
    fontFace: 'Arial',
    fontSize: 20,
    color: COLORS.pink,
  });
}

// コンテンツスライド作成
function createContentSlide(title, content) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };

  // ロゴ追加（左上・メインロゴ）
  addLogo(slide, 'main');

  // タイトル
  slide.addText(title, {
    x: 0.38, y: 0.3, w: 9, h: 0.7,
    fontFace: 'Arial',
    fontSize: 28,
    bold: true,
    color: COLORS.black,
  });

  // コンテンツ
  slide.addText(content, {
    x: 0.38, y: 1.4, w: 5.5, h: 4.5,
    fontFace: 'Arial',
    fontSize: 14,
    color: COLORS.black,
    bullet: true,
  });

  // ビジュアル要素追加例
  slide.addShape('roundRect', {
    x: 7, y: 1.5, w: 5.5, h: 4,
    fill: { color: COLORS.lilac },
    line: { color: COLORS.purple, width: 2 },
  });
}

// スライド生成
createTitleSlide();
createContentSlide('スライドタイトル', [
  '第一のポイント',
  '第二のポイント',
  '第三のポイント',
]);

// 保存
pres.writeFile({ fileName: 'TreasureAI_Presentation.pptx' });
console.log('✅ スライド生成完了');
