---
name: react-dashboard
description: Build interactive React dashboards in Treasure Work using render_react. Use when the user explicitly asks for an interactive dashboard or custom React component beyond what render_chart supports.
---

# React Dashboard

Use `mcp__work__render_react`. For simple charts, prefer `render_chart`.

## Sandbox Globals

Do NOT import anything — these are pre-loaded:

- **React 18**: all hooks (`useState`, `useEffect`, `useMemo`, etc.)
- **Recharts**: all components
- **Tailwind CSS**: all utility classes
- **Theme**: `isDark` (boolean) and `theme` (`"light"` / `"dark"`) — reactive, update on toggle

## Dark Mode

**HTML elements** — Tailwind `dark:` variants:
```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

**Recharts props** — `isDark` ternary:
```jsx
<XAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
<Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff" }} />
<CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
```

## Example

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
