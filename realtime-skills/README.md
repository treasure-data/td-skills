# Treasure Data Real-Time Skills

Complete skill set for building RT 2.0 (Real-Time Personalization) solutions in Treasure Data.

## Overview

These skills guide Claude Code through the complete RT 2.0 setup workflow, from initial configuration to production deployment of personalization APIs and event-triggered journeys.

## Skill Categories

### Orchestrator Skills (End-to-End Workflows)

**Use these when starting from scratch:**

- **`rt-setup-personalization`** - Complete personalization setup
  - Validates parent segment RT status
  - Discovers events, attributes, and ID stitching keys
  - Configures RT infrastructure
  - Creates personalization service AND entity
  - Deploys to Console with API integration

- **`rt-setup-triggers`** - Complete journey/triggers setup
  - Same RT configuration as personalization
  - Creates RT journey with entry criteria
  - Configures activations (webhook, Salesforce, etc.)
  - Launches journey and enables event processing

### Component Skills (Modular Configuration)

**Use these for specific components:**

- **`rt-config`** - Initialize RT configuration
- **`rt-config-events`** - Configure event tables and key events
- **`rt-config-attributes`** - Define RT attributes
- **`rt-config-id-stitching`** - Set up profile merging
- **`rt-personalization`** - Create personalization service + entity
- **`rt-triggers`** - Create RT journeys
- **`rt-journey-activations`** - Configure activations
- **`rt-journey-monitor`** - Monitor journey execution
- **`activations`** - Query activation logs
- **`identity`** - Query identity change logs

## Workflow Comparison

### For Personalization (API Responses)

```
Orchestrator Approach (Recommended):
  /plugin use rt-setup-personalization
  → Asks questions, discovers data, configures RT, creates service + entity

Modular Approach:
  /plugin use rt-config
  /plugin use rt-config-events
  /plugin use rt-config-attributes
  /plugin use rt-config-id-stitching
  /plugin use rt-personalization
  → More control, step-by-step
```

### For Triggers (Event-Driven Activations)

```
Orchestrator Approach (Recommended):
  /plugin use rt-setup-triggers
  → Asks questions, discovers data, configures RT, creates journey + activation

Modular Approach:
  /plugin use rt-config
  /plugin use rt-config-events
  /plugin use rt-config-attributes
  /plugin use rt-config-id-stitching
  /plugin use rt-triggers
  /plugin use rt-journey-activations
  → More control, step-by-step
```

## Key Improvements in Updated Skills

### rt-setup-personalization Orchestrator

**New capabilities:**
1. **Parent Segment Validation** - Lists RT-enabled parent segments if user doesn't provide one
2. **Use Case Discovery** - Suggests relevant events/attributes based on use case
3. **Data Exploration** - Discovers event tables and PS attributes automatically
4. **Complete RT Config** - Ensures events, attributes, AND ID stitching are all configured
5. **Personalization Entity** - Creates the actual Personalization in Console (not just service)
6. **Payload Definition** - Properly configures entry criteria and response payload

**Critical fix:** Previous rt-personalization skill only created the service configuration (YAML). The updated orchestrator creates BOTH:
- Service configuration (via `tdx ps push`)
- Personalization entity (via API) - visible in Console UI

### rt-personalization Updated

**Step 2 added:** Create Personalization Entity
- Gets parent segment folder ID
- Retrieves key event and attribute IDs
- Builds attribute payload with proper `subAttributeIdentifier` for list attributes
- Creates entity via `/entities/realtime_personalizations` API
- Returns Console URL and API endpoint

**Now creates complete personalization setup, not just configuration.**

## Installation

### From GitHub

```bash
# Clone repository
git clone https://github.com/treasure-data/td-skills.git
cd td-skills/realtime-skills

# Use in Claude Code
/plugin marketplace add https://github.com/treasure-data/td-skills
/plugin install realtime-skills@td-skills
```

### Local Development

```bash
# From this directory
/plugin marketplace add file:///path/to/realtime-skills
/plugin install rt-setup-personalization
```

## Usage Examples

### Example 1: Complete Personalization Setup

```
User: "I want to create realtime personalization for product recommendations"

Claude (using rt-setup-personalization):
  1. Lists RT-enabled parent segments
  2. Asks for use case (Web Personalization)
  3. Discovers event tables (pageviews, product_views)
  4. Explores PS attributes (loyalty_tier, total_purchase_value)
  5. Suggests RT attributes (last_product_viewed, browsed_products_list)
  6. Configures ID stitching (td_client_id, email, canonical_id)
  7. Creates RT configuration via API
  8. Creates personalization service (YAML)
  9. Creates personalization entity (API) with payload
  10. Returns API endpoint and Console URL
```

### Example 2: Complete Triggers Setup

```
User: "Set up a welcome email trigger when users sign up"

Claude (using rt-setup-triggers):
  1. Lists RT-enabled parent segments
  2. Asks for use case (Welcome Journey)
  3. Discovers event tables (user_signups)
  4. Configures RT (same as personalization)
  5. Creates RT journey with "user_signup" trigger
  6. Creates SendGrid email activation
  7. Launches journey
  8. Returns Console URL and testing instructions
```

### Example 3: Update Existing RT Config

```
User: "Add a new event table to my RT configuration"

Claude (using rt-config-events):
  - Pulls existing RT config
  - Adds new event table
  - Creates key event
  - Updates configuration
```

## Architecture

```
Parent Segment
├── RT Configuration
│   ├── Event Tables (Kafka topics)
│   ├── Key Events (event definitions)
│   ├── RT Attributes (computed values)
│   └── ID Stitching (profile merging)
│
├── Personalization Entities
│   ├── Entry Criteria (key event trigger)
│   ├── Payload (attributes to return)
│   └── API Endpoint
│
└── RT Journeys
    ├── Entry Criteria (key event trigger)
    ├── Stages & Steps
    ├── Activations (webhook, email, CRM)
    └── Journey Execution
```

## Dependencies

### CLI Tools
- `tdx` - Treasure Data CLI (required)
- `curl` - HTTP requests (required)
- `jq` - JSON processing (required)

### TD Configuration
- Parent segment created
- RT 2.0 enabled by CSM
- Master API key with full permissions
- Streaming event data ingestion configured

## Best Practices

### When to Use Orchestrators

**Use `rt-setup-personalization` or `rt-setup-triggers` when:**
- Starting from scratch
- User doesn't know what events/attributes to use
- Need complete end-to-end setup
- Want guided workflow with recommendations

### When to Use Component Skills

**Use individual component skills when:**
- RT configuration already exists
- Need to update specific component (add event, attribute, etc.)
- Troubleshooting specific issue
- Advanced customization required

### Personalization vs. Triggers

**Use Personalization when:**
- Need real-time API responses
- Web/mobile app integration
- Return personalized content/recommendations
- Two-way communication (request → response)

**Use Triggers when:**
- Event-driven activations
- Send data to external systems
- Email, webhook, CRM updates
- One-way data push

**Can use both together** - Common pattern:
- Triggers: Send abandoned cart email
- Personalization: Return cart items in API

## Troubleshooting

### RT Not Enabled

```
Error: RT 2.0 is not enabled for this parent segment.
Solution: Contact your CSM to enable RT 2.0.
```

### No RT-Enabled Parent Segments

```
Error: No RT-enabled parent segments found.
Solution: Contact CSM to enable RT for at least one parent segment.
```

### Personalization Entity Not Created

```
Symptom: Service created but not visible in Console.
Cause: Only Step 1 (service) completed, Step 2 (entity) skipped.
Solution: Use updated rt-personalization skill or rt-setup-personalization orchestrator.
```

### Missing Attributes in RT Config

```
Symptom: Personalization API returns empty response.
Cause: RT attributes not configured or not processing events.
Solution:
  1. Verify RT status: tdx ps view <ps_id> --json | jq '.realtime_config.status'
  2. Check attributes exist: tdx api "/audiences/<ps_id>/realtime_attributes" --type cdp
  3. Verify events arriving: SELECT * FROM <event_table> ORDER BY time DESC LIMIT 10
```

## Contributing

Follow [CLAUDE.md](https://github.com/treasure-data/td-skills/blob/main/CLAUDE.md) guidelines:

- Keep SKILL.md under 500 lines
- Only include TD-specific information
- Use code examples over verbose explanations
- Test with `/plugin install` before submitting PR

## License

See repository LICENSE file.

## Support

- Documentation: https://docs.treasuredata.com/display/public/PD/RT+2.0
- Issues: https://github.com/treasure-data/td-skills/issues
- CSM: Contact your Treasure Data Customer Success Manager
