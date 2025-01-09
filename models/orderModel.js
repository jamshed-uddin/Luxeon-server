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
      enum: ["shipped", "delivered", "cancelled"],
      default: "shipped",
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

orderSchema.pre("findOneAndDelete", async function (next) {
  try {
    const order = await this.model.findOne(this.getFilter());

    if (order && order.items && order.items.length > 0) {
      await mongoose
        .model("OrderItem")
        .deleteMany({ _id: { $in: order.items } });
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.models?.Order || mongoose.model("Order", orderSchema);
