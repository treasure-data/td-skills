select 
  ${td.each.unixtime_col} as time,
  td_time_string(${td.each.unixtime_col}, 's!') as date_time,
  td_time_string(${td.each.unixtime_col}, 'd!') as event_date,
  ${unique_user_id},
  '${td.each.src_table}' as src_table,
  ${td.each.event_type} as event_type,
  trim(lower(${td.each.url_col})) as url,
  try(url_extract_path(${td.each.url_col})) as path,
  ${td.each.referral_col} as referral_page,
  ---Check if utm_medium returns empty string, or just numbers or NULL and if so COALESCE to try to extract utm_medium from referrer_col
  coalesce(try(regexp_extract(regexp_extract(${td.each.referral_col}, '^(?:https?:)?(?:\/\/)?([^\/\?]+)'), '[^://]*$')), ${td.each.referral_col})  as referral_domain,
  regexp_extract(coalesce(if(regexp_like(trim(${td.each.medium_col}), '^\d*$|^\s*$'), null, trim(${td.each.medium_col})), regexp_extract(${td.each.referral_col}, '(?<=\?utm_medium=)[\.a-z0-9%_\s-]*|(?<=\&utm_medium=)[\.a-z0-9%_\s-]*|(?<=\;utm_medium=)[\.a-z0-9%_\s-]*')),'[^%&#+]*') as channel,
  ${td.each.source_col} as source,
  ${td.each.campaign_col} as campaign,
  ${td.each.utm_mailing_col} as utm_mailing,
  ${td.each.context_col} as context_col,
  ${td.each.conversion_flag} as conversion_flag,
  ${td.each.item_price} as item_price
  from ${td.each.src_table}
  ${td.each.final_where_clause}



