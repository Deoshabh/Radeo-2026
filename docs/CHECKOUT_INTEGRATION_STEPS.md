# Quick Integration Guide - Update Checkout Page

## Step-by-Step: Add Address Validation to Checkout

### File: `frontend/src/app/checkout/page.jsx`

---

## Step 1: Add Imports (Top of file)

**Add these two lines after existing imports:**

```jsx
import StructuredAddressForm from "@/components/StructuredAddressForm";
import AddressConfirmationModal from "@/components/AddressConfirmationModal";
```

**Complete import section should look like:**

```jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { orderAPI, addressAPI, couponAPI } from "@/utils/api";
import toast from "react-hot-toast";
import {
  FiMapPin,
  FiPlus,
  FiEdit2,
  FiTag,
  FiCreditCard,
  FiDollarSign,
} from "react-icons/fi";
import StructuredAddressForm from "@/components/StructuredAddressForm"; // ← ADD THIS
import AddressConfirmationModal from "@/components/AddressConfirmationModal"; // ← ADD THIS
```

---

## Step 2: Update State Variables

**Find this line (around line 20):**

```jsx
const [showAddressForm, setShowAddressForm] = useState(false);
```

**Replace with:**

```jsx
const [showAddressForm, setShowAddressForm] = useState(false);
const [pendingAddress, setPendingAddress] = useState(null);
const [showAddressConfirm, setShowAddressConfirm] = useState(false);
```

---

## Step 3: Remove Old Address Form State

**Find and REMOVE these lines (around line 22-31):**

```jsx
const [addressForm, setAddressForm] = useState({
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  isDefault: false,
});
```

**You don't need this anymore - structured form handles it!**

---

## Step 4: Remove Old handleAddAddress Function

**Find and REMOVE this function (around line 71-87):**

```jsx
const handleAddAddress = async (e) => {
  e.preventDefault();
  try {
    await addressAPI.addAddress(addressForm);
    toast.success("Address added successfully!");
    fetchAddresses();
    setShowAddressForm(false);
    setAddressForm({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      isDefault: false,
    });
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to add address");
  }
};
```

---

## Step 5: Add New Address Handlers

**Add these NEW functions after `fetchAddresses()`:**

```jsx
const handleAddressSubmit = (validatedAddress) => {
  console.log("✅ Validated address:", validatedAddress);
  setPendingAddress(validatedAddress);
  setShowAddressForm(false);
  setShowAddressConfirm(true);
};

const handleConfirmAddress = async () => {
  try {
    await addressAPI.addAddress(pendingAddress);
    toast.success("Address saved successfully!");
    fetchAddresses();
    setShowAddressConfirm(false);
    setPendingAddress(null);
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to save address");
  }
};

const handleEditAddress = () => {
  setShowAddressConfirm(false);
  setShowAddressForm(true);
};

const handleCancelAddress = () => {
  setShowAddressConfirm(false);
  setShowAddressForm(false);
  setPendingAddress(null);
};
```

---

## Step 6: Replace Address Form UI

**Find the old address form section (search for "Add New Address" heading).**

**It should look something like this:**

```jsx
{
  showAddressForm && (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Add New Address</h2>
      <form onSubmit={handleAddAddress} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={addressForm.fullName}
            onChange={(e) =>
              setAddressForm({ ...addressForm, fullName: e.target.value })
            }
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        {/* ... more fields ... */}
        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-2 rounded-lg"
        >
          Save Address
        </button>
      </form>
    </div>
  );
}
```

**REPLACE THE ENTIRE SECTION with:**

```jsx
{
  /* New Structured Address Form */
}
{
  showAddressForm && (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Add New Address</h2>
        <button
          onClick={handleCancelAddress}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <StructuredAddressForm
        onSubmit={handleAddressSubmit}
        initialData={pendingAddress}
      />
    </div>
  );
}

{
  /* Address Confirmation Modal */
}
{
  showAddressConfirm && pendingAddress && (
    <AddressConfirmationModal
      address={pendingAddress}
      onConfirm={handleConfirmAddress}
      onEdit={handleEditAddress}
      onCancel={handleCancelAddress}
    />
  );
}
```

---

## Step 7: Update "Add New Address" Button

**Find the button that opens the address form (search for `setShowAddressForm(true)`):**

```jsx
<button
  onClick={() => setShowAddressForm(true)}
  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
>
  <FiPlus /> Add New Address
</button>
```

**Make sure it calls:**

```jsx
onClick={() => {
  setPendingAddress(null); // Clear any pending
  setShowAddressForm(true);
}}
```

---

## Visual Before/After

### BEFORE (Old Flow)

```
User clicks "Add Address"
  ↓
Show basic form with 8 fields
  ↓
User fills manually
  ↓
Submit → Save directly
```

### AFTER (New Flow)

```
User clicks "Add Address"
  ↓
Show structured form
  ↓
User fills split fields
  - Live PIN validation
  - Serviceability check
  ↓
Submit → Backend validates
  ↓
Show confirmation modal
  - Cleaned address
  - Delivery status
  ↓
User confirms → Save
```

---

## Complete Example

Here's what the relevant section should look like AFTER changes:

```jsx
export default function CheckoutPage() {
  // ... existing code ...

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [pendingAddress, setPendingAddress] = useState(null); // ← NEW
  const [showAddressConfirm, setShowAddressConfirm] = useState(false); // ← NEW

  // ... other state ...

  const fetchAddresses = async () => {
    // ... existing code ...
  };

  // ✅ NEW FUNCTIONS
  const handleAddressSubmit = (validatedAddress) => {
    console.log("✅ Validated address:", validatedAddress);
    setPendingAddress(validatedAddress);
    setShowAddressForm(false);
    setShowAddressConfirm(true);
  };

  const handleConfirmAddress = async () => {
    try {
      await addressAPI.addAddress(pendingAddress);
      toast.success("Address saved successfully!");
      fetchAddresses();
      setShowAddressConfirm(false);
      setPendingAddress(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save address");
    }
  };

  const handleEditAddress = () => {
    setShowAddressConfirm(false);
    setShowAddressForm(true);
  };

  const handleCancelAddress = () => {
    setShowAddressConfirm(false);
    setShowAddressForm(false);
    setPendingAddress(null);
  };

  // ... rest of component ...

  return (
    <div>
      {/* Existing addresses list */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Shipping Address</h2>
          <button
            onClick={() => {
              setPendingAddress(null);
              setShowAddressForm(true);
            }}
            className="flex items-center gap-2 text-primary-600"
          >
            <FiPlus /> Add New Address
          </button>
        </div>

        {addresses.map((addr) => (
          <div key={addr._id} className="...">
            {/* Address card */}
          </div>
        ))}
      </div>

      {/* ✅ NEW FORM */}
      {showAddressForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add New Address</h2>
            <button
              onClick={handleCancelAddress}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <StructuredAddressForm
            onSubmit={handleAddressSubmit}
            initialData={pendingAddress}
          />
        </div>
      )}

      {/* ✅ NEW CONFIRMATION MODAL */}
      {showAddressConfirm && pendingAddress && (
        <AddressConfirmationModal
          address={pendingAddress}
          onConfirm={handleConfirmAddress}
          onEdit={handleEditAddress}
          onCancel={handleCancelAddress}
        />
      )}

      {/* Rest of checkout page */}
    </div>
  );
}
```

---

## Testing After Integration

1. **Go to checkout page**
2. **Click "Add New Address"**
3. **Fill the form:**
   - Enter PIN code 201301
   - See "✓ Delivery available" message
   - Fill other fields
4. **Click "Save & Continue"**
5. **See confirmation modal**
6. **Click "Confirm & Proceed"**
7. **Address should save**

---

## Rollback Plan (If Issues)

If something breaks, you can easily revert:

1. **Remove these lines from imports:**

   ```jsx
   import StructuredAddressForm from "@/components/StructuredAddressForm";
   import AddressConfirmationModal from "@/components/AddressConfirmationModal";
   ```

2. **Remove these state variables:**

   ```jsx
   const [pendingAddress, setPendingAddress] = useState(null);
   const [showAddressConfirm, setShowAddressConfirm] = useState(false);
   ```

3. **Remove the new handler functions**

4. **Restore old form JSX**

Old form is still in your git history, or you can keep a backup of the original file.

---

## Common Issues & Fixes

### Issue: "addressAPI.addAddress is not a function"

**Fix:** Check `frontend/src/utils/api.js` has:

```javascript
export const addressAPI = {
  addAddress: (data) => api.post("/addresses", data),
  // ...
};
```

### Issue: Modal doesn't show

**Fix:** Check `showAddressConfirm` state is set to `true`:

```javascript
console.log("Show confirm?", showAddressConfirm);
console.log("Pending address?", pendingAddress);
```

### Issue: Validation fails

**Fix:** Check backend is running and `/api/v1/addresses/validate` endpoint exists:

```bash
curl -X POST https://api.radeo.in/api/v1/addresses/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"9876543210","pincode":"201301"}'
```

---

## Files Modified Summary

- ✅ `frontend/src/app/checkout/page.jsx` - Updated with new components
- ✅ `frontend/src/components/StructuredAddressForm.jsx` - Created
- ✅ `frontend/src/components/AddressConfirmationModal.jsx` - Created

**No backend changes needed - APIs already deployed!**

---

**Estimated Time:** 10-15 minutes  
**Difficulty:** Easy (copy-paste mostly)  
**Impact:** High (better UX + validation)
