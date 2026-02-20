# Activation Actions - Example Workflows

Production-ready `.dig` files for common activation patterns.

| Example | Use Case |
|---------|----------|
| `simple_transformation.dig` | Format phones, clean emails, capitalize names before export |
| `gdpr_compliance.dig` | Filter out GDPR deletion requests and marketing opt-outs |
| `multi_platform_export.dig` | Export to Braze, Google Ads, Meta, and SFMC in parallel |
| `email_validation.dig` | Validate email format, block test/disposable domains |

## Usage

1. Copy the `.dig` file to your workflow project
2. Update `result_url` with your connector authentication name
3. Update table/column names to match your schema
4. Push: `tdx wf push project-name`
5. Assign to activation in Audience Studio (Actions tab)
