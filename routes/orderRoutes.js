const express = require("express");
const {
  createOrder,
  getOrders,
  getSingleOrder,
  getUsersOrders,
  getAllOrders,
} = require("../controllers/orderController");
const router = express.Router();

router.post("/create/webhook", createOrder);
router.get("/", getAllOrders);
router.get("/usersOrders", getUsersOrders);
router.get("/:orderId", getSingleOrder);

module.exports = router;
