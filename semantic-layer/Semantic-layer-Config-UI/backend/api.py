"""
Backend API for Semantic Layer Config UI
Handles config saves and workflow deployment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import yaml
import os
import subprocess
import json
from typing import Dict, Any
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
CONFIG_PATH = os.environ.get('CONFIG_PATH', './config.yaml')
WORKFLOW_GENERATOR_PATH = os.environ.get(
    'WORKFLOW_GENERATOR_PATH',
    './workflow_generator.py'
)
WORKFLOW_PROJECT_NAME = os.environ.get('WORKFLOW_PROJECT_NAME', 'semantic_layer_sync')


@app.route('/api/semantic-layer/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    try:
        if not os.path.exists(CONFIG_PATH):
            return jsonify({
                "error": "Configuration file not found"
            }), 404

        with open(CONFIG_PATH, 'r') as f:
            config = yaml.safe_load(f)

        return jsonify(config)

    except Exception as e:
        return jsonify({
            "error": f"Failed to load configuration: {str(e)}"
        }), 500


@app.route('/api/semantic-layer/config', methods=['POST'])
def save_config():
    """
    Save configuration and optionally deploy workflow

    Request body: {
        "config": { ... },
        "deploy_workflow": boolean (optional, default: true if schedule enabled)
    }

    Response: {
        "success": boolean,
        "message": string,
        "config_saved": boolean,
        "workflow_deployed": boolean,
        "workflow_deployment_details": { ... } (if deployed)
    }
    """
    try:
        data = request.get_json()

        if not data or 'config' not in data:
            return jsonify({
                "success": False,
                "error": "Missing config in request body"
            }), 400

        config = data['config']

        # Validate config structure (basic validation)
        required_fields = ['version', 'scope', 'semantic_database', 'sync']
        for field in required_fields:
            if field not in config:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400

        # Save config.yaml
        config_dir = os.path.dirname(CONFIG_PATH)
        if config_dir and not os.path.exists(config_dir):
            os.makedirs(config_dir)

        with open(CONFIG_PATH, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)

        print(f"✅ Config saved to {CONFIG_PATH}")

        response = {
            "success": True,
            "message": "Configuration saved successfully",
            "config_saved": True,
            "workflow_deployed": False
        }

        # Check if workflow deployment is needed
        schedule_config = config.get('sync', {}).get('schedule', {})
        schedule_enabled = schedule_config.get('enabled', False)

        # Determine if we should deploy workflow
        deploy_workflow = data.get('deploy_workflow', schedule_enabled)

        if deploy_workflow:
            print("🚀 Deploying workflow to Treasure Data...")

            # Run workflow generator
            deployment_result = deploy_workflow_to_td(CONFIG_PATH)

            response["workflow_deployed"] = deployment_result["success"]
            response["workflow_deployment_details"] = deployment_result

            if deployment_result["success"]:
                response["message"] = "Configuration saved and workflow deployed successfully"
            else:
                response["message"] = f"Configuration saved but workflow deployment failed: {deployment_result['message']}"
                response["success"] = False

        return jsonify(response)

    except yaml.YAMLError as e:
        return jsonify({
            "success": False,
            "error": f"Invalid YAML format: {str(e)}"
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to save configuration: {str(e)}"
        }), 500


def deploy_workflow_to_td(config_path: str) -> Dict[str, Any]:
    """
    Deploy workflow to Treasure Data using workflow_generator.py

    Returns: {
        "success": boolean,
        "message": string,
        "workflow_path": string,
        "stdout": string,
        "stderr": string
    }
    """
    try:
        # Check if workflow generator exists
        if not os.path.exists(WORKFLOW_GENERATOR_PATH):
            return {
                "success": False,
                "message": f"Workflow generator not found: {WORKFLOW_GENERATOR_PATH}",
                "workflow_path": None
            }

        # Run workflow generator with --push and --json flags
        result = subprocess.run(
            [
                'python3',
                WORKFLOW_GENERATOR_PATH,
                '--config', config_path,
                '--push',
                '--project', WORKFLOW_PROJECT_NAME,
                '--json'
            ],
            capture_output=True,
            text=True,
            timeout=120
        )

        # Parse JSON output from workflow generator
        if result.stdout:
            try:
                output = json.loads(result.stdout)
                return output
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "success": result.returncode == 0,
                    "message": result.stdout or result.stderr,
                    "stdout": result.stdout,
                    "stderr": result.stderr
                }
        else:
            return {
                "success": False,
                "message": result.stderr or "Workflow deployment failed",
                "stdout": result.stdout,
                "stderr": result.stderr
            }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "message": "Workflow deployment timed out (120s)",
            "workflow_path": None
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Workflow deployment error: {str(e)}",
            "workflow_path": None
        }


@app.route('/api/semantic-layer/workflow/status', methods=['GET'])
def get_workflow_status():
    """Get current workflow status from Treasure Data"""
    try:
        # Get latest workflow sessions
        result = subprocess.run(
            ['tdx', 'wf', 'sessions', WORKFLOW_PROJECT_NAME, '--limit', '5'],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            return jsonify({
                "success": True,
                "sessions": result.stdout
            })
        else:
            return jsonify({
                "success": False,
                "error": result.stderr
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Failed to get workflow status: {str(e)}"
        }), 500


@app.route('/api/semantic-layer/workflow/validate', methods=['POST'])
def validate_workflow():
    """Validate workflow configuration without deploying"""
    try:
        data = request.get_json()

        if not data or 'config' not in data:
            return jsonify({
                "success": False,
                "error": "Missing config in request body"
            }), 400

        config = data['config']

        # Save to temporary file
        temp_config_path = '/tmp/semantic_layer_config_temp.yaml'
        with open(temp_config_path, 'w') as f:
            yaml.dump(config, f)

        # Generate workflow without pushing
        result = subprocess.run(
            [
                'python3',
                WORKFLOW_GENERATOR_PATH,
                '--config', temp_config_path,
                '--output', '/tmp/semantic_layer_sync_temp.dig',
                '--json'
            ],
            capture_output=True,
            text=True,
            timeout=30
        )

        # Parse result
        if result.stdout:
            try:
                output = json.loads(result.stdout)
                return jsonify(output)
            except json.JSONDecodeError:
                return jsonify({
                    "success": result.returncode == 0,
                    "message": result.stdout or result.stderr
                })
        else:
            return jsonify({
                "success": False,
                "error": result.stderr or "Validation failed"
            }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Validation error: {str(e)}"
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "config_path": CONFIG_PATH,
        "workflow_generator_path": WORKFLOW_GENERATOR_PATH,
        "workflow_project": WORKFLOW_PROJECT_NAME
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'

    print(f"""
╔═══════════════════════════════════════════════════════════════╗
║  Semantic Layer Config API Server                             ║
╚═══════════════════════════════════════════════════════════════╝

📁 Config Path: {CONFIG_PATH}
🔧 Workflow Generator: {WORKFLOW_GENERATOR_PATH}
📦 Workflow Project: {WORKFLOW_PROJECT_NAME}
🌐 Port: {port}

Endpoints:
  GET  /api/semantic-layer/config          - Get configuration
  POST /api/semantic-layer/config          - Save & deploy workflow
  GET  /api/semantic-layer/workflow/status - Get workflow status
  POST /api/semantic-layer/workflow/validate - Validate configuration
  GET  /health                             - Health check

Starting server...
    """)

    app.run(host='0.0.0.0', port=port, debug=debug)
