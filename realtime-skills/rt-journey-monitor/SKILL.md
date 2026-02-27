---
name: rt-journey-monitor
description: Monitor RT journeys - track activation success, debug failures, query activation logs, and optimize performance
---

# RT Journey Monitoring & Debugging

Monitor RT journey performance, track activation success, and debug failures.

## Prerequisites

- RT journeys created and enabled
- Activations configured

## Monitor Journeys

### List Journeys

```bash
# List all RT journeys for parent segment
tdx api "/entities/realtime_journeys?parent_segment_id=<parent_segment_id>" --type cdp

# View journey details
tdx api "/entities/realtime_journeys/<journey_id>" --type cdp

# Check journey status
tdx api "/entities/realtime_journeys/<journey_id>/status" --type cdp
```

### Journey Metrics (API)

```bash
# View activation logs
tdx api "/entities/realtime_journeys/<journey_id>/activations" --type cdp

# Check recent triggers
tdx api "/entities/realtime_journeys/<journey_id>/triggers?limit=100" --type cdp

# View errors
tdx api "/entities/realtime_journeys/<journey_id>/errors" --type cdp
```

## Activation Logs Table

Query activation logs directly:

```sql
select
  time,
  delivered,
  status,
  activation_name,
  journey_name,
  error,
  response
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and journey_name = 'welcome_new_users'
order by time desc
limit 100
```

### Activation Log Schema

| Column | Type | Description |
|--------|------|-------------|
| time | int | Event timestamp (epoch) |
| delivered | string | "true" or "false" |
| status | long | HTTP status code (200, 404, 500, etc.) |
| timestamp | long | Processing timestamp |
| activation_type | string | webhook, salesforce, email |
| log_time | long | Log entry timestamp |
| journey_name | string | Journey identifier |
| journey_stage_name | string | Stage name (if applicable) |
| activation_name | string | Activation name |
| rid | string | Request ID |
| error | string | Error message (if failed) |
| activation_id | string | Unique activation ID |
| event_id | string | Event that triggered activation |
| response | string | Response from destination system |

## Monitor Activation Success

### Success Rate

```sql
select
  journey_name,
  count(*) as total_activations,
  count(case when delivered = 'true' then 1 end) as successful,
  count(case when delivered = 'false' then 1 end) as failed,
  round(100.0 * count(case when delivered = 'true' then 1 end) / count(*), 2) as success_rate_pct
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
group by journey_name
order by total_activations desc
```

### Activation Volume

```sql
select
  td_time_string(time, 'yyyy-MM-dd HH:00:00') as hour,
  count(*) as activation_count,
  count(case when delivered = 'true' then 1 end) as successful,
  count(case when delivered = 'false' then 1 end) as failed
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and journey_name = 'abandoned_cart'
group by td_time_string(time, 'yyyy-MM-dd HH:00:00')
order by hour
```

### Status Code Distribution

```sql
select
  status,
  count(*) as count,
  round(100.0 * count(*) / sum(count(*)) over (), 2) as percentage
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and journey_name = 'welcome_new_users'
group by status
order by count desc
```

## Debug Failures

### Error Analysis

```sql
select
  error,
  status,
  count(*) as error_count,
  max(time) as last_occurrence
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and delivered = 'false'
group by error, status
order by error_count desc
limit 20
```

### Failed Activation Details

```sql
select
  td_time_string(time, 'yyyy-MM-dd HH:mm:ss') as timestamp,
  activation_name,
  error,
  status,
  response,
  event_id
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1h')
  and delivered = 'false'
  and journey_name = 'cart_recovery'
order by time desc
limit 50
```

### Webhook Response Inspection

```sql
select
  td_time_string(time, 'yyyy-MM-dd HH:mm:ss') as timestamp,
  status,
  response,
  error
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1h')
  and activation_type = 'td_webhook_out'
  and journey_name = 'product_recommendations'
order by time desc
limit 20
```

## Common Issues & Solutions

### Webhook Timeouts

```sql
-- Find timeout errors
select
  count(*) as timeout_count,
  activation_name
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and error like '%timeout%'
group by activation_name
```

**Solution**: Increase webhook timeout_ms or optimize endpoint response time

### Authentication Failures

```sql
-- Find auth errors
select
  error,
  count(*) as count
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and (status = 401 or status = 403)
group by error
```

**Solution**: Verify API keys and credentials in secrets

### Rate Limiting

```sql
-- Find rate limit errors
select
  td_time_string(time, 'yyyy-MM-dd HH:mm:ss') as timestamp,
  count(*) as count
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1h')
  and status = 429
group by td_time_string(time, 'yyyy-MM-dd HH:mm:ss')
order by timestamp
```

**Solution**: Reduce activation frequency or increase rate limits with destination

### Invalid Payload

```sql
-- Find validation errors
select
  error,
  response,
  count(*) as count
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and status = 400
group by error, response
order by count desc
```

**Solution**: Verify payload template matches destination API requirements

## Performance Monitoring

### Activation Latency

Track time from event to activation:

```sql
select
  journey_name,
  avg(timestamp - time) as avg_latency_seconds,
  min(timestamp - time) as min_latency_seconds,
  max(timestamp - time) as max_latency_seconds
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1h')
group by journey_name
```

### Activation Volume Trends

```sql
select
  td_time_string(time, 'yyyy-MM-dd') as date,
  journey_name,
  count(*) as daily_activations
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-7d')
group by td_time_string(time, 'yyyy-MM-dd'), journey_name
order by date, journey_name
```

## Debugging Commands

```bash
# Check RT status
tdx ps view <parent_segment_id> --json | jq '.realtime_config.status'

# Verify key event exists
tdx api "/audiences/<parent_segment_id>/realtime_key_events" --type cdp | jq '.[]'

# Test webhook manually
curl -X POST "https://your-webhook.com/endpoint" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "test": "payload",
    "user_id": "test_123"
  }'

# Check journey is enabled
tdx api "/entities/realtime_journeys/<journey_id>" --type cdp | jq '.enabled'

# View journey configuration
tdx api "/entities/realtime_journeys/<journey_id>" --type cdp | jq '.activations'
```

## Activation Success Checklist

✅ **Journey enabled**: Check journey status is "enabled"
✅ **RT status OK**: Verify RT config status is "ok"
✅ **Events flowing**: Confirm events are being ingested
✅ **Key event configured**: Verify key event exists
✅ **Webhook accessible**: Test webhook endpoint responds
✅ **Credentials valid**: Check API keys/secrets are current
✅ **Payload valid**: Verify payload matches destination format
✅ **No rate limits**: Check destination rate limits not exceeded

## Alert Queries

Set up monitoring alerts:

### High Error Rate

```sql
-- Alert if error rate > 10%
select
  journey_name,
  count(*) as total,
  count(case when delivered = 'false' then 1 end) as failed,
  round(100.0 * count(case when delivered = 'false' then 1 end) / count(*), 2) as error_rate
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-15m')
group by journey_name
having error_rate > 10
```

### No Recent Activations

```sql
-- Alert if no activations in last hour
select
  'welcome_journey' as journey_name,
  max(time) as last_activation_time,
  td_time_format(max(time), 'yyyy-MM-dd HH:mm:ss', 'UTC') as last_activation
from cdp_audience_<parent_segment_id>_rt.activations
where journey_name = 'welcome_journey'
  and td_interval(time, '-24h')
having max(time) < td_time_add(td_scheduled_time(), '-1h')
```

### Specific Error Spike

```sql
-- Alert if specific error occurs frequently
select
  error,
  count(*) as count
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-15m')
  and delivered = 'false'
group by error
having count > 10
```

## Performance Optimization

### Reduce Activation Volume

```sql
-- Find high-volume journeys
select
  journey_name,
  count(*) as activation_count,
  count(distinct event_id) as unique_events
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
group by journey_name
order by activation_count desc
```

**Optimization**: Add filters to reduce trigger frequency

### Identify Slow Activations

```sql
-- Find slowest activations
select
  journey_name,
  activation_name,
  avg(timestamp - time) as avg_latency_sec
from cdp_audience_<parent_segment_id>_rt.activations
where td_interval(time, '-1d')
  and delivered = 'true'
group by journey_name, activation_name
having avg_latency_sec > 60
order by avg_latency_sec desc
```

**Optimization**: Optimize webhook endpoint or use async processing

## Best Practices

### Monitoring
- **Regular checks**: Review activation logs daily
- **Alert setup**: Configure alerts for error rates
- **Trend analysis**: Track activation volume trends
- **Response inspection**: Review webhook responses

### Debugging
- **Recent errors first**: Start with last hour of failures
- **Group by error**: Identify common failure patterns
- **Check destination**: Verify destination system health
- **Test manually**: Test webhooks outside TD first

### Maintenance
- **Rotate secrets**: Update API keys regularly
- **Clean up**: Disable unused journeys
- **Optimize filters**: Refine event filters to reduce volume
- **Document issues**: Keep log of common problems

## Tools & Dashboards

Consider creating:
- **Success rate dashboard**: Real-time activation success metrics
- **Error alerting**: Slack/email alerts for failures
- **Volume monitoring**: Track activation trends
- **Latency tracking**: Monitor end-to-end latency

## Next Steps

After monitoring setup:
- **Optimize**: Refine filters and targeting
- **Scale**: Adjust as volume grows
- **Document**: Document common issues and solutions

## Resources

- [Activation Logs Documentation](https://docs.treasuredata.com/display/public/PD/Activation+Logs)
- [Monitoring Best Practices](https://docs.treasuredata.com/display/public/PD/Monitoring+Guide)
- [Troubleshooting Guide](https://docs.treasuredata.com/display/public/PD/RT+Troubleshooting)
