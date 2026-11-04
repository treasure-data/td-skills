with t1 as (

  select ${id_col},${td.last_results.cleaning_query} from ${sink_database}.${input_table}${td.last_results.excl_suffix}
),

t2 as (select ${id_col}, ${td.last_results.blocking_query} from t1)

select distinct b.* from ${sink_database}.${input_table} a left join t2 b on a.${id_col} = b.${id_col}
