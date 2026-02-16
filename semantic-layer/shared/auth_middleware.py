"""
Authentication Middleware for Flask APIs
Provides JWT and API Key authentication

SECURITY: Implements industry-standard authentication patterns
"""

from functools import wraps
from flask import request, jsonify
import os
import jwt
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable


# ============================================================================
# CONFIGURATION
# ============================================================================
class AuthConfig:
    """Authentication configuration"""

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', secrets.token_urlsafe(32))
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))

    # API Key Configuration
    API_KEY_HEADER = 'X-API-Key'
    VALID_API_KEYS = set()  # Will be populated from environment

    # Allow disabling auth for development (DANGEROUS - never use in production)
    DISABLE_AUTH = os.getenv('DISABLE_AUTH', 'false').lower() == 'true'

    @classmethod
    def load_api_keys(cls):
        """Load API keys from environment variables"""
        # Load from comma-separated list
        api_keys_str = os.getenv('VALID_API_KEYS', '')
        if api_keys_str:
            cls.VALID_API_KEYS = set(key.strip() for key in api_keys_str.split(',') if key.strip())

        # Load from individual env vars (VALID_API_KEY_1, VALID_API_KEY_2, etc.)
        i = 1
        while True:
            key = os.getenv(f'VALID_API_KEY_{i}')
            if not key:
                break
            cls.VALID_API_KEYS.add(key.strip())
            i += 1

        return len(cls.VALID_API_KEYS) > 0


# ============================================================================
# JWT AUTHENTICATION
# ============================================================================
class JWTAuth:
    """JWT token authentication"""

    @staticmethod
    def generate_token(user_id: str, additional_claims: Optional[Dict] = None) -> str:
        """Generate JWT token

        Args:
            user_id: User identifier
            additional_claims: Additional claims to include in token

        Returns:
            JWT token string
        """
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=AuthConfig.JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }

        if additional_claims:
            payload.update(additional_claims)

        return jwt.encode(payload, AuthConfig.JWT_SECRET_KEY, algorithm=AuthConfig.JWT_ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token

        Args:
            token: JWT token string

        Returns:
            Decoded payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(
                token,
                AuthConfig.JWT_SECRET_KEY,
                algorithms=[AuthConfig.JWT_ALGORITHM]
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None  # Token expired
        except jwt.InvalidTokenError:
            return None  # Invalid token


# ============================================================================
# API KEY AUTHENTICATION
# ============================================================================
class APIKeyAuth:
    """API Key authentication"""

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash API key for secure comparison

        Args:
            api_key: API key to hash

        Returns:
            SHA256 hash of the API key
        """
        return hashlib.sha256(api_key.encode()).hexdigest()

    @staticmethod
    def verify_api_key(api_key: str) -> bool:
        """Verify API key

        Args:
            api_key: API key to verify

        Returns:
            True if valid, False otherwise
        """
        if not api_key:
            return False

        # Direct comparison (keys should be stored as plain text in env for simplicity)
        # In production, consider hashing keys in env and comparing hashes
        return api_key in AuthConfig.VALID_API_KEYS


# ============================================================================
# DECORATORS
# ============================================================================
def require_auth(auth_type: str = 'auto'):
    """Decorator to require authentication on endpoints

    Args:
        auth_type: 'jwt', 'api_key', or 'auto' (tries both)

    Usage:
        @app.route('/protected')
        @require_auth(auth_type='jwt')
        def protected_endpoint():
            user_id = request.user['user_id']
            return jsonify({'user_id': user_id})
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if auth is disabled (ONLY FOR DEVELOPMENT)
            if AuthConfig.DISABLE_AUTH:
                # Set a dummy user for development
                request.user = {'user_id': 'dev_user', 'auth_type': 'disabled'}
                return f(*args, **kwargs)

            auth_header = request.headers.get('Authorization', '')
            api_key = request.headers.get(AuthConfig.API_KEY_HEADER, '')

            authenticated = False
            user_info = None

            # Try JWT authentication
            if auth_type in ['jwt', 'auto'] and auth_header.startswith('Bearer '):
                token = auth_header.replace('Bearer ', '').strip()
                payload = JWTAuth.verify_token(token)
                if payload:
                    authenticated = True
                    user_info = payload
                    user_info['auth_type'] = 'jwt'

            # Try API Key authentication
            if not authenticated and auth_type in ['api_key', 'auto'] and api_key:
                if APIKeyAuth.verify_api_key(api_key):
                    authenticated = True
                    user_info = {'user_id': 'api_key_user', 'auth_type': 'api_key'}

            # Check if authentication succeeded
            if not authenticated:
                return jsonify({
                    'error': 'Unauthorized',
                    'message': 'Valid authentication required. Provide JWT token (Authorization: Bearer <token>) or API key (X-API-Key: <key>)'
                }), 401

            # Store user info in request context
            request.user = user_info

            return f(*args, **kwargs)

        return decorated_function
    return decorator


def optional_auth():
    """Decorator for endpoints that work with or without authentication

    If authenticated, request.user will be set.
    If not authenticated, request.user will be None.
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization', '')
            api_key = request.headers.get(AuthConfig.API_KEY_HEADER, '')

            request.user = None

            # Try JWT
            if auth_header.startswith('Bearer '):
                token = auth_header.replace('Bearer ', '').strip()
                payload = JWTAuth.verify_token(token)
                if payload:
                    request.user = payload
                    request.user['auth_type'] = 'jwt'

            # Try API Key
            if not request.user and api_key:
                if APIKeyAuth.verify_api_key(api_key):
                    request.user = {'user_id': 'api_key_user', 'auth_type': 'api_key'}

            return f(*args, **kwargs)

        return decorated_function
    return decorator


# ============================================================================
# INITIALIZATION
# ============================================================================
def init_auth():
    """Initialize authentication system

    Call this when starting the Flask app
    """
    # Load API keys from environment
    has_api_keys = AuthConfig.load_api_keys()

    # Validate configuration
    if AuthConfig.DISABLE_AUTH:
        print("⚠️  WARNING: Authentication is DISABLED. This is DANGEROUS in production!")
        print("   Set DISABLE_AUTH=false in production environments.")
    else:
        print("✓ Authentication enabled")

        # Check JWT secret
        if AuthConfig.JWT_SECRET_KEY == secrets.token_urlsafe(32):
            print("⚠️  WARNING: Using default JWT secret key. Set JWT_SECRET_KEY environment variable.")
        else:
            print("✓ JWT authentication configured")

        # Check API keys
        if has_api_keys:
            print(f"✓ {len(AuthConfig.VALID_API_KEYS)} API keys loaded")
        else:
            print("⚠️  WARNING: No API keys configured. Set VALID_API_KEYS environment variable.")

    return AuthConfig


# ============================================================================
# TOKEN GENERATION ENDPOINT (OPTIONAL)
# ============================================================================
def create_token_endpoint(app, username_password_validator: Optional[Callable] = None):
    """Create /api/auth/token endpoint for JWT token generation

    Args:
        app: Flask app instance
        username_password_validator: Function that validates username/password
                                     Should return user_id if valid, None otherwise

    Example:
        def validate_user(username, password):
            # Your validation logic here
            if username == 'admin' and password == 'secret':
                return 'admin_user_id'
            return None

        create_token_endpoint(app, validate_user)
    """
    @app.route('/api/auth/token', methods=['POST'])
    def generate_token():
        """Generate JWT token from username/password"""
        data = request.get_json()

        if not data or 'username' not in data or 'password' not in data:
            return jsonify({
                'error': 'Bad Request',
                'message': 'username and password required'
            }), 400

        username = data['username']
        password = data['password']

        # Validate credentials
        if username_password_validator:
            user_id = username_password_validator(username, password)
            if not user_id:
                return jsonify({
                    'error': 'Unauthorized',
                    'message': 'Invalid credentials'
                }), 401
        else:
            # Default behavior - no validation (NOT RECOMMENDED)
            user_id = username

        # Generate token
        token = JWTAuth.generate_token(user_id)

        return jsonify({
            'token': token,
            'token_type': 'Bearer',
            'expires_in': AuthConfig.JWT_EXPIRATION_HOURS * 3600
        })
