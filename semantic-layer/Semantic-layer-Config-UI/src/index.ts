/**
 * Component Exports
 * Central export point for all components and utilities
 */

// ============================================================================
// TYPES
// ============================================================================
export * from "../types/config";

// ============================================================================
// CONTEXT
// ============================================================================
export {
  ConfigProvider,
  useConfigContext,
  ConfigContext,
  type ConfigContextType,
  type ConfigContextState,
} from "../context/ConfigContext";

// ============================================================================
// FORM COMPONENTS
// ============================================================================
export {
  TextInput,
  TextArea,
  Toggle,
  Select,
  RadioGroup,
  CheckboxGroup,
  Slider,
  DynamicList,
  Collapsible,
  Alert,
  SectionHeader,
  FormSection,
  type TextInputProps,
  type TextAreaProps,
  type ToggleProps,
  type SelectProps,
  type SelectOption,
  type RadioGroupProps,
  type CheckboxGroupProps,
  type CheckboxOption,
  type SliderProps,
  type DynamicListProps,
  type CollapsibleProps,
  type AlertProps,
  type SectionHeaderProps,
  type FormSectionProps,
} from "./FormComponents";

// ============================================================================
// ADVANCED FORM COMPONENTS
// ============================================================================
export {
  PatternTable,
  NotificationChannelBuilder,
  ValidationRulesBuilder,
  SemanticTableConfig,
  LineageAutoDetectItem,
  type PatternTableProps,
  type PatternTableRow,
  type NotificationChannelBuilderProps,
  type NotificationChannelRow,
  type ValidationRulesBuilderProps,
  type ValidationRuleRow,
  type SemanticTableConfigProps,
  type LineageAutoDetectItemProps,
} from "./AdvancedFormComponents";

// ============================================================================
// SECTION COMPONENTS
// ============================================================================
export {
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
  type ScopeSectionProps,
  type DefinitionsSectionProps,
  type SemanticDatabaseSectionProps,
  type LineageDetectionSectionProps,
  type ConflictHandlingSectionProps,
  type ValidationSectionProps,
  type AutoGenerationSectionProps,
  type NotificationsSectionProps,
  type ApprovalWorkflowSectionProps,
  type SyncBehaviorSectionProps,
  type TestingSectionProps,
} from "./SectionComponents";

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================
export {
  TopTabNavigation,
  Header,
  Footer,
  MainLayout,
  Breadcrumb,
  ValidationSummary,
  KeyboardShortcutsModal,
  AdvancedTabs,
  type TopTabNavigationProps,
  type HeaderProps,
  type FooterProps,
  type MainLayoutProps,
  type BreadcrumbProps,
  type BreadcrumbItem,
  type ValidationSummaryProps,
  type KeyboardShortcutsModalProps,
  type AdvancedTabsProps,
} from "./Layout";

// ============================================================================
// MAIN COMPONENTS
// ============================================================================
export { SemanticLayerConfigManager } from "./SemanticLayerConfigManager";
export { App } from "./App";
