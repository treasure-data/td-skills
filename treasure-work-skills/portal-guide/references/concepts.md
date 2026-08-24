# Portal — concept reference

Load this when a question goes a level below `SKILL.md`'s summary: exact fields, icon
names, storage layout, or the managed/synced distinction.

## The model, field by field

A **Portal** (one tab):

| Field | Notes |
|---|---|
| `name` | Shown as the tab label |
| `department` | A short category tag (e.g. `csm`, `cre`, `company`). Prefer plain ASCII words — it feeds the exported filename and the auto-generated id. |
| `icon` | Optional, one of the built-in icon keys below, or a custom upload |
| `groups` | Ordered list of groups — see below |

A **group** (a titled section on the page):

| Field | Notes |
|---|---|
| `title` | Shown as the section heading |
| `buttons` | Ordered list of cards |

A **card**:

| Field | Notes |
|---|---|
| `label` | 2–4 words, has to fit visually on the card |
| `description` | One line — shown in the card's detail view, explains what it does |
| `icon` | Optional |
| `locked` | If set, the card needs an explicit unlock before it can be edited — good for shared/team portals or destructive prompts |
| `action` | Exactly one of the four kinds below |

## The four action kinds, in full

**`Prompt`** (`send-message`) — seeds a new chat with a fixed prompt and sends it
immediately. Max 4096 characters. This is the default choice for "ask a question /
produce a summary."

**`Skill`** (`run-skill`) — runs an installed skill. Three argument modes, shown in the
card editor as:
- `No args` — runs the skill with just the card's own instructions
- `Fixed args` — always passes the same fixed text
- `Ask at run` — prompts the user for input each time the card is clicked

Use when the task is something an installed skill already does well — no need to
re-describe the whole task in a prompt every time.

**`Agent`** (`run-agent`) — triggers a scheduled or background agent, optionally opening
its chat so the user can watch it run. Use for recurring/automated work, not one-off asks.

**`App`** (`open-app`) — embeds a web page inside the app, one of four providers:

| Provider | Covers |
|---|---|
| `Superset` | A Superset dashboard URL |
| `Google Workspace` | Sheets, Docs, Sites, or Looker Studio reports |
| `Looker` | A Looker instance URL |
| `Web` | Any other web page |

If the embedded page shows a login screen or a 401 instead of content, that's an auth
issue with the embedded provider, not a Portal bug — see `troubleshooting.md`.

## Icons

19 built-in keys: `send`, `doc`, `calendar`, `users`, `chart`, `sparkle`, `clock`,
`heart`, `alert`, `list`, `search`, `target`, `receipt`, `sun`, `play`, `refresh`,
`briefcase`, `phone`, `history`.

Custom icons can also be uploaded (SVG, PNG, JPEG, or WebP) and reused across cards and
portals — useful for a team or product logo. Never invent an icon name outside this list;
an unrecognized one is silently dropped, not shown as an error.

## Advanced settings

A card's editor has an optional `Advanced` section to pin a specific model/backend for
that card's runs. This setting is **local to the machine that set it** — it never travels
with an export, a Drive share, or a sync. Don't promise a teammate will get the same
pinned model after importing a shared card.

## Managed vs. synced vs. plain

| Kind | Who can edit it | How it updates |
|---|---|---|
| Plain (default) | The owner, in edit mode | Never changes unless the owner edits it |
| **Synced** | The owner, with a warning | Re-fetched from its source and can overwrite local edits every time the Portal page opens |
| **Managed** | Nobody locally — pushed by the organization | Read-only; edits aren't possible from the app |

A portal becomes synced only when the user checks "Keep in sync" during import — it's
never on by default. There is no way to "unsync" a portal other than duplicating it,
which creates an independent, unbound copy.

## No programmatic access

There is no Portal command, tool, or API surface exposed to chat. Every action described
in this skill happens by clicking in the app; nothing here can be scripted on the user's
behalf.
