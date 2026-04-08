const express = require('express');
const app = express();
const PORT = 3000;

const TB_BASE = 'https://thingsboard.cloud';
const TB_USER = 'ankitgangwar1082006@gmail.com';
const TB_PASS = '123456789';

// Token cache — refresh every 55 minutes
let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${TB_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: TB_USER, password: TB_PASS })
  });

  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);

  const { token } = await res.json();
  cachedToken = token;
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return token;
}

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Telemetry proxy
app.get('/proxy/telemetry/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  if (!deviceId || !/^[a-f0-9-]{36}$/.test(deviceId)) {
    return res.status(400).json({ error: 'Invalid device ID' });
  }

  try {
    const token = await getToken();
    const url = `${TB_BASE}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?limit=${limit}`;

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream error: ${upstream.status}` });
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Aura IoT Proxy — http://localhost:${PORT}`);
});