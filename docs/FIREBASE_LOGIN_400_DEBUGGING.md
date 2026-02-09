# Firebase Login 400 Error - Debugging Guide

## Issue Summary

The Firebase login endpoint (`api.radeo.in/api/v1/auth/firebase-login`) is returning a 400 status code with the message: **"Firebase token is required"**

```
Failed to load resource: the server responded with a status of 400
Backend sync error: AxiosError: Request failed with status code 400
```

## Root Cause Analysis

The 400 error indicates that `firebaseToken` is missing or undefined in the request body being sent to the backend.

### Possible Causes:

1. **Token Not Retrieved**: The Firebase ID token wasn't successfully obtained from the Firebase SDK
2. **Token Null/Undefined**: The token exists but is somehow null or undefined when the request is made
3. **Async Timing Issue**: The token promise didn't resolve before the request was sent
4. **Payload Structure Issue**: The request payload is malformed or not properly serialized

## Changes Made

### Backend Improvements

**File**: `backend/controllers/authController.js`

Enhanced error logging to identify exactly what's being received:

```javascript
// Now logs:
// - Whether firebaseToken exists
// - Length of token (for validation)
// - What fields ARE in the request body
// - Content-Type header
// - Detailed Firebase verification errors
```

### Frontend Improvements

**File**: `frontend/src/app/auth/firebase-login/page.jsx`

Added comprehensive request validation and logging:

```javascript
// Before sending request:
1. Validates token exists
2. Logs the exact payload being sent
3. Shows token length and field verification
4. Captures detailed error responses from backend
5. Displays specific error messages to user
```

## How to Debug Further

### Step 1: Check Browser Console

When the error occurs, check browser DevTools console for:

```
📤 Sending Firebase login payload: {
  hasToken: true/false,
  tokenLength: Number,
  email: String,
  uid: String,
  payloadKeys: Array
}
```

**If `hasToken` is false**: The token wasn't retrieved from Firebase
**If `tokenLength` is 0**: The token exists but is empty string

### Step 2: Check Backend Logs

The backend now logs detailed information:

```
📋 Firebase Login Request Received: {
  hasToken: Boolean,
  tokenLength: Number,
  email: String,
  uid: String,
  bodyKeys: Array,  // What fields ARE present
  contentType: String
}
```

**Missing firebaseToken?**: Check the `bodyKeys` to see what's actually being sent

### Step 3: Check Network Tab

In browser DevTools → Network → XHR/Fetch:

1. Find the `firebase-login` POST request
2. Click on the request and check:
   - **Request Headers**: Should have `Content-Type: application/json`
   - **Request Payload**: Should contain `firebaseToken`, `email`, `uid`, etc.
   - **Response**: Will now show detailed error with list of received fields

### Step 4: Verify Firebase Configuration

Check `frontend/src/config/firebase.js`:

- [ ] Firebase SDK is properly initialized
- [ ] `auth` object is exported
- [ ] Environment variables are set in `.env.local`

Check `backend/config/firebase.js`:

- [ ] Firebase Admin SDK is initialized
- [ ] Service account credentials are valid
- [ ] Project ID matches Firebase console

## Common Issues & Solutions

### Issue 1: Token is null

**Symptom**: Console shows `tokenLength: 0` or `hasToken: false`

**Solution**:

1. Check if Firebase auth is initialized
2. Verify user is actually signed in
3. Check if there's an async timing issue

**Test in Firebase Login page**:

```javascript
const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken();
  console.log("Token:", token);
} else {
  console.log("No user signed in");
}
```

### Issue 2: Request payload is malformed

**Symptom**: Backend logs show `bodyKeys` missing `firebaseToken`

**Solution**:

1. Check Axios instance configuration in `utils/api.js`
2. Verify JSON serialization is working
3. Test with a simple POST request first

### Issue 3: Firebase token is invalid

**Symptom**: 401 error instead of 400, message: "Invalid Firebase token"

**Solution**:

1. Check that token isn't expired
2. Verify Firebase Admin SDK credentials
3. Check that `firebase.js` (backend) is initializing correctly

See logs:

```
Firebase token verification error: {
  code: String,  // Error code from Firebase
  message: String,  // Error message
  tokenLength: Number
}
```

## Next Steps

### For Immediate Testing:

1. Enable browser DevTools
2. Open Console and Network tabs
3. Attempt Firebase login (Google, Email, or Phone)
4. Check console logs for the new debugging output
5. Share the exact logs from both frontend console and backend logs

### For Verification:

1. Test each auth method separately:
   - [ ] Google Sign-In
   - [ ] Email/Password Login
   - [ ] Phone OTP Login
2. Test in different environments:
   - [ ] localhost (development)
   - [ ] Staging environment
   - [ ] Production (api.radeo.in)

## Files Modified

1. **backend/controllers/authController.js**
   - Enhanced firebaseLogin function with detailed error logging
   - Improved error messages with error codes

2. **frontend/src/app/auth/firebase-login/page.jsx**
   - Added request validation
   - Enhanced console logging
   - Improved error handling and display

## Related Documentation

- [Firebase Authentication Guide](./FIREBASE_AUTHENTICATION_GUIDE.md)
- [Firebase Backend Setup](./FIREBASE_BACKEND_SETUP.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Last Updated**: 2026-02-09
**Status**: Debugging improvements deployed - waiting for error reproduction to verify
