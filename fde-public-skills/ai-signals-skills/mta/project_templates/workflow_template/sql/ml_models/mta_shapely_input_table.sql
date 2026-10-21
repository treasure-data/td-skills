--- SELECT ONLY multi-step, multi-channel-journeys to learn from Shapely's evaluation at each position of the journey step
select * from ${output_tables.journeys_table}
where journey_length > 1 and cardinality(channel_list_temp) > 1
limit ${shapley_max_load_rows}
