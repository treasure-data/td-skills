// Treasure AI スライド生成（pptxgenjs v4 動作確認済み）
const pptxgen = require('pptxgenjs');

// カラー定数（design.mdから）
const COLORS = {
  navy: '2D40AA',
  purple: '847BF2',
  pink: 'C466D4',
  skyBlue: '80B3FA',
  lilac: 'F3CCF2',
  white: 'FFFFFF',
  black: '000000',
};

// プレゼンテーション作成
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 16:9
pres.author = 'Treasure AI';
pres.company = 'Treasure Data';

// =====================
// タイトルスライド
// =====================
function createTitleSlide(title, subtitle) {
  const slide = pres.addSlide();

  // ✅ v4での正しい背景指定（ソリッドカラー）
  slide.background = { color: COLORS.navy };

  // タイトル
  slide.addText(title, {
    x: 0.94, y: 2.37, w: 9.94, h: 1.64,
    fontFace: 'Arial',
    fontSize: 40,
    bold: true,
    color: COLORS.white,
    align: 'left',
  });

  // サブタイトル
  slide.addText(subtitle, {
    x: 0.94, y: 3.8, w: 6, h: 0.5,
    fontFace: 'Arial',
    fontSize: 20,
    color: COLORS.pink,
    align: 'left',
  });

  // 装飾シェイプ（グラデーション風）
  // ✅ v4では文字列リテラルでシェイプタイプを指定
  slide.addShape('ellipse', {
    x: 10, y: 0.5, w: 3, h: 3,
    fill: { color: COLORS.purple, transparency: 60 },
    line: { width: 0 }, // ✅ 枠線を消す場合はwidth: 0
  });

  slide.addShape('ellipse', {
    x: 11.5, y: 5.5, w: 2, h: 2,
    fill: { color: COLORS.pink, transparency: 50 },
    line: { width: 0 },
  });
}

// =====================
// コンテンツスライド
// =====================
function createContentSlide(title, subtitle, bullets) {
  const slide = pres.addSlide();

  // ✅ 白背景
  slide.background = { color: COLORS.white };

  // タイトル
  slide.addText(title, {
    x: 0.38, y: 0.3, w: 9, h: 0.7,
    fontFace: 'Arial',
    fontSize: 28,
    bold: true,
    color: COLORS.black,
  });

  // サブタイトル（オプション）
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.38, y: 0.95, w: 7, h: 0.35,
      fontFace: 'Arial',
      fontSize: 16,
      color: COLORS.navy,
    });
  }

  // 本文（箇条書き）
  slide.addText(bullets, {
    x: 0.38, y: subtitle ? 1.4 : 1.1,
    w: 5.5, h: 4.5,
    fontFace: 'Arial',
    fontSize: 14,
    color: COLORS.black,
    bullet: true,
    valign: 'top',
  });

  // 装飾ボックス（右側）
  slide.addShape('roundRect', {
    x: 7, y: 1.5, w: 5.5, h: 4,
    fill: { color: COLORS.lilac },
    line: { color: COLORS.purple, width: 2 },
  });

  // ボックス内テキスト
  slide.addText('ビジュアル要素\nここに画像やチャートを\n配置できます', {
    x: 7.2, y: 2.8, w: 5.1, h: 1,
    fontFace: 'Arial',
    fontSize: 14,
    color: COLORS.navy,
    align: 'center',
    valign: 'middle',
  });
}

// =====================
// 3カラムスライド
// =====================
function create3ColumnSlide(title, columns) {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.white };

  // タイトル
  slide.addText(title, {
    x: 0.38, y: 0.3, w: 12, h: 0.7,
    fontFace: 'Arial',
    fontSize: 28,
    bold: true,
    color: COLORS.black,
  });

  // 3カラム
  const colWidth = 3.8;
  const colHeight = 4.5;
  const startY = 1.4;
  const spacing = 0.3;

  columns.forEach((col, idx) => {
    const x = 0.38 + (colWidth + spacing) * idx;

    // カラムボックス
    slide.addShape('roundRect', {
      x: x, y: startY, w: colWidth, h: colHeight,
      fill: { color: COLORS.white },
      line: { color: COLORS.purple, width: 2 },
    });

    // アイコン（円）
    slide.addShape('ellipse', {
      x: x + (colWidth / 2 - 0.4),
      y: startY + 0.3,
      w: 0.8, h: 0.8,
      fill: { color: COLORS.purple },
      line: { width: 0 },
    });

    // ヘッダー
    slide.addText(col.header, {
      x: x, y: startY + 1.3, w: colWidth, h: 0.5,
      fontFace: 'Arial',
      fontSize: 18,
      bold: true,
      color: COLORS.navy,
      align: 'center',
    });

    // 本文
    slide.addText(col.text, {
      x: x + 0.2, y: startY + 1.9, w: colWidth - 0.4, h: 2.3,
      fontFace: 'Arial',
      fontSize: 13,
      color: COLORS.black,
      align: 'left',
      valign: 'top',
    });
  });
}

// =====================
// Thank Youスライド
// =====================
function createThankYouSlide() {
  const slide = pres.addSlide();
  slide.background = { color: COLORS.navy };

  slide.addText('Thank You', {
    x: 0, y: 2.5, w: 13.33, h: 1.5,
    fontFace: 'Arial',
    fontSize: 60,
    bold: true,
    color: COLORS.white,
    align: 'center',
  });

  slide.addText("Let's build something amazing", {
    x: 0, y: 4.3, w: 13.33, h: 0.5,
    fontFace: 'Arial',
    fontSize: 20,
    color: COLORS.pink,
    align: 'center',
  });

  // 装飾シェイプ
  slide.addShape('ellipse', {
    x: 1, y: 1, w: 2.5, h: 2.5,
    fill: { color: COLORS.purple, transparency: 70 },
    line: { width: 0 },
  });

  slide.addShape('ellipse', {
    x: 10, y: 4.5, w: 2, h: 2,
    fill: { color: COLORS.pink, transparency: 60 },
    line: { width: 0 },
  });
}

// =====================
// サンプルスライド生成
// =====================

// 1. タイトルスライド
createTitleSlide(
  'Treasure AI Platform Overview',
  'The Agentic Experience Platform'
);

// 2. コンテンツスライド
createContentSlide(
  'What is Treasure AI?',
  'エンタープライズ向けAIエクスペリエンスプラットフォーム',
  [
    { text: 'リアルタイムパーソナライゼーション', options: { fontSize: 14 } },
    { text: 'AIエージェントによる自動化', options: { fontSize: 14 } },
    { text: 'データ活用の民主化', options: { fontSize: 14 } },
  ]
);

// 3. 3カラムスライド
create3ColumnSlide(
  'Key Features',
  [
    {
      header: 'Real-Time',
      text: 'リアルタイムでの顧客理解とパーソナライゼーションを実現'
    },
    {
      header: 'AI-Powered',
      text: 'AIエージェントが業務を自動化し、生産性を向上'
    },
    {
      header: 'Enterprise-Ready',
      text: 'エンタープライズグレードのセキュリティとスケーラビリティ'
    },
  ]
);

// 4. Thank Youスライド
createThankYouSlide();

// =====================
// 保存
// =====================
pres.writeFile({ fileName: 'TreasureAI_Presentation_v4.pptx' });
console.log('✅ プレゼンテーション生成完了: TreasureAI_Presentation_v4.pptx');
console.log('');
console.log('📝 Notes:');
console.log('  - pptxgenjs v4 対応版');
console.log('  - グラデーション背景は非対応のため、単色 + 装飾シェイプで代替');
console.log('  - ShapeType enum不使用（文字列リテラルで指定）');
console.log('  - ロゴ画像は別途追加してください');
