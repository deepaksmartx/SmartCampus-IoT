import os
import subprocess
import time
import psutil
import signal

print("1. Killing old backend processes...")
for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
    try:
        if proc.info['name'] == 'python.exe':
            cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
            if 'main.py' in cmdline or ':8000' in cmdline:
                print(f"  Killing PID {proc.pid}")
                proc.kill()
                try:
                    proc.wait(timeout=2)
                except:
                    proc.kill()
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

print("2. Waiting 2 seconds...")
time.sleep(2)

print("3. Starting backend...")
os.chdir(r"d:\SmartCampus\SmartCampus-IoT\backend")
subprocess.Popen(['python', 'main.py'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

print("4. Waiting for backend to start...")
time.sleep(3)

# Verify
import requests
try:
    r = requests.get("http://localhost:8000/health", timeout=5)
    print(f"✓ Backend health: {r.status_code}")
except:
    print("✗ Backend not responding")
