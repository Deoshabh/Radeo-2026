# Product Fetching Issue - Troubleshooting Guide

## 🔍 Problem Summary

Products are added through admin panel but don't appear on the frontend products page.

## ✅ Root Cause

**NO PRODUCTS EXIST IN THE DATABASE**

The diagnostic script confirmed that there are 0 products in the database. This means products weren't successfully saved when you added them through the admin panel.

## 🎯 Likely Reasons

### 1. **Database Connection Mismatch** (Most Likely)

- Your local `.env` points to: `mongodb://127.0.0.1:27017/shoes_auth`
- But on VPS/Dokploy, the backend is probably connecting to a different MongoDB instance
- Products added on VPS are going to VPS database
- Your local diagnostic is checking local database

### 2. **Environment Variables Not Set in Dokploy**

The `MONGO_URI` might not be configured correctly in your Dokploy deployment.

### 3. **Silent API Failures**

The admin panel might be showing success, but the API requests are failing due to:

- Network issues
- CORS errors
- Authentication problems
- Validation errors

## 🔧 Solutions

### **SOLUTION 1: Check Dokploy Database Connection**

#### A. Access Dokploy Dashboard

1. Go to your Dokploy dashboard
2. Find your backend application
3. Check the **Logs** section
4. Look for:
   ```
   ✅ MongoDB connected
   OR
   ❌ MongoDB connection error: ...
   ```

#### B. Verify Environment Variables

In Dokploy:

1. Go to your backend app → **Environment Variables**
2. Verify these are set:

   ```env
   MONGO_URI=mongodb://mongodb:27017/shoes_auth
   # OR your external MongoDB connection string
   # mongodb+srv://user:pass@cluster.mongodb.net/shoes_auth
   ```

3. After updating, **restart the backend service**

### **SOLUTION 2: Connect to VPS Database Directly**

SSH into your VPS and check the actual database:

```bash
# Connect to VPS
ssh user@your-vps-ip

# If MongoDB is in Docker
docker exec -it <mongodb-container-name> mongosh

# Or if MongoDB is installed directly
mongosh

# Then run:
use shoes_auth
db.products.countDocuments()
db.products.find().pretty()
```

This will show you if products actually exist in the production database.

### **SOLUTION 3: Add Test Product via API**

Use this curl command to test product creation directly:

```bash
# First, login to get auth token
curl -X POST https://api.radeo.in/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin@email.com",
    "password": "your-password"
  }'

# Copy the accessToken from response

# Then create a product
curl -X POST https://api.radeo.in/api/v1/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Oxford Shoes",
    "slug": "test-oxford-shoes",
    "description": "Test product to verify API",
    "category": "oxford",
    "price": 2999,
    "stock": 100,
    "images": [{
      "url": "https://minio.radeo.in/product-media/test/test.png",
      "key": "test/test.png",
      "isPrimary": true,
      "order": 0
    }],
    "featured": true,
    "isActive": true
  }'
```

### **SOLUTION 4: Check Frontend Console**

1. Open your website: `https://radeo.in`
2. Open Browser DevTools (F12)
3. Go to **Console** tab
4. Refresh the products page
5. Look for errors like:
   - `Failed to fetch products: Network Error`
   - `CORS error`
   - `401 Unauthorized`
   - `404 Not Found`

### **SOLUTION 5: Test API Endpoint Directly**

Open in browser or use curl:

```bash
# Check if products API is accessible
curl https://api.radeo.in/api/v1/products

# Expected response:
# [] (empty array if no products)
# OR
# Error message if API is down
```

### **SOLUTION 6: Verify CORS Configuration**

Your server.js has:

```javascript
const allowedOrigins = ["https://radeo.in", "https://www.radeo.in"];
```

Make sure:

1. Your frontend is accessing from these exact domains
2. No trailing slashes or port numbers
3. HTTPS is properly configured

## 🚀 Quick Fix Steps

### Step 1: SSH into VPS

```bash
ssh your-user@your-vps-ip
```

### Step 2: Check Docker containers

```bash
docker ps
# Find your backend and mongodb containers
```

### Step 3: Check backend logs

```bash
docker logs <backend-container-name> --tail 100
```

### Step 4: Check if MongoDB is running

```bash
docker logs <mongodb-container-name> --tail 50
```

### Step 5: Connect to MongoDB and verify

```bash
docker exec -it <mongodb-container-name> mongosh

use shoes_auth
db.products.countDocuments()
```

If count is 0:

- Problem: Products aren't being saved
- Check backend logs for errors when creating products

If count > 0:

- Products exist but frontend can't fetch them
- Check CORS, API URL, and frontend configuration

## 📝 Test Product Creation Locally

Run the test script I created:

```bash
cd backend
node test-product-creation.js
```

This will:

1. Connect to MongoDB
2. Create a test product
3. Verify it can be fetched
4. Show you the exact issue

## 🔍 Debug Checklist

- [ ] Backend is running on VPS
- [ ] MongoDB is running and accessible
- [ ] `MONGO_URI` environment variable is set correctly in Dokploy
- [ ] Backend logs show "✅ MongoDB connected"
- [ ] Products exist in database (`db.products.countDocuments()` > 0)
- [ ] API endpoint is accessible: `https://api.radeo.in/api/v1/products`
- [ ] Frontend `NEXT_PUBLIC_API_URL` is set to: `https://api.radeo.in/api/v1`
- [ ] No CORS errors in browser console
- [ ] Admin user is authenticated when creating products

## 📞 Need More Help?

Run these commands and share the output:

```bash
# On VPS
docker ps
docker logs <backend-container> --tail 50
docker exec -it <mongodb-container> mongosh --eval "use shoes_auth; db.products.countDocuments()"

# Or send me:
1. Dokploy backend logs
2. Browser console errors (F12)
3. Network tab showing the API request/response
```

## 🎯 Most Likely Solution

Based on your setup, the issue is probably:

**Your Dokploy deployment doesn't have the correct `MONGO_URI` environment variable set.**

Fix:

1. Go to Dokploy dashboard
2. Your backend app → Environment Variables
3. Add/Update: `MONGO_URI=mongodb://mongodb:27017/shoes_auth`
4. Restart the backend service
5. Try adding a product again through admin panel
6. Check if it appears on the products page

---

After following these steps, if products still don't appear, check:

- The `isActive` field (should be `true`)
- The category name (should match what you're filtering by)
- The frontend API calls (browser DevTools Network tab)
