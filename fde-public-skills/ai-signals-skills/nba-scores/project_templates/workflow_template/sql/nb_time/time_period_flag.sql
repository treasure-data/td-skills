content: |

  CASE
    WHEN
        REGEXP_LIKE(lower(subject_code), '^(a|b|c|d)[0-9]')
      OR record_type in ('0123X000000kyHFQAY','Product Issues Device')
      THEN 1
    ELSE 0
  END AS product_issues_flag