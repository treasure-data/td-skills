---
name: react-dashboard
description: Build interactive React dashboards and components in Treasure Studio using render_react. Use when the user explicitly asks for an interactive dashboard, custom React component, or interactive visualization that goes beyond what render_chart supports.
---

# React Dashboard

Build interactive React components rendered in Treasure Studio's artifact panel via `mcp__tdx-studio__render_react`.

**When to use:** Only when the user explicitly asks for an interactive React dashboard or component. For simple charts, use `render_chart` instead.

## Component Structure

Export a single default function component. Pass structured data via the `data` prop:

```jsx
export default function Dashboard({ data }) {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <div className="p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* component content */}
    </div>
  );
}
```

## Available Globals

Everything is pre-loaded — do NOT import anything:

- **React 18**: `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, `memo`
- **Recharts**: `BarChart`, `LineChart`, `PieChart`, `AreaChart`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`, `Cell`, `RadarChart`, `Radar`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `ScatterChart`, `Scatter`, `ComposedChart`, `Treemap`, `Sankey`
- **Tailwind CSS**: All utility classes
- **Theme**: `isDark` boolean and `theme` string (`"light"` / `"dark"`) — reactive, update on toggle

## Dark Mode

Two patterns depending on where the color is applied:

**HTML elements** — use Tailwind `dark:` variants:
```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800">
```

**Recharts props** — use the `isDark` boolean:
```jsx
<XAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
<Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff" }} />
<CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
```

## Tool Call

```json
{
  "code": "export default function MyDashboard({ data }) { ... }",
  "title": "Campaign Performance",
  "data": { "metrics": [...], "summary": {...} }
}
```

## Example: KPI Dashboard

```jsx
export default function KPIDashboard({ data }) {
  const { kpis, trend } = data;
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</div>
            <div className="text-2xl font-bold" style={{ color: COLORS[i] }}>{kpi.value}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trend}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
          <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#6b7280"} />
          <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
          <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff" }} />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```
