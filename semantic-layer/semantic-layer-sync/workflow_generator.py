#!/usr/bin/env python3
"""
Workflow Generator for Semantic Layer Sync
Generates TD Workflow .dig file from config.yaml and deploys to Treasure Data

SECURITY: Input validation added to prevent command injection attacks
"""

import yaml
import subprocess
import os
import sys
import json
import re
from typing import Dict, Any, Optional
from pathlib import Path


# ============================================================================
# INPUT VALIDATION & SECURITY
# ============================================================================
class InputValidator:
    """Validate user inputs to prevent command injection"""

    @staticmethod
    def validate_project_name(name: str) -> str:
        """Validate project name for shell safety.

        Args:
            name: Project name to validate

        Returns:
            Validated project name

        Raises:
            ValueError: If project name is invalid
        """
        if not isinstance(name, str):
            raise ValueError(f"Project name must be string, got {type(name).__name__}")

        if not name:
            raise ValueError("Project name cannot be empty")

        if len(name) > 100:
            raise ValueError(f"Project name too long (max 100 chars): {len(name)}")

        # Only allow alphanumeric, underscore, and hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', name):
            raise ValueError(
                f"Invalid project name '{name}'. "
                "Only alphanumeric characters, underscores, and hyphens are allowed."
            )

        return name

    @staticmethod
    def validate_file_path(path: str, must_exist: bool = False) -> Path:
        """Validate file path for security.

        Args:
            path: File path to validate
            must_exist: If True, verify file exists

        Returns:
            Validated Path object

        Raises:
            ValueError: If path is invalid
        """
        if not isinstance(path, str):
            raise ValueError(f"Path must be string, got {type(path).__name__}")

        if not path:
            raise ValueError("Path cannot be empty")

        # Convert to Path object and resolve
        try:
            path_obj = Path(path).resolve()
        except Exception as e:
            raise ValueError(f"Invalid path '{path}': {e}")

        # Check if path contains suspicious patterns
        path_str = str(path_obj)
        suspicious_patterns = ['..', '~', '$', '`', ';', '|', '&', '\n', '\r']
        for pattern in suspicious_patterns:
            if pattern in path_str:
                raise ValueError(f"Path contains suspicious pattern '{pattern}': {path}")

        if must_exist and not path_obj.exists():
            raise ValueError(f"Path does not exist: {path}")

        return path_obj


class WorkflowGenerator:
    """Generate and deploy TD Workflow from config.yaml"""

    def __init__(self, config_path: str = "config.yaml"):
        self.config_path = config_path
        self.config = self.load_config()

    def load_config(self) -> Dict[str, Any]:
        """Load semantic layer config"""
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Config file not found: {self.config_path}")

        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)

    def generate_schedule_block(self) -> str:
        """
        Generate digdag schedule block from config

        Returns schedule string like:
        - "schedule:\n  daily>: 02:00:00\n"
        - "schedule:\n  hourly>: 00:00\n"
        - "# Manual execution only\n"
        """
        sync_config = self.config.get('sync', {})
        schedule_config = sync_config.get('schedule', {})

        if not schedule_config.get('enabled', False):
            return "# Manual execution only - no schedule\n"

        frequency = schedule_config.get('frequency', 'manual')

        if frequency == 'manual':
            return "# Manual execution only\n"

        elif frequency == 'hourly':
            return "schedule:\n  hourly>: 00:00\n"

        elif frequency == 'daily':
            time = schedule_config.get('time', '02:00:00')
            return f"schedule:\n  daily>: {time}\n"

        elif frequency == 'weekly':
            time = schedule_config.get('time', '02:00:00')
            day = schedule_config.get('day_of_week', 'Monday')
            return f"schedule:\n  weekly>: {day},{time}\n"

        elif frequency == 'custom':
            cron = schedule_config.get('cron_expression', '0 2 * * *')
            return f"schedule:\n  cron>: \"{cron}\"\n"

        else:
            raise ValueError(f"Unknown frequency: {frequency}")

    def generate_notification_blocks(self) -> tuple[str, str]:
        """
        Generate notification blocks for errors and success

        Returns: (error_notification, success_notification)
        """
        notifications = self.config.get('notifications', {})

        # Error notification
        error_notification = ""
        if notifications.get('on_error', {}).get('enabled', False):
            channels = notifications['on_error'].get('channels', [])
            for channel in channels:
                if channel['type'] == 'slack':
                    webhook = channel.get('channel', '${secret:slack_webhook}')
                    message = channel.get('message_template', """❌ Semantic Layer Sync Failed
Session: ${session_id}
Attempt: ${attempt_id}
Workflow: ${workflow_name}""")
                    error_notification = f"""
_error:
  slack:
    webhook_url: {webhook}
    message: |
{self._indent(message, 6)}
"""
                elif channel['type'] == 'email':
                    recipients = ','.join(channel.get('recipients', []))
                    subject = channel.get('subject', 'Semantic Layer Sync Failed')
                    error_notification = f"""
_error:
  mail>:
    to: {recipients}
    subject: {subject}
"""

        # Success notification
        success_notification = ""
        if notifications.get('on_sync_complete', {}).get('enabled', False):
            channels = notifications['on_sync_complete'].get('channels', [])
            for channel in channels:
                if channel['type'] == 'slack':
                    webhook = channel.get('channel', '${secret:slack_webhook}')
                    message = channel.get('message_template', """✅ Semantic Layer Synced
New Tables: ${sync_metadata.new_tables}
New Columns: ${sync_metadata.new_columns}
Auto-Generated: ${sync_metadata.auto_gen_count}""")
                    success_notification = f"""    +notify_success:
      slack:
        webhook_url: {webhook}
        message: |
{self._indent(message, 10)}
"""

        return error_notification, success_notification

    def _indent(self, text: str, spaces: int) -> str:
        """Indent text by specified number of spaces"""
        indent = ' ' * spaces
        return '\n'.join(indent + line for line in text.split('\n'))

    def generate_workflow_file(self, output_path: str = "semantic_layer_sync.dig") -> str:
        """Generate complete .dig workflow file with path validation"""

        # SECURITY: Validate output path
        try:
            output_path_obj = InputValidator.validate_file_path(output_path, must_exist=False)
        except ValueError as e:
            raise ValueError(f"Invalid output path: {e}")

        sync_config = self.config.get('sync', {})
        scope_config = self.config.get('scope', {})
        semantic_db = self.config.get('semantic_database', {})

        # Generate components
        schedule_block = self.generate_schedule_block()
        error_notification, success_notification = self.generate_notification_blocks()

        # Determine sync mode
        sync_mode = sync_config.get('sync_mode', 'full')

        # Get database patterns
        databases = ','.join(scope_config.get('databases', ['gld_*']))

        # Build .dig file content
        dig_content = f"""# ============================================================================
# Semantic Layer Sync Workflow
# Generated automatically from config.yaml
# Last Updated: $(date)
# DO NOT EDIT MANUALLY - Changes will be overwritten
# ============================================================================

timezone: UTC

{schedule_block}
_export:
  td:
    database: {semantic_db.get('name', 'semantic_layer_v1')}
  py:
    python: python3
{error_notification}

# ============================================================================
# Main Workflow Tasks
# ============================================================================

+detect_schema_changes:
  py>: tasks.detect_schema_changes
  database: ${{td.database}}
  golden_pattern: "{databases}"
  sync_mode: "{sync_mode}"
  docker:
    image: "python:3.9"
  _env:
    TD_API_KEY: ${{secret:td_api_key}}
    TD_API_SERVER: ${{secret:td_api_server}}

+check_for_changes:
  if>: ${{detect_schema_changes.has_changes}}
  _do:
    +sync_metadata:
      sh>: python semantic_layer_sync.py --config config.yaml --apply --approve -v
      docker:
        image: "python:3.9"
      _env:
        TD_API_KEY: ${{secret:td_api_key}}
        TD_API_SERVER: ${{secret:td_api_server}}

    +generate_report:
      td>: queries/delta_report.sql
      database: ${{td.database}}
      store_last_results: true
{success_notification}

+no_changes:
  if>: ${{!detect_schema_changes.has_changes}}
  _do:
    echo>: "No schema changes detected. Skipping sync."
"""

        # Write to file
        output_dir = output_path_obj.parent
        if not output_dir.exists():
            output_dir.mkdir(parents=True, exist_ok=True)

        with open(output_path_obj, 'w') as f:
            f.write(dig_content)

        print(f"✅ Generated workflow file: {output_path_obj}")
        return str(output_path_obj)

    def validate_tdx_installed(self) -> bool:
        """Check if tdx CLI is installed"""
        result = subprocess.run(['which', 'tdx'], capture_output=True)
        return result.returncode == 0

    def push_workflow_to_td(
        self,
        workflow_path: str,
        project_name: str = "semantic_layer_sync"
    ) -> Dict[str, Any]:
        """
        Push generated workflow to Treasure Data with input validation

        Args:
            workflow_path: Path to workflow file
            project_name: TD workflow project name

        Returns: {
            "success": bool,
            "message": str,
            "stdout": str,
            "stderr": str
        }
        """

        # SECURITY: Validate all inputs before passing to subprocess
        try:
            # Validate project name (prevent command injection)
            project_name = InputValidator.validate_project_name(project_name)
        except ValueError as e:
            return {
                "success": False,
                "message": f"Invalid project name: {e}",
                "stdout": "",
                "stderr": str(e)
            }

        try:
            # Validate workflow path
            workflow_path_obj = InputValidator.validate_file_path(workflow_path, must_exist=True)
        except ValueError as e:
            return {
                "success": False,
                "message": f"Invalid workflow path: {e}",
                "stdout": "",
                "stderr": str(e)
            }

        if not self.validate_tdx_installed():
            return {
                "success": False,
                "message": "tdx CLI not found. Please install tdx.",
                "stdout": "",
                "stderr": "tdx command not found"
            }

        # Push workflow
        print(f"📤 Pushing workflow to TD project: {project_name}")

        workflow_dir = workflow_path_obj.parent

        try:
            # SECURITY: Use array form (no shell interpretation)
            # Pass arguments as list, not string - prevents injection
            result = subprocess.run(
                ['tdx', 'wf', 'push', project_name],
                cwd=str(workflow_dir),
                capture_output=True,
                text=True,
                timeout=60,
                shell=False  # CRITICAL: Never use shell=True with user input
            )

            if result.returncode == 0:
                print(f"✅ Workflow pushed successfully")
                print(result.stdout)
                return {
                    "success": True,
                    "message": "Workflow deployed successfully",
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
            else:
                print(f"❌ Failed to push workflow")
                print(result.stderr)
                return {
                    "success": False,
                    "message": "Failed to deploy workflow",
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "message": "Workflow push timed out (60s)",
                "stdout": "",
                "stderr": "Command timed out"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Unexpected error during workflow push: {str(e)}",
                "stdout": "",
                "stderr": str(e)
            }


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate and deploy TD Workflow from config.yaml'
    )
    parser.add_argument(
        '--config',
        default='config.yaml',
        help='Path to config.yaml'
    )
    parser.add_argument(
        '--output',
        default='semantic_layer_sync.dig',
        help='Output .dig file path'
    )
    parser.add_argument(
        '--push',
        action='store_true',
        help='Automatically push to Treasure Data'
    )
    parser.add_argument(
        '--project',
        default='semantic_layer_sync',
        help='TD workflow project name'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON (for API integration)'
    )

    args = parser.parse_args()

    try:
        # Initialize generator
        generator = WorkflowGenerator(args.config)

        # Generate workflow
        workflow_path = generator.generate_workflow_file(args.output)

        result = {
            "success": True,
            "workflow_generated": True,
            "workflow_path": workflow_path,
            "workflow_pushed": False
        }

        # Push to TD if requested
        if args.push:
            push_result = generator.push_workflow_to_td(workflow_path, args.project)
            result.update(push_result)
            result["workflow_pushed"] = push_result["success"]

        # Output results
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            if not args.push:
                print(f"\n💡 To push to TD, run:")
                print(f"   python workflow_generator.py --config {args.config} --push")

        sys.exit(0 if result["success"] else 1)

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "workflow_generated": False,
            "workflow_pushed": False
        }

        if args.json:
            print(json.dumps(error_result, indent=2))
        else:
            print(f"❌ Error: {e}", file=sys.stderr)

        sys.exit(1)


if __name__ == '__main__':
    main()
