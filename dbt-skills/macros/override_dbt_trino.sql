-- Import from dbt-trino v1.7.1
-- https://github.com/starburstdata/dbt-trino/blob/v1.7.1/dbt/include/trino/macros/catalog.sql
-- To remove unnecessary parts that cause errors with TD Presto
-- https://github.com/starburstdata/dbt-trino/blob/1.4.latest/dbt/include/trino/macros/catalog.sql#L40-L59
-- https://github.com/starburstdata/dbt-trino/issues/298

{% macro trino__get_catalog(information_schema, schemas) -%}

    {% set query %}
        with tables as (
            {{ trino__get_catalog_tables_sql(information_schema) }}
            {{ trino__get_catalog_schemas_where_clause_sql(schemas) }}
        ),
        columns as (
            {{ trino__get_catalog_columns_sql(information_schema) }}
            {{ trino__get_catalog_schemas_where_clause_sql(schemas) }}
        )
        {{ trino__get_catalog_results_sql() }}
    {%- endset -%}

    {{ return(run_query(query)) }}

{%- endmacro %}


{% macro trino__get_catalog_relations(information_schema, relations) -%}

    {% set query %}
        with tables as (
            {{ trino__get_catalog_tables_sql(information_schema) }}
            {{ trino__get_catalog_relations_where_clause_sql(relations) }}
        ),
        columns as (
            {{ trino__get_catalog_columns_sql(information_schema) }}
            {{ trino__get_catalog_relations_where_clause_sql(relations) }}
        )
        {{ trino__get_catalog_results_sql() }}
    {%- endset -%}

    {{ return(run_query(query)) }}

{%- endmacro %}


{% macro trino__get_catalog_tables_sql(information_schema) -%}
    select
        table_catalog as "table_database",
        table_schema as "table_schema",
        table_name as "table_name",
        table_type as "table_type",
        null as "table_owner"
    from {{ information_schema }}.tables
{%- endmacro %}


{% macro trino__get_catalog_columns_sql(information_schema) -%}
    select
        table_catalog as "table_database",
        table_schema as "table_schema",
        table_name as "table_name",
        column_name as "column_name",
        ordinal_position as "column_index",
        data_type as "column_type",
        comment as "column_comment"
    from {{ information_schema }}.columns
{%- endmacro %}


{% macro trino__get_catalog_results_sql() -%}
        select
            table_database,
            table_schema,
            table_name,
            table_type,
            table_owner,
            column_name,
            column_index,
            column_type,
            column_comment
        from tables
        join columns using ("table_database", "table_schema", "table_name")
        order by "column_index"
{%- endmacro %}


{% macro trino__get_catalog_schemas_where_clause_sql(schemas) -%}
    where
        table_schema != 'information_schema'
        and
        table_schema in ('{{ schemas | join("','") | lower }}')
{%- endmacro %}


{% macro trino__get_catalog_relations_where_clause_sql(relations) -%}
    where
        table_schema != 'information_schema'
        and
        (
            {%- for relation in relations -%}
                {% if relation.schema and relation.identifier %}
                    (
                        table_schema = '{{ relation.schema | lower }}'
                        and table_name = '{{ relation.identifier | lower }}'
                    )
                {% elif relation.schema %}
                    (
                        table_schema = '{{ relation.schema | lower }}'
                    )
                {% else %}
                    {% do exceptions.raise_compiler_error(
                        '`get_catalog_relations` requires a list of relations, each with a schema'
                    ) %}
                {% endif %}

                {%- if not loop.last %} or {% endif -%}
            {%- endfor -%}
        )
{%- endmacro %}


-- - get_catalog
-- - list_relations_without_caching
-- - get_columns_in_relation

-- Import from dbt-trino v1.1
-- https://github.com/starburstdata/dbt-trino/blob/1.1.latest/dbt/include/trino/macros/adapters.sql
-- To remove unnecessary parts that cause errors with TD Presto
-- https://github.com/starburstdata/dbt-trino/blob/1.4.latest/dbt/include/trino/macros/adapters.sql#L29-L48
-- https://github.com/starburstdata/dbt-trino/issues/298
{% macro trino__list_relations_without_caching(relation) %}
  {% call statement('list_relations_without_caching', fetch_result=True) -%}
    select
      table_catalog as database,
      table_name as name,
      table_schema as schema,
      case when table_type = 'BASE TABLE' then 'table'
           when table_type = 'VIEW' then 'view'
           else table_type
      end as table_type
    from {{ relation.information_schema() }}.tables
    where table_schema = '{{ relation.schema | lower }}'
  {% endcall %}
  {{ return(load_result('list_relations_without_caching').table) }}
{% endmacro %}

-- Override dbt-trino "trino__create_view_as" macro with "create table if not exists"
-- https://github.com/starburstdata/dbt-trino/blob/1.4.latest/dbt/include/trino/macros/adapters.sql#L102-L115
-- To void unsupported "create view" action with TD Presto
-- Database Error in model dbt_results (models/dbt_results.sql)
--    TrinoUserError(type=USER_ERROR, name=NOT_SUPPORTED, message="This connector does not support creating views")
{% macro trino__create_view_as(relation, sql) -%}
  {%- set view_security = config.get('view_security', 'definer') -%}
  {%- if view_security not in ['definer', 'invoker'] -%}
      {%- set log_message = 'Invalid value for view_security (%s) specified. Setting default value (%s).' % (view_security, 'definer') -%}
      {% do log(log_message) %}
      {%- set on_table_exists = 'definer' -%}
  {% endif %}
  create table if not exists
    {{ relation }}
  as
    {{ sql }}
  ;
{% endmacro %}
