#!/usr/bin/env python3
"""
annotate_table_schema.py

Uses Treasure Data's Annotated Schema REST API to add field descriptions
to existing table columns in the schema layer.

Test with loyalty_profile table (8 fields).
"""

import requests
import yaml
import os
import sys
import json
import logging
from typing import Dict, List, Any

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)-8s | %(asctime)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

# API Configuration
TD_API_BASE_URL = "https://api-data-def-repo.treasuredata.com"

# Try multiple API key env var names
TD_API_KEY = os.getenv("TD_API_KEY") or os.getenv("TDX_API_KEY__TDX_STUDIO_US01_7060")

if not TD_API_KEY:
    logger.error("ERROR: TD_API_KEY environment variable not set")
    logger.error("Set it with: export TD_API_KEY='your-key-id/your-key-secret'")
    sys.exit(1)

# Parse API key
try:
    key_id, key_secret = TD_API_KEY.split("/")
except ValueError:
    logger.error("ERROR: TD_API_KEY format should be 'key-id/key-secret'")
    sys.exit(1)

# Target table
TARGET_DATABASE = "gld_cstore_prod"
TARGET_TABLE = "loyalty_profile"


# ============================================================================
# YAML LOADER
# ============================================================================

def load_data_dictionary(path: str) -> Dict[str, Any]:
    """Load data_dictionary_full.yaml"""
    try:
        with open(path) as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"ERROR: Could not load {path}: {e}")
        sys.exit(1)


# ============================================================================
# TABLE & COLUMN ID RESOLUTION
# ============================================================================

def get_table_info(database: str, table: str) -> tuple:
    """
    Get table ID and column info from Treasure Data

    Returns: (table_id, column_names_list)
    """
    logger.info(f"Querying columns for {database}.{table}...")

    # Use tdx CLI to parse table description and extract column names
    import subprocess

    try:
        result = subprocess.run(
            ["tdx", "describe", "--database", database, "--table", table],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            logger.error(f"Failed to describe table: {result.stderr}")
            return None, []

        # Parse output to extract column names
        output_lines = result.stdout.split('\n')
        columns = []

        for line in output_lines:
            # Look for table rows (they have | separators)
            if '│' in line and line.strip():
                parts = [p.strip() for p in line.split('│')]
                # Column name is typically in second position
                if len(parts) >= 2 and parts[1]:
                    col_name = parts[1]
                    # Filter out header and separator lines
                    if col_name and col_name != "column_name" and col_name != "" and '─' not in col_name:
                        columns.append(col_name)

        # Create table ID (use fully qualified name)
        table_id = f"{database}_{table}"

        logger.info(f"  ✓ Table ID: {table_id}")
        logger.info(f"  ✓ Found {len(columns)} columns")

        return table_id, columns

    except Exception as e:
        logger.error(f"Error querying table: {e}")
        return None, []


# ============================================================================
# ANNOTATION API CALLS
# ============================================================================

def annotate_column(table_id: str, column_id: str, description: str) -> bool:
    """
    Add description annotation to a column via REST API

    Returns: True if successful, False otherwise
    """

    url = f"{TD_API_BASE_URL}/v1/column-annotation"

    headers = {
        "Authorization": f"TD1 {key_id}/{key_secret}",
        "Content-Type": "application/json"
    }

    # Annotation payload
    payload = {
        "data": [
            {
                "type": "column-annotation",
                "attributes": {
                    "comment": description,
                    "sensitive": False
                },
                "relationships": {
                    "column": {
                        "data": {
                            "id": column_id,
                            "type": "column"
                        }
                    }
                }
            }
        ]
    }

    try:
        response = requests.post(
            url,
            params={"tableID": table_id},
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code in [200, 201]:
            logger.debug(f"  ✓ Annotated {column_id}")
            return True
        else:
            logger.warning(f"  ✗ Failed to annotate {column_id}: HTTP {response.status_code}")
            logger.debug(f"    Response: {response.text[:200]}")
            return False

    except Exception as e:
        logger.error(f"Error calling annotation API: {e}")
        return False


# ============================================================================
# MAIN ORCHESTRATION
# ============================================================================

def main():
    logger.info("=" * 70)
    logger.info("TREASURE DATA SCHEMA ANNOTATION TEST")
    logger.info(f"Target: {TARGET_DATABASE}.{TARGET_TABLE}")
    logger.info("=" * 70)
    logger.info("")

    # Step 1: Load data dictionary
    logger.info("[1] Loading data dictionary...")
    yaml_data = load_data_dictionary("data_dictionary_full.yaml")

    table_key = f"{TARGET_DATABASE}.{TARGET_TABLE}"
    if table_key not in yaml_data.get("tables", {}):
        logger.error(f"ERROR: Table {table_key} not found in data dictionary")
        sys.exit(1)

    table_def = yaml_data["tables"][table_key]
    fields = table_def.get("fields", [])
    logger.info(f"  ✓ Loaded {len(fields)} fields from data dictionary")
    logger.info("")

    # Step 2: Get table and column info
    logger.info("[2] Querying table columns from Treasure Data...")
    table_id, columns = get_table_info(TARGET_DATABASE, TARGET_TABLE)

    if not table_id:
        logger.error("ERROR: Could not retrieve table metadata")
        sys.exit(1)

    logger.info("")

    # Step 3: Annotate columns
    logger.info("[3] Annotating columns with descriptions...")
    logger.info(f"  Using table ID: {table_id}")
    logger.info("")

    success_count = 0
    failed_count = 0

    for field in fields:
        field_name = field.get("name")
        description = field.get("description", "")

        if field_name not in columns:
            logger.warning(f"  ⚠ Column {field_name} not found in table schema (skipping)")
            failed_count += 1
            continue

        logger.info(f"  Annotating: {field_name}")
        logger.info(f"    Description: {description[:60]}...")

        if annotate_column(table_id, field_name, description):
            success_count += 1
        else:
            failed_count += 1

    logger.info("")

    # Step 4: Summary
    logger.info("=" * 70)
    logger.info("ANNOTATION RESULTS")
    logger.info("=" * 70)
    logger.info(f"  ✓ Successfully annotated: {success_count} columns")
    logger.info(f"  ✗ Failed: {failed_count} columns")
    logger.info("")

    if success_count > 0:
        logger.info("✅ Test completed! Field descriptions have been added to the schema.")
        logger.info("")
        logger.info("Next: Run 'tdx describe --database gld_cstore_prod --table loyalty_profile'")
        logger.info("      to see the updated descriptions in the schema layer.")
    else:
        logger.error("❌ No columns were successfully annotated.")
        sys.exit(1)

    logger.info("")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
