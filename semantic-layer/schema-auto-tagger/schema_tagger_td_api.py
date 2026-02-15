#!/usr/bin/env python3
"""
Treasure Data API Integration for Schema Auto-Tagger
Provides programmatic tag application and management
"""

import os
import requests
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass
class TagResponse:
    """Response from tag API operation"""
    success: bool
    message: str
    tag_id: Optional[str] = None
    error_code: Optional[str] = None


class TreasureDataTagAPI:
    """
    Treasure Data API client for tag management

    Supports:
    - Creating and managing policy tags
    - Applying tags to columns
    - Querying existing tags
    - Audit logging
    """

    def __init__(self, api_key: Optional[str] = None, endpoint: str = "https://api.treasuredata.com"):
        """
        Initialize TD API client

        Args:
            api_key: Treasure Data API key (defaults to TD_API_KEY env var)
            endpoint: TD API endpoint (us01, eu01, jp01, etc.)
        """
        self.api_key = api_key or os.environ.get('TD_API_KEY')
        self.endpoint = endpoint
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'SchemaTaggerAPI/1.0'
        })

        if not self.api_key:
            raise ValueError("TD_API_KEY not provided and not in environment")

        logger.info(f"Initialized TD API client for {endpoint}")

    def _request(self, method: str, path: str, data: Optional[Dict] = None,
                 params: Optional[Dict] = None, retry_count: int = 3) -> Tuple[int, Dict]:
        """
        Make API request with retry logic

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            path: API path (relative to endpoint)
            data: Request body data
            params: Query parameters
            retry_count: Number of retries on failure

        Returns:
            Tuple of (status_code, response_dict)
        """
        url = f"{self.endpoint}{path}"
        retries = 0

        while retries < retry_count:
            try:
                if method == 'GET':
                    response = self.session.get(url, params=params)
                elif method == 'POST':
                    response = self.session.post(url, json=data, params=params)
                elif method == 'PUT':
                    response = self.session.put(url, json=data, params=params)
                elif method == 'DELETE':
                    response = self.session.delete(url, params=params)
                else:
                    raise ValueError(f"Unsupported method: {method}")

                if response.status_code >= 500:
                    retries += 1
                    wait_time = min(2 ** retries, 30)
                    logger.warning(f"Server error (status {response.status_code}), retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue

                try:
                    return response.status_code, response.json()
                except json.JSONDecodeError:
                    return response.status_code, {'raw': response.text}

            except requests.exceptions.RequestException as e:
                retries += 1
                if retries >= retry_count:
                    logger.error(f"Request failed after {retry_count} attempts: {e}")
                    raise
                wait_time = min(2 ** retries, 30)
                logger.warning(f"Request failed, retrying in {wait_time}s: {e}")
                time.sleep(wait_time)

        raise Exception(f"Request failed after {retry_count} attempts")

    def list_tags(self, database: Optional[str] = None) -> List[Dict]:
        """
        List available policy tags

        Args:
            database: Optional database to filter tags

        Returns:
            List of tag definitions
        """
        try:
            path = "/v4/tags"
            params = {'database': database} if database else {}

            status, response = self._request('GET', path, params=params)

            if status == 200:
                return response.get('tags', [])
            else:
                logger.error(f"Failed to list tags: {response}")
                return []

        except Exception as e:
            logger.error(f"Error listing tags: {e}")
            return []

    def create_tag(self, tag_name: str, description: str = "",
                   category: str = "custom") -> TagResponse:
        """
        Create a new policy tag

        Args:
            tag_name: Name for the tag (e.g., "data_classification:pii")
            description: Tag description
            category: Tag category

        Returns:
            TagResponse with success status
        """
        try:
            path = "/v4/tags"
            data = {
                'name': tag_name,
                'description': description,
                'category': category
            }

            status, response = self._request('POST', path, data=data)

            if status in [200, 201]:
                logger.info(f"Created tag: {tag_name}")
                return TagResponse(
                    success=True,
                    message=f"Tag created: {tag_name}",
                    tag_id=response.get('id')
                )
            else:
                error_msg = response.get('error', {}).get('message', str(response))
                logger.error(f"Failed to create tag: {error_msg}")
                return TagResponse(
                    success=False,
                    message=f"Failed to create tag: {error_msg}",
                    error_code=response.get('error', {}).get('code')
                )

        except Exception as e:
            logger.error(f"Error creating tag: {e}")
            return TagResponse(success=False, message=str(e))

    def apply_tag_to_column(self, database: str, table: str, column: str,
                           tag: str) -> TagResponse:
        """
        Apply a tag to a column

        Args:
            database: Database name
            table: Table name
            column: Column name
            tag: Tag to apply

        Returns:
            TagResponse with success status
        """
        try:
            # TD API endpoint for column tagging
            path = f"/v4/databases/{database}/tables/{table}/columns/{column}/tags"
            data = {
                'tag': tag
            }

            status, response = self._request('POST', path, data=data)

            if status in [200, 201]:
                logger.info(f"Applied tag '{tag}' to {database}.{table}.{column}")
                return TagResponse(
                    success=True,
                    message=f"Tag applied: {tag}"
                )
            else:
                # Check if tag doesn't exist - offer to create it
                if status == 404 and 'tag' in response.get('error', {}).get('message', '').lower():
                    logger.warning(f"Tag '{tag}' not found, creating it...")
                    create_resp = self.create_tag(tag)
                    if create_resp.success:
                        # Retry applying the tag
                        return self.apply_tag_to_column(database, table, column, tag)
                    else:
                        return create_resp

                error_msg = response.get('error', {}).get('message', str(response))
                logger.error(f"Failed to apply tag: {error_msg}")
                return TagResponse(
                    success=False,
                    message=f"Failed to apply tag: {error_msg}",
                    error_code=response.get('error', {}).get('code')
                )

        except Exception as e:
            logger.error(f"Error applying tag: {e}")
            return TagResponse(success=False, message=str(e))

    def get_column_tags(self, database: str, table: str, column: str) -> List[str]:
        """
        Get tags applied to a column

        Args:
            database: Database name
            table: Table name
            column: Column name

        Returns:
            List of tags applied to the column
        """
        try:
            path = f"/v4/databases/{database}/tables/{table}/columns/{column}"
            status, response = self._request('GET', path)

            if status == 200:
                return response.get('policy_tags', [])
            else:
                logger.error(f"Failed to get column tags: {response}")
                return []

        except Exception as e:
            logger.error(f"Error getting column tags: {e}")
            return []

    def remove_tag_from_column(self, database: str, table: str, column: str,
                              tag: str) -> TagResponse:
        """
        Remove a tag from a column

        Args:
            database: Database name
            table: Table name
            column: Column name
            tag: Tag to remove

        Returns:
            TagResponse with success status
        """
        try:
            path = f"/v4/databases/{database}/tables/{table}/columns/{column}/tags/{tag}"
            status, response = self._request('DELETE', path)

            if status in [200, 204]:
                logger.info(f"Removed tag '{tag}' from {database}.{table}.{column}")
                return TagResponse(
                    success=True,
                    message=f"Tag removed: {tag}"
                )
            else:
                error_msg = response.get('error', {}).get('message', str(response))
                logger.error(f"Failed to remove tag: {error_msg}")
                return TagResponse(
                    success=False,
                    message=f"Failed to remove tag: {error_msg}",
                    error_code=response.get('error', {}).get('code')
                )

        except Exception as e:
            logger.error(f"Error removing tag: {e}")
            return TagResponse(success=False, message=str(e))

    def bulk_apply_tags(self, database: str, tag_assignments: Dict[str, Dict[str, List[str]]]) \
            -> Tuple[int, int, List[str]]:
        """
        Apply multiple tags efficiently

        Args:
            database: Database name
            tag_assignments: Dict of {table: {column: [tags]}}

        Returns:
            Tuple of (successful, failed, error_messages)
        """
        successful = 0
        failed = 0
        errors = []

        total = sum(len(cols) for cols in tag_assignments.values() for _ in cols)
        processed = 0

        for table, columns in tag_assignments.items():
            for column, tags in columns.items():
                for tag in tags:
                    processed += 1
                    logger.info(f"[{processed}/{total}] Applying tag to {database}.{table}.{column}")

                    response = self.apply_tag_to_column(database, table, column, tag)

                    if response.success:
                        successful += 1
                    else:
                        failed += 1
                        errors.append(f"{database}.{table}.{column}: {response.message}")

        return successful, failed, errors

    def export_tags_audit_log(self, database: str, table: Optional[str] = None,
                             output_file: Optional[str] = None) -> Dict:
        """
        Export audit log of tag changes

        Args:
            database: Database name
            table: Optional table to filter
            output_file: Optional file to save audit log

        Returns:
            Audit log dictionary
        """
        try:
            path = f"/v4/audit/tags"
            params = {'database': database}
            if table:
                params['table'] = table

            status, response = self._request('GET', path, params=params)

            if status == 200:
                audit_log = {
                    'timestamp': datetime.now().isoformat(),
                    'database': database,
                    'table': table,
                    'changes': response.get('changes', [])
                }

                if output_file:
                    with open(output_file, 'w') as f:
                        json.dump(audit_log, f, indent=2)
                    logger.info(f"Audit log saved to {output_file}")

                return audit_log
            else:
                logger.error(f"Failed to export audit log: {response}")
                return {}

        except Exception as e:
            logger.error(f"Error exporting audit log: {e}")
            return {}

    def validate_tags(self, tags: List[str]) -> Tuple[bool, List[str]]:
        """
        Validate if tags exist in the system

        Args:
            tags: List of tag names to validate

        Returns:
            Tuple of (all_valid, list_of_invalid_tags)
        """
        available_tags = self.list_tags()
        available_tag_names = [tag.get('name') for tag in available_tags]

        invalid_tags = [tag for tag in tags if tag not in available_tag_names]
        all_valid = len(invalid_tags) == 0

        return all_valid, invalid_tags

    def sync_tags_to_catalog(self, database: str, catalog_type: str = "collibra",
                            catalog_endpoint: Optional[str] = None,
                            catalog_api_key: Optional[str] = None) -> Tuple[int, str]:
        """
        Sync tags to external data catalog

        Args:
            database: Database name
            catalog_type: Type of catalog (collibra, alation, etc.)
            catalog_endpoint: Catalog API endpoint
            catalog_api_key: Catalog API key

        Returns:
            Tuple of (synced_count, status_message)
        """
        try:
            # Implementation depends on catalog type
            if catalog_type == "collibra":
                return self._sync_to_collibra(database, catalog_endpoint, catalog_api_key)
            elif catalog_type == "alation":
                return self._sync_to_alation(database, catalog_endpoint, catalog_api_key)
            else:
                return 0, f"Unsupported catalog type: {catalog_type}"

        except Exception as e:
            logger.error(f"Error syncing tags: {e}")
            return 0, f"Sync failed: {str(e)}"

    def _sync_to_collibra(self, database: str, endpoint: str, api_key: str) -> Tuple[int, str]:
        """Sync tags to Collibra"""
        logger.info(f"Syncing tags to Collibra for {database}")
        # Collibra API integration would go here
        return 0, "Collibra sync not yet implemented"

    def _sync_to_alation(self, database: str, endpoint: str, api_key: str) -> Tuple[int, str]:
        """Sync tags to Alation"""
        logger.info(f"Syncing tags to Alation for {database}")
        # Alation API integration would go here
        return 0, "Alation sync not yet implemented"

    def create_tag_policy(self, policy_name: str, tags: List[str],
                         access_level: str = "restricted") -> TagResponse:
        """
        Create a tag-based access policy

        Args:
            policy_name: Name for the policy
            tags: List of tags included in policy
            access_level: Access level (restricted, internal, public)

        Returns:
            TagResponse with policy creation status
        """
        try:
            path = "/v4/policies"
            data = {
                'name': policy_name,
                'type': 'tag_based',
                'tags': tags,
                'access_level': access_level
            }

            status, response = self._request('POST', path, data=data)

            if status in [200, 201]:
                logger.info(f"Created tag policy: {policy_name}")
                return TagResponse(
                    success=True,
                    message=f"Policy created: {policy_name}",
                    tag_id=response.get('id')
                )
            else:
                error_msg = response.get('error', {}).get('message', str(response))
                logger.error(f"Failed to create policy: {error_msg}")
                return TagResponse(
                    success=False,
                    message=f"Failed to create policy: {error_msg}"
                )

        except Exception as e:
            logger.error(f"Error creating tag policy: {e}")
            return TagResponse(success=False, message=str(e))

    def generate_compliance_report(self, database: str, output_file: str,
                                  tags_to_check: Optional[List[str]] = None) -> bool:
        """
        Generate compliance report showing tagged columns

        Args:
            database: Database name
            output_file: File to save report
            tags_to_check: Optional list of tags to filter report

        Returns:
            True if report generated successfully
        """
        try:
            path = f"/v4/reports/compliance"
            params = {'database': database}

            status, response = self._request('GET', path, params=params)

            if status == 200:
                report = {
                    'timestamp': datetime.now().isoformat(),
                    'database': database,
                    'summary': response.get('summary', {}),
                    'columns': response.get('columns', [])
                }

                # Filter by tags if specified
                if tags_to_check:
                    report['columns'] = [
                        col for col in report['columns']
                        if any(tag in col.get('tags', []) for tag in tags_to_check)
                    ]

                with open(output_file, 'w') as f:
                    json.dump(report, f, indent=2)

                logger.info(f"Compliance report saved to {output_file}")
                return True
            else:
                logger.error(f"Failed to generate report: {response}")
                return False

        except Exception as e:
            logger.error(f"Error generating report: {e}")
            return False


def main():
    import argparse

    parser = argparse.ArgumentParser(description='TD Schema Tag API Integration')
    parser.add_argument('--api-key', help='Treasure Data API key')
    parser.add_argument('--database', required=True, help='Database name')
    parser.add_argument('--command', required=True,
                       choices=['list-tags', 'create-tag', 'apply-tags', 'validate', 'audit-log', 'compliance-report'],
                       help='Command to execute')
    parser.add_argument('--tag', help='Tag name')
    parser.add_argument('--tags-file', help='JSON file with tag assignments')
    parser.add_argument('--output-file', help='Output file for reports/logs')
    parser.add_argument('--table', help='Table name (for filtering)')
    parser.add_argument('--column', help='Column name')

    args = parser.parse_args()

    # Initialize API client
    api = TreasureDataTagAPI(api_key=args.api_key)

    # Execute command
    if args.command == 'list-tags':
        tags = api.list_tags(database=args.table)
        print(json.dumps(tags, indent=2))

    elif args.command == 'create-tag':
        if not args.tag:
            print("Error: --tag required for create-tag command")
            sys.exit(1)
        response = api.create_tag(args.tag)
        print(f"Status: {response.success}\nMessage: {response.message}")

    elif args.command == 'apply-tags':
        if not args.tags_file:
            print("Error: --tags-file required for apply-tags command")
            sys.exit(1)
        with open(args.tags_file, 'r') as f:
            tag_assignments = json.load(f)
        successful, failed, errors = api.bulk_apply_tags(args.database, tag_assignments)
        print(f"Applied: {successful} successful, {failed} failed")
        if errors:
            print("Errors:")
            for error in errors[:10]:  # Show first 10 errors
                print(f"  - {error}")

    elif args.command == 'validate':
        if not args.tags_file:
            print("Error: --tags-file required for validate command")
            sys.exit(1)
        with open(args.tags_file, 'r') as f:
            tags_to_validate = json.load(f).get('tags', [])
        valid, invalid = api.validate_tags(tags_to_validate)
        print(f"Valid: {valid}\nInvalid tags: {invalid}")

    elif args.command == 'audit-log':
        api.export_tags_audit_log(args.database, table=args.table, output_file=args.output_file)

    elif args.command == 'compliance-report':
        if not args.output_file:
            print("Error: --output-file required for compliance-report command")
            sys.exit(1)
        success = api.generate_compliance_report(args.database, args.output_file)
        print(f"Report generation: {'Success' if success else 'Failed'}")


if __name__ == '__main__':
    main()
