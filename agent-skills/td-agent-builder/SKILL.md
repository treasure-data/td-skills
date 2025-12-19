---
name: td-agent-builder
description: Expert guidance for building, configuring, and deploying AI agents using TD Agent Builder format. Use this skill when users need help creating custom AI agents with knowledge bases, system prompts, structured outputs, and deployment configurations for Treasure Data Agent Foundry. Provides complete agent configuration structures in the required JSON format.
---

# TD Agent Builder - AI Agent Configuration Guide

This skill helps you build complete AI agent configurations in the TD Agent Foundry format. When a user requests an agent, you will generate all necessary configuration files including knowledge bases, system prompts, outputs, and deployment instructions.

## When to Use This Skill

Use this skill when users want to:
- Build a new AI agent for Treasure Data Agent Foundry
- Create agent knowledge bases with domain-specific content
- Design system prompts for specialized agents
- Configure structured outputs and JSON schemas
- Set up agent tools (agent calls, image generation, workflows)
- Generate complete agent configurations programmatically
- Deploy agents to TD Agent Foundry

## Agent Configuration Format

Every agent configuration consists of these core components:

### 1. Agent Config Object

```javascript
{
  // User Input
  "description": "Full description of what the agent does",
  "tone": "professional|friendly|empathetic|technical|enthusiastic",
  "language": "english|japanese|multilingual|portuguese|spanish|french|german|italian|korean|dutch",
  "audience": "Target user audience",

  // AI Generated
  "domain": "marketing|hr|support|sales|analytics|operations",
  "agentName": "Descriptive Agent Name (3-5 words)",

  // Project Configuration
  "projectName": "project_name_snake_case",
  "projectDescription": "Brief project description",

  // Model Configuration
  "model": "anthropic.claude-4.5-sonnet",  // See Model Selection Guide below
  "temperature": 0.5,  // 0.0-1.0
  "maxToolsIterations": 3,  // 0-10
  "systemPrompt": "Comprehensive system prompt...",
  "modelReasoning": "Explanation for model choice"
}
```

### 2. Knowledge Bases Array

```javascript
"knowledgeBases": [
  {
    "id": "kb-1",
    "name": "Knowledge Base Title",
    "content": "Detailed content up to 18,000 characters...",
    "type": "text",  // or "database"

    // Auto-generated tool config
    "customToolName": "kb_knowledge_base_title",
    "customToolDescription": "Search and retrieve information from this KB"
  }
]
```

### 3. Structured Outputs Array

```javascript
"outputs": [
  {
    "id": "output-1",
    "outputName": "output_name",
    "functionName": "generate_output_name",
    "functionDescription": "Description of what this output does",
    "outputType": "custom",  // or "artifact"
    "artifactType": "text",  // "text", "image", "react" (for artifact type)
    "jsonSchema": "{\"type\": \"object\", \"properties\": {...}}"
  }
]
```

### 4. Additional Tools Array (Optional)

```javascript
"additionalTools": [
  {
    "id": "tool-1",
    "type": "agent|image_generator|workflow",
    "functionName": "call_specialized_agent",
    "functionDescription": "What this tool does",
    "targetAgent": "Agent_Name",  // For agent type
    "imageFormat": "png|jpeg",  // For image_generator type
    "workflowArn": "arn:aws:bedrock:...",  // For workflow type
    "outputMode": "return|stream"
  }
]
```

## System Prompt Guidelines

System prompts must be comprehensive (400-1200 words, max 9000 characters) and include these sections:

### Required Sections

**1. IDENTITY & ROLE**
```
You are a [Role] at Treasure Data, specializing in [domain].
With expertise in [specific areas], you help [target users] with [primary objectives].
```

**2. CORE CAPABILITIES**
List 8-12 specific capabilities:
```
Your expertise includes:
- [Capability 1] with [specific detail]
- [Capability 2] focusing on [specific aspect]
- [Capability 3] including [examples]
...
```

**3. OPERATIONAL GUIDELINES**
```
When working with users:
- [Decision-making approach]
- [Prioritization method]
- [Quality standards]
- [Communication style]
```

**4. KNOWLEDGE BOUNDARIES**
```
You have deep knowledge of:
- [Primary domain]
- [Related areas]
- [Specific tools/platforms]

You reference information from:
- [Knowledge sources]
- [Best practices]
```

**5. INTERACTION PROTOCOLS**
```
Your approach:
1. [How you gather requirements]
2. [How you structure responses]
3. [How you handle follow-ups]
4. [How you clarify ambiguity]
```

**6. CONSTRAINTS & LIMITATIONS**
```
You will NOT:
- [Boundary 1]
- [Boundary 2]
- [Boundary 3]

You escalate when:
- [Situation 1]
- [Situation 2]
```

**7. OUTPUT QUALITY STANDARDS**
```
Your responses:
- [Specificity requirements]
- [Format preferences]
- [Evidence and data usage]
- [Tone and style]
```

**8. DOMAIN-SPECIFIC EXPERTISE**
Add domain-specific sections based on agent type (see Domain-Specific Guidelines below).

### Formatting Guidelines
- Use `\n\n` for section breaks
- Use `-` for bullet points
- Maximum 9000 characters (auto-truncated)
- Tone: Professional, confident, consultative, data-driven, actionable

## Model Selection Guide

Choose the appropriate model based on agent requirements:

| Model | Best For | When to Use |
|-------|----------|-------------|
| `anthropic.claude-4.5-sonnet` | **Recommended default** - Balanced creative + analytical | Marketing strategy, content creation, campaign planning, most use cases |
| `anthropic.claude-4-opus` | Complex reasoning, research | Deep analysis, multi-step reasoning, research synthesis |
| `anthropic.claude-4-sonnet` | Fast responses with reasoning | Customer support, FAQ bots, general assistants |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | High-volume, cost-sensitive | Simple Q&A, basic support, high-throughput tasks |
| `openai.gpt-4o` | Vision + text tasks | Image analysis, charts, visual content |
| `amazon.nova-pro-v1:0` | Long context (300K tokens) | Long documents, extensive knowledge bases |
| `mistral.mistral-large-2411-v1:0` | Multilingual | Strong multilingual support needed |

**Temperature Guidelines:**
- `0.0-0.3`: Precise, factual (data analysis, compliance)
- `0.3-0.5`: Balanced (default for most agents)
- `0.5-0.7`: Creative but consistent (marketing, content)
- `0.7-1.0`: Highly creative (brainstorming, ideation)

**Max Tools Iterations:**
- `0`: Simple Q&A, no refinement
- `2-3`: Standard agents (recommended)
- `5-7`: Data-intensive agents
- `8-10`: Highly complex multi-step agents

## Domain-Specific Guidelines

### Marketing Agents

**System Prompt Additions:**
```
Platform Expertise:
- Meta (Facebook/Instagram): Audience targeting, creative formats, objectives
- Google Ads: Search campaigns, Quality Score, bidding strategies
- TikTok: Native content, trend integration, creator partnerships
- Pinterest: Visual discovery, seasonal planning, shopping integration

Campaign Framework Knowledge:
- SOSTAC (Situation, Objectives, Strategy, Tactics, Actions, Control)
- RACE Planning (Reach, Act, Convert, Engage)
- Marketing funnel stages (TOFU/MOFU/BOFU)
- Customer journey mapping

Key Metrics Understanding:
- Performance: CTR, CPC, CPM, ROAS, CPA, conversion rate
- Brand: Awareness lift, reach, frequency, share of voice
- Engagement: Interaction rate, time on site, bounce rate

Best Practices:
- A/B testing methodologies
- Budget optimization strategies
- Attribution modeling
- Creative best practices by platform
```

**Knowledge Bases (4-5 recommended):**
1. Platform-specific best practices (Meta, Google, TikTok, Pinterest)
2. Campaign planning frameworks (SOSTAC, RACE, funnel models)
3. Industry benchmarks and KPIs
4. Creative guidelines and specifications
5. Budget allocation and optimization strategies

**Structured Outputs:**
```json
{
  "outputName": "campaign_plan",
  "functionName": "generate_campaign_plan",
  "functionDescription": "Generate comprehensive campaign strategy",
  "outputType": "custom",
  "jsonSchema": "{
    \"type\": \"object\",
    \"properties\": {
      \"campaign_name\": {\"type\": \"string\"},
      \"objectives\": {\"type\": \"array\", \"items\": {\"type\": \"string\"}},
      \"target_audience\": {\"type\": \"object\"},
      \"channel_strategy\": {\"type\": \"array\"},
      \"budget_allocation\": {\"type\": \"object\"},
      \"kpis\": {\"type\": \"array\"}
    }
  }"
}
```

### Customer Support Agents

**System Prompt Additions:**
```
Support Approach:
- Active listening and empathy
- Issue triage and prioritization
- Clear step-by-step guidance
- Escalation protocols

Product Knowledge:
- Feature documentation
- Common issues and solutions
- Troubleshooting workflows
- Account management procedures

Communication Style:
- Patient and friendly
- Clear and non-technical (unless needed)
- Solution-focused
- Proactive follow-up
```

**Knowledge Bases:**
1. Product documentation and features
2. FAQ and common issues
3. Troubleshooting guides
4. Escalation procedures

### HR/Onboarding Agents

**System Prompt Additions:**
```
Onboarding Expertise:
- Company policies and benefits
- Organizational structure
- Cultural integration
- Compliance and paperwork

Employee Support:
- Benefits enrollment guidance
- Time-off policies
- Performance review processes
- Career development resources

Communication Approach:
- Welcoming and supportive
- Confidential and professional
- Clear policy interpretation
- Resource navigation
```

### Data Analytics Agents

**System Prompt Additions:**
```
Analytical Capabilities:
- Data exploration and profiling
- Statistical analysis methods
- Visualization recommendations
- Insight generation

Technical Skills:
- SQL query construction
- Data modeling concepts
- Metric calculation formulas
- Dashboard design principles

Output Standards:
- Data-driven conclusions
- Statistical rigor
- Clear visualizations
- Actionable recommendations
```

## Complete Agent Generation Workflow

When a user requests an agent, follow this process:

### Step 1: Understand Requirements

Ask clarifying questions:
```
To build your agent, I need to understand:
1. What is the primary purpose? (e.g., "help marketers plan campaigns")
2. Who will use it? (e.g., "marketing managers and strategists")
3. What tone should it have? (professional, friendly, technical, etc.)
4. What specific capabilities are needed? (be specific)
5. What outputs should it generate? (reports, recommendations, etc.)
```

### Step 2: Generate Agent Configuration

Create the complete JSON structure:

```json
{
  "description": "[Full description based on user input]",
  "tone": "professional",
  "language": "english",
  "audience": "[Target users]",
  "domain": "[Detected domain]",
  "agentName": "[3-5 word descriptive name]",
  "projectName": "[snake_case_name]",
  "projectDescription": "[Brief description]",
  "model": "anthropic.claude-4.5-sonnet",
  "temperature": 0.5,
  "maxToolsIterations": 3,
  "modelReasoning": "[Why this model was chosen]",
  "systemPrompt": "[Comprehensive 400-1200 word prompt]",
  "knowledgeBases": [
    {
      "id": "kb-1",
      "name": "[KB Title]",
      "content": "[18,000 char max detailed content]",
      "type": "text",
      "customToolName": "[auto_generated_name]",
      "customToolDescription": "[Auto description]"
    }
  ],
  "outputs": [
    {
      "id": "output-1",
      "outputName": "[output_name]",
      "functionName": "[generate_function]",
      "functionDescription": "[What it does]",
      "outputType": "custom",
      "jsonSchema": "[Valid JSON schema string]"
    }
  ],
  "additionalTools": []
}
```

### Step 3: Generate Knowledge Base Content

For each knowledge base (create 4-5):
- **Maximum 18,000 characters per KB**
- **200-400 words per section recommended**
- **Include specific examples, formulas, benchmarks**
- **Structure with headers, bullet points, tables**

Example structure:
```markdown
# [Knowledge Base Title]

## Overview
[Brief introduction to topic]

## Key Concepts
- **Concept 1**: Definition and explanation
- **Concept 2**: Definition and explanation

## Frameworks/Methodologies
### [Framework Name]
- Component 1: Description
- Component 2: Description

## Best Practices
1. [Practice 1] - [Why it matters]
2. [Practice 2] - [Implementation details]

## Examples
[Specific, realistic examples with data]

## Common Patterns
[Patterns, formulas, calculations]

## References
[Benchmarks, standards, guidelines]
```

### Step 4: Create System Prompt

Write comprehensive prompt (400-1200 words) following the required sections above.

### Step 5: Define Structured Outputs

Create JSON schemas for any structured data outputs:

```json
{
  "outputName": "descriptive_name",
  "functionName": "generate_descriptive_name",
  "functionDescription": "Detailed description of what this output generates",
  "outputType": "custom",
  "jsonSchema": "{
    \"type\": \"object\",
    \"properties\": {
      \"field_name\": {\"type\": \"string\", \"description\": \"Field purpose\"},
      \"numeric_field\": {\"type\": \"number\"},
      \"array_field\": {\"type\": \"array\", \"items\": {\"type\": \"object\"}},
      \"nested_object\": {
        \"type\": \"object\",
        \"properties\": {
          \"sub_field\": {\"type\": \"string\"}
        }
      }
    },
    \"required\": [\"field_name\", \"numeric_field\"]
  }"
}
```

### Step 6: Generate Deployment Files

Create these files for the user:

**1. agent-config.json** - Complete agent configuration
**2. knowledge-base-1.md** - First knowledge base
**3. knowledge-base-2.md** - Second knowledge base
**4. knowledge-base-[n].md** - Additional knowledge bases
**5. deployment-guide.md** - Step-by-step deployment instructions

### Step 7: Provide Deployment Instructions

```markdown
# Deployment Guide

## Prerequisites
- Access to TD Agent Foundry console
- Project creation permissions

## Step 1: Create Project
1. Navigate to https://console.treasuredata.com/app/agents
2. Click "Create New Project"
3. Enter Project Name: `[projectName]`
4. Enter Description: `[projectDescription]`

## Step 2: Upload Knowledge Bases
1. In project settings, go to "Knowledge Bases"
2. Upload each `.md` file:
   - knowledge-base-1.md
   - knowledge-base-2.md
   - [etc.]

## Step 3: Configure Agent
1. Create new agent in project
2. Set Agent Name: `[agentName]`
3. Select Model: `[model]`
4. Set Temperature: `[temperature]`
5. Set Max Tool Iterations: `[maxToolsIterations]`
6. Paste System Prompt from agent-config.json

## Step 4: Add Structured Outputs (if any)
1. Go to "Outputs" section
2. For each output in agent-config.json:
   - Add new output
   - Set name and function
   - Paste JSON schema

## Step 5: Test Agent
1. Use built-in test interface
2. Try sample queries
3. Validate outputs match expectations

## Step 6: Deploy
1. Review all configuration
2. Click "Deploy"
3. Note the agent endpoint/ID
```

## Knowledge Base Content Guidelines

### Structure Best Practices

1. **Use Clear Hierarchy**
   - H1 for main title
   - H2 for major sections
   - H3 for subsections
   - Bullet points for lists
   - Tables for comparisons

2. **Include Specific Examples**
   ```markdown
   ## Budget Calculation Example

   **Scenario:** $100,000 campaign budget

   | Channel | Allocation | Rationale |
   |---------|------------|-----------|
   | Meta | $40,000 (40%) | Largest audience reach |
   | Google | $35,000 (35%) | High intent traffic |
   | TikTok | $25,000 (25%) | Gen Z targeting |
   ```

3. **Provide Formulas and Calculations**
   ```markdown
   ## Key Metrics

   - **ROI**: (Revenue - Cost) / Cost × 100
   - **ROAS**: Revenue / Ad Spend
   - **CPA**: Total Spend / Conversions
   ```

4. **Include Benchmarks**
   ```markdown
   ## Industry Benchmarks (E-commerce)

   - Average CTR: 1-2%
   - Target ROAS: 3-5x
   - Expected CPA: $20-$50
   ```

5. **Add Decision Frameworks**
   ```markdown
   ## When to Use Each Platform

   **Use Meta when:**
   - Need visual storytelling
   - Targeting specific demographics
   - Building brand awareness

   **Use Google when:**
   - Capturing search intent
   - Direct response campaigns
   - High-value conversions
   ```

## JSON Schema Guidelines

### Basic Schema Structure

```json
{
  "type": "object",
  "properties": {
    "string_field": {
      "type": "string",
      "description": "Description of this field"
    },
    "number_field": {
      "type": "number",
      "description": "Numeric value",
      "minimum": 0
    },
    "boolean_field": {
      "type": "boolean"
    },
    "array_field": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "object_field": {
      "type": "object",
      "properties": {
        "nested_field": {"type": "string"}
      }
    },
    "enum_field": {
      "type": "string",
      "enum": ["option1", "option2", "option3"]
    }
  },
  "required": ["string_field", "number_field"]
}
```

### Complex Schema Example

```json
{
  "type": "object",
  "properties": {
    "campaign_name": {"type": "string"},
    "budget": {"type": "number", "minimum": 0},
    "start_date": {"type": "string", "format": "date"},
    "channels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "platform": {"type": "string", "enum": ["meta", "google", "tiktok", "pinterest"]},
          "budget_allocation": {"type": "number"},
          "targeting": {
            "type": "object",
            "properties": {
              "demographics": {"type": "array"},
              "interests": {"type": "array"}
            }
          }
        },
        "required": ["platform", "budget_allocation"]
      }
    },
    "kpis": {
      "type": "object",
      "properties": {
        "primary": {"type": "array", "items": {"type": "string"}},
        "secondary": {"type": "array", "items": {"type": "string"}}
      }
    }
  },
  "required": ["campaign_name", "budget", "channels"]
}
```

## Example: Complete Marketing Agent

Here's a complete example for reference:

```json
{
  "description": "Campaign planning agent that helps marketers create comprehensive multi-channel strategies",
  "tone": "professional",
  "language": "english",
  "audience": "Marketing managers and campaign strategists",
  "domain": "marketing",
  "agentName": "Campaign Strategy Advisor",
  "projectName": "campaign_planning_agent",
  "projectDescription": "Multi-channel campaign planning and optimization assistant",
  "model": "anthropic.claude-4.5-sonnet",
  "temperature": 0.6,
  "maxToolsIterations": 3,
  "modelReasoning": "Claude 4.5 Sonnet provides the best balance of creative campaign strategy development and analytical rigor needed for data-driven recommendations.",
  "systemPrompt": "You are a Senior Campaign Strategist at Treasure Data...[full prompt]",
  "knowledgeBases": [
    {
      "id": "kb-1",
      "name": "Platform Best Practices",
      "content": "[Content about Meta, Google, TikTok, Pinterest]",
      "type": "text"
    },
    {
      "id": "kb-2",
      "name": "Campaign Planning Frameworks",
      "content": "[SOSTAC, RACE, funnel models]",
      "type": "text"
    }
  ],
  "outputs": [
    {
      "outputName": "campaign_plan",
      "functionName": "generate_campaign_plan",
      "functionDescription": "Generate a comprehensive campaign strategy",
      "outputType": "custom",
      "jsonSchema": "[Schema here]"
    }
  ]
}
```

## Common Patterns

### Pattern 1: Research/Analysis Agent
- **Model**: `anthropic.claude-4-opus`
- **Temperature**: `0.3`
- **Iterations**: `5-7`
- **Knowledge Bases**: Research methodologies, data sources, analysis frameworks

### Pattern 2: Creative/Marketing Agent
- **Model**: `anthropic.claude-4.5-sonnet`
- **Temperature**: `0.6`
- **Iterations**: `2-3`
- **Knowledge Bases**: Platform guides, creative frameworks, benchmarks

### Pattern 3: Support/FAQ Agent
- **Model**: `anthropic.claude-3-5-haiku-20241022-v1:0`
- **Temperature**: `0.3`
- **Iterations**: `0`
- **Knowledge Bases**: Product docs, FAQs, troubleshooting guides

### Pattern 4: Data Analytics Agent
- **Model**: `anthropic.claude-4-sonnet`
- **Temperature**: `0.4`
- **Iterations**: `3-5`
- **Knowledge Bases**: SQL patterns, metrics definitions, analysis frameworks

## Validation Checklist

Before finalizing agent configuration:

**Content Quality:**
- [ ] System prompt is 400-1200 words
- [ ] Each knowledge base has detailed, specific content
- [ ] Examples include realistic data
- [ ] Benchmarks and formulas are accurate

**Configuration:**
- [ ] Model selection matches use case
- [ ] Temperature appropriate for task type
- [ ] Max iterations suitable for complexity
- [ ] All required fields populated

**Structured Outputs:**
- [ ] JSON schemas are valid
- [ ] Required fields marked
- [ ] Field descriptions clear
- [ ] Nested objects properly structured

**Deployment:**
- [ ] All files generated
- [ ] Deployment guide complete
- [ ] Testing instructions provided

## Response Format

When a user requests an agent, provide:

1. **Summary of what you're creating**
2. **agent-config.json** - Full configuration
3. **knowledge-base-[n].md** - All knowledge bases
4. **deployment-guide.md** - Deployment instructions
5. **testing-prompts.md** - Sample queries for testing

Format as code blocks or downloadable files.

---

**Version:** 2.0.0
**Last Updated:** December 18, 2024
**Format:** TD Agent Foundry Compatible
