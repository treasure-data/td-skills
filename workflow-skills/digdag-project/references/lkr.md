# lkr: Secret Management for Local Development

[lkr](https://github.com/sonesuke/lkr) stores secrets in macOS Keychain and injects them as environment variables into child processes. Values are never exposed as plaintext — `lkr list` masks values, and `lkr get` is not available.

All local script execution (workflow deployment, manifest registration, testing) must use `lkr exec --` prefix.

## Installation

```bash
# 1. Install Rust toolchain (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# 2. Install lkr
cargo install lkr-cli
```

## Registering secrets

```bash
# You will be prompted to enter each value (input is masked)
lkr set td:prod              # TD API key
lkr set openai:prod          # OpenAI API key (auto-mapped by lkr)
lkr set slack:bot            # Slack bot token
lkr set slack:webhook        # Slack webhook URL
lkr set langfuse:public      # Langfuse public key
lkr set langfuse:secret      # Langfuse secret key
lkr set langfusedev:public   # Langfuse dev public key
lkr set langfusedev:secret   # Langfuse dev secret key
lkr set langfuseprod:public  # Langfuse prod public key
lkr set langfuseprod:secret  # Langfuse prod secret key

# Verify (values are masked)
lkr list
```

## Naming convention

lkr stores secrets as `provider:label`. Labels must match `[a-z0-9][a-z0-9-]*` — **underscores are not allowed**.

When injected via `lkr exec`, they become uppercase environment variables:

| lkr key | Injected env var |
|---|---|
| `td:prod` | `TD_PROD` |
| `slack:bot` | `SLACK_BOT` |
| `langfuse:public` | `LANGFUSE_PUBLIC` |
| `langfuseprod:secret` | `LANGFUSEPROD_SECRET` |

## .env mapping layer

Most tools expect standard env var names like `TD_API_KEY`, not `TD_PROD`. A `.env` file (loaded by `load_dotenv` in Python) maps lkr names to standard names:

```
TD_API_KEY=${TD_PROD}
SLACK_BOT_TOKEN=${SLACK_BOT}
LANGFUSE_PUBLIC_KEY=${LANGFUSE_PUBLIC}
LANGFUSE_SECRET_KEY=${LANGFUSE_SECRET}
LANGFUSE_HOST=https://us.cloud.langfuse.com
```

Flow: `lkr exec` injects `TD_PROD` → `load_dotenv` resolves `TD_API_KEY=${TD_PROD}` → Python code reads `os.environ["TD_API_KEY"]`.

## Usage

```bash
# Run any command with secrets injected
lkr exec -- python main.py
lkr exec -- tdx wf upload --name my-project
lkr exec -- tdx wf run my-project.my-workflow

# Set TD workflow secrets (lkr injects TD_PROD, referenced as $TD_PROD)
lkr exec -- tdx wf secrets set my-project "td.apikey=$TD_PROD"

# Register a workflow manifest
lkr exec -- python skills/td-workflow/scripts/register_manifest.py manifest.yml
```

## Why lkr (not envchain, etc.)

Other tools like `envchain` expose full secret values when running commands like `envchain <ns> env`. lkr is designed so that secret values are never printed to stdout, which prevents accidental exposure to LLM agents (e.g., Claude Code) that can read terminal output.
