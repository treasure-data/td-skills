SELECT 
  ${td.each.unixtime_col} AS time,
  TD_TIME_STRING(${td.each.unixtime_col}, 's!') AS date_time,
  TD_TIME_STRING(${td.each.unixtime_col}, 'd!') AS event_date,
  ${unique_user_id},
  '${td.each.src_table}' AS src_table,
  ${td.each.event_type} AS event_type,
  TRIM(lower(${td.each.url_col})) AS url,
  TRY(url_extract_path(${td.each.url_col})) AS path,
  ${td.each.referral_col} AS referral_page,
  ---Check if utm_medium returns empty string, or just numbers or NULL and if so COALESCE to try to extract utm_medium from referrer_col
  COALESCE(TRY(REGEXP_EXTRACT(REGEXP_EXTRACT(${td.each.referral_col}, '^(?:https?:)?(?:\/\/)?([^\/\?]+)'), '[^://]*$')), ${td.each.referral_col})  as referral_domain,
  REGEXP_EXTRACT(COALESCE(IF(REGEXP_LIKE(TRIM(${td.each.medium_col}), '^\d*$|^\s*$'), NULL, TRIM(${td.each.medium_col})), REGEXP_EXTRACT(${td.each.referral_col}, '(?<=\?utm_medium=)[\.a-z0-9%_\s-]*|(?<=\&utm_medium=)[\.a-z0-9%_\s-]*|(?<=\;utm_medium=)[\.a-z0-9%_\s-]*')),'[^%&#+]*') AS channel,
  ${td.each.source_col} AS source,
  ${td.each.campaign_col} AS campaign,
  ${td.each.utm_mailing_col} AS utm_mailing,
  ${td.each.context_col} AS context_col,
  ${td.each.conversion_flag} AS conversion_flag,
  ${td.each.item_price} AS item_price
  FROM ${td.each.src_table}
  ${td.each.final_where_clause}



