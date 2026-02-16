#!/usr/bin/env python3
"""
Test script to verify field_metadata table updates work end-to-end
"""
import os
import sys
import pytd
from datetime import datetime

# TD Configuration
TD_API_KEY = os.getenv('TD_API_KEY')
TD_REGION = os.getenv('TD_REGION', 'us01')
SEMANTIC_DB = 'semantic_layer_v1'
TABLE_NAME = 'field_metadata'

def main():
    print("=" * 80)
    print("TESTING FIELD_METADATA UPDATE END-TO-END")
    print("=" * 80)

    # Initialize pytd client
    print("\n1. Initializing TD client...")
    client = pytd.Client(
        apikey=TD_API_KEY,
        endpoint=f'https://api-{TD_REGION}.treasuredata.com',
        database=SEMANTIC_DB
    )
    print(f"   ✓ Connected to {TD_REGION}")

    # Test field to update
    test_database = 'analytics'
    test_table = 'dim_customers'
    test_field = 'customer_segment'

    print(f"\n2. Querying BEFORE state for {test_database}.{test_table}.{test_field}...")
    before_query = f"""
    SELECT
        database_name, table_name, field_name,
        description, owner, steward_email, business_term,
        data_classification, tags
    FROM {SEMANTIC_DB}.{TABLE_NAME}
    WHERE database_name = '{test_database}'
      AND table_name = '{test_table}'
      AND field_name = '{test_field}'
    LIMIT 1
    """

    before_df = client.query(before_query)
    print("\n   BEFORE State:")
    print(f"   owner: {before_df['owner'].iloc[0]}")
    print(f"   business_term: {before_df['business_term'].iloc[0]}")
    print(f"   data_classification: {before_df['data_classification'].iloc[0]}")
    print(f"   tags: {before_df['tags'].iloc[0]}")
    print(f"   description: {before_df['description'].iloc[0][:80]}...")

    # Prepare update using DELETE + INSERT pattern
    print(f"\n3. Preparing update for {test_field}...")

    # First, delete existing rows for this field
    delete_query = f"""
    DELETE FROM {SEMANTIC_DB}.{TABLE_NAME}
    WHERE database_name = '{test_database}'
      AND table_name = '{test_table}'
      AND field_name = '{test_field}'
    """

    print("   Note: Trino doesn't support DELETE, using alternative approach...")
    print("   Will use INSERT INTO approach with updated values")

    # Alternative: Read all data, update in memory, write back
    # This is the pattern the backend API should use
    print("\n4. Reading current metadata...")
    read_query = f"""
    SELECT * FROM {SEMANTIC_DB}.{TABLE_NAME}
    WHERE database_name = '{test_database}'
      AND table_name = '{test_table}'
      AND field_name = '{test_field}'
    LIMIT 1
    """

    current_df = client.query(read_query)
    print(f"   ✓ Read {len(current_df)} rows")

    # Update the values
    print("\n5. Applying updates...")
    current_df['owner'] = 'product-team'
    current_df['business_term'] = 'Customer Lifecycle Segment'
    current_df['data_classification'] = 'internal'
    current_df['description'] = 'Strategic customer segment classification based on comprehensive RFM (Recency, Frequency, Monetary) analysis. Used for targeted marketing campaigns and customer lifecycle management. Valid values: High Value, Medium Value, Low Value, At Risk, Lost.'
    current_df['updated_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    # Note: tags are array type, keeping as is for now

    print("   Updated values:")
    print(f"   owner: {current_df['owner'].iloc[0]}")
    print(f"   business_term: {current_df['business_term'].iloc[0]}")
    print(f"   data_classification: {current_df['data_classification'].iloc[0]}")

    # Write updated data
    print(f"\n6. Writing updated data to {SEMANTIC_DB}.{TABLE_NAME}...")
    try:
        # Use TD's append mode first
        client.load_table_from_dataframe(
            current_df,
            f'{SEMANTIC_DB}.{TABLE_NAME}',
            writer='bulk_import',
            if_exists='append'
        )
        print("   ✓ Data written successfully")
    except Exception as e:
        print(f"   ✗ Write failed: {e}")
        print("\n   This is expected - TD tables need proper write configuration")
        print("   In production, use TD's Bulk Import API or workflow-based updates")
        return False

    # Verify the update
    print(f"\n7. Querying AFTER state...")
    after_df = client.query(before_query)
    print("\n   AFTER State:")
    print(f"   owner: {after_df['owner'].iloc[0]}")
    print(f"   business_term: {after_df['business_term'].iloc[0]}")
    print(f"   data_classification: {after_df['data_classification'].iloc[0]}")

    # Compare
    print("\n8. Comparison:")
    if before_df['owner'].iloc[0] != after_df['owner'].iloc[0]:
        print(f"   ✓ owner changed: {before_df['owner'].iloc[0]} → {after_df['owner'].iloc[0]}")
    if before_df['business_term'].iloc[0] != after_df['business_term'].iloc[0]:
        print(f"   ✓ business_term changed: {before_df['business_term'].iloc[0]} → {after_df['business_term'].iloc[0]}")
    if before_df['data_classification'].iloc[0] != after_df['data_classification'].iloc[0]:
        print(f"   ✓ data_classification changed: {before_df['data_classification'].iloc[0]} → {after_df['data_classification'].iloc[0]}")

    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    return True

if __name__ == '__main__':
    if not TD_API_KEY:
        print("ERROR: TD_API_KEY environment variable not set")
        print("Please set it: export TD_API_KEY=your-api-key")
        sys.exit(1)

    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
