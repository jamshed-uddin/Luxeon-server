const express = require("express");
const router = express.Router();

router.get("/topmetrics", getTopMetrics);
router.get("/chartdata", getChartData);

module.exports = router;
