// ===============================
// Address Validation & Serviceability Service
// ===============================
const shiprocketService = require("./shiprocket");
const { log } = require("./logger");

/**
 * Normalize address text (Amazon/Flipkart style)
 */
const normalizeAddressText = (text) => {
  if (!text) return text;

  return (
    text
      .trim()
      // Remove multiple spaces
      .replace(/\s+/g, " ")
      // Normalize common abbreviations
      .replace(/\broad\b/gi, "Rd")
      .replace(/\bstreet\b/gi, "St")
      .replace(/\bavenue\b/gi, "Ave")
      .replace(/\bapartment\b/gi, "Apt")
      .replace(/\bfloor\b/gi, "Flr")
      .replace(/\bbuilding\b/gi, "Bldg")
      // Capitalize first letter of each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

/**
 * Validate Indian phone number
 */
const validatePhone = (phone) => {
  const cleaned = phone?.replace(/\D/g, "");

  if (!cleaned) {
    return { valid: false, error: "Phone number is required" };
  }

  // Remove country code if present
  const phoneNumber = cleaned.startsWith("91") ? cleaned.slice(2) : cleaned;

  if (phoneNumber.length !== 10) {
    return { valid: false, error: "Phone must be 10 digits" };
  }

  if (!/^[6-9]/.test(phoneNumber)) {
    return { valid: false, error: "Phone must start with 6, 7, 8, or 9" };
  }

  return { valid: true, cleaned: phoneNumber };
};

/**
 * Validate Indian PIN code
 */
const validatePincode = (pincode) => {
  const cleaned = pincode?.replace(/\D/g, "");

  if (!cleaned) {
    return { valid: false, error: "PIN code is required" };
  }

  if (cleaned.length !== 6) {
    return { valid: false, error: "PIN code must be 6 digits" };
  }

  return { valid: true, cleaned };
};

/**
 * Validate address fields
 */
const validateAddressFields = (address) => {
  const warnings = [];
  const errors = [];

  // Name validation
  if (!address.name || address.name.trim().length < 3) {
    errors.push("Full name must be at least 3 characters");
  }

  // Phone validation
  const phoneCheck = validatePhone(address.phone);
  if (!phoneCheck.valid) {
    errors.push(phoneCheck.error);
  }

  // PIN code validation
  const pincodeCheck = validatePincode(address.pincode);
  if (!pincodeCheck.valid) {
    errors.push(pincodeCheck.error);
  }

  // House/Flat validation
  if (!address.house || address.house.trim().length < 3) {
    errors.push("House/Flat number is required (min 3 characters)");
  } else if (address.house.trim().length < 5) {
    warnings.push("House/Flat details seem incomplete. Please verify.");
  }

  // Street validation
  if (!address.street || address.street.trim().length < 5) {
    errors.push("Street/Locality is required (min 5 characters)");
  } else if (address.street.trim().length < 10) {
    warnings.push(
      "Street/Locality details seem brief. Consider adding more details.",
    );
  }

  // Landmark (optional but recommended)
  if (!address.landmark || address.landmark.trim().length < 3) {
    warnings.push("Adding a landmark helps delivery partners find you easily");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cleanedPhone: phoneCheck.cleaned,
    cleanedPincode: pincodeCheck.cleaned,
  };
};

/**
 * Check Shiprocket serviceability for PIN code
 */
const checkServiceability = async (pincode, pickupPincode = "201301") => {
  try {
    const response = await shiprocketService.getShippingRates({
      pickup_postcode: pickupPincode,
      delivery_postcode: pincode,
      weight: 0.5,
      cod: 1,
      declared_value: 1000,
    });

    const couriers = response?.available_courier_companies || [];

    return {
      serviceable: couriers.length > 0,
      codAvailable: couriers.some((c) => c.cod === 1),
      estimatedDays: couriers.length > 0 ? couriers[0].etd : null,
      courierCount: couriers.length,
    };
  } catch (error) {
    log.error("Serviceability check error:", error);
    return {
      serviceable: false,
      codAvailable: false,
      error: "Unable to check serviceability",
    };
  }
};

/**
 * Clean and format address (Amazon/Flipkart style)
 */
const cleanAddress = (address) => {
  return {
    name: normalizeAddressText(address.name || ""),
    phone: (address.phone || "").replace(/\D/g, "").slice(-10), // Last 10 digits
    house: normalizeAddressText(address.house || ""),
    street: normalizeAddressText(address.street || ""),
    landmark: normalizeAddressText(address.landmark || ""),
    pincode: (address.pincode || "").replace(/\D/g, ""),
    city: normalizeAddressText(address.city || ""),
    state: normalizeAddressText(address.state || ""),
  };
};

/**
 * Validate complete address with Shiprocket serviceability
 */
const validateAddress = async (address, checkService = true) => {
  // Step 1: Field validation
  const fieldValidation = validateAddressFields(address);

  if (!fieldValidation.valid) {
    return {
      valid: false,
      errors: fieldValidation.errors,
      warnings: fieldValidation.warnings,
    };
  }

  // Step 2: Clean address
  const cleanedAddress = cleanAddress({
    ...address,
    phone: fieldValidation.cleanedPhone,
    pincode: fieldValidation.cleanedPincode,
  });

  // Step 3: Serviceability check (optional)
  let serviceability = null;
  if (checkService) {
    serviceability = await checkServiceability(cleanedAddress.pincode);

    if (!serviceability.serviceable) {
      fieldValidation.warnings.push(
        "Delivery may not be available to this PIN code. Please verify.",
      );
    }

    if (!serviceability.codAvailable) {
      fieldValidation.warnings.push(
        "Cash on Delivery may not be available for this location",
      );
    }
  }

  return {
    valid: true,
    errors: [],
    warnings: fieldValidation.warnings,
    cleanedAddress,
    serviceable: serviceability?.serviceable,
    codAvailable: serviceability?.codAvailable,
    estimatedDays: serviceability?.estimatedDays,
  };
};

module.exports = {
  validateAddress,
  cleanAddress,
  normalizeAddressText,
  validatePhone,
  validatePincode,
  checkServiceability,
};
