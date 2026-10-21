with latest as (
  select * from ${prefix}metrics_temp
)

select 
  'Algorithm: ' || algorithm || ', Params: ' || model_params as model_params,
  'Precision: ' || regexp_extract(format('%.20f', round(precicion_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1)|| 
  ', Recall: ' || regexp_extract(format('%.20f', round(recall_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1)|| 
  ', NDCG: ' || regexp_extract(format('%.20f', round(ndcg_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1)|| 
  ', MRR: ' || regexp_extract(format('%.20f', round(mrr_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1)|| 
  ' MAP: ' || regexp_extract(format('%.20f', round(map_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1) as model_metrics
from latest