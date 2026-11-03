content: |

  case
    when
        regexp_like(lower(subject_code), '^(a|b|c|d)[0-9]')
      or record_type in ('0123X000000kyHFQAY','Product Issues Device')
      then 1
    else 0
  end as product_issues_flag