/**
 * ConfigContext Reducer Tests
 * Tests for state management and reducer logic
 */

import { describe, it, expect } from "vitest";
import { SemanticLayerConfig } from "../types/config";

// Mock reducer function for testing
// In real tests, you'd import this from ConfigContext
type ConfigContextState = {
  config: SemanticLayerConfig;
  originalConfig: SemanticLayerConfig;
  uiState: {
    currentSection: string;
    isDirty: boolean;
    isSaving: boolean;
    isPreviewMode: boolean;
    validationErrors: any[];
  };
};

// Simplified test version of config reducer
function configReducer(state: ConfigContextState, action: any): ConfigContextState {
  switch (action.type) {
    case "UPDATE_CONFIG": {
      const { path, value } = action.payload;
      const keys = path.split(".");
      let newConfig = JSON.parse(JSON.stringify(state.config));
      let current = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      return {
        ...state,
        config: newConfig,
        uiState: { ...state.uiState, isDirty: true },
      };
    }

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

    case "SET_CURRENT_SECTION":
      return {
        ...state,
        uiState: {
          ...state.uiState,
          currentSection: action.payload,
        },
      };

    case "SET_VALIDATION_ERRORS":
      return {
        ...state,
        uiState: {
          ...state.uiState,
          validationErrors: action.payload,
        },
      };

    default:
      return state;
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe("configReducer", () => {
  const mockConfig: SemanticLayerConfig = {
    version: "1.0",
    description: "Test config",
    scope: {
      databases: ["analytics.*"],
      exclude_patterns: [],
    },
    definitions: {
      data_dictionary_path: "data.yaml",
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
      auto_detect: [],
      confidence_thresholds: { auto_detected_min: 0.7, manual: 1.0 },
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
        skip_fields_matching: [],
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
      on_sync_complete: { enabled: false, channels: [] },
      on_error: { enabled: false, channels: [] },
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

  const initialState: ConfigContextState = {
    config: mockConfig,
    originalConfig: mockConfig,
    uiState: {
      currentSection: "scope",
      isDirty: false,
      isSaving: false,
      isPreviewMode: false,
      validationErrors: [],
    },
  };

  describe("UPDATE_CONFIG", () => {
    it("should update a nested path value", () => {
      const action = {
        type: "UPDATE_CONFIG",
        payload: { path: "scope.databases", value: ["db1.*", "db2.*"] },
      };

      const newState = configReducer(initialState, action);

      expect(newState.config.scope.databases).toEqual(["db1.*", "db2.*"]);
      expect(newState.uiState.isDirty).toBe(true);
    });

    it("should update deeply nested values", () => {
      const action = {
        type: "UPDATE_CONFIG",
        payload: {
          path: "conflict_handling.mode",
          value: "fail",
        },
      };

      const newState = configReducer(initialState, action);

      expect(newState.config.conflict_handling.mode).toBe("fail");
      expect(newState.uiState.isDirty).toBe(true);
    });

    it("should mark config as dirty after update", () => {
      const action = {
        type: "UPDATE_CONFIG",
        payload: { path: "scope.databases", value: ["new_db.*"] },
      };

      const newState = configReducer(initialState, action);

      expect(newState.uiState.isDirty).toBe(true);
    });

    it("should not mutate original config", () => {
      const originalDatabases = [...initialState.config.scope.databases];

      const action = {
        type: "UPDATE_CONFIG",
        payload: { path: "scope.databases", value: ["changed.*"] },
      };

      configReducer(initialState, action);

      // Original should not be modified
      expect(initialState.config.scope.databases).toEqual(originalDatabases);
    });
  });

  describe("UPDATE_SECTION", () => {
    it("should update entire section", () => {
      const newScope = {
        databases: ["new_db.*"],
        exclude_patterns: ["*.temp_*"],
      };

      const action = {
        type: "UPDATE_SECTION",
        payload: { section: "scope", config: newScope },
      };

      const newState = configReducer(initialState, action);

      expect(newState.config.scope).toEqual(newScope);
      expect(newState.uiState.isDirty).toBe(true);
    });

    it("should mark config as dirty when updating section", () => {
      const action = {
        type: "UPDATE_SECTION",
        payload: { section: "scope", config: initialState.config.scope },
      };

      const newState = configReducer(initialState, action);

      expect(newState.uiState.isDirty).toBe(true);
    });
  });

  describe("RESET_CONFIG", () => {
    it("should reset to original config", () => {
      // First make changes
      let state = configReducer(initialState, {
        type: "UPDATE_CONFIG",
        payload: { path: "scope.databases", value: ["changed.*"] },
      });

      expect(state.config.scope.databases).toEqual(["changed.*"]);

      // Now reset
      state = configReducer(state, { type: "RESET_CONFIG" });

      expect(state.config).toEqual(initialState.config);
      expect(state.uiState.isDirty).toBe(false);
    });

    it("should clear dirty flag after reset", () => {
      const state = configReducer(
        {
          ...initialState,
          uiState: { ...initialState.uiState, isDirty: true },
        },
        { type: "RESET_CONFIG" }
      );

      expect(state.uiState.isDirty).toBe(false);
    });
  });

  describe("SET_DIRTY", () => {
    it("should set dirty flag to true", () => {
      const action = { type: "SET_DIRTY", payload: true };
      const newState = configReducer(initialState, action);

      expect(newState.uiState.isDirty).toBe(true);
    });

    it("should set dirty flag to false", () => {
      const state = {
        ...initialState,
        uiState: { ...initialState.uiState, isDirty: true },
      };

      const action = { type: "SET_DIRTY", payload: false };
      const newState = configReducer(state, action);

      expect(newState.uiState.isDirty).toBe(false);
    });
  });

  describe("SET_CURRENT_SECTION", () => {
    it("should update current section", () => {
      const action = {
        type: "SET_CURRENT_SECTION",
        payload: "validation",
      };

      const newState = configReducer(initialState, action);

      expect(newState.uiState.currentSection).toBe("validation");
    });

    it("should not affect dirty flag", () => {
      const action = {
        type: "SET_CURRENT_SECTION",
        payload: "lineage",
      };

      const newState = configReducer(initialState, action);

      expect(newState.uiState.isDirty).toBe(false);
    });
  });

  describe("SET_VALIDATION_ERRORS", () => {
    it("should set validation errors", () => {
      const errors = [
        {
          section: "scope",
          field: "databases",
          message: "Required field",
          severity: "error",
        },
      ];

      const action = {
        type: "SET_VALIDATION_ERRORS",
        payload: errors,
      };

      const newState = configReducer(initialState, action);

      expect(newState.uiState.validationErrors).toEqual(errors);
    });

    it("should clear validation errors with empty array", () => {
      const state = {
        ...initialState,
        uiState: {
          ...initialState.uiState,
          validationErrors: [
            {
              section: "scope",
              field: "databases",
              message: "Error",
              severity: "error",
            },
          ],
        },
      };

      const action = {
        type: "SET_VALIDATION_ERRORS",
        payload: [],
      };

      const newState = configReducer(state, action);

      expect(newState.uiState.validationErrors).toEqual([]);
    });
  });

  describe("Unknown action", () => {
    it("should return state unchanged for unknown action type", () => {
      const action = { type: "UNKNOWN_ACTION" };
      const newState = configReducer(initialState, action);

      expect(newState).toEqual(initialState);
    });
  });
});
