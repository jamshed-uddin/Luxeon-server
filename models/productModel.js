const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    photoUrl: [{ type: String, required: true }],
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    details: [{ title: { type: String }, value: { type: String } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
