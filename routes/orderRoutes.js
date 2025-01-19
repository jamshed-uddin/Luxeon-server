const express = require("express");
const {
  createOrder,
  getOrders,
  getSingleOrder,
} = require("../controllers/orderController");
const router = express.Router();

router.post("/create/webhook", createOrder);
router.get("/", getOrders);
router.get("/:orderId", getSingleOrder);

module.exports = router;
