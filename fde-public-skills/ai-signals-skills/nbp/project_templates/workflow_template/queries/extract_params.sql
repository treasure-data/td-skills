WITH latest as (
  SELECT * FROM ${prefix}metrics_temp
)

SELECT 
  'Algorithm: ' || algorithm || ', Params: ' || model_params AS model_params,
  'Precision: ' || REGEXP_EXTRACT(FORMAT('%.20f', ROUND(precicion_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1)|| 
  ', Recall: ' || REGEXP_EXTRACT(FORMAT('%.20f', ROUND(recall_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1)|| 
  ', NDCG: ' || REGEXP_EXTRACT(FORMAT('%.20f', ROUND(ndcg_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1)|| 
  ', MRR: ' || REGEXP_EXTRACT(FORMAT('%.20f', ROUND(mrr_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1)|| 
  ' MAP: ' || REGEXP_EXTRACT(FORMAT('%.20f', ROUND(map_${max_recommended_items},3)), '^(-?\d+\.\d+?)(0*)$', 1) AS model_metrics
FROM latest