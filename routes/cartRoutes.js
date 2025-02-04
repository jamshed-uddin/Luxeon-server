const express = require("express");
const {
  addToCart,
  updateCartItem,
  getUserCart,
  mergeAnonymousCart,
} = require("../controllers/cartControllers");

const router = express.Router();

router.get("/", getUserCart);
router.post("/", addToCart);
router.put("/:id", updateCartItem);
router.post("/merge", mergeAnonymousCart);

module.exports = router;
