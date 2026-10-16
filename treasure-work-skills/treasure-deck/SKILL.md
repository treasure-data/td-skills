---
name: treasure-deck
description: Use when creating or editing Markdown presentations in Treasure Work, turning notes into slides, opening a local slide editor, or working with deck:true files. Creates dated deck folders with the npm Treasure Deck CLI and opens its live editor in the right-dock Browser. For explicit PowerPoint or Google Slides output, use the corresponding format skill.
---

# Treasure Deck in Treasure Work

Create Markdown slides with `@treasure-ai/treasure-deck` and show its live editor beside the conversation using `mcp__work__open_browser`. Keep the Markdown and nearby media in the user's workspace.

## Load the engine's skill

Use Node 22+ and npm. Run commands through the pinned release:

```sh
npm exec --yes --package=@treasure-ai/treasure-deck@2026.10.2 -- deck <command>
```

This uses npm's cache, not a global installation or a workspace dependency. If Node/npm is unavailable, explain the prerequisite and offer setup help; do not install a runtime or modify the workspace's package files automatically.

Load the package's canonical authoring guidance before drafting or changing slides:

```sh
skill_dir=$(mktemp -d)
npm exec --yes --package=@treasure-ai/treasure-deck@2026.10.2 -- deck skill install "$skill_dir"
```

Read the resulting `<skill_dir>/treasure-deck/SKILL.md`. Use its syntax, layouts, themes, and slide-writing guidance. Load the same release's `docs/syntax.md`, `docs/editor.md`, or `docs/commands.md` from the installed package when more detail is needed. For npm-exec installs, resolve the `deck` executable inside npm's command environment to locate the package; do not assume it is installed globally.

`deck skill install` replaces `<destination>/treasure-deck`. Give it a fresh temporary directory, not its default `~/.claude/skills`, a workspace skill folder, or a marketplace cache. The temporary copy is reference material; do not register it as another skill. The Treasure Work workflow below governs location, preview, and handover.

## Create or edit the deck

1. Resolve the active workspace with `mcp__work__workspace_info`. Read source workspace documents through the workspace tools. Use supplied material and facts; ask only for missing information that changes the presentation's purpose or audience.
2. For a new deck, derive a short title slug and the user's current local date. Use matching folder and file names:

   ```text
   <workspace>/deck/YYYY-MM-DD-<title-slug>/YYYY-MM-DD-<title-slug>.md
   <workspace>/deck/YYYY-MM-DD-<title-slug>/images/
   ```

   Select an unused directory, appending `-2`, `-3`, etc. to the whole stem when needed. Keep folder and filename stems identical. Reserve that directory without replacing an existing one. Pass paths and titles as quoted arguments, not interpolated shell source.
3. Scaffold with the canonical CLI, passing an absolute folder path and `--title`. Default to `--theme treasure-ai` unless the user requests another theme. For example:

   ```sh
   npm exec --yes --package=@treasure-ai/treasure-deck@2026.10.2 -- deck new "/absolute/workspace/deck/2026-10-15-q4-review" --title "Q4 review" --theme treasure-ai
   ```

   The command creates the matching Markdown file and `images/`. Pass `--author` when the user supplies one; do not invent a presenter.
4. Replace the starter content with the planned story using the engine's skill. For a blank starter request, keep a short working example of title/content/columns/notes. Put unsupported details in speaker notes as `TODO:` rather than inventing facts. Keep media paths relative to the Markdown file.
5. For an existing deck, read its sources first and edit in place, preserving its theme, tone, and structure. Keep decks under `presentations/`, `decks/`, or other folders where they are. Edit raw Markdown; do not round-trip slide delimiters or frontmatter through a generic rich-text editor.

## Show the live editor

1. Use a trusted local deck. The engine can read referenced parts, custom themes, and media outside the deck directory; this is not a filesystem sandbox. Confirm trust before starting an unfamiliar downloaded deck.
2. Reuse a healthy editor started for this exact absolute source path in this conversation. Otherwise launch:

   ```sh
   npm exec --offline --yes --package=@treasure-ai/treasure-deck@2026.10.2 -- deck editor "/absolute/path/to/deck.md" --no-open
   ```

   Use the shell tool's managed background/long-running mode and retain its process handle. Launch from a trusted directory with only runtime essentials in the child environment (PATH, home, temp, and required OS variables), not account, model, or connector credentials. The package is already cached by the skill-loading step.
3. Wait for startup and capture the actual `http://127.0.0.1:<port>/` URL. Check that it serves the intended deck before opening it. Ports can change; do not assume 4300 or reuse an unrelated server merely because it responds. `deck editor --no-open` binds locally; plain `deck dev` exposes a LAN preview and is not this workflow.
4. Call `mcp__work__open_browser` with that URL. This opens Treasure Work's existing right-dock Browser; `open_file` or a static document preview does not provide the live editor. Keep the main conversation available and let the user widen the dock if needed.
5. Leave the editor running for the user. Switching dock tabs is not a request to stop it. Reuse the owned process for further edits; the engine watches the Markdown. Stop only processes you started when the user asks or startup fails. Report that a closed session/restart may require launching it again; this skill does not add an app-managed server lifecycle.

The editor provides thumbnails, layout/theme pickers, formatted/Markdown editing, autosave, and undo. Its Preview action opens `/present` for presenting. Let these controls teach the syntax rather than duplicating the editor or sending a long syntax tutorial by default.

## Validate and hand over

- Fix syntax/build errors reported by the editor. When a Chrome-compatible executable is available, use `deck check <absolute-file> --snapshots <temporary-directory>` through the same pinned CLI and follow the engine's verification workflow. Do not install a browser automatically; if checks cannot run, say layout validation was skipped and why. A successful server start or HTTP check is not a rendered-layout check.
- Return the workspace-relative Markdown path and the live editor URL. Briefly mention the Markdown view, layout picker, and Preview action; call out unresolved TODOs or skipped checks.
- Keep publishing and exports separate from local editing. `deck build` HTML includes analytics; PDF/check require a separate Chrome-compatible executable. Perform an export or publication only when requested, explain its requirements, and use the format-specific skill for PowerPoint or Google Slides.

## Examples

- **“Turn this note into six Markdown slides.”** Load the canonical skill, create `deck/<today>-<title>/<today>-<title>.md`, draft from the note, and open the live editor with `open_browser`.
- **“Update the comparison slide in presentations/launch/slides.md.”** Read and edit that file in place, keep its folder, and reuse or start its editor. Do not create a new dated deck.

## Troubleshooting

- **npm/package unavailable:** report the install error without changing the release, adding workspace dependencies, or falling back to an unverified CLI. Keep any existing source untouched.
- **Server exits or port is occupied:** inspect startup output, stop only the failed owned process, retry on an available port, and open the URL actually reported. Do not kill the process occupying someone else's port.
- **Concurrent edits conflict:** reread the latest Markdown and reconcile the intended change; do not overwrite the engine's expected-text conflict protection.
- **Browser tool unavailable:** provide the ready loopback URL as a fallback and state that opening the embedded Browser was not completed.
