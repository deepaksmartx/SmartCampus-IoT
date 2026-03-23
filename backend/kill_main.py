import os
import signal
import psutil

# Find and kill Python processes running main.py
for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
    try:
        cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
        if 'main.py' in cmdline:
            print(f"Killing process {proc.pid}: {proc.info['name']}")
            proc.send_signal(signal.SIGTERM)
            proc.wait(timeout=3)
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

print("Done - old processes killed")
