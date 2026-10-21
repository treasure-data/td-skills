WITH BASE AS (
  SELECT * FROM ${next_best_campaign.custom_flags_table}
)
SELECT BASE.*,
CASE WHEN cart_abandon_flag = 1 THEN 'Cart Abandon'
ELSE
  (CASE 
  WHEN recent_purchase_flag = 1 THEN 'Next Best Product'
  ELSE  
    (CASE WHEN recent_ad_engagement_flag = 1 THEN 'Retargetting'
    ELSE 'Prospecting'
    END)
  END)
END AS next_best_campaign
FROM BASE
