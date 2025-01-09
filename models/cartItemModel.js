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

cartItemSchema.post("save", async function (doc, next) {
  try {
    if (this.cartId) {
      await mongoose.model("Cart").findByIdAndUpdate(this.cartId, {
        $addToSet: { items: this._id },
      });
    }
  } catch (error) {
    next(error);
  }
});

cartItemSchema.pre(
  "deleteOne",
  { document: false, query: true },
  async function (next) {
    try {
      if (this.cartId) {
        await mongoose.model("Cart").findByIdAndUpdate(this.cartId, {
          $pull: { items: this._id },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  }
);

module.exports =
  mongoose.models?.CartItem || mongoose.model("CartItem", cartItemSchema);
