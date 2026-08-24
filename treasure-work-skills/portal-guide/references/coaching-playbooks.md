# Portal — coaching playbooks

Load this at Step 1 of coaching a first portal, or whenever the user asks "what should I
put in mine." Map their words to the closest blueprint below, substitute their actual
names/tools, and present as the Step 2 table in `SKILL.md`. These are starting points,
not a script — swap freely once the user reacts.

Card labels can be Japanese; keep `department` in plain ASCII words since it feeds the
exported filename.

## CSM (Customer Success Manager)

| Group | Card | Action | Prompt / notes |
|---|---|---|---|
| My accounts | `<Customer> weekly check` | `Prompt` | "Summarize <Customer>'s last 7 days: workflow runs, support tickets, and data ingestion. Call out anything anomalous, then list up to 3 follow-ups." |
| My accounts | Renewals ≤ 90 days | `Prompt` | "List my assigned accounts renewing in the next 90 days, sorted by date, with current health score." |
| My accounts | Health check | `Prompt` | "Show health scores for all my assigned accounts, sorted ascending. For any score below 50, explain the key risk factors." |
| Reports | Weekly summary | `Prompt` or `Skill` | "Generate a weekly summary of all my assigned accounts: key metrics, notable events, items needing attention." |
| Reports | Account dashboard | `App` | Points at the team's existing Superset/Looker CS dashboard |

## CRE (Customer Reliability Engineer)

| Group | Card | Action | Prompt / notes |
|---|---|---|---|
| Incidents | Open incidents | `Prompt` | "List open incidents for my accounts, sorted by severity, with time since last update." |
| Incidents | Workflow failures | `Prompt` | "Show workflow failures in the last 24 hours across my accounts, grouped by error type." |
| Ops | Daily health check | `Prompt` | "Check ingestion volume and error rates for my accounts over the last 24 hours, flag anything outside normal range." |
| Ops | Runbook lookup | `Skill` | Points at an installed runbook/workflow-debugging skill |

## PM (Product Manager)

| Group | Card | Action | Prompt / notes |
|---|---|---|---|
| Reports | Weekly usage summary | `Prompt` | "Summarize product usage trends for the last week: active users, top features, notable drop-offs." |
| Reports | Feature adoption | `Prompt` | "Show adoption rate for <feature> since launch, broken down by account segment." |
| Planning | Sprint report | `Skill` | Points at an installed sprint-report or release-notes skill |
| Dashboards | Metrics dashboard | `App` | Points at an existing BI dashboard |

## Sales / Account Executive

| Group | Card | Action | Prompt / notes |
|---|---|---|---|
| My pipeline | Deals closing this month | `Prompt` | "List my open deals closing this month with amount and stage." |
| My pipeline | Stale deals | `Prompt` | "Show my deals with no activity in the last 14 days." |
| Accounts | Account snapshot | `Prompt` | "Summarize <Account>: usage trend, support history, and open opportunities." |
| Dashboards | Pipeline dashboard | `App` | Points at an existing CRM/BI dashboard |

## Support

| Group | Card | Action | Prompt / notes |
|---|---|---|---|
| Queue | Open tickets by priority | `Prompt` | "List open support tickets sorted by priority and age." |
| Queue | SLA at risk | `Prompt` | "Show tickets approaching SLA breach in the next 4 hours." |
| Knowledge | Similar past tickets | `Skill` | Points at an installed ticket-search/knowledge skill |
| Reports | Weekly ticket summary | `Prompt` | "Summarize this week's tickets: volume, top categories, average resolution time." |

## Generic (doesn't fit a role above)

| Group | Card | Action | Prompt / notes |
|---|---|---|---|
| Quick tasks | Ask about my data | `Prompt` | Open-ended, phrased around whatever they mentioned wanting one click for |
| Quick tasks | Weekly recap | `Prompt` | "Summarize what happened in <area> this week." |
| Tools | Existing dashboard | `App` | Points at whatever BI page they already check manually |

## Writing a good `Prompt` card

A card's prompt is sent as-is, with no chance to add context afterward. Four rules:

1. **Self-contained.** No "as we discussed" or "the usual report" — the model sees only
   this prompt, fresh, every time.
2. **Name the data.** Say which accounts, which time range, which tables/metrics.
3. **State the output shape.** "Summarize in 3 bullets," "as a table," "flag anything
   above X."
4. **Stay under 4096 characters.** If the task needs more setup than that, it should be
   a `Skill` card instead — skills can carry much more instruction and can use tools.

Before / after:

- Weak: `ACME status`
- Good: `Summarize ACME Corp's last 7 days: workflow runs, support tickets, and ingestion
  volume. Call out anything anomalous, then list up to 3 follow-ups.`

- Weak: `weekly report`
- Good: `Generate a weekly summary for all my assigned accounts. Include key metrics,
  notable events, and items needing attention this week. Present as a short table
  followed by 2-3 sentences of narrative.`

## Sizing and structure

- **v1 target: 2 groups, 4–6 cards.** A bigger first portal takes longer to set up than
  most people will invest before giving up.
- **Split into a second Portal tab** only when the audience differs (e.g. a shared
  team portal alongside a personal one) — not just because the topic differs. Two tabs
  for one person to maintain is worse than one tab with two groups.
- **Move a card from `Prompt` to `Skill`** once its prompt keeps growing past a
  paragraph, or once it needs to read/write files or call tools — that's what skills are
  for.

## Anti-patterns

- **One card per customer at scale.** Ten customer-name cards is fine; forty is not — use
  a single `Skill` card with `Ask at run` args instead, so the user types the customer
  name once per click instead of maintaining forty cards.
- **A card that's not faster than typing.** If clicking the card and then still having to
  type extra detail takes longer than just typing the whole prompt, the card isn't
  earning its place.
- **Empty descriptions.** The description is what reminds the *owner* what the card does
  three months later — always write one, even a short one.
