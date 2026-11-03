with base_stats as (
    select
        src_table,
        approx_distinct(${unique_user_id}) as total_profiles,
        count(*) as total_events,
        sum(conversion_flag) as conversion_events,
        min(event_date) as min_date,
        max(event_date) as max_date
    from ${src_union_table}_temp
    group by src_table
),

-- Top 15 event_type per src_table
event_hist as (
    select
        src_table,
        json_format(cast(map_agg(event_type, cnt) as json)) as events_list
    from (
        select
            src_table,
            event_type,
            cnt,
            row_number() over (partition by src_table order by cnt desc) as rn
        from (
            select
                src_table,
                event_type,
                count(*) as cnt
            from ${src_union_table}_temp
            group by src_table, event_type
        )
    )
    where rn <= ${summary_table_top_k}
    group by src_table
),

-- Top 15 channel per src_table
channel_hist as (
    select
        src_table,
        json_format(cast(map_agg(channel, cnt) as json)) as channel_list
    from (
        select
            src_table,
            channel,
            cnt,
            row_number() over (partition by src_table order by cnt desc) as rn
        from (
            select
                src_table,
                channel,
                count(*) as cnt
            from ${src_union_table}_temp
            group by src_table, channel
        )
    )
    where rn <= ${summary_table_top_k}
    group by src_table
),

-- Top 15 sources per src_table
source_hist as (
    select
        src_table,
        json_format(cast(map_agg(source, cnt) as json)) as source_list
    from (
        select
            src_table,
            source,
            cnt,
            row_number() over (partition by src_table order by cnt desc) as rn
        from (
            select
                src_table,
                source,
                count(*) as cnt
            from ${src_union_table}_temp
            group by src_table, source
        )
    )
    where rn <= ${summary_table_top_k}
    group by src_table
),

-- Top 15 campaign per src_table
campaign_hist as (
    select
        src_table,
        json_format(cast(map_agg(campaign, cnt) as json)) as campaign_list
    from (
        select
            src_table,
            campaign,
            cnt,
            row_number() over (partition by src_table order by cnt desc) as rn
        from (
            select
                src_table,
                campaign,
                count(*) as cnt
            from ${src_union_table}_temp
            group by src_table, campaign
        )
    )
    where rn <= ${summary_table_top_k}
    group by src_table
),

-- Top 15 utm_mailing per src_table
mailing_hist as (
    select
        src_table,
        json_format(cast(map_agg(utm_mailing, cnt) as json)) as utm_mailing_list
    from (
        select
            src_table,
            utm_mailing,
            cnt,
            row_number() over (partition by src_table order by cnt desc) as rn
        from (
            select
                src_table,
                utm_mailing,
                count(*) as cnt
            from ${src_union_table}_temp
            group by src_table, utm_mailing
        )
    )
    where rn <= ${summary_table_top_k}
    group by src_table
),

-- Top 15 context_col per src_table
context_hist as (
    select
        src_table,
        json_format(cast(map_agg(context_col, cnt) as json)) as context_list
    from (
        select
            src_table,
            context_col,
            cnt,
            row_number() over (partition by src_table order by cnt desc) as rn
        from (
            select
                src_table,
                context_col,
                count(*) as cnt
            from ${src_union_table}_temp
            group by src_table, context_col
        )
    )
    where rn <= ${summary_table_top_k}
    group by src_table
),

base as (
    select
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
    from base_stats b
        left join event_hist   e  on  b.src_table = e.src_table
        left join channel_hist ch on  b.src_table = ch.src_table
        left join source_hist so on  b.src_table = so.src_table
        left join campaign_hist ca on  b.src_table = ca.src_table
        left join mailing_hist ma on  b.src_table = ma.src_table
        left join context_hist co on  b.src_table = co.src_table
)

select
    base.*,
    t1.table_description,
    t1.medium_col,
    t1.source_col,
    t1.campaign_col,
    t1.utm_mailing_col,
    t1.context_col,
    t1.final_where_clause
from base
left join mta_table_params t1
    on base.src_table = t1.src_table