# Shiprocket Integration - Environment Variables Setup

## 📋 Required Environment Variables

Add the following environment variables to your backend `.env` file:

```env
# Shiprocket API Credentials
SHIPROCKET_EMAIL=your_api_user_email@example.com
SHIPROCKET_PASSWORD=your_api_user_password
```

## 🔐 How to Get Shiprocket Credentials

### Step 1: Create Shiprocket Account

1. Go to https://app.shiprocket.in/register
2. Complete the sign-up process
3. Verify your account

### Step 2: Create API User

1. Log in to your Shiprocket account
2. Go to **Settings** → **API** → **Add New API User**
3. Click on **"Create API User"**
4. In the pop-up form:
   - Enter a **unique email address** (must be different from your main Shiprocket login)
   - Under **Modules to Access**, select the relevant API modules:
     - ✅ Orders
     - ✅ Shipments
     - ✅ Courier
     - ✅ Tracking
     - ✅ Returns
   - Under **Buyer's Details Access**, choose **"Allowed"** or **"Not Allowed"** based on your requirement
5. Click **"Create User"**
6. The password for the API user will be sent to your **registered email address** (not the API user email ID)

### Step 3: Add Credentials to .env

1. Open `backend/.env` file
2. Add the credentials:
   ```env
   SHIPROCKET_EMAIL=api_user_email@example.com
   SHIPROCKET_PASSWORD=password_from_email
   ```

## 🌐 Webhook Setup (Optional but Recommended)

To receive real-time tracking updates:

1. Log in to your Shiprocket account
2. Go to **Settings** → **API** → **Webhooks**
3. Add your webhook URL:
   ```
   https://yourdomain.com/api/v1/admin/shiprocket/webhook
   ```
4. Enable the toggle
5. Add a security token (optional but recommended):
   - Generate a random token (e.g., using `openssl rand -hex 32`)
   - Add it as `x-api-key` header
6. Save the webhook

### Webhook Security (Optional)

If you added a security token, update your webhook handler to verify it:

```javascript
// In backend/controllers/shiprocketController.js
exports.handleWebhook = async (req, res) => {
  const securityToken = req.headers["x-api-key"];

  if (securityToken !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // ... rest of the webhook handler
};
```

Add to `.env`:

```env
SHIPROCKET_WEBHOOK_SECRET=your_generated_token
```

## 📦 Pickup Address Setup

1. Log in to Shiprocket
2. Go to **Settings** → **Pickup Addresses**
3. Add your warehouse/store addresses
4. Set one as **Primary** (this will be used as default)
5. Note the pickup location names for use in the admin panel

## 🚀 Testing the Integration

### 1. Test Authentication

```bash
# Backend should log on startup:
✅ Shiprocket authenticated successfully
```

### 2. Test Shipment Creation

1. Go to Admin Panel → Orders
2. Click the truck icon (🚛) on a confirmed order
3. Enter package details
4. Get shipping rates
5. Select a courier and create shipment

### 3. Test Tracking

1. Click the map pin icon (📍) on a shipped order
2. View real-time tracking information

### 4. Test Label Generation

1. Click the download icon (⬇️) on a shipped order
2. Label PDF should open in a new tab

## 🎯 API Features Available

### Admin Panel Features:

- ✅ Create Shipment
- ✅ Get Shipping Rates
- ✅ Schedule Pickup
- ✅ Generate Label
- ✅ Track Shipment
- ✅ Cancel Shipment
- ✅ Generate Manifest
- ✅ View Pickup Addresses

### Automatic Features:

- ✅ Auto-select recommended courier
- ✅ Auto-schedule pickup for next day
- ✅ Auto-generate shipping label
- ✅ Webhook tracking updates

## 📊 Order Flow with Shiprocket

```
1. Customer places order → Razorpay payment
2. Order status: CONFIRMED
3. Admin creates shipment (manual trigger)
   ↓
4. Shiprocket creates order
5. AWB assigned automatically
6. Pickup scheduled automatically
7. Label generated automatically
   ↓
8. Order status: PROCESSING
9. Admin/courier picks up package
   ↓
10. Webhook updates: PICKED UP → IN TRANSIT
11. Order status: SHIPPED
    ↓
12. Webhook updates: OUT FOR DELIVERY
13. Order status: SHIPPED
    ↓
14. Webhook updates: DELIVERED
15. Order status: DELIVERED
```

## 🔧 Troubleshooting

### Issue: Authentication Failed

**Solution:**

- Verify email and password are correct
- Ensure the API user has proper permissions
- Check if API user is active in Shiprocket dashboard

### Issue: No Couriers Available

**Solution:**

- Check if delivery pincode is serviceable
- Verify pickup address is set up correctly
- Ensure COD is enabled if order is COD

### Issue: Webhook Not Working

**Solution:**

- Verify webhook URL is publicly accessible (HTTPS required)
- Check webhook URL format in Shiprocket dashboard
- Test webhook endpoint manually using Postman
- Check server logs for webhook requests

### Issue: Label Generation Failed

**Solution:**

- Ensure AWB is assigned to the shipment
- Verify shipment is not cancelled
- Try regenerating from admin panel

## 📞 Support

For Shiprocket API issues:

- Email: integration@shiprocket.com
- Documentation: https://apidocs.shiprocket.in

For integration issues:

- Check backend logs
- Verify environment variables
- Test API endpoints manually

## 🔄 Token Refresh

The authentication token is valid for **10 days**. The system automatically:

- Checks token expiry before each API call
- Refreshes token if expired
- Stores new token for subsequent requests

No manual token management required! ✨

## 📝 Important Notes

1. **Sandbox vs Production:**
   - Shiprocket doesn't have a separate sandbox
   - All API calls affect real data
   - Test with dummy orders if needed

2. **COD Charges:**
   - COD orders have additional charges
   - Displayed in shipping rate calculation
   - Automatically included in courier selection

3. **Weight and Dimensions:**
   - Accurate measurements ensure correct rates
   - Volumetric weight may apply for large packages
   - Update default values in admin panel

4. **Pickup Times:**
   - Default pickup scheduled for next day
   - Can be customized in admin panel
   - Courier pickup windows vary by location

5. **Tracking Updates:**
   - Webhooks provide real-time updates
   - Manual tracking also available
   - Updates stored in order shipping details

## ✅ Verification Checklist

- [ ] Shiprocket account created
- [ ] API user created with proper permissions
- [ ] Credentials added to .env file
- [ ] Backend server restarted
- [ ] Pickup addresses configured
- [ ] Webhook URL added (optional)
- [ ] Test shipment created successfully
- [ ] Label downloaded successfully
- [ ] Tracking working correctly

## 🎉 You're All Set!

Your Shiprocket integration is complete. You can now:

- Create shipments from admin panel
- Track orders in real-time
- Generate shipping labels
- Manage deliveries efficiently

Happy Shipping! 🚀📦
