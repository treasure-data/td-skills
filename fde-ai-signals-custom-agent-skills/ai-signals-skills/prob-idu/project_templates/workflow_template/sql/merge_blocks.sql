-- Merges duplicate blocks per ID and splits blocks larger than ${max_ids_per_block}
with merged_blocks as (
    select
        block_key,
        ${id_col},
        ${td.last_results.column_list},
        rnk,
        row_number() over (
            partition by ${id_col}
            order by rnk asc  -- Choose record with lowest original rank
        ) as row_num
    from ${blocking_table}
),
deduplicated_blocks as (
    select
        block_key,
        ${id_col},
       ${td.last_results.column_list},
        rnk as original_rnk
    from merged_blocks
    where row_num = 1
),
block_sizes as (
    select
        block_key,
        count(*) as block_size
    from deduplicated_blocks
    group by block_key
),
split_large_blocks as (
    select
        d.block_key,
        d.${id_col},
       ${td.last_results.column_list},
        d.original_rnk,
        bs.block_size,
        case
            when bs.block_size <= ${max_ids_per_block} then d.block_key
            else d.block_key || '_' || cast(ceiling(row_number() over (partition by d.block_key order by d.${id_col}) / ${max_ids_per_block}) as varchar)
        end as new_block_key,
        row_number() over (partition by d.block_key order by d.${id_col}) as block_position
    from deduplicated_blocks d
    join block_sizes bs on d.block_key = bs.block_key
)
select
    new_block_key as block_key,
    ${id_col},
    ${td.last_results.column_list},
    rank() over (order by new_block_key) as rnk
from split_large_blocks
order by ${id_col}, new_block_key
