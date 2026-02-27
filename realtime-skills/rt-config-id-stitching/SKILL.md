---
name: rt-config-id-stitching
description: Configure RT 2.0 ID stitching - merge real-time profiles across different identifiers using stitching keys and primary keys
---

# RT 2.0 ID Stitching Configuration

Configure profile merging across multiple identifiers in real-time.

## Prerequisites

- RT 2.0 enabled and event tables configured
- Understanding of available ID fields in event data

## ID Stitching Structure

```yaml
id_stitching:
  primary_key: "td_client_id"        # Main unique identifier
  stitching_keys:                     # All identifiers for merging
    - name: "td_client_id"
      exclude_regex: "^test_.*"       # Filter invalid IDs
    - name: "email"
      exclude_regex: ".*@test\\.com$"
    - name: "user_id"
  ext_lookup_key: "email"             # Optional: External lookup
```

## Primary Key

The main unique identifier for profiles:

```yaml
primary_key: "td_client_id"
```

**Requirements**:
- Must be one of the `stitching_keys`
- Should be stable and unique
- Available in most events
- Not null for most users

**Common choices**:
- `td_client_id` - TD cookie/device ID (recommended for web)
- `user_id` - Your application's user ID
- `customer_id` - CRM customer ID

## Stitching Keys

All identifiers used to merge profiles:

```yaml
stitching_keys:
  - name: "td_client_id"
    exclude_regex: "^test_.*"    # Exclude test IDs

  - name: "email"
    exclude_regex: ".*@(test|example)\\.com$"  # Exclude test emails

  - name: "user_id"
    exclude_regex: "^guest_"     # Exclude guest users

  - name: "phone_number"
    # No exclusion pattern
```

**Key Selection**:
- Include all IDs present in event data
- Order doesn't matter
- Primary key must be in this list
- Can add more keys later

## Exclude Regex Patterns

Filter out invalid or test identifiers:

### Common Patterns

```yaml
# Test IDs
exclude_regex: "^test_.*"              # Starts with "test_"
exclude_regex: ".*_test$"              # Ends with "_test"

# Test emails
exclude_regex: ".*@test\\.com$"        # @test.com domain
exclude_regex: ".*@example\\.com$"     # @example.com domain
exclude_regex: ".*@(test|example|demo)\\.com$"  # Multiple test domains

# Guest/anonymous users
exclude_regex: "^guest_"               # Starts with "guest_"
exclude_regex: "^anon_"                # Starts with "anon_"
exclude_regex: "^(guest|anonymous)_"   # Starts with guest_ or anonymous_

# Development IDs
exclude_regex: "^dev_"                 # Development IDs
exclude_regex: "localhost"             # Localhost IDs

# Invalid formats
exclude_regex: "^$"                    # Empty strings
exclude_regex: "^null$"                # String "null"
exclude_regex: "^undefined$"           # String "undefined"
```

## External Lookup Key

Optional key for external profile lookups:

```yaml
ext_lookup_key: "email"
```

**Use cases**:
- External API lookups by email
- CRM integrations
- Customer service lookups

**Requirements**:
- Must be one of the `stitching_keys`
- Typically `email` or `user_id`

## Complete Examples

### E-commerce

```yaml
id_stitching:
  primary_key: "td_client_id"
  stitching_keys:
    - name: "td_client_id"
      exclude_regex: "^test_"
    - name: "email"
      exclude_regex: ".*@(test|example)\\.com$"
    - name: "customer_id"
      exclude_regex: "^guest_"
    - name: "user_id"
  ext_lookup_key: "email"
```

### B2B/SaaS

```yaml
id_stitching:
  primary_key: "user_id"
  stitching_keys:
    - name: "user_id"
      exclude_regex: "^test_"
    - name: "email"
      exclude_regex: ".*@(test|example|localhost)\\.com$"
    - name: "td_client_id"
    - name: "account_id"
  ext_lookup_key: "email"
```

### Mobile App

```yaml
id_stitching:
  primary_key: "td_client_id"
  stitching_keys:
    - name: "td_client_id"       # Device ID
    - name: "user_id"             # App user ID
      exclude_regex: "^guest_"
    - name: "advertising_id"      # IDFA/GAID
    - name: "email"
      exclude_regex: ".*@test\\.com$"
  ext_lookup_key: "user_id"
```

## How ID Stitching Works

When an event comes in with multiple IDs:

```json
{
  "td_client_id": "abc123",
  "email": "user@example.com",
  "user_id": "user_456"
}
```

1. **Check existing profiles** with any of these IDs
2. **Merge profiles** if multiple profiles found
3. **Update primary key** to the value from the event
4. **Associate all IDs** with the merged profile

## Discover Available IDs

Check what ID fields are in your event tables:

```bash
# View table schema
tdx table describe <database> <table>

# Check ID field distribution
tdx query "
select
  count(distinct td_client_id) as client_ids,
  count(distinct email) as emails,
  count(distinct user_id) as user_ids,
  count(*) as total_events
from <database>.<table>
where td_interval(time, '-7d')
"

# Check ID co-occurrence
tdx query "
select
  count(*) as events,
  count(case when td_client_id is not null then 1 end) as has_client_id,
  count(case when email is not null then 1 end) as has_email,
  count(case when user_id is not null then 1 end) as has_user_id
from <database>.<table>
where td_interval(time, '-7d')
"

# Find test patterns to exclude
tdx query "
select
  email,
  count(*) as event_count
from <database>.<table>
where td_interval(time, '-7d')
  and email like '%test%'
group by email
order by event_count desc
limit 20
"
```

## Update ID Stitching via API

```bash
# Update key columns
tdx api "/audiences/<parent_segment_id>/realtime_setting" --type cdp --method PATCH --data '{
  "key_columns": {
    "primary_key": "td_client_id",
    "stitching_keys": [
      {
        "name": "td_client_id",
        "exclude_regex": "^test_.*"
      },
      {
        "name": "email",
        "exclude_regex": ".*@test\\.com$"
      },
      {
        "name": "user_id"
      }
    ],
    "ext_lookup_key": "email"
  }
}'
```

## Validate ID Stitching

```bash
# Validate configuration
tdx ps rt validate rt_config.yaml

# Checks:
# - primary_key is in stitching_keys
# - All key names are valid
# - Regex patterns are valid
```

## Monitor Profile Merging

Check profile merge activity:

```bash
# Query ID change log
tdx query "
select
  operation,
  count(*) as merge_count
from cdp_audience_<parent_segment_id>_rt.id_change_log
where td_interval(time, '-1d')
group by operation
order by merge_count desc
"

# Check recent merges
tdx query "
select
  time,
  operation,
  from_id,
  to_id,
  merge_reason
from cdp_audience_<parent_segment_id>_rt.id_change_log
where td_interval(time, '-1h')
  and operation = 'merge'
order by time desc
limit 20
"
```

## Common Errors

| Error | Solution |
|-------|----------|
| "Primary key not in stitching_keys" | Add primary_key to stitching_keys list |
| "Invalid regex pattern" | Test regex with online validator |
| "Key column not found" | Verify field exists in event tables |
| "Duplicate key names" | Remove duplicate stitching_keys |
| "ext_lookup_key not in stitching_keys" | Add ext_lookup_key to stitching_keys |

## Best Practices

### Key Selection
- **Start minimal**: Begin with 2-3 keys, add more later
- **Stable IDs first**: Use IDs that rarely change (not session IDs)
- **Common IDs**: Include IDs present in most events
- **Business keys**: Include important business identifiers (customer_id, user_id)

### Exclude Patterns
- **Test thoroughly**: Test regex against real data
- **Be specific**: Narrow patterns reduce false positives
- **Document patterns**: Add comments explaining each pattern
- **Review logs**: Check what's being excluded

### Primary Key Selection
- **Most stable**: Choose ID that rarely changes
- **Highest coverage**: Available in most events
- **Not PII**: Avoid email/phone as primary (use td_client_id or user_id)
- **Unique**: Each value identifies exactly one person

## Testing

```bash
# Test exclude regex patterns
tdx query "
select
  td_client_id,
  email,
  user_id,
  case when regexp_like(td_client_id, '^test_') then 'excluded' else 'included' end as client_id_status,
  case when regexp_like(email, '.*@test\\.com$') then 'excluded' else 'included' end as email_status
from <database>.<table>
where td_interval(time, '-1h')
limit 20
"
```

## Next Steps

After configuring ID stitching:
- **Push Configuration**: Deploy RT config with `tdx ps push`
- **Monitor Merges**: Check ID change log for merge activity
- **RT Personalization**: Use unified profiles → Use `rt-pz-service` skill
- **RT Triggers**: Trigger on unified profile events → Use `rt-journey-create` skill

## Resources

- [ID Stitching Documentation](https://docs.treasuredata.com/display/public/PD/ID+Stitching)
- [Profile Merging Guide](https://docs.treasuredata.com/display/public/PD/Profile+Merging)
- [Regex Pattern Reference](https://docs.treasuredata.com/display/public/PD/Regular+Expressions)
