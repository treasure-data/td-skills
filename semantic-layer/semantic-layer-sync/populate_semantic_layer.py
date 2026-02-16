#!/usr/bin/env python3
"""
populate_semantic_layer.py

Populates semantic_layer_v1 tables with data from YAML definitions.
Reads data_dictionary_full.yaml and inserts into:
- field_metadata
- glossary
- field_relationships

SECURITY: Uses input validation to prevent SQL injection attacks
"""

import yaml
from datetime import datetime
import sys
import re


# ============================================================================
# INPUT VALIDATION & SECURITY
# ============================================================================
class InputValidator:
    """Validate and sanitize user inputs to prevent SQL injection"""

    MAX_IDENTIFIER_LENGTH = 128
    MAX_TEXT_LENGTH = 500
    MAX_TAG_LENGTH = 100

    # Reserved keywords to reject
    RESERVED_KEYWORDS = {
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
        'ALTER', 'EXEC', 'EXECUTE', 'SCRIPT', 'EVAL', '--', '/*', '*/'
    }

    @staticmethod
    def validate_identifier(value: str, context: str = "identifier") -> str:
        """Validate SQL identifiers (database, table, field names).

        Args:
            value: The identifier to validate
            context: What this identifier is for (for error messages)

        Returns:
            The validated identifier

        Raises:
            ValueError: If identifier is invalid
        """
        if not isinstance(value, str):
            raise ValueError(f"{context}: Expected string, got {type(value).__name__}")

        if not value:
            raise ValueError(f"{context}: Cannot be empty")

        if len(value) > InputValidator.MAX_IDENTIFIER_LENGTH:
            raise ValueError(f"{context}: Exceeds max length {InputValidator.MAX_IDENTIFIER_LENGTH}")

        # Check for SQL keywords
        if value.upper() in InputValidator.RESERVED_KEYWORDS:
            raise ValueError(f"{context}: Invalid - reserved keyword '{value}'")

        # Only allow alphanumeric and underscore
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise ValueError(f"{context}: Contains invalid characters (only alphanumeric and _ allowed)")

        return value

    @staticmethod
    def sanitize_text(value: str, max_length: int = None, context: str = "text") -> str:
        """Sanitize text fields for SQL text literals.

        Args:
            value: The text to sanitize
            max_length: Maximum allowed length (default: MAX_TEXT_LENGTH)
            context: What this text is for (for error messages)

        Returns:
            Sanitized text safe for SQL literals
        """
        if not isinstance(value, str):
            value = str(value)

        if max_length is None:
            max_length = InputValidator.MAX_TEXT_LENGTH

        # Truncate to max length
        value = value[:max_length]

        # Escape single quotes by doubling them (SQL standard)
        value = value.replace("'", "''")

        # Replace problematic whitespace
        value = value.replace("\n", " ").replace("\r", " ").replace("\t", " ")

        # Remove control characters
        value = ''.join(c for c in value if c.isprintable() or c.isspace())

        return value

    @staticmethod
    def validate_tag(tag: str) -> str:
        """Validate a tag value.

        Args:
            tag: Tag value to validate

        Returns:
            Validated tag

        Raises:
            ValueError: If tag is invalid
        """
        if not isinstance(tag, str):
            raise ValueError(f"Tag must be string, got {type(tag).__name__}")

        if not tag:
            raise ValueError("Tag cannot be empty")

        if len(tag) > InputValidator.MAX_TAG_LENGTH:
            raise ValueError(f"Tag exceeds max length {InputValidator.MAX_TAG_LENGTH}")

        # Tags should be alphanumeric with underscores and hyphens
        if not re.match(r'^[a-zA-Z0-9_-]+$', tag):
            raise ValueError(f"Tag contains invalid characters: {tag}")

        return InputValidator.sanitize_text(tag, InputValidator.MAX_TAG_LENGTH)


def load_yaml(path):
    """Load YAML file"""
    try:
        with open(path) as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"ERROR: Could not load {path}: {e}")
        sys.exit(1)

def generate_field_metadata_inserts(yaml_data):
    """Generate INSERT statements for field_metadata table with validation"""
    inserts = []
    skipped = []

    for table_name, table_def in yaml_data.get("tables", {}).items():
        if "." not in table_name:
            skipped.append(f"Skipping {table_name}: missing database prefix")
            continue

        db_name, tbl_name = table_name.split(".", 1)

        # Validate database and table names
        try:
            db_name = InputValidator.validate_identifier(db_name, f"database name '{db_name}'")
            tbl_name = InputValidator.validate_identifier(tbl_name, f"table name '{tbl_name}'")
        except ValueError as e:
            skipped.append(f"Skipping {table_name}: {e}")
            continue

        for field in table_def.get("fields", []):
            try:
                # Validate field name
                field_name = InputValidator.validate_identifier(
                    field.get('name', ''),
                    f"field name in {table_name}"
                )

                # Validate and sanitize tags
                tags = field.get("tags", [])
                if tags:
                    validated_tags = []
                    for tag in tags:
                        try:
                            validated_tag = InputValidator.validate_tag(tag)
                            validated_tags.append(validated_tag)
                        except ValueError as e:
                            print(f"  Warning: Invalid tag '{tag}' in {table_name}.{field_name}: {e}")
                    tags_array = "ARRAY['" + "','".join(validated_tags) + "']"
                else:
                    tags_array = "ARRAY[]"

                # Sanitize text fields
                business_term = InputValidator.sanitize_text(
                    field.get("business_term", ""),
                    max_length=255,
                    context="business_term"
                )
                description = InputValidator.sanitize_text(
                    field.get("description", ""),
                    max_length=InputValidator.MAX_TEXT_LENGTH,
                    context="description"
                )
                pii_category = InputValidator.sanitize_text(
                    field.get("pii_category", ""),
                    max_length=50,
                    context="pii_category"
                )
                owner = InputValidator.sanitize_text(
                    field.get("owner", table_def.get("owner", "")),
                    max_length=255,
                    context="owner"
                )

                # Validate boolean
                is_pii = 1 if field.get("is_pii", False) else 0

                # Generate safe INSERT statement
                insert = f"""INSERT INTO semantic_layer_v1.field_metadata (database_name, table_name, field_name, tags, business_term, description, is_pii, pii_category, owner, created_at, updated_at) VALUES ('{db_name}', '{tbl_name}', '{field_name}', {tags_array}, '{business_term}', '{description}', {is_pii}, '{pii_category}', '{owner}', '{datetime.now().isoformat()}', '{datetime.now().isoformat()}');"""
                inserts.append(insert)

            except ValueError as e:
                skipped.append(f"Skipping field in {table_name}: {e}")
                continue

    # Print warnings if any records were skipped
    if skipped:
        print(f"\n⚠️  Warnings: {len(skipped)} records skipped due to validation errors:")
        for warning in skipped[:10]:  # Show first 10
            print(f"  - {warning}")
        if len(skipped) > 10:
            print(f"  ... and {len(skipped) - 10} more")
        print()

    return inserts

def generate_glossary_inserts(yaml_data):
    """Generate INSERT statements for glossary table with validation"""
    inserts = []
    skipped = []

    for term in yaml_data.get("glossary", []):
        try:
            # Sanitize all text fields
            term_name = InputValidator.sanitize_text(
                term.get("term", ""),
                max_length=255,
                context="term name"
            )
            if not term_name:
                skipped.append("Skipping glossary term: empty term name")
                continue

            definition = InputValidator.sanitize_text(
                term.get("definition", ""),
                max_length=InputValidator.MAX_TEXT_LENGTH,
                context="definition"
            )
            owner = InputValidator.sanitize_text(
                term.get("owner", ""),
                max_length=255,
                context="owner"
            )

            # Generate safe INSERT statement
            insert = f"""INSERT INTO semantic_layer_v1.glossary (term, definition, owner, created_at, updated_at) VALUES ('{term_name}', '{definition}', '{owner}', '{datetime.now().isoformat()}', '{datetime.now().isoformat()}');"""
            inserts.append(insert)

        except ValueError as e:
            skipped.append(f"Skipping glossary term: {e}")
            continue

    # Print warnings if any records were skipped
    if skipped:
        print(f"\n⚠️  Warnings: {len(skipped)} glossary terms skipped due to validation errors:")
        for warning in skipped[:10]:  # Show first 10
            print(f"  - {warning}")
        if len(skipped) > 10:
            print(f"  ... and {len(skipped) - 10} more")
        print()

    return inserts

def main():
    print("=" * 70)
    print("POPULATING SEMANTIC LAYER V1")
    print("=" * 70)
    print()

    # Load YAML
    print("[1] Loading data dictionary...")
    yaml_data = load_yaml("data_dictionary_full.yaml")

    tables = yaml_data.get("tables", {})
    glossary_terms = yaml_data.get("glossary", [])

    total_fields = sum(len(t.get("fields", [])) for t in tables.values())

    print(f"  ✓ Loaded {len(tables)} tables")
    print(f"  ✓ Loaded {total_fields} fields")
    print(f"  ✓ Loaded {len(glossary_terms)} glossary terms")
    print()

    # Generate INSERT statements
    print("[2] Generating INSERT statements...")
    field_inserts = generate_field_metadata_inserts(yaml_data)
    glossary_inserts = generate_glossary_inserts(yaml_data)

    print(f"  ✓ Generated {len(field_inserts)} field_metadata inserts")
    print(f"  ✓ Generated {len(glossary_inserts)} glossary inserts")
    print()

    # Write to file
    print("[3] Writing SQL file...")
    sql_file = "/tmp/populate_semantic_layer.sql"

    with open(sql_file, "w") as f:
        f.write("-- Auto-generated semantic layer population script\n")
        f.write(f"-- Generated: {datetime.now().isoformat()}\n")
        f.write("-- Tables: field_metadata, glossary\n\n")

        f.write("-- ============================================================================\n")
        f.write("-- INSERT FIELD METADATA\n")
        f.write("-- ============================================================================\n\n")
        for insert in field_inserts:
            f.write(insert + "\n")

        f.write("\n-- ============================================================================\n")
        f.write("-- INSERT GLOSSARY TERMS\n")
        f.write("-- ============================================================================\n\n")
        for insert in glossary_inserts:
            f.write(insert + "\n")

    print(f"  ✓ Wrote {sql_file}")
    print(f"  ✓ Total SQL statements: {len(field_inserts) + len(glossary_inserts)}")
    print()

    # Show next steps
    print("[4] Next steps:")
    print(f"  Run: tdx query {sql_file}")
    print()
    print("=" * 70)
    print("READY TO POPULATE")
    print("=" * 70)

if __name__ == "__main__":
    main()
