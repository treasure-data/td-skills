#!/usr/bin/env python3
"""
Apply Approved Tags Script for Workflow
Uses TD API to apply approved tags to columns
"""

import os
import sys
import json
import logging
from datetime import datetime

# Add path to import TD API module from parent directory
scripts_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, scripts_dir)

from schema_tagger_td_api import TreasureDataTagAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_approved_tags(tags_file: str) -> dict:
    """Load approved tags"""
    with open(tags_file, 'r') as f:
        return json.load(f)


def apply_tags(api_client: TreasureDataTagAPI, database: str,
              tag_assignments: dict) -> dict:
    """
    Apply approved tags to columns

    Args:
        api_client: TD API client
        database: Database name
        tag_assignments: Dict of {table: {column: [tags]}}

    Returns:
        Log of applied tags
    """
    log = {
        'database': database,
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_tags': 0,
            'applied': 0,
            'failed': 0
        },
        'details': {}
    }

    for table_name, columns in tag_assignments.items():
        table_log = {
            'applied': 0,
            'failed': 0,
            'columns': {}
        }

        for col_name, tags in columns.items():
            col_log = {'applied': [], 'failed': []}

            for tag in tags:
                try:
                    response = api_client.apply_tag_to_column(database, table_name, col_name, tag)

                    log['summary']['total_tags'] += 1

                    if response.success:
                        col_log['applied'].append(tag)
                        table_log['applied'] += 1
                        log['summary']['applied'] += 1
                        logger.info(f"✓ Applied {tag} to {table_name}.{col_name}")
                    else:
                        col_log['failed'].append({'tag': tag, 'error': response.message})
                        table_log['failed'] += 1
                        log['summary']['failed'] += 1
                        logger.error(f"✗ Failed to apply {tag} to {table_name}.{col_name}: {response.message}")

                except Exception as e:
                    col_log['failed'].append({'tag': tag, 'error': str(e)})
                    table_log['failed'] += 1
                    log['summary']['failed'] += 1
                    logger.error(f"✗ Exception applying {tag} to {table_name}.{col_name}: {e}")

            if col_log['applied'] or col_log['failed']:
                table_log['columns'][col_name] = col_log

        if table_log['applied'] or table_log['failed']:
            log['details'][table_name] = table_log

    return log


def generate_summary_report(log: dict) -> str:
    """Generate human-readable summary"""
    summary = []
    summary.append("=" * 80)
    summary.append("SCHEMA TAGGING EXECUTION REPORT")
    summary.append("=" * 80)
    summary.append(f"Database: {log['database']}")
    summary.append(f"Timestamp: {log['timestamp']}")
    summary.append("")

    s = log['summary']
    success_rate = (s['applied'] / s['total_tags'] * 100) if s['total_tags'] > 0 else 0

    summary.append(f"Summary:")
    summary.append(f"  Total Tags Applied: {s['total_tags']}")
    summary.append(f"  Successful: {s['applied']} ({success_rate:.1f}%)")
    summary.append(f"  Failed: {s['failed']}")
    summary.append("")

    if s['failed'] > 0:
        summary.append("Failed Applications:")
        for table_name, table_log in log['details'].items():
            if table_log['failed'] > 0:
                summary.append(f"\n  Table: {table_name}")
                for col_name, col_log in table_log['columns'].items():
                    if col_log['failed']:
                        for failure in col_log['failed']:
                            summary.append(f"    Column {col_name}: {failure['tag']}")
                            summary.append(f"      Error: {failure['error']}")

    summary.append("\n" + "=" * 80)

    return "\n".join(summary)


def main():
    tags_file = os.environ.get('APPROVED_TAGS', '/tmp/approved_tags.json')
    database = os.environ.get('DATABASE', 'analytics')
    log_file = os.environ.get('LOG_FILE', '/tmp/apply_tags_log.json')
    api_key = os.environ.get('TD_API_KEY')

    # Initialize API client
    try:
        api_client = TreasureDataTagAPI(api_key=api_key)
    except ValueError as e:
        logger.error(f"Failed to initialize TD API: {e}")
        sys.exit(1)

    # Load approved tags
    logger.info(f"Loading approved tags from {tags_file}")
    approved = load_approved_tags(tags_file)

    # Apply tags
    logger.info(f"Applying {approved['approval_summary']['approved']} approved tags")
    tag_assignments = approved.get('tables', {})
    log = apply_tags(api_client, database, tag_assignments)

    # Generate report
    report = generate_summary_report(log)
    logger.info("\n" + report)

    # Save log
    with open(log_file, 'w') as f:
        json.dump(log, f, indent=2)

    logger.info(f"Execution log saved to {log_file}")

    # Exit with error if any tags failed
    if log['summary']['failed'] > 0:
        logger.warning(f"{log['summary']['failed']} tag applications failed")
        sys.exit(1)


if __name__ == '__main__':
    main()
