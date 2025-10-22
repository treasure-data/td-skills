-- TD Incremental Scan Macro
-- Scans a table for a specific time range and optionally filters for incremental processing
-- Default target_range is '-3M/now' (last 3 months to now)

{% macro incremental_scan(table_name) -%}
(
  SELECT * FROM {{ table_name }}
  WHERE TD_INTERVAL(time, '{{ var("target_range", "-3M/now") }}')
{% if is_incremental() -%}
    AND time > {{ get_max_time(this.table) }}
{%- endif %}
)
{%- endmacro %}

{% macro get_max_time(table_name) -%}
  (SELECT MAX(time) FROM {{ table_name }})
{%- endmacro %}
