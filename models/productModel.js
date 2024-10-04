const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"] },
    photoUrl: [{ type: String, required: [true, "PhotoUrl is required"] }],
    description: { type: String },
    price: { type: Number, required: [true, "Price is required"] },
    category: { type: String, required: [true, "Category is required"] },
    inStock: { type: Number, required: [true, "In stock is required"] },
    details: [{ title: { type: String }, value: { type: String } }],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
