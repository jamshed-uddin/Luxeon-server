const express = require("express");
const {
  addToCart,
  updateCartItem,
  getUserCart,
} = require("../controllers/cartControllers");

const router = express.Router();

router.get("/:id", getUserCart);
router.post("/", addToCart);
router.patch("/:id", updateCartItem);

module.exports = router;
