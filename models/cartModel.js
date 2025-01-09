const mongoose = require("mongoose");

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CartItem",
      },
    ],
  },
  { timestamps: true }
);

// cartSchema.pre("findOneAndDelete", async function (next) {
//   try {
//     const cart = await this.model.findOne(this.getFilter());

//     if (cart && cart.items && cart.items.length > 0) {
//       await mongoose.model("CartItem").deleteMany({ _id: { $in: cart.items } });
//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = mongoose.models?.Cart || mongoose.model("Cart", cartSchema);
