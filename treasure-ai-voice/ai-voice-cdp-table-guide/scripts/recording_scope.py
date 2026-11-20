#!/usr/bin/env python3
"""Build a fixed SQL selection from metadata, never an authorization decision.

Standard library only; no network, SQL execution, identity lookup, or file writes.
See references/recording-scope.md for the input contract and trust boundary.
"""

import argparse
import json
import sys
from datetime import datetime, timezone


class ScopeError(ValueError):
    """Scope is unresolved; callers must not run a content query."""


_TOP_KEYS = {
    "organization_id", "requester_email", "metadata_rows",
    "selected_recording_ids", "confirmed_other_recording_ids",
}
_METADATA_KEYS = {
    "organization_id", "recording_id", "recording_time", "recorder_email",
    "duration_seconds", "parent_metadata_present", "recorded_at",
    "recorder_name", "status",
}


def _identifier(value, name):
    if not isinstance(value, str) or not value or value.strip() != value:
        raise ScopeError(f"{name} must be a nonempty, unpadded string")
    if any(ord(char) < 32 or ord(char) == 127 for char in value):
        raise ScopeError(f"{name} must not contain control characters")
    return value


def _ids(value, name):
    if not isinstance(value, list):
        raise ScopeError(f"{name} must be a list")
    result = [_identifier(item, name) for item in value]
    if len(set(result)) != len(result):
        raise ScopeError(f"{name} must not contain duplicates")
    return result


def _literal(value):
    return "'" + value.replace("'", "''") + "'"


def _utc(epoch):
    try:
        return datetime.fromtimestamp(epoch, timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    except (OverflowError, OSError, ValueError) as exc:
        raise ScopeError("Recording time bounds are outside the supported date range") from exc


def build_scope(payload):
    """Return a SQL CTE and UTC scan bounds, or raise ScopeError (fail closed).

    metadata_rows must come from the bounded, latest-parent metadata preview.
    Own recordings are selected by default. Other recorders require explicit
    selection AND confirmed_other_recording_ids. Those caller-supplied inputs
    record selection only: this function cannot verify permissions, identity,
    provenance, freshness, or whether the user actually gave confirmation.
    """
    if not isinstance(payload, dict) or set(payload) - _TOP_KEYS:
        raise ScopeError("Expected only documented scope input fields")
    organization_id = _identifier(payload.get("organization_id"), "organization_id")
    requester_email = _identifier(payload.get("requester_email"), "requester_email")
    rows = payload.get("metadata_rows")
    if not isinstance(rows, list):
        raise ScopeError("metadata_rows must be a list of metadata-only objects")

    admissible = {}
    seen = set()
    excluded = []
    for row in rows:
        if not isinstance(row, dict) or set(row) - _METADATA_KEYS:
            raise ScopeError("metadata_rows must contain only documented metadata fields")
        # Never interpret a missing organization as the requested organization.
        row_org = _identifier(row.get("organization_id"), "metadata organization_id")
        recording_id = _identifier(row.get("recording_id"), "recording_id")
        if row_org != organization_id:
            continue
        if recording_id in seen:
            raise ScopeError("Duplicate recording ID in organization; resolve latest metadata first")
        seen.add(recording_id)
        reason = None
        if row.get("parent_metadata_present") is not True:
            reason = "missing_parent_metadata"
        elif not isinstance(row.get("recorder_email"), str) or not row["recorder_email"].strip():
            reason = "unknown_recorder"
        elif type(row.get("recording_time")) is not int or row["recording_time"] < 0:
            reason = "invalid_recording_time"
        elif type(row.get("duration_seconds")) is not int or row["duration_seconds"] <= 0:
            reason = "invalid_duration"
        if reason:
            excluded.append({"recording_id": recording_id, "reason": reason})
            continue
        _identifier(row["recorder_email"], "recorder_email")
        admissible[recording_id] = row

    explicit_selection = "selected_recording_ids" in payload
    if explicit_selection:
        selected_ids = _ids(payload["selected_recording_ids"], "selected_recording_ids")
    else:
        selected_ids = [rid for rid, row in admissible.items()
                        if row["recorder_email"] == requester_email]
    if not selected_ids:
        raise ScopeError("Empty recording selection; no content query may run")
    if any(rid not in admissible for rid in selected_ids):
        raise ScopeError("Selected ID lacks admissible parent metadata in the requested organization")

    confirmed_others = set(_ids(payload.get("confirmed_other_recording_ids", []),
                               "confirmed_other_recording_ids"))
    if not confirmed_others.issubset(selected_ids):
        raise ScopeError("Other-recorder confirmation must name only selected IDs")
    other_ids = {rid for rid in selected_ids
                 if admissible[rid]["recorder_email"] != requester_email}
    if other_ids and (not explicit_selection or not other_ids.issubset(confirmed_others)):
        raise ScopeError("Other people's recordings require explicit ID selection and confirmation")
    if confirmed_others - other_ids:
        raise ScopeError("confirmed_other_recording_ids must name other people's recordings only")

    selected = sorted((admissible[rid] for rid in selected_ids),
                      key=lambda row: (row["recording_time"], row["recording_id"]))
    values = []
    for row in selected:
        start = row["recording_time"]
        # Segment time is already start + offset, at epoch-second precision.
        # Include the final second, even for a segment starting at duration.
        end = start + row["duration_seconds"] + 1
        _utc(end)
        values.append("    (" + ", ".join([
            _literal(organization_id), _literal(row["recording_id"]),
            _literal(row["recorder_email"]), str(start), str(end),
        ]) + ")")
    start = min(row["recording_time"] for row in selected)
    recording_end = max(row["recording_time"] for row in selected) + 1
    segment_end = max(row["recording_time"] + row["duration_seconds"] + 1 for row in selected)
    return {
        "organization_id": organization_id,
        "selected_recording_ids": [row["recording_id"] for row in selected],
        "selected_count": len(selected),
        "excluded": excluded,
        "recording_partition_start_utc": _utc(start),
        "recording_partition_end_utc": _utc(recording_end),
        "segment_partition_start_utc": _utc(start),
        "segment_partition_end_utc": _utc(segment_end),
        "recording_scope_cte": (
            "recording_scope (organization_id, recording_id, recorder_email, "
            "recording_time, segment_end_time) as (\n  values\n"
            + ",\n".join(values) + "\n)"
        ),
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Metadata-selection JSON file, or - for stdin")
    args = parser.parse_args(argv)
    try:
        if args.input == "-":
            payload = json.load(sys.stdin)
        else:
            with open(args.input, encoding="utf-8") as source:
                payload = json.load(source)
        result = build_scope(payload)
    except (ScopeError, OSError, ValueError) as exc:
        print(f"Scope not built: {exc}", file=sys.stderr)
        return 2
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
