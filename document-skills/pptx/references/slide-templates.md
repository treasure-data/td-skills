# Slide Type Templates

Complete HTML templates for each slide type. All follow [HTML rules](html-rules.md).

## Common Structure

Every slide shares this base:

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
html { background: #ffffff; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif;
  display: flex; flex-direction: column;
}
.header { background: {{primaryColor}}; padding: 24pt 30pt; }
.header h1 { color: #ffffff; font-size: 28pt; margin: 0; }
.content { flex: 1; padding: 30pt; padding-bottom: 48pt; }
</style>
</head>
<body>
  <!-- slide content -->
</body>
</html>
```

## title

Opening slide. Use gradient background, centered large text.

```html
<body style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%);">
  <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 60pt;">
    <h1 style="color: #ffffff; font-size: 48pt; margin: 0 0 24pt 0;">Presentation Title</h1>
    <p style="color: #ffffff; font-size: 24pt; margin: 0; opacity: 0.9;">Subtitle or tagline</p>
  </div>
</body>
```

## agenda

Numbered list of topics.

```html
<div class="header"><h1>Agenda</h1></div>
<div class="content">
  <ol style="font-size: 18pt; color: #333333; margin: 0; padding-left: 30pt; line-height: 2.2;">
    <li>Introduction and Context</li>
    <li>Market Analysis</li>
    <li>Product Strategy</li>
    <li>Financial Projections</li>
    <li>Next Steps</li>
  </ol>
</div>
```

## content

Standard text with optional side content. Two-column layout with flex.

```html
<div class="header"><h1>Key Features</h1></div>
<div class="content" style="display: flex; gap: 30pt;">
  <div style="flex: 1;">
    <h2 style="color: {{primaryColor}}; font-size: 20pt; margin: 0 0 16pt 0;">Overview</h2>
    <ul style="font-size: 16pt; color: #333333; margin: 0; padding-left: 24pt;">
      <li style="margin-bottom: 12pt;">Feature 1: Brief description</li>
      <li style="margin-bottom: 12pt;">Feature 2: Brief description</li>
      <li style="margin-bottom: 12pt;">Feature 3: Brief description</li>
    </ul>
  </div>
  <div style="flex: 1;">
    <div id="image1" class="placeholder" style="width: 100%; height: 250pt;"></div>
  </div>
</div>
```

## chart

Data visualization with chart placeholder.

```html
<div class="header"><h1>Sales Performance</h1></div>
<div class="content">
  <div id="chart1" class="placeholder" style="width: 100%; height: 260pt;"></div>
  <p style="font-size: 12pt; color: #999999; margin: 12pt 0 0 0;">Source: Internal sales data, Q1-Q4 2024</p>
</div>
```

## table

Structured data display.

```html
<div class="header"><h1>Quarterly Results</h1></div>
<div class="content">
  <div id="table1" class="placeholder" style="width: 100%; height: 260pt;"></div>
  <p style="font-size: 12pt; color: #999999; margin: 12pt 0 0 0;">*All figures in millions</p>
</div>
```

## comparison

Side-by-side comparison with visual separation.

```html
<div class="header"><h1>Option A vs Option B</h1></div>
<div class="content" style="display: flex; gap: 20pt;">
  <div style="flex: 1; background: #f8f9fa; border-radius: 8pt; padding: 20pt;">
    <h2 style="color: {{primaryColor}}; font-size: 20pt; margin: 0 0 16pt 0;">Option A</h2>
    <ul style="font-size: 15pt; color: #333333; margin: 0; padding-left: 20pt;">
      <li style="margin-bottom: 10pt;">Advantage 1</li>
      <li style="margin-bottom: 10pt;">Advantage 2</li>
      <li style="margin-bottom: 10pt;">Advantage 3</li>
    </ul>
  </div>
  <div style="flex: 1; background: #f8f9fa; border-radius: 8pt; padding: 20pt;">
    <h2 style="color: {{secondaryColor}}; font-size: 20pt; margin: 0 0 16pt 0;">Option B</h2>
    <ul style="font-size: 15pt; color: #333333; margin: 0; padding-left: 20pt;">
      <li style="margin-bottom: 10pt;">Advantage 1</li>
      <li style="margin-bottom: 10pt;">Advantage 2</li>
      <li style="margin-bottom: 10pt;">Advantage 3</li>
    </ul>
  </div>
</div>
```

## timeline

Horizontal timeline with milestones.

```html
<div class="header"><h1>Product Roadmap</h1></div>
<div class="content" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16pt;">
  <div style="flex: 1; text-align: center;">
    <div style="background: {{primaryColor}}; color: white; border-radius: 50%; width: 56pt; height: 56pt; display: flex; align-items: center; justify-content: center; margin: 0 auto 12pt; font-size: 14pt;">
      <p style="color: #ffffff; margin: 0; font-size: 14pt;">Q1</p>
    </div>
    <p style="font-weight: bold; font-size: 15pt; margin: 0 0 6pt 0;">Phase 1</p>
    <p style="font-size: 13pt; color: #666666; margin: 0;">Initial launch and validation</p>
  </div>
  <div style="flex: 1; text-align: center;">
    <div style="background: {{secondaryColor}}; color: white; border-radius: 50%; width: 56pt; height: 56pt; display: flex; align-items: center; justify-content: center; margin: 0 auto 12pt; font-size: 14pt;">
      <p style="color: #ffffff; margin: 0; font-size: 14pt;">Q2</p>
    </div>
    <p style="font-weight: bold; font-size: 15pt; margin: 0 0 6pt 0;">Phase 2</p>
    <p style="font-size: 13pt; color: #666666; margin: 0;">Feature expansion</p>
  </div>
  <div style="flex: 1; text-align: center;">
    <div style="background: {{accentColor}}; color: white; border-radius: 50%; width: 56pt; height: 56pt; display: flex; align-items: center; justify-content: center; margin: 0 auto 12pt; font-size: 14pt;">
      <p style="color: #ffffff; margin: 0; font-size: 14pt;">Q3</p>
    </div>
    <p style="font-weight: bold; font-size: 15pt; margin: 0 0 6pt 0;">Phase 3</p>
    <p style="font-size: 13pt; color: #666666; margin: 0;">Market expansion</p>
  </div>
</div>
```

## conclusion

Summary with call-to-action.

```html
<div class="header"><h1>Key Takeaways</h1></div>
<div class="content">
  <ul style="font-size: 18pt; color: #333333; margin: 0 0 30pt 0; padding-left: 24pt; line-height: 2.0;">
    <li>Key point 1: Brief summary of main insight</li>
    <li>Key point 2: Brief summary of second insight</li>
    <li>Key point 3: Brief summary of third insight</li>
  </ul>
  <div style="padding: 20pt; background: #f0f4f8; border-left: 4pt solid {{accentColor}}; border-radius: 0 8pt 8pt 0;">
    <p style="font-weight: bold; font-size: 18pt; margin: 0 0 8pt 0; color: {{primaryColor}};">Next Steps</p>
    <p style="margin: 0; font-size: 16pt; color: #333333;">Contact us for a detailed discussion and implementation plan.</p>
  </div>
</div>
```

## Color Palettes

Replace `{{primaryColor}}`, `{{secondaryColor}}`, `{{accentColor}}` with theme colors:

| Theme | Primary | Secondary | Accent |
|-------|---------|-----------|--------|
| Corporate | #1A365D | #2B6CB0 | #E53E3E |
| Modern | #2D3748 | #4A5568 | #38B2AC |
| Vibrant | #553C9A | #6B46C1 | #ED8936 |
| Nature | #22543D | #38A169 | #D69E2E |
| Ocean | #1A365D | #3182CE | #63B3ED |

## Layout Patterns

```html
<!-- Two equal columns -->
<div style="display: flex; gap: 30pt;">
  <div style="flex: 1;"><!-- Left --></div>
  <div style="flex: 1;"><!-- Right --></div>
</div>

<!-- Content with sidebar (2:1) -->
<div style="display: flex; gap: 30pt;">
  <div style="flex: 2;"><!-- Main --></div>
  <div style="flex: 1;"><!-- Sidebar --></div>
</div>

<!-- Three columns -->
<div style="display: flex; gap: 20pt;">
  <div style="flex: 1;"><!-- Col 1 --></div>
  <div style="flex: 1;"><!-- Col 2 --></div>
  <div style="flex: 1;"><!-- Col 3 --></div>
</div>

<!-- Centered content -->
<div style="display: flex; justify-content: center; align-items: center; height: 100%;">
  <div style="text-align: center; max-width: 500pt;"><!-- Content --></div>
</div>
```
