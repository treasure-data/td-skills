# TD Workflow Operators Reference

The operator list is in [../SKILL.md#td-platform-constraints](../SKILL.md#td-platform-constraints). For each operator's parameters, output variables, and defaults, fetch the official docs.

**For parameter details, fetch the official docs:**
- Specific operator: `https://docs.treasure.ai/products/customer-data-platform/data-workbench/workflows/operators/{operator_name}`
- Full operator index (check here if an operator isn't listed in SKILL.md): https://docs.treasure.ai/products/customer-data-platform/data-workbench/workflows/operators

## TD Platform Notes

These are TD-platform specifics or cross-operator caveats not covered by the generic operator docs.

### TD operator authentication

All TD operators use **secret** `td.apikey`. If not set, they fall back to the workflow owner's default key.

### s3_move>: not atomic

Copies then deletes. Cannot move/copy a folder into itself.

### loop>: not for polling

Do not use `loop>` for polling — each iteration creates a task and can hit the 1,000-task-per-attempt limit. Use `td_wait_table>` / `td_wait>`, or `http>` against an endpoint that returns `408`/`429` until ready.

### py>: secrets via `_env`

`py>` does not expand `${secret:key}` in its own parameters. Pass secret values through the task's `_env` mapping (where `${secret:key}` is expanded).

```yaml
+task:
  py>: tasks.MyTask.run
  _env:
    TD_API_KEY: ${secret:td.apikey}
    API_TOKEN: ${secret:external.api_token}
```

## Common Output Variables

TD operator outputs used to chain tasks:

| Variable | Set by | Description |
|---|---|---|
| `${td.last_job_id}` | `td>`, `td_run>`, `td_load>`, `td_for_each>`, `td_wait>`, `td_wait_table>`, `td_table_export>`, `td_result_export>` | Job ID of the last query/job |
| `${td.last_job.num_records}` | Same as above | Record count of the last job |
| `${td.last_results.<column>}` | `td>`, `td_run>` (requires `store_last_results: true`) | First row values |
| `${td.each.<column>}` | `td_for_each>` | Current row inside `_do:` |

## Secrets Reference

`${secret:key}` is only expanded in specific operator fields. Some operators also read named secrets automatically.

| Operator | `${secret:key}` expanded in | Auto-resolved named secrets |
|---|---|---|
| `http>` | URI, query, headers, content | `http.authorization` (→ Authorization header), `http.user`, `http.password`, `http.uri` |
| `td>` | `result_url`, `result_settings` | `td.apikey` |
| `td_load>` | bulk load config | `td.apikey` |
| `td_result_export>` | `result_settings` | `td.apikey` |
| `td_table_export>` | — | `td.apikey`, `aws.s3.access_key_id`, `aws.s3.secret_access_key` |
| `mail>` | — | `mail.host`, `mail.port`, `mail.username`, `mail.password`, `mail.tls`, `mail.ssl` |
| `s3_wait>`, `s3_copy>`, `s3_delete>`, `s3_move>` | — | `aws.s3.access_key_id`, `aws.s3.secret_access_key` |
| `gcs_wait>` | — | `gcp.credential` |
| `py>` | Not expanded in operator params — pass via `_env` | — |
