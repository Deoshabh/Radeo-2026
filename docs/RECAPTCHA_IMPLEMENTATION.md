# Google reCAPTCHA Enterprise Implementation Guide

## Overview

This document describes the implementation of Google reCAPTCHA Enterprise in the application to protect authentication endpoints from bots and automated attacks.

## Architecture

### Frontend Implementation

1. **reCAPTCHA Script Loading**: The reCAPTCHA Enterprise JavaScript library is loaded in the main layout
   - Location: `frontend/src/app/layout.jsx`
   - Site Key: `6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl`

2. **reCAPTCHA Utility**: Custom React hook and utility functions
   - Location: `frontend/src/utils/recaptcha.js`
   - Functions:
     - `executeRecaptcha(action)`: Executes reCAPTCHA and returns token
     - `useRecaptcha()`: React hook for easy integration
     - `RECAPTCHA_ACTIONS`: Constants for action names

3. **Component Integration**: reCAPTCHA integrated into authentication flows
   - EmailAuth component: Login, Register, Password Reset
   - Firebase Login page: All authentication methods
   - Token is obtained before API calls and sent to backend

### Backend Implementation

1. **reCAPTCHA Middleware**: Verifies tokens with Google
   - Location: `backend/middleware/recaptcha.js`
   - Functions:
     - `verifyRecaptcha(action, minScore, optional)`: Express middleware
     - `verifyRecaptchaToken(token, action, minScore)`: Core verification

2. **Protected Routes**: Middleware applied to authentication endpoints
   - Location: `backend/routes/authRoutes.js`
   - Protected endpoints:
     - `/auth/register`
     - `/auth/login`
     - `/auth/firebase-login`
     - `/auth/forgot-password`

## Configuration

### Environment Variables

#### Frontend (`.env.local`)

```env
# reCAPTCHA is configured directly in the code
# No additional environment variables needed
```

#### Backend (`.env`)

```env
# Google Cloud Project Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl
RECAPTCHA_API_KEY=your-api-key
```

### Google Cloud Setup

1. **Create reCAPTCHA Enterprise Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to Security > reCAPTCHA Enterprise
   - Create a new key with the following settings:
     - Display name: "Shoes Website"
     - Platform type: Website
     - Domains: Your production and development domains
     - Integration type: Score-based (recommended)

2. **Service Account Credentials**:
   - Create a service account with reCAPTCHA Enterprise Admin role
   - Download the JSON key file
   - Place it in the backend directory as `google-credentials.json`
   - Add to `.gitignore`

3. **Enable reCAPTCHA Enterprise API**:
   - In Google Cloud Console
   - Go to APIs & Services > Library
   - Search for "reCAPTCHA Enterprise API"
   - Click "Enable"

## Usage

### Frontend Usage

```javascript
import { useRecaptcha, RECAPTCHA_ACTIONS } from "@/utils/recaptcha";

function MyComponent() {
  const { getToken } = useRecaptcha();

  const handleSubmit = async () => {
    // Get reCAPTCHA token
    const recaptchaToken = await getToken(RECAPTCHA_ACTIONS.LOGIN);

    // Send to backend
    await api.post("/auth/login", {
      email,
      password,
      recaptchaToken,
    });
  };
}
```

### Backend Usage

```javascript
const { verifyRecaptcha } = require("../middleware/recaptcha");

// Apply middleware to route
router.post(
  "/auth/login",
  verifyRecaptcha("LOGIN", 0.5, true), // action, minScore, optional
  login,
);
```

## Action Types

The following action types are defined:

- `LOGIN`: User login
- `REGISTER`: User registration
- `FORGOT_PASSWORD`: Password reset request
- `CHECKOUT`: Checkout process
- `ADD_TO_CART`: Add items to cart
- `CONTACT_FORM`: Contact form submission
- `REVIEW_SUBMIT`: Product review submission

## Score Thresholds

reCAPTCHA Enterprise returns a score between 0.0 and 1.0:

- `1.0`: Very likely a legitimate user
- `0.0`: Very likely a bot

**Recommended thresholds**:

- Authentication endpoints: `0.5` (balanced)
- Sensitive operations: `0.7` (stricter)
- Low-risk operations: `0.3` (lenient)

## Error Handling

### Frontend

- If reCAPTCHA fails to load, user can still proceed (graceful degradation)
- Errors are logged to console for debugging
- Toast notifications inform users of issues

### Backend

- **Development**: Failures are logged but requests continue (fail open)
- **Production**: Failures block requests (fail closed)
- **Optional flag**: `optional=true` allows requests without valid tokens
- Missing configuration results in warnings but allows requests

## Testing

### Development Mode

- reCAPTCHA is configured as optional on all endpoints
- Requests without tokens are allowed
- Enables testing without setting up Google Cloud credentials

### Testing with Admin Interface

1. Go to [reCAPTCHA Enterprise Console](https://console.cloud.google.com/security/recaptcha)
2. View assessments and scores
3. Adjust thresholds based on traffic patterns

## Security Best Practices

1. **Token Expiry**: Tokens expire after 2 minutes - generate just before use
2. **Action Matching**: Always verify action matches expected value
3. **Score Monitoring**: Monitor scores and adjust thresholds as needed
4. **Credentials Security**:
   - Never commit Google service account credentials to git
   - Use environment variables for sensitive data
   - Rotate credentials regularly

## Monitoring

### Logs

- Successful verifications: `✅ reCAPTCHA verified for action: LOGIN, score: 0.9`
- Failed verifications: `❌ reCAPTCHA verification failed: ...`
- Skipped verifications: `⚠️ reCAPTCHA verification skipped - client not initialized`

### Metrics to Monitor

- Verification success rate
- Average scores by action type
- Failed verification reasons
- Response times

## Troubleshooting

### Frontend Issues

**Issue**: `grecaptcha is not defined`

- **Cause**: Script not loaded yet
- **Solution**: Wait for script to load (handled automatically by utility)

**Issue**: Token generation fails

- **Cause**: Network issues or blocked by ad blocker
- **Solution**: Application continues to work (graceful degradation)

### Backend Issues

**Issue**: `Error: Could not load the default credentials`

- **Cause**: Service account credentials not configured
- **Solution**: Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

**Issue**: `Invalid reCAPTCHA token`

- **Cause**: Token expired or already used
- **Solution**: Generate new token for each request

**Issue**: All requests fail in production

- **Cause**: reCAPTCHA not configured properly
- **Solution**: Check environment variables and Google Cloud setup

## Migration Notes

The reCAPTCHA implementation is designed to be backwards compatible:

- Existing authentication flows continue to work
- reCAPTCHA is optional by default during rollout
- Can be made mandatory by removing `optional=true` flag

## Additional Resources

- [reCAPTCHA Enterprise Documentation](https://cloud.google.com/recaptcha-enterprise/docs)
- [reCAPTCHA Enterprise Node.js Client](https://www.npmjs.com/package/@google-cloud/recaptcha-enterprise)
- [Best Practices Guide](https://cloud.google.com/recaptcha-enterprise/docs/best-practices)
