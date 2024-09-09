const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
} = require("../controllers/cartControllers");
const router = express.Router();

router.get("/", getCart);
router.post("/", addToCart);
router.patch("/:id", updateCartItem);

module.exports = router;
