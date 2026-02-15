-- semantic_layer/01_create_semantic_database_v1.sql
-- Create Treasure Data semantic layer v1 and all metadata tables
-- Simplified syntax for Treasure Data (removes USING PARQUET, PARTITION BY)

-- ============================================================================
-- 1. FIELD METADATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.field_metadata (
  database_name VARCHAR,
  table_name VARCHAR,
  field_name VARCHAR,
  tags ARRAY(VARCHAR),
  business_term VARCHAR,
  is_pii BOOLEAN,
  pii_category VARCHAR,
  owner VARCHAR,
  steward_email VARCHAR,
  data_classification VARCHAR,
  valid_values ARRAY(VARCHAR),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by VARCHAR
);

-- ============================================================================
-- 2. GLOSSARY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.glossary (
  term VARCHAR,
  definition VARCHAR,
  abbreviation VARCHAR,
  owner VARCHAR,
  related_fields ARRAY(VARCHAR),
  business_rule VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_reviewed_at TIMESTAMP,
  reviewed_by VARCHAR,
  version INT
);

-- ============================================================================
-- 3. FIELD LINEAGE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.field_lineage (
  golden_database VARCHAR,
  golden_table VARCHAR,
  golden_field VARCHAR,
  source_database VARCHAR,
  source_table VARCHAR,
  source_field VARCHAR,
  lineage_type VARCHAR,
  transformation_logic VARCHAR,
  dbt_model VARCHAR,
  dbt_depends_on ARRAY(VARCHAR),
  workflow_path VARCHAR,
  workflow_name VARCHAR,
  ml_model_name VARCHAR,
  ml_model_version VARCHAR,
  lineage_confidence DOUBLE,
  verified_at TIMESTAMP,
  verified_by VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ============================================================================
-- 4. FIELD RELATIONSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.field_relationships (
  relationship_name VARCHAR,
  from_field VARCHAR,
  to_field VARCHAR,
  relationship_type VARCHAR,
  cardinality VARCHAR,
  join_logic VARCHAR,
  description VARCHAR,
  criticality VARCHAR,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  verified_at TIMESTAMP
);

-- ============================================================================
-- 5. FIELD USAGE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.field_usage (
  database_name VARCHAR,
  table_name VARCHAR,
  field_name VARCHAR,
  query_count BIGINT,
  user_count INT,
  distinct_users ARRAY(VARCHAR),
  last_queried TIMESTAMP,
  last_queried_by VARCHAR,
  avg_query_time_ms DOUBLE,
  is_deprecated BOOLEAN,
  deprecation_reason VARCHAR,
  deprecation_date DATE,
  replacement_field VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ============================================================================
-- 6. GOVERNANCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.governance (
  database_name VARCHAR,
  table_name VARCHAR,
  field_name VARCHAR,
  owner VARCHAR,
  steward_email VARCHAR,
  sla_refresh_frequency VARCHAR,
  sla_max_staleness_hours INT,
  requires_approval BOOLEAN,
  approval_group VARCHAR,
  data_classification VARCHAR,
  retention_days INT,
  retention_policy VARCHAR,
  is_sensitive BOOLEAN,
  audit_logging_required BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR
);

-- ============================================================================
-- 7. SYNC HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.sync_history (
  sync_id VARCHAR,
  sync_timestamp TIMESTAMP,
  sync_type VARCHAR,
  git_commit_hash VARCHAR,
  git_branch VARCHAR,
  databases_synced INT,
  tables_synced INT,
  fields_synced INT,
  descriptions_added INT,
  descriptions_updated INT,
  tags_updated INT,
  lineage_added INT,
  glossary_terms_added INT,
  glossary_terms_updated INT,
  conflicts_detected INT,
  conflicts_resolved INT,
  warnings_count INT,
  errors_count INT,
  status VARCHAR,
  summary_message VARCHAR,
  duration_seconds INT,
  sync_initiated_by VARCHAR,
  config_file_hash VARCHAR,
  created_at TIMESTAMP
);

-- ============================================================================
-- 8. IMPACT ANALYSIS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.impact_analysis (
  source_database VARCHAR,
  source_table VARCHAR,
  source_field VARCHAR,
  downstream_database VARCHAR,
  downstream_table VARCHAR,
  downstream_field VARCHAR,
  impact_type VARCHAR,
  impact_level INT,
  criticality VARCHAR,
  affected_users INT,
  affected_dashboards INT,
  affected_dashboards_list ARRAY(VARCHAR),
  recovery_time_minutes INT,
  created_at TIMESTAMP
);

-- ============================================================================
-- 9. TABLE DEPENDENCIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.table_dependencies (
  database_name VARCHAR,
  table_name VARCHAR,
  depends_on_database VARCHAR,
  depends_on_table VARCHAR,
  dependency_type VARCHAR,
  refresh_frequency VARCHAR,
  lag_hours INT,
  materialization VARCHAR,
  partitioning_key VARCHAR,
  replication_factor INT,
  created_at TIMESTAMP
);

-- ============================================================================
-- 10. VALIDATION ERRORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.validation_errors (
  error_id VARCHAR,
  sync_id VARCHAR,
  error_type VARCHAR,
  severity VARCHAR,
  database_name VARCHAR,
  table_name VARCHAR,
  field_name VARCHAR,
  message VARCHAR,
  suggested_fix VARCHAR,
  is_resolved BOOLEAN,
  created_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR
);

-- ============================================================================
-- 11. CONFIG VERSION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semantic_layer_v1.config_versions (
  config_version_id VARCHAR,
  config_file_name VARCHAR,
  config_hash VARCHAR,
  config_content VARCHAR,
  git_commit_hash VARCHAR,
  applied_at TIMESTAMP,
  applied_by VARCHAR,
  revertable_until TIMESTAMP,
  created_at TIMESTAMP
);

-- ============================================================================
-- SUCCESS
-- ============================================================================
-- Semantic layer v1 created successfully!
-- 11 tables are now ready for data population
-- Database: semantic_layer_v1
