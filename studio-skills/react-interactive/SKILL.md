---
name: react-interactive
description: Build a persistent Interactive UI using render_react with mode='interactive'. Use when the user wants a reusable, stateful app that can call the TD API or LLM and be saved to the UI Gallery. For simple read-only dashboards, use react-dashboard instead.
---

# React Interactive UI

Use `mcp__work__render_react` with `mode='interactive'`. This renders a full-screen interactive app that can be exported to the UI Gallery and re-opened later.

## Sandbox Globals

Do NOT import anything — these are pre-loaded:

- **React 18**: all hooks (`useState`, `useEffect`, `useMemo`, etc.)
- **Recharts**: all components
- **Tailwind CSS**: all utility classes
- **Theme**: `isDark` (boolean) and `theme` (`"light"` / `"dark"`) — reactive

### Interactive-only globals

- **`window.__api.fetch(url, init?)`** — TD REST API proxy. Auth headers are injected automatically. Returns `{ status, statusText, headers, body }` where `body` is a string.
- **`window.__api.connector(provider, path, init?)`** — Third-party connector proxy (e.g. `'slack'`, `'glean'`). Same return shape as `fetch`. Requires the connector to be enabled in UI Gallery permissions.
- **`window.__llm.complete(prompt, options?)`** — Call Claude from within the UI.
  - `options`: `{ model?: string; maxTokens?: number }`
  - Returns `Promise<string>` (text content) — throws on error
- **`window.__td.site`** — Active TD site (e.g. `"us01"`)
- **`window.__td.apiBase`** — TD REST API base URL (e.g. `https://api.treasuredata.com`)
- **`window.__td.workflowBase`** — TD Workflow API base URL
- **`window.__td.cdpBase`** — TD CDP API base URL
- **`window.__td.language`** — User's language preference from Treasure Work settings: `"auto"` | `"en"` | `"ja"`

## Language

`window.__td.language` reflects the user's language setting in Treasure Work (General Settings → Language).

- `"auto"` — LLM follows the prompt language naturally (default)
- `"en"` — LLM responds in English
- `"ja"` — LLM responds in Japanese

**`window.__llm.complete()` handles language automatically** — the host injects a system prompt based on this setting, so you do not need to add language instructions to your prompts.

Use `window.__td.language` to switch **UI text** (labels, placeholders, static strings) to match the user's preference:

```jsx
const lang = window.__td.language;
const t = {
  title:   lang === 'ja' ? 'データベース一覧' : 'Database List',
  refresh: lang === 'ja' ? '更新'             : 'Refresh',
  loading: lang === 'ja' ? '読み込み中…'      : 'Loading…',
  error:   lang === 'ja' ? 'エラー'           : 'Error',
};
```

Note: `window.__td.language` is set once when the component mounts. If the user changes the language setting while the UI is open, the new value takes effect after a reload.

## Calling the TD REST API

Use `window.__api.fetch()` — **not** the native `fetch()`. The host proxy injects auth headers and handles CORS. Do NOT add `Authorization` headers manually.

```jsx
const res = await window.__api.fetch(`${window.__td.apiBase}/v3/database/list`);
// res: { status, statusText, headers, body }  (body is a string)
const json = JSON.parse(res.body);
```

Relative paths (starting with `/`) are rewritten to the active profile's TD API base automatically:

```jsx
const res = await window.__api.fetch('/v3/database/list');
```

## Calling a Connector

```jsx
const res = await window.__api.connector('slack', '/conversations.list', {
  method: 'GET',
});
const json = JSON.parse(res.body);
```

The user must have the connector connected in Settings > Connectors and have it enabled in the UI Gallery permissions for this UI.

## Example

```jsx
export default function TDDatabaseBrowser() {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDatabases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.__api.fetch(`${window.__td.apiBase}/v3/database/list`);
      if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = JSON.parse(res.body);
      setDatabases(json.databases ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDatabases(); }, []);

  return (
    <div className="p-6 space-y-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Databases ({databases.length})</h1>
        <button
          onClick={loadDatabases}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {databases.map((db) => (
          <li key={db.name} className="py-2 text-sm">{db.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Exporting to UI Gallery

After `render_react` succeeds, click **Export as Interactive UI** in the artifact toolbar. Give it a name and export via Gist, Google Drive, or local file. The exported UI appears in the UI Gallery (Zap icon in the sidebar) and can be re-opened anytime.
