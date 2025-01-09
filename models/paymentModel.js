const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Card", "PayPal", "Bank Transfer", "Cash"],
      default: "Card",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    transactionId: {
      type: String,
      unique: true, // Ensure no duplicate transactions
      required: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models?.Payment || mongoose.model("Payment", paymentSchema);
