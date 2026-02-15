#!/usr/bin/env python3
"""
Auto-Approve High Confidence Suggestions
Filters suggestions by confidence level for automatic approval
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_suggestions(suggestions_file: str) -> dict:
    """Load suggestions from file"""
    with open(suggestions_file, 'r') as f:
        return json.load(f)


def filter_by_confidence(suggestions: dict, min_confidence: str = "HIGH",
                        high_conf_threshold: float = 0.8) -> dict:
    """
    Filter suggestions by confidence level

    Args:
        suggestions: Full suggestions dict
        min_confidence: Minimum confidence level (HIGH, MEDIUM, LOW)
        high_conf_threshold: Percentage threshold for auto-approval

    Returns:
        Dict with filtered/approved suggestions
    """
    confidence_order = {'HIGH': 3, 'MEDIUM': 2, 'LOW': 1}
    min_level = confidence_order.get(min_confidence, 2)

    approved = {
        'database': suggestions.get('database'),
        'timestamp': datetime.now().isoformat(),
        'approval_criteria': {
            'min_confidence': min_confidence,
            'threshold': high_conf_threshold
        },
        'approval_summary': {
            'total_suggestions': 0,
            'approved': 0,
            'rejected': 0
        },
        'tables': {}
    }

    for table_name, columns in suggestions.get('tables', {}).items():
        approved_columns = {}

        for col_name, col_suggestions in columns.items():
            # Filter by confidence
            approved_tags = []

            for sugg in col_suggestions:
                sugg_level = confidence_order.get(sugg.get('confidence', 'LOW'), 1)

                if sugg_level >= min_level:
                    approved_tags.append(sugg.get('tag'))
                    logger.debug(f"Approved: {table_name}.{col_name} = {sugg.get('tag')}")

            if approved_tags:
                approved_columns[col_name] = approved_tags
                approved['approval_summary']['approved'] += len(approved_tags)
            else:
                approved['approval_summary']['rejected'] += len(col_suggestions)

            approved['approval_summary']['total_suggestions'] += len(col_suggestions)

        if approved_columns:
            approved['tables'][table_name] = approved_columns

    logger.info(f"Approval Summary:\n"
                f"  Total suggestions: {approved['approval_summary']['total_suggestions']}\n"
                f"  Approved: {approved['approval_summary']['approved']}\n"
                f"  Rejected: {approved['approval_summary']['rejected']}")

    return approved


def validate_approved_tags(approved: dict) -> Tuple[bool, List[str]]:
    """
    Validate that approved tags follow naming conventions

    Args:
        approved: Approved tags dict

    Returns:
        Tuple of (valid, errors)
    """
    errors = []
    valid_patterns = [
        'data_classification:',
        'business_domain:',
        'technical:',
        'compliance:',
        'governance:'
    ]

    for table_name, columns in approved.get('tables', {}).items():
        for col_name, tags in columns.items():
            for tag in tags:
                if not any(tag.startswith(pattern) for pattern in valid_patterns):
                    errors.append(f"Invalid tag format in {table_name}.{col_name}: {tag}")

    return len(errors) == 0, errors


def main():
    suggestions_file = os.environ.get('SUGGESTIONS_FILE', '/tmp/suggestions.json')
    output_file = os.environ.get('APPROVED_TAGS', '/tmp/approved_tags.json')
    min_confidence = os.environ.get('MIN_CONFIDENCE', 'HIGH')

    # Load and filter
    logger.info(f"Loading suggestions from {suggestions_file}")
    suggestions = load_suggestions(suggestions_file)

    logger.info(f"Filtering for {min_confidence} confidence or higher")
    approved = filter_by_confidence(suggestions, min_confidence)

    # Validate
    valid, errors = validate_approved_tags(approved)
    if not valid:
        logger.warning(f"Validation errors found: {errors}")
    else:
        logger.info("All approved tags are valid")

    # Save
    with open(output_file, 'w') as f:
        json.dump(approved, f, indent=2)

    logger.info(f"Approved tags saved to {output_file}")
    logger.info(f"Ready to apply {approved['approval_summary']['approved']} tags")


if __name__ == '__main__':
    from typing import Tuple
    main()
