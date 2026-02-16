/**
 * Field Metadata Types
 * Based on the semantic_layer field_metadata table schema
 */

export interface FieldMetadata {
  // Non-editable fields
  time: number;
  database_name: string;
  table_name: string;

  // Editable fields
  field_name: string;
  data_type: string;
  description?: string;
  business_definition?: string;
  tags?: string[];
  is_pii?: boolean;
  pii_category?: string;
  sensitivity_level?: string;
  owner?: string;
  steward?: string;
  last_modified_by?: string;
  quality_score?: number;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseInfo {
  database_name: string;
  table_count: number;
  tables: string[];
}

export interface FilterOptions {
  database?: string;
  table?: string;
}

export interface UpdateRequest {
  database_name: string;
  table_name: string;
  field_name: string;
  updates: Partial<FieldMetadata>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
