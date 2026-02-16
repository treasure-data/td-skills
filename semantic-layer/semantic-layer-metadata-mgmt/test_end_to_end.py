#!/usr/bin/env python3
"""
End-to-End Test for Semantic Layer Metadata Management
Tests the append-only pattern with real TD updates
"""
import os
import sys
import pytd
import pandas as pd
import time
from datetime import datetime

# TD Configuration
TD_API_KEY = os.getenv('TD_API_KEY')
TD_REGION = os.getenv('TD_REGION', 'us01')
SEMANTIC_DB = 'semantic_layer_v1'
TABLE_NAME = 'field_metadata'

def print_separator(title=""):
    print("\n" + "=" * 80)
    if title:
        print(f" {title}")
        print("=" * 80)

def main():
    print_separator("SEMANTIC LAYER METADATA MANAGEMENT - END-TO-END TEST")

    if not TD_API_KEY:
        print("❌ ERROR: TD_API_KEY environment variable not set")
        print("Please set it: export TD_API_KEY=your-api-key")
        return False

    # Initialize pytd client
    print("\n📡 Step 1: Initializing TD client...")
    client = pytd.Client(
        apikey=TD_API_KEY,
        endpoint=f'https://api.treasuredata.com/',
        database=SEMANTIC_DB
    )
    print(f"   ✓ Connected to {TD_REGION}")

    # Test parameters
    test_database = 'analytics'
    test_table = 'dim_customers'
    test_field = 'customer_segment'

    # Step 2: Query BEFORE state (with deduplication)
    print(f"\n📊 Step 2: Querying BEFORE state for {test_database}.{test_table}.{test_field}...")
    before_query = f"""
    SELECT
        database_name, table_name, field_name,
        description, owner, steward_email, business_term,
        data_classification, tags, time, updated_at
    FROM (
        SELECT
            *,
            ROW_NUMBER() OVER (
                PARTITION BY database_name, table_name, field_name
                ORDER BY time DESC
            ) as rn
        FROM {SEMANTIC_DB}.{TABLE_NAME}
        WHERE database_name = '{test_database}'
          AND table_name = '{test_table}'
          AND field_name = '{test_field}'
    ) t
    WHERE rn = 1
    """

    before_result = client.query(before_query)

    # Convert result to DataFrame
    if isinstance(before_result, dict):
        before_df = pd.DataFrame(before_result['data'], columns=before_result['columns'])
    else:
        before_df = before_result

    if before_df.empty:
        print(f"   ❌ Field {test_field} not found!")
        return False

    print("\n   📄 BEFORE State:")
    print(f"   • owner: {before_df['owner'].iloc[0]}")
    print(f"   • business_term: {before_df['business_term'].iloc[0]}")
    print(f"   • data_classification: {before_df['data_classification'].iloc[0]}")
    print(f"   • tags: {before_df['tags'].iloc[0]}")
    print(f"   • time: {before_df['time'].iloc[0]}")
    print(f"   • updated_at: {before_df['updated_at'].iloc[0]}")
    print(f"   • description: {before_df['description'].iloc[0][:80]}...")

    # Step 3: Prepare update (append-only pattern)
    print(f"\n✏️  Step 3: Preparing update for {test_field}...")
    updated_row = before_df.copy()

    # Apply test updates
    test_updates = {
        'owner': 'product-team-UPDATED',
        'business_term': 'Customer Lifecycle Segment - UPDATED TEST',
        'data_classification': 'internal',
        'description': f'TEST UPDATE - Strategic customer segment classification. Updated at {datetime.utcnow().isoformat()}',
        'time': int(time.time()),
        'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    }

    for key, value in test_updates.items():
        updated_row[key] = value

    # Remove row_number if exists
    if 'rn' in updated_row.columns:
        updated_row = updated_row.drop('rn', axis=1)

    print("   📝 Updates to apply:")
    for key, value in test_updates.items():
        if key not in ['time', 'updated_at']:
            print(f"   • {key}: {value}")

    # Step 4: Write updated row (append)
    print(f"\n💾 Step 4: Appending updated row to {SEMANTIC_DB}.{TABLE_NAME}...")
    try:
        client.load_table_from_dataframe(
            updated_row,
            f'{SEMANTIC_DB}.{TABLE_NAME}',
            writer='bulk_import',
            if_exists='append'
        )
        print("   ✓ Data appended successfully!")
    except Exception as e:
        print(f"   ❌ Append failed: {e}")
        return False

    # Wait for data to be available
    print("\n⏳ Step 5: Waiting for data to be available (5 seconds)...")
    time.sleep(5)

    # Step 6: Verify the update (with deduplication)
    print(f"\n🔍 Step 6: Querying AFTER state (with deduplication)...")
    after_query = before_query  # Same query with deduplication

    after_result = client.query(after_query)

    # Convert result to DataFrame
    if isinstance(after_result, dict):
        after_df = pd.DataFrame(after_result['data'], columns=after_result['columns'])
    else:
        after_df = after_result

    if after_df.empty:
        print("   ❌ Could not retrieve updated data!")
        return False

    print("\n   📄 AFTER State:")
    print(f"   • owner: {after_df['owner'].iloc[0]}")
    print(f"   • business_term: {after_df['business_term'].iloc[0]}")
    print(f"   • data_classification: {after_df['data_classification'].iloc[0]}")
    print(f"   • tags: {after_df['tags'].iloc[0]}")
    print(f"   • time: {after_df['time'].iloc[0]}")
    print(f"   • updated_at: {after_df['updated_at'].iloc[0]}")
    print(f"   • description: {after_df['description'].iloc[0][:80]}...")

    # Step 7: Compare BEFORE vs AFTER
    print("\n📊 Step 7: Comparison (BEFORE → AFTER):")
    changes_found = False

    for key in ['owner', 'business_term', 'data_classification', 'description']:
        before_val = str(before_df[key].iloc[0])
        after_val = str(after_df[key].iloc[0])

        if before_val != after_val:
            changes_found = True
            # Truncate long descriptions
            if key == 'description':
                before_short = before_val[:50] + "..." if len(before_val) > 50 else before_val
                after_short = after_val[:50] + "..." if len(after_val) > 50 else after_val
                print(f"   ✓ {key}:")
                print(f"      BEFORE: {before_short}")
                print(f"      AFTER:  {after_short}")
            else:
                print(f"   ✓ {key}: '{before_val}' → '{after_val}'")

    # Check time updated
    if after_df['time'].iloc[0] > before_df['time'].iloc[0]:
        print(f"   ✓ time: {before_df['time'].iloc[0]} → {after_df['time'].iloc[0]} (newer)")
        changes_found = True

    # Step 8: Verify deduplication works (count all versions)
    print(f"\n🔢 Step 8: Checking version history...")
    history_query = f"""
    SELECT
        time, updated_at, owner, business_term
    FROM {SEMANTIC_DB}.{TABLE_NAME}
    WHERE database_name = '{test_database}'
      AND table_name = '{test_table}'
      AND field_name = '{test_field}'
    ORDER BY time DESC
    LIMIT 5
    """

    history_result = client.query(history_query)

    # Convert result to DataFrame
    if isinstance(history_result, dict):
        history_df = pd.DataFrame(history_result['data'], columns=history_result['columns'])
    else:
        history_df = history_result

    print(f"   📜 Found {len(history_df)} total versions in history (showing latest 5):")

    for idx, row in history_df.iterrows():
        time_str = datetime.fromtimestamp(row['time']).strftime('%Y-%m-%d %H:%M:%S')
        print(f"      {idx + 1}. time={time_str}, owner={row['owner']}, business_term={row['business_term'][:40]}...")

    # Final result
    print_separator("TEST RESULTS")

    if changes_found and len(history_df) >= 2:
        print("✅ SUCCESS - End-to-end test passed!")
        print("\n✓ Append-only pattern working correctly")
        print("✓ Deduplication returns latest version")
        print("✓ Version history preserved")
        print(f"✓ {len(history_df)} versions in history")
        return True
    else:
        print("❌ FAILED - Updates not detected or version history missing")
        return False

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
