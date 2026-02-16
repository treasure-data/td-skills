"""
Backend API for Semantic Layer Metadata Management
Provides REST API endpoints to query and update field_metadata table in Treasure Data

SECURITY: JWT/API Key authentication required, CORS configured, rate limiting enabled
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import sys
import pytd
import pandas as pd
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

# Add parent directory to path for shared modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../shared'))
from auth_middleware import require_auth, optional_auth, init_auth, create_token_endpoint
from error_sanitizer import ErrorSanitizer, SafeLogger
from json_validator import validate_json_schema, UPDATE_FIELD_METADATA_SCHEMA
from audit_logger import init_audit_logging
import logging

# Setup safe logging
base_logger = logging.getLogger(__name__)
safe_logger = SafeLogger(base_logger)

app = Flask(__name__)

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

# CORS Configuration - Whitelist specific origins only
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

# Rate Limiting - Prevent DoS attacks
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv('REDIS_URL', 'memory://')  # Use Redis in production
)

# Request body size limit - Prevent memory exhaustion
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Security Headers
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Only add HSTS in production with HTTPS
    if os.getenv('ENVIRONMENT') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Global error handler - Sanitize all error responses
@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler with sanitization

    SECURITY: Sanitizes error messages to prevent sensitive data leakage
    """
    # Sanitize the error message
    sanitized_msg = ErrorSanitizer.sanitize_error(error)

    # Log the error securely
    safe_logger.error(f"Unhandled error: {sanitized_msg}", exc_info=error)

    # Determine status code
    status_code = getattr(error, 'code', 500)
    if not isinstance(status_code, int):
        status_code = 500

    # Return sanitized error response
    return jsonify({
        'success': False,
        'error': 'Internal server error' if status_code == 500 else 'Request error',
        'message': sanitized_msg[:200]  # Limit message length
    }), status_code

# Rate limit error handler - Log security events
@app.errorhandler(429)
def handle_rate_limit(error):
    """Rate limit exceeded handler

    SECURITY: Logs rate limit violations for monitoring
    """
    # Log security event
    if hasattr(app, 'audit_logger'):
        app.audit_logger.log_security_event(
            event_name='rate_limit_exceeded',
            severity='medium',
            description='Client exceeded rate limit',
            details={'endpoint': request.path, 'method': request.method}
        )

    return jsonify({
        'success': False,
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.'
    }), 429

# Configuration
TD_API_KEY = os.getenv('TD_API_KEY')
TD_REGION = os.getenv('TD_REGION', 'us01')
SEMANTIC_DB = os.getenv('SEMANTIC_DB', 'semantic_layer_v1')

# Initialize TD Client
td_client = None

def get_td_client():
    """Get or create TD client"""
    global td_client
    if td_client is None:
        if not TD_API_KEY:
            raise Exception('TD_API_KEY environment variable is not set')
        td_client = pytd.Client(
            apikey=TD_API_KEY,
            endpoint=f'https://api.treasuredata.com/',
            database=SEMANTIC_DB
        )
    return td_client

def query_td(query: str) -> List[Dict[str, Any]]:
    """Execute TD query and return results"""
    try:
        client = get_td_client()
        result = client.query(query)

        # Convert to DataFrame if it's a dict
        if isinstance(result, dict):
            df = pd.DataFrame(result['data'], columns=result['columns'])
        else:
            df = result

        return df.to_dict('records')
    except Exception as e:
        # SECURITY: Sanitize error before logging
        safe_logger.error(f'Query error: {ErrorSanitizer.sanitize_error(e)}')
        raise

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
@limiter.exempt  # Health check should not be rate limited
def health_check():
    """Health check endpoint (public, no auth required)"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/metadata/databases', methods=['GET'])
@require_auth(auth_type='auto')
@limiter.limit("30 per minute")
def get_databases():
    """Get list of databases with table counts from latest field versions

    REQUIRES AUTHENTICATION: JWT token or API key
    """
    try:
        # Get latest version of each field first, then aggregate
        query = f"""
        SELECT
            database_name,
            COUNT(DISTINCT table_name) as table_count
        FROM (
            SELECT
                database_name,
                table_name,
                field_name,
                ROW_NUMBER() OVER (
                    PARTITION BY database_name, table_name, field_name
                    ORDER BY time DESC
                ) as rn
            FROM {SEMANTIC_DB}.field_metadata
        ) t
        WHERE rn = 1
        GROUP BY database_name
        ORDER BY database_name
        """
        results = query_td(query)

        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/metadata/databases/<database>/tables', methods=['GET'])
@require_auth(auth_type='auto')
@limiter.limit("30 per minute")
def get_tables(database: str):
    """Get list of tables for a specific database from latest field versions

    REQUIRES AUTHENTICATION: JWT token or API key
    """
    try:
        query = f"""
        SELECT DISTINCT table_name
        FROM (
            SELECT
                database_name,
                table_name,
                field_name,
                ROW_NUMBER() OVER (
                    PARTITION BY database_name, table_name, field_name
                    ORDER BY time DESC
                ) as rn
            FROM {SEMANTIC_DB}.field_metadata
            WHERE database_name = '{database}'
        ) t
        WHERE rn = 1
        ORDER BY table_name
        """
        results = query_td(query)
        tables = [row['table_name'] for row in results]

        return jsonify({
            'success': True,
            'data': tables
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/metadata/fields', methods=['GET'])
@require_auth(auth_type='auto')
@limiter.limit("30 per minute")
def get_field_metadata():
    """Get field metadata with optional filters - returns latest version of each field

    REQUIRES AUTHENTICATION: JWT token or API key
    """
    try:
        database = request.args.get('database')
        table = request.args.get('table')

        # Build query with deduplication (get latest version of each field)
        where_clauses = []
        if database:
            where_clauses.append(f"database_name = '{database}'")
        if table:
            where_clauses.append(f"table_name = '{table}'")

        where_str = ' AND '.join(where_clauses) if where_clauses else '1=1'

        # Use ROW_NUMBER() to get latest version of each field (highest time value)
        query = f"""
        SELECT
            time,
            database_name,
            table_name,
            field_name,
            tags,
            business_term,
            is_pii,
            pii_category,
            owner,
            steward_email,
            data_classification,
            valid_values,
            created_at,
            updated_at,
            verified_at,
            verified_by,
            description
        FROM (
            SELECT
                *,
                ROW_NUMBER() OVER (
                    PARTITION BY database_name, table_name, field_name
                    ORDER BY time DESC
                ) as rn
            FROM {SEMANTIC_DB}.field_metadata
            WHERE {where_str}
        ) t
        WHERE rn = 1
        ORDER BY database_name, table_name, field_name
        """
        results = query_td(query)

        # Convert tags from array to list if needed
        for row in results:
            if 'tags' in row and row['tags'] is None:
                row['tags'] = []
            if 'valid_values' in row and row['valid_values'] is None:
                row['valid_values'] = []
            # Remove the row_number column
            if 'rn' in row:
                del row['rn']

        return jsonify({
            'success': True,
            'data': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/metadata/fields/update', methods=['POST'])
@require_auth(auth_type='auto')
@limiter.limit("10 per minute")  # Stricter limit for write operations
@validate_json_schema(UPDATE_FIELD_METADATA_SCHEMA)
def update_field_metadata():
    """Update field metadata using append-only pattern (Trino doesn't support UPDATE)

    REQUIRES AUTHENTICATION: JWT token or API key
    RATE LIMITED: 10 requests per minute
    REQUEST VALIDATED: JSON schema enforced
    """
    try:
        data = request.get_json()
        updates = data.get('updates', [])

        if not updates:
            return jsonify({
                'success': False,
                'error': 'No updates provided'
            }), 400

        updated_count = 0
        failed_updates = []
        client = get_td_client()

        for update in updates:
            try:
                database_name = update['database_name']
                table_name = update['table_name']
                field_name = update['field_name']
                changes = update['updates']

                # Step 1: Read current row (latest version)
                query = f"""
                SELECT *
                FROM (
                    SELECT
                        *,
                        ROW_NUMBER() OVER (
                            PARTITION BY database_name, table_name, field_name
                            ORDER BY time DESC
                        ) as rn
                    FROM {SEMANTIC_DB}.field_metadata
                    WHERE database_name = '{database_name}'
                      AND table_name = '{table_name}'
                      AND field_name = '{field_name}'
                ) t
                WHERE rn = 1
                """
                result = client.query(query)

                # Convert to DataFrame if it's a dict
                if isinstance(result, dict):
                    current_df = pd.DataFrame(result['data'], columns=result['columns'])
                else:
                    current_df = result

                if current_df.empty:
                    failed_updates.append({
                        'field': field_name,
                        'error': 'Field not found'
                    })
                    continue

                # Step 2: Apply updates to the row
                for key, value in changes.items():
                    # Skip read-only fields
                    if key in ['time', 'database_name', 'table_name', 'field_name']:
                        continue

                    # Update the field value
                    current_df[key] = value

                # Step 3: Update timestamps
                current_df['time'] = int(time.time())
                current_df['updated_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

                # Remove the row_number column
                if 'rn' in current_df.columns:
                    current_df = current_df.drop('rn', axis=1)

                # Step 4: Append the updated row to the table
                client.load_table_from_dataframe(
                    current_df,
                    f'{SEMANTIC_DB}.field_metadata',
                    writer='bulk_import',
                    if_exists='append'
                )

                updated_count += 1

                # Audit log the data change
                if hasattr(app, 'audit_logger'):
                    app.audit_logger.log_data_change(
                        operation='update',
                        resource_type='field_metadata',
                        resource_id=f'{database_name}.{table_name}.{field_name}',
                        changes=changes
                    )

            except Exception as e:
                error_msg = str(e)
                print(f'Failed to update {update.get("field_name")}: {error_msg}')
                failed_updates.append({
                    'field': update.get('field_name'),
                    'error': error_msg
                })

        # Prepare response
        if failed_updates:
            return jsonify({
                'success': updated_count > 0,
                'data': {
                    'updated': updated_count,
                    'failed': len(failed_updates),
                    'failures': failed_updates
                },
                'message': f'Updated {updated_count} records, {len(failed_updates)} failed'
            }), 207 if updated_count > 0 else 500
        else:
            return jsonify({
                'success': True,
                'data': {
                    'updated': updated_count,
                    'failed': 0
                },
                'message': f'Successfully updated {updated_count} records'
            })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == '__main__':
    # Initialize authentication system
    print("Initializing Semantic Layer Metadata API...")
    print("=" * 70)

    # Load authentication configuration
    init_auth()

    # Initialize audit logging
    audit_log_path = os.getenv('AUDIT_LOG_PATH', 'logs/audit.log')
    os.makedirs(os.path.dirname(audit_log_path), exist_ok=True)
    audit_logger = init_audit_logging(app, 'semantic-layer-metadata-api', audit_log_path)
    print(f"✅ Audit logging initialized: {audit_log_path}")

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
    print(f"Max request size: {app.config['MAX_CONTENT_LENGTH'] / 1024 / 1024:.0f}MB")
    print("=" * 70)
    print()

    # Start server
    # SECURITY: Only bind to 0.0.0.0 in production with proper firewall
    host = '0.0.0.0' if environment == 'production' else '127.0.0.1'
    print(f"🚀 Starting server on {host}:{port}")
    print(f"📝 Health check: http://{host}:{port}/health")
    print()

    if environment == 'development':
        print("💡 To set API key:")
        print("   export VALID_API_KEYS='your-secret-key-here'")
        print()
        print("💡 To generate JWT token, add token endpoint in code:")
        print("   create_token_endpoint(app, your_validator_function)")
        print()

    app.run(host=host, port=port, debug=debug)
