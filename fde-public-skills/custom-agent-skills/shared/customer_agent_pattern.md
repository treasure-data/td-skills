# Shared: Customer Agent Pattern

Each solution ships a **blueprint** of its agent in `<solution_dir>/project_templates/agent_template/`. It is never used directly. During an engagement it is copied into the user's Work Folder as the project's own skill:

```
<working directory>/.claude/skills/<agent-name>/
├── SKILL.md          # from agent_template/SKILL.template.md, placeholders filled
├── .gitignore        # "*" — the agent holds customer context; never committable
└── references/       # template references + business-context.md + data-dictionary.md + finalize-time files
```

A skill in the Work Folder's `.claude/skills/` is loaded in every chat in that folder (Treasure AI Studio lists it under the folder's Actions and Skills; in Claude Code it is a project skill). It can later be shared to the account with Studio's Develop → Share — keep every file ≤ 1 MB.

The solution's `references/agent-setup.md` lists the placeholders, the extra files to add, and solution-specific checks.

## When

| Stage | When | Steps |
|---|---|---|
| **Build** | Phase 3, after the business context and data dictionary are drafted | 1–3, 5 |
| **Rebuild** | Phase 4 after approved fixes; after the customer's answers are merged; after a data-source change | 2–3, 5 |
| **Finalize** | Phase 5, after the production bar is met and the business context is confirmed | 2–3, 4, 5 |

## Step 1: Agent name (first build only)

The name is `<project_slug>-agent` (e.g. `audience-agent`, `loyalty-audience-agent`), fixed by the project name chosen at the start — do not ask again. Only if `.claude/skills/<name>/` already exists for a different project, say so and ask for another name (lowercase letters, digits, hyphens). Record the name in `project_state.md`.

## Step 2: Build the agent in a staging folder

Never copy an unfilled template into `.claude/skills/` — anything there is live immediately. Build it yourself, not through a subagent.

```bash
stage="agent_outputs/<project_slug>/agent_build/<agent-name>"
if [ ! -d "$stage" ]; then
  mkdir -p "$stage"
  cp -R "<solution_dir>/project_templates/agent_template/." "$stage/"
  mv "$stage/SKILL.template.md" "$stage/SKILL.md"
fi
rm -f "$stage"/references/*.template.md   # skeletons — their engagement copies are copied in below
cp "agent_outputs/<project_slug>/business-context.md" "agent_outputs/<project_slug>/data-dictionary.md" "$stage/references/"
```

On a **rebuild** the staging folder already exists: keep its `SKILL.md` (it may hold approved Phase 4 fixes) and only refresh the context files with the last line. Rebuild from the template (`rm -rf "$stage"` first) only when the user asks to pick up a newer plugin template — then re-apply the fixes recorded in `eval.md`.

The context files are the engagement copies from Phase 2 — copy them as they are, markers included: they tell the agent which definitions are still unconfirmed.

Fill every `{{placeholder}}` in the **`.md` files** of `$stage` (Edit/Write tools) from `project_state.md`. Find them with `grep -rn --include='*.md' '{{' "$stage"` and edit only those lines. At minimum:

| Placeholder | Value |
|---|---|
| `{{agent_name}}` | confirmed agent name (also the frontmatter `name:`) |
| `{{project_name}}` / `{{project_slug}}` | project display name / slug (`local_outputs.md` Step 2) |
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
[ -d ".claude/skills/<agent-name>" ] && mv ".claude/skills/<agent-name>" "agent_outputs/<project_slug>/agent_build/<agent-name>.prev-$(date +%Y%m%d%H%M%S)"
mv ".claude/skills/<agent-name>.new" ".claude/skills/<agent-name>"
```

The previous install is kept in the staging area (never deleted in place), so a rebuild can be rolled back.

## Step 4: Finalize (Phase 5)

Add the files listed in `references/agent-setup.md` (Finalize) to the staging folder, update `SKILL.md`'s file list, then repeat Steps 2 (placeholder check) and 3. The confirmed `business-context.md` comes in through Step 2 — after finalize it must hold no `[NEEDS YOUR INPUT]`.

## Step 5: Verify and report

- Frontmatter `name:` equals the folder name; `description` names the project and the solution's trigger phrases.
- No `{{` placeholders in `.md` files; no `*.template.md` file in `references/`; every file the `SKILL.md` references exists; no file > 1 MB. After finalize: no `[NEEDS YOUR INPUT]` in `references/business-context.md`.
- `git check-ignore -q .claude/skills/<agent-name>/SKILL.md` succeeds when the working directory is a git repo.
- The solution's build checks in `references/agent-setup.md`. Run no checks beyond these.

Tell the user the agent name and path, that it is available in new chats in this folder, and (Studio) that it can be shared to the account via Skills → Develop. Then show the **agent files** table from the solution's `references/agent-setup.md` and a starter prompt. Update `project_state.md`.
