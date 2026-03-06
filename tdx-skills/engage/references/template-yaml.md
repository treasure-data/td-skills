# Template YAML Reference

## Complete Example

```yaml
type: template
name: "Spring Promotion 2026"
subject: "{{profile.first_name}}, 20% OFF this week only!"
workspace: Marketing Team
editor_type: beefree
html_file: "spring-promotion-2026.html"

variables:
  - name: first_name
    display_name: First Name
    preview_value: "{{profile.first_name}}"
    default_value: Customer
  - name: customer_segment
    display_name: Loyalty Tier
    preview_value: "{{profile.customer_segment}}"
    default_value: Member
  - name: lifetime_spend
    display_name: Lifetime Spend
    preview_value: "{{profile.lifetime_spend}}"
    default_value: "0"
```

## Fields

| Field | Required | Notes |
|-------|----------|-------|
| `type` | Yes | `template` |
| `name` | Yes | Template display name |
| `subject` | No | Supports `{{profile.<name>}}` Liquid tags |
| `workspace` | No | Can use `--workspace` flag or `tdx.json` instead |
| `editor_type` | No | `beefree` or `grapesjs` |
| `html_file` | No | Relative path to companion HTML |
| `plaintext_file` | No | Relative path to companion plaintext |
| `variables` | No | Defaults to `[]` |

## Variables

Each entry maps to a parent segment output column used as a Liquid merge tag.

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Column name from `tdx ps desc <ps> -o` |
| `display_name` | Yes | Label shown in Engage UI |
| `preview_value` | Yes | Typically `"{{profile.<name>}}"` |
| `default_value` | When non-null < 100% | Fallback for null values — prevents blank rendering |

### Deciding default_value

```bash
tdx ps desc <parent_segment> -o   # Shows columns and non-null rates
```

- **100% non-null**: `default_value` optional
- **< 100% non-null**: set `default_value` — recipients with null see blank text otherwise
- For attributes like `gender` where no single default makes sense, use Liquid conditionals in HTML instead:

```html
{% if profile.gender == 'Female' %}
  <p>Shop our women's collection</p>
{% else %}
  <p>Shop our latest collection</p>
{% endif %}
```

### Special: sender.email

`{{sender.email}}` comes from the workspace email sender, not the parent segment. It does **not** need a `variables` entry.

## File Layout

```
templates/{workspace-slug}/
  tdx.json                        # {"engage_workspace": "Marketing Team"}
  spring-promotion-2026.yaml
  spring-promotion-2026.html
  spring-promotion-2026.txt       # Optional plaintext
```

`tdx.json` sets workspace context — no need for `--workspace` on each command.

## Commands

```bash
tdx engage template pull "Marketing Team" --yes   # Pull to YAML+HTML
tdx engage template validate template.yaml         # Local schema check
tdx engage template push template.yaml --dry-run   # API validation
tdx engage template push template.yaml --yes       # Push (matches by name)
```
