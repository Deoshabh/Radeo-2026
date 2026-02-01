# MinIO HTTPS Setup Guide for Dokploy

## Problem

MinIO was generating HTTP URLs, but the website is HTTPS, causing "Mixed Content" errors that block image uploads.

## Solution

Configure MinIO to be accessible via HTTPS through Traefik.

## Step-by-Step Setup in Dokploy:

### 1. Update MinIO Service in Dokploy

Go to your MinIO service in Dokploy and update the **docker-compose.yml**:

```yaml
services:
  minio:
    image: minio/minio
    restart: unless-stopped
    volumes:
      - minio-data:/data
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
      - MINIO_BROWSER_REDIRECT_URL=https://minio-console.radeo.in
      - MINIO_SERVER_URL=https://minio.radeo.in
    command: server /data --console-address ":9001"

    # Remove the ports section - let Traefik handle external access
    # ports:
    #   - 9000:9000

    # Keep expose for internal Docker network communication
    expose:
      - 9000
      - 9001

    # Add Traefik labels
    labels:
      # Enable Traefik
      - "traefik.enable=true"

      # MinIO API (port 9000)
      - "traefik.http.routers.minio-api.rule=Host(`minio.radeo.in`)"
      - "traefik.http.routers.minio-api.entrypoints=websecure"
      - "traefik.http.routers.minio-api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.minio-api.service=minio-api"
      - "traefik.http.services.minio-api.loadbalancer.server.port=9000"

      # MinIO Console (port 9001)
      - "traefik.http.routers.minio-console.rule=Host(`minio-console.radeo.in`)"
      - "traefik.http.routers.minio-console.entrypoints=websecure"
      - "traefik.http.routers.minio-console.tls.certresolver=letsencrypt"
      - "traefik.http.routers.minio-console.service=minio-console"
      - "traefik.http.services.minio-console.loadbalancer.server.port=9001"

      # CORS Headers for MinIO API
      - "traefik.http.middlewares.minio-cors.headers.accesscontrolalloworiginlist=https://radeo.in,https://www.radeo.in"
      - "traefik.http.middlewares.minio-cors.headers.accesscontrolallowmethods=GET,POST,PUT,DELETE,OPTIONS,HEAD"
      - "traefik.http.middlewares.minio-cors.headers.accesscontrolallowheaders=*"
      - "traefik.http.middlewares.minio-cors.headers.accesscontrolallowcredentials=true"
      - "traefik.http.middlewares.minio-cors.headers.addvaryheader=true"
      - "traefik.http.routers.minio-api.middlewares=minio-cors"

volumes:
  minio-data:
```

### 2. Update MinIO Environment Variables in Dokploy

In the MinIO service environment variables:

```env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=ylpop1kdbsskkyei
MINIO_BROWSER_REDIRECT_URL=https://minio-console.radeo.in
MINIO_SERVER_URL=https://minio.radeo.in
```

### 3. Add DNS Records

Add these DNS A records pointing to your server IP (157.173.218.96):

- `minio.radeo.in` → 157.173.218.96
- `minio-console.radeo.in` → 157.173.218.96

### 4. Update Backend Environment Variables

The backend `.env` file has already been updated with:

```env
MINIO_ENDPOINT=minio.radeo.in
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=ylpop1kdbsskkyei
MINIO_BUCKET=product-media
MINIO_REGION=us-east-1
```

### 5. Deploy Changes

1. **In Dokploy MinIO Service:**
   - Update the docker-compose.yml
   - Update environment variables
   - Click "Deploy" or "Redeploy"

2. **In Dokploy Backend Service:**
   - Update environment variables (already done in .env file)
   - Redeploy the backend service

3. **Wait for SSL certificates:**
   - Traefik will automatically request SSL certificates from Let's Encrypt
   - This may take 1-2 minutes

### 6. Verify Setup

1. **Test MinIO API (should redirect to HTTPS):**

   ```bash
   curl -I https://minio.radeo.in/minio/health/live
   ```

2. **Test MinIO Console:**
   - Visit https://minio-console.radeo.in
   - Login with: minioadmin / ylpop1kdbsskkyei

3. **Test Image Upload:**
   - Try uploading a product with images
   - Check browser console - should see HTTPS URLs

### 7. Expected URLs After Fix

- **MinIO API:** https://minio.radeo.in
- **MinIO Console:** https://minio-console.radeo.in
- **Signed Upload URLs:** https://minio.radeo.in/product-media/products/...
- **Public Image URLs:** https://minio.radeo.in/product-media/products/...

## Troubleshooting

### If you see SSL errors:

- Wait 2-3 minutes for Let's Encrypt certificate generation
- Check Traefik logs in Dokploy

### If MinIO is not accessible:

- Verify DNS records are propagated: `nslookup minio.radeo.in`
- Check Traefik dashboard for router status

### If images still don't upload:

- Clear browser cache
- Check browser console for the new HTTPS URLs
- Verify backend logs show correct MinIO endpoint

## Rollback (if needed)

If something goes wrong, you can temporarily rollback by:

1. In backend .env, change:

   ```env
   MINIO_ENDPOINT=157.173.218.96
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   ```

2. In MinIO compose, add back:
   ```yaml
   ports:
     - 9000:9000
   ```

Note: This rollback will only work for local development, not for production HTTPS site.
