# Real-Time Skills for Claude Code

This folder contains Claude Code skills for Treasure Data's real-time capabilities, including RT 2.0 (Real-Time Personalization) and digital marketing activations.

## Skills Overview

### RT 2.0 (Real-Time Personalization) Skills

RT 2.0 enables real-time personalization by configuring parent segments with event streams, creating personalization services that return real-time responses via API, and orchestrating event-triggered journeys.

#### [rt-config](./rt-config)
**Configure RT 2.0 for parent segments**

Configure real-time capabilities for parent segments including:
- Event table configuration (Kafka topics, event definitions, TTL settings)
- Key events (registration, purchase, page view)
- RT attributes (real-time computed values, aggregations)
- ID stitching (merge profiles based on event data)

Use this skill when setting up RT 2.0 infrastructure, configuring event processing, or managing real-time profile enrichment.

**Commands**: `tdx ps rt init`, `tdx ps rt validate`, `tdx ps push`

#### [rt-personalization](./rt-personalization)
**Create personalization services for real-time API responses**

Build personalization services that return real-time personalized data via API:
- Define input parameters and output fields
- Configure real-time logic and transformations
- Test with the test harness
- Deploy and monitor via API

Use this skill when building real-time recommendation engines, dynamic content APIs, or personalized response services.

**Commands**: `tdx ps pz init`, `tdx ps pz list`, `tdx ps push`

#### [rt-triggers](./rt-triggers)
**Create RT journeys with event-triggered activations**

Design and implement RT journeys (real-time triggers) that activate when specific events occur:
- Configure entry conditions (event filters)
- Set up real-time activations to external systems
- Define journey stages and transitions
- Monitor journey execution

Use this skill when orchestrating real-time marketing automation, event-driven workflows, or trigger-based activations.

**API-only**: RT journeys use the TD CDP API, not YAML workflows. For batch journeys, use the `tdx-skills/journey` skill.

**API endpoints**: Journey creation, stage management, activation configuration

### Activation & Identity Skills

#### [activations](./activations)
**Query activation logs for error monitoring**

Query the activations log table to monitor digital marketing activations:
- Check activation success/failure rates
- Identify error patterns and status codes
- Analyze activation volume by journey/stage
- View activation responses and troubleshoot issues

Use this skill when debugging activation failures, monitoring activation health, or analyzing activation trends.

**Database**: `cdp_audience_{parent_segment_id}_rt.activations`

#### [identity](./identity)
**Query identity change logs for profile updates**

Query the id change log table to track real-time profile changes:
- Monitor new profile creation
- Track profile merges and unifications
- View profile update history
- Analyze identity resolution patterns

Use this skill when investigating profile merge issues, tracking identity unification, or analyzing profile lifecycle.

**Database**: `cdp_audience_{parent_segment_id}_rt.id_change_log`

## Using RT Skills

### Installation

1. Register the TD skills marketplace:
   ```
   /plugin marketplace add https://github.com/treasure-data/td-skills
   ```

2. Install the realtime-skills plugin:
   ```
   /plugin install realtime-skills@td-skills
   ```

### Example Prompts

**RT Configuration:**
```
Use the rt-config skill to configure event tables for parent segment 394649
Use the rt-config skill to add a purchase key event
Use the rt-config skill to create an RT attribute for total spend
```

**RT Personalization:**
```
Use the rt-personalization skill to create a recommendation service
Use the rt-personalization skill to list all personalization services
Use the rt-personalization skill to test my personalization service
```

**RT Triggers:**
```
Use the rt-triggers skill to create a welcome email journey
Use the rt-triggers skill to configure an abandoned cart trigger
Use the rt-triggers skill to set up real-time activations
```

**Activations:**
```
Use the activations skill to check for errors in the last 24 hours for parent segment 394649
Use the activations skill to analyze activation volume by journey
```

**Identity:**
```
Use the identity skill to check recent profile merges for parent segment 394649
Use the identity skill to track new profile creation
```

## Prerequisites

### For RT 2.0 Skills (rt-config, rt-personalization, rt-triggers):
- `tdx` CLI installed and configured
- Appropriate TD CDP permissions for parent segment management
- Parent segment ID (numeric value like 394649)
- For API-based workflows: TD API key with CDP access

### For Activation/Identity Skills:
- TD MCP server configured (`@treasuredata/mcp-server`)
- API key with access to the RT databases
- Parent segment ID

## RT 2.0 Architecture

```
RT 2.0 Stack:
┌─────────────────────────────────────────┐
│  Event Streams (Kafka Topics)           │
│  ↓                                       │
│  RT Configuration (rt-config)            │
│  - Event tables, key events             │
│  - RT attributes, ID stitching          │
│  ↓                                       │
│  Real-Time Profile Processing            │
│  ↓                                       │
├─────────────────┬───────────────────────┤
│ RT Personalization  │  RT Journeys       │
│ (rt-personalization)│  (rt-triggers)     │
│ - API responses     │  - Event triggers  │
│ - Dynamic content   │  - Activations     │
└─────────────────┴───────────────────────┘
         ↓                      ↓
    Activation Logs         Identity Logs
    (activations skill)     (identity skill)
```

## Command Reference

### RT Configuration Commands
```bash
tdx ps pz init              # Initialize RT config YAML template
tdx ps rt validate          # Validate RT configuration
tdx ps push                 # Push RT config to parent segment
tdx ps view                 # View current RT configuration
```

### RT Personalization Commands
```bash
tdx ps pz init              # Initialize personalization service YAML
tdx ps pz list              # List all personalization services
tdx ps push                 # Push personalization service configuration
```

### Context Management
```bash
tdx ps use {parent_segment_id}  # Set parent segment context for subsequent commands
```

## Documentation

For comprehensive documentation on RT 2.0:
- RT Configuration: See `rt-config/SKILL.md`
- RT Personalization: See `rt-personalization/SKILL.md`
- RT Triggers: See `rt-triggers/SKILL.md`
- Activations: See `activations/SKILL.md`
- Identity: See `identity/SKILL.md`

## Support

For questions or issues:
- Open an issue in this repository
- Contact the CDP team
- Reference the [tdx documentation](https://tdx.treasuredata.com)
