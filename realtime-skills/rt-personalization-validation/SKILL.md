---
name: rt-personalization-validation
description: Validates RT Personalization Entity payloads before creation to prevent common API errors. Use when encountering "Attribute payload can't be blank" or other personalization creation errors, or when reviewing personalization entity JSON before API calls.
---

# RT Personalization Entity Validation

Validates personalization entity payloads and provides error-free templates.

## Critical Validation Rules

### Rule #1: Empty Arrays Cause Errors

**The #1 cause of "Attribute payload can't be blank" errors:**

```json
// ❌ FAILS - Empty arrays trigger validation errors
"stringBuilder": []
"attributePayload": []

// ✅ WORKS - Use null instead
"stringBuilder": null
"attributePayload": null
```

| Value | Result |
|-------|--------|
| `null` or omitted | ✅ OK - skips validation |
| `[]` (empty array) | ❌ ERROR - "can't be blank" |

### Rule #2: At Least One Payload Required

**Section definition must include at least ONE of:**
- `attributePayload` (with content)
- `stringBuilder` (with content)
- `catalogPayload` (with content, feature-flagged)

**All three cannot be null/empty simultaneously.**

### Rule #3: Misleading Error Messages

The API reports errors incorrectly:

```
Error: "sections[0].payload.node_id.definition.attribute_payload": ["Attribute payload can't be blank"]
```

**Actual cause:** `stringBuilder: []` (empty array)
**Reported cause:** `attribute_payload` (misleading)

**Always check stringBuilder first when seeing "can't be blank" errors.**

---

## Field Validation Rules

### attributePayload

| Field | Validation |
|-------|-----------|
| `outputName` | Required, max 256 chars, unique across all payload types |
| `realtimeAttributeId` | Required, must exist in CDP cache |
| `subAttributeIdentifier` | Required for ListAttribute/SlidingCounterAttribute only |

**subAttributeIdentifier rules:**
- `ListAttribute` → must match aggregation identifier
- `SlidingCounterAttribute` → must match sub_duration identifier
- SingleAttribute/CounterAttribute → must be absent

### stringBuilder

| Field | Validation |
|-------|-----------|
| `outputName` | Required, max 256 chars, unique |
| `values` | Required array of `{type: "String", value: "..."}` |
| `values` | Cannot contain `{{` or `}}` (template brackets forbidden) |

### segmentPayload

```json
{
  "segmentPayload": {
    "batchSegments": [
      {"id": "segment_id_1"},
      {"id": "segment_id_2"}
    ]
  }
}
```

- `batchSegments` required array
- Each `id` required and unique

### catalogPayload (Feature-Flagged)

| Field | Validation |
|-------|-----------|
| `catalogName` | Required |
| `lookupAttributeId` | Required, must be SingleAttribute or ListAttribute |
| `lookupColumn` | Required |
| `outputName` | Required, max 256 chars, unique |

**Unsupported attribute types:** ImportedAttribute, CounterAttribute
**Error:** `unsupported_attribute_type_for_lookup_catalog`

---

## Common Errors & Solutions

| Error Message | Root Cause | Solution |
|--------------|-----------|----------|
| `attribute_payload: can't be blank` | `stringBuilder: []` or `attributePayload: []` | Change `[]` to `null` |
| `sub_attribute_identifier: invalid_attribute` | Missing for ListAttribute or wrong identifier | Add correct aggregation identifier |
| `output_name: duplicated` | Same name in multiple payloads | Use unique names across all payload types |
| `unsupported_attribute_type_for_lookup_catalog` | Counter/Imported in catalog lookup | Use SingleAttribute or ListAttribute |
| `personalization_invalid_string_builder` | `{{` or `}}` in string values | Remove template brackets |
| `Name has already been taken` | Duplicate personalization name | Use unique name or update existing |

---

## Error-Free Templates

### Template 1: Minimal Valid Entity

```json
{
  "attributes": {
    "audienceId": "PARENT_SEGMENT_ID",
    "name": "personalization_name",
    "description": "Description of use case",
    "sections": [{
      "name": "section_name",
      "entryCriteria": {
        "name": "trigger_name",
        "keyEventCriteria": {
          "keyEventId": "KEY_EVENT_ID",
          "keyEventFilters": null
        }
      },
      "payload": {
        "UNIQUE_NODE_ID": {
          "type": "ResponseNode",
          "name": "response_name",
          "definition": {
            "attributePayload": [{
              "realtimeAttributeId": "RT_ATTR_ID",
              "outputName": "output_name"
            }],
            "segmentPayload": null,
            "stringBuilder": null
          }
        }
      },
      "includeSensitive": false
    }]
  },
  "relationships": {
    "parentFolder": {
      "data": {
        "id": "FOLDER_ID",
        "type": "folder-segment"
      }
    }
  }
}
```

### Template 2: With String Builder

```json
{
  "attributes": {
    "audienceId": "PARENT_SEGMENT_ID",
    "name": "personalization_with_message",
    "description": "Personalization with welcome message",
    "sections": [{
      "name": "all_visitors",
      "entryCriteria": {
        "name": "pageview",
        "keyEventCriteria": {
          "keyEventId": "KEY_EVENT_ID",
          "keyEventFilters": null
        }
      },
      "payload": {
        "UNIQUE_NODE_ID": {
          "type": "ResponseNode",
          "name": "visitor_data",
          "definition": {
            "attributePayload": [
              {"realtimeAttributeId": "RT_ATTR_1", "outputName": "last_product"},
              {"realtimeAttributeId": "RT_ATTR_2", "outputName": "page_views"}
            ],
            "segmentPayload": null,
            "stringBuilder": [{
              "values": [{"value": "Welcome to our website!", "type": "String"}],
              "outputName": "welcome_message"
            }]
          }
        }
      },
      "includeSensitive": false
    }]
  },
  "relationships": {
    "parentFolder": {
      "data": {"id": "FOLDER_ID", "type": "folder-segment"}
    }
  }
}
```

### Template 3: List Attribute with subAttributeIdentifier

```json
{
  "definition": {
    "attributePayload": [
      {
        "realtimeAttributeId": "LIST_ATTR_ID",
        "subAttributeIdentifier": "items",
        "outputName": "browsed_items"
      },
      {
        "realtimeAttributeId": "SINGLE_ATTR_ID",
        "outputName": "last_item"
      }
    ],
    "segmentPayload": null,
    "stringBuilder": null
  }
}
```

---

## Bash Validation Function

```bash
validate_personalization_payload() {
  local payload_json="$1"

  # Check for empty arrays (common mistake)
  if echo "$payload_json" | grep -q '"stringBuilder":\s*\[\s*\]'; then
    echo "❌ ERROR: stringBuilder is empty array. Change to null."
    return 1
  fi

  if echo "$payload_json" | grep -q '"attributePayload":\s*\[\s*\]'; then
    echo "❌ ERROR: attributePayload is empty array. Change to null."
    return 1
  fi

  # Check for template brackets in stringBuilder values
  if echo "$payload_json" | grep -q '{{.*}}'; then
    echo "❌ ERROR: stringBuilder values cannot contain {{ or }}"
    return 1
  fi

  # Verify at least one payload type has content
  local has_attrs=$(echo "$payload_json" | jq '.attributes.sections[0].payload | .. | .attributePayload? | select(. != null and . != []) | length')
  local has_strings=$(echo "$payload_json" | jq '.attributes.sections[0].payload | .. | .stringBuilder? | select(. != null and . != []) | length')

  if [ -z "$has_attrs" ] && [ -z "$has_strings" ]; then
    echo "❌ ERROR: Must include at least one: attributePayload or stringBuilder with content"
    return 1
  fi

  echo "✅ Payload validation passed"
  return 0
}

# Usage:
# validate_personalization_payload "$PAYLOAD_JSON" || exit 1
```

---

## Pre-Creation Checklist

Before creating a personalization entity:

- [ ] Payload node ID is unique (use `uuidgen | tr -d '-' | tr '[:upper:]' '[:lower:]'`)
- [ ] All optional arrays use `null` not `[]`
- [ ] At least one of attributePayload/stringBuilder has content
- [ ] All `outputName` fields are unique across the section
- [ ] `realtimeAttributeId` values exist in CDP
- [ ] ListAttributes include correct `subAttributeIdentifier`
- [ ] No `{{` or `}}` in stringBuilder values
- [ ] Field names use camelCase (not snake_case)

---

## Quick Fix Guide

### If you see: "Attribute payload can't be blank"

1. **Check stringBuilder first:**
   ```bash
   # Find the problem
   echo "$PAYLOAD" | grep -o '"stringBuilder":\s*\[.*\]'

   # If empty [], change to null
   PAYLOAD=$(echo "$PAYLOAD" | sed 's/"stringBuilder":\s*\[\]/"stringBuilder": null/g')
   ```

2. **Check attributePayload:**
   ```bash
   # If empty [], change to null
   PAYLOAD=$(echo "$PAYLOAD" | sed 's/"attributePayload":\s*\[\]/"attributePayload": null/g')
   ```

3. **Verify at least one has content:**
   - If both are null, add at least one RT attribute OR one string builder value

### If you see: "Name has already been taken"

```bash
# List existing personalizations
tdx api "/entities/realtime_personalizations?filter[audience_id]=<ps_id>" --type cdp | jq '.data[] | {id, name}'

# Either use a different name or update the existing entity
```

---

## Production-Tested Examples

These examples successfully created personalization entities in production:

### Example 1: EV Ecommerce (Entity ID: 310)
- Parent Segment: 1069935
- Key Event: 806 (pageview)
- Attributes: 7 RT attributes
- stringBuilder: Welcome message
- **Success:** Created without errors

### Example 2: ACME Web Personalization (Entity ID: 312)
- Parent Segment: 1053580
- Key Event: 815 (pageview)
- Attributes: 3 RT attributes
- stringBuilder: Welcome message
- **Success:** Created without errors

**Common pattern:** Both include populated stringBuilder (not empty array)

---

## References

- OpenAPI Spec: Payload structure is undefined (object/null only)
- Frontend: Uses `crypto.randomUUID()` for payload node IDs
- Validation: Server-side validation is strict but error messages are misleading
