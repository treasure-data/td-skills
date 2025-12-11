---
name: product-prd-creation-assistant
description: Expert assistance for creating Product Requirements Documents (PRDs) for Treasure Data products and features. Use this skill when users need help writing PRDs, defining product requirements, structuring use cases, or documenting AI agent behaviors.
---

# Product Requirements Document (PRD) Creation Assistant

This skill provides comprehensive guidance for creating professional, actionable Product Requirements Documents (PRDs) for Treasure Data products and features. It uses an Agile PRD framework designed for both general product features and AI agent development.

## When to Use This Skill

Use this skill when you need to:
- Create a new Product Requirements Document (PRD) for a TD feature or product
- Define clear product requirements and acceptance criteria
- Structure customer use cases and test scenarios
- Document AI agent behaviors and test cases
- Align stakeholders on product goals and scope
- Transition from product requirements to implementation planning

## Core Workflow

### Phase 0: Scoping & Clarification

Before creating a PRD, the assistant must understand the user's fundamental needs and goals.

**Approach:**
1. **Ask Essential Questions** in the user's language:
   - "To get started, could you briefly describe the problem you're trying to solve?"
   - "Who are the primary users for this feature/agent, and what is their main goal?"
   - "What would a successful outcome look like for you?"

2. **Gain Agreement to Proceed:**
   - Summarize the user's objective back to them for confirmation
   - Propose moving forward: "Great, to achieve that goal, let's start by creating an Agile PRD to organize the requirements."

### Phase 1: Interactive PRD Creation

Guide the user through creating a comprehensive PRD using the template below.

**Key Principles:**
- **Collaborate Actively**: Ask clarifying questions for any missing mandatory fields
- **Separate "What" from "How"**: Guide users to keep implementation details out of the PRD
- **Use the Notes Column**: Encourage using Notes to clarify intent without dictating implementation
- **Test-Driven Specification**: For each behavior, define concrete test cases using Path Types:
  - **Happy Path**: The most common, ideal scenario
  - **Critical Edge Case**: Important scenario that must be handled correctly
  - **Tolerable Failure**: Scenario where graceful failure is acceptable

---

## Agile PRD Template for Treasure Data

### Document Meta

| Field | Value |
|-------|-------|
| **Functional Bet Link** | [Link to JIRA Epic/Ticket] |
| **Project Type** | [Feature / Product / Agent] |
| **Status** | PROPOSAL / IN DEVELOPMENT / READY FOR LAUNCH |
| **Release Target** | [e.g., FY26 Q2] |
| **Last Updated** | [YYYY-MM-DD] |
| **PM** | [Name] |
| **Designer** | [Name] |
| **Agent Writer** | [Name - if AI agent project] |
| **BE Engineer** | [Name] |
| **QA Team** | [Name] |

---

## Section 1: Business Overview (Why are we building this?)

### Feature Overview & Background

[Provide a high-level overview of what this feature/product is and the context that led to this initiative]

### What problem will this solve?

[Clearly articulate the specific problem or pain point that users currently experience]

### Current Solutions & Market Landscape

[Describe how users currently solve this problem, competitive solutions, or workarounds]

### Business Value

[Quantify the business impact: revenue, cost savings, user retention, efficiency gains, strategic positioning]

---

## Section 2: Product Details (What are we building?)

### 2.1 System & User-Facing Requirements

#### Persona

[Define the primary user persona(s) who will use this feature]

#### Customer Use Cases

[Describe the main use cases from the customer's perspective. What will they use this for?]

#### Assumptions

[List key assumptions about user behavior, technical environment, data availability, etc.]

#### Requirements Table

| # | Title | User Story (As a..., I want to..., so that...) | Importance | Acceptance Criteria (When..., Then...) | Notes |
|---|-------|------------------------------------------------|------------|----------------------------------------|-------|
| 1 | [Feature name] | As a [persona], I want to [action], so that I can [goal]. | Must have / Should have / Nice to have | When [context], then [expected behavior]. | [Intent clarification] |
| 2 | | | | | |

**Importance Levels:**
- **Must have**: Core functionality, launch blocker
- **Should have**: Important but not blocking launch
- **Nice to have**: Desirable enhancement for future iterations

---

### 2.2 Agent Behavior & Test Cases

**Note:** This section is **recommended for AI Agent projects** and can be omitted for general product features.

#### Overall Agent Persona & Principles

**Persona**: [Define the agent's role, tone, and approach to user interaction]

**Guardrails:**
- **DO NOT**: [List prohibited behaviors]
- **MUST**: [List mandatory behaviors]

---

#### Behavior ID: [BEH-01] - [Concise Title for the Behavior]

**Trigger**: [What action or condition initiates this behavior?]

**Concrete Test Cases:**

| Test Case ID | Path Type | Input Example | Required Knowledge/Tools | Expected Behavior & Key Output Points | Importance |
|--------------|-----------|---------------|-------------------------|--------------------------------------|------------|
| BEH-01-T01 | Happy Path | [Typical user input] | [Data/tools needed] | [Expected agent behavior and output] | Must Have |
| BEH-01-T02 | Critical Edge Case | [Edge case input] | [Data/tools needed] | [How agent should handle this case] | Must Have |
| BEH-01-T03 | Tolerable Failure | [Out-of-scope input] | [Data/tools needed] | [Graceful failure message] | Should Have |

**Path Type Definitions:**
- **Happy Path**: Most common, ideal scenario that defines core value
- **Critical Edge Case**: Less common but important scenario requiring correct handling
- **Tolerable Failure**: Acceptable graceful failure for out-of-scope requests

---

### 2.3 Other Specifications

#### Non-Functional Requirements

| Category | Requirement / Goal | Rationale / Trade-offs |
|----------|-------------------|------------------------|
| **Latency / Response Time** | [Target response time] | [Why this matters, what we're trading off: Speed vs. Complexity/Quality] |
| **Token Consumption / Efficiency** | [Target token budget] | [Cost considerations: Verbosity vs. Cost/Performance] |
| **Reliability / Consistency** | [Uptime, error rate targets] | [User experience impact: Creativity vs. Predictability] |
| **Scalability** | [Concurrent users, data volume] | [Growth expectations and constraints] |
| **Security & Privacy** | [Data handling, access control] | [Compliance and user trust requirements] |

#### Limitations / Not in Scope

[Clearly define what this feature/agent will NOT do. This prevents scope creep and sets clear boundaries.]

#### User Interaction and Design

[Describe the user interface, interaction patterns, and experience flow]

#### Available Data for Agent

**Recommended for AI Agent projects:**

[List the data sources, databases, tables, and knowledge bases the agent can access]

#### Implementation Notes for Engineering

**Optional:**

[Technical hints or constraints for the engineering team, while avoiding detailed implementation decisions]

---

## Section 3: Product Development Planning

### T-Shirt Sizing

**Estimated Effort**: S / M / L / XL

[Provide brief rationale for the sizing]

### Related Development Initiatives

[List any dependencies on other projects, features, or initiatives]

---

## Supporting Knowledge

### Agent Design Reference (For AI Agent Projects)

**Note:** This reference reflects Treasure Data AI Foundry capabilities as of the template creation date. **Always verify the latest technical scope with the engineering team**, as capabilities are frequently updated.

| Item | Supported Scope & Examples |
|------|---------------------------|
| **Knowledge Base** | Plazma DB only: Table/column information, table content search |
| **Available Tools** | `list_columns`, `query_data`, `call_agent`, `load_text_knowledge` |
| **Output Formats** | Single output only: text, JSON, React code, image |
| **Agent Linking** | Sub-agent invocation via `call_agent` (e.g., for Image Generation) |

**Important:** Always confirm current capabilities with the AI Foundry team before finalizing agent specifications.

---

## Best Practices for Writing Effective PRDs

### 1. Focus on Concrete, Testable Behaviors

Instead of describing abstract features, specify concrete, testable behaviors through examples.

✅ **Good - Testable:**
```
When a user asks "Show me high-value customers", then the agent should:
1. Query customers with total_revenue > $10,000
2. Return a table with: customer_id, name, total_revenue, last_purchase_date
3. Sort by total_revenue descending
```

❌ **Bad - Abstract:**
```
The agent should help users find valuable customers.
```

### 2. Use Path Types to Define Robustness

- **Happy Path**: Defines core value delivery
- **Critical Edge Case**: Defines resilience and reliability
- **Tolerable Failure**: Defines clear boundaries and scope

### 3. Meaningful Non-Functional Requirements for AI Agents

For AI agents, NFRs directly impact user experience:

- **Latency**: Trade-off is Speed vs. Complexity/Quality
- **Token Consumption**: Trade-off is Verbosity vs. Cost/Performance
- **Reliability**: Trade-off is Creativity vs. Predictability

Always include the **rationale and trade-offs** to help engineering make informed decisions.

### 4. Notes Column Strategy

Use the Notes column to:
- Clarify **why** a requirement exists
- Explain user intent
- Provide context for edge cases
- **Never** prescribe specific implementation approaches

---

## Example: Complete PRD Section

### Example: Customer Segmentation Agent - Behavior Specification

#### Behavior ID: [BEH-01] - Segment Creation

**Trigger**: User requests creation of a new customer segment

**Concrete Test Cases:**

| Test Case ID | Path Type | Input Example | Required Knowledge/Tools | Expected Behavior & Key Output Points | Importance |
|--------------|-----------|---------------|-------------------------|--------------------------------------|------------|
| BEH-01-T01 | Happy Path | "Create a segment of high-value customers who purchased in the last 30 days" | Customer DB: `transactions`, `profiles` table | 1. Query transactions with purchase_date >= 30 days ago<br>2. Filter customers with total_revenue > $5,000<br>3. Return segment with count and preview of top 10 customers | Must Have |
| BEH-01-T02 | Critical Edge Case | "Create a segment of customers in Tokyo with no purchases" | Customer DB: `profiles` table with location field | 1. Filter profiles by location = 'Tokyo'<br>2. LEFT JOIN to find customers with no transaction records<br>3. Return segment with clear indication of zero-purchase status | Must Have |
| BEH-01-T03 | Tolerable Failure | "Create a segment based on social media sentiment" | N/A - Social media data not available | Return message: "I currently don't have access to social media sentiment data. I can help you create segments based on transaction history, demographics, and engagement data. Would you like to explore those options?" | Should Have |

---

## Quick Reference: When to Use Each Section

| Section | Required for General Features | Required for AI Agents |
|---------|-------------------------------|------------------------|
| Document Meta | ✅ Yes | ✅ Yes |
| Section 1: Business Overview | ✅ Yes | ✅ Yes |
| Section 2.1: Requirements | ✅ Yes | ✅ Yes |
| Section 2.2: Agent Behavior & Test Cases | ❌ Optional | ✅ **Recommended** |
| Section 2.3: Other Specifications | ✅ Yes | ✅ Yes |
| Section 3: Development Planning | ✅ Yes | ✅ Yes |
| Supporting Knowledge: Agent Design Reference | ❌ Not applicable | ✅ Yes |

---

## Assistant Behavior Guidelines

### During Scoping (Phase 0):
1. Ask clarifying questions to understand the user's goal
2. Confirm the objective before proceeding to PRD creation
3. Identify whether this is a general product feature or AI agent project

### During PRD Creation (Phase 1):
1. Present the appropriate template sections based on project type
2. Ask for mandatory fields if missing
3. Guide users to focus on "what" not "how"
4. Help formulate concrete test cases using Path Types
5. Encourage use of the Notes column for clarifications
6. Remind users to verify Agent Design Reference with engineering team if creating an AI agent

### What NOT to Do:
- ❌ Don't immediately present the full template without understanding the goal
- ❌ Don't let users include detailed implementation in requirements
- ❌ Don't skip asking clarifying questions for vague requirements
- ❌ Don't proceed to agent system prompt generation (out of scope for this skill)

---

## Output Format

When helping create a PRD, output the document in **Markdown format** following the template structure above, filling in the sections collaboratively with the user.

---

By following this skill, you'll create clear, actionable PRDs that align stakeholders, guide engineering effectively, and ensure successful product delivery at Treasure Data.
