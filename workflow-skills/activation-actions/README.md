# Activation Actions Workflows

Create custom digdag workflows that automatically process and transform activation data before exporting to external platforms.

## Quick Start

```yaml
# basic_activation_action.dig
timezone: UTC

_export:
  # These parameters are automatically provided by Activation Actions
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}
  profile_count: ${profile_count}

+process:
  td>: queries/process.sql
  database: ${activation_output_database}
  create_table: processed_data

+export:
  td_result_export>:
    database: ${activation_output_database}
    table: processed_data
    result_url: "platform://your-authentication"
```

## Common Use Cases

### 1. Incremental Activation
Export only changed profiles to reduce platform costs (70-95% savings typical)

### 2. Data Transformation
Reformat phone numbers, hash emails, combine fields before export

### 3. Compliance Checking
Filter out GDPR/CCPA opt-outs before sending to platforms

### 4. Multi-Platform Export
Send same segment to multiple destinations (Braze + Google Ads + Meta)

### 5. Data Enrichment
Add calculated fields, scores, or lookups before export

## Required Parameters

All workflows automatically receive:
- `segment_id` - Segment identifier
- `activation_id` - Unique activation run ID
- `activation_output_database` - Database with activation data
- `activation_output_table` - Table with current profiles
- `profile_count` - Number of profiles

## Setup Checklist

- [ ] Create workflow with required parameter structure
- [ ] Implement your processing logic (incremental, transform, validate, etc.)
- [ ] Add export connector with authentication
- [ ] Set workflow permissions (View + Run for activation creators)
- [ ] Test workflow with manual activation
- [ ] Assign workflow to activation in Actions tab
- [ ] Monitor first scheduled run

## Examples Included

See `SKILL.md` for complete examples:
- Simple data transformation
- GDPR compliance filtering
- Multi-platform export
- Email validation
- Incremental/delta activation
- High-value customer filtering
- A/B test splitting
- Churn risk scoring

## Best Practices

✅ Always use provided activation parameters
✅ Include logging and error handling
✅ Clean up temporary tables
✅ Validate data before export
✅ Use parallel processing when possible
✅ Document your configuration
✅ Test with small segments first

## Support

- [Full Skill Documentation](./SKILL.md)
- [Activation Actions Docs](https://docs.treasuredata.com/products/customer-data-platform/audience-studio/activation/activation-actions)
- [Example Workflows](./examples/)
