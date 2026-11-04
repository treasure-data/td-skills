insert into prob_dedupe_blocking_schema
select  '${column_name.name}' as column_name,

'REGEXP_REPLACE(trim(lower(CAST(${column_name.name} as varchar))),''[^0-9]'', '''') as ${column_name.name}' as cleaning_query,

'crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 1, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_1,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 2, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_2,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 3, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_3,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 4, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_4,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 5, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_5,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 6, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_6,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 8, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_7,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 10, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_8,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, 12, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_9,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -4, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_10,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -5, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_11,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -6, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_12,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -7, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_13,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -8, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_14,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -9, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_15,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -11, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_16,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -13, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_17,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -15, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_18,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -3, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_19,
crc32(xxhash64(CAST(CASE WHEN ${column_name.name} IS NOT NULL THEN SUBSTRING(${column_name.name}, -2, ${ngram_len}) ELSE NULL END AS varbinary))) AS ${column_name.name}_ngram_20'

as predicate_query,

'${column_name.name}' as predicate_keys,
cast(${column_name.weight} as varchar) as col_weight
