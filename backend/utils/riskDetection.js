/**
 * Risk Detection Utility
 * Analyzes orders for potential shipping/delivery risks
 */

/**
 * Validate Indian PIN code format
 * @param {String} pincode
 * @returns {Boolean}
 */
const isValidPincode = (pincode) => {
  return /^[1-9][0-9]{5}$/.test(pincode);
};

/**
 * Check if address is incomplete or missing critical info
 * @param {Object} address
 * @returns {Boolean}
 */
const hasIncompleteAddress = (address) => {
  if (!address) return true;

  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "postalCode",
  ];

  // Check for missing fields
  for (const field of requiredFields) {
    if (!address[field] || address[field].toString().trim() === "") {
      return true;
    }
  }

  // Check for suspiciously short addresses
  if (address.addressLine1 && address.addressLine1.length < 5) {
    return true;
  }

  // Check for placeholder text
  const placeholders = [
    "test",
    "na",
    "n/a",
    "address",
    "xyz",
    "abc",
    "dummy",
    "sample",
  ];
  const addressText =
    `${address.addressLine1} ${address.addressLine2 || ""} ${address.city}`.toLowerCase();

  for (const placeholder of placeholders) {
    if (addressText.includes(placeholder)) {
      return true;
    }
  }

  return false;
};

/**
 * Check if phone number is valid
 * @param {String} phone
 * @returns {Boolean}
 */
const isValidPhone = (phone) => {
  if (!phone) return false;

  // Remove spaces and special characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Indian mobile: 10 digits starting with 6-9
  return /^[6-9][0-9]{9}$/.test(cleaned);
};

/**
 * Check if COD value is suspiciously high
 * @param {Number} amount - Order total in paise
 * @param {String} paymentMethod
 * @returns {Boolean}
 */
const hasHighCODValue = (amount, paymentMethod) => {
  const HIGH_COD_THRESHOLD = 5000000; // ₹50,000 in paise (50000 * 100)

  return paymentMethod === "cod" && amount > HIGH_COD_THRESHOLD;
};

/**
 * Analyze order for all risk factors
 * @param {Object} order - Order document
 * @returns {Object} - Risk analysis result
 */
const analyzeOrderRisks = (order) => {
  const risks = [];

  // Check incomplete address
  if (hasIncompleteAddress(order.shippingAddress)) {
    risks.push({
      type: "incomplete_address",
      severity: "high",
      message: "Address is incomplete or contains placeholder text",
    });
  }

  // Check invalid pincode
  if (!isValidPincode(order.shippingAddress?.postalCode)) {
    risks.push({
      type: "invalid_pincode",
      severity: "high",
      message: "Invalid PIN code format",
    });
  }

  // Check invalid phone
  if (!isValidPhone(order.shippingAddress?.phone)) {
    risks.push({
      type: "invalid_phone",
      severity: "medium",
      message: "Invalid or incomplete phone number",
    });
  }

  // Check high COD value
  if (
    hasHighCODValue(order.total || order.totalAmount, order.payment?.method)
  ) {
    risks.push({
      type: "high_cod_value",
      severity: "medium",
      message: `High COD value: ₹${((order.total || order.totalAmount) / 100).toLocaleString()}`,
    });
  }

  // Check if already has failed delivery
  if (order.shipping?.trackingHistory?.length > 0) {
    const failedStatuses = [
      "FAILED DELIVERY",
      "UNDELIVERED",
      "RTO INITIATED",
      "RTO",
      "CUSTOMER REFUSED",
    ];

    const hasFailedDelivery = order.shipping.trackingHistory.some((entry) =>
      failedStatuses.some((status) =>
        entry.status?.toUpperCase().includes(status),
      ),
    );

    if (hasFailedDelivery) {
      risks.push({
        type: "failed_delivery_history",
        severity: "high",
        message: "Previous failed delivery attempt",
      });
    }
  }

  // Check unverified delivery location
  if (order.shippingAddress?.verifiedDelivery === false) {
    risks.push({
      type: "unserviceable_area",
      severity: "medium",
      message: "Delivery not verified for this PIN code",
    });
  }

  return {
    hasRisks: risks.length > 0,
    riskCount: risks.length,
    risks,
    highSeverityCount: risks.filter((r) => r.severity === "high").length,
  };
};

/**
 * Get risk badge color
 * @param {String} severity
 * @returns {String} - Tailwind color class
 */
const getRiskBadgeColor = (severity) => {
  const colors = {
    high: "red",
    medium: "orange",
    low: "yellow",
  };
  return colors[severity] || "gray";
};

/**
 * Middleware: Attach risk analysis to order
 */
const attachRiskAnalysis = (req, res, next) => {
  if (req.order) {
    req.order.riskAnalysis = analyzeOrderRisks(req.order);
  }
  next();
};

module.exports = {
  isValidPincode,
  hasIncompleteAddress,
  isValidPhone,
  hasHighCODValue,
  analyzeOrderRisks,
  getRiskBadgeColor,
  attachRiskAnalysis,
};
