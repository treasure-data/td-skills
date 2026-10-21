with base as (
  select * from ${next_best_campaign.custom_flags_table}
)
select base.*,
case when cart_abandon_flag = 1 then 'Cart Abandon'
else
  (case 
  when recent_purchase_flag = 1 then 'Next Best Product'
  else  
    (case when recent_ad_engagement_flag = 1 then 'Retargetting'
    else 'Prospecting'
    end)
  end)
end as next_best_campaign
from base
