/**
 * Section Components - Individual configuration sections
 */

import React from "react";
import {
  TextInput,
  DynamicList,
  Toggle,
  FormSection,
  SectionHeader,
  Slider,
  Select,
  CheckboxGroup,
  RadioGroup,
} from "./FormComponents";
import {
  NotificationChannelBuilder,
  ValidationRulesBuilder,
  PatternTable,
  SemanticTableConfig,
  LineageAutoDetectItem,
} from "./AdvancedFormComponents";
import {
  ScopeConfig,
  DefinitionsConfig,
  SemanticDatabaseConfig,
  LineageConfig,
  ConflictHandlingConfig,
  ValidationConfig,
  AutoGenerationConfig,
  NotificationsConfig,
  ApprovalConfig,
  SyncConfig,
  TestingConfig,
} from "../types/config";

// ============================================================================
// SCOPE SECTION
// ============================================================================
export interface ScopeSectionProps {
  scope: ScopeConfig;
  onChange: (scope: ScopeConfig) => void;
}

export const ScopeSection: React.FC<ScopeSectionProps> = ({
  scope,
  onChange,
}) => {
  return (
    <FormSection
      title="Scope Configuration"
      description="Define which databases and tables to manage semantics for"
    >
      <DynamicList
        label="Databases to Include"
        items={scope.databases}
        onChange={(v) => onChange({ ...scope, databases: v })}
        placeholder="e.g., analytics.*"
        required
        examples={["analytics.*", "dwh.fact_*", "dwh.dim_*"]}
        validation={(v) => {
          if (v.includes("*") || v.includes(".")) {
            return null; // Basic validation
          }
          return "Use database patterns like 'db.*' or 'db.table_*'";
        }}
      />

      <DynamicList
        label="Exclude Patterns"
        items={scope.exclude_patterns}
        onChange={(v) => onChange({ ...scope, exclude_patterns: v })}
        placeholder="e.g., *.temp_*"
        examples={["*.temp_*", "*.audit_*", "*._*"]}
      />
    </FormSection>
  );
};

// ============================================================================
// DEFINITIONS SECTION
// ============================================================================
export interface DefinitionsSectionProps {
  definitions: DefinitionsConfig;
  onChange: (definitions: DefinitionsConfig) => void;
}

export const DefinitionsSection: React.FC<DefinitionsSectionProps> = ({
  definitions,
  onChange,
}) => {
  const handleDataDictionaryChange = (value: string | string[]) => {
    onChange({
      ...definitions,
      data_dictionary_path: value,
    });
  };

  const handleGlossaryChange = (value: string | string[]) => {
    onChange({
      ...definitions,
      glossary_path: value,
    });
  };

  const handleRelationshipsChange = (value: string | string[]) => {
    onChange({
      ...definitions,
      relationships_path: value,
    });
  };

  const handleGovernanceChange = (value: string | string[]) => {
    onChange({
      ...definitions,
      governance_path: value,
    });
  };

  return (
    <FormSection
      title="Definitions & Paths"
      description="Link to semantic definition files"
    >
      <TextInput
        label="Data Dictionary Path"
        value={
          Array.isArray(definitions.data_dictionary_path)
            ? definitions.data_dictionary_path.join(", ")
            : definitions.data_dictionary_path
        }
        onChange={handleDataDictionaryChange}
        placeholder="data_dictionary.yaml"
        description="YAML file containing field definitions"
        required
      />

      <TextInput
        label="Glossary Path"
        value={
          definitions.glossary_path
            ? Array.isArray(definitions.glossary_path)
              ? definitions.glossary_path.join(", ")
              : definitions.glossary_path
            : ""
        }
        onChange={handleGlossaryChange}
        placeholder="glossary.md"
        description="Optional: Business glossary in markdown"
      />

      <TextInput
        label="Relationships Path"
        value={
          definitions.relationships_path
            ? Array.isArray(definitions.relationships_path)
              ? definitions.relationships_path.join(", ")
              : definitions.relationships_path
            : ""
        }
        onChange={handleRelationshipsChange}
        placeholder="relationships.yaml"
        description="Optional: Field relationships and lineage"
      />

      <TextInput
        label="Governance Path"
        value={
          definitions.governance_path
            ? Array.isArray(definitions.governance_path)
              ? definitions.governance_path.join(", ")
              : definitions.governance_path
            : ""
        }
        onChange={handleGovernanceChange}
        placeholder="governance.yaml"
        description="Optional: Governance rules"
      />
    </FormSection>
  );
};

// ============================================================================
// SEMANTIC DATABASE SECTION
// ============================================================================
export interface SemanticDatabaseSectionProps {
  semanticDatabase: SemanticDatabaseConfig;
  onChange: (config: SemanticDatabaseConfig) => void;
}

export const SemanticDatabaseSection: React.FC<
  SemanticDatabaseSectionProps
> = ({ semanticDatabase, onChange }) => {
  return (
    <FormSection
      title="Semantic Database"
      description="Configure metadata storage database"
    >
      <TextInput
        label="Database Name"
        value={semanticDatabase.name}
        onChange={(v) => onChange({ ...semanticDatabase, name: v })}
        placeholder="semantic_layer_v1"
        required
      />

      <Toggle
        label="Auto-create if Missing"
        checked={semanticDatabase.create_if_missing}
        onChange={(v) =>
          onChange({ ...semanticDatabase, create_if_missing: v })
        }
        description="Automatically create the database if it doesn't exist"
      />

      <SemanticTableConfig
        tableConfig={semanticDatabase.tables}
        onChange={(tables) =>
          onChange({ ...semanticDatabase, tables })
        }
        description="Customize table names for each metadata type"
      />
    </FormSection>
  );
};

// ============================================================================
// LINEAGE DETECTION SECTION
// ============================================================================
export interface LineageDetectionSectionProps {
  lineage: LineageConfig;
  onChange: (config: LineageConfig) => void;
}

export const LineageDetectionSection: React.FC<LineageDetectionSectionProps> =
  ({ lineage, onChange }) => {
    const handleAutoDetectChange = (index: number, newItem: any) => {
      const newAutoDetect = [...lineage.auto_detect];
      newAutoDetect[index] = newItem;
      onChange({ ...lineage, auto_detect: newAutoDetect });
    };

    return (
      <FormSection
        title="Lineage Detection"
        description="Configure how lineage information is detected and imported"
      >
        <div className="lineage-auto-detect-list">
          {lineage.auto_detect.map((item, index) => (
            <div key={index} className="lineage-auto-detect-item">
              <LineageAutoDetectItem
                item={item}
                onChange={(newItem) => handleAutoDetectChange(index, newItem)}
              />
            </div>
          ))}
        </div>

        <FormSection title="Confidence Thresholds" collapsible>
          <Slider
            label="Auto-Detected Minimum Confidence"
            value={lineage.confidence_thresholds.auto_detected_min}
            onChange={(v) =>
              onChange({
                ...lineage,
                confidence_thresholds: {
                  ...lineage.confidence_thresholds,
                  auto_detected_min: v,
                },
              })
            }
            min={0}
            max={1}
            step={0.1}
            unit="confidence"
            description="Only store lineage if confidence >= this threshold"
          />
        </FormSection>

        <FormSection title="Derived Metadata" collapsible>
          <Toggle
            label="Generate Impact Analysis"
            checked={lineage.generate_impact_analysis}
            onChange={(v) =>
              onChange({ ...lineage, generate_impact_analysis: v })
            }
          />

          <Toggle
            label="Track Downstream Tables"
            checked={lineage.track_downstream_tables}
            onChange={(v) =>
              onChange({ ...lineage, track_downstream_tables: v })
            }
          />
        </FormSection>
      </FormSection>
    );
  };

// ============================================================================
// CONFLICT HANDLING SECTION
// ============================================================================
export interface ConflictHandlingSectionProps {
  conflictHandling: ConflictHandlingConfig;
  onChange: (config: ConflictHandlingConfig) => void;
}

export const ConflictHandlingSection: React.FC<ConflictHandlingSectionProps> =
  ({ conflictHandling, onChange }) => {
    return (
      <FormSection
        title="Conflict Handling"
        description="Define how conflicts and schema changes are handled"
      >
        <RadioGroup
          label="Conflict Resolution Mode"
          value={conflictHandling.mode}
          onChange={(v) =>
            onChange({
              ...conflictHandling,
              mode: v as "fail" | "warn" | "auto_generate",
            })
          }
          options={[
            {
              label: "Fail",
              value: "fail",
              description: "Stop if any conflicts are found",
            },
            {
              label: "Warn",
              value: "warn",
              description: "Proceed but flag issues in report",
            },
            {
              label: "Auto-Generate",
              value: "auto_generate",
              description: "Auto-create descriptions for missing fields",
            },
          ]}
        />

        <Toggle
          label="Auto-Generate for Missing"
          checked={conflictHandling.auto_generate_for_missing}
          onChange={(v) =>
            onChange({ ...conflictHandling, auto_generate_for_missing: v })
          }
          description="Generate descriptions for fields missing from YAML"
        />

        <Toggle
          label="Overwrite Existing Descriptions"
          checked={conflictHandling.overwrite_existing_descriptions}
          onChange={(v) =>
            onChange({
              ...conflictHandling,
              overwrite_existing_descriptions: v,
            })
          }
          description="Overwrite existing descriptions with new YAML values"
        />

        <FormSection title="On Schema Changes" collapsible>
          <Select
            label="New Fields"
            value={conflictHandling.on_schema_changes.new_fields}
            onChange={(v) =>
              onChange({
                ...conflictHandling,
                on_schema_changes: {
                  ...conflictHandling.on_schema_changes,
                  new_fields: v as "warn" | "error",
                },
              })
            }
            options={[
              { label: "Warn", value: "warn" },
              { label: "Error", value: "error" },
            ]}
            description="If new fields in schema not in YAML"
          />

          <Select
            label="Removed Fields"
            value={conflictHandling.on_schema_changes.removed_fields}
            onChange={(v) =>
              onChange({
                ...conflictHandling,
                on_schema_changes: {
                  ...conflictHandling.on_schema_changes,
                  removed_fields: v as "warn" | "error",
                },
              })
            }
            options={[
              { label: "Warn", value: "warn" },
              { label: "Error", value: "error" },
            ]}
            description="If fields in YAML don't exist in schema"
          />

          <Select
            label="Type Changes"
            value={conflictHandling.on_schema_changes.type_changes}
            onChange={(v) =>
              onChange({
                ...conflictHandling,
                on_schema_changes: {
                  ...conflictHandling.on_schema_changes,
                  type_changes: v as "warn" | "error",
                },
              })
            }
            options={[
              { label: "Warn", value: "warn" },
              { label: "Error", value: "error" },
            ]}
            description="If field type changed"
          />
        </FormSection>
      </FormSection>
    );
  };

// ============================================================================
// VALIDATION SECTION
// ============================================================================
export interface ValidationSectionProps {
  validation: ValidationConfig;
  onChange: (config: ValidationConfig) => void;
}

export const ValidationSection: React.FC<ValidationSectionProps> = ({
  validation,
  onChange,
}) => {
  return (
    <FormSection
      title="Validation Rules"
      description="Define validation requirements for semantic metadata"
    >
      <FormSection title="Basic Requirements" collapsible>
        <CheckboxGroup
          label="Validation Requirements"
          values={[
            validation.require_table_description ? "table_desc" : "",
            validation.require_field_description ? "field_desc" : "",
            validation.require_owner_for_tables ? "owner_tables" : "",
            validation.require_owner_for_pii_fields ? "owner_pii" : "",
            validation.require_business_term_for_metrics ? "business_term" : "",
          ].filter(Boolean)}
          onChange={(values) =>
            onChange({
              ...validation,
              require_table_description: values.includes("table_desc"),
              require_field_description: values.includes("field_desc"),
              require_owner_for_tables: values.includes("owner_tables"),
              require_owner_for_pii_fields: values.includes("owner_pii"),
              require_business_term_for_metrics:
                values.includes("business_term"),
            })
          }
          options={[
            { label: "Require Table Description", value: "table_desc" },
            { label: "Require Field Description", value: "field_desc" },
            { label: "Require Owner for Tables", value: "owner_tables" },
            {
              label: "Require Owner for PII Fields",
              value: "owner_pii",
            },
            {
              label: "Require Business Term for Metrics",
              value: "business_term",
            },
          ]}
        />
      </FormSection>

      <FormSection title="PII Validation" collapsible>
        <CheckboxGroup
          label="PII Requirements"
          values={[
            validation.pii_validation.require_pii_category ? "pii_category" : "",
            validation.pii_validation.require_owner ? "pii_owner" : "",
            validation.pii_validation.require_data_classification
              ? "pii_classification"
              : "",
          ].filter(Boolean)}
          onChange={(values) =>
            onChange({
              ...validation,
              pii_validation: {
                ...validation.pii_validation,
                require_pii_category: values.includes("pii_category"),
                require_owner: values.includes("pii_owner"),
                require_data_classification:
                  values.includes("pii_classification"),
              },
            })
          }
          options={[
            {
              label: "Require PII Category",
              value: "pii_category",
              description: "Must specify: email, phone, ssn, name, etc.",
            },
            {
              label: "Require PII Owner",
              value: "pii_owner",
              description: "PII fields must have an owner assigned",
            },
            {
              label: "Require Data Classification",
              value: "pii_classification",
              description: "PII must be classified: restricted, confidential",
            },
          ]}
        />
      </FormSection>

      <FormSection title="Custom Validation Rules" collapsible>
        <ValidationRulesBuilder
          label="Field Pattern Rules"
          rules={validation.custom_rules}
          onChange={(v) => onChange({ ...validation, custom_rules: v })}
          description="Add regex-based validation rules for field patterns"
        />
      </FormSection>
    </FormSection>
  );
};

// ============================================================================
// AUTO-GENERATION SECTION
// ============================================================================
export interface AutoGenerationSectionProps {
  autoGeneration: AutoGenerationConfig;
  onChange: (config: AutoGenerationConfig) => void;
}

export const AutoGenerationSection: React.FC<AutoGenerationSectionProps> = ({
  autoGeneration,
  onChange,
}) => {
  return (
    <FormSection
      title="Auto-Generation Settings"
      description="Configure heuristic-based automatic metadata generation"
    >
      <Toggle
        label="Enable Auto-Generation"
        checked={autoGeneration.enabled}
        onChange={(v) => onChange({ ...autoGeneration, enabled: v })}
        description="Enable heuristic-based auto-generation (no LLM calls)"
      />

      {autoGeneration.enabled && (
        <>
          <FormSection title="Content Rules" collapsible>
            <TextInput
              label="Auto-Generated Prefix"
              value={autoGeneration.content_rules.prefix_auto_generated}
              onChange={(v) =>
                onChange({
                  ...autoGeneration,
                  content_rules: {
                    ...autoGeneration.content_rules,
                    prefix_auto_generated: v,
                  },
                })
              }
              placeholder="[AUTO]"
            />

            <Toggle
              label="Overwrite Existing Descriptions"
              checked={autoGeneration.content_rules.overwrite_existing}
              onChange={(v) =>
                onChange({
                  ...autoGeneration,
                  content_rules: {
                    ...autoGeneration.content_rules,
                    overwrite_existing: v,
                  },
                })
              }
            />

            <Toggle
              label="Overwrite Auto-Generated Descriptions"
              checked={autoGeneration.content_rules.overwrite_auto_generated}
              onChange={(v) =>
                onChange({
                  ...autoGeneration,
                  content_rules: {
                    ...autoGeneration.content_rules,
                    overwrite_auto_generated: v,
                  },
                })
              }
            />

            <DynamicList
              label="Skip Fields Matching"
              items={autoGeneration.content_rules.skip_fields_matching}
              onChange={(v) =>
                onChange({
                  ...autoGeneration,
                  content_rules: {
                    ...autoGeneration.content_rules,
                    skip_fields_matching: v,
                  },
                })
              }
              placeholder="e.g., time"
              examples={["time", "td_*"]}
            />
          </FormSection>

          <FormSection title="What to Generate" collapsible>
            <CheckboxGroup
              label="Generation Options"
              values={[
                autoGeneration.generate.field_descriptions
                  ? "field_descriptions"
                  : "",
                autoGeneration.generate.tags ? "tags" : "",
                autoGeneration.generate.pii_detection ? "pii_detection" : "",
                autoGeneration.generate.business_terms
                  ? "business_terms"
                  : "",
                autoGeneration.generate.data_classification
                  ? "data_classification"
                  : "",
              ].filter(Boolean)}
              onChange={(values) =>
                onChange({
                  ...autoGeneration,
                  generate: {
                    ...autoGeneration.generate,
                    field_descriptions:
                      values.includes("field_descriptions"),
                    tags: values.includes("tags"),
                    pii_detection: values.includes("pii_detection"),
                    business_terms: values.includes("business_terms"),
                    data_classification:
                      values.includes("data_classification"),
                  },
                })
              }
              options={[
                { label: "Field Descriptions", value: "field_descriptions" },
                { label: "Tags", value: "tags" },
                { label: "PII Detection", value: "pii_detection" },
                { label: "Business Terms (Phase 2)", value: "business_terms" },
                {
                  label: "Data Classification (Phase 2)",
                  value: "data_classification",
                },
              ]}
            />
          </FormSection>

          <FormSection title="Heuristic Patterns" collapsible>
            <PatternTable
              label="Generation Patterns"
              rows={autoGeneration.patterns}
              onChange={(v) =>
                onChange({ ...autoGeneration, patterns: v })
              }
              description="Define patterns for auto-generating metadata"
            />
          </FormSection>
        </>
      )}
    </FormSection>
  );
};

// ============================================================================
// NOTIFICATIONS SECTION
// ============================================================================
export interface NotificationsSectionProps {
  notifications: NotificationsConfig;
  onChange: (config: NotificationsConfig) => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  notifications,
  onChange,
}) => {
  return (
    <FormSection
      title="Notifications"
      description="Configure notifications for sync events"
    >
      <FormSection title="On Sync Complete" collapsible defaultOpen>
        <Toggle
          label="Enable Notifications"
          checked={notifications.on_sync_complete.enabled}
          onChange={(v) =>
            onChange({
              ...notifications,
              on_sync_complete: {
                ...notifications.on_sync_complete,
                enabled: v,
              },
            })
          }
        />

        {notifications.on_sync_complete.enabled && (
          <NotificationChannelBuilder
            label="Notification Channels"
            channels={notifications.on_sync_complete.channels}
            onChange={(v) =>
              onChange({
                ...notifications,
                on_sync_complete: {
                  ...notifications.on_sync_complete,
                  channels: v,
                },
              })
            }
          />
        )}
      </FormSection>

      <FormSection title="On Error" collapsible>
        <Toggle
          label="Enable Error Notifications"
          checked={notifications.on_error.enabled}
          onChange={(v) =>
            onChange({
              ...notifications,
              on_error: {
                ...notifications.on_error,
                enabled: v,
              },
            })
          }
        />

        {notifications.on_error.enabled && (
          <NotificationChannelBuilder
            label="Error Notification Channels"
            channels={notifications.on_error.channels}
            onChange={(v) =>
              onChange({
                ...notifications,
                on_error: {
                  ...notifications.on_error,
                  channels: v,
                },
              })
            }
          />
        )}
      </FormSection>
    </FormSection>
  );
};

// ============================================================================
// APPROVAL WORKFLOW SECTION
// ============================================================================
export interface ApprovalWorkflowSectionProps {
  approval: ApprovalConfig;
  onChange: (config: ApprovalConfig) => void;
}

export const ApprovalWorkflowSection: React.FC<ApprovalWorkflowSectionProps> =
  ({ approval, onChange }) => {
    return (
      <FormSection
        title="Approval Workflow"
        description="Configure approval requirements for changes"
      >
        <Toggle
          label="Require Dry-Run Before Applying Changes"
          checked={approval.require_dry_run}
          onChange={(v) =>
            onChange({ ...approval, require_dry_run: v })
          }
        />

        <FormSection title="Require Approval For" collapsible defaultOpen>
          <CheckboxGroup
            label="High-Risk Changes"
            values={[
              approval.require_approval_for.field_removals
                ? "field_removals"
                : "",
              approval.require_approval_for.type_changes
                ? "type_changes"
                : "",
              approval.require_approval_for.owner_changes
                ? "owner_changes"
                : "",
              approval.require_approval_for.pii_reclassification
                ? "pii_reclassification"
                : "",
            ].filter(Boolean)}
            onChange={(values) =>
              onChange({
                ...approval,
                require_approval_for: {
                  ...approval.require_approval_for,
                  field_removals: values.includes("field_removals"),
                  type_changes: values.includes("type_changes"),
                  owner_changes: values.includes("owner_changes"),
                  pii_reclassification:
                    values.includes("pii_reclassification"),
                },
              })
            }
            options={[
              {
                label: "Field Removals",
                value: "field_removals",
                description: "When a field is removed from YAML",
              },
              {
                label: "Type Changes",
                value: "type_changes",
                description: "When field type changes",
              },
              {
                label: "Owner Changes",
                value: "owner_changes",
                description: "When field ownership changes",
              },
              {
                label: "PII Reclassification",
                value: "pii_reclassification",
                description: "When PII status changes",
              },
            ]}
          />
        </FormSection>

        <FormSection title="Auto-Approve For" collapsible>
          <CheckboxGroup
            label="Low-Risk Changes"
            values={[
              approval.auto_approve_for.description_updates
                ? "description_updates"
                : "",
              approval.auto_approve_for.tag_additions ? "tag_additions" : "",
              approval.auto_approve_for.comment_updates
                ? "comment_updates"
                : "",
            ].filter(Boolean)}
            onChange={(values) =>
              onChange({
                ...approval,
                auto_approve_for: {
                  ...approval.auto_approve_for,
                  description_updates:
                    values.includes("description_updates"),
                  tag_additions: values.includes("tag_additions"),
                  comment_updates: values.includes("comment_updates"),
                },
              })
            }
            options={[
              {
                label: "Description Updates",
                value: "description_updates",
                description: "Just updating descriptions",
              },
              {
                label: "Tag Additions",
                value: "tag_additions",
                description: "Just adding tags",
              },
              {
                label: "Comment Updates",
                value: "comment_updates",
                description: "Just updating comments",
              },
            ]}
          />
        </FormSection>
      </FormSection>
    );
  };

// ============================================================================
// SYNC BEHAVIOR SECTION
// ============================================================================
export interface SyncBehaviorSectionProps {
  sync: SyncConfig;
  onChange: (config: SyncConfig) => void;
}

export const SyncBehaviorSection: React.FC<SyncBehaviorSectionProps> = ({
  sync,
  onChange,
}) => {
  return (
    <FormSection
      title="Sync Behavior"
      description="Configure how synchronization behaves"
    >
      <RadioGroup
        label="Merge Strategy"
        value={sync.merge_strategy}
        onChange={(v) =>
          onChange({
            ...sync,
            merge_strategy: v as
              | "manual_wins"
              | "auto_overwrites"
              | "merge_both",
          })
        }
        options={[
          {
            label: "Manual Wins",
            value: "manual_wins",
            description: "Manually set values take precedence",
          },
          {
            label: "Auto Overwrites",
            value: "auto_overwrites",
            description: "Auto-generated values overwrite manual values",
          },
          {
            label: "Merge Both",
            value: "merge_both",
            description: "Combine manual and auto-generated values",
          },
        ]}
      />

      <Toggle
        label="Create Backup Before Modifying Schema"
        checked={sync.create_backup}
        onChange={(v) =>
          onChange({ ...sync, create_backup: v })
        }
      />

      <Toggle
        label="Dry Run By Default"
        checked={sync.dry_run_by_default}
        onChange={(v) =>
          onChange({ ...sync, dry_run_by_default: v })
        }
        description="Start with dry run enabled"
      />

      <Toggle
        label="Audit Logging"
        checked={sync.audit_logging}
        onChange={(v) =>
          onChange({ ...sync, audit_logging: v })
        }
        description="Log all changes"
      />

      <TextInput
        label="Batch Size"
        type="number"
        value={sync.batch_size.toString()}
        onChange={(v) =>
          onChange({ ...sync, batch_size: parseInt(v) || 100 })
        }
        placeholder="100"
        description="Process N tables at a time"
      />
    </FormSection>
  );
};

// ============================================================================
// TESTING SECTION
// ============================================================================
export interface TestingSectionProps {
  testing: TestingConfig;
  onChange: (config: TestingConfig) => void;
}

export const TestingSection: React.FC<TestingSectionProps> = ({
  testing,
  onChange,
}) => {
  return (
    <FormSection
      title="Testing & Development"
      description="Configure testing and development options"
    >
      <Toggle
        label="Enable Test Mode"
        checked={testing.enabled}
        onChange={(v) =>
          onChange({ ...testing, enabled: v })
        }
        description="Test mode won't actually modify Treasure Data"
      />

      {testing.enabled && (
        <>
          <TextInput
            label="Sample Database"
            value={testing.sample_database || ""}
            onChange={(v) =>
              onChange({ ...testing, sample_database: v || null })
            }
            placeholder="test_database"
            description="Use this test database instead of production"
          />
        </>
      )}

      <Select
        label="Report Level"
        value={testing.report_level}
        onChange={(v) =>
          onChange({
            ...testing,
            report_level: v as "quiet" | "normal" | "verbose" | "debug",
          })
        }
        options={[
          { label: "Quiet", value: "quiet" },
          { label: "Normal", value: "normal" },
          { label: "Verbose", value: "verbose" },
          { label: "Debug", value: "debug" },
        ]}
        description="Verbosity level for sync reports"
      />
    </FormSection>
  );
};
