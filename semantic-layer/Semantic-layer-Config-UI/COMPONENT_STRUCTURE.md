# Semantic Layer UI - React Component Structure Guide

## Project Overview

A complete React TypeScript application for managing the Semantic Layer configuration. This guide documents the component hierarchy, data flow, and usage patterns.

---

## Directory Structure

```
src/
├── types/
│   └── config.ts                    # All TypeScript interfaces and types
│
├── context/
│   └── ConfigContext.tsx            # Global state management using Context + useReducer
│
├── components/
│   ├── FormComponents.tsx           # Reusable form inputs
│   ├── AdvancedFormComponents.tsx   # Complex form components (tables, builders)
│   ├── SectionComponents.tsx        # Configuration section components
│   ├── Layout.tsx                   # Navigation, header, footer, layout
│   ├── SemanticLayerConfigManager.tsx # Main orchestrator component
│   ├── App.tsx                      # App wrapper with config loading
│   └── index.ts                     # Central export file
│
└── styles/
    ├── base.css                     # Global styles, variables, reset
    ├── components.css               # Component-specific styles
    ├── layout.css                   # Layout and grid styles
    ├── forms.css                    # Form component styles
    └── themes.css                   # Dark/light theme support
```

---

## Component Hierarchy

```
App (App.tsx)
├── ConfigProvider (ConfigContext.tsx)
│   └── SemanticLayerConfigManager (SemanticLayerConfigManager.tsx)
│       ├── Header (Layout.tsx)
│       ├── MainLayout (Layout.tsx)
│       │   ├── SidebarNavigation (Layout.tsx)
│       │   └── Main Content Area
│       │       ├── Alert (FormComponents.tsx)
│       │       ├── ValidationSummary (Layout.tsx)
│       │       └── Section Content (SectionComponents.tsx)
│       │           ├── ScopeSection
│       │           ├── DefinitionsSection
│       │           ├── SemanticDatabaseSection
│       │           ├── LineageDetectionSection
│       │           ├── ValidationSection
│       │           │   ├── ConflictHandlingSection
│       │           │   └── ValidationRulesBuilder (AdvancedFormComponents.tsx)
│       │           ├── AutoGenerationSection
│       │           │   └── PatternTable (AdvancedFormComponents.tsx)
│       │           └── Advanced (Tabbed)
│       │               ├── NotificationsSection
│       │               │   └── NotificationChannelBuilder
│       │               ├── ApprovalWorkflowSection
│       │               ├── SyncBehaviorSection
│       │               └── TestingSection
│       ├── Footer (Layout.tsx)
│       └── KeyboardShortcutsModal (Layout.tsx)
```

---

## Data Flow Architecture

### State Management with Context + useReducer

```
ConfigProvider (ConfigContext.tsx)
├── state: ConfigContextState
│   ├── config: SemanticLayerConfig (main configuration)
│   ├── originalConfig: SemanticLayerConfig (for reverting)
│   ├── uiState: ConfigUIState
│   │   ├── currentSection: string
│   │   ├── isDirty: boolean
│   │   ├── isSaving: boolean
│   │   ├── validationErrors: ConfigValidationError[]
│   │   └── lastSavedAt: Date
│   └── error: string | null
│
└── dispatch: Reducer<ConfigAction>
    ├── UPDATE_CONFIG
    ├── UPDATE_SECTION
    ├── SET_CURRENT_SECTION
    ├── LOAD_CONFIG
    ├── RESET_CONFIG
    ├── SET_SAVING
    ├── SET_VALIDATION_ERRORS
    └── ... (more actions)
```

### Hook Usage

```typescript
const { state, dispatch, updateSection, saveConfig, resetConfig } = useConfigContext();
```

---

## Component Types and Categories

### 1. Form Components (FormComponents.tsx)

Basic reusable form inputs with consistent styling:

- `TextInput` - Text, email, number inputs with validation
- `TextArea` - Multi-line text input
- `Toggle` - Switch/checkbox component
- `Select` - Dropdown with options
- `RadioGroup` - Radio button group with descriptions
- `CheckboxGroup` - Multiple checkboxes
- `Slider` - Range input with min/max/step
- `DynamicList` - Add/remove items dynamically
- `Collapsible` - Expandable section
- `Alert` - Info/warning/error/success messages
- `SectionHeader` - Styled section title with optional icon
- `FormSection` - Container for form groups

**Common Props Pattern:**
```typescript
interface BaseFormProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
```

### 2. Advanced Form Components (AdvancedFormComponents.tsx)

Complex components for specialized configurations:

- `PatternTable` - Editable table for auto-generation patterns
- `NotificationChannelBuilder` - Dynamic notification channel configuration
- `ValidationRulesBuilder` - Custom validation rules editor
- `SemanticTableConfig` - Semantic database table naming grid
- `LineageAutoDetectItem` - Lineage auto-detection option with conditional fields

### 3. Section Components (SectionComponents.tsx)

Full configuration sections matching config.yaml structure:

- `ScopeSection` - Database and table inclusion/exclusion patterns
- `DefinitionsSection` - File paths for semantic definitions
- `SemanticDatabaseSection` - Metadata storage database configuration
- `LineageDetectionSection` - Lineage detection settings with auto-detect options
- `ConflictHandlingSection` - Conflict resolution and schema change handling
- `ValidationSection` - Validation rules and requirements
- `AutoGenerationSection` - Heuristic-based metadata generation
- `NotificationsSection` - Sync complete and error notifications
- `ApprovalWorkflowSection` - Approval requirements and auto-approve rules
- `SyncBehaviorSection` - Sync merge strategy and behavior
- `TestingSection` - Testing and development options

### 4. Layout Components (Layout.tsx)

Application structure and navigation:

- `SidebarNavigation` - Left sidebar with section navigation
- `Header` - Top bar with save/preview/revert buttons
- `Footer` - Bottom bar with save info and help links
- `MainLayout` - Main layout container with sidebar toggle
- `Breadcrumb` - Breadcrumb navigation
- `ValidationSummary` - Display validation errors/warnings
- `KeyboardShortcutsModal` - Help modal
- `AdvancedTabs` - Tab switcher for advanced section

### 5. Main Components

- `SemanticLayerConfigManager` - Main orchestrator, renders sections based on currentSection
- `App` - Entry point, handles config loading and ConfigProvider setup

---

## State Management Patterns

### Updating Configuration

**By Path (nested updates):**
```typescript
updateConfig("scope.databases", ["analytics.*", "dwh.*"]);
```

**By Section:**
```typescript
updateSection("scope", {
  databases: ["analytics.*"],
  exclude_patterns: ["*.temp_*"]
});
```

### Validation Flow

```typescript
1. User makes changes → onChange callback triggered
2. Component updates local state immediately
3. Parent component calls updateSection/updateConfig
4. Context reducer updates config + marks isDirty=true
5. Optional: run validation on blur/save
6. Display errors via ValidationSummary component
```

### Save Flow

```typescript
1. User clicks "Save"
2. ConfigContext dispatch({ type: "SET_SAVING", payload: true })
3. onSave callback in ConfigProvider makes API call
4. Success: dispatch({ type: "SET_LAST_SAVED" })
5. Error: dispatch({ type: "SET_ERROR", payload: errorMsg })
6. Finally: dispatch({ type: "SET_SAVING", payload: false })
```

---

## Usage Examples

### Basic Setup

```typescript
import React from 'react';
import { App } from './components/App';
import './styles/base.css';

ReactDOM.render(<App />, document.getElementById('root'));
```

### Using ConfigContext in Custom Components

```typescript
import { useConfigContext } from './context/ConfigContext';

export const CustomComponent = () => {
  const { state, updateSection } = useConfigContext();
  const { config, uiState } = state;

  return (
    <div>
      <h1>Current Section: {uiState.currentSection}</h1>
      <button onClick={() =>
        updateSection('scope', {
          ...config.scope,
          databases: [...config.scope.databases, 'new_db.*']
        })
      }>
        Add Database
      </button>
    </div>
  );
};
```

### Creating Custom Form Components

```typescript
import { TextInput, FormSection } from './components/FormComponents';

export const CustomConfigSection = ({ config, onChange }) => {
  return (
    <FormSection title="Custom Section">
      <TextInput
        label="Custom Field"
        value={config.customField}
        onChange={(v) => onChange({ ...config, customField: v })}
        placeholder="Enter value"
      />
    </FormSection>
  );
};
```

---

## Styling Strategy

### CSS Classes Naming Convention

```
.app-{name}           # Top-level app components
.component-{name}     # Reusable components
.section-{name}       # Section-specific styles
.form-{type}          # Form element styles
.{component}-{state}  # State modifiers (e.g., .button-disabled)
```

### CSS Variables for Theming

```css
:root {
  /* Colors */
  --color-primary: #0066cc;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-error: #dc3545;
  --color-info: #17a2b8;

  /* Layout */
  --sidebar-width: 250px;
  --header-height: 60px;
  --footer-height: 40px;

  /* Typography */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
  --font-size-base: 14px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1e1e1e;
    --color-text: #e0e0e0;
  }
}
```

---

## Type System Overview

### Main Config Type
```typescript
SemanticLayerConfig {
  version: string
  description: string
  scope: ScopeConfig
  definitions: DefinitionsConfig
  semantic_database: SemanticDatabaseConfig
  lineage: LineageConfig
  conflict_handling: ConflictHandlingConfig
  validation: ValidationConfig
  auto_generation: AutoGenerationConfig
  notifications: NotificationsConfig
  approval: ApprovalConfig
  sync: SyncConfig
  testing: TestingConfig
  environments?: EnvironmentConfig
}
```

### UI State Type
```typescript
ConfigUIState {
  currentSection: 'scope' | 'definitions' | ... | 'environments'
  currentEnvironment: string
  isDirty: boolean
  isSaving: boolean
  isPreviewMode: boolean
  validationErrors: ConfigValidationError[]
  lastSavedAt?: Date
}
```

---

## Extensibility Points

### 1. Adding New Configuration Sections

```typescript
// 1. Add type in types/config.ts
export interface NewSectionConfig {
  field1: string;
  field2: boolean;
}

// 2. Add to SemanticLayerConfig
export interface SemanticLayerConfig {
  // ... existing fields
  new_section: NewSectionConfig;
}

// 3. Create section component in SectionComponents.tsx
export const NewSection: React.FC<NewSectionProps> = ({ config, onChange }) => {
  return <FormSection>...</FormSection>;
};

// 4. Add to navigation items in Layout.tsx
const navigationItems = [
  // ... existing items
  { id: "new-section", label: "New Section", icon: "🆕", ... },
];

// 5. Add case in SemanticLayerConfigManager.tsx
case "new-section":
  return <NewSection ... />;
```

### 2. Adding Custom Validation

```typescript
// In a custom hook
export const useConfigValidation = () => {
  const { state } = useConfigContext();

  const validate = () => {
    const errors: ConfigValidationError[] = [];

    // Add validation logic
    if (!state.config.scope.databases.length) {
      errors.push({
        section: 'scope',
        field: 'databases',
        message: 'At least one database required',
        severity: 'error'
      });
    }

    return errors;
  };

  return { validate };
};
```

### 3. Adding New Form Components

Create reusable form input following the pattern:

```typescript
export interface CustomInputProps {
  label: string;
  value: CustomValue;
  onChange: (value: CustomValue) => void;
  // ... other props
}

export const CustomInput: React.FC<CustomInputProps> = (props) => {
  return (
    <div className="form-group custom-input">
      <label className="form-label">{props.label}</label>
      {/* Implementation */}
    </div>
  );
};
```

---

## Performance Optimization Tips

1. **Memoize Section Components** - Use `React.memo` for large section components
2. **Virtualize Long Lists** - Use libraries like `react-window` for very large dynamic lists
3. **Debounce Updates** - Debounce `onChange` callbacks for real-time validation
4. **Code Splitting** - Lazy load section components with `React.lazy`
5. **Context Optimization** - Split context if state grows very large

---

## Testing Strategy

### Unit Tests (Vitest/Jest)
```typescript
describe('ScopeSection', () => {
  it('adds database pattern on submit', () => {
    const onChange = vi.fn();
    render(<ScopeSection scope={{...}} onChange={onChange} />);
    // Test assertions...
  });
});
```

### Integration Tests
```typescript
describe('Config Manager Flow', () => {
  it('saves and loads configuration', () => {
    // Test full save/load flow
  });
});
```

### E2E Tests (Cypress/Playwright)
```typescript
describe('Semantic Layer UI', () => {
  it('allows user to create and save config', () => {
    cy.visit('/');
    cy.get('[data-testid="add-database"]').click();
    cy.get('input').type('analytics.*');
    cy.get('[data-testid="save"]').click();
    cy.contains('Saved at').should('be.visible');
  });
});
```

---

## Keyboard Shortcuts

- `Cmd/Ctrl + S` - Save
- `Cmd/Ctrl + R` - Revert
- `Cmd/Ctrl + Z` - Undo (future)
- `Cmd/Ctrl + Y` - Redo (future)
- `?` - Show shortcuts
- `Esc` - Close modal

---

## Future Enhancements

1. **Undo/Redo Stack** - History management
2. **Multi-Environment Support** - Environment-specific overrides UI
3. **Collaborative Editing** - Real-time multi-user editing
4. **Import/Export** - YAML/JSON file import and export
5. **Preview Mode** - Visual preview of changes before save
6. **API Integration** - Direct Treasure Data API integration
7. **Field Search/Filter** - Quick search across all fields
8. **Schema Inference** - Auto-detect from actual database schema
9. **Comments & Annotations** - Field-level comments for team collaboration
10. **Diff View** - Show before/after changes

---

## Contributing

When adding new features:

1. Follow existing patterns and naming conventions
2. Create reusable components when possible
3. Keep component concerns separated
4. Add TypeScript interfaces for all props
5. Update exports in `src/index.ts`
6. Document complex logic with comments
7. Test new features before submitting

