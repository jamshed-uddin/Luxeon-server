const mongoose = require("mongoose");

const cartItemSchema = mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: [true, "Cart id is required"],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product id is required"],
    },
    quantity: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models?.CartItem || mongoose.model("CartItem", cartItemSchema);
