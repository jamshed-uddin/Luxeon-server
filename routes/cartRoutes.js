const express = require("express");
const {
  addToCart,
  updateCartItem,
  getUserCart,
} = require("../controllers/cartControllers");
const { verifyAuth } = require("../middlewares/verifyMids");
const router = express.Router();

router.get("/", getUserCart);
router.post("/", addToCart);
router.patch("/:id", updateCartItem);

module.exports = router;
