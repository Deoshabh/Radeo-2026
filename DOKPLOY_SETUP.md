# Dokploy Deployment Guide

This guide explains how to deploy the Radeo Shoes application on a VPS using Dokploy, configured with **Nixpacks** build strategy.

## 1. Prerequisites
- **VPS** with Dokploy installed.
- **Cloudflare** (or DNS) pointing to your VPS IP for your domains.
- **MongoDB** Connection String (External or Dokploy Database).
- **Redis (Valkey)** Connection String (External or Dokploy Database).
- **MinIO (S3)** Connection String (External or Dokploy Database).

## 2. Project Setup in Dokploy
1.  Login to your Dokploy panel.
2.  Create a new **Project** (e.g., "Radeo").
3.  Connect your **GitHub Repository**.

## 3. Application Creation
You will create **3 Separate Applications** in Dokploy (one for each service) to manage builds independently.

### A. Backend Application (Node.js)
1.  **Create Service**: Application
2.  **Name**: `radeo-backend`
3.  **Source**: GitHub -> Select Repo -> Branch `main`
4.  **Build Type**: `Nixpacks`
5.  **Build Path**: `/backend`  <-- **CRITICAL**: Point to backend folder
6.  **Start Command**: `npm start`
7.  **Environment Variables**:
    ```env
    PORT=5000
    NODE_ENV=production
    MONGO_URI=mongodb://user:pass@host:27017/radeo?authSource=admin
    REDIS_HOST=your-redis-host  (or internal dokploy container name)
    REDIS_HOST=your-redis-host  (or internal dokploy container name)
    REDIS_PORT=6379
    REDIS_PASSWORD=your-redis-password
    MINIO_ENDPOINT=your-minio-host
    MINIO_PORT=9000
    MINIO_ACCESS_KEY=your-access-key
    MINIO_SECRET_KEY=your-secret-key
    MINIO_BUCKET_NAME=radeo-reviews
    JWT_SECRET=your-secure-secret
    FIREBASE_CREDENTIALS_JSON={...paste your full json here...}
    SHIPROCKET_EMAIL=your-email
    SHIPROCKET_PASSWORD=your-password
    ```
8.  **Network**: Expose Port `5000` internally.
9.  **Domain**: Add Domain `api.yourdomain.com` -> Point to Port `5000`.

### B. Frontend Application (Next.js)
1.  **Create Service**: Application
2.  **Name**: `radeo-frontend`
3.  **Source**: GitHub -> Select Repo -> Branch `main`
4.  **Build Type**: `Nixpacks`
5.  **Build Path**: `/frontend` <-- **CRITICAL**: Point to frontend folder
6.  **Start Command**: `npm start`
7.  **Environment Variables**:
    ```env
    NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1  <-- Must set this for build!
    ```
8.  **Network**: Expose Port `3000` internally.
9.  **Domain**: Add Domain `yourdomain.com` -> Point to Port `3000`.

### C. AI Worker Application (Python)
1.  **Create Service**: Application
2.  **Name**: `radeo-ai-worker`
3.  **Source**: GitHub -> Select Repo -> Branch `main`
4.  **Build Type**: `Nixpacks`
5.  **Build Path**: `/ai-worker` <-- **CRITICAL**: Point to ai-worker folder
    - *Note*: Dokploy will automatically detect `nixpacks.toml` in this folder.
6.  **Start Command**: `python main.py`
7.  **Environment Variables**:
    ```env
    MONGO_URI=mongodb://user:pass@host:27017/radeo?authSource=admin
    REDIS_HOST=your-redis-host
    REDIS_PORT=6379
    REDIS_PASSWORD=your-redis-password
    MINIO_ENDPOINT=your-minio-host
    MINIO_PORT=9000
    MINIO_ACCESS_KEY=your-access-key
    MINIO_SECRET_KEY=your-secret-key
    MINIO_BUCKET_NAME=radeo-reviews
    MINIO_SECURE=false (or true if using SSL for MinIO internally)
    ```
8.  **Resources**:
    - Go to **Advanced** -> **Resources**.
    - Set Memory Limit to `2048 MB` (2GB) minimally, as AI models are heavy.
9.  **Persistent Storage** (Optional but Recommended):
    - Mount `/root/.cache` to a volume to persist downloaded AI models (NudeNet/YOLO) so they don't re-download on every restart.

## 4. Verification
1.  **Deploy Backend** first. Wait for "Healthy".
2.  **Deploy AI Worker**. Check logs to see "Initializing AI Models..." and "Worker listening...".
3.  **Deploy Frontend**.
4.  **Test**:
    - Go to `yourdomain.com`.
    - Login as Admin.
    - Go to Products > Add New.
    - Upload an image.
    - Check Network tab for `200 OK` on `upload-url` endpoint.
    - Check AI Worker logs to see it processing the image.

## 5. Troubleshooting Common Issues

### 500 Error on API
- Check **Environment Variables**. Did you forget `SHIPROCKET_` or `MONGO_URI`?
- Check **Port Mapping**. Is Backend listening on 5000?

### 400 Error on Image Upload
- Backend and Frontend versions might be mismatched. Re-deploy both.
- Ensure `NEXT_PUBLIC_API_URL` points to `https` (SSL) version of your API.

### AI Worker Crashing
- "OOMKilled": Increase Memory Limit to 3GB or 4GB.
- "Connection Refused": Check `REDIS_HOST`. If using Docker networking, use the container name (e.g., `radeo-redis` or `redis`). If external, use IP.
