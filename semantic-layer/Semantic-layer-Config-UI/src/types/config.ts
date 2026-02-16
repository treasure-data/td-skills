/**
 * Semantic Layer Configuration Types
 * Matches the config.yaml structure
 */

// ============================================================================
// SCOPE
// ============================================================================
export interface ScopeConfig {
  databases: string[];
  exclude_patterns: string[];
}

// ============================================================================
// DEFINITIONS
// ============================================================================
export interface DefinitionsConfig {
  data_dictionary_path: string | string[];
  glossary_path?: string | string[];
  relationships_path?: string | string[];
  governance_path?: string | string[];
}

// ============================================================================
// SEMANTIC DATABASE
// ============================================================================
export interface SemanticDatabaseTableConfig {
  field_metadata: string;
  glossary: string;
  field_lineage: string;
  field_relationships: string;
  field_usage: string;
  governance: string;
  sync_history: string;
  impact_analysis: string;
}

export interface SemanticDatabaseConfig {
  name: string;
  create_if_missing: boolean;
  tables: SemanticDatabaseTableConfig;
}

// ============================================================================
// LINEAGE DETECTION
// ============================================================================
export interface LineageAutoDetectItem {
  type: "dbt" | "workflow" | "schema_comments" | "schema_changes";
  enabled: boolean;
  paths?: string[];
  include_column_level?: boolean;
  include_transformations?: boolean;
  pattern?: string;
  track_new_tables?: boolean;
  track_new_columns?: boolean;
  track_removed_columns?: boolean;
  track_type_changes?: boolean;
}

export interface LineageConfidenceThresholds {
  auto_detected_min: number;
  manual: number;
}

export interface LineageConfig {
  auto_detect: LineageAutoDetectItem[];
  manual?: {
    relationships_path: string;
  };
  confidence_thresholds: LineageConfidenceThresholds;
  generate_impact_analysis: boolean;
  track_downstream_tables: boolean;
}

// ============================================================================
// CONFLICT HANDLING
// ============================================================================
export interface ConflictHandlingSchemaChanges {
  new_fields: "warn" | "error";
  removed_fields: "warn" | "error";
  type_changes: "warn" | "error";
}

export interface ConflictHandlingConfig {
  mode: "fail" | "warn" | "auto_generate";
  auto_generate_for_missing: boolean;
  overwrite_existing_descriptions: boolean;
  on_schema_changes: ConflictHandlingSchemaChanges;
}

// ============================================================================
// VALIDATION
// ============================================================================
export interface ValidationCustomRule {
  field_pattern: string;
  should_have_tag?: string;
  hint: string;
}

export interface ValidationPiiRules {
  require_pii_category: boolean;
  require_owner: boolean;
  require_data_classification: boolean;
}

export interface ValidationConfig {
  require_table_description: boolean;
  require_field_description: boolean;
  require_owner_for_tables: boolean;
  require_owner_for_pii_fields: boolean;
  require_business_term_for_metrics: boolean;
  pii_validation: ValidationPiiRules;
  custom_rules: ValidationCustomRule[];
}

// ============================================================================
// AUTO-GENERATION
// ============================================================================
export interface AutoGenerationPattern {
  name: string;
  match: string[];
  tag: string;
  description_template: string;
  pii_category: string | null;
}

export interface AutoGenerationContentRules {
  prefix_auto_generated: string;
  overwrite_existing: boolean;
  overwrite_auto_generated: boolean;
  skip_fields_matching: string[];
}

export interface AutoGenerationGenerate {
  field_descriptions: boolean;
  tags: boolean;
  pii_detection: boolean;
  business_terms: boolean;
  data_classification: boolean;
}

export interface AutoGenerationConfig {
  enabled: boolean;
  content_rules: AutoGenerationContentRules;
  generate: AutoGenerationGenerate;
  patterns: AutoGenerationPattern[];
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export interface NotificationChannel {
  type: "slack" | "email";
  channel?: string;
  recipients?: string[];
  subject?: string;
  message_template?: string;
}

export interface NotificationTrigger {
  enabled: boolean;
  channels: NotificationChannel[];
}

export interface NotificationsConfig {
  on_sync_complete: NotificationTrigger;
  on_error: NotificationTrigger;
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================
export interface ApprovalConfig {
  require_dry_run: boolean;
  require_approval_for: {
    field_removals: boolean;
    type_changes: boolean;
    owner_changes: boolean;
    pii_reclassification: boolean;
  };
  auto_approve_for: {
    description_updates: boolean;
    tag_additions: boolean;
    comment_updates: boolean;
  };
}

// ============================================================================
// SYNC BEHAVIOR
// ============================================================================
export interface ScheduleConfig {
  enabled: boolean;
  frequency: "manual" | "hourly" | "daily" | "weekly" | "custom";
  time?: string; // HH:MM:SS format for daily/weekly
  day_of_week?: string; // For weekly (Monday, Tuesday, etc.)
  cron_expression?: string; // For custom cron
}

export interface SyncConfig {
  merge_strategy: "manual_wins" | "auto_overwrites" | "merge_both";
  create_backup: boolean;
  dry_run_by_default: boolean;
  audit_logging: boolean;
  batch_size: number;
  sync_mode: "full" | "delta"; // Full scan vs incremental
  schedule: ScheduleConfig;
}

// ============================================================================
// TESTING
// ============================================================================
export interface TestingConfig {
  enabled: boolean;
  sample_database: string | null;
  report_level: "quiet" | "normal" | "verbose" | "debug";
}

// ============================================================================
// ENVIRONMENT
// ============================================================================
export interface EnvironmentOverrides {
  scope?: Partial<ScopeConfig>;
  semantic_database?: Partial<SemanticDatabaseConfig>;
  lineage?: Partial<LineageConfig>;
  conflict_handling?: Partial<ConflictHandlingConfig>;
  validation?: Partial<ValidationConfig>;
  auto_generation?: Partial<AutoGenerationConfig>;
  notifications?: Partial<NotificationsConfig>;
  approval?: Partial<ApprovalConfig>;
  sync?: Partial<SyncConfig>;
  testing?: Partial<TestingConfig>;
}

export interface EnvironmentConfig {
  [key: string]: EnvironmentOverrides;
}

// ============================================================================
// ROOT CONFIG
// ============================================================================
export interface SemanticLayerConfig {
  version: string;
  description: string;
  scope: ScopeConfig;
  definitions: DefinitionsConfig;
  semantic_database: SemanticDatabaseConfig;
  lineage: LineageConfig;
  conflict_handling: ConflictHandlingConfig;
  validation: ValidationConfig;
  auto_generation: AutoGenerationConfig;
  notifications: NotificationsConfig;
  approval: ApprovalConfig;
  sync: SyncConfig;
  testing: TestingConfig;
  environments?: EnvironmentConfig;
}

// ============================================================================
// UI STATE
// ============================================================================
export interface ConfigValidationError {
  section: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ConfigUIState {
  currentSection: "scope" | "definitions" | "semantic-database" | "lineage" | "validation" | "auto-generation" | "advanced" | "environments";
  currentEnvironment: string;
  isDirty: boolean;
  isSaving: boolean;
  isPreviewMode: boolean;
  validationErrors: ConfigValidationError[];
  lastSavedAt?: Date;
}
