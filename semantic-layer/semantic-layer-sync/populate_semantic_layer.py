#!/usr/bin/env python3
"""
populate_semantic_layer.py

Populates semantic_layer_v1 tables with data from YAML definitions.
Reads data_dictionary_full.yaml and inserts into:
- field_metadata
- glossary
- field_relationships
"""

import yaml
from datetime import datetime
import sys

def load_yaml(path):
    """Load YAML file"""
    try:
        with open(path) as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"ERROR: Could not load {path}: {e}")
        sys.exit(1)

def generate_field_metadata_inserts(yaml_data):
    """Generate INSERT statements for field_metadata table"""
    inserts = []

    for table_name, table_def in yaml_data.get("tables", {}).items():
        if "." not in table_name:
            continue

        db_name, tbl_name = table_name.split(".", 1)

        for field in table_def.get("fields", []):
            tags = ",".join(field.get("tags", []))
            # Format tags as ARRAY literal: ARRAY['tag1','tag2']
            tags_array = "ARRAY['" + "','".join(field.get("tags", [])) + "']" if field.get("tags", []) else "ARRAY[]"

            business_term = field.get("business_term", "")
            description = field.get("description", "")
            is_pii = 1 if field.get("is_pii", False) else 0
            pii_category = field.get("pii_category", "")
            owner = field.get("owner", table_def.get("owner", ""))

            # Escape single quotes
            business_term = business_term.replace("'", "''")
            description = description.replace("'", "''")

            insert = f"""INSERT INTO semantic_layer_v1.field_metadata (database_name, table_name, field_name, tags, business_term, description, is_pii, pii_category, owner, created_at, updated_at) VALUES ('{db_name}', '{tbl_name}', '{field['name']}', {tags_array}, '{business_term}', '{description}', {is_pii}, '{pii_category}', '{owner}', '{datetime.now().isoformat()}', '{datetime.now().isoformat()}');"""
            inserts.append(insert)

    return inserts

def generate_glossary_inserts(yaml_data):
    """Generate INSERT statements for glossary table"""
    inserts = []

    for term in yaml_data.get("glossary", []):
        term_name = term["term"].replace("'", "''")
        definition = term.get("definition", "").replace("'", "''")
        owner = term.get("owner", "").replace("'", "''")

        insert = f"""INSERT INTO semantic_layer_v1.glossary (term, definition, owner, created_at, updated_at) VALUES ('{term_name}', '{definition}', '{owner}', '{datetime.now().isoformat()}', '{datetime.now().isoformat()}');"""
        inserts.append(insert)

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
