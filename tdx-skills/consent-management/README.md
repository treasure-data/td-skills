# CDP Consent & Preference Management Skill

Comprehensive skill for implementing GDPR/CCPA compliant consent management in Treasure Data CDP.

## Overview

This skill teaches Claude Code how to help users implement privacy-first customer data management using Treasure Data's architecture. It covers consent data modeling, preference centers, privacy-aware segmentation, DSAR workflows, and activation compliance.

## Structure

```
consent-management/
├── SKILL.md                              # Main skill definition (490 lines)
├── examples/
│   ├── consent-parent-segment.yml        # Parent segment with consent attributes
│   ├── consent-segment-rules.yml         # 8 privacy-compliant segment patterns
│   ├── preference-center.html            # Complete preference center with TD SDK
│   └── dsar-export.sql                   # Data subject access request queries
├── templates/
│   ├── consent-table-ddl.sql             # Database schemas for consent tracking
│   └── consent-sync-workflow.dig         # Workflow for consent validation & sync
├── references/
│   └── consent-categories.md             # GDPR/CCPA consent types reference
└── README.md                             # This file
```

## Features

### 1. Consent Data Modeling
- **Consent tracking table** with immutable audit log
- **Parent segment attributes** for unified customer profile
- **Views** for latest consent status and change tracking
- **Privacy settings** for GDPR/CCPA compliance

### 2. Consent Collection
- **TD JavaScript SDK** integration with Consent Extension
- **Preference center** HTML template with real-time updates
- **Privacy controls** (anonymous mode, event blocking)
- **Double opt-in** patterns for email/SMS

### 3. Privacy-Aware Segmentation
- **8 example segments** filtering by consent status
- **Consent expiration** checks (GDPR 24-month renewal)
- **Multi-channel** consent validation
- **CCPA Do Not Sell** exclusions

### 4. Activation Compliance
- **Pre-activation** consent validation
- **Consent-aware** connector configurations
- **Audit logging** for all activations
- **Compliance monitoring** and alerts

### 5. DSAR Workflows
- **Right to Access**: Complete customer data export
- **Right to Deletion**: Anonymization and purge scripts
- **Right to Rectification**: Consent correction patterns
- **Audit trail**: Comprehensive compliance reporting

## Usage

### Installation

Add the td-skills marketplace to Claude Code:
```bash
/plugin marketplace add https://github.com/treasure-data/td-skills
```

Install tdx-skills (includes consent-management):
```bash
/plugin install tdx-skills@td-skills
```

### Invoking the Skill

Use natural language to trigger the skill:
```
"Use the consent-management skill to implement GDPR compliance"
"Use the consent skill to create a preference center"
"Use the consent skill to build privacy-aware segments"
"Use the consent skill to process a data deletion request"
```

### Example Workflows

**1. Initial Setup**
```
"Use the consent-management skill to:
1. Create consent tracking tables
2. Add consent attributes to my parent segment
3. Generate a preference center for my website"
```

**2. Create Privacy-Compliant Segment**
```
"Use the consent skill to create an email marketing segment that:
- Only includes users who opted in to email
- Excludes expired consents (older than 24 months)
- Validates consent before each activation"
```

**3. Process DSAR Request**
```
"Use the consent skill to export all data for customer ID cust_12345 (GDPR data access request)"
```

## Key Concepts

### TD Privacy Architecture

Treasure Data's consent management follows an **architecture-first** approach:

1. **Centralized Storage**: Consent stored as parent segment attributes
2. **Real-Time Enforcement**: Consent checked at activation time
3. **Fine-Grained Metadata**: Track timestamp, channel, version for audit
4. **Unified Profile**: Consent part of customer 360 view

### Consent Types

- **Email Marketing**: Promotional emails, newsletters
- **SMS**: Text message marketing and alerts
- **Profiling**: Personalization and recommendations
- **Data Sharing**: Third-party sharing and partnerships
- **Cookies**: Analytics and advertising tracking

### Compliance Requirements

**GDPR**:
- Explicit opt-in required
- Consent must be freely given, specific, informed, unambiguous
- Easy withdrawal (as easy as giving consent)
- Consent renewal every 24 months (best practice)

**CCPA**:
- Notice required, consent not required (unless selling data)
- Do Not Sell My Personal Information right
- No discrimination for opting out
- 15-day response time for requests

## File Descriptions

### SKILL.md (490 lines)
Main skill definition with:
- Consent data model patterns
- TD JS SDK integration
- Privacy-aware segmentation rules
- DSAR workflows
- Compliance best practices

### examples/consent-parent-segment.yml
Complete parent segment configuration showing how to add consent attributes, email preferences, SMS preferences, and privacy settings.

### examples/consent-segment-rules.yml
8 ready-to-use segment patterns:
1. Basic email consent filter
2. SMS marketing with high-value filter
3. Profiling consent for analytics
4. Multi-channel consent
5. CCPA Do Not Sell exclusion
6. Consent renewal needed
7. Preference-based segmentation
8. Exclude withdrawn consent

### examples/preference-center.html
Production-ready preference center with:
- Email/SMS consent toggles
- Email frequency and topic preferences
- Privacy settings (profiling, data sharing, CCPA)
- TD SDK integration for tracking
- Local storage fallback

### examples/dsar-export.sql
Comprehensive SQL queries for:
- Right to Access (full data export)
- Right to Deletion (anonymization)
- Right to Rectification (data correction)
- Consent history audit
- Compliance monitoring

### templates/consent-table-ddl.sql
Database schemas for:
- `consent_tracking`: Immutable consent event log
- `email_preferences`: Email frequency and topics
- `sms_preferences`: SMS frequency and quiet hours
- `privacy_settings`: GDPR/CCPA controls
- `consent_wide`: View with latest consent per customer
- `consent_audit`: View with consent change tracking

### templates/consent-sync-workflow.dig
Digdag workflow for:
- Daily consent validation
- Consent renewal campaigns
- Pre-activation compliance checks
- Weekly audit reports
- Consent sync to destinations

### references/consent-categories.md
Comprehensive guide covering:
- All consent types (email, SMS, profiling, data sharing, cookies)
- Legal requirements (GDPR, CCPA, CAN-SPAM, TCPA)
- Consent renewal strategies
- Industry-specific requirements (HIPAA, GLBA, COPPA)
- Best practices and compliance checklist

## Alignment with TD Principles

This skill follows Treasure Data's core principles:

1. **Architecture-First Privacy**: Consent built into parent segment data model, not bolted on
2. **Real-Time Enforcement**: Central consent storage ensures downstream compliance
3. **Fine-Grained Metadata**: Store timestamp, channel, version with every consent event
4. **Unified Customer View**: Consent as part of Customer 360 profile
5. **Integration-Ready**: Works with external CMPs (OneTrust, Gigya)

## Public Availability

This skill is designed to be **publicly shareable** because:
- ✅ Privacy compliance is universal (applies to all CDPs)
- ✅ No proprietary TD internals exposed
- ✅ Uses publicly documented TD features
- ✅ Follows industry-standard patterns
- ✅ Educational value for privacy best practices

## Support & Resources

- **TD Trust for CDP**: https://docs.treasuredata.com/trust
- **TD Consent Manager**: https://api-docs.treasuredata.com/en/sdk/js-sdk/consent-manager/
- **GDPR Guide**: https://www.treasuredata.com/blog/consent-management-customer-data-platform-cdp
- **Parent Segment API**: https://api-docs.treasuredata.com/pages/audience_api_v1/tag/Parent-Segment-Configurations/

## Contributing

To improve this skill:
1. Test with real customer scenarios
2. Add more segment pattern examples
3. Expand DSAR workflow coverage
4. Document industry-specific requirements
5. Add visualization examples for compliance dashboards

## License

Internal Treasure Data use only (as part of td-skills repository).
