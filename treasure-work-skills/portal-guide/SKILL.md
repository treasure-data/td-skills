---
name: portal-guide
description: "Teach, explain, and coach a Treasure Work user through the Portal feature — the department portal of one-click action cards (a tab = one portal page, groups = titled sections, cards = panels that each fire one Prompt / Skill / Agent / App action). Use when the user asks what Portal is, how it works, how to get started, how to create or build their first portal, how to add a tab, group, card, or button, how to pick an action type or icon, whether to lock a card, how to export, share, or import a portal, the difference between managed and synced portals, or when a portal is empty, blank, missing, greyed out, disabled, or a card says a skill or agent isn't installed. This also covers requests phrased in other languages (e.g. Japanese) about the same concept — 'portal' — since Treasure Work's UI itself is English-only. NOT for BI dashboards, charts, KPI tiles, or data widgets — Portal has no widgets, queries, or data sources; use grid-dashboard or react-dashboard for those."
---

# Portal Guide

Portal is a one-click launcher grid inside Treasure Work, for people who do the same
handful of things every week and don't want to type a prompt each time — or don't want
to talk to a chat box at all. This skill teaches the concept, coaches a user through
their first portal, and troubleshoots the common dead ends. It does not build or edit
portal files — coaching only.

## Language

Respond in whatever language the user is writing in — this skill's source is English
purely for maintainability, and that shouldn't leak into the reply.

Keep the following in their original English even when replying in another language,
with a short gloss the first time you use each — the app's interface is English-only, so
a translated label sends the user hunting for a button that doesn't exist:

- **On-screen labels**: `New portal`, `Load sample portals`, `Add group`, `Add button`,
  `Import`, `Save`, `Cancel`, `Settings`
- **Guided tour names** in the `?` menu (see [Hand off to the built-in tours](#hand-off-to-the-built-in-tours))
- **Schema keywords**: `send-message`, `run-skill`, `run-agent`, `open-app`, `groups`,
  `department`

## Route the question

| Question shape | Do this |
|---|---|
| Conceptual ("what is X", "what's the difference between…") | Answer directly. Load `references/concepts.md` if it's below the summary in this file. |
| "Where is X" and a built-in tour covers it | 1–2 sentences of orientation, then name the tour. Never re-narrate a tour click by click. |
| "Where is X" and no tour covers it | Give the minimal click path yourself. |
| "Help me build my first portal" | Go to [Coaching a first Portal](#coaching-a-first-portal). |
| "What should mine contain" | Load `references/coaching-playbooks.md`. |
| Symptom language (empty, blank, disabled, not installed, reverted…) | Load `references/troubleshooting.md`. |
| Share / export / import / sync / team rollout | Load `references/sharing-and-sync.md`. |
| "Build/write the portal file for me" | Not supported yet — say so, and walk them through the UI instead. There is no Portal tool or command; only the click path exists. |

## What Portal is (and is not)

Portal is a **launcher**, not a dashboard. One screen of large clickable cards; each card
fires one pre-written action.

Three nested things, and that is the entire model:

| What the user sees | Name | What it is |
|---|---|---|
| a tab in the tab bar | a **Portal** — one page | a name, a department, an optional icon, and an ordered list of groups |
| a titled section on the page | a **group** | a title plus an ordered list of cards — nothing else |
| a card they click | a **card** (a panel/button) | an icon, a label, a description, and **exactly one** action |

Say the negative out loud — almost everyone arrives expecting a BI tool. Portal has
**no** widgets, charts, numbers, queries, SQL, data sources, resizable layout grid,
scheduled data refresh, or per-user variables. A card cannot *display* anything; it can
only *do* one of four things (below). If they want numbers on a screen, they want either
an `open-app` card pointing at an existing BI page, or a different skill entirely
(`grid-dashboard`, `react-dashboard`).

Users bring different vocabulary for the same three things regardless of language they
speak — "page" or "tab" for a Portal, "panel" or "button" for a card, "section" for a
group. Map whatever word they use back to the three rows above.

## The four things a card can do

The card editor calls these `Prompt` / `Skill` / `Agent` / `App`:

| UI label | Behind the scenes | Fires when |
|---|---|---|
| `Prompt` | `send-message` — seeds a new chat with a fixed prompt (max 4096 chars) | the task is "ask a question / produce a summary" |
| `Skill` | `run-skill` — runs an installed skill, with no args, fixed args, or ask-at-run args | the task is something a skill already does |
| `Agent` | `run-agent` — runs a scheduled/background agent, optionally opening its chat | the task is recurring/automated, not a one-off ask |
| `App` | `open-app` — embeds a web page (Superset, Google Workspace, Looker, or generic Web) in-app | the task is "look at that existing dashboard/sheet/doc" |

## Coaching a first Portal

**Propose first, interview second.** A non-engineer can't answer "how should we
structure your portal?" — but can react to a concrete draft in five seconds. Ask **at
most one** question before showing something.

### Step 0 — read the room, don't ask

Check whether the working directory has a `.claude/portals/` folder with files in it.
Files present → the user already owns portals and most likely wants to *change* one, not
create one — don't read the file contents unless they ask; card prompts routinely
mention customer names. Nothing there, or no workspace at all → they need an active
workspace before anything in Portal works (every control is disabled and tooltipped
`Open a workspace first`) — send them to open one before anything else.

### Step 1 — one question

Ask this much, and no more: "What are the 3–5 tasks you do most often that you'd like to
get down to one click? Or just tell me your role (CSM / CRE / PM / Sales / Support) and
I'll draft something to react to."

A vague answer is enough — "I'm a CSM and I check account health a lot" is plenty. Load
`references/coaching-playbooks.md` and use the matching role blueprint.

### Step 2 — propose the whole portal in one table

| Group | Card | Action | What one click does |
|---|---|---|---|
| My accounts | ACME weekly check | `Prompt` | Pulls ACME's last 7 days and flags anomalies |
| My accounts | Renewals ≤ 90 days | `Prompt` | Lists my accounts renewing this quarter |
| Reports | CS overview | `App` | Opens the team's Superset dashboard in-app |
| Reports | Weekly summary | `Skill` | Runs an installed reporting skill over this week |

Then one confirming question: "Does this look right? Tell me what you'd swap out."
**Two groups, four to six cards.** Bigger than that and people never finish setting it up.

### Step 3 — get it on screen: start from a sample, not from blank

This is the single most important piece of advice in this skill.

If they have **zero** portals of their own:
1. On the Portal page, click **`Load sample portals`** in the "Build your own portal"
   box. Three editable portals appear. Nothing existing is ever overwritten.
2. Open the tab closest to their job, then click the **Pencil** icon (top right) to enter
   edit mode.
3. Click **`Settings`** (gear) to change `Name` and `Department` to theirs.
4. Replace cards one at a time with the ones from your table.
5. Click **`Save`**.

**Why not `New portal`?** It only asks for `Name` and `Department`, then drops the user on
a page with **zero groups** — `Add button` isn't even visible until a group exists. That
blank page is where most people give up. Only route someone there if they explicitly want
to start clean, and if you do, say the very next click before they ask: "a blank page will
open — click `Add group` first."

If they already have **at least one** portal, `New portal` and `Import` live in the
toolbar and only appear **after** the Pencil icon — mention the Pencil first, or they'll
report that the button doesn't exist.

### Step 4 — build exactly one card together, then hand off

1. In edit mode, click **`Add group`** and name it (e.g. `My accounts`).
2. Click **`Add button`** inside that group.
3. In the dialog, top to bottom: pick an **icon** → **`Label`** (2–4 words — it has to
   fit on a card) → **`Description`** (one line; this is what explains the card to
   *them* in three months, don't skip it) → the lock checkbox → the action type
   (`Prompt` / `Skill` / `Agent` / `App`) → that type's fields. Leave `Advanced` alone.
4. Click **`Save`** in the top toolbar. Nothing reaches disk until then — edit mode is a
   draft, the panel is tinted, and an "Editing" badge shows. Leaving mid-edit prompts to
   confirm.
5. Step back: "the rest of the cards follow the same steps — if you'd like a click-by-click
   guide for the remaining ones, check the `Editing a portal` tour from the `?` menu."

### Step 5 — the part they'll get wrong

For a `Prompt` card, prompt quality **is** card quality — and this is the one place a
coach adds value no tour can. Offer to write every prompt. A good one is self-contained
(no "as we discussed"), names the data it wants, and states the output shape.

- Weak: `ACME status`
- Good: `Summarize ACME Corp's last 7 days: workflow runs, support tickets, and ingestion
  volume. Call out anything anomalous, then list up to 3 follow-ups.`

Hard limit: 4096 characters. Needing more than a paragraph is a sign the card should be a
`Skill` card instead.

## Hand off to the built-in tours

Portal ships seven guided walkthroughs, opened from the **`?`** icon on the Portal page.
They run in **view mode only** — tell the user to leave edit mode first. There's no way
to launch a tour on someone's behalf; only name the one to pick.

| `?` menu label | Steps | Point here when |
|---|---|---|
| `Portal basics` | 8 | "what is this screen" · first-ever visit |
| `Portal action types` | 7 | "what's the difference between the four actions" |
| `Editing a portal` | 13 | "how do I add/rename/reorder/delete groups and cards" |
| `Building a card` | 6 | "walk me through the card dialog" |
| `Sharing & export` | 5 | "how do I give this to my team" |
| `Importing a portal` | 4 | "someone sent me a portal file" |
| `Portal icons` | 3 | "can I use our own icon" |

Never re-narrate a tour click by click — orient in a sentence or two, name the tour, then
offer to stay for the judgement calls it can't make (what to build, what a prompt should
say). When replying in a language other than English, still give the tour's label in
English with a short gloss, since the `?` menu itself is English-only.

## Fast troubleshooting

The five most common dead ends — see `references/troubleshooting.md` for the rest:

1. Everything disabled, tooltip `Open a workspace first` → no active workspace. Always
   check this first.
2. Brand-new portal is blank, no `Add button` in sight → `New portal` creates zero
   groups → `Add group` first.
3. `New portal` / `Import` / `Share` / `Duplicate` / `Settings` "don't exist" → not in
   edit mode → click the Pencil. (Exception: with zero portals, the getting-started box
   offers `New portal` / `Import` without edit mode.)
4. A card shows a setup note instead of running → its `Skill` or `Agent` dependency isn't
   installed (or is installed but disabled) → open the card's detail view for the exact
   plugin/marketplace name and a link to the Skills panel.
5. "My edits disappeared" → either the edit-mode draft was never `Save`d, or the portal
   is **synced** and got overwritten by its source on the next Portal open.

## Sharing, in one paragraph

There are four distinct ways to move a portal: export to a `.portal.json` file for one
person; share to Google Drive with a scope for a team; Advanced Export to a
`.portalx.json`/`.portalx.zip` when the portal depends on custom skills, agents, or
icons; or import, which always asks per-dependency before installing anything. A
"synced" portal re-fetches and can overwrite local edits on every Portal open; a
"managed" portal is read-only. Load `references/sharing-and-sync.md` for the decision
table and the details.

## Never do this

- Never call Portal a dashboard, or promise widgets, charts, KPIs, variables,
  auto-refresh, or drag-to-resize layout. It has none of them.
- Never claim you can click for the user, start a tour for them, or that a Portal tool or
  command exists to build one. None of that exists — say so plainly.
- Never send a user hunting for a settings toggle to "turn Portal on." If the Portal icon
  isn't in their sidebar at all, tell them to ask their CSM or admin — don't guess at a
  setting.
- Never invent an action type, icon name, or app provider. All three are closed sets —
  see `references/concepts.md`.
- Never write, generate, or edit a portal file. Coach through the UI only.
- Never claim a card's Advanced model/backend setting travels with a share — it's
  local-only and stripped from every export.
- Never tell someone to fix a stale **managed** portal by editing it (read-only), or a
  **synced** one by editing the local copy (it's overwritten from its source).
- Never read a user's portal contents aloud unless they ask — card prompts often mention
  customer names.

## References

- `references/concepts.md` — exact field-by-field model, the four action types in full,
  icon names, managed vs. synced vs. plain.
- `references/coaching-playbooks.md` — five role blueprints (CSM/CRE/PM/Sales/Support)
  with ready-to-paste cards and prompts, plus prompt-writing guidance and sizing rules.
- `references/troubleshooting.md` — the full symptom → cause → fix list.
- `references/sharing-and-sync.md` — export/share/import mechanics, "keep in sync," and
  what to warn about before sharing.
