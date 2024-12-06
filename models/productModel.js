const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"] },
    photoUrl: [
      {
        url: { type: String, required: [true, "PhotoUrl is required"] },
        publicId: { type: String },
      },
    ],
    description: { type: String },
    price: { type: Number, required: [true, "Price is required"] },
    category: { type: String, required: [true, "Category is required"] },
    stock: { type: Number, required: [true, "Stock is required"] },
    details: [{ title: { type: String }, value: { type: String } }],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
