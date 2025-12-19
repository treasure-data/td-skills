---
name: td-agent-builder
description: Expert guidance for building, configuring, and deploying AI agents using the TD Agent Builder wizard interface. Use this skill when users need help creating custom AI agents with knowledge bases, system prompts, structured outputs, and deployment configurations for Treasure Data Agent Foundry.
---

# TD Agent Builder - AI-Powered Agent Configuration Wizard

A comprehensive wizard interface for building custom AI agents with auto-generation capabilities, knowledge base management, and seamless deployment to Treasure Data Agent Foundry.

## When to Use This Skill

Use this skill when:
- Building a new AI agent for Treasure Data Agent Foundry
- Configuring agent knowledge bases, system prompts, or structured outputs
- Troubleshooting agent generation or deployment issues
- Understanding how to use the auto-generation features
- Debugging Test Agent functionality or formatting issues
- Navigating the wizard interface or making manual edits
- Deploying agents to TD Agent Foundry
- Creating agents for specific domains (marketing, analytics, customer service, etc.)
- Setting up agent testing and validation workflows
- Managing agent versioning and iteration cycles

## Context-Aware Assistance

When helping users:
- Validate wizard step completion and required fields
- Confirm API connection is active (green indicator)
- Reference specific steps by name and number
- Include validation checkpoints and troubleshooting

## Core Principles

### 1. AI-First Workflow

The TD Agent Builder is designed around an AI-first approach where you describe what you want and the system generates everything automatically.

**Workflow:**
1. **Describe** - Tell the wizard what your agent should do
2. **Generate** - AI creates knowledge bases, system prompt, and configuration
3. **Review** - Navigate through steps to review and edit generated content
4. **Deploy** - Download files and deploy to TD Agent Foundry

**Example Description:**
```text
I want to build a campaign planning agent that helps marketers with:
- Creating comprehensive marketing campaign strategies
- Planning multi-channel campaigns (Meta, Google, TikTok, Pinterest)
- Optimizing campaign performance and budget allocation
- Analyzing campaign metrics and generating reports
```

### 2. Step-Based Configuration

The wizard consists of 8 steps, each focusing on a specific aspect of agent configuration:

| Step | Name | Purpose | Required |
|------|------|---------|----------|
| 0 | Describe | AI-powered agent description and auto-generation | Yes |
| 1 | Knowledge | Review and edit knowledge bases | Yes |
| 2 | Project | Configure project metadata | Yes |
| 3 | Agent | Set agent name, model, temperature, system prompt | Yes |
| 4 | Tools | Add additional tools (optional) | No |
| 5 | Outputs | Define structured outputs | No |
| 6 | Variables | Configure prompt variables | No |
| 7 | Deploy | Review summary and download files | Yes |

### 3. Clickable Navigation

All step indicators are clickable, allowing users to:
- Jump directly to any previous step to make edits
- Navigate freely backward without validation
- Move forward only if current step is valid
- Make manual edits from the Deploy page easily

**Visual Feedback:**
- Hover effect lifts steps slightly
- Cursor changes to pointer for clickable steps
- Active step remains non-interactive
- Completed steps show checkmark icon

## Common Patterns

### Pattern 1: Auto-Generate Complete Agent

```yaml
# Step 0: Provide detailed description
description: |
  Build a budget optimization agent for digital marketing campaigns.
  Target audience: Marketing managers and campaign strategists
  Tone: Professional and data-driven

  Capabilities:
  - Analyze campaign performance across Meta, Google, TikTok
  - Calculate ROI, ROAS, CPA, CPL metrics
  - Provide budget reallocation recommendations
  - Model different budget scenarios
  - Generate performance visualizations

# Click "Auto-Generate Agent" button
# AI generates:
# - 3-5 knowledge bases with domain expertise
# - Optimized system prompt
# - Model configuration (Claude 3.5 Sonnet)
# - Structured outputs for recommendations
# - Project metadata
```

**Result:** A complete agent configuration ready for review and deployment.

### Pattern 2: Manual Knowledge Base Editing

Navigate to Step 1 (Knowledge) to review and edit generated knowledge bases:

```markdown
# Knowledge Base: Campaign Analysis Framework

## Performance Metrics
- **ROI (Return on Investment)**: (Revenue - Cost) / Cost × 100
- **ROAS (Return on Ad Spend)**: Revenue / Ad Spend
- **CPA (Cost Per Acquisition)**: Total Spend / Conversions
- **CPL (Cost Per Lead)**: Total Spend / Leads

## Benchmarks by Platform
- Meta (Facebook/Instagram):
  - Good ROAS: 4:1 or higher
  - Avg CPA: $20-$50
- Google Search:
  - Good ROAS: 5:1 or higher
  - Avg CPA: $30-$60
```

**Actions:**
- Click "Edit" to modify content
- Click "Remove" to delete KB
- Click "Add Another Knowledge Base" for new KB
- Content auto-saves on change

### Pattern 3: Test Agent Functionality

Use the Test Agent feature to validate your agent configuration:

```javascript
// Click "Test Agent" button on Deploy page
// Modal opens with sample queries

// Sample interaction:
User: "Analyze this campaign: 100K impressions, 2K clicks, 50 conversions"

Agent Response:
**Performance Analysis:**

**Key Metrics:**
- CTR (Click-Through Rate): 2%
- Conversion Rate: 2.5%
- Cost per Click (CPC): [Need cost data]

**Assessment:**
- CTR of 2% is within typical benchmarks (1-3%)
- Conversion rate of 2.5% indicates strong landing page performance
```

**Features:**
- Streaming responses with real-time typing indicators
- Formatted output with bold text and bullet points
- Sample queries based on agent domain
- Chat history maintained within session

## Best Practices

1. **Be Specific in Descriptions** - Provide detailed description (min 50 chars) including target audience, tone, capabilities, and domain context
2. **Review All Generated Content** - Always review knowledge bases and system prompts for accuracy, examples, and tone
3. **Test Before Deploying** - Use Test Agent to validate responses, formatting, and edge cases
4. **Use Clickable Navigation** - Click step indicators to jump directly to any step for targeted edits
5. **Save Configurations Locally** - Download all files and use version control for change tracking
6. **Leverage Auto-Generation** - Let AI create initial structure (3-5 KBs), then refine manually
7. **Include Examples in KBs** - Add realistic data samples, formulas, and platform-specific benchmarks

## Common Issues and Solutions

### Issue: Test Agent Modal Error on Second Click

**Symptoms:**
- First click works fine
- Second click shows: "⚠️ Test Agent modal not properly initialized. Please refresh the page."

**Solutions:**
1. **Hard refresh the page** - Use `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
2. **Clear browser cache** if issue persists
3. **Update to latest deployment** - Fixed in recent versions

**Technical Note:** This was caused by the `testAgentDomain` element being destroyed when chat messages were cleared. Fixed by preserving the element ID in replacement HTML.

### Issue: Markdown Not Rendering in Test Agent

**Symptoms:**
- Bold text shows as `**text**` instead of **text**
- No paragraph breaks between sections
- Numbered lists show numbers on separate lines

**Solutions:**
✅ **Fixed in latest version** - The formatter now handles:
- Bold text conversion (`**text**` → **text**)
- Automatic paragraph breaks at sentences
- Numbered list formatting (1. 2. 3.)
- Bullet point detection (emoji, -, •)
- Proper spacing and line breaks

**Example Before/After:**
```
Before: "Here's what I can help you with: **Performance Analysis** - I'll analyze..."
After:  "Here's what I can help you with:

         **Performance Analysis**
         I'll analyze..."
```

### Issue: Unable to Edit After Reaching Deploy Page

**Symptoms:**
- Want to make changes to knowledge base or system prompt
- Must click Previous 5-6 times to get back

**Solutions:**
✅ **Use Clickable Step Navigation** - Click directly on step indicators:
1. Look at the wizard header with step circles (0-7)
2. Click "Knowledge" to jump to Step 1
3. Click "Agent" to jump to Step 3
4. Make your edits
5. Click "Deploy" to return to summary

**Visual Cues:**
- Steps are clickable (cursor changes to pointer)
- Hover effect lifts steps slightly
- Can navigate backward freely
- Forward navigation validates each step

## Advanced Topics

### Custom Structured Outputs (Step 5)

Define JSON schemas for structured agent responses:
```json
{
  "name": "generate_budget_allocation",
  "schema": {
    "type": "object",
    "properties": {
      "total_budget": {"type": "number"},
      "allocations": {"type": "array", "items": {...}}
    }
  }
}
```

### Prompt Variables (Step 6)

Inject dynamic data using `{{variable_name}}` syntax:
```
You are a strategist for {{company_name}} in the {{industry}} industry
with a monthly budget of {{budget_range}}.
```

### Community Gallery

Browse, import, and share agent configurations (authentication required for submissions)

## Quick Reference

### Common Operations

```bash
# Access the wizard
https://agent-foundry-assistant.vercel.app

# Local development
python3 -m http.server 8000
# or
npx serve .

# Deploy to Vercel
vercel --prod

# Environment setup
vercel env add TD_API_KEY
vercel env add AUTH_PASSWORD
vercel env add TD_LLM_BASE_URL
```

### Wizard Navigation Quick Keys

| Action | Method |
|--------|--------|
| Jump to any step | Click step indicator (0-7) |
| Move forward | Click "Next" or "Continue" |
| Move backward | Click step numbers |
| Save progress | Auto-saved on change |
| Test agent | Click "Test Agent" on Deploy page |
| Download all | Click "Download All Files" |

## Deployment Workflow

### 1. Complete & Validate
- Navigate through Steps 0-7 (or use auto-generation)
- Check all step indicators show checkmarks
- Click "Test Agent" and validate: responses, formatting, tone, edge cases

### 2. Download Files
Download "All Files (ZIP)" from Step 7 for complete backup

### 3. Deploy to TD Agent Foundry
```bash
# https://console.treasuredata.com/app/agents
1. Create New Project (name, description from Step 2)
2. Upload Knowledge Bases (.md files)
3. Configure Agent (name, model, temperature, system prompt)
4. Add Structured Outputs (if configured)
5. Test in TD Foundry, then Deploy
```

### 4. Monitor & Iterate
- Review metrics and user feedback in TD Foundry
- Return to wizard, make targeted edits using clickable navigation
- Re-test and re-deploy

## Architecture

**Tech Stack:** HTML5 + Tailwind CSS + Vanilla JavaScript + Vercel Edge Functions

**Key Files:**
- `index.html` - Main wizard UI
- `wizard-ai.js` - Core wizard logic
- `td-llm-api.js` - TD LLM API client
- `/api/auth.js` - Authentication
- `/api/community/*` - Community gallery

## Environment Setup

```bash
# Required environment variables (Vercel)
TD_API_KEY=your_td_master_api_key
TD_LLM_BASE_URL=https://llm-api-development.us01.treasuredata.com
AUTH_PASSWORD=your_app_password

# Local development
python3 -m http.server 8000  # Static files only
vercel dev                    # Full functionality

# Production deployment
vercel --prod
vercel env add TD_API_KEY
vercel env add AUTH_PASSWORD
```

## Validation Best Practices

**Pre-Deployment Checklist:**
1. Content: KBs have accurate content, realistic examples; system prompt aligns with purpose
2. Configuration: Project metadata complete; agent settings appropriate; valid JSON schemas
3. Testing: Test Agent responds correctly; formatting renders properly; edge cases handled
4. Documentation: All required fields filled; step indicators show checkmarks

**Common Validation Errors:**
- **Incomplete Configuration** → Check Steps 2-3 for required fields (name, description, system prompt)
- **Invalid JSON Schema** → Validate syntax, ensure "type" specified for all properties
- **Empty Knowledge Bases** → Provide detailed Step 0 description (min 50 chars), manually expand content

## Troubleshooting Guide

**Connection Issues (Red API indicator):**
- Verify TD_API_KEY and TD_LLM_BASE_URL environment variables
- Check API key has LLM access permissions in TD Console
- Hard refresh browser (Cmd+Shift+R)
- Review Vercel deployment logs

**Generation Failures:**
- Ensure description is detailed (min 50 chars)
- Check browser console (F12) and network tab for errors
- Verify TD_LLM_BASE_URL endpoint is accessible
- Review API key rate limits

**Styling Issues:**
```bash
# Rebuild Tailwind CSS if needed
./tailwindcss-cli -i src/input.css -o tailwind.css --minify
```

**Download Issues:**
- Try downloading individual files instead of ZIP
- Check browser download settings/permissions
- Clear cache and try different browser

## Related Skills

- **TD Agent Foundry** - Deploying and managing agents in production
- **TD LLM API** - Direct API usage and integration patterns
- **Prompt Engineering** - Crafting effective system prompts
- **Knowledge Base Design** - Structuring domain knowledge for agents

## Resources

### Official Documentation
- [TD Agent Foundry Console](https://console.treasuredata.com/app/agents)
- [Project Repository](https://github.com/skwapong/TD-Agent-Builder)
- [Live Demo](https://agent-foundry-assistant.vercel.app)

### Internal Files
- `README.md` - Deployment and setup guide
- `QUICK_START.md` - Quick start for end users
- `agents.md` - Agent generation process documentation
- `MODEL_REFERENCE.html` - AI model selection reference

### Key Configuration Files
- `vercel.json` - Vercel deployment configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `package.json` - Node.js dependencies
- `.env.example` - Environment variable template

---

**Version:** 1.1.0
**Last Updated:** December 18, 2024
**Production URL:** https://agent-foundry-assistant.vercel.app
