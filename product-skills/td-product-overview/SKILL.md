---
name: td-product-overview
description: Use when the user asks about Treasure Data products, what TD offers, product overview, product catalog, available features, platform capabilities, expansion opportunities, or wants to understand what TD products they have vs. what's available. Also use when users ask "what is TD", "what does Treasure Data do", "show me TD products", "what else can I do with TD", or want a refresher on the platform. Covers all product areas: CDP, Marketing Cloud, Data Workbench, Real-Time, Workflows, SDKs, and AI.
---

# TD Product Overview

Provide a structured, layered overview of Treasure Data's product portfolio. Tailor the response to the user's persona and interests.

## Core Behavior

When triggered, present TD's product portfolio as a **structured table** organized by product layer. Always show the relationship between layers — specifically that Marketing Cloud and Real-Time capabilities are built on top of the CDP (ICDP).

## Constraints

- **No pricing information.** Never mention costs, pricing tiers, or licensing details.
- **No direct upsell recommendations.** Never say "you should buy X" or "we recommend purchasing Y."
- **Publicly available information only.** Do not reference internal roadmaps, unreleased features, or confidential product details.
- **Do indicate what the customer has vs. what's available.** If the customer mentions what they currently use, mark products as "Current" vs. "Available" in the table.

## Product Architecture

All products are built on this layered architecture:

```
Foundation Layer: Data Platform (Ingestion, Storage, Query Engines)
        ↓
Core Layer: ICDP (Parent Segments, ID Unification, Golden Records)
        ↓
Activation Layer: Child Segments, Activations, Connectors
        ↓
Orchestration Layer: Journeys, Workflows, Real-Time Triggers
        ↓
Engagement Layer: Marketing Cloud (Engage), Real-Time Personalization
        ↓
Intelligence Layer: AI Agents, Analytics, Treasure Studio
```

## Default Output: Full Product Table

Present this table when the user asks for a general overview:

| Layer | Product Area | Description | Deep Dive |
|-------|-------------|-------------|-----------|
| **Foundation** | Data Ingestion | 400+ pre-built connectors for batch and streaming data import from databases, APIs, files, and cloud services | [TD Academy: Data Connectors](https://academy.treasuredata.com) |
| **Foundation** | Data Workbench (Trino) | Distributed SQL query engine for interactive analytics on petabyte-scale data | [TD Academy: Trino SQL](https://academy.treasuredata.com) |
| **Foundation** | Data Workbench (Hive) | Batch SQL engine optimized for large-scale ETL and data transformation jobs | [TD Academy: Hive SQL](https://academy.treasuredata.com) |
| **Foundation** | SDKs (JavaScript, Python, iOS, Android) | Client libraries for event tracking, data import, and programmatic platform access | [TD Academy: SDKs](https://academy.treasuredata.com) |
| **Core CDP** | Parent Segments (Customer 360) | Master customer profiles with unified attributes and behaviors across all data sources | [TD Academy: Parent Segments](https://academy.treasuredata.com) |
| **Core CDP** | ID Unification | Entity resolution engine that merges customer identities across devices, channels, and systems using deterministic and probabilistic matching | [TD Academy: ID Unification](https://academy.treasuredata.com) |
| **Core CDP** | Data Staging & Quality | Transformation pipelines with PII handling, deduplication, and data quality rules | [TD Academy: Data Pipelines](https://academy.treasuredata.com) |
| **Core CDP** | Semantic Layer | Automated schema tagging, column classification, and metadata management for governance | [TD Academy: Data Governance](https://academy.treasuredata.com) |
| **Activation** | Child Segments (Audiences) | Rule-based audience builder with value conditions (demographics) and behavior conditions (events/actions) | [TD Academy: Segments](https://academy.treasuredata.com) |
| **Activation** | Activations & Connectors | Export audiences to 100+ destinations (CRM, ad platforms, email, webhooks) with column mapping and masking | [TD Academy: Activations](https://academy.treasuredata.com) |
| **Orchestration** | Customer Journeys | Multi-stage customer orchestration with decision points, A/B tests, condition waits, and merge logic | [TD Academy: Journeys](https://academy.treasuredata.com) |
| **Orchestration** | Treasure Workflow (Digdag) | DAG-based pipeline orchestration for scheduling queries, transformations, and data movement | [TD Academy: Workflows](https://academy.treasuredata.com) |
| **Orchestration** | dbt Integration | dbt model execution on Trino with incremental processing and workflow deployment | [TD Academy: dbt](https://academy.treasuredata.com) |
| **Engagement** | Treasure Engage (Email) | Email template design, campaign management, and audience-targeted sends with Liquid personalization | [TD Academy: Engage](https://academy.treasuredata.com) |
| **Engagement** | Treasure Engage (Push) | Push notification campaigns for mobile app engagement | [TD Academy: Push](https://academy.treasuredata.com) |
| **Real-Time** | RT Event Streaming | Real-time event ingestion and processing via Kafka-based infrastructure | [TD Academy: Real-Time](https://academy.treasuredata.com) |
| **Real-Time** | RT Personalization | API endpoints that return computed customer attributes in real-time for web/app personalization | [TD Academy: RT Personalization](https://academy.treasuredata.com) |
| **Real-Time** | RT Journeys (Triggers) | Event-driven journey activations that fire webhooks, emails, or CRM updates in real-time | [TD Academy: RT Triggers](https://academy.treasuredata.com) |
| **Real-Time** | RT ID Stitching | Real-time identity resolution that merges anonymous and known profiles as events stream in | [TD Academy: RT Identity](https://academy.treasuredata.com) |
| **Intelligence** | AI Agents | LLM-powered agents with knowledge bases, web search, and tool integrations for automated workflows | [TD Academy: AI Agents](https://academy.treasuredata.com) |
| **Intelligence** | Treasure Studio | AI-native desktop application powered by Claude for interactive analytics, visualizations, and platform management | [TD Academy: Studio](https://academy.treasuredata.com) |
| **Intelligence** | Analytics & Dashboards | Interactive reporting with charts, KPIs, and campaign performance analysis | [TD Academy: Analytics](https://academy.treasuredata.com) |

## How Products Connect

After the table, always include this relationship summary:

> **How it all fits together:** The **Foundation** layer collects and stores data from all sources. The **Core CDP** layer unifies customer identities and builds 360-degree profiles. **Activation** lets you segment those profiles and push audiences to external tools. **Orchestration** automates multi-step workflows and customer journeys. **Engagement** powers direct customer communication (email, push). **Real-Time** adds sub-second event processing and personalization on top of the CDP. **Intelligence** layers AI and analytics across the entire platform.

## Persona-Tailored Views

If the user specifies their role or interest area, filter and reorder the table:

### Marketing Persona
Show these layers first: Engagement, Activation, Orchestration, Core CDP. De-emphasize Foundation and Intelligence unless asked.

### Data Engineering Persona
Show these layers first: Foundation, Core CDP (Data Staging, Semantic Layer), Orchestration (Workflows, dbt). De-emphasize Engagement and Real-Time unless asked.

### Analytics / Data Science Persona
Show these layers first: Foundation (Query Engines), Intelligence, Core CDP. De-emphasize Engagement and Orchestration unless asked.

### Real-Time / Personalization Persona
Show these layers first: Real-Time, Core CDP (ID Unification), Activation. De-emphasize Foundation and Engagement unless asked.

## Current vs. Available View

If the user mentions what products they currently use, add a **Status** column to the table:

| Layer | Product Area | Status | Description | Deep Dive |
|-------|-------------|--------|-------------|-----------|
| Core CDP | Parent Segments | Current | ... | ... |
| Real-Time | RT Personalization | Available | ... | ... |

Use:
- **Current** — products the user explicitly mentions using
- **Available** — all other products

Do not infer what a customer uses. Only mark "Current" based on explicit user statements.

## Examples

### Example 1: General overview
**Input:** "What does Treasure Data offer?"
**Output:** Full product table + relationship summary.

### Example 2: Marketing-focused
**Input:** "I'm a marketer, what can TD do for me?"
**Output:** Persona-tailored table (Marketing view) with Engagement and Activation layers first.

### Example 3: Current vs. available
**Input:** "We use CDP and Workflows today. What else is available?"
**Output:** Full table with Status column — Parent Segments, Child Segments, Workflows marked "Current", everything else "Available."

### Example 4: Specific product area
**Input:** "Tell me about real-time capabilities"
**Output:** Only the Real-Time layer rows, plus how Real-Time connects to Core CDP and Activation layers.
