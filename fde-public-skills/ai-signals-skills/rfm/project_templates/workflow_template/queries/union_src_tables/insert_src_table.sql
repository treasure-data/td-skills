WITH BASE AS (
  SELECT ${td.each.join_key} AS ${globals.canonical_id},
MAX(${td.each.unixtime_col}) as time,
TD_TIME_STRING(MAX(${td.each.unixtime_col}), 's!') as latest_tstamp,
'${td.each.event_name}' AS source,
COUNT(*) as total_touchpoints,
SUM(TRY(CAST(${td.each.order_amount} AS DOUBLE))) as total_spend,
(${session_unixtime} - MAX(${td.each.unixtime_col}))/86400 AS recency_days
FROM ${td.each.src_table}
${td.each.final_where_clause}
GROUP BY 1
)
,
-- Top 10 event_type per src_table
event_hist AS (
SELECT
    ${globals.canonical_id},
    '{' || array_join(
        array_agg(
            '"' || ${td.each.context_col} || '": ' || CAST(cnt AS VARCHAR)
            ORDER BY cnt DESC
        ),
        ', '
    ) || '}' AS events_list
    FROM (
        SELECT
            ${globals.canonical_id},
            ${td.each.context_col},
            cnt,
            row_number() OVER (PARTITION BY ${globals.canonical_id} ORDER BY cnt DESC) AS rn
        FROM (
            SELECT
                ${td.each.join_key} AS ${globals.canonical_id},
                ${td.each.context_col},
                COUNT(*) AS cnt
            FROM ${td.each.src_table}
            GROUP BY ${td.each.join_key}, ${td.each.context_col}
        )
    )
    WHERE rn <= 10
    GROUP BY ${globals.canonical_id}
 
)
SELECT BASE.*, T2.events_list
FROM BASE LEFT JOIN event_hist T2
ON BASE.${globals.canonical_id} = T2.${globals.canonical_id}
