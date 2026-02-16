"""
Backend API for Semantic Layer Config UI
Handles config saves and workflow deployment

SECURITY: JWT/API Key authentication, CORS configured, rate limiting, path validation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import yaml
import os
import sys
import subprocess
import json
from typing import Dict, Any
from pathlib import Path
import re

# Add parent directory to path for shared modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../shared'))
from auth_middleware import require_auth, optional_auth, init_auth

app = Flask(__name__)

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

# CORS Configuration - Whitelist specific origins only
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-API-Key"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 600
    },
    r"/health": {
        "origins": "*",  # Health check can be public
        "methods": ["GET"]
    }
})

# Rate Limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv('REDIS_URL', 'memory://')
)

# Request body size limit
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Security Headers
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    if os.getenv('ENVIRONMENT') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response


# ============================================================================
# PATH VALIDATION (SECURITY)
# ============================================================================
class PathValidator:
    """Validate file paths to prevent path traversal attacks"""

    ALLOWED_CONFIG_DIR = Path(os.getenv('ALLOWED_CONFIG_DIR', './configs')).resolve()
    ALLOWED_WORKFLOW_DIR = Path(os.getenv('ALLOWED_WORKFLOW_DIR', './workflows')).resolve()

    @staticmethod
    def validate_config_path(path: str) -> Path:
        """Validate config file path

        Args:
            path: Path to validate

        Returns:
            Validated Path object

        Raises:
            ValueError: If path is invalid or outside allowed directory
        """
        if not isinstance(path, str):
            raise ValueError(f"Path must be string, got {type(path).__name__}")

        if not path:
            raise ValueError("Path cannot be empty")

        # Resolve to absolute path
        try:
            abs_path = Path(path).resolve()
        except Exception as e:
            raise ValueError(f"Invalid path '{path}': {e}")

        # Check if path contains suspicious patterns
        path_str = str(abs_path)
        suspicious_patterns = ['..', '~', '$', '`', ';', '|', '&', '\n', '\r']
        for pattern in suspicious_patterns:
            if pattern in path_str:
                raise ValueError(f"Path contains suspicious pattern '{pattern}': {path}")

        # Verify path is within allowed directory
        try:
            abs_path.relative_to(PathValidator.ALLOWED_CONFIG_DIR)
        except ValueError:
            raise ValueError(
                f"Path '{path}' is outside allowed directory '{PathValidator.ALLOWED_CONFIG_DIR}'. "
                "Set ALLOWED_CONFIG_DIR environment variable to change allowed directory."
            )

        return abs_path

    @staticmethod
    def validate_workflow_path(path: str) -> Path:
        """Validate workflow file path"""
        if not isinstance(path, str):
            raise ValueError(f"Path must be string, got {type(path).__name__}")

        if not path:
            raise ValueError("Path cannot be empty")

        try:
            abs_path = Path(path).resolve()
        except Exception as e:
            raise ValueError(f"Invalid path '{path}': {e}")

        # Check suspicious patterns
        path_str = str(abs_path)
        suspicious_patterns = ['..', '~', '$', '`', ';', '|', '&', '\n', '\r']
        for pattern in suspicious_patterns:
            if pattern in path_str:
                raise ValueError(f"Path contains suspicious pattern '{pattern}': {path}")

        # Verify path is within allowed directory
        try:
            abs_path.relative_to(PathValidator.ALLOWED_WORKFLOW_DIR)
        except ValueError:
            raise ValueError(
                f"Path '{path}' is outside allowed directory '{PathValidator.ALLOWED_WORKFLOW_DIR}'"
            )

        return abs_path


# Configuration with path validation
try:
    CONFIG_PATH = PathValidator.validate_config_path(
        os.environ.get('CONFIG_PATH', './configs/config.yaml')
    )
except ValueError as e:
    print(f"⚠️  WARNING: Invalid CONFIG_PATH: {e}")
    print("   Using default: ./configs/config.yaml")
    CONFIG_PATH = Path('./configs/config.yaml')

try:
    WORKFLOW_GENERATOR_PATH = PathValidator.validate_workflow_path(
        os.environ.get('WORKFLOW_GENERATOR_PATH', './workflows/workflow_generator.py')
    )
except ValueError as e:
    print(f"⚠️  WARNING: Invalid WORKFLOW_GENERATOR_PATH: {e}")
    print("   Using default: ./workflows/workflow_generator.py")
    WORKFLOW_GENERATOR_PATH = Path('./workflows/workflow_generator.py')

WORKFLOW_PROJECT_NAME = os.environ.get('WORKFLOW_PROJECT_NAME', 'semantic_layer_sync')

# Validate project name
if not re.match(r'^[a-zA-Z0-9_-]+$', WORKFLOW_PROJECT_NAME):
    print(f"⚠️  WARNING: Invalid WORKFLOW_PROJECT_NAME: {WORKFLOW_PROJECT_NAME}")
    print("   Only alphanumeric, underscore, and hyphen allowed")
    WORKFLOW_PROJECT_NAME = 'semantic_layer_sync'


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
@limiter.exempt
def health_check():
    """Health check endpoint (public, no auth required)"""
    return jsonify({
        "status": "healthy",
        "config_path": str(CONFIG_PATH),
        "workflow_generator_path": str(WORKFLOW_GENERATOR_PATH),
        "workflow_project": WORKFLOW_PROJECT_NAME
    })


@app.route('/api/semantic-layer/config', methods=['GET'])
@require_auth(auth_type='auto')
@limiter.limit("30 per minute")
def get_config():
    """Get current configuration

    REQUIRES AUTHENTICATION: JWT token or API key
    """
    try:
        if not CONFIG_PATH.exists():
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
@require_auth(auth_type='auto')
@limiter.limit("10 per minute")  # Stricter limit for write operations
def save_config():
    """Save configuration and optionally deploy workflow

    REQUIRES AUTHENTICATION: JWT token or API key
    RATE LIMITED: 10 requests per minute

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
        config_dir = CONFIG_PATH.parent
        if not config_dir.exists():
            config_dir.mkdir(parents=True, exist_ok=True)

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
            deployment_result = deploy_workflow_to_td(str(CONFIG_PATH))

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
    """Deploy workflow to Treasure Data using workflow_generator.py

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
        if not WORKFLOW_GENERATOR_PATH.exists():
            return {
                "success": False,
                "message": f"Workflow generator not found: {WORKFLOW_GENERATOR_PATH}",
                "workflow_path": None
            }

        # Run workflow generator with --push and --json flags
        # SECURITY: Use array form (no shell)
        result = subprocess.run(
            [
                'python3',
                str(WORKFLOW_GENERATOR_PATH),
                '--config', config_path,
                '--push',
                '--project', WORKFLOW_PROJECT_NAME,
                '--json'
            ],
            capture_output=True,
            text=True,
            timeout=120,
            shell=False  # CRITICAL: Never use shell with user input
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
@require_auth(auth_type='auto')
@limiter.limit("30 per minute")
def get_workflow_status():
    """Get current workflow status from Treasure Data

    REQUIRES AUTHENTICATION: JWT token or API key
    """
    try:
        # Get latest workflow sessions
        # SECURITY: Use array form
        result = subprocess.run(
            ['tdx', 'wf', 'sessions', WORKFLOW_PROJECT_NAME, '--limit', '5'],
            capture_output=True,
            text=True,
            timeout=30,
            shell=False
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
@require_auth(auth_type='auto')
@limiter.limit("20 per minute")
def validate_workflow():
    """Validate workflow configuration without deploying

    REQUIRES AUTHENTICATION: JWT token or API key
    """
    try:
        data = request.get_json()

        if not data or 'config' not in data:
            return jsonify({
                "success": False,
                "error": "Missing config in request body"
            }), 400

        config = data['config']

        # Save to temporary file in allowed directory
        import tempfile
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.yaml',
            delete=False,
            dir=str(PathValidator.ALLOWED_CONFIG_DIR)
        ) as f:
            temp_config_path = f.name
            yaml.dump(config, f)

        try:
            # Generate workflow without pushing
            # SECURITY: Use array form
            result = subprocess.run(
                [
                    'python3',
                    str(WORKFLOW_GENERATOR_PATH),
                    '--config', temp_config_path,
                    '--output', '/tmp/semantic_layer_sync_temp.dig',
                    '--json'
                ],
                capture_output=True,
                text=True,
                timeout=30,
                shell=False
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

        finally:
            # Clean up temp file
            try:
                os.unlink(temp_config_path)
            except:
                pass

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Validation error: {str(e)}"
        }), 500


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    # Initialize authentication system
    print("Initializing Semantic Layer Config API...")
    print("=" * 70)

    # Create allowed directories if they don't exist
    PathValidator.ALLOWED_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    PathValidator.ALLOWED_WORKFLOW_DIR.mkdir(parents=True, exist_ok=True)

    # Load authentication configuration
    init_auth()

    # Get configuration from environment
    port = int(os.getenv('PORT', 5000))
    environment = os.getenv('ENVIRONMENT', 'development')

    # SECURITY: Never allow debug mode in production
    debug = False
    if environment == 'development':
        debug_env = os.getenv('DEBUG', 'false').lower()
        if debug_env == 'true':
            print("⚠️  WARNING: Debug mode enabled (development only)")
            debug = True
    elif environment == 'production' and os.getenv('DEBUG', 'false').lower() == 'true':
        print("❌ ERROR: DEBUG=true is NOT allowed in production!")
        print("   Set ENVIRONMENT=production and DEBUG=false")
        sys.exit(1)

    # Print configuration
    print(f"Environment: {environment}")
    print(f"Port: {port}")
    print(f"Debug mode: {debug}")
    print(f"CORS origins: {', '.join(ALLOWED_ORIGINS)}")
    print(f"Config path: {CONFIG_PATH}")
    print(f"Workflow generator: {WORKFLOW_GENERATOR_PATH}")
    print(f"Workflow project: {WORKFLOW_PROJECT_NAME}")
    print(f"Allowed config dir: {PathValidator.ALLOWED_CONFIG_DIR}")
    print(f"Allowed workflow dir: {PathValidator.ALLOWED_WORKFLOW_DIR}")
    print("=" * 70)
    print()

    # Start server
    host = '0.0.0.0' if environment == 'production' else '127.0.0.1'
    print(f"🚀 Starting server on {host}:{port}")
    print(f"📝 Health check: http://{host}:{port}/health")
    print()

    app.run(host=host, port=port, debug=debug)
