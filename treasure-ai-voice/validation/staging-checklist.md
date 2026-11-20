# Staging evidence for the nine AI Voice starter skills

This file defines the remaining platform checks. It is not a staging sign-off. Local renderer tests, SQLite query tests, and routing/model-only checks do not prove which data Studio or Work retrieves.

Use a synthetic export or synthetic recordings. Record the exact candidate commit, surface/build, model, runtime principal/role, fixture version, scenario, expected result, actual result, pass/fail, and sanitized evidence link. Do not copy real transcripts, customer identifiers, or credentials into the public PR.

| ID | Surface and role | Scenario | Required evidence | Staging status |
|---|---|---|---|---|
| P01 | AI Studio, ordinary authorized user | Own weekly activity for a manager vs. one deal's status/history | Daily-report and analysis selected respectively; actual connector calls and output coverage | Not run for this revision |
| P02 | AI Studio, disconnected/denied connector | Request minutes, activity report, or follow-up | Correct connection/access message; no credential prompt or silent broader-source read | Not run for this revision |
| P03 | AI Studio, non-admin | Ask for team/organization coverage | Own-list default; no inference of admin status from a list response; unsupported coverage stated; actual response fields recorded | Not run for this revision |
| P04 | AI Studio, authorized user | Follow-up email from a synthetic meeting | Text subject/body only; zero send, Gmail draft, CRM, or calendar calls | Not run for this revision |
| P05 | Synthetic TD export via Studio | Table guide previews A/B; user selects A | Preview returns no transcript, summary, action-item, or inferred-title fields; every later content query/response excludes B | Not run for this revision |
| P06 | Synthetic TD export via Studio | Meeting digest previews A/B; user selects A | Same pre-fetch scope proof for summaries, actions, and transcripts; period alone does not bypass confirmation | Not run for this revision |
| P07 | Synthetic TD export via Studio | Blank creators and reassigned device | Unknown creator bucket stays separate; known-person count excludes it; device current assignment does not rewrite history | Not run for this revision |
| P08 | Treasure Work, ordinary authorized and disconnected users | Connector selection/read, non-admin behavior, and missing connection | Actual Work connector schema/call trace; same access/selection behavior; precise coverage | Not run for this revision |
| P09 | Supported surfaces, Japanese and English | Representative output per skill | Complete visible deliverable and chat in requested language, with marked original-source quotations/proper names allowed; no empty/error response recorded as pass | Not run for this revision |

## Result record template

```yaml
commit: <exact candidate commit>
surface: <AI Studio or Treasure Work, with build>
model: <model identifier>
role: <synthetic staging role, no real user identifier>
fixture: <synthetic fixture version>
scenario: <P01-P09 and corresponding skill test.yml name>
expected: <measurable expected behavior>
actual: <observed behavior>
result: <pass, fail, or not_run>
evidence: <sanitized trace location>
```

The reviewer decides whether any missing check can be deferred; a local pass is not a replacement for that decision. Preserve the exact tested commit when reporting results, or rerun the affected paths after changes.

The owner recorded in each skill is the confirmed JP SA team. Public bug/request contact is this repository's GitHub Issues, with PM accountability documented in the plugin README. No unconfirmed personal owner or email has been invented.
