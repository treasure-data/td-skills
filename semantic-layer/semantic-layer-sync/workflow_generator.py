#!/usr/bin/env python3
"""
Workflow Generator for Semantic Layer Sync
Generates TD Workflow .dig file from config.yaml and deploys to Treasure Data
"""

import yaml
import subprocess
import os
import sys
import json
from typing import Dict, Any, Optional
from pathlib import Path


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
        """Generate complete .dig workflow file"""

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
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        with open(output_path, 'w') as f:
            f.write(dig_content)

        print(f"✅ Generated workflow file: {output_path}")
        return output_path

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
        Push generated workflow to Treasure Data

        Returns: {
            "success": bool,
            "message": str,
            "stdout": str,
            "stderr": str
        }
        """

        # Validate inputs
        if not os.path.exists(workflow_path):
            return {
                "success": False,
                "message": f"Workflow file not found: {workflow_path}",
                "stdout": "",
                "stderr": ""
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

        workflow_dir = os.path.dirname(workflow_path) or '.'

        result = subprocess.run(
            ['tdx', 'wf', 'push', project_name],
            cwd=workflow_dir,
            capture_output=True,
            text=True,
            timeout=60
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
