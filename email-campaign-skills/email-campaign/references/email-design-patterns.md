# HTML Email Design Patterns

## Structure

Every email follows this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Title</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;max-width:600px;width:100%;">

          <!-- BRAND HEADER -->
          <!-- HERO IMAGE -->
          <!-- MAIN CONTENT -->
          <!-- BODY IMAGE (optional) -->
          <!-- CTA SECTION -->
          <!-- FOOTER -->

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Sections

### Brand Header (text only, no logo image)
```html
<tr>
  <td align="center" style="padding:32px 0 24px;">
    <div style="text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;color:#111111;letter-spacing:1px;">
      BRAND NAME
    </div>
  </td>
</tr>
```

### Hero Image
```html
<tr>
  <td style="padding:0 0 32px;">
    <img src="https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=1200&q=80"
         alt="Descriptive alt text for accessibility"
         width="600"
         style="width:100%;max-width:600px;display:block;height:auto;border:0;">
  </td>
</tr>
```

### CTA Button
```html
<table role="presentation" cellspacing="0" cellpadding="0">
  <tr>
    <td align="center" style="border-radius:4px;background-color:#111111;">
      <a href="#" style="display:inline-block;padding:16px 48px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">
        Call To Action
      </a>
    </td>
  </tr>
</table>
```

### Footer
```html
<tr>
  <td style="padding:32px 40px;background-color:#f9f9f9;border-top:1px solid #e0e0e0;">
    <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#666666;text-align:center;">
      You're receiving this email because you're a valued member of our loyalty program.
    </p>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#666666;text-align:center;">
      <a href="#" style="color:#666666;text-decoration:underline;">Update Preferences</a> |
      <a href="#" style="color:#666666;text-decoration:underline;">Unsubscribe</a>
    </p>
  </td>
</tr>
```

## Merge Tags

Use Liquid syntax for personalization:
- `{{profile.first_name}}` — customer first name
- `{{profile.loyalty_points}}` — current points balance
- `{{profile.tier_name}}` — loyalty tier (Bronze, Silver, Gold, Platinum)
- `{{profile.points_to_next_tier}}` — points needed for next tier

Merge tags render as literal text in the preview. They are replaced at send time by Treasure Engage.

## Imagery

- Use only HTTPS URLs from Unsplash (`images.unsplash.com`) or Pexels (`images.pexels.com`).
- Hero image: `?auto=format&fit=crop&w=1200&q=80`
- Body image: `?auto=format&fit=crop&w=1200&q=80` with `border-radius:8px`
- Always include descriptive `alt` text.

## Compatibility

- Table-based layout only. No `<div>` for structure.
- All CSS inline. No `<style>` blocks (stripped by Gmail).
- `role="presentation"` on all layout tables.
- Max width 600px for the content area.
- Use `cellspacing="0" cellpadding="0"` on all tables.
- Test-safe across Outlook, Gmail, Apple Mail, and Yahoo Mail.
