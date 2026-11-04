/* 
PURPOSE
-------
Build a unified, sessionized touchpoint table across marketing sources (email / paid / organic / affiliates / etc.),
then normalize channel+source fields and finally "carry forward" the most recent known channel/source across a user's
journey so every touchpoint can be attributed (falling back to direct if nothing is known).

KEY IDEAS
---------
1) Sessionize events per user (session_id).
2) Normalize / infer channel & source using referral_domain, source, and existing channel rules.
3) Backfill remaining nulls by carrying the last known non-null channel/source forward through time per user/journey
   partition, producing channel_final/source_final for attribution modeling.
*/

with sesh as (
  /* 
  CTE: SESH (Sessionization / Journey grouping)
  -------------------------------------------
  - Assign a session_id to each event by "sessionizing" the event stream for each user.
  - Uses TD_SESSIONIZE_WINDOW(time, session_length) to split sessions when inactivity > session_length (e.g. 3600s).
  - Concatenates the session window token with unique_user_id to ensure session_id uniqueness across users.
  - Output: all original touchpoint rows + derived session_id.
  */
  select
    td_sessionize_window(time, ${session_length})
      over (partition by ${unique_user_id} order by time) || ${unique_user_id} as session_id,
    base.*
  from ${src_union_base_to_session_table} base
),

step2 as (
  /*
  CTE: STEP2 (Normalize / infer channel + source)
  -----------------------------------------------
  Goal: create "best effort" fields channel_new and source_new before global backfill.

  CHANNEL LOGIC (channel_new):
  - If channel is NULL/blank, infer it from referral_domain or source patterns:
      * ESP/MAP tools -> 'email'
      * search engines -> 'organic'
      * social platforms -> 'social'
      * video domains -> 'video'
      * programmatic/display vendors -> 'display'
      * known affiliate referrers -> 'affiliates'
      * otherwise default to source (as a last resort label)
  - If channel exists, apply customer-specific remaps:
      * cpc + search engine source -> 'paid_search'
      * affiliates_* -> 'affiliates'
      * any 'search' -> 'paid_search'
      * markauto/mktaut -> 'email'
      * qr or exactly mail -> 'direct_mail'
      * else keep original channel

  SOURCE LOGIC (source_new):
  - If source is NULL, extract a known vendor/domain token from referral_domain.
  - If channel/source encoded like affiliates_<partner>, extract <partner>.
  - Normalize certain known patterns (e.g., 'karma' remove spaces).
  - Else keep original source.
  */
  select
    sesh.*,

    /* channel_new: best-effort normalized channel for each touchpoint */
    case
      /* 1) If channel missing, infer from referral_domain or source */
      when channel is null or channel = '' then (
        case
      when regexp_like(lower(referral_domain), 'sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|hubspot|marketo|pardot|iterable|sailthru|customer\.io|activecampaign|campaignmonitor|getresponse|aweber')
        or regexp_like(lower(source),          'sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|hubspot|marketo|pardot|iterable|sailthru|customer\.io|activecampaign|campaignmonitor|getresponse|aweber')
        then 'email'

      /* Video — checked before social so YouTube lands here */
      when regexp_like(lower(referral_domain), 'youtube|vimeo|dailymotion|twitch|hulu|roku|pluto|peacock')
        or regexp_like(lower(source),          'youtube|vimeo|dailymotion|twitch|hulu|roku|pluto|peacock|video')
        then 'video'

      /* Social */
      when regexp_like(lower(referral_domain), 'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|reddit|quora|threads|mastodon|bluesky|wechat|weibo|whatsapp|telegram')
        or regexp_like(lower(source),          'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|reddit|quora|threads|mastodon|bluesky|wechat|weibo|whatsapp|telegram')
        then 'social'

      /* Affiliate */
      when regexp_like(lower(referral_domain), 'shareasale|cj\.com|rakuten|impact\.com|partnerize|awin|affiliate|refersion|pepperjam')
        or regexp_like(lower(source),          'shareasale|cj\.com|rakuten|impact\.com|partnerize|awin|affiliate|refersion|pepperjam')
        then 'affiliates'

      /* Display / programmatic */
      when regexp_like(lower(referral_domain), 'criteo|mediamath|thetradedesk|taboola|outbrain|stackadapt|adroll|appnexus|xandr|dv360|googlesyndication|rubiconproject|onetag')
        or regexp_like(lower(source),          'criteo|mediamath|thetradedesk|taboola|outbrain|stackadapt|adroll|appnexus|xandr|dv360|googlesyndication|rubiconproject|onetag|display|banner')
        or regexp_like(lower(campaign),        'display|discovery\s*ads|trueview|dv360|banner')
        then 'display'

      /* Organic search — checked after social/video so shared domains (e.g. google) don't steal social/video hits */
      when regexp_like(lower(referral_domain), 'google|bing|yahoo|baidu|duckduckgo|yandex|ecosia|naver|sogou|aol|perplexity|brave|ask\.com')
        or regexp_like(lower(source),          'google|bing|yahoo|baidu|duckduckgo|yandex|ecosia|naver|sogou|aol|perplexity|brave|ask\.com|gpt')
        then 'organic'


          /* last resort when channel is blank: use source label */
          else source
        end
      )

      /* ===== 2) Channel is populated: apply mta_channel_mapping_final remaps ===== */

  /* cpc on social platforms -> social */
    when channel = 'cpc'
      and (
        regexp_like(lower(source), 'facebook|instagram|snapchat|tiktok|pinterest|linkedin|reddit|twitter')
        or regexp_like(lower(campaign), 'fbig|fb_|ig_|snap_|tiktok_|pin_|li_|social|paid_social|meta_')
      )
      then 'social'

    /* cpc on search platforms -> paid_search */
    when channel = 'cpc'
      and (
        regexp_like(lower(source), 'google|bing|yahoo|search|microsoft|apple_search|amazon_search')
        or regexp_like(lower(campaign), 'gmail\s*ads|paid\s*search|search\s*ads|ppc')
      )
      then 'paid_search'

    /* cpc on display/programmatic platforms -> display */
    when channel = 'cpc'
      and (
        regexp_like(lower(source), 'criteo|taboola|outbrain|dv360|thetradedesk|stackadapt|adroll|xandr')
        or regexp_like(lower(campaign), 'display|discovery\s*ads|trueview|banner|programmatic')
      )
      then 'display'

    /* cpc on video platforms -> video */
    when channel = 'cpc'
      and (
        regexp_like(lower(source), 'youtube|vimeo|twitch|hulu|roku')
        or regexp_like(lower(campaign), 'video|pre.roll|bumper|instream')
      )
      then 'video'

    /* cpc fallback — still cpc but didn't match above -> paid_search as safest default */
    when channel = 'cpc'
      then 'paid_search'

    /* organic misclassified as referral */
    when channel = 'referral'
      and regexp_like(lower(source), 'google|bing|yahoo|baidu|duckduckgo|yandex|ecosia|perplexity')
      then 'organic'

    /* social misclassified as referral */
    when channel = 'referral'
      and regexp_like(lower(source), 'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|reddit|youtube|quora|threads')
      then 'social'

      else channel
    end as channel_new,

    /* source_new: best-effort normalized source for each touchpoint */
    case
      when source is null then
        regexp_extract(
          referral_domain,
          'affiliat|sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|getresponse|aweber|campaignmonitor|google|bing|yahoo|baidu|duckduckgo|yandex|ask.com|facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|youtube|reddit|quora|youtube|vimeo|dailymotion|twitch|video|criteo|mediamath|thetradedesk|adobe|amazon|onetag|rubiconproject|xandr'
        )
      else source
    end as source_new

  from sesh
)

/*
FINAL SELECT (Journey completion + attribution-ready fields)
------------------------------------------------------------
This last layer does three things:

A) Session touchpoint ordering:
   - sess_rank_asc / sess_rank_desc: ranks touchpoints within each session to support within-session sequencing.

B) Global "carry-forward" backfill for channel/source:
   - channel_final: for each journey partition (${backfill_partition_col}, typically user_id/canonical_id),
     carry the LAST non-null channel_new forward in time. If never seen, classify as 'direct'.
   - source_final: carry the LAST non-null source_new forward in time; if never seen, fall back to parsing a domain
     token from referral_domain or url.

C) Output:
   - Keeps both originals (channel_orig/source_orig) and final normalized/backfilled values for attribution modeling.
*/
select
  time,
  session_id,
  date_time,
  event_date,
  ${unique_user_id},
  src_table,
  event_type,
  url,
  path,
  referral_page,
  referral_domain,

  channel as channel_orig,
  channel_final,

  source as source_orig,
  source_final,

  campaign,
  utm_mailing,
  context_col,
  conversion_flag,
  item_price,
  sess_rank_asc,
  sess_rank_desc
from (
  select
    step2.*,

    /* Within-session sequencing indices (useful for pathing and session-level attribution) */
    rank() over (
      partition by step2.session_id
      order by time asc, campaign, context_col asc
    ) as sess_rank_asc,

    rank() over (
      partition by step2.session_id
      order by time desc, campaign, context_col desc
    ) as sess_rank_desc,

    /* Attribution-ready channel: carry-forward last known channel, else 'direct' */
    coalesce(
      last_value(channel_new) ignore nulls over (
        partition by ${backfill_partition_col}
        order by date_time
        rows between unbounded preceding and current row
      ),
      'direct'
    ) as channel_final,

    /* Attribution-ready source: carry-forward last known source, else infer from domain */
    coalesce(
      last_value(source_new) ignore nulls over (
        partition by ${backfill_partition_col}
        order by date_time
        rows between unbounded preceding and current row
      ),
      coalesce(
        regexp_extract(referral_domain, '(?<=\.)[^.]+(?=\.)'),
        regexp_extract(url,            '(?<=\.)[^.]+(?=\.)')
      )
    ) as source_final

  from step2
);



