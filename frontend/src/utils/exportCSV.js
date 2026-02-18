import { formatPrice } from '@/utils/helpers';

/**
 * Export orders to CSV
 * @param {Array} orders - Array of order objects
 * @param {string} filename - Optional filename (default: orders-YYYYMMDD.csv)
 */
export const exportOrdersToCSV = (orders, filename = null) => {
  if (!orders || orders.length === 0) {
    throw new Error("No orders to export");
  }

  // Generate default filename with current date
  const defaultFilename = `orders-${new Date().toISOString().split("T")[0]}.csv`;
  const csvFilename = filename || defaultFilename;

  // CSV headers
  const headers = [
    "Order ID",
    "Customer Name",
    "Email",
    "Phone",
    "Items",
    "Total Amount",
    "Status",
    "Payment Method",
    "Order Date",
    "Shipping Address",
    "City",
    "State",
    "PIN Code",
  ];

  // Convert orders to CSV rows
  const rows = orders.map((order) => {
    // Format items
    const items =
      order.items
        ?.map(
          (item) =>
            `${item.product?.name || item.name || "Unknown"} (x${item.quantity})`,
        )
        .join("; ") || "N/A";

    // Format address
    const address =
      [order.shippingAddress?.addressLine1, order.shippingAddress?.addressLine2]
        .filter(Boolean)
        .join(", ") || "N/A";

    return [
      order.orderId || "N/A",
      order.shippingAddress?.fullName || order.user?.name || "N/A",
      order.user?.email || "N/A",
      order.shippingAddress?.phone
        ? `+91${order.shippingAddress.phone}`
        : "N/A",
      items,
      formatPrice(order.total || order.totalAmount || 0),
      order.status || "N/A",
      order.payment?.method === "cod" ? "Cash on Delivery" : "Online Payment",
      new Date(order.createdAt).toLocaleString("en-IN"),
      address,
      order.shippingAddress?.city || "N/A",
      order.shippingAddress?.state || "N/A",
      order.shippingAddress?.postalCode || "N/A",
    ];
  });

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV content
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", csvFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
