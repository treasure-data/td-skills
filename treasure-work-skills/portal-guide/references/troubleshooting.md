# Portal — troubleshooting

Load this on any symptom language: empty, blank, missing, disabled, greyed out, not
installed, gone, won't save, 401, login loop, "my changes disappeared." Ordered roughly
by frequency — check the earlier ones first.

## 1. Everything is disabled, tooltip says "Open a workspace first"

No active workspace. Every Portal control — including `Load sample portals`, `New
portal`, and `Import` — is disabled until one is open. Always rule this out first before
troubleshooting anything else in Portal.

## 2. Brand-new portal is blank, no `Add button` anywhere

`New portal` only collects a `Name` and `Department`, then creates a page with **zero
groups**. `Add button` isn't visible until a group exists. Fix: click **`Add group`**
first, then `Add button` appears inside it.

## 3. `New portal` / `Import` / `Share` / `Duplicate` / `Settings` "aren't there"

These live in the toolbar and only appear **after** entering edit mode via the **Pencil**
icon. Exception: with zero portals of their own, the "Build your own portal" box under
the grid offers `Load sample portals` / `New portal` / `Import` directly, without edit
mode.

## 4. A card shows a setup note instead of running

The card's `Skill` or `Agent` dependency isn't installed — or is installed but disabled,
which looks the same to the user. Open the card's detail view: it names the exact plugin
and marketplace the card needs, and links to the Skills panel to install or enable it.

## 5. "My tab disappeared" / a whole portal vanished

One invalid card can cause the entire portal file to fail to load — not just that card.
A skipped-file warning banner appears when this happens. If the user was hand-editing a
portal file outside the app, that's the likely cause; point them back to the UI editor,
which can't produce an invalid file.

## 6. "My edits reverted" / changes didn't stick

Two different causes with the same symptom:

- **Never saved.** Edit mode is a draft — nothing writes to disk until `Save` is
  clicked. If the user navigated away and got a confirmation prompt, check whether they
  chose to discard.
- **Synced portal.** A portal marked "Keep in sync" during import re-fetches from its
  source and can overwrite local edits every time the Portal page opens. Fix: duplicate
  the portal first to get an independent, unbound copy — cloning is not the same as
  turning sync off, and there's no other way to unsync.

## 7. A "Discard my edit" / "Keep my edit" prompt appeared

A sync update landed while the user had unsaved local edits open. `Discard my edit` takes
the incoming synced version; `Keep my edit` keeps what the user was working on (and it
will be offered the sync update again next time the portal opens).

## 8. An embedded app (`App` card) shows a login screen or a 401

That's an authentication issue with the embedded provider (Superset, Google, Looker,
etc.), not a Portal bug. The app view offers a sign-in affordance for exactly this case;
if the page is stuck in a login loop, a session reset for that provider usually clears it.

## 9. Looker embed looks too narrow, or a Superset dashboard looks stale

Known cosmetic/behavioral issues with specific embedded providers, not the card
mechanism. Reloading the embedded page (the app view's Reload control) is the first thing
to try for a stale Superset dashboard.

## 10. A confirm dialog appears when editing or cloning a portal

Expected, not a bug — it appears specifically when the portal being touched is a
**synced** one, as a heads-up that local edits can be overwritten by the next sync.

## What not to suggest

Don't send a user hunting for a Labs/settings toggle to "turn Portal on." If the Portal
icon isn't in their sidebar at all, that's an availability question for their CSM or
admin, not something they can flip themselves.
