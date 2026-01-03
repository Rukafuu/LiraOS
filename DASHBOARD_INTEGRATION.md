# Linking LiraOS with Lira Developer Dashboard

This document explains how LiraOS exposes features to the [Lira Developer Dashboard](https://github.com/Rukafuu/lira-developer-dashboard).

## Overview

The Lira Developer Dashboard is an external "AI Growth Hub" designed to visualize and manage the LiraOS instance. LiraOS provides a dedicated **Developer API** to feed data into this dashboard.

## Feature Mapping

| Dashboard Feature | LiraOS Implementation | Endpoint |
| :--- | :--- | :--- |
| **System Status** | CPU/RAM usage via `pcControllerService` | `GET /api/developer/stats` |
| **XP/Leveling Curves** | Gamification Store data | `GET /api/developer/stats` (Aggregated) |
| **Logs & Reasoning** | Backend logs reading | `GET /api/developer/logs` |
| **Configuration** | Environment variable exposure | `GET /api/developer/config` |

## Setup Instructions

### 1. Enable Developer Mode
Ensure your LiraOS backend is running. The Developer API is mounted at `/api/developer`.

### 2. Authentication
The Developer API requires **Admin Authentication**.
- The dashboard must authenticate as a user with `isAdmin` privileges.
- Standard flow: Login via `/api/auth/login`, receive JWT, send `Authorization: Bearer <token>` with requests to `/api/developer/*`.

### 3. Dashboard Configuration
In the `lira-developer-dashboard` project, configure `.env.local`:

```env
VITE_LIRA_API_URL=http://localhost:4000
VITE_LIRA_ADMIN_TOKEN=<your_admin_jwt_token>
```

*(Note: You may need to create a dedicated admin user in LiraOS for the dashboard).*

## API Reference

### Global Stats
`GET /api/developer/stats`
Returns:
```json
{
  "application": {
    "users": 10,
    "sessions": 50,
    "memories": 120,
    "active_jobs": 0
  },
  "system": {
    "cpu": "12%",
    "ram_used": "500MB",
    "uptime": "12h"
  }
}
```

### Logs
`GET /api/developer/logs`
Returns the last 200 lines of `backend.log`.

### AI Configuration
`GET /api/developer/config`
Returns currently active AI models and providers.
