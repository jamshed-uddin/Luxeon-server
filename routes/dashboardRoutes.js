const express = require("express");
const {
  getTopMetrics,
  getChartData,
} = require("../controllers/dashboardController");
const router = express.Router();

router.get("/topmetrics", getTopMetrics);
router.get("/chartdata", getChartData);

module.exports = router;
