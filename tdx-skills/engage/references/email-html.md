# Email HTML Patterns for Engage

## Table of Contents

1. [Skeleton](#skeleton)
2. [Key Rules](#key-rules)
3. [Header](#header)
4. [Hero Section](#hero-section)
5. [Product Card](#product-card)
6. [CTA Button](#cta-button)
7. [Coupon Block](#coupon-block)
8. [Footer](#footer)
9. [Personalization](#personalization)
10. [Responsive Media Query](#responsive-media-query)

## Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Email Title</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
<o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml>
<![endif]-->
<style>
*{box-sizing:border-box}body{margin:0;padding:0}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:inherit!important}
@media (max-width:660px){.row-content{width:100%!important}.stack .column{width:100%;display:block}}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5">
<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f5f5">
<tbody><tr><td align="center" style="padding:20px 10px">

<table class="row-content" width="640" border="0" cellpadding="0" cellspacing="0" role="presentation"
  style="background-color:#ffffff;max-width:640px;margin:0 auto">
<tbody>
  <!-- HEADER -->
  <!-- HERO -->
  <!-- CONTENT -->
  <!-- CTA -->
  <!-- FOOTER -->
</tbody>
</table>

</td></tr></tbody></table>
</body>
</html>
```

## Key Rules

- **Table-based layout** — use `<table>` for structure, not `<div>`
- **Inline CSS** — all styles must be inline (Gmail strips `<style>` blocks on some clients)
- **Max width 640px** — content area for best desktop/mobile rendering
- **`role="presentation"`** — on all layout tables for accessibility
- **`cellspacing="0" cellpadding="0"`** — on all tables
- **HTTPS images only** — no HTTP, no data URIs
- **No JavaScript** — email clients strip all JS
- Minimal `<style>` block is OK for `@media` queries (responsive) and basic resets

## Header

```html
<tr><td style="background-color:#E4002B;padding:20px 30px;text-align:center">
  <table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
    <td style="text-align:left;vertical-align:middle">
      <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px">
        BRAND NAME
      </span>
    </td>
    <td style="text-align:right;vertical-align:middle;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#ffffff">
      Spring 2026
    </td>
  </tr></table>
</td></tr>
```

## Hero Section

```html
<tr><td style="background-color:#E4002B;padding:40px 30px;text-align:center">
  <p style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FFD4DB;letter-spacing:3px;text-transform:uppercase">
    LIMITED TIME
  </p>
  <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:36px;font-weight:700;color:#ffffff;line-height:1.2">
    Headline Text
  </h1>
  <p style="margin:0 0 24px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;color:#FFD4DB;line-height:1.6">
    Description text goes here.
  </p>
  <!-- CTA button here -->
</td></tr>
```

## Product Card

Two-column layout with image placeholder and details:

```html
<tr><td style="padding:20px 30px">
  <table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
    <td class="product-col" width="45%" style="vertical-align:top;padding:10px">
      <div style="background-color:#FFF5F7;border-radius:12px;padding:30px;text-align:center">
        <span style="font-size:72px">EMOJI</span>
      </div>
    </td>
    <td class="product-col" width="55%" style="vertical-align:middle;padding:10px 10px 10px 20px">
      <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#E4002B;text-transform:uppercase;letter-spacing:2px;font-weight:700">NEW</p>
      <h2 style="margin:0 0 8px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:22px;color:#333;font-weight:700">Product Name</h2>
      <p style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#666;line-height:1.5">Product description.</p>
      <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:20px;color:#E4002B;font-weight:700">
        ¥490 <span style="font-size:12px;color:#999;text-decoration:line-through;font-weight:400">¥590</span>
      </p>
    </td>
  </tr></table>
</td></tr>
```

## CTA Button

```html
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto">
<tr><td style="background-color:#E4002B;border-radius:30px;padding:14px 36px">
  <a href="https://example.com" target="_blank"
     style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:1px">
    Call to Action
  </a>
</td></tr>
</table>
```

Inverted (white on color background):
```html
<td style="background-color:#ffffff;border-radius:30px;padding:14px 36px">
  <a href="..." style="...;color:#E4002B;...">Call to Action</a>
</td>
```

## Coupon Block

```html
<tr><td style="padding:0 30px 30px">
  <table width="100%" border="0" cellpadding="0" cellspacing="0"
    style="background-color:#FFF5F7;border-radius:12px;border:2px dashed #E4002B">
  <tr><td style="padding:24px;text-align:center">
    <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#E4002B;text-transform:uppercase;letter-spacing:2px">MEMBER SPECIAL</p>
    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;color:#E4002B;font-weight:700">¥200 OFF</p>
    <p style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#666">Minimum spend ¥1,000</p>
    <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;color:#E4002B;font-weight:700;background:#fff;display:inline-block;padding:8px 20px;border-radius:6px;letter-spacing:3px">
      COUPONCODE
    </p>
  </td></tr>
  </table>
</td></tr>
```

## Footer

```html
<tr><td style="background-color:#333;padding:30px;text-align:center">
  <p style="margin:0 0 10px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#aaa;line-height:1.6">
    Company Name<br>Address Line
  </p>
  <p style="margin:0 0 10px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#aaa">
    <a href="#" style="color:#ccc;text-decoration:underline">Website</a>&nbsp;|&nbsp;
    <a href="#" style="color:#ccc;text-decoration:underline">Preferences</a>&nbsp;|&nbsp;
    <a href="#" style="color:#ccc;text-decoration:underline">Unsubscribe</a>
  </p>
  <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#888">
    &copy; 2026 Company. All rights reserved.
  </p>
</td></tr>
```

## Personalization

Liquid merge tags — rendered at send time by Engage:

```html
<!-- In subject line or HTML body -->
{{profile.first_name}}
{{profile.customer_segment}}
{{profile.lifetime_spend}}

<!-- Conditional content -->
{% if profile.customer_segment == 'Gold' %}
  <p>Exclusive Gold member offer!</p>
{% endif %}
```

## Responsive Media Query

Place in `<style>` block in `<head>` — works in Apple Mail, iOS Mail, Android. Gmail app ignores it but uses sensible defaults at 640px width.

```css
@media (max-width:660px) {
  .row-content { width: 100% !important }
  .stack .column { width: 100%; display: block }
  .product-col { width: 100% !important; display: block !important }
  .cta-btn { width: 80% !important }
}
```
