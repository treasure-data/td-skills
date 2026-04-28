---
name: work
description: Use when the user asks to create, update, list, or manage work items, goals, notes, guides, or references in a Treasure Studio workspace. Triggers on "create a task", "add a work item", "move to done", "show my tasks", "goal progress", "create a note", "what's next", or any workspace document management. Also use when operating on files in goals/, items/, guides/, notes/, or references/ folders.
---

# Work Basic

Manage workspace documents (items, goals, notes, guides, references) using file operations. All state lives in markdown files with YAML frontmatter.

## Workspace Location

Workspaces are stored under `~/tdx/work/`:
- **Local workspaces:** `~/tdx/work/local/{name}/` (default workspace: `~/tdx/work/local/default/`)
- **GitHub workspaces:** `~/tdx/work/github/{owner}/{repo}/`

Each workspace root contains a `tdx.json` config file. The current working directory is typically set to the active workspace.

## Folder Structure

| Folder | Kind | Filename Pattern |
|--------|------|------------------|
| `goals/` | goal | `{slug}.md` (no date prefix) |
| `items/` | item | `YYYY-MM-DD-{slug}.md` |
| `schedules/` | schedule | `{task-name}/` (subdirectory with TASK.md + schedule.yaml) |
| `guides/` | guide | `YYYY-MM-DD-{slug}.md` |
| `notes/` | note | `YYYY-MM-DD-{slug}.md` |
| `notes/weekly/` | weekly note | `YYYY-WNN.md` |
| `references/` | reference | `YYYY-MM-DD-{slug}.md` |

## Frontmatter

Every document has YAML frontmatter:

```yaml
---
title: My Work Item
status: todo              # items/goals: backlog|todo|planning|design_review|in_progress|review|done|void
                          # guides: proposed|accepted|deprecated|superseded
tags: [feature, auth]
priority: medium          # critical|high|medium|low (items/goals only)
assignee: Name            # items/goals only
due: 2026-04-01           # items/goals only
github: owner/repo#123    # link to GitHub issue or PR (items/goals only)
jira: atlassian-org/PROJ-456   # link to Jira ticket (items/goals only)
created: 2026-03-23
updated: 2026-03-23
---
```

**Guides** also support `description:` — a one-line summary shown in the guide index and injected into agent context for accepted guides.

Notes and references only need `title`, `tags`, `created`. References add `source: URL`.

## Slug Rules

Slugify the title: lowercase, replace non-alphanumeric with hyphens, trim edges, max 60 chars.
- "Fix Login Bug" → `fix-login-bug`
- "2026-03-23-fix-login-bug.md" for items, "fix-login-bug.md" for goals

## Core Operations

### Create a Document

1. Slugify the title
2. Write to the correct folder with proper filename pattern
3. Include frontmatter with `title`, `created` (today), `status` (default: `todo` for items, `proposed` for guides)

**Item example:**
```markdown
---
title: Fix Login Bug
status: todo
tags: [bug, auth]
priority: high
created: 2026-03-23
---

Login fails when password contains special characters.
```
→ Write to `items/2026-03-23-fix-login-bug.md`

**Goal example:**
```markdown
---
title: Auth Redesign
status: todo
tags: [q2, security]
created: 2026-03-23
---

Redesign the authentication system.

## Linked Items
- [[fix-login-bug|Fix Login Bug]]
```
→ Write to `goals/auth-redesign.md`

### Link Items to Goals

Use wiki-links for bidirectional linking:
1. In the goal body, add `- [[item-slug|Display Title]]`
2. In the item body, add `Part of [[goal-slug]].`

Wiki-link format: `[[slug]]` or `[[slug|Display Text]]`

### Move Status

Read the file, update the `status` field in frontmatter, set `updated` to today.

### List Documents

Use Glob to find files, Read to inspect frontmatter:
- All items: `Glob("items/*.md")`
- All goals: `Glob("goals/*.md")`
- By status: Grep for `status: in_progress` in the target folder

### Search Knowledge

Use Grep to search across notes, guides, and references:
- By content: `Grep(pattern, path: "notes/")` or across all knowledge folders
- By tag: `Grep("tags:.*keyword", glob: "{notes,guides,references}/**/*.md")`

### Goal Progress

1. Read the goal file
2. Parse wiki-links from the body: `[[slug]]` or `[[slug|Display Text]]`
3. For each linked slug, find the matching item file (Glob for `items/*{slug}.md`)
4. Read each item's `status` field
5. Calculate: done count / total, percentage, list in-progress items

### What's Next

Find the first linked item in a goal that isn't `done` or `void`.

## Wiki-Link Resolution

When resolving `[[slug]]`:
1. Try exact filename match: `Glob("{goals,items,guides,notes,references}/{slug}.md")` or `Glob("{goals,items,guides,notes,references}/*-{slug}.md")`
2. Priority: goals > items > guides > notes > references

For backlinks (who links to this document): `Grep("\\[\\[{slug}", glob: "**/*.md")`

## Git Conventions

When committing workspace changes, use this message format:
- Status changes: `work: move "Title" old_status → new_status`
- New documents: `work: create "Title"`
- Updates: `work: update "Title"`

## Sub-item Wiki-links

When an item has sub-tasks, use `[[wiki-link]]` in checklists — even if the target page doesn't exist yet:

```markdown
- [ ] [[2026-03-26-add-auth-refresh]] — Token refresh logic
- [ ] [[2026-03-26-update-api-docs]] — Update REST docs
- [x] [[2026-03-26-fix-session-expiry]] — Session timeout fix
```

When starting work on a sub-task, create the actual `.md` file in `items/` so it becomes a trackable item with its own status and links.

## External Tracker Links

**Frontmatter fields** (field name provides the type):

```yaml
jira: <atlassian-org>/<TICKET-ID>    # e.g., acme-corp/PROJ-1234
github: <owner>/<repo>#<number>       # e.g., acme-corp/my-app#456
```

**Inline references** in markdown body (prefix with `jira:` or `github:`):

```markdown
- [x] Auth token refresh — jira:acme-corp/PROJ-1234
- [ ] Update API docs — github:acme-corp/my-app#789
```

## Knowledge Loop

1. **Before work** — search guides for relevant conventions: `Grep(pattern, path: "guides/")`
2. **During work** — capture learnings as notes
3. **After work** — check if insights should become guides (proposed → accepted)
4. **Accepted guides** are auto-injected into future sessions — promote guides when patterns are validated
5. **Before creating** — search existing docs to avoid duplicates

## Schedule Tasks

Workspace schedules live in `schedules/{task-name}/` with TASK.md + schedule.yaml.
Built-in schedules (weekly-review, synthesize-knowledge, stale-item-cleanup) are auto-created.

To create a new workspace schedule:
1. Write `schedules/{task-name}/TASK.md` and `schedules/{task-name}/schedule.yaml`
2. Run `schedule_reload` to register the task
3. Use `schedule_run` to test, then `schedule_enable` to activate

Workspace-only schedule.yaml fields:
- `goal: {slug}` — scope to a goal's linked items
- `skill: {name}` — invoke a workspace skill (different from `skills` which lists capability packs)
- `output.note: true` — auto-create a Note from results
- `output.note_tags: [tag1, tag2]` — tags added to the auto-created Note
