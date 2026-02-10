# Radeo E-Commerce - Full Audit & Recommendations

> **Audit Date:** February 10, 2026
> **Auditor:** Senior Developer (10+ years experience)
> **Project:** Radeo - Premium Leather Shoes E-Commerce
> **Stack:** Next.js 14 + Express 5 + MongoDB + Firebase Auth + MinIO + Valkey/Redis
> **Deployment:** VPS with Dokploy (Traefik, Valkey, MongoDB)

---

## P0 - CRITICAL (Fix Immediately)

### 1. ✅ reCAPTCHA Protection DISABLED on Auth Routes

- **File:** `backend/routes/authRoutes.js`
- **Issue:** All reCAPTCHA middleware is commented out. Register, login, forgot-password are unprotected from bots.
- **Fix:** Add per-route rate limiting as immediate protection while reCAPTCHA credentials are configured.

### 2. ✅ No Security Headers (helmet)

- **File:** `backend/server.js`
- **Issue:** No `helmet` middleware. No CSP, X-Frame-Options, X-Content-Type-Options from Express.
- **Fix:** Install and add `helmet()` middleware.

### 3. ✅ ReDoS Vulnerability in Product Search

- **File:** `backend/controllers/productController.js`
- **Issue:** User input passed directly into `new RegExp(...)` without sanitization. Attackers can inject regex causing server crash.
- **Fix:** Add `escapeRegex()` utility and sanitize all regex inputs. Install `express-mongo-sanitize`.

### 4. ✅ deleteProduct Image Parsing Bug

- **File:** `backend/controllers/adminProductController.js`
- **Issue:** Images are `[{url, key}]` objects but code treats them as strings with `.split()`. Will crash on delete.
- **Fix:** Use `image.key` instead of parsing URL strings.

---

## P1 - HIGH (Fix This Week)

### 5. ✅ MongoDB Injection Protection

- **File:** `backend/server.js`
- **Issue:** No `express-mongo-sanitize` middleware. NoSQL injection possible via query params.
- **Fix:** Install and add `mongoSanitize()` middleware.

### 6. ✅ Duplicate API Client

- **Files:** `frontend/src/utils/api.js` and `frontend/src/utils/apiClient.js`
- **Issue:** Two API clients with inconsistent token storage (Cookies vs localStorage). `apiClient.js` stores tokens in localStorage (XSS-vulnerable).
- **Fix:** Delete `apiClient.js`, ensure only `api.js` is used everywhere.

### 7. ✅ updateProduct Missing Fields

- **File:** `backend/controllers/adminProductController.js`
- **Issue:** `updateProduct` doesn't handle `comparePrice`, `brand`, `sku`, `colors`, `tags`, `gstPercentage`, `averageDeliveryCost`, `careInstructions`.
- **Fix:** Add all missing fields to the update handler.

### 8. ✅ No Pagination on Admin Endpoints

- **Files:** `adminProductController.js`, `adminOrderController.js`, `adminUserController.js`
- **Issue:** All list endpoints fetch entire collections. Will crash with growth.
- **Fix:** Add `page` and `limit` query params with defaults.

### 9. ✅ Logout Scans ALL Tokens

- **File:** `backend/controllers/authController.js`
- **Issue:** `logout()` fetches ALL refresh tokens for ALL users and compares each with bcrypt. Extremely slow at scale.
- **Fix:** Filter by `userId` from JWT payload first.

### 10. ✅ No Stock Validation on Orders

- **File:** `backend/controllers/orderController.js`
- **Issue:** Orders created without checking product stock or active status.
- **Fix:** Validate each item's stock and status before creating order.

### 11. ✅ Firebase Config Hardcoded

- **File:** `frontend/src/config/firebase.js`
- **Issue:** API keys hardcoded in source code.
- **Fix:** Move to `NEXT_PUBLIC_FIREBASE_*` env variables.

### 12. ✅ reCAPTCHA Key Hardcoded in HTML

- **File:** `frontend/src/app/layout.jsx`
- **Issue:** reCAPTCHA site key hardcoded in script tag.
- **Fix:** Use `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.

### 13. ✅ Nginx Double ACAO Header Bug

- **File:** `nginx.conf`
- **Issue:** Two `Access-Control-Allow-Origin` headers added (both radeo.in and www.radeo.in). Browsers reject this.
- **Fix:** Use `map` block for dynamic origin selection.

### 14. ✅ Node.js 18 EOL in Dockerfiles

- **Files:** `backend/Dockerfile`, `frontend/Dockerfile`
- **Issue:** Node 18 reached EOL April 2025.
- **Fix:** Upgrade to `node:20-alpine`.

### 15. ✅ Valkey Default Password Exposed

- **File:** `docker-compose.dokploy.yml`
- **Issue:** Hardcoded fallback password visible in VCS.
- **Fix:** Remove default fallback, require env variable.

### 16. ✅ Per-Route Rate Limiting

- **File:** `backend/server.js`, `backend/routes/authRoutes.js`
- **Issue:** Only global rate limit (1000/15min). Auth routes need stricter limits.
- **Fix:** Add granular rate limiters for auth, contact, and admin routes.

---

## P2 - MEDIUM (Fix This Month)

### 17. ⏭️ Add asyncHandler Wrapper

- **Files:** All controllers
- **Issue:** Manual try/catch in every handler. Inconsistent error propagation.
- **Fix:** Wrap route handlers with `asyncHandler`.
- **Note:** Skipped — existing try/catch blocks work correctly. Low risk-reward for deployed project.

### 18. ⏭️ Admin Route Input Validation

- **File:** `backend/routes/adminProductRoutes.js`
- **Issue:** No Zod validation schemas on admin CRUD routes.
- **Fix:** Add validation middleware for create/update product.
- **Note:** Deferred — admin routes are already behind auth + role middleware. Will add in next sprint.

### 19. ✅ Next.js Admin Auth Middleware

- **File:** `frontend/middleware.js` (new)
- **Issue:** Admin auth is client-side only. Flashes UI before redirect.
- **Fix:** Add Next.js middleware to protect `/admin/*` routes.

### 20. ✅ Search Debounce in Navbar

- **File:** `frontend/src/components/Navbar.jsx`
- **Issue:** Search fires on every keystroke.
- **Fix:** Add 300ms debounce.

### 21. ✅ Placeholder Image Missing

- **File:** `frontend/public/placeholder.jpg`
- **Issue:** Fallback image referenced but doesn't exist.
- **Fix:** Create a placeholder image.

### 22. ✅ Docker Log Rotation

- **File:** `docker-compose.dokploy.yml`
- **Issue:** No log rotation configured. Disk will fill.
- **Fix:** Add logging config with size limits.

### 23. ✅ Admin Users N+1 Query

- **File:** `backend/controllers/adminUserController.js`
- **Issue:** Individual Order query per user. 1000 users = 1000 queries.
- **Fix:** Batch order address lookup.

### 24. ✅ Remove Duplicate bcryptjs

- **File:** `backend/package.json`
- **Issue:** Both `bcrypt` and `bcryptjs` installed.
- **Fix:** Remove `bcryptjs`, keep native `bcrypt`.

---

## IMPLEMENTATION STATUS

| #   | Item                             | Status                     |
| --- | -------------------------------- | -------------------------- |
| 1   | Per-route rate limiting for auth | ✅ Implemented             |
| 2   | Helmet security headers          | ✅ Implemented             |
| 3   | ReDoS fix in product search      | ✅ Implemented             |
| 4   | deleteProduct image bug fix      | ✅ Implemented             |
| 5   | express-mongo-sanitize           | ✅ Implemented             |
| 6   | Remove duplicate apiClient.js    | ✅ Implemented             |
| 7   | updateProduct missing fields     | ✅ Implemented             |
| 8   | Pagination on admin endpoints    | ✅ Implemented             |
| 9   | Logout token scan fix            | ✅ Implemented             |
| 10  | Stock validation on orders       | ✅ Implemented             |
| 11  | Firebase config to env vars      | ✅ Implemented             |
| 12  | reCAPTCHA key to env var         | ✅ Implemented             |
| 13  | Nginx ACAO fix                   | ✅ Implemented             |
| 14  | Node.js 20 in Dockerfiles        | ✅ Implemented             |
| 15  | Valkey password fix              | ✅ Implemented             |
| 16  | Per-route rate limiting          | ✅ Implemented             |
| 17  | asyncHandler wrapper             | ⏭️ Deferred (low priority) |
| 18  | Admin route validation           | ⏭️ Deferred (next sprint)  |
| 19  | Next.js admin middleware         | ✅ Implemented             |
| 20  | Search debounce                  | ✅ Already existed         |
| 21  | Placeholder image                | ✅ Implemented             |
| 22  | Docker log rotation              | ✅ Implemented             |
| 23  | N+1 query fix                    | ✅ Implemented             |
| 24  | Remove bcryptjs                  | ✅ Implemented             |
