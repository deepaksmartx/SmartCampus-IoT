@echo off
cd /d "C:\Users\HP\OneDrive\Desktop\internshipWork\SmartCampus-IoT\backend"
if exist smartcampus.db del /q smartcampus.db
python force_reset_db.py