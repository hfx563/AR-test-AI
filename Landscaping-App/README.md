# 🌿 GreenEdge Landscaping Resources — NFC Truck Tracking System

A full-stack landscaping resources and supply website with real-time NFC-based truck tracking.

## 🚀 Quick Start (Windows)

1. Install [Node.js](https://nodejs.org) (v18+)
2. Clone this repo:
   ```
   git clone https://github.com/abhiravgotra92/GreenEdge-Landscaping.git
   ```
3. Double-click **`START.bat`**
4. Browser opens at `http://localhost:3000`

## 📄 Pages

| Page | URL | Description |
|------|-----|-------------|
| Homepage | `/` | Supply services, hero, CTA |
| Truck Dashboard | `/dashboard.html` | Live delivery truck count + log |
| Admin Panel | `/admin.html` | Manage trucks, manual log, analytics, NFC simulator |
| About & Contact | `/about.html` | Team, quote request form |

## 🔑 Admin Login

Password: `greenedge2025`

Change it by setting the `ADMIN_PASSWORD` environment variable.

## 📡 NFC Hardware Integration

The NFC reader POSTs to `/api/nfc`:

```
POST /api/nfc
Content-Type: application/json

{ "nfc_tag": "NFC-A1B2C3" }
```

System auto-toggles entry/exit and pushes real-time updates to all dashboards via WebSocket.

## 🗄️ Database

Uses **SQLite** — zero setup, file-based (`landscaping.db` created automatically).

## ☁️ Deploy to Railway (Free)

1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. New Project → Deploy from GitHub → select this repo
4. Done — live URL in ~2 minutes
