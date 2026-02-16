/**
 * Main Application Component
 * Orchestrates all sections and manages the overall UI flow
 */

import React, { useState, useEffect } from "react";
import { useConfigContext } from "../context/ConfigContext";
import {
  ScopeSection,
  DefinitionsSection,
  SemanticDatabaseSection,
  LineageDetectionSection,
  ConflictHandlingSection,
  ValidationSection,
  AutoGenerationSection,
  NotificationsSection,
  ApprovalWorkflowSection,
  SyncBehaviorSection,
  TestingSection,
} from "./SectionComponents";
import {
  TopTabNavigation,
  Header,
  Footer,
  MainLayout,
  ValidationSummary,
  KeyboardShortcutsModal,
  AdvancedTabs,
} from "./Layout";
import { Alert } from "./FormComponents";

// ============================================================================
// CONFIG MANAGER APP
// ============================================================================
export const SemanticLayerConfigManager: React.FC = () => {
  const { state, updateSection, setCurrentSection, saveConfig, resetConfig } =
    useConfigContext();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [advancedTab, setAdvancedTab] = useState("notifications");

  const {
    config,
    uiState: {
      currentSection,
      isDirty,
      isSaving,
      isPreviewMode,
      validationErrors,
      lastSavedAt,
    },
  } = state;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveConfig();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        resetConfig();
      }
      if (e.key === "?") {
        setShowShortcutsModal(true);
      }
      if (e.key === "Escape") {
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveConfig, resetConfig]);

  // Section content renderer
  const renderSection = () => {
    switch (currentSection) {
      case "scope":
        return (
          <ScopeSection
            scope={config.scope}
            onChange={(scope) => updateSection("scope", scope)}
          />
        );

      case "definitions":
        return (
          <DefinitionsSection
            definitions={config.definitions}
            onChange={(definitions) =>
              updateSection("definitions", definitions)
            }
          />
        );

      case "semantic-database":
        return (
          <SemanticDatabaseSection
            semanticDatabase={config.semantic_database}
            onChange={(semanticDatabase) =>
              updateSection("semantic_database", semanticDatabase)
            }
          />
        );

      case "lineage":
        return (
          <LineageDetectionSection
            lineage={config.lineage}
            onChange={(lineage) => updateSection("lineage", lineage)}
          />
        );

      case "validation":
        return (
          <>
            <ConflictHandlingSection
              conflictHandling={config.conflict_handling}
              onChange={(conflictHandling) =>
                updateSection("conflict_handling", conflictHandling)
              }
            />
            <ValidationSection
              validation={config.validation}
              onChange={(validation) =>
                updateSection("validation", validation)
              }
            />
          </>
        );

      case "auto-generation":
        return (
          <AutoGenerationSection
            autoGeneration={config.auto_generation}
            onChange={(autoGeneration) =>
              updateSection("auto_generation", autoGeneration)
            }
          />
        );

      case "advanced":
        return (
          <div className="advanced-section">
            <AdvancedTabs
              activeTab={advancedTab}
              onTabChange={setAdvancedTab}
            />

            {advancedTab === "notifications" && (
              <NotificationsSection
                notifications={config.notifications}
                onChange={(notifications) =>
                  updateSection("notifications", notifications)
                }
              />
            )}

            {advancedTab === "approval" && (
              <ApprovalWorkflowSection
                approval={config.approval}
                onChange={(approval) =>
                  updateSection("approval", approval)
                }
              />
            )}

            {advancedTab === "sync" && (
              <SyncBehaviorSection
                sync={config.sync}
                onChange={(sync) => updateSection("sync", sync)}
              />
            )}

            {advancedTab === "testing" && (
              <TestingSection
                testing={config.testing}
                onChange={(testing) =>
                  updateSection("testing", testing)
                }
              />
            )}
          </div>
        );

      case "environments":
        return (
          <div className="environments-section">
            <p className="placeholder-text">
              Multi-environment configuration coming soon...
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Header
        isDirty={isDirty}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        validationErrorCount={validationErrors.length}
        onSave={saveConfig}
        onPreview={() => {
          /* TODO: Implement preview mode */
        }}
        onReset={resetConfig}
      />

      <TopTabNavigation
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        validationErrors={validationErrors.length}
        isDirty={isDirty}
      />

      <MainLayout>
        <main className="main-content">
          {/* Alerts */}
          {state.error && (
            <Alert
              type="error"
              title="Error"
              message={state.error}
              onClose={() => {
                /* TODO: Clear error */
              }}
            />
          )}

          {/* Validation Summary */}
          {validationErrors.length > 0 && showValidationSummary && (
            <ValidationSummary
              errors={validationErrors}
              onDismiss={() => setShowValidationSummary(false)}
              onNavigateToSection={setCurrentSection}
            />
          )}

          {/* Config Form */}
          <div className="config-form">
            {renderSection()}
          </div>
        </main>
      </MainLayout>

      <Footer
        isDirty={isDirty}
        lastSavedAt={lastSavedAt}
        onHelp={() => setShowShortcutsModal(true)}
      />

      {/* Modals */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
};

export default SemanticLayerConfigManager;
