insert into prob_dedupe_blocking_schema
select
  '${column_name.name}' as column_name,

  -- Enhanced cleaning: normalize and lowercase
  'trim(lower(regexp_replace(CAST(${column_name.name} as varchar), ''[^a-zA-Z0-9~_-]'', ''''))) as ${column_name.name}' as cleaning_query,

  -- All position 3-grams and 4-grams (manual specification for compatibility)
  'crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 3 THEN NULLIF(SUBSTRING(${column_name.name}, 1, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_1,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 4 THEN NULLIF(SUBSTRING(${column_name.name}, 2, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_2,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 5 THEN NULLIF(SUBSTRING(${column_name.name}, 3, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_3,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 6 THEN NULLIF(SUBSTRING(${column_name.name}, 4, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_4,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 7 THEN NULLIF(SUBSTRING(${column_name.name}, 5, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_5,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 8 THEN NULLIF(SUBSTRING(${column_name.name}, 6, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_6,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 9 THEN NULLIF(SUBSTRING(${column_name.name}, 7, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_7,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 10 THEN NULLIF(SUBSTRING(${column_name.name}, 8, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_8,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 11 THEN NULLIF(SUBSTRING(${column_name.name}, 9, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_9,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 12 THEN NULLIF(SUBSTRING(${column_name.name}, 10, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_10,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 13 THEN NULLIF(SUBSTRING(${column_name.name}, 11, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_11,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 14 THEN NULLIF(SUBSTRING(${column_name.name}, 12, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_12,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 15 THEN NULLIF(SUBSTRING(${column_name.name}, 13, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_13,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 16 THEN NULLIF(SUBSTRING(${column_name.name}, 14, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_14,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 17 THEN NULLIF(SUBSTRING(${column_name.name}, 15, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_15,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 18 THEN NULLIF(SUBSTRING(${column_name.name}, 16, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_16,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 19 THEN NULLIF(SUBSTRING(${column_name.name}, 17, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_17,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 20 THEN NULLIF(SUBSTRING(${column_name.name}, 18, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_18,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 21 THEN NULLIF(SUBSTRING(${column_name.name}, 19, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_19,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 22 THEN NULLIF(SUBSTRING(${column_name.name}, 20, 3),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_3g_20,

  -- 4-grams for better precision
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 4 THEN NULLIF(SUBSTRING(${column_name.name}, 1, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_1,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 5 THEN NULLIF(SUBSTRING(${column_name.name}, 2, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_2,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 6 THEN NULLIF(SUBSTRING(${column_name.name}, 3, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_3,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 7 THEN NULLIF(SUBSTRING(${column_name.name}, 4, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_4,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 8 THEN NULLIF(SUBSTRING(${column_name.name}, 5, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_5,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 9 THEN NULLIF(SUBSTRING(${column_name.name}, 6, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_6,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 10 THEN NULLIF(SUBSTRING(${column_name.name}, 7, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_7,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 11 THEN NULLIF(SUBSTRING(${column_name.name}, 8, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_8,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 12 THEN NULLIF(SUBSTRING(${column_name.name}, 9, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_9,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 13 THEN NULLIF(SUBSTRING(${column_name.name}, 10, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_10,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 14 THEN NULLIF(SUBSTRING(${column_name.name}, 11, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_11,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 15 THEN NULLIF(SUBSTRING(${column_name.name}, 12, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_12,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 16 THEN NULLIF(SUBSTRING(${column_name.name}, 13, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_13,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 17 THEN NULLIF(SUBSTRING(${column_name.name}, 14, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_14,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 18 THEN NULLIF(SUBSTRING(${column_name.name}, 15, 4),'''') ELSE NULL END AS varbinary))) AS ${column_name.name}_4g_15,

  -- Component-based hashes for composite strings (split on delimiter)
  crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL AND POSITION(''~'' IN ${column_name.name}) > 0
    THEN NULLIF(TRIM(SUBSTRING(${column_name.name}, 1, POSITION(''~'' IN ${column_name.name}) - 1)),'''')
    ELSE ${column_name.name} END AS varbinary))) AS ${column_name.name}_comp1,
  crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL AND POSITION(''~'' IN ${column_name.name}) > 0
    THEN NULLIF(TRIM(SUBSTRING(${column_name.name}, POSITION(''~'' IN ${column_name.name}) + 1)),'''')
    ELSE NULL END AS varbinary))) AS ${column_name.name}_comp2,

  -- Prefix variations (dedupe-style initials)
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 3 THEN SUBSTRING(${column_name.name}, 1, 3) ELSE NULL END AS varbinary))) AS ${column_name.name}_pre3,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 5 THEN SUBSTRING(${column_name.name}, 1, 5) ELSE NULL END AS varbinary))) AS ${column_name.name}_pre5,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 7 THEN SUBSTRING(${column_name.name}, 1, 7) ELSE NULL END AS varbinary))) AS ${column_name.name}_pre7,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 10 THEN SUBSTRING(${column_name.name}, 1, 10) ELSE NULL END AS varbinary))) AS ${column_name.name}_pre10,

  -- Suffix variations
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 3 THEN SUBSTRING(${column_name.name}, LENGTH(${column_name.name}) - 2) ELSE NULL END AS varbinary))) AS ${column_name.name}_suf3,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 5 THEN SUBSTRING(${column_name.name}, LENGTH(${column_name.name}) - 4) ELSE NULL END AS varbinary))) AS ${column_name.name}_suf5,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 7 THEN SUBSTRING(${column_name.name}, LENGTH(${column_name.name}) - 6) ELSE NULL END AS varbinary))) AS ${column_name.name}_suf7,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 10 THEN SUBSTRING(${column_name.name}, LENGTH(${column_name.name}) - 9) ELSE NULL END AS varbinary))) AS ${column_name.name}_suf10,

  -- Skip-grams for fuzzy matching (every other position)
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 6 THEN
    SUBSTRING(${column_name.name}, 1, 1) || SUBSTRING(${column_name.name}, 3, 1) || SUBSTRING(${column_name.name}, 5, 1)
    ELSE NULL END AS varbinary))) AS ${column_name.name}_skip3_1,
  crc32(xxhash64(CAST(CASE WHEN LENGTH(${column_name.name}) >= 8 THEN
    SUBSTRING(${column_name.name}, 2, 1) || SUBSTRING(${column_name.name}, 4, 1) || SUBSTRING(${column_name.name}, 6, 1) || SUBSTRING(${column_name.name}, 8, 1)
    ELSE NULL END AS varbinary))) AS ${column_name.name}_skip4_1'

  as predicate_query,


  '${column_name.name}' as predicate_keys,
  cast(${column_name.weight} as varchar) as col_weight


--,crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN NULLIF(SUBSTRING(${column_name.name}, -15) ELSE NULL END AS varbinary))) as ${column_name.name}_last_five
