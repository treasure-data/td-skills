# TD Workflow Operator Notes

The operator list is in [../SKILL.md#td-platform-constraints](../SKILL.md#td-platform-constraints).

**For per-operator details (parameters, output variables, auto-resolved named secrets), fetch:**
- Specific operator: `https://docs.treasure.ai/products/customer-data-platform/data-workbench/workflows/operators/{operator_name}`
- Operator index (check here if an operator isn't listed in SKILL.md): `https://docs.treasure.ai/products/customer-data-platform/data-workbench/workflows/operators`

## TD operator authentication

All TD operators use **secret** `td.apikey`. If not set, they fall back to the workflow owner's default key.

## loop>: not for polling

Do not use `loop>` for polling — each iteration creates a task and can hit the 1,000-task-per-attempt limit. Use `td_wait_table>` / `td_wait>`, or `http>` against an endpoint that returns `408`/`429` until ready.

## py>: secrets via `_env`

`py>` does not expand `${secret:key}` in its own parameters. Pass secret values through the task's `_env` mapping (where `${secret:key}` is expanded).

```yaml
+task:
  py>: tasks.MyTask.run
  _env:
    TD_API_KEY: ${secret:td.apikey}
    API_TOKEN: ${secret:external.api_token}
```
