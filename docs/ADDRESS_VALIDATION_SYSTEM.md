# Amazon/Flipkart-Style Address Validation System

Complete enterprise-grade address workflow with live validation, serviceability checks, and confirmation modal.

## 🎯 Overview

This system provides:

- **Structured Address Form** - Split fields (house, street, landmark, city, state, PIN)
- **Live Validation** - Real-time phone/PIN validation as you type
- **Serviceability Check** - Shiprocket API integration for delivery availability
- **Address Normalization** - Auto-cleanup of address text (capitalize, remove extra spaces)
- **Confirmation Modal** - Review before saving
- **Warning System** - Guide users instead of hard blocking

## 📦 Components Created

### 1. Backend Components

#### `backend/utils/addressValidator.js`

Complete validation service:

```javascript
const result = await validateAddress({
  name: "John Doe",
  phone: "9876543210",
  pincode: "201301",
  house: "C-104 maxblis white house",
  street: "sector 137 greater noida",
  landmark: "near metro station",
  city: "Greater Noida",
  state: "Uttar Pradesh"
});

// Returns:
{
  isValid: true,
  cleanedAddress: {
    name: "John Doe",
    phone: "9876543210",
    pincode: "201301",
    house: "C-104 Maxblis White House",
    street: "Sector 137 Greater Noida",
    landmark: "Near Metro Station",
    city: "Greater Noida",
    state: "Uttar Pradesh"
  },
  errors: [],
  warnings: ["Consider adding apartment/tower number"],
  serviceable: true,
  codAvailable: true
}
```

**Features:**

- `normalizeAddressText()` - Capitalize, convert "road" → "Rd", remove extra spaces
- `validatePhone()` - 10-digit Indian mobile (6-9 start)
- `validatePincode()` - 6-digit format
- `validateAddressFields()` - Check all required fields
- `checkServiceability()` - Shiprocket courier availability
- `cleanAddress()` - Normalize all fields
- `validateAddress()` - Complete orchestration

#### `backend/controllers/addressController.js`

New API endpoints:

**POST /api/v1/addresses/validate**

```javascript
// Request
{
  "name": "John Doe",
  "phone": "9876543210",
  "pincode": "201301",
  "house": "C-104",
  "street": "Sector 137",
  "landmark": "Near Metro",
  "city": "Greater Noida",
  "state": "Uttar Pradesh"
}

// Response
{
  "success": true,
  "message": "Address validated successfully",
  "cleanedAddress": { /* normalized fields */ },
  "warnings": [],
  "serviceable": true,
  "codAvailable": true
}
```

**GET /api/v1/addresses/check-pincode/:pincode**

```javascript
// Request: GET /api/v1/addresses/check-pincode/201301

// Response
{
  "success": true,
  "pincode": "201301",
  "serviceable": true,
  "codAvailable": true
}
```

#### `backend/models/Address.js`

Enhanced schema:

```javascript
{
  verifiedDelivery: Boolean,   // Shiprocket confirmed deliverable
  codAvailable: Boolean,        // COD available at this location
  lastVerified: Date            // When serviceability was checked
}
```

### 2. Frontend Components

#### `frontend/src/components/StructuredAddressForm.jsx`

Amazon-style structured input form.

**Features:**

- Split fields (house, street, landmark, city, state, PIN)
- Live PIN code check with debounce (500ms)
- Real-time validation feedback
- Auto-fill city/state after validation
- Warning system (guide, don't block)
- Loading states

**Props:**

```javascript
<StructuredAddressForm
  onSubmit={(validatedAddress) => {
    // Address already validated & cleaned by backend
    console.log(validatedAddress);
  }}
  initialData={existingAddress} // Optional: pre-fill for editing
/>
```

**Usage:**

```jsx
import StructuredAddressForm from "@/components/StructuredAddressForm";

const [address, setAddress] = useState(null);

<StructuredAddressForm onSubmit={(validated) => setAddress(validated)} />;
```

#### `frontend/src/components/AddressConfirmationModal.jsx`

Review modal before saving.

**Props:**

```javascript
<AddressConfirmationModal
  address={validatedAddress}
  onConfirm={() => saveToDatabase()}
  onEdit={() => showFormAgain()}
  onCancel={() => closeEverything()}
/>
```

**Shows:**

- Formatted address card
- Serviceability status (✓ or ⚠)
- COD availability
- Edit/Confirm buttons

#### `frontend/src/components/AddressWorkflowExample.jsx`

Complete integration example.

**Workflow:**

1. User clicks "Add New Address"
2. Show `StructuredAddressForm`
3. Form validates via backend API
4. Show `AddressConfirmationModal` with cleaned address
5. User confirms → Save to database
6. User edits → Go back to form

## 🚀 Integration Guide

### Option 1: Replace Existing Address Form

In your checkout page:

```jsx
// OLD CODE (remove this)
<form onSubmit={handleAddAddress}>
  <input name="fullName" />
  <input name="phone" />
  <input name="addressLine1" />
  // ...
</form>;

// NEW CODE (use this)
import StructuredAddressForm from "@/components/StructuredAddressForm";
import AddressConfirmationModal from "@/components/AddressConfirmationModal";

const [pendingAddress, setPendingAddress] = useState(null);
const [showConfirm, setShowConfirm] = useState(false);

// Show form
<StructuredAddressForm
  onSubmit={(validated) => {
    setPendingAddress(validated);
    setShowConfirm(true);
  }}
/>;

// Show confirmation
{
  showConfirm && (
    <AddressConfirmationModal
      address={pendingAddress}
      onConfirm={async () => {
        await addressAPI.addAddress(pendingAddress);
        toast.success("Address saved!");
        fetchAddresses(); // Reload list
        setShowConfirm(false);
      }}
      onEdit={() => setShowConfirm(false)}
      onCancel={() => {
        setShowConfirm(false);
        setPendingAddress(null);
      }}
    />
  );
}
```

### Option 2: Add to Profile Page

```jsx
// In profile/page.jsx or profile/addresses/page.jsx

import AddressWorkflowExample from "@/components/AddressWorkflowExample";

<AddressWorkflowExample
  onAddressAdded={(newAddress) => {
    // Refresh address list
    fetchAddresses();
  }}
/>;
```

### Option 3: Checkout Integration

Update `frontend/src/app/checkout/page.jsx`:

```jsx
// Around line 30-35, replace addressForm state
const [showStructuredForm, setShowStructuredForm] = useState(false);
const [pendingAddress, setPendingAddress] = useState(null);
const [showAddressConfirm, setShowAddressConfirm] = useState(false);

// Replace the old form (around line 71-87) with:
{
  showStructuredForm && (
    <StructuredAddressForm
      onSubmit={(validated) => {
        setPendingAddress(validated);
        setShowStructuredForm(false);
        setShowAddressConfirm(true);
      }}
    />
  );
}

{
  showAddressConfirm && pendingAddress && (
    <AddressConfirmationModal
      address={pendingAddress}
      onConfirm={async () => {
        await addressAPI.addAddress(pendingAddress);
        toast.success("Address added!");
        fetchAddresses();
        setShowAddressConfirm(false);
        setPendingAddress(null);
      }}
      onEdit={() => {
        setShowAddressConfirm(false);
        setShowStructuredForm(true);
      }}
      onCancel={() => {
        setShowAddressConfirm(false);
        setPendingAddress(null);
      }}
    />
  );
}
```

## 🔌 API Integration

### Environment Variables

Already configured:

```env
# frontend/.env.local & .env.production
NEXT_PUBLIC_API_URL=https://api.radeo.in/api/v1
```

### API Endpoints Used

1. **POST /api/v1/addresses/validate** (Protected)
   - Requires: Bearer token in Authorization header
   - Body: `{ name, phone, pincode, house, street, landmark, city, state }`
   - Returns: Validated + cleaned address

2. **GET /api/v1/addresses/check-pincode/:pincode** (Public)
   - No auth required
   - Returns: `{ serviceable, codAvailable }`

3. **POST /api/v1/addresses** (Protected)
   - Save validated address
   - Body: Full address object from validation

## 🎨 UI/UX Features

### Live Validation

- PIN code: Checks serviceability as you type (500ms debounce)
- Phone: 10-digit validation, must start with 6-9
- All fields: Real-time feedback

### Visual Feedback

```
✓ Delivery available (COD available)      [Green badge]
⚠ Delivery may not be available           [Orange badge]
🔄 Checking...                              [Loading spinner]
```

### Error vs Warning

- **Errors**: Block submission (missing fields, invalid phone)
- **Warnings**: Guide users (suggest adding landmark, check spelling)

### Address Normalization

```
Input:  "c-104 maxblis white house"
Output: "C-104 Maxblis White House"

Input:  "sector 137 noida road"
Output: "Sector 137 Noida Rd"
```

## 📝 Data Flow

```
User Input (Form)
    ↓
Frontend Validation (Basic checks)
    ↓
API Call: POST /validate
    ↓
Backend: addressValidator.js
    ├─ normalizeAddressText()
    ├─ validatePhone()
    ├─ validatePincode()
    ├─ validateAddressFields()
    └─ checkServiceability() → Shiprocket API
    ↓
Return: Cleaned + Validated Address
    ↓
Frontend: Show Confirmation Modal
    ↓
User Confirms
    ↓
API Call: POST /addresses (Save to DB)
    ↓
Address Saved with serviceability flags
```

## ⚙️ Configuration

### Shiprocket Integration

**Required:** Configure pickup location in Shiprocket dashboard

1. Login to Shiprocket → Settings → Pickup Addresses
2. Add your warehouse address with **PIN 201301** (or your actual PIN)
3. Set as "Primary" pickup location
4. This enables courier availability checks

### Backend Environment

```env
# backend/.env (already configured)
SHIPROCKET_EMAIL=your-email@example.com
SHIPROCKET_PASSWORD=your-password
```

### Rate Limiting

- PIN code checks: Public endpoint, consider rate limiting
- Validation API: Protected by authentication

## 🧪 Testing

### Test Scenario 1: Valid Address

```javascript
{
  name: "John Doe",
  phone: "9876543210",
  pincode: "201301", // Noida (serviceable)
  house: "C-104",
  street: "Sector 137",
  city: "Greater Noida",
  state: "Uttar Pradesh"
}

Expected: ✓ Validation passes, serviceable = true
```

### Test Scenario 2: Invalid Phone

```javascript
{
  name: "John Doe",
  phone: "1234567890", // Doesn't start with 6-9
  // ... other fields
}

Expected: ✗ Error - "Invalid phone number format"
```

### Test Scenario 3: Unserviceable Area

```javascript
{
  // ... valid fields
  pincode: "999999" // Non-existent PIN
}

Expected: ⚠ Warning - "Delivery may not be available"
```

## 🚨 Important Notes

### Don't Break Existing Flow

- Old address API endpoints still work
- Validation endpoints are **additive**
- Existing checkout still functions
- You can migrate gradually

### Shiprocket Pickup Location

**CRITICAL:** Configure in dashboard before testing shipments

- Without pickup location: "No courier services available"
- With correct PIN: Full courier options available

### Serviceability Checks

- PIN code check is **fast** (cached in Shiprocket)
- Full validation includes courier availability
- Results are estimates, not guarantees

## 📊 What Gets Stored

When address is saved, these fields are added:

```javascript
{
  // ... existing address fields
  verifiedDelivery: true,           // Courier services available
  codAvailable: true,               // COD enabled for this PIN
  lastVerified: "2025-01-22T10:30:00Z" // When we checked
}
```

## 🔄 Migration Path

### Phase 1: Add New Components (Done ✅)

- StructuredAddressForm
- AddressConfirmationModal
- Backend validation endpoints

### Phase 2: Test in Isolation

- Create test page with new workflow
- Verify validation API
- Check Shiprocket integration

### Phase 3: Integrate into Checkout

- Replace old form with structured form
- Add confirmation modal
- Keep old form as fallback

### Phase 4: Profile Integration

- Add to profile/addresses page
- Allow editing with validation
- Show serviceability status

## 🎯 Next Steps

1. **Configure Shiprocket Pickup Location** (Required)
   - Dashboard → Settings → Pickup Addresses
   - Add warehouse with PIN 201301 (or your actual location)

2. **Test Validation API** (Optional)

   ```bash
   # Test PIN check (no auth)
   curl https://api.radeo.in/api/v1/addresses/check-pincode/201301

   # Test full validation (with auth)
   curl -X POST https://api.radeo.in/api/v1/addresses/validate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","phone":"9876543210","pincode":"201301",...}'
   ```

3. **Integrate into Checkout**
   - Copy integration code from this doc
   - Test on dev/staging first
   - Deploy to production

4. **Monitor & Optimize**
   - Check validation success rate
   - Monitor Shiprocket API calls
   - Gather user feedback

## 📚 Additional Resources

- [Shiprocket Serviceability API](https://apidocs.shiprocket.in/#serviceability)
- [Address Validation Best Practices](https://www.nngroup.com/articles/address-forms/)
- Component source: `frontend/src/components/`
- Backend logic: `backend/utils/addressValidator.js`

---

**Status:** ✅ Backend Complete | 🔄 Frontend Components Ready | ⏳ Integration Pending
