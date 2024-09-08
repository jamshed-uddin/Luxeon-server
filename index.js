const express = require("express");
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.send("Welcome to Luxeon server");
});

app.listen(port, () => {
  console.log("Server is running on " + port);
});
