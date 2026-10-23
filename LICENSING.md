# Licensing

## Default license

Except where separately licensed below or otherwise noted in a file, original content in this repository—including skill instructions, documentation, examples, and scripts—is licensed under the [Apache License, Version 2.0](./LICENSE) (`Apache-2.0`).

Apache-2.0 allows commercial use, modification, redistribution, and proprietary derivatives. It requires preservation of applicable notices and includes an express contributor patent license with the limits and termination conditions in section 3. It does not prevent competitors from reusing the skills or require all downstream modifications to be open source.

## Existing license exceptions

| Material | License and notices |
| --- | --- |
| [`semantic-layer/data-dictionary-helper/`](./semantic-layer/data-dictionary-helper/) | Retains its existing **ISC** declaration in [package.json](./semantic-layer/data-dictionary-helper/package.json) and [README](./semantic-layer/data-dictionary-helper/README.md#license); it is not relicensed by the repository default. |
| [`chart.umd.min.js`](./fde-public-skills/custom-agent-skills/custom-dashboard-builder/project_templates/dashboard_template/chart.umd.min.js), Chart.js 4.4.0 | **MIT**. Preserve its embedded copyright notice and the accompanying [Chart.js license](./fde-public-skills/custom-agent-skills/custom-dashboard-builder/project_templates/dashboard_template/LICENSE.chartjs). |
| @kurkle/color 0.3.2, embedded in the same Chart.js bundle | **MIT**. Preserve its embedded copyright notice and the accompanying [@kurkle/color license](./fde-public-skills/custom-agent-skills/custom-dashboard-builder/project_templates/dashboard_template/LICENSE.kurkle-color). |

Dependencies and externally downloaded resources retain their own licenses. The repository license does not override third-party notices or grant rights the contributors do not hold.

## Redistribution

For Apache-licensed content, follow section 4 of [LICENSE](./LICENSE):

- Give recipients a copy of the Apache-2.0 license, including when redistributing a single skill, template, or example separately from the repository.
- Make modified files carry prominent notices stating that you changed them.
- Retain applicable copyright, patent, trademark, and attribution notices in distributed source.
- If a distributed work includes a `NOTICE` file, carry forward its applicable attribution notices as specified in section 4(d). This repository does not introduce a `NOTICE` file.

When copying the vendored Chart.js bundle, include both accompanying MIT license files and preserve its existing headers. Merely linking to this repository is not a substitute for including required license copies and notices. Installers or export tools that copy only subdirectories must arrange to include the applicable license files; adding a root license does not change those tools automatically.

## Warranty, liability, and service boundaries

Apache-licensed skills and examples are provided **as is**. Sections 7–8 of [LICENSE](./LICENSE) disclaim warranties and limit contributor liability, except as required by applicable law or agreed to in writing. These provisions are not a guarantee of immunity and do not override existing contractual commitments. The separately licensed materials have their own disclaimer terms.

Publishing these skills creates no additional promise of support, maintenance, accuracy, security, or fitness for a particular use. Review generated commands, queries, workflows, and outputs before executing them; test changes before production use. Skill or example licensing alone does not determine the rights in every AI-generated output, which may also depend on its contents, third-party rights, and service terms.

The repository license does not provide credentials, authorize access to Treasure Data services or customer data, change service/subscription agreements, or generally grant use of trade names, trademarks, or product names. See Apache-2.0 section 6 for its limited trademark exceptions. Under section 9, a redistributor accepting additional support, warranty, indemnity, or liability obligations does so on its own behalf, subject to that section's conditions—not on behalf of other contributors.

## Maintainer guidance

Confirm that contributions can be licensed under the applicable terms and retain any third-party notices. Do not add confidential information, customer data, or credentials. Obtain legal review when contribution ownership, provenance, contractual obligations, or intended restrictions are unclear; this guide is not legal advice or a complete provenance audit.

Sources: [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0), [ASF licensing FAQ](https://www.apache.org/foundation/license-faq.html), [Chart.js 4.4.0 license](https://github.com/chartjs/Chart.js/blob/v4.4.0/LICENSE.md), and [@kurkle/color 0.3.2 license](https://github.com/kurkle/color/blob/v0.3.2/LICENSE.md).

<img src="https://work.treasure.ai/gem-emoji.svg" width="16" height="16" align="absmiddle" alt=""> Generated with [Treasure Work](https://work.treasure.ai/)
