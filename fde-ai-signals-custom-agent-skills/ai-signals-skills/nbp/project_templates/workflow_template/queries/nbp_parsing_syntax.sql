select ${td.last_results.idx} as row_num,
'TRY(product_categories[array_position(nbp_ranks, ${td.last_results.idx})]) AS nb_category_${td.last_results.idx}, TRY(product_recommendations[array_position(nbp_ranks, ${td.last_results.idx})]) AS nbp_${td.last_results.idx}, TRY(product_skus[array_position(nbp_ranks, ${td.last_results.idx})]) AS nbp_${td.last_results.idx}_sku' as query_syntax
