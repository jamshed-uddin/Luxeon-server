const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
} = require("../controllers/cartControllers");
const { verifyAuth } = require("../middlewares/verifyMids");
const router = express.Router();

router.get("/", verifyAuth, getCart);
router.post("/", verifyAuth, addToCart);
router.patch("/:id", updateCartItem);

module.exports = router;
