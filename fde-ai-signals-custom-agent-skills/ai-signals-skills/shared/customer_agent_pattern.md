---
name: shared-customer-agent-pattern
description: |
  Generic mechanics for turning a solution's agent template (`project_templates/agent_template/`) into a project-specific Claude skill in the Work Folder's `.claude/skills/<agent-name>/`: name gate, placeholder filling, hands-on build vs. final, interim and final guides, git-ignore guard, verification. The solution's `references/agent-setup.md` supplies the "what". Used by every solution under ai-signals-skills/.
---

# Shared: Customer Agent Pattern

Each solution ships a **blueprint** of its analysis agent in `<solution_dir>/project_templates/agent_template/`. It is never used directly. During an engagement it is copied into the user's Work Folder as the project's own skill:

```
<working directory>/.claude/skills/<agent-name>/
├── SKILL.md          # from agent_template/SKILL.template.md, placeholders filled
├── .gitignore        # "*" — the agent holds customer context; never committable
└── references/       # template references + business-context.md + ai-signals-guide.md + guides (Phase 4/5) + finalize-time files
```

A skill in the Work Folder's `.claude/skills/` is loaded in every chat in that folder (Treasure AI Studio lists it under the folder's Actions and Skills; in Claude Code it is a project skill). It can later be shared to the account with Studio's Develop → Share — keep every file ≤ 1 MB.

The solution's `references/agent-setup.md` lists the placeholders, the extra files to add, and solution-specific checks.

## When

| Stage | When | Steps | Result |
|---|---|---|---|
| **Hands-on build** | Phase 4 Part A — after the first validated run, if the user chose the hands-on kit | 1–3, then 4 (interim) if the guides were chosen | Agent queries the real output tables and builds dashboards; the interim guides explain the setup so far to testers |
| **Finalize** | Phase 5, after the documentation set is written and the business context is confirmed | 2–3 (refreshed business context), 5, then 4 (final) if the user agrees | Agent carries the confirmed business context and runbook; the guides describe the production setup |

Re-run Steps 2–3 (and refresh the guides with Step 4) whenever the workflow config, business context or docs change materially.

## Step 1: Agent name (first build only)

The name is `<project_slug>-agent` (e.g. `rfm-agent`, `loyalty-rfm-agent`), fixed by the project name chosen at the start — do not ask again. Only if `.claude/skills/<name>/` already exists for a different project, say so and ask for another name (lowercase letters, digits, hyphens). Record the name in `project_state.md`.

## Step 2: Build the agent in a staging folder

Never copy an unfilled template into `.claude/skills/` — anything there is live immediately. Build it yourself, not through a subagent; tell the user first that the build takes a few minutes.

```bash
stage="agent_outputs/<project_slug>/agent_build/<agent-name>"
mkdir -p "$stage"
cp -R "<solution_dir>/project_templates/agent_template/." "$stage/"
mv "$stage/SKILL.template.md" "$stage/SKILL.md"
rm -f "$stage"/references/*.template.md   # skeletons — guides filled in Step 4, business context below; never installed unfilled
cp "agent_outputs/<project_slug>/business-context.md" "$stage/references/business-context.md"
[ -f "<solution_dir>/references/ai-signals-guide.md" ] && cp "<solution_dir>/references/ai-signals-guide.md" "$stage/references/"
```

`business-context.md` is the engagement copy drafted in Phase 1 (playbook) — copy it as it is, markers included: they tell the agent which definitions are still unconfirmed. If it does not exist yet, draft it first (playbook, Phase 1 business context steps 2–3). `ai-signals-guide.md` is copied unchanged.

Fill every `{{placeholder}}` in the **`.md` files** of `$stage` (Edit/Write tools) from `project_state.md`. Find them with `grep -rn --include='*.md' '{{' "$stage"` and edit only those lines — don't read the whole files. Never read or edit scripts or HTML (`*.js`, `*.html`, …): they are copied verbatim and their `{{…}}` tokens are runtime tokens filled by the script itself. At minimum:

| Placeholder | Value |
|---|---|
| `{{agent_name}}` | confirmed agent name (also the frontmatter `name:`) |
| `{{project_name}}` / `{{project_slug}}` | project display name / slug (`local_outputs.md` Step 2) |
| `{{sink_database}}` | confirmed sink database (output tables live here) |
| `{{engagement_dir}}` | `agent_outputs/<project_slug>` |

plus the solution-specific placeholders in `references/agent-setup.md`. Then check none remain:

```bash
grep -rn --include='*.md' '{{' "$stage" && echo "UNFILLED PLACEHOLDERS — fix before installing"
```

## Step 3: Install

```bash
mkdir -p .claude/skills
rm -rf ".claude/skills/<agent-name>.new" && cp -R "$stage" ".claude/skills/<agent-name>.new"
printf '*\n' > ".claude/skills/<agent-name>.new/.gitignore"
rm -rf ".claude/skills/<agent-name>" && mv ".claude/skills/<agent-name>.new" ".claude/skills/<agent-name>"
```

## Step 4: Workflow guide and setup walkthrough (interim in Phase 4, final in Phase 5)

Run only when the user chose the guides (Phase 3 end question, or Phase 5 final question).

| File | Built from | Answers |
|---|---|---|
| `references/workflow-guide.md` | `agent_template/references/workflow-guide.template.md` | How the deployed workflow works end to end (pipeline, config, mappings, customizations, output tables) |
| `references/model-setup-walkthrough.md` | `agent_template/references/model-setup-walkthrough.template.md` | What was decided and done during setup (discovery, requirements, decision log, cleaning, validation baseline, artifacts, presentation recipe, accuracy rules) |

Write the guides yourself (no subagents), and only in `$stage/references/` — never a second copy in the engagement folder. Tell the user first that the guides take a few minutes. To fill a skeleton: copy it from `<solution_dir>` (not from the installed agent — it does not contain it) to `$stage/references/<name>.md`, follow its build instructions, replace every `<!-- fill … -->` block with content, and delete the build-instructions comment. Sections with nothing to report yet (e.g. Parent Segment before Phase 5) say "Not done yet — Phase 5". Set the **Status** line:

- **Interim** (Phase 4): `Interim — pre-production, as of <date>`. Describes the setup as deployed so far, including assumed defaults still to be confirmed.
- **Final** (Phase 5): `Final — production, as of <date>`. Update the existing files in place (keep the Decision Log history), or create them if they were never built.

Check nothing is left, then repeat Step 3:

```bash
grep -rln '<!-- fill\|Build instructions' "$stage/references" && echo "UNFILLED SKELETON — fix before installing"
```

Refresh `workflow-guide.md` whenever the workflow config or `.dig` files change, and append to the walkthrough's Decision Log and Accuracy Rules whenever the setup changes or a pitfall is found.

## Step 5: Finalize (Phase 5)

Add the customer files listed in `references/agent-setup.md` (Finalize) to the staging folder, update `SKILL.md`'s file list, then repeat Steps 2 (placeholder check) and 3. Every solution adds at least `references/runbook.md` (from `docs/`); the confirmed `business-context.md` comes in through Step 2. Then ask about the final guides (Step 4).

## Step 6: Verify and report

- Frontmatter `name:` equals the folder name; `description` names the customer and the solution's trigger phrases.
- No `{{` placeholders in `.md` files; after finalize, no `[NEEDS YOUR INPUT]` in `references/business-context.md`; no `*.template.md` file and no `<!-- fill` block in `references/`; every file the `SKILL.md` references exists (except the guides and finalize-time files not built yet, which `SKILL.md` handles as missing); no file > 1 MB.
- `git check-ignore -q .claude/skills/<agent-name>/SKILL.md` succeeds when the working directory is a git repo.
- The solution's build checks in `references/agent-setup.md`. Run no checks beyond these — no screenshots, browser tests or extra QA scripts.

Tell the user the agent name and path, that it is available in new chats in this folder, and (Studio) that it can be shared to the account via Skills → Develop. Then show the **agent files** table from the solution's `references/agent-setup.md` (only the files this build contains) and a starter prompt. Update `project_state.md`.
