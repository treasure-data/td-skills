# Portal — sharing and sync

Load this on: share, export, import, send to a teammate, Drive, "keep in sync," managed
portals, team rollout.

## Decision table

| Goal | Do this |
|---|---|
| Hand a portal to one person | Export to a `.portal.json` file |
| Give it to a team | Share to Google Drive, with a scope |
| It depends on custom skills, agents, or icons | Advanced Export — bundles those dependencies into a `.portalx.json` (small) or `.portalx.zip` (when skill folders need to be included) |
| The team should always have the latest version | Share to Drive, and tell them to check **"Keep in sync"** when they import it |
| Nobody should be able to change it locally | That's a **Managed Portal** — pushed by the organization, not something a user sets up from the app |

## File types

| Extension | Contents |
|---|---|
| `.portal.json` | Plain export — the portal definition only |
| `.portalx.json` | Portal + a manifest of dependencies (skills/agents/icons), referenced by name |
| `.portalx.zip` | Portal + the dependencies' actual files bundled inside |

## Drive share scopes

When sharing to Drive, the owner picks who can access it: **private** (just them),
**organization** (anyone in the org), or **anyone with the link**. Pick the narrowest
scope that still reaches the intended audience.

## The secret-file scan

Advanced Export scans bundled files for likely secrets before letting the export
proceed, and requires an explicit confirmation to continue past a hit. Take a real hit
seriously — clicking through it without checking is how credentials or customer data end
up in a shared file. If the user isn't sure why a file was flagged, tell them to open and
check it before confirming.

## Importing a portal someone sent

The import flow walks through the portal's own fields first, then any icons, skills, and
agents it depends on — each shown with its own opt-in checkbox. **Nothing installs unless
the checkbox is checked.** If two skills have the same identifier but different content,
the user is asked to keep the existing one, replace it, or install the new one under a
different name. If the incoming portal's name collides with one they already have,
they're offered to keep both or replace.

## "Keep in sync"

Off by default, and worth explaining before someone checks it: it turns the imported
portal into a **synced** portal, which re-fetches from its source and can silently
overwrite the importer's own local edits every time they open the Portal page. There's no
toggle to turn sync back off later — the only way out is to duplicate the portal, which
creates an independent copy.

## What never travels with a share

- A card's Advanced model/backend pin — local to the machine that set it
- Sync binding (`syncSource`) — only set by explicitly checking "Keep in sync" on import
- Any icon value the receiving app doesn't recognize — silently dropped, not an error

## Managed portals

A **Managed Portal** is pushed by the organization and appears read-only in the app —
there's no user-facing setup flow to create one. If someone asks how to make their
team's portal "managed" like that, the honest answer today is that it isn't something
they can configure themselves from the app; direct that request to whoever owns Portal
rollout for the org rather than promising a setting that doesn't exist for end users.
