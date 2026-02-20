const axios = require("axios");
const { getOrSetCache } = require("../utils/cache");
const { log } = require("../utils/logger");

// ──────────────────────────────────────────────
// GET /api/v1/address/pincode/:pin
// Returns city and state for an Indian pincode
// Uses the free India Post API (api.postalpincode.in)
// ──────────────────────────────────────────────
exports.getPincodeDetails = async (req, res) => {
  try {
    const { pin } = req.params;

    // Validate 6-digit pincode
    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format. Must be 6 digits.",
      });
    }

    // Cache pincode lookups for 7 days (they rarely change)
    const cacheKey = `pincode:${pin}`;

    const data = await getOrSetCache(cacheKey, async () => {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${pin}`,
        { timeout: 5000 },
      );

      const result = response.data;

      if (
        !result ||
        !Array.isArray(result) ||
        result[0]?.Status !== "Success" ||
        !result[0]?.PostOffice?.length
      ) {
        return null; // Will not be cached (null)
      }

      const postOffice = result[0].PostOffice[0];

      return {
        pincode: pin,
        city: postOffice.District,
        state: postOffice.State,
        country: postOffice.Country,
        postOffices: result[0].PostOffice.map((po) => ({
          name: po.Name,
          type: po.BranchType,
          deliveryStatus: po.DeliveryStatus,
          district: po.District,
          division: po.Division,
          region: po.Region,
          state: po.State,
        })),
      };
    }, 604800); // 7 days TTL

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No data found for this pincode",
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    log.error("getPincodeDetails error:", error);
    res.status(500).json({ success: false, message: "Failed to lookup pincode" });
  }
};
