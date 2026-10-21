#!/usr/bin/env python3
"""
General Sisense .dash → render.js + HTML template converter.

Reads any Sisense .dash file and generates the two artifacts used by
the FDE sa-dashboard-agent pattern:
  - render.js   : runs Trino SQL via tdx and injects {{DATA_JSON}}
  - template.html: dark-theme Chart.js dashboard shaped to the .dash tabs/widgets

Usage:
    python3 dash_to_html.py input.dash --out ./output/
    python3 dash_to_html.py input.dash --out ./output/ --db mydb

Output files:
    ./output/render.js
    ./output/template.html
"""

import json
import sys
import os
import re
import argparse
import subprocess
from typing import Any, Dict, List, Optional, Tuple


# ============================================================================
# SECTION 1: .dash PARSER
# ============================================================================

def get_widget_id(w: Dict) -> str:
    for k in ("oid", "_id", "id"):
        if k in w:
            return w[k]
    return ""


def parse_dash(dash: Dict) -> Dict:
    """Extract structured data from a .dash file."""
    title = dash.get("title", "Dashboard")
    db_hint = dash.get("datasource", {}).get("database", "")
    widgets_raw = dash.get("widgets", [])

    widget_map = {get_widget_id(w): w for w in widgets_raw}

    # Find WidgetsTabber(s)
    tabbers = [w for w in widgets_raw if w.get("type") == "WidgetsTabber"]

    # Build tab → widget list
    tabs = []
    tabbed_ids = set()
    for tabber in tabbers:
        for tab in tabber.get("tabs", []):
            display_ids = tab.get("displayWidgetIds", [])
            tab_widgets = [widget_map[wid] for wid in display_ids if wid in widget_map]
            # Filter out only structural/container widgets, keep richtexteditor and pivot2
            tab_widgets = [w for w in tab_widgets
                           if w.get("type") not in ("BloX", "WidgetsTabber")]
            tabs.append({"title": tab.get("title", "Tab"), "widgets": tab_widgets})
            tabbed_ids.update(display_ids)

    # Untabbed widgets → "Overview" tab
    untabbed = [w for w in widgets_raw
                if get_widget_id(w) not in tabbed_ids
                and w.get("type") not in ("BloX", "WidgetsTabber")]
    if not tabs and untabbed:
        tabs = [{"title": "Overview", "widgets": untabbed}]
    elif untabbed and tabs:
        # Add to first tab or create an Overview tab
        tabs[0]["widgets"] = tabs[0]["widgets"] + [w for w in untabbed
                                                    if w not in tabs[0]["widgets"]]

    # Dashboard-level filters
    global_filters = []
    for f in dash.get("filters", []):
        jaql = f.get("jaql", {})
        col = jaql.get("column") or jaql.get("title", "")
        filt = jaql.get("filter", {})
        if col:
            global_filters.append({
                "col": col,
                "table": jaql.get("table", ""),
                "title": jaql.get("title", col),
                # Actual selected values, if the .dash export pinned any — needed
                # to reproduce e.g. a "latest run only" global filter's real scope,
                # not just its column name.
                "members": filt.get("members", []),
                "exclude_members": filt.get("exclude", {}).get("members", []) if isinstance(filt.get("exclude"), dict) else [],
            })

    # Per-widget participation in the dashboard's global filters. Sisense widgets
    # opt in/out of dashboard filters via `dashboardFiltersMode` ("filter" = apply,
    # "select" = apply as a selector, absent/"none" = ignore). The NBP migration
    # silently dropped this the first pass — a widget rendered *without* the
    # dashboard's "latest run only" global filter applied, producing wrong totals.
    # Downstream code should check widget_filter_modes[widget_id] before assuming
    # a widget inherits every global filter.
    widget_filter_modes = {}
    for w in widgets_raw:
        wid = get_widget_id(w)
        mode = w.get("dashboardFiltersMode") or (w.get("metadata", {}) or {}).get("dashboardFiltersMode")
        if mode:
            widget_filter_modes[wid] = mode

    # Dashboard customizations (NEW)
    palette = dash.get("style", {}).get("palette", {})
    dashboard_script = dash.get("script", "")
    settings = dash.get("settings", {})
    description = dash.get("desc", "")

    # Parse layout: extract widget grid positions
    widget_layout = {}
    layout = dash.get("layout", {})
    columns = layout.get("columns", [])
    if columns:
        cells = columns[0].get("cells", [])
        for cell in cells:
            subcells = cell.get("subcells", [])
            for subcell in subcells:
                elements = subcell.get("elements", [])
                for elem in elements:
                    wid = elem.get("widgetid")
                    if wid:
                        widget_layout[wid] = {
                            "height": elem.get("height", "auto"),
                            "width": subcell.get("width", 100),
                            "pxlWidth": subcell.get("pxlWidth"),
                            "minHeight": elem.get("minHeight"),
                            "maxHeight": elem.get("maxHeight"),
                        }

    return {
        "title": title,
        "db_hint": db_hint,
        "tabs": tabs,
        "global_filters": global_filters,
        "widget_filter_modes": widget_filter_modes,
        "widget_map": widget_map,
        "palette": palette,
        "dashboard_script": dashboard_script,
        "settings": settings,
        "description": description,
        "widget_layout": widget_layout,
    }


# ============================================================================
# SECTION 2: JAQL → SQL CONVERTER
# ============================================================================

AGG_MAP = {
    "sum": "SUM",
    "max": "MAX",
    "min": "MIN",
    "avg": "AVG",
    "count": "COUNT",
    "countduplicates": "COUNT",
}


def resolve_jaql_col(jaql: Dict) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Returns (table, column, agg_func) from a JAQL item.
    For formula measures, reads from context.
    """
    if jaql.get("type") == "measure":
        ctx = jaql.get("context", {})
        for token, ref in ctx.items():
            table = ref.get("table", "")
            col = ref.get("column", "")
            if table and col:
                # Try to infer agg from formula string
                formula = jaql.get("formula", "").upper()
                agg = None
                for k in AGG_MAP:
                    if k.upper() in formula:
                        agg = AGG_MAP[k]
                        break
                return table, col, agg
        return None, None, None

    table = jaql.get("table", "")
    col = jaql.get("column", "")
    agg_raw = (jaql.get("agg") or "").lower()
    agg = AGG_MAP.get(agg_raw)
    if table and col:
        return table, col, agg
    return None, None, None


_FORMULA_TOKEN_RE = re.compile(r"\[([^\]]+)\]")


def resolve_formula_measure(jaql: Dict) -> Tuple[Optional[str], Optional[str], List[str]]:
    """
    Resolve a cross-field formula measure (e.g. total_customers - customers_cat_match)
    into a single SQL expression by substituting each bracketed formula token with
    its own aggregated column reference from `context`.

    Previously, formula measures with more than one context entry silently fell back
    to using only the first context column — arithmetic like [a]-[b] was resolved as
    just `SUM(a)`, dropping the subtraction entirely. This resolves the full expression
    when every token maps cleanly to a single table; anything ambiguous (missing
    context entry, or tokens spanning more than one table) is left unresolved so the
    caller can fall back to the old single-column behavior and the mismatch is
    reported as a warning instead of silently producing the wrong number.

    Returns (table, sql_expr, warnings). sql_expr is None if the formula could not be
    confidently resolved.
    """
    formula = jaql.get("formula", "")
    ctx = jaql.get("context", {})
    if not formula or len(ctx) < 2:
        return None, None, []

    tokens = _FORMULA_TOKEN_RE.findall(formula)
    if not tokens:
        return None, None, []

    table = None
    warnings: List[str] = []
    replacements = {}
    for tok in tokens:
        ref = ctx.get(f"[{tok}]") or ctx.get(tok)
        if not ref:
            warnings.append(f"formula token [{tok}] has no matching context entry — formula not auto-converted, needs manual SQL")
            return None, None, warnings
        ref_table = ref.get("table", "")
        ref_col = ref.get("column", "")
        ref_agg = AGG_MAP.get((ref.get("agg") or "").lower())
        if not ref_table or not ref_col:
            warnings.append(f"formula token [{tok}] missing table/column — formula not auto-converted, needs manual SQL")
            return None, None, warnings
        if table is None:
            table = ref_table
        elif ref_table != table:
            warnings.append(
                f"formula references columns on multiple tables ('{table}' and '{ref_table}') "
                f"— cross-table formula not auto-converted, needs manual SQL"
            )
            return None, None, warnings
        replacements[tok] = f"{ref_agg}({ref_col})" if ref_agg else ref_col

    sql_expr = formula
    for tok, expr in replacements.items():
        sql_expr = sql_expr.replace(f"[{tok}]", expr)

    return table, sql_expr, warnings


def _dedupe_preserve_order(items: List[str]) -> List[str]:
    seen = set()
    out = []
    for i in items:
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out


def jaql_to_sql(widget: Dict, db: str = "__DB__",
                 global_filters: Optional[List[Dict]] = None,
                 widget_filter_modes: Optional[Dict[str, str]] = None) -> Optional[Dict]:
    """
    Convert a widget's JAQL panels to a SQL query.
    Returns dict with: sql, table, columns, widget_type, chart_type, title
    or None if the widget has no queryable data.
    """
    global_filters = global_filters or []
    widget_filter_modes = widget_filter_modes or {}

    wtype = widget.get("type", "")
    wsubtype = widget.get("subtype", "")
    wtitle = widget.get("title", "Untitled")
    oid = get_widget_id(widget)
    panels = widget.get("metadata", {}).get("panels", [])

    if not panels:
        return None

    # Collect columns by panel role
    dim_cols = []      # x-axis, categories, rows, geo — GROUP BY
    measure_cols = []  # values, color — SELECT with agg
    break_by = None    # break by — second GROUP BY
    filters = []       # WHERE clauses
    join_clauses = []  # JOIN clauses (heuristic auto-joins for cross-table global filters)
    joined_tables = set()
    date_col = None
    date_level = None
    primary_table = None
    warnings = []       # surfaced to the user in the before/after validation summary

    for panel in panels:
        pname = panel.get("name", "")
        for item in panel.get("items", []):
            jaql = item.get("jaql", {})
            table, col, agg = resolve_jaql_col(jaql)
            if not table or not col:
                continue
            if not primary_table:
                primary_table = table
            elif table != primary_table:
                # jaql_to_sql only ever queries one table (`primary_table`) for its
                # own dim/measure columns. If a *filter* panel references a second
                # table, we auto-join it below (heuristic, see global-filter block).
                # A non-filter panel referencing a second table (e.g. a measure/dim
                # from another table) is a real gap — still flagged, not silently
                # dropped, since blindly joining on a guessed key for arbitrary
                # measures/dimensions is much riskier than for filter scoping.
                if pname != "filters":
                    warnings.append(
                        f"widget references column '{col}' on table '{table}' but the "
                        f"query only selects from '{primary_table}' — no JOIN was generated. "
                        f"Verify this doesn't change widget scope/results."
                    )

            level = jaql.get("level", "")
            datatype = jaql.get("datatype", "")

            if pname == "filters":
                filt = jaql.get("filter", {})
                members = filt.get("members", [])
                exclude = filt.get("exclude", {})
                exclude_members = exclude.get("members", []) if isinstance(exclude, dict) else []
                top_n = filt.get("top") or filt.get("by", {}).get("top") if isinstance(filt.get("by"), dict) else filt.get("top")

                # Panel filter on a non-primary table: heuristic auto-join on the
                # filter's own column name (same-name shared key assumption — this
                # is the exact "latest run only" cross-table filter pattern from the
                # NBP migration). If the guess is wrong, the dry-run SQL check
                # (see main()) will surface a query error rather than silently
                # producing wrong numbers.
                if table != primary_table and table not in joined_tables:
                    join_clauses.append(
                        f"JOIN {db}.{table} ON {db}.{primary_table}.{col} = {db}.{table}.{col}"
                    )
                    joined_tables.add(table)
                    warnings.append(
                        f"auto-joined '{table}' to '{primary_table}' on '{col}' to apply a filter panel "
                        f"scoped to '{table}' — this join key is a same-column-name GUESS, not confirmed "
                        f"against a datamodel. Verify it's correct."
                    )

                if members:
                    quoted = ", ".join(f"'{m}'" for m in members)
                    filters.append(f"{col} IN ({quoted})")
                elif exclude_members:
                    # NBP .dash had exclusion-list filters (filter.exclude.members) —
                    # the converter used to silently drop these, changing widget scope.
                    quoted = ", ".join(f"'{m}'" for m in exclude_members)
                    filters.append(f"{col} NOT IN ({quoted})")
                elif isinstance(filt.get("by"), dict) and "top" in filt.get("by", {}):
                    # Sisense top-N ranking filter (filter.by.top / filter.by.column).
                    # Not expressible as a plain WHERE clause — flag it for manual
                    # review (e.g. QUALIFY ROW_NUMBER() ... <= N) instead of dropping it.
                    filters.append(f"/* TODO: top-N filter on {col} not auto-converted — "
                                    f"filter.by={filt.get('by')} */")
                    warnings.append(
                        f"widget filter on '{col}' is a top-N ranking filter "
                        f"(filter.by={filt.get('by')}) — not auto-converted to SQL, "
                        f"needs manual QUALIFY/ROW_NUMBER() logic."
                    )
                elif "fromNotEqual" in filt:
                    threshold = filt.get("fromNotEqual")
                    filters.append(f"{col} != {threshold!r}" if isinstance(threshold, str)
                                   else f"{col} != {threshold}")
                elif "from" in filt or "to" in filt:
                    lo, hi = filt.get("from"), filt.get("to")
                    if lo is not None:
                        filters.append(f"{col} >= {lo!r}" if isinstance(lo, str) else f"{col} >= {lo}")
                    if hi is not None:
                        filters.append(f"{col} <= {hi!r}" if isinstance(hi, str) else f"{col} <= {hi}")
                continue

            if pname in ("x-axis", "categories", "rows", "geo"):
                if datatype == "datetime" or level:
                    date_col = col
                    date_level = level or "days"
                    if level == "months":
                        dim_cols.append(("DATE_TRUNC('month', TRY_CAST({col} AS DATE))", col, "date_month"))
                    else:
                        dim_cols.append(("CAST({col} AS DATE)", col, "event_date"))
                else:
                    dim_cols.append(("{col}", col, col))

            elif pname == "break by":
                if table and col:
                    break_by = col

            elif pname in ("values", "value", "color", "secondary"):
                formula_table, formula_expr, formula_warnings = (None, None, [])
                if jaql.get("type") == "measure" and len(jaql.get("context", {})) > 1:
                    formula_table, formula_expr, formula_warnings = resolve_formula_measure(jaql)
                if formula_expr and (formula_table == primary_table or not primary_table):
                    measure_cols.append((formula_expr, col, jaql.get("title") or col, None))
                else:
                    if formula_warnings:
                        warnings.extend(formula_warnings)
                    expr = f"{agg}({col})" if agg else col
                    measure_cols.append((expr, col, jaql.get("title") or col, agg))

    if not primary_table:
        return None

    # Auto-apply dashboard-level global filters this widget participates in. Every
    # global filter used to be display-only metadata (rendered as a static chip) —
    # widgets silently rendered without any dashboard-level scoping applied, which
    # is what caused the NBP "Historic Tracker" widgets to initially ignore the
    # dashboard's "latest run only" filter. Default is to apply unless the widget's
    # `dashboardFiltersMode` explicitly says "none" — that mirrors Sisense's own
    # default (widgets inherit dashboard filters unless configured to ignore them).
    mode = widget_filter_modes.get(oid)
    applies_global_filters = mode != "none"
    if applies_global_filters:
        for gf in global_filters:
            gf_table = gf.get("table") or primary_table
            gf_col = gf.get("col")
            if not gf_col:
                continue
            gf_members = gf.get("members", [])
            gf_exclude = gf.get("exclude_members", [])
            if not gf_members and not gf_exclude:
                continue  # filter has no pinned values in the .dash export — nothing to apply

            if gf_table != primary_table and gf_table not in joined_tables:
                join_clauses.append(
                    f"JOIN {db}.{gf_table} ON {db}.{primary_table}.{gf_col} = {db}.{gf_table}.{gf_col}"
                )
                joined_tables.add(gf_table)
                warnings.append(
                    f"auto-joined '{gf_table}' to '{primary_table}' on '{gf_col}' to apply the dashboard-level "
                    f"global filter '{gf.get('title', gf_col)}' — this join key is a same-column-name GUESS, "
                    f"not confirmed against a datamodel. Verify it's correct."
                )

            if gf_members:
                quoted = ", ".join(f"'{m}'" for m in gf_members)
                filters.append(f"{gf_col} IN ({quoted})")
            elif gf_exclude:
                quoted = ", ".join(f"'{m}'" for m in gf_exclude)
                filters.append(f"{gf_col} NOT IN ({quoted})")

    filters = _dedupe_preserve_order(filters)
    join_clauses = _dedupe_preserve_order(join_clauses)

    # FIX: If no dimension but break_by exists, use break_by as dimension
    if not dim_cols and break_by:
        dim_cols = [("{col}", break_by, break_by)]
        break_by = None  # Clear break_by so it's not doubled

    # Build SELECT
    select_parts = []
    group_parts = []
    result_columns = []

    for fmt_expr, raw_col, alias in dim_cols:
        expr = fmt_expr.replace("{col}", raw_col)
        select_parts.append(f"{expr} AS {alias}")
        group_parts.append(expr)
        result_columns.append(alias)

    if break_by:
        select_parts.append(f"{break_by}")
        group_parts.append(f"{break_by}")
        result_columns.append(break_by)

    for expr, raw_col, alias, agg_fn in measure_cols:
        safe_alias = re.sub(r"[^a-zA-Z0-9_]", "_", alias).lower().strip("_") or raw_col
        select_parts.append(f"{expr} AS {safe_alias}")
        result_columns.append(safe_alias)

    if not select_parts:
        return None

    from_clause = f"FROM {db}.{primary_table}\n" + "".join(f"{jc}\n" for jc in join_clauses)

    # For indicators with no dim: no GROUP BY
    if not group_parts and "indicator" in wtype:
        sql = (
            f"SELECT {', '.join(select_parts)}\n"
            f"{from_clause}"
            + (f"WHERE {' AND '.join(filters)}\n" if filters else "")
            + "LIMIT 1"
        )
    elif group_parts:
        sql = (
            f"SELECT {', '.join(select_parts)}\n"
            f"{from_clause}"
            + (f"WHERE {' AND '.join(filters)}\n" if filters else "")
            + f"GROUP BY {', '.join(group_parts)}\n"
            f"ORDER BY {group_parts[0]} ASC\n"
            f"LIMIT 10000"
        )
    else:
        sql = (
            f"SELECT {', '.join(select_parts)}\n"
            f"{from_clause}"
            + (f"WHERE {' AND '.join(filters)}\n" if filters else "")
            + f"LIMIT 10000"
        )

    # Infer chart type
    if "indicator" in wtype:
        chart_type = "indicator"
    elif "bar" in wsubtype:
        chart_type = "bar"
    elif "column" in wsubtype or "column" in wtype:
        chart_type = "column"
    elif "line" in wsubtype or "line" in wtype:
        chart_type = "line"
    elif "pie" in wsubtype or "donut" in wsubtype:
        chart_type = "doughnut"
    elif "pivot" in wtype:
        chart_type = "table"
    elif "map" in wtype:
        chart_type = "map"
    else:
        chart_type = "bar"

    return {
        "sql": sql,
        "table": primary_table,
        "columns": result_columns,
        "dim_col": dim_cols[0][2] if dim_cols else None,
        "break_by": break_by,
        "measure_cols": [(e, a, ag) for e, a, ag in [(x[0], x[2], x[3]) for x in measure_cols]],
        "chart_type": chart_type,
        "title": wtitle,
        "wtype": wtype,
        "oid": oid,
        "date_col": date_col,
        "date_level": date_level,
        "widget_style": widget.get("style", {}),
        "widget_options": widget.get("options", {}),
        "widget_script": widget.get("script", ""),
        "widget_desc": widget.get("desc", ""),
        "drill_config": widget.get("drillToDashboardConfig", {}),
        "subtype": widget.get("subtype", ""),
        "applies_global_filters": applies_global_filters,
        "warnings": warnings,
    }


def validate_sql_with_td(sql: str, db: str, timeout: int = 30) -> Optional[str]:
    """
    Pre-render sanity check: dry-run a generated SQL statement against TD via
    `tdx query -d <db> "EXPLAIN <sql>"` — this validates table/column names and
    join logic WITHOUT executing the query, so a bad auto-generated JOIN or a
    typo'd column surfaces here (in widget_audit.json, before the user reviews
    it) instead of failing silently later inside render.js's runQuery().

    Returns None if the query is valid (or if validation couldn't be attempted —
    e.g. `tdx` isn't on PATH, the call times out, or `db` is still the
    unresolved "__DB__" placeholder). Returns an error string if TD rejected it.
    This is a best-effort pre-flight check, not a hard gate — a None return
    does NOT guarantee the query is correct, only that this check didn't catch
    a problem.
    """
    if not sql or not db or db == "__DB__":
        return None
    try:
        proc = subprocess.run(
            ["tdx", "query", "-d", db, f"EXPLAIN {sql}"],
            capture_output=True, text=True, timeout=timeout,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        return None
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip()
        return err[:500] if err else "tdx query returned a non-zero exit code with no error output"
    return None


def deduplicate_queries(widget_queries: List[Dict]) -> Dict[str, Dict]:
    """
    Group queries by table. Each table gets one query index.
    Returns {table_name: {idx, sql, widgets[...]}}
    """
    table_groups: Dict[str, Dict] = {}
    idx = 1
    for wq in widget_queries:
        if not wq:
            continue
        table = wq["table"]
        if table not in table_groups:
            table_groups[table] = {"idx": idx, "sql": wq["sql"], "widgets": [wq]}
            idx += 1
        else:
            table_groups[table]["widgets"].append(wq)
    return table_groups


# ============================================================================
# SECTION 3: render.js GENERATOR
# ============================================================================

PARSE_TABLE_JS = r"""
// TSV parser for `tdx query --format tsv` output. Do NOT switch this back to
// parsing the default box-drawing table: that format truncates/miscounts wide
// or wrapped cells, and a lenient `!isNaN(value)` numeric coercion silently
// corrupts date-like strings (e.g. truncates '2026-07-09' down to '2026').
// Both bugs were hit and fixed the hard way on the NBP dashboard migration —
// keep this parser TSV-only with a strict numeric regex.
const _NUMERIC_RE = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/;

function parseTable(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.length > 0);
  if (lines.length < 2) return [];

  const columnNames = lines[0].split('\t').map(c => c.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split('\t');
    if (cells.length !== columnNames.length) continue;
    const row = {};
    columnNames.forEach((col, idx) => {
      let value = cells[idx];
      if (value === '' || value == null || value === 'NULL' || value === '\\N') {
        value = null;
      } else if (_NUMERIC_RE.test(value)) {
        value = (value.includes('.') || /[eE]/.test(value)) ? parseFloat(value) : parseInt(value, 10);
      }
      row[col] = value;
    });
    rows.push(row);
  }
  return rows;
}
"""


def generate_render_js(parsed: Dict, table_groups: Dict, widget_queries: List[Dict],
                       db_hint: str) -> str:
    title = parsed["title"]
    db_comment = f" // detected: {db_hint}" if db_hint else ""

    lines = [
        "#!/usr/bin/env node",
        f"// Auto-generated by dash_to_html.py — {title}",
        "",
        "const fs = require('fs');",
        "const { execSync } = require('child_process');",
        "",
        f"const DB = '__DB__';{db_comment}",
        "const WORKSPACE_SCOPE = '__WORKSPACE_SCOPE__';",
        "const TEMPLATE_PATH = '__TEMPLATE_PATH__';",
        "",
        PARSE_TABLE_JS,
        "",
        "function runQuery(sql, outFile) {",
        "  try {",
        r"    const result = execSync(`tdx query --format tsv --limit 10000 -d ${DB} \"${sql}\" 2>/dev/null`, { encoding: 'utf-8' });",
        "    fs.writeFileSync(outFile, result);",
        "    return result;",
        "  } catch (error) {",
        "    console.error(`Query failed: ${error.message}`);",
        "    fs.writeFileSync(outFile, '');",
        "    return '';",
        "  }",
        "}",
        "",
        "try {",
        "  const outdir = `./dash-output/${WORKSPACE_SCOPE}`;",
        "  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });",
        "  if (!fs.existsSync('/tmp/dash_queries')) fs.mkdirSync('/tmp/dash_queries', { recursive: true });",
        "",
    ]

    # Emit SQL queries
    for table, group in sorted(table_groups.items(), key=lambda x: x[1]["idx"]):
        idx = group["idx"]
        sql = group["sql"]
        sql_js = sql.replace("`", "\\`").replace("${", "\\${")
        lines.append(f"  // Q{idx}: {table}")
        lines.append(f"  const sql{idx} = `{sql_js}`;")
        lines.append(f"  runQuery(sql{idx}, '/tmp/dash_queries/q{idx}.txt');")
        lines.append(f"  const q{idx} = parseTable('/tmp/dash_queries/q{idx}.txt');")
        lines.append(f"  console.log(`Q{idx} ({table}): ${{q{idx}.length}} rows`);")
        lines.append("")

    # Freshness query (always useful)
    freshness_table = list(table_groups.keys())[0] if table_groups else "unknown_table"
    fresh_idx = max(g["idx"] for g in table_groups.values()) + 1 if table_groups else 1
    lines.append(f"  // Q{fresh_idx}: data freshness")
    lines.append(f"  const sqlFresh = `SELECT MIN(CAST(event_date AS VARCHAR)) as first_date, MAX(CAST(event_date AS VARCHAR)) as last_date FROM __DB__.{freshness_table} LIMIT 1`;")
    lines.append(f"  runQuery(sqlFresh, '/tmp/dash_queries/q{fresh_idx}.txt');")
    lines.append(f"  const qFresh = parseTable('/tmp/dash_queries/q{fresh_idx}.txt');")
    lines.append("")

    # Build widgetData mapping
    lines.append("  // Map query results to per-widget data")
    lines.append("  const widgetData = {};")
    for wq in widget_queries:
        if not wq:
            continue
        oid = wq["oid"]
        table = wq["table"]
        if table in table_groups:
            qvar = f"q{table_groups[table]['idx']}"
            dim = wq.get("dim_col")
            break_by = wq.get("break_by")
            measure_cols = wq.get("measure_cols", [])
            val_col = measure_cols[0][1] if measure_cols else None

            lines.append(f"  // widget: {wq['title'][:60]}")
            if dim and break_by and val_col:
                lines.append(f"  widgetData['{oid}'] = buildSeriesData({qvar}, '{dim}', '{break_by}', '{val_col}');")
            elif dim and val_col:
                lines.append(f"  widgetData['{oid}'] = {{ rows: {qvar}.filter(r => r['{dim}'] != null), dim: '{dim}', val: '{val_col}' }};")
            else:
                lines.append(f"  widgetData['{oid}'] = {{ rows: {qvar} }};")

    lines.append("")

    # Tab structure
    lines.append("  // Tab structure from .dash")
    tabs_js = []
    for i, tab in enumerate(parsed["tabs"]):
        widget_oids = [get_widget_id(w) for w in tab["widgets"]
                       if get_widget_id(w)]
        oids_js = json.dumps(widget_oids)
        tabs_js.append(f'    {{ id: "tab_{i}", label: {json.dumps(tab["title"])}, widgetIds: {oids_js} }}')
    lines.append("  const tabDefs = [")
    lines.append(",\n".join(tabs_js))
    lines.append("  ];")
    lines.append("")

    # Assemble D
    lines.append("  const D = {")
    lines.append("    meta: {")
    lines.append(f"      db: DB,")
    lines.append("      workspace: WORKSPACE_SCOPE,")
    lines.append(f"      title: {json.dumps(title)},")
    lines.append("      asOf: qFresh.length > 0 ? qFresh[0].last_date : new Date().toISOString().split('T')[0],")
    lines.append("      dateRange: qFresh.length > 0 ? `${qFresh[0].first_date} to ${qFresh[0].last_date}` : 'unknown',")

    # Add palette if available
    palette_colors = parsed.get("palette", {}).get("colors", [])
    if palette_colors:
        palette_js = json.dumps(palette_colors)
        lines.append(f"      palette: {palette_js},")

    lines.append("    },")
    lines.append("    tabs: tabDefs,")
    lines.append("    widgetData,")
    lines.append("  };")
    lines.append("")
    lines.append("  let html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');")
    lines.append("  html = html.replace('{{DATA_JSON}}', JSON.stringify(D));")
    lines.append("  const outputFile = `${outdir}/dashboard.html`;")
    lines.append("  fs.writeFileSync(outputFile, html);")
    lines.append("  console.log(`Dashboard generated: ${outputFile}`);")
    lines.append("")
    lines.append("} catch (error) {")
    lines.append("  console.error(`Render failed: ${error.message}`);")
    lines.append("  process.exit(1);")
    lines.append("}")

    return "\n".join(lines)


# ============================================================================
# SECTION 4: HTML TEMPLATE GENERATOR
# ============================================================================

# Shared CSS (copied from sa-dashboard.html pattern)
SHARED_CSS = """
:root{--dash-bg:#111827;--widget-bg:#1f2937;--border-radius:8px;--font-family:system-ui,-apple-system,sans-serif;--box-shadow:none;--dash-fg:#f3f4f6;--dash-muted:#9ca3af}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--dash-bg);color:var(--dash-fg);font-family:var(--font-family);font-size:13px}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--widget-bg)}
::-webkit-scrollbar-thumb{background:#4b5563;border-radius:3px}

#app{max-width:1400px;margin:0 auto;padding:24px 20px}
#preview-banner{display:none;background:#78350f;color:#fcd34d;text-align:center;padding:8px 16px;font-size:12px;font-weight:500}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
.header h1{font-size:20px;font-weight:700;color:var(--dash-fg)}
.header p{font-size:12px;color:var(--dash-muted);margin-top:4px}
.run-badge{background:#1e1b4b;color:#a5b4fc;font-size:11px;font-weight:500;padding:6px 14px;border-radius:9999px;border:1px solid #3730a3;white-space:nowrap;flex-shrink:0}

.filter-bar{display:flex;gap:8px;align-items:center;margin-bottom:16px;padding:12px 16px;background:var(--widget-bg);border-radius:6px;border:1px solid #374151;flex-wrap:wrap}
.filter-toggle{cursor:pointer;font-weight:500;transition:opacity .15s;color:var(--dash-muted)}
.filter-toggle:hover{opacity:1 !important}
.filter-label{font-size:12px;font-weight:500;color:var(--dash-muted)}
.filter-chip{display:inline-block;background:var(--dash-bg);color:var(--dash-fg);font-size:11px;padding:4px 10px;border-radius:4px;border:1px solid #4b5563;transition:background .15s,border .15s}
.filter-chip:hover{background:var(--widget-bg);border-color:#6b7280}
.filter-group{display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap}
.filter-group-label{font-size:11px;color:var(--dash-muted);margin-right:2px}
.filter-pill{display:inline-block;background:var(--dash-bg);color:var(--dash-muted);font-size:11px;padding:4px 10px;border-radius:4px;border:1px solid #4b5563;cursor:pointer;transition:background .15s,border .15s,color .15s;font-family:inherit}
.filter-pill:hover{border-color:#6b7280}
.filter-pill.active{background:#312e81;color:#e0e7ff;border-color:#4f46e5}

.tab-bar{display:flex;gap:4px;border-bottom:1px solid #374151;margin-bottom:20px;overflow-x:auto}
.tab-btn{padding:8px 18px;font-size:13px;font-weight:500;border-radius:6px 6px 0 0;border:none;cursor:pointer;background:transparent;color:var(--dash-muted);transition:background .15s,color .15s;white-space:nowrap}
.tab-btn:hover{color:var(--dash-fg);background:var(--widget-bg)}
.tab-btn.active{background:#4f46e5;color:#fff}
.tab-pane{display:none;flex-direction:column;gap:16px}
.tab-pane.active{display:flex}

.card{background:var(--widget-bg);border-radius:var(--border-radius);padding:20px;border:1px solid #374151;box-shadow:var(--box-shadow)}
.card-title{font-size:13px;font-weight:600;color:var(--dash-fg);margin-bottom:16px}

.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid-1{display:grid;grid-template-columns:1fr;gap:12px}

.flex-row{display:flex;gap:16px}
.flex-col{flex:1;min-width:0}

.kpi{background:var(--widget-bg);border-radius:var(--border-radius);padding:16px;text-align:center;border:1px solid #374151}
.kpi-val{font-size:22px;font-weight:700}
.kpi-label{font-size:10px;color:var(--dash-muted);text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
.kpi-sub{font-size:10px;color:#6b7280;margin-top:2px}

.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{background:var(--dash-bg);color:var(--dash-fg);font-size:11px;font-weight:600;padding:8px 10px;text-align:left;white-space:nowrap;border-bottom:1px solid #4b5563;cursor:pointer}
th:hover{background:var(--widget-bg)}
td{padding:7px 10px;font-size:11px;color:#d1d5db;border-top:1px solid #374151}
tr:hover td{background:var(--widget-bg)}

.hbar-row{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.hbar-label{font-size:11px;color:var(--dash-muted);width:160px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hbar-track{flex:1;background:#374151;border-radius:3px;height:22px;overflow:hidden}
.hbar-fill{height:100%;border-radius:3px}
.hbar-val{font-size:11px;color:#d1d5db;width:85px;text-align:right;flex-shrink:0}

.chart-wrap{position:relative;height:300px;width:100%}
.placeholder-card{background:var(--widget-bg);border:1px dashed #4b5563;border-radius:var(--border-radius);padding:24px;text-align:center;color:#6b7280;font-size:12px}

.drill-link{display:inline-block;margin-top:8px;font-size:11px;color:#8b5cf6;text-decoration:none;cursor:pointer;padding:2px 4px;border-radius:3px;transition:background .15s,color .15s}
.drill-link:hover{text-decoration:underline;background:rgba(139,92,246,.1)}

#tip{position:fixed;background:#0f172a;border:1px solid #4b5563;border-radius:6px;padding:6px 10px;font-size:11px;color:var(--dash-fg);pointer-events:none;display:none;z-index:9999;max-width:260px;white-space:pre-line;line-height:1.55;box-shadow:0 4px 16px rgba(0,0,0,.6)}
"""

# Shared JS helpers (fmt, kpi, card, hbar, tbl) — copied from sa-dashboard pattern
SHARED_HELPERS_JS = """
const fmt = n => {
  if (n == null) return '—';
  const v = Number(n);
  if (isNaN(v)) return String(n);
  const a = Math.abs(v);
  if (a >= 1e9) return (v/1e9).toFixed(1).replace(/\\.0$/,'') + 'B';
  if (a >= 1e6) return (v/1e6).toFixed(1).replace(/\\.0$/,'') + 'M';
  if (a >= 1e3) return (v/1e3).toFixed(1).replace(/\\.0$/,'') + 'K';
  return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
};
const pct = (n,d=1) => n==null?'—':Number(n).toFixed(d)+'%';
const C = (D && D.meta && D.meta.palette && D.meta.palette.length) ? D.meta.palette : ['#44BAB8','#2E41A6','#8CC97E','#EEB53A','#A05EB0','#8FD6D4','#828DCA','#BADFB2','#F97316','#EC4899'];
const _esc = s => String(s||'').replace(/[&<>"']/g, e => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[e]));

// Client-side re-filtering for interactive filter pills. Global filters are
// already applied server-side in the generated SQL (see jaql_to_sql's
// global-filter auto-apply), so this narrows the already-scoped rows further
// — e.g. deselecting a pinned member hides that slice without a re-query.
// Keyed by column name so it applies to any widget whose rows carry that
// column (as a dim, break-by, or plain field), and is a no-op for widgets
// that don't.
const _appliedFilters = {}; // { colName: Set(activeValues) }

function filterRows(rows) {
  const cols = Object.keys(_appliedFilters);
  if (!cols.length || !rows || !rows.length) return rows;
  return rows.filter(r => cols.every(col => {
    const active = _appliedFilters[col];
    if (!active || !active.size) return true;
    if (!(col in r)) return true; // widget doesn't carry this column — leave untouched
    return active.has(String(r[col]));
  }));
}

function toggleFilterPill(el) {
  const col = el.getAttribute('data-col');
  const value = el.getAttribute('data-value');
  if (!_appliedFilters[col]) {
    _appliedFilters[col] = new Set(
      Array.from(document.querySelectorAll(`.filter-pill[data-col="${col}"]`)).map(p => p.getAttribute('data-value'))
    );
  }
  const isActive = el.classList.contains('active');
  if (isActive) {
    _appliedFilters[col].delete(value);
    el.classList.remove('active');
  } else {
    _appliedFilters[col].add(value);
    el.classList.add('active');
  }
  const activeTab = document.querySelector('.tab-pane.active');
  const activeBtn = document.querySelector('.tab-btn.active');
  if (activeTab && activeBtn) {
    const idx = Array.from(document.querySelectorAll('.tab-btn')).indexOf(activeBtn);
    if (idx >= 0) activeTab.innerHTML = _TABS[idx].render();
  }
}

function kpi(label, value, color, sub) {
  return `<div class="kpi"><div class="kpi-val" style="color:${color||C[0]}">${value}</div><div class="kpi-label">${label}</div>${sub?`<div class="kpi-sub">${sub}</div>`:''}</div>`;
}

function card(title, inner, tooltip) {
  return `<div class="card" ${tooltip?`title="${_esc(tooltip)}"`:''} ><div class="card-title">${title}</div>${inner}</div>`;
}

function hbar(items, colorOverride) {
  if (!items || !items.length) return `<div style="color:#6b7280;font-size:12px;padding:12px 0">No data</div>`;
  const max = Math.max(...items.map(d => d.v), 1);
  return items.map((item, i) => {
    const pctW = Math.max((item.v / max) * 100, 0.3).toFixed(1);
    const color = item.c || colorOverride || C[i % C.length];
    return `<div class="hbar-row" onmouseenter="showTip(event,'${_esc(item.l)}: ${fmt(item.v)}')" onmousemove="moveTip(event)" onmouseleave="hideTip()">
      <span class="hbar-label" title="${_esc(item.l)}">${_esc(item.l)}</span>
      <div class="hbar-track"><div class="hbar-fill" style="width:${pctW}%;background:${color}"></div></div>
      <span class="hbar-val">${fmt(item.v)}</span>
    </div>`;
  }).join('');
}

function tbl(heads, rows) {
  if (!rows || !rows.length) return `<div style="color:#6b7280;font-size:12px;padding:12px 0">No data</div>`;
  const ths = heads.map((h, i) => `<th onclick="sortTbl(event,${i})">${h} ⇅</th>`).join('');
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<div class="tbl-wrap"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function sortTbl(e, col) {
  const t = e.target.closest('table');
  if (!t) return;
  const rows = Array.from(t.querySelectorAll('tbody tr'));
  rows.sort((a, b) => {
    const va = a.children[col]?.textContent || '';
    const vb = b.children[col]?.textContent || '';
    const na = parseFloat(va.replace(/,/g, ''));
    const nb = parseFloat(vb.replace(/,/g, ''));
    return isNaN(na) ? va < vb ? -1 : 1 : na < nb ? -1 : 1;
  });
  rows.forEach(r => t.querySelector('tbody').appendChild(r));
}

function showTip(e, txt) {
  const tip = document.getElementById('tip');
  tip.textContent = txt;
  tip.style.display = 'block';
  moveTip(e);
}
function moveTip(e) {
  const tip = document.getElementById('tip');
  tip.style.left = (e.clientX + 10) + 'px';
  tip.style.top = (e.clientY + 10) + 'px';
}
function hideTip() {
  document.getElementById('tip').style.display = 'none';
}

// Build multi-series data: pivot rows by series key
function buildSeriesData(rows, dimCol, breakByCol, valCol) {
  const labels = [...new Set(rows.map(r => r[dimCol]))].sort();
  const series = [...new Set(rows.map(r => r[breakByCol]))].filter(Boolean);
  const datasets = series.map((s, i) => ({
    label: String(s),
    data: labels.map(l => {
      const row = rows.find(r => r[dimCol] === l && r[breakByCol] === s);
      return row ? (row[valCol] || 0) : 0;
    }),
    backgroundColor: C[i % C.length],
    borderColor: C[i % C.length],
  }));
  return { labels, datasets };
}

// Build Chart.js time series: [{date, val, series}] → datasets per series
function buildLineChart(canvasId, rows, dimCol, valCol, breakByCol, opts) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !rows || !rows.length) return;
  opts = opts || {};
  const dates = [...new Set(rows.map(r => r[dimCol]))].sort();
  let datasets;
  if (breakByCol) {
    const series = [...new Set(rows.map(r => r[breakByCol]))].filter(Boolean);
    datasets = series.map((s, i) => ({
      label: s,
      data: dates.map(d => { const r = rows.find(x => x[dimCol] === d && x[breakByCol] === s); return r ? r[valCol] : null; }),
      borderColor: C[i % C.length], backgroundColor: C[i % C.length] + '20',
      tension: 0.3, fill: false, borderWidth: opts.lineWidth === 'bold' ? 3 : opts.lineWidth === 'thin' ? 1 : 2, pointRadius: opts.markersEnabled ? 3 : 0
    }));
  } else {
    datasets = [{ label: valCol, data: dates.map(d => { const r = rows.find(x => x[dimCol] === d); return r ? r[valCol] : null; }),
      borderColor: C[0], backgroundColor: C[0] + '20', tension: 0.3, fill: false }];
  }
  new Chart(ctx, {
    type: 'line', data: { labels: dates, datasets },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: opts.legendEnabled !== false, position: opts.legendPosition || 'top', labels: { color: '#e5e7eb', font: {size: 11} } } },
      scales: { x: { ticks: {color:'#9ca3af'}, grid: {color:'#374151', display: opts.xGridLines || false } },
                y: { ticks: {color:'#9ca3af'}, grid: {color:'#374151', display: opts.yGridLines || false } } } }
  });
}

function buildBarChart(canvasId, rows, dimCol, valCol, breakByCol, horizontal, opts) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !rows || !rows.length) return;
  opts = opts || {};
  const labels = [...new Set(rows.map(r => r[dimCol]))];
  let datasets;
  if (breakByCol) {
    const series = [...new Set(rows.map(r => r[breakByCol]))];
    datasets = series.map((s, i) => ({
      label: s,
      data: labels.map(l => { const r = rows.find(x => x[dimCol] === l && x[breakByCol] === s); return r ? r[valCol] : 0; }),
      backgroundColor: C[i % C.length]
    }));
  } else {
    datasets = [{ label: valCol, data: labels.map(l => { const r = rows.find(x => x[dimCol] === l); return r ? r[valCol] : 0; }), backgroundColor: C }];
  }
  new Chart(ctx, {
    type: 'bar', data: { labels, datasets },
    options: { indexAxis: horizontal ? 'y' : 'x', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: opts.legendEnabled !== false, position: opts.legendPosition || 'top', labels: { color: '#e5e7eb', font: {size: 11} } } },
      scales: { x: { ticks: {color:'#9ca3af'}, grid: {color:'#374151', display: opts.xGridLines || false } },
                y: { ticks: {color:'#9ca3af'}, grid: {color:'#374151', display: opts.yGridLines || false } } } }
  });
}

function buildDonutChart(canvasId, rows, dimCol, valCol, opts) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !rows || !rows.length) return;
  opts = opts || {};
  new Chart(ctx, {
    type: 'doughnut',
    data: { labels: rows.map(r => r[dimCol]), datasets: [{ data: rows.map(r => r[valCol]), backgroundColor: C, borderColor: 'var(--widget-bg)', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: opts.legendEnabled !== false, position: opts.legendPosition || 'bottom', labels: { color: '#e5e7eb', font: {size: 11} } } } }
  });
}
"""


def extract_theme_vars(script: str) -> Dict[str, str]:
    """Parse Sisense dashboard script for CSS theme variables."""
    defaults = {
        "DASH_BG": "#111827",
        "WIDGET_BG": "#1f2937",
        "BORDER_RADIUS": "8px",
        "FONT_FAMILY": "system-ui, -apple-system, sans-serif",
        "BOX_SHADOW": "none",
        "DASH_FG": "#f3f4f6",
        "DASH_MUTED": "#9ca3af",
    }
    patterns = {
        "DASH_BG": r"dashboardBackgroundColor\s*=\s*'([^']+)'",
        "WIDGET_BG": r"widgetBackgroundColor\s*=\s*'([^']+)'",
        "BORDER_RADIUS": r"borderRadius\s*=\s*'([^']+)'",
        "FONT_FAMILY": r"fontFamily\s*=\s*'([^']+)'",
        "BOX_SHADOW": r"subCellVerticalBoxShadow\s*=\s*'([^']+)'",
    }
    result = dict(defaults)
    for key, pat in patterns.items():
        m = re.search(pat, script)
        if m:
            result[key] = m.group(1)
    return result


def _esc(s: str) -> str:
    """Escape string for safe embedding in JavaScript."""
    return str(s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#39;")


def widget_render_js(wq: Dict, var_prefix: str = "w") -> str:
    """Generate the JS snippet to render one widget inside a tab function."""
    if not wq:
        return ""

    oid = wq["oid"]
    title = wq["title"]
    chart_type = wq["chart_type"]

    # Handle text/BloX widgets (no SQL/data needed)
    if chart_type == "text":
        text_content = _esc(wq.get("text_content", ""))
        return (
            f"html += `<div class='card' style='padding:12px;border-radius:8px'>"
            f"<div style='font-size:13px;color:var(--dash-fg)' "
            f"data-widget-oid=\"{oid}\" data-widget-type=\"text\">"
            f"{text_content}</div></div>`;\n"
        )

    if chart_type == "richtext":
        html_content = wq.get("html_content", "")
        return (
            f"html += `<div class='card'><div data-widget-oid=\"{oid}\" "
            f"data-widget-type=\"richtext\" style='padding:12px'>"
            f"{html_content}</div></div>`;\n"
        )

    dim_col = wq.get("dim_col")
    break_by = wq.get("break_by")
    measure_cols = wq.get("measure_cols", [])
    val_col = measure_cols[0][1] if measure_cols else None
    widget_desc = wq.get("widget_desc", "")
    widget_style = wq.get("widget_style", {})
    widget_script = wq.get("widget_script", "")

    safe_id = re.sub(r"[^a-zA-Z0-9]", "_", oid)
    canvas_id = f"chart_{safe_id}"
    data_ref = f"filterRows((D.widgetData && D.widgetData['{oid}'] && D.widgetData['{oid}'].rows) || [])"

    # Extract style options for Chart.js
    def extract_chart_opts():
        """Extract Sisense style properties for Chart.js."""
        legend = widget_style.get("legend", {})
        x_axis = widget_style.get("xAxis", {})
        y_axis = widget_style.get("yAxis", {})
        opts = {
            "legendEnabled": legend.get("enabled", True),
            "legendPosition": legend.get("position", "top"),
            "xAxisEnabled": x_axis.get("enabled", True),
            "xGridLines": x_axis.get("gridLines", False),
            "yAxisEnabled": y_axis.get("enabled", True),
            "yGridLines": y_axis.get("gridLines", False),
            "lineWidth": widget_style.get("lineWidth", {}).get("width", "medium"),
            "markersEnabled": widget_style.get("markers", {}).get("enabled", False),
            "markersSize": widget_style.get("markers", {}).get("size", "small"),
        }
        return json.dumps(opts)

    # Extract widget color palette from script if present
    widget_color_override = ""
    if widget_script:
        m = re.search(r"colorPalette\s*=\s*(\[[^\]]+\])", widget_script)
        if m:
            try:
                colors = json.loads(m.group(1).replace("'", '"'))
                color_js = json.dumps(colors)
                widget_color_override = f"const C_w = {color_js}; const C = C_w;"
            except:
                pass

    if chart_type == "indicator":
        val_expr = f"rows.length > 0 && rows[0]['{val_col}'] != null ? fmt(rows[0]['{val_col}']) : '—'" if val_col else "'—'"
        tooltip_attr = f' title="{_esc(widget_desc)}"' if widget_desc else ""
        return (
            f"(function() {{\n"
            f"  const rows = {data_ref};\n"
            f"  const val = {val_expr};\n"
            f"  html += kpi({json.dumps(title)}, val, C[{hash(oid) % 8}]);\n"
            f"  const kpiElem = document.createElement('div');\n"
            f"  kpiElem.setAttribute('data-widget-oid', '{oid}');\n"
            f"  kpiElem.setAttribute('data-widget-type', 'indicator');\n"
            f"}})();\n"
        )

    elif chart_type in ("bar", "column", "line", "doughnut"):
        is_horizontal = chart_type == "bar"
        opts_js = extract_chart_opts()
        build_fn = {
            "line": f"buildLineChart('{canvas_id}', rows, '{dim_col}', '{val_col}'" + (f", '{break_by}'" if break_by else ", null") + f", {opts_js})",
            "bar": f"buildBarChart('{canvas_id}', rows, '{dim_col}', '{val_col}'" + (f", '{break_by}'" if break_by else ", null") + f", true, {opts_js})",
            "column": f"buildBarChart('{canvas_id}', rows, '{dim_col}', '{val_col}'" + (f", '{break_by}'" if break_by else ", null") + f", false, {opts_js})",
            "doughnut": f"buildDonutChart('{canvas_id}', rows, '{dim_col}', '{val_col}', {opts_js})",
        }.get(chart_type, "")

        if not dim_col or not val_col or not build_fn:
            return f"html += `<div class='placeholder-card'>📊 {title} — no data fields resolved</div>`;\n"

        tooltip_attr = f', "{_esc(widget_desc)}"' if widget_desc else ""

        # Add drill-down link if configured
        drill_config = wq.get("drill_config", {})
        drill_ids = drill_config.get("dashboardIds", [])
        drill_link = ""
        if drill_ids:
            drill_count = len(drill_ids)
            drill_link = f"html += '<a class=\"drill-link\" title=\"Drill to {drill_count} dashboard(s)\">↗ Drill</a>';\n  "

        return (
            f"(function() {{\n"
            f"  {widget_color_override}\n"
            f"  const rows = {data_ref};\n"
            f"  html += card({json.dumps(title)}, `<div class='chart-wrap'><canvas id='{canvas_id}' data-widget-oid='{oid}' data-widget-type='{chart_type}'></canvas></div>`{tooltip_attr});\n"
            f"  {drill_link}"
            f"  setTimeout(() => {{ {build_fn}; }}, 50);\n"
            f"}})();\n"
        )

    elif chart_type == "table":
        cols = wq.get("columns", [])
        heads_js = json.dumps(cols)
        tooltip_attr = f', "{_esc(widget_desc)}"' if widget_desc else ""
        return (
            f"(function() {{\n"
            f"  const rows = {data_ref};\n"
            f"  const heads = {heads_js};\n"
            f"  const trows = rows.slice(0,200).map(r => heads.map(h => r[h] != null ? String(r[h]) : '—'));\n"
            f"  html += card({json.dumps(title)}, tbl(heads, trows){tooltip_attr});\n"
            f"  const tableElem = document.createElement('div');\n"
            f"  tableElem.setAttribute('data-widget-oid', '{oid}');\n"
            f"  tableElem.setAttribute('data-widget-type', 'table');\n"
            f"}})();\n"
        )

    elif chart_type == "pivot":
        cols = wq.get("columns", [])
        heads_js = json.dumps(cols)
        page_size = widget_style.get("pageSize", 25)
        tooltip_attr = f', "{_esc(widget_desc)}"' if widget_desc else ""
        return (
            f"(function() {{\n"
            f"  const rows = {data_ref};\n"
            f"  const heads = {heads_js} || Object.keys(rows[0] || {{}});\n"
            f"  const trows = rows.slice(0,{page_size}).map(r => heads.map(h => r[h] != null ? String(r[h]) : '—'));\n"
            f"  html += card({json.dumps(title)}, tbl(heads, trows){tooltip_attr});\n"
            f"  const pivotElem = document.createElement('div');\n"
            f"  pivotElem.setAttribute('data-widget-oid', '{oid}');\n"
            f"  pivotElem.setAttribute('data-widget-type', 'pivot2');\n"
            f"}})();\n"
        )

    elif chart_type == "richtext" or "richtexteditor" in chart_type.lower():
        html_content = wq.get("html_content", "")
        bg_color = wq.get("bg_color", "#f0f0f0")
        text_align = wq.get("text_align", "left")
        safe_html = html_content.replace("\\", "\\\\").replace("`", "\\`").replace("$", "\\$")

        return (
            f"(function() {{\n"
            f"  const contentDiv = document.createElement('div');\n"
            f"  contentDiv.setAttribute('data-widget-oid', '{oid}');\n"
            f"  contentDiv.setAttribute('data-widget-type', 'richtext');\n"
            f"  contentDiv.className = 'richtext-widget';\n"
            f"  contentDiv.style.backgroundColor = '{bg_color}';\n"
            f"  contentDiv.style.textAlign = '{text_align}';\n"
            f"  contentDiv.style.padding = '20px';\n"
            f"  contentDiv.style.borderRadius = '8px';\n"
            f"  contentDiv.style.margin = '10px 0';\n"
            f"  contentDiv.innerHTML = `{safe_html}`;\n"
            f"  const wrapper = document.createElement('div');\n"
            f"  wrapper.className = 'card';\n"
            f"  wrapper.appendChild(contentDiv);\n"
            f"  html += wrapper.outerHTML;\n"
            f"}})();\n"
        )

    elif "blox" in chart_type.lower() or chart_type == "BloX":
        # Text block widget
        content = wq.get("text_content", wq.get("content", ""))
        style_text = wq.get("text_style", {})
        font_size = style_text.get("fontSize", "14px")
        font_family = style_text.get("fontFamily", "system-ui")
        text_color = style_text.get("color", "#e5e7eb")
        bg_color = wq.get("bg_color", "transparent")
        padding = wq.get("padding", "16px")

        safe_content = _esc(content)
        return (
            f"(function() {{\n"
            f"  const blocker = document.createElement('div');\n"
            f"  blocker.setAttribute('data-widget-oid', '{oid}');\n"
            f"  blocker.setAttribute('data-widget-type', 'text');\n"
            f"  blocker.style.padding = '{padding}';\n"
            f"  blocker.style.backgroundColor = '{bg_color}';\n"
            f"  blocker.style.borderRadius = '8px';\n"
            f"  blocker.style.fontSize = '{font_size}';\n"
            f"  blocker.style.fontFamily = '{font_family}';\n"
            f"  blocker.style.color = '{text_color}';\n"
            f"  blocker.textContent = `{safe_content}`;\n"
            f"  const wrapper = document.createElement('div');\n"
            f"  wrapper.className = 'card';\n"
            f"  wrapper.appendChild(blocker);\n"
            f"  html += wrapper.outerHTML;\n"
            f"}})();\n"
        )


    elif chart_type == "map":
        return f"html += `<div class='placeholder-card'>🗺️ {title} — map widget (not rendered)</div>`;\n"

    return f"html += `<div class='placeholder-card'>📊 {title}</div>`;\n"


def generate_html_template(parsed: Dict, widget_queries: List[Dict]) -> str:
    title = parsed["title"]
    tabs = parsed["tabs"]

    # Build oid → wq map
    wq_map = {wq["oid"]: wq for wq in widget_queries if wq}

    # Extract theme variables from dashboard script
    theme_vars = extract_theme_vars(parsed.get("dashboard_script", ""))
    theme_css_vars = "\n".join([f"--{k.lower().replace('_', '-')}:{v};" for k, v in theme_vars.items() if k.startswith("DASH")])

    # Extract and render global filters with interactive toggle
    global_filters = parsed.get("global_filters", [])
    filter_html = ""
    if global_filters:
        filter_count = len(global_filters)
        filter_groups = []
        for f in global_filters:
            gf_col = f.get("col", "")
            members = f.get("members", [])
            if members:
                # Interactive: one pill per pinned member, click toggles it in/out
                # of the active set (see applyActiveFilters() JS below). Only
                # affects widgets whose loaded rows actually carry this column
                # (i.e. it's also their dim or break-by) — SQL already scoped
                # every widget to these members at render time (see jaql_to_sql's
                # global-filter auto-apply), so there is no "excluded" data to
                # reveal for widgets that don't carry the column; toggling there
                # is a client-side no-op by design, not a bug.
                pills = "".join(
                    f'<button type="button" class="filter-pill active" '
                    f'data-col="{_esc(gf_col)}" data-value="{_esc(str(m))}" '
                    f'onclick="toggleFilterPill(this)">{_esc(str(m))}</button>'
                    for m in members
                )
                filter_groups.append(
                    f'<span class="filter-group" title="{_esc(f.get("description", f["title"]))}">'
                    f'<span class="filter-group-label">{_esc(f["title"])}:</span>{pills}</span>'
                )
            else:
                filter_groups.append(
                    f'<span class="filter-chip" title="{_esc(f.get("description", f["title"]))}">{_esc(f["title"])}</span>'
                )
        filter_chips = "".join(filter_groups)
        filter_html = f'''<div class="filter-bar" id="filter-bar">
  <button class="filter-toggle" id="filter-toggle" onclick="toggleFilters()" style="border:none;background:transparent;cursor:pointer;font-size:12px;color:var(--dash-muted);padding:0;display:inline-flex;align-items:center;gap:4px">
    <span id="filter-icon">▼</span>
    <span>Filters ({filter_count})</span>
  </button>
  <div id="filter-chips" class="filter-chips" style="display:flex;gap:8px;flex-wrap:wrap;flex:1">
    {filter_chips}
  </div>
</div>'''

    # Generate tab render functions
    tab_fns = []
    kpi_cols = ["C[0]", "C[1]", "C[2]", "C[3]", "C[4]", "C[5]", "C[6]", "C[7]"]

    for i, tab in enumerate(tabs):
        fn_name = f"renderTab_{i}"
        body_lines = [f"function {fn_name}() {{", "  let html = '';"]

        # Collect indicators and non-indicators
        indicators = [w for w in tab["widgets"] if wq_map.get(get_widget_id(w), {}).get("chart_type") == "indicator"]
        charts = [w for w in tab["widgets"] if get_widget_id(w) in wq_map and wq_map[get_widget_id(w)].get("chart_type") != "indicator"]

        # KPI row
        if indicators:
            grid_cls = "grid-4" if len(indicators) >= 4 else f"grid-{min(len(indicators), 3)}"
            body_lines.append(f"  html += '<div class=\"{grid_cls}\">';")
            for w in indicators:
                oid = get_widget_id(w)
                wq = wq_map.get(oid)
                if wq:
                    body_lines.append("  " + widget_render_js(wq).replace("\n", "\n  "))
            body_lines.append("  html += '</div>';")

        # Charts
        for w in charts:
            oid = get_widget_id(w)
            wq = wq_map.get(oid)
            if wq:
                body_lines.append("  " + widget_render_js(wq).replace("\n", "\n  "))
            else:
                widget_title = w.get("title", "Widget").replace("'", "\\'")
                body_lines.append(f"  html += '<div class=\"placeholder-card\">📊 {widget_title} — no SQL generated</div>';")

        body_lines.append("  return html;")
        body_lines.append("}")
        tab_fns.append("\n".join(body_lines))

    # Tab switching
    tab_defs_js = ", ".join(
        f'{{id:"tab_{i}", label:{json.dumps(t["title"])}, render:renderTab_{i}}}'
        for i, t in enumerate(tabs)
    )

    switch_js = f"""
const _TABS = [{tab_defs_js}];

function renderTabs() {{
  const tabBar = document.getElementById('tab-bar');
  tabBar.innerHTML = _TABS.map((t, i) =>
    `<button class="tab-btn ${{i===0?'active':''}}" onclick="switchTab('{{}}',${{i}})">${{t.label}}</button>`
      .replace('{{}}', t.id)
  ).join('');

  const app = document.getElementById('app');
  _TABS.forEach((t, i) => {{
    const pane = document.createElement('div');
    pane.id = t.id;
    pane.className = 'tab-pane' + (i === 0 ? ' active' : '');
    app.appendChild(pane);
  }});

  if (D.meta) {{
    document.getElementById('header-subtitle').textContent =
      `Data as of ${{D.meta.asOf}} • ${{D.meta.db}} • ${{D.meta.dateRange||''}}`;
    document.getElementById('run-badge').textContent = D.meta.dateRange || '—';
  }}

  switchTabById('tab_0');
}}

function switchTab(tabId, idx) {{
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById(tabId);
  if (pane) {{
    const tab = _TABS[idx];
    pane.innerHTML = tab.render();
    pane.classList.add('active');
  }}
  event.target.classList.add('active');
}}

function switchTabById(tabId) {{
  const idx = _TABS.findIndex(t => t.id === tabId);
  if (idx < 0) return;
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById(tabId);
  if (pane) {{
    pane.innerHTML = _TABS[idx].render();
    pane.classList.add('active');
  }}
  const btn = document.querySelectorAll('.tab-btn')[idx];
  if (btn) btn.classList.add('active');
}}

function toggleFilters() {{
  const chips = document.getElementById('filter-chips');
  const toggle = document.getElementById('filter-toggle');
  const icon = document.getElementById('filter-icon');
  if (!chips) return;
  const isHidden = chips.style.display === 'none';
  chips.style.display = isHidden ? 'flex' : 'none';
  icon.textContent = isHidden ? '▼' : '▶';
  toggle.style.opacity = isHidden ? '1' : '0.8';
}}

renderTabs();
"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>{title}</title>
<style>
:root{{{theme_css_vars}}}
{SHARED_CSS}
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
<div id="tip"></div>
<div id="preview-banner">Preview mode — no data loaded. Run render.js to see real data.</div>

<div id="app">
  <div class="header">
    <div>
      <h1>{title}</h1>
      <p id="header-subtitle">Loading…</p>
    </div>
    <span class="run-badge" id="run-badge">—</span>
  </div>
  {filter_html}
  <div class="tab-bar" id="tab-bar"></div>
</div>

<script id="dash-data" type="application/json">{{{{DATA_JSON}}}}</script>

<script>
const _raw = (document.getElementById('dash-data')||{{}}).textContent||'';
const _isPreview = !_raw.trim() || _raw.trim() === '{{{{DATA_JSON}}}}';
const D = _isPreview ? {{ meta: {{ db:'preview', workspace:'0', title:{json.dumps(title)}, asOf:'—', dateRange:'' }}, tabs:[], widgetData:{{}} }} : JSON.parse(_raw);
if (_isPreview) document.getElementById('preview-banner').style.display = 'block';
</script>

<script>
{SHARED_HELPERS_JS}
</script>

<script>
{chr(10).join(tab_fns)}
</script>

<script>
{switch_js}
</script>
</body>
</html>
"""
    return html


# ============================================================================
# SECTION 5: MAIN CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Convert Sisense .dash to render.js + HTML template")
    parser.add_argument("dash_file", help="Path to .dash file")
    parser.add_argument("--out", default="./dash-output", help="Output directory")
    parser.add_argument("--db", default="", help="Override TD database name (default: auto-detect from .dash)")
    parser.add_argument("--validate-sql", action="store_true",
                         help="Dry-run each generated query against TD (EXPLAIN) before writing outputs, "
                              "surfacing table/column/join errors in widget_audit.json instead of only at "
                              "render time. Requires `tdx` on PATH and TD connectivity; adds one call per "
                              "unique table.")
    args = parser.parse_args()

    # Load .dash
    with open(args.dash_file, "r", encoding="utf-8") as f:
        dash = json.load(f)

    # Parse
    parsed = parse_dash(dash)
    db = args.db or parsed["db_hint"] or "__DB__"

    print(f"Dashboard: {parsed['title']}")
    print(f"Tabs: {len(parsed['tabs'])}")
    total_widgets = sum(len(t['widgets']) for t in parsed['tabs'])
    print(f"Total widgets: {total_widgets}")
    print(f"DB hint: {parsed['db_hint'] or '(none — use --db or set __DB__ in render.js)'}")

    # Convert JAQL → SQL for all widgets
    widget_queries = []
    skipped = 0
    for tab in parsed["tabs"]:
        for widget in tab["widgets"]:
            wtype = widget.get("type", "")

            # Handle BloX (text blocks) specially
            if wtype == "BloX" or "blox" in wtype.lower():
                content = widget.get("content", {})
                text_content = content.get("text", widget.get("title", ""))
                style_text = widget.get("style", {}).get("text", {})
                bg_color = widget.get("style", {}).get("backgroundColor", "transparent")
                padding = widget.get("style", {}).get("padding", "16px")

                wq = {
                    "chart_type": "text",
                    "oid": get_widget_id(widget),
                    "title": widget.get("title", "Text Block"),
                    "wtype": wtype,
                    "text_content": text_content,
                    "bg_color": bg_color,
                    "padding": padding,
                    "text_style": style_text,
                    "sql": None,
                    "table": None,
                }
                widget_queries.append(wq)

            # Handle richtexteditor specially
            elif "richtexteditor" in wtype.lower():
                style = widget.get("style", {})
                content = style.get("content", {})
                html_content = content.get("html", "")
                bg_color = content.get("bgColor", "#f0f0f0")
                text_align = content.get("textAlign", "left")
                v_align = content.get("vAlign", "valign-middle")

                wq = {
                    "chart_type": "richtext",
                    "oid": get_widget_id(widget),
                    "title": widget.get("title", "Text Widget"),
                    "wtype": wtype,
                    "html_content": html_content,
                    "bg_color": bg_color,
                    "text_align": text_align,
                    "v_align": v_align,
                    "sql": None,
                    "table": None,
                }
                widget_queries.append(wq)

            # Handle pivot2 specially
            elif "pivot" in wtype:
                wq = jaql_to_sql(widget, db=db,
                                  global_filters=parsed.get("global_filters", []),
                                  widget_filter_modes=parsed.get("widget_filter_modes", {}))
                if wq:
                    wq["chart_type"] = "pivot"
                widget_queries.append(wq)

            # Handle normal widgets
            else:
                wq = jaql_to_sql(widget, db=db,
                                  global_filters=parsed.get("global_filters", []),
                                  widget_filter_modes=parsed.get("widget_filter_modes", {}))
                widget_queries.append(wq)
                if not wq:
                    skipped += 1

    resolved = len([q for q in widget_queries if q and q.get("sql")])
    print(f"Widgets resolved to SQL: {resolved}/{total_widgets} ({total_widgets - resolved} skipped/special)")

    # Deduplicate queries by table (skip widgets without SQL)
    valid_queries = [q for q in widget_queries if q and q.get("sql")]
    table_groups = deduplicate_queries(valid_queries)
    print(f"Unique tables → {len(table_groups)} queries: {', '.join(table_groups.keys())}")

    # Generate outputs
    os.makedirs(args.out, exist_ok=True)

    render_js = generate_render_js(parsed, table_groups, valid_queries, parsed["db_hint"])
    html_template = generate_html_template(parsed, widget_queries)

    render_path = os.path.join(args.out, "render.js")
    html_path = os.path.join(args.out, "template.html")

    with open(render_path, "w", encoding="utf-8") as f:
        f.write(render_js)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_template)

    # Widget-by-widget audit — this is the artifact the skill should present to
    # the user as the before/after validation summary for a replication engagement
    # (source table, calc logic, filter scope, deviations/notes per widget), rather
    # than jumping straight from converter output to a rendered HTML dashboard.
    audit = {
        "title": parsed["title"],
        "db": db,
        "global_filters": parsed.get("global_filters", []),
        "widgets": [],
    }
    # Pre-render SQL sanity check (opt-in via --validate-sql): dry-run each
    # unique table's query against TD once, then attach any TD-reported error
    # to every widget sharing that table's SQL. Caching by SQL string avoids
    # re-validating the same query once per widget when widgets share a table.
    sql_validation_cache: Dict[str, Optional[str]] = {}
    if args.validate_sql:
        print("Validating generated SQL against TD (EXPLAIN, dry-run only)...")
        for table, group in table_groups.items():
            sql = group["sql"]
            if sql not in sql_validation_cache:
                sql_validation_cache[sql] = validate_sql_with_td(sql, db)

    for wq in widget_queries:
        if not wq:
            continue
        sql_error = sql_validation_cache.get(wq.get("sql")) if args.validate_sql else None
        widget_warnings = list(wq.get("warnings", []))
        if sql_error:
            widget_warnings.append(f"TD rejected this query (EXPLAIN dry-run): {sql_error}")
        audit["widgets"].append({
            "title": wq.get("title"),
            "oid": wq.get("oid"),
            "wtype": wq.get("wtype"),
            "chart_type": wq.get("chart_type"),
            "table": wq.get("table"),
            "sql": wq.get("sql"),
            "measure_cols": wq.get("measure_cols"),
            "dim_col": wq.get("dim_col"),
            "applies_global_filters": wq.get("applies_global_filters"),
            "warnings": widget_warnings,
        })

    audit_path = os.path.join(args.out, "widget_audit.json")
    with open(audit_path, "w", encoding="utf-8") as f:
        json.dump(audit, f, indent=2, default=str)

    all_warnings = [(w["title"], warn) for w in audit["widgets"] for warn in w["warnings"]]

    print(f"\n✓ render.js       → {render_path}")
    print(f"✓ template.html   → {html_path}")
    print(f"✓ widget_audit.json → {audit_path}  (widget-by-widget source/calc/filter summary for user validation)")

    if all_warnings:
        print(f"\n⚠ {len(all_warnings)} warning(s) need human review before this is presented as final:")
        for wtitle, warn in all_warnings:
            print(f"  - [{wtitle}] {warn}")
    else:
        print(f"\n✓ No auto-detected conversion warnings (still confirm metrics/filters manually — this is not a guarantee of correctness).")

    print(f"\nNext steps:")
    print(f"  1. Set DB name: sed -i 's/__DB__/your_db_name/g' {render_path}")
    print(f"  2. Review widget_audit.json with the user (source table, filters, warnings) BEFORE rendering — this is the mandatory before/after validation gate, not an optional nicety.")
    print(f"  3. Run: node {render_path}")
    print(f"  4. Open: ./dash-output/<workspace>/dashboard.html")
    print(f"  5. Re-review widget_audit.json + rendered output against the original .dash with the user; do not aim for pixel-exact match — confirm metrics and look/feel, flag deviations for their judgment.")


if __name__ == "__main__":
    main()
