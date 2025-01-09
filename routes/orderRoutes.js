const express = require("express");
const { createOrder } = require("../controllers/orderController");
const router = express.Router();
const bodyParser = require("body-parser");

router.post("/create/webhook", createOrder);

module.exports = router;
