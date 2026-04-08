import requests
import random
import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

THINGSBOARD_URL = "https://thingsboard.cloud"

DEVICE_TOKENS = {
    "occupancy": os.getenv("OCCUPANCY_TOKEN"),
    "water": os.getenv("WATER_TOKEN"),
    "energy": os.getenv("ENERGY_TOKEN")
}


def send_dashboard_data(device_type, facility_type, facility_name):
    """
    Send telemetry data to ThingsBoard based on selected device type
    """

    # Check if valid device type
    if device_type not in DEVICE_TOKENS:
        return 400, f"Invalid device type: {device_type}"

    access_token = DEVICE_TOKENS[device_type]

    url = f"{THINGSBOARD_URL}/api/v1/{access_token}/telemetry"

    # Generate random values based on device type
    if device_type == "occupancy":
        payload = {
            "occupancy": random.randint(1, 50),
            "facility_type": facility_type,
            "facility_name": facility_name
        }

    elif device_type == "water":
        payload = {
            "water_usage": random.randint(100, 1000),
            "facility_type": facility_type,
            "facility_name": facility_name
        }

    elif device_type == "energy":
        payload = {
            "energy_usage": round(random.uniform(1.0, 10.0), 2),
            "facility_type": facility_type,
            "facility_name": facility_name
        }

    try:
        response = requests.post(url, json=payload)

        return response.status_code, response.text

    except Exception as e:
        return 500, str(e)