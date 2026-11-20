# Output Patterns — AI Voice Analysis

Detailed definitions of analytical primitives and composition examples for §5 of SKILL.md.

## Analytical primitives

**Chronological reconstruction** — Order events and statements by time; preserve recording IDs and dates; keep contradictions visible. Do not smooth over conflicting accounts; note them explicitly.

**Commitment and agreement extraction** — Capture explicit requests, proposals, and commitments with owner, due date, and evidence anchor. Mark inferred items as such. Distinguish "said they would" from "agreed together."

**Status snapshot** — "As of the latest reviewed conversation [date]" for an entity (customer, deal, case, project). Not live external-system state. Distinguish latest recording found from latest transcript fully reviewed.

**Open items and next steps** — Unresolved items, upcoming deadlines, suggested follow-ups. A later conversation's silence does not close an open issue. Keep open until explicit resolution evidence appears.

**Theme clustering** — Plain-language themes with reviewed-recording count per theme and denominator. Frequency within the reviewed set only, not market or company-wide prevalence. Multiple mentions in one recording count once per theme.

**Role and claim separation** — Keep each side's statements distinct. Separate stated need, usage context, proposals, and commitments — they carry different evidential weight. Do not infer emotion, intent, or performance from speaking style. Counterpart statements stay separate from internal opinion and proposed solutions.

## Composition patterns

### Activity report (daily / weekly / team)
Primitives: Chronological + Commitment extraction + Open items
- Sections: Activities, Outcomes/Decisions, Open items, Next steps
- Separate completed work from promises to do work
- Attribute personal work only when participation is supported by evidence

### Manager report
Primitives: Chronological + Commitment extraction (across a group) + Open items
- Lead with material progress, stalled items, decisions or support needed
- Group by customer, project, or team
- Do not rank individual performance or invent a rubric
- Distinguish recorded activity from all organizational activity

### Entity history and status (customer / deal / case / project)
Primitives: Chronological + Status snapshot + Open items
- Concise chronological history, then needs / progress / open issues / next steps with owners and dates when stated
- Label status "as of the latest reviewed conversation [date]", not live CRM state
- Later explicit evidence updates earlier items; silence does not close open issues
- Preserve unresolved contradictions

### Follow-up message draft
Primitives: Role and claim separation + Commitment extraction
- Classify counterpart type: external customer/prospect, partner/vendor, internal, unknown; ask only if ambiguity materially changes the message
- One subject and one usable draft
- Separate counterpart requests, our proposals, and explicit agreements/commitments
- Use placeholders for missing names or sender details when a useful draft is still possible
- Never invent recipients, attachments, pricing, dates, or promises
- A draft is not a send, an external draft save, or a CRM update

### Theme or feedback summary
Primitives: Theme clustering + Role and claim separation
- Group into plain-language themes: stated problem, usage context, need/request, impact described, supporting evidence
- Keep counterpart feedback separate from internal opinions and proposed solutions
- Count unique reviewed recordings per theme, with a denominator; multiple mentions in one recording count once
- Describe frequency within the reviewed set, not market prevalence
- Label suggested priorities as recommendations, not measured demand

### Cross-entity or cross-team summary
Primitives: Theme clustering + Status snapshot per item + Open items
- Do not rank individuals or invent a rubric
- Distinguish recording activity from all organizational activity

## Notes

For an objective not listed here, adapt the same primitives. Name the selected primitives in a short preamble so the user can refine the approach.
