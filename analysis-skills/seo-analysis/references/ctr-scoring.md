# SERP Feature CTR Impact Scoring

Calculate expected vs actual CTR to distinguish content problems from SERP feature absorption.

## Position-Based Baseline CTR

| Position | Baseline CTR |
|----------|-------------|
| 1 | 28% |
| 2 | 15% |
| 3 | 11% |
| 4 | 8% |
| 5 | 7% |
| 6 | 5% |
| 7 | 4% |
| 8 | 3.5% |
| 9 | 3% |
| 10 | 2.5% |

## SERP Feature Penalty Coefficients

Cumulative — sum all applicable penalties:

| SERP Feature | CTR Penalty |
|-------------|-------------|
| Answer Box / AI Overview | -60% |
| Knowledge Graph | -30% |
| Local Pack | -20% |
| People Also Ask | -15% |
| Top Stories | -10% |
| Shopping Results | -25% |

## Calculation

```
adjusted_expected_ctr = baseline_ctr × (1 - sum_of_applicable_penalties)
```

Clamp the penalty sum to a maximum of 1.0 (CTR cannot go negative).

## Classification

| Condition | Diagnosis | Meaning |
|-----------|-----------|---------|
| `actual_ctr < adjusted_expected_ctr × 0.7` | **Content Problem** | Title/meta/content needs improvement |
| `actual_ctr >= adjusted_expected_ctr × 0.7` | **SERP Feature Absorption** | Low CTR caused by SERP features, not content quality |

## Output Table Format

```
| Keyword | Position | Baseline CTR | SERP Features | Adjusted CTR | Actual CTR | Diagnosis |
|---------|----------|-------------|---------------|-------------|------------|-----------|
| "keyword" | 3 | 11% | AB, PAA | 3.3% | 2.1% | Content Problem |
| "keyword" | 5 | 7% | AB, KG, PAA | 0.7% | 0.5% | SERP Feature Absorption |
```

Use this to prioritize Quick Wins where SERP features are capturable (answer box, PAA) vs those where low CTR is structural.
