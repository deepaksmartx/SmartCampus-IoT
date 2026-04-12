# Push to GitHub - Pre-Flight Checklist

Follow these steps to clean up and push your SmartCampus project to GitHub.

## STEP 1: Verify Your Cleanup ✅

Run the verification script to see what needs cleanup:

```powershell
cd d:\SmartCampus\SmartCampus-IoT
python verify_cleanup.py
```

**Expected Output:**
```
✅ PROJECT IS CLEAN! Ready for GitHub push
```

---

## STEP 2: Manual Cleanup (If verification shows issues)

### Option A: Windows Explorer (Safest)
1. Open File Explorer
2. Navigate to `d:\SmartCampus\SmartCampus-IoT`
3. View files in this order and DELETE:
   - **Root level** (delete these first):
     - `cleanup.ps1`
     - `stop_all.py`
     - `BUILDINGS_*.md` files
     - `INTEGRATION_*.md` files
     - `SMARTCAMPUS_*.md` files
     - `TESTING_REPORT.md`
     - `FINAL_TEST_REPORT.md`

   - **Backend** (`backend/` folder):
     - All `test_*.py` files
     - All `debug_*.py` files
     - `check_*.py`, `kill_*.py`, `add_*.py`
     - `migrate_db.py`, `simple_test.py`
     - `/backend/__pycache__/` (entire folder)
     - `.md` files (TESTING.md, BUILDING_IMPLEMENTATION.md)
     - `.sh` and `.ps1` test files

   - **Frontend** (`frontend/` folder):
     - `npm` file (executable)
     - `BUILDINGS_*.md` files

   - **Python cache** (if any):
     - Search recursively for `__pycache__` folders and delete them

### Option B: PowerShell Script (Advanced - copy entire block)

**WARNING: This will DELETE files. Make sure you're in the right directory!**

```powershell
$projectRoot = "d:\SmartCampus\SmartCampus-IoT"
cd $projectRoot

# Remove root temp files
$filesToDelete = @(
    'cleanup.ps1',
    'stop_all.py',
    'BUILDINGS_CAMPUS_FIX.md',
    'BUILDINGS_TESTING_COMPLETE.md',
    'INTEGRATION_TESTING.md',
    'INTEGRATION_VERIFICATION_REPORT.md',
    'SMARTCAMPUS_UI_INTEGRATION.md',
    'TESTING_REPORT.md',
    'FINAL_TEST_REPORT.md'
)

foreach ($file in $filesToDelete) {
    if (Test-Path $file) { Remove-Item $file -Force }
}

# Remove backend files
$backendFiles = @(
    'backend\test_auth.py',
    'backend\test_building.py',
    'backend\test_check_code.py',
    'backend\test_comprehensive.py',
    'backend\test_cors.py',
    'backend\test_delete_direct.py',
    'backend\test_delete_error.py',
    'backend\test_edit_delete.py',
    'backend\debug_routes.py',
    'backend\debug_booking.py',
    'backend\check_tables.py',
    'backend\add_timestamps.py',
    'backend\kill_main.py',
    'backend\migrate_db.py',
    'backend\simple_test.py',
    'backend\test_simple.py',
    'backend\test_complete_integration.py',
    'backend\test_login_curl.sh',
    'backend\test_login_quick.ps1',
    'backend\test_post_building.py',
    'backend\test_post_with_token.py',
    'backend\test_put_delete.py',
    'backend\TESTING.md',
    'backend\BUILDING_IMPLEMENTATION.md'
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) { Remove-Item $file -Force }
}

# Remove frontend files
$frontendFiles = @(
    'frontend\BUILDINGS_FRONTEND_SUMMARY.md',
    'frontend\BUILDINGS_TESTING_GUIDE.md'
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) { Remove-Item $file -Force }
}

# Remove __pycache__ recursively
Get-ChildItem -Path . -Recurse -Directory -Filter __pycache__ | Remove-Item -Recurse -Force

Write-Host "✅ Cleanup complete!"
```

---

## STEP 3: Verify Clean Structure

After cleanup, verify this structure exists:

```
SmartCampus-IoT/
├── README                          ✅ KEEP
├── .gitignore                       ✅ KEEP (updated)
├── verify_cleanup.py                ✅ KEEP
├── CLEANUP_GUIDE.md                 ✅ (optional - can delete after cleanup)
│
├── backend/
│   ├── requirements.txt             ✅ NEW (dependencies)
│   ├── main.py                      ✅ KEEP (entry point)
│   ├── init_db.py                   ✅ KEEP (setup)
│   ├── restart_backend.py           ✅ KEEP (utility)
│   └── app/
│       ├── __init__.py
│       ├── auth.py
│       ├── database.py
│       ├── models.py
│       ├── routes.py
│       ├── routes_building.py
│       ├── routes_facility.py
│       ├── routes_floor.py
│       ├── routes_booking.py
│       ├── routes_approval.py
│       ├── schemas.py
│       └── booking_logic.py
│
├── frontend/
│   ├── package.json                 ✅ KEEP
│   ├── README.md                    ✅ KEEP
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── index.js
│       ├── index.css
│       ├── pages/ (4 pages)
│       └── services/ (api.js)
```

---

## STEP 4: Git Commands to Push

```powershell
cd d:\SmartCampus\SmartCampus-IoT

# 1. Check current status
git status

# 2. Stage all changes
git add .

# 3. Commit with a message
git commit -m "Clean project structure: remove test files, debug scripts, and caches"

# 4. Push to GitHub
git push origin main
```

Replace `main` with your branch name if different.

---

## STEP 5: Post-Push Verification

Go to your GitHub repo and verify:
- [ ] No test files are visible
- [ ] No debug scripts are visible
- [ ] Project structure is clean
- [ ] README is visible
- [ ] Requirements files present

---

## Quick Issues & Solutions

| Issue | Solution |
|-------|----------|
| `push rejected` | Pull latest: `git pull origin main` then push again |
| `merge conflict` | Resolve conflicts manually then commit |
| `file permission denied` | Use Windows Explorer to delete files instead |
| `too many files to delete` | Use the PowerShell script (Step 2, Option B) |
| `forgot to delete something` | Run `verify_cleanup.py` again to check |

---

## Key Files to Keep (do NOT delete)

- `backend/main.py` - Entry point
- `backend/app/` - All core application code
- `backend/requirements.txt` - Dependencies
- `frontend/src/` - All React code
- `frontend/package.json` - Dependencies
- `.gitignore` - Version control rules
- `README` - Project documentation

---

## Done! 🚀

Once all steps complete and GitHub shows a clean repo, your project is ready!
