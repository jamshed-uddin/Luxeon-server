const Orders = require("../models/orderModel");
const Products = require("../models/productModel");
const Payments = require("../models/paymentModel");

const getTopMetrics = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();

    const aggStages = (getDataOf = "month", year) => {
      const currentYearStart = new Date(`${year}-01-01T00:00:00Z`);
      const nextYearStart = new Date(`${year + 1}-01-01T00:00:00Z`);

      const currentMonthIndex = new Date().getMonth() + 1;
      const currentYearIndex = new Date().getFullYear();

      const stages = [
        {
          $match: {
            createdAt: {
              $gte: currentYearStart,
              $lt: nextYearStart,
            },
          },
        },
        {
          $addFields: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
        },
        {
          $group: {
            _id: getDataOf === "month" ? "$month" : "$year",
            totalRevenue: {
              $sum: "$totalPrice",
            },
            totalOrder: {
              $sum: 1,
            },
          },
        },
        {
          $match: {
            _id: getDataOf === "month" ? currentMonthIndex : currentYearIndex,
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ];

      if (getDataOf === "year") {
        stages.shift();
      }

      return stages;
    };

    const stagesForProductData = [
      {
        $group: {
          _id: 1,
          totalProduct: {
            $sum: 1,
          },
          lowOnStock: {
            $sum: {
              $cond: [{ $lte: ["$stock", 5] }, 1, 0],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          totalProduct: 1,
          lowOnStock: 1,
        },
      },
    ];

    // group by month to get monthly sales and order count
    const montlyData = await Orders.aggregate(aggStages("month", currentYear));
    // group by year to get yearly sales and order count
    const yearlyData = await Orders.aggregate(aggStages("year"));
    // get total product count and product which stock is less than or equal 5
    const products = await Products.aggregate(stagesForProductData);

    const response = {
      salesAndOrders: {
        thisMonth: { ...montlyData[0] },
        thisYear: { ...yearlyData[0] },
      },
      productsData: { ...products[0] },
    };
    res.send(response);
    //
  } catch (error) {
    next(error);
  }
};

const getChartData = async (req, res, next) => {
  try {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 5);

    const dbData = await Orders.aggregate([
      {
        $match: {
          createdAt: { $gte: oneYearAgo, $lt: now },
        },
      },
      {
        $addFields: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          Revenue: { $sum: "$totalPrice" },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id.month",
          month: "$_id.month",
          year: "$_id.year",
          Revenue: { $divide: ["$Revenue", 100] },
        },
      },
      {
        $sort: {
          month: 1,
        },
      },
    ]);

    const getLastMonthOfAYear = () => {
      const months = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i);

        months.push({
          name: date.toLocaleString("default", { month: "short" }),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          Revenue: 0,
        });
      }

      return months;
    };

    const mergeMissingMonth = () => {
      const allMonths = getLastMonthOfAYear();
      return allMonths.map((month) => {
        const match = dbData.find(
          (data) => data.month === month.month && data.year === month.year
        );

        return match ? { ...month, Revenue: match.Revenue } : month;
      });
    };

    const chartData = mergeMissingMonth();

    res.status(200).send(chartData);
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getTopMetrics,
  getChartData,
};
