---
name: workflow
description: Manages TD workflows using `tdx wf` commands. Covers project sync (pull/push/clone), running workflows, monitoring sessions/attempts, task timeline visualization, retry/kill operations, and secrets management. Use when users need to manage, monitor, or debug Treasure Workflow projects via tdx CLI.
---

# tdx wf - Workflow Commands

## Project Context

```bash
tdx wf use my_project                # Set default project for session
tdx wf use --clear                   # Clear project context
tdx status                           # Verify current context
```

All commands below use session context when project argument is omitted.

## Discovery

```bash
tdx wf projects                      # List all projects
tdx wf projects "prod_*"             # Filter with glob pattern
tdx wf workflows                     # List workflows in current project
tdx wf workflows my_project          # List workflows in specific project
```

## Project Sync

```bash
# Pull → edit locally → push (recommended workflow)
tdx wf pull my_project               # Pull to workflows/my_project/
tdx wf pull my_project ./custom-dir  # Pull to custom directory
tdx wf pull my_project --revision r1 # Pull specific revision
tdx wf pull my_project --dry-run     # Preview without writing files
tdx wf push                          # Push local changes with diff preview
tdx wf push --skip-validation        # Skip .dig file validation
tdx wf push --revision "v2.0"        # Custom revision name

# Clone & manage
tdx wf clone --name my_project_prod  # Clone project to new name
tdx wf delete my_project             # Delete project from TD
tdx wf download my_project           # Download without sync tracking (legacy)
tdx wf upload my_project             # Upload without sync tracking (legacy)
```

## Running Workflows

```bash
tdx wf run                           # Interactive selector
tdx wf run my_project.my_workflow    # Run specific workflow
tdx wf run my_project.wf --param key=value          # With parameters (repeatable)
tdx wf run my_project.wf --session-time 2025-01-01T00:00:00+00:00  # Custom session time
```

## Monitoring Sessions

```bash
tdx wf sessions                      # List recent sessions
tdx wf sessions my_project           # Filter by project
tdx wf sessions --status error       # Filter: running, success, error, blocked, all
tdx wf sessions --from 2025-01-01    # Filter by start time (ISO 8601)
tdx wf sessions --to 2025-01-31      # Filter by end time
```

## Monitoring Attempts

```bash
tdx wf attempts                      # List recent attempts
tdx wf attempts my_project           # Filter by project
tdx wf attempts --include-retried    # Include retried attempts
```

## Task Timeline

Visual Gantt chart of task execution within an attempt:

```bash
tdx wf timeline my_project.workflow  # Show timeline for latest attempt
tdx wf timeline --follow             # Watch running attempt in real-time
tdx wf timeline --attempt-id <id>    # Timeline for specific attempt
tdx wf timeline --session-id <id>    # Timeline for specific session
```

Interactive mode: `tdx wf sessions` lets you select a session to jump into its task timeline.

## Attempt Actions

```bash
tdx wf attempt <id> tasks            # Show task status tree
tdx wf attempt <id> tasks --include-subtasks  # Include subtasks
tdx wf attempt <id> logs +task_name  # View task logs
tdx wf attempt <id> retry            # Retry from start
tdx wf attempt <id> retry --resume-from +step  # Resume from specific task
tdx wf attempt <id> retry --params '{"key":"val"}'  # Override parameters
tdx wf attempt <id> retry --force    # Force retry even if not failed
tdx wf attempt <id> kill             # Stop running attempt
tdx wf attempt <id> kill --reason "fixing bug"  # Kill with reason
```

## Retry by Session

```bash
tdx wf retry session:<session-id>              # Retry a session
tdx wf retry session:<id> --from-task +step    # Resume from task
tdx wf retry session:<id> --params '{"k":"v"}' # Override parameters
```

## Secrets

```bash
tdx wf secrets list                  # List secret keys (values hidden)
tdx wf secrets set KEY=value         # Set a secret
tdx wf secrets set my_project KEY=v  # Set for specific project
tdx wf secrets delete KEY            # Delete a secret
```

Usage in .dig files: `${secret:KEY}`

## Debugging Workflow

1. `tdx wf sessions --status error` - find failed sessions
2. `tdx wf timeline --session-id <id>` - visualize task execution
3. `tdx wf attempt <id> tasks` - identify failed task
4. `tdx wf attempt <id> logs +failed_task` - read error logs
5. `tdx wf attempt <id> retry --resume-from +failed_task` - retry from failure point

## Output Formats

All list commands support `--json`, `--jsonl`, `--tsv`, `--table` flags and `--output <file>`.
