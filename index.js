const express = require("express");
require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/connectDB");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const cartRouter = require("./routes/cartRoutes");
const port = process.env.PORT || 8000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.get("/", async (req, res) => {
  res.send("Welcome to Luxeon server");
});

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log("Server is running on " + port);
});
