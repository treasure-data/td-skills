with base as (
  select ${td.each.join_key} as ${globals.canonical_id},
max(${td.each.unixtime_col}) as time,
td_time_string(max(${td.each.unixtime_col}), 's!') as latest_tstamp,
'${td.each.event_name}' as source,
count(*) as total_touchpoints,
sum(try(cast(${td.each.order_amount} as double))) as total_spend,
(${session_unixtime} - max(${td.each.unixtime_col}))/86400 as recency_days
from ${td.each.src_table}
${td.each.final_where_clause}
group by 1
)
,
-- Top 10 event_type per src_table
event_hist as (
select
    ${globals.canonical_id},
    '{' || array_join(
        array_agg(
            '"' || ${td.each.context_col} || '": ' || cast(cnt as varchar)
            order by cnt desc
        ),
        ', '
    ) || '}' as events_list
    from (
        select
            ${globals.canonical_id},
            ${td.each.context_col},
            cnt,
            row_number() over (partition by ${globals.canonical_id} order by cnt desc) as rn
        from (
            select
                ${td.each.join_key} as ${globals.canonical_id},
                ${td.each.context_col},
                count(*) as cnt
            from ${td.each.src_table}
            group by ${td.each.join_key}, ${td.each.context_col}
        )
    )
    where rn <= 10
    group by ${globals.canonical_id}
 
)
select base.*, t2.events_list
from base left join event_hist t2
on base.${globals.canonical_id} = t2.${globals.canonical_id}
