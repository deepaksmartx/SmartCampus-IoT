import psutil
import os

print("Stopping all SmartCampus IoT project processes...\n")

# Track what we killed
killed = []

# Kill Python processes (backend)
print("1. Stopping Backend (Python processes)...")
for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
    try:
        if proc.info['name'] == 'python.exe':
            cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
            if 'main.py' in cmdline or 'SmartCampus' in cmdline or ':8000' in cmdline:
                print(f"   Killing: PID {proc.pid} - {proc.info['name']}")
                proc.kill()
                killed.append(f"Python {proc.pid}")
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

# Kill Node processes (frontend)
print("\n2. Stopping Frontend (Node processes)...")
for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
    try:
        if proc.info['name'] in ['node.exe', 'npm.cmd', 'npm']:
            cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
            if 'react' in cmdline.lower() or '3000' in cmdline or 'frontend' in cmdline.lower():
                print(f"   Killing: PID {proc.pid} - {proc.info['name']}")
                proc.kill()
                killed.append(f"Node {proc.pid}")
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

# Kill any uvicorn processes (FastAPI)
print("\n3. Stopping any uvicorn processes...")
for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
    try:
        cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
        if 'uvicorn' in cmdline:
            print(f"   Killing: PID {proc.pid} - {proc.info['name']}")
            proc.kill()
            killed.append(f"uvicorn {proc.pid}")
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

print("\n" + "="*60)
if killed:
    print(f"✅ Stopped {len(killed)} process(es):")
    for proc in killed:
        print(f"   - {proc}")
else:
    print("✅ No running processes found to stop")
print("="*60)
