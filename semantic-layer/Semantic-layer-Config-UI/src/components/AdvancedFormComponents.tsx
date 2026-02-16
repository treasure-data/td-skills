/**
 * Advanced/Complex Form Components
 */

import React, { useState } from "react";
import {
  TextInput,
  DynamicList,
  Select,
  Toggle,
  Alert,
  FormSection,
} from "./FormComponents";

// ============================================================================
// PATTERN TABLE (for auto-generation patterns)
// ============================================================================
export interface PatternTableRow {
  name: string;
  patterns: string[];
  tag: string;
  description_template: string;
  pii_category: string | null;
}

export interface PatternTableProps {
  label: string;
  rows: PatternTableRow[];
  onChange: (rows: PatternTableRow[]) => void;
  onAddRow?: () => void;
  onRemoveRow?: (index: number) => void;
  description?: string;
}

export const PatternTable: React.FC<PatternTableProps> = ({
  label,
  rows,
  onChange,
  onAddRow,
  onRemoveRow,
  description,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUpdateRow = (index: number, field: keyof PatternTableRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    onChange(newRows);
  };

  const handleAddRow = () => {
    const newRow: PatternTableRow = {
      name: "",
      patterns: [],
      tag: "",
      description_template: "",
      pii_category: null,
    };
    onChange([...rows, newRow]);
    setEditingIndex(rows.length);
  };

  const handleRemoveRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
    onRemoveRow?.(index);
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {description && <p className="form-description">{description}</p>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pattern Name</th>
              <th>Match Patterns</th>
              <th>Tag</th>
              <th>Description Template</th>
              <th>PII Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={editingIndex === index ? "editing" : ""}>
                <td>
                  <TextInput
                    label=""
                    value={row.name}
                    onChange={(v) => handleUpdateRow(index, "name", v)}
                    placeholder="e.g., identifiers"
                    disabled={editingIndex !== index}
                  />
                </td>
                <td>
                  <div className="patterns-list">
                    {row.patterns.map((p, i) => (
                      <span key={i} className="pattern-tag">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <TextInput
                    label=""
                    value={row.tag}
                    onChange={(v) => handleUpdateRow(index, "tag", v)}
                    placeholder="e.g., ID"
                    disabled={editingIndex !== index}
                  />
                </td>
                <td>
                  <TextInput
                    label=""
                    value={row.description_template}
                    onChange={(v) => handleUpdateRow(index, "description_template", v)}
                    placeholder="e.g., Identifier for {entity}"
                    disabled={editingIndex !== index}
                  />
                </td>
                <td>
                  <Select
                    label=""
                    value={row.pii_category || ""}
                    onChange={(v) =>
                      handleUpdateRow(index, "pii_category", v || null)
                    }
                    options={[
                      { label: "None", value: "" },
                      { label: "Email", value: "email" },
                      { label: "Phone", value: "phone" },
                      { label: "Name", value: "name" },
                      { label: "Address", value: "address" },
                      { label: "DOB", value: "dob" },
                    ]}
                    disabled={editingIndex !== index}
                  />
                </td>
                <td>
                  <button
                    onClick={() =>
                      editingIndex === index
                        ? setEditingIndex(null)
                        : setEditingIndex(index)
                    }
                    className="btn btn-sm btn-primary"
                    type="button"
                  >
                    {editingIndex === index ? "Done" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleRemoveRow(index)}
                    className="btn btn-sm btn-danger"
                    type="button"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAddRow}
        className="btn btn-secondary"
        type="button"
      >
        + Add Pattern
      </button>
    </div>
  );
};

// ============================================================================
// NOTIFICATION CHANNEL BUILDER
// ============================================================================
export interface NotificationChannelRow {
  type: "slack" | "email";
  channel?: string;
  recipients?: string[];
  subject?: string;
  message_template?: string;
}

export interface NotificationChannelBuilderProps {
  label: string;
  channels: NotificationChannelRow[];
  onChange: (channels: NotificationChannelRow[]) => void;
  description?: string;
}

export const NotificationChannelBuilder: React.FC<
  NotificationChannelBuilderProps
> = ({ label, channels, onChange, description }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUpdateChannel = (
    index: number,
    field: keyof NotificationChannelRow,
    value: any
  ) => {
    const newChannels = [...channels];
    newChannels[index] = { ...newChannels[index], [field]: value };
    onChange(newChannels);
  };

  const handleAddChannel = () => {
    const newChannel: NotificationChannelRow = {
      type: "slack",
      channel: "",
      message_template: "",
    };
    onChange([...channels, newChannel]);
    setEditingIndex(channels.length);
  };

  const handleRemoveChannel = (index: number) => {
    onChange(channels.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {description && <p className="form-description">{description}</p>}

      <div className="channel-list">
        {channels.map((channel, index) => (
          <div key={index} className="channel-item">
            <div className="channel-header">
              <span className="channel-type">{channel.type.toUpperCase()}</span>
              <button
                onClick={() =>
                  editingIndex === index ? setEditingIndex(null) : setEditingIndex(index)
                }
                className="btn btn-sm"
                type="button"
              >
                {editingIndex === index ? "Done" : "Edit"}
              </button>
              <button
                onClick={() => handleRemoveChannel(index)}
                className="btn btn-sm btn-danger"
                type="button"
              >
                Remove
              </button>
            </div>

            {editingIndex === index && (
              <div className="channel-content">
                <Select
                  label="Channel Type"
                  value={channel.type}
                  onChange={(v) =>
                    handleUpdateChannel(
                      index,
                      "type",
                      v as "slack" | "email"
                    )
                  }
                  options={[
                    { label: "Slack", value: "slack" },
                    { label: "Email", value: "email" },
                  ]}
                />

                {channel.type === "slack" && (
                  <TextInput
                    label="Channel"
                    value={channel.channel || ""}
                    onChange={(v) =>
                      handleUpdateChannel(index, "channel", v)
                    }
                    placeholder="#data-engineering"
                  />
                )}

                {channel.type === "email" && (
                  <>
                    <TextInput
                      label="Subject"
                      value={channel.subject || ""}
                      onChange={(v) =>
                        handleUpdateChannel(index, "subject", v)
                      }
                      placeholder="Email subject"
                    />
                    <DynamicList
                      label="Recipients"
                      items={channel.recipients || []}
                      onChange={(v) =>
                        handleUpdateChannel(index, "recipients", v)
                      }
                      placeholder="email@example.com"
                    />
                  </>
                )}

                <TextInput
                  label="Message Template"
                  value={channel.message_template || ""}
                  onChange={(v) =>
                    handleUpdateChannel(index, "message_template", v)
                  }
                  placeholder="{{tables_updated}} tables synced"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleAddChannel}
        className="btn btn-secondary"
        type="button"
      >
        + Add Channel
      </button>
    </div>
  );
};

// ============================================================================
// VALIDATION RULES BUILDER
// ============================================================================
export interface ValidationRuleRow {
  field_pattern: string;
  should_have_tag?: string;
  hint: string;
}

export interface ValidationRulesBuilderProps {
  label: string;
  rules: ValidationRuleRow[];
  onChange: (rules: ValidationRuleRow[]) => void;
  description?: string;
}

export const ValidationRulesBuilder: React.FC<ValidationRulesBuilderProps> = ({
  label,
  rules,
  onChange,
  description,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUpdateRule = (
    index: number,
    field: keyof ValidationRuleRow,
    value: string
  ) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    onChange(newRules);
  };

  const handleAddRule = () => {
    const newRule: ValidationRuleRow = {
      field_pattern: "",
      should_have_tag: "",
      hint: "",
    };
    onChange([...rules, newRule]);
    setEditingIndex(rules.length);
  };

  const handleRemoveRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {description && <p className="form-description">{description}</p>}

      <div className="rules-list">
        {rules.map((rule, index) => (
          <div key={index} className="rule-item">
            <div className="rule-header">
              <span className="rule-pattern">{rule.field_pattern}</span>
              <button
                onClick={() =>
                  editingIndex === index ? setEditingIndex(null) : setEditingIndex(index)
                }
                className="btn btn-sm"
                type="button"
              >
                {editingIndex === index ? "Done" : "Edit"}
              </button>
              <button
                onClick={() => handleRemoveRule(index)}
                className="btn btn-sm btn-danger"
                type="button"
              >
                Remove
              </button>
            </div>

            {editingIndex === index && (
              <div className="rule-content">
                <TextInput
                  label="Field Pattern (Regex)"
                  value={rule.field_pattern}
                  onChange={(v) =>
                    handleUpdateRule(index, "field_pattern", v)
                  }
                  placeholder="e.g., ^is_.*"
                  validation={(v) => {
                    try {
                      new RegExp(v);
                      return null;
                    } catch {
                      return "Invalid regex pattern";
                    }
                  }}
                />
                <TextInput
                  label="Should Have Tag"
                  value={rule.should_have_tag || ""}
                  onChange={(v) =>
                    handleUpdateRule(index, "should_have_tag", v)
                  }
                  placeholder="e.g., flag"
                />
                <TextInput
                  label="Hint"
                  value={rule.hint}
                  onChange={(v) => handleUpdateRule(index, "hint", v)}
                  placeholder="e.g., Boolean fields starting with is_ should be tagged as flag"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleAddRule} className="btn btn-secondary" type="button">
        + Add Rule
      </button>
    </div>
  );
};

// ============================================================================
// SEMANTIC DATABASE TABLE CONFIG
// ============================================================================
export interface SemanticTableConfigProps {
  tableConfig: Record<string, string>;
  onChange: (config: Record<string, string>) => void;
  description?: string;
}

export const SemanticTableConfig: React.FC<SemanticTableConfigProps> = ({
  tableConfig,
  onChange,
  description,
}) => {
  const tablePurposes = [
    {
      key: "field_metadata",
      label: "Field Metadata",
      description: "Tags, business terms, PII flags",
    },
    {
      key: "glossary",
      label: "Glossary",
      description: "Business glossary terms",
    },
    {
      key: "field_lineage",
      label: "Field Lineage",
      description: "Source → golden transformations",
    },
    {
      key: "field_relationships",
      label: "Field Relationships",
      description: "Foreign keys, joins",
    },
    {
      key: "field_usage",
      label: "Field Usage",
      description: "Query statistics",
    },
    {
      key: "governance",
      label: "Governance",
      description: "Ownership, SLAs, classification",
    },
    {
      key: "sync_history",
      label: "Sync History",
      description: "Audit log of all syncs",
    },
    {
      key: "impact_analysis",
      label: "Impact Analysis",
      description: "Downstream impact map",
    },
  ];

  const handleChangeTableName = (key: string, value: string) => {
    onChange({ ...tableConfig, [key]: value });
  };

  return (
    <FormSection title="Semantic Database Tables" description={description}>
      <div className="table-config-grid">
        {tablePurposes.map(({ key, label, description: desc }) => (
          <div key={key} className="table-config-item">
            <label className="form-label">{label}</label>
            <p className="form-description">{desc}</p>
            <TextInput
              label=""
              value={tableConfig[key] || ""}
              onChange={(v) => handleChangeTableName(key, v)}
              placeholder={key}
            />
          </div>
        ))}
      </div>
    </FormSection>
  );
};

// ============================================================================
// LINEAGE AUTO-DETECT ITEM
// ============================================================================
export interface LineageAutoDetectItemProps {
  item: {
    type: "dbt" | "workflow" | "schema_comments";
    enabled: boolean;
    paths?: string[];
    include_column_level?: boolean;
    include_transformations?: boolean;
    pattern?: string;
  };
  onChange: (item: any) => void;
}

export const LineageAutoDetectItem: React.FC<LineageAutoDetectItemProps> = ({
  item,
  onChange,
}) => {
  return (
    <div className="lineage-item">
      <Toggle
        label={`Enable ${item.type.toUpperCase()}`}
        checked={item.enabled}
        onChange={(v) => onChange({ ...item, enabled: v })}
      />

      {item.enabled && (
        <>
          {(item.type === "dbt" || item.type === "workflow") && (
            <DynamicList
              label="Paths"
              items={item.paths || []}
              onChange={(v) => onChange({ ...item, paths: v })}
              placeholder="e.g., dbt/, analytics/dbt/"
              examples={
                item.type === "dbt"
                  ? ["dbt/", "analytics/dbt/"]
                  : ["workflows/", "digdag/"]
              }
            />
          )}

          {item.type === "dbt" && (
            <Toggle
              label="Include Column Level Lineage"
              checked={item.include_column_level || false}
              onChange={(v) =>
                onChange({ ...item, include_column_level: v })
              }
              description="Requires dbt 1.5+ with --store-failures"
            />
          )}

          {item.type === "workflow" && (
            <Toggle
              label="Include Transformations"
              checked={item.include_transformations || false}
              onChange={(v) =>
                onChange({ ...item, include_transformations: v })
              }
            />
          )}

          {item.type === "schema_comments" && (
            <TextInput
              label="Comment Pattern"
              value={item.pattern || ""}
              onChange={(v) => onChange({ ...item, pattern: v })}
              placeholder="e.g., Lineage: .*"
            />
          )}
        </>
      )}
    </div>
  );
};
