const express = require("express");
const router = express.Router();
const { getPincodeDetails } = require("../controllers/pincodeController");

// Public route — no auth needed
router.get("/pincode/:pin", getPincodeDetails);

module.exports = router;
