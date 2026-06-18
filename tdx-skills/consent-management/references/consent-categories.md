# Consent Categories Reference

Comprehensive guide to consent types and compliance requirements for GDPR, CCPA, and other privacy regulations.

## Consent Types

### 1. Email Marketing Consent

**Purpose**: Send promotional emails, newsletters, and marketing communications

**Legal Basis**:
- **GDPR**: Requires explicit opt-in (Article 6(1)(a))
- **CAN-SPAM**: Opt-out allowed, but opt-in recommended
- **CASL (Canada)**: Requires explicit opt-in

**Expiration**: 24 months (GDPR best practice)

**What to Track**:
- Consent status (given, refused, withdrawn)
- Timestamp of consent
- Channel where consent was collected (web form, in-store, phone)
- Consent version (to track policy changes)
- IP address (for audit trail)

**Example Consent Language**:
> "I consent to receive promotional emails and newsletters from [Company]. I understand I can unsubscribe at any time."

### 2. SMS/Text Message Consent

**Purpose**: Send text messages for marketing, alerts, or transactional purposes

**Legal Basis**:
- **TCPA (US)**: Requires prior express written consent
- **GDPR**: Requires explicit opt-in
- **CTIA Guidelines**: Double opt-in recommended

**Expiration**: 18-24 months or until withdrawn

**What to Track**:
- Phone number
- Consent timestamp
- Opt-in method (web form, keyword, checkout)
- Message frequency expectations
- Quiet hours preferences

**Example Consent Language**:
> "I consent to receive SMS messages from [Company] at the number provided. Message and data rates may apply. Reply STOP to opt out."

### 3. Profiling & Personalization Consent

**Purpose**: Use customer data to create personalized experiences and recommendations

**Legal Basis**:
- **GDPR**: Requires consent for automated decision-making (Article 22)
- **CCPA**: Requires notice but not explicit consent (unless selling data)

**Expiration**: 24 months (GDPR)

**What to Track**:
- Profiling consent status
- Types of profiling allowed (behavioral, predictive, segmentation)
- Data sources used for profiling

**Example Consent Language**:
> "I consent to [Company] using my browsing and purchase history to personalize my experience and show me relevant product recommendations."

### 4. Data Sharing with Third Parties

**Purpose**: Share customer data with partners, vendors, or advertisers

**Legal Basis**:
- **GDPR**: Requires explicit consent (Article 6(1)(a))
- **CCPA**: Requires opt-out right (Do Not Sell)

**Expiration**: 12-24 months

**What to Track**:
- Consent status
- List of third parties data is shared with
- Purpose of data sharing
- Types of data shared

**Example Consent Language**:
> "I consent to [Company] sharing my information with trusted partners to provide me with relevant offers and services. View our list of partners [here]."

### 5. Cookie Consent

**Purpose**: Use cookies and tracking technologies for analytics and advertising

**Legal Basis**:
- **GDPR**: Requires consent for non-essential cookies (ePrivacy Directive)
- **CCPA**: Notice required, consent not required

**Consent Levels**:
- **Essential**: No consent required (session, security)
- **Functional**: Enhances user experience (preferences, saved carts)
- **Analytics**: Website analytics and performance tracking
- **Advertising**: Targeted ads and remarketing

**Expiration**: 12 months (varies by jurisdiction)

**Example Consent Language**:
> "We use cookies to improve your experience. You can choose which types of cookies to allow: Essential (required), Functional, Analytics, Advertising."

### 6. Analytics & Usage Tracking

**Purpose**: Collect data about how customers use products and services

**Legal Basis**:
- **GDPR**: Legitimate interest or consent depending on data collected
- **CCPA**: Notice required

**What to Track**:
- Consent status
- Types of analytics collected (pageviews, events, behavior)
- Anonymization preferences

**Example Consent Language**:
> "I consent to [Company] analyzing my usage patterns to improve products and services. My data will be aggregated and anonymized."

## GDPR-Specific Requirements

### Consent Must Be:

1. **Freely Given**: No pre-ticked boxes, no bundled consent
2. **Specific**: Separate consent for each purpose
3. **Informed**: Clear explanation of what data is collected and why
4. **Unambiguous**: Explicit affirmative action (e.g., checkbox, button)
5. **Withdrawable**: Easy to withdraw as it was to give

### Required Information:

- Identity of data controller
- Purpose of processing
- Types of data collected
- Right to withdraw consent
- If data will be shared with third parties
- Data retention period

### Consent Renewal:

- GDPR doesn't specify expiration, but best practice is 24 months
- Re-validate if processing purpose changes
- Re-validate if privacy policy changes significantly

## CCPA-Specific Requirements

### Do Not Sell My Personal Information

**What it means**: Right to opt-out of the "sale" of personal information to third parties

**Implementation**:
- Provide clear "Do Not Sell My Personal Information" link
- Honor opt-out within 15 business days
- Do not discriminate against users who opt out

**What to Track**:
- Do Not Sell flag (boolean)
- Date of opt-out request
- Method of request (web form, phone, email)

### Notice at Collection

**Required Information**:
- Categories of personal information collected
- Purposes for collection
- Whether information is sold or shared
- Contact information for privacy questions

**No Consent Required**: CCPA requires notice, not consent (unless selling data to minors)

## Industry-Specific Consent

### Healthcare (HIPAA)

**Protected Health Information (PHI)** requires:
- Explicit authorization for marketing use
- Separate authorization for each purpose
- Patient signature and date
- Right to revoke authorization

### Financial Services (GLBA)

**Non-Public Personal Information (NPI)** requires:
- Annual privacy notice
- Opt-out for sharing with non-affiliates
- No opt-out required for affiliates

### Children's Data (COPPA)

**Children under 13** requires:
- Verifiable parental consent
- Clear notice of data collection practices
- Parental right to review/delete child's data

## Best Practices

### 1. Granular Consent

Provide separate consent options for each purpose:
```
☐ Email marketing
☐ SMS marketing
☐ Personalized recommendations
☐ Data sharing with partners
☐ Analytics and usage tracking
```

### 2. Double Opt-In

For email and SMS, use double opt-in:
1. User submits form
2. Send verification email/SMS
3. User confirms by clicking link or replying YES
4. Consent recorded

### 3. Progressive Consent

Collect consent progressively throughout customer journey:
- **First visit**: Cookie consent
- **Account creation**: Email marketing consent
- **First purchase**: SMS consent, profiling consent
- **Account settings**: Preference center with all options

### 4. Consent Receipts

Provide confirmation after consent is given:
- Email receipt with consent details
- Summary of what was consented to
- Link to manage preferences
- Date and time of consent

### 5. Easy Withdrawal

Make it as easy to withdraw as to give consent:
- Unsubscribe link in every email
- SMS keyword (STOP) for opt-out
- Preference center accessible from account settings
- One-click withdrawal (no login required)

### 6. Audit Trail

Maintain comprehensive audit trail:
- Who gave/withdrew consent (customer ID, email)
- When (timestamp with timezone)
- Where (channel: web, mobile, in-store)
- What (consent type and version)
- How (IP address, device, user agent)

## Consent Renewal Strategies

### When to Request Renewal

- **24 months** after initial consent (GDPR best practice)
- **Policy changes**: Material changes to privacy policy
- **New purposes**: Using data for new purposes not originally consented to
- **Inactive users**: No engagement in 12+ months

### How to Request Renewal

1. **Email Campaign**: "Update Your Preferences"
2. **In-App Prompt**: "Review Your Privacy Settings"
3. **Transactional Touch**: During checkout or account update
4. **Soft Reminder**: Non-intrusive banner or notification

### Incentivize Renewal

- Exclusive content for subscribers
- Early access to sales for opted-in users
- Loyalty points for updating preferences

## Compliance Checklist

- [ ] Separate consent for each marketing channel
- [ ] Clear, plain-language consent notices
- [ ] No pre-ticked checkboxes
- [ ] Easy-to-find unsubscribe/opt-out
- [ ] Consent stored with timestamp and metadata
- [ ] Audit trail of all consent changes
- [ ] Privacy policy linked from consent forms
- [ ] Consent validated before activations
- [ ] Renewal process for expired consents
- [ ] DSAR workflow for data export/deletion

## Resources

- **GDPR**: https://gdpr.eu/
- **CCPA**: https://oag.ca.gov/privacy/ccpa
- **CAN-SPAM**: https://www.ftc.gov/can-spam
- **TCPA**: https://www.fcc.gov/tcpa
- **ICO (UK) Guidance**: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/consent/
