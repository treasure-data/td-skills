select array_join(array_agg(cleaning_query), concat(',',chr(10))) as cleaning_query,
 array_join(array_agg(predicate_query), concat(',',chr(10))) as blocking_query,
 --- array_join(array_agg(predicate_keys),  '_', 'NA') as predicate_keys
array_agg(predicate_keys) as predicate_keys,
 '' as excl_suffix
 from prob_dedupe_blocking_schema
