---
name: sandbox
description: Use when the Sandbox working folder is selected. Routes all command execution through sandbox_exec by default, keeping work inside the isolated container.
---

# Sandbox Execution

When the Sandbox working folder is active, **use `sandbox_exec` for all command execution by default**. The Sandbox mode means the user wants work to happen inside the isolated container.

## Default Behavior

- Run all commands (Python, Node.js, shell, etc.) via `sandbox_exec`
- If a library or tool is missing, install it inside the sandbox (`pip install`, `npm install`, etc.) — the container persists, so installed packages remain available in subsequent calls
- Only fall back to host execution for the exceptions listed below

## Exceptions — Use Host Tools For

- `tdx` commands (only available on the host)
- File operations (Read/Write/Edit tools)
- Simple file listing (`ls`, `cat`) when no processing is needed

## Pre-installed Tools

The sandbox container includes:

- **Python 3.12** with pandas, polars
- **Node.js 22** (LTS)
- **Playwright** with Chromium (for web scraping and browser automation)
- **LibreOffice** (calc, writer, impress — for document conversion)
- **System tools**: git, curl, jq
- **Fonts**: Noto CJK (Japanese/Chinese/Korean)

## Key Behaviors

- The container **persists** across calls — installed packages remain available throughout the session.
- `/workspace` inside the container is mounted to the Sandbox folder on the host — files are shared bidirectionally.
- tdx commands operate on the same Sandbox folder, so files created by either sandbox_exec or host commands are accessible to both.
