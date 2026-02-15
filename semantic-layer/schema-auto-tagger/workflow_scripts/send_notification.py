#!/usr/bin/env python3
"""
Notification Script for Workflow
Sends Slack notifications about schema tagging results
"""

import os
import sys
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_json_file(file_path: str) -> dict:
    """Load JSON file"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load {file_path}: {e}")
        return {}


def build_slack_message(log: dict, suggestions: dict, session_date: str) -> dict:
    """
    Build Slack message payload

    Args:
        log: Execution log
        suggestions: Suggestions data
        session_date: Session date

    Returns:
        Slack message payload
    """
    s = log.get('summary', {})
    total_sugg = suggestions.get('total_suggestions', 0)
    success_rate = (s.get('applied', 0) / s.get('total_tags', 1) * 100) if s.get('total_tags', 0) > 0 else 0

    # Determine color based on success
    if s.get('failed', 0) == 0 and s.get('applied', 0) > 0:
        color = "good"  # Green
        status_emoji = "✅"
    elif s.get('applied', 0) > 0:
        color = "warning"  # Yellow
        status_emoji = "⚠️"
    else:
        color = "danger"  # Red
        status_emoji = "❌"

    message = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{status_emoji} Schema Auto-Tagging Report"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Database:*\n{log.get('database', 'N/A')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Date:*\n{session_date}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Suggestions Generated:*\n{total_sugg}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Tables Processed:*\n{suggestions.get('total_tables', 0)}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Tags Applied:* {s.get('applied', 0)}/{s.get('total_tags', 0)} ({success_rate:.1f}%)"
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Status:*\n✓ Applied: {s.get('applied', 0)}\n✗ Failed: {s.get('failed', 0)}"
                }
            }
        ],
        "attachments": [
            {
                "color": color,
                "footer": "Schema Auto-Tagger",
                "ts": int(datetime.now().timestamp())
            }
        ]
    }

    # Add failed details if any
    if s.get('failed', 0) > 0:
        failed_text = "*Failed Tags:*\n"
        for table_name, table_log in log.get('details', {}).items():
            for col_name, col_log in table_log.get('columns', {}).items():
                for failure in col_log.get('failed', []):
                    failed_text += f"• `{table_name}.{col_name}`: {failure['tag']}\n"

        message['blocks'].append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": failed_text
            }
        })

    return message


def send_slack_notification(webhook_url: str, message: dict) -> bool:
    """
    Send Slack webhook notification

    Args:
        webhook_url: Slack webhook URL
        message: Message payload

    Returns:
        True if successful
    """
    try:
        import requests
    except ImportError:
        logger.error("requests library not installed")
        return False

    try:
        response = requests.post(webhook_url, json=message, timeout=10)
        response.raise_for_status()
        logger.info("Slack notification sent successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to send Slack notification: {e}")
        return False


def send_email_notification(smtp_config: dict, log: dict, suggestions: dict,
                           session_date: str) -> bool:
    """
    Send email notification

    Args:
        smtp_config: SMTP configuration dict
        log: Execution log
        suggestions: Suggestions data
        session_date: Session date

    Returns:
        True if successful
    """
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
    except ImportError:
        logger.error("Email dependencies not available")
        return False

    try:
        # Build email body
        s = log.get('summary', {})
        total_sugg = suggestions.get('total_suggestions', 0)
        success_rate = (s.get('applied', 0) / s.get('total_tags', 1) * 100) if s.get('total_tags', 0) > 0 else 0

        body = f"""
Schema Auto-Tagging Report
{'=' * 60}

Database: {log.get('database', 'N/A')}
Date: {session_date}
Timestamp: {log.get('timestamp', 'N/A')}

Summary:
  Total Suggestions: {total_sugg}
  Tables Processed: {suggestions.get('total_tables', 0)}
  Tags Applied: {s.get('applied', 0)}/{s.get('total_tags', 0)} ({success_rate:.1f}%)
  Failed: {s.get('failed', 0)}

Status: {'SUCCESS ✓' if s.get('failed', 0) == 0 else 'PARTIAL FAILURE ⚠'}

Details:
{json.dumps(log.get('details', {}), indent=2)}

---
Auto-generated by Schema Auto-Tagger
        """

        # Create message
        msg = MIMEMultipart()
        msg['Subject'] = f"Schema Auto-Tagging Report - {session_date}"
        msg['From'] = smtp_config.get('from', 'noreply@example.com')
        msg['To'] = ', '.join(smtp_config.get('to', []))

        msg.attach(MIMEText(body, 'plain'))

        # Send email
        server = smtplib.SMTP(
            smtp_config.get('host', 'localhost'),
            smtp_config.get('port', 587)
        )
        server.starttls()
        server.login(smtp_config.get('user', ''), smtp_config.get('password', ''))
        server.send_message(msg)
        server.quit()

        logger.info("Email notification sent successfully")
        return True

    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        return False


def main():
    log_file = os.environ.get('LOG_FILE', '/tmp/apply_tags_log.json')
    suggestions_file = os.environ.get('SUGGESTIONS_FILE', '/tmp/suggestions.json')
    session_date = os.environ.get('SESSION_DATE', datetime.now().strftime('%Y-%m-%d'))
    slack_webhook = os.environ.get('SLACK_WEBHOOK')

    # Load data
    logger.info("Loading workflow results")
    log = load_json_file(log_file)
    suggestions = load_json_file(suggestions_file)

    # Send notifications
    if slack_webhook:
        logger.info("Sending Slack notification")
        message = build_slack_message(log, suggestions, session_date)
        send_slack_notification(slack_webhook, message)
    else:
        logger.info("No Slack webhook configured, skipping Slack notification")

    # Email notification (if configured via environment)
    smtp_host = os.environ.get('SMTP_HOST')
    if smtp_host:
        logger.info("Sending email notification")
        smtp_config = {
            'host': smtp_host,
            'port': int(os.environ.get('SMTP_PORT', 587)),
            'user': os.environ.get('SMTP_USER', ''),
            'password': os.environ.get('SMTP_PASSWORD', ''),
            'from': os.environ.get('SMTP_FROM', 'noreply@example.com'),
            'to': os.environ.get('SMTP_TO', 'admin@example.com').split(',')
        }
        send_email_notification(smtp_config, log, suggestions, session_date)
    else:
        logger.info("No email configuration found, skipping email notification")

    logger.info("Notification workflow complete")


if __name__ == '__main__':
    main()
