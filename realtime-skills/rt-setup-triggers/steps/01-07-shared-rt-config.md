# Steps 1-7: Parent Segment Validation & RT Infrastructure Configuration

**SHARED STEPS** - These steps are identical for both RT Personalization and RT Triggers.

See the `rt-setup-personalization` skill for complete implementation:

## Step 1-2: Validate & Discover Use Case

See [rt-setup-personalization/steps/01-02-validate-discovery.md](../../rt-setup-personalization/steps/01-02-validate-discovery.md)

**For RT Triggers**, common use cases include:
- **Welcome Journey**: New user registration → Send welcome email
- **Cart Abandonment**: User adds to cart → Send reminder
- **High-Value Purchase**: Purchase > $500 → Alert sales team
- **Content Engagement**: User views premium content → Trigger upsell

## Step 3-6: Data Exploration

See [rt-setup-personalization/steps/03-06-data-exploration.md](../../rt-setup-personalization/steps/03-06-data-exploration.md)

Same exploration process: batch attributes, event tables, ID stitching, RT attributes.

## Step 7: Configure RT Infrastructure

See [rt-setup-personalization/steps/07-rt-config.md](../../rt-setup-personalization/steps/07-rt-config.md)

**SHARED CONFIGURATION** - Configures:
- Event tables and key events
- RT attributes (single, list, counter)
- ID stitching keys

This step is identical for both Personalization and Triggers.

---

**Checkpoints after Step 7:**
- ✓ Parent segment validated
- ✓ Use case selected (journey-specific)
- ✓ Event tables configured
- ✓ Key events created
- ✓ RT attributes created
- ✓ ID stitching configured
- ✓ RT status is "ok"

**Next:** Proceed to Step 8 (Journey Creation)
