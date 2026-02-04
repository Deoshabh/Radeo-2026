# Customer Order Tracking - Automatic Updates

## ✅ Yes! Customers See Automatic Updates

When Shiprocket sends tracking updates via webhooks, **customers will see real-time updates automatically** without any action needed.

---

## 🎯 What Customers See

### 1. **Order List Page** (`/orders`)

Customers can see all their orders with shipping information:

```
┌─────────────────────────────────────────────────────────────┐
│  MY ORDERS                                                    │
├─────────────────────────────────────────────────────────────┤
│  Order ID: ORD-20260204-00123                                │
│  Date: 4 Feb 2026  |  Amount: ₹3,499                        │
│  Status: [🚚 Shipped]                              [View]    │
│  ────────────────────────────────────────────────────────    │
│  🚚 Delhivery Express  |  AWB: 123456789  |  IN TRANSIT     │
└─────────────────────────────────────────────────────────────┘
```

**Shows:**

- ✅ Order status badge
- ✅ Courier partner name (e.g., Delhivery, Bluedart)
- ✅ AWB tracking number
- ✅ Current shipping status (from Shiprocket webhook)

---

### 2. **Order Detail Page** (`/orders/[id]`)

When customers click "View Details", they see comprehensive tracking:

```
┌─────────────────────────────────────────────────────────────┐
│  ORDER DETAILS - ORD-20260204-00123                          │
│  Status: [🚚 Shipped]                          [Cancel]      │
├─────────────────────────────────────────────────────────────┤
│  📅 Order Date: 4 Feb 2026                                   │
│  💰 Total: ₹3,499  |  📦 Payment: Prepaid                   │
├─────────────────────────────────────────────────────────────┤
│  SHIPPING DETAILS                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Courier Partner:    Delhivery Express                   ││
│  │ Tracking Number:    123456789                           ││
│  │ Current Status:     IN TRANSIT ✓                        ││
│  │ Last Updated:       4 Feb 2026, 10:30 AM                ││
│  │ Est. Delivery:      6 Feb 2026                          ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ORDER TRACKING                                              │
│  ●━━━━━●━━━━━●━━━━━○━━━━━○                                │
│  ✓     ✓     ✓     →      ?                                 │
│  Confirmed  Processing  Shipped  Out for  Delivered          │
│                                   Delivery                   │
└─────────────────────────────────────────────────────────────┘
```

**Shows:**

- ✅ Blue highlighted shipping details box
- ✅ Courier partner name
- ✅ AWB tracking number (can be used on courier website)
- ✅ **Current Status** - Updated automatically by webhook
- ✅ **Last Updated** timestamp - When last webhook was received
- ✅ Estimated delivery date
- ✅ Visual progress tracker

---

## 🔄 How Automatic Updates Work

### Step-by-Step Flow:

1. **Admin Creates Shipment** (from admin panel)
   - Shiprocket assigns AWB
   - Order status → "Processing"
   - Customer sees: "Processing" with AWB number

2. **Courier Picks Up Package**
   - Shiprocket sends webhook → Server updates order
   - Order status → "Shipped"
   - `shipping.current_status` → "PICKED UP"
   - Customer sees: "Shipped" + "PICKED UP" status

3. **Package In Transit**
   - Webhook → Server updates
   - `shipping.current_status` → "IN TRANSIT"
   - `shipping.last_tracking_update` → Current timestamp
   - Customer sees: Updated status "IN TRANSIT" with new timestamp

4. **Out for Delivery**
   - Webhook → Server updates
   - `shipping.current_status` → "OUT FOR DELIVERY"
   - Customer sees: "OUT FOR DELIVERY" in real-time

5. **Delivered**
   - Webhook → Server updates
   - Order status → "Delivered"
   - `shipping.current_status` → "DELIVERED"
   - Customer sees: "Delivered" with completion badge ✓

---

## 💻 Technical Implementation

### Backend Webhook Handler

```javascript
// backend/controllers/shiprocketController.js
exports.handleWebhook = async (req, res) => {
  const webhookData = req.body;

  // Find order by AWB or Shiprocket order ID
  const order = await Order.findOne({
    "shipping.awb_code": webhookData.awb,
  });

  // Update shipping status (Customers will see this)
  order.shipping.current_status = webhookData.current_status;
  order.shipping.last_tracking_update = new Date();

  // Update order status
  if (webhookData.current_status === "DELIVERED") {
    order.status = "delivered";
  }

  await order.save(); // ✅ SAVED - Customer sees on next page load
};
```

### Frontend Display

```javascript
// Automatically shown on order detail page
{
  order.shipping?.current_status && (
    <div>
      <p>Current Status: {order.shipping.current_status}</p>
      <p>Last updated: {order.shipping.last_tracking_update}</p>
    </div>
  );
}
```

---

## 📱 Customer Experience

### What Customers Can Do:

1. **Check Order Status Anytime**
   - Go to "My Orders" page
   - See real-time shipping status

2. **View Tracking Details**
   - Click "View Details" on any order
   - See courier name and AWB
   - See current shipping status
   - See last update time

3. **Track on Courier Website** (Optional)
   - Copy AWB number from order page
   - Visit courier website (Delhivery, Bluedart, etc.)
   - Paste AWB for detailed tracking

4. **Get Status Updates**
   - Every time Shiprocket sends webhook
   - Customer sees updated status immediately on page refresh
   - No manual action needed!

---

## 🎨 Customer UI Updates

### Orders List - NEW FEATURES:

- ✅ Shipping info row under each order
- ✅ Courier partner name with truck icon 🚚
- ✅ AWB number in monospace font
- ✅ Current status in green/blue color

### Order Detail - NEW FEATURES:

- ✅ Blue highlighted "Shipping Details" section
- ✅ Courier partner
- ✅ Tracking number (AWB)
- ✅ Current status badge
- ✅ Last updated timestamp
- ✅ Estimated delivery date
- ✅ Visual progress tracker (existing, now enhanced)

---

## 🔔 Update Frequency

### Automatic Updates Via Webhook:

| Event              | Webhook Trigger     | Customer Sees        |
| ------------------ | ------------------- | -------------------- |
| Manifest Generated | Within 1 hour       | "MANIFEST GENERATED" |
| Picked Up          | When courier picks  | "PICKED UP"          |
| In Transit         | At each checkpoint  | "IN TRANSIT"         |
| Out for Delivery   | Morning of delivery | "OUT FOR DELIVERY"   |
| Delivered          | Upon delivery       | "DELIVERED" ✓        |
| RTO/Failed         | If delivery fails   | Status updated       |

**Update Speed:**

- Webhook received: < 1 second
- Database updated: < 1 second
- Customer sees update: Next page load/refresh

---

## 📊 Status Mapping

Shiprocket sends detailed statuses that map to your order statuses:

| Shiprocket Status  | Your Order Status | Customer Display               |
| ------------------ | ----------------- | ------------------------------ |
| MANIFEST GENERATED | processing        | "Processing" + shipping info   |
| PICKED UP          | shipped           | "Shipped" + "PICKED UP"        |
| IN TRANSIT         | shipped           | "Shipped" + "IN TRANSIT"       |
| OUT FOR DELIVERY   | shipped           | "Shipped" + "OUT FOR DELIVERY" |
| DELIVERED          | delivered         | "Delivered" ✓                  |
| CANCELLED          | cancelled         | "Cancelled"                    |
| RTO                | cancelled         | "Cancelled" (Return to Origin) |

---

## 🚀 Real-World Example

### Timeline from Customer Perspective:

**Feb 4, 2026 - 10:00 AM**

```
Customer places order
Status: Confirmed
```

**Feb 4, 2026 - 11:00 AM**

```
Admin creates shipment
Status: Processing
Shipping: Delhivery Express | AWB: 123456789
```

**Feb 4, 2026 - 3:00 PM** (Webhook received)

```
Status: Shipped
Current Status: PICKED UP
Last Updated: Feb 4, 3:00 PM
```

**Feb 5, 2026 - 8:00 AM** (Webhook received)

```
Status: Shipped
Current Status: IN TRANSIT
Last Updated: Feb 5, 8:00 AM
```

**Feb 6, 2026 - 9:00 AM** (Webhook received)

```
Status: Shipped
Current Status: OUT FOR DELIVERY
Last Updated: Feb 6, 9:00 AM
Est. Delivery: Today
```

**Feb 6, 2026 - 5:30 PM** (Webhook received)

```
Status: Delivered ✓
Current Status: DELIVERED
Last Updated: Feb 6, 5:30 PM
```

---

## ✨ Key Benefits for Customers

1. **Transparency**
   - See exactly where their order is
   - Know which courier is handling delivery
   - Have tracking number for courier website

2. **Real-Time Updates**
   - No need to contact support
   - Status updates automatically
   - See last update time

3. **Trust Building**
   - Professional tracking display
   - Reliable courier partners
   - Clear delivery estimates

4. **Self-Service**
   - Check status anytime
   - Copy AWB for external tracking
   - Visual progress indicator

---

## 🔧 No Action Required from Customers

✅ Updates happen **automatically**
✅ Just refresh the order page to see latest status
✅ No login/logout needed
✅ No app installation needed
✅ Works on mobile and desktop

---

## 📞 Customer Support Benefits

Customers can now answer their own questions:

- "Where is my order?" → Check order page
- "When will it arrive?" → See estimated delivery
- "Who is delivering?" → Courier name shown
- "Tracking number?" → AWB displayed

**Result:** Fewer support tickets, happier customers! 🎉

---

## 🎯 Summary

**YES, customers will see automatic updates!**

✅ Real-time status from Shiprocket webhooks
✅ Displayed on orders list page
✅ Detailed view on order detail page
✅ Courier name, AWB, and current status
✅ Last updated timestamp
✅ Estimated delivery date
✅ Visual progress tracker

**Everything updates automatically - no action needed from customers!** 🚀
