/**
 * Configuration Store/Context for State Management
 * Using React Context + useReducer for state management
 */

import React, { createContext, useReducer, useCallback } from "react";
import {
  SemanticLayerConfig,
  ConfigUIState,
  ConfigValidationError,
} from "../types/config";

// ============================================================================
// CONTEXT TYPES
// ============================================================================
export interface ConfigContextType {
  state: ConfigContextState;
  dispatch: React.Dispatch<ConfigAction>;
  // Convenience methods
  updateConfig: (path: string, value: any) => void;
  updateSection: (
    section: ConfigContextState["uiState"]["currentSection"],
    config: any
  ) => void;
  setCurrentSection: (section: string) => void;
  setCurrentEnvironment: (env: string) => void;
  saveConfig: () => Promise<void>;
  loadConfig: (config: SemanticLayerConfig) => void;
  resetConfig: () => void;
  setValidationErrors: (errors: ConfigValidationError[]) => void;
  clearValidationErrors: () => void;
}

export interface ConfigContextState {
  config: SemanticLayerConfig;
  originalConfig: SemanticLayerConfig;
  uiState: ConfigUIState;
  isLoading: boolean;
  error: string | null;
}

export type ConfigAction =
  | {
      type: "UPDATE_CONFIG";
      payload: { path: string; value: any };
    }
  | {
      type: "UPDATE_SECTION";
      payload: {
        section: string;
        config: any;
      };
    }
  | {
      type: "SET_CURRENT_SECTION";
      payload: string;
    }
  | {
      type: "SET_CURRENT_ENVIRONMENT";
      payload: string;
    }
  | {
      type: "LOAD_CONFIG";
      payload: SemanticLayerConfig;
    }
  | {
      type: "RESET_CONFIG";
    }
  | {
      type: "SET_DIRTY";
      payload: boolean;
    }
  | {
      type: "SET_SAVING";
      payload: boolean;
    }
  | {
      type: "SET_PREVIEW_MODE";
      payload: boolean;
    }
  | {
      type: "SET_VALIDATION_ERRORS";
      payload: ConfigValidationError[];
    }
  | {
      type: "CLEAR_VALIDATION_ERRORS";
    }
  | {
      type: "SET_ERROR";
      payload: string | null;
    }
  | {
      type: "SET_LAST_SAVED";
    };

// ============================================================================
// DEFAULT CONFIG
// ============================================================================
const defaultConfig: SemanticLayerConfig = {
  version: "1.0",
  description: "Semantic layer configuration for organization's data",
  scope: {
    databases: ["analytics.*"],
    exclude_patterns: ["*.temp_*", "*.audit_*"],
  },
  definitions: {
    data_dictionary_path: "data_dictionary.yaml",
    glossary_path: "glossary.md",
    relationships_path: "relationships.yaml",
    governance_path: "governance.yaml",
  },
  semantic_database: {
    name: "semantic_layer_v1",
    create_if_missing: true,
    tables: {
      field_metadata: "field_metadata",
      glossary: "glossary",
      field_lineage: "field_lineage",
      field_relationships: "field_relationships",
      field_usage: "field_usage",
      governance: "governance",
      sync_history: "sync_history",
      impact_analysis: "impact_analysis",
    },
  },
  lineage: {
    auto_detect: [
      {
        type: "dbt",
        enabled: true,
        paths: ["dbt/", "analytics/dbt/"],
        include_column_level: true,
      },
      {
        type: "workflow",
        enabled: true,
        paths: ["workflows/", "digdag/"],
        include_transformations: true,
      },
      {
        type: "schema_comments",
        enabled: true,
        pattern: "Lineage: .*",
      },
    ],
    confidence_thresholds: {
      auto_detected_min: 0.7,
      manual: 1.0,
    },
    generate_impact_analysis: true,
    track_downstream_tables: true,
  },
  conflict_handling: {
    mode: "warn",
    auto_generate_for_missing: false,
    overwrite_existing_descriptions: false,
    on_schema_changes: {
      new_fields: "warn",
      removed_fields: "warn",
      type_changes: "error",
    },
  },
  validation: {
    require_table_description: true,
    require_field_description: true,
    require_owner_for_tables: true,
    require_owner_for_pii_fields: true,
    require_business_term_for_metrics: false,
    pii_validation: {
      require_pii_category: true,
      require_owner: true,
      require_data_classification: true,
    },
    custom_rules: [],
  },
  auto_generation: {
    enabled: true,
    content_rules: {
      prefix_auto_generated: "[AUTO]",
      overwrite_existing: false,
      overwrite_auto_generated: false,
      skip_fields_matching: ["time", "td_*"],
    },
    generate: {
      field_descriptions: true,
      tags: true,
      pii_detection: true,
      business_terms: false,
      data_classification: false,
    },
    patterns: [],
  },
  notifications: {
    on_sync_complete: {
      enabled: false,
      channels: [],
    },
    on_error: {
      enabled: false,
      channels: [],
    },
  },
  approval: {
    require_dry_run: true,
    require_approval_for: {
      field_removals: true,
      type_changes: true,
      owner_changes: true,
      pii_reclassification: true,
    },
    auto_approve_for: {
      description_updates: true,
      tag_additions: true,
      comment_updates: true,
    },
  },
  sync: {
    merge_strategy: "manual_wins",
    create_backup: true,
    dry_run_by_default: true,
    audit_logging: true,
    batch_size: 100,
  },
  testing: {
    enabled: false,
    sample_database: null,
    report_level: "normal",
  },
};

const defaultUIState: ConfigUIState = {
  currentSection: "scope",
  currentEnvironment: "default",
  isDirty: false,
  isSaving: false,
  isPreviewMode: false,
  validationErrors: [],
};

const initialState: ConfigContextState = {
  config: defaultConfig,
  originalConfig: defaultConfig,
  uiState: defaultUIState,
  isLoading: false,
  error: null,
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Configuration state reducer
 * Handles all state mutations for the config manager
 *
 * @param state Current configuration state
 * @param action Action to dispatch
 * @returns Updated state
 *
 * @example
 * // Update nested property like "scope.databases"
 * dispatch({ type: "UPDATE_CONFIG", payload: { path: "scope.databases", value: ["db1.*"] } })
 *
 * @example
 * // Update entire section like "validation"
 * dispatch({ type: "UPDATE_SECTION", payload: { section: "validation", config: {...} } })
 */
function configReducer(
  state: ConfigContextState,
  action: ConfigAction
): ConfigContextState {
  switch (action.type) {
    // Update config at nested path (e.g., "scope.databases" → scope { databases: [...] })
    // Uses dot notation to support deeply nested updates like "lineage.auto_detect[0].enabled"
    case "UPDATE_CONFIG": {
      const { path, value } = action.payload;
      const keys = path.split(".");
      // Deep clone to avoid mutations
      let newConfig = JSON.parse(JSON.stringify(state.config));
      let current = newConfig;

      // Navigate to parent object by following the path (all keys except last)
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      // Update the final key in parent object
      current[keys[keys.length - 1]] = value;

      return {
        ...state,
        config: newConfig,
        uiState: { ...state.uiState, isDirty: true },
      };
    }

    // Update entire section at once (more efficient than UPDATE_CONFIG for large objects)
    case "UPDATE_SECTION": {
      const { section, config } = action.payload;
      return {
        ...state,
        config: {
          ...state.config,
          [section]: config,
        },
        uiState: { ...state.uiState, isDirty: true },
      };
    }

    case "SET_CURRENT_SECTION":
      return {
        ...state,
        uiState: {
          ...state.uiState,
          currentSection:
            action.payload as ConfigUIState["currentSection"],
        },
      };

    case "SET_CURRENT_ENVIRONMENT":
      return {
        ...state,
        uiState: {
          ...state.uiState,
          currentEnvironment: action.payload,
        },
      };

    case "LOAD_CONFIG":
      return {
        ...state,
        config: action.payload,
        originalConfig: action.payload,
        uiState: { ...state.uiState, isDirty: false },
      };

    case "RESET_CONFIG":
      return {
        ...state,
        config: JSON.parse(JSON.stringify(state.originalConfig)),
        uiState: { ...state.uiState, isDirty: false },
      };

    case "SET_DIRTY":
      return {
        ...state,
        uiState: { ...state.uiState, isDirty: action.payload },
      };

    case "SET_SAVING":
      return {
        ...state,
        uiState: { ...state.uiState, isSaving: action.payload },
      };

    case "SET_PREVIEW_MODE":
      return {
        ...state,
        uiState: { ...state.uiState, isPreviewMode: action.payload },
      };

    case "SET_VALIDATION_ERRORS":
      return {
        ...state,
        uiState: {
          ...state.uiState,
          validationErrors: action.payload,
        },
      };

    case "CLEAR_VALIDATION_ERRORS":
      return {
        ...state,
        uiState: {
          ...state.uiState,
          validationErrors: [],
        },
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "SET_LAST_SAVED":
      return {
        ...state,
        uiState: {
          ...state.uiState,
          isDirty: false,
          lastSavedAt: new Date(),
        },
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================
export const ConfigContext = createContext<ConfigContextType | undefined>(
  undefined
);

// ============================================================================
// PROVIDER
// ============================================================================
export interface ConfigProviderProps {
  children: React.ReactNode;
  onSave?: (config: SemanticLayerConfig) => Promise<void>;
  initialConfig?: SemanticLayerConfig;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  children,
  onSave,
  initialConfig,
}) => {
  const [state, dispatch] = useReducer(
    configReducer,
    initialConfig
      ? {
          ...initialState,
          config: initialConfig,
          originalConfig: initialConfig,
        }
      : initialState
  );

  // Convenience methods
  const updateConfig = useCallback((path: string, value: any) => {
    dispatch({
      type: "UPDATE_CONFIG",
      payload: { path, value },
    });
  }, []);

  const updateSection = useCallback(
    (section: ConfigUIState["currentSection"], config: any) => {
      dispatch({
        type: "UPDATE_SECTION",
        payload: { section, config },
      });
    },
    []
  );

  const setCurrentSection = useCallback((section: string) => {
    dispatch({
      type: "SET_CURRENT_SECTION",
      payload: section,
    });
  }, []);

  const setCurrentEnvironment = useCallback((env: string) => {
    dispatch({
      type: "SET_CURRENT_ENVIRONMENT",
      payload: env,
    });
  }, []);

  const saveConfig = useCallback(async () => {
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      if (onSave) {
        await onSave(state.config);
      }
      dispatch({ type: "SET_LAST_SAVED" });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to save config",
      });
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [state.config, onSave]);

  const loadConfig = useCallback((config: SemanticLayerConfig) => {
    dispatch({
      type: "LOAD_CONFIG",
      payload: config,
    });
  }, []);

  const resetConfig = useCallback(() => {
    dispatch({ type: "RESET_CONFIG" });
  }, []);

  const setValidationErrors = useCallback((errors: ConfigValidationError[]) => {
    dispatch({
      type: "SET_VALIDATION_ERRORS",
      payload: errors,
    });
  }, []);

  const clearValidationErrors = useCallback(() => {
    dispatch({ type: "CLEAR_VALIDATION_ERRORS" });
  }, []);

  const value: ConfigContextType = {
    state,
    dispatch,
    updateConfig,
    updateSection,
    setCurrentSection,
    setCurrentEnvironment,
    saveConfig,
    loadConfig,
    resetConfig,
    setValidationErrors,
    clearValidationErrors,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================
export const useConfigContext = (): ConfigContextType => {
  const context = React.useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfigContext must be used within ConfigProvider");
  }
  return context;
};
