# Step 0: Prerequisite - Realtime Application & Reactor Instance

**Audience:** TD internal admins only  
**Duration:** Completed before customer setup begins

## Overview

Before any customer-side configuration, the TD account must have a working Realtime application with a Reactor instance provisioned for the target parent segment.

This step is performed by **TD internal admins** and is a prerequisite for all subsequent steps.

## What is a Reactor Instance?

A Reactor instance is the backend infrastructure that processes real-time events and serves personalization API responses. Each parent segment requires its own Reactor instance to enable RT 2.0 functionality.

## Setup Process (TD Internal Only)

### 1. Enable Realtime Feature Flags

Enable RT 2.0 feature flags for the customer account in the internal admin panel.

### 2. Create Reactor Instance

In **API Admin / Provisioner**:

1. Navigate to the Reactor provisioning section
2. Create a new Reactor instance for the target **parent segment ID**
3. Submit the deployment job
4. Wait for the deployment job to complete (typically 10-30 minutes)

### 3. Verify Reactor Status

Check that the Reactor instance is running and healthy:

```bash
# Internal admin command (example)
tdx-admin reactor status --parent-segment <ps_id>
```

Expected output:
```
Status: RUNNING
Health: OK
Endpoint: https://<region>.p13n.in.treasuredata.com
```

## Verification Checklist

Before proceeding to customer-side configuration, verify:

- [ ] RT 2.0 feature flags enabled for the account
- [ ] Reactor instance created for the parent segment
- [ ] Deployment job completed successfully
- [ ] Reactor status is RUNNING
- [ ] Personalization API endpoint is accessible

## What Happens Next?

Once the Reactor instance is provisioned, customers can proceed with:

- [Step 1: Configure Realtime in Data Workbench](01-configure-realtime.md)

## Troubleshooting

**Deployment job fails:**
- Check parent segment ID is correct
- Verify account has RT 2.0 entitlement
- Check internal deployment logs for specific errors

**Reactor status shows UNHEALTHY:**
- Wait 5-10 minutes for initialization to complete
- Check resource allocation (CPU/memory limits)
- Contact platform engineering team if issue persists

## Internal Documentation

For detailed Reactor provisioning procedures, see:
- Internal runbook: "How to setup an end-to-end realtime application"
- API Admin documentation: [Internal link]

---

**Next:** [Step 1: Configure Realtime in Data Workbench](01-configure-realtime.md)
