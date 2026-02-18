const axios = require("axios");
const { log } = require("./logger");
const { cacheClient } = require("../config/redis");

const SHIPROCKET_TOKEN_KEY = "shiprocket:auth:token";
const SHIPROCKET_TOKEN_TTL = 82800; // 23 hours in seconds

class ShiprocketService {
  constructor() {
    this.baseURL = "https://apiv2.shiprocket.in/v1/external";
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.token = null;
    this.tokenExpiry = null;
    this._retrying = false;

    // Create axios instance with 401 interceptor for auto-retry
    this.client = axios.create({ baseURL: this.baseURL });
    this.client.interceptors.response.use(null, async (error) => {
      if (error.response?.status === 401 && !this._retrying) {
        this._retrying = true;
        try {
          await this.clearCachedToken();
          const token = await this.authenticate();
          error.config.headers.Authorization = `Bearer ${token}`;
          return this.client.request(error.config);
        } finally {
          this._retrying = false;
        }
      }
      return Promise.reject(error);
    });

    if (!this.email || !this.password) {
      log.warn("⚠️ Shiprocket credentials (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) are missing.");
    }
  }

  /**
   * Clear cached token from Valkey and in-memory
   */
  async clearCachedToken() {
    this.token = null;
    this.tokenExpiry = null;
    if (cacheClient?.isReady) {
      await cacheClient.del(SHIPROCKET_TOKEN_KEY).catch(() => {});
    }
  }

  isPlaceholderCredential(value) {
    if (!value || typeof value !== "string") {
      return true;
    }

    return /^(replace-with|your-shiprocket-|changeme|example)/i.test(
      value.trim(),
    );
  }

  /**
   * Authenticate and get token
   * Token is valid for 10 days (240 hours)
   */
  async authenticate() {
    try {
      // Check Valkey cache first
      if (cacheClient?.isReady) {
        const cached = await cacheClient.get(SHIPROCKET_TOKEN_KEY).catch(() => null);
        if (cached) {
          this.token = cached;
          return cached;
        }
      }

      // Check in-memory fallback
      if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.token;
      }

      if (
        !this.email ||
        !this.password ||
        this.isPlaceholderCredential(this.email) ||
        this.isPlaceholderCredential(this.password)
      ) {
        const error = new Error(
          "Shiprocket credentials are missing or still using placeholder values.",
        );
        error.statusCode = 503;
        error.code = "SHIPROCKET_CONFIG_ERROR";
        throw error;
      }

      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: this.email,
        password: this.password,
      });

      this.token = response.data.token;
      // Set expiry to 9.5 days from now (safer than 10 days)
      this.tokenExpiry = new Date(Date.now() + 9.5 * 24 * 60 * 60 * 1000);

      // Cache in Valkey for 23 hours
      if (cacheClient?.isReady) {
        await cacheClient.set(SHIPROCKET_TOKEN_KEY, this.token, { EX: SHIPROCKET_TOKEN_TTL }).catch(() => {});
      }

      log.info("✅ Shiprocket authenticated successfully");
      return this.token;
    } catch (error) {
      log.error(
        "❌ Shiprocket authentication failed:",
        error.response?.data || error.message,
      );

      if (error.code === "SHIPROCKET_CONFIG_ERROR") {
        throw error;
      }

      const authError = new Error(
        error.response?.data?.message || "Shiprocket authentication failed",
      );
      authError.statusCode = error.response?.status || 502;
      authError.code = "SHIPROCKET_AUTH_ERROR";
      authError.details = error.response?.data || error.message;
      throw authError;
    }
  }

  /**
   * Get headers with authentication
   */
  async getHeaders() {
    const token = await this.authenticate();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Health check for Shiprocket credentials and auth
   */
  async checkHealth() {
    try {
      await this.authenticate();

      return {
        configured: true,
        authenticated: true,
        tokenExpiry: this.tokenExpiry,
      };
    } catch (error) {
      throw error;
    }
  }

  buildShiprocketError(error, fallbackMessage, code) {
    if (error?.code?.startsWith("SHIPROCKET_")) {
      return error;
    }

    const mappedError = new Error(
      error?.response?.data?.message || error?.message || fallbackMessage,
    );
    mappedError.statusCode = error?.response?.status || 500;
    mappedError.code = code;
    mappedError.details = error?.response?.data || error?.message;
    return mappedError;
  }

  extractFirstByKeys(payload, keys) {
    if (!payload || !Array.isArray(keys) || keys.length === 0) {
      return null;
    }

    const queue = [payload];

    while (queue.length > 0) {
      const current = queue.shift();

      if (!current) {
        continue;
      }

      if (Array.isArray(current)) {
        for (const item of current) {
          queue.push(item);
        }
        continue;
      }

      if (typeof current === "object") {
        for (const key of keys) {
          if (current[key] !== undefined && current[key] !== null && current[key] !== "") {
            return current[key];
          }
        }

        for (const value of Object.values(current)) {
          if (value && (typeof value === "object" || Array.isArray(value))) {
            queue.push(value);
          }
        }
      }
    }

    return null;
  }

  detectBusinessFailure(payload) {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const failureStatuses = [false, "false", 0, "0", "failed", "error"];
    const statusValue = payload.status;
    const successValue = payload.success;

    if (
      failureStatuses.includes(statusValue) ||
      successValue === false ||
      payload.error ||
      payload.errors
    ) {
      return (
        this.extractFirstByKeys(payload, ["message", "error", "errors"]) ||
        "Shiprocket operation failed"
      );
    }

    if (typeof payload.status_code === "number" && payload.status_code >= 400) {
      return (
        this.extractFirstByKeys(payload, ["message", "error"]) ||
        "Shiprocket operation failed"
      );
    }

    return null;
  }

  /**
   * Check serviceability and get shipping rates
   * @param {Object} params - { pickup_postcode, delivery_postcode, weight, cod, declared_value }
   */
  async getShippingRates(params) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseURL}/courier/serviceability/`,
        {
          headers,
          params: {
            pickup_postcode: params.pickup_postcode,
            delivery_postcode: params.delivery_postcode,
            weight: params.weight || 0.5,
            cod: params.cod || 0,
            declared_value: params.declared_value || 0,
          },
        },
      );

      return response.data;
    } catch (error) {
      log.error(
        "❌ Get shipping rates failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to fetch shipping rates",
        "SHIPROCKET_RATES_ERROR",
      );
    }
  }

  /**
   * Create order in Shiprocket
   * @param {Object} orderData - Order details
   */
  async createOrder(orderData) {
    try {
      const headers = await this.getHeaders();

      const payload = {
        order_id: orderData.order_id,
        order_date:
          orderData.order_date || new Date().toISOString().split("T")[0],
        pickup_location: orderData.pickup_location || "Primary",
        channel_id: "", // Leave empty for API orders
        comment: orderData.comment || "",
        billing_customer_name: orderData.billing_customer_name,
        billing_last_name: orderData.billing_last_name || "",
        billing_address: orderData.billing_address,
        billing_address_2: orderData.billing_address_2 || "",
        billing_city: orderData.billing_city,
        billing_pincode: orderData.billing_pincode,
        billing_state: orderData.billing_state,
        billing_country: orderData.billing_country || "India",
        billing_email: orderData.billing_email,
        billing_phone: orderData.billing_phone,
        shipping_is_billing: orderData.shipping_is_billing !== false,
        shipping_customer_name:
          orderData.shipping_customer_name || orderData.billing_customer_name,
        shipping_last_name:
          orderData.shipping_last_name || orderData.billing_last_name || "",
        shipping_address:
          orderData.shipping_address || orderData.billing_address,
        shipping_address_2:
          orderData.shipping_address_2 || orderData.billing_address_2 || "",
        shipping_city: orderData.shipping_city || orderData.billing_city,
        shipping_pincode:
          orderData.shipping_pincode || orderData.billing_pincode,
        shipping_country:
          orderData.shipping_country || orderData.billing_country || "India",
        shipping_state: orderData.shipping_state || orderData.billing_state,
        shipping_email: orderData.shipping_email || orderData.billing_email,
        shipping_phone: orderData.shipping_phone || orderData.billing_phone,
        order_items: orderData.order_items,
        payment_method: orderData.payment_method || "Prepaid",
        shipping_charges: orderData.shipping_charges || 0,
        giftwrap_charges: orderData.giftwrap_charges || 0,
        transaction_charges: orderData.transaction_charges || 0,
        total_discount: orderData.total_discount || 0,
        sub_total: orderData.sub_total,
        length: orderData.length || 10,
        breadth: orderData.breadth || 10,
        height: orderData.height || 10,
        weight: orderData.weight || 0.5,
      };

      const response = await axios.post(
        `${this.baseURL}/orders/create/adhoc`,
        payload,
        { headers },
      );

      const businessFailure = this.detectBusinessFailure(response.data);
      if (businessFailure) {
        throw this.buildShiprocketError(
          { response: { status: 422, data: response.data }, message: businessFailure },
          "Failed to create Shiprocket order",
          "SHIPROCKET_CREATE_ORDER_ERROR",
        );
      }

      log.info("✅ Shiprocket order created:", response.data);
      return response.data;
    } catch (error) {
      log.error(
        "❌ Create Shiprocket order failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to create Shiprocket order",
        "SHIPROCKET_CREATE_ORDER_ERROR",
      );
    }
  }

  /**
   * Assign AWB (Air Waybill) to shipment
   * @param {number|string} shipmentId
   * @param {number|string|null} courierId
   */
  async assignAWB(shipmentId, courierId) {
    try {
      const headers = await this.getHeaders();

      const payload = {
        shipment_id: [shipmentId],
      };

      if (courierId !== undefined && courierId !== null && courierId !== "") {
        payload.courier_id = courierId;
      }

      const response = await axios.post(
        `${this.baseURL}/courier/assign/awb`,
        payload,
        { headers },
      );

      const businessFailure = this.detectBusinessFailure(response.data);
      if (businessFailure) {
        throw this.buildShiprocketError(
          { response: { status: 422, data: response.data }, message: businessFailure },
          "Failed to assign AWB",
          "SHIPROCKET_ASSIGN_AWB_ERROR",
        );
      }

      log.info("✅ AWB assigned successfully:", response.data);

      return {
        awb_code: this.extractFirstByKeys(response.data, ["awb_code", "awb"]),
        courier_name: this.extractFirstByKeys(response.data, [
          "courier_name",
          "courier_company_name",
        ]),
      };
    } catch (error) {
      log.error(
        "❌ Assign AWB failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to assign AWB",
        "SHIPROCKET_ASSIGN_AWB_ERROR",
      );
    }
  }

  /**
   * Schedule pickup for shipment
   * @param {Object} params - { shipment_id, pickup_date }
   */
  async schedulePickup(shipmentId, pickupDate = null) {
    try {
      const headers = await this.getHeaders();

      // If no pickup date provided, use tomorrow
      if (!pickupDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        pickupDate = tomorrow.toISOString().split("T")[0];
      }

      const response = await axios.post(
        `${this.baseURL}/courier/generate/pickup`,
        {
          shipment_id: [shipmentId],
          pickup_date: pickupDate,
        },
        { headers },
      );

      const businessFailure = this.detectBusinessFailure(response.data);
      if (businessFailure) {
        throw this.buildShiprocketError(
          { response: { status: 422, data: response.data }, message: businessFailure },
          "Failed to schedule pickup",
          "SHIPROCKET_SCHEDULE_PICKUP_ERROR",
        );
      }

      log.info("✅ Pickup scheduled successfully:", response.data);
      return response.data;
    } catch (error) {
      log.error(
        "❌ Schedule pickup failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to schedule pickup",
        "SHIPROCKET_SCHEDULE_PICKUP_ERROR",
      );
    }
  }

  /**
   * Generate shipping label
   * @param {Array} shipmentIds - Array of shipment IDs
   */
  async generateLabel(shipmentIds) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseURL}/courier/generate/label`,
        {
          shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds],
        },
        { headers },
      );

      const businessFailure = this.detectBusinessFailure(response.data);
      if (businessFailure) {
        throw this.buildShiprocketError(
          { response: { status: 422, data: response.data }, message: businessFailure },
          "Failed to generate label",
          "SHIPROCKET_GENERATE_LABEL_ERROR",
        );
      }

      log.info("✅ Label generated successfully");
      return response.data;
    } catch (error) {
      log.error(
        "❌ Generate label failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to generate label",
        "SHIPROCKET_GENERATE_LABEL_ERROR",
      );
    }
  }

  /**
   * Generate manifest
   * @param {Array} shipmentIds - Array of shipment IDs
   */
  async generateManifest(shipmentIds) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseURL}/manifests/generate`,
        {
          shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds],
        },
        { headers },
      );

      const businessFailure = this.detectBusinessFailure(response.data);
      if (businessFailure) {
        throw this.buildShiprocketError(
          { response: { status: 422, data: response.data }, message: businessFailure },
          "Failed to generate manifest",
          "SHIPROCKET_MANIFEST_GENERATE_ERROR",
        );
      }

      log.info("✅ Manifest generated successfully");
      return response.data;
    } catch (error) {
      log.error(
        "❌ Generate manifest failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to generate manifest",
        "SHIPROCKET_MANIFEST_GENERATE_ERROR",
      );
    }
  }

  /**
   * Print manifest
   * @param {Array} orderIds - Array of Shiprocket order IDs
   */
  async printManifest(orderIds) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseURL}/manifests/print`,
        {
          order_ids: Array.isArray(orderIds) ? orderIds : [orderIds],
        },
        { headers },
      );

      const businessFailure = this.detectBusinessFailure(response.data);
      if (businessFailure) {
        throw this.buildShiprocketError(
          { response: { status: 422, data: response.data }, message: businessFailure },
          "Failed to print manifest",
          "SHIPROCKET_MANIFEST_PRINT_ERROR",
        );
      }

      log.info("✅ Manifest print URL generated");
      return response.data;
    } catch (error) {
      log.error(
        "❌ Print manifest failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to print manifest",
        "SHIPROCKET_MANIFEST_PRINT_ERROR",
      );
    }
  }

  /**
   * Generate invoice PDF URL
   * @param {Array} orderIds - Array of Shiprocket order IDs
   */
  async generateInvoice(orderIds) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseURL}/orders/print/invoice`,
        {
          ids: Array.isArray(orderIds) ? orderIds : [orderIds],
        },
        { headers },
      );

      const businessFailure = this.detectBusinessFailure(response.data);
      if (businessFailure) {
        throw this.buildShiprocketError(
          { response: { status: 422, data: response.data }, message: businessFailure },
          "Failed to generate invoice",
          "SHIPROCKET_INVOICE_GENERATE_ERROR",
        );
      }

      log.info("✅ Invoice URL generated");
      return response.data;
    } catch (error) {
      log.error(
        "❌ Generate invoice failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to generate invoice",
        "SHIPROCKET_INVOICE_GENERATE_ERROR",
      );
    }
  }

  /**
   * Track shipment by AWB
   * @param {String} awb - AWB number
   */
  async trackByAWB(awb) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.get(
        `${this.baseURL}/courier/track/awb/${awb}`,
        { headers },
      );

      return response.data;
    } catch (error) {
      log.error(
        "❌ Track by AWB failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to track shipment by AWB",
        "SHIPROCKET_TRACK_AWB_ERROR",
      );
    }
  }

  /**
   * Track shipment by Shiprocket Order ID
   * @param {String} orderId - Shiprocket order ID
   */
  async trackByOrderId(orderId) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.get(`${this.baseURL}/courier/track`, {
        headers,
        params: { order_id: orderId },
      });

      return response.data;
    } catch (error) {
      log.error(
        "❌ Track by order ID failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to track shipment by order ID",
        "SHIPROCKET_TRACK_ORDER_ERROR",
      );
    }
  }

  /**
   * Track shipment by shipment ID
   * @param {String|Number} shipmentId - Shiprocket shipment ID
   */
  async trackByShipmentId(shipmentId) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.get(
        `${this.baseURL}/courier/track/shipment/${shipmentId}`,
        { headers },
      );

      return response.data;
    } catch (error) {
      log.error(
        "❌ Track by shipment ID failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to track shipment by shipment ID",
        "SHIPROCKET_TRACK_SHIPMENT_ERROR",
      );
    }
  }

  /**
   * Cancel shipment
   * @param {Array} awbs - Array of AWB numbers
   */
  async cancelShipment(awbs) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseURL}/orders/cancel/shipment/awbs`,
        {
          awbs: Array.isArray(awbs) ? awbs : [awbs],
        },
        { headers },
      );

      const businessFailure = this.detectBusinessFailure(response.data);
      if (businessFailure) {
        throw this.buildShiprocketError(
          { response: { status: 422, data: response.data }, message: businessFailure },
          "Failed to cancel shipment",
          "SHIPROCKET_CANCEL_SHIPMENT_ERROR",
        );
      }

      log.info("✅ Shipment cancelled successfully");
      return response.data;
    } catch (error) {
      log.error(
        "❌ Cancel shipment failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to cancel shipment",
        "SHIPROCKET_CANCEL_SHIPMENT_ERROR",
      );
    }
  }

  /**
   * Get pickup addresses
   */
  async getPickupAddresses() {
    try {
      const headers = await this.getHeaders();

      const response = await axios.get(
        `${this.baseURL}/settings/company/pickup`,
        { headers },
      );

      return response.data;
    } catch (error) {
      log.error(
        "❌ Get pickup addresses failed:",
        error.response?.data || error.message,
      );

      if (error.code === "SHIPROCKET_CONFIG_ERROR") {
        throw error;
      }

      if (error.response) {
        const pickupError = new Error(
          error.response?.data?.message || "Failed to fetch pickup addresses",
        );
        pickupError.statusCode = error.response.status;
        pickupError.code = "SHIPROCKET_PICKUP_FETCH_ERROR";
        pickupError.details = error.response.data;
        throw pickupError;
      }

      throw error;
    }
  }

  /**
   * Complete shipping workflow: Create order -> Assign AWB -> Schedule Pickup -> Generate Label
   * @param {Object} orderData - Order details
   * @param {Number} courierId - Selected courier ID (optional, will use recommended if not provided)
   */
  async createCompleteShipment(orderData, courierId = null) {
    try {
      const warnings = [];

      // Step 1: Create order in Shiprocket
      const orderResponse = await this.createOrder(orderData);

      const shiprocketOrderId = this.extractFirstByKeys(orderResponse, [
        "order_id",
      ]);
      const shipmentId = this.extractFirstByKeys(orderResponse, [
        "shipment_id",
      ]);

      if (!shiprocketOrderId || !shipmentId) {
        throw this.buildShiprocketError(
          new Error("Shiprocket order/shipment id missing in response"),
          "Failed to create Shiprocket order",
          "SHIPROCKET_CREATE_ORDER_ERROR",
        );
      }

      // Step 2: Get recommended courier if not provided
      let estimatedDeliveryDays = null;
      if (!courierId) {
        const rates = await this.getShippingRates({
          pickup_postcode: orderData.billing_pincode,
          delivery_postcode:
            orderData.shipping_pincode || orderData.billing_pincode,
          weight: orderData.weight || 0.5,
          cod: orderData.payment_method === "COD" ? 1 : 0,
          declared_value: orderData.sub_total,
        });

        const availableCouriers =
          rates?.available_courier_companies ||
          rates?.data?.available_courier_companies ||
          [];

        if (availableCouriers.length > 0) {
          // Use the first recommended courier
          const selectedCourier = availableCouriers[0];
          courierId = selectedCourier.courier_company_id;
          estimatedDeliveryDays = selectedCourier.estimated_delivery_days || null;
        } else {
          throw this.buildShiprocketError(
            { response: { status: 422, data: rates }, message: "No courier available for this shipment" },
            "No courier available for this shipment",
            "SHIPROCKET_NO_COURIER_AVAILABLE",
          );
        }
      }

      // Step 3: Assign AWB
      const awbResponse = await this.assignAWB(shipmentId, courierId);

      let awbCode = this.extractFirstByKeys(awbResponse, [
        "awb_code",
        "awb",
      ]);
      let courierName = this.extractFirstByKeys(awbResponse, [
        "courier_name",
        "courier_company_name",
      ]);

      if (!awbCode) {
        try {
          const trackingResponse = await this.trackByShipmentId(shipmentId);
          awbCode = this.extractFirstByKeys(trackingResponse, [
            "awb_code",
            "awb",
          ]);
          courierName =
            courierName ||
            this.extractFirstByKeys(trackingResponse, [
              "courier_name",
              "courier_company_name",
            ]);
        } catch (trackingError) {
          warnings.push({
            step: "track_by_shipment_fallback",
            code: trackingError.code,
            message: trackingError.message,
            details:
              trackingError.details ||
              trackingError.response?.data ||
              trackingError.message,
          });
        }
      }

      if (!awbCode) {
        warnings.push({
          step: "assign_awb",
          code: "SHIPROCKET_AWB_MISSING",
          message: "AWB code missing in assign AWB response",
          details: {
            assign_awb_response: awbResponse,
            shipment_id: shipmentId,
          },
        });
      }

      // Step 4: Schedule pickup
      try {
        await this.schedulePickup(shipmentId);
      } catch (error) {
        warnings.push({
          step: "schedule_pickup",
          code: error.code,
          message: error.message,
          details: error.details || error.response?.data || error.message,
        });
      }

      // Step 5: Generate label
      let labelUrl = null;
      try {
        const labelResponse = await this.generateLabel([shipmentId]);
        labelUrl =
          labelResponse?.label_url ||
          labelResponse?.data?.label_url ||
          labelResponse?.response?.label_url ||
          null;
      } catch (error) {
        warnings.push({
          step: "generate_label",
          code: error.code,
          message: error.message,
          details: error.details || error.response?.data || error.message,
        });
      }

      // Step 6: Generate invoice
      let invoiceUrl = null;
      try {
        const invoiceResponse = await this.generateInvoice([shiprocketOrderId]);
        invoiceUrl =
          invoiceResponse?.invoice_url ||
          invoiceResponse?.data?.invoice_url ||
          invoiceResponse?.response?.invoice_url ||
          null;
      } catch (error) {
        warnings.push({
          step: "generate_invoice",
          code: error.code,
          message: error.message,
          details: error.details || error.response?.data || error.message,
        });
      }

      return {
        success: true,
        shiprocket_order_id: shiprocketOrderId,
        shipment_id: shipmentId,
        awb_code: awbCode,
        courier_name: courierName,
        courier_id: courierId,
        estimated_delivery_days: estimatedDeliveryDays,
        label_url: labelUrl,
        invoice_url: invoiceUrl,
        warnings,
      };
    } catch (error) {
      log.error(
        "❌ Complete shipment creation failed:",
        error.response?.data || error.message,
      );
      throw this.buildShiprocketError(
        error,
        "Failed to create complete shipment",
        "SHIPROCKET_CREATE_SHIPMENT_ERROR",
      );
    }
  }
}

// Export singleton instance
module.exports = new ShiprocketService();
