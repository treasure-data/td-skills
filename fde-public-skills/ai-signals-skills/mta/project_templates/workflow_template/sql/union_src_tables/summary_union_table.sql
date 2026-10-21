WITH base_stats AS (
    SELECT
        src_table,
        APPROX_DISTINCT(${unique_user_id}) AS total_profiles,
        COUNT(*) AS total_events,
        SUM(conversion_flag) AS conversion_events,
        MIN(event_date) AS min_date,
        MAX(event_date) AS max_date
    FROM ${src_union_table}_temp
    GROUP BY src_table
),

-- Top 15 event_type per src_table
event_hist AS (
    SELECT
        src_table,
        json_format(CAST(map_agg(event_type, cnt) AS JSON)) AS events_list
    FROM (
        SELECT
            src_table,
            event_type,
            cnt,
            row_number() OVER (PARTITION BY src_table ORDER BY cnt DESC) AS rn
        FROM (
            SELECT
                src_table,
                event_type,
                COUNT(*) AS cnt
            FROM ${src_union_table}_temp
            GROUP BY src_table, event_type
        )
    )
    WHERE rn <= ${summary_table_top_k}
    GROUP BY src_table
),

-- Top 15 channel per src_table
channel_hist AS (
    SELECT
        src_table,
        json_format(CAST(map_agg(channel, cnt) AS JSON)) AS channel_list
    FROM (
        SELECT
            src_table,
            channel,
            cnt,
            row_number() OVER (PARTITION BY src_table ORDER BY cnt DESC) AS rn
        FROM (
            SELECT
                src_table,
                channel,
                COUNT(*) AS cnt
            FROM ${src_union_table}_temp
            GROUP BY src_table, channel
        )
    )
    WHERE rn <= ${summary_table_top_k}
    GROUP BY src_table
),

-- Top 15 sources per src_table
source_hist AS (
    SELECT
        src_table,
        json_format(CAST(map_agg(source, cnt) AS JSON)) AS source_list
    FROM (
        SELECT
            src_table,
            source,
            cnt,
            row_number() OVER (PARTITION BY src_table ORDER BY cnt DESC) AS rn
        FROM (
            SELECT
                src_table,
                source,
                COUNT(*) AS cnt
            FROM ${src_union_table}_temp
            GROUP BY src_table, source
        )
    )
    WHERE rn <= ${summary_table_top_k}
    GROUP BY src_table
),

-- Top 15 campaign per src_table
campaign_hist AS (
    SELECT
        src_table,
        json_format(CAST(map_agg(campaign, cnt) AS JSON)) AS campaign_list
    FROM (
        SELECT
            src_table,
            campaign,
            cnt,
            row_number() OVER (PARTITION BY src_table ORDER BY cnt DESC) AS rn
        FROM (
            SELECT
                src_table,
                campaign,
                COUNT(*) AS cnt
            FROM ${src_union_table}_temp
            GROUP BY src_table, campaign
        )
    )
    WHERE rn <= ${summary_table_top_k}
    GROUP BY src_table
),

-- Top 15 utm_mailing per src_table
mailing_hist AS (
    SELECT
        src_table,
        json_format(CAST(map_agg(utm_mailing, cnt) AS JSON)) AS utm_mailing_list
    FROM (
        SELECT
            src_table,
            utm_mailing,
            cnt,
            row_number() OVER (PARTITION BY src_table ORDER BY cnt DESC) AS rn
        FROM (
            SELECT
                src_table,
                utm_mailing,
                COUNT(*) AS cnt
            FROM ${src_union_table}_temp
            GROUP BY src_table, utm_mailing
        )
    )
    WHERE rn <= ${summary_table_top_k}
    GROUP BY src_table
),

-- Top 15 context_col per src_table
context_hist AS (
    SELECT
        src_table,
        json_format(CAST(map_agg(context_col, cnt) AS JSON)) AS context_list
    FROM (
        SELECT
            src_table,
            context_col,
            cnt,
            row_number() OVER (PARTITION BY src_table ORDER BY cnt DESC) AS rn
        FROM (
            SELECT
                src_table,
                context_col,
                COUNT(*) AS cnt
            FROM ${src_union_table}_temp
            GROUP BY src_table, context_col
        )
    )
    WHERE rn <= ${summary_table_top_k}
    GROUP BY src_table
),

BASE AS (
    SELECT
        b.src_table,
        e.events_list,
        ch.channel_list,
        so.source_list,
        ca.campaign_list,
        ma.utm_mailing_list,
        co.context_list,
        b.total_profiles,
        b.total_events,
        b.conversion_events,
        b.min_date,
        b.max_date
    FROM base_stats b
        LEFT JOIN event_hist   e  ON  b.src_table = e.src_table
        LEFT JOIN channel_hist ch ON  b.src_table = ch.src_table
        LEFT JOIN source_hist so ON  b.src_table = so.src_table
        LEFT JOIN campaign_hist ca ON  b.src_table = ca.src_table
        LEFT JOIN mailing_hist ma ON  b.src_table = ma.src_table
        LEFT JOIN context_hist co ON  b.src_table = co.src_table
)

SELECT
    BASE.*,
    T1.table_description,
    T1.medium_col,
    T1.source_col,
    T1.campaign_col,
    T1.utm_mailing_col,
    T1.context_col,
    T1.final_where_clause
FROM BASE
LEFT JOIN mta_table_params T1
    ON BASE.src_table = T1.src_table