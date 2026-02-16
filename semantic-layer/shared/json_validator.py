"""
JSON Schema Validation for API Endpoints
Validates request body structure and types

SECURITY: Prevents malformed requests, injection attacks, and resource exhaustion
"""

from functools import wraps
from flask import request, jsonify
from typing import Dict, Any, Optional, Callable
import json


# ============================================================================
# JSON SCHEMAS
# ============================================================================

# Schema for field metadata update requests
UPDATE_FIELD_METADATA_SCHEMA = {
    "type": "object",
    "required": ["updates"],
    "properties": {
        "updates": {
            "type": "array",
            "minItems": 1,
            "maxItems": 100,  # Limit batch size
            "items": {
                "type": "object",
                "required": ["database_name", "table_name", "field_name", "updates"],
                "properties": {
                    "database_name": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 128,
                        "pattern": "^[a-zA-Z0-9_]+$"
                    },
                    "table_name": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 128,
                        "pattern": "^[a-zA-Z0-9_]+$"
                    },
                    "field_name": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 128,
                        "pattern": "^[a-zA-Z0-9_]+$"
                    },
                    "updates": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string", "maxLength": 500},
                            "business_term": {"type": "string", "maxLength": 255},
                            "owner": {"type": "string", "maxLength": 255},
                            "steward_email": {"type": "string", "maxLength": 255},
                            "data_classification": {"type": "string", "maxLength": 100},
                            "is_pii": {"type": "boolean"},
                            "pii_category": {"type": "string", "maxLength": 50},
                            "tags": {"type": "array", "maxItems": 20, "items": {"type": "string", "maxLength": 100}},
                            "valid_values": {"type": "array", "maxItems": 100, "items": {"type": "string"}}
                        }
                    }
                }
            }
        }
    }
}

# Schema for config save requests
SAVE_CONFIG_SCHEMA = {
    "type": "object",
    "required": ["config"],
    "properties": {
        "config": {
            "type": "object",
            "required": ["version", "scope", "semantic_database", "sync"],
            "properties": {
                "version": {"type": "string"},
                "scope": {"type": "object"},
                "semantic_database": {"type": "object"},
                "sync": {"type": "object"}
            }
        },
        "deploy_workflow": {"type": "boolean"}
    }
}

# Schema for workflow validation requests
VALIDATE_WORKFLOW_SCHEMA = {
    "type": "object",
    "required": ["config"],
    "properties": {
        "config": {"type": "object"}
    }
}


# ============================================================================
# VALIDATION DECORATOR
# ============================================================================

def validate_json_schema(schema: Dict[str, Any]):
    """Decorator to validate request JSON against a schema

    Args:
        schema: JSON schema dictionary

    Usage:
        @app.route('/api/endpoint', methods=['POST'])
        @validate_json_schema(UPDATE_FIELD_METADATA_SCHEMA)
        def my_endpoint():
            data = request.get_json()
            # data is guaranteed to match the schema
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get JSON data
            if not request.is_json:
                return jsonify({
                    'success': False,
                    'error': 'Bad Request',
                    'message': 'Content-Type must be application/json'
                }), 400

            try:
                data = request.get_json()
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': 'Bad Request',
                    'message': f'Invalid JSON: {str(e)[:100]}'
                }), 400

            # Validate against schema
            errors = validate_against_schema(data, schema)
            if errors:
                return jsonify({
                    'success': False,
                    'error': 'Validation Error',
                    'message': 'Request body does not match expected schema',
                    'validation_errors': errors[:5]  # Limit to first 5 errors
                }), 400

            return f(*args, **kwargs)

        return decorated_function
    return decorator


def validate_against_schema(data: Any, schema: Dict[str, Any], path: str = "root") -> list:
    """Validate data against a JSON schema

    Args:
        data: Data to validate
        schema: Schema to validate against
        path: Current path in the data structure (for error messages)

    Returns:
        List of validation error messages (empty if valid)
    """
    errors = []

    # Type validation
    expected_type = schema.get("type")
    if expected_type:
        if not validate_type(data, expected_type):
            errors.append(f"{path}: Expected type '{expected_type}', got '{type(data).__name__}'")
            return errors  # Stop validation if type is wrong

    # Required fields
    if expected_type == "object" and isinstance(data, dict):
        required = schema.get("required", [])
        for field in required:
            if field not in data:
                errors.append(f"{path}: Missing required field '{field}'")

        # Validate properties
        properties = schema.get("properties", {})
        for key, value in data.items():
            if key in properties:
                sub_errors = validate_against_schema(value, properties[key], f"{path}.{key}")
                errors.extend(sub_errors)

    # Array validation
    elif expected_type == "array" and isinstance(data, list):
        min_items = schema.get("minItems")
        max_items = schema.get("maxItems")

        if min_items and len(data) < min_items:
            errors.append(f"{path}: Array has {len(data)} items, minimum is {min_items}")

        if max_items and len(data) > max_items:
            errors.append(f"{path}: Array has {len(data)} items, maximum is {max_items}")

        # Validate items
        items_schema = schema.get("items")
        if items_schema:
            for i, item in enumerate(data[:100]):  # Limit validation to first 100 items
                sub_errors = validate_against_schema(item, items_schema, f"{path}[{i}]")
                errors.extend(sub_errors)

    # String validation
    elif expected_type == "string" and isinstance(data, str):
        min_length = schema.get("minLength")
        max_length = schema.get("maxLength")
        pattern = schema.get("pattern")

        if min_length and len(data) < min_length:
            errors.append(f"{path}: String length {len(data)} is less than minimum {min_length}")

        if max_length and len(data) > max_length:
            errors.append(f"{path}: String length {len(data)} exceeds maximum {max_length}")

        if pattern:
            import re
            if not re.match(pattern, data):
                errors.append(f"{path}: String does not match pattern '{pattern}'")

    return errors


def validate_type(value: Any, expected_type: str) -> bool:
    """Check if value matches expected JSON schema type

    Args:
        value: Value to check
        expected_type: Expected type ('string', 'number', 'object', 'array', 'boolean', 'null')

    Returns:
        True if type matches, False otherwise
    """
    type_map = {
        'string': str,
        'number': (int, float),
        'integer': int,
        'object': dict,
        'array': list,
        'boolean': bool,
        'null': type(None)
    }

    expected_python_type = type_map.get(expected_type)
    if not expected_python_type:
        return False

    return isinstance(value, expected_python_type)


# ============================================================================
# USAGE EXAMPLES
# ============================================================================
"""
# Example 1: Basic usage with Flask
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/api/metadata/fields/update', methods=['POST'])
@validate_json_schema(UPDATE_FIELD_METADATA_SCHEMA)
def update_field_metadata():
    data = request.get_json()
    # Data is guaranteed to be valid
    updates = data['updates']
    # Process updates...
    return jsonify({'success': True})

# Example 2: Invalid request
# POST /api/metadata/fields/update
# Body: {"updates": [{"database_name": "test"}]}  # Missing required fields
# Response: 400 Bad Request
# {
#   "success": false,
#   "error": "Validation Error",
#   "message": "Request body does not match expected schema",
#   "validation_errors": [
#     "root.updates[0]: Missing required field 'table_name'",
#     "root.updates[0]: Missing required field 'field_name'",
#     "root.updates[0]: Missing required field 'updates'"
#   ]
# }
"""
