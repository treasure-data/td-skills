#!/usr/bin/env python3
"""
Sisense .dash → widget spec extractor.

Reads a .dash export and writes widget_audit.json: per widget, the title,
type, chart type, source table, Trino SQL converted from JAQL, measures,
dimension, global-filter scope and conversion warnings. The dashboard itself
is rebuilt from the skill's dashboard_template/.

Usage:
    python3 dash_to_html.py input.dash --out ./output/
    python3 dash_to_html.py input.dash --out ./output/ --db mydb

Output files:
    ./output/widget_audit.json
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
    it) instead of failing later when the dashboard queries run.

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
# SECTION 5: MAIN CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Extract a widget spec (widget_audit.json) from a Sisense .dash export")
    parser.add_argument("dash_file", help="Path to .dash file")
    parser.add_argument("--out", default="./dash-output", help="Output directory")
    parser.add_argument("--db", default="", help="Override TD database name (default: auto-detect from .dash)")
    parser.add_argument("--validate-sql", action="store_true",
                         help="Dry-run each generated query against TD (EXPLAIN) before writing outputs, "
                              "surfacing table/column/join errors in widget_audit.json. Requires `tdx` on PATH and TD connectivity; adds one call per "
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
    print(f"DB hint: {parsed['db_hint'] or '(none — use --db)'}")

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

    os.makedirs(args.out, exist_ok=True)

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

    print(f"\n✓ widget_audit.json → {audit_path}  (widget-by-widget source/calc/filter summary for user validation)")

    if all_warnings:
        print(f"\n⚠ {len(all_warnings)} warning(s) need human review before this is presented as final:")
        for wtitle, warn in all_warnings:
            print(f"  - [{wtitle}] {warn}")
    else:
        print(f"\n✓ No auto-detected conversion warnings (still confirm metrics/filters manually — this is not a guarantee of correctness).")

    print(f"\nNext step: review widget_audit.json with the user (source table, filters, warnings) and turn it into the dashboard spec.")

if __name__ == "__main__":
    main()
