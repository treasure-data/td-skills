#!/usr/bin/env python3
"""
Basic tests for security fixes in semantic-layer-sync v1.0.1

Run with: python tests/test_security_fixes.py
Or with pytest: pytest tests/test_security_fixes.py -v
"""

import sys
import pytest
from semantic_layer_sync import InputValidator


class TestInputValidation:
    """Test input validation prevents SQL injection"""

    def test_valid_identifier(self):
        """Valid identifiers should pass"""
        assert InputValidator.validate_identifier("customer_id") == "customer_id"
        assert InputValidator.validate_identifier("table_123") == "table_123"
        assert InputValidator.validate_identifier("db.table") == "db.table"

    def test_sql_injection_in_name(self):
        """SQL injection in field names should be rejected"""
        with pytest.raises(ValueError, match="Contains invalid characters"):
            InputValidator.validate_identifier("test'; DROP TABLE users; --")

    def test_reserved_keyword(self):
        """Reserved keywords should be rejected"""
        with pytest.raises(ValueError, match="reserved keyword"):
            InputValidator.validate_identifier("SELECT")

        with pytest.raises(ValueError, match="reserved keyword"):
            InputValidator.validate_identifier("DROP")

    def test_identifier_too_long(self):
        """Identifiers exceeding max length should be rejected"""
        long_name = "a" * 200
        with pytest.raises(ValueError, match="exceeds max length"):
            InputValidator.validate_identifier(long_name)

    def test_special_characters_rejected(self):
        """Special characters in identifiers should be rejected"""
        invalid_names = [
            "user@id",
            "field$name",
            "table#123",
            "col!name",
            "field&name",
        ]
        for name in invalid_names:
            with pytest.raises(ValueError, match="invalid characters"):
                InputValidator.validate_identifier(name)

    def test_text_escaping(self):
        """Quotes in text should be properly escaped"""
        text = "It's a test"
        escaped = InputValidator.sanitize_text(text)
        assert escaped == "It''s a test"

    def test_text_removal_of_control_chars(self):
        """Control characters should be removed"""
        text = "Hello\x00World\nTest"
        sanitized = InputValidator.sanitize_text(text)
        assert "\x00" not in sanitized
        assert sanitized == "Hello World Test"  # Newlines converted to spaces

    def test_text_truncation(self):
        """Text exceeding max length should be truncated"""
        long_text = "a" * 1000
        sanitized = InputValidator.sanitize_text(long_text, max_length=100)
        assert len(sanitized) == 100

    def test_sql_injection_in_description(self):
        """SQL injection attempts in descriptions should be escaped"""
        description = "'; DROP TABLE users; --"
        sanitized = InputValidator.sanitize_text(description)
        # Should escape quotes and remove problematic chars
        assert "DROP" in sanitized  # Text remains but safely escaped
        assert sanitized == "''; DROP TABLE users; --"

    def test_pii_category_validation(self):
        """Invalid PII categories should be rejected"""
        field = {
            'name': 'test_field',
            'pii_category': 'invalid_category'
        }
        with pytest.raises(ValueError, match="Invalid category"):
            InputValidator.validate_yaml_field(field)

    def test_valid_pii_category(self):
        """Valid PII categories should pass"""
        field = {
            'name': 'email_field',
            'is_pii': True,
            'pii_category': 'email'
        }
        validated = InputValidator.validate_yaml_field(field)
        assert validated['pii_category'] == 'email'

    def test_tags_validation(self):
        """Tag list should be validated"""
        field = {
            'name': 'test_field',
            'tags': ['tag1', 'tag2']
        }
        validated = InputValidator.validate_yaml_field(field)
        assert validated['tags'] == ['tag1', 'tag2']

    def test_invalid_tag_type(self):
        """Non-string tags should be rejected"""
        field = {
            'name': 'test_field',
            'tags': [123, 'valid_tag']  # First tag is invalid
        }
        with pytest.raises(ValueError, match="must be strings"):
            InputValidator.validate_yaml_field(field)

    def test_missing_field_name(self):
        """Field without name should be rejected"""
        field = {
            'description': 'No name field'
        }
        with pytest.raises(ValueError, match="Missing required"):
            InputValidator.validate_yaml_field(field)

    def test_invalid_field_type(self):
        """Non-dict field should be rejected"""
        with pytest.raises(ValueError, match="must be a dictionary"):
            InputValidator.validate_yaml_field("not_a_dict")

    def test_complex_unicode(self):
        """Unicode characters should be preserved in sanitized text"""
        text = "Customer name: 你好 🌍"
        sanitized = InputValidator.sanitize_text(text)
        assert "你好" in sanitized
        assert "🌍" in sanitized


class TestSQLInjectionVectors:
    """Test various SQL injection attack vectors are blocked"""

    def test_stacked_queries(self):
        """Stacked query injection should be blocked"""
        with pytest.raises(ValueError):
            InputValidator.validate_identifier("field_name; DELETE FROM users")

    def test_comment_injection(self):
        """Comment injection should be blocked"""
        with pytest.raises(ValueError):
            InputValidator.validate_identifier("field_name -- comment")

    def test_union_injection(self):
        """UNION injection should be blocked"""
        with pytest.raises(ValueError):
            InputValidator.validate_identifier("field_name UNION SELECT")

    def test_quote_escape(self):
        """Quote escaping should work correctly"""
        text = "O'Reilly's Data"
        sanitized = InputValidator.sanitize_text(text)
        # Quotes should be doubled
        assert sanitized == "O''Reilly''s Data"


class TestBatchExecutor:
    """Test batch executor error handling (requires pytd connection)"""

    def test_batch_executor_initialization(self):
        """Batch executor should initialize with or without client"""
        from semantic_layer_sync import BatchExecutor

        # Initialize without client (will handle gracefully)
        executor = BatchExecutor(None)
        assert executor.td_client is None

    def test_batch_executor_dry_run(self):
        """Batch executor dry-run should not execute"""
        from semantic_layer_sync import BatchExecutor

        executor = BatchExecutor(None)
        result = executor.execute_batch(
            ["SELECT 1"],
            "test_table",
            dry_run=True
        )

        assert result['dry_run'] == True
        assert result['success'] == 1
        assert result['failed'] == 0


# Main for running without pytest
if __name__ == '__main__':
    print("=" * 70)
    print("Security Tests for semantic-layer-sync v1.0.1")
    print("=" * 70)
    print()

    # Run basic tests manually
    validator = InputValidator()

    print("✅ Testing valid identifiers...")
    assert validator.validate_identifier("customer_id") == "customer_id"
    print("   PASS: Valid identifiers accepted")

    print("✅ Testing SQL injection rejection...")
    try:
        validator.validate_identifier("test'; DROP TABLE users; --")
        print("   FAIL: SQL injection was not rejected!")
        sys.exit(1)
    except ValueError:
        print("   PASS: SQL injection rejected")

    print("✅ Testing text escaping...")
    escaped = validator.sanitize_text("It's a test")
    assert escaped == "It''s a test"
    print("   PASS: Quotes properly escaped")

    print("✅ Testing reserved keyword rejection...")
    try:
        validator.validate_identifier("SELECT")
        print("   FAIL: Reserved keyword was not rejected!")
        sys.exit(1)
    except ValueError:
        print("   PASS: Reserved keywords rejected")

    print("✅ Testing YAML field validation...")
    field = {
        'name': 'customer_id',
        'is_pii': False,
        'tags': ['ID', 'customer']
    }
    validated = validator.validate_yaml_field(field)
    assert validated['name'] == 'customer_id'
    print("   PASS: Valid YAML fields accepted")

    print()
    print("=" * 70)
    print("All security tests PASSED ✅")
    print("=" * 70)
    print()
    print("To run comprehensive tests with pytest:")
    print("  pytest tests/test_security_fixes.py -v")
