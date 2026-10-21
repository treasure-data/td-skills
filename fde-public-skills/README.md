# FDE Public Skills

Setup skills for Treasure AI Studio, maintained by the Treasure AI (TAI) FDE Team. One plugin, `fde-public-skills`, with seven skills in two folders:

| Folder | Skill | Sets up | Project agent |
|---|---|---|---|
| `ai-signals-skills/` | `fde-rfm` | RFM segmentation — ten customer segments from recency, frequency and monetary value | `rfm-agent` |
| | `fde-nbp` | Next Best Product — top product and category recommendations per customer | `nbp-agent` |
| | `fde-mta` | Multi-Touch Attribution — channel contribution with Markov, Shapley and standard models | `mta-agent` |
| | `fde-nba-scores` | Next Best Action — best time, channel and campaign per customer, engagement flags | `nba-scores-agent` |
| | `fde-classifier` | Propensity scoring — any yes/no outcome (lead scoring, churn, conversion, response) | `classifier-agent` |
| `custom-agent-skills/` | `fde-custom-audience-agent` | An audience and segment-analysis agent on any parent segment, evaluated with ten test prompts | `audience-agent` |
| | `fde-custom-dashboard-builder` | A custom HTML dashboard (new, or from a `.dash` export, HTML file or screenshot) | `<project>-dashboard` |

```
/plugin install fde-public-skills@td-skills
```

Start a setup in a Work Folder — e.g. *"Set up RFM segmentation"* or *"Build a custom sales dashboard"*. Each setup skill copies its templates into the Work Folder, writes engagement files to `agent_outputs/<project>/` and installs the project's own agent in `.claude/skills/`, which then answers questions about the results. See `ai-signals-skills/README.md` for the AI Signals phase flow.

Uses `tdx-skills` and `sql-skills` from this marketplace. Treasure AI Studio documentation: https://docs.treasure.ai/products/ai-studio/overview
