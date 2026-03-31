# Brand Compliance Review Workflow Example

Complete example showing brand compliance review using Acme Corp brand guidelines.

---

## Scenario

**User Request**: "Review this email for brand compliance using Acme Corp guidelines"

**Context**: Email promoting new hiking boots launch with intentional brand guideline violations

---

## User Provides Brand Guidelines

**User**: "Use brand guidelines at `examples/acme-corp-brand-guidelines.md`"

Claude reads the complete Acme Corp brand guidelines from [`../examples/acme-corp-brand-guidelines.md`](../examples/acme-corp-brand-guidelines.md), which includes:

- Brand Voice (Knowledgeable, Enthusiastic, Respectful)
- Brand Tone (Product Specs: Precise & Functional)
- Color Palette with usage context:
  - Old Growth (#1B3022): Primary Logo & Dark Backgrounds
  - Burnt Ochre (#B35D33): Call to Action only
  - Raw Canvas (#F5F2ED): Primary Background
  - Granite (#4A4E51): Secondary Text & UI
  - Lichen (#9CAF88): Sustainability Accents
- Typography (Montserrat headings, Roboto body)
- Lexicon (Power words vs. Prohibited terms)
- Legal requirements
- Signature: "Gear up. Get out. Leave it better."

---

## User Provides Email HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#FFFFFF;">

  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <h1 style="font-family:Arial;font-size:28px;color:#333333;">
      OMG! New Eco-Friendly Boots Are Here! 🔥
    </h1>

    <p style="font-family:Arial;font-size:16px;color:#666666;line-height:1.6;">
      Hey outdoor lovers! Our new boots are literally insane! Made with green materials,
      these epic boots will change your hiking life forever. They're super eco-friendly
      and totally sustainable!
    </p>

    <p style="font-family:Arial;font-size:16px;color:#666666;line-height:1.6;">
      Don't miss out on this life-changing gear! Get them before they're gone!
    </p>

    <div style="text-align:center;margin:30px 0;">
      <a href="#" style="display:inline-block;padding:15px 30px;background:#FF0000;color:#FFFFFF;text-decoration:none;border-radius:4px;font-size:18px;">
        Buy Now!
      </a>
    </div>

  </div>

</body>
</html>
```

---

## Claude's Analysis

### Step 1: Read Brand Guidelines

Reading Acme Corp guidelines from [`acme-corp-brand-guidelines.md`](../examples/acme-corp-brand-guidelines.md)...

**Key Brand Standards Identified**:
- **Voice**: Knowledgeable, Enthusiastic, Respectful
- **Tone for Product Specs**: Precise & Functional (not casual/inspirational)
- **Color Palette with Usage Context**:
  - Old Growth (#1B3022): Primary Logo & Dark Backgrounds. Represents stability.
  - Burnt Ochre (#B35D33): Call to Action ONLY. The color of clay and sunsets. Reserved for CTAs to maintain visual hierarchy.
  - Raw Canvas (#F5F2ED): Primary Background. An organic, off-white alternative.
  - Granite (#4A4E51): Secondary Text & UI. Represents durability.
  - Lichen (#9CAF88): Accents for sustainability callouts only.
- **Typography**: Montserrat (headings, Bold/All-Caps), Roboto (body text)
- **Approved Terms**: Circular, PFC-Free, Backcountry, Traverse, Equip, Traceable, Durable
- **Prohibited Terms**: Eco-friendly, Green, Insane, Epic, Life-changing
- **Signature**: "Gear up. Get out. Leave it better."

### Step 2: Analyze Email Content

Checking email against 8 compliance dimensions...

**Violations Detected**:

1. **Visual Compliance**:
   - ❌ Arial font (should be Roboto for body, Montserrat for headings)
   - ❌ Pure white background #FFFFFF (should be Raw Canvas #F5F2ED per acme-corp-brand-guidelines.md)
   - ❌ Red CTA button #FF0000 (should be Burnt Ochre #B35D33 - wrong color entirely)
   - ❌ **Contextual violation**: If Burnt Ochre were used for background instead of CTA, that would also violate usage rules (see [`acme-corp-brand-guidelines.md`](../examples/acme-corp-brand-guidelines.md) - Burnt Ochre reserved for CTAs only)
   - ❌ No logo present

2. **Tone/Voice Compliance**:
   - ❌ Too casual tone: "OMG!", "Hey outdoor lovers!", "Don't miss out!"
   - ❌ Wrong context: Inspirational/casual instead of Precise & Functional for product specs

3. **Messaging Compliance**:
   - ❌ Multiple prohibited terms: "eco-friendly" (2x), "green", "insane", "epic", "life-changing" (2x)
   - ❌ Hyperbole: "literally insane", "will change your hiking life forever"
   - ❌ Missing approved terms: No mention of specific materials (Circular, PFC-Free, Traceable)

4. **Legal Compliance**:
   - ❌ No CAN-SPAM footer (missing unsubscribe link and physical address)

5. **Channel Requirements**:
   - ⚠️ No subject line or preview text provided (can't verify character counts)
   - ✅ Mobile-responsive viewport meta tag present

6. **Accessibility**:
   - ⚠️ Gray text #666666 on white #FFFFFF = 5.7:1 contrast (passes, but could be stronger)
   - ❌ No alt text for any potential images
   - ✅ Font size 16px meets minimum

7. **Brand Identity Strength**:
   - ❌ No logo
   - ❌ No brand signature "Gear up. Get out. Leave it better."
   - ❌ Non-brand colors throughout

8. **Guideline Adherence**:
   - ❌ Multiple violations across visual, tone, messaging, and legal dimensions

### Step 3: Calculate Compliance Score

**Dimension Scores**:
1. Visual Compliance: 1/5 (multiple visual violations)
2. Tone/Voice Compliance: 2/5 (wrong tone for context)
3. Messaging Compliance: 1/5 (all prohibited terms)
4. Legal Compliance: 0/5 (no CAN-SPAM footer)
5. Channel Requirements: 3/5 (responsive but incomplete)
6. Accessibility: 3/5 (some issues with alt text)
7. Brand Identity Strength: 1/5 (no brand presence)
8. Guideline Adherence: 1/5 (major violations)

**Total Score: 12/40 (Non-Compliant ❌)**

---

## Claude's Response

<div style="border:2px solid #ef4444;border-radius:12px;padding:20px;margin:24px 0;background:#fef2f2;">

<!-- Overall Score Header -->
<div style="text-align:center;margin-bottom:20px;">
  <div style="font-size:14px;font-weight:600;color:#991b1b;text-transform:uppercase;margin-bottom:8px;">Brand Compliance Score</div>
  <div style="font-size:48px;font-weight:700;color:#ef4444;line-height:1;">12/40</div>
  <div style="font-size:18px;font-weight:600;color:#991b1b;margin-top:4px;">NON-COMPLIANT ❌</div>

  <!-- Overall Progress Bar -->
  <div style="max-width:300px;margin:16px auto 0 auto;height:12px;background:#fee2e2;border-radius:6px;overflow:hidden;">
    <div style="width:30%;height:100%;background:#ef4444;border-radius:6px;"></div>
  </div>
</div>

<!-- Dimension Breakdown -->
<div style="background:#ffffff;border-radius:8px;padding:16px;margin-bottom:16px;">
  <div style="font-size:16px;font-weight:700;color:#111827;margin-bottom:12px;">📊 Compliance Dimensions</div>

  <!-- Visual Compliance: 1/5 -->
  <div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <div style="font-size:13px;font-weight:600;color:#111827;">Visual Compliance</div>
      <div style="font-size:13px;font-weight:700;color:#ef4444;">1/5</div>
    </div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
      <div style="width:20%;height:100%;background:#ef4444;border-radius:3px;"></div>
    </div>
  </div>

  <!-- Tone/Voice Compliance: 2/5 -->
  <div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <div style="font-size:13px;font-weight:600;color:#111827;">Tone/Voice Compliance</div>
      <div style="font-size:13px;font-weight:700;color:#fb923c;">2/5</div>
    </div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
      <div style="width:40%;height:100%;background:#fb923c;border-radius:3px;"></div>
    </div>
  </div>

  <!-- Messaging Compliance: 1/5 -->
  <div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <div style="font-size:13px;font-weight:600;color:#111827;">Messaging Compliance</div>
      <div style="font-size:13px;font-weight:700;color:#ef4444;">1/5</div>
    </div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
      <div style="width:20%;height:100%;background:#ef4444;border-radius:3px;"></div>
    </div>
  </div>

  <!-- Legal Compliance: 0/5 -->
  <div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <div style="font-size:13px;font-weight:600;color:#111827;">Legal Compliance</div>
      <div style="font-size:13px;font-weight:700;color:#9ca3af;">0/5</div>
    </div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
      <div style="width:0%;height:100%;background:#9ca3af;border-radius:3px;"></div>
    </div>
  </div>

  <!-- Channel Requirements: 3/5 -->
  <div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <div style="font-size:13px;font-weight:600;color:#111827;">Channel Requirements</div>
      <div style="font-size:13px;font-weight:700;color:#3b82f6;">3/5</div>
    </div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
      <div style="width:60%;height:100%;background:#3b82f6;border-radius:3px;"></div>
    </div>
  </div>

  <!-- Accessibility: 3/5 -->
  <div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <div style="font-size:13px;font-weight:600;color:#111827;">Accessibility</div>
      <div style="font-size:13px;font-weight:700;color:#3b82f6;">3/5</div>
    </div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
      <div style="width:60%;height:100%;background:#3b82f6;border-radius:3px;"></div>
    </div>
  </div>

  <!-- Brand Identity Strength: 1/5 -->
  <div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <div style="font-size:13px;font-weight:600;color:#111827;">Brand Identity Strength</div>
      <div style="font-size:13px;font-weight:700;color:#ef4444;">1/5</div>
    </div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
      <div style="width:20%;height:100%;background:#ef4444;border-radius:3px;"></div>
    </div>
  </div>

  <!-- Guideline Adherence: 1/5 -->
  <div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <div style="font-size:13px;font-weight:600;color:#111827;">Guideline Adherence</div>
      <div style="font-size:13px;font-weight:700;color:#ef4444;">1/5</div>
    </div>
    <div style="width:100%;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
      <div style="width:20%;height:100%;background:#ef4444;border-radius:3px;"></div>
    </div>
  </div>

</div>

<!-- Violations -->
<details open style="margin-bottom:16px;">
  <summary style="font-size:14px;font-weight:700;color:#991b1b;cursor:pointer;padding:12px;background:#fee2e2;border-radius:8px;">
    ❌ 11 Critical Violations Found (click to collapse)
  </summary>

  <div style="padding:16px;background:#ffffff;border-radius:8px;margin-top:8px;">

    <!-- Visual Violations -->
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:8px;">Visual Compliance Violations</div>

      <div style="margin-bottom:12px;border-left:4px solid #ef4444;padding-left:12px;">
        <div style="font-weight:600;color:#991b1b;">Wrong Font - Body Text</div>
        <div style="font-size:13px;color:#4b5563;margin-top:4px;">
          <strong>Violation:</strong> Uses Arial font instead of brand-required Roboto<br>
          <strong>Location:</strong> All body text paragraphs<br>
          <strong>Fix:</strong> Change <code>font-family:Arial</code> to <code>font-family:'Roboto', sans-serif</code>
        </div>
      </div>

      <div style="margin-bottom:12px;border-left:4px solid #ef4444;padding-left:12px;">
        <div style="font-weight:600;color:#991b1b;">Wrong CTA Color</div>
        <div style="font-size:13px;color:#4b5563;margin-top:4px;">
          <strong>Violation:</strong> CTA button is red #FF0000 instead of brand Burnt Ochre #B35D33<br>
          <strong>Location:</strong> "Buy Now!" button<br>
          <strong>Fix:</strong> Change <code>background:#FF0000</code> to <code>background:#B35D33</code><br>
          <strong>Note:</strong> Per <a href="../examples/acme-corp-brand-guidelines.md">acme-corp-brand-guidelines.md</a>, Burnt Ochre is reserved exclusively for CTAs. Using it for backgrounds or other elements would also violate usage context rules.
        </div>
      </div>

      <div style="margin-bottom:12px;border-left:4px solid #ef4444;padding-left:12px;">
        <div style="font-weight:600;color:#991b1b;">Wrong Background Color</div>
        <div style="font-size:13px;color:#4b5563;margin-top:4px;">
          <strong>Violation:</strong> Pure white background #FFFFFF instead of Raw Canvas #F5F2ED<br>
          <strong>Location:</strong> Body background<br>
          <strong>Fix:</strong> Change <code>background:#FFFFFF</code> to <code>background:#F5F2ED</code>
        </div>
      </div>
    </div>

    <!-- Messaging Violations -->
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:8px;">Messaging Compliance Violations</div>

      <div style="margin-bottom:12px;border-left:4px solid #ef4444;padding-left:12px;">
        <div style="font-weight:600;color:#991b1b;">Prohibited Terminology (Multiple)</div>
        <div style="font-size:13px;color:#4b5563;margin-top:4px;">
          <strong>Violations:</strong><br>
          • "Eco-friendly" (2x) → Use "circular-material" or "PFC-free"<br>
          • "Green" → Use "traceable" or specific material names<br>
          • "Insane" → Use "engineered" or "durable"<br>
          • "Epic" → Use "reliable" or "proven"<br>
          • "Life-changing" (2x) → Use factual product specs<br>
          <strong>Location:</strong> Throughout body text<br>
          <strong>Fix:</strong> Replace all prohibited terms with approved alternatives from lexicon
        </div>
      </div>
    </div>

    <!-- Tone Violations -->
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:8px;">Tone/Voice Violations</div>

      <div style="margin-bottom:12px;border-left:4px solid #fb923c;padding-left:12px;">
        <div style="font-weight:600;color:#92400e;">Wrong Contextual Tone</div>
        <div style="font-size:13px;color:#4b5563;margin-top:4px;">
          <strong>Violation:</strong> Uses casual/inspirational tone instead of Precise & Functional for product specs<br>
          <strong>Examples:</strong> "OMG!", "Hey outdoor lovers!", "Don't miss out!"<br>
          <strong>Fix:</strong> Adopt knowledgeable, precise tone: "Engineered with bluesign® nylon...", "Designed to endure 500+ miles..."
        </div>
      </div>
    </div>

    <!-- Legal Violations -->
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:8px;">Legal Compliance Violations</div>

      <div style="margin-bottom:12px;border-left:4px solid #ef4444;padding-left:12px;">
        <div style="font-weight:600;color:#991b1b;">Missing CAN-SPAM Footer</div>
        <div style="font-size:13px;color:#4b5563;margin-top:4px;">
          <strong>Violation:</strong> No unsubscribe link or physical address (CAN-SPAM Act requirement)<br>
          <strong>Location:</strong> Email footer (missing entirely)<br>
          <strong>Fix:</strong> Add footer with: Unsubscribe link + Physical mailing address
        </div>
      </div>
    </div>

  </div>
</details>

<!-- Recommendations -->
<details open>
  <summary style="font-size:14px;font-weight:700;color:#991b1b;cursor:pointer;padding:12px;background:#fee2e2;border-radius:8px;">
    💡 Recommendations for Full Compliance (click to collapse)
  </summary>

  <div style="padding:16px;background:#ffffff;border-radius:8px;margin-top:8px;">

    <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:8px;">Priority Fixes (Critical)</div>
    <ol style="font-size:13px;color:#4b5563;line-height:1.6;margin:0 0 16px 20px;padding:0;">
      <li>Add CAN-SPAM compliant footer with unsubscribe link and physical address</li>
      <li>Replace all prohibited terminology with approved terms from lexicon</li>
      <li>Change fonts: Roboto for body, Montserrat for headings</li>
      <li>Update CTA button color from #FF0000 to #B35D33 (Burnt Ochre)</li>
    </ol>

    <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:8px;">Recommended Enhancements</div>
    <ul style="font-size:13px;color:#4b5563;line-height:1.6;margin:0 0 16px 20px;padding:0;">
      <li>Adopt Precise & Functional tone for product specs context</li>
      <li>Include specific technical specs (materials, certifications, performance data)</li>
      <li>Add brand logo and signature "Gear up. Get out. Leave it better."</li>
      <li>Use Raw Canvas (#F5F2ED) background instead of pure white</li>
      <li>Strengthen brand identity with approved power words (Traverse, Equip, Backcountry)</li>
    </ul>

    <div style="background:#dcfce7;border-left:4px solid #10b981;padding:12px;border-radius:6px;margin-top:16px;">
      <div style="font-size:13px;color:#065f46;line-height:1.5;">
        <strong>Projected Score After Fixes:</strong> 38-40/40 (Fully Compliant ✅)<br>
        Addressing these violations will bring this email into full brand compliance and make it ready for launch.
      </div>
    </div>

  </div>
</details>

</div>

**Summary**: This email requires major revision before launch. Focus on replacing prohibited terminology, correcting visual brand elements (fonts, colors), adding legal footer, and adopting the appropriate tone for product specifications.

---

## Key Takeaways

This workflow demonstrates:

1. **Reading brand guidelines** to extract visual, messaging, tone, and legal requirements
2. **Analyzing content** dimension-by-dimension against guidelines
3. **Calculating compliance scores** using 8-dimension rubric (0-40 points)
4. **Identifying specific violations** with locations and severity
5. **Providing actionable fixes** with exact replacements and code changes
6. **Using visual dashboards** with color-coded tiers for quick assessment
7. **Prioritizing fixes** by criticality (legal > messaging > visual > enhancements)

The brand compliance skill ensures all creative content meets brand standards before launch.
