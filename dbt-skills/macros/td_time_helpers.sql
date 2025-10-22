-- TD Time Helper Macros for dbt

-- TD_TIME_RANGE macro
-- Simplify time range filtering with optional end date
{% macro td_time_range(time_column, start_date, end_date=none, timezone='JST') -%}
  {% if end_date %}
    TD_TIME_RANGE({{ time_column }}, '{{ start_date }}', '{{ end_date }}', '{{ timezone }}')
  {% else %}
    TD_TIME_RANGE({{ time_column }}, '{{ start_date }}', '{{ timezone }}')
  {% endif %}
{%- endmacro %}

-- TD_INTERVAL macro
-- For relative time ranges
{% macro td_interval(time_column, interval, timezone='JST') -%}
  TD_INTERVAL({{ time_column }}, '{{ interval }}', '{{ timezone }}')
{%- endmacro %}

-- TD_TIME_STRING macro
-- Format timestamps consistently
{% macro td_time_string(time_column, format='d!', timezone='JST') -%}
  TD_TIME_STRING({{ time_column }}, '{{ format }}', '{{ timezone }}')
{%- endmacro %}

-- TD_TIME_FORMAT macro (for Hive compatibility)
-- Format timestamps with traditional format strings
{% macro td_time_format(time_column, format='yyyy-MM-dd', timezone='JST') -%}
  TD_TIME_FORMAT({{ time_column }}, '{{ format }}', '{{ timezone }}')
{%- endmacro %}
