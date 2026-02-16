# Quick Start Guide - Semantic Layer UI

## Installation

### 1. Prerequisites
- Node.js 16.0+
- npm or yarn
- React 18.0+
- TypeScript 4.5+

### 2. Setup

```bash
# Clone or navigate to project
cd semantic-layer-ui

# Install dependencies
npm install

# or with yarn
yarn install
```

### 3. Project Structure Setup

```bash
src/
├── types/
├── context/
├── components/
├── styles/
└── index.ts
```

---

## Basic Usage

### 1. Minimal Setup

```tsx
// main.tsx or index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './components/App';
import './styles/base.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 2. With API Integration

```tsx
// components/App.tsx
export const App: React.FC = () => {
  const [initialConfig, setInitialConfig] = useState<SemanticLayerConfig>();

  useEffect(() => {
    // Load config from your API
    fetch('/api/semantic-layer/config')
      .then(res => res.json())
      .then(config => setInitialConfig(config));
  }, []);

  return (
    <ConfigProvider
      initialConfig={initialConfig}
      onSave={async (config) => {
        const response = await fetch('/api/semantic-layer/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        if (!response.ok) throw new Error('Save failed');
      }}
    >
      <SemanticLayerConfigManager />
    </ConfigProvider>
  );
};
```

### 3. Styling

Create a `styles/base.css`:

```css
/* Import reset and variables */
@import './reset.css';
@import './variables.css';

/* Import component styles */
@import './components.css';
@import './layout.css';
@import './forms.css';
@import './themes.css';
```

---

## Common Tasks

### Load Config from YAML

```typescript
import yaml from 'js-yaml';

const loadConfigFromYAML = async (filePath: string) => {
  const response = await fetch(filePath);
  const text = await response.text();
  const config = yaml.load(text) as SemanticLayerConfig;
  return config;
};
```

### Export Config to YAML

```typescript
import yaml from 'js-yaml';

const exportConfigToYAML = (config: SemanticLayerConfig): string => {
  return yaml.dump(config, { indent: 2 });
};
```

### Add Custom Validation

```typescript
import { useConfigContext } from './context/ConfigContext';

export const useConfigValidation = () => {
  const { state, setValidationErrors } = useConfigContext();

  const validate = () => {
    const errors = [];

    if (!state.config.scope.databases.length) {
      errors.push({
        section: 'scope',
        field: 'databases',
        message: 'At least one database is required',
        severity: 'error' as const,
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  return { validate };
};
```

### Add Custom Section

```typescript
// 1. Add type
export interface CustomConfig {
  customField: string;
  customEnabled: boolean;
}

// 2. Add to SemanticLayerConfig in types/config.ts
export interface SemanticLayerConfig {
  // ... existing
  custom?: CustomConfig;
}

// 3. Create component
export const CustomSection: React.FC<{
  config: CustomConfig;
  onChange: (config: CustomConfig) => void;
}> = ({ config, onChange }) => {
  return (
    <FormSection title="Custom Settings">
      <TextInput
        label="Custom Field"
        value={config.customField}
        onChange={(v) => onChange({ ...config, customField: v })}
      />
    </FormSection>
  );
};

// 4. Add to navigation in Layout.tsx
const navigationItems = [
  // ... existing items
  { id: "custom", label: "Custom", icon: "⚙️", description: "Custom settings" },
];

// 5. Render in SemanticLayerConfigManager.tsx
case "custom":
  return (
    <CustomSection
      config={config.custom || {}}
      onChange={(custom) => updateSection("custom", custom)}
    />
  );
```

---

## Environment Variables

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_DEV_MODE=false
```

Access in code:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## Development Workflow

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm test
npm run test:coverage
```

### Lint & Format

```bash
npm run lint
npm run format
```

---

## Debugging Tips

### Enable Debug Mode

```typescript
// In ConfigContext.tsx, add logging
const configReducer = (state: ConfigContextState, action: ConfigAction) => {
  console.log('Action:', action.type, 'Payload:', action.payload);
  // ... reducer logic
};
```

### React DevTools

Use React DevTools browser extension to:
- Inspect component hierarchy
- View props and state
- Track renders
- Profile performance

### Redux DevTools (Optional)

For advanced state debugging, integrate Redux DevTools:

```typescript
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: any;
  }
}
```

---

## Performance Optimization

### Memoize Components

```typescript
export const MySection = React.memo(({ config, onChange }: Props) => {
  // Component code
});
```

### Use useCallback

```typescript
const handleChange = useCallback((value: string) => {
  updateSection('scope', { ...scope, field: value });
}, [scope]);
```

### Lazy Load Sections

```typescript
const CustomSection = React.lazy(() =>
  import('./components/CustomSection').then(m => ({ default: m.CustomSection }))
);
```

---

## Troubleshooting

### Context Hook Error
**Error:** "useConfigContext must be used within ConfigProvider"

**Solution:** Ensure component is wrapped in `<ConfigProvider>`:
```tsx
<ConfigProvider initialConfig={config} onSave={saveConfig}>
  <YourComponent />
</ConfigProvider>
```

### State Not Updating
**Issue:** Changes don't appear in UI

**Solution:** Check that you're calling the right update function:
```typescript
// ❌ Wrong
config.scope.databases.push('new_db');

// ✅ Correct
updateSection('scope', {
  ...config.scope,
  databases: [...config.scope.databases, 'new_db']
});
```

### Save Not Working
**Issue:** Config saves but changes don't persist

**Solution:** Verify your `onSave` callback:
```typescript
onSave={async (config) => {
  const response = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error(await response.text());
  // Must throw on failure!
}}
```

---

## API Integration Examples

### Treasure Data API

```typescript
const saveToDatabaseConfig = async (config: SemanticLayerConfig) => {
  const client = new TDClient({
    apiKey: process.env.VITE_TD_API_KEY,
    endpoint: process.env.VITE_TD_ENDPOINT,
  });

  await client.database('semantic_layer_v1').table('config').insert({
    config_json: JSON.stringify(config),
    created_at: new Date(),
  });
};
```

### Firebase

```typescript
const saveToFirebase = async (config: SemanticLayerConfig) => {
  const db = getFirestore();
  await setDoc(doc(db, 'semantic_config', 'default'), config);
};
```

### REST API with Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT),
});

export const configAPI = {
  async get() {
    return api.get('/semantic-layer/config');
  },
  async save(config: SemanticLayerConfig) {
    return api.post('/semantic-layer/config', config);
  },
};
```

---

## Component Reference

### TextInput Props
```typescript
{
  label: string;                    // Label text
  value: string;                    // Current value
  onChange: (v: string) => void;    // Change callback
  placeholder?: string;             // Placeholder text
  type?: 'text' | 'email' | 'number'; // Input type
  validation?: (v: string) => string | null; // Validator
  error?: string;                   // Error message
  required?: boolean;               // Required indicator
  disabled?: boolean;               // Disabled state
}
```

### DynamicList Props
```typescript
{
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  examples?: string[];
  validation?: (v: string) => string | null;
}
```

### FormSection Props
```typescript
{
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save configuration |
| `Cmd/Ctrl + R` | Revert to last saved |
| `Cmd/Ctrl + Z` | Undo (future) |
| `?` | Show help modal |
| `Esc` | Close modal |

---

## Resources

- [Component Structure Guide](./COMPONENT_STRUCTURE.md)
- [TypeScript Config Types](./src/types/config.ts)
- [React Documentation](https://react.dev)
- [Treasure Data Docs](https://docs.treasuredata.com)

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review COMPONENT_STRUCTURE.md
3. Check the source code comments
4. Open an issue on GitHub

