# Foundry Segment Output Tool

Add `:segment:` output capability to Foundry agents with a single command.

## Overview

This tool automates the process of adding segment generation capabilities to Foundry agents. It configures agents to output structured segment definitions that can be reviewed and saved in Treasure Data's Audience Studio Segment Editor.

## What is `:segment:` Output?

The `:segment:` output is a special output type in Treasure Data Foundry that:
- Generates segment rule drafts based on natural language conversations
- Allows users to review and refine segment definitions before saving
- Integrates with Audience Studio's Segment Editor
- Supports complex conditions including attribute filters, behavioral analysis, and segment references

## Prerequisites

Before using this tool, ensure you have:

- ✅ **tdx** CLI installed and authenticated (`tdx --version`)
- ✅ **yq** installed for YAML processing (`brew install yq`)
- ✅ **jq** installed for JSON processing (`brew install jq`)
- ✅ Authenticated with Treasure Data (`tdx auth status`)
- ✅ An existing Foundry project and agent

### Installing Dependencies (macOS)

```bash
# Install yq and jq via Homebrew
brew install yq jq

# Verify tdx is authenticated
tdx auth status
```

## Usage

### Basic Usage

```bash
./tdx-add-segment-output.sh "<project-name>" "<agent-name>"
```

### Example

```bash
./tdx-add-segment-output.sh "My Audience Project" "audience-agent"
```

**Output:**
```
ℹ  Checking tdx authentication...
ℹ  Pulling agent configuration from 'My Audience Project'...
✅ Pulled 1 agent(s) from 'My Audience Project'
ℹ  Adding :segment: output to audience-agent...
✅ :segment: output added to agents/My Audience Project/audience-agent/agent.yml
ℹ  Pushing updated configuration to Foundry...
✅ Pushed 1 resource(s) to 'My Audience Project'
✅ Successfully added :segment: output to audience-agent

ℹ  Next steps:
  1. Open Treasure Studio or Foundry Console
  2. Navigate to project: My Audience Project
  3. Open agent: audience-agent
  4. Verify the :segment: output in the Outputs tab
  5. Test by asking the agent to create a segment
```

## What the Tool Does

1. **Pulls** the agent configuration from Foundry using `tdx agent pull`
2. **Modifies** the `agent.yml` file to add the `:segment:` output definition
3. **Includes** the complete JSON Schema for segment structure validation
4. **Pushes** the updated configuration back to Foundry using `tdx agent push`

## Installation (Optional)

To make the command available globally:

```bash
# Navigate to the tool directory
cd /path/to/td-skills/foundry-tools/segment-output

# Make it executable (if not already)
chmod +x tdx-add-segment-output.sh

# Create a symbolic link in your PATH
sudo ln -s $(pwd)/tdx-add-segment-output.sh /usr/local/bin/tdx-add-segment-output

# Now you can run from anywhere:
tdx-add-segment-output "My Project" "my-agent"
```

## Segment Output Schema

The tool configures agents to output segment definitions with the following structure:

### Required Fields
- `title`: Segment name
- `summary`: Segment description

### Optional Fields
- `logic`: `"ALL"` (AND) or `"ANY"` (OR) for combining conditions
- `baseSegmentIds`: Reference and combine existing segments
- `conditions`: Array of attribute or behavioral conditions

### Example Output

```json
{
  "title": "High Value US Customers",
  "summary": "Customers in the US with lifetime value greater than $1000",
  "logic": "ALL",
  "conditions": [
    {
      "left_value": "country",
      "operator": "=",
      "right_value": "US",
      "reason": "Filter for US customers"
    },
    {
      "left_value": "ltv",
      "operator": ">",
      "right_value": 1000,
      "reason": "High lifetime value threshold"
    }
  ]
}
```

## Use Cases

### Audience Agent
Enable conversational segment creation:
```
User: "Create a segment for customers who purchased in the last 30 days"
Agent: [Generates segment definition using :segment: output]
User: [Reviews and saves in Segment Editor]
```

### Marketing Agents
Generate segments based on campaign requirements:
```
User: "I need a segment for users interested in sports equipment"
Agent: [Analyzes behavior and creates segment definition]
```

## Troubleshooting

### Error: "yq command not found"
**Solution:** Install yq with `brew install yq`

### Error: "Not authenticated with tdx"
**Solution:** Run `tdx auth login`

### Error: "Agent configuration not found"
**Solution:** Check that the project and agent names are correct. Use `tdx agent list` to see available agents.

### Warning: ":segment: output already exists"
The tool detects if the output already exists and asks for confirmation before overwriting.

## Comparison with Other Tools

| Tool | Purpose | Use Case |
|------|---------|----------|
| `tdx sg` | Create segments directly via CLI | Developer automation, batch operations |
| `:segment:` output | Generate segment drafts via agent conversation | Business users, natural language interaction |
| This tool | Add `:segment:` capability to agents | One-time agent configuration |

## Files Included

- `tdx-add-segment-output.sh` - Main script
- `segment_output.schema.json` - Complete JSON Schema for segment structure
- `README.md` - This file

## Support

For issues or questions:
- Check the [td-skills repository](https://github.com/treasure-data/td-skills)
- Contact the Data Engineering team

---

**Version:** 1.0
**Last Updated:** 2026-03-16
