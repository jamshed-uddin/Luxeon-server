const mongoose = require("mongoose");
const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: "customer" },
    adddress: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
