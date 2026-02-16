const axios = require("axios");

class ShiprocketService {
  constructor() {
    this.baseURL = "https://apiv2.shiprocket.in/v1/external";
    this.email = process.env.SHIPROCKET_EMAIL;
    this.password = process.env.SHIPROCKET_PASSWORD;
    this.token = null;
    this.tokenExpiry = null;
    
    if (!this.email || !this.password) {
      console.warn("⚠️ Shiprocket credentials (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) are missing.");
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
      // Check if token is still valid
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

      console.log("✅ Shiprocket authenticated successfully");
      return this.token;
    } catch (error) {
      console.error(
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
      console.error(
        "❌ Get shipping rates failed:",
        error.response?.data || error.message,
      );
      throw error;
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

      console.log("✅ Shiprocket order created:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Create Shiprocket order failed:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  /**
   * Assign AWB (Air Waybill) to shipment
   * @param {Object} params - { shipment_id, courier_id }
   */
  async assignAWB(shipmentId, courierId) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseURL}/courier/assign/awb`,
        {
          shipment_id: shipmentId,
          courier_id: courierId,
        },
        { headers },
      );

      console.log("✅ AWB assigned successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Assign AWB failed:",
        error.response?.data || error.message,
      );
      throw error;
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

      console.log("✅ Pickup scheduled successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Schedule pickup failed:",
        error.response?.data || error.message,
      );
      throw error;
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

      console.log("✅ Label generated successfully");
      return response.data;
    } catch (error) {
      console.error(
        "❌ Generate label failed:",
        error.response?.data || error.message,
      );
      throw error;
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

      console.log("✅ Manifest generated successfully");
      return response.data;
    } catch (error) {
      console.error(
        "❌ Generate manifest failed:",
        error.response?.data || error.message,
      );
      throw error;
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

      console.log("✅ Manifest print URL generated");
      return response.data;
    } catch (error) {
      console.error(
        "❌ Print manifest failed:",
        error.response?.data || error.message,
      );
      throw error;
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
      console.error(
        "❌ Track by AWB failed:",
        error.response?.data || error.message,
      );
      throw error;
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
      console.error(
        "❌ Track by order ID failed:",
        error.response?.data || error.message,
      );
      throw error;
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

      console.log("✅ Shipment cancelled successfully");
      return response.data;
    } catch (error) {
      console.error(
        "❌ Cancel shipment failed:",
        error.response?.data || error.message,
      );
      throw error;
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
      console.error(
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
      // Step 1: Create order in Shiprocket
      const orderResponse = await this.createOrder(orderData);

      if (!orderResponse.order_id || !orderResponse.shipment_id) {
        throw new Error("Failed to create Shiprocket order");
      }

      const shiprocketOrderId = orderResponse.order_id;
      const shipmentId = orderResponse.shipment_id;

      // Step 2: Get recommended courier if not provided
      if (!courierId) {
        const rates = await this.getShippingRates({
          pickup_postcode: orderData.billing_pincode,
          delivery_postcode:
            orderData.shipping_pincode || orderData.billing_pincode,
          weight: orderData.weight || 0.5,
          cod: orderData.payment_method === "COD" ? 1 : 0,
          declared_value: orderData.sub_total,
        });

        if (rates.data?.available_courier_companies?.length > 0) {
          // Use the first recommended courier
          courierId =
            rates.data.available_courier_companies[0].courier_company_id;
        } else {
          throw new Error("No courier available for this shipment");
        }
      }

      // Step 3: Assign AWB
      const awbResponse = await this.assignAWB(shipmentId, courierId);

      const awbCode = awbResponse.response?.data?.awb_code;
      const courierName = awbResponse.response?.data?.courier_name;

      // Step 4: Schedule pickup
      await this.schedulePickup(shipmentId);

      // Step 5: Generate label
      const labelResponse = await this.generateLabel([shipmentId]);

      return {
        success: true,
        shiprocket_order_id: shiprocketOrderId,
        shipment_id: shipmentId,
        awb_code: awbCode,
        courier_name: courierName,
        label_url: labelResponse.label_url,
      };
    } catch (error) {
      console.error(
        "❌ Complete shipment creation failed:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ShiprocketService();
