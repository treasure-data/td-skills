"""Execute the documented usage SQL on synthetic SQLite fixtures.

TD time functions, count_if, and max_by have explicit local stand-ins. This is
relational attribution/deduplication evidence, not native Trino or Studio proof.
"""
import re
import sqlite3
import unittest
from datetime import datetime, timezone
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent / "ai-voice-cdp-usage-report" / "SKILL.md"
START = 1793491200


class CountIf:
    def __init__(self):
        self.value = 0
    def step(self, value):
        self.value += bool(value)
    def finalize(self):
        return self.value


class MaxBy:
    def __init__(self):
        self.key, self.value = None, None
    def step(self, value, key):
        if key is not None and (self.key is None or key > self.key):
            self.key, self.value = key, value
    def finalize(self):
        return self.value


def query(letter):
    section = SKILL.read_text(encoding="utf-8").split("### Query " + letter + ":", 1)[1]
    sql = re.search(r"```sql\n(.*?)```", section, re.S).group(1)
    return sql.replace("{database}", "fixture").replace("{organization_id}", "org-a").replace("{tz}", "UTC")


class UsageAttributionTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:"); self.addCleanup(self.db.close)
        self.db.row_factory = sqlite3.Row
        self.db.execute("attach database ':memory:' as fixture")
        self.db.create_function("td_interval", 3, lambda t, interval, tz: int(START <= t < START + 30 * 86400))
        self.db.create_function("td_time_string", 3, lambda t, fmt, tz: datetime.fromtimestamp(t, timezone.utc).date().isoformat())
        self.db.create_aggregate("count_if", 1, CountIf)
        self.db.create_aggregate("max_by", 2, MaxBy)
        self.db.execute("""create table fixture.recordings (
          organization_id text, id text, unique_id text, updated_at integer, time integer,
          user_email text, user_name text, duration_seconds integer, status text, device_serial_number text)""")
        self.db.execute("""create table fixture.devices (
          organization_id text, unique_id text, updated_at integer, serial_number text,
          device_model text, status text, assigned_user_name text, last_sync_at text)""")
        for rid, email, name in (("r1", "old@example.com", "Original recorder"),
                                 ("r2", None, "A name without a creator key"),
                                 ("r3", "", ""), ("r4", "   ", ""),
                                 ("r5", "other@example.com", "Other recorder")):
            self.db.execute("insert into fixture.recordings values (?,?,?,?,?,?,?,?,?,?)",
                            ("org-a", rid, rid, 2, START + 1, email, name, 3600, "COMPLETED", "shared-device"))
        self.db.execute("insert into fixture.recordings values (?,?,?,?,?,?,?,?,?,?)",
                        ("org-a", "r1", "r1", 1, START + 1, "old@example.com", "Old version", 99999, "COMPLETED", "shared-device"))
        self.db.execute("insert into fixture.recordings values (?,?,?,?,?,?,?,?,?,?)",
                        ("org-b", "r1", "r1", 3, START + 1, "private@example.com", "OUTSIDE_ORG", 3600, "COMPLETED", "shared-device"))
        self.db.execute("insert into fixture.devices values (?,?,?,?,?,?,?,?)",
                        ("org-a", "d1", 2, "shared-device", "synthetic", "ACTIVE", "New device holder", "2026-11-01T00:00:00Z"))
        self.db.execute("insert into fixture.devices values (?,?,?,?,?,?,?,?)",
                        ("org-a", "d2", 2, "unused", "synthetic", "ACTIVE", "", "2026-11-01T00:00:00Z"))
        self.db.execute("insert into fixture.devices values (?,?,?,?,?,?,?,?)",
                        ("org-b", "d1", 3, "shared-device", "synthetic", "ACTIVE", "OUTSIDE_DEVICE", "2026-11-01T00:00:00Z"))

    def rows(self, letter):
        return [dict(r) for r in self.db.execute(query(letter))]

    def test_null_empty_and_whitespace_creators_are_one_unknown_bucket(self):
        rows = self.rows("A")
        unknown = next(r for r in rows if r["email"] is None)
        self.assertEqual((unknown["recordings"], unknown["unknown_creator"], unknown["hours"]), (3, 3, 3.0))
        self.assertEqual(unknown["person"], "(作成者不明)")

    def test_current_assignee_does_not_receive_historical_recordings(self):
        rows = self.rows("A")
        self.assertNotIn("New device holder", str(rows))
        self.assertNotIn("devices", query("A"))
        self.assertEqual(next(r for r in rows if r["email"] == "old@example.com")["recordings"], 1)

    def test_total_recordings_and_hours_include_unknown_but_people_do_not(self):
        rows = self.rows("A")
        self.assertEqual(sum(r["recordings"] for r in rows), 5)
        self.assertEqual(sum(r["hours"] for r in rows), 5.0)
        self.assertEqual(sum(r["email"] is not None for r in rows), 2)

    def test_device_report_can_show_current_assignment_without_changing_attribution(self):
        rows = self.rows("B")
        current = next(r for r in rows if r["serial_number"] == "shared-device")
        self.assertEqual((current["assigned_to"], current["recordings_in_period"]), ("New device holder", 5))
        self.assertEqual(next(r for r in rows if r["serial_number"] == "unused")["recordings_in_period"], 0)

    def test_other_organization_is_excluded_even_with_same_ids_and_serials(self):
        self.assertNotIn("OUTSIDE", str(self.rows("A")) + str(self.rows("B")))

    def test_documented_queries_project_no_content_or_whole_source_rows(self):
        for letter in ("A", "B", "C", "D"):
            sql = query(letter)
            self.assertNotRegex(sql, r"\bselect\s+\*")
            for field in ("transcription_text", "summary_text", "action_items", "inferred_name"):
                self.assertNotIn(field, sql)
            self.assertIn("organization_id", sql)


if __name__ == "__main__":
    unittest.main()
