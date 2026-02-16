/**
 * Reusable Form Components
 */

import React, { useState } from "react";

// ============================================================================
// TEXT INPUT
// ============================================================================
export interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: "text" | "email" | "number";
  validation?: (value: string) => string | null;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  description,
  error,
  required,
  disabled,
  type = "text",
  validation,
}) => {
  const [localError, setLocalError] = useState<string | null>(error || null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (validation) {
      const validationError = validation(newValue);
      setLocalError(validationError);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={`input-${label}`}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {description && <p className="form-description" id={`desc-${label}`}>{description}</p>}
      <input
        id={`input-${label}`}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input ${localError ? "error" : ""}`}
        aria-label={label}
        aria-describedby={description ? `desc-${label}` : undefined}
        aria-invalid={!!localError}
        aria-errormessage={localError ? `error-${label}` : undefined}
      />
      {localError && (
        <span className="error-message" id={`error-${label}`} role="alert">
          {localError}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// TEXTAREA INPUT
// ============================================================================
export interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  description,
  error,
  required,
  disabled,
  rows = 4,
}) => {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={`textarea-${label}`}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {description && <p className="form-description" id={`desc-${label}`}>{description}</p>}
      <textarea
        id={`textarea-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`form-textarea ${error ? "error" : ""}`}
        aria-label={label}
        aria-describedby={description ? `desc-${label}` : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <span className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// TOGGLE/SWITCH
// ============================================================================
export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  description,
  disabled,
}) => {
  return (
    <div className="form-group toggle-group">
      <div className="toggle-header">
        <label className="form-label" htmlFor={`toggle-${label}`}>
          <input
            id={`toggle-${label}`}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="toggle-input"
            aria-label={label}
            aria-describedby={description ? `desc-${label}` : undefined}
          />
          <span className="toggle-label">{label}</span>
        </label>
      </div>
      {description && <p className="form-description" id={`desc-${label}`}>{description}</p>}
    </div>
  );
};

// ============================================================================
// SELECT/DROPDOWN
// ============================================================================
export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

export interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  description,
  error,
  required,
  disabled,
}) => {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {description && <p className="form-description">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`form-select ${error ? "error" : ""}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

// ============================================================================
// RADIO GROUP
// ============================================================================
export interface RadioGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  value,
  onChange,
  options,
  description,
  required,
  disabled,
}) => {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {description && <p className="form-description">{description}</p>}
      <div className="radio-group">
        {options.map((option) => (
          <label key={option.value} className="radio-option">
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="radio-input"
            />
            <span className="radio-label">{option.label}</span>
            {option.description && (
              <span className="radio-description">{option.description}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CHECKBOX GROUP
// ============================================================================
export interface CheckboxOption {
  label: string;
  value: string;
  description?: string;
}

export interface CheckboxGroupProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: CheckboxOption[];
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  values,
  onChange,
  options,
  description,
  required,
  disabled,
}) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...values, optionValue]);
    } else {
      onChange(values.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {description && <p className="form-description">{description}</p>}
      <div className="checkbox-group">
        {options.map((option) => (
          <label key={option.value} className="checkbox-option">
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              disabled={disabled}
              className="checkbox-input"
            />
            <span className="checkbox-label">{option.label}</span>
            {option.description && (
              <span className="checkbox-description">{option.description}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SLIDER/RANGE
// ============================================================================
export interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  description?: string;
  unit?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  description,
  unit,
  disabled,
}) => {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {description && <p className="form-description">{description}</p>}
      <div className="slider-container">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="slider-input"
        />
        <span className="slider-value">
          {value}
          {unit && ` ${unit}`}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// DYNAMIC LIST (Add/Remove items)
// ============================================================================
export interface DynamicListProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  validation?: (value: string) => string | null;
  examples?: string[];
}

export const DynamicList: React.FC<DynamicListProps> = ({
  label,
  items,
  onChange,
  placeholder,
  description,
  error,
  required,
  disabled,
  validation,
  examples,
}) => {
  const [newItem, setNewItem] = useState("");
  const [itemError, setItemError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newItem.trim()) {
      setItemError("Item cannot be empty");
      return;
    }

    if (validation) {
      const validationError = validation(newItem);
      if (validationError) {
        setItemError(validationError);
        return;
      }
    }

    if (items.includes(newItem)) {
      setItemError("Item already exists");
      return;
    }

    onChange([...items, newItem]);
    setNewItem("");
    setItemError(null);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {description && <p className="form-description">{description}</p>}

      <div className="dynamic-list-input">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-input ${itemError ? "error" : ""}`}
        />
        <button
          onClick={handleAdd}
          disabled={disabled}
          className="btn btn-secondary"
          type="button"
        >
          Add
        </button>
      </div>
      {itemError && <span className="error-message">{itemError}</span>}
      {error && <span className="error-message">{error}</span>}

      {examples && examples.length > 0 && (
        <div className="form-hint">
          <strong>Examples:</strong> {examples.join(", ")}
        </div>
      )}

      <div className="dynamic-list-items">
        {items.map((item, index) => (
          <div key={index} className="dynamic-list-item">
            <span className="item-value">{item}</span>
            <button
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="btn btn-sm btn-danger"
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================
export interface CollapsibleProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  description,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible">
      <button
        className="collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={`collapsible-icon ${isOpen ? "open" : ""}`}>▶</span>
        <span className="collapsible-title">{title}</span>
      </button>
      {description && <p className="collapsible-description">{description}</p>}
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
};

// ============================================================================
// ALERT/INFO BOX
// ============================================================================
export interface AlertProps {
  type: "info" | "warning" | "error" | "success";
  title?: string;
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
}) => {
  return (
    <div className={`alert alert-${type}`}>
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{message}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="alert-close" type="button">
          ✕
        </button>
      )}
    </div>
  );
};

// ============================================================================
// SECTION HEADER
// ============================================================================
export interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="section-header">
      {icon && <span className="section-icon">{icon}</span>}
      <div className="section-header-text">
        <h2 className="section-title">{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
    </div>
  );
};

// ============================================================================
// FORM SECTION
// ============================================================================
export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  collapsible = false,
}) => {
  if (collapsible) {
    return (
      <Collapsible title={title} description={description}>
        {children}
      </Collapsible>
    );
  }

  return (
    <div className="form-section">
      {title && <SectionHeader title={title} description={description} />}
      <div className="form-section-content">{children}</div>
    </div>
  );
};
