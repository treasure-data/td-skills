# py>: Python Custom Script Operator

Run Python code on TD via Custom Script Docker containers. Use for logic that SQL and `http>` cannot handle — external API calls with complex auth, HTML scraping, data transformation, writing to TD tables, etc.

> Note: `py>` tasks incur ~60 seconds overhead for Docker container startup. For LLM agent calls, use `http>` instead (see SKILL.md).

## Basic Usage

```yaml
+analyze:
  py>: tasks.Analyzer.run
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"
  param1: value1
  _env:
    TD_API_KEY: ${secret:td.apikey}
```

| Parameter | Description |
|---|---|
| `py>:` | `[PACKAGE.CLASS.]METHOD` |
| `docker:` | Docker image for Custom Script execution |
| `_env:` | Environment variables (use `${secret:...}` for secrets) |
| `python:` | Custom Python executable path or args |
| (other keys) | Passed as constructor/method arguments |

## Installing Packages

The Custom Script Docker image does not auto-install `requirements.txt`. A new container is created for each execution, so packages must be installed at runtime every time.

### Directory layout

Place `requirements.txt` at the project root (next to `workflow.dig`):

```
my_project/
  ├── workflow.dig
  ├── requirements.txt      # <-- project root
  └── py_scripts/
      ├── __init__.py
      └── main.py
```

### Install pattern

Install dependencies inside the `run()` function before importing third-party packages:

```python
# py_scripts/main.py
import os
import sys
from pathlib import Path


def _install_requirements():
    base_dir = Path(__file__).resolve().parent.parent  # project root
    req_path = base_dir / "requirements.txt"
    if req_path.exists():
        os.system(f'{sys.executable} -m pip install -q -r "{req_path}"')


def run():
    _install_requirements()

    # Import third-party packages AFTER install
    import requests
    from dotenv import load_dotenv

    load_dotenv()
    # ... main logic here
```

### Notes

- Standard library modules (`json`, `os`, `urllib.request`, etc.) are always available without installation
- `Defaulting to user installation ...` warnings can be ignored
- Add `-q` flag to suppress pip output
- Verified on TD production with `httpx==0.28.1`

## Python API (digdag module)

The `digdag` module is pre-installed in the Custom Script image.

```python
import digdag

class Analyzer:
    def run(self, param1="default"):
        # Access all workflow params
        all_params = digdag.env.params

        # Store results for subsequent tasks
        digdag.env.store({"result_count": 42})

        # Export variables (like _export, scoped to children)
        digdag.env.export({"shared_config": "value"})

        # Add dynamic subtasks
        digdag.env.add_subtask(Analyzer.cleanup, target="old_data")

    def cleanup(self, target):
        print(f"Cleaning {target}")
```

### Key methods

| Method | Description |
|---|---|
| `digdag.env.params` | Dict of all workflow parameters and stored variables |
| `digdag.env.store(dict)` | Make variables available to all subsequent tasks |
| `digdag.env.export(dict)` | Define variables scoped to children (like `_export:`) |
| `digdag.env.add_subtask(method, **kwargs)` | Dynamically add child tasks |

### Argument mapping

Workflow parameters and stored variables are automatically mapped to method arguments by name. Default values are supported.

```python
class MyTask:
    def run(self, session_date, my_var="default"):
        # session_date is auto-mapped from workflow built-in
        # my_var is auto-mapped from digdag.env.store or _export
        print(f"Processing {session_date}, var={my_var}")
```

### Data types

Arguments must be JSON-serializable: strings, integers, floats, lists, dicts.
