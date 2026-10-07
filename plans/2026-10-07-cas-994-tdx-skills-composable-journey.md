---
status: in-review
pr: https://github.com/treasure-data/td-skills/pull/216
---

# CAS-994: Update tdx-skills for composable journey list/view/pull/push

## Goals

- `tdx-skills:cas` and `tdx-skills:journey` currently say nothing about composable journeys, so an
  agent working a composable (CDW-backed) audience's journeys has no guidance and no reason not to
  reach for the complete-only `tdx journey` commands, which simply fail (`SEGMENT_NOT_FOUND`) on a
  composable audience name.
- CAS-520 (tdx PR [#3311](https://github.com/treasure-data/tdx/pull/3311), not yet merged to tdx
  `main`) and CAS-985 (tdx PR #3325, merged into the CAS-520 branch) ship `tdx cas journey list`,
  `view`, `pull`, and `push`. This change teaches the two skills the new surface before it reaches
  users, matching the committed CLI and the `tdx` docs already staged on the CAS-520 branch.

## Background

- `tdx-skills:cas` documents `tdx cas` for composable (zero-copy) audiences/segments/activations
  but has no journey section.
- `tdx-skills:journey` documents `tdx journey {pull,push,validate,pause,resume,view}` without
  qualification. Per the CAS-978 decision (16–17 Sep), composable stays under `tdx cas` until the
  core `tdx journey` commands reach parity — `tdx journey push` now refuses a composable audience
  outright, pointing at `tdx cas journey push` instead.
- Source of truth for this note: the `tdx` CLI registration
  (`src/cli.ts`, `cas:journey:{list,view,pull,push}`), the command implementations
  (`src/commands/cas-journey-command.ts`), the SDK guard error codes (`src/sdk/errors.ts`:
  `JOURNEY_FOLDER_REQUIRED`, `JOURNEY_MULTI_VERSION_UNSUPPORTED`,
  `COMPOSABLE_JOURNEY_STAGE_ENTRY_CRITERIA`), and the staged `docs/commands/cas.md` /
  `docs/commands/journey.md` / `docs/guide/releases.md` on the CAS-520 branch — all read directly
  from a local tdx checkout, not reconstructed from memory.

## Design

**`tdx-skills:cas`** — add a `## Journeys` section (near the segment sections) covering:

- Commands and flags, matching `tdx cas journey --help` exactly:
  - `tdx cas journey list [pattern] [--audience <name>]`
  - `tdx cas journey view <name> [--audience <name>]`
  - `tdx cas journey pull [name] [--audience <name>] [--dir <dir>] [--dry-run]`
  - `tdx cas journey push [file] [--audience <name>] [--dir <dir>]` (push itself takes the global
    `--dry-run`/`-y, --yes`, same as `tdx cas push`)
- `--audience` falls back to the `composable_audience` session context (set by `tdx cas pull` or by
  `cas journey pull` itself); omit it only when that context is already set.
- File layout: `cas/<audience>/<folder path>/<name>.journey.yml`, sitting next to the audience and
  segment files `tdx cas pull` writes in the same tree. `tdx cas validate`/`push` skip `*.journey.yml`
  files — they belong to `cas journey push`.
- Push behavior: never deletes — a server journey with no local file is reported, not removed.
  Idempotent by name like `tdx cas push`. An unsupported-feature rejection from the server can land
  mid-write (folder/journey/segments/activation already created); fix the YAML and push again, which
  reuses what exists rather than duplicating it.
- Composable journey constraints, each a pre-write, `--dry-run`-visible guard:
  - Account enablement: journey orchestration must be enabled for the composable account; reported
    as a clear message, not a raw error.
  - One definition, not versions: a file with more than one `journeys:` entry is refused
    (`JOURNEY_MULTI_VERSION_UNSUPPORTED`); the journey's name comes from the file's top-level `name`,
    not a `version:` label.
  - No independent entry criteria after stage 1: only the first stage sets `entry_criteria`; later
    stages are entered by reaching the previous stage's `milestone`, and stating anything else on a
    later stage is refused (`COMPOSABLE_JOURNEY_STAGE_ENTRY_CRITERIA`) — fix is to adjust the
    previous stage's milestone, not the later stage.
  - A journey needs a folder; a composable audience with no root folder refuses the push outright
    (`JOURNEY_FOLDER_REQUIRED`).
- A `Related Skills` cross-link to `journey` for YAML authoring (the 5-step build process and
  template files are unchanged and reused as-is for composable journeys).

**`tdx-skills:journey`** — add a short note (near the top, by the existing Prerequisites/Commands
section) stating:

- The commands on this page (`tdx journey ...`) work with **complete** audiences only.
- A composable audience's journeys are pulled/pushed with `tdx cas journey pull`/`push` — same YAML
  format, same 5-step build process in this skill — and `tdx journey push` refuses a composable
  audience and points at `tdx cas journey push`.
- Pointer to `tdx-skills:cas`'s new Journeys section for the composable command reference and
  constraints, so this skill doesn't duplicate them.

No change to the 5-step build process, templates, or analysis workflow — those apply to both kinds
of audience; only the pull/push/list/view entry points differ.

## Alternatives and Why Not?

- **Merge composable journey docs entirely into `tdx-skills:journey`.** Rejected: `tdx-skills:cas`
  already owns every other composable command and its constraints (connection resolution, drift
  guards, etc.); splitting journeys out to `journey` would scatter composable guidance across two
  skills with no single place to look, and would duplicate the account-enablement/one-version/
  stage-entry-criteria constraints the agent needs regardless of which skill triggered.
- **Wait for tdx PR #3311 to merge before touching td-skills.** Rejected: CAS-994 is scoped to land
  the skill update now, verified against the actual committed branch rather than the PR description
  alone; the commands, flags, and constraints documented here are already final on the CAS-520
  branch (post `main`-merge with CAS-985), not speculative.
