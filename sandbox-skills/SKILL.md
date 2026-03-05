---
name: sandbox
description: Use when the Sandbox working folder is selected. Guides the agent to use sandbox_exec for commands that need pre-installed tools not available on the host (Python packages, Playwright, LibreOffice, etc.).
---

# Sandbox Execution

When the Sandbox working folder is active, you have access to an isolated container environment via `sandbox_exec`.

## Pre-installed Tools

The sandbox container includes:

- **Python 3.12** with pandas, polars
- **Node.js 22** (LTS)
- **Playwright** with Chromium (for web scraping and browser automation)
- **LibreOffice** (calc, writer, impress — for document conversion)
- **System tools**: git, curl, jq
- **Fonts**: Noto CJK (Japanese/Chinese/Korean)

## When to Use sandbox_exec

Use `sandbox_exec` when the command requires tools **not installed on the host**:

- `pip install` / Python scripts using pandas, polars, playwright, etc.
- `playwright` for web scraping or screenshots
- `libreoffice --convert-to` for document conversion (PDF, DOCX, XLSX, etc.)
- `node` scripts requiring npm packages

## When NOT to Use sandbox_exec

Use host-native tools for:

- `tdx` commands (always available on the host)
- File operations (Read/Write/Edit tools)
- Any commands already available on the host

## Key Behaviors

- The container **persists** across calls — `pip install` packages remain available in subsequent calls.
- `/workspace` inside the container is mounted to the Sandbox folder on the host — files are shared bidirectionally.
- tdx commands operate on the same Sandbox folder, so files created by either sandbox_exec or host commands are accessible to both.
