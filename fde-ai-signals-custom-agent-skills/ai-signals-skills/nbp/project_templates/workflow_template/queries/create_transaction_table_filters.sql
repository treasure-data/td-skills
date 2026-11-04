with exclude as (
  select itemid 
  from ${prefix}excluded
)
select *
from ${prefix}transaction_unfiltered
where itemid not in (
  select itemid from exclude
)