/**
 * Layout and Navigation Components
 */

import React from "react";

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================
const navigationItems = [
  {
    id: "scope",
    label: "Scope",
    icon: "🎯",
    description: "Define databases and tables",
  },
  {
    id: "definitions",
    label: "Definitions",
    icon: "📋",
    description: "Link semantic definition files",
  },
  {
    id: "semantic-database",
    label: "Semantic DB",
    icon: "🗄️",
    description: "Configure metadata storage",
  },
  {
    id: "lineage",
    label: "Lineage",
    icon: "🔗",
    description: "Lineage detection settings",
  },
  {
    id: "validation",
    label: "Validation",
    icon: "✓",
    description: "Validation rules",
  },
  {
    id: "auto-generation",
    label: "Auto-Generation",
    icon: "⚙️",
    description: "Heuristic-based generation",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: "⚡",
    description: "Notifications, approvals, sync",
  },
  {
    id: "environments",
    label: "Environments",
    icon: "🌍",
    description: "Multi-environment setup",
  },
];

// ============================================================================
// TOP TAB NAVIGATION
// ============================================================================
export interface TopTabNavigationProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  validationErrors: number;
  isDirty: boolean;
}

export const TopTabNavigation = React.memo<TopTabNavigationProps>(
  ({ currentSection, onSectionChange, validationErrors, isDirty }) => {
    return (
      <nav className="top-tab-navigation" role="tablist" aria-label="Configuration sections">
        <div className="tabs-container">
          {navigationItems.map((item) => {
            const isActive = currentSection === item.id;
            const hasErrors = validationErrors > 0;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`tab-item ${isActive ? "active" : ""} ${
                  hasErrors ? "has-errors" : ""
                }`}
                title={item.description}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                id={`tab-${item.id}`}
              >
                <span className="tab-icon">{item.icon}</span>
                <span className="tab-label">{item.label}</span>
                {isDirty && isActive && (
                  <span className="tab-indicator dirty">●</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.currentSection === nextProps.currentSection &&
      prevProps.validationErrors === nextProps.validationErrors &&
      prevProps.isDirty === nextProps.isDirty
    );
  }
);

// ============================================================================
// HEADER
// ============================================================================
export interface HeaderProps {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt?: Date;
  validationErrorCount: number;
  onSave: () => void;
  onPreview: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDirty,
  isSaving,
  lastSavedAt,
  validationErrorCount,
  onSave,
  onPreview,
  onReset,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">Configuration</h1>
        <div className="status-indicator">
          {isDirty && <span className="status-badge unsaved">Unsaved Changes</span>}
          {!isDirty && lastSavedAt && (
            <span className="status-badge saved">
              Saved at {formatTime(lastSavedAt)}
            </span>
          )}
          {validationErrorCount > 0 && (
            <span className="status-badge error">
              {validationErrorCount} Validation Issues
            </span>
          )}
        </div>
      </div>

      <div className="header-right">
        <button
          onClick={onPreview}
          className="btn btn-secondary"
          type="button"
          disabled={isSaving}
        >
          Preview
        </button>
        <button
          onClick={onReset}
          className="btn btn-secondary"
          type="button"
          disabled={!isDirty || isSaving}
        >
          Revert
        </button>
        <button
          onClick={onSave}
          className="btn btn-primary"
          type="button"
          disabled={!isDirty || isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </header>
  );
};

// ============================================================================
// ADVANCED HEADER / TABS FOR ADVANCED SECTION
// ============================================================================
export interface AdvancedTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdvancedTabs: React.FC<AdvancedTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "approval", label: "Approval", icon: "✅" },
    { id: "sync", label: "Sync", icon: "🔄" },
    { id: "testing", label: "Testing", icon: "🧪" },
  ];

  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            type="button"
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// FOOTER
// ============================================================================
export interface FooterProps {
  isDirty: boolean;
  lastSavedAt?: Date;
  onHelp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  isDirty,
  lastSavedAt,
  onHelp,
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <footer className="app-footer">
      <div className="footer-left">
        {lastSavedAt && (
          <span className="footer-text">
            Last saved: {formatDate(lastSavedAt)}
          </span>
        )}
      </div>

      <div className="footer-right">
        <button
          onClick={onHelp}
          className="btn btn-link"
          type="button"
        >
          Help & Keyboard Shortcuts
        </button>
        <span className="footer-divider">|</span>
        <a href="#" className="footer-link">
          Documentation
        </a>
      </div>
    </footer>
  );
};

// ============================================================================
// MAIN LAYOUT
// ============================================================================
export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <div className="layout-main">{children}</div>
    </div>
  );
};

// ============================================================================
// BREADCRUMB
// ============================================================================
export interface BreadcrumbItem {
  label: string;
  id?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={item.id || index} className="breadcrumb-item">
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="breadcrumb-link"
                type="button"
              >
                {item.label}
              </button>
            ) : (
              <span className="breadcrumb-label">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <span className="breadcrumb-separator">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// ============================================================================
// VALIDATION SUMMARY
// ============================================================================
export interface ValidationSummaryProps {
  errors: {
    section: string;
    field: string;
    message: string;
    severity: "error" | "warning";
  }[];
  onDismiss?: () => void;
  onNavigateToSection?: (section: string) => void;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  onDismiss,
  onNavigateToSection,
}) => {
  if (errors.length === 0) return null;

  const errorCount = errors.filter((e) => e.severity === "error").length;
  const warningCount = errors.filter((e) => e.severity === "warning").length;

  return (
    <div className="validation-summary">
      <div className="validation-header">
        <span className="validation-title">Validation Issues</span>
        <span className="validation-count">
          {errorCount > 0 && (
            <span className="error-count">{errorCount} errors</span>
          )}
          {warningCount > 0 && (
            <span className="warning-count">{warningCount} warnings</span>
          )}
        </span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="btn btn-sm btn-link"
            type="button"
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="validation-list">
        {errors.slice(0, 5).map((error, index) => (
          <div
            key={index}
            className={`validation-item severity-${error.severity}`}
          >
            <span className="severity-icon">
              {error.severity === "error" ? "✕" : "⚠"}
            </span>
            <div className="validation-content">
              <span className="validation-section">{error.section}</span>
              <span className="validation-field">{error.field}</span>
              <span className="validation-message">{error.message}</span>
            </div>
            {onNavigateToSection && (
              <button
                onClick={() => onNavigateToSection(error.section)}
                className="btn btn-sm"
                type="button"
              >
                Fix
              </button>
            )}
          </div>
        ))}
      </div>

      {errors.length > 5 && (
        <div className="validation-more">
          {errors.length - 5} more issues...
        </div>
      )}
    </div>
  );
};

// ============================================================================
// KEYBOARD SHORTCUTS MODAL
// ============================================================================
export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: "Cmd/Ctrl + S", action: "Save configuration" },
    { keys: "Cmd/Ctrl + Z", action: "Undo changes" },
    { keys: "Cmd/Ctrl + Y", action: "Redo changes" },
    { keys: "Cmd/Ctrl + P", action: "Preview mode" },
    { keys: "Cmd/Ctrl + R", action: "Revert to last saved" },
    { keys: "Esc", action: "Close modal / Exit preview" },
    { keys: "?", action: "Show this help" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="modal-close"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <table className="shortcuts-table">
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr key={index}>
                  <td className="shortcut-key">{shortcut.keys}</td>
                  <td className="shortcut-action">{shortcut.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn btn-primary"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
