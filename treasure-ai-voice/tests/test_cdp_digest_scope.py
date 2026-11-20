"""Execute the digest's actual SQL templates on synthetic SQLite fixtures.

Adaptation: replace {database} with SQLite's main database, render typed VALUES
and epoch placeholders, and store arrays as opaque JSON strings. The templates
use the SQL subset shared by SQLite and Trino (including window functions).
This is real local SQL execution, NOT native Trino/TD partition-pruning proof.
Human confirmation and organization/recording authorization remain live gates;
these tests do not establish either and never contact a real service.

Run: python3 -I -m unittest discover -s treasure-ai-voice/tests \
     -p 'test_cdp_digest_scope.py' -v
"""

import json
from pathlib import Path
import re
import sqlite3
import unittest
from datetime import datetime


DIGEST = Path(__file__).resolve().parents[1] / "ai-voice-cdp-meeting-digest"
SCOPE = DIGEST / "references" / "query-scope.md"


def epoch(value):
    return int(datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp())


def literal(value):
    if value is None:
        return "NULL"
    if isinstance(value, int):
        return str(value)
    return "'" + value.replace("'", "''") + "'"


def values(rows):
    if not rows:
        raise ValueError("An empty selection must skip the query, not widen it")
    return ",\n         ".join(
        "(" + ", ".join(literal(value) for value in row) + ")" for row in rows
    )


def sql_block(name):
    match = re.search(
        rf"<!-- sql:{re.escape(name)} -->\s*```sql\n(.*?)\n```",
        SCOPE.read_text(),
        re.DOTALL,
    )
    if match is None:
        raise AssertionError(f"Missing executable SQL block: {name}")
    return match.group(1)


class DigestScopeSQLTests(unittest.TestCase):
    START = epoch("2026-10-01T00:00:00Z")
    END = epoch("2026-11-01T00:00:00Z")
    FOLLOWUP = epoch("2026-11-02T10:00:00Z")
    ORG = "org-approved"
    ME = "me@example.com"
    OTHER = "other@example.com"

    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.row_factory = sqlite3.Row
        self.addCleanup(self.db.close)
        self.db.executescript("""
            CREATE TABLE recordings (
                organization_id TEXT, id TEXT, time INTEGER, unique_id TEXT,
                updated_at INTEGER, user_email TEXT, user_name TEXT,
                duration_seconds INTEGER, status TEXT, tags TEXT,
                summary_text TEXT, action_items TEXT, inferred_name TEXT,
                transcription_text TEXT
            );
            CREATE TABLE summaries (
                organization_id TEXT, recording_id TEXT, time INTEGER,
                unique_id TEXT, updated_at INTEGER, inferred_name TEXT,
                summary_text TEXT, action_items TEXT
            );
            CREATE TABLE transcript_segments (
                organization_id TEXT, recording_id TEXT, time INTEGER,
                unique_id TEXT, updated_at INTEGER, segment_index INTEGER,
                start_ms INTEGER, end_ms INTEGER, speaker_id TEXT,
                speaker_label TEXT, text TEXT
            );
        """)
        self.recording("cross-midnight", self.END - 30, duration=120, updated=100)
        self.recording("cross-midnight", self.END - 30, duration=120)
        self.recording("no-summary", self.START + 100)
        self.recording("processing", self.START + 200, status="PROCESSING")
        self.recording("unknown-duration", self.START + 300, duration=None)
        self.recording("unselected-failure", self.START + 400, status="FAILED")
        self.recording("other-recorder", self.START + 500, email=self.OTHER)
        self.recording("reassigned", self.START + 600, updated=100)
        self.recording("reassigned", self.START + 600, email=self.OTHER)
        self.recording("followup", self.FOLLOWUP)
        # Deliberate cross-organization collisions in IDs and unique_ids.
        self.recording("cross-midnight", self.END - 30, org="org-foreign")
        self.summary("cross-midnight", self.END - 30, "obsolete", updated=100)
        self.summary("cross-midnight", self.END - 30, "approved latest")
        self.summary("cross-midnight", self.END - 30, "foreign", org="org-foreign")
        self.summary("no-summary", self.START + 100, "obsolete nonempty", updated=100)
        self.summary("no-summary", self.START + 100, "")
        self.summary("unknown-duration", self.START + 300, "duration unknown")
        self.summary("other-recorder", self.START + 500, "unapproved other")
        self.summary("followup", self.FOLLOWUP, "approved followup evidence")
        # A long-recording export orphan has no recordings metadata row.
        self.summary("orphan-long-call", self.START + 700, "orphan private content")
        self.segment("cross-midnight", self.END - 30, 0, "obsolete", updated=100)
        self.segment("cross-midnight", self.END - 30, 0, "before midnight")
        self.segment("cross-midnight", self.END - 30, 1, "after midnight", offset=60)
        self.segment("cross-midnight", self.END - 30, 2, "end context", offset=119)
        self.segment("cross-midnight", self.END - 30, 3, "beyond duration", offset=200)
        self.segment("cross-midnight", self.END - 30, 0, "foreign", org="org-foreign")
        self.segment("other-recorder", self.END - 30, 0, "unapproved neighbor")
        self.segment("unknown-duration", self.START + 300, 0, "unknown end")
        self.segment("orphan-long-call", self.END - 30, 0, "orphan transcript")
        self.segment("followup", self.FOLLOWUP, 0, "approved later context")
        targets = {"cross-midnight", "no-summary", "processing", "unknown-duration"}
        self.approved = [
            dict(row, scope_role="target")
            for row in self.preview()
            if row["recording_id"] in targets
        ]
        self.approved += [
            dict(row, scope_role="followup")
            for row in self.preview(self.END, self.FOLLOWUP + 1)
            if row["recording_id"] == "followup"
        ]

    def insert(self, table, row):
        columns = ", ".join(row)
        placeholders = ", ".join("?" for _ in row)
        self.db.execute(
            f"INSERT INTO {table} ({columns}) VALUES ({placeholders})", tuple(row.values())
        )

    def recording(self, rid, time, *, org=None, email=None, duration=120,
                  status="COMPLETED", updated=300):
        self.insert("recordings", {
            "organization_id": org or self.ORG, "id": rid, "time": time,
            "unique_id": "recording-" + rid, "updated_at": updated,
            "user_email": email or self.ME, "user_name": "Recorder",
            "duration_seconds": duration, "status": status, "tags": '["weekly"]',
            "summary_text": "DO NOT READ DURING PREVIEW",
            "action_items": '["DO NOT READ DURING PREVIEW"]',
            "inferred_name": "DO NOT READ DURING PREVIEW",
            "transcription_text": "DO NOT READ DURING PREVIEW",
        })

    def summary(self, rid, time, text, *, org=None, updated=300):
        self.insert("summaries", {
            "organization_id": org or self.ORG, "recording_id": rid, "time": time,
            "unique_id": "summary-" + rid, "updated_at": updated,
            "inferred_name": "Title: " + text, "summary_text": text,
            "action_items": json.dumps(["Action: " + text]),
        })

    def segment(self, rid, time, index, text, *, offset=0, org=None, updated=300):
        self.insert("transcript_segments", {
            "organization_id": org or self.ORG, "recording_id": rid,
            "time": time + offset, "unique_id": f"segment-{rid}-{index}",
            "updated_at": updated, "segment_index": index,
            "start_ms": offset * 1000, "end_ms": (offset + 1) * 1000,
            "speaker_id": "spk_0", "speaker_label": "", "text": text,
        })

    def substitutions(self, requested=None):
        if not self.approved:
            raise ValueError("No approved rows")
        if any(row["organization_id"] != self.ORG for row in self.approved):
            raise ValueError("Selection must stay in the established organization")
        pairs = [(r["organization_id"], r["recording_id"]) for r in self.approved]
        if len(pairs) != len(set(pairs)):
            raise ValueError("Duplicate approved pair")
        batch = [r for r in self.approved if r["duration_seconds"] is not None]
        if requested is not None:
            known = {r["recording_id"] for r in batch}
            if not set(requested).issubset(known):
                raise ValueError("Transcript batch must be approved with known duration")
            batch = [r for r in batch if r["recording_id"] in requested]
        if not 0 < len(batch) <= 5:
            raise ValueError("Transcript batch needs one to five approved recordings")
        return {
            "database": "main", "organization_id": self.ORG,
            "selected_recordings_values": values([
                (r["organization_id"], r["recording_id"], r["recorded_time"],
                 r["duration_seconds"], r["user_email"], r["metadata_updated_at"],
                 r["scope_role"])
                for r in self.approved
            ]),
            "selected_start_epoch": min(r["recorded_time"] for r in self.approved),
            "selected_end_epoch": max(r["recorded_time"] for r in self.approved) + 1,
            "transcript_recording_values": values([
                (r["organization_id"], r["recording_id"]) for r in batch
            ]),
            "segment_start_epoch": min(r["recorded_time"] for r in batch),
            "segment_end_epoch": max(
                r["recorded_time"] + r["duration_seconds"] for r in batch
            ) + 1,
        }

    def preview(self, start=None, end=None, emails=None):
        sql = sql_block("preview").format_map({
            "database": "main", "organization_id": self.ORG,
            "period_start_epoch": self.START if start is None else start,
            "period_end_epoch": self.END if end is None else end,
            "preview_recorder_values": values([(e,) for e in (emails or [self.ME])]),
        })
        return self.db.execute(sql).fetchall()

    def content(self, name, requested=None):
        sql = sql_block("scope") + "\n" + sql_block(name)
        return self.db.execute(sql.format_map(self.substitutions(requested))).fetchall()

    def test_preview_cannot_read_content_columns_or_content_tables(self):
        forbidden = {"summary_text", "action_items", "inferred_name", "transcription_text"}
        reads = []

        def authorizer(action, table, column, _db, _source):
            if action == sqlite3.SQLITE_READ:
                reads.append((table, column))
                if table != "recordings" or column in forbidden:
                    return sqlite3.SQLITE_DENY
            return sqlite3.SQLITE_OK

        self.db.set_authorizer(authorizer)
        try:
            rows = self.preview()
        finally:
            self.db.set_authorizer(None)
        self.assertTrue(reads)
        ids = {row["recording_id"] for row in rows}
        self.assertEqual(ids, {
            "cross-midnight", "no-summary", "processing", "unknown-duration",
            "unselected-failure",
        })
        self.assertTrue(all(row["organization_id"] == self.ORG for row in rows))
        self.assertEqual(len(rows), len(ids))

    def test_explicit_other_recorder_preview_is_still_metadata_only(self):
        rows = self.preview(emails=[self.OTHER])
        self.assertEqual({r["recording_id"] for r in rows}, {"other-recorder", "reassigned"})
        self.assertTrue(all(r["user_email"] == self.OTHER for r in rows))
        self.assertNotIn("title", rows[0].keys())

    def test_summaries_actions_titles_use_only_frozen_pairs_and_latest_rows(self):
        rows = self.content("summaries")
        by_id = {r["recording_id"]: r for r in rows}
        self.assertEqual(set(by_id), {"cross-midnight", "unknown-duration", "followup"})
        self.assertTrue(all(r["organization_id"] == self.ORG for r in rows))
        self.assertEqual(by_id["cross-midnight"]["title"], "Title: approved latest")
        self.assertEqual(json.loads(by_id["cross-midnight"]["action_items"]),
                         ["Action: approved latest"])
        self.assertEqual(by_id["followup"]["scope_role"], "followup")

    def test_exclusions_never_count_unselected_or_foreign_recordings(self):
        rows = self.content("exclusions")
        self.assertEqual(
            {(r["organization_id"], r["recording_id"], r["reason"]) for r in rows},
            {(self.ORG, "processing", "PROCESSING"),
             (self.ORG, "no-summary", "summary_unavailable")},
        )

    def test_transcript_keeps_cross_midnight_context_without_neighbor_calls(self):
        rows = self.content("transcripts", requested=["cross-midnight"])
        self.assertEqual([r["text"] for r in rows],
                         ["before midnight", "after midnight", "end context"])
        self.assertTrue(all(r["organization_id"] == self.ORG for r in rows))
        self.assertTrue(all(r["recording_id"] == "cross-midnight" for r in rows))

    def test_approved_followup_uses_its_own_recording_and_segment_bounds(self):
        rows = self.content("transcripts", requested=["cross-midnight", "followup"])
        self.assertEqual({r["recording_id"] for r in rows}, {"cross-midnight", "followup"})
        self.assertIn("approved later context", [r["text"] for r in rows])
        self.assertIn("after midnight", [r["text"] for r in rows])

    def test_unknown_duration_cannot_request_unbounded_transcript(self):
        with self.assertRaisesRegex(ValueError, "known duration"):
            self.content("transcripts", requested=["unknown-duration"])
        self.assertNotIn("unknown-duration",
                         {r["recording_id"] for r in self.content("transcripts")})
        self.assertIn("unknown-duration",
                      {r["recording_id"] for r in self.content("summaries")})

    def test_orphan_content_is_not_admitted_even_by_an_invented_snapshot(self):
        # Adversarial input: production is forbidden to freeze missing metadata.
        self.approved.append({
            "organization_id": self.ORG, "recording_id": "orphan-long-call",
            "recorded_time": self.START + 700, "duration_seconds": 10000,
            "user_email": self.ME, "metadata_updated_at": 300, "scope_role": "target",
        })
        self.assertNotIn("orphan-long-call",
                         {r["recording_id"] for r in self.content("summaries")})
        # Narrow the transcript batch so the adversarial sixth row cannot expand it.
        rows = self.content("transcripts", requested=["orphan-long-call"])
        self.assertEqual(rows, [])
        reasons = {r["recording_id"]: r["reason"] for r in self.content("exclusions")}
        self.assertEqual(reasons["orphan-long-call"], "metadata_missing_or_changed")

    def test_metadata_guard_is_content_free_and_detects_drift_before_batch(self):
        self.recording("cross-midnight", self.END - 30, email=self.OTHER, updated=400)
        guard = sql_block("scope") + "\nSELECT count(*) AS selected_count FROM selected"

        def authorizer(action, table, _column, _db, _source):
            if action == sqlite3.SQLITE_READ and table != "recordings":
                return sqlite3.SQLITE_DENY
            return sqlite3.SQLITE_OK

        self.db.set_authorizer(authorizer)
        try:
            count = self.db.execute(guard.format_map(self.substitutions())).fetchone()[0]
        finally:
            self.db.set_authorizer(None)
        self.assertEqual(count, len(self.approved) - 1)
        # Production must stop at that mismatch. Independently verify fail-closed SQL.
        self.assertNotIn("cross-midnight",
                         {r["recording_id"] for r in self.content("summaries")})
        reasons = {r["recording_id"]: r["reason"] for r in self.content("exclusions")}
        self.assertEqual(reasons["cross-midnight"], "metadata_missing_or_changed")

    def test_empty_foreign_or_duplicate_selection_is_not_rendered(self):
        with self.assertRaises(ValueError):
            values([])
        self.approved.append(dict(self.approved[0]))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            self.substitutions()
        self.approved.pop()
        self.approved[0]["organization_id"] = "org-foreign"
        with self.assertRaisesRegex(ValueError, "established organization"):
            self.substitutions()

    def test_frontmatter_is_single_quoted_yaml_line_with_bounded_description(self):
        lines = (DIGEST / "SKILL.md").read_text().splitlines()
        descriptions = [line for line in lines if line.startswith("description:")]
        self.assertEqual(len(descriptions), 1)
        raw = descriptions[0].removeprefix("description: ")
        self.assertTrue(raw.startswith('"') and raw.endswith('"'))
        self.assertLessEqual(len(json.loads(raw)), 1024)
        self.assertTrue((DIGEST / "references" / "routing-examples.md").is_file())


if __name__ == "__main__":
    unittest.main()
