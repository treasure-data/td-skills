---
name: demo-environment
description: Use when the user asks to "set up a demo", "create a demo database", "prep for a demo", "I have a demo coming up", "set up my environment", "copy template data", "clean up my demo", "tear down my demo", or mentions td_template_* databases. Also triggers on "proof of concept", "POC environment", or "sandbox" for prospect demos. Co-loads as a guardrail with industry-cdp-builder, workshop-demo, and platform-demo. Do NOT trigger for general parent segment creation without demo context (use tdx-skills:parent-segment), general database queries (use tdx-skills:tdx-basic), or generating interactive HTML platform demos (use platform-demo).
---

# Demo Environment Setup

Guide the user through setting up their own isolated demo environment. This is an interactive, step-by-step workflow. Ask one question at a time, confirm answers, and execute each step before moving to the next.

If the user needs multiple environments (e.g., "I have demos for 3 companies this week"), gather all company names and verticals first, then execute the full workflow for each company sequentially. Present a combined summary at the end.

## Step 1: Gather Context

Determine the user's name from conversation history, memory, or their system profile. Extract:
- `owner` = first initial + last name, lowercase, no dots (e.g., `glawrence`)

If you cannot determine the user's name from any available context, ask for it. Otherwise, proceed directly to the questions.

Ask these questions **one at a time**, waiting for each answer before proceeding:

**Question 1:** "Who are you meeting with or demoing for?"
- Get the prospect/customer company name (e.g., "Acme Corp", "Nike", "Mayo Clinic")
- Extract: `prospect` = company name for display
- Extract: `prospect_slug` = lowercase, replace spaces with underscores, drop all non-alphanumeric non-underscore characters (hyphens, ampersands, periods, etc.), collapse multiple underscores to one. Examples: `Acme Corp` -> `acme_corp`, `T-Mobile` -> `tmobile`, `Procter & Gamble` -> `procter_gamble`, `7-Eleven` -> `7eleven`

**Question 2:** "What vertical do they fall into?" Present this numbered list:

```
Which vertical best fits this prospect?

 1. Retail         — E-commerce, omnichannel, DTC
 2. Financial Services (FSI) — Banking, wealth, lending
 3. Healthcare     — Providers, payers, pharma
 4. Travel         — Airlines, hotels, OTAs
 5. CPG            — Consumer packaged goods, FMCG
 6. Media          — Streaming, publishing, entertainment
 7. Telecom        — Mobile, broadband, TV
 8. Automotive     — OEMs, dealers, aftermarket
 9. Insurance      — P&C, life, health
10. Education      — Higher ed, EdTech, alumni
```

- Map their choice to the template: `td_template_{vertical}`

**Question 3:** "What are their goals or key use cases? (e.g., reduce churn, improve loyalty, cross-sell, personalization)"
- Store the answer for later use in child segments and talking points.

## Step 2: Confirm the Plan

After gathering all answers, present a summary and wait for confirmation:

```
Here's your demo setup plan:

  Owner:      {Name}
  Prospect:   {prospect}
  Vertical:   {vertical}
  Template:   td_template_{vertical}

  Database:   {owner}_demo_{prospect_slug}
  Parent Seg: Demo - {prospect}

  Goals: {goals summary}

Does this look right? (I'll create the database and copy all template data)
```

Do not proceed until the user confirms.

## Step 3: Create the Database

After confirmation, execute these steps. Show progress to the user.

1. **Pre-flight check** — verify the template exists:
   ```bash
   tdx databases "td_template_{vertical}"
   ```
   If the template is not found, stop and tell the user: "Template database td_template_{vertical} not found. Check that you're on the correct account."

2. **Check for collisions:**
   ```bash
   tdx databases "{owner}_demo_{prospect_slug}"
   ```
   If the database already exists, ask the user: "A database named {name} already exists. Want me to use a different name (e.g., {name}_2)?"

3. **Create the schema:**
   ```bash
   tdx query "CREATE SCHEMA IF NOT EXISTS {owner}_demo_{prospect_slug}" -y
   ```

4. **Copy all tables from the template** — run each CTAS sequentially and report progress:
   ```bash
   tdx query "CREATE TABLE {YOUR_DB}.{table} AS SELECT * FROM {TEMPLATE}.{table}" -y
   ```
   If a CTAS fails, retry it once. If it fails again, skip it, note which table was skipped, and continue with the remaining tables.

5. **Verify the copy:**
   ```bash
   tdx tables "{YOUR_DB}.*"
   ```
   Confirm all tables copied successfully. Report the count. If any tables were skipped, remind the user.

Tell the user: "Database ready: `{YOUR_DB}` with {N} tables copied from the {vertical} template."

## Step 4: Create the Parent Segment

Use the **Parent Segment Blueprint** section below for the selected vertical. The blueprint defines exactly which tables are attributes vs behaviors and which columns to include. Do NOT guess -- use the blueprint.

Write the YAML using the `tdx ps` format:

```yaml
name: "Demo - {prospect}"

master:
  database: {YOUR_DB}
  table: master_customers

attributes:
  - name: "{Table Display Name}"
    source:
      database: {YOUR_DB}
      table: {table_name}
    join:
      parent_key: customer_id
      child_key: customer_id
    columns:
      - column: {col}
        type: {string|number}

behaviors:
  - name: "{Table Display Name}"
    source:
      database: {YOUR_DB}
      table: {table_name}
    join:
      parent_key: customer_id
      child_key: customer_id
    default_time_filter: false
    columns:
      - column: {col}
        type: {string|number}
```

Critical rules:
- Set `default_time_filter: false` on **every** behavior
- Do NOT include `time` or `customer_id` in column lists
- Use `number` for bigint/double/integer columns, `string` for varchar
- Column names must not conflict across attribute tables. If two attribute tables share a column name, include it in only one.
- Always pass `-y` flag on push and run commands

Then validate, push with `-y`, and run with `-y`:
```bash
tdx ps validate parent_segments/{file}.yml
tdx ps push parent_segments/{file}.yml -y
tdx ps run "Demo - {prospect}" -y
```

If validate fails, check for: duplicate column names across attribute tables (include the column in only one), wrong column types, or missing tables. Fix the YAML and re-validate. If push fails with a permission error, confirm the user is on the correct account.

## Step 5: Confirm What's Ready

Present a final summary:

```
Your demo environment is ready!

  Database:       {YOUR_DB}
  Parent Segment: Demo - {prospect}
  Tables:         {list of tables}
  Profiles:       1,000 customers

You can now:
  - Build child segments for {prospect}'s goals ({goals})
  - Look up individual customers (UCV)
  - Run customer intelligence dashboards
  - Create journeys
  - Run the full workshop flow

All of these will use YOUR database and parent segment.

When the demo is over, clean up:
  tdx query "DROP SCHEMA {YOUR_DB} CASCADE" -y
```

---

## Parent Segment Blueprints

Use these exact table/column mappings when building the parent segment YAML. Every column listed has been verified against the actual template database schemas.

### 1. Retail (`td_template_retail`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), gender (string), city (string), state (string), signup_date (string), lifetime_value (number), churn_risk (string), customer_segment (string), preferred_channel (string), propensity_score (number) |
| `customer_profiles` | Customer Profiles | phone_number (string), email_consent (number), phone_consent (number), product_registered (number) |
| `loyalty_membership_cdp` | Loyalty Membership | tier (string), points_balance (number), lifetime_points (number), member_since (string) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_product (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `transactions` | Transactions | order_id (string), amount (number), category (string), channel (string), payment_method (string) |
| `email_events` | Email Events | campaign_id (string), event_type (string), campaign_name (string) |
| `support_tickets` | Support Tickets | ticket_id (string), category (string), priority (string), resolution_status (string), satisfaction_score (number) |
| `web_events` | Web Events | event_type (string), page_url (string), product_id (string), device_type (string) |

**Standalone Reference Tables (not in parent segment, used for query enrichment):**
- `product_catalog` -- product_id, product_name, category, price, brand (200 products, join to transactions/web_events on product_id)

**Do NOT include:** `loyalty_membership` (superseded by `loyalty_membership_cdp`), marketing tables (channel_performance_monthly, campaign_performance, segment_channel_performance).

### 2. Financial Services (`td_template_fsi`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), income_bracket (string), city (string), state (string), relationship_start (string), total_aum (number), risk_tolerance (string), churn_risk (string), primary_product (string), advisor_assigned (string), propensity_score (number) |
| `client_profiles` | Client Profiles | phone_number (string), email_consent (number), phone_consent (number), net_worth_tier (string), digital_adoption (string) |
| `account_portfolio` | Account Portfolio | account_id (string), account_type (string), balance (number), opened_date (string), status (string) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_product (string) |
| `login_risk_scores` | Login Risk Scores | risk_level (string), risk_score (number), fraud_flag (string), risk_reason (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `transactions` | Transactions | transaction_id (string), transaction_type (string), amount (number), channel (string), status (string) |
| `login_events` | Login Events | login_channel (string), device_type (string), login_success (string), ip_country (string) |
| `email_engagement` | Email Engagement | campaign_id (string), event_type (string), campaign_name (string), product_promoted (string) |
| `service_complaints` | Service Complaints | complaint_id (string), category (string), channel (string), resolution_status (string), satisfaction_score (number) |

### 3. Healthcare (`td_template_healthcare`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), gender (string), zip_code (string), insurance_type (string), primary_care_provider (string), risk_score (number), engagement_score (string), chronic_condition_count (number), propensity_score (number) |
| `patient_profiles` | Patient Profiles | phone_number (string), email_consent (number), phone_consent (number), sms_consent (number), preferred_language (string), communication_preference (string), portal_registered (number) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_service (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `appointments` | Appointments | appointment_id (string), appointment_type (string), department (string), status (string), provider_id (string) |
| `prescriptions` | Prescriptions | prescription_id (string), medication_name (string), medication_category (string), refill_count (number), adherence_status (string) |
| `email_engagement` | Email Engagement | campaign_id (string), event_type (string), campaign_name (string) |
| `portal_logins` | Portal Logins | device_type (string), action (string) |
| `health_assessments` | Health Assessments | assessment_id (string), assessment_type (string), result_status (string), status (string) |

### 4. Travel & Hospitality (`td_template_travel`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), home_city (string), loyalty_tier (string), total_miles_points (number), preferred_cabin (string), total_lifetime_bookings (number), churn_risk (string), propensity_score (number) |
| `loyalty_accounts` | Loyalty Accounts | loyalty_id (string), tier_status (string), points_balance (number), points_expiry_date (string), tier_qualification_date (string) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_offer (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `bookings` | Bookings | booking_id (string), booking_type (string), destination (string), amount (number), booking_status (string), booking_channel (string) |
| `email_events` | Email Events | campaign_id (string), event_type (string), campaign_name (string) |
| `ancillary_purchases` | Ancillary Purchases | purchase_id (string), item_type (string), amount (number), associated_booking_id (string) |
| `reviews` | Reviews | review_id (string), rating (number), sentiment (string), category (string) |
| `search_events` | Search Events | destination_searched (string), cabin_class (string), search_type (string), outcome (string), travelers (number) |

### 5. CPG (`td_template_cpg`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), gender (string), city (string), state (string), household_size (number), income_bracket (string), brand_loyalty (string), churn_risk (string), preferred_retailer (string), propensity_score (number) |
| `household_profiles` | Household Profiles | phone_number (string), email_consent (number), sms_consent (number), shopping_frequency (string), coupon_affinity (string), product_registered (number) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_product (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `purchases` | Purchases | purchase_id (string), brand (string), category (string), retailer (string), amount (number), quantity (number) |
| `category_events` | Category Events | category (string), event_type (string), brand (string) |
| `coupon_redemptions` | Coupon Redemptions | coupon_id (string), coupon_type (string), discount_amount (number), brand (string) |
| `campaign_responses` | Campaign Responses | campaign_id (string), response_type (string), channel (string) |
| `email_events` | Email Events | campaign_id (string), event_type (string), campaign_name (string) |
| `support_tickets` | Support Tickets | ticket_id (string), category (string), resolution_status (string), satisfaction_score (number) |
| `store_visits` | Store Visits | retailer (string), visit_type (string), basket_value (number), items_purchased (number) |

### 6. Media & Entertainment (`td_template_media`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), plan_type (string), signup_date (string), churn_risk (string), preferred_genre (string), propensity_score (number) |
| `subscriber_profiles` | Subscriber Profiles | phone_number (string), email_consent (number), push_consent (number), device_count (number), trial_history (string), viewing_persona (string) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_offer (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `content_plays` | Content Plays | content_id (string), content_type (string), genre (string), duration_minutes (number), completed (string), platform (string) |
| `sessions` | Sessions | session_id (string), platform (string), duration_minutes (number) |
| `billing_events` | Billing Events | event_type (string), amount (number), plan_type (string) |
| `ratings` | Ratings | content_id (string), rating (number) |
| `email_events` | Email Events | campaign_id (string), event_type (string), campaign_name (string) |
| `support_tickets` | Support Tickets | ticket_id (string), category (string), resolution_status (string), satisfaction_score (number) |
| `ad_impressions` | Ad Impressions | ad_id (string), ad_type (string), advertiser_category (string), interaction (string), duration_seconds (number) |

### 7. Telecom (`td_template_telecom`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), city (string), state (string), plan_type (string), line_type (string), monthly_bill (number), tenure_months (number), churn_risk (string), num_lines (number), propensity_score (number) |
| `subscriber_profiles` | Subscriber Profiles | phone_number (string), email_consent (number), sms_consent (number), contract_type (string), upgrade_eligible (number), value_tier (string) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_offer (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `usage_data` | Usage Data | usage_type (string), amount (number), unit (string) |
| `plan_changes` | Plan Changes | old_plan (string), new_plan (string), reason (string) |
| `device_purchases` | Device Purchases | device_id (string), brand (string), model (string), price (number) |
| `support_tickets` | Support Tickets | ticket_id (string), category (string), resolution_status (string), satisfaction_score (number) |
| `email_events` | Email Events | campaign_id (string), event_type (string), campaign_name (string) |
| `network_events` | Network Events | event_type (string), network_type (string), signal_bars (number), download_speed_mbps (number) |

### 8. Automotive (`td_template_auto`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), city (string), state (string), vehicle_make (string), vehicle_model (string), vehicle_year (number), purchase_type (string), churn_risk (string), dealer_id (string), propensity_score (number) |
| `vehicle_ownership` | Vehicle Ownership | vin (string), make (string), model (string), year (number), ownership_status (string) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_offer (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `service_history` | Service History | service_id (string), service_type (string), cost (number), dealer_id (string) |
| `test_drives` | Test Drives | test_drive_id (string), make (string), model (string), outcome (string), dealer_id (string) |
| `web_events` | Web Events | event_type (string), make_viewed (string), device_type (string) |
| `email_events` | Email Events | campaign_id (string), event_type (string), campaign_name (string) |
| `connected_vehicle` | Connected Vehicle | alert_type (string), odometer_miles (number), avg_mpg (number), vehicle_status (string), maintenance_due (string) |

### 9. Insurance (`td_template_insurance`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), city (string), state (string), risk_tier (string), total_annual_premium (number), churn_risk (string), num_policies (number), propensity_score (number) |
| `policy_portfolio` | Policy Portfolio | policy_id (string), policy_type (string), annual_premium (number), status (string), start_date (string), renewal_date (string) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_product (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `claims` | Claims | claim_id (string), claim_type (string), amount (number), status (string) |
| `life_events` | Life Events | event_type (string) |
| `quote_requests` | Quote Requests | quote_id (string), policy_type (string), quoted_premium (number), outcome (string) |
| `agent_interactions` | Agent Interactions | agent_id (string), action (string), channel (string) |
| `email_events` | Email Events | campaign_id (string), event_type (string), campaign_name (string) |
| `renewal_events` | Renewal Events | renewal_id (string), policy_type (string), outcome (string), premium_amount (number), premium_change_pct (number), renewal_channel (string) |

### 10. Education (`td_template_education`)

**Attributes:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `master_customers` | Master Customers | email (string), first_name (string), last_name (string), age (number), city (string), state (string), student_type (string), program (string), gpa (number), enrollment_status (string), churn_risk (string), propensity_score (number) |
| `student_profiles` | Student Profiles | phone_number (string), email_consent (number), sms_consent (number), financial_aid_status (string), campus_engagement (string), donor_flag (number) |
| `next_best_actions` | Next Best Actions | next_best_time (string), next_best_channel (string), next_best_program (string) |

**Behaviors:**
| Table | Display Name | Columns |
|-------|-------------|---------|
| `applications` | Applications | application_id (string), program (string), status (string), term (string) |
| `course_activity` | Course Activity | course_id (string), course_name (string), status (string), grade (string) |
| `donations` | Donations | donation_id (string), donation_type (string), amount (number) |
| `event_attendance` | Event Attendance | event_id (string), event_type (string) |
| `email_events` | Email Events | campaign_id (string), event_type (string), campaign_name (string) |
| `financial_aid_events` | Financial Aid Events | aid_id (string), aid_type (string), amount (number), status (string) |
| `lms_activity` | LMS Activity | activity_type (string), course_id (string), duration_minutes (number), completion_pct (number), device (string) |

---

## Naming Rules

| Resource | Format | Example |
|----------|--------|---------|
| Database | `{owner}_demo_{prospect_slug}` | `glawrence_demo_nike` |
| Parent Segment | `Demo - {prospect}` | `Demo - Nike` |
| Child Segments | Descriptive name | `High-Value Churning` |
| Journeys | Descriptive name | `Win-Back Journey` |

If at any point the user tries to use a generic name (like "Retail Demo") or skip the prefix, correct them.

## Prohibited Actions

Block or warn before any of these:
- Using someone else's parent segment for anything (even read-only)
- Writing to or modifying any `td_template_*` database
- Pointing a parent segment directly at a `td_template_*` database (must copy first)
- Running `tdx ps push` against a parent segment name the user didn't create
- Creating child segments against someone else's parent segment
- Using production connections in demo journeys
- Dropping a database without confirming ownership
- Dropping any `td_template_*` database (these are shared infrastructure)

## Integration with Other Skills

- **industry-cdp-builder / workshop-demo-builder:** Tell the skill the data already exists. Skip data generation. Use naming conventions from this skill.
- **workshop-demo:** Provide the database and parent segment names. The workshop skill should use these throughout all 6 stages.
- **platform-demo:** Same -- provide prefixed names.
- **ucv / customer-intelligence / omni-channel-reporting:** Point at the user's own parent segment, never someone else's.
- **segment / journey skills:** Enforce the child segment and journey naming conventions.

**Note:** All templates have 1,000 profiles with `propensity_score` on `master_customers`, plus 3 standalone marketing tables (channel_performance_monthly, campaign_performance, segment_channel_performance) not included in the parent segment. Retail also has `product_catalog` for query enrichment joins on product_id.