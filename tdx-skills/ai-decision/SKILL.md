---
name: ai-decision
description: Answers structured questions about text, images, or query result rows with `tdx ai decision` (LLM Proxy Decisions API) — yes/no probabilities (predicate), one of a fixed set of options (choice), or a rating on a scale (score). Use when the user wants to classify, label, score, tag, or triage reviews, tickets, comments, or other text with AI, including every row of a `tdx query` result, or asks about `tdx ai decision`, questions files, or the Decisions API.
---

# tdx ai decision - Structured AI Decisions

```bash
tdx ai decision <questions-file> <input-file|-> [options]
tdx ai decision <questions-file> --input "text"
tdx ai decision <questions-file> --image photo.png
```

Requires a tdx release newer than v2026.10.3. Earlier versions used `--questions-file` and `--file` instead of positional arguments; check `tdx ai decision --help` if unsure. The Decisions API must be enabled for the account; otherwise the command reports that access is denied.

## Questions File (YAML, or JSON when named `.json`)

```yaml
- name: is_positive            # unique; answers are matched by name
  type: predicate              # yes/no -> probability
  instructions: Is the customer happy with the product?
- name: topic
  type: choice                 # one value -> choice, probabilities, confidence
  instructions: What is the review mainly about?
  choices:
    - { value: price, description: Cost or value for money }
    - { value: quality, description: Product quality or durability }
- name: urgency
  type: score                  # ordered levels, lowest first -> score, probabilities, confidence
  instructions: How urgently should support follow up?
  levels:
    - { label: low }
    - { label: high, description: Follow up today }
```

Choice values are strings or booleans; numbers are rejected.

## Single Decision vs. Batch Decisions

The input source decides the mode:

- **Single decision:** one input gives one answer set. Use `--input "text"`, a plain text file, or `--image` alone. The output is one JSON response, or a summary table with `--table`. The command makes one API call.
- **Batch decisions:** many records give one result per record. Use `-` (stdin) or a `.json` / `.jsonl` file. The output is JSONL, one line per record. The command makes one API call per record.

| Input source | Mode | Output | API calls |
| --- | --- | --- | --- |
| `--input "text"` | Single | One JSON response (`--table` for a summary) | 1 |
| Plain text file (e.g. `review.txt`) | Single | One JSON response (`--table`) | 1 |
| `--image` with no input file | Single | One JSON response | 1 |
| `-` (stdin), or a `.json` / `.jsonl` file | Batch | One JSONL line per record | 1 per record |

A **record** is one JSON value: an object (a query row, sent as JSON) or a string (sent as its text). A blank string record is rejected.

```bash
# Single decision
tdx ai decision questions.yml --input "Arrived late and the box was crushed"

# Batch decisions: 100 rows from a query, one result line each
tdx query "select id, review from mydb.feedback limit 100" --jsonl \
  | tdx ai decision questions.yml -
```

Rules:

- Batch input must be records. Raw text on stdin is rejected; use `--input` for one piece of text.
- `--image` attaches to a single decision, alone or with `--input` or a text file. It cannot be combined with batch input.
- `-` must be given explicitly; the command never reads stdin by default.

## Classify Query Rows

```bash
tdx query "select id, review from mydb.feedback where td_interval(time, '-7d') limit 100" --jsonl \
  | tdx ai decision questions.yml -
```

- Each object row is sent to the model as compact JSON of **all its columns**. Select only the columns the questions need — every column is sent to the model and billed.
- `--input-field review` sends just that string column; `row` in the output still contains every column (e.g. `id` for joining back).
- Each row is a separate billed request. Add a `limit` and run `--dry-run` first to validate the input and preview requests without calling the API.
- `--concurrency <n>` (default 16) caps parallel requests; use `1` for sequential. Each bounded group finishes before the next starts, so a slow request delays its group.
- `--model <id>` selects the Decisions model (default: `gpt-6-luna`).

Each output line keeps the zero-based `index`, the original `row`, and the full `response`:

```json
{"index":0,"row":{"id":1,"review":"Arrived late"},"response":{"answers":[{"name":"is_positive","type":"predicate","probability":0.08}],"usage":{"input_tokens":42}}}
```

Flatten results with jq:

```bash
tdx ai decision questions.yml reviews.jsonl \
  | jq -c '{id: .row.id} + ([.response.answers[] | {(.name): (if has("choice") then .choice elif has("score") then .score else .probability end)}] | add)'
```

## Output Options

- `--json`: collect record results into one JSON array (written only after every record succeeds).
- `--output results.jsonl` / `results.json`: the extension selects the format. Output must not be a questions, input, or image file, including stdin redirected from that file.
- Table and TSV output are not supported for record input.

## Failures

- Processing stops at the first invalid record or API error; stderr names the record index and the exit code is non-zero.
- JSONL lines already written stay valid; requests already in flight finish and may be billed. Nothing is retried automatically.
- Record errors: null, number, boolean, or array records; blank strings; a missing or non-string `--input-field`; malformed JSON (never skipped).
- A refused question appears as an answer with `type: refusal`.
- To resume after a failure, skip records that already have results (match on `index` or the row's ID). In-flight records without an emitted result may already have been billed; rerunning them can incur additional usage. Indices restart at zero for each new invocation.
