"""
Error Sanitization for Security
Removes sensitive data from error messages and logs

SECURITY: Prevents leakage of API keys, tokens, passwords, PII in error messages
"""

import re
from typing import Any, Dict, Optional


class ErrorSanitizer:
    """Sanitize error messages to prevent sensitive data leakage"""

    # Patterns to detect and redact sensitive information
    SENSITIVE_PATTERNS = [
        # API Keys (various formats)
        (r'(api[_-]?key|apikey)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})["\']?', '[API_KEY_REDACTED]'),
        (r'(key|token)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{32,})["\']?', '[TOKEN_REDACTED]'),

        # Authorization headers
        (r'(Bearer|Basic)\s+([a-zA-Z0-9_\-\.=]+)', r'\1 [TOKEN_REDACTED]'),
        (r'(Authorization:\s*)(Bearer|Basic)\s+[^\s]+', r'\1\2 [TOKEN_REDACTED]'),

        # Passwords
        (r'(password|passwd|pwd)\s*[:=]\s*["\']?([^"\'\s]{6,})["\']?', '[PASSWORD_REDACTED]'),

        # JWT tokens
        (r'eyJ[a-zA-Z0-9_\-]+\.eyJ[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+', '[JWT_REDACTED]'),

        # AWS keys
        (r'AKIA[0-9A-Z]{16}', '[AWS_KEY_REDACTED]'),
        (r'(aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*["\']?([^"\'\s]+)["\']?', '[AWS_SECRET_REDACTED]'),

        # Email addresses (PII)
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]'),

        # Credit card numbers
        (r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b', '[CARD_REDACTED]'),

        # SSN
        (r'\b\d{3}-\d{2}-\d{4}\b', '[SSN_REDACTED]'),

        # Phone numbers
        (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE_REDACTED]'),

        # IP addresses (internal network info)
        (r'\b(?:10|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b', '[PRIVATE_IP_REDACTED]'),

        # File paths that might contain usernames
        (r'(/Users/|/home/|C:\\Users\\)([^/\\]+)', r'\1[USERNAME]'),
    ]

    @classmethod
    def sanitize_string(cls, text: str) -> str:
        """Sanitize a string by removing sensitive information

        Args:
            text: Text to sanitize

        Returns:
            Sanitized text with sensitive data redacted
        """
        if not isinstance(text, str):
            text = str(text)

        sanitized = text

        for pattern, replacement in cls.SENSITIVE_PATTERNS:
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

        return sanitized

    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any], keys_to_redact: Optional[list] = None) -> Dict[str, Any]:
        """Sanitize a dictionary by removing sensitive key-value pairs

        Args:
            data: Dictionary to sanitize
            keys_to_redact: Additional keys to redact (case-insensitive)

        Returns:
            Sanitized dictionary with sensitive values redacted
        """
        if not isinstance(data, dict):
            return data

        # Default sensitive keys
        sensitive_keys = {
            'password', 'passwd', 'pwd', 'secret', 'api_key', 'apikey',
            'token', 'auth', 'authorization', 'bearer', 'key', 'private_key',
            'access_token', 'refresh_token', 'jwt', 'session', 'cookie',
            'credit_card', 'card_number', 'cvv', 'ssn', 'social_security'
        }

        if keys_to_redact:
            sensitive_keys.update(k.lower() for k in keys_to_redact)

        sanitized = {}
        for key, value in data.items():
            # Check if key is sensitive
            if key.lower() in sensitive_keys or any(s in key.lower() for s in ['password', 'secret', 'key', 'token']):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_dict(value, keys_to_redact)
            elif isinstance(value, list):
                sanitized[key] = [cls.sanitize_dict(item, keys_to_redact) if isinstance(item, dict) else cls.sanitize_string(str(item)) for item in value]
            elif isinstance(value, str):
                sanitized[key] = cls.sanitize_string(value)
            else:
                sanitized[key] = value

        return sanitized

    @classmethod
    def sanitize_error(cls, error: Exception) -> str:
        """Sanitize an exception message

        Args:
            error: Exception to sanitize

        Returns:
            Sanitized error message
        """
        error_str = str(error)
        return cls.sanitize_string(error_str)

    @classmethod
    def safe_log_format(cls, message: str, context: Optional[Dict] = None) -> str:
        """Format a log message safely

        Args:
            message: Log message
            context: Optional context dictionary

        Returns:
            Sanitized log message
        """
        sanitized_msg = cls.sanitize_string(message)

        if context:
            sanitized_context = cls.sanitize_dict(context)
            import json
            context_str = json.dumps(sanitized_context, indent=2)
            return f"{sanitized_msg}\nContext: {context_str}"

        return sanitized_msg


class SafeLogger:
    """Wrapper for logging that auto-sanitizes sensitive data"""

    def __init__(self, logger):
        """Initialize with a logger instance

        Args:
            logger: Python logging.Logger instance
        """
        self.logger = logger
        self.sanitizer = ErrorSanitizer()

    def debug(self, msg: str, *args, **kwargs):
        """Log debug message with sanitization"""
        sanitized = self.sanitizer.sanitize_string(msg)
        self.logger.debug(sanitized, *args, **kwargs)

    def info(self, msg: str, *args, **kwargs):
        """Log info message with sanitization"""
        sanitized = self.sanitizer.sanitize_string(msg)
        self.logger.info(sanitized, *args, **kwargs)

    def warning(self, msg: str, *args, **kwargs):
        """Log warning message with sanitization"""
        sanitized = self.sanitizer.sanitize_string(msg)
        self.logger.warning(sanitized, *args, **kwargs)

    def error(self, msg: str, *args, exc_info=None, **kwargs):
        """Log error message with sanitization"""
        sanitized = self.sanitizer.sanitize_string(msg)

        # Sanitize exception info if provided
        if exc_info and isinstance(exc_info, Exception):
            sanitized += f" | Error: {self.sanitizer.sanitize_error(exc_info)}"
            exc_info = None  # Don't log raw exception

        self.logger.error(sanitized, *args, exc_info=exc_info, **kwargs)

    def critical(self, msg: str, *args, **kwargs):
        """Log critical message with sanitization"""
        sanitized = self.sanitizer.sanitize_string(msg)
        self.logger.critical(sanitized, *args, **kwargs)

    def log_with_context(self, level: str, message: str, context: Optional[Dict] = None):
        """Log with context dictionary (auto-sanitized)

        Args:
            level: Log level (debug, info, warning, error, critical)
            message: Log message
            context: Optional context dict
        """
        sanitized = self.sanitizer.safe_log_format(message, context)
        log_method = getattr(self.logger, level.lower(), self.logger.info)
        log_method(sanitized)


# ============================================================================
# USAGE EXAMPLES
# ============================================================================
"""
# Example 1: Sanitize error messages
try:
    api_key = "sk_test_1234567890abcdefghijklmnop"
    raise ValueError(f"API call failed with key: {api_key}")
except Exception as e:
    sanitized_error = ErrorSanitizer.sanitize_error(e)
    print(sanitized_error)  # "API call failed with key: [TOKEN_REDACTED]"

# Example 2: Sanitize dictionaries
request_data = {
    'username': 'john@example.com',
    'password': 'secret123',
    'api_key': 'sk_1234567890',
    'user_id': '12345'
}
sanitized = ErrorSanitizer.sanitize_dict(request_data)
# Result: {'username': '[EMAIL_REDACTED]', 'password': '[REDACTED]', 'api_key': '[REDACTED]', 'user_id': '12345'}

# Example 3: Use SafeLogger
import logging
logger = logging.getLogger(__name__)
safe_logger = SafeLogger(logger)

safe_logger.error(f"Failed to authenticate with token: Bearer eyJhbGciOiJIUzI1NiIs...")
# Logs: "Failed to authenticate with token: Bearer [TOKEN_REDACTED]"

# Example 4: Flask error handling
from flask import jsonify

@app.errorhandler(Exception)
def handle_error(error):
    sanitized_msg = ErrorSanitizer.sanitize_error(error)
    return jsonify({
        'error': 'Internal server error',
        'message': sanitized_msg
    }), 500
"""
