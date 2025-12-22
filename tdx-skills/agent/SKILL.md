---
name: agent
description: Build LLM agents using `tdx agent pull/push` with YAML/Markdown config. Covers agent.yml structure, tools (knowledge_base, agent, web_search, image_gen), @ref syntax, and knowledge bases. Use for TD AI agent development workflow.
---

# tdx Agent - LLM Agent Development

Build and manage LLM agents using `tdx agent pull/push` with YAML/Markdown configuration files.

## Key Commands

```bash
# Pull project to local files (creates agents/{project}/)
tdx agent pull "My LLM Project"
tdx agent pull "My LLM Project" "Agent Name"  # Single agent

# Push local changes to TD
tdx agent push                                # Push all from current dir
tdx agent push ./agents/my-project/my-agent/  # Push single agent
tdx agent push --dry-run                      # Preview changes

# Clone project (for staging/production deployment)
tdx agent clone "Source Project" --name "New Project"
tdx agent clone ./agents/my-project/ --name "Prod" --profile production

# List/show agents
tdx agents                                    # List in current project
tdx agent show "Agent Name"
```

## Folder Structure

```
agents/{project-name}/
├── tdx.json                    # {"llm_project": "Project Name"}
├── {agent-name}/
│   ├── agent.yml               # Agent configuration
│   ├── prompt.md               # System prompt (markdown)
│   └── starter_message.md      # Optional multiline starter
├── knowledge_bases/
│   ├── {name}.yml              # Table-based KB (TD database)
│   └── {name}.md               # Text-based KB (plain text)
└── prompts/
    └── {name}.yml
```

## agent.yml

```yaml
name: Support Agent
description: Customer support assistant

model: claude-4.5-sonnet          # claude-4.5-sonnet, claude-4.5-haiku
temperature: 0.7
max_tool_iterations: 5
reasoning_effort: medium          # none, minimal, low, medium, high

starter_message: Hello! How can I help?

tools:
  - type: knowledge_base
    target: '@ref(type: "knowledge_base", name: "support-kb")'
    target_function: SEARCH       # SEARCH, LOOKUP, READ_TEXT, LIST_COLUMNS
    function_name: search_kb
    function_description: Search support knowledge base

  - type: agent
    target: '@ref(type: "agent", name: "sql-expert")'
    target_function: CHAT
    function_name: ask_sql_expert
    function_description: Ask SQL expert for help
    output_mode: RETURN           # RETURN (default) or SHOW

  - type: web_search
    target: '@ref(type: "web_search_tool", name: "web-search")'
    target_function: SEARCH
    function_name: search_web
    function_description: Search the web

  - type: image_gen
    target: '@ref(type: "image_generator", name: "image-gen")'
    target_function: TEXT_TO_IMAGE
    function_name: generate_image
    function_description: Generate an image

variables:
  - name: customer_context
    target_knowledge_base: '@ref(type: "knowledge_base", name: "customers")'
    target_function: LOOKUP
    function_arguments: '{"query": "{{customer_id}}"}'

outputs:
  - name: resolution_status
    function_name: get_status
    function_description: Get resolution status
    json_schema: '{"type": "object", "properties": {"status": {"type": "string"}}}'
```

## Reference Syntax

All cross-resource references use `@ref(...)`:

```yaml
'@ref(type: "knowledge_base", name: "my-kb")'
'@ref(type: "agent", name: "my-agent")'
'@ref(type: "prompt", name: "my-prompt")'
'@ref(type: "web_search_tool", name: "web-search")'
'@ref(type: "image_generator", name: "image-gen")'
```

## Knowledge Bases

### Table-based (.yml) - Queries TD database

```yaml
name: Product Catalog
database: ecommerce_db
tables:
  - name: products
    td_query: select * from products
    enable_data: true
    enable_data_index: true
```

### Text-based (.md) - Plain text content

```markdown
---
name: Company FAQ
---

# Frequently Asked Questions

## Return Policy
We offer 30-day returns...
```

## Prompts

```yaml
name: greeting-prompt
agent: '@ref(type: "agent", name: "support-agent")'
system_prompt: |
  Generate a personalized greeting...
template: |
  Customer: {{customer_name}}
```

## Typical Workflow

```bash
# 1. Pull project
tdx agent pull "My Project"

# 2. Edit files locally (agent.yml, prompt.md, knowledge bases)

# 3. Preview changes
tdx agent push --dry-run

# 4. Push to TD
tdx agent push
```

## Related Skills

- **tdx-basic** - Core CLI operations and context management
