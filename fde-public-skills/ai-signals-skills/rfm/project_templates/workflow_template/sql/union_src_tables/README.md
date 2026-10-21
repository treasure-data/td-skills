# Custom source SQL

Put `<name>.sql` here for each source in `aggregate_metrics_tables` that sets `query_type: custom` (`<name>` = that source's `name`). The file must return the same columns as `queries/union_src_tables/insert_src_table.sql`. See the Customization Points section of the template `README.md`.
