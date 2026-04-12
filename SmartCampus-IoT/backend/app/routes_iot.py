import os
import re
import time
from typing import Any, Dict

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/iot", tags=["iot"])

TB_BASE = os.getenv("TB_BASE", "https://thingsboard.cloud").rstrip("/")
TB_USER = os.getenv("TB_USER", "ankitgangwar1082006@gmail.com")
TB_PASS = os.getenv("TB_PASS", "123456789")
UUID_RE = re.compile(r"^[a-f0-9-]{36}$")

_cached_token = None
_token_expiry_ms = 0


def _get_tb_token() -> str:
    global _cached_token, _token_expiry_ms

    now_ms = int(time.time() * 1000)
    if _cached_token and now_ms < _token_expiry_ms:
        return _cached_token

    try:
        response = requests.post(
            f"{TB_BASE}/api/auth/login",
            json={"username": TB_USER, "password": TB_PASS},
            timeout=20,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Auth connection failed: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"ThingsBoard auth failed with status {response.status_code}",
        )

    body: Dict[str, Any] = response.json()
    token = body.get("token")
    if not token:
        raise HTTPException(status_code=502, detail="ThingsBoard auth token missing")

    _cached_token = token
    _token_expiry_ms = now_ms + 55 * 60 * 1000
    return token


@router.get("/proxy/telemetry/{device_id}")
def proxy_device_telemetry(device_id: str, limit: int = Query(10, ge=1, le=200)):
    if not UUID_RE.match(device_id):
        raise HTTPException(status_code=400, detail="Invalid device ID")

    token = _get_tb_token()
    url = f"{TB_BASE}/api/plugins/telemetry/DEVICE/{device_id}/values/timeseries?limit={limit}"

    try:
        upstream = requests.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {exc}") from exc

    if upstream.status_code >= 400:
        raise HTTPException(
            status_code=upstream.status_code,
            detail=f"Upstream error: {upstream.status_code}",
        )

    return upstream.json()

