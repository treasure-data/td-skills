--- SELECT ONLY multi-step, multi-channel-journeys to learn from Shapely's evaluation at each position of the journey step
SELECT * FROM ${output_tables.journeys_table}
WHERE journey_length > 1 AND CARDINALITY(channel_list_temp) > 1
LIMIT ${shapley_max_load_rows}
