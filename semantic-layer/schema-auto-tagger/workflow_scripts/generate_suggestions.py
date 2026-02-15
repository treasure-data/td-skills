#!/usr/bin/env python3
"""
Suggestion Generation Script for Workflow
Uses the SchemaTagger to generate tag suggestions
"""

import os
import sys
import json
import logging
from datetime import datetime

# Add parent directory to path to import schema_auto_tagger
sys.path.insert(0, '/path/to/scripts')

from schema_auto_tagger import SchemaTagger, ColumnMetadata

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_scan_output(scan_file: str) -> dict:
    """Load schema scan output"""
    with open(scan_file, 'r') as f:
        return json.load(f)


def load_rules(rules_file: str) -> dict:
    """Load tagging rules"""
    if not os.path.exists(rules_file):
        logger.warning(f"Rules file not found: {rules_file}")
        return {}

    try:
        import yaml
        with open(rules_file, 'r') as f:
            return yaml.safe_load(f) or {}
    except ImportError:
        logger.warning("PyYAML not installed, using default rules only")
        return {}
    except Exception as e:
        logger.error(f"Failed to load rules: {e}")
        return {}


def generate_suggestions(database: str, schema_data: dict, rules: dict) -> dict:
    """
    Generate tag suggestions for all columns

    Args:
        database: Database name
        schema_data: Schema scan data
        rules: Tagging rules

    Returns:
        Dict with suggestions for each table/column
    """
    tagger = SchemaTagger(database, rules)
    suggestions = {
        'database': database,
        'timestamp': datetime.now().isoformat(),
        'total_tables': 0,
        'total_suggestions': 0,
        'tables': {}
    }

    changes = schema_data.get('changes', {})
    tables_to_process = (
        changes.get('new_tables', []) +
        list(changes.get('new_columns', {}).keys())
    )

    tables = schema_data.get('tables', {})

    for table_name in set(tables_to_process):
        if table_name not in tables:
            logger.warning(f"Table {table_name} not in schema data")
            continue

        table_data = tables[table_name]
        table_suggestions = {}

        for col_data in table_data.get('columns', []):
            column = ColumnMetadata(
                name=col_data.get('name', ''),
                data_type=col_data.get('type', ''),
                description=col_data.get('description', ''),
                existing_tags=col_data.get('policy_tags', [])
            )

            # Skip columns that already have tags
            if column.existing_tags:
                logger.debug(f"Skipping {table_name}.{column.name} - already tagged")
                continue

            # Generate suggestions
            column_suggestions = tagger.analyze_column(column, table_name)

            if column_suggestions:
                table_suggestions[column.name] = [
                    {
                        'tag': s.tag,
                        'category': s.category,
                        'confidence': s.confidence,
                        'reason': s.reason
                    }
                    for s in column_suggestions
                ]

        if table_suggestions:
            suggestions['tables'][table_name] = table_suggestions
            suggestions['total_suggestions'] += sum(len(cols) for cols in table_suggestions.values())
            suggestions['total_tables'] += 1

    logger.info(f"Generated {suggestions['total_suggestions']} suggestions for "
                f"{suggestions['total_tables']} tables")

    return suggestions


def main():
    input_file = os.environ.get('INPUT_SCAN', '/tmp/schema_scan.json')
    output_file = os.environ.get('OUTPUT_SUGGESTIONS', '/tmp/suggestions.json')
    database = os.environ.get('DATABASE', 'analytics')
    rules_file = os.environ.get('RULES_FILE', 'rules/schema_tagger_rules.yaml')

    # Load inputs
    logger.info(f"Loading scan output from {input_file}")
    schema_data = load_scan_output(input_file)

    logger.info(f"Loading rules from {rules_file}")
    rules = load_rules(rules_file)

    # Generate suggestions
    suggestions = generate_suggestions(database, schema_data, rules)

    # Save output
    with open(output_file, 'w') as f:
        json.dump(suggestions, f, indent=2)

    logger.info(f"Suggestions saved to {output_file}")


if __name__ == '__main__':
    main()
