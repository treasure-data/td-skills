-- this select products NOT to be included in training 
select 
  distinct itemid
from ${prefix}transaction_unfiltered
where regexp_like(item_name, 'Backpack')