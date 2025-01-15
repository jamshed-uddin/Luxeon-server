const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    user: {
      name: { type: String, required: [true, "User name is required"] },
      email: { type: String, required: [true, "User email is required"] },
    },
    address: {
      name: { type: String, default: "" },
      phoneNumber: { type: Number },
      country: { type: String, default: "" },
      city: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      addressLine: { type: String, default: "" },
      street: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["processing", "delivered", "cancelled"],
      default: "processing",
    },
    totalPrice: { type: Number, required: [true, "Total price is required"] },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models?.Order || mongoose.model("Order", orderSchema);
