#!/usr/bin/env python3
"""
Schema Auto-Tagger Implementation for Treasure Data
Automatically detects new tables/columns and suggests policy tags
"""

import json
import re
import subprocess
import sys
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class ColumnMetadata:
    """Column information from Treasure Data"""
    name: str
    data_type: str
    description: str = ""
    existing_tags: List[str] = None

    def __post_init__(self):
        if self.existing_tags is None:
            self.existing_tags = []


@dataclass
class TagSuggestion:
    """Suggested tag for a column"""
    tag: str
    category: str
    confidence: str  # HIGH, MEDIUM, LOW
    reason: str


class SchemaTagger:
    """Main schema tagging engine"""

    # Pattern definitions for detection
    PII_PATTERNS = {
        'email': r'^email|^mail|email_addr',
        'phone': r'^phone|^tel|phone_num',
        'ssn': r'^ssn|^social_security',
        'credit_card': r'^cc_|^card_|card_number|credit_card',
        'passport': r'^passport|passport_num',
        'drivers_license': r'^drivers_license|^dl_|license_num',
        'ip_address': r'^ip_|ip_addr',
        'auth_token': r'^token|^auth|_token$|_secret$|api_key',
    }

    FINANCIAL_PATTERNS = {
        'amount': r'^amount|^price|^cost|^fee|^total',
        'salary': r'^salary|^wage|^compensation',
        'revenue': r'^revenue|^income',
        'balance': r'^balance|^account_balance',
        'transaction': r'^transaction|^txn_|trans_',
    }

    TIMESTAMP_PATTERNS = {
        'created': r'^created|^date_created|^creation',
        'updated': r'^updated|^date_updated|^modification',
        'timestamp': r'^timestamp|^ts_|_ts$|_time$|_date$',
    }

    DOMAIN_PATTERNS = {
        'customer': r'^cust_|^customer|customer_id|customer_name',
        'product': r'^prod_|^product|product_id|product_name|sku',
        'order': r'^order|order_id|order_amount',
        'marketing': r'^utm_|^campaign|^source|^medium|^channel',
        'event': r'^event|^action|^behavior',
    }

    def __init__(self, database: str, tagging_rules: Optional[Dict] = None):
        """
        Initialize the tagger

        Args:
            database: Treasure Data database name
            tagging_rules: Optional custom tagging rules
        """
        self.database = database
        self.tagging_rules = tagging_rules or {}
        self.api_key = self._get_api_key()

    def _get_api_key(self) -> str:
        """Get TD API key from environment or tdx config"""
        try:
            result = subprocess.run(
                ['tdx', 'auth', 'show'],
                capture_output=True,
                text=True
            )
            # Parse API key from tdx auth show output
            for line in result.stdout.split('\n'):
                if 'API Key' in line or 'api_key' in line:
                    return line.split(':')[1].strip()
        except Exception as e:
            logger.error(f"Failed to get API key: {e}")
        return ""

    def scan_database(self, table_name: Optional[str] = None) -> Dict[str, List[ColumnMetadata]]:
        """
        Scan database for tables and columns

        Args:
            table_name: Optional specific table to scan

        Returns:
            Dict mapping table names to list of columns
        """
        logger.info(f"Scanning database: {self.database}")
        tables_data = {}

        try:
            if table_name:
                tables = [table_name]
            else:
                # List all tables
                result = subprocess.run(
                    ['tdx', 'tables', '--database', self.database, '--format', 'json'],
                    capture_output=True,
                    text=True,
                    check=True
                )
                tables = json.loads(result.stdout)

            for table in tables:
                columns = self._get_table_columns(table)
                tables_data[table] = columns
                logger.info(f"Found {len(columns)} columns in {table}")

        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to scan database: {e.stderr}")
            return {}

        return tables_data

    def _get_table_columns(self, table_name: str) -> List[ColumnMetadata]:
        """Get columns for a specific table"""
        try:
            result = subprocess.run(
                ['tdx', 'show', 'schema', self.database, table_name, '--format', 'json'],
                capture_output=True,
                text=True,
                check=True
            )
            schema_data = json.loads(result.stdout)
            columns = []

            for col in schema_data.get('columns', []):
                metadata = ColumnMetadata(
                    name=col.get('name', ''),
                    data_type=col.get('type', ''),
                    description=col.get('description', ''),
                    existing_tags=col.get('policy_tags', [])
                )
                columns.append(metadata)

            return columns
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to get columns for {table_name}: {e.stderr}")
            return []

    def analyze_column(self, column: ColumnMetadata, table_name: str) -> List[TagSuggestion]:
        """
        Analyze a column and suggest tags

        Args:
            column: Column metadata
            table_name: Parent table name

        Returns:
            List of tag suggestions
        """
        suggestions = []
        col_name_lower = column.name.lower()

        # Check PII patterns
        pii_tag = self._detect_pii(col_name_lower, column.data_type)
        if pii_tag:
            suggestions.extend(pii_tag)

        # Check financial patterns
        financial_tag = self._detect_financial(col_name_lower)
        if financial_tag:
            suggestions.extend(financial_tag)

        # Check timestamp patterns
        timestamp_tag = self._detect_timestamp(col_name_lower)
        if timestamp_tag:
            suggestions.extend(timestamp_tag)

        # Detect business domain
        domain_tags = self._detect_domain(col_name_lower, table_name)
        if domain_tags:
            suggestions.extend(domain_tags)

        # Apply custom rules if available
        custom_tags = self._apply_custom_rules(column, table_name)
        if custom_tags:
            suggestions.extend(custom_tags)

        return suggestions

    def _detect_pii(self, col_name: str, data_type: str) -> List[TagSuggestion]:
        """Detect PII columns"""
        suggestions = []

        for pii_type, pattern in self.PII_PATTERNS.items():
            if re.search(pattern, col_name, re.IGNORECASE):
                confidence = "HIGH"

                # Add data classification tag
                suggestions.append(TagSuggestion(
                    tag="data_classification:pii",
                    category="data_classification",
                    confidence=confidence,
                    reason=f"Column name matches PII pattern: {pii_type}"
                ))

                # Add compliance tags based on type
                if pii_type in ['email', 'phone', 'ssn', 'passport', 'drivers_license']:
                    suggestions.append(TagSuggestion(
                        tag="compliance:gdpr",
                        category="compliance",
                        confidence=confidence,
                        reason="Personal identifiable information subject to GDPR"
                    ))

                if pii_type == 'credit_card':
                    suggestions.append(TagSuggestion(
                        tag="compliance:pci-dss",
                        category="compliance",
                        confidence=confidence,
                        reason="Payment card information subject to PCI-DSS"
                    ))

                if pii_type == 'auth_token':
                    suggestions.append(TagSuggestion(
                        tag="data_classification:sensitive",
                        category="data_classification",
                        confidence="HIGH",
                        reason="Authentication credential - highly sensitive"
                    ))

        return suggestions

    def _detect_financial(self, col_name: str) -> List[TagSuggestion]:
        """Detect financial columns"""
        suggestions = []

        for fin_type, pattern in self.FINANCIAL_PATTERNS.items():
            if re.search(pattern, col_name, re.IGNORECASE):
                suggestions.append(TagSuggestion(
                    tag="business_domain:financial",
                    category="business_domain",
                    confidence="HIGH",
                    reason=f"Column name matches financial pattern: {fin_type}"
                ))

                suggestions.append(TagSuggestion(
                    tag="data_classification:sensitive",
                    category="data_classification",
                    confidence="HIGH",
                    reason="Financial data requires protection"
                ))

                suggestions.append(TagSuggestion(
                    tag="compliance:sox",
                    category="compliance",
                    confidence="MEDIUM",
                    reason="Financial data potentially subject to SOX"
                ))

        return suggestions

    def _detect_timestamp(self, col_name: str) -> List[TagSuggestion]:
        """Detect timestamp columns"""
        suggestions = []

        for ts_type, pattern in self.TIMESTAMP_PATTERNS.items():
            if re.search(pattern, col_name, re.IGNORECASE):
                suggestions.append(TagSuggestion(
                    tag="technical:production",
                    category="technical",
                    confidence="MEDIUM",
                    reason="Temporal data typically in production tables"
                ))

        return suggestions

    def _detect_domain(self, col_name: str, table_name: str) -> List[TagSuggestion]:
        """Detect business domain from column/table names"""
        suggestions = []
        combined_name = f"{table_name}_{col_name}".lower()

        for domain, pattern in self.DOMAIN_PATTERNS.items():
            if re.search(pattern, combined_name, re.IGNORECASE):
                suggestions.append(TagSuggestion(
                    tag=f"business_domain:{domain}",
                    category="business_domain",
                    confidence="MEDIUM",
                    reason=f"Column/table name matches {domain} pattern"
                ))
                break  # Use first domain match to avoid over-tagging

        return suggestions

    def _apply_custom_rules(self, column: ColumnMetadata, table_name: str) -> List[TagSuggestion]:
        """Apply custom tagging rules from configuration"""
        suggestions = []

        if not self.tagging_rules:
            return suggestions

        col_name = column.name.lower()
        table_name_lower = table_name.lower()

        # Check pattern-based rules
        for rule in self.tagging_rules.get('pattern_rules', []):
            pattern = rule.get('pattern')
            if pattern and re.search(pattern, col_name, re.IGNORECASE):
                for tag in rule.get('tags', []):
                    suggestions.append(TagSuggestion(
                        tag=tag,
                        category=tag.split(':')[0] if ':' in tag else 'custom',
                        confidence=rule.get('confidence', 'MEDIUM'),
                        reason=f"Matched custom rule: {rule.get('name', 'unnamed')}"
                    ))

        # Check table-based rules
        for rule in self.tagging_rules.get('table_rules', []):
            table_pattern = rule.get('table_pattern')
            if table_pattern and re.search(table_pattern, table_name_lower):
                for tag in rule.get('tags', []):
                    suggestions.append(TagSuggestion(
                        tag=tag,
                        category=tag.split(':')[0] if ':' in tag else 'custom',
                        confidence=rule.get('confidence', 'MEDIUM'),
                        reason=f"Matched table rule: {rule.get('name', 'unnamed')}"
                    ))

        return suggestions

    def generate_report(self, tables_data: Dict[str, List[ColumnMetadata]],
                       all_suggestions: Dict[str, Dict[str, List[TagSuggestion]]]) -> str:
        """Generate human-readable report"""
        report = []
        report.append("=" * 80)
        report.append("SCHEMA AUTO-TAGGING RECOMMENDATIONS")
        report.append("=" * 80)
        report.append(f"Database: {self.database}")
        report.append(f"Generated: {datetime.now().isoformat()}")
        report.append("")

        total_columns = sum(len(cols) for cols in tables_data.values())
        total_suggestions = sum(len(sugg) for table_sugg in all_suggestions.values()
                               for sugg in table_sugg.values())

        report.append(f"Summary: {len(tables_data)} tables, {total_columns} columns")
        report.append(f"Suggestions Generated: {total_suggestions}")
        report.append("")

        for table_name in sorted(tables_data.keys()):
            columns = tables_data[table_name]
            table_suggestions = all_suggestions.get(table_name, {})

            if not table_suggestions:
                continue

            report.append(f"\nTable: {self.database}.{table_name}")
            report.append("-" * 80)

            for column in columns:
                if column.name not in table_suggestions:
                    continue

                suggestions = table_suggestions[column.name]
                if not suggestions:
                    continue

                report.append(f"\n  Column: {column.name} ({column.data_type})")

                # Group by confidence
                high_conf = [s for s in suggestions if s.confidence == "HIGH"]
                med_conf = [s for s in suggestions if s.confidence == "MEDIUM"]
                low_conf = [s for s in suggestions if s.confidence == "LOW"]

                if high_conf:
                    report.append("  HIGH Confidence Tags:")
                    for sugg in high_conf:
                        report.append(f"    ✓ {sugg.tag}")
                        report.append(f"      Reason: {sugg.reason}")

                if med_conf:
                    report.append("  MEDIUM Confidence Tags:")
                    for sugg in med_conf:
                        report.append(f"    ◆ {sugg.tag}")
                        report.append(f"      Reason: {sugg.reason}")

                if low_conf:
                    report.append("  LOW Confidence Tags:")
                    for sugg in low_conf:
                        report.append(f"    ○ {sugg.tag}")
                        report.append(f"      Reason: {sugg.reason}")

        report.append("\n" + "=" * 80)
        report.append("END OF REPORT")
        report.append("=" * 80)

        return "\n".join(report)

    def apply_tags(self, approved_tags: Dict[str, Dict[str, List[str]]], dry_run: bool = False) -> Tuple[int, int]:
        """
        Apply approved tags to columns

        Args:
            approved_tags: Dict of {table: {column: [tags]}}
            dry_run: If True, don't actually apply tags

        Returns:
            Tuple of (successful, failed) applications
        """
        successful = 0
        failed = 0

        for table_name, columns in approved_tags.items():
            for col_name, tags in columns.items():
                for tag in tags:
                    try:
                        cmd = [
                            'tdx', 'tag', 'set',
                            f"{self.database}.{table_name}",
                            col_name,
                            f"policy_tag={tag}"
                        ]

                        if dry_run:
                            logger.info(f"[DRY RUN] Would execute: {' '.join(cmd)}")
                            successful += 1
                        else:
                            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
                            logger.info(f"Applied tag '{tag}' to {table_name}.{col_name}")
                            successful += 1

                    except subprocess.CalledProcessError as e:
                        logger.error(f"Failed to apply tag '{tag}' to {table_name}.{col_name}: {e.stderr}")
                        failed += 1

        return successful, failed


def load_tagging_rules(rules_file: str) -> Dict:
    """Load custom tagging rules from file"""
    try:
        with open(rules_file, 'r') as f:
            import yaml
            return yaml.safe_load(f) or {}
    except Exception as e:
        logger.warning(f"Failed to load tagging rules from {rules_file}: {e}")
        return {}


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='Automatically tag Treasure Data schema columns'
    )
    parser.add_argument('database', help='Treasure Data database name')
    parser.add_argument('--table', help='Specific table to scan (optional)')
    parser.add_argument('--rules-file', help='Path to custom tagging rules YAML file')
    parser.add_argument('--approve-high', action='store_true',
                       help='Auto-approve HIGH confidence suggestions')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be applied without actually applying tags')
    parser.add_argument('--output-json', help='Save suggestions as JSON to file')
    parser.add_argument('--output-report', help='Save human-readable report to file')

    args = parser.parse_args()

    # Initialize tagger
    custom_rules = load_tagging_rules(args.rules_file) if args.rules_file else None
    tagger = SchemaTagger(args.database, custom_rules)

    # Scan database
    logger.info("Starting schema analysis...")
    tables_data = tagger.scan_database(args.table)

    if not tables_data:
        logger.error("No tables found to analyze")
        sys.exit(1)

    # Generate suggestions
    all_suggestions = {}
    for table_name, columns in tables_data.items():
        table_suggestions = {}
        for column in columns:
            suggestions = tagger.analyze_column(column, table_name)
            if suggestions:
                table_suggestions[column.name] = suggestions

        if table_suggestions:
            all_suggestions[table_name] = table_suggestions

    # Generate report
    report = tagger.generate_report(tables_data, all_suggestions)
    print(report)

    # Save report if requested
    if args.output_report:
        with open(args.output_report, 'w') as f:
            f.write(report)
        logger.info(f"Report saved to {args.output_report}")

    # Save JSON if requested
    if args.output_json:
        json_data = {
            'database': args.database,
            'timestamp': datetime.now().isoformat(),
            'suggestions': {
                table: {
                    col: [
                        {
                            'tag': sugg.tag,
                            'category': sugg.category,
                            'confidence': sugg.confidence,
                            'reason': sugg.reason
                        }
                        for sugg in suggs
                    ]
                    for col, suggs in table_suggestions.items()
                }
                for table, table_suggestions in all_suggestions.items()
            }
        }

        with open(args.output_json, 'w') as f:
            json.dump(json_data, f, indent=2)
        logger.info(f"JSON suggestions saved to {args.output_json}")

    # Handle auto-approval
    if args.approve_high:
        approved_tags = {}
        for table_name, table_suggestions in all_suggestions.items():
            approved_tags[table_name] = {}
            for col_name, suggestions in table_suggestions.items():
                high_conf_tags = [s.tag for s in suggestions if s.confidence == "HIGH"]
                if high_conf_tags:
                    approved_tags[table_name][col_name] = high_conf_tags

        if approved_tags:
            logger.info("Applying HIGH confidence tags...")
            successful, failed = tagger.apply_tags(approved_tags, dry_run=args.dry_run)
            logger.info(f"Applied tags: {successful} successful, {failed} failed")


if __name__ == '__main__':
    main()
