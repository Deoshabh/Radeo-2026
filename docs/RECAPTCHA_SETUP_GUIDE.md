# Google reCAPTCHA Enterprise Setup Guide

## Quick Start

Follow these steps to set up Google reCAPTCHA Enterprise for your application.

## Prerequisites

- Google Cloud account
- Access to Google Cloud Console
- Project owner or editor permissions

## Step 1: Create or Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID** (you'll need this later)

## Step 2: Enable reCAPTCHA Enterprise API

1. In Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "**reCAPTCHA Enterprise API**"
3. Click on it and press "**Enable**"

## Step 3: Create a reCAPTCHA Site Key

1. Navigate to **Security** > **reCAPTCHA Enterprise**
2. Click "**Create Key**"
3. Fill in the details:
   - **Display name**: "Shoes Website" (or your preferred name)
   - **Platform type**: Select "**Website**"
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - `yourdomain.com` (for production)
     - `www.yourdomain.com` (if applicable)
   - **Integration type**: Select "**Score-based (recommended)**"
   - **Security preference**: Choose based on your needs (balanced recommended)
4. Click "**Create Key**"
5. Copy the **Site Key** (starts with 6L...)

## Step 4: Create a Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click "**Create Service Account**"
3. Fill in the details:
   - **Service account name**: "recaptcha-verifier" (or your preferred name)
   - **Service account ID**: Will auto-generate
   - **Description**: "Service account for reCAPTCHA Enterprise verification"
4. Click "**Create and Continue**"

## Step 5: Grant Service Account Permissions

1. On the permissions page, click "**Select a role**"
2. Search for and select "**reCAPTCHA Enterprise Admin**"
3. Click "**Continue**"
4. Skip the optional user access step
5. Click "**Done**"

## Step 6: Download Service Account Key

1. Find the service account you just created in the list
2. Click on it to open details
3. Navigate to the "**Keys**" tab
4. Click "**Add Key**" > "**Create new key**"
5. Select "**JSON**" format
6. Click "**Create**"
7. The JSON file will download automatically

## Step 7: Configure Backend

1. **Move the downloaded JSON file**:

   ```bash
   mv ~/Downloads/your-project-xxxxx.json backend/google-credentials.json
   ```

2. **Update backend/.env**:

   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   RECAPTCHA_SITE_KEY=6LcbjmUsAAAAAHVeGta063p2ii-OlYGQqOBPfmQl
   ```

3. **Verify the file is ignored by git**:
   ```bash
   git status
   # google-credentials.json should NOT appear in the list
   ```

## Step 8: Update Frontend (if needed)

The site key is already configured in the frontend. If you created a different site key:

1. Update `frontend/src/app/layout.jsx`:

   ```javascript
   <script src="https://www.google.com/recaptcha/enterprise.js?render=YOUR_SITE_KEY"></script>
   ```

2. Update `frontend/src/utils/recaptcha.js`:
   ```javascript
   const RECAPTCHA_SITE_KEY = "YOUR_SITE_KEY";
   ```

## Step 9: Test the Integration

1. **Start your backend**:

   ```bash
   cd backend
   npm run dev
   ```

2. **Start your frontend**:

   ```bash
   cd frontend
   npm run dev
   ```

3. **Test authentication**:
   - Try logging in
   - Check backend logs for: `✅ reCAPTCHA verified for action: LOGIN`
   - If you see warnings, check your configuration

## Troubleshooting

### Error: "Could not load the default credentials"

**Problem**: Backend can't find the credentials file

**Solution**:

- Verify `google-credentials.json` exists in the backend directory
- Check the `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`
- Ensure the path is relative to the backend directory

### Error: "reCAPTCHA Enterprise API has not been used"

**Problem**: API not enabled for your project

**Solution**:

- Go to Google Cloud Console
- Navigate to APIs & Services > Library
- Enable "reCAPTCHA Enterprise API"

### Warning: "reCAPTCHA verification skipped"

**Problem**: Missing or incorrect configuration

**Solution**:

- Check that all environment variables are set correctly
- Restart your backend server after updating `.env`
- In development, this is expected if credentials aren't configured

### Low reCAPTCHA Scores

**Problem**: Legitimate users getting low scores

**Solution**:

- Adjust the `minScore` parameter in the middleware (default is 0.5)
- Monitor scores in Google Cloud Console
- Consider lowering threshold for specific actions

## Production Deployment

### Security Checklist

- [ ] Service account JSON file is NOT committed to git
- [ ] Environment variables are set in production environment
- [ ] Domains are configured in Google Cloud Console
- [ ] reCAPTCHA is set to required mode (remove `optional=true`)
- [ ] Service account has minimum required permissions
- [ ] Monitoring is set up for reCAPTCHA assessments

### Environment-Specific Configuration

**Development**:

```env
GOOGLE_CLOUD_PROJECT_ID=your-dev-project
RECAPTCHA_SITE_KEY=your-dev-key
```

**Production**:

```env
GOOGLE_CLOUD_PROJECT_ID=your-prod-project
RECAPTCHA_SITE_KEY=your-prod-key
```

## Monitoring and Analytics

1. **View reCAPTCHA Assessments**:
   - Go to Google Cloud Console
   - Navigate to Security > reCAPTCHA Enterprise
   - Click on your key
   - View "Assessments" tab

2. **Monitor Metrics**:
   - Total assessments
   - Score distribution
   - Action types
   - Failed verifications

3. **Set up Alerts** (optional):
   - Create Cloud Monitoring alerts for unusual patterns
   - Alert on high bot traffic
   - Alert on API quota issues

## Costs

reCAPTCHA Enterprise pricing (as of 2026):

- First 10,000 assessments/month: **Free**
- Additional assessments: **$1 per 1,000 assessments**

For most small to medium websites, the free tier is sufficient.

## Support and Resources

- [reCAPTCHA Enterprise Documentation](https://cloud.google.com/recaptcha-enterprise/docs)
- [Pricing Information](https://cloud.google.com/recaptcha-enterprise/pricing)
- [Best Practices](https://cloud.google.com/recaptcha-enterprise/docs/best-practices)
- [Node.js Client Library](https://www.npmjs.com/package/@google-cloud/recaptcha-enterprise)

## Next Steps

After setup:

1. Test all authentication flows
2. Monitor scores and adjust thresholds
3. Add reCAPTCHA to other sensitive endpoints (checkout, contact forms, etc.)
4. Set up monitoring and alerts
5. Document any custom configurations for your team
