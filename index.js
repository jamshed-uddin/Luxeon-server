const express = require("express");
require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/connectDB");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const cartRouter = require("./routes/cartRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const orderRouter = require("./routes/orderRoutes");
const dashboardRoute = require("./routes/dashboardRoutes");
const configCloudinary = require("./config/cloudinaryConfig");
const port = process.env.PORT || 8000;
const app = express();
app.use(cookieParser());
const corsOptions = {
  origin: ["https://luxeon.vercel.app", "http://localhost:3000"],
  credentials: true,
};
app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

app.use("/api/orders/create/webhook", bodyParser.raw({ type: "*/*" }));
// app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();
configCloudinary();

app.get("/", async (req, res) => {
  res.send("Welcome to Luxeon server");
});

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/orders", orderRouter);
app.use("/api/dashboard", dashboardRoute);

app.use(errorHandler);
app.use(notFound);

app.listen(port, () => {
  console.log("Server is running on " + port);
});
