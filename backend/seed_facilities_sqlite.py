"""
Seed minimal facility data into SQLite for UI visibility/testing.

Usage:
  python seed_facilities_sqlite.py
  python seed_facilities_sqlite.py --db backend/smartcampus.db
"""

from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path
import hashlib


DEFAULT_DB = Path(__file__).resolve().parent / "smartcampus.db"


def fetchone_id(conn: sqlite3.Connection, sql: str, params: tuple) -> int | None:
    row = conn.execute(sql, params).fetchone()
    return row[0] if row else None


def seed(db_path: Path) -> None:
    conn = sqlite3.connect(str(db_path))
    try:
        conn.execute("PRAGMA foreign_keys=ON")

        # Ensure test users exist with known passwords
        # Passwords: admin123 / manager123 / student123
        users = [
            ("Admin User", "admin@campus.edu", "ADMIN", "admin123"),
            ("Facility Manager", "manager@campus.edu", "FACILITY_MANAGER", "manager123"),
            ("Student User", "student@campus.edu", "STUDENT", "student123"),
        ]
        for name, email, role, password in users:
            existing = fetchone_id(conn, "SELECT id FROM users WHERE email = ?", (email,))
            hashed = hashlib.sha256(password.encode()).hexdigest()
            if existing is None:
                conn.execute(
                    """
                    INSERT INTO users(name, email, phone_number, role, hashed_password)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (name, email, None, role, hashed),
                )

        campus_id = fetchone_id(conn, "SELECT id FROM campuses WHERE name = ?", ("Main Campus",))
        if campus_id is None:
            conn.execute("INSERT INTO campuses(name) VALUES (?)", ("Main Campus",))
            campus_id = fetchone_id(conn, "SELECT id FROM campuses WHERE name = ?", ("Main Campus",))

        building_id = fetchone_id(conn, "SELECT id FROM buildings WHERE name = ?", ("Central Block",))
        if building_id is None:
            conn.execute(
                "INSERT INTO buildings(name, campus_id) VALUES (?, ?)",
                ("Central Block", campus_id),
            )
            building_id = fetchone_id(conn, "SELECT id FROM buildings WHERE name = ?", ("Central Block",))

        floor_id = fetchone_id(
            conn,
            "SELECT id FROM floors WHERE floor_no = ? AND building_id = ?",
            (1, building_id),
        )
        if floor_id is None:
            conn.execute(
                "INSERT INTO floors(floor_no, building_id) VALUES (?, ?)",
                (1, building_id),
            )
            floor_id = fetchone_id(
                conn,
                "SELECT id FROM floors WHERE floor_no = ? AND building_id = ?",
                (1, building_id),
            )

        manager_id = fetchone_id(
            conn,
            "SELECT id FROM users WHERE role IN (?, ?) LIMIT 1",
            ("FACILITY_MANAGER", "Facility Manager"),
        )

        facilities = [
            ("Campus Shuttle A", "Bus", "Shuttle", None, 40, 0, "BUS-SENSOR-01"),
            ("Main Dining Hall", "Dining", "Cafeteria", None, 120, 1, "DINING-SENSOR-01"),
            ("Indoor Sports Arena", "Sports", "Indoor", None, 80, 0, "SPORTS-SENSOR-01"),
            ("Hostel Block - Guest Room 101", "Hostel", "Guest Room", None, 2, 1, "HOSTEL-GUEST-01"),
            ("Innovation Studio", "Custom", "Project Zone", "Innovation Zone", 25, 0, "CUSTOM-SENSOR-01"),
        ]

        created = 0
        for name, ftype, subtype, custom_type, capacity, requires_approval, sensor_id in facilities:
            exists = fetchone_id(conn, "SELECT id FROM facilities WHERE name = ?", (name,))
            if exists is not None:
                continue
            conn.execute(
                """
                INSERT INTO facilities(
                    name, type, subtype, custom_type, building_id, floor_id, capacity,
                    requires_approval, sensor_id, manager_id, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    ftype,
                    subtype,
                    custom_type,
                    building_id,
                    floor_id,
                    capacity,
                    requires_approval,
                    sensor_id,
                    manager_id,
                    f"Seeded sample for {ftype}",
                ),
            )
            created += 1

        conn.commit()
        total = conn.execute("SELECT COUNT(*) FROM facilities").fetchone()[0]
        print(f"Seed complete. Added {created} new facilities. Total facilities: {total}")
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed SQLite facilities for UI")
    parser.add_argument("--db", default=str(DEFAULT_DB), help="Path to sqlite DB file")
    args = parser.parse_args()
    seed(Path(args.db).resolve())


if __name__ == "__main__":
    main()
