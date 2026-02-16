# Proposed UI Extensions for Delta Scheduling

## New TypeScript Type Additions

### 1. Add to `SyncConfig` (config.ts lines 186-194)

```typescript
export interface SyncConfig {
  // Existing fields
  merge_strategy: "manual_wins" | "auto_overwrites" | "merge_both";
  create_backup: boolean;
  dry_run_by_default: boolean;
  audit_logging: boolean;
  batch_size: number;

  // NEW: Delta mode configuration
  sync_mode: "full" | "delta";  // Full scan vs. incremental only

  // NEW: Schedule configuration
  schedule?: {
    enabled: boolean;
    frequency: "manual" | "hourly" | "daily" | "weekly" | "custom";
    cron_expression?: string;  // For custom frequency
    time?: string;  // e.g., "02:00:00" for daily at 2 AM
  };
}
```

### 2. Add to `LineageConfig` (config.ts lines 61-69)

```typescript
export interface LineageConfig {
  auto_detect: LineageAutoDetectItem[];
  manual?: {
    relationships_path: string;
  };
  confidence_thresholds: LineageConfidenceThresholds;
  generate_impact_analysis: boolean;
  track_downstream_tables: boolean;

  // NEW: Schema change tracking
  schema_change_detection?: {
    enabled: boolean;
    track_new_tables: boolean;
    track_new_columns: boolean;
    track_removed_columns: boolean;
    track_type_changes: boolean;
  };
}
```

### 3. Add to `ValidationConfig` (config.ts lines 102-110)

```typescript
export interface ValidationConfig {
  require_table_description: boolean;
  require_field_description: boolean;
  require_owner_for_tables: boolean;
  require_owner_for_pii_fields: boolean;
  require_business_term_for_metrics: boolean;
  pii_validation: ValidationPiiRules;
  custom_rules: ValidationCustomRule[];

  // NEW: Validation mode
  mode: "lenient" | "strict";  // Warnings vs. errors
}
```

## New UI Components Needed

### 1. Sync Behavior Section Extension

Add these form fields to `SyncBehaviorSection` component:

```typescript
// Sync Mode Radio Group
<RadioGroup
  label="Sync Mode"
  value={sync.sync_mode}
  onChange={(v) => onChange({ ...sync, sync_mode: v as "full" | "delta" })}
  options={[
    {
      label: "Full Sync",
      value: "full",
      description: "Scan all tables and fields every time"
    },
    {
      label: "Delta Sync",
      value: "delta",
      description: "Only sync new tables and columns since last run"
    }
  ]}
/>

// Schedule Configuration
<FormSection title="Schedule" collapsible>
  <Toggle
    label="Enable Scheduled Sync"
    checked={sync.schedule?.enabled || false}
    onChange={(v) => onChange({
      ...sync,
      schedule: { ...sync.schedule, enabled: v }
    })}
  />

  {sync.schedule?.enabled && (
    <>
      <Select
        label="Frequency"
        value={sync.schedule.frequency}
        onChange={(v) => onChange({
          ...sync,
          schedule: { ...sync.schedule, frequency: v }
        })}
        options={[
          { label: "Manual Only", value: "manual" },
          { label: "Hourly", value: "hourly" },
          { label: "Daily", value: "daily" },
          { label: "Weekly", value: "weekly" },
          { label: "Custom Cron", value: "custom" }
        ]}
      />

      {sync.schedule.frequency === "daily" && (
        <TextInput
          label="Time (HH:MM:SS)"
          value={sync.schedule.time || "02:00:00"}
          onChange={(v) => onChange({
            ...sync,
            schedule: { ...sync.schedule, time: v }
          })}
          placeholder="02:00:00"
        />
      )}

      {sync.schedule.frequency === "custom" && (
        <TextInput
          label="Cron Expression"
          value={sync.schedule.cron_expression || ""}
          onChange={(v) => onChange({
            ...sync,
            schedule: { ...sync.schedule, cron_expression: v }
          })}
          placeholder="0 */6 * * *"
          description="Cron expression for custom scheduling"
        />
      )}
    </>
  )}
</FormSection>
```

### 2. Lineage Section Extension

Add to `LineageDetectionSection` component:

```typescript
<FormSection title="Schema Change Detection" collapsible>
  <Toggle
    label="Enable Schema Change Detection"
    checked={lineage.schema_change_detection?.enabled || false}
    onChange={(v) => onChange({
      ...lineage,
      schema_change_detection: {
        ...lineage.schema_change_detection,
        enabled: v
      }
    })}
  />

  {lineage.schema_change_detection?.enabled && (
    <CheckboxGroup
      label="Track Changes For"
      values={[
        lineage.schema_change_detection.track_new_tables ? "new_tables" : "",
        lineage.schema_change_detection.track_new_columns ? "new_columns" : "",
        lineage.schema_change_detection.track_removed_columns ? "removed_columns" : "",
        lineage.schema_change_detection.track_type_changes ? "type_changes" : ""
      ].filter(Boolean)}
      onChange={(values) => onChange({
        ...lineage,
        schema_change_detection: {
          ...lineage.schema_change_detection,
          track_new_tables: values.includes("new_tables"),
          track_new_columns: values.includes("new_columns"),
          track_removed_columns: values.includes("removed_columns"),
          track_type_changes: values.includes("type_changes")
        }
      })}
      options={[
        { label: "New Tables", value: "new_tables" },
        { label: "New Columns", value: "new_columns" },
        { label: "Removed Columns", value: "removed_columns" },
        { label: "Type Changes", value: "type_changes" }
      ]}
    />
  )}
</FormSection>
```

### 3. Validation Section Extension

Add to `ValidationSection` component:

```typescript
<RadioGroup
  label="Validation Mode"
  value={validation.mode}
  onChange={(v) => onChange({
    ...validation,
    mode: v as "lenient" | "strict"
  })}
  options={[
    {
      label: "Lenient",
      value: "lenient",
      description: "Show warnings but allow sync to proceed"
    },
    {
      label: "Strict",
      value: "strict",
      description: "Block sync if validation errors occur"
    }
  ]}
/>
```

## Implementation Estimate

- **Type Updates**: 30 minutes
- **Component Updates**: 2-3 hours
- **Testing**: 1-2 hours
- **Documentation**: 30 minutes

**Total: 4-6 hours of development**
