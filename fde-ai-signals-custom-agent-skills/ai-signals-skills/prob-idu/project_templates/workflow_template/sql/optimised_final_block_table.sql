
-- @TD distribute_strategy: aggressive


-- Turns MinHash buckets into blocks: pairs sharing >= keygroups * jaccard_similarity_threshold buckets are blocked together

with
-- Step 1: Generate pairs with counts
qualified_pairs as (
  select
    l.${id_col},
    r.${id_col} as ${id_col}s,
    count(*) as cnt
  from ${blocking_table}_temp l
  inner join ${blocking_table}_temp r
    on l.clusterid = r.clusterid
  where l.${id_col} < r.${id_col}
  group by l.${id_col}, r.${id_col}
  having count(*) >= cast(round(${keygroups} * ${jaccard_similarity_threshold}) as int)
),

-- Step 2: Create user sets efficiently using Hivemall array functions
user_sets as (
  select
    ${id_col},
    sort_array(array_union(collect_list(${id_col}s), array(${id_col}))) as userid_set
  from qualified_pairs
  group by ${id_col}
),

-- Step 3: Generate unique blocks with minimal memory
-- Using Hive-compatible block key generation
blocks as (
  select
    concat('block_',
           cast(row_number() over (order by size(userid_set) desc) as string),
           '_',
           cast(unix_timestamp() as string)) as block_key,
    userid_set,
    row_number() over (order by size(userid_set) desc) as rnk
  from (
    select distinct userid_set
    from user_sets
  ) t
),

-- Step 4: Explode blocks efficiently using Hive's lateral view
block_members as (
  select
    block_key,
    member_id,
    rnk
  from blocks
  lateral view explode(userid_set) exploded_table as member_id
)

-- DIGDAG_INSERT_LINE
-- Step 5: Final output with original data
select
  bm.block_key,
  org.*,
  bm.rnk
from block_members bm
left join ${sink_database}.${input_table} org
  on bm.member_id = org.${id_col}
