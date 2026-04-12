#!/usr/bin/env python3
"""
Pre-GitHub Cleanup Verification Checklist
Run this to verify your project is clean before pushing
"""

import os
import sys
from pathlib import Path

# Change to project root
os.chdir('d:\\SmartCampus\\SmartCampus-IoT')

print("=" * 60)
print("SMARTCAMPUS PROJECT CLEANUP VERIFICATION")
print("=" * 60)

# Files that SHOULD be deleted
should_delete = [
    'cleanup.ps1',
    'stop_all.py',
    'BUILDINGS_CAMPUS_FIX.md',
    'BUILDINGS_TESTING_COMPLETE.md',
    'INTEGRATION_TESTING.md',
    'INTEGRATION_VERIFICATION_REPORT.md',
    'SMARTCAMPUS_UI_INTEGRATION.md',
    'TESTING_REPORT.md',
    'FINAL_TEST_REPORT.md',
    'backend/test_auth.py',
    'backend/test_building.py',
    'backend/test_check_code.py',
    'backend/test_comprehensive.py',
    'backend/test_cors.py',
    'backend/test_delete_direct.py',
    'backend/test_delete_error.py',
    'backend/test_edit_delete.py',
    'backend/debug_routes.py',
    'backend/debug_booking.py',
    'backend/check_tables.py',
    'backend/add_timestamps.py',
    'backend/kill_main.py',
    'backend/migrate_db.py',
    'backend/simple_test.py',
    'backend/test_simple.py',
    'backend/test_complete_integration.py',
    'backend/test_login_curl.sh',
    'backend/test_login_quick.ps1',
    'backend/test_post_building.py',
    'backend/test_post_with_token.py',
    'backend/test_put_delete.py',
    'backend/TESTING.md',
    'backend/BUILDING_IMPLEMENTATION.md',
    'frontend/npm',
    'frontend/BUILDINGS_FRONTEND_SUMMARY.md',
    'frontend/BUILDINGS_TESTING_GUIDE.md',
]

# Files that MUST exist
must_exist = [
    'README',
    '.gitignore',
    'backend/main.py',
    'backend/app/__init__.py',
    'backend/app/models.py',
    'backend/app/auth.py',
    'backend/app/routes.py',
    'frontend/package.json',
    'frontend/src/App.js',
    'frontend/public/index.html',
]

print("\n📋 CHECKING FILES TO DELETE:")
print("-" * 60)
deleted_count = 0
existing_to_delete = []

for file_path in should_delete:
    if Path(file_path).exists():
        existing_to_delete.append(file_path)
        print(f"  ❌ FOUND (should delete): {file_path}")
        deleted_count += 1
    else:
        print(f"  ✅ NOT FOUND (already clean): {file_path}")

print("\n📋 CHECKING REQUIRED FILES:")
print("-" * 60)
existing_count = 0
for file_path in must_exist:
    if Path(file_path).exists():
        print(f"  ✅ EXISTS: {file_path}")
        existing_count += 1
    else:
        print(f"  ❌ MISSING: {file_path}")

# Check for __pycache__
print("\n📋 CHECKING FOR PYCACHE:")
print("-" * 60)
pycache_dirs = list(Path('.').rglob('__pycache__'))
if pycache_dirs:
    for pycache in pycache_dirs:
        print(f"  ❌ FOUND: {pycache} (should delete)")
else:
    print(f"  ✅ NO PYCACHE DIRECTORIES FOUND")

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"Files to delete found: {deleted_count}")
print(f"Required files exist: {existing_count}/{len(must_exist)}")
print(f"Pycache directories: {len(pycache_dirs)}")

if deleted_count == 0 and existing_count == len(must_exist) and len(pycache_dirs) == 0:
    print("\n✅ PROJECT IS CLEAN! Ready for GitHub push")
    sys.exit(0)
else:
    print("\n❌ PROJECT NEEDS CLEANUP")
    if existing_to_delete:
        print(f"\nFiles to delete ({len(existing_to_delete)}):")
        for f in existing_to_delete:
            print(f"  - {f}")
    sys.exit(1)
