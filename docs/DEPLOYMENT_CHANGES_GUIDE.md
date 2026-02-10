# Deployment & Environment Changes Guide

> **IMPORTANT:** This document lists ALL environment variable and deployment configuration changes
> required after applying the audit fixes. Follow these steps on your VPS/Dokploy AFTER deploying the updated code.

---

## 1. New Frontend Environment Variables

Add these to your **frontend** `.env.production` or Dokploy frontend service env vars:

```env
# Firebase Configuration (moved from hardcoded values)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCA1p_WyJ7m3j97HnjKA05EPRq5001LT2k
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=radeo-2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=radeo-2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=radeo-2026.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1016544530927
NEXT_PUBLIC_FIREBASE_APP_ID=1:1016544530927:web:ed217482d6dc73192ba61a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5PR3Z8K7YT

# reCAPTCHA Site Key (moved from hardcoded value in layout.jsx)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl
```

### Steps in Dokploy:

1. Go to your **frontend service** in Dokploy
2. Navigate to **Environment Variables**
3. Add each variable above
4. Save and **redeploy** the frontend service

---

## 2. Valkey/Redis Password

The default fallback password has been removed from `docker-compose.dokploy.yml`.
You **MUST** ensure the `VALKEY_PASSWORD` environment variable is set.

### Steps in Dokploy:

1. Go to your **Valkey service** in Dokploy
2. Navigate to **Environment Variables**
3. Ensure `VALKEY_PASSWORD` is set to a strong random string:
   ```
   VALKEY_PASSWORD=<your-existing-strong-password>
   ```
4. If not set, generate one:
   ```bash
   openssl rand -hex 32
   ```
5. Update both the Valkey service AND the backend service's `REDIS_PASSWORD` to match
6. Redeploy both services

---

## 3. New Backend Dependencies

After deploying new code, the backend will need these new npm packages:

```
helmet
express-mongo-sanitize
```

These are added to `backend/package.json`. If you use Dokploy with Docker builds, they will be installed automatically during `npm ci`. No manual action needed.

If you deploy manually:

```bash
cd backend
npm install helmet express-mongo-sanitize
```

---

## 4. Removed Backend Dependency

`bcryptjs` has been removed from `backend/package.json`. The native `bcrypt` package is used instead.
This is handled automatically during Docker build. No manual action needed.

---

## 5. Node.js Version (Nixpacks)

Since the project uses **Nixpacks** build type (not Dockerfiles), the Node.js version is controlled by the `engines` field in `package.json`. Both `backend/package.json` and `frontend/package.json` now have:

```json
"engines": {
  "node": ">=20.0.0"
}
```

### Steps in Dokploy:

1. Push the code — Nixpacks will read `engines` and use Node 20+
2. Redeploy both frontend and backend services
3. No additional configuration needed

### Verify after deploy:

```bash
# SSH into VPS and check
docker exec <backend-container> node --version
# Should show v20.x.x
```

> **Note:** The Dockerfiles in the repo are kept as reference but are NOT used when the build type is Nixpacks.

---

## 6. Nginx Configuration Update

The CORS configuration in `nginx.conf` has been fixed. If you use Nginx directly (not Traefik):

### Steps:

1. Copy the updated `nginx.conf` to your server:
   ```bash
   scp nginx.conf user@your-vps:/etc/nginx/sites-available/radeo.in
   ```
2. Test configuration:
   ```bash
   sudo nginx -t
   ```
3. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

**If you use Traefik (via Dokploy):** The Nginx config is a fallback and Traefik handles reverse proxy. No action needed unless you explicitly switched to Nginx.

---

## 7. Docker Log Rotation

Log rotation has been added to `docker-compose.dokploy.yml`. This applies automatically on next deploy.

### Verify:

```bash
# Check Docker log file sizes after a few days
docker inspect --format='{{.LogPath}}' <container-name>
ls -la <log-path>
```

---

## 8. Summary Checklist

| #   | Change              | Where to Apply           | Action                     |
| --- | ------------------- | ------------------------ | -------------------------- |
| 1   | Firebase env vars   | Dokploy Frontend Env     | Add 7 variables            |
| 2   | reCAPTCHA env var   | Dokploy Frontend Env     | Add 1 variable             |
| 3   | Valkey password     | Dokploy Valkey Env       | Verify/set VALKEY_PASSWORD |
| 4   | New npm packages    | Automatic (Docker build) | None                       |
| 5   | Removed bcryptjs    | Automatic (Docker build) | None                       |
| 6   | Node.js 20          | Automatic (Docker build) | Redeploy                   |
| 7   | Nginx config        | Manual if using Nginx    | Copy & reload              |
| 8   | Docker log rotation | Automatic (compose)      | Redeploy Valkey            |

---

## 9. Post-Deployment Verification

After deploying all changes, verify everything works:

```bash
# 1. Health check
curl https://api.radeo.in/api/health

# 2. Check security headers (should show helmet headers)
curl -I https://api.radeo.in/api/health

# 3. Test CORS
curl -I -X OPTIONS \
  -H "Origin: https://radeo.in" \
  -H "Access-Control-Request-Method: GET" \
  https://api.radeo.in/api/v1/products

# 4. Verify Node version
docker exec <backend-container> node --version

# 5. Test rate limiting on auth (should get 429 after 10 requests)
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://api.radeo.in/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 6. Test frontend Firebase auth still works
# Open https://radeo.in and try login with Google
```

---

## 10. Rollback Plan

If anything breaks after deployment:

1. **Dokploy:** Each service has deployment history. Click "Rollback" to previous deployment.
2. **Git:** Revert the commit:
   ```bash
   git revert HEAD
   git push
   ```
3. **Nginx:** Restore backup:
   ```bash
   sudo cp /etc/nginx/sites-available/radeo.in.backup /etc/nginx/sites-available/radeo.in
   sudo systemctl reload nginx
   ```
