# URGENT: Backend Not Running - Fix Guide

## Problem

Your backend is returning **502 Bad Gateway** from Traefik, which means:

- ❌ Backend container is not running
- ❌ Backend port 5000 is not responding
- ❌ The container crashed or was never rebuilt with code changes

## Solution: Restart Backend

### Option 1: Docker Compose (Recommended)

Run on your VPS via SSH:

```bash
# SSH into your VPS
ssh username@your-vps-ip

# Navigate to project
cd /path/to/Shoes\ Website\ 2026

# Rebuild and restart backend
docker-compose -f docker-compose.traefik.yml up -d --build backend

# Verify it started
docker-compose -f docker-compose.traefik.yml logs backend | tail -20

# Wait 10 seconds for backend to boot
sleep 10

# Test health endpoint
curl https://api.radeo.in/health
```

Expected output:

```
✅ Backend is running
HTTP/2 200 OK
```

### Option 2: Full Stack Restart

```bash
# Restart entire stack (if backend alone doesn't help)
cd /path/to/Shoes\ Website\ 2026

# Bring down all containers
docker-compose -f docker-compose.traefik.yml down

# Rebuild and restart all
docker-compose -f docker-compose.traefik.yml up -d --build

# Wait 15 seconds for all services to boot
sleep 15

# Check status
docker-compose -f docker-compose.traefik.yml ps

# View logs
docker-compose -f docker-compose.traefik.yml logs -f
```

### Option 3: Check Container Status

```bash
# SSH into VPS
ssh username@your-vps-ip

# Check if backend container exists and is running
docker ps | grep backend

# If not running, check why
docker ps -a | grep backend
docker logs <container-id>

# If container doesn't exist, rebuild
docker-compose -f docker-compose.traefik.yml up -d --build backend
```

## Verification After Restart

### Test 1: Health Check

```bash
curl https://api.radeo.in/health
# Expected: HTTP/2 200 OK
```

### Test 2: OPTIONS Preflight

```bash
curl -X OPTIONS https://api.radeo.in/api/v1/auth/register \
  -H "Origin: https://radeo.in" \
  -H "Access-Control-Request-Method: POST" \
  -i

# Expected:
# HTTP/2 204 No Content (or 200 OK)
# access-control-allow-origin: https://radeo.in
# access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
# access-control-allow-credentials: true
# (NOT 502 Bad Gateway)
```

### Test 3: Categories API

```bash
curl https://api.radeo.in/api/v1/categories \
  -H "Origin: https://radeo.in"

# Expected:
# HTTP/2 200 OK
# access-control-allow-origin: https://radeo.in
# (JSON array of categories)
```

### Test 4: Frontend Registration

1. Go to https://radeo.in/auth/register
2. Fill form and submit
3. Expected: **No CORS errors** in console
4. Expected: Either successful registration or validation error (not CORS error)

## Troubleshooting

### If Still Getting 502

```bash
# Check docker logs
docker-compose -f docker-compose.traefik.yml logs backend

# Look for:
# ✅ MongoDB connected
# ✅ Server running on port 5000
# ❌ Any crash messages

# Rebuild with no cache
docker-compose -f docker-compose.traefik.yml build --no-cache backend
docker-compose -f docker-compose.traefik.yml up -d backend
```

### If Backend Crashes After Starting

```bash
# Check for errors
docker-compose -f docker-compose.traefik.yml logs -f backend

# Common issues:
# - MongoDB connection failed → Check MONGO_URI
# - Port already in use → Check if another process using 5000
# - Environment variables missing → Check .env file

# Verify .env has:
MONGO_URI=mongodb://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

### If Still Getting CORS Errors

1. Verify middleware files have OPTIONS bypass (see below)
2. Check Traefik config has CORS middleware
3. Verify Express server has CORS configured
4. Clear browser cache and retry

## Verify Code Changes Are Present

Run these checks to confirm middleware has OPTIONS bypass:

```bash
# SSH into VPS
ssh username@your-vps-ip

# Navigate to backend
cd /path/to/Shoes\ Website\ 2026/backend/middleware

# Check auth.js has OPTIONS bypass in authenticate()
grep -A 2 'if (req.method === "OPTIONS")' auth.js
# Expected: Should show the bypass code

# Check auth.js has OPTIONS bypass in authorize()
grep -B 2 -A 2 'exports.authorize' auth.js | grep -A 8 'req.method'
# Expected: Should show the bypass code

# Check admin.js has OPTIONS bypass
grep -A 2 'if (req.method === "OPTIONS")' admin.js
# Expected: Should show the bypass code
```

## What These Changes Do

When OPTIONS preflight is sent:

1. Browser → Traefik (OPTIONS preflight)
2. Traefik adds CORS headers (configured in docker-compose.traefik.yml)
3. Traefik → Backend (OPTIONS request)
4. Auth middleware sees `req.method === "OPTIONS"`
5. Auth middleware skips token check, calls `next()`
6. Express CORS middleware handles OPTIONS
7. Response: 204 No Content with CORS headers
8. Browser receives CORS headers
9. Browser allows actual POST request
10. Actual POST includes Authorization header
11. Backend processes normally (login/register)

## Next Steps

1. **SSH into VPS**

   ```bash
   ssh username@your-vps-ip
   ```

2. **Restart backend**

   ```bash
   cd /path/to/Shoes\ Website\ 2026
   docker-compose -f docker-compose.traefik.yml up -d --build backend
   ```

3. **Wait for startup**

   ```bash
   sleep 10
   docker-compose -f docker-compose.traefik.yml logs backend | tail -5
   ```

4. **Test endpoints** (use curl commands above)

5. **Test from browser** (https://radeo.in/auth/register)

6. **Report status**

## Debug Output to Share

If issues persist, provide:

```bash
# Backend logs
docker-compose -f docker-compose.traefik.yml logs backend | tail -50

# Docker status
docker-compose -f docker-compose.traefik.yml ps

# Network test
curl -v https://api.radeo.in/health 2>&1 | head -30
```

---

**Status**: Backend not running → Causing 502 Bad Gateway  
**Fix**: Rebuild and restart backend container  
**Time to fix**: 2-5 minutes  
**Risk**: Zero (code changes safe, backward compatible)
