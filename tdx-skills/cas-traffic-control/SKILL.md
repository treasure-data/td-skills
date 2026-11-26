---
name: cas-traffic-control
description: Journey Traffic Control on composable audiences with `tdx cas traffic-control` — priority groups that cap how many journeys one profile can be in at once, journey priority order inside a group, the Traffic Control schedule, and last-cycle status with currently-in and excluded counts. Use only for Traffic Control, priority groups, or journey caps. For composable audiences, child segments, activations, or journey authoring use the cas skill. Does not run cycles, launch or resume journeys, or activate audiences.
---

# tdx Composable Traffic Control

A priority group caps how many of its journeys one profile can be in at the same time. Each composable audience has one schedule that runs its priority groups. Use `tdx cas traffic-control` to inspect or change groups and the schedule, or to read the last cycle and its counts.

Out of scope: running a cycle, launching or resuming journeys, and activating audiences. Do not do these to "test" a configuration change.

## Check availability and scope

1. Run `tdx --version` and `tdx cas --help`. Confirm `traffic-control` is listed before you run its subcommands; an unknown subcommand can print the parent help instead of an error. If it is missing, stop and report that the installed tdx does not include composable Traffic Control. Do not install or switch builds.
2. Use the current profile. Do not switch or override it. Pass the exact composable audience name as `--audience` on every command; without it the audience comes from context, which may be wrong. Address a group by ID when its name is ambiguous.
3. Tell errors apart from empty results:
   - **Sign-in error** (401, or 400 `API Key isn't set on the request`): report it and point the user to `tdx auth setup`.
   - **Permission denied** (403): the user lacks access to the audience or feature. Do not work around it.
   - **Feature unavailable**: `Traffic Control resource not found. Composable Traffic Control may be unavailable for this audience, or you may not have access to it.` Report both possibilities; do not call it an empty result.
   - **Wrong target**: `SEGMENT_NOT_FOUND` means the audience name did not match; `Priority group not found` means the group name or ID did not match.
   - **Empty list**: the call succeeded and there are no groups.

   Do not fall back to raw `tdx api` calls or to Complete CDP `tdx journey` commands.

## Inspect without writing

```bash
tdx cas traffic-control group list --audience "QA Audience" --json
tdx cas traffic-control group view "Promo cap" --audience "QA Audience" --json
tdx cas traffic-control schedule view --audience "QA Audience" --json
tdx cas traffic-control status --audience "QA Audience" --from 2026-11-01 --to 2026-11-07 --json
```

- `group view <group>` takes a name or ID. `group list [keyword]` is meant to match group or journey names, but the server may ignore the keyword and return every group; check names or IDs in the output yourself.
- `group list`, `group view`, and `status` accept `--from` and `--to` (`YYYY-MM-DD`, `--to` inclusive) to filter counts by date. They do not turn `status` into a cycle history; it always shows the last cycle.
- Use `--yaml` on `group view` or `schedule view` to get a file that `group update -f` or `schedule set -f` accepts.

### Report status honestly

- Report the last cycle's `sessionTime`, `executionStatus`, and `reportingStatus` as separate facts.
- `reportingStatus: pending` means counts are still arriving. Say counts are not ready, not that nobody was excluded. No previous cycle (`lastCycle: null`) is its own state.
- For each visible member, report `currentlyInCount`, `excludedCount`, and `countsAsOf` when present. Counts can exist with `lastCycle: null`; they are as of `countsAsOf`, not current.
- Never turn a missing count into zero. Never sum counts across groups or members as unique profiles; one profile can be in several journeys and groups.
- Members returned as `invisible: true` have no name. Keep them hidden. Do not look up or guess their names from other sources.

## Prepare a change

Always read the current group or schedule first.

### Group YAML

```yaml
name: Promo cap
capping: 1
enabled: false
journeyBundles: # priority order, highest first
  - id: '10'
  - id: '11'
```

- `capping` is a positive integer smaller than the number of members (a 2-member group allows only `capping: 1`). `enabled` is a Boolean. Create groups disabled unless the user asks to enable them.
- `journeyBundles` has 2–20 distinct members in priority order. Use real, visible journey bundle IDs from the target audience (from `group view --yaml` or the user); do not reuse the example IDs or guess IDs from names.
- For `group update`, start from `group view --yaml`, edit it, and send the whole file. The server replaces the group, so a file with only the changed field fails with `name can't be blank` and `must have at least 2 journey bundles`. `journeyBundles` is the full ordered membership.
- `group update` rejects a file that still contains a hidden (`invisible: true`) member, so you cannot update a group with hidden members. Do not drop hidden members to make the file pass. Ask the user for someone with access instead.

### Schedule YAML

```yaml
scheduleType: daily
scheduleOption: '09:00:00'
timezone: America/Los_Angeles
```

- `scheduleType`: `none`, `hourly`, `daily`, `weekly`, or `monthly`. Fields you leave out keep their saved value.
- Quote `scheduleOption`: hourly `MM:SS` (`'30:00'`), daily `HH:MM:SS`, weekly `Mon,HH:MM:SS`, monthly `D,HH:MM:SS`.
- `timezone` is an IANA name such as `America/Los_Angeles`.
- `none` is rejected while an enabled priority group has members.
- `schedule set` republishes the audience workflow and changes future cycles. It does not start a cycle.

Check a schedule without saving it:

```bash
tdx cas traffic-control schedule validate --audience "QA Audience" --type daily --option 09:00:00 --timezone America/Los_Angeles
```

## Preview, confirm, apply, verify

1. **Preview.** Run the write with `--dry-run`:

   | Change           | Command (always add `--audience "<name>"`)                  |
   | ---------------- | ----------------------------------------------------------- |
   | Create           | `tdx cas traffic-control group create -f group.yml`         |
   | Update           | `tdx cas traffic-control group update "<group>" -f group.yml` |
   | Duplicate        | `tdx cas traffic-control group duplicate "<group>" --name "<copy>"` |
   | Enable / disable | `tdx cas traffic-control group enable "<group>"` / `tdx cas traffic-control group disable "<group>"` |
   | Delete           | `tdx cas traffic-control group delete "<group>"`            |
   | Save schedule    | `tdx cas traffic-control schedule set -f schedule.yml`      |

   Dry-run and `schedule validate` check members, priorities, that the cap is a positive integer, schedule option, and timezone locally and send no write. They do not check that the cap is below the member count. The API has no validate endpoint, so a pass does not prove write permission, member visibility, or server acceptance. Create dry-run does not resolve the audience; confirm it exists with a read first.

2. **Confirm.** State the profile, audience, exact group or schedule, and the before → after effect (for schedules, that the audience workflow is republished). Wait for the user's explicit confirmation. For a preview-only request, stop here and report `not applied`. A CLI confirmation prompt does not replace this step. Use `--yes` only for a deletion the user approved when the run is non-interactive.

3. **Apply and verify.** Re-run the approved command without `--dry-run`. Read back with `group view` (after delete it must return `Priority group not found`) or `schedule view`, and report what changed. If a write errors or times out, read back before retrying, especially for create and duplicate, to avoid duplicates. Report unverified changes as unverified.

## MCP

Over MCP (`tdx_run`) only `group list`, `group view`, `schedule view`, `schedule validate`, and `status` run. All writes are blocked there, including with `--dry-run`. Use the CLI for write previews and confirmed changes.

## Examples

- **"Why are the excluded counts blank?"** Run `status --json`. Report the audience, date filter, last cycle time, execution and reporting status, and visible counts with `countsAsOf`. If reporting is pending, say the counts are not ready yet.
- **"Change Promo cap to 2."** Read the group with `group view --yaml`, check it has at least 3 members, change only `capping` in that file, dry-run `group update`, and report `1 → 2`, membership unchanged, `not applied`. Apply only after confirmation, then read back.
- **"Check a daily 9 a.m. Pacific schedule without changing it."** Run `schedule validate` with `America/Los_Angeles`. Report the result, what it does not check, and `not applied`.
