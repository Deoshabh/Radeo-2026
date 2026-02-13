const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");

const { authenticate: auth } = require("../middleware/auth");

// All cart routes require authentication
router.get("/", auth, cartController.getCart);
router.get("/validate", auth, cartController.validateCart);
router.post("/", auth, cartController.addToCart);
router.delete("/", auth, cartController.clearCart);
router.delete("/:productId/:size", auth, cartController.removeFromCart);
router.put("/items", auth, cartController.updateCartItemQuantity);

module.exports = router;
