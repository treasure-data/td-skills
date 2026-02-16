"""
Audit Logging for API Requests
Tracks all API operations for security monitoring and compliance

SECURITY: Logs authentication, authorization, and data access events
COMPLIANCE: Provides audit trail for regulatory requirements
"""

import logging
import json
import time
from datetime import datetime
from functools import wraps
from flask import request, g
from typing import Dict, Any, Optional, Callable
from error_sanitizer import ErrorSanitizer


class AuditLogger:
    """Audit logging system for Flask applications

    Tracks:
    - Authentication attempts (success/failure)
    - API requests (endpoint, method, user, IP)
    - Data modifications (creates, updates, deletes)
    - Authorization failures
    - Security events (rate limit hits, invalid tokens, etc.)
    """

    def __init__(self, app_name: str, log_file: Optional[str] = None):
        """Initialize audit logger

        Args:
            app_name: Name of the application
            log_file: Optional file path for audit logs (default: audit.log)
        """
        self.app_name = app_name
        self.logger = logging.getLogger(f'{app_name}.audit')
        self.logger.setLevel(logging.INFO)

        # Console handler for development
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)

        # File handler for persistent audit trail
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(logging.INFO)
            # JSON format for machine parsing
            file_formatter = logging.Formatter('%(message)s')
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)

    def _get_client_ip(self) -> str:
        """Get client IP address from request headers"""
        # Check for proxied requests
        if request.headers.get('X-Forwarded-For'):
            # Get first IP (original client)
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            return request.headers.get('X-Real-IP')
        else:
            return request.remote_addr or 'unknown'

    def _get_user_info(self) -> Dict[str, Any]:
        """Extract user information from request context"""
        user_info = {
            'user_id': None,
            'auth_method': None
        }

        # Check if user was set by auth middleware
        if hasattr(g, 'user'):
            user_info['user_id'] = g.user.get('user_id', 'unknown')
            user_info['auth_method'] = g.user.get('auth_method', 'unknown')

        return user_info

    def _create_audit_entry(
        self,
        event_type: str,
        action: str,
        status: str,
        details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create standardized audit log entry

        Args:
            event_type: Type of event (request, auth, data_change, security)
            action: Action performed (GET /api/endpoint, login, update_field, etc.)
            status: Status of action (success, failure, denied)
            details: Additional details about the event

        Returns:
            Audit entry dictionary
        """
        user_info = self._get_user_info()

        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'app': self.app_name,
            'event_type': event_type,
            'action': action,
            'status': status,
            'user_id': user_info['user_id'],
            'auth_method': user_info['auth_method'],
            'client_ip': self._get_client_ip(),
            'user_agent': request.headers.get('User-Agent', 'unknown')[:200],
            'details': details or {}
        }

        return entry

    def log_request(
        self,
        status_code: int,
        response_time_ms: float,
        error_message: Optional[str] = None
    ):
        """Log API request

        Args:
            status_code: HTTP status code
            response_time_ms: Response time in milliseconds
            error_message: Error message if request failed
        """
        status = 'success' if status_code < 400 else 'failure'

        details = {
            'method': request.method,
            'endpoint': request.path,
            'status_code': status_code,
            'response_time_ms': round(response_time_ms, 2),
            'query_params': dict(request.args) if request.args else None,
        }

        if error_message:
            # Sanitize error message
            details['error'] = ErrorSanitizer.sanitize_string(error_message)[:200]

        # Add request body size for write operations
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            details['content_length'] = request.content_length

        entry = self._create_audit_entry(
            event_type='request',
            action=f'{request.method} {request.path}',
            status=status,
            details=details
        )

        self.logger.info(json.dumps(entry))

    def log_auth_attempt(
        self,
        auth_method: str,
        success: bool,
        user_id: Optional[str] = None,
        failure_reason: Optional[str] = None
    ):
        """Log authentication attempt

        Args:
            auth_method: Authentication method (jwt, api_key)
            success: Whether authentication succeeded
            user_id: User ID if authentication succeeded
            failure_reason: Reason for failure
        """
        status = 'success' if success else 'failure'

        details = {
            'auth_method': auth_method,
            'endpoint': request.path
        }

        if not success and failure_reason:
            details['failure_reason'] = ErrorSanitizer.sanitize_string(failure_reason)[:100]

        entry = self._create_audit_entry(
            event_type='auth',
            action=f'authenticate_{auth_method}',
            status=status,
            details=details
        )

        # Override user_id for successful auth
        if success and user_id:
            entry['user_id'] = user_id

        self.logger.info(json.dumps(entry))

    def log_data_change(
        self,
        operation: str,
        resource_type: str,
        resource_id: str,
        changes: Optional[Dict[str, Any]] = None
    ):
        """Log data modification

        Args:
            operation: Operation type (create, update, delete)
            resource_type: Type of resource (field_metadata, config, etc.)
            resource_id: Identifier of resource
            changes: Summary of changes made
        """
        details = {
            'resource_type': resource_type,
            'resource_id': resource_id,
            'operation': operation
        }

        if changes:
            # Sanitize changes to remove sensitive data
            details['changes'] = ErrorSanitizer.sanitize_dict(changes)

        entry = self._create_audit_entry(
            event_type='data_change',
            action=f'{operation}_{resource_type}',
            status='success',
            details=details
        )

        self.logger.info(json.dumps(entry))

    def log_security_event(
        self,
        event_name: str,
        severity: str,
        description: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log security event

        Args:
            event_name: Name of security event (rate_limit_hit, invalid_token, etc.)
            severity: Severity level (low, medium, high, critical)
            description: Description of the event
            details: Additional details
        """
        event_details = {
            'severity': severity,
            'description': ErrorSanitizer.sanitize_string(description)[:200]
        }

        if details:
            event_details.update(ErrorSanitizer.sanitize_dict(details))

        entry = self._create_audit_entry(
            event_type='security',
            action=event_name,
            status='detected',
            details=event_details
        )

        # Use appropriate log level based on severity
        log_method = {
            'low': self.logger.info,
            'medium': self.logger.warning,
            'high': self.logger.error,
            'critical': self.logger.critical
        }.get(severity, self.logger.info)

        log_method(json.dumps(entry))


def audit_request(audit_logger: AuditLogger):
    """Decorator to automatically audit API requests

    Usage:
        @app.route('/api/endpoint', methods=['POST'])
        @audit_request(audit_logger)
        def my_endpoint():
            return jsonify({'success': True})
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Record start time
            start_time = time.time()

            try:
                # Execute the request
                response = f(*args, **kwargs)

                # Calculate response time
                response_time_ms = (time.time() - start_time) * 1000

                # Get status code from response
                if hasattr(response, 'status_code'):
                    status_code = response.status_code
                elif isinstance(response, tuple) and len(response) > 1:
                    status_code = response[1]
                else:
                    status_code = 200

                # Log the request
                audit_logger.log_request(
                    status_code=status_code,
                    response_time_ms=response_time_ms
                )

                return response

            except Exception as e:
                # Calculate response time
                response_time_ms = (time.time() - start_time) * 1000

                # Log failed request
                audit_logger.log_request(
                    status_code=500,
                    response_time_ms=response_time_ms,
                    error_message=str(e)
                )

                # Re-raise exception
                raise

        return decorated_function
    return decorator


# ============================================================================
# FLASK INTEGRATION
# ============================================================================

def init_audit_logging(app, app_name: str, log_file: Optional[str] = 'audit.log'):
    """Initialize audit logging for Flask app

    Args:
        app: Flask application instance
        app_name: Name of the application
        log_file: Path to audit log file

    Returns:
        AuditLogger instance

    Usage:
        from shared.audit_logger import init_audit_logging

        app = Flask(__name__)
        audit_logger = init_audit_logging(app, 'semantic-layer-api')
    """
    audit_logger = AuditLogger(app_name, log_file)

    # Store in app context for access in routes
    app.audit_logger = audit_logger

    # Add request timing
    @app.before_request
    def before_request():
        g.request_start_time = time.time()

    # Auto-log all requests after completion
    @app.after_request
    def after_request(response):
        # Calculate response time
        if hasattr(g, 'request_start_time'):
            response_time_ms = (time.time() - g.request_start_time) * 1000
        else:
            response_time_ms = 0

        # Log the request
        audit_logger.log_request(
            status_code=response.status_code,
            response_time_ms=response_time_ms
        )

        return response

    return audit_logger


# ============================================================================
# USAGE EXAMPLES
# ============================================================================
"""
# Example 1: Initialize audit logging for Flask app
from flask import Flask, jsonify
from shared.audit_logger import init_audit_logging

app = Flask(__name__)
audit_logger = init_audit_logging(app, 'semantic-layer-api', log_file='logs/audit.log')

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({'data': []})

# Automatically logs:
# {
#   "timestamp": "2026-02-16T10:30:00.123456",
#   "app": "semantic-layer-api",
#   "event_type": "request",
#   "action": "GET /api/data",
#   "status": "success",
#   "user_id": "user123",
#   "auth_method": "api_key",
#   "client_ip": "192.168.1.100",
#   "user_agent": "Mozilla/5.0...",
#   "details": {
#     "method": "GET",
#     "endpoint": "/api/data",
#     "status_code": 200,
#     "response_time_ms": 45.23
#   }
# }

# Example 2: Log authentication attempts
@app.route('/api/login', methods=['POST'])
def login():
    # ... authentication logic ...
    if auth_success:
        audit_logger.log_auth_attempt(
            auth_method='jwt',
            success=True,
            user_id='user123'
        )
    else:
        audit_logger.log_auth_attempt(
            auth_method='jwt',
            success=False,
            failure_reason='Invalid credentials'
        )
    return jsonify({'success': auth_success})

# Example 3: Log data modifications
@app.route('/api/update', methods=['POST'])
def update_data():
    # ... update logic ...
    audit_logger.log_data_change(
        operation='update',
        resource_type='field_metadata',
        resource_id='customers.email',
        changes={'description': 'new description', 'is_pii': True}
    )
    return jsonify({'success': True})

# Example 4: Log security events
@app.errorhandler(429)
def rate_limit_handler(e):
    audit_logger.log_security_event(
        event_name='rate_limit_exceeded',
        severity='medium',
        description='Client exceeded rate limit',
        details={'limit': '30 per minute'}
    )
    return jsonify({'error': 'Rate limit exceeded'}), 429
"""
