const mongoose = require("mongoose");

const OrderItemSchema = mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order id is required"],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product id is required"],
    },
    price: { type: Number, required: [true, "Product price is required"] },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required"],
    },
    subtotal: {
      type: Number,
      default: function () {
        return this.price * this.quantity;
      },
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models?.OrderItem || mongoose.model("OrderItem", OrderItemSchema);
