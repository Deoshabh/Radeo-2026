# Dokploy Redis/Valkey Setup Guide

## Quick Setup (5 minutes)

### Step 1: Add Compose File to Dokploy Project

In your **Dokploy Dashboard**:

1. Go to **radeo-backend project**
2. Click **"Add Service"** → **"Compose File"** (or "Docker Compose")
3. Copy the contents of `docker-compose.dokploy.yml` from this repo
4. Paste into Dokploy
5. Click **"Deploy"**

Valkey will now be running on the same network as your backend.

---

### Step 2: Update Backend Environment Variables

In the **radeo-backend service** (NOT the new Valkey service), update or add these environment variables:

```env
REDIS_HOST=valkey
REDIS_PORT=6379
REDIS_PASSWORD=ro6k0egdepp8tc8dvwmibnjsbuzkbvyz
```

📝 **Important**: Remove any old REDIS settings like `REDIS_HOST=127.0.0.1` or `REDIS_HOST=localhost`

---

### Step 3: Redeploy Backend

1. Save the environment changes
2. Click **"Redeploy"** on the radeo-backend service
3. Wait ~1-2 minutes for deployment

---

### Step 4: Verify Connection

Once deployed, check the backend logs. You should see:

```
✅ Connected to Valkey/Redis
```

Instead of the old error:
```
❌ Redis Connection Error: Error: getaddrinfo ENOTFOUND valkey
```

---

## What's Happening?

- **Valkey** container runs on the same Docker network as your backend
- Backend can now resolve `valkey` hostname via Docker DNS
- Both are managed as one project in Dokploy
- Data persists in `valkey-data` volume

---

## Troubleshooting

### Valkey still not connecting?

1. Check logs: `docker logs <valkey_container_id>`
2. Verify environment variables are set correctly
3. Make sure `REDIS_HOST=valkey` (not `localhost` or IP address)
4. Redeploy both services

### Port already in use?

Since Valkey is not exposed outside the network, port conflicts shouldn't happen. But if you want to debug locally:

```bash
docker exec <valkey_container_id> valkey-cli -a ro6k0egdepp8tc8dvwmibnjsbuzkbvyz ping
# Should return: PONG
```

---

## References

- [Valkey Official](https://valkey.io/)
- [Dokploy Docs](https://docs.dokploy.io/)
