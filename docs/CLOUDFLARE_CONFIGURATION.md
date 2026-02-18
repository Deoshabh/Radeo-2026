# Cloudflare Configuration for RADEO

Apply these rules in the Cloudflare dashboard for `radeo.in`.

## Cache Rules

### Rule 1: Public Settings API (Edge Cache)
- **When**: URI Path starts with `/api/v1/settings/public`
- **AND**: Request Header `Authorization` is empty
- **Then**: Cache eligible, Edge TTL = 5 minutes, Browser TTL = 1 minute
- **Bypass**: When `Authorization` header is present

### Rule 2: Next.js Static Assets (Immutable)
- **When**: URI Path starts with `/_next/static/`
- **Then**: Cache eligible, Edge TTL = 1 year (31536000s)
- **Browser TTL**: 1 year

### Rule 3: Next.js Image Optimization
- **When**: URI Path starts with `/_next/image`
- **Then**: Cache eligible, Edge TTL = 7 days

### Rule 4: MinIO/CDN Images
- **When**: Hostname equals `cdn.radeo.in`
- **AND**: Request Method equals `GET`
- **Then**: Cache eligible, Edge TTL = 7 days

## Transform Rules (Response Headers)

### Rule 1: Immutable Static Assets
- **When**: URI Path contains `/_next/static/`
- **Set Response Header**: `Cache-Control` = `public, max-age=31536000, immutable`

## WAF Custom Rules

### Rule 1: Admin Route Protection
```
Expression: (http.request.uri.path contains "/admin/" and not http.cookie contains "accessToken")
Action: Block
```

### Rule 2: Auth Rate Limiting
```
Expression: (http.request.uri.path contains "/api/v1/auth/")
Rate: 50 requests per minute per IP
Action: Block for 60 seconds
```

## Security Settings

- **Bot Fight Mode**: Enabled
- **DNSSEC**: Enabled
- **Browser Integrity Check**: Enabled
- **Under Attack Mode**: Available via API toggle from admin dashboard

## Turnstile Setup

1. Go to Cloudflare Dashboard → Turnstile
2. Add site: `radeo.in`
3. Widget type: **Managed** (invisible for most users)
4. Copy Site Key → set as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in frontend env
5. Copy Secret Key → set as `TURNSTILE_SECRET_KEY` in backend env

## R2 / MinIO CDN

If keeping MinIO, point `cdn.radeo.in` CNAME to MinIO's public endpoint.
Cloudflare will cache all GET requests per Rule 4 above.

If migrating to R2:
1. Create R2 buckets: `radeo-products`, `radeo-media`, `radeo-reviews`, `radeo-temp`
2. Enable public access on `radeo-products` and `radeo-media`
3. Connect custom domain `cdn.radeo.in` to R2 bucket
4. Update `MINIO_ENDPOINT` and credentials to R2's S3-compatible API
5. Zero egress fees, built-in Cloudflare CDN
