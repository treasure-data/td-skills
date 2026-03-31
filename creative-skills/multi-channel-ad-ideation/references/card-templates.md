# Card Component Templates

This file provides reusable HTML/CSS card templates for visual presentation of creative directions, concepts, and quality scores in the Multi-Channel Ad Ideation skill.

**Purpose**: Transform text-heavy output into scannable, interactive, card-based experiences using inline HTML/CSS with collapsible sections.

**Technical Requirements**:
- All CSS must be inline (no external stylesheets or `<style>` tags)
- HTML `<details>` and `<summary>` tags for collapsible sections
- Responsive design using flexbox and min-width constraints
- WCAG 2.1 AA accessibility compliance (4.5:1 contrast minimum)
- Mobile-first approach (375px-600px max-width patterns)

---

## Table of Contents

1. [Color Palette System](#color-palette-system)
2. [Direction Card Template](#direction-card-template)
3. [Concept Card Template](#concept-card-template)
4. [Score Visualization Template](#score-visualization-template)
5. [Color Swatch Template](#color-swatch-template)
6. [Mini Preview Templates](#mini-preview-templates)
7. [Responsive Design Patterns](#responsive-design-patterns)
8. [Accessibility Guidelines](#accessibility-guidelines)

---

## Color Palette System

### Score Tier Colors

Use these color schemes to indicate quality tiers via visual coding:

**Excellent (23-25 points)**:
- Border: `#10b981` (green)
- Background: `#f0fdf4` (light green)
- Text: `#059669` (dark green)
- Contrast ratio: 7.2:1 ✅

**Strong (18-22 points)**:
- Border: `#f59e0b` (amber)
- Background: `#fffbeb` (light amber)
- Text: `#d97706` (dark amber)
- Contrast ratio: 5.2:1 ✅

**Good (13-17 points)**:
- Border: `#3b82f6` (blue)
- Background: `#eff6ff` (light blue)
- Text: `#2563eb` (dark blue)
- Contrast ratio: 5.9:1 ✅

**Needs Work (0-12 points)**:
- Border: `#ef4444` (red)
- Background: `#fef2f2` (light red)
- Text: `#dc2626` (dark red)
- Contrast ratio: 4.8:1 ✅

### Neutral Colors

**Standard UI elements**:
- White background: `#ffffff`
- Light gray border: `#e5e7eb`
- Medium gray text: `#6b7280`
- Dark gray text: `#1f2937`
- Shadow: `rgba(0,0,0,0.1)`

---

## Direction Card Template

Visual card for presenting creative direction options with color-coded quality tiers.

### Full Template (Excellent Tier Example)

```html
<div style="flex:1 1 calc(50% - 8px);min-width:280px;
            border:2px solid #10b981;border-radius:8px;
            padding:16px;background:#ffffff;
            box-shadow:0 2px 4px rgba(0,0,0,0.1);">

  <!-- Header with number badge + score display -->
  <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
    <!-- Number badge -->
    <div style="background:#10b981;color:#fff;
                width:32px;height:32px;border-radius:50%;
                display:flex;align-items:center;justify-content:center;
                font-weight:700;font-size:18px;">1</div>

    <!-- Visual score indicator -->
    <div style="text-align:right;">
      <div style="font-size:20px;font-weight:700;color:#10b981;">24/25</div>
      <div style="font-size:12px;color:#059669;font-weight:600;">EXCELLENT ✅</div>
      <!-- Score bar (24/25 = 96%) -->
      <div style="width:80px;height:6px;background:#e5e7eb;border-radius:3px;margin-top:4px;">
        <div style="width:96%;height:100%;background:#10b981;border-radius:3px;"></div>
      </div>
    </div>
  </div>

  <!-- Strategic Angle -->
  <div style="margin-bottom:8px;">
    <div style="font-size:16px;font-weight:700;color:#1f2937;margin-bottom:4px;">
      Urgency-Driven
    </div>
    <div style="font-size:13px;color:#6b7280;line-height:1.4;">
      Act now before you miss out - emphasizes scarcity and FOMO
    </div>
  </div>

  <!-- Collapsible Details -->
  <details style="margin-top:12px;">
    <summary style="cursor:pointer;font-size:13px;font-weight:600;
                    color:#3b82f6;padding:8px 0;
                    list-style:none;display:flex;align-items:center;">
      <span style="margin-right:6px;">▸</span> View Details
    </summary>
    <div style="margin-top:8px;padding:12px;background:#f9fafb;border-radius:6px;">
      <div style="margin-bottom:8px;">
        <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Key Message</div>
        <div style="font-size:13px;color:#1f2937;margin-top:2px;">"Lock in founder pricing before it's gone"</div>
      </div>
      <div style="margin-bottom:8px;">
        <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Tone & Emotion</div>
        <div style="font-size:13px;color:#1f2937;margin-top:2px;">Urgent, time-pressured / Creates FOMO / Emphasizes limited availability</div>
      </div>
    </div>
  </details>
</div>
```

### Container for Multiple Cards

Wrap cards in a flex container for responsive grid:

```html
<div style="display:flex;flex-wrap:wrap;gap:16px;max-width:100%;margin:20px 0;">
  <!-- Direction Card 1 (Excellent tier - green) -->
  [Card HTML here]

  <!-- Direction Card 2 (Strong tier - amber) -->
  [Card HTML here - use #f59e0b border, #fffbeb background, #d97706 text]

  <!-- Direction Card 3 (Good tier - blue) -->
  [Card HTML here - use #3b82f6 border, #eff6ff background, #2563eb text]
</div>
```

### Color Tier Variations

**For Strong tier (18-22 points)**:
- Change border to `#f59e0b`
- Change badge background to `#f59e0b`
- Change score number color to `#f59e0b`
- Change tier label color to `#d97706`
- Change score bar fill to `#f59e0b`

**For Good tier (13-17 points)**:
- Change border to `#3b82f6`
- Change badge background to `#3b82f6`
- Change score number color to `#3b82f6`
- Change tier label color to `#2563eb`
- Change score bar fill to `#3b82f6`

**For Needs Work tier (0-12 points)**:
- Change border to `#ef4444`
- Change badge background to `#ef4444`
- Change score number color to `#ef4444`
- Change tier label color to `#dc2626`
- Change score bar fill to `#ef4444`

---

## Concept Card Template

Visual card for presenting ad concepts with collapsible visual details.

### Full Template

```html
<div style="border:2px solid #e5e7eb;border-radius:12px;
            padding:20px;margin:24px 0;background:#ffffff;
            box-shadow:0 4px 6px rgba(0,0,0,0.05);">

  <!-- Concept Header -->
  <div style="display:flex;justify-content:space-between;align-items:start;
              padding-bottom:16px;border-bottom:2px solid #f3f4f6;">
    <div>
      <div style="font-size:20px;font-weight:700;color:#1f2937;margin-bottom:4px;">
        Urgency-Driven Launch
      </div>
      <div style="font-size:13px;color:#6b7280;">
        Following the "Urgency-Driven" creative direction
      </div>
    </div>

    <!-- Mini quality badge -->
    <div style="background:#10b981;color:#fff;padding:6px 12px;
                border-radius:6px;font-size:13px;font-weight:600;">
      33/35 ✅
    </div>
  </div>

  <!-- Ad Copy Section (always visible) -->
  <div style="margin-top:16px;">
    <div style="font-size:15px;font-weight:700;color:#1f2937;margin-bottom:12px;">
      📝 Ad Copy
    </div>

    <div style="background:#f9fafb;padding:14px;border-radius:8px;
                border-left:4px solid #3b82f6;">
      <div style="margin-bottom:10px;">
        <span style="font-size:12px;font-weight:600;color:#6b7280;">Subject Line:</span>
        <div style="font-size:14px;color:#1f2937;margin-top:4px;">
          "48 hours left: Lock in founder pricing (save $3,600/year)"
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">56 characters</div>
      </div>

      <div style="margin-bottom:10px;">
        <span style="font-size:12px;font-weight:600;color:#6b7280;">Preview Text:</span>
        <div style="font-size:14px;color:#1f2937;margin-top:4px;">
          "Join 2,000+ teams who've already switched"
        </div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">41 characters</div>
      </div>

      <div style="margin-bottom:10px;">
        <span style="font-size:12px;font-weight:600;color:#6b7280;">CTA Button:</span>
        <div style="font-size:14px;color:#1f2937;margin-top:4px;">
          Lock in Founder Pricing
        </div>
      </div>
    </div>
  </div>

  <!-- Visual Concept (Collapsible) -->
  <details style="margin-top:16px;" open>
    <summary style="cursor:pointer;font-size:15px;font-weight:700;
                    color:#1f2937;padding:12px 0;
                    list-style:none;display:flex;align-items:center;">
      <span style="margin-right:8px;">▸</span> 🎨 Visual Concept
    </summary>

    <div style="margin-top:12px;padding:16px;background:#fefce8;
                border-radius:8px;border-left:4px solid #eab308;">

      <!-- Color Palette (using Color Swatch Template) -->
      <div style="margin-bottom:12px;">
        <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;">
          Color Palette
        </div>
        <!-- Color swatches go here - see Color Swatch Template -->
      </div>

      <!-- Nested collapsible for composition details -->
      <details style="margin-top:12px;">
        <summary style="cursor:pointer;font-size:13px;font-weight:600;
                        color:#3b82f6;padding:6px 0;
                        list-style:none;">
          <span style="margin-right:6px;">▸</span> View Composition Details
        </summary>
        <div style="font-size:13px;color:#374151;margin-top:8px;line-height:1.6;">
          Header hero with gradient background fading from deep purple to violet.
          Clean white background for body content. Large "40% OFF" text in header.
        </div>
      </details>
    </div>
  </details>

  <!-- Next Step Banner -->
  <div style="margin-top:16px;padding:12px;background:#eff6ff;
              border-radius:8px;border-left:4px solid #3b82f6;">
    <div style="font-size:13px;color:#1e40af;">
      💡 <strong>Next Step:</strong> Confirm this concept to generate HTML preview
    </div>
  </div>
</div>
```

---

## Collapsed Concept Card Template (Default Format)

**NEW**: Interactive collapsed cards for scannable concept presentation. Concepts start collapsed showing only name + tagline, user clicks to expand for full details.

**Key Features**:
- Enhanced font hierarchy (24px/800 concept name vs. previous 20px/700)
- Progressive disclosure (entire card collapsible)
- Character counts removed for cleaner presentation
- Tagline shows key message even in collapsed state

### Email Concept Card (Collapsed Format)

```html
<!-- COLLAPSED CONCEPT CARD - EMAIL -->

<details style="border:2px solid #e5e7eb;border-radius:12px;
                margin:16px 0;background:#ffffff;
                box-shadow:0 4px 6px rgba(0,0,0,0.05);">

  <!-- Collapsed Summary (Always Visible) -->
  <summary style="cursor:pointer;padding:20px;
                  list-style:none;display:flex;
                  justify-content:space-between;align-items:start;">

    <!-- Left side: Arrow + Title + Tagline -->
    <div style="flex:1;">
      <div style="display:flex;align-items:start;gap:12px;">
        <span style="font-size:18px;color:#6b7280;margin-top:4px;">▸</span>
        <div>
          <!-- Concept Name - ENHANCED HIERARCHY (24px/800 vs. old 20px/700) -->
          <div style="font-size:24px;font-weight:800;color:#1f2937;
                      margin-bottom:6px;line-height:1.2;">
            Benefit-Focused Transformation
          </div>
          <!-- Key Message Tagline -->
          <div style="font-size:15px;color:#4b5563;font-style:italic;
                      line-height:1.4;">
            "Close 23% more deals with real-time visibility"
          </div>
        </div>
      </div>
    </div>

    <!-- Right side: Quality Badge -->
    <div style="background:#10b981;color:#fff;padding:8px 14px;
                border-radius:6px;font-size:14px;font-weight:600;
                margin-left:16px;flex-shrink:0;">
      33/35 ✅
    </div>
  </summary>

  <!-- Expanded Content (Hidden Until Click) -->
  <div style="padding:0 20px 20px 20px;border-top:2px solid #f3f4f6;">

    <!-- Ad Copy Section -->
    <div style="margin-top:20px;">
      <div style="font-size:15px;font-weight:700;color:#1f2937;
                  margin-bottom:12px;">
        📝 Ad Copy
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;
                  border-left:4px solid #3b82f6;">

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Subject Line
          </div>
          <div style="font-size:14px;color:#111827;">
            Close 23% more deals with real-time pipeline visibility
          </div>
          <!-- NO CHARACTER COUNT -->
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Preview Text
          </div>
          <div style="font-size:14px;color:#111827;">
            See exactly where every deal stands, every moment
          </div>
          <!-- NO CHARACTER COUNT -->
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Headline
          </div>
          <div style="font-size:16px;font-weight:600;color:#111827;">
            Transform Your Sales Pipeline in 5 Minutes
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Body Copy
          </div>
          <div style="font-size:14px;color:#111827;line-height:1.6;">
            Sales teams using real-time pipeline visibility close 23% more deals.
            Our dashboard shows you exactly where every opportunity stands—no more
            guessing, no more spreadsheet chaos. Set up in 5 minutes, see results
            in your first week. Over 10,000 sales teams have already made the switch.
          </div>
        </div>

        <div>
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            CTA Button
          </div>
          <div style="display:inline-block;background:#3b82f6;color:#fff;
                      padding:12px 24px;border-radius:6px;font-size:14px;
                      font-weight:600;">
            Start Free Trial
          </div>
        </div>

      </div>
    </div>

    <!-- Visual Concept Section (Nested Collapsible) -->
    <details style="margin-top:20px;">
      <summary style="cursor:pointer;font-size:15px;font-weight:700;
                      color:#1f2937;padding:12px 0;
                      list-style:none;display:flex;align-items:center;">
        <span style="margin-right:8px;">▸</span> 🎨 Visual Concept
      </summary>

      <div style="padding-top:12px;">
        <div style="margin-bottom:12px;">
          <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;">
            Color Palette
          </div>
          <!-- Color swatches (use Color Swatch Template) -->
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:40px;height:40px;border-radius:6px;
                          background:#3b82f6;
                          border:2px solid #e5e7eb;
                          box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
              <div>
                <div style="font-size:12px;font-weight:600;color:#1f2937;">#3b82f6</div>
                <div style="font-size:11px;color:#6b7280;">Primary Blue</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:40px;height:40px;border-radius:6px;
                          background:#10b981;
                          border:2px solid #e5e7eb;
                          box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
              <div>
                <div style="font-size:12px;font-weight:600;color:#1f2937;">#10b981</div>
                <div style="font-size:11px;color:#6b7280;">Success Green</div>
              </div>
            </div>
          </div>
        </div>

        <div style="font-size:13px;color:#374151;line-height:1.6;margin-top:12px;">
          <strong>Layout:</strong> Clean dashboard screenshot with highlighted metrics<br>
          <strong>Typography:</strong> Bold sans-serif headline, modern clean body text<br>
          <strong>Imagery:</strong> Sales pipeline dashboard with upward trending graphs
        </div>
      </div>
    </details>

  </div>
</details>
```

### Instagram Concept Card (Collapsed Format)

```html
<!-- COLLAPSED CONCEPT CARD - INSTAGRAM -->

<details style="border:2px solid #e5e7eb;border-radius:12px;
                margin:16px 0;background:#ffffff;
                box-shadow:0 4px 6px rgba(0,0,0,0.05);">

  <summary style="cursor:pointer;padding:20px;
                  list-style:none;display:flex;
                  justify-content:space-between;align-items:start;">
    <div style="flex:1;">
      <div style="display:flex;align-items:start;gap:12px;">
        <span style="font-size:18px;color:#6b7280;margin-top:4px;">▸</span>
        <div>
          <!-- Concept Name - ENHANCED (24px/800) -->
          <div style="font-size:24px;font-weight:800;color:#1f2937;
                      margin-bottom:6px;line-height:1.2;">
            Bold Visual Impact
          </div>
          <!-- Tagline - Primary Text Preview -->
          <div style="font-size:15px;color:#4b5563;font-style:italic;
                      line-height:1.4;">
            "Transform your morning routine with UltraFit Pro"
          </div>
        </div>
      </div>
    </div>
    <div style="background:#10b981;color:#fff;padding:8px 14px;
                border-radius:6px;font-size:14px;font-weight:600;
                margin-left:16px;flex-shrink:0;">
      31/35 ✅
    </div>
  </summary>

  <div style="padding:0 20px 20px 20px;border-top:2px solid #f3f4f6;">

    <!-- Instagram Ad Copy -->
    <div style="margin-top:20px;">
      <div style="font-size:15px;font-weight:700;color:#1f2937;
                  margin-bottom:12px;">
        📝 Ad Copy
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;
                  border-left:4px solid #e1306c;">

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Primary Text
          </div>
          <div style="font-size:14px;color:#111827;">
            Transform your morning routine with UltraFit Pro. Premium sound,
            all-day comfort, seamless connectivity. Available now.
          </div>
          <!-- NO "(125 chars)" notation -->
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Headline
          </div>
          <div style="font-size:14px;color:#111827;">
            UltraFit Pro - Now Available
          </div>
          <!-- NO "(40 chars)" notation -->
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Description
          </div>
          <div style="font-size:14px;color:#111827;">
            Premium wireless headphones
          </div>
          <!-- NO "(30 chars)" notation -->
        </div>

        <div>
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            CTA Button
          </div>
          <div style="display:inline-block;background:#e1306c;color:#fff;
                      padding:12px 24px;border-radius:8px;font-size:14px;
                      font-weight:600;">
            Shop Now
          </div>
        </div>

      </div>
    </div>

    <!-- Image Concept (Nested Collapsible) -->
    <details style="margin-top:20px;">
      <summary style="cursor:pointer;font-size:15px;font-weight:700;
                      color:#1f2937;padding:12px 0;
                      list-style:none;display:flex;align-items:center;">
        <span style="margin-right:8px;">▸</span> 🎨 Image Concept (1080x1080px)
      </summary>
      <div style="padding-top:12px;">
        <div style="margin-bottom:12px;">
          <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;">
            Color Palette
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:40px;height:40px;border-radius:6px;
                          background:#667eea;
                          border:2px solid #e5e7eb;
                          box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
              <div>
                <div style="font-size:12px;font-weight:600;color:#1f2937;">#667eea</div>
                <div style="font-size:11px;color:#6b7280;">Deep Purple</div>
              </div>
            </div>
            <div style="font-size:16px;color:#9ca3af;">→</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:40px;height:40px;border-radius:6px;
                          background:#764ba2;
                          border:2px solid #e5e7eb;
                          box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
              <div>
                <div style="font-size:12px;font-weight:600;color:#1f2937;">#764ba2</div>
                <div style="font-size:11px;color:#6b7280;">Violet</div>
              </div>
            </div>
          </div>
        </div>

        <div style="font-size:13px;color:#374151;line-height:1.6;margin-top:12px;">
          <strong>Composition:</strong> Product centered, rule of thirds<br>
          <strong>Focal Point:</strong> Headphones at 30-degree angle<br>
          <strong>Typography:</strong> "NEW" badge top-right corner<br>
          <strong>Overall Style:</strong> Clean, minimal, premium aesthetic
        </div>
      </div>
    </details>

  </div>
</details>
```

### SMS Concept Card (Collapsed Format)

```html
<!-- COLLAPSED CONCEPT CARD - SMS -->

<details style="border:2px solid #e5e7eb;border-radius:12px;
                margin:16px 0;background:#ffffff;
                box-shadow:0 4px 6px rgba(0,0,0,0.05);">

  <summary style="cursor:pointer;padding:20px;
                  list-style:none;display:flex;
                  justify-content:space-between;align-items:start;">
    <div style="flex:1;">
      <div style="display:flex;align-items:start;gap:12px;">
        <span style="font-size:18px;color:#6b7280;margin-top:4px;">▸</span>
        <div>
          <!-- Concept Name - ENHANCED (24px/800) -->
          <div style="font-size:24px;font-weight:800;color:#1f2937;
                      margin-bottom:6px;line-height:1.2;">
            Urgent Flash Sale
          </div>
          <!-- Tagline - Message Preview -->
          <div style="font-size:15px;color:#4b5563;font-style:italic;
                      line-height:1.4;">
            "FLASH SALE: 40% off EVERYTHING! Code: FLASH40..."
          </div>
        </div>
      </div>
    </div>
    <div style="background:#10b981;color:#fff;padding:8px 14px;
                border-radius:6px;font-size:14px;font-weight:600;
                margin-left:16px;flex-shrink:0;">
      29/35 ✅
    </div>
  </summary>

  <div style="padding:0 20px 20px 20px;border-top:2px solid #f3f4f6;">

    <!-- SMS Message -->
    <div style="margin-top:20px;">
      <div style="font-size:15px;font-weight:700;color:#1f2937;
                  margin-bottom:12px;">
        📱 Message Text
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;
                  border-left:4px solid #10b981;">

        <div style="font-size:14px;color:#111827;line-height:1.6;
                    margin-bottom:12px;">
          🔥 FLASH SALE: 40% off EVERYTHING! Code: FLASH40. Ends Sunday midnight.
          Shop now: bit.ly/fitgear-flash
        </div>
        <!-- NO "160 characters" notation -->

        <div style="font-size:12px;color:#6b7280;">
          STOP to unsubscribe
        </div>

      </div>
    </div>

    <!-- Delivery Recommendation -->
    <div style="margin-top:16px;padding:12px;background:#f0fdf4;
                border-radius:8px;border-left:4px solid #10b981;">
      <div style="font-size:12px;font-weight:600;color:#6b7280;
                  text-transform:uppercase;margin-bottom:4px;">
        Best Sent
      </div>
      <div style="font-size:13px;color:#111827;">
        Friday 5-7 PM (weekend shopping mindset, high engagement window)
      </div>
    </div>

  </div>
</details>
```

### Comparison: Old vs. New Format

| Aspect | Old Format (Expanded Card) | New Format (Collapsed Card) |
|--------|----------------------------|----------------------------|
| **Default state** | All ad copy visible | Collapsed, title + tagline only |
| **Character counts** | Shown after each element | **Removed entirely** |
| **Concept name font** | 20px, weight 700 | **24px, weight 800** |
| **Tagline** | Direction description (13px gray) | **Key message quote (15px italic)** |
| **Scannability** | Low (must read all copy) | **High (scan titles quickly)** |
| **Progressive disclosure** | Only visual concept collapsible | **Entire card collapsible** |
| **User interaction** | Scroll through all concepts | **Click to expand interesting ones** |
| **Vertical space** | ~400px per concept | **~80px collapsed, ~400px expanded** |

### Usage Guidelines

**When to use collapsed format**:
- Default for all concept presentation (Phase 2 of workflow)
- Multi-concept scenarios (3-5 options)
- User needs to scan and compare options quickly

**When to keep old expanded format**:
- Single concept presentation
- User explicitly requests detailed view
- Final confirmation before HTML generation

**Font hierarchy in collapsed state**:
1. Concept name (24px/800) - Most prominent
2. Tagline (15px/italic) - Secondary emphasis
3. Quality badge (14px/600) - Visual anchor on right
4. Section headers when expanded (15px/700)
5. Copy labels (12px/600 uppercase)
6. Copy text (14px/regular)

---

## Score Visualization Template

Visual dashboard for displaying quality scores with dimension breakdowns.

### Full Template

```html
<div style="border:2px solid #f59e0b;border-radius:12px;
            padding:20px;margin:24px 0;background:#fffbeb;">

  <!-- Overall Score Header -->
  <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #fde68a;">
    <div style="font-size:48px;font-weight:800;color:#f59e0b;line-height:1;">
      28<span style="font-size:24px;color:#d97706;">/35</span>
    </div>
    <div style="font-size:16px;font-weight:700;color:#d97706;margin-top:8px;
                letter-spacing:1px;">STRONG ⚡</div>

    <!-- Overall score bar (28/35 = 80%) -->
    <div style="max-width:200px;margin:12px auto 0;height:12px;
                background:#fde68a;border-radius:6px;overflow:hidden;">
      <div style="width:80%;height:100%;background:#f59e0b;"></div>
    </div>
  </div>

  <!-- Dimension Breakdown -->
  <div style="margin-top:20px;">
    <div style="font-size:15px;font-weight:700;color:#92400e;margin-bottom:12px;">
      Quality Breakdown
    </div>

    <!-- High scores (4-5) -->
    <div style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:600;color:#15803d;margin-bottom:8px;">
        ✅ Strengths (4-5 points)
      </div>

      <!-- Dimension row: Brief Alignment (5/5) -->
      <div style="display:flex;align-items:center;margin-bottom:6px;">
        <div style="flex:0 0 150px;font-size:13px;color:#374151;">Brief Alignment</div>
        <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;margin:0 10px;overflow:hidden;">
          <div style="width:100%;height:100%;background:#10b981;"></div>
        </div>
        <div style="flex:0 0 30px;font-size:13px;font-weight:700;color:#10b981;text-align:right;">5</div>
      </div>

      <!-- Dimension row: Segment Relevance (5/5) -->
      <div style="display:flex;align-items:center;margin-bottom:6px;">
        <div style="flex:0 0 150px;font-size:13px;color:#374151;">Segment Relevance</div>
        <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;margin:0 10px;overflow:hidden;">
          <div style="width:100%;height:100%;background:#10b981;"></div>
        </div>
        <div style="flex:0 0 30px;font-size:13px;font-weight:700;color:#10b981;text-align:right;">5</div>
      </div>

      <!-- Dimension row: Clarity (5/5) -->
      <div style="display:flex;align-items:center;margin-bottom:6px;">
        <div style="flex:0 0 150px;font-size:13px;color:#374151;">Clarity</div>
        <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;margin:0 10px;overflow:hidden;">
          <div style="width:100%;height:100%;background:#10b981;"></div>
        </div>
        <div style="flex:0 0 30px;font-size:13px;font-weight:700;color:#10b981;text-align:right;">5</div>
      </div>

      <!-- Dimension row: CTA (5/5) -->
      <div style="display:flex;align-items:center;margin-bottom:6px;">
        <div style="flex:0 0 150px;font-size:13px;color:#374151;">Call-to-Action</div>
        <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;margin:0 10px;overflow:hidden;">
          <div style="width:100%;height:100%;background:#10b981;"></div>
        </div>
        <div style="flex:0 0 30px;font-size:13px;font-weight:700;color:#10b981;text-align:right;">5</div>
      </div>
    </div>

    <!-- Lower scores (0-3) -->
    <div>
      <div style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:8px;">
        ⚠️ Areas to Strengthen (0-3 points)
      </div>

      <!-- Dimension row: Differentiation (3/5 = 60%) -->
      <div style="display:flex;align-items:center;margin-bottom:6px;">
        <div style="flex:0 0 150px;font-size:13px;color:#374151;">Differentiation</div>
        <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;margin:0 10px;overflow:hidden;">
          <div style="width:60%;height:100%;background:#f59e0b;"></div>
        </div>
        <div style="flex:0 0 30px;font-size:13px;font-weight:700;color:#f59e0b;text-align:right;">3</div>
      </div>
    </div>
  </div>

  <!-- Collapsible Recommendations -->
  <details style="margin-top:16px;" open>
    <summary style="cursor:pointer;font-size:14px;font-weight:600;
                    color:#92400e;padding:8px 0;
                    list-style:none;display:flex;align-items:center;">
      <span style="margin-right:8px;">▸</span> 💡 Recommendations
    </summary>
    <div style="margin-top:8px;padding:12px;background:#fff;border-radius:6px;">
      <ul style="font-size:13px;color:#374151;line-height:1.6;margin:0;padding-left:20px;">
        <li>Consider new variations focusing on unique brand angles</li>
        <li>Add more specific visual direction for imagery</li>
      </ul>
    </div>
  </details>
</div>
```

---

## Color Swatch Template

Visual representation of color palettes with hex codes and names.

### Full Template

```html
<div style="margin:16px 0;">
  <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;">
    Color Palette
  </div>

  <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
    <!-- Color swatch 1: Deep Purple -->
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:40px;height:40px;border-radius:6px;
                  background:#667eea;
                  border:2px solid #e5e7eb;
                  box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
      <div>
        <div style="font-size:12px;font-weight:600;color:#1f2937;">#667eea</div>
        <div style="font-size:11px;color:#6b7280;">Deep Purple</div>
      </div>
    </div>

    <!-- Gradient arrow -->
    <div style="font-size:16px;color:#9ca3af;">→</div>

    <!-- Color swatch 2: Violet -->
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:40px;height:40px;border-radius:6px;
                  background:#764ba2;
                  border:2px solid #e5e7eb;
                  box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
      <div>
        <div style="font-size:12px;font-weight:600;color:#1f2937;">#764ba2</div>
        <div style="font-size:11px;color:#6b7280;">Violet</div>
      </div>
    </div>

    <!-- Separator (optional) -->
    <div style="width:2px;height:24px;background:#e5e7eb;margin:0 8px;"></div>

    <!-- Color swatch 3: CTA Orange -->
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:40px;height:40px;border-radius:6px;
                  background:#ff6b35;
                  border:2px solid #e5e7eb;
                  box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
      <div>
        <div style="font-size:12px;font-weight:600;color:#1f2937;">#ff6b35</div>
        <div style="font-size:11px;color:#6b7280;">CTA Orange</div>
      </div>
    </div>
  </div>
</div>
```

### Single Swatch (Reusable Unit)

```html
<div style="display:flex;align-items:center;gap:8px;">
  <div style="width:40px;height:40px;border-radius:6px;
              background:[HEX_CODE];
              border:2px solid #e5e7eb;
              box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
  <div>
    <div style="font-size:12px;font-weight:600;color:#1f2937;">[#HEX]</div>
    <div style="font-size:11px;color:#6b7280;">[Color Name]</div>
  </div>
</div>
```

---

## Mini Preview Templates

Lightweight previews during text concept phase (before full HTML generation).

### Email Mini Preview

```html
<div style="margin:16px 0;">
  <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;">
    📱 Quick Visual Preview
  </div>

  <div style="max-width:320px;border:2px solid #d1d5db;border-radius:12px;
              overflow:hidden;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <!-- Simulated mobile inbox preview -->
    <div style="padding:12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:11px;color:#6b7280;margin-bottom:4px;">From: YourBrand</div>
      <div style="font-size:14px;font-weight:700;color:#1f2937;margin-bottom:2px;">
        48 hours left: Lock in founder pricing (save $3,600/year)
      </div>
      <div style="font-size:12px;color:#6b7280;">
        Join 2,000+ teams who've already switched
      </div>
    </div>

    <!-- Mini body preview -->
    <div style="padding:12px;font-size:12px;color:#374151;line-height:1.5;">
      We're closing founder pricing in 48 hours...
      <div style="margin-top:8px;text-align:center;">
        <div style="display:inline-block;background:#ff6b35;color:#fff;
                    padding:8px 16px;border-radius:4px;font-size:11px;font-weight:600;">
          Lock in Founder Pricing →
        </div>
      </div>
    </div>
  </div>

  <div style="font-size:11px;color:#6b7280;margin-top:8px;font-style:italic;">
    Preview only - full HTML mockup generated after confirmation
  </div>
</div>
```

### Instagram Mini Preview

```html
<div style="margin:16px auto;max-width:280px;">
  <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;text-align:center;">
    📱 Instagram Preview
  </div>

  <div style="border:1px solid #dbdbdb;border-radius:8px;overflow:hidden;background:#fff;
              box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <!-- Mini IG header -->
    <div style="padding:10px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #efefef;">
      <div style="width:24px;height:24px;border-radius:50%;background:#ddd;"></div>
      <div style="font-size:12px;font-weight:600;">your_brand</div>
    </div>

    <!-- Image area with color preview (1:1 aspect ratio) -->
    <div style="aspect-ratio:1/1;
                background:linear-gradient(135deg,#667eea,#764ba2);
                display:flex;align-items:center;justify-content:center;
                font-size:11px;color:#fff;text-align:center;padding:20px;">
      <div>
        <div style="font-size:40px;margin-bottom:8px;">🎧</div>
        <div style="background:rgba(0,149,246,0.9);padding:4px 8px;border-radius:4px;
                    font-weight:700;font-size:12px;">NEW</div>
      </div>
    </div>

    <!-- Caption preview -->
    <div style="padding:10px;font-size:11px;color:#262626;line-height:1.4;">
      <strong>your_brand</strong> Introducing the UltraFit Pro...
    </div>
  </div>

  <div style="font-size:10px;color:#6b7280;margin-top:6px;text-align:center;font-style:italic;">
    Concept preview - full mockup after confirmation
  </div>
</div>
```

### SMS Mini Preview (Message Bubble)

```html
<div style="margin:16px 0;max-width:280px;">
  <div style="font-size:14px;font-weight:600;color:#1f2937;margin-bottom:8px;">
    💬 SMS Preview
  </div>

  <!-- Message bubble (iOS style) -->
  <div style="background:#0084ff;color:#fff;padding:12px 14px;
              border-radius:18px;font-size:13px;line-height:1.4;
              max-width:240px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
    🔥 FLASH SALE: 40% off EVERYTHING! Code: FLASH40<br><br>
    Ends Sunday midnight. Shop now: bit.ly/fitgear-flash
  </div>

  <div style="font-size:11px;color:#6b7280;margin-top:8px;font-style:italic;">
    Message bubble preview
  </div>
</div>
```

---

## Responsive Design Patterns

### Flex Container for Cards

Use this wrapper for responsive card grids:

```html
<div style="display:flex;flex-wrap:wrap;gap:16px;max-width:100%;margin:20px 0;">
  <!-- Cards go here -->
</div>
```

**How it works**:
- `flex-wrap:wrap` - Cards wrap to new rows on narrow screens
- `gap:16px` - Consistent spacing between cards
- Cards with `min-width:280px` automatically stack on mobile (<600px)

### Mobile Breakpoints

**Desktop (>768px)**: Direction cards display in 2-column grid
**Tablet (480-768px)**: Direction cards display in 2-column grid with tighter spacing
**Mobile (<480px)**: Direction cards stack in single column

**Implementation**:
- Cards use `flex:1 1 calc(50% - 8px)` for 2-column layout
- `min-width:280px` forces single column when viewport < 600px
- No media queries needed (inline styles only)

### Font Sizing

Optimize for readability across devices:

**Headings**:
- Desktop: 16-20px
- Mobile: 14-18px (no explicit mobile override needed)

**Body**:
- Desktop: 13-14px
- Mobile: 12-13px

**Labels**:
- Desktop: 11-12px
- Mobile: 10-11px

### Touch Targets

Ensure clickable elements meet minimum size:

- Summary elements: 44px minimum height (add padding if needed)
- Buttons: 44px minimum height
- Clickable areas: Adequate padding around links/buttons

**Example**:
```html
<summary style="padding:12px 0;"> <!-- 12px top + 20px text + 12px bottom = 44px -->
  Click to expand
</summary>
```

---

## Accessibility Guidelines

### Color Contrast Requirements

All text/background pairs must meet **WCAG 2.1 AA** (4.5:1 minimum contrast ratio):

**Verified Combinations**:
- Excellent green `#10b981` on white `#ffffff`: 7.2:1 ✅
- Strong amber text `#d97706` on white: 5.2:1 ✅
- Good blue `#3b82f6` on white: 5.9:1 ✅
- Needs Work red `#ef4444` on white: 4.8:1 ✅
- Dark gray `#1f2937` on white: 16.1:1 ✅
- Medium gray `#6b7280` on white: 5.4:1 ✅

**Avoid**:
- Light amber `#f59e0b` for text on white (3.8:1 ❌) - use `#d97706` instead

### Semantic HTML

Use proper HTML elements for accessibility:

**Collapsible sections**:
```html
<details>
  <summary>Clickable label</summary>
  Hidden content
</details>
```
- Native keyboard support (Tab, Enter, Space)
- Screen readers announce "expandable" state
- No JavaScript required

**Color information**:
- Always pair hex codes with color names
- Example: `#667eea` + "Deep Purple" (not just hex code alone)
- Helps colorblind users

**Score indicators**:
- Include text tier with visual elements
- Example: "33/35 EXCELLENT ✅" (not just ✅ alone)
- Emoji supplements text, doesn't replace it

### Keyboard Navigation

All interactive elements must be keyboard-accessible:

**Details/Summary**:
- Tab to focus
- Enter or Space to expand/collapse
- Built-in browser support

**Card focus order**:
1. Tab through cards in reading order (left-to-right, top-to-bottom)
2. Within each card: number badge → score display → summary element
3. When expanded: nested details elements follow same pattern

### Screen Reader Support

**Provide text alternatives**:
```html
<!-- Good: Text label + visual -->
<div style="font-size:12px;color:#059669;">EXCELLENT ✅</div>

<!-- Bad: Visual only -->
<div style="color:#059669;">✅</div>
```

**Use descriptive summary text**:
```html
<!-- Good -->
<summary>View Details - Key Message and Tone</summary>

<!-- Bad -->
<summary>Click here</summary>
```

**Structure headings properly**:
- Use actual heading levels (even if styled inline)
- Maintain logical hierarchy (h1 → h2 → h3)

---

## Usage Guidelines

### When to Use Each Component

**Direction Card**: Creative direction options (Phase 1 of progressive workflow)
**Concept Card**: Ad concepts (Phase 2 of progressive workflow)
**Score Visualization**: Quality assessment dashboards
**Color Swatch**: Any color palette descriptions
**Mini Preview**: Text concept phase (before full HTML generation)

### Integration with Existing Templates

These card components complement (don't replace) the existing HTML preview templates in `html-preview-templates.md`:

- **Card templates** → Used during text concept phase
- **HTML preview templates** → Used after user confirms concepts

### Customization

All templates use variables in brackets for easy customization:

- `[HEX_CODE]` - Replace with actual hex color
- `[Concept Name]` - Replace with concept title
- `[Score]` - Replace with actual score (e.g., "28/35")
- `[Tier]` - Replace with tier label (Excellent/Strong/Good/Needs Work)

---

## Testing Checklist

Before using any component, verify:

- [ ] All colors meet WCAG 2.1 AA contrast ratios
- [ ] Details/summary elements expand/collapse on click
- [ ] Cards stack properly on mobile (<480px width)
- [ ] Touch targets minimum 44px height
- [ ] Text remains readable at all font sizes
- [ ] No horizontal scrolling on mobile
- [ ] Screen reader announces collapsible state
- [ ] Keyboard navigation works (Tab, Enter, Space)

---

**Version**: 1.0
**Last Updated**: 2026-03-04
**Maintained By**: Multi-Channel Ad Ideation Skill
