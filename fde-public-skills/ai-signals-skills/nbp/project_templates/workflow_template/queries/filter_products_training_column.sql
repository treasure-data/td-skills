-- this select products NOT to be included in training
SELECT
  DISTINCT itemid
FROM ${prefix}transaction_unfiltered
WHERE REGEXP_LIKE(${exclusion_column}, '${exclusion_values}')
