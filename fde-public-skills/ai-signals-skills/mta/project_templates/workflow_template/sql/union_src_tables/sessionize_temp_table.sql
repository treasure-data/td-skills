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

WITH SESH AS (
  /* 
  CTE: SESH (Sessionization / Journey grouping)
  -------------------------------------------
  - Assign a session_id to each event by "sessionizing" the event stream for each user.
  - Uses TD_SESSIONIZE_WINDOW(time, session_length) to split sessions when inactivity > session_length (e.g. 3600s).
  - Concatenates the session window token with unique_user_id to ensure session_id uniqueness across users.
  - Output: all original touchpoint rows + derived session_id.
  */
  SELECT
    TD_SESSIONIZE_WINDOW(time, ${session_length})
      OVER (PARTITION BY ${unique_user_id} ORDER BY time) || ${unique_user_id} AS session_id,
    BASE.*
  FROM ${src_union_base_to_session_table} BASE
),

STEP2 AS (
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
  SELECT
    SESH.*,

    /* channel_new: best-effort normalized channel for each touchpoint */
    CASE
      /* 1) If channel missing, infer from referral_domain or source */
      WHEN channel IS NULL OR channel = '' THEN (
        CASE
      WHEN REGEXP_LIKE(LOWER(referral_domain), 'sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|hubspot|marketo|pardot|iterable|sailthru|customer\.io|activecampaign|campaignmonitor|getresponse|aweber')
        OR REGEXP_LIKE(LOWER(source),          'sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|hubspot|marketo|pardot|iterable|sailthru|customer\.io|activecampaign|campaignmonitor|getresponse|aweber')
        THEN 'email'

      /* Video — checked before social so YouTube lands here */
      WHEN REGEXP_LIKE(LOWER(referral_domain), 'youtube|vimeo|dailymotion|twitch|hulu|roku|pluto|peacock')
        OR REGEXP_LIKE(LOWER(source),          'youtube|vimeo|dailymotion|twitch|hulu|roku|pluto|peacock|video')
        THEN 'video'

      /* Social */
      WHEN REGEXP_LIKE(LOWER(referral_domain), 'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|reddit|quora|threads|mastodon|bluesky|wechat|weibo|whatsapp|telegram')
        OR REGEXP_LIKE(LOWER(source),          'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|reddit|quora|threads|mastodon|bluesky|wechat|weibo|whatsapp|telegram')
        THEN 'social'

      /* Affiliate */
      WHEN REGEXP_LIKE(LOWER(referral_domain), 'shareasale|cj\.com|rakuten|impact\.com|partnerize|awin|affiliate|refersion|pepperjam')
        OR REGEXP_LIKE(LOWER(source),          'shareasale|cj\.com|rakuten|impact\.com|partnerize|awin|affiliate|refersion|pepperjam')
        THEN 'affiliates'

      /* Display / programmatic */
      WHEN REGEXP_LIKE(LOWER(referral_domain), 'criteo|mediamath|thetradedesk|taboola|outbrain|stackadapt|adroll|appnexus|xandr|dv360|googlesyndication|rubiconproject|onetag')
        OR REGEXP_LIKE(LOWER(source),          'criteo|mediamath|thetradedesk|taboola|outbrain|stackadapt|adroll|appnexus|xandr|dv360|googlesyndication|rubiconproject|onetag|display|banner')
        OR REGEXP_LIKE(LOWER(campaign),        'display|discovery\s*ads|trueview|dv360|banner')
        THEN 'display'

      /* Organic search — checked after social/video so shared domains (e.g. google) don't steal social/video hits */
      WHEN REGEXP_LIKE(LOWER(referral_domain), 'google|bing|yahoo|baidu|duckduckgo|yandex|ecosia|naver|sogou|aol|perplexity|brave|ask\.com')
        OR REGEXP_LIKE(LOWER(source),          'google|bing|yahoo|baidu|duckduckgo|yandex|ecosia|naver|sogou|aol|perplexity|brave|ask\.com|gpt')
        THEN 'organic'


          /* last resort when channel is blank: use source label */
          ELSE source
        END
      )

      /* ===== 2) Channel is populated: apply mta_channel_mapping_final remaps ===== */

  /* cpc on social platforms -> social */
    WHEN channel = 'cpc'
      AND (
        REGEXP_LIKE(LOWER(source), 'facebook|instagram|snapchat|tiktok|pinterest|linkedin|reddit|twitter')
        OR REGEXP_LIKE(LOWER(campaign), 'fbig|fb_|ig_|snap_|tiktok_|pin_|li_|social|paid_social|meta_')
      )
      THEN 'social'

    /* cpc on search platforms -> paid_search */
    WHEN channel = 'cpc'
      AND (
        REGEXP_LIKE(LOWER(source), 'google|bing|yahoo|search|microsoft|apple_search|amazon_search')
        OR REGEXP_LIKE(LOWER(campaign), 'gmail\s*ads|paid\s*search|search\s*ads|ppc')
      )
      THEN 'paid_search'

    /* cpc on display/programmatic platforms -> display */
    WHEN channel = 'cpc'
      AND (
        REGEXP_LIKE(LOWER(source), 'criteo|taboola|outbrain|dv360|thetradedesk|stackadapt|adroll|xandr')
        OR REGEXP_LIKE(LOWER(campaign), 'display|discovery\s*ads|trueview|banner|programmatic')
      )
      THEN 'display'

    /* cpc on video platforms -> video */
    WHEN channel = 'cpc'
      AND (
        REGEXP_LIKE(LOWER(source), 'youtube|vimeo|twitch|hulu|roku')
        OR REGEXP_LIKE(LOWER(campaign), 'video|pre.roll|bumper|instream')
      )
      THEN 'video'

    /* cpc fallback — still cpc but didn't match above -> paid_search as safest default */
    WHEN channel = 'cpc'
      THEN 'paid_search'

    /* organic misclassified as referral */
    WHEN channel = 'referral'
      AND REGEXP_LIKE(LOWER(source), 'google|bing|yahoo|baidu|duckduckgo|yandex|ecosia|perplexity')
      THEN 'organic'

    /* social misclassified as referral */
    WHEN channel = 'referral'
      AND REGEXP_LIKE(LOWER(source), 'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|reddit|youtube|quora|threads')
      THEN 'social'

      ELSE channel
    END AS channel_new,

    /* source_new: best-effort normalized source for each touchpoint */
    CASE
      WHEN source IS NULL THEN
        REGEXP_EXTRACT(
          referral_domain,
          'affiliat|sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|getresponse|aweber|campaignmonitor|google|bing|yahoo|baidu|duckduckgo|yandex|ask.com|facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|youtube|reddit|quora|youtube|vimeo|dailymotion|twitch|video|criteo|mediamath|thetradedesk|adobe|amazon|onetag|rubiconproject|xandr'
        )
      ELSE source
    END AS source_new

  FROM SESH
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
SELECT
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

  channel AS channel_orig,
  channel_final,

  source AS source_orig,
  source_final,

  campaign,
  utm_mailing,
  context_col,
  conversion_flag,
  item_price,
  sess_rank_asc,
  sess_rank_desc
FROM (
  SELECT
    STEP2.*,

    /* Within-session sequencing indices (useful for pathing and session-level attribution) */
    RANK() OVER (
      PARTITION BY STEP2.session_id
      ORDER BY time ASC, campaign, context_col ASC
    ) AS sess_rank_asc,

    RANK() OVER (
      PARTITION BY STEP2.session_id
      ORDER BY time DESC, campaign, context_col DESC
    ) AS sess_rank_desc,

    /* Attribution-ready channel: carry-forward last known channel, else 'direct' */
    COALESCE(
      LAST_VALUE(channel_new) IGNORE NULLS OVER (
        PARTITION BY ${backfill_partition_col}
        ORDER BY date_time
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ),
      'direct'
    ) AS channel_final,

    /* Attribution-ready source: carry-forward last known source, else infer from domain */
    COALESCE(
      LAST_VALUE(source_new) IGNORE NULLS OVER (
        PARTITION BY ${backfill_partition_col}
        ORDER BY date_time
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ),
      COALESCE(
        REGEXP_EXTRACT(referral_domain, '(?<=\.)[^.]+(?=\.)'),
        REGEXP_EXTRACT(url,            '(?<=\.)[^.]+(?=\.)')
      )
    ) AS source_final

  FROM STEP2
);



