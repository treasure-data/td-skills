"""Synthetic stdlib checks. SQLite analogues are NOT Trino/staging proof.

The SQL bodies are loaded from queries.md. Only TD time/display functions,
Trino UNNEST, and TRY(JSON scalar) are adapted for SQLite. Probe-backed views
record evaluated content fields, catching a fetch-then-filter implementation
in this analogue; this is not proof of production query-planner I/O isolation.
"""

from contextlib import closing
import importlib.util
import json
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import unittest
from datetime import datetime
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "ai-voice-cdp-table-guide"
SCRIPT = SKILL / "scripts" / "recording_scope.py"
spec = importlib.util.spec_from_file_location("cdp_recording_scope", SCRIPT)
scope_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scope_module)
build_scope = scope_module.build_scope
ScopeError = scope_module.ScopeError
QUERIES_TEXT = (SKILL / "references" / "queries.md").read_text(encoding="utf-8")
QUERIES = dict(re.findall(r"```sql\n-- (q\d+b?): [^\n]+\n(.*?)\n```", QUERIES_TEXT, re.S))
NIGHT = 1793458740  # 2026-10-31 23:59:00 +09:00, synthetic call start.
ORG = "org-a"
ME = "me@test.com"


def metadata(rid="chosen", owner=ME, org=ORG, start=NIGHT, duration=180, **extra):
    return dict(organization_id=org, recording_id=rid, recorder_email=owner,
                recording_time=start, duration_seconds=duration,
                parent_metadata_present=True, **extra)


def payload(rows=None, **extra):
    return dict(organization_id=ORG, requester_email=ME,
                metadata_rows=rows if rows is not None else [metadata()], **extra)


class ScopeBuilderTests(unittest.TestCase):
    def test_defaults_to_own_preview_not_all_accessible_recordings(self):
        result = build_scope(payload([metadata(), metadata("other", "other@test.com"),
                                      metadata("foreign", org="org-b")]))
        self.assertEqual(result["selected_recording_ids"], ["chosen"])
        self.assertNotIn("other@test.com", result["recording_scope_cte"])
        self.assertNotIn("org-b", result["recording_scope_cte"])

    def test_other_recorder_requires_explicit_named_selection_and_confirmation(self):
        rows = [metadata(), metadata("other", "other@test.com")]
        with self.assertRaises(ScopeError):
            build_scope(payload(rows, selected_recording_ids=["other"]))
        result = build_scope(payload(rows, selected_recording_ids=["other"],
                                     confirmed_other_recording_ids=["other"]))
        self.assertEqual(result["selected_recording_ids"], ["other"])
        with self.assertRaises(ScopeError):
            build_scope(payload(rows, confirmed_other_recording_ids=["other"]))
        with self.assertRaises(ScopeError):
            build_scope(payload(rows, selected_recording_ids=["chosen"],
                                confirmed_other_recording_ids=["other"]))

    def test_empty_unknown_or_cross_organization_scope_fails_closed(self):
        cases = [payload([]), payload(selected_recording_ids=[]),
                 payload(selected_recording_ids=["unknown"]),
                 payload([metadata("foreign", org="org-b")], selected_recording_ids=["foreign"]),
                 {**payload(), "organization_id": None},
                 {**payload(), "requester_email": ""}]
        for item in cases:
            with self.subTest(item=item), self.assertRaises(ScopeError):
                build_scope(item)

    def test_missing_parent_owner_and_bounds_are_not_inferred(self):
        invalid = [
            {**metadata("orphan"), "parent_metadata_present": False},
            {**metadata("unknown-owner"), "recorder_email": None},
            {**metadata("unknown-duration"), "duration_seconds": None},
            {**metadata("zero-duration"), "duration_seconds": 0},
            {**metadata("bool-duration"), "duration_seconds": True},
            {**metadata("float-time"), "recording_time": float(NIGHT)},
        ]
        result = build_scope(payload([metadata()] + invalid))
        self.assertEqual(result["selected_recording_ids"], ["chosen"])
        self.assertEqual(len(result["excluded"]), len(invalid))
        for row in invalid:
            with self.subTest(row=row), self.assertRaises(ScopeError):
                build_scope(payload([row], selected_recording_ids=[row["recording_id"]]))
        with self.assertRaises(ScopeError):
            build_scope(payload([invalid[0]], selected_recording_ids=["orphan"],
                                confirmed_other_recording_ids=["orphan"]))

    def test_duplicate_or_malformed_metadata_is_an_error(self):
        for rows in ([metadata(), metadata()], [{**metadata(), "organization_id": None}],
                     [{**metadata(), "recording_id": ""}],
                     [{**metadata(), "inferred_name": "must not be prefetched"}]):
            with self.subTest(rows=rows), self.assertRaises(ScopeError):
                build_scope(payload(rows))

    def test_policy_reference_and_current_assignment_are_not_entitlements(self):
        with self.assertRaises(ScopeError):
            build_scope({**payload([metadata("other", "other@test.com")]),
                         "selected_recording_ids": ["other"], "policy_ref": "approved"})
        with self.assertRaises(ScopeError):
            build_scope(payload([{**metadata(owner=None), "assigned_user_email": ME}]))

    def test_whole_call_bounds_cross_midnight_not_original_period_end(self):
        result = build_scope(payload())
        self.assertEqual(result["recording_partition_start_utc"], "2026-10-31 14:59:00")
        self.assertEqual(result["recording_partition_end_utc"], "2026-10-31 14:59:01")
        self.assertEqual(result["segment_partition_end_utc"], "2026-10-31 15:02:01")
        self.assertIn(str(NIGHT + 181), result["recording_scope_cte"])

    def test_sql_literals_round_trip_without_becoming_sql(self):
        org = "org'--"
        rid = "call'); DROP TABLE recordings; --"
        result = build_scope({**payload([metadata(rid, org=org)]), "organization_id": org})
        with closing(sqlite3.connect(":memory:")) as db:
            row = db.execute("with " + result["recording_scope_cte"] +
                             " select organization_id, recording_id from recording_scope").fetchone()
        self.assertEqual(row, (org, rid))

    def test_cli_success_and_fail_closed_error(self):
        for data, expected in ((payload(), 0), (payload(selected_recording_ids=[]), 2)):
            run = subprocess.run([sys.executable, "-I", "-B", str(SCRIPT), "--input", "-"],
                                 input=json.dumps(data), capture_output=True, text=True, check=False)
            self.assertEqual(run.returncode, expected, run.stderr)
            if expected == 0:
                self.assertEqual(json.loads(run.stdout)["selected_count"], 1)
            else:
                self.assertEqual(run.stdout, "")
                self.assertIn("Scope not built", run.stderr)


class DocumentedSQLiteAnalogueTests(unittest.TestCase):
    """NOT TD Trino, permissions, physical I/O isolation, or staging validation."""

    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.row_factory = sqlite3.Row
        self.db.execute("attach database ':memory:' as export_fixture")
        self.probes = []
        self.db.create_function("content_probe", 4, self.probe)
        self.db.create_function("td_time_range", 4, self.time_range)
        self.db.create_function("td_time_string", 3, self.time_string)
        self.db.create_function("strpos", 2, lambda text, key: text.find(key) + 1 if text is not None else None)
        self.db.create_function("fixture_json_scalar", 2, self.json_scalar)
        self.make_tables()
        self.add_fixtures()
        self.probes.clear()

    def tearDown(self):
        self.db.close()

    def probe(self, org, rid, field, value):
        self.probes.append((org, rid, field))
        return value

    @staticmethod
    def epoch(value, zone):
        date = datetime.fromisoformat(value)
        if date.tzinfo is None:
            date = date.replace(tzinfo=ZoneInfo(zone))
        return date.timestamp()

    @classmethod
    def time_range(cls, value, start, end, zone):
        return cls.epoch(start, zone) <= value < cls.epoch(end, zone)

    @staticmethod
    def time_string(value, fmt, zone):
        if fmt != "s":
            raise AssertionError("Analogue implements only offset-inclusive 's'")
        return datetime.fromtimestamp(value, ZoneInfo(zone)).isoformat(sep=" ", timespec="seconds")

    @staticmethod
    def json_scalar(value, path):
        try:
            return json.loads(value).get(path.removeprefix("$."))
        except (TypeError, ValueError, AttributeError):
            return None

    def make_tables(self):
        columns = {
            "recordings": "organization_id text, unique_id text, updated_at integer, id text, time integer, user_email text, user_name text, duration_seconds integer, status text, inferred_name text, transcription_text text, summary_text text, action_items text, tags text, device_serial_number text, external_metadata text",
            "summaries": "organization_id text, unique_id text, updated_at integer, recording_id text, time integer, inferred_name text, summary_text text, action_items text",
            "transcript_segments": "organization_id text, unique_id text, updated_at integer, recording_id text, time integer, segment_index integer, start_ms integer, end_ms integer, speaker_label text, speaker_id text, text text",
            "devices": "organization_id text, unique_id text, updated_at integer, serial_number text, time integer, device_model text, status text, assigned_user_name text, assigned_user_email text",
        }
        protected = {
            "recordings": {"inferred_name", "transcription_text", "summary_text", "action_items", "external_metadata"},
            "summaries": {"inferred_name", "summary_text", "action_items"},
            "transcript_segments": {"speaker_label", "speaker_id", "text"}, "devices": set(),
        }
        for table, definition in columns.items():
            self.db.execute(f"create table export_fixture.raw_{table} ({definition})")
            rid = "id" if table == "recordings" else "recording_id"
            projection = []
            for definition_part in definition.split(", "):
                name = definition_part.split()[0]
                if name in protected[table]:
                    projection.append(f"content_probe(organization_id, {rid}, '{name}', {name}) as {name}")
                else:
                    projection.append(name)
            self.db.execute(f"create view export_fixture.{table} as select " +
                            ", ".join(projection) + f" from raw_{table}")

    def insert(self, table, **row):
        columns = ", ".join(row)
        marks = ", ".join("?" for _ in row)
        self.db.execute(f"insert into export_fixture.raw_{table} ({columns}) values ({marks})", tuple(row.values()))

    def parent(self, rid, owner=ME, org=ORG, start=NIGHT, version=2, status="COMPLETED"):
        self.insert("recordings", organization_id=org, unique_id="r-" + rid, updated_at=version,
                    id=rid, time=start, user_email=owner, user_name="Recorder " + str(owner),
                    duration_seconds=180, status=status, inferred_name="title-" + rid,
                    transcription_text="transcript-" + rid + "-v" + str(version),
                    summary_text="parent-summary-" + rid, action_items='["parent-action"]',
                    tags=json.dumps(["stale" if version == 1 else "demo"]),
                    device_serial_number="shared-device", external_metadata='{"recordRef":"00042"}')

    def summary(self, rid, org=ORG, start=NIGHT, version=2):
        self.insert("summaries", organization_id=org, unique_id="s-" + rid,
                    updated_at=version, recording_id=rid, time=start, inferred_name="title-" + rid,
                    summary_text="summary-" + rid + "-v" + str(version),
                    action_items=json.dumps(["action-" + rid + "-v" + str(version)]))

    def segment(self, rid, index=0, org=ORG, start=NIGHT, offset=20, version=2, text=None):
        self.insert("transcript_segments", organization_id=org, unique_id=f"seg-{rid}-{index}",
                    updated_at=version, recording_id=rid, time=start + offset,
                    segment_index=index, start_ms=offset * 1000, end_ms=(offset + 10) * 1000,
                    speaker_label="", speaker_id="spk_0", text=text or "price-" + rid + "-v" + str(version))

    def add_fixtures(self):
        self.parent("chosen", version=1)
        self.parent("chosen")
        self.summary("chosen", version=1)
        self.summary("chosen")
        self.segment("chosen", version=1)
        self.segment("chosen")
        self.segment("chosen", index=1, offset=90, text="price-after-midnight")
        self.segment("chosen", index=2, offset=600, text="price-outside-this-call")
        for rid, owner, org, start in [
            ("unselected", ME, ORG, NIGHT + 1),
            ("other", "colleague@test.com", ORG, NIGHT + 2),
            ("unknown", None, ORG, NIGHT + 3),
            ("moved-owner", "new-recorder@test.com", ORG, NIGHT + 4),
            ("chosen", ME, "org-b", NIGHT),  # Same recording/unique IDs, different org.
            ("later", ME, ORG, NIGHT + 3600),
        ]:
            self.parent(rid, owner, org, start, status="FAILED" if rid == "unselected" else "COMPLETED")
            self.summary(rid, org, start)
            self.segment(rid, org=org, start=start)
        self.parent("moved-owner", ME, start=NIGHT + 4, version=1)
        self.summary("orphan")  # Intentionally no recordings parent.
        self.segment("orphan")
        for org, version, assigned in [(ORG, 1, "former@test.com"), (ORG, 2, "current@test.com"),
                                        ("org-b", 2, "foreign@test.com")]:
            self.insert("devices", organization_id=org, unique_id="device-1", updated_at=version,
                        serial_number="shared-device", time=NIGHT - version * 86400 * 7,
                        device_model="Fixture Device", status="ACTIVE", assigned_user_name=assigned,
                        assigned_user_email=assigned)

    def render(self, name, scope=None, **overrides):
        params = dict(database="export_fixture", organization_id=ORG, requester_email=ME,
                      period_start="2026-10-31", period_end="2026-11-02", tz="Asia/Tokyo",
                      device_scan_start_utc="2026-09-01", device_scan_end_utc="2026-11-02",
                      keyword="price")
        if scope:
            params.update(scope)
        params.update(overrides)
        sql = QUERIES[name].format_map(params)
        # Explicit SQLite analogues, NOT validation of these Trino features.
        sql = sql.replace("cross join unnest(s.action_items) as t(item)",
                          "cross join json_each(s.action_items) as t").replace("t.item", "t.value")
        sql = sql.replace("cross join unnest(r.tags) as t(tag)",
                          "cross join json_each(r.tags) as t").replace("t.tag", "t.value")
        sql = sql.replace("try(json_extract_scalar(external_metadata, '$.recordRef'))",
                          "fixture_json_scalar(external_metadata, '$.recordRef')")
        return sql

    def run_query(self, name, scope=None, **overrides):
        return [dict(row) for row in self.db.execute(self.render(name, scope, **overrides))]

    def preview(self, wider=False, **overrides):
        sql = self.render("q2", **overrides)
        if wider:
            # Deliberately widened METADATA preview only, before named confirmation.
            sql = sql.replace("and user_email = 'me@test.com'", "")
        result = [dict(row) for row in self.db.execute(sql)]
        for row in result:
            row["parent_metadata_present"] = bool(row["parent_metadata_present"])
        return result

    def chosen_scope(self):
        return build_scope(payload(self.preview(), selected_recording_ids=["chosen"]))

    def assert_only_selected_probes(self, expected):
        self.assertTrue(self.probes, "Expected selected content fields to be evaluated")
        self.assertEqual({(org, rid) for org, rid, field in self.probes}, expected)

    def test_metadata_preview_has_no_content_and_deduplicates_before_ownership(self):
        rows = self.preview()
        self.assertEqual({row["recording_id"] for row in rows}, {"chosen", "unselected", "later"})
        self.assertEqual(sum(row["recording_id"] == "chosen" for row in rows), 1)
        self.assertEqual(self.probes, [])
        for query in ("q1", "q8", "q9", "q10"):
            with self.subTest(query=query):
                self.run_query(query)
                self.assertEqual(self.probes, [])

    def test_all_documented_content_examples_gate_each_source(self):
        selected = self.chosen_scope()
        for name in ("q3", "q4", "q4b", "q5", "q6", "q7", "q11"):
            with self.subTest(query=name):
                self.probes.clear()
                rows = self.run_query(name, selected)
                self.assertTrue(rows)
                self.assertEqual({(row["organization_id"], row["recording_id"]) for row in rows},
                                 {(ORG, "chosen")})
                self.assert_only_selected_probes({(ORG, "chosen")})

    def test_confirmed_other_recorder_never_widens_to_all_people(self):
        rows = self.preview(wider=True)
        self.assertEqual(self.probes, [])
        selected = build_scope(payload(rows, selected_recording_ids=["other"],
                                       confirmed_other_recording_ids=["other"]))
        self.run_query("q6", selected)
        self.assert_only_selected_probes({(ORG, "other")})

    def test_cross_midnight_selected_call_keeps_offset_and_full_context(self):
        selected = build_scope(payload(self.preview(period_end="2026-11-01"),
                                       selected_recording_ids=["chosen"]))
        rows = self.run_query("q4", selected)
        self.assertEqual([row["segment_index"] for row in rows], [0, 1])
        self.assertEqual(rows[1]["utterance_at"], "2026-11-01 00:00:30+09:00")
        self.assertEqual(rows[1]["start_sec"], 90)
        self.assertEqual(rows[0]["speaker"], "spk_0")
        self.assertNotIn("v1", rows[0]["text"])
        self.assert_only_selected_probes({(ORG, "chosen")})

    def test_per_call_bounds_still_apply_inside_wider_partition_span(self):
        selected = build_scope(payload(self.preview(), selected_recording_ids=["chosen", "later"]))
        rows = self.run_query("q4", selected)
        self.assertEqual([(row["recording_id"], row["segment_index"]) for row in rows],
                         [("chosen", 0), ("chosen", 1), ("later", 0)])
        self.assert_only_selected_probes({(ORG, "chosen"), (ORG, "later")})

    def test_latest_summary_action_transcript_and_external_identifier(self):
        selected = self.chosen_scope()
        self.assertEqual(self.run_query("q3", selected)[0]["summary_text"], "summary-chosen-v2")
        self.assertEqual(self.run_query("q7", selected)[0]["action_item"], "action-chosen-v2")
        self.assertEqual(self.run_query("q4b", selected)[0]["transcription_text"], "transcript-chosen-v2")
        self.assertEqual(self.run_query("q11", selected)[0]["record_ref"], "00042")
        talk = self.run_query("q5", selected)
        self.assertEqual(talk[0]["segments"], 2)
        self.assertEqual(talk[0]["talk_seconds"], 20)

    def test_metadata_aggregate_population_is_separate_from_content_selection(self):
        status = self.run_query("q10")
        self.assertEqual(sum(row["recordings"] for row in status), 6)
        self.assertEqual(self.run_query("q8"), [{"tag": "demo", "recordings": 6}])
        self.assertEqual(self.probes, [])
        selected = self.chosen_scope()
        self.assertEqual(selected["selected_count"], 1)
        self.run_query("q6", selected)
        self.assert_only_selected_probes({(ORG, "chosen")})

    def test_current_device_assignee_is_never_used_as_historical_recorder(self):
        rows = self.run_query("q9")
        chosen = next(row for row in rows if row["recording_id"] == "chosen")
        self.assertEqual(chosen["recorder_email_at_recording"], ME)
        self.assertEqual(chosen["current_assigned_user_email"], "current@test.com")
        self.assertEqual(self.probes, [])

    def test_sql_templates_have_no_source_wildcards_and_gate_all_content_sources(self):
        self.assertEqual(set(QUERIES), {"q1", "q2", "q3", "q4", "q4b", "q5", "q6", "q7", "q8", "q9", "q10", "q11"})
        sql_blocks = re.findall(r"```sql\n(.*?)\n```", QUERIES_TEXT, re.S)
        self.assertEqual(len(sql_blocks), len(QUERIES))
        for sql in sql_blocks:
            self.assertIsNone(re.search(r"select\s+(?:\w+\.)?\*", sql, re.I))
        for name, sql in QUERIES.items():
            sources = re.findall(r"from \{database\}\.(\w+) (\w+)", sql)
            self.assertTrue(sources, name)
            for table, alias in sources:
                with self.subTest(query=name, table=table):
                    self.assertIn(f"td_time_range({alias}.time,", sql)
                    if name in {"q3", "q4", "q4b", "q5", "q6", "q7", "q11"}:
                        rid = "id" if table == "recordings" else "recording_id"
                        gate = (f"from {{database}}.{table} {alias}\n  join recording_scope sc\n"
                                f"    on {alias}.organization_id = sc.organization_id and {alias}.{rid} = sc.recording_id")
                        self.assertIn(gate, sql)


if __name__ == "__main__":
    unittest.main()
