#!/usr/bin/env python3
"""
Schema Scanning Script for Workflow
Scans database for new tables and columns
"""

import os
import json
import subprocess
import logging
from datetime import datetime
from typing import Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def scan_database(database: str) -> Dict:
    """Scan database and collect schema information"""
    logger.info(f"Scanning database: {database}")

    result = subprocess.run(
        ['tdx', 'tables', '--database', database, '--format', 'json'],
        capture_output=True,
        text=True,
        check=True
    )

    tables = json.loads(result.stdout)
    schema_data = {
        'database': database,
        'scan_time': datetime.now().isoformat(),
        'tables': {}
    }

    for table_name in tables:
        try:
            result = subprocess.run(
                ['tdx', 'show', 'schema', database, table_name, '--format', 'json'],
                capture_output=True,
                text=True,
                check=True
            )

            table_schema = json.loads(result.stdout)
            schema_data['tables'][table_name] = {
                'columns': table_schema.get('columns', []),
                'created_at': table_schema.get('created_at'),
                'updated_at': table_schema.get('updated_at'),
                'row_count': table_schema.get('row_count', 0)
            }

            logger.info(f"Scanned {table_name}: {len(table_schema.get('columns', []))} columns")

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to scan table {table_name}: {e}")
            continue

    return schema_data


def compare_with_baseline(current_schema: Dict, baseline_file: str) -> Dict:
    """
    Compare current schema with baseline to detect changes

    Args:
        current_schema: Current database schema
        baseline_file: Path to baseline schema file

    Returns:
        Dict with new/modified tables and columns
    """
    changes = {
        'new_tables': [],
        'new_columns': {},
        'modified_columns': {},
        'deleted_tables': [],
        'deleted_columns': {}
    }

    # Load baseline if it exists
    baseline = {}
    if os.path.exists(baseline_file):
        try:
            with open(baseline_file, 'r') as f:
                baseline = json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load baseline: {e}")

    baseline_tables = baseline.get('tables', {})
    current_tables = current_schema.get('tables', {})

    # Detect new and modified tables
    for table_name, current_cols in current_tables.items():
        if table_name not in baseline_tables:
            changes['new_tables'].append(table_name)
            logger.info(f"New table detected: {table_name}")
        else:
            # Check for new/modified columns
            baseline_col_names = {
                col.get('name') for col in baseline_tables[table_name].get('columns', [])
            }
            current_col_names = {
                col.get('name') for col in current_cols.get('columns', [])
            }

            new_cols = current_col_names - baseline_col_names
            if new_cols:
                changes['new_columns'][table_name] = [
                    col for col in current_cols.get('columns', [])
                    if col.get('name') in new_cols
                ]
                logger.info(f"New columns in {table_name}: {new_cols}")

    # Detect deleted tables
    for table_name in baseline_tables:
        if table_name not in current_tables:
            changes['deleted_tables'].append(table_name)
            logger.info(f"Deleted table detected: {table_name}")

    return changes


def main():
    database = os.environ.get('DATABASE', 'analytics')
    output_file = os.environ.get('SCAN_OUTPUT', '/tmp/schema_scan.json')
    baseline_file = os.environ.get('BASELINE_FILE', f'/tmp/baseline_{database}.json')

    # Scan database
    schema_data = scan_database(database)

    # Detect changes
    changes = compare_with_baseline(schema_data, baseline_file)
    schema_data['changes'] = changes

    # Save scan output
    with open(output_file, 'w') as f:
        json.dump(schema_data, f, indent=2)

    # Save as new baseline
    with open(baseline_file, 'w') as f:
        json.dump(schema_data, f, indent=2)

    logger.info(f"Scan complete. Output saved to {output_file}")
    logger.info(f"Summary: {len(changes['new_tables'])} new tables, "
                f"{len(changes['new_columns'])} tables with new columns")


if __name__ == '__main__':
    main()
