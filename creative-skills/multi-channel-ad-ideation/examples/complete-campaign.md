# Complete Multi-Channel Campaign Example

This example demonstrates how email, SMS, and Instagram work together in a cohesive campaign with consistent messaging adapted for each channel.

## Campaign Context

**Brand**: FitGear Pro (fitness apparel e-commerce)

**Creative Brief Summary**:
- **Objective**: Drive 5,000 product sales during 48-hour flash sale
- **Target Segment**: Existing customers age 25-40, fitness enthusiasts, previous purchasers
- **Key Message**: "40% off everything - biggest sale of the year - ends in 48 hours"
- **Tone**: Urgent but friendly, energetic, action-oriented
- **CTA**: "Shop 40% Off Sale"
- **Channels**: Email, SMS, Instagram

---

## Progressive Workflow Demonstration

This example demonstrates the **progressive workflow** where users first explore creative directions, then generate text concepts, and finally create HTML previews.

---

## Phase 1: Creative Direction Ideation

After clarifying the brief and segment, the skill generates 3-5 creative direction options in table format for easy comparison.

### Creative Direction Options (Enhanced Card Format)

<div style="display:flex;flex-wrap:wrap;gap:16px;max-width:100%;margin:20px 0;">

<!-- Direction Card 1: Excellent Tier (green border) -->
<div style="flex:1 1 calc(50% - 8px);min-width:280px;border:2px solid #10b981;border-radius:8px;padding:16px;background:#ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.1);">

  <!-- Header with number badge and score -->
  <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
    <div style="background:#10b981;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;">1</div>
    <div style="text-align:right;">
      <div style="font-size:20px;font-weight:700;color:#10b981;">24/25</div>
      <div style="font-size:12px;color:#059669;font-weight:600;">EXCELLENT ✅</div>
      <div style="width:80px;height:6px;background:#e5e7eb;border-radius:3px;margin-top:4px;">
        <div style="width:96%;height:100%;background:#10b981;border-radius:3px;"></div>
      </div>
    </div>
  </div>

  <!-- Strategic Angle -->
  <div style="margin-bottom:8px;">
    <div style="font-size:16px;font-weight:700;color:#111827;">Urgency-Driven</div>
    <div style="font-size:13px;color:#4b5563;line-height:1.4;margin-top:4px;">Act fast before sale ends - emphasizes scarcity and time pressure</div>
  </div>

  <!-- Collapsible Details -->
  <details style="margin-top:12px;">
    <summary style="font-size:13px;font-weight:600;color:#6b7280;cursor:pointer;padding:8px;background:#f9fafb;border-radius:4px;">View Details</summary>
    <div style="padding:12px 8px;font-size:13px;color:#4b5563;line-height:1.5;">
      <div style="margin-bottom:8px;"><strong>Key Message:</strong> "40% off everything - 48 hours only"</div>
      <div style="margin-bottom:8px;"><strong>Tone:</strong> Urgent, time-pressured</div>
      <div style="margin-bottom:8px;"><strong>Emotion:</strong> Creates FOMO</div>
      <div><strong>Differentiation:</strong> Emphasizes limited availability</div>
    </div>
  </details>
</div>

<!-- Direction Card 2: Strong Tier (amber border) -->
<div style="flex:1 1 calc(50% - 8px);min-width:280px;border:2px solid #f59e0b;border-radius:8px;padding:16px;background:#ffffff;box-shadow:0 2px 4px rgba(0,0,0,0.1);">

  <!-- Header with number badge and score -->
  <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
    <div style="background:#f59e0b;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;">2</div>
    <div style="text-align:right;">
      <div style="font-size:20px;font-weight:700;color:#f59e0b;">22/25</div>
      <div style="font-size:12px;color:#d97706;font-weight:600;">STRONG 💪</div>
      <div style="width:80px;height:6px;background:#e5e7eb;border-radius:3px;margin-top:4px;">
        <div style="width:88%;height:100%;background:#f59e0b;border-radius:3px;"></div>
      </div>
    </div>
  </div>

  <!-- Strategic Angle -->
  <div style="margin-bottom:8px;">
    <div style="font-size:16px;font-weight:700;color:#111827;">Value-Maximization</div>
    <div style="font-size:13px;color:#4b5563;line-height:1.4;margin-top:4px;">Get the best deal of the year - emphasizes savings amount</div>
  </div>

  <!-- Collapsible Details -->
  <details style="margin-top:12px;">
    <summary style="font-size:13px;font-weight:600;color:#6b7280;cursor:pointer;padding:8px;background:#fffbeb;border-radius:4px;">View Details</summary>
    <div style="padding:12px 8px;font-size:13px;color:#4b5563;line-height:1.5;">
      <div style="margin-bottom:8px;"><strong>Key Message:</strong> "Biggest savings of the year - don't miss out"</div>
      <div style="margin-bottom:8px;"><strong>Tone:</strong> Excited, benefit-focused</div>
      <div style="margin-bottom:8px;"><strong>Emotion:</strong> Highlights financial value</div>
      <div><strong>Differentiation:</strong> Appeals to deal-seekers</div>
    </div>
  </details>
</div>

</div>

<div style="background:#f0fdf4;border-left:4px solid #10b981;padding:12px 16px;border-radius:6px;margin:16px 0;">
  <div style="font-size:13px;color:#065f46;line-height:1.5;">
    <strong>💡 Recommendation:</strong> Direction 1 (Urgency-Driven) scored highest (24/25) with excellent brief alignment, segment relevance, and channel appropriateness. The 48-hour deadline creates natural urgency across all channels.
  </div>
</div>

_Note: Showing 2 of 5 direction options. Full output would include all 5 in card format._

### User Selection
**User**: "Let's use Direction 1 - Urgency-Driven. I like the clear deadline focus."

---

## Phase 2: Channel Selection

**Skill**: "Great! You've selected Direction 1 (Urgency-Driven).

Now, which channels would you like to create concepts for?

Available channels:
- Email (subject lines, body copy, HTML previews)
- SMS (160-char mobile messaging)
- Instagram (image ads with visual concepts)

Would you like to:
1. Work on all channels at once (faster, but more to review)
2. Work on each channel separately (more focused, easier to iterate)"

**User**: "Let's do all channels at once - this is a simple flash sale campaign."

---

## Phase 3: Text Concept Generation (All Channels)

Following the "Urgency-Driven" direction, the skill generates text-only concepts for Email, SMS, and Instagram simultaneously.

**Format update**: All concepts now use the **collapsed card format** by default:
- Concepts start **collapsed** showing only name (24px/800 font) + tagline
- User clicks to expand for full ad copy and visual details
- **Character counts removed** from all output (validated internally, not shown)
- Enhanced font hierarchy for better scannability
- Allows users to quickly scan concept titles before diving deep

---

## Email Campaign (Text Concept - Collapsed Card Format)

**New default format**: Email concepts presented as collapsed cards for easy scanning.

<details style="border:2px solid #e5e7eb;border-radius:12px;
                margin:16px 0;background:#ffffff;
                box-shadow:0 4px 6px rgba(0,0,0,0.05);">

  <!-- COLLAPSED SUMMARY (what user sees initially) -->
  <summary style="cursor:pointer;padding:20px;
                  list-style:none;display:flex;
                  justify-content:space-between;align-items:start;">
    <div style="flex:1;">
      <div style="display:flex;align-items:start;gap:12px;">
        <span style="font-size:18px;color:#6b7280;margin-top:4px;">▸</span>
        <div>
          <!-- ENHANCED: 24px/800 (was 20px/700) -->
          <div style="font-size:24px;font-weight:800;color:#1f2937;
                      margin-bottom:6px;line-height:1.2;">
            Urgency-Driven Flash Sale
          </div>
          <!-- NEW: Tagline with key message -->
          <div style="font-size:15px;color:#4b5563;font-style:italic;
                      line-height:1.4;">
            "⏰ 48 hours only: 40% off EVERYTHING (biggest sale ever)"
          </div>
        </div>
      </div>
    </div>
    <div style="background:#f59e0b;color:#fff;padding:8px 14px;
                border-radius:6px;font-size:14px;font-weight:600;
                margin-left:16px;flex-shrink:0;">
      31/35 💪
    </div>
  </summary>

  <!-- EXPANDED CONTENT (hidden until user clicks) -->
  <div style="padding:0 20px 20px 20px;border-top:2px solid #f3f4f6;">

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
            ⏰ 48 hours only: 40% off EVERYTHING (biggest sale ever)
          </div>
          <!-- NO CHARACTER COUNT -->
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Preview Text
          </div>
          <div style="font-size:14px;color:#111827;">
            Don't miss it - your favorites are included!
          </div>
          <!-- NO CHARACTER COUNT -->
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Headline
          </div>
          <div style="font-size:16px;font-weight:600;color:#111827;">
            Flash Sale: 40% Off Sitewide
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#6b7280;
                      text-transform:uppercase;margin-bottom:4px;">
            Body Copy
          </div>
          <div style="font-size:14px;color:#111827;line-height:1.6;">
            Our biggest sale of the year is here - but only for 48 hours!<br><br>

            Get 40% off everything in the store. Yes, everything. Even your wishlist items.<br><br>

            Use code <strong>FLASH40</strong> at checkout.<br><br>

            <strong>What's included:</strong><br>
            • All apparel (tanks, leggings, hoodies)<br>
            • All accessories (yoga mats, resistance bands, water bottles)<br>
            • All footwear (running shoes, training shoes)<br>
            • No exclusions. Seriously.<br><br>

            <strong>Plus:</strong> Free shipping on orders over $75<br><br>

            Sale ends Sunday at midnight. After that, prices go back to normal and we won't run another sale like this until next year.<br><br>

            Shop now before your size sells out.
          </div>
        </div>

  <div>
    <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">CTA Button</div>
    <div style="display:inline-block;background:#FF6B35;color:#fff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">Shop 40% Off Sale →</div>
  </div>
</div>

<!-- Visual Concept Section (Collapsible) -->
<details style="margin-bottom:16px;">
  <summary style="font-size:16px;font-weight:700;color:#111827;cursor:pointer;padding:12px;background:#f3f4f6;border-radius:8px;list-style:none;display:flex;align-items:center;gap:8px;">
    <span style="font-size:18px;">🎨</span>
    <span>Visual Concept & Design Details</span>
    <span style="margin-left:auto;font-size:12px;color:#6b7280;">(click to expand)</span>
  </summary>

  <div style="padding:16px;background:#fafafa;border-radius:8px;margin-top:8px;">

    <!-- Color Palette with Swatches -->
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:8px;">Color Palette</div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:40px;height:40px;border-radius:6px;background:#E63946;border:2px solid #e5e7eb;box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#111827;">#E63946</div>
            <div style="font-size:11px;color:#6b7280;">Energetic Red (Header)</div>
          </div>
        </div>
        <div style="color:#d1d5db;font-size:14px;">|</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:40px;height:40px;border-radius:6px;background:#FF6B35;border:2px solid #e5e7eb;box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#111827;">#FF6B35</div>
            <div style="font-size:11px;color:#6b7280;">Bright Orange (CTA)</div>
          </div>
        </div>
        <div style="color:#d1d5db;font-size:14px;">|</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:40px;height:40px;border-radius:6px;background:#FFFFFF;border:2px solid #e5e7eb;box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#111827;">#FFFFFF</div>
            <div style="font-size:11px;color:#6b7280;">Clean White (Body)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Layout -->
    <div style="margin-bottom:12px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Layout</div>
      <div style="font-size:13px;color:#4b5563;line-height:1.5;">Urgency header with countdown timer + 4-product hero image grid + body copy section + prominent CTA button</div>
    </div>

    <!-- Imagery -->
    <div style="margin-bottom:12px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Imagery</div>
      <div style="font-size:13px;color:#4b5563;line-height:1.5;">2x2 grid showing apparel variety (women's tank, leggings, running shoes, yoga mat)</div>
    </div>

    <!-- Typography -->
    <div>
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Typography</div>
      <div style="font-size:13px;color:#4b5563;line-height:1.5;">Bold sans-serif (Montserrat), large "40% OFF" (48px) in header, countdown timer in header</div>
    </div>
  </div>
</details>

    <!-- Nested Visual Concept Section completed -->
  </div>
</details>

<!-- COLLAPSED CARD COMPLETED - User would see title/tagline above, click to expand to see all this content -->

**Note**: In collapsed state, user sees only "Urgency-Driven Flash Sale" title and "⏰ 48 hours only: 40% off EVERYTHING" tagline. Clicking expands to show full ad copy and visual concept details above.

---

<!-- For this example file, the Mini Email Preview is shown separately below for reference, but in actual output it would be nested inside the Visual Concept section -->

### Additional: Mini Email Preview (for reference)

<div style="margin-bottom:16px;">
  <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:8px;">📱 Mini Preview</div>
  <div style="font-size:11px;color:#6b7280;margin-bottom:8px;font-style:italic;">Preview only - full HTML will be generated after all channel concepts are confirmed</div>

  <div style="max-width:320px;border:2px solid #d1d5db;border-radius:12px;overflow:hidden;background:#fff;">
    <!-- Inbox Preview -->
    <div style="padding:12px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">From: <strong style="color:#111827;">FitGear Pro</strong></div>
      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:2px;">⏰ 48 hours only: 40% off EVERYTHING...</div>
      <div style="font-size:12px;color:#6b7280;">Don't miss it - your favorites are included!</div>
    </div>

    <!-- Mini Body Preview -->
    <div style="padding:12px;">
      <div style="background:#E63946;color:#fff;padding:8px;text-align:center;margin-bottom:8px;border-radius:4px;">
        <div style="font-size:16px;font-weight:700;">40% OFF</div>
        <div style="font-size:10px;">48 hours only</div>
      </div>
      <div style="font-size:12px;color:#111827;line-height:1.5;margin-bottom:12px;">
        Our biggest sale of the year is here - but only for 48 hours! Get 40% off everything in the store...
      </div>
      <div style="text-align:center;">
        <div style="display:inline-block;background:#FF6B35;color:#fff;padding:8px 16px;border-radius:4px;font-size:12px;font-weight:600;">Shop 40% Off Sale →</div>
      </div>
    </div>
  </div>
</div>

<!-- Next Step Banner -->
<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:6px;">
  <div style="font-size:13px;color:#1e40af;line-height:1.5;">
    <strong>Next Step:</strong> After confirming all channel concepts, HTML preview will be generated for email testing.
  </div>
</div>

</div>

#### Quality Score Breakdown (31/35 - Strong)
- Brief Alignment: 5/5
- Segment Relevance: 5/5
- Channel Appropriateness: 5/5
- Clarity: 5/5
- Differentiation: 3/5
- Call-to-Action: 5/5
- Visual Concept Quality: 3/5

---

## SMS Campaign (Text Concepts)

## SMS Campaign (Text Concept - Collapsed Card Format Note)

**New format**: SMS concepts also use collapsed cards, but with simpler structure (no nested visual sections since SMS is plain text).

### SMS Concept 1: Launch Announcement

**Creative Direction**: Following the "Urgency-Driven" approach - Maximum urgency, ultra-concise, clear savings and deadline.

#### Message Text
```
🔥 FLASH SALE: 40% off EVERYTHING! Code: FLASH40

Ends Sunday midnight. Shop now: bit.ly/fitgear-flash

STOP to unsubscribe
```
<!-- CHARACTER COUNT REMOVED - validated internally but not shown to user -->

#### CTA
Link: bit.ly/fitgear-flash - Mobile-optimized product grid, code pre-applied

#### Delivery Recommendation
Best sent: Friday 9:00 AM (start of weekend shopping)

*ASCII box preview will be generated after confirming all channel concepts.*

#### Quality Score: 29/35 (Strong)

---

### SMS Concept 2: 12-Hour Reminder

**Creative Direction**: Following the "Urgency-Driven" approach - Final urgency push, emphasize scarcity and ending soon.

#### Message Text
```
⏰ LAST CALL: 40% off flash sale ends in 12 hours! Your favorites are selling out fast.

Shop: bit.ly/fitgear-flash

STOP to opt out
```
<!-- CHARACTER COUNT REMOVED -->

#### CTA
Link: bit.ly/fitgear-flash - Same landing page with urgency banner

#### Delivery Recommendation
Best sent: Sunday 12:00 PM (noon, 12 hours before midnight deadline)

*ASCII box preview will be generated after confirming all channel concepts.*

#### Quality Score: 30/35 (Strong)

---

## Instagram Campaign (Text Concepts - Enhanced Card Format)

<div style="border:2px solid #e5e7eb;border-radius:12px;padding:20px;margin:24px 0;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.05);">

<!-- Concept Header -->
<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
  <div>
    <div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:4px;">Product Hero - Flat Lay</div>
    <div style="font-size:13px;color:#6b7280;">Following the "Urgency-Driven" approach - Bold "40% OFF" text overlay on lifestyle product flat-lay. Bright, energetic colors. Visual-first with minimal text.</div>
  </div>
  <div style="background:#10b981;color:#fff;padding:6px 12px;border-radius:6px;font-size:14px;font-weight:600;white-space:nowrap;">32/35 ✅</div>
</div>

<!-- Ad Copy Section -->
<div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px;">
  <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:12px;">📱 Instagram Ad Copy</div>

  <div style="margin-bottom:12px;">
    <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Primary Text (122 chars)</div>
    <div style="font-size:14px;color:#111827;">48 HOURS ONLY: 40% off everything 🔥 Your biggest savings of the year. Code FLASH40. Shop now before it's gone! 🏃‍♀️</div>
  </div>

  <div style="margin-bottom:12px;">
    <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Headline (32 chars)</div>
    <div style="font-size:14px;color:#111827;">40% Off Flash Sale - Ends Sunday</div>
  </div>

  <div style="margin-bottom:12px;">
    <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Description (22 chars)</div>
    <div style="font-size:14px;color:#111827;">Free shipping over $75</div>
  </div>

  <div>
    <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">CTA Button</div>
    <div style="display:inline-block;background:#0095f6;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;">Shop Now</div>
  </div>
</div>

<!-- Image Concept Section (Collapsible) -->
<details style="margin-bottom:16px;">
  <summary style="font-size:16px;font-weight:700;color:#111827;cursor:pointer;padding:12px;background:#f3f4f6;border-radius:8px;list-style:none;display:flex;align-items:center;gap:8px;">
    <span style="font-size:18px;">🎨</span>
    <span>Image Concept & Visual Details (1080x1080px)</span>
    <span style="margin-left:auto;font-size:12px;color:#6b7280;">(click to expand)</span>
  </summary>

  <div style="padding:16px;background:#fafafa;border-radius:8px;margin-top:8px;">

    <!-- Color Palette with Swatches -->
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:8px;">Color Palette</div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:40px;height:40px;border-radius:6px;background:#FF6B6B;border:2px solid #e5e7eb;box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#111827;">#FF6B6B</div>
            <div style="font-size:11px;color:#6b7280;">Vibrant Coral (Background)</div>
          </div>
        </div>
        <div style="color:#d1d5db;font-size:14px;">|</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:40px;height:40px;border-radius:6px;background:#FFFFFF;border:2px solid #e5e7eb;box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:#111827;">#FFFFFF</div>
            <div style="font-size:11px;color:#6b7280;">Crisp White (Text)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Composition -->
    <div style="margin-bottom:12px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Composition</div>
      <div style="font-size:13px;color:#4b5563;line-height:1.5;">Flat-lay overhead shot with 6-8 FitGear products arranged in circular pattern radiating from center</div>
    </div>

    <!-- Focal Point -->
    <div style="margin-bottom:12px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Focal Point</div>
      <div style="font-size:13px;color:#4b5563;line-height:1.5;">Large "40% OFF" text positioned in center, overlaid on product arrangement</div>
    </div>

    <!-- Typography -->
    <div style="margin-bottom:12px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Typography</div>
      <div style="font-size:13px;color:#4b5563;line-height:1.5;">"40% OFF" in ultra-bold Montserrat Black (100px, white), "FLASH SALE" banner above (36px, white)</div>
    </div>

    <!-- Brand Elements -->
    <div style="margin-bottom:12px;">
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Brand Elements</div>
      <div style="font-size:13px;color:#4b5563;line-height:1.5;">Small FitGear logo bottom-right corner, white for visibility</div>
    </div>

    <!-- Overall Style -->
    <div>
      <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:4px;">Overall Style</div>
      <div style="font-size:13px;color:#4b5563;line-height:1.5;">Energetic, vibrant, product-focused, urgency-driven, Instagram-native aesthetic</div>
    </div>
  </div>
</details>

<!-- Mini Instagram Preview -->
<div style="margin-bottom:16px;">
  <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:8px;">📱 Mini Preview</div>
  <div style="font-size:11px;color:#6b7280;margin-bottom:8px;font-style:italic;">Preview only - full HTML mockup will be generated after all channel concepts are confirmed</div>

  <div style="max-width:280px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <!-- Instagram Post Frame -->
    <div style="background:#fff;border:1px solid #dbdbdb;border-radius:8px;overflow:hidden;">
      <!-- Image Container (1:1 ratio) -->
      <div style="position:relative;width:100%;padding-bottom:100%;background:#FF6B6B;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:40px;text-align:center;">
          <div>
            <div style="font-size:11px;color:#fff;margin-bottom:8px;">FLASH SALE</div>
            <div style="font-size:32px;font-weight:700;color:#fff;">40% OFF</div>
            <div style="margin-top:16px;font-size:20px;">🏃‍♀️👟🧘‍♀️💪</div>
            <div style="position:absolute;bottom:20px;right:20px;font-size:10px;color:#fff;opacity:0.9;">FitGear</div>
          </div>
        </div>
      </div>
      <!-- Caption Area -->
      <div style="padding:12px;">
        <p style="font-size:14px;line-height:18px;color:#262626;margin:0 0 8px 0;">
          <strong>fitgearpro</strong> 48 HOURS ONLY: 40% off everything 🔥 Your biggest savings of the year...
        </p>
      </div>
      <!-- CTA Button -->
      <div style="padding:0 12px 12px 12px;">
        <div style="width:100%;background:#0095f6;color:#fff;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;text-align:center;">
          Shop Now
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Next Step Banner -->
<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:6px;">
  <div style="font-size:13px;color:#1e40af;line-height:1.5;">
    <strong>Next Step:</strong> After confirming all channel concepts, HTML mockup will be generated for Instagram testing.
  </div>
</div>

</div>

_Quality Score: 32/35 (Excellent) - Scores highest across all Instagram concepts_

---

### Instagram Concept 2: Lifestyle Action Shot

**Creative Direction**: Following the "Urgency-Driven" approach - Aspirational lifestyle shot with athlete mid-workout wearing FitGear products. Bold text overlay creates urgency. Emotional connection.

#### Ad Copy
- **Primary Text**: "Your best workout gear at 40% off 💪 Flash sale ends Sunday. No code needed - discount auto-applied! Tap to shop. ⚡" (125 chars)
- **Headline**: "Gear Up & Save 40%" (18 chars)
- **Description**: "Ends Sunday at midnight" (23 chars)
- **CTA Button**: Shop Now

#### Image Concept (Description Only - 1080x1080px square)
- **Composition**: Rule of thirds layout - athlete positioned in left 2/3 of frame, text overlay in negative space right 1/3
- **Focal Point**: Female athlete captured mid-jump squat wearing FitGear black leggings and coral tank top, showing product in action
- **Color Palette**: Natural gym lighting, muted light gray background (#F5F5F5), vibrant orange text overlay (#FF6B35) for urgency pop
- **Typography**: "40% OFF" positioned in right negative space area (Montserrat Bold, 64px, orange), "ENDS SUNDAY" below (24px)
- **Brand Elements**: FitGear logo top-left corner (white, 20px), subtle but visible
- **Overall Style**: Aspirational, lifestyle photography, action-oriented, authentic fitness aesthetic, motivational

*HTML mockup will be generated after confirming all channel concepts.*

#### Quality Score: 33/35 (Excellent)

---

## Phase 4: User Confirmation & HTML Preview Generation

### User Review of Text Concepts

**User**: "These look great! The email concept has the right amount of detail, SMS is nicely concise, and I love both Instagram visual concepts - especially the lifestyle action shot. Let's see the HTML previews."

### HTML Preview Generation

**Skill**: "Perfect! I'll generate HTML previews for your confirmed concepts:
- Email: Full inline CSS responsive template
- SMS: ASCII box previews (2 concepts)
- Instagram: Mobile-native UI mockups (2 concepts)"

**Note**: In a real scenario, full HTML mockups would be generated here using templates from `references/html-preview-templates.md`. For this example, we're showing the conceptual workflow.

#### Email HTML Preview
```html
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
  <!-- Urgency header with countdown -->
  <div style="background:#E63946;padding:40px 20px;text-align:center;color:#fff;">
    <h1 style="font-size:48px;margin:0;">40% OFF</h1>
    <p style="font-size:18px;margin:10px 0;">Flash Sale - Ends in 48 Hours</p>
  </div>
  <!-- Product grid and body copy -->
  <div style="padding:30px 20px;">
    <!-- Body copy here -->
  </div>
  <!-- CTA button -->
  <div style="text-align:center;margin:30px 0;">
    <a href="#" style="background:#FF6B35;color:#fff;padding:18px 45px;
                       text-decoration:none;border-radius:6px;font-size:18px;
                       font-weight:600;">Shop 40% Off Sale →</a>
  </div>
</div>
```

#### SMS ASCII Previews
```
Concept 1 (Launch):
┌──────────────────────────┐
│ 🔥 FLASH SALE: 40% off   │
│ EVERYTHING! Code: FLASH40│
│                          │
│ Ends Sunday midnight.    │
│ Shop: bit.ly/fitgear-flash│
│                          │
│ STOP to unsubscribe      │
└──────────────────────────┘

Concept 2 (Reminder):
┌──────────────────────────┐
│ ⏰ LAST CALL: 40% off    │
│ flash sale ends in 12    │
│ hours! Your favorites    │
│ are selling out fast.    │
│                          │
│ Shop: bit.ly/fitgear-flash│
│                          │
│ STOP to opt out          │
└──────────────────────────┘
```

#### Instagram HTML Mockups
```html
<!-- Instagram Concept 1: Product Hero -->
<div style="max-width:375px;margin:0 auto;font-family:-apple-system,sans-serif;">
  <div style="background:#fff;border:1px solid #dbdbdb;border-radius:3px;">
    <!-- Instagram post structure with flat-lay product image and copy -->
  </div>
</div>

<!-- Instagram Concept 2: Lifestyle Action Shot -->
<div style="max-width:375px;margin:0 auto;font-family:-apple-system,sans-serif;">
  <div style="background:#fff;border:1px solid #dbdbdb;border-radius:3px;">
    <!-- Instagram post structure with athlete action shot and copy -->
  </div>
</div>
```

**User**: "Perfect! These HTML previews really bring the concepts to life. I'm ready to use these for the campaign."

---

## Progressive Workflow Timeline

This progressive approach took approximately:

| Phase | Time | Benefit |
|-------|------|---------|
| **Phase 1: Creative Direction Ideation** | ~2 minutes | Explored 5 strategic approaches, selected best fit before detailed work |
| **Phase 2: Channel Selection** | ~30 seconds | Chose all-at-once workflow for efficiency |
| **Phase 3: Text Concept Generation** | ~4 minutes | Generated copy and visual descriptions for all 3 channels (5 concepts total) |
| **Phase 4: HTML Preview Generation** | ~2 minutes | Created mockups only for confirmed concepts |
| **Total** | ~9 minutes | vs. ~6 minutes for old workflow, but with much better alignment and confidence |

**Key Benefits**:
- ✅ User explored 5 strategic directions before committing
- ✅ Two clear confirmation checkpoints (direction selection, concept confirmation)
- ✅ HTML generated only for confirmed concepts (no wasted effort)
- ✅ User felt in control of creative process, not just receiving output

---

## Multi-Channel Messaging Consistency

### Core Message Alignment
All three channels communicate:
✅ **40% off everything** - Same discount across all channels
✅ **Flash sale / limited time** - Urgency element present
✅ **48 hours / Ends Sunday midnight** - Consistent deadline
✅ **Code FLASH40 (email/SMS)** or **Auto-applied (Instagram)** - Clear redemption
✅ **Energetic, urgent tone** - Consistent emotional appeal

### Channel-Appropriate Adaptations

**Email** (most space):
- Full product category list
- Detailed benefits (free shipping threshold)
- Longer urgency messaging
- 4-product visual grid

**SMS** (ultra-concise):
- Minimal text, maximum urgency
- One clear link
- Emoji for visual interest
- Two touchpoints (launch + 12-hour reminder)

**Instagram** (visual-first):
- Image carries primary message
- Copy supports with urgency
- Two creative approaches (product flat-lay + lifestyle)
- Instagram-native language ("Tap to shop")

### Timeline Coordination

**Friday 9:00 AM** - Launch all three channels simultaneously
- Email: Full campaign announcement
- SMS: Launch text
- Instagram: Product hero concept

**Saturday** - Instagram only
- Post lifestyle action shot concept

**Sunday 12:00 PM** - Final push
- SMS: 12-hour reminder
- Instagram Stories: (not in scope but would complement)

**Sunday 11:30 PM** - Email only
- "Last 30 minutes" email to highly engaged subscribers

---

## Aggregate Quality Assessment

### Overall Campaign Score: 31/35 (Strong)

**Strengths**:
✅ Perfect brief alignment across all channels (5/5)
✅ Highly relevant to fitness-enthusiast segment (5/5)
✅ All channels follow best practices (5/5)
✅ Crystal clear messaging (5/5)
✅ Strong CTAs across all channels (5/5)
✅ Good visual concepts (4/5 avg)

**Areas for Enhancement**:
⚠️ Differentiation (3/5) - Messaging is clear but not highly differentiated from typical flash sales. Could emphasize unique FitGear quality or sustainability angle to stand out more.

**Recommendations**:
- Consider A/B testing version that emphasizes "sustainably-made activewear" as differentiator
- Test lifestyle visual vs. product flat-lay on Instagram to see which drives more engagement
- Monitor sell-through by channel to optimize budget allocation in future campaigns

---

## Key Takeaways from This Example

### 1. Consistent Core Message
Same offer (40% off, 48 hours) communicated across all channels builds coherent campaign.

### 2. Channel-Specific Execution
Each channel leverages its strengths:
- Email: Detail and visual storytelling
- SMS: Urgency and mobile immediacy
- Instagram: Visual impact and lifestyle aspiration

### 3. Complementary Timing
Email leads with full details, SMS reinforces with urgency, Instagram provides ongoing visual presence throughout campaign window.

### 4. Unified Quality Standards
All concepts scored 29-33/35 (Strong to Excellent), ensuring consistent quality across channels.

### 5. Measurable Adaptations
- Email focuses on product variety ("everything included")
- SMS emphasizes speed ("shop now", "last call")
- Instagram connects emotionally (lifestyle, aspiration)

---

This example demonstrates how the Multi-Channel Ad Ideation skill creates cohesive campaigns that maintain message consistency while adapting to each channel's unique format and audience behavior.
