const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductBySlug,
  getCategories,
} = require("../controllers/productController");

router.get("/", getAllProducts);
router.get("/categories", getCategories);
router.get("/:slug", getProductBySlug);

module.exports = router;
